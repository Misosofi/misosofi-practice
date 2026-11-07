/* ===== The weekly recording for the teacher (required, audio) =====
   Once a week the child records one piece and sends it to the teacher. It shows the teacher that the practice
   is real. Teachers with time listen in the app; busy teachers tick "checked at the lesson" instead.
   The teacher can compare this week's recording with an earlier one. */
let WEEKREC = false;
const weekRecs = () => (S.weekRec ||= {});
const weekChk = () => S.weekChk || {};
const weekLeft = () => 7 - (((new Date(TK + "T12:00:00").getDay()) + 6) % 7);   /* days left until Sunday, today included */
function weekCard() {
  if (!S || typeof coach !== "function" || !coach()) return "";
  const r = weekRecs()[WK], c = weekChk()[WK];
  if (r || c) {
    const st = c ? (c.how === "lesson" ? t("wr_chkLesson") : t("wr_chkApp")) : t("wr_waiting");
    return `<div class="section"><div class="card stack wr-card done"><div class="section-head"><h2>🎙️ ${t("wr_h")}</h2><span class="pill g">✓</span></div>
     ${r ? `<div class="small">${t("wr_sentOn", { d: esc(fmt(r.date)), p: esc(S.pieces.find(p => p.id === r.piece)?.title || "") })}</div><audio controls preload="metadata" data-rec="${r.id}" style="width:100%"></audio>` : ""}
     <div class="small"><b>${st}</b></div></div></div>`;
  }
  const W = (S.wrPick && S.pieces.some(p => p.id === S.wrPick)) ? S.wrPick : S.pieces[0]?.id, left = weekLeft();
  return `<div class="section"><div class="card stack wr-card"><div class="section-head"><h2>🎙️ ${t("wr_h")}</h2><span class="pill ${left <= 2 ? "a" : "m"}">${t("wr_left", { n: left })}</span></div>
   <div class="small">${t("wr_why")}</div>
   ${S.pieces.length ? `<div class="chips">${S.pieces.map(p => `<button class="chip ${p.id === W ? "on" : ""}" data-wr="pick" data-id="${p.id}" ${WEEKREC ? "disabled" : ""}>${esc(p.title)}</button>`).join("")}</div>
   <button class="btn block ${WEEKREC && isRec ? "rec-on" : ""}" data-wr="rec" data-id="${W}">${WEEKREC && isRec ? "■ " + t("wr_stop") : "🎤 " + t("wr_rec")}</button>
   ${WEEKREC && isRec ? `<div class="muted small" style="text-align:center">${t("recNowInfo")}</div>` : ""}` : `<div class="muted small">${t("noPieces")}</div>`}</div></div>`;
}
/* called by saveRec() with the new recording id */
function weekRecSaved(id, pid, dur) {
  if (!WEEKREC) return; WEEKREC = false;
  const w = weekRecs(); w[WK] = { id, piece: pid || null, date: TK, dur: Math.round(dur || 0) };
  Object.keys(w).sort().slice(0, -12).forEach(k => delete w[k]);
}
document.addEventListener("click", e => {
  const b = e.target.closest("[data-wr]"); if (!b || !S || (typeof TS !== "undefined" && TS?.me)) return;
  if (b.dataset.wr === "pick") { S.wrPick = b.dataset.id; save(); refresh(); }
  else if (b.dataset.wr === "rec") { ac(); if (WEEKREC && isRec) { stopRec(); } else if (!isRec) { WEEKREC = true; startRec(b.dataset.id).then(() => refresh()); } }
});

/* ---------- teacher: this week's recording, compare with an earlier one, tick it off ---------- */
function TWeekCard(st, D) {
  const W = st.weekRec || {}, C = st.weekChk || {}, r = W[WK], c = C[WK];
  const recOf = x => x && (D.recs || []).find(y => y.id === x.id);
  const earlier = Object.keys(W).filter(k => k < WK).sort().reverse().map(k => ({ k, r: recOf(W[k]) })).filter(x => x.r);
  const cmp = TS.wrCmp && earlier.find(x => x.k === TS.wrCmp) || earlier[0];
  const piece = x => esc((st.pieces || []).find(p => p.id === x?.piece)?.title || "");
  return `<div class="card stack teacher wr-card"><div class="section-head"><h2>🎙️ ${t("wr_tH")}</h2>${c ? `<span class="pill g">✓ ${c.how === "lesson" ? t("wr_tLessonShort") : t("wr_tAppShort")}</span>` : r ? `<span class="pill a">${t("wr_tNew")}</span>` : `<span class="pill m">${t("wr_tNone")}</span>`}</div>
   ${r && recOf(r) ? `<div class="small"><b>${t("wr_thisWeek")}</b> · ${esc(fmt(r.date))} · ${piece(r)}</div><audio controls preload="metadata" data-trec="${r.id}" style="width:100%"></audio>` : `<div class="muted small">${t("wr_tNotYet")}</div>`}
   ${cmp ? `<div class="small"><b>${t("wr_compare")}</b> ${earlier.length > 1 ? `<select data-wrcmp="1" aria-label="Week">${earlier.map(x => `<option value="${x.k}" ${x.k === cmp.k ? "selected" : ""}>${esc(fmt(W[x.k].date))}</option>`).join("")}</select>` : esc(fmt(W[cmp.k].date))} · ${piece(W[cmp.k])}</div><audio controls preload="metadata" data-trec="${cmp.r.id}" style="width:100%"></audio>` : ""}
   ${c ? "" : `<div class="opts" style="grid-template-columns:1fr 1fr">${r ? `<button class="btn" data-act="tWr" data-sid="${st.id || TS.cur}" data-how="app">✓ ${t("wr_tApp")}</button>` : ""}<button class="btn soft" data-act="tWr" data-sid="${st.id || TS.cur}" data-how="lesson">✓ ${t("wr_tLesson")}</button></div>`}</div>`;
}
document.addEventListener("click", async e => {
  const b = e.target.closest('[data-act="tWr"]'); if (!b || typeof TS === "undefined" || !TS?.me) return;
  e.stopPropagation(); b.disabled = true; const sid = TS.cur, how = b.dataset.how;
  await Tdo(() => TwriteState(sid, d => { d.weekChk ||= {}; d.weekChk[WK] = { how, at: new Date().toISOString() }; }), t("saved"));
  const st = tStu(sid); if (st) { st.weekChk ||= {}; st.weekChk[WK] = { how }; } TrenderDetail();
}, true);
document.addEventListener("change", e => { if (e.target.dataset?.wrcmp && typeof TS !== "undefined") { TS.wrCmp = e.target.value; TrenderDetail(); } });
