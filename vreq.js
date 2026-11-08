/* Video requests ("Send me a video of this!").
   The teacher picks what the student should film (a piece, a step such as "play the left hand, sing the right hand", or her own words).
   The request lives in student_state.data.vreq (a TEACHER_KEY, so only the teacher writes it).
   The student films it in the app (small file: 640x480, low bitrate, max 3 min) and it goes to the private recordings bucket.
   S.vreqDone[requestId] = { rec, date } links the request to the recording; the teacher answers in the recording's comment. */

const VR_MAX = 180;
let VR = null;
const vrOpen = () => (S.vreq || []).filter(r => !(S.vreqDone || {})[r.id]);
const vrSteps = r => r.steps?.length ? r.steps : r.step ? [r.step] : [];
const vrLabel = r => [vrSteps(r).map((k, n) => (vrSteps(r).length > 1 ? `${n + 1}. ` : "") + stratTxt(k)).join(vrSteps(r).length > 1 ? "<br>" : ""), r.text ? esc(r.text) : ""].filter(Boolean).join(vrSteps(r).length > 1 ? "<br>" : " — ");

/* ---------- student: banner on Today (delivered by little devil Azuki) ---------- */
const vrReplyOf = r => r.reply || null;
function vrReplyHTML(rep) {
  if (!rep) return "";
  return `${rep.text ? `<div>${esc(rep.text)}</div>` : ""}${rep.path ? (rep.kind === "video" ? `<video controls playsinline preload="metadata" data-vrm="${esc(rep.path)}"></video>` : `<audio controls preload="metadata" data-vrm="${esc(rep.path)}"></audio>`) : ""}`;
}
function vrHydrate() { document.querySelectorAll("[data-vrm]").forEach(async a => { if (a.src) return; try { a.src = await signed("scores", a.dataset.vrm); } catch (e) { } }); }
function vreqHome() {
  const open = vrOpen(), done = (S.vreq || []).filter(r => (S.vreqDone || {})[r.id]);
  const ans = done.map(r => ({ r, rec: (S.remoteRecs || []).find(x => x.id === S.vreqDone[r.id].rec) })).filter(x => vrReplyOf(x.r) || x.rec?.comment);
  if (!open.length && !ans.length && !done.length) return "";
  setTimeout(vrHydrate, 0);
  return `<div class="section"><div class="card vr-card stack">
   ${open.length ? `<div class="vr-devil"><img src="assets/art/devil_azuki.webp" alt="" class="vr-devil-img"><div class="dz-say vr-say">${t("vr_devil")}</div></div>` : ""}
   ${open.map(r => `<div class="vr-req"><b>${r.media === "audio" ? "🎙️" : "📹"} ${t(r.media === "audio" ? "vr_askedA" : "vr_asked")}</b>${r.piece ? `<div class="vr-piece">🎹 ${esc(r.piece)}</div>` : ""}<div>${vrLabel(r)}</div>
     <button class="btn block" data-vr="open" data-id="${r.id}">${r.media === "audio" ? "🎙️ " + t("vr_recordA") : "🎥 " + t("vr_record")}</button></div>`).join("")}
   ${done.filter(r => !ans.find(x => x.r.id === r.id)).slice(0, 3).map(r => `<div class="small vr-sent">✓ ${t("vr_sentWait")}: ${r.piece ? esc(r.piece) + " · " : ""}${vrLabel(r)}</div>`).join("")}
   ${ans.slice(0, 3).map(x => `<div class="vr-ans stack" style="gap:6px"><b>💬 ${t("teacherSays")}</b>${vrReplyOf(x.r) ? vrReplyHTML(x.r.reply) : `<div>${esc(x.rec.comment)}</div>`}<div class="muted small">${x.r.piece ? esc(x.r.piece) + " · " : ""}${vrLabel(x.r)}</div></div>`).join("")}
  </div></div>`;
}

