export function createAudio() {
  let context = null;
  let enabled = true;
  function ensure() {
    if (!enabled) return null;
    try {
      if (!context) context = new (window.AudioContext || window.webkitAudioContext)();
      if (context.state === 'suspended') context.resume();
      return context;
    } catch { enabled = false; return null; }
  }
  function tone(freq, duration, type = 'sine', volume = 0.12, delay = 0) {
    const c = ensure(); if (!c) return;
    try {
      const osc = c.createOscillator(), gain = c.createGain(), start = c.currentTime + delay;
      osc.type = type; osc.frequency.setValueAtTime(freq, start);
      gain.gain.setValueAtTime(volume, start); gain.gain.exponentialRampToValueAtTime(0.001, start + duration);
      osc.connect(gain); gain.connect(c.destination); osc.start(start); osc.stop(start + duration);
    } catch { enabled = false; }
  }
  function noise(duration, cutoff, volume = 0.15, delay = 0) {
    const c = ensure(); if (!c) return;
    try {
      const length = Math.max(1, Math.floor(c.sampleRate * duration));
      const buffer = c.createBuffer(1, length, c.sampleRate), data = buffer.getChannelData(0);
      for (let i = 0; i < length; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / length);
      const source = c.createBufferSource(), filter = c.createBiquadFilter(), gain = c.createGain(), start = c.currentTime + delay;
      source.buffer = buffer; filter.type = 'lowpass'; filter.frequency.value = cutoff;
      gain.gain.setValueAtTime(volume, start); gain.gain.exponentialRampToValueAtTime(0.001, start + duration);
      source.connect(filter); filter.connect(gain); gain.connect(c.destination); source.start(start);
    } catch { enabled = false; }
  }
  const audio = {
    shot(id) {
      if (id === 'rifle') { noise(0.06, 1800, 0.2); tone(160, 0.06, 'square', 0.08); }
      else if (id === 'smg') { noise(0.045, 2400, 0.12); tone(240, 0.045, 'square', 0.06); }
      else { noise(0.04, 3200, 0.12); tone(460, 0.04, 'square', 0.07); }
    },
    reload() { tone(620, 0.055, 'square', 0.08); tone(420, 0.07, 'square', 0.08, 0.28); },
    dryClick() { tone(900, 0.018, 'square', 0.055); },
    hit(head) { tone(head ? 1800 : 1200, 0.04, 'sine', 0.08); },
    kill() { tone(720, 0.08, 'triangle', 0.1); },
    explosion() { noise(0.7, 400, 0.26); tone(50, 0.7, 'sine', 0.24); },
    plantBeep() { tone(880, 0.08, 'square', 0.06); },
    roundWin() { tone(523, 0.2, 'sine', 0.09); tone(659, 0.2, 'sine', 0.09, 0.2); tone(784, 0.3, 'sine', 0.09, 0.4); },
    roundLose() { tone(494, 0.24, 'sine', 0.09); tone(392, 0.32, 'sine', 0.09, 0.24); },
    footstep() { noise(0.035, 500, 0.045); },
    buy() { tone(980, 0.07, 'sine', 0.07); },
    defuseTick() { tone(1300, 0.035, 'square', 0.04); },
  };
  return audio;
}

// Events remain available to HUD until main.js clears the queue after both consumers run.
export function stepAudio(S, audio) {
  for (let i = 0; i < S.events.length; i++) {
    const event = S.events[i];
    if (event._audioPlayed) continue;
    if (event.type === 'shot') audio.shot(event.weapon);
    else if (event.type === 'reload') audio.reload();
    else if (event.type === 'dry-click') audio.dryClick();
    else if (event.type === 'hit') audio.hit(event.head);
    else if (event.type === 'kill') audio.kill();
    else if (event.type === 'explosion') audio.explosion();
    else if (event.type === 'plant-beep') audio.plantBeep();
    else if (event.type === 'round-win') audio.roundWin();
    else if (event.type === 'round-lose') audio.roundLose();
    else if (event.type === 'footstep') audio.footstep();
    else if (event.type === 'buy') audio.buy();
    else if (event.type === 'defuse-tick') audio.defuseTick();
    event._audioPlayed = true;
  }
}
