/* ===== ⚡ Flash notes — "3, 2, 1, Go!" =====
   A card flashes for a moment and disappears. Then: "Which note was it?"
   Answer by playing it on the piano (microphone, exact key), tapping the name, or saying it out loud (self-check).
   The moment the answer is right, the next card flashes — so the eyes are always one step ahead, like sight-reading.
   Cards: 1 note → 3 notes → chords. Coins only for right answers (piano or tap), never for "say it". */
const FL_LV = [
  { id: "t1", clef: "treble", lo: 28, hi: 32, n: "Treble · Do–So" },
  { id: "t2", clef: "treble", lo: 28, hi: 35, n: "Treble · middle Do – high Do" },
  { id: "t3", clef: "treble", lo: 25, hi: 42, n: "Treble · whole staff + ledger lines" },
  { id: "b1", clef: "bass", lo: 21, hi: 25, n: "Bass · Do–So" },
  { id: "b2", clef: "bass", lo: 18, hi: 28, n: "Bass · whole staff" },
  { id: "b3", clef: "bass", lo: 12, hi: 28, n: "Bass · low ledger lines (double-line Do…)" },
];
const FL_KIND = ["1", "3", "ch"], FL_SHOW = [2000, 1200, 700, 400], FL_N = 10;
let FL = null;
const flLv = () => FL_LV.find(x => x.id === FL.lv) || FL_LV[0];
const flMidi = d => midiOf(d);
const flName = d => pcName(flMidi(d));

/* a new card: one note, three notes moving by steps/skips, or a triad (root position or an inversion) */
function flCard() {
  const L = flLv(), r = (a, b) => a + Math.floor(Math.random() * (b - a + 1)), prev = FL.card?.ds?.[0];
  if (FL.kind === "1") { let d; do d = r(L.lo, L.hi); while (d === prev && L.hi > L.lo); return { ds: [d] }; }
  if (FL.kind === "3") {
    for (let k = 0; k < 40; k++) { const ds = [r(L.lo, L.hi)]; for (let i = 0; i < 2; i++) ds.push(ds[i] + [-2, -1, 0, 1, 2][r(0, 4)]);
      if (ds.every(d => d >= L.lo && d <= L.hi)) return { ds }; }
    return { ds: [L.lo, L.lo + 1, L.lo + 2] };
  }
  for (let k = 0; k < 40; k++) { const b = r(L.lo, L.hi - 4), inv = r(0, 2), shape = [[0, 2, 4], [0, 2, 5], [0, 3, 5]][inv], ds = shape.map(x => b + x);
    if (ds[2] <= L.hi) return { ds, chord: true, inv }; }
  return { ds: [L.lo, L.lo + 2, L.lo + 4], chord: true, inv: 0 };
}
/* the card picture: the staff with the note(s); a chord is stacked */
function flSVG(card, hidden) {
  const L = flLv(), clef = L.clef, top = 34, gap = 12, bot = top + 4 * gap, base = clef === "treble" ? 30 : 18, y = d => bot - (d - base) * gap / 2, W = 240;
  const ys = card.ds.map(y), y0 = Math.min(0, ...ys.map(v => v - 20)), y1 = Math.max(118, ...ys.map(v => v + 20));
  let s = `<svg viewBox="0 ${y0} ${W} ${y1 - y0}" width="100%" role="img" aria-label="card">`;
  for (let i = 0; i < 5; i++) s += `<line x1="4" x2="${W - 4}" y1="${top + i * gap}" y2="${top + i * gap}" stroke="${INK}" stroke-width="1.3"/>`;
  s += clefGlyph(clef, 8, top, gap);
  if (!hidden) {
    if (card.chord) { const cx = 150; card.ds.forEach((d, i) => { const clash = i && card.ds[i] - card.ds[i - 1] === 1; s += noteHead({ d, dur: 4 }, clash ? cx + 13 : cx, y, base); }); }
    else card.ds.forEach((d, i) => { s += noteHead({ d, dur: 4 }, card.ds.length === 1 ? 150 : 100 + i * 50, y, base); });
  } else s += `<text x="150" y="${top + 2 * gap + 12}" text-anchor="middle" font-size="40" font-weight="900" fill="#c9c2dc">?</text>`;
  return s + "</svg>";
}

