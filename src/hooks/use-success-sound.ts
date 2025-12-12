// Success sound utility hook
export const playSuccessSound = () => {
  // Create an audio context for a pleasant success sound
  const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  
  const oscillator = audioContext.createOscillator();
  const gainNode = audioContext.createGain();
  
  oscillator.connect(gainNode);
  gainNode.connect(audioContext.destination);
  
  oscillator.frequency.setValueAtTime(587.33, audioContext.currentTime); // D5
  oscillator.frequency.setValueAtTime(880, audioContext.currentTime + 0.1); // A5
  
  gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
  gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
  
  oscillator.start(audioContext.currentTime);
  oscillator.stop(audioContext.currentTime + 0.3);
};

export const useSuccessSound = () => {
  return { playSuccessSound };
};
