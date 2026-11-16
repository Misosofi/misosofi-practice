/* ===== 🏠 Home · Supermarket · Japan — feeling chords 1, 4 and 5 (the teacher's story) =====
   1 = HOME: lying on the couch eating crisps (Mum and Dad: "That's enough!" — he doesn't listen).
   4 = SUPERMARKET: the crisps are gone → buy more → back home → eat… again and again.
   5 = JAPAN: bored of that → a trip to Japan, sightseeing → and back HOME (1).
   Then: only the chord plays — "Where is he now?" */
const CP_PLACES = [{ d: 1, ic: "🛋️", k: "cp_home" }, { d: 4, ic: "🛒", k: "cp_shop" }, { d: 5, ic: "🗾", k: "cp_japan" }];
const CP_SCENES = [
  { d: 1, bg: "#FFF1D6", art: "🛋️🧒🥔", side: "😠👨 👩😠", k: "cp_s1" },
  { d: 4, bg: "linear-gradient(#3b3a7a,#7a5aa8)", art: "🛒🧒", side: "🌙🥔🥔", k: "cp_s2", night: true },
  { d: 1, bg: "#FFF1D6", art: "🛋️🧒🥔", side: "😋", k: "cp_s3" },
  { d: 4, bg: "linear-gradient(#3b3a7a,#7a5aa8)", art: "🛒🧒", side: "🌙🍪🥤", k: "cp_s4", night: true },
  { d: 1, bg: "#FFF1D6", art: "🛋️🧒😐", side: "💤", k: "cp_s5" },
  { d: 5, bg: "#FFE3EA", art: "✈️🧒🗾", side: "🏯🍣🗻", k: "cp_s6" },
  { d: 1, bg: "#FFF1D6", art: "🛋️🧒😊", side: "🏠", k: "cp_s7" },
];
const CP_LV = [
  { n: "cp_lv1", ref: true, len: 1 },     /* home first, then one chord */
  { n: "cp_lv2", ref: false, len: 1 },    /* one chord, no home first */
  { n: "cp_lv3", ref: false, len: 1, trip: true },   /* the music travels by itself: tap where he is whenever it moves */
];
const CP_N = 10;
let CP = null;
const cpBase = () => (NB_KEYS.find(k => k[0] === CP.k) || NB_KEYS[0])[1];
/* close, smooth voicings (like at the piano): 1 = root position, 4 = 2nd inversion, 5 = 1st inversion, with a bass note */
function cpChord(d, when = 0, dur = 1.1) {
  const b = cpBase(), V = { 1: [0, 4, 7], 4: [0, 5, 9], 5: [-1, 2, 7] }[d], bass = { 1: 0, 4: 5, 5: 7 }[d];
  V.forEach(x => tone(b + x, when, dur, .17)); tone(b - 12 + bass, when, dur, .16);
}
/* ---------- the groove: a little pop band that keeps playing the current chord ----------
   left hand: bass in quarters and eighths (root · root-5th · octave · 5th-root), right hand: the chord (1 in first inversion,
   4 and 5 voiced close to it) in a syncopated pop rhythm. Changing the chord happens on the next eighth — the music never stops. */
