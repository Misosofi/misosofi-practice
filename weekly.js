/* ===== The weekly recording for the teacher (required, audio) =====
   Once a week the child records one piece and sends it to the teacher (submission only — nothing to approve).
   Teachers listen when they have time or check the playing at the lesson, and can compare with an earlier week. */
let WEEKREC = false;
const weekRecs = () => (S.weekRec ||= {});
const weekLeft = () => 7 - (((new Date(TK + "T12:00:00").getDay()) + 6) % 7);   /* days left until Sunday, today included */
function weekCard() {
  if (!S || typeof coach !== "function" || !coach()) return "";
  const r = weekRecs()[WK];
  if (r) {
    const msg = r && (S.remoteRecs || []).find(x => x.id === r.id)?.comment;
    return `<div class="section"><div class="card stack wr-card done"><div class="section-head"><h2>🎙️ ${t("wr_h")}</h2><span class="pill g">✓</span></div>
     ${r ? `<div class="small">${t("wr_sentOn", { d: esc(fmt(r.date)), p: esc(S.pieces.find(p => p.id === r.piece)?.title || "") })}</div><audio controls preload="metadata" data-rec="${r.id}" style="width:100%"></audio>` : ""}
     ${msg ? `<div class="tcomment"><strong>${t("teacherSays")}:</strong> ${esc(msg)}</div>` : ""}</div></div>`;
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

/* ---------- teacher: this week's recording and an earlier one to compare. No buttons to press:
   the teacher listens when there is time, or checks it at the lesson. A message is optional. ---------- */
function TWeekCard(st, D) {
  const W = st.weekRec || {}, r = W[WK];
  const recOf = x => x && (D.recs || []).find(y => y.id === x.id);
  const earlier = Object.keys(W).filter(k => k < WK).sort().reverse().map(k => ({ k, r: recOf(W[k]) })).filter(x => x.r);
  const cmp = TS.wrCmp && earlier.find(x => x.k === TS.wrCmp) || earlier[0];
  const piece = x => esc((st.pieces || []).find(p => p.id === x?.piece)?.title || "");
  const R = recOf(r);
  return `<div class="card stack teacher wr-card"><div class="section-head"><h2>🎙️ ${t("wr_tH")}</h2>${r ? `<span class="pill g">✓ ${t("wr_tSent")}</span>` : `<span class="pill m">${t("wr_tNone")}</span>`}</div>
   ${R ? `<div class="small"><b>${t("wr_thisWeek")}</b> · ${esc(fmt(r.date))} · ${piece(r)}</div><audio controls preload="metadata" data-trec="${r.id}" style="width:100%"></audio>` : `<div class="muted small">${t("wr_tNotYet")}</div>`}
   ${cmp ? `<div class="small"><b>${t("wr_compare")}</b> ${earlier.length > 1 ? `<select data-wrcmp="1" aria-label="Week">${earlier.map(x => `<option value="${x.k}" ${x.k === cmp.k ? "selected" : ""}>${esc(fmt(W[x.k].date))}</option>`).join("")}</select>` : esc(fmt(W[cmp.k].date))} · ${piece(W[cmp.k])}</div><audio controls preload="metadata" data-trec="${cmp.r.id}" style="width:100%"></audio>` : ""}
   ${R ? `<form class="add" data-wrmsg="${R.id}"><input id="wcm-${R.id}" maxlength="400" value="${esc(R.comment || "")}" placeholder="${t("wr_tMsgPh")}"><button class="btn sm ghost" type="submit">${t("wr_tMsgSend")}</button></form>` : ""}</div>`;
}
document.addEventListener("submit", async e => {
  const f = e.target.closest("[data-wrmsg]"); if (!f || typeof TS === "undefined" || !TS?.me) return;
  e.preventDefault(); e.stopPropagation(); const id = f.dataset.wrmsg, r = TS.det.recs.find(x => x.id === id), c = (document.getElementById("wcm-" + id)?.value || "").trim().slice(0, 400);
  await Tdo(async () => { await DB.upd("recordings", { id }, { comment: c }); if (r) r.comment = c; }, t("saved")); TrenderDetail();
}, true);
document.addEventListener("change", e => { if (e.target.dataset?.wrcmp && typeof TS !== "undefined") { TS.wrCmp = e.target.value; TrenderDetail(); } });

/* ---------- teacher: timer check (sound timeline) and optional spot-check recordings ---------- */
function TTimerCard(st, D) {
  const rows = (st.ptl || []).slice().reverse().slice(0, 12), spots = (st.spots || []).slice().reverse().slice(0, 8);
  const pname = id => esc((D.pieces || []).find(p => p.id === id)?.title || "");
  return `<div class="card stack teacher ptl-t"><div class="section-head"><h2>⏱ ${t("ptl_tH")}</h2></div>
   <label class="toggle"><input type="checkbox" data-tptl="spot" ${st.spotChk ? "checked" : ""}> <span>🎙️ ${t("ptl_tOn")}</span></label>
   <div class="muted small">${t("ptl_tHow")}</div>
   ${rows.length ? rows.map(r => { const on = (r.tl.match(/#/g) || []).length; return `<div class="ptl-row"><div class="small"><b>${esc(fmt(r.date))} ${esc(r.at || "")}</b>${pname(r.piece) ? " · " + pname(r.piece) : ""} · ${t("ptl_played", { a: Math.round(on / 6), b: Math.round(r.tl.length / 6) })}</div><div class="ptl-bar" style="justify-content:flex-start">${ptlHTML(r.tl)}</div></div>`; }).join("") : `<div class="muted small">${t("ptl_tNone")}</div>`}
   ${spots.length ? `<b class="small">🎙️ ${t("ptl_tSpots")}</b>${spots.map(s => { const R = (D.recs || []).find(x => x.id === s.id); return R ? `<div class="small">${esc(fmt(s.date))} ${esc(s.at)} · ${pname(s.piece)}</div><audio controls preload="metadata" data-trec="${R.id}" style="width:100%"></audio>` : ""; }).join("")}` : ""}
  </div>`;
}
document.addEventListener("change", async e => {
  const c = e.target.closest("[data-tptl]"); if (!c || typeof TS === "undefined" || !TS?.me) return;
  const on = c.checked; if (await Tdo(() => TwriteState(TS.cur, d => { d.spotChk = on; }), t("saved"))) TrenderDetail();
});
