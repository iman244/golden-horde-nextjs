/**
 * Shared audio utility functions for VAD (Voice Activity Detection)
 */

/**
 * Calculate volume in dB from time domain data using proper RMS calculation
 * This is the correct approach for measuring audio amplitude
 */
export const calculateVolumeDb = (analyser: AnalyserNode): number => {
  const bufferLength = analyser.fftSize;
  const dataArray = new Float32Array(bufferLength);
  
  // Get raw audio amplitude data (time domain)
  analyser.getFloatTimeDomainData(dataArray);
  
  // Calculate RMS (Root Mean Square) - proper way to average audio power
  let sum = 0;
  for (let i = 0; i < bufferLength; i++) {
    sum += dataArray[i] * dataArray[i]; // Square each sample
  }
  const rms = Math.sqrt(sum / bufferLength); // Square root of mean
  
  // Convert RMS amplitude to dB using correct formula
  return rms > 0 ? 20 * Math.log10(rms) : -100;
};

/**
 * Creates VAD thresholds object, clamping the threshold between -100 and 0 dB.
 * @param thresholdDb The desired threshold in dB
 * @returns { thresholdDb: number }
 */
export function createVadThresholds(thresholdDb: number) {
  return {
    thresholdDb: Math.max(-100, Math.min(0, thresholdDb)),
  };
} 