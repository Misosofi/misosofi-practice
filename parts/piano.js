/* ===== MISOSOFI 部品箱：本物のピアノ音 =====
   30個の録音（短3度ごと）を少しずらして88鍵すべてを鳴らす。
   使い方：MisoPiano.base = "../misosofi-parts/"; MisoPiano.play(60) // まん中のド
   どのアプリでも同じファイルを読み込む（1か所直せば全部のアプリが新しくなる）。 */
(function () {
  const P = {
    base: (document.currentScript && document.currentScript.src.replace(/piano\.js(\?.*)?$/, "")) || "",
    ctx: null, buf: {}, loading: null, names: []
  };
  const L = ["C", "Ds", "Fs", "A"];
  P.names.push(["A0", 21]);
  for (let o = 1; o <= 7; o++) L.forEach((n, i) => P.names.push([n + o, 12 * (o + 1) + i * 3]));
  P.names.push(["C8", 108]);

  P.ac = function () {
    if (!P.ctx) { const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return null; P.ctx = new AC(); }
    if (P.ctx.state === "suspended") P.ctx.resume().catch(() => { });
    return P.ctx;
  };
  /* 先に読み込んでおく（最初のタップで呼ぶと遅れない） */
  P.load = function () {
    const c = P.ac(); if (!c) return Promise.resolve();
    if (P.loading) return P.loading;
    P.loading = Promise.all(P.names.map(([n, m]) =>
      fetch(P.base + "piano/" + n + ".mp3").then(r => { if (!r.ok) throw 0; return r.arrayBuffer(); })
        .then(a => new Promise((ok, no) => c.decodeAudioData(a, ok, no))).then(b => { P.buf[m] = b; }).catch(() => { })));
    return P.loading;
  };
  P.ready = () => Object.keys(P.buf).length > 0;
  /* midi: 60 = まん中のド。when: 何秒後。dur: 長さ。vol: 0〜1 */
  P.play = function (midi, when = 0, dur = 1.1, vol = 0.35) {
    const c = P.ac(); if (!c) return; if (!P.loading) P.load();
    const keys = Object.keys(P.buf).map(Number); if (!keys.length) return;
    let best = keys[0]; keys.forEach(k => { if (Math.abs(k - midi) < Math.abs(best - midi)) best = k; });
    const t0 = c.currentTime + when, src = c.createBufferSource(), g = c.createGain();
    src.buffer = P.buf[best]; src.playbackRate.value = Math.pow(2, (midi - best) / 12);
    const v = Math.min(1, vol * 2.6), hold = Math.max(0.25, dur);
    g.gain.setValueAtTime(v, t0); g.gain.setValueAtTime(v, t0 + hold); g.gain.exponentialRampToValueAtTime(0.0001, t0 + hold + 0.35);
    src.connect(g); g.connect(c.destination); src.start(t0); src.stop(t0 + hold + 0.4);
  };
  /* いくつかの音を同時に（和音・グーで2つの黒鍵など） */
  P.chord = (list, when = 0, dur = 1.1, vol = 0.3) => list.forEach(m => P.play(m, when, dur, vol));
  /* 正解「ピンポン」と、ちがう「ブー」（ピンポンもピアノの音） */
  P.pinpon = function () { P.play(88, 0, 0.25, 0.3); P.play(84, 0.18, 0.6, 0.3); };
  P.buzz = function () {
    const c = P.ac(); if (!c) return; const t = c.currentTime, o = c.createOscillator(), g = c.createGain();
    o.type = "square"; o.frequency.value = 110; g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.12, t + 0.02);
    g.gain.setValueAtTime(0.12, t + 0.35); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.45);
    o.connect(g); g.connect(c.destination); o.start(t); o.stop(t + 0.5);
  };
  window.MisoPiano = P;
})();
