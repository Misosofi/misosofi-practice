/* ===== 🏠 Home · Supermarket · Japan — feeling chords 1, 4 and 5 (the teacher's story) =====
   1 = HOME: lying on the couch eating crisps (Mum and Dad: "That's enough!" — he doesn't listen).
   4 = SUPERMARKET: the crisps are gone → buy more → back home → eat… again and again.
   5 = JAPAN: bored of that → a trip to Japan, sightseeing → and back HOME (1).
   Then: only the chord plays — "Where is he now?" */
const CP_PLACES = [{ d: 1, ic: "🛋️", k: "cp_home" }, { d: 4, ic: "🛒", k: "cp_shop" }, { d: 5, ic: "🗾", k: "cp_japan" }];
const CP_SCENES = [
  { d: 1, bg: "#FFF1D6", art: "🛋️🧒🥔", side: "😠👨 👩😠", k: "cp_s1" },
  { d: 4, bg: "#E3F4FF", art: "🛒🧒", side: "🥔🥔🥔", k: "cp_s2" },
  { d: 1, bg: "#FFF1D6", art: "🛋️🧒🥔", side: "😋", k: "cp_s3" },
  { d: 4, bg: "#E3F4FF", art: "🛒🧒", side: "🍪🥤", k: "cp_s4" },
  { d: 1, bg: "#FFF1D6", art: "🛋️🧒😐", side: "💤", k: "cp_s5" },
  { d: 5, bg: "#FFE3EA", art: "✈️🧒🗾", side: "🏯🍣🗻", k: "cp_s6" },
  { d: 1, bg: "#FFF1D6", art: "🛋️🧒😊", side: "🏠", k: "cp_s7" },
];
const CP_LV = [
  { n: "cp_lv1", ref: true, len: 1 },     /* home first, then one chord */
  { n: "cp_lv2", ref: false, len: 1 },    /* one chord, no home first */
  { n: "cp_lv3", ref: true, len: 3 },     /* home, then a little trip of 3 chords */
];
const CP_N = 10;
let CP = null;
const cpBase = () => (NB_KEYS.find(k => k[0] === CP.k) || NB_KEYS[0])[1];
/* close, smooth voicings (like at the piano): 1 = root position, 4 = 2nd inversion, 5 = 1st inversion, with a bass note */
function cpChord(d, when = 0, dur = 1.1) {
  const b = cpBase(), V = { 1: [0, 4, 7], 4: [0, 5, 9], 5: [-1, 2, 7] }[d], bass = { 1: 0, 4: 5, 5: 7 }[d];
  V.forEach(x => tone(b + x, when, dur, .17)); tone(b - 12 + bass, when, dur, .16);
}
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
      <div class="cp-scene sc-in" style="background:${s.bg}" data-cp="replay"><div class="cp-tag">${P.ic} ${s.d} = ${t(P.k)}</div><div class="cp-art">${s.art}</div><div class="cp-side">${s.side}</div><div class="cp-notes">♪ ♫ ♪</div></div>
      <div class="cp-text">${t(s.k)}</div>
      <div class="cp-dots">${CP_SCENES.map((x, i) => `<i class="${i === F.sc ? "on" : ""}"></i>`).join("")}</div>
      <div class="row" style="gap:8px">${F.sc ? `<button class="btn ghost" data-cp="prev">←</button>` : ""}<button class="btn grow" data-cp="next">${F.sc < CP_SCENES.length - 1 ? t("cp_next") + " →" : "🎧 " + t("cp_quiz")}</button></div></div>`);
    F.k = "C"; setTimeout(() => cpStoryChord(), 250); return;
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
  const L = CP_LV[F.lv], P = d => CP_PLACES.find(p => p.d === d), shown = F.q.map((d, i) => `<span class="cp-slot ${i < F.got.length ? "ok" : ""} ${F.phase === "reveal" && !F.lastOk ? "bad" : ""}">${i < F.got.length || F.phase === "reveal" ? P(d).ic : "?"}</span>`).join("");
  openSheet(`<div class="stack cp">${head}
    <div class="fl-top"><span>${F.i + 1} / ${CP_N}</span><span>✓ ${F.ok}</span></div>
    <div class="nb-key">🔑 ${esc(CP.k)} ${t("nb_major")}</div>
    <div class="cp-where">${F.phase === "listen" ? "👂 " + t("nb_listen") : F.phase === "reveal" ? (F.lastOk ? "✅ " : "❌ ") + F.q.map(d => P(d).ic + " " + d).join(" → ") : "🤔 " + t(L.len > 1 ? "cp_whereN" : "cp_where")}</div>
    <div class="nb-slots">${shown}</div>
    <div class="cp-btns">${CP_PLACES.map(p => `<button class="cp-ans" data-cp="ans" data-v="${p.d}" ${F.phase !== "ask" ? "disabled" : ""}><b>${p.ic}</b><span>${t(p.k)}</span><small>${p.d}</small></button>`).join("")}</div>
    <div class="row" style="gap:8px"><button class="btn soft grow" data-cp="again">🔁 ${t("nb_again")}</button><button class="btn soft grow" data-cp="home1">🛋️ ${t("cp_hearHome")}</button></div></div>`);
}
function cpStoryChord() {
  const F = CP; if (!F || F.phase !== "story") return; const d = CP_SCENES[F.sc].d;
  [0, .75, 1.5].forEach(w => cpChord(d, w, .7));        /* the chord again and again (like the crisps…) */
}
function cpQ() {
  const r = (a, b) => a + Math.floor(Math.random() * (b - a + 1)), L = CP_LV[F_lv()], prev = CP.q?.[0];
  if (CP.key === "mix") { const k = NB_KEYS[r(0, NB_KEYS.length - 1)][0]; CP.newKey = k !== CP.k; CP.k = k; }
  if (L.len === 1) { let d; do d = [1, 4, 5][r(0, 2)]; while (d === prev && Math.random() < .6); return [d]; }
  const q = []; for (let i = 0; i < L.len; i++) { let d; do d = [1, 4, 5][r(0, 2)]; while (i && d === q[i - 1]); q.push(d); } return q;
}
const F_lv = () => CP.lv;
function cpPlay(after = 0) {
  const L = CP_LV[CP.lv]; let w = after / 1000;
  if (L.ref) { cpChord(1, w, .9); w += 1.1; }
  CP.q.forEach(d => { cpChord(d, w, .9); w += 1.05; });
  return w * 1000 + 200;
}
function cpStart() {
  const F = CP; Object.assign(F, { phase: "listen", i: 0, ok: 0, q: null, got: [], k: F.key === "mix" ? "C" : F.key, run: (F.run || 0) + 1 });
  S.cplace = { ...(S.cplace || {}), seen: true, lv: F.lv, key: F.key }; save(); cpNext();
}
function cpNext() {
  const F = CP; if (!F) return; if (F.i >= CP_N) return cpDone();
  F.q = cpQ(); F.got = []; F.phase = "listen"; cpRender(); const run = F.run, end = cpPlay(300);
  clearTimeout(F.tm); F.tm = setTimeout(() => { if (CP?.run === run && CP.phase === "listen") { CP.phase = "ask"; cpRender(); } }, end);
}
function cpJudge(ok) {
  const F = CP; F.lastOk = ok; if (ok) F.ok++; F.phase = "reveal"; cpRender(); try { ding(ok); } catch (e) { }
  F.i++; clearTimeout(F.tm); F.tm = setTimeout(cpNext, ok ? 1000 : 2600);
  if (!ok) setTimeout(() => cpPlay(0), 500);
}
function cpDone() { const F = CP; F.phase = "done"; earn(Math.floor(F.ok / 2)); if (typeof refreshTop === "function") refreshTop(); if (F.ok >= 9) celebrate();
  S.cplaceLog = (S.cplaceLog || []).concat({ date: TK, key: F.key, lv: F.lv + 1, ok: F.ok, of: CP_N }).slice(-60); save(); cpRender(); }
document.addEventListener("click", e => {
  const b = e.target.closest("[data-cp]"); if (!b) return; const a = b.dataset.cp, F = CP;
  if (a === "open") return cpOpen();
  if (!F) return;
  if (a === "next") { if (F.sc < CP_SCENES.length - 1) { F.sc++; cpRender(); } else { S.cplace = { ...(S.cplace || {}), seen: true }; save(); F.phase = "set"; cpRender(); } }
  else if (a === "prev") { F.sc = Math.max(0, F.sc - 1); cpRender(); }
  else if (a === "replay") cpStoryChord();
  else if (a === "story") { F.phase = "story"; F.sc = 0; cpRender(); }
  else if (a === "set") { F[b.dataset.k] = b.dataset.k === "lv" ? +b.dataset.v : b.dataset.v; cpRender(); }
  else if (a === "start") cpStart();
  else if (a === "settings") { F.phase = "set"; cpRender(); }
  else if (a === "again") { if (F.q) cpPlay(0); }
  else if (a === "home1") cpChord(1, 0, 1.2);
  else if (a === "ans") { if (F.phase !== "ask") return; const v = +b.dataset.v, want = F.q[F.got.length];
    if (v === want) { F.got.push(v); if (F.got.length === F.q.length) cpJudge(true); else cpRender(); } else cpJudge(false); }
});
document.addEventListener("click", e => { if (e.target.closest('[data-act="close"]') && CP) { CP.run = -1; clearTimeout(CP.tm); CP = null; } }, true);
