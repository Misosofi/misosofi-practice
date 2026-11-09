/* ===== Rhythm school: one rhythm a week, the Misosofi way =====
   1. 👏 Copy me  — the app claps a rhythm, the child claps it back (the microphone checks the timing).
   2. 🍎 Apples   — one apple = one beat (ta), half an apple = ti, … The child lines up apples to build the rhythm they hear.
   3. ✍️ Write it — trace the note with a finger over a dotted model, then write it alone. The app checks the shape.
   A new unit opens every week (S.rs.start = first week). Coins only for right answers / good work. */
const RUNITS = [
  { id: "q", tiles: ["q", "r"], write: ["q"] },
  { id: "e", tiles: ["q", "ee"], write: ["e", "ee"] },
  { id: "h", tiles: ["q", "ee", "h"], write: ["h"] },
  { id: "s", tiles: ["q", "ee", "ssss"], write: ["s", "ssss"] },
  { id: "t", tiles: ["q", "ee", "tri"], write: ["tri"] },
  /* glued pieces: two pieces of one apple stuck together = one longer note (count it, don't clap it) */
  { id: "j", tiles: ["q", "ee", "ssss", "tri"], glue: true, must: ["ssss~1011", "ssss~1110", "ssss~1101", "ssss~1001", "tri~101", "tri~110"], write: ["ee"] },
];
/* beats each tile takes, its syllable and its "apple" picture */
const RTILE = {
  q: { b: 1, say: "Tan", on: [0] }, r: { b: 1, say: "shh", on: [] }, ee: { b: 1, say: "ta-ta", on: [0, .5] },
  h: { b: 2, say: "ta-ah", on: [0] }, ssss: { b: 1, say: "1 2 3 4", on: [0, .25, .5, .75] }, tri: { b: 1, say: "1 2 3", on: [0, 1 / 3, 2 / 3] },
};
const SYL = { ee: ["ta", "ta"], ssss: ["1", "2", "3", "4"], tri: ["1", "2", "3"] };
/* tile ids: q, r, h, ee, ssss, tri — or a glued apple "base~mask" (mask: 1 = clap this piece, 0 = glued to the piece before) */
function rt(id) {
  if (RTILE[id]) return RTILE[id];
  const [base, mask] = String(id).split("~"), B = RTILE[base]; if (!B || !mask) return RTILE.q;
  const on = B.on.filter((_, k) => mask[k] === "1"), say = SYL[base].map((x, k) => mask[k] === "1" ? x : "(" + x + ")").join(" ");
  return { b: 1, say, on, base, mask };
}
const rtBase = id => String(id).split("~")[0];
const rsS = () => (S.rs ||= { start: WK, done: {} });
const rsWeeks = () => { const a = new Date(rsS().start), b = new Date(WK); return Math.max(0, Math.round((b - a) / 6048e5)); };
const rsOpenN = () => Math.min(RUNITS.length, rsWeeks() + 1);
let RS = null;   /* { u, stage: "menu"|"copy"|"apple"|"write", ... } */

