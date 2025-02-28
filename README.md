markdown

# macOS System Audio Recorder

A Node.js library to record system audio on macOS using ScreenCaptureKit.

## Features

- Record system audio on macOS
- Get audio stream as raw PCM data
- Configure audio format details (channels, sample rate, etc.)
- Built with Swift and Node.js

## Installation

```bash
npm install macos-system-audio-recorder
```

## Requirements

- macOS operating system
- Node.js v14.16.0 or later
- Screen Recording permission enabled in System Settings > Privacy & Security

## Usage

```typescript
import { SystemAudioRecorder } from "macos-system-audio-recorder";

// Create recorder instance
const recorder = new SystemAudioRecorder();

// Start recording
recorder.start();

// Get audio format details
const audioDetails = await recorder.getAudioDetails();
console.log("Audio format:", audioDetails);

// Get audio stream
const stream = recorder.getStream();
stream.on("data", (data) => {
  // Handle raw PCM audio data
  console.log("Received audio data:", data.length, "bytes");
});

// Stop recording
recorder.stop();
```

## API Reference

### `SystemAudioRecorder`

Main class to handle system audio recording.

#### Methods

- `start()`: Start recording system audio
- `stop()`: Stop recording
- `getAudioDetails()`: Get audio format details
- `getStream()`: Get readable stream of raw PCM audio data

#### Audio Details

The `getAudioDetails()` method returns an object with:

```typescript
interface AudioDetails {
  channels: 1 | 2; // Number of audio channels
  bytesPerFrame: 4 | 8; // Bytes per audio frame
  bitsPerChannel: 16 | 32; // Bits per channel
  formatFlags: number; // Audio format flags
  sampleRate: 48000 | 44100 | 32000; // Sample rate in Hz
  formatID: number; // Audio format ID
}
```

## Error Handling

The library throws these custom errors:

- `SystemAudioRecorderError`: Base error class
- `SystemAudioRecorderNotStartedError`: When trying to access recorder before starting
- `SystemAudioRecorderSubprocessError`: When the Swift subprocess encounters an error

## Development

1. Clone the repository
2. Install dependencies: `npm install`
3. Build the Swift binary: `cd swift && ./build.sh`
4. Build TypeScript: `npm run build`
5. Run example: `npm run dev`

## License

MIT

## Contributing

Contributions welcome! Please read the contributing guidelines before submitting PRs.

## Credits

Developed by Victor Fernandez (@victor141516)
