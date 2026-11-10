/* ===== Technique: short 30-second exercises with simple pictures =====
   DRAFT texts for Atsuko to check. Each one can be added to today's plan as a "30 seconds" card. */
const TECH = [
  { id: "tip", em: "☝️", pic: "tip" },
  { id: "line", em: "🚪", pic: "line" },
  { id: "ball", em: "🤲", pic: "ball" },
  { id: "thumb", em: "😌", pic: "thumb" },
  /* Atsuko's own model videos (level 2 and level 3): right hand and left hand separately */
  { id: "fex2", em: "🎬", lv: 2, vid: { R: "assets/video/finger2_R.mp4", L: "assets/video/finger2_L.mp4" } },
  { id: "fex", em: "🎬", lv: 3, vid: { R: "assets/video/finger_R.mp4", L: "assets/video/finger_L.mp4" } },
];
const techOf = id => TECH.find(x => x.id === id) || TECH[0];
/* the technique for today rotates, so small children get a different one each day */
const techToday = () => { const b = TECH.filter(x => !x.vid); return b[DAYNO % b.length]; };

/* side view: a piano key (white key with its black neighbour behind) and a finger with a nail.
   good = the joint next to the nail stays firm; bad = it collapses backwards */
const SKIN = "#F4CBA8", SKIN_D = "#D99E78";
function keySide(y) {
  return `<defs><linearGradient id="wkg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffffff"/><stop offset="1" stop-color="#E9E6EF"/></linearGradient><linearGradient id="bkg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#4A4458"/><stop offset="1" stop-color="#1C1826"/></linearGradient></defs>
   <rect x="96" y="${y - 12}" width="44" height="12" rx="2" fill="url(#bkg)"/>
   <rect x="4" y="${y}" width="136" height="9" rx="1.5" fill="url(#wkg)" stroke="#BDB6CC"/><rect x="4" y="${y + 9}" width="136" height="14" fill="#DAD5E3" stroke="#BDB6CC"/>`;
}
function fingerSVG(bad) {
  /* close side view of ONE finger on one key: knuckle → middle joint → nail joint → tip.
     good: the finger is a round arch and stands on its tip; bad: the nail joint caves in (bends backwards) */
  const P = bad ? [[14, 30], [46, 32], [64, 80], [94, 76]] : [[14, 30], [46, 34], [68, 58], [74, 84]];
  const seg = P.map(p => p.join(" ")).join(" L");
  const [dx, dy] = [P[3][0] - P[2][0], P[3][1] - P[2][1]], ang = Math.atan2(dy, dx) * 180 / Math.PI, L = Math.hypot(dx, dy), nx = P[2][0] + dx * .6 + dy / L * 4.5, ny = P[2][1] + dy * .6 - dx / L * 4.5;
  return `<svg viewBox="0 0 110 118" class="tech-svg finger ${bad ? "bad" : "good"}" aria-hidden="true">
   <rect x="0" y="88" width="110" height="10" rx="2" fill="#fff" stroke="#BDB6CC"/><rect x="0" y="98" width="110" height="10" fill="#DAD5E3" stroke="#BDB6CC"/>
   <path d="M-6 22 Q4 18 ${P[0][0]} ${P[0][1]}" stroke="${SKIN}" stroke-width="26" stroke-linecap="round" fill="none"/>
   <path d="M${seg}" fill="none" stroke="${SKIN}" stroke-width="15" stroke-linecap="round" stroke-linejoin="round"/>
   <ellipse cx="${nx}" cy="${ny}" rx="7" ry="3.8" fill="#FBE3E3" stroke="#E8B9B4" transform="rotate(${ang} ${nx} ${ny})"/>
   ${P.slice(0, 3).map(p => `<circle cx="${p[0]}" cy="${p[1]}" r="2.2" fill="${SKIN_D}"/>`).join("")}
   ${bad ? `<circle cx="${P[2][0]}" cy="${P[2][1]}" r="11" fill="none" stroke="#E5484D" stroke-width="3"/>` : `<path d="M${P[1][0] - 6} ${P[1][1] - 16} Q${P[2][0] + 14} ${P[1][1] - 8} ${P[3][0] + 10} ${P[3][1] - 10}" fill="none" stroke="#2BB673" stroke-width="2" stroke-dasharray="4 3"/>`}
   <text x="96" y="20" text-anchor="middle" font-size="20" font-weight="900" fill="${bad ? "#E5484D" : "#2BB673"}">${bad ? "✗" : "✓"}</text></svg>`;
}
/* side view of the forearm and hand: good = one straight line from the elbow to the knuckles (like turning a doorknob); bad = the wrist sags */
function armSVG(bad) {
  /* turning a doorknob: elbow, wrist and knuckles make one straight line; bad = the wrist bends */
  const W = bad ? [74, 64] : [74, 46], K = bad ? [100, 40] : [100, 46];
  return `<svg viewBox="0 0 150 100" class="tech-svg ${bad ? "bad" : "good"}" aria-hidden="true">
   <rect x="122" y="6" width="26" height="92" rx="2" fill="#E9D3B4" stroke="#C9A982"/>
   <rect x="112" y="40" width="12" height="12" rx="2" fill="#B8B2C4"/><circle cx="110" cy="46" r="10" fill="#F2C94C" stroke="#C9A12E" stroke-width="2"/>
   ${bad ? "" : `<line x1="6" y1="46" x2="112" y2="46" stroke="#2BB673" stroke-width="1.8" stroke-dasharray="5 4"/>`}
   <path d="M10 46 L${W[0]} ${W[1]} L${K[0]} ${K[1]}" fill="none" stroke="${SKIN}" stroke-width="15" stroke-linecap="round" stroke-linejoin="round"/>
   <path d="M${K[0] - 2} ${K[1] - 9} Q${K[0] + 16} ${K[1] - 12} ${K[0] + 14} ${K[1]} Q${K[0] + 16} ${K[1] + 12} ${K[0] - 2} ${K[1] + 9}" fill="${SKIN}" stroke="#d9a07c" stroke-width="1.2"/>
   <circle cx="10" cy="46" r="4" fill="#d9a07c"/><circle cx="${W[0]}" cy="${W[1]}" r="4.5" fill="${bad ? "#E5484D" : "#d9a07c"}"/>
   <text x="60" y="18" text-anchor="middle" font-size="16" font-weight="900" fill="${bad ? "#E5484D" : "#2BB673"}">${bad ? "✗" : "✓"}</text></svg>`;
}
/* natural hand: let the arm hang down loosely — keep that same soft shape on the keys */
function hangSVG() {
  const hand = (x, y, r) => `<g transform="translate(${x} ${y}) rotate(${r})"><path d="M0 0 L0 30" stroke="${SKIN}" stroke-width="14" stroke-linecap="round"/><path d="M-6 30 Q-10 44 -2 52 M0 32 Q-2 48 6 54 M6 30 Q8 44 13 50" fill="none" stroke="${SKIN}" stroke-width="6" stroke-linecap="round"/></g>`;
  return `<div class="tech-pics"><svg viewBox="0 0 100 100" class="tech-svg good" aria-hidden="true">${hand(50, 8, 0)}<text x="50" y="96" text-anchor="middle" font-size="11" font-weight="800" fill="#6C5CE7">1. let it hang</text></svg>
   <svg viewBox="0 0 100 100" class="tech-svg good" aria-hidden="true"><rect x="4" y="66" width="92" height="16" rx="2" fill="#fff" stroke="#c9c4d6"/><g transform="translate(28 20) rotate(-62)"><path d="M0 0 L0 30" stroke="${SKIN}" stroke-width="14" stroke-linecap="round"/><path d="M-6 30 Q-10 44 -2 52 M0 32 Q-2 48 6 54 M6 30 Q8 44 13 50" fill="none" stroke="${SKIN}" stroke-width="6" stroke-linecap="round"/></g><text x="50" y="96" text-anchor="middle" font-size="11" font-weight="800" fill="#6C5CE7">2. same shape</text></svg></div>`;
}
function techPic(id) {
  if (id === "tip") return `<div class="tech-pics fingers"><div>${fingerSVG(false)}<div class="tp-cap good">${t("tc_tipGood")}</div></div><div>${fingerSVG(true)}<div class="tp-cap bad">${t("tc_tipBad")}</div></div></div>`;
  if (id === "line") return `<div class="tech-pics">${armSVG(false)}${armSVG(true)}</div>`;
  if (id === "ball") return hangSVG();
  if (id === "ball_old") return `<svg viewBox="0 0 160 90" class="tech-svg" aria-hidden="true"><rect x="0" y="72" width="160" height="16" rx="3" fill="#fff" stroke="#c9c4d6"/><circle cx="80" cy="52" r="20" fill="#FFB44D"/><path d="M28 72 Q36 20 80 18 Q124 20 132 72" fill="none" stroke="${SKIN}" stroke-width="14" stroke-linecap="round"/></svg>`;
  if (id === "wrist") return `<svg viewBox="0 0 160 90" class="tech-svg" aria-hidden="true"><rect x="0" y="72" width="160" height="16" rx="3" fill="#fff" stroke="#c9c4d6"/><path d="M20 40 Q60 30 90 46 L110 70" fill="none" stroke="${SKIN}" stroke-width="14" stroke-linecap="round"/><path d="M60 18 L60 8 M54 14 L60 8 L66 14 M60 60 L60 70" stroke="#6C5CE7" stroke-width="3" fill="none" stroke-linecap="round"/><text x="72" y="16" font-size="11" fill="#6C5CE7" font-weight="700">up</text><text x="72" y="66" font-size="11" fill="#6C5CE7" font-weight="700">down</text></svg>`;
  const keys = (marks) => `<svg viewBox="0 0 160 70" class="tech-svg" aria-hidden="true">${[0, 1, 2, 3, 4, 5, 6].map(i => `<rect x="${8 + i * 20.5}" y="8" width="20" height="56" rx="2" fill="#fff" stroke="#c9c4d6"/>`).join("")}${[0, 1, 3, 4, 5].map(i => `<rect x="${22 + i * 20.5}" y="8" width="12" height="34" rx="1.5" fill="#2A2438"/>`).join("")}${marks}</svg>`;
  if (id === "thumb") return `<svg viewBox="0 0 160 110" class="tech-svg" aria-hidden="true"><defs><linearGradient id="bk2" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2B2635"/><stop offset=".85" stop-color="#4A4458"/><stop offset="1" stop-color="#15121D"/></linearGradient></defs>
   <rect x="4" y="34" width="152" height="70" rx="3" fill="#C8C2D4"/>${[0, 1, 2, 3, 4, 5, 6].map(i => `<rect x="${5 + i * 21.6}" y="34" width="20.6" height="68" rx="2.5" fill="#fff" stroke="#D3CEDD"/>`).join("")}
   ${[0, 1, 3, 4, 5].map(i => `<rect x="${18.5 + i * 21.6}" y="34" width="12" height="40" rx="2" fill="url(#bk2)"/>`).join("")}
   <path d="M30 10 Q60 0 100 6 Q120 10 124 22 L120 44 Q80 52 40 46 Z" fill="${SKIN}"/>
   ${[0, 1, 2, 3].map(i => `<path d="M${54 + i * 19} 40 Q${55 + i * 19} 66 ${57 + i * 19} 86" stroke="${SKIN}" stroke-width="13" stroke-linecap="round" fill="none"/><ellipse cx="${57 + i * 19}" cy="86" rx="4.2" ry="3" fill="#FBE3E3" stroke="#E8B9B4"/>`).join("")}
   <path d="M38 34 Q22 56 20 82" stroke="${SKIN}" stroke-width="14" stroke-linecap="round" fill="none"/><ellipse cx="20" cy="83" rx="4.5" ry="3.2" fill="#FBE3E3" stroke="#E8B9B4" transform="rotate(-20 20 83)"/>
   <path d="M2 60 q5 -7 10 0 q5 7 10 0" stroke="#2BB673" stroke-width="2.2" fill="none"/><text x="10" y="50" font-size="13">😌</text></svg>`;
  return keys([0, 1, 2, 3, 4].map(i => `<circle cx="${18 + i * 20.5}" cy="54" r="7" fill="${i === 2 ? "#6C5CE7" : "#F2C7A5"}"/><text x="${18 + i * 20.5}" y="58" text-anchor="middle" font-size="9" font-weight="800" fill="${i === 2 ? "#fff" : "#7a5a44"}">${i + 1}</text>`).join("") + `<path d="M59 36 L59 24 M54 29 L59 24 L64 29" stroke="#6C5CE7" stroke-width="2.5" fill="none" stroke-linecap="round"/>`);
}

