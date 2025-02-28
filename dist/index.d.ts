import type { Readable } from "node:stream";
interface AudioDetails {
    channels: 1 | 2;
    bytesPerFrame: 4 | 8;
    bitsPerChannel: 16 | 32;
    formatFlags: number;
    sampleRate: 48000 | 44100 | 32000;
    formatID: number;
}
export declare class SystemAudioRecorder {
    private childProcess;
    private audioDetails;
    private stderrBuffer;
    private isStopped;
    private spawnChildProcess;
    private handleStderr;
    private handleError;
    start(): void;
    stop(): void;
    getAudioDetails(): Promise<AudioDetails>;
    getStream(): Readable;
}
export {};