const GV = { vol: 1, on: false, d: 1, want: 1, cb: null, bpm: 96, step: 0, next: 0, tm: null };
const GV_BASS = { 0: [0, .9, .2], 2: [0, .4, .15], 3: [7, .4, .13], 4: [12, .9, .17], 6: [7, .4, .13], 7: [0, .4, .14] };   /* eighth → [interval, beats, vol] */
const GV_RH = { 0: [.9, .12], 3: [.45, .09], 5: [.45, .09], 6: [.9, .11] };
function gvVoice(d) { const b = cpBase(); return { 1: [b + 4, b + 7, b + 12], 4: [b + 5, b + 9, b + 12], 5: [b + 2, b + 7, b + 11] }[d]; }
function gvRoot(d) { const b = cpBase(); return { 1: b - 12, 4: b - 7, 5: b - 5 }[d]; }
function gvTick() {
  const c = ac(); if (!c || !GV.on) return; const e = 60 / GV.bpm / 2;
  while (GV.next < c.currentTime + .25) {
    const i = GV.step % 8, w = Math.max(0, GV.next - c.currentTime);
    /* a new chord only starts on the first beat of a bar — the bar that is playing is always finished */
    if (i === 0 && (GV.want !== GV.d || GV.cb)) { GV.d = GV.want; const cb = GV.cb; GV.cb = null; if (cb) setTimeout(cb, w * 1000); }
    const bs = GV_BASS[i], rh = GV_RH[i];
    if (bs) tone(gvRoot(GV.d) + bs[0], w, bs[1] * e * 2, bs[2] * GV.vol);
    if (rh) gvVoice(GV.d).forEach(m => tone(m, w, rh[0] * e * 2, rh[1] * GV.vol));
    GV.next += e; GV.step++;
  }
}
/* gvPlay(d, onStart): ask the band for chord d; onStart runs at the moment that chord really begins (next bar) */
function gvPlay(d, onStart) { const c = ac(); if (!c) return; GV.want = d; GV.cb = onStart || null; if (GV.on) return;
  if (!PIANO.loading) pianoLoad(); GV.d = d; GV.on = true; GV.step = 0; GV.next = c.currentTime + .08; clearInterval(GV.tm); GV.tm = setInterval(gvTick, 60); gvTick(); }
