/* Video requests ("Send me a video of this!").
   The teacher picks what the student should film (a piece, a step such as "play the left hand, sing the right hand", or her own words).
   The request lives in student_state.data.vreq (a TEACHER_KEY, so only the teacher writes it).
   The student films it in the app (small file: 640x480, low bitrate, max 3 min) and it goes to the private recordings bucket.
   S.vreqDone[requestId] = { rec, date } links the request to the recording; the teacher answers in the recording's comment. */

const VR_MAX = 180;
let VR = null;
const vrOpen = () => (S.vreq || []).filter(r => !(S.vreqDone || {})[r.id]);
const vrLabel = r => [r.step ? stratTxt(r.step) : "", r.text ? esc(r.text) : ""].filter(Boolean).join(" — ");

/* ---------- student: banner on Today ---------- */
function vreqHome() {
  const open = vrOpen(), done = (S.vreq || []).filter(r => (S.vreqDone || {})[r.id]);
  const ans = done.map(r => ({ r, rec: (S.remoteRecs || []).find(x => x.id === S.vreqDone[r.id].rec) })).filter(x => x.rec?.comment);
  if (!open.length && !ans.length && !done.length) return "";
  return `<div class="section"><div class="card vr-card stack">
   ${open.map(r => `<div class="vr-req"><b>📹 ${t("vr_asked")}</b>${r.piece ? `<div class="vr-piece">🎹 ${esc(r.piece)}</div>` : ""}<div>${vrLabel(r)}</div>
     <button class="btn block" data-vr="open" data-id="${r.id}">🎥 ${t("vr_record")}</button></div>`).join("")}
   ${done.filter(r => !ans.find(x => x.r.id === r.id)).slice(0, 3).map(r => `<div class="small vr-sent">✓ ${t("vr_sentWait")}: ${r.piece ? esc(r.piece) + " · " : ""}${vrLabel(r)}</div>`).join("")}
   ${ans.slice(0, 3).map(x => `<div class="vr-ans"><b>💬 ${t("teacherSays")}</b> ${esc(x.rec.comment)}<div class="muted small">${x.r.piece ? esc(x.r.piece) + " · " : ""}${vrLabel(x.r)}</div></div>`).join("")}
  </div></div>`;
}

function vrSheet() {
  const r = VR?.req; if (!r) return;
  const sec = VR.mr ? Math.floor((Date.now() - VR.t0) / 1000) : 0;
  openSheet(`<div class="stack vr-sheet"><div class="act-head"><h2>📹 ${t("vr_title")}</h2><button class="icon-btn" data-act="close" aria-label="Close">${I.close}</button></div>
   <div class="card vr-what">${r.piece ? `<b>🎹 ${esc(r.piece)}</b><br>` : ""}${vrLabel(r)}</div>
   ${VR.url ? `<video class="vr-video" src="${VR.url}" controls playsinline></video>`
      : `<video id="vrLive" class="vr-video" autoplay muted playsinline></video>`}
   ${VR.url ? `<div class="row"><button class="btn ghost" data-vr="retake">↺ ${t("vr_retake")}</button><button class="btn grow" data-vr="send">📤 ${t("vr_send")}</button></div>`
      : VR.mr ? `<div class="vr-clock" id="vrClock">● ${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, "0")}</div><button class="btn block vr-stop" data-vr="stop">■ ${t("vr_stop")}</button>`
      : `<div class="muted small">${t("vr_how")}</div><div class="row"><button class="btn ghost" data-vr="flip">🔄 ${t("vr_flip")}</button><button class="btn grow vr-rec" data-vr="rec">● ${t("vr_start")}</button></div>`}
  </div>`);
  if (!VR.url) vrCam();
}
async function vrCam() {
  const v = document.getElementById("vrLive"); if (!v) return;
  try {
    if (!VR.stream) VR.stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: { facingMode: { ideal: VR.facing }, width: { ideal: 640 }, height: { ideal: 480 }, frameRate: { ideal: 24 } } });
    v.srcObject = VR.stream;
  } catch (e) { toast(t("pl_camBlocked")); }
}
function vrRelease() {
  if (VR?.mr && VR.mr.state !== "inactive") { VR.discard = true; VR.mr.stop(); }
  VR?.stream?.getTracks().forEach(x => x.stop()); if (VR) { VR.stream = null; clearInterval(VR.timer); }
}
function vrStart() {
  if (!VR?.stream) { toast(t("pl_camBlocked")); return; }
  const opts = { videoBitsPerSecond: 700000, audioBitsPerSecond: 64000 };
  let mr; try { mr = new MediaRecorder(VR.stream, opts); } catch (e) { mr = new MediaRecorder(VR.stream); }
  VR.mr = mr; VR.chunks = []; VR.t0 = Date.now(); VR.discard = false;
  mr.ondataavailable = e => { if (e.data.size) VR.chunks.push(e.data); };
  mr.onstop = () => {
    clearInterval(VR.timer); if (VR.discard) { VR.mr = null; return; }
    const type = mr.mimeType || VR.chunks[0]?.type || "video/mp4";
    VR.blob = new Blob(VR.chunks, { type }); VR.dur = (Date.now() - VR.t0) / 1000; VR.url = URL.createObjectURL(VR.blob); VR.mr = null;
    VR.stream?.getTracks().forEach(x => x.stop()); VR.stream = null; vrSheet();
  };
  mr.start(1000); vrSheet();
  VR.timer = setInterval(() => { const s = Math.floor((Date.now() - VR.t0) / 1000), c = document.getElementById("vrClock"); if (c) c.textContent = `● ${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`; if (s >= VR_MAX && VR.mr) VR.mr.stop(); }, 250);
}
async function vrSend() {
  const r = VR?.req, blob = VR?.blob; if (!r || !blob) return;
  const id = uid(), ext = extOf(blob), row = { id, student_id: ME, kind: "video", path: `${ME}/${id}.${ext}`, seconds: Math.max(1, Math.round(VR.dur || 1)), piece_id: null };
  MEM[id] = blob; try { await idbPut(id, blob); } catch (e) { }
  S.remoteRecs ||= []; S.remoteRecs.unshift({ id, kind: "video", date: TK, dur: row.seconds, piece: null, listened: false, heart: false, comment: "", path: row.path, remote: true, pending: true });
  queue({ k: "rec:" + id, t: "recordings", a: "rec", row, ctype: blob.type || "video/mp4" }); saveOut();
  S.vreqDone = { ...(S.vreqDone || {}), [r.id]: { rec: id, date: TK } }; save();
  URL.revokeObjectURL(VR.url); VR = null; closeSheet(); celebrate(); toast(t("vr_sent")); refresh();
}
const _vrCloseSheet = closeSheet;
closeSheet = function () { if (VR) { vrRelease(); if (VR.url) URL.revokeObjectURL(VR.url); VR = null; } return _vrCloseSheet.apply(this, arguments); };

