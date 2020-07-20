import React, { useEffect, useState } from "react";
import {
  generateAudioSamples,
  byteSamplesToFloatSamples,
  floatSamplesToByteSamples,
} from "./helpers";

import { NUMBER_OF_SAMPLES } from "./constants";

const App = () => {
  const [audioContext, setAudioContext] = useState({});
  const [audioBuffer, setAudioBuffer] = useState({});
  const [amplifiedAudioSamples, setAmplifiedAudioSamples] = useState(
    new Float32Array(NUMBER_OF_SAMPLES)
  );
  const [audioBufferSource, setAudioBufferSource] = useState(undefined);
  const [originalAudioSamples, setOriginalAudioSamples] = useState(
    new Float32Array(NUMBER_OF_SAMPLES)
  );

  useEffect(() => {
    async function init() {
      try {
        const wasm = await import("external");

        // Create a Uint8Array to give us access to Wasm Memory
        const wasmByteMemoryArray = new Uint8Array(wasm.memory.buffer);

        // Generate 1024 float audio samples that make
        // a quiet and simple square wave
        const originalSamples = new Float32Array(
          generateAudioSamples(NUMBER_OF_SAMPLES)
        );

        // Convert the float audio samples to a byte format
        const originalByteAudioSamples = floatSamplesToByteSamples(
          originalSamples
        );

        // Fill the wasm memory with the converted Audio Samples
        // And store it at our inputPointer location
        // (starting index where the input buffer was stored in the rust code )
        const inputPointer = wasm.get_input_buffer_pointer();
        wasmByteMemoryArray.set(originalByteAudioSamples, inputPointer);

        // Amplify our loaded samples with our export Wasm function
        wasm.amplify_audio();

        // Get our outputPointer (index were the sample buffer was stored)
        // Slice out the amplified byte audio samples
        const outputPointer = wasm.get_output_buffer_pointer();
        const outputBuffer = wasmByteMemoryArray.slice(
          outputPointer,
          outputPointer + NUMBER_OF_SAMPLES
        );

        // Convert our amplified byte samples into float samples,
        // and set the outputBuffer to our amplifiedAudioSamples
        setAmplifiedAudioSamples(byteSamplesToFloatSamples(outputBuffer));

        setOriginalAudioSamples(originalSamples);

        // Create our audio context
        const context = new (window.AudioContext ||
          window.webkitAudioContext)();
        setAudioContext(context);

        // Create an empty stereo buffer at the sample rate of the AudioContext
        setAudioBuffer(
          context.createBuffer(2, NUMBER_OF_SAMPLES, context.sampleRate)
        );
      } catch (err) {
        console.error(`Unexpected error in init. [Message: ${err.message}]`);
      }
    }
    init();
  }, []);

  const beforePlay = () => {
    // Check if context is in suspended state
    if (audioContext.state === "suspended") {
      audioContext.resume();
    }
  };

  const stopAudioBufferSource = () => {
    // If we have an audioBufferSource
    // Stop and clear our current audioBufferSource
    if (audioBufferSource) {
      audioBufferSource.stop();
      setAudioBufferSource(undefined);
    }
  };

  const createAndStartAudioBufferSource = () => {
    // Stop the the current audioBufferSource
    stopAudioBufferSource();

    // Create an AudioBufferSourceNode.
    // This is the AudioNode to use when we want to play an AudioBuffer,
    // Set the buffer to our buffer source,
    // And loop the source so it continuously plays
    const bufferSource = audioContext.createBufferSource();
    bufferSource.buffer = audioBuffer;
    bufferSource.loop = true;

    // Connect our source to our output, and start! (it will play silence for now)
    bufferSource.connect(audioContext.destination);
    bufferSource.start();
    setAudioBufferSource(bufferSource);
  };

  const playOriginal = () => {
    beforePlay();
    // Set the float audio samples to the left and right channel
    // of our playing audio buffer
    audioBuffer.getChannelData(0).set(originalAudioSamples);
    audioBuffer.getChannelData(1).set(originalAudioSamples);

    createAndStartAudioBufferSource();
  };

  const playAmplified = () => {
    beforePlay();
    // Set the float audio samples to the left and right channel
    // of our playing audio buffer
    audioBuffer.getChannelData(0).set(amplifiedAudioSamples);
    audioBuffer.getChannelData(1).set(amplifiedAudioSamples);

    createAndStartAudioBufferSource();
  };

  const pause = () => {
    beforePlay();
    stopAudioBufferSource();
  };

  return (
    <div>
      <h1>Watch out when using headphones!!</h1>
      <h1>Original Sine Wave</h1>
      <div>
        <button
          className="original"
          onClick={() => {
            playOriginal();
          }}
        >
          Play
        </button>
      </div>
      <hr />
      <h1>Amplified Sine Wave</h1>
      <div>
        <button
          className="amplified"
          onClick={() => {
            playAmplified();
          }}
        >
          Play
        </button>
      </div>
      <hr />
      <h1>Pause</h1>
      <div>
        <button
          className="pause"
          onClick={() => {
            pause();
          }}
        >
          Pause
        </button>
      </div>
    </div>
  );
};

export default App;
