/* AMONG SUS — procedurally generated sound effects (no external assets) */
const Sound = (() => {
  let ctx = null;
  let master = null;
  let muted = false;

  try { muted = localStorage.getItem("sus_muted") === "1"; } catch (e) { /* ignore */ }

  function ensure() {
    if (!ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      try {
        ctx = new AC();
        master = ctx.createGain();
        master.gain.value = 0.42;
        master.connect(ctx.destination);
      } catch (e) {
        return null;
      }
    }
    if (ctx.state === "suspended") { try { ctx.resume(); } catch (e) { /* ignore */ } }
    return ctx;
  }

  function tone(opts) {
    if (muted) return;
    const c = ensure();
    if (!c) return;
    const {
      freq = 440, to = null, type = "sine", dur = 0.12,
      vol = 0.2, delay = 0, attack = 0.005
    } = opts || {};
    const t0 = c.currentTime + delay;
    const osc = c.createOscillator();
    const g = c.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t0);
    if (to !== null) osc.frequency.exponentialRampToValueAtTime(Math.max(20, to), t0 + dur);
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(Math.max(0.0002, vol), t0 + attack);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.connect(g).connect(master);
    osc.start(t0);
    osc.stop(t0 + dur + 0.03);
  }

  let noiseBuffer = null;
  function getNoise(c) {
    if (!noiseBuffer) {
      const len = Math.floor(c.sampleRate * 1.2);
      noiseBuffer = c.createBuffer(1, len, c.sampleRate);
      const data = noiseBuffer.getChannelData(0);
      for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
    }
    return noiseBuffer;
  }

  function noise(opts) {
    if (muted) return;
    const c = ensure();
    if (!c) return;
    const {
      dur = 0.25, vol = 0.18, delay = 0, freq = 900, to = null, q = 0.8, type = "lowpass"
    } = opts || {};
    const t0 = c.currentTime + delay;
    const src = c.createBufferSource();
    src.buffer = getNoise(c);
    const filter = c.createBiquadFilter();
    filter.type = type;
    filter.frequency.setValueAtTime(freq, t0);
    if (to !== null) filter.frequency.exponentialRampToValueAtTime(Math.max(40, to), t0 + dur);
    filter.Q.value = q;
    const g = c.createGain();
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(vol, t0 + 0.015);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    src.connect(filter).connect(g).connect(master);
    src.start(t0);
    src.stop(t0 + dur + 0.03);
  }

  const api = {
    unlock() { ensure(); },
    get muted() { return muted; },
    toggle() {
      muted = !muted;
      try { localStorage.setItem("sus_muted", muted ? "1" : "0"); } catch (e) { /* ignore */ }
      if (!muted) api.click();
      return muted;
    },
    click() {
      tone({ freq: 620, to: 840, type: "triangle", dur: 0.07, vol: 0.12 });
    },
    hover() {
      tone({ freq: 320, to: 360, type: "sine", dur: 0.045, vol: 0.04 });
    },
    error() {
      tone({ freq: 180, to: 120, type: "sawtooth", dur: 0.16, vol: 0.1 });
    },
    taskStep() {
      tone({ freq: 540, to: 620, type: "triangle", dur: 0.09, vol: 0.1 });
    },
    task() {
      [523, 659, 784, 1046].forEach((f, i) =>
        tone({ freq: f, type: "triangle", dur: 0.16, vol: 0.13, delay: i * 0.07 }));
    },
    kill() {
      noise({ dur: 0.32, vol: 0.34, freq: 1400, to: 120, q: 0.6 });
      tone({ freq: 150, to: 44, type: "sine", dur: 0.4, vol: 0.32 });
      tone({ freq: 90, to: 38, type: "sawtooth", dur: 0.28, vol: 0.12 });
    },
    death() {
      tone({ freq: 220, to: 60, type: "triangle", dur: 0.8, vol: 0.2 });
    },
    vent() {
      noise({ dur: 0.45, vol: 0.24, freq: 300, to: 1800, q: 1.4, type: "bandpass" });
      tone({ freq: 130, to: 400, type: "sine", dur: 0.35, vol: 0.1 });
    },
    report() {
      tone({ freq: 440, to: 660, type: "square", dur: 0.18, vol: 0.09 });
      tone({ freq: 660, to: 440, type: "square", dur: 0.18, vol: 0.09, delay: 0.2 });
      tone({ freq: 440, to: 660, type: "square", dur: 0.18, vol: 0.09, delay: 0.4 });
    },
    meeting() {
      [0, 0.3, 0.6, 0.9].forEach((d, i) => {
        tone({ freq: i % 2 ? 392 : 523, type: "square", dur: 0.24, vol: 0.075, delay: d });
      });
      noise({ dur: 1.1, vol: 0.05, freq: 600, to: 300, type: "lowpass", delay: 0.1 });
    },
    vote() {
      tone({ freq: 760, to: 560, type: "triangle", dur: 0.1, vol: 0.11 });
    },
    eject() {
      noise({ dur: 1.5, vol: 0.16, freq: 900, to: 90, q: 0.5 });
      tone({ freq: 420, to: 70, type: "sine", dur: 1.6, vol: 0.14 });
    },
    alarm() {
      tone({ freq: 880, to: 440, type: "square", dur: 0.4, vol: 0.07 });
      tone({ freq: 880, to: 440, type: "square", dur: 0.4, vol: 0.07, delay: 0.5 });
    },
    win() {
      [523, 659, 784, 1046, 1318].forEach((f, i) =>
        tone({ freq: f, type: "triangle", dur: 0.26, vol: 0.15, delay: i * 0.1 }));
      tone({ freq: 1046, type: "sine", dur: 0.7, vol: 0.12, delay: 0.55 });
    },
    lose() {
      [392, 349, 311, 233].forEach((f, i) =>
        tone({ freq: f, type: "sawtooth", dur: 0.34, vol: 0.11, delay: i * 0.16 }));
      tone({ freq: 116, to: 55, type: "sine", dur: 1.1, vol: 0.18, delay: 0.2 });
    }
  };

  return api;
})();