/* ---------- pictures: apples and notes (SVG) ---------- */
function appleSVG(kind) {
  if (String(kind).includes("~")) {
    const [base, mask] = kind.split("~"), n = base === "ee" ? 2 : base === "ssss" ? 4 : 3, w = n === 2 ? 40 : n === 4 ? 44 : 42, r = n === 2 ? 15 : n === 3 ? 11 : 9, step = w / n, col = n === 4 ? "#7cc242" : n === 3 ? "#e8b10c" : "#ff2a2a";
    const xs = Array.from({ length: n }, (_, k) => step * k + step * .5 + r * .45);
    const glue = xs.map((x, k) => k && mask[k] === "0" ? `<rect x="${xs[k - 1] - r * .2}" y="${24 - r * .55}" width="${x - xs[k - 1] + r * .2}" height="${r * 1.1}" rx="${r * .5}" fill="none" stroke="#ff7a00" stroke-width="2.4"/>` : "").join("");
    return `<svg viewBox="0 0 ${w} 40" width="${w * .9}" height="36" aria-hidden="true">${xs.map((x, k) => `<g opacity="${mask[k] === "1" ? 1 : .55}"><path d="M${x} ${24 - r} A${r} ${r} 0 0 0 ${x} ${24 + r} Z" fill="${col}"/><path d="M${x} ${24 - r} A${r * .8} ${r} 0 0 0 ${x} ${24 + r} Z" fill="#fff3cf"/></g>`).join("")}${glue}</svg>`;
  }
  const whole = `<circle cx="20" cy="24" r="15" fill="#9b1020"/><path d="M20 10 q2-6 7-7" stroke="#6b3a1e" stroke-width="2.5" fill="none"/><ellipse cx="27" cy="8" rx="5" ry="2.6" fill="#4caf50" transform="rotate(-25 27 8)"/><ellipse cx="14" cy="19" rx="3" ry="5" fill="#fff" opacity=".35"/>`;
  /* a cut apple: n pieces side by side (each piece = red skin + cream inside) */
  const piece = (cx, r, col = "#e8413c") => `<path d="M${cx} ${24 - r} A${r} ${r} 0 0 0 ${cx} ${24 + r} Z" fill="${col}"/><path d="M${cx} ${24 - r} A${r * .8} ${r} 0 0 0 ${cx} ${24 + r} Z" fill="#fff3cf"/><circle cx="${cx - r * .35}" cy="24" r="${Math.max(1, r * .12)}" fill="#5a3b1e"/>`;
  const cut = (x, w, n) => { const r = n === 2 ? 15 : n === 3 ? 11 : 9, step = w / n; return `<svg viewBox="0 0 ${w} 40" width="${w * .9}" height="36" aria-hidden="true">${Array.from({ length: n }, (_, k) => piece(x + step * k + step * .5 + r * .45, r, n === 4 ? "#7cc242" : n === 3 ? "#e8b10c" : "#ff2a2a")).join("")}</svg>`; };
  if (kind === "q") return `<svg viewBox="0 0 40 40" width="36" height="36" aria-hidden="true">${whole}</svg>`;
  /* half note: two dark-red apples stuck together (two quarter notes are two apples side by side, not stuck) */
  if (kind === "h") return `<svg viewBox="0 0 68 40" width="62" height="36" aria-hidden="true">${whole}<g transform="translate(28 0)">${whole}</g><rect x="22" y="18" width="24" height="12" rx="6" fill="#9b1020" stroke="#ff7a00" stroke-width="2.4"/></svg>`;
  if (kind === "r") return `<svg viewBox="0 0 40 40" width="36" height="36" aria-hidden="true"><ellipse cx="20" cy="26" rx="16" ry="7" fill="#fff" stroke="#bbb" stroke-width="2"/><ellipse cx="20" cy="25" rx="10" ry="4" fill="none" stroke="#ddd"/></svg>`;
  if (kind === "ee") return cut(0, 40, 2);
  if (kind === "ssss") return cut(0, 44, 4);
  if (kind === "tri") return cut(0, 42, 3);
  return "";
}
/* notes drawn in a 200×240 box: head at the bottom, stem up on the right */
const NOTE_SHAPES = {
  q: [{ head: [80, 190], fill: 1 }, { stem: [104, 186, 40] }],
  h: [{ head: [80, 190], fill: 0 }, { stem: [104, 186, 40] }],
  e: [{ head: [80, 190], fill: 1 }, { stem: [104, 186, 40] }, { flag: [104, 40] }],
  s: [{ head: [80, 190], fill: 1 }, { stem: [104, 186, 40] }, { flag: [104, 40] }, { flag: [104, 75] }],
  ee: [{ head: [55, 190], fill: 1 }, { stem: [79, 186, 50] }, { head: [140, 190], fill: 1 }, { stem: [164, 186, 50] }, { beam: [79, 50, 164, 50] }],
  ssss: [{ head: [55, 190], fill: 1 }, { stem: [79, 186, 50] }, { head: [140, 190], fill: 1 }, { stem: [164, 186, 50] }, { beam: [79, 50, 164, 50] }, { beam: [79, 80, 164, 80] }],
  tri: [{ head: [32, 190], fill: 1 }, { stem: [56, 186, 50] }, { head: [96, 190], fill: 1 }, { stem: [120, 186, 50] }, { head: [160, 190], fill: 1 }, { stem: [184, 186, 50] }, { beam: [56, 50, 184, 50] }, { three: [120, 26] }],
};
function noteDraw(ctx, id, style) {
  const P = NOTE_SHAPES[id]; if (!P) return;
  ctx.save(); ctx.lineCap = "round"; ctx.lineJoin = "round"; ctx.strokeStyle = ctx.fillStyle = style.c; ctx.lineWidth = style.w;
  if (style.dash) ctx.setLineDash(style.dash);
  P.forEach(p => {
    ctx.beginPath();
    if (p.head) { ctx.ellipse(p.head[0], p.head[1], 25, 17, -0.35, 0, Math.PI * 2); if (p.fill && !style.dash) ctx.fill(); else ctx.stroke(); }
    else if (p.stem) { ctx.moveTo(p.stem[0], p.stem[1]); ctx.lineTo(p.stem[0], p.stem[2]); ctx.stroke(); }
    else if (p.flag) { const [x, y] = p.flag; ctx.moveTo(x, y); ctx.bezierCurveTo(x + 10, y + 30, x + 52, y + 42, x + 34, y + 92); ctx.stroke(); }
    else if (p.beam) { const [x1, y1, x2, y2] = p.beam; ctx.lineWidth = style.w * 1.8; ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke(); ctx.lineWidth = style.w; }
    else if (p.three) { ctx.font = `bold ${style.dash ? 34 : 30}px sans-serif`; ctx.textAlign = "center"; if (style.dash) ctx.strokeText("3", p.three[0], p.three[1] + 12); else ctx.fillText("3", p.three[0], p.three[1] + 12); }
  });
  ctx.restore();
}
function noteSVGsmall(id) {
  const c = document.createElement("canvas"); c.width = 200; c.height = 240; noteDraw(c.getContext("2d"), id, { c: "#222", w: 7 });
  return `<img class="rs-note" src="${c.toDataURL()}" alt="">`;
}

