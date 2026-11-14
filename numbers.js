/* ===== 🔢 Number ears (relative pitch) =====
   The app sets the key (I–IV–V–I and "1"), then plays a note or a short tune.
   The child SAYS the numbers (1–8) and PLAYS them on the piano (the microphone checks), or taps the numbers.
   The same numbers work in every key. Optional: the whole round is recorded and sent to the teacher. */
const NB_KEYS = [["C", 60], ["G", 55], ["D", 62], ["A", 57], ["E", 64], ["B", 59], ["F♯", 66], ["D♭", 61], ["A♭", 56], ["E♭", 63], ["B♭", 58], ["F", 65]];
/* steps from easy to hard: always starting on 1 at first, with clear shapes (1 3 5, 1 2 3), then 4, then anything */
const NB_LV = [
  { n: "1 3 5", pool: [1, 3, 5], from1: true, len: [2, 3] },
  { n: "1 2 3", pool: [1, 2, 3], from1: true, len: [2, 3] },
  { n: "1 2 3 4 5", pool: [1, 2, 3, 4, 5], from1: true, len: [2, 3] },
  { n: "1–5 · any start", pool: [1, 2, 3, 4, 5], from1: false, len: [1, 3] },
  { n: "1–8 · from 1", pool: [1, 2, 3, 4, 5, 6, 7, 8], from1: true, len: [2, 3] },
  { n: "1–8 · any start", pool: [1, 2, 3, 4, 5, 6, 7, 8], from1: false, len: [1, 3] },
];
const NB_STEP = [0, 0, 2, 4, 5, 7, 9, 11, 12], NB_N = 8;
let NB = null;
const nbKey = () => NB_KEYS.find(k => k[0] === NB.k) || NB_KEYS[0];

function nbHome() {
  return `<div class="card fex-quick nb-quick"><span class="rs-quick-ic">🔢</span><span class="grow"><b>${t("nb_h")}</b><span class="small muted">${t("nb_sub")}</span>
   <span style="margin-top:6px"><button class="btn sm" data-nb="open">▶ ${t("fl_go")}</button></span></span></div>`;
}
function nbOpen() {
  const st = S.numb || {};
  NB = { key: st.key || "C", lv: st.lv ?? 0, ans: st.ans || "piano", rec: !!st.rec, phase: "set" };
  nbRender();
}
/* a question: a little tune from this step's numbers — starting on 1 in the easy steps */
function nbQ() {
  const r = (a, b) => a + Math.floor(Math.random() * (b - a + 1)), L = NB_LV[NB.lv] || NB_LV[0], P = L.pool, len = r(L.len[0], L.len[1]);
  const ds = [L.from1 ? 1 : P[r(0, P.length - 1)]];
  for (let i = 1; i < len; i++) { const near = P.filter(d => d !== ds[i - 1] && Math.abs(d - ds[i - 1]) <= (P.length > 5 ? 7 : 4)); ds.push(near[r(0, near.length - 1)]); }
  if (NB.key === "mix") { const k = NB_KEYS[r(0, NB_KEYS.length - 1)][0]; NB.newKey = k !== NB.k; NB.k = k; }
  return ds;
}
const nbMidi = d => nbKey()[1] + NB_STEP[d];
/* "this is the key": I – IV – V – I, then 1 */
function nbCadence() {
  const b = nbKey()[1], ch = [[0, 4, 7], [0, 5, 9], [-1, 2, 7], [0, 4, 7]]; let w = 0;
  ch.forEach(c => { c.forEach(x => tone(b + x, w, .7, .16)); tone(b - 12 + (c === ch[2] ? 7 : c === ch[1] ? 5 : 0), w, .7, .14); w += .62; });
  tone(b, w + .15, 1, .3); return (w + 1.2) * 1000;
}
function nbPlayQ(after = 0) { const ds = NB.q; ds.forEach((d, i) => tone(nbMidi(d), after / 1000 + i * .75, .9, .32)); const ms = after + ds.length * 750 + 300; pitchMute(ms); return ms; }

