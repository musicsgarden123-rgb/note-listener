// Pitch detection and note helpers.

const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

export function midiToFreq(midi) {
  return 440 * Math.pow(2, (midi - 69) / 12);
}

export function freqToMidi(freq) {
  return 69 + 12 * Math.log2(freq / 440);
}

export function midiToName(midi) {
  return NOTE_NAMES[midi % 12] + (Math.floor(midi / 12) - 1);
}

// Root-mean-square level of a buffer (0..1).
export function rms(buf) {
  let sum = 0;
  for (let i = 0; i < buf.length; i++) sum += buf[i] * buf[i];
  return Math.sqrt(sum / buf.length);
}

// YIN pitch detection (de Cheveigné & Kawahara, 2002).
// Returns { freq, clarity } or null when no clear pitch is found.
export function detectPitch(buf, sampleRate, { minFreq = 60, maxFreq = 1500, threshold = 0.15 } = {}) {
  const half = Math.floor(buf.length / 2);
  const minTau = Math.max(2, Math.floor(sampleRate / maxFreq));
  const maxTau = Math.min(half - 1, Math.floor(sampleRate / minFreq));

  // Difference function.
  const diff = new Float32Array(maxTau + 1);
  for (let tau = 1; tau <= maxTau; tau++) {
    let sum = 0;
    for (let i = 0; i < half; i++) {
      const d = buf[i] - buf[i + tau];
      sum += d * d;
    }
    diff[tau] = sum;
  }

  // Cumulative mean normalised difference.
  const cmnd = new Float32Array(maxTau + 1);
  cmnd[0] = 1;
  let running = 0;
  for (let tau = 1; tau <= maxTau; tau++) {
    running += diff[tau];
    cmnd[tau] = running === 0 ? 1 : (diff[tau] * tau) / running;
  }

  // First dip below the threshold, then walk down to its local minimum.
  let tau = -1;
  for (let t = minTau; t < maxTau; t++) {
    if (cmnd[t] < threshold) {
      while (t + 1 < maxTau && cmnd[t + 1] < cmnd[t]) t++;
      tau = t;
      break;
    }
  }
  if (tau === -1) return null;

  // Parabolic interpolation for sub-sample accuracy.
  const x0 = cmnd[tau - 1], x1 = cmnd[tau], x2 = cmnd[tau + 1];
  const denom = x0 + x2 - 2 * x1;
  const betterTau = denom !== 0 ? tau + (x0 - x2) / (2 * denom) : tau;

  return { freq: sampleRate / betterTau, clarity: 1 - x1 };
}