function flHome() {
  return `<div class="card fex-quick fl-quick"><span class="rs-quick-ic">⚡</span><span class="grow"><b>${t("fl_h")}</b><span class="small muted">${t("fl_sub")}</span>
   <span style="margin-top:6px"><button class="btn sm" data-fl="open">▶ ${t("fl_go")}</button></span></span></div>`;
}
function flOpen() {
  const st = S.flash ||= {};
  FL = { lv: st.lv || "t1", kind: st.kind || "1", show: st.show || 1200, ans: st.ans || "piano", phase: "set" };
  flRender();
}
function flRender() {
  const F = FL; if (!F) return;
  const head = `<div class="act-head"><h2>⚡ ${t("fl_h")}</h2><button class="icon-btn" data-act="close" aria-label="Close">${I.close}</button></div>`;
  if (F.phase === "set") {
    const ch = (k, v, l) => `<button class="chip ${String(F[k]) === String(v) ? "on" : ""}" data-fl="set" data-k="${k}" data-v="${v}">${l}</button>`;
    const best = S.flash?.best?.[F.lv + F.kind];
    openSheet(`<div class="stack fl">${head}
      <div class="muted small">${t("fl_how")}</div>
      <div class="label">${t("fl_lv")}</div><div class="chips">${FL_LV.map(x => ch("lv", x.id, esc(x.n))).join("")}</div>
      <div class="label">${t("fl_kind")}</div><div class="chips">${ch("kind", "1", t("fl_k1"))}${ch("kind", "3", t("fl_k3"))}${ch("kind", "ch", t("fl_kch"))}</div>
      <div class="label">${t("fl_show")}</div><div class="chips">${FL_SHOW.map(ms => ch("show", ms, (ms / 1000) + " s")).join("")}</div>
      <div class="label">${t("fl_ans")}</div><div class="chips">${ch("ans", "piano", "🎹 " + t("fl_aPiano"))}${ch("ans", "tap", "👆 " + t("fl_aTap"))}${ch("ans", "say", "🗣 " + t("fl_aSay"))}</div>
      ${best != null ? `<div class="small muted">🏆 ${t("fl_best", { n: best, of: FL_N })}</div>` : ""}
      <button class="btn block" data-fl="start" style="padding:18px;font-size:1.2rem">3 · 2 · 1 · Go!</button></div>`);
    return;
  }
  if (F.phase === "done") {
    const coins = F.ans === "say" ? 0 : Math.floor(F.ok / 2), stars = F.ok >= 9 ? 3 : F.ok >= 7 ? 2 : F.ok >= 5 ? 1 : 0;
    openSheet(`<div class="stack fl" style="text-align:center">${head}
      <div class="fl-stars">${"⭐".repeat(stars) || "💪"}</div><div class="big-msg">${t("fl_score", { n: F.ok, of: FL_N })}</div>
      ${F.ans === "say" ? `<div class="small muted">${t("fl_sayNoCoin")}</div>` : coins ? `<div class="price fl-coins">${I.coin} +${coins}</div>` : ""}
      ${F.miss.length ? `<div class="small muted">${t("fl_miss")}: ${F.miss.map(c => c.ds.map(flName).join("-")).join(", ")}</div>` : ""}
      <button class="btn block" data-fl="start">🔁 ${t("fl_again")}</button><button class="btn ghost block" data-fl="settings">⚙️ ${t("fl_change")}</button></div>`);
    return;
  }
  const c = F.card, hidden = F.phase === "hide", reveal = F.phase === "reveal";
  const got = F.got.map(d => `<b class="fl-got">${esc(flName(d))}</b>`).join(" ");
  const names = SOL.map((n, i) => ({ n: (S.abc ? LET[i] + " / " : "") + n, i }));
  openSheet(`<div class="stack fl">${head}
    <div class="fl-top"><span>${F.i + 1} / ${FL_N}</span><span>✓ ${F.ok}</span></div>
    <div class="fl-card ${F.phase}">${F.phase === "count" ? `<div class="fl-count" id="flCount">${F.cnt}</div>` : flSVG(c, hidden)}</div>
    <div class="fl-msg" id="flMsg">${reveal ? (F.lastOk ? "✅ " : "❌ ") + c.ds.map(flName).join(" – ") : hidden ? (F.ans === "piano" ? "🎹 " + t("fl_playIt") : F.ans === "tap" ? "👆 " + t("fl_tapIt") : "🗣 " + t("fl_sayIt")) : ""}</div>
    ${c && c.ds.length > 1 && hidden ? `<div class="fl-prog">${got || "&nbsp;"}</div>` : ""}
    ${hidden && F.ans === "tap" ? `<div class="fl-names">${names.map(x => `<button class="btn soft" data-fl="tap" data-i="${x.i}">${x.n}</button>`).join("")}</div>` : ""}
    ${hidden && F.ans === "say" ? `<button class="btn block" data-fl="show">👀 ${t("fl_check")}</button>` : ""}
    ${F.phase === "self" ? `<div class="fl-self"><button class="btn block" data-fl="self" data-v="1">✓ ${t("fl_iWasRight")}</button><button class="btn ghost block" data-fl="self" data-v="0">✗ ${t("fl_notYet")}</button></div>` : ""}
    ${F.ans === "piano" && F.phase !== "count" ? micLiveHTML() : ""}</div>`);
}
/* the flow */
async function flStart() {
  const F = FL; Object.assign(F, { i: 0, ok: 0, miss: [], card: null, got: [], phase: "count", cnt: 3, run: (F.run || 0) + 1 });
  S.flash = { ...(S.flash || {}), lv: F.lv, kind: F.kind, show: F.show, ans: F.ans }; save();
  if (F.ans === "piano") { const ok = await micStart("flash", o => micShow(o), flHeard); if (!ok) { F.ans = "tap"; } }
  const run = F.run; flRender();
  for (const n of [3, 2, 1]) { if (FL?.run !== run) return; F.cnt = n; const e = document.getElementById("flCount"); if (e) e.textContent = n; try { tone(84, 0, .12, .18); } catch (e) { } await new Promise(r => setTimeout(r, 650)); }
  if (FL?.run !== run) return; F.cnt = "Go!"; const e = document.getElementById("flCount"); if (e) e.textContent = "Go!"; try { tone(96, 0, .2, .2); } catch (e) { }
  await new Promise(r => setTimeout(r, 450)); flNext();
}
function flNext() {
  const F = FL; if (!F) return;
  if (F.i >= FL_N) return flDone();
  F.card = flCard(); F.got = []; F.phase = "show"; flRender(); const run = F.run, i = F.i;
  if (F.ans === "piano") pitchMute(250);
  clearTimeout(F.tm); F.tm = setTimeout(() => { if (FL?.run === run && FL.i === i && FL.phase === "show") { FL.phase = "hide"; flRender(); } }, F.show);
}
function flJudge(ok) {
  const F = FL; F.lastOk = ok; if (ok) F.ok++; else F.miss.push(F.card);
  try { ding(ok); } catch (e) { }
  if (ok) { F.i++; F.phase = "reveal"; flRender(); clearTimeout(F.tm); F.tm = setTimeout(flNext, 350); }       /* right → the next card flashes straight away */
  else { F.phase = "reveal"; flRender(); F.i++; clearTimeout(F.tm); F.tm = setTimeout(flNext, 1400); }
}
/* piano: each heard note must be the next note of the card, in the exact octave (the right key) */
function flHeard(midi) {
  const F = FL; if (!F || !["show", "hide"].includes(F.phase)) return;
  if (F.phase === "show") { F.phase = "hide"; }
  const want = F.card.ds[F.got.length];
  if (midi === flMidi(want)) { F.got.push(want); if (F.got.length === F.card.ds.length) return flJudge(true); flRender(); }
  else if (Math.abs(midi - flMidi(want)) <= 24) flJudge(false);
}
function flDone() {
  const F = FL; F.phase = "done"; micStop();
  if (F.ans !== "say") { earn(Math.floor(F.ok / 2)); const B = S.flash.best ||= {}, k = F.lv + F.kind; if (B[k] == null || F.ok > B[k]) B[k] = F.ok; }
  if (F.ok >= 9) celebrate(); save(); flRender();
}
document.addEventListener("click", e => {
  const b = e.target.closest("[data-fl]"); if (!b) return; const a = b.dataset.fl, F = FL;
  if (a === "open") return flOpen();
  if (!F) return;
  if (a === "set") { F[b.dataset.k] = b.dataset.k === "show" ? +b.dataset.v : b.dataset.v; flRender(); }
  else if (a === "start") flStart();
  else if (a === "settings") { micStop(); F.phase = "set"; flRender(); }
  else if (a === "tap") { if (!["show", "hide"].includes(F.phase)) return; const want = F.card.ds[F.got.length], i = +b.dataset.i;
    if (((want % 7) + 7) % 7 === i) { F.got.push(want); if (F.got.length === F.card.ds.length) flJudge(true); else flRender(); } else flJudge(false); }
  else if (a === "show") { F.phase = "self"; F.lastOk = null; flRender(); const c = document.querySelector(".fl-card"); if (c) c.innerHTML = flSVG(F.card, false); const m = document.getElementById("flMsg"); if (m) m.textContent = F.card.ds.map(flName).join(" – "); }
  else if (a === "self") { const ok = b.dataset.v === "1"; F.lastOk = ok; if (ok) F.ok++; else F.miss.push(F.card); F.i++; flNext(); }
});
/* closing the sheet stops the round and the microphone */
document.addEventListener("click", e => { if (e.target.closest('[data-act="close"]') && FL) { FL.run = -1; clearTimeout(FL.tm); micStop(); FL = null; } }, true);
