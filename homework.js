/* ===== Homework from the teacher =====
   The teacher records a voice or video message (or writes), and ticks what the homework is: pieces + bars, what to remember,
   scales, technique, games, videos to watch. On the child's side the plan questions start with the teacher's message,
   and the answers are already filled in — the child checks them and adds to them. Files go to the teacher's own folder
   in the 'scores' bucket (students of that teacher can read it). */
const HW_DAYS = 14, HW_MAX = 120;
const hwFresh = h => h && h.id && h.date && diffDays(h.date, TK) <= HW_DAYS;

/* ---------- teacher side ---------- */
let HWREC = { mr: null };
function THwDraft(sid, st) {
  if (TS.hw?.sid === sid) return TS.hw;
  return TS.hw = { sid, pieces: [], bars: {}, said: [], scales: false, scaleTxt: "", tech: [], extras: [], vids: [], text: "", blob: null, kind: null, open: false };
}
function THwCard(st, D) {
  const sid = TS.cur, H = THwDraft(sid, st), cur = hwFresh(st.thw) ? st.thw : st.thw?.id ? st.thw : null;
  const chip = (f, v, lab) => `<button class="chip ${H[f].includes(v) ? "on" : ""}" data-thw="tog" data-f="${f}" data-v="${esc(v)}">${lab}</button>`;
  const recOn = HWREC.mr && HWREC.mr.state === "recording";
  const titles = [...new Set(D.pieces.filter(p => p.status !== "done").map(p => p.title))];
  const summary = h => [...(h.pieces || []).map(p => "🎵 " + p.title + (p.from ? ` ${t("pp_bars")} ${p.from}${p.to && p.to !== p.from ? "–" + p.to : ""}` : "")),
    ...(h.said || []).map(k => (SAID.find(s => s[0] === k) || [0, ""])[1] + " " + t("wz_s_" + k)), h.scales ? "🎼 " + (h.scales === true ? t("pp_scales") : h.scales) : "",
    ...(h.tech || []).map(id => techOf(id).em + " " + t("tc_" + id)), ...(h.extras || []).map(k => t("wz_x_" + k)),
    ...(h.vids || []).map(id => "📺 " + ((st.videos || []).find(v => v.id === id)?.title || ""))].filter(Boolean);
  const sent = cur ? `<div class="card stack hw-sent"><div class="section-head"><b>✓ ${t("hw_sentOn", { d: fmt(cur.date) })}</b>${cur.seen ? "" : ""}<button class="x" data-thw="del" aria-label="Delete">×</button></div>
     ${cur.path ? (cur.kind === "video" ? `<video class="plan-video" data-thwm="${esc(cur.path)}" controls playsinline preload="metadata"></video>` : `<audio data-thwm="${esc(cur.path)}" controls preload="none"></audio>`) : ""}
     ${cur.text ? `<div class="plan-text">${esc(cur.text)}</div>` : ""}<div class="small">${summary(cur).map(esc).join(" · ")}</div>
     <div class="muted small">${st.thwSeen === cur.id ? "✓ " + t("hw_used") : t("hw_notYet")}</div></div>` : "";
  if (!H.open) return `<div class="card teacher stack"><div class="section-head"><h2>🎧 ${t("hw_h")}</h2></div><div class="muted small">${t("hw_how")}</div>${sent}
    <button class="btn" data-thw="open">＋ ${cur ? t("hw_new") : t("hw_make")}</button></div>`;
  return `<div class="card teacher stack"><div class="section-head"><h2>🎧 ${t("hw_h")}</h2><button class="x" data-thw="close" aria-label="Close">×</button></div>
   <b>1. ${t("hw_msg")}</b>
   ${HWREC.kind === "video" && recOn ? `<video id="hwLive" class="plan-video" autoplay muted playsinline></video>` : ""}
   ${recOn ? `<div class="bigclock" id="hwClock">0:00</div><button class="btn" data-thw="stop">■ ${t("pl_stop")}</button>`
     : H.blob ? `<div class="row"><span class="grow">${H.kind === "video" ? "🎥" : "🎤"} ${t("hw_recorded")}</span><button class="btn sm ghost" data-thw="drop">${t("hw_redo")}</button></div>${H.kind === "video" ? `<video class="plan-video" id="hwPrev" controls playsinline></video>` : `<audio id="hwPrev" controls></audio>`}`
     : `<div class="opts" style="grid-template-columns:1fr 1fr"><button class="btn soft" data-thw="rec" data-k="video">🎥 ${t("pl_video")}</button><button class="btn soft" data-thw="rec" data-k="audio">🎤 ${t("pl_voice")}</button></div>`}
   <textarea id="hwText" maxlength="500" placeholder="${t("hw_textPh")}">${esc(H.text)}</textarea>
   <b>2. ${t("hw_what")}</b>
   <div class="label">${t("wz_q_pieces")}</div><div class="chips">${titles.map(n => chip("pieces", n, "🎵 " + esc(n))).join("") || `<span class="muted small">—</span>`}</div>
   ${H.pieces.map(n => { const b = H.bars[n] || {}; return `<div class="pp-bars"><label class="label">${esc(n)} · ${t("pp_bars")}</label><input type="number" min="1" inputmode="numeric" data-hwbar="${esc(n)}" data-k="from" value="${esc(b.from || "")}" placeholder="—"><span>–</span><input type="number" min="1" inputmode="numeric" data-hwbar="${esc(n)}" data-k="to" value="${esc(b.to || "")}" placeholder="—"></div>`; }).join("")}
   <div class="label">${t("hw_said")}</div><div class="chips">${SAID.map(([k, e]) => chip("said", k, e + " " + t("wz_s_" + k))).join("")}</div>
   <div class="label">${t("wz_q_scales")}</div><input id="hwScale" maxlength="40" value="${esc(H.scaleTxt)}" placeholder="${t("hw_scalePh")}">
   <div class="label">${t("wz_q_tech")}</div><div class="chips">${TECH.map(x => chip("tech", x.id, x.em + " " + t("tc_" + x.id))).join("")}</div>
   <div class="label">${t("hw_games")}</div><div class="chips">${EXTRAS.map(k => chip("extras", k, t("wz_x_" + k))).join("")}</div>
   ${(st.videos || []).length ? `<div class="label">📺 ${t("hw_vids")}</div><div class="chips">${st.videos.map(v => chip("vids", v.id, esc(v.title))).join("")}</div>` : `<div class="muted small">📺 ${t("hw_noVids")}</div>`}
   <button class="btn block" data-thw="send" ${TS.busy || recOn ? "disabled" : ""}>✓ ${t("hw_send")}</button></div>`;
}
function THwRead() {
  const H = TS.hw; if (!H) return;
  const tx = document.getElementById("hwText"); if (tx) H.text = tx.value.slice(0, 500);
  const sc = document.getElementById("hwScale"); if (sc) H.scaleTxt = sc.value.trim().slice(0, 40);
  document.querySelectorAll("[data-hwbar]").forEach(i => { (H.bars[i.dataset.hwbar] ||= {})[i.dataset.k] = i.value.trim().slice(0, 4); });
}
function THwAfter() {
  const H = TS.hw, p = document.getElementById("hwPrev");
  if (p && H?.blob) p.src = URLS["hw"] ||= URL.createObjectURL(H.blob);
  if (HWREC.kind === "video" && HWREC.stream) { const v = document.getElementById("hwLive"); if (v) v.srcObject = HWREC.stream; }
  document.querySelectorAll("[data-thwm]").forEach(async a => { try { a.src = await signed("scores", a.dataset.thwm); } catch (e) { } });
}
async function THwRec(kind) {
  try {
    const cons = kind === "video" ? { audio: true, video: { facingMode: { ideal: "user" }, width: { ideal: 640 }, height: { ideal: 480 }, frameRate: { ideal: 20 } } } : { audio: true };
    const stream = await navigator.mediaDevices.getUserMedia(cons);
    const opts = kind === "video" ? { videoBitsPerSecond: 400000, audioBitsPerSecond: 48000 } : { audioBitsPerSecond: 48000 };
    let mr; try { mr = new MediaRecorder(stream, opts); } catch (e) { mr = new MediaRecorder(stream); }
    const chunks = []; HWREC = { mr, stream, kind, t0: Date.now(), timer: 0 };
    mr.ondataavailable = e => { if (e.data.size) chunks.push(e.data); };
    mr.onstop = () => {
      stream.getTracks().forEach(x => x.stop()); clearInterval(HWREC.timer);
      const H = TS.hw; if (H) { H.blob = new Blob(chunks, { type: mr.mimeType || chunks[0]?.type || (kind === "video" ? "video/mp4" : "audio/webm") }); H.kind = kind; if (URLS["hw"]) { URL.revokeObjectURL(URLS["hw"]); delete URLS["hw"]; } }
      HWREC = { mr: null }; THwRead(); TrenderDetail(); THwAfter();
    };
    mr.start(1000); THwRead(); TrenderDetail(); THwAfter();
    HWREC.timer = setInterval(() => { const s = Math.floor((Date.now() - HWREC.t0) / 1000), c = document.getElementById("hwClock"); if (c) c.textContent = Math.floor(s / 60) + ":" + String(s % 60).padStart(2, "0"); if (s >= HW_MAX) THwStop(); }, 250);
  } catch (e) { HWREC = { mr: null }; toast(kind === "video" ? t("pl_camBlocked") : t("micBlocked")); }
}
function THwStop() { if (HWREC.mr && HWREC.mr.state !== "inactive") HWREC.mr.stop(); }
async function THwSend() {
  THwRead(); const H = TS.hw, sid = TS.cur; if (!H || H.sid !== sid) return;
  if (!H.blob && !H.text.trim() && !H.pieces.length && !H.said.length && !H.scaleTxt && !H.tech.length && !H.extras.length && !H.vids.length) { toast(t("hw_empty")); return; }
  TS.busy = true; TrenderDetail();
  const id = uid(), hw = { id, date: TK, kind: H.blob ? H.kind : null, path: null, text: H.text.trim(),
    pieces: H.pieces.map(n => ({ title: n, from: H.bars[n]?.from || "", to: H.bars[n]?.to || "" })), said: H.said.slice(), scales: H.scaleTxt || "",
    tech: H.tech.slice(), extras: H.extras.slice(), vids: H.vids.slice() };
  let old = null;
  const ok = await Tdo(async () => {
    if (H.blob) { hw.path = `${TS.me.id}/hw-${sid}-${id}.${extOf(H.blob)}`; await DB.upload("scores", hw.path, H.blob, H.blob.type); }
    await TwriteState(sid, d => { old = d.thw?.path || null; d.thw = hw; });
  }, t("hw_sent"));
  TS.busy = false;
  if (ok) { if (old) DB.rmFiles("scores", [old]).catch(() => { }); TS.hw = null; await TreloadDetail(); THwAfter(); } else TrenderDetail();
}
document.addEventListener("click", async e => {
  const b = e.target.closest("[data-thw]"); if (!b || !TS.cur) return;
  const a = b.dataset.thw, st = TS.det?.state || {}, H = THwDraft(TS.cur, st);
  if (a !== "send") THwRead();
  if (a === "open") H.open = true;
  else if (a === "close") { THwStop(); TS.hw = null; }
  else if (a === "tog") { const f = H[b.dataset.f], v = b.dataset.v, i = f.indexOf(v); i < 0 ? f.push(v) : f.splice(i, 1); }
  else if (a === "rec") return THwRec(b.dataset.k);
  else if (a === "stop") return THwStop();
  else if (a === "drop") { H.blob = null; H.kind = null; }
  else if (a === "send") return THwSend();
  else if (a === "del") { const p = st.thw?.path; if (!await Tdo(() => TwriteState(TS.cur, d => { delete d.thw; }), t("saved"))) return; if (p) DB.rmFiles("scores", [p]).catch(() => { }); await TreloadDetail(); }
  TrenderDetail(); THwAfter();
});

