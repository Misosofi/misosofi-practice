/* ===== "My plan for next time": after practising, the student films the score and says what to practise next
   (or records their voice, or writes it). The plan opens their next practice. Only the latest 2 plans are kept. */
let PLANREC = { mr: null, stream: null, chunks: [], t0: 0, timer: 0, kind: null };
const PLAN_MAX = 30;
const plansOf = () => (S.plans = Array.isArray(S.plans) ? S.plans : []);
const lastPlan = () => plansOf()[0] || null;
/* the plan to show before practising: made on an earlier day and not ticked off yet */
const openPlan = () => { const p = lastPlan(); return p && p.date < TK && !p.done ? p : null; };

function planCard(where) {
  const p = where === "start" ? openPlan() : null;
  if (where === "start" && !p) return "";
  if (p) return `<div class="card plan-card stack"><div class="section-head"><h2>${t("pl_yours")}</h2><span class="muted small">${esc(fmt(p.date))}</span></div>
   ${planMedia(p)}${p.text ? `<div class="plan-text">${esc(p.text)}</div>` : ""}
   <button class="btn soft" data-act="planDone">✓ ${t("pl_done")}</button></div>`;
  return "";
}
function planMedia(p) {
  if (p.kind === "video") return `<video class="plan-video" data-plan="${p.id}" controls playsinline preload="metadata"></video>`;
  if (p.kind === "audio") return `<audio data-plan="${p.id}" controls preload="none"></audio>`;
  return "";
}
async function hydratePlans(root) {
  (root || document).querySelectorAll("[data-plan]").forEach(async el => {
    const p = plansOf().find(x => x.id === el.dataset.plan); if (!p) return;
    const b = MEM[p.id] || await idbGet("plan-" + p.id);
    if (b) { el.src = URLS[p.id] ||= URL.createObjectURL(b); return; }
    if (p.path) { try { el.src = await signed("recordings", p.path); } catch (e) { } }
  });
}
/* the sheet shown after a practice session */
function actPlan() {
  const rec = PLANREC.mr && PLANREC.mr.state === "recording";
  return `<div class="stack"><div class="muted">${t("pl_how")}</div>
  <div class="card stack" style="text-align:center"><b>${t("pl_example")}</b></div>
  ${PLANREC.kind === "video" ? `<video id="planLive" class="plan-video" autoplay muted playsinline></video>` : ""}
  ${rec ? `<div class="bigclock" id="planClock">0:00</div><button class="btn" data-act="planStop">■ ${t("pl_stop")}</button>` : `
  <div class="opts" style="grid-template-columns:1fr 1fr"><button class="btn" data-act="planRec" data-k="video">🎥 ${t("pl_video")}</button><button class="btn soft" data-act="planRec" data-k="audio">🎤 ${t("pl_voice")}</button></div>
  <form class="add" data-form="planText"><textarea id="planT" maxlength="400" placeholder="${t("pl_writePh")}"></textarea><button class="btn soft" type="submit">${t("pl_save")}</button></form>
  <button class="btn ghost" data-act="close">${t("pl_skip")}</button>`}</div>`;
}
async function planStart(kind) {
  try {
    const cons = kind === "video" ? { audio: true, video: { facingMode: { ideal: "environment" }, width: { ideal: 640 }, height: { ideal: 480 }, frameRate: { ideal: 20 } } } : { audio: true };
    const stream = await navigator.mediaDevices.getUserMedia(cons);
    const opts = {}; if (kind === "video") { opts.videoBitsPerSecond = 350000; opts.audioBitsPerSecond = 48000; } else opts.audioBitsPerSecond = 48000;
    let mr; try { mr = new MediaRecorder(stream, opts); } catch (e) { mr = new MediaRecorder(stream); }
    PLANREC = { mr, stream, chunks: [], t0: Date.now(), timer: 0, kind };
    mr.ondataavailable = e => { if (e.data.size) PLANREC.chunks.push(e.data); };
    mr.onstop = () => { stream.getTracks().forEach(x => x.stop()); clearInterval(PLANREC.timer); const type = mr.mimeType || PLANREC.chunks[0]?.type || (kind === "video" ? "video/mp4" : "audio/webm"); planSave(kind, new Blob(PLANREC.chunks, { type }), ""); PLANREC = { mr: null, kind: null }; };
    mr.start(1000); renderAct();
    if (kind === "video") { const v = document.getElementById("planLive"); if (v) v.srcObject = stream; }
    PLANREC.timer = setInterval(() => { const s = Math.floor((Date.now() - PLANREC.t0) / 1000), c = document.getElementById("planClock"); if (c) c.textContent = "0:" + String(s).padStart(2, "0"); if (s >= PLAN_MAX) planStop(); }, 250);
  } catch (e) { PLANREC = { mr: null, kind: null }; toast(kind === "video" ? t("pl_camBlocked") : t("micBlocked")); renderAct(); }
}
function planStop() { if (PLANREC.mr && PLANREC.mr.state !== "inactive") PLANREC.mr.stop(); }
async function planSave(kind, blob, text) {
  const id = uid(), p = { id, date: TK, kind, text: text || "", done: false };
  if (blob) { MEM[id] = blob; await idbPut("plan-" + id, blob); p.path = `${ME}/plan-${id}.${extOf(blob)}`; }
  const old = plansOf().slice(1); S.plans = [p].concat(plansOf().slice(0, 1));
  save(); toast(t("pl_saved")); A = null; closeSheet(); refresh();
  /* upload (so the teacher can see it) and remove plans older than the latest two */
  if (blob && typeof DEMO !== "undefined" && !DEMO) {
    try { await DB.upload("recordings", p.path, blob, blob.type); } catch (e) { p.path = null; save(); }
    const gone = old.filter(x => x.path).map(x => x.path); if (gone.length) DB.rmFiles("recordings", gone).catch(() => { });
  }
  old.forEach(x => idbDel("plan-" + x.id));
}
function planAction(act, b) {
  if (act === "planRec") { planStart(b.dataset.k); return true; }
  if (act === "planStop") { planStop(); return true; }
  if (act === "planDone") { const p = lastPlan(); if (p) { p.done = true; save(); toast(t("pl_doneMsg")); refresh(); if (A) renderAct(); } return true; }
  if (act === "planOpen") { openAct("plan"); return true; }
  return false;
}
