import Foundation
import Dispatch
import Darwin
import ScreenCaptureKit
import AVFoundation
import CoreMedia
import CoreAudio

// MARK: - Logger

/// Centralizes the application's logging logic
struct Logger {
    enum Level: String {
        case info, warning, error, debug
    }
    
    static func log(_ message: String, level: Level = .info) {
        fputs("\(level.rawValue.uppercased()): \(message)\n", stderr)
    }
}

// MARK: - Signal Handling

// Global function for C signal handler
func cSignalHandler(signal: Int32) {
    SignalHandler.handleSignalGlobal(signal: signal)
}

/// Handles system signals like SIGINT (Ctrl+C)
class SignalHandler {
    private static var audioCapture: AudioCaptureServiceProtocol?
    
    static func register(captureService: AudioCaptureServiceProtocol) {
        audioCapture = captureService
        signal(SIGINT, cSignalHandler)
    }
    
    static func handleSignalGlobal(signal: Int32) {
        Logger.log("Stopping audio capture...", level: .info)
        Task { await audioCapture?.stop() }
    }
}

// MARK: - Audio Format Converter

/// Converts between different audio formats
struct AudioFormatConverter {
    /// Converts audio from non-interleaved to interleaved format
    /// - Parameters:
    ///   - data: Audio data in non-interleaved format
    ///   - bytesPerSample: Bytes per sample (e.g., 4 for 32-bit float)
    ///   - numChannels: Number of audio channels
    ///   - samplesPerChannel: Number of samples per channel
    /// - Returns: Data in interleaved format
    static func nonInterleavedToInterleaved(
        data: [UInt8], 
        bytesPerSample: Int, 
        numChannels: Int, 
        samplesPerChannel: Int
    ) -> [UInt8] {
        var interleavedBuffer = [UInt8](repeating: 0, count: data.count)
        
        for sampleIndex in 0..<samplesPerChannel {
            for channelIndex in 0..<numChannels {
                // Position in non-interleaved buffer
                let srcPos = (channelIndex * samplesPerChannel + sampleIndex) * bytesPerSample
                
                // Position in interleaved buffer
                let destPos = (sampleIndex * numChannels + channelIndex) * bytesPerSample
                
                // Copy bytesPerSample bytes
                for byteOffset in 0..<bytesPerSample {
                    interleavedBuffer[destPos + byteOffset] = data[srcPos + byteOffset]
                }
            }
        }
        
        return interleavedBuffer
    }
}

// MARK: - Audio Capture Protocols

/// Protocol that defines the audio capture service
protocol AudioCaptureServiceProtocol {
    func start() async throws
    func stop() async
}

/// Protocol for audio data processing
protocol AudioProcessorProtocol {
    func processSampleBuffer(_ sampleBuffer: CMSampleBuffer)
}

// MARK: - Audio Stream Output

/// Class that processes the audio stream output
class AudioStreamOutput: NSObject, SCStreamOutput {
    private let audioProcessor: AudioProcessorProtocol
    private var didOutputFormatInfo = false
    
    init(audioProcessor: AudioProcessorProtocol) {
        self.audioProcessor = audioProcessor
        super.init()
    }
    
    func stream(_ stream: SCStream, didOutputSampleBuffer sampleBuffer: CMSampleBuffer, of type: SCStreamOutputType) {
        guard type == .audio else { return }
        
        // Show audio format information
        if !didOutputFormatInfo, let formatDescription = CMSampleBufferGetFormatDescription(sampleBuffer) {
            if let basicDescription = CMAudioFormatDescriptionGetStreamBasicDescription(formatDescription) {
                logAudioFormat(basicDescription.pointee)
                didOutputFormatInfo = true
            }
        }
        
        // Process the audio buffer
        audioProcessor.processSampleBuffer(sampleBuffer)
    }
    
    private func logAudioFormat(_ format: AudioStreamBasicDescription) {
        let audioFormatDict: [String: Any] = [
            "sampleRate": format.mSampleRate,
            "channels": format.mChannelsPerFrame,
            "bitsPerChannel": format.mBitsPerChannel,
            "bytesPerFrame": format.mBytesPerFrame,
            "formatID": format.mFormatID,
            "formatFlags": format.mFormatFlags
        ]
        
        if let jsonData = try? JSONSerialization.data(withJSONObject: audioFormatDict),
        let jsonString = String(data: jsonData, encoding: .utf8) {
            Logger.log("Audio format details: \(jsonString)", level: .info)
        }
    }
}

// MARK: - Audio Processor

/// Processes captured audio data
class PCMAudioProcessor: AudioProcessorProtocol {
    private let outputStream: (Data) -> Void
    private let bytesPerSample = 4  // 32-bit float
    private let numChannels = 2     // Stereo
    
    init(outputStream: @escaping (Data) -> Void) {
        self.outputStream = outputStream
    }
    