function vrSheet() {
  const r = VR?.req; if (!r) return;
  const sec = VR.mr ? Math.floor((Date.now() - VR.t0) / 1000) : 0;
  const au = r.media === "audio";
  openSheet(`<div class="stack vr-sheet"><div class="act-head"><h2>${au ? "🎙️ " + t("vr_titleA") : "📹 " + t("vr_title")}</h2><button class="icon-btn" data-act="close" aria-label="Close">${I.close}</button></div>
   <div class="card vr-what">${r.piece ? `<b>🎹 ${esc(r.piece)}</b><br>` : ""}${vrLabel(r)}</div>
   ${VR.url ? (au ? `<audio src="${VR.url}" controls style="width:100%"></audio>` : `<video class="vr-video" src="${VR.url}" controls playsinline></video>`)
      : au ? `<div class="vr-mic ${VR.mr ? "on" : ""}">🎙️</div>` : `<video id="vrLive" class="vr-video" autoplay muted playsinline></video>`}
   ${VR.url ? `<div class="row"><button class="btn ghost" data-vr="retake">↺ ${t("vr_retake")}</button><button class="btn grow" data-vr="send">📤 ${t("vr_send")}</button></div>`
      : VR.mr ? `<div class="vr-clock" id="vrClock">● ${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, "0")}</div><button class="btn block vr-stop" data-vr="stop">■ ${t("vr_stop")}</button>`
      : `<div class="muted small">${au ? t("vr_howA") : t("vr_how")}</div><div class="row">${au ? "" : `<button class="btn ghost" data-vr="flip">🔄 ${t("vr_flip")}</button>`}<button class="btn grow vr-rec" data-vr="rec">● ${t("vr_start")}</button></div>`}
  </div>`);
  if (!VR.url) vrCam();
}
async function vrCam() {
  const au = VR?.req?.media === "audio", v = document.getElementById("vrLive"); if (!au && !v) return;
  try {
    if (!VR.stream) VR.stream = await navigator.mediaDevices.getUserMedia(au ? { audio: true } : { audio: true, video: { facingMode: { ideal: VR.facing }, width: { ideal: 640 }, height: { ideal: 480 }, frameRate: { ideal: 24 } } });
    if (v) v.srcObject = VR.stream;
  } catch (e) { toast(au ? t("micBlocked") : t("pl_camBlocked")); }
}
function vrRelease() {
  if (VR?.mr && VR.mr.state !== "inactive") { VR.discard = true; VR.mr.stop(); }
  VR?.stream?.getTracks().forEach(x => x.stop()); if (VR) { VR.stream = null; clearInterval(VR.timer); }
}
function vrStart() {
  if (!VR?.stream) { toast(VR?.req?.media === "audio" ? t("micBlocked") : t("pl_camBlocked")); return; }
  const au = VR.req.media === "audio", opts = au ? { audioBitsPerSecond: 64000 } : { videoBitsPerSecond: 700000, audioBitsPerSecond: 64000 };
  let mr; try { mr = new MediaRecorder(VR.stream, opts); } catch (e) { mr = new MediaRecorder(VR.stream); }
  VR.mr = mr; VR.chunks = []; VR.t0 = Date.now(); VR.discard = false;
  mr.ondataavailable = e => { if (e.data.size) VR.chunks.push(e.data); };
  mr.onstop = () => {
    clearInterval(VR.timer); if (VR.discard) { VR.mr = null; return; }
    const type = mr.mimeType || VR.chunks[0]?.type || (au ? "audio/mp4" : "video/mp4");
    VR.blob = new Blob(VR.chunks, { type }); VR.dur = (Date.now() - VR.t0) / 1000; VR.url = URL.createObjectURL(VR.blob); VR.mr = null;
    VR.stream?.getTracks().forEach(x => x.stop()); VR.stream = null; vrSheet();
  };
  mr.start(1000); vrSheet();
  VR.timer = setInterval(() => { const s = Math.floor((Date.now() - VR.t0) / 1000), c = document.getElementById("vrClock"); if (c) c.textContent = `● ${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`; if (s >= VR_MAX && VR.mr) VR.mr.stop(); }, 250);
}
async function vrSend() {
  const r = VR?.req, blob = VR?.blob; if (!r || !blob) return;
  const kind = r.media === "audio" ? "audio" : "video", id = uid(), ext = extOf(blob), row = { id, student_id: ME, kind, path: `${ME}/${id}.${ext}`, seconds: Math.max(1, Math.round(VR.dur || 1)), piece_id: null };
  MEM[id] = blob; try { await idbPut(id, blob); } catch (e) { }
  S.remoteRecs ||= []; S.remoteRecs.unshift({ id, kind, date: TK, dur: row.seconds, piece: null, listened: false, heart: false, comment: "", path: row.path, remote: true, pending: true });
  queue({ k: "rec:" + id, t: "recordings", a: "rec", row, ctype: blob.type || (kind === "audio" ? "audio/mp4" : "video/mp4") }); saveOut();
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

/* ---------- teacher: ask for a video / a recording, see what came back, answer with text, voice or a short video ---------- */
let TVR = null;   /* teacher's reply recorder: { id, kind, stream, mr, chunks, blob, url, t0, timer } */
function TVreqCard(st, D) {
  const reqs = (st.vreq || []).slice().reverse(), dn = st.vreqDone || {};
  const recOf = r => dn[r.id] && (D.recs || []).find(x => x.id === dn[r.id].rec);
  const F = TS.vrDraft ||= { steps: [], piece: "", text: "", media: "video" }; F.steps ||= [];
  setTimeout(() => { vrHydrate(); const v = document.getElementById("tvrLive"); if (v && TVR?.stream) v.srcObject = TVR.stream; }, 0);
  const replyBox = (r, R) => {
    const rp = r.reply, rec = TVR && TVR.id === r.id ? TVR : null;
    return `<div class="vr-reply stack" style="gap:6px"><b class="small">💬 ${t("vr_tReply")}</b>
      ${rp ? `<div class="vr-ans">${vrReplyHTML(rp)}<div class="muted small">✓ ${t("vr_tReplied")} ${esc(fmt(rp.at))}</div></div>` : ""}
      <input id="tvrText-${r.id}" maxlength="400" value="${esc(rp?.text || "")}" placeholder="${t("vr_tMsgPh")}">
      ${rec ? (rec.url ? `${rec.kind === "video" ? `<video src="${rec.url}" controls playsinline></video>` : `<audio src="${rec.url}" controls style="width:100%"></audio>`}<div class="row"><button class="btn ghost sm" data-tvr="rRetake">↺ ${t("vr_retake")}</button><button class="btn ghost sm" data-tvr="rCancel">${t("cancel")}</button></div>`
          : rec.mr ? `${rec.kind === "video" ? `<video id="tvrLive" autoplay muted playsinline></video>` : `<div class="vr-mic on">🎙️</div>`}<button class="btn block vr-stop" data-tvr="rStop">■ ${t("vr_stop")}</button>`
          : `${rec.kind === "video" ? `<video id="tvrLive" autoplay muted playsinline></video>` : ""}<div class="row"><button class="btn grow vr-rec" data-tvr="rStart">● ${t("vr_start")}</button><button class="btn ghost sm" data-tvr="rCancel">${t("cancel")}</button></div>`)
        : `<div class="chips"><button class="chip" data-tvr="rVoice" data-id="${r.id}">🎙️ ${t("vr_tVoice")}</button><button class="chip" data-tvr="rVideo" data-id="${r.id}">📹 ${t("vr_tVideo")}</button></div>`}
      <button class="btn sm" data-tvr="reply" data-id="${r.id}" ${rec && !rec.url ? "disabled" : ""}>📤 ${t("vr_tReplySend")}</button></div>`;
  };
  return `<div class="card stack teacher vr-tcard"><div class="section-head"><h2>📹 ${t("vr_tH")}</h2></div>
   <div class="muted small">${t("vr_tHow")}</div>
   <div class="chips">${["video", "audio"].map(m => `<button class="chip ${F.media === m ? "on" : ""}" data-tvr="media" data-v="${m}">${m === "video" ? "📹 " + t("vr_tMVideo") : "🎙️ " + t("vr_tMAudio")}</button>`).join("")}</div>
   <select id="vrPiece" aria-label="Piece"><option value="">${t("vr_tAnyPiece")}</option>${(D.pieces || []).map(p => `<option ${F.piece === p.title ? "selected" : ""}>${esc(p.title)}</option>`).join("")}</select>
   <div class="chips"><div class="muted small">${t("vr_tMulti")}</div>${STRATS.map(([k]) => { const n = F.steps.indexOf(k); return `<button class="chip ${n >= 0 ? "on" : ""}" data-tvr="step" data-v="${k}">${n >= 0 ? `<b>${n + 1}.</b> ` : ""}${stratTxt(k)}</button>`; }).join("")}</div>
   <input id="vrText" maxlength="200" placeholder="${t("vr_tTextPh")}" value="${esc(F.text)}">
   <button class="btn" data-tvr="send">${F.media === "audio" ? "🎙️ " + t("vr_tSendA") : "📹 " + t("vr_tSend")}</button>
   ${reqs.length ? `<div class="list">${reqs.map(r => { const R = recOf(r); return `<div class="row vr-trow"><div class="grow stack" style="gap:6px">
      <div><b>${r.media === "audio" ? "🎙️" : "📹"} ${r.piece ? esc(r.piece) + " · " : ""}${vrLabel(r) || "—"}</b><div class="muted small">${esc(fmt(r.at))} · ${dn[r.id] ? `✓ ${t("vr_tGot")} ${esc(fmt(dn[r.id].date))}` : t("vr_tWaiting")}</div></div>
      ${R ? `${R.kind === "audio" ? `<audio controls preload="metadata" data-trec="${R.id}" style="width:100%"></audio>` : `<video controls playsinline preload="metadata" data-trec="${R.id}"></video>`}${replyBox(r, R)}` : dn[r.id] ? `<div class="muted small">${t("vr_tUploading")}</div>` : ""}
     </div><button class="x" data-tvr="del" data-id="${r.id}" aria-label="Delete">×</button></div>`; }).join("")}</div>` : ""}
  </div>`;
}
function tvrStop() { if (TVR?.mr && TVR.mr.state !== "inactive") TVR.mr.stop(); }
function tvrRelease() { if (TVR?.mr && TVR.mr.state !== "inactive") { TVR.discard = true; TVR.mr.stop(); } TVR?.stream?.getTracks().forEach(x => x.stop()); if (TVR?.url) URL.revokeObjectURL(TVR.url); TVR = null; }
async function tvrOpen(id, kind) {
  tvrRelease(); TVR = { id, kind };
  try { TVR.stream = await navigator.mediaDevices.getUserMedia(kind === "video" ? { audio: true, video: { facingMode: "user", width: { ideal: 640 }, height: { ideal: 480 } } } : { audio: true }); }
  catch (e) { TVR = null; toast(kind === "video" ? t("pl_camBlocked") : t("micBlocked")); }
  TrenderDetail();
}
function tvrStart() {
  if (!TVR?.stream) return;
  const opts = TVR.kind === "video" ? { videoBitsPerSecond: 700000, audioBitsPerSecond: 64000 } : { audioBitsPerSecond: 64000 };
  let mr; try { mr = new MediaRecorder(TVR.stream, opts); } catch (e) { mr = new MediaRecorder(TVR.stream); }
  Object.assign(TVR, { mr, chunks: [], t0: Date.now(), discard: false });
  mr.ondataavailable = e => { if (e.data.size) TVR.chunks.push(e.data); };
  mr.onstop = () => { if (!TVR || TVR.discard) return; clearTimeout(TVR.timer); TVR.blob = new Blob(TVR.chunks, { type: mr.mimeType || TVR.chunks[0]?.type || (TVR.kind === "video" ? "video/mp4" : "audio/mp4") }); TVR.url = URL.createObjectURL(TVR.blob); TVR.mr = null; TVR.stream?.getTracks().forEach(x => x.stop()); TVR.stream = null; TrenderDetail(); };
  mr.start(1000); TVR.timer = setTimeout(tvrStop, 120000); TrenderDetail();
}
document.addEventListener("click", async e => {
  const b = e.target.closest("[data-tvr]"); if (!b || typeof TS === "undefined" || !TS?.me) return; e.preventDefault();
  const a = b.dataset.tvr, F = TS.vrDraft ||= { steps: [], piece: "", text: "", media: "video" }; F.steps ||= [];
  if (document.getElementById("vrPiece")) { F.piece = document.getElementById("vrPiece").value || ""; F.text = (document.getElementById("vrText")?.value || "").trim().slice(0, 200); }
  if (a === "step") { const k = b.dataset.v; F.steps = F.steps.includes(k) ? F.steps.filter(x => x !== k) : F.steps.concat(k); TrenderDetail(); }
  else if (a === "media") { F.media = b.dataset.v; TrenderDetail(); }
  else if (a === "send") {
    if (!F.steps.length && !F.text && !F.piece) { toast(t("vr_tEmpty")); return; }
    const req = { id: uid(), media: F.media, steps: F.steps.slice(), piece: F.piece, text: F.text, at: TK };
    if (await Tdo(() => TwriteState(TS.cur, d => { d.vreq = (d.vreq || []).concat(req).slice(-20); }), t("vr_tSent"))) { TS.vrDraft = { steps: [], piece: "", text: "", media: F.media }; TrenderDetail(); }
  } else if (a === "del") {
    if (await Tdo(() => TwriteState(TS.cur, d => { d.vreq = (d.vreq || []).filter(x => x.id !== b.dataset.id); }), t("saved"))) TrenderDetail();
  }
  else if (a === "rVoice" || a === "rVideo") tvrOpen(b.dataset.id, a === "rVideo" ? "video" : "audio");
  else if (a === "rStart") tvrStart();
  else if (a === "rStop") tvrStop();
  else if (a === "rRetake") { const id = TVR?.id, k = TVR?.kind; tvrOpen(id, k); }
  else if (a === "rCancel") { tvrRelease(); TrenderDetail(); }
  else if (a === "reply") {
    const id = b.dataset.id, text = (document.getElementById("tvrText-" + id)?.value || "").trim().slice(0, 400), rec = TVR?.id === id && TVR.blob ? TVR : null;
    if (!text && !rec) { toast(t("vr_tEmptyReply")); return; }
    const ok = await Tdo(async () => {
      let path = null, kind = null;
      if (rec) { kind = rec.kind; path = `${TS.me.id}/reply-${uid()}.${extOf(rec.blob)}`; await DB.upload("scores", path, rec.blob, rec.blob.type); }
      let oldPath = null;
      await TwriteState(TS.cur, d => { const q = (d.vreq || []).find(x => x.id === id); if (!q) return; oldPath = q.reply?.path && path ? q.reply.path : null; q.reply = { text, kind: kind || q.reply?.kind || null, path: path || q.reply?.path || null, at: TK }; });
      if (oldPath) DB.rmFiles("scores", [oldPath]).catch(() => { });
      const R = TS.det?.recs?.find(x => x.id === (TS.det.state.vreqDone || {})[id]?.rec); if (R && text) { await DB.upd("recordings", { id: R.id }, { comment: text }); R.comment = text; }
    }, t("vr_tReplied"));
    if (ok) { tvrRelease(); TrenderDetail(); }
  }
});
