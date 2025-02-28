import type { ChildProcessByStdio } from "node:child_process";
import type { Readable } from "node:stream";

import { spawn } from "node:child_process";

const BINARY_PATH =
  process.env.SYSTEM_AUDIO_RECORDER_BINARY_PATH ??
  require.resolve("./bin/SystemAudioRecorder");

const AUDIO_DETAILS_START = "Audio format details: ";

class SystemAudioRecorderError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SystemAudioRecorderError";
  }
}

class SystemAudioRecorderNotStartedError extends SystemAudioRecorderError {
  constructor() {
    super("System Audio Recorder not started");
    this.name = "SystemAudioRecorderNotStartedError";
  }
}

class SystemAudioRecorderSubprocessError extends SystemAudioRecorderError {
  subprocessStderr: string;
  constructor(message: string, subprocessStderr: string) {
    super("System Audio Recorder subprocess error: " + message);
    this.name = "SystemAudioRecorderSubprocessError";
    this.subprocessStderr = subprocessStderr;
  }
}

interface AudioDetails {
  channels: 1 | 2;
  bytesPerFrame: 4 | 8;
  bitsPerChannel: 16 | 32;
  formatFlags: number;
  sampleRate: 48000 | 44100 | 32000;
  formatID: number;
}

export class SystemAudioRecorder {
  private childProcess: ChildProcessByStdio<null, Readable, Readable> | null =
    null;

  private audioDetails: Promise<AudioDetails> | null = null;
  private stderrBuffer = "";
  private isStopped = true;

  private spawnChildProcess() {
    const childProcess = spawn(BINARY_PATH, [], {
      stdio: ["inherit", "pipe", "pipe"],
    });
    this.childProcess = childProcess;
  }

  private handleStderr() {
    this.audioDetails = new Promise<AudioDetails>((resolve) => {
      if (!this.childProcess) throw new SystemAudioRecorderNotStartedError();

      let foundAudioDetails = false;
      this.childProcess.stderr.on("data", (data) => {
        this.stderrBuffer += data;
        if (foundAudioDetails) return;
        if (!this.stderrBuffer.includes(AUDIO_DETAILS_START)) return;

        const maybeAudioDetails =
          this.stderrBuffer.split(AUDIO_DETAILS_START)[1];
        if (!maybeAudioDetails.includes("\n")) return;

        const audioDetailsText = maybeAudioDetails.split("\n")[0];
        const audioDetails = JSON.parse(audioDetailsText) as AudioDetails;
        foundAudioDetails = true;
        resolve(audioDetails);
      });
    });
  }

  private handleError() {
    if (!this.childProcess) throw new SystemAudioRecorderNotStartedError();

    this.childProcess.on("error", (error) => {
      throw new SystemAudioRecorderSubprocessError(
        String(error),
        this.stderrBuffer
      );
    });
  }

  public start() {
    this.spawnChildProcess();
    this.handleStderr();
    this.handleError();
    this.isStopped = false;
  }

  public stop() {
    if (!this.childProcess) return;
    this.childProcess.kill();
    this.isStopped = true;
  }

  public getAudioDetails() {
    if (!this.childProcess || this.audioDetails === null) {
      throw new SystemAudioRecorderNotStartedError();
    }
    return this.audioDetails;
  }

  public getStream() {
    if (!this.childProcess || this.isStopped) {
      throw new SystemAudioRecorderNotStartedError();
    }
    return this.childProcess.stdout;
  }
}
