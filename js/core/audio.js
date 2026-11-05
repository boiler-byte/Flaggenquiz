let context;

function getContext() {
  try {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return null;
    context ??= new AudioContextClass();
    if (context.state === 'suspended') void context.resume();
    return context;
  } catch {
    return null;
  }
}

function tone(ctx, freq, start, duration, type = 'sine', volume = 0.045) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, start);
  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.exponentialRampToValueAtTime(volume, start + 0.012);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
  osc.connect(gain).connect(ctx.destination);
  osc.start(start);
  osc.stop(start + duration + 0.018);
}

// Synthetische Klänge via Web Audio API; keine Netzwerkanfragen oder Audiodateien.
export function playSound(kind, enabled) {
  if (!enabled) return;
  const ctx = getContext();
  if (!ctx) return;
  const t = ctx.currentTime + 0.012;
  switch (kind) {
    case 'success':
      tone(ctx, 510, t, 0.11, 'sine', 0.055);
      tone(ctx, 690, t + 0.09, 0.11, 'sine', 0.055);
      tone(ctx, 930, t + 0.18, 0.19, 'sine', 0.06);
      break;
    case 'error':
      tone(ctx, 330, t, 0.17, 'triangle', 0.044);
      tone(ctx, 220, t + 0.115, 0.20, 'triangle', 0.038);
      break;
    case 'complete':
      [440, 554, 659, 880].forEach((freq, i) => tone(ctx, freq, t + i * 0.09, 0.25, 'sine', 0.044));
      break;
    default:
      tone(ctx, 640, t, 0.04, 'sine', 0.025);
  }
}
