/* ===== Microphone pitch detection (piano or voice) =====
   Autocorrelation with parabolic interpolation, run ~30 times a second.
   pitchStart(onNote, onLive): onNote(midi) fires once per new note (a new key press or a newly sung note);
   onLive({ midi, cents, level }) fires every frame for meters. Nothing is recorded or sent anywhere. */
const PITCH = { on: false, stream: null, an: null, buf: null, timer: 0, onNote: null, onLive: null, cand: null, n: 0, held: null, peak: 0, muteUntil: 0 };

async function pitchStart(onNote, onLive) {
  pitchStop();
  const c = ac(); if (!c || !navigator.mediaDevices?.getUserMedia) throw new Error("nomic");
  const stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false } });
  const src = c.createMediaStreamSource(stream), an = c.createAnalyser(); an.fftSize = 4096; src.connect(an);
  Object.assign(PITCH, { floor: null, on: true, stream, an, buf: new Float32Array(an.fftSize), onNote, onLive, cand: null, n: 0, held: null, prev: 0, armed: false });
  PITCH.timer = setInterval(pitchTick, 25);
}
function pitchStop() {
  clearInterval(PITCH.timer); PITCH.on = false;
  if (PITCH.stream) PITCH.stream.getTracks().forEach(t => t.stop());
  PITCH.stream = null; PITCH.an = null;
}
/* ignore the app's own sounds for a moment */
function pitchMute(ms = 700) { PITCH.muteUntil = Date.now() + ms; }

function pitchTick() {
  const an = PITCH.an; if (!an) return;
  an.getFloatTimeDomainData(PITCH.buf);
  const sr = an.context.sampleRate, b = PITCH.buf;
  let rms = 0; for (let i = 0; i < b.length; i++) rms += b[i] * b[i]; rms = Math.sqrt(rms / b.length);
  /* the quiet level of the room is learnt, so soft playing far from the phone still counts */
  PITCH.floor = PITCH.floor == null ? rms : rms < PITCH.floor ? rms : PITCH.floor * .995 + rms * .005;
  const muted = Date.now() < PITCH.muteUntil, loud = rms > Math.max(0.003, PITCH.floor * 2.2);
  let f = loud && !muted ? yin(b, sr) : -1;
  let midi = null, cents = 0;
  if (f > 40 && f < 2400) { const m = 69 + 12 * Math.log2(f / 440); midi = Math.round(m); cents = Math.round((m - midi) * 100); }
  if (PITCH.onLive) PITCH.onLive({ midi, cents, level: Math.min(1, rms * 12) });
  if (rms > PITCH.prev * 1.35 && rms > Math.max(0.006, PITCH.floor * 3)) { PITCH.armed = true; PITCH.n = 0; }
  PITCH.prev = rms;
  if (midi == null) { PITCH.cand = null; PITCH.n = 0; if (!loud) PITCH.held = null; return; }
  if (midi === PITCH.cand) PITCH.n++; else { PITCH.cand = midi; PITCH.n = 1; }
  if (PITCH.n >= 2 && (midi !== PITCH.held || PITCH.armed)) { PITCH.held = midi; PITCH.armed = false; if (PITCH.onNote) PITCH.onNote(midi); }
}
/* YIN pitch detection: much steadier than plain autocorrelation for piano (fewer octave mistakes) */
function yin(buf, sr) {
  const W = Math.floor(buf.length / 2), maxT = Math.min(W - 2, Math.floor(sr / 40)), minT = Math.floor(sr / 2400), d = PITCH.d && PITCH.d.length === W ? PITCH.d : (PITCH.d = new Float32Array(W));
  for (let t = 1; t <= maxT; t++) { let s = 0; for (let i = 0; i < W; i++) { const x = buf[i] - buf[i + t]; s += x * x; } d[t] = s; }
  let run = 0; d[0] = 1; for (let t = 1; t <= maxT; t++) { run += d[t]; d[t] = run ? d[t] * t / run : 1; }
  let tau = -1; for (let t = Math.max(2, minT); t < maxT; t++) if (d[t] < 0.15) { while (t + 1 < maxT && d[t + 1] < d[t]) t++; tau = t; break; }
  if (tau < 0) { let best = 1; for (let t = Math.max(2, minT); t < maxT; t++) if (d[t] < best) { best = d[t]; tau = t; } if (best > 0.35) return -1; }
  const a = d[tau - 1], c = d[tau + 1], den = 2 * (2 * d[tau] - a - c), p = den ? (c - a) / den : 0;
  return sr / (tau + (Math.abs(p) < 1 ? p : 0));
}
const PC_NAME = ["Do", "Do♯", "Re", "Re♯", "Mi", "Fa", "Fa♯", "So", "So♯", "La", "La♯", "Ti"];
const PC_LET = ["C", "C♯", "D", "D♯", "E", "F", "F♯", "G", "G♯", "A", "A♯", "B"];
const pcName = m => { const p = ((m % 12) + 12) % 12; return (typeof S !== "undefined" && S && S.abc) ? PC_LET[p] + " (" + PC_NAME[p] + ")" : PC_NAME[p]; };