/* ---------- sound ---------- */
function clapSound(when = 0, loud = .5) {
  const c = ac(); if (!c) return; const n = c.sampleRate * .08, buf = c.createBuffer(1, n, c.sampleRate), d = buf.getChannelData(0);
  for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / n, 3);
  const s = c.createBufferSource(), f = c.createBiquadFilter(), g = c.createGain(); f.type = "bandpass"; f.frequency.value = 1400; f.Q.value = .8; g.gain.value = loud;
  s.buffer = buf; s.connect(f); f.connect(g); g.connect(outNode()); s.start(c.currentTime + when);
}
const RS_BPM = 80, beatS = () => 60 / RS_BPM;
function rsPattern(u) {   /* 4 beats made from this unit's tiles; the new tile always appears */
  const U = RUNITS[u], ts = U.tiles, nw = ts[ts.length - 1]; let out = [], b = 0;
  while (b < 4) { const opts = ts.filter(x => b + rt(x).b <= 4); const x = opts[Math.floor(Math.random() * opts.length)]; out.push(x); b += rt(x).b; }
  if (!out.includes(nw) && nw !== "r") { const i = out.findIndex(x => rt(x).b === rt(nw).b); if (i >= 0) out[i] = nw; }
  if (out.every(x => x === "r")) out[0] = "q";
  if (U.must && !out.some(x => String(x).includes("~"))) out[Math.floor(Math.random() * out.length)] = U.must[Math.floor(Math.random() * U.must.length)];
  return out;
}
const rsOnsets = pat => { let b = 0, on = []; pat.forEach(x => { rt(x).on.forEach(o => on.push(b + o)); b += rt(x).b; }); return on; };
function rsPlay(pat, countIn = true) {
  const c = ac(); if (!c) return 0; const B = beatS(), start = countIn ? 4 * B : 0;
  if (countIn) for (let i = 0; i < 4; i++) setTimeout(() => click(i === 0), i * B * 1000);
  rsOnsets(pat).forEach(o => clapSound(start + o * B, .6));
  return start;
}