/* ---------- child side ---------- */
const hwNew = () => typeof S !== "undefined" && S && hwFresh(S.thw) && S.thwSeen !== S.thw.id;
function hwBanner() {
  if (!hwNew()) return "";
  return `<button class="card hw-banner" data-pp="help"><span class="hw-ic">🎧</span><span class="grow"><b>${t("hw_kidNew")}</b><span class="muted small">${t("hw_kidNewSub")}</span></span><span>→</span></button>`;
}
/* fill the plan questions with what the teacher set */
function hwPrefill(W) {
  const h = S.thw; if (!hwFresh(h)) return W;
  W.hw = h;
  (h.pieces || []).forEach(p => { if (!W.pieces.includes(p.title)) W.pieces.push(p.title); if (p.from) W.bars[p.title] = { from: p.from, to: p.to || "" }; });
  W.said = [...new Set(W.said.concat(h.said || []))];
  if (h.scales) { W.scales = true; W.scaleTxt = h.scales; }
  if ((h.tech || []).length) { W.tech = true; W.techIds = h.tech.slice(); }
  W.extras = [...new Set(W.extras.concat(h.extras || []))];
  W.vids = (h.vids || []).map(id => (S.videos || []).find(v => v.id === id)).filter(Boolean).map(v => ({ id: v.id, title: v.title, url: v.url || "" }));
  return W;
}
function hwStepHTML(W) {
  const h = W.hw, vids = W.vids || [];
  return `<h2>🎧 ${t("hw_kidH")}</h2>
   ${h.path ? (h.kind === "video" ? `<video class="plan-video" data-kthw="${esc(h.path)}" controls playsinline preload="metadata"></video>` : `<audio data-kthw="${esc(h.path)}" controls preload="none"></audio>`) : ""}
   ${h.text ? `<div class="card plan-text">${esc(h.text)}</div>` : ""}
   ${vids.length ? `<div class="small">📺 ${vids.map(v => esc(v.title)).join(" · ")}</div>` : ""}
   <div class="muted">${t("hw_kidNext")}</div>`;
}
function hwHydrateKid() { document.querySelectorAll("[data-kthw]").forEach(async a => { try { a.src = await signed("scores", a.dataset.kthw); } catch (e) { } }); }