function gvStop() { GV.on = false; clearInterval(GV.tm); GV.tm = null; }
/* "pin-pon!" */
function pinpon() { const c = ac(); if (!c) return; [[1319, 0], [1047, .18]].forEach(([f, w]) => { const o = c.createOscillator(), g = c.createGain(), t0 = c.currentTime + w; o.type = "sine"; o.frequency.value = f; g.gain.setValueAtTime(.0001, t0); g.gain.exponentialRampToValueAtTime(.35, t0 + .01); g.gain.exponentialRampToValueAtTime(.0001, t0 + .5); o.connect(g); g.connect(outNode()); o.start(t0); o.stop(t0 + .55); }); }
function cpHome() {
  return `<button class="card pk-cat pp-sec" data-cp="open"><span class="pk-ic">🏠</span><span class="grow"><b>${t("cp_h")}</b><span class="small muted">${t("cp_sub")}</span></span><span>→</span></button>`;
}
function cpOpen() { const st = S.cplace || {}; CP = { phase: st.seen ? "set" : "story", sc: 0, lv: st.lv || 0, key: st.key || "C", k: "C" }; cpRender(); }
function cpRender() {
  const F = CP; if (!F) return;
  const head = `<div class="act-head"><h2>🏠 ${t("cp_h")}</h2><button class="icon-btn" data-act="close" aria-label="Close">${I.close}</button></div>`;
  if (F.phase === "story") {
    const s = CP_SCENES[F.sc], P = CP_PLACES.find(p => p.d === s.d);
    openSheet(`<div class="stack cp">${head}
      <div class="cp-scene cp-pic sc-in" data-cp="replay"><img src="assets/art/cp${F.sc + 1}.webp" alt=""><div class="cp-tag">${P.ic} ${s.d} = ${t(P.k)}</div><div class="cp-notes">♪ ♫ ♪</div></div>
      <button class="btn soft sm cp-say" data-cp="say">🔊 ${t("cp_listen")}</button>
      <div class="cp-dots">${CP_SCENES.map((x, i) => `<i class="${i === F.sc ? "on" : ""}"></i>`).join("")}</div>
      <div class="row" style="gap:8px">${F.sc ? `<button class="btn ghost" data-cp="prev">←</button>` : ""}<button class="btn grow" data-cp="next">${F.sc < CP_SCENES.length - 1 ? t("cp_next") + " →" : "🎧 " + t("cp_quiz")}</button></div></div>`);
    F.k = "C"; cpStoryChord(); return;
  }
  if (F.phase === "set") {
    const ch = (k, v, l) => `<button class="chip ${String(F[k]) === String(v) ? "on" : ""}" data-cp="set" data-k="${k}" data-v="${v}">${l}</button>`;
    openSheet(`<div class="stack cp">${head}<div class="muted small">${t("cp_how")}</div>
      <div class="cp-places">${CP_PLACES.map(p => `<div class="cp-pl"><b>${p.ic}</b><span>${p.d} · ${t(p.k)}</span></div>`).join("")}</div>
      <div class="label">${t("nb_step")}</div><div class="chips">${CP_LV.map((l, i) => ch("lv", i, `${i + 1}. ${t(l.n)}`)).join("")}</div>
      <div class="label">${t("nb_key")}</div><div class="chips">${NB_KEYS.map(k => ch("key", k[0], esc(k[0]))).join("")}${ch("key", "mix", "🔀 " + t("nb_mix"))}</div>
      <button class="btn block" data-cp="start" style="padding:18px;font-size:1.2rem">🎧 ${t("cp_quiz")}</button>
      <button class="btn ghost block" data-cp="story">📖 ${t("cp_story")}</button></div>`);
    return;
  }
  if (F.phase === "done") {
    const stars = F.ok >= 9 ? 3 : F.ok >= 7 ? 2 : F.ok >= 5 ? 1 : 0, coins = Math.floor(F.ok / 2);
    openSheet(`<div class="stack cp" style="text-align:center">${head}<div class="fl-stars">${"⭐".repeat(stars) || "💪"}</div>
      <div class="big-msg">${t("fl_score", { n: F.ok, of: CP_N })}</div>${coins ? `<div class="price fl-coins">${I.coin} +${coins}</div>` : ""}
      <button class="btn block" data-cp="start">🔁 ${t("fl_again")}</button><button class="btn ghost block" data-cp="settings">⚙️ ${t("fl_change")}</button></div>`);
    return;
  }
  const L = CP_LV[F.lv];
  openSheet(`<div class="stack cp">${head}
    <div class="fl-top"><span>${Math.min(F.i + 1, CP_N)} / ${CP_N}</span><span>✓ ${F.ok}</span></div>
    <div class="nb-key">🔑 ${esc(CP.k)} ${t("nb_major")} · 🎶</div>
    <div class="cp-where">${F.phase === "home" ? "🛋️ " + t("cp_atHome") : F.phase === "got" ? "✅ " + t("cp_gotIt") : F.phase === "wait" ? "🎶 …" : "🤔 " + t(L.trip ? "cp_whereNow" : "cp_where")}</div>
    <div class="cp-btns">${CP_PLACES.map(p => `<button class="cp-ans ${F.phase === "got" && F.hit === p.d ? "hit" : ""}" data-cp="ans" data-v="${p.d}"><b>${p.ic}</b><span>${t(p.k)}</span><small>${p.d}</small></button>`).join("")}</div>
    <div class="muted small" style="text-align:center">${t("cp_keepTrying")}</div></div>`);
}
function cpStoryChord() { const F = CP; if (!F || F.phase !== "story") return; gvPlay(CP_SCENES[F.sc].d); cpSay(); }
/* the story is told by a voice (the band plays softly underneath) */
let CP_VOICE = null;
function cpSay() { const F = CP; if (!F || F.phase !== "story") return; cpHush();
  const a = CP_VOICE = new Audio(`assets/voice/cp${F.sc + 1}.mp3`); GV.vol = .45; a.onended = () => { if (CP_VOICE === a) GV.vol = 1; };
  a.play().catch(() => { GV.vol = 1; }); }
