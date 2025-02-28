import { SystemAudioRecorder } from "./src/index.ts";

const recorder = new SystemAudioRecorder();
console.log("Starting system audio recorder...");
recorder.start();

recorder.getAudioDetails().then((audioDetails) => {
  console.log("Audio format details:", audioDetails);
});

recorder.getStream().on("data", (data) => {
  console.log("Received bytes:", data.length);
});

setTimeout(() => {
  console.log("Stopping system audio recorder...");
  recorder.stop();
}, 5_000);

setTimeout(() => {
  console.log("Starting system audio recorder again...");
  recorder.start();
  recorder.getAudioDetails().then((audioDetails) => {
    console.log("Audio format details:", audioDetails);
  });
  recorder.getStream().on("data", (data) => {
    console.log("Received bytes:", data.length);
  });
}, 6_000);

setTimeout(() => {
  console.log("Stopping system audio recorder...");
  recorder.stop();
}, 10_000);