    func processSampleBuffer(_ sampleBuffer: CMSampleBuffer) {
        guard let dataBuffer = CMSampleBufferGetDataBuffer(sampleBuffer) else { return }
        
        // Get buffer size
        let dataLength = CMBlockBufferGetDataLength(dataBuffer)
        guard dataLength > 0 else { return }
        
        // Allocate buffer for raw data
        var rawBuffer = [UInt8](repeating: 0, count: dataLength)
        
        // Copy data from CMBlockBuffer to our buffer
        var dataPointer: UnsafeMutablePointer<Int8>? = nil
        var lengthAtOffset = 0
        CMBlockBufferGetDataPointer(dataBuffer, atOffset: 0, 
                                    lengthAtOffsetOut: &lengthAtOffset,
                                    totalLengthOut: nil, 
                                    dataPointerOut: &dataPointer)
        
        if let pointer = dataPointer {
            // Copy data to buffer
            let bufferPointer = UnsafeMutableRawPointer(pointer)
            memcpy(&rawBuffer, bufferPointer, dataLength)
            
            // Convert from non-interleaved to interleaved
            let samplesPerChannel = dataLength / (bytesPerSample * numChannels)
            let interleavedBuffer = AudioFormatConverter.nonInterleavedToInterleaved(
                data: rawBuffer,
                bytesPerSample: bytesPerSample,
                numChannels: numChannels,
                samplesPerChannel: samplesPerChannel
            )
            
            // Write PCM data directly
            outputStream(Data(interleavedBuffer))
        }
    }
}

// MARK: - System Audio Capture Service

/// Main system audio capture service
class SystemAudioCapture: AudioCaptureServiceProtocol {
    private var streamOutput: SCStreamOutput?
    private var stream: SCStream?
    private var isRunning = false
    private let audioProcessor: AudioProcessorProtocol
    
    init(audioProcessor: AudioProcessorProtocol) {
        self.audioProcessor = audioProcessor
    }
    
    func start() async throws {
        guard !isRunning else {
            Logger.log("Capture is already running", level: .warning)
            return
        }
        
        do {
            // Get available content to capture
            let availableContent = try await SCShareableContent.current
            
            // Check if we have audio content
            guard !availableContent.displays.isEmpty else {
                Logger.log("No displays available for audio capture", level: .error)
                throw CaptureError.noDisplaysAvailable
            }
            
            // Use main display for audio capture
            let display = availableContent.displays[0]
            
            // Create filter for what we want to capture
            let filter = SCContentFilter(display: display, excludingApplications: [], exceptingWindows: [])
            
            // Configure stream settings
            let configuration = SCStreamConfiguration()
            configuration.capturesAudio = true
            configuration.excludesCurrentProcessAudio = true  // Don't capture our own audio
            
            // Create the stream
            stream = SCStream(filter: filter, configuration: configuration, delegate: nil)
            
            // Create stream output handler
            streamOutput = AudioStreamOutput(audioProcessor: audioProcessor)
            
            // Add output to stream with dispatch queue
            try stream?.addStreamOutput(streamOutput!, 
                                      type: .audio, 
                                      sampleHandlerQueue: DispatchQueue.global(qos: .userInteractive))
            
            // Start capture
            try await stream?.startCapture()
            isRunning = true
            
            Logger.log("System audio capture started", level: .info)
        } catch {
            Logger.log("Error starting audio capture: \(error.localizedDescription)", level: .error)
            throw error
        }
    }
    
    func stop() async {
        guard isRunning else { return }
        
        do {
            try await stream?.stopCapture()
            isRunning = false
            Logger.log("Audio capture stopped successfully", level: .info)
            exit(0)
        } catch {
            Logger.log("Error stopping capture: \(error.localizedDescription)", level: .error)
            exit(1)
        }
    }
    
    enum CaptureError: Error, LocalizedError {
        case noDisplaysAvailable
        
        var errorDescription: String? {
            switch self {
            case .noDisplaysAvailable:
                return "No displays available for capture"
            }
        }
    }
}

// MARK: - Main Program

// Function to handle captured PCM data (in this case, write to stdout)
func writeToStdout(_ data: Data) {
    // Write data directly to standard output
    FileHandle.standardOutput.write(data)
}

// Initial message
Logger.log("System Audio Recorder", level: .info)
Logger.log("You may need to grant Screen Recording permission in System Settings > Privacy & Security", level: .info)

// Configure audio processor
let audioProcessor = PCMAudioProcessor(outputStream: writeToStdout)

// Create and initialize audio capture service
let captureService = SystemAudioCapture(audioProcessor: audioProcessor)

// Register signal handler
SignalHandler.register(captureService: captureService)

Logger.log("Starting system audio capture...", level: .info)
Logger.log("Press Ctrl+C to stop recording", level: .info)

// Start in an async task and keep main thread alive
Task {
    do {
        try await captureService.start()
    } catch {
        Logger.log("Error: \(error.localizedDescription)", level: .error)
        exit(1)
    }
}

// Keep main thread alive until signal handler stops the program
dispatchMain()