/* ---------- clap detection (microphone) ---------- */
let CC = null;
async function ccStart() {
  try { const st = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false } });
    const c = ac(), src = c.createMediaStreamSource(st), an = c.createAnalyser(); an.fftSize = 512; src.connect(an);
    CC = { st, an, buf: new Float32Array(512), on: [], last: 0, floor: .01, run: false }; return true; } catch (e) { return false; }
}
function ccStop() { if (CC) { CC.run = false; CC.st.getTracks().forEach(x => x.stop()); CC = null; } }
function ccListen(ms, done) {
  if (!CC) return; CC.on = []; CC.run = true; const t0 = performance.now();
  const loop = () => {
    if (!CC || !CC.run) return; CC.an.getFloatTimeDomainData(CC.buf); let r = 0; for (const v of CC.buf) r += v * v; r = Math.sqrt(r / CC.buf.length);
    const now = performance.now(); if (r < CC.floor * 2) CC.floor = CC.floor * .95 + r * .05;
    if (r > Math.max(.05, CC.floor * 6) && now - CC.last > 110) { CC.last = now; CC.on.push((now - t0) / 1000); }
    if (now - t0 < ms) requestAnimationFrame(loop); else { CC.run = false; done(CC.on.slice()); }
  };
  requestAnimationFrame(loop);
}
function ccScore(expect, got) {   /* expect/got in seconds from the first beat; each expected clap matched within 0.17 s */
  const used = new Set(); const marks = expect.map(e => { let k = -1, best = .17; got.forEach((g, i) => { if (!used.has(i) && Math.abs(g - e) < best) { best = Math.abs(g - e); k = i; } }); if (k >= 0) used.add(k); return k >= 0; });
  const extra = got.length - used.size; return { marks, ok: marks.every(Boolean) && extra <= 1 };
}

/* ---------- writing: trace and check ---------- */
function rsMask(id) { const c = document.createElement("canvas"); c.width = 200; c.height = 240; noteDraw(c.getContext("2d"), id, { c: "#000", w: 12 }); return c.getContext("2d").getImageData(0, 0, 200, 240).data; }
function rsCheck(canvas, id) {
  const m = rsMask(id), d = canvas.getContext("2d").getImageData(0, 0, 200, 240).data, near = (arr, x, y, r) => { for (let dy = -r; dy <= r; dy += 3) for (let dx = -r; dx <= r; dx += 3) { const xx = x + dx, yy = y + dy; if (xx >= 0 && yy >= 0 && xx < 200 && yy < 240 && arr[(yy * 200 + xx) * 4 + 3] > 40) return true; } return false; };
  let tN = 0, tHit = 0, dN = 0, dHit = 0;
  for (let y = 0; y < 240; y += 4) for (let x = 0; x < 200; x += 4) {
    const i = (y * 200 + x) * 4;
    if (m[i + 3] > 40) { tN++; if (near(d, x, y, 12)) tHit++; }
    if (d[i + 3] > 40 && d[i] < 120 && d[i + 2] > 120) { dN++; if (near(m, x, y, 16)) dHit++; }   /* the child's ink is blue */
  }
  return { cover: tN ? tHit / tN : 0, clean: dN ? dHit / dN : 0, ink: dN };
}
function rsCanvasWire() {
  const cv = document.getElementById("rsCanvas"); if (!cv) return; const ctx = cv.getContext("2d");
  const paintGuide = () => { const g = document.getElementById("rsGuide"); if (!g) return; const gx = g.getContext("2d"); gx.clearRect(0, 0, 200, 240); if (RS.guide) noteDraw(gx, RS.wid, { c: "#b8b2cc", w: 10, dash: [8, 8] }); };
  paintGuide(); let drawing = false, last = null;
  const pos = e => { const r = cv.getBoundingClientRect(); return [(e.clientX - r.left) * 200 / r.width, (e.clientY - r.top) * 240 / r.height]; };
  cv.onpointerdown = e => { e.preventDefault(); drawing = true; last = pos(e); ctx.fillStyle = "#2f5bea"; ctx.beginPath(); ctx.arc(last[0], last[1], 5, 0, 7); ctx.fill(); try { cv.setPointerCapture(e.pointerId); } catch (_) { } };
  cv.onpointermove = e => { if (!drawing) return; e.preventDefault(); const p = pos(e); ctx.strokeStyle = "#2f5bea"; ctx.lineWidth = 10; ctx.lineCap = "round"; ctx.beginPath(); ctx.moveTo(last[0], last[1]); ctx.lineTo(p[0], p[1]); ctx.stroke(); last = p; };
  cv.onpointerup = cv.onpointercancel = () => { drawing = false; };
}

