let context: AudioContext | null = null;

const BEEPS = 3;
const BEEP_SECONDS = 0.25;
const GAP_SECONDS = 0.15;
const FREQUENCY = 880;

export const unlockAudio = (): void => {
  try {
    if (context === null && "AudioContext" in window) {
      context = new AudioContext();
    }
    void context?.resume();
    if ("speechSynthesis" in window) {
      const silent = new SpeechSynthesisUtterance("");
      silent.volume = 0;
      window.speechSynthesis.speak(silent);
    }
  } catch {
    context = null;
  }
};

export const playAlarm = (): void => {
  if (context === null) {
    return;
  }
  const start = context.currentTime;
  for (let index = 0; index < BEEPS; index += 1) {
    const at = start + index * (BEEP_SECONDS + GAP_SECONDS);
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.frequency.value = FREQUENCY;
    gain.gain.setValueAtTime(0.0001, at);
    gain.gain.exponentialRampToValueAtTime(0.4, at + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, at + BEEP_SECONDS);
    oscillator.connect(gain).connect(context.destination);
    oscillator.start(at);
    oscillator.stop(at + BEEP_SECONDS);
  }
  if ("vibrate" in navigator) {
    navigator.vibrate([300, 150, 300, 150, 300]);
  }
};

export const isSpeechSynthesisSupported = (): boolean => "speechSynthesis" in window;

export const speak = (text: string, language: string, onEnd: () => void): void => {
  if (!isSpeechSynthesisSupported()) {
    onEnd();
    return;
  }
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = language;
  utterance.addEventListener("end", onEnd);
  utterance.addEventListener("error", onEnd);
  window.speechSynthesis.speak(utterance);
};