function nbRender() {
  const F = NB; if (!F) return;
  const head = `<div class="act-head"><h2>🔢 ${t("nb_h")}</h2><button class="icon-btn" data-act="close" aria-label="Close">${I.close}</button></div>`;
  if (F.phase === "set") {
    const ch = (k, v, l) => `<button class="chip ${String(F[k]) === String(v) ? "on" : ""}" data-nb="set" data-k="${k}" data-v="${v}">${l}</button>`;
    openSheet(`<div class="stack nb">${head}<div class="muted small">${t("nb_how")}</div>
      <div class="label">${t("nb_key")}</div><div class="chips">${NB_KEYS.map(k => ch("key", k[0], esc(k[0]) + " " + t("nb_major"))).join("")}${ch("key", "mix", "🔀 " + t("nb_mix"))}</div>
      <div class="label">${t("nb_step")}</div><div class="chips">${NB_LV.map((l, i) => ch("lv", i, `${i + 1}. ${l.n}`)).join("")}</div>
      <div class="label">${t("fl_ans")}</div><div class="chips">${ch("ans", "piano", "🎹 " + t("nb_aPiano"))}${ch("ans", "tap", "👆 " + t("fl_aTap"))}</div>
      <label class="nb-rec"><input type="checkbox" data-nb="recTog" ${F.rec ? "checked" : ""}> 🎙 ${t("nb_rec")}</label>
      <button class="btn block" data-nb="start" style="padding:18px;font-size:1.2rem">▶ ${t("nb_start")}</button></div>`);
    return;
  }
  if (F.phase === "done") {
    const stars = F.ok >= 8 ? 3 : F.ok >= 6 ? 2 : F.ok >= 4 ? 1 : 0, coins = Math.floor(F.ok / 2);
    openSheet(`<div class="stack nb" style="text-align:center">${head}<div class="fl-stars">${"⭐".repeat(stars) || "💪"}</div>
      <div class="big-msg">${t("fl_score", { n: F.ok, of: NB_N })}</div>${coins ? `<div class="price fl-coins">${I.coin} +${coins}</div>` : ""}
      ${F.sent ? `<div class="small">📨 ${t("nb_sent")}</div>` : ""}
      <button class="btn block" data-nb="start">🔁 ${t("fl_again")}</button><button class="btn ghost block" data-nb="settings">⚙️ ${t("fl_change")}</button></div>`);
    return;
  }
  const k = nbKey(), slots = F.q.map((d, i) => `<span class="nb-slot ${i < F.got.length ? "ok" : ""} ${F.phase === "reveal" && !F.lastOk ? "bad" : ""}">${i < F.got.length || F.phase === "reveal" ? d : "?"}</span>`).join("");
  openSheet(`<div class="stack nb">${head}
    <div class="fl-top"><span>${F.i + 1} / ${NB_N}</span><span>${F.recOn ? "🔴 REC · " : ""}✓ ${F.ok}</span></div>
    <div class="nb-key">🔑 ${esc(k[0])} ${t("nb_major")} · 1 = ${esc(pcName(k[1]))}</div>
    <div class="nb-slots">${slots}</div>
    <div class="fl-msg">${F.phase === "listen" ? "👂 " + t("nb_listen") : F.phase === "reveal" ? (F.lastOk ? "✅ " : "❌ ") + F.q.join(" – ") : F.ans === "piano" ? "🗣🎹 " + t("nb_sayPlay") : "🗣👆 " + t("nb_sayTap")}</div>
    ${F.ans === "tap" && F.phase === "ask" ? `<div class="nb-pad">${[1, 2, 3, 4, 5, 6, 7, 8].filter(n => n <= Math.max(F.top, 5)).map(n => `<button class="btn soft" data-nb="tap" data-v="${n}">${n}</button>`).join("")}</div>` : ""}
    <div class="row" style="gap:8px"><button class="btn soft grow" data-nb="again">🔁 ${t("nb_again")}</button><button class="btn soft grow" data-nb="one">🎵 ${t("nb_one")}</button></div>
    ${F.ans === "piano" ? micLiveHTML() : ""}</div>`);
}
async function nbStart() {
  const F = NB; Object.assign(F, { i: 0, ok: 0, got: [], q: null, k: F.key === "mix" ? NB_KEYS[0][0] : F.key, run: (F.run || 0) + 1, sent: false, recOn: false });
  S.numb = { key: F.key, lv: F.lv, ans: F.ans, rec: F.rec }; save(); F.top = Math.max(...NB_LV[F.lv].pool);
  if (F.ans === "piano") { const ok = await micStart("numbers", o => micShow(o), nbHeard); if (!ok) F.ans = "tap"; }
  if (F.rec) await nbRecStart();
  nbNext(true);
}
function nbNext(first) {
  const F = NB; if (!F) return; if (F.i >= NB_N) return nbDone();
  F.q = nbQ(); F.got = []; F.phase = "listen"; nbRender(); const run = F.run;
  const ms = (first || F.newKey) ? nbCadence() : 0; F.newKey = false;
  const end = nbPlayQ(ms + (ms ? 300 : 0));
  clearTimeout(F.tm); F.tm = setTimeout(() => { if (NB?.run === run && NB.phase === "listen") { NB.phase = "ask"; nbRender(); } }, end);
}
const nbPc = m => ((m % 12) + 12) % 12;
function nbHeard(midi) {
  const F = NB; if (!F || !["ask", "listen"].includes(F.phase)) return; if (F.phase === "listen") return;
  const want = nbMidi(F.q[F.got.length]);
  if (nbPc(midi) === nbPc(want)) { F.got.push(F.q[F.got.length]); if (F.got.length === F.q.length) nbJudge(true); else nbRender(); }
  else nbJudge(false);
}
function nbJudge(ok) {
  const F = NB; F.lastOk = ok; if (ok) F.ok++; F.phase = "reveal"; nbRender(); try { ding(ok); } catch (e) { }
  F.i++; clearTimeout(F.tm);
  if (ok) F.tm = setTimeout(() => nbNext(), 900);
  else { const ms = nbPlayQ(450); F.tm = setTimeout(() => nbNext(), ms + 700); }
}
async function nbDone() {
  const F = NB; F.phase = "done"; earn(Math.floor(F.ok / 2)); if (typeof refreshTop === "function") refreshTop(); if (F.ok >= 7) celebrate();
  S.numbLog = (S.numbLog || []).concat({ date: TK, key: F.key, lv: F.lv + 1, ok: F.ok, of: NB_N }).slice(-60); save();
  if (F.recOn) await nbRecStop(true);
  micStop(); nbRender();
}
/* recording the whole round (the app's sounds, the child's voice and the piano) → sent to the teacher */
async function nbRecStart() {
  const F = NB; let st = (typeof PITCH !== "undefined" && PITCH.stream) || null;
  try { if (!st) { st = await navigator.mediaDevices.getUserMedia({ audio: true }); F.ownSt = st; } } catch (e) { toast(t("micBlocked")); return; }
  let mr; try { mr = new MediaRecorder(st, { audioBitsPerSecond: 64000 }); } catch (e) { try { mr = new MediaRecorder(st); } catch (e2) { return; } }
  F.mr = mr; F.chunks = []; F.t0 = Date.now(); F.recOn = true;
  mr.ondataavailable = e => { if (e.data.size) F.chunks.push(e.data); };
  mr.start(1000); F.recCap = setTimeout(() => { if (mr.state !== "inactive") mr.stop(); }, 6 * 60 * 1000);
}
function nbRecStop(send) {
  const F = NB; if (!F?.mr) return; clearTimeout(F.recCap); const mr = F.mr; F.mr = null; F.recOn = false;
  return new Promise(res => {
    mr.onstop = async () => {
      F.ownSt?.getTracks().forEach(x => x.stop()); F.ownSt = null;
      if (!send) return res();
      const blob = new Blob(F.chunks, { type: mr.mimeType || F.chunks[0]?.type || "audio/mp4" }); if (blob.size < 500) return res();
      const id = uid(), row = { id, student_id: ME, kind: "audio", path: `${ME}/${id}.${extOf(blob)}`, seconds: Math.max(1, Math.round((Date.now() - F.t0) / 1000)), piece_id: null };
      MEM[id] = blob; try { await idbPut(id, blob); } catch (e) { }
      S.remoteRecs ||= []; S.remoteRecs.unshift({ id, kind: "audio", date: TK, dur: row.seconds, piece: null, listened: false, heart: false, comment: "", path: row.path, remote: true, pending: true, what: "🔢 " + t("nb_h") });
      queue({ k: "rec:" + id, t: "recordings", a: "rec", row, ctype: blob.type || "audio/mp4" }); saveOut();
      S.numbRecs = (S.numbRecs || []).concat({ id, date: TK, key: F.key, ok: F.ok }).slice(-30); save(); F.sent = true; res();
    };
    if (mr.state !== "inactive") mr.stop(); else mr.onstop();
  });
}
document.addEventListener("click", e => {
  const b = e.target.closest("[data-nb]"); if (!b) return; const a = b.dataset.nb, F = NB;
  if (a === "open") return nbOpen();
  if (!F) return;
  if (a === "set") { F[b.dataset.k] = b.dataset.k === "lv" ? +b.dataset.v : b.dataset.v; nbRender(); }
  else if (a === "recTog") F.rec = b.checked;
  else if (a === "start") nbStart();
  else if (a === "settings") { micStop(); F.phase = "set"; nbRender(); }
  else if (a === "again") { if (F.q && F.phase !== "set") nbPlayQ(0); }
  else if (a === "one") { tone(nbKey()[1], 0, 1, .3); pitchMute(1100); }
  else if (a === "tap") { if (F.phase !== "ask") return; const n = +b.dataset.v, want = F.q[F.got.length];
    if (n === want || (n === 8 && want === 1) || (n === 1 && want === 8)) { F.got.push(want); if (F.got.length === F.q.length) nbJudge(true); else nbRender(); } else nbJudge(false); }
});
/* closing stops the round; a recording in progress is still sent */
document.addEventListener("click", e => { if (e.target.closest('[data-act="close"]') && NB && NB.phase !== "set") { NB.run = -1; clearTimeout(NB.tm); if (NB.recOn) nbRecStop(true); micStop(); NB = null; } }, true);
