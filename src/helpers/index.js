export const floatSamplesToByteSamples = (floatSamples) => {
  const byteSamples = new Uint8Array(floatSamples.length);
  for (let i = 0; i < floatSamples.length; i++) {
    const diff = floatSamples[i] * 127;
    byteSamples[i] = 127 + diff;
  }
  return byteSamples;
};

export const byteSamplesToFloatSamples = (byteSamples) => {
  const floatSamples = new Float32Array(byteSamples.length);
  for (let i = 0; i < byteSamples.length; i++) {
    const byteSample = byteSamples[i];
    const floatSample = (byteSample - 127) / 127;
    floatSamples[i] = floatSample;
  }
  return floatSamples;
};

export const generateAudioSamples = (numberOfSamples) => {
  const audioSamples = [];

  const sampleValue = 0.3;
  for (let i = 0; i < numberOfSamples; i++) {
    if (i < numberOfSamples / 2) {
      audioSamples[i] = sampleValue;
    } else {
      audioSamples[i] = sampleValue * -1;
    }
  }
  return audioSamples;
};
