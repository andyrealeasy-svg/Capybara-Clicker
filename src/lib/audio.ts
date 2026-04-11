// Web Audio API wrapper to avoid system player issues on mobile/Yandex
let audioCtx: AudioContext | null = null;
let bgMusic: HTMLAudioElement | null = null;
let isMusicMuted = false;

export const initAudio = () => {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
};

export const initBgMusic = () => {
  if (!bgMusic) {
    // Relaxing lofi background music
    bgMusic = new Audio('https://assets.mixkit.co/music/preview/mixkit-sleepy-cat-135.mp3');
    bgMusic.loop = true;
    bgMusic.volume = 0.15; // soft volume
  }
  
  if (!isMusicMuted && bgMusic.paused) {
    bgMusic.play().catch(e => console.log("Autoplay prevented:", e));
  }
};

export const toggleBgMusic = () => {
  if (!bgMusic) {
    initBgMusic();
  }
  
  if (bgMusic) {
    if (bgMusic.paused) {
      bgMusic.play().catch(e => console.log("Play prevented:", e));
      isMusicMuted = false;
    } else {
      bgMusic.pause();
      isMusicMuted = true;
    }
  }
  return !isMusicMuted;
};

export const getMusicState = () => {
  return !isMusicMuted && bgMusic && !bgMusic.paused;
};

export const playPopSound = () => {
  if (!audioCtx) return;
  
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  
  osc.type = 'sine';
  osc.frequency.setValueAtTime(400, audioCtx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(600, audioCtx.currentTime + 0.1);
  
  gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.1);
  
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  
  osc.start();
  osc.stop(audioCtx.currentTime + 0.1);
};

export const playBuySound = () => {
  if (!audioCtx) return;
  
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  
  osc.type = 'square';
  osc.frequency.setValueAtTime(300, audioCtx.currentTime);
  osc.frequency.setValueAtTime(400, audioCtx.currentTime + 0.1);
  osc.frequency.setValueAtTime(600, audioCtx.currentTime + 0.2);
  
  gain.gain.setValueAtTime(0.05, audioCtx.currentTime);
  gain.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 0.3);
  
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  
  osc.start();
  osc.stop(audioCtx.currentTime + 0.3);
};
