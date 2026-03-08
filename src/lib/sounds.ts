/**
 * Custom notification & interaction sounds for نوبهار
 * Uses Web Audio API — no external files needed
 */

let audioCtx: AudioContext | null = null;

function getCtx(): AudioContext {
  if (!audioCtx) audioCtx = new AudioContext();
  return audioCtx;
}

function playTone(
  frequencies: number[],
  durations: number[],
  type: OscillatorType = "sine",
  volume = 0.15
) {
  try {
    const ctx = getCtx();
    if (ctx.state === "suspended") ctx.resume();

    const gain = ctx.createGain();
    gain.connect(ctx.destination);
    gain.gain.setValueAtTime(0, ctx.currentTime);

    let time = ctx.currentTime;
    frequencies.forEach((freq, i) => {
      const dur = durations[i] || 0.15;
      const osc = ctx.createOscillator();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, time);
      osc.connect(gain);
      osc.start(time);
      osc.stop(time + dur);
      time += dur;
    });

    // Smooth envelope
    gain.gain.setValueAtTime(volume, ctx.currentTime + 0.01);
    gain.gain.linearRampToValueAtTime(volume * 0.8, ctx.currentTime + 0.05);
    gain.gain.linearRampToValueAtTime(0, time + 0.08);
  } catch {
    // Silently fail if audio not supported
  }
}

/** Gentle rising chime — for new notifications */
export function playNotificationSound() {
  playTone([523, 659, 784], [0.1, 0.1, 0.18], "sine", 0.13);
}

/** Soft confirmation pop — for comment/action submit */
export function playSubmitSound() {
  playTone([440, 554], [0.06, 0.12], "sine", 0.1);
}

/** Quick subtle click — for likes, bookmarks */
export function playClickSound() {
  playTone([880], [0.04], "triangle", 0.08);
}

/** Success melody — for publish/save */
export function playSuccessSound() {
  playTone([523, 659, 784, 1047], [0.1, 0.1, 0.1, 0.25], "sine", 0.12);
}

/** Soft error — for failures */
export function playErrorSound() {
  playTone([330, 262], [0.12, 0.2], "triangle", 0.1);
}