/* ---------- level-3 finger exercise with the teacher's model videos ----------
   hands: right / left (each its own video). ways: with the video, on my own, singing (video silent).
   speed: slow / normal / fast. The microphone does not count while the video plays with sound
   (it would hear the video), so coins still come only from the child's own playing. */
const FEX_RATES = { slow: .75, mid: 1, fast: 1.25 };
function fexSheet(c) {
  const T = techOf(c.tech), F = PPC.fx ||= { hand: (c.fh?.R && !c.fh?.L) ? "L" : "R", mode: "with", rate: "mid" }, H = c.fh || {};
  const tab = h => `<button class="seg ${F.hand === h ? "on" : ""}" data-pp="fexHand" data-v="${h}">${H[h] ? "✓ " : ""}${t("fx_" + h)}</button>`;
  const ch = (f, v, l) => `<button class="chip ${F[f] === v ? "on" : ""}" data-pp="fexSet" data-f="${f}" data-v="${v}">${l}</button>`;
  const vid = F.mode !== "alone";
  return `<div class="stack pp-counter"><div class="act-head"><h2>${T.em} ${t("fx_title")} <span class="lv-badge">Lv ${T.lv}</span></h2><button class="icon-btn" data-act="close" aria-label="Close">${I.close}</button></div>
  <div class="segtabs fex-hands">${tab("R")}${tab("L")}</div>
  <div class="chips fex-modes">${ch("mode", "with", "🎬 " + t("fx_with"))}${ch("mode", "alone", "🙋 " + t("fx_alone"))}${ch("mode", "sing", "🎤 " + t("fx_sing"))}</div>
  ${vid ? `<video id="fexV" class="fex-video" src="${T.vid[F.hand]}" poster="${T.vid[F.hand].replace(".mp4", ".jpg")}" playsinline controls preload="metadata" ${F.mode === "sing" ? "muted" : ""}></video>
  <div class="chips fex-speed"><span class="small muted">${t("fx_speed")}</span>${ch("rate", "slow", "🐢 " + t("fx_slow"))}${ch("rate", "mid", t("fx_mid"))}${ch("rate", "fast", "🐇 " + t("fx_fast"))}</div>` : ""}
  <div class="card tech-how" id="fexHow">${t("fx_how_" + F.mode)}</div>
  <div class="muted small" id="heardNow" style="text-align:center">${typeof smLabel === "function" && SM.on ? smLabel() : ""}</div>
  ${c.done ? `<div class="pp-all">🎉 ${t("pp_cardDone")}</div><button class="btn block" data-act="close">OK</button>`
    : `<button class="btn block" data-pp="fexDone">✓ ${t("fx_done_" + F.hand)}</button>`}</div>`;
}
/* "fingertips don't bend": play with the teacher's finger-exercise video, film your own hand from the side, then watch it and check */
function tipSheet(c) {
  const F = PPC.tp ||= { hand: "R", lv: (+(PROF?.grade ?? 1)) <= 1 ? "fex2" : "fex", url: null }, T = techOf(F.lv);
  const ch = (f, v, l) => `<button class="chip ${F[f] === v ? "on" : ""}" data-pp="tipSet" data-f="${f}" data-v="${v}">${l}</button>`;
  return `<div class="stack pp-counter"><div class="act-head"><h2>☝️ ${t("tc_tip")}</h2><button class="icon-btn" data-act="close" aria-label="Close">${I.close}</button></div>
   <div class="tech-pic">${techPic("tip")}</div>
   <div class="card stack tp-step"><b>1. ${t("tp_s1")}</b>
    <div class="chips">${ch("lv", "fex2", "Lv 2")}${ch("lv", "fex", "Lv 3")}${ch("hand", "R", t("fx_R"))}${ch("hand", "L", t("fx_L"))}</div>
    <video class="fex-video" src="${T.vid[F.hand]}" poster="${T.vid[F.hand].replace(".mp4", ".jpg")}" playsinline controls preload="metadata"></video></div>
   <div class="card stack tp-step"><b>2. ${t("tp_s2")}</b><div class="small muted">📱 ${t("tp_s2how")}</div>
    <label class="btn block">📹 ${t("tp_rec")}<input type="file" accept="video/*" capture="environment" id="tipRec" hidden></label></div>
   <div class="card stack tp-step ${F.url ? "" : "tp-wait"}"><b>3. ${t("tp_s3")}</b>
    ${F.url ? `<video class="fex-video" src="${F.url}" playsinline controls></video><div class="small">${t("tp_q")}</div>
      ${c.done ? `<div class="pp-all">🎉 ${t("pp_cardDone")}</div>` : `<button class="btn block" data-pp="tipOk">✓ ${t("tp_ok")}</button><button class="btn ghost block" data-pp="tipNo">✗ ${t("tp_no")}</button>`}`
      : `<div class="small muted">${t("tp_after")}</div>`}</div>
   ${c.done ? `<button class="btn block" data-act="close">OK</button>` : ""}</div>`;
}
document.addEventListener("change", e => {
  if (e.target.id !== "tipRec" || !PPC?.tp) return; const f = e.target.files?.[0]; if (!f) return;
  if (PPC.tp.url) URL.revokeObjectURL(PPC.tp.url); PPC.tp.url = URL.createObjectURL(f); ppCounter(PPC.id);
  setTimeout(() => document.querySelector(".tp-step:last-of-type video, .tp-step video[src^='blob']")?.scrollIntoView({ behavior: "smooth", block: "center" }), 200);
});
/* free use from the home screen (no plan needed): the same video sheet */
let FEXF = null;
function fexFree(id, fresh) {
  if (fresh || !FEXF || FEXF.tech !== id || FEXF.done) FEXF = { tech: id, fh: {}, done: false };
  PPC = { id: "__fex", free: true, fx: (!fresh && PPC?.free && PPC.fx) || null }; openSheet(fexSheet(FEXF)); fexWire();
}
function fexHome() {
  const V = TECH.filter(x => x.vid); if (!V.length) return "";
  return `<div class="card fex-quick"><span class="rs-quick-ic">🎬</span><span class="grow"><b>${t("fx_homeH")}</b><span class="small muted">${t("fx_homeSub")}</span>
   <span class="chips" style="margin-top:6px">${V.map(x => `<button class="btn sm" data-fexfree="${x.id}">▶ Lv ${x.lv}</button>`).join("")}</span></span></div>`;
}
document.addEventListener("click", e => { const b = e.target.closest("[data-fexfree]"); if (b) fexFree(b.dataset.fexfree, true); });
function fexWire() {
  const v = document.getElementById("fexV"); if (!v || !PPC?.fx) return;
  const r = FEX_RATES[PPC.fx.rate] || 1; v.defaultPlaybackRate = r; v.playbackRate = r; v.preservesPitch = true; v.muted = PPC.fx.mode === "sing";
  v.addEventListener("play", () => { v.playbackRate = FEX_RATES[PPC?.fx?.rate] || 1; });
  v.addEventListener("ended", () => { const h = document.getElementById("fexHow"); if (h) { h.innerHTML = "🙋 " + t("fx_turn"); h.classList.add("fex-turn"); } });
}
