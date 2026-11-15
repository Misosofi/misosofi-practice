/* ===== MISOSOFI 部品箱：マイクでピアノ（や歌）を聞き取る =====
   読譜ゲーム（MISOSOFI Sight-Reading, 2026-10）の仕組みをそのまま部品にしたもの。
   MPM（NSDF）で音の高さを出し、「音の立ち上がり」と「安定した新しい音」の2つで1打を数える。
   連打・レガート・ペダルの響き・部屋の反響に対策ずみ。録音も送信もしない（端末の中だけ）。
   使い方：
     await MisoListen.start({ onNote: (midi) => {...}, onLevel: (db) => {...} });
     MisoListen.mute(400);   // アプリが音を鳴らす直前に呼ぶ（自分の音を聞き取らないように）
     MisoListen.stop();
   設定（必要なときだけ）：MisoListen.opt = { a4:440, oct:0, stable:3, clar:0.86, gate:-52, rise:5, low:45, maxHz:2200 }
   low＝聞き取るいちばん低い音（MIDI）、maxHz＝いちばん高い音の周波数。 */
(function () {
  const L = {
    opt: { a4: 440, oct: 0, stable: 3, clar: 0.86, gate: -52, rise: 5, low: 45, maxHz: 2200 },
    running: false, ctx: null, stream: null, an: null, time: null, raf: 0,
    onNote: null, onLevel: null, muteUntil: 0
  };
  const det = { recent: [], armed: false, armedAt: 0, hist: [], stableHist: [], lastMidi: null, lastAt: 0, refractoryUntil: 0, strong: false };

  function mpm(buf, sr, minF, maxF, k) {
    const n = buf.length, maxTau = Math.min(n - 2, Math.floor(sr / minF)), minTau = Math.max(2, Math.floor(sr / maxF));
    const nsdf = new Float32Array(maxTau + 1);
    for (let tau = minTau; tau <= maxTau; tau++) { let acf = 0, m = 0; const lim = n - tau; for (let i = 0; i < lim; i++) { const a = buf[i], b = buf[i + tau]; acf += a * b; m += a * a + b * b; } nsdf[tau] = m > 0 ? 2 * acf / m : 0; }
    const peaks = []; let tau = minTau;
    while (tau <= maxTau && nsdf[tau] > 0) tau++;
    while (tau <= maxTau) {
      while (tau <= maxTau && nsdf[tau] <= 0) tau++;
      let best = -1, bv = -1;
      while (tau <= maxTau && nsdf[tau] > 0) { if (nsdf[tau] > bv) { bv = nsdf[tau]; best = tau; } tau++; }
      if (best > 0) peaks.push([best, bv]);
    }
    if (!peaks.length) return null;
    let mx = 0; for (const p of peaks) if (p[1] > mx) mx = p[1];
    let chosen = null; for (const p of peaks) { if (p[1] >= k * mx) { chosen = p; break; } }
    let t = chosen[0], v = chosen[1];
    if (t > minTau && t < maxTau) { const a = nsdf[t - 1], b = nsdf[t], c = nsdf[t + 1]; const d = a - 2 * b + c; if (d !== 0) { const dx = 0.5 * (a - c) / d; t += dx; v = b - 0.25 * (a - c) * dx; } }
    return { hz: sr / t, clarity: v };
  }
  L.mpm = mpm;

  function frame(now) {
    const o = L.opt, buf = L.time; L.an.getFloatTimeDomainData(buf); const n = buf.length;
    let s = 0; for (let i = n - 1024; i < n; i++) s += buf[i] * buf[i];
    const db = 20 * Math.log10(Math.sqrt(s / 1024) + 1e-9);
    if (L.onLevel) L.onLevel(db);
    const recent = det.recent; let rmin = Infinity; for (const v of recent) if (v < rmin) rmin = v;
    const jump = recent.length >= 2 ? db - recent[recent.length - 2] : 0;
    if (db > o.gate && now > det.refractoryUntil && now > L.muteUntil && recent.length >= 4 && (db > rmin + o.rise || (jump >= 3 && db > rmin + 2))) {
      det.strong = db > rmin + o.rise; det.armed = true; det.armedAt = now; det.hist = []; det.refractoryUntil = now + 180;
    }
    recent.push(db); if (recent.length > 18) recent.shift();
    let f = null;
    if (db > o.gate) {
      const minF = Math.max(38, o.a4 * Math.pow(2, (o.low - 69 - 12 * o.oct) / 12));
      f = mpm(minF >= 110 ? buf.subarray(n - 2048) : buf, L.ctx.sampleRate, minF, o.maxHz || 2200, 0.93);
    }
    if (f) { const mf = 69 + 12 * Math.log2(f.hz / o.a4) + 12 * o.oct; f.midi = Math.round(mf); }
    const clear = f && f.clarity >= o.clar;
    det.stableHist.push(clear ? f.midi : null); if (det.stableHist.length > o.stable) det.stableHist.shift();
    let stable = null; if (det.stableHist.length >= o.stable) { const v = det.stableHist[0]; if (v !== null && det.stableHist.every(x => x === v)) stable = v; }
    const emit = m => { det.armed = false; det.lastMidi = m; det.lastAt = now; det.stableHist = []; det.refractoryUntil = Math.max(det.refractoryUntil, now + 150); det.recent.length = 0; if (L.onNote) L.onNote(m); };
    if (det.armed) {
      if (now - det.armedAt > 600) det.armed = false;
      else if (clear) {
        det.hist.push(f.midi); const n2 = det.hist.length;
        if (n2 >= o.stable) {
          let same = true; for (let i = n2 - o.stable; i < n2; i++) if (det.hist[i] !== det.hist[n2 - 1]) same = false;
          if (same) { if (f.midi === det.lastMidi && now - det.lastAt < 320 && !det.strong) det.armed = false; else emit(f.midi); }
        }
      }
    } else if (stable !== null && stable !== det.lastMidi && now - det.lastAt > 120 && now > L.muteUntil) emit(stable);
    if (!clear && db < o.gate - 6 && det.lastMidi !== null && now - det.lastAt > 300) det.lastMidi = null;
  }
  function loop(now) {
    if (!L.running) return;
    try { if (L.ctx.state !== "running") L.ctx.resume().catch(() => { }); else frame(now); } catch (e) { }
    L.raf = requestAnimationFrame(loop);
  }

  L.start = async function (cb = {}) {
    L.stop(); L.onNote = cb.onNote || null; L.onLevel = cb.onLevel || null;
    const AC = window.AudioContext || window.webkitAudioContext;
    L.ctx = (window.MisoPiano && MisoPiano.ac()) || L.ctx || new AC();
    try { await Promise.race([L.ctx.resume(), new Promise(r => setTimeout(r, 1500))]); } catch (e) { }
    L.stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false } });
    const src = L.ctx.createMediaStreamSource(L.stream);
    const hp = L.ctx.createBiquadFilter(); hp.type = "highpass"; hp.frequency.value = 35;
    const lp = L.ctx.createBiquadFilter(); lp.type = "lowpass"; lp.frequency.value = 6000;
    const an = L.ctx.createAnalyser(); an.fftSize = 4096; an.smoothingTimeConstant = 0;
    src.connect(hp); hp.connect(lp); lp.connect(an);
    L.an = an; L.time = new Float32Array(an.fftSize); L.running = true; det.recent = []; det.lastMidi = null;
    L.raf = requestAnimationFrame(loop);
  };
  L.stop = function () {
    L.running = false; cancelAnimationFrame(L.raf);
    if (L.stream) { L.stream.getTracks().forEach(t => t.stop()); L.stream = null; }
  };
  L.mute = ms => { L.muteUntil = Math.max(L.muteUntil, performance.now() + ms); };
  /* 別のアプリ・タブに移ったら、マイクを本当に止める（読譜ゲームと同じ約束） */
  document.addEventListener("visibilitychange", () => { if (document.hidden) L.stop(); });
  window.addEventListener("pagehide", () => L.stop());
  window.MisoListen = L;
})();