/* ---------- screens ---------- */
const RSTEPS = ["copy", "apple", "write", "paper"];
function rsCard() {
  const n = rsOpenN(), U = RUNITS[n - 1], D = rsS().done[U.id] || {}, stars = RSTEPS.filter(k => D[k]).length;
  return `<div class="card stack rs-card"><div class="section-head"><h2>🍎 ${t("rs_h")}</h2><span class="pill m">${t("rs_week", { n })}</span></div>
   <div class="rs-unit-row">${noteSVGsmall(U.write[0])}<div class="grow"><b>${t("rs_u_" + U.id)}</b><div class="small muted">${t("rs_u_" + U.id + "_s")}</div><div>${"⭐".repeat(stars)}${"☆".repeat(RSTEPS.length - stars)}</div></div></div>
   <button class="btn block" data-rs="open" data-u="${n - 1}">${stars === RSTEPS.length ? t("rs_again") : t("rs_go")}</button></div>`;
}
function rsOpen(u, stage = "menu") { RS = { u, stage }; rsRender(); }
function rsRender() {
  const U = RUNITS[RS.u], D = rsS().done[U.id] || {}, head = `<div class="act-head"><h2>🍎 ${t("rs_u_" + U.id)}</h2><button class="icon-btn" data-act="close" aria-label="Close">${I.close}</button></div>`;
  let body = "";
  if (RS.stage === "menu") {
    body = `<div class="card rs-learn"><div class="rs-unit-row">${noteSVGsmall(U.write[0])}<div class="grow"><b>${t("rs_u_" + U.id)}</b><div>${t("rs_learn_" + U.id)}</div></div></div></div>
     ${RSTEPS.map((k, i) => `<button class="card rs-step ${D[k] ? "done" : ""}" data-rs="stage" data-s="${k}"><span class="rs-step-n">${D[k] ? "⭐" : i + 1}</span><span class="grow"><b>${t("rs_st_" + k)}</b><span class="small muted">${t("rs_st_" + k + "_s")}</span></span></button>`).join("")}
     ${RUNITS.slice(0, rsOpenN()).length > 1 ? `<div class="chips">${RUNITS.slice(0, rsOpenN()).map((x, i) => `<button class="chip ${i === RS.u ? "on" : ""}" data-rs="open" data-u="${i}">${t("rs_week", { n: i + 1 })}</button>`).join("")}</div>` : ""}
     <div class="muted small">${t("rs_next")}</div>`;
  } else if (RS.stage === "copy") {
    RS.pat ||= rsPattern(RS.u);
    body = `<div class="card stack" style="align-items:center"><b>👏 ${t("rs_copyHow")}</b>
      <div class="rs-pat">${RS.pat.map(x => `<span class="rs-tile">${appleSVG(x)}<small>${rt(x).say}</small></span>`).join("")}</div>
      ${RS.res ? `<div class="rs-res">${RS.res.marks.map(m => `<i class="${m ? "ok" : "no"}">${m ? "✓" : "✗"}</i>`).join("")}</div><b style="color:${RS.res.ok ? "var(--good)" : "var(--bad)"}">${RS.res.ok ? t("rs_copyOk") : RS.res.msg || t("rs_copyNo")}</b>` : ""}
      ${RS.busy ? `<div class="rs-beat" id="rsBeat">${RS.busy}</div>` : `<div class="row" style="gap:8px"><button class="btn soft" data-rs="listen">🔊 ${t("rs_listen")}</button><button class="btn" data-rs="clap">👏 ${t("rs_myTurn")}</button></div>`}
      ${RS.noMic ? `<div class="small muted">${t("rs_noMic")}</div><button class="btn sm ghost" data-rs="selfok">✓ ${t("rs_selfOk")}</button>` : ""}
      ${RS.res ? `<button class="btn sm ghost" data-rs="newpat">↻ ${t("rs_newOne")}</button>` : ""}</div>`;
  } else if (RS.stage === "apple") {
    RS.pat ||= rsPattern(RS.u); RS.line ||= [];
    const used = RS.line.reduce((a, x) => a + rt(x).b, 0);
    body = `<div class="card stack" style="align-items:center"><b>🍎 ${t("rs_appleHow")}</b><button class="btn soft sm" data-rs="listen">🔊 ${t("rs_listen")}</button>
      ${U.glue ? `<div class="small rs-tipline">🔗 ${t("rs_glueHow")}</div>` : ""}
      <div class="rs-line">${RS.line.map((x, i) => `<span class="rs-tile on ${RS.aWrong === i ? "wrong" : ""}"><button class="rs-x" data-rs="unline" data-i="${i}" aria-label="Remove">×</button>${appleSVG(x)}<small>${rt(x).say}</small>${U.glue && SYL[rtBase(x)] ? `<span class="rs-seams">${SYL[rtBase(x)].slice(1).map((_, k) => `<button class="rs-seam ${(String(x).split("~")[1] || "1111")[k + 1] === "0" ? "on" : ""}" data-rs="seam" data-i="${i}" data-k="${k + 1}">🔗</button>`).join("")}</span>` : ""}</span>`).join("")}${Array.from({ length: Math.max(0, 4 - used) }, () => `<span class="rs-slot"></span>`).join("")}</div>
      ${RS.aRes != null ? `<b style="color:${RS.aRes ? "var(--good)" : "var(--bad)"}">${RS.aRes ? t("rs_appleOk") : RS.aMsg || t("rs_appleNo")}</b>${RS.aRes ? "" : `<div class="rs-pat small">${RS.pat.map(x => `<span class="rs-tile">${appleSVG(x)}<small>${rt(x).say}</small></span>`).join("")}</div>`}<button class="btn sm ghost" data-rs="newpat">↻ ${t("rs_newOne")}</button>` : ""}
      <div class="rs-pick">${U.tiles.map(x => `<button class="rs-tile" data-rs="line" data-x="${x}" ${used + rt(x).b > 4 || RS.aRes != null ? "disabled" : ""}>${appleSVG(x)}<small>${rt(x).say}</small></button>`).join("")}</div>
      ${used === 4 && RS.aRes == null ? `<button class="btn" data-rs="acheck">✓ ${t("rs_check")}</button>` : ""}</div>`;
  } else if (RS.stage === "paper") {
    RS.pat ||= rsPattern(RS.u);
    const P = (S.papers || []).filter(x => x.unit === U.id).slice(-1)[0];
    body = `<div class="card paper-banner">📄✏️ <b>${t("rs_paperBanner")}</b></div>
     <div class="card stack" style="align-items:center"><b>${t("rs_paperHow")}</b>
      <div class="rs-pat">${RS.pat.map(x => `<span class="rs-tile">${appleSVG(x)}${NOTE_SHAPES[x] ? noteSVGsmall(x) : x === "r" ? `<span class="rs-rest">𝄽</span>` : ""}<small>${rt(x).say}</small></span>`).join("")}</div>
      <ol class="small rs-paper-steps"><li>${t("rs_p1")}</li><li>${t("rs_p2")}</li><li>${t("rs_p3")}</li></ol>
      ${RS.photo ? `<img class="rs-photo" src="${RS.photo}" alt=""><div class="row" style="gap:8px"><label class="btn soft">↺ ${t("rs_pAgain")}<input type="file" accept="image/*" capture="environment" id="rsPhoto" hidden></label><button class="btn" data-rs="psend">📤 ${t("rs_pSend")}</button></div>`
        : `<label class="btn block">📷 ${t("rs_pTake")}<input type="file" accept="image/*" capture="environment" id="rsPhoto" hidden></label>`}
      ${P ? `<div class="small muted">✓ ${t("rs_pSent", { d: fmt(P.date) })}</div>` : ""}
      <button class="btn sm ghost" data-rs="newpat">↻ ${t("rs_newOne")}</button></div>`;
  } else if (RS.stage === "write") {
    RS.wi ??= 0; RS.wid = U.write[RS.wi]; RS.guide ??= true;
    body = `<div class="card stack" style="align-items:center"><b>✍️ ${t(RS.guide ? "rs_trace" : "rs_alone")}</b><div class="small rs-tip">${t("rs_tip_" + RS.wid)}</div>
      <div class="rs-pad"><canvas id="rsGuide" width="200" height="240"></canvas><canvas id="rsCanvas" width="200" height="240"></canvas>${RS.guide ? "" : `<div class="rs-model">${noteSVGsmall(RS.wid)}</div>`}</div>
      ${RS.wRes ? `<b style="color:${RS.wRes.ok ? "var(--good)" : "var(--bad)"}">${RS.wRes.ok ? t("rs_writeOk") : t(RS.wRes.why)}</b>` : ""}
      <div class="row" style="gap:8px"><button class="btn soft" data-rs="wclear">🧽 ${t("rs_erase")}</button><button class="btn" data-rs="wcheck">✓ ${t("rs_check")}</button></div>
      <div class="muted small">${U.write.map((w, i) => `${i === RS.wi ? "▶ " : ""}${t("rs_w_" + w)}`).join(" · ")}</div></div>`;
  }
  const back = RS.stage === "menu" ? "" : `<button class="btn ghost sm" data-rs="stage" data-s="menu">← ${t("rs_back")}</button>`;
  openSheet(`<div class="stack rs">${head}${back}${body}</div>`);
  if (RS.stage === "write") rsCanvasWire();
}
function rsDone(k) {
  const U = RUNITS[RS.u], st = rsS(); st.done[U.id] ||= {};
  if (!st.done[U.id][k]) { st.done[U.id][k] = TK; earn(3); celebrate(); toast(t("rs_star")); } if (typeof markDone === "function") markDone("rhythm"); save(); refreshTop();
}
document.addEventListener("click", async e => {
  const b = e.target.closest("[data-rs]"); if (!b || !S) return; const a = b.dataset.rs;
  if (a === "open") { rsS(); rsOpen(+b.dataset.u); }
  else if (a === "stage") { ccStop(); Object.assign(RS, { stage: b.dataset.s, pat: null, res: null, line: null, aRes: null, wi: 0, guide: true, wRes: null, busy: null }); rsRender(); }
  else if (a === "newpat") { Object.assign(RS, { pat: null, res: null, line: null, aRes: null }); rsRender(); }
  else if (a === "listen") { await acReady(); rsPlay(RS.pat, false); }
  else if (a === "clap") {
    await acReady(); const ok = CC || await ccStart(); if (!ok) { RS.noMic = true; rsRender(); return; }
    const B = beatS(); RS.busy = t("rs_ready"); RS.res = null; rsRender();
    for (let i = 0; i < 4; i++) setTimeout(() => { click(i === 0); const el = document.getElementById("rsBeat"); if (el) el.textContent = i < 3 ? String(4 - i) + "…" : t("rs_go2"); }, i * B * 1000);
    setTimeout(() => ccListen((4 * B + .6) * 1000 + 300, got => {
      const exp = rsOnsets(RS.pat).map(o => o * B), g = got.map(x => x - .02);
      RS.busy = null; RS.res = ccScore(exp, g); RS.res.msg = rsClapWhy(RS.pat, RS.res, g, B); if (RS.res.msg) RS.res.ok = false; if (RS.res.ok) rsDone("copy"); rsRender();
    }), 4 * B * 1000 - 150);
  }
  else if (a === "selfok") { RS.res = { marks: rsOnsets(RS.pat).map(() => true), ok: true }; rsRender(); }
  else if (a === "line") { RS.line.push(b.dataset.x); clapSound(0, .3); rsRender(); }
  else if (a === "unline") { RS.line.splice(+b.dataset.i, 1); RS.aRes = null; RS.aWrong = null; rsRender(); }
  else if (a === "seam") { const i = +b.dataset.i, k = +b.dataset.k, x = RS.line[i], base = rtBase(x), n = SYL[base].length, m = (String(x).split("~")[1] || "1".repeat(n)).split(""); m[k] = m[k] === "1" ? "0" : "1"; const mm = m.join(""); RS.line[i] = mm === "1".repeat(n) ? base : base + "~" + mm; RS.aRes = null; RS.aWrong = null; rsRender(); }
  else if (a === "acheck") { RS.aRes = RS.line.join() === RS.pat.join(); RS.aWrong = null; RS.aMsg = ""; if (!RS.aRes) { const i = RS.line.findIndex((x, k) => x !== RS.pat[k]); RS.aWrong = i; const x = RS.line[i], y = RS.pat[i]; RS.aMsg = !y || rt(x).b !== rt(y).b ? t("rs_aBeats", { n: i + 1 }) : rtBase(x) === rtBase(y) ? t("rs_aGlue", { n: i + 1 }) : t("rs_aPieces", { n: i + 1 }); } if (RS.aRes) { rsDone("apple"); await acReady(); rsPlay(RS.pat, false); } rsRender(); }
  else if (a === "wclear") { RS.wRes = null; rsRender(); }
  else if (a === "wcheck") {
    const r = rsCheck(document.getElementById("rsCanvas"), RS.wid), need = (+S.profile?.age || 9) <= 5 ? .6 : RS.guide ? .7 : .55;
    const ok = r.ink > 8 && r.cover >= need && r.clean >= .6;
    RS.wRes = { ok, why: r.ink <= 8 ? "rs_wEmpty" : r.cover < need ? "rs_wMissing" : "rs_wMessy" };
    if (ok) {
      const U = RUNITS[RS.u];
      setTimeout(() => {
        const little = (+S.profile?.age || 9) <= 5;
        if (RS.guide && !little) RS.guide = false; else if (RS.wi < U.write.length - 1) { RS.wi++; RS.guide = true; } else { rsDone("write"); RS.stage = "menu"; }
        RS.wRes = null; rsRender();
      }, 1100);
    }
    const keep = document.getElementById("rsCanvas").toDataURL(); rsRender(); const cv = document.getElementById("rsCanvas"), im = new Image(); im.onload = () => cv.getContext("2d").drawImage(im, 0, 0); im.src = keep;
  }
});