function cpHush() { if (CP_VOICE) { try { CP_VOICE.pause(); } catch (e) { } CP_VOICE = null; } GV.vol = 1; }
function cpQ() {
  const r = (a, b) => a + Math.floor(Math.random() * (b - a + 1)), prev = CP.cur;
  if (CP.key === "mix") { const k = NB_KEYS[r(0, NB_KEYS.length - 1)][0]; CP.k = k; }
  let d; do d = [1, 4, 5][r(0, 2)]; while (d === prev && (CP_LV[CP.lv].trip || Math.random() < .6)); return d;
}
/* the music never stops: a question = the band moves to a chord and stays there until you find it */
function cpStart() {
  const F = CP; Object.assign(F, { phase: "ask", i: 0, ok: 0, cur: 1, miss: false, k: F.key === "mix" ? "C" : F.key, run: (F.run || 0) + 1 });
  S.cplace = { ...(S.cplace || {}), seen: true, lv: F.lv, key: F.key }; save();
  gvStop(); F.phase = "home"; cpRender(); const run = F.run;
  gvPlay(1, () => { if (CP?.run === run) { clearTimeout(F.tm); F.tm = setTimeout(() => { if (CP?.run === run) cpNext(); }, cpBars(2) - 400); } });
}
const cpBars = n => n * 4 * 60 / GV.bpm * 1000;
function cpNext() {
  const F = CP; if (!F) return; if (F.i >= CP_N) return cpDone();
  /* the answer is only taken once the new chord is really sounding (it starts on the next bar) */
  const L = CP_LV[F.lv], run = F.run, go = () => { if (CP?.run !== run) return; F.cur = cpQ(); F.miss = false; if (F.phase !== "got") F.phase = "wait"; cpRender();
    gvPlay(F.cur, () => { if (CP?.run !== run) return; F.phase = "ask"; F.asked = Date.now(); cpRender();
      if (L.trip) { clearTimeout(F.tm); F.tm = setTimeout(() => { if (CP?.run === run && CP.phase === "ask") { F.i++; cpNext(); } }, cpBars(2) - 400); } }); };
  if (L.ref && F.cur !== 1) { F.cur = 1; F.phase = "home"; cpRender(); gvPlay(1, () => { if (CP?.run !== run) return; clearTimeout(F.tm); F.tm = setTimeout(go, cpBars(1) - 400); }); }
  else go();
}
function cpAnswer(v) {
  const F = CP; if (F.phase !== "ask") return; const L = CP_LV[F.lv];
  if (v === F.cur) {
    pinpon(); F.hit = v; if (!F.miss) F.ok++; F.i++; F.lastOk = true; F.flash = v; clearTimeout(F.tm);
    if (F.i >= CP_N) { F.phase = "got"; cpRender(); return setTimeout(cpDone, 700); }
    if (L.trip) { F.phase = "got"; cpRender(); const run = F.run; F.tm = setTimeout(() => { if (CP?.run === run) cpNext(); }, Math.max(400, cpBars(2) - 400 - (Date.now() - F.asked))); }
    else { F.phase = "got"; cpRender(); cpNext(); }
  } else {                       /* not yet: the music just keeps going — listen again and try */
    F.miss = true; const b = document.querySelector(`[data-cp="ans"][data-v="${v}"]`); if (b) { b.classList.add("nope"); setTimeout(() => b.classList.remove("nope"), 500); }
  }
}
function cpDone() { const F = CP; F.phase = "done"; if (typeof markDone === "function") markDone("cplace"); gvStop(); clearTimeout(F.tm); earn(Math.floor(F.ok / 2)); if (typeof refreshTop === "function") refreshTop(); if (F.ok >= 9) celebrate();
  S.cplaceLog = (S.cplaceLog || []).concat({ date: TK, key: F.key, lv: F.lv + 1, ok: F.ok, of: CP_N }).slice(-60); save(); cpRender(); }
document.addEventListener("click", e => {
  const b = e.target.closest("[data-cp]"); if (!b) return; const a = b.dataset.cp, F = CP;
  if (a === "open") return cpOpen();
  if (!F) return;
  if (a === "next") { if (F.sc < CP_SCENES.length - 1) { F.sc++; cpRender(); } else { gvStop(); cpHush(); S.cplace = { ...(S.cplace || {}), seen: true }; save(); F.phase = "set"; cpRender(); } }
  else if (a === "prev") { F.sc = Math.max(0, F.sc - 1); cpRender(); }
  else if (a === "replay" || a === "say") cpSay();
  else if (a === "story") { gvStop(); F.phase = "story"; F.sc = 0; cpRender(); }
  else if (a === "set") { F[b.dataset.k] = b.dataset.k === "lv" ? +b.dataset.v : b.dataset.v; cpRender(); }
  else if (a === "start") cpStart();
  else if (a === "settings") { gvStop(); cpHush(); F.phase = "set"; cpRender(); }
  else if (a === "ans") cpAnswer(+b.dataset.v);
});
document.addEventListener("click", e => { if (e.target.closest('[data-act="close"]') && CP) { CP.run = -1; clearTimeout(CP.tm); gvStop(); cpHush(); CP = null; } }, true);
