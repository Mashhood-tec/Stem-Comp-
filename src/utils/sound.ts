let context: AudioContext | null = null;

/** A short three-tone alert used when a countdown reaches zero. Fails silently if audio is unavailable. */
export function playTimeUpAlert(): void {
  try {
    const AudioCtor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtor) return;
    context ??= new AudioCtor();
    const ctx = context;
    if (ctx.state === 'suspended') void ctx.resume();
    [0, 0.18, 0.36].forEach((offset, index) => {
      const oscillator = ctx.createOscillator();
      const gain = ctx.createGain();
      oscillator.type = 'sine';
      oscillator.frequency.value = index === 2 ? 660 : 880;
      gain.gain.setValueAtTime(0.0001, ctx.currentTime + offset);
      gain.gain.exponentialRampToValueAtTime(0.2, ctx.currentTime + offset + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + offset + 0.16);
      oscillator.connect(gain).connect(ctx.destination);
      oscillator.start(ctx.currentTime + offset);
      oscillator.stop(ctx.currentTime + offset + 0.18);
    });
  } catch {
    // Audio is a nice-to-have; the visual time-up state is always shown.
  }
}
