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
  Object.assign(PITCH, { on: true, stream, an, buf: new Float32Array(an.fftSize), onNote, onLive, cand: null, n: 0, held: null, prev: 0, armed: false });
  PITCH.timer = setInterval(pitchTick, 33);
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
  const muted = Date.now() < PITCH.muteUntil;
  let f = rms > 0.012 && !muted ? autoCorr(b, sr) : -1;
  let midi = null, cents = 0;
  if (f > 50 && f < 2200) { const m = 69 + 12 * Math.log2(f / 440); midi = Math.round(m); cents = Math.round((m - midi) * 100); }
  if (PITCH.onLive) PITCH.onLive({ midi, cents, level: Math.min(1, rms * 8) });
  /* note onsets: the same note for 3 frames in a row; striking the same key again counts when the level jumps up */
  if (rms > PITCH.prev * 1.5 && rms > 0.03) { PITCH.armed = true; PITCH.n = 0; }
  PITCH.prev = rms;
  if (midi == null) { PITCH.cand = null; PITCH.n = 0; if (rms < 0.008) PITCH.held = null; return; }
  if (midi === PITCH.cand) PITCH.n++; else { PITCH.cand = midi; PITCH.n = 1; }
  if (PITCH.n >= 3 && (midi !== PITCH.held || PITCH.armed)) { PITCH.held = midi; PITCH.armed = false; if (PITCH.onNote) PITCH.onNote(midi); }
}
function autoCorr(buf, sr) {
  const SIZE = buf.length; let r1 = 0, r2 = SIZE - 1;
  for (let i = 0; i < SIZE / 2; i++) if (Math.abs(buf[i]) < 0.2) { r1 = i; break; }
  for (let i = 1; i < SIZE / 2; i++) if (Math.abs(buf[SIZE - i]) < 0.2) { r2 = SIZE - i; break; }
  const x = buf.subarray(r1, r2), n = x.length; if (n < 256) return -1;
  const maxLag = Math.min(n - 1, Math.floor(sr / 55)), minLag = Math.floor(sr / 2200), c = new Float32Array(maxLag + 1);
  for (let lag = minLag; lag <= maxLag; lag++) { let s = 0; for (let i = 0; i < n - lag; i++) s += x[i] * x[i + lag]; c[lag] = s / (n - lag); }
  let e = 0; for (let i = 0; i < n; i++) e += x[i] * x[i]; e /= n;
  /* first peak that is close to the best one (avoids octave-down mistakes) */
  let best = 0, bestLag = -1; for (let lag = minLag + 1; lag < maxLag; lag++) if (c[lag] > best) { best = c[lag]; bestLag = lag; }
  if (bestLag < 0 || best / e < 0.45) return -1;
  let lag = bestLag; for (let l = minLag + 1; l < maxLag; l++) if (c[l] > c[l - 1] && c[l] >= c[l + 1] && c[l] > best * 0.86) { lag = l; break; }
  const a = c[lag - 1], b2 = c[lag], d = c[lag + 1], p = (a - d) / (2 * (a - 2 * b2 + d)) || 0;
  return sr / (lag + p);
}
const PC_NAME = ["Do", "Do♯", "Re", "Re♯", "Mi", "Fa", "Fa♯", "So", "So♯", "La", "La♯", "Ti"];
const PC_LET = ["C", "C♯", "D", "D♯", "E", "F", "F♯", "G", "G♯", "A", "A♯", "B"];
const pcName = m => { const p = ((m % 12) + 12) % 12; return (typeof S !== "undefined" && S && S.abc) ? PC_LET[p] + " (" + PC_NAME[p] + ")" : PC_NAME[p]; };