/* why the clapping was not right: a missed clap, or a clap on a glued piece (that is held, not clapped) */
function rsClapWhy(pat, res, got, B) {
  let beat = 0; const exp = [], glued = [];
  pat.forEach(x => { const T = rt(x); T.on.forEach(o => exp.push(beat + o)); if (T.mask) RTILE[T.base].on.forEach((o, k) => { if (T.mask[k] === "0") glued.push(beat + o); }); beat += T.b; });
  const tie = got.some(g => glued.some(o => Math.abs(g - o * B) < .12) && !exp.some(o => Math.abs(g - o * B) < .12));
  if (tie) return t("rs_cTie");
  if (res.ok) return "";
  const miss = res.marks.findIndex(m => !m); if (miss >= 0) return t("rs_cMiss", { n: Math.floor(exp[miss]) + 1 });
  return t("rs_copyNo");
}

/* the photo of the paper: made small (max 1200 px, JPEG) and sent to the teacher */
async function rsShrink(file) {
  const url = URL.createObjectURL(file), im = await new Promise((ok, no) => { const i = new Image(); i.onload = () => ok(i); i.onerror = no; i.src = url; });
  const k = Math.min(1, 1200 / Math.max(im.width, im.height)), c = document.createElement("canvas"); c.width = Math.round(im.width * k); c.height = Math.round(im.height * k);
  c.getContext("2d").drawImage(im, 0, 0, c.width, c.height); URL.revokeObjectURL(url);
  return new Promise(ok => c.toBlob(b => ok(b), "image/jpeg", .8));
}
document.addEventListener("change", async e => {
  if (e.target.id !== "rsPhoto" || !RS) return; const f = e.target.files?.[0]; if (!f) return;
  try { RS.blob = await rsShrink(f); if (RS.photo) URL.revokeObjectURL(RS.photo); RS.photo = URL.createObjectURL(RS.blob); rsRender(); } catch (er) { toast(t("rs_pBad")); }
});
document.addEventListener("click", async e => {
  const b = e.target.closest('[data-rs="psend"]'); if (!b || !RS?.blob) return; b.disabled = true;
  const U = RUNITS[RS.u], id = uid(), path = `${ME}/paper-${id}.jpg`;
  try { if (typeof DEMO === "undefined" || !DEMO) await DB.upload("recordings", path, RS.blob, "image/jpeg"); }
  catch (er) { b.disabled = false; toast(t("err_net")); return; }
  S.papers = (S.papers || []).concat({ id, date: TK, unit: U.id, path, pat: RS.pat.slice() }).slice(-30);
  rsDone("paper"); URL.revokeObjectURL(RS.photo); RS.photo = null; RS.blob = null; rsRender(); toast(t("rs_pDone"));
});