document.addEventListener("click", e => {
  const b = e.target.closest("[data-vr]"); if (!b) return; e.preventDefault();
  const a = b.dataset.vr;
  if (a === "open") { const r = (S.vreq || []).find(x => x.id === b.dataset.id); if (!r) return; VR = { req: r, facing: "user" }; vrSheet(); }
  else if (a === "flip") { if (!VR) return; VR.facing = VR.facing === "user" ? "environment" : "user"; VR.stream?.getTracks().forEach(x => x.stop()); VR.stream = null; vrSheet(); }
  else if (a === "rec") vrStart();
  else if (a === "stop") { if (VR?.mr && VR.mr.state !== "inactive") VR.mr.stop(); }
  else if (a === "retake") { if (VR?.url) URL.revokeObjectURL(VR.url); Object.assign(VR, { url: null, blob: null }); vrSheet(); }
  else if (a === "send") vrSend();
});

/* ---------- teacher: ask for a video, see what came back, answer ---------- */
function TVreqCard(st, D) {
  const reqs = (st.vreq || []).slice().reverse(), dn = st.vreqDone || {};
  const recOf = r => dn[r.id] && (D.recs || []).find(x => x.id === dn[r.id].rec);
  const F = TS.vrDraft ||= { step: "", piece: "", text: "" };
  return `<div class="card stack teacher vr-tcard"><div class="section-head"><h2>📹 ${t("vr_tH")}</h2></div>
   <div class="muted small">${t("vr_tHow")}</div>
   <select id="vrPiece" aria-label="Piece"><option value="">${t("vr_tAnyPiece")}</option>${(D.pieces || []).map(p => `<option ${F.piece === p.title ? "selected" : ""}>${esc(p.title)}</option>`).join("")}</select>
   <div class="chips">${STRATS.map(([k]) => `<button class="chip ${F.step === k ? "on" : ""}" data-tvr="step" data-v="${k}">${stratTxt(k)}</button>`).join("")}</div>
   <input id="vrText" maxlength="200" placeholder="${t("vr_tTextPh")}" value="${esc(F.text)}">
   <button class="btn" data-tvr="send">📹 ${t("vr_tSend")}</button>
   ${reqs.length ? `<div class="list">${reqs.map(r => { const R = recOf(r); return `<div class="row vr-trow"><div class="grow stack" style="gap:6px">
      <div><b>${r.piece ? esc(r.piece) + " · " : ""}${vrLabel(r) || "—"}</b><div class="muted small">${esc(fmt(r.at))} · ${dn[r.id] ? `✓ ${t("vr_tGot")} ${esc(fmt(dn[r.id].date))}` : t("vr_tWaiting")}</div></div>
      ${R ? `<video controls playsinline preload="metadata" data-trec="${R.id}"></video>
        <form class="add" data-wrmsg="${R.id}"><input id="wcm-${R.id}" maxlength="400" value="${esc(R.comment || "")}" placeholder="${t("vr_tMsgPh")}"><button class="btn sm ghost" type="submit">${t("wr_tMsgSend")}</button></form>` : dn[r.id] ? `<div class="muted small">${t("vr_tUploading")}</div>` : ""}
     </div><button class="x" data-tvr="del" data-id="${r.id}" aria-label="Delete">×</button></div>`; }).join("")}</div>` : ""}
  </div>`;
}
document.addEventListener("click", async e => {
  const b = e.target.closest("[data-tvr]"); if (!b || typeof TS === "undefined" || !TS?.me) return; e.preventDefault();
  const a = b.dataset.tvr, F = TS.vrDraft ||= { step: "", piece: "", text: "" };
  F.piece = document.getElementById("vrPiece")?.value || ""; F.text = (document.getElementById("vrText")?.value || "").trim().slice(0, 200);
  if (a === "step") { F.step = F.step === b.dataset.v ? "" : b.dataset.v; TrenderDetail(); }
  else if (a === "send") {
    if (!F.step && !F.text && !F.piece) { toast(t("vr_tEmpty")); return; }
    const req = { id: uid(), step: F.step, piece: F.piece, text: F.text, at: TK };
    if (await Tdo(() => TwriteState(TS.cur, d => { d.vreq = (d.vreq || []).concat(req).slice(-20); }), t("vr_tSent"))) { TS.vrDraft = null; TrenderDetail(); }
  } else if (a === "del") {
    if (await Tdo(() => TwriteState(TS.cur, d => { d.vreq = (d.vreq || []).filter(x => x.id !== b.dataset.id); }), t("saved"))) TrenderDetail();
  }
});
