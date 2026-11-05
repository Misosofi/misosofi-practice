/* ===== Today's practice plan — the heart of the app =====
   The child makes a small plan before practising: cards like "Bars 7–8 · left hand · slow · 5 in a row".
   Each card is practised with a big counter: ✓ adds one, a mistake goes back to 0 (5 in a row = done).
   Finishing cards wins things back from the thief; finishing the whole plan wins everything back.
   The thief: after 3 days without practice he comes every day — first he takes things from the room,
   then the clothes (your friend hides in a cardboard box), then the wallpaper goes dark, the window breaks,
   and finally cobwebs appear (the hedgehog cleaners clear them when you practise again).
   7 days of practice in a row: a big present from the cats — a free new wall colour. */
const PP_REPS = [3, 5, 10];
let PPC = null;   /* the counter that is open */
const ppToday = () => (S.pplan && S.pplan.date === TK ? S.pplan : null);
const ppDays = () => (S.ppDays ||= {});
/* age modes: young (≤9) gets help, sounds and sparkle; grown (13+) writes their own plan, no game sounds, sees graphs */
const ppMode = () => { const a = +S.profile?.age || 0; return a && a <= 9 ? "young" : a >= 13 ? "grown" : "mid"; };
const ppHist = () => (S.ppHist ||= {});
function histAdd(f, n = 1) { const h = ppHist(), d = (h[TK] ||= { tries: 0, rights: 0, cards: 0, done: 0 }); d[f] = (d[f] || 0) + n; const ks = Object.keys(h).sort(); if (ks.length > 120) delete h[ks[0]]; }
/* missed a couple of days? Daizu comes to beg — and today is a comeback day: coins ×10 and the thief gives everything back */
const daysOff = () => { const l = lastPractice(); return l ? diffDays(l, TK) : 0; };
const comebackToday = () => S.comeback?.day === TK;
const practisedOn = d => !!ppDays()[d] || S.log.some(l => l.date === d && (+l.sec || 0) > 0);

/* ---------- home card ---------- */
function ppPlead() {
  if (practisedOn(TK) || (daysOff() < 2 && !comebackToday())) return "";
  if (!comebackToday()) { S.comeback = { day: TK }; save(); }
  return `<div class="section"><div class="card pp-plead"><img src="${ART}daizu_paw.webp" alt=""><div class="grow"><b>${t("pl_plead")}</b><div class="small">${t("pl_pleadOffer")}</div></div></div></div>`;
}
function ppHome() {
  const P = ppToday(), y = S.pplan && S.pplan.date !== TK && S.pplan.cards?.length ? S.pplan : null, M = ppMode();
  if (!P || !P.cards.length) return `<div class="section"><div class="card pp-card stack"><div class="section-head"><h2>📝 ${t("pp_title")}</h2></div>
   <div class="muted">${t("pp_why")}</div>
   ${M !== "grown" ? `<button class="btn block" data-pp="help">✨ ${t("pp_help")}</button>` : ""}
   <button class="btn ${M !== "grown" ? "soft" : ""} block" data-pp="edit">✏️ ${t("pp_make")}</button>${y ? `<button class="btn soft block" data-pp="copy">↺ ${t("pp_copy")}</button>` : ""}</div></div>`;
  const done = P.cards.filter(c => c.done).length;
  return `<div class="section"><div class="card pp-card stack"><div class="section-head"><h2>📝 ${t("pp_title")}</h2><span class="pill ${done === P.cards.length ? "g" : "m"}">${done}/${P.cards.length}</span></div>
   <div class="pp-list">${P.cards.map(c => `<button class="pp-item ${c.done ? "done" : ""}" data-pp="go" data-id="${c.id}">
     <span class="pp-chk">${c.done ? "✓" : ""}</span><span class="grow"><b>${esc(ppTitle(c))}</b><span class="muted small">${ppHow(c)}</span></span>
     ${ppDots(c)}</button>`).join("")}</div>
   ${done === P.cards.length ? `<div class="pp-all">🎉 ${t("pp_allDone")}</div><button class="btn soft block" data-act="planOpen">🎥 ${t("pp_nextPlan")}</button>` : ""}
   <button class="btn ghost sm" data-pp="edit">✏️ ${t("pp_edit")}</button></div></div>`;
}
const ppTitle = c => c.kind === "tech" ? techOf(c.tech).em + " " + t("tc_" + c.tech) : c.what + (c.from ? ` · ${t("pp_bars")} ${c.from}${c.to && c.to !== c.from ? "–" + c.to : ""}` : "");
const ppHow = c => c.kind === "tech" ? t("pp_30s") : c.kind === "free" ? t("pp_ownStep") : [t("pp_h_" + c.hands), t("pp_s_" + c.speed), t("pp_inRow", { n: c.reps })].join(" · ");
const ppDots = c => c.kind ? "" : `<span class="pp-dots">${Array.from({ length: c.reps }, (_, i) => `<i class="${c.done || i < c.streak ? "on" : ""}"></i>`).join("")}</span>`;
/* "help me plan" for younger children: their piece, the hard bars, hands separately, then together, and today's technique */
function ppHelp() {
  const piece = (S.pieces.find(p => p.status !== "done") || {}).title || t("pp_myPiece");
  openSheet(`<div class="stack"><div class="act-head"><h2>✨ ${t("pp_help")}</h2><button class="icon-btn" data-act="close" aria-label="Close">${I.close}</button></div>
  <div class="card pp-tip">${t("pp_helpQ", { piece: esc(piece) })}</div>
  <div class="pp-bars"><label class="label" for="hpFrom">${t("pp_bars")}</label><input id="hpFrom" type="number" min="1" inputmode="numeric" placeholder="5"><span>–</span><input id="hpTo" type="number" min="1" inputmode="numeric" placeholder="6"></div>
  <button class="btn block" data-pp="helpGo" data-piece="${esc(piece)}">${t("pp_helpGo")}</button></div>`);
}

/* ---------- making the plan ---------- */
let PPE = null;
function ppEdit() {
  PPE ||= { what: (S.pieces.find(p => p.status !== "done") || {}).title || "", from: "", to: "", hands: "rh", speed: "slow", reps: 5 };
  const P = ppToday() || { cards: [] }, opts = [...new Set(S.pieces.filter(p => p.status !== "done").map(p => p.title).concat([t("pp_scales"), t("pp_sight")]))];
  const chip = (f, v, lab) => `<button class="chip ${PPE[f] === v ? "on" : ""}" data-pp="set" data-f="${f}" data-v="${v}">${lab}</button>`;
  openSheet(`<div class="stack"><div class="act-head"><h2>📝 ${t("pp_title")}</h2><button class="icon-btn" data-act="close" aria-label="Close">${I.close}</button></div>
  <div class="card small pp-tip">💡 ${t("pp_tip")}</div>
  ${P.cards.length ? `<div class="pp-list">${P.cards.map(c => `<div class="pp-item ${c.done ? "done" : ""}"><span class="pp-chk">${c.done ? "✓" : ""}</span><span class="grow"><b>${esc(ppTitle(c))}</b><span class="muted small">${ppHow(c)}</span></span>${c.done ? "" : `<button class="x" data-pp="del" data-id="${c.id}" aria-label="Delete">×</button>`}</div>`).join("")}</div>` : ""}
  <div class="card stack"><b>${t("pp_newCard")}</b>
   <label class="label" for="ppWhat">${t("pp_what")}</label>
   <input id="ppWhat" list="ppWhatL" value="${esc(PPE.what)}" maxlength="60" placeholder="${t("pp_whatPh")}"><datalist id="ppWhatL">${opts.map(o => `<option value="${esc(o)}">`).join("")}</datalist>
   <div class="pp-bars"><label class="label" for="ppFrom">${t("pp_bars")}</label><input id="ppFrom" type="number" min="1" max="999" inputmode="numeric" value="${esc(PPE.from)}" placeholder="7"><span>–</span><input id="ppTo" type="number" min="1" max="999" inputmode="numeric" value="${esc(PPE.to)}" placeholder="8"></div>
   <div class="label">${t("pp_hands")}</div><div class="chips">${["rh", "lh", "both"].map(v => chip("hands", v, t("pp_h_" + v))).join("")}</div>
   <div class="label">${t("pp_speed")}</div><div class="chips">${["slow", "mid", "tempo"].map(v => chip("speed", v, t("pp_s_" + v))).join("")}</div>
   <div class="label">${t("pp_reps")}</div><div class="chips">${PP_REPS.map(n => `<button class="chip ${PPE.reps === n ? "on" : ""}" data-pp="set" data-f="reps" data-v="${n}">${t("pp_inRow", { n })}</button>`).join("")}</div>
   <button class="btn soft" data-pp="add">＋ ${t("pp_add")}</button></div>
  <div class="card stack"><b>🖐 ${t("pp_techH")}</b><div class="tech-pick">${TECH.map(x => `<button class="chip" data-pp="addTech" data-id="${x.id}">${x.em} ${t("tc_" + x.id)}</button>`).join("")}</div></div>
  ${ppMode() === "grown" ? `<div class="card stack"><b>✍️ ${t("pp_ownH")}</b><textarea id="ppOwn" maxlength="200" placeholder="${t("pp_ownPh")}"></textarea><button class="btn soft" data-pp="addOwn">＋ ${t("pp_add")}</button></div>` : ""}
  <button class="btn block" data-pp="saveClose" ${P.cards.length ? "" : "disabled"}>${t("pp_ready")}</button></div>`);
}
function ppReadForm() { const v = id => (document.getElementById(id)?.value || "").trim(); PPE.what = v("ppWhat"); PPE.from = v("ppFrom"); PPE.to = v("ppTo"); }

/* ---------- the counter ---------- */
function ppCounter(id) {
  const P = ppToday(), c = P?.cards.find(x => x.id === id); if (!c) return;
  PPC = { id, t0: PPC?.id === id ? PPC.t0 : Date.now(), tm: PPC?.id === id ? PPC.tm : null };
  if (c.kind === "tech" || c.kind === "free") {
    openSheet(`<div class="stack pp-counter"><div class="act-head"><h2>${esc(ppTitle(c))}</h2><button class="icon-btn" data-act="close" aria-label="Close">${I.close}</button></div>
    ${c.kind === "tech" ? `<div class="tech-pic">${techPic(c.tech)}</div><div class="card tech-how">${t("tc_" + c.tech + "_how")}</div>
      ${c.done ? `<div class="pp-all">🎉 ${t("pp_cardDone")}</div><button class="btn block" data-act="close">OK</button>` : `<button class="pp-tap pp-timer" data-pp="timer"><span class="pp-num" id="ppSec">${PPC.tm ? Math.max(0, 30 - Math.floor((Date.now() - PPC.tm) / 1000)) : 30}</span><span>${PPC.tm ? t("pp_going") : "▶ " + t("pp_start30")}</span></button>`}`
    : `<div class="card">${esc(c.what)}</div><textarea id="ppNote" maxlength="300" placeholder="${t("pp_notePh")}">${esc(c.note || "")}</textarea>
      ${c.done ? `<div class="pp-all">✓ ${t("pp_cardDone")}</div>` : ""}<button class="btn block" data-pp="freeDone">${c.done ? t("pp_saveNote") : "✓ " + t("pp_doneStep")}</button>`}</div>`);
    return;
  }
  openSheet(`<div class="stack pp-counter"><div class="act-head"><h2>${esc(ppTitle(c))}</h2><button class="icon-btn" data-act="close" aria-label="Close">${I.close}</button></div>
  <div class="muted" style="text-align:center">${ppHow(c)}</div>
  <div class="pp-big-dots">${Array.from({ length: c.reps }, (_, i) => `<i class="${c.done || i < c.streak ? "on" : ""}"></i>`).join("")}</div>
  ${c.done ? `<div class="pp-all">🎉 ${t("pp_cardDone")}</div><button class="btn block" data-act="close">OK</button>` : `
  <button class="pp-tap" data-pp="ok"><span class="pp-num">${c.streak}</span><span>✓ ${t("pp_right")}</span></button>
  <button class="btn ghost block" data-pp="miss">✗ ${t("pp_miss")}</button>
  <div class="muted small" style="text-align:center">${t("pp_counterHow", { n: c.reps })}</div>`}</div>`);
}
/* young: sparkly "kling" for every right one; mid: one soft note; grown: silent */
function ppSound(ok, n) {
  const M = ppMode(); if (M === "grown") return;
  if (!ok) { tone(48, 0, .4, .16); return; }
  if (M === "young") [84, 88, 91, 96].forEach((m, i) => tone(m + (n % 3), i * .06, .4, .12)); else tone(72 + Math.min(n, 7) * 2, 0, .3, .16);
}
function ppHit(ok) {
  const P = ppToday(), c = P?.cards.find(x => x.id === PPC?.id); if (!c || c.done) return;
  c.tries = (c.tries || 0) + 1; histAdd("tries"); if (ok) histAdd("rights");
  if (ok) c.streak++; else c.streak = 0; ppSound(ok, c.streak);
  if (ppMode() === "young" && ok) { const b = document.querySelector(".pp-tap"); if (b) { b.classList.remove("spark"); void b.offsetWidth; b.classList.add("spark"); } }
  if (c.streak >= c.reps) ppComplete(P, c); else { save(); ppCounter(c.id); }
}
function ppComplete(P, c) {
  c.done = true; ppDays()[TK] = 1; histAdd("done");
  addSec(Math.min(1200, Math.round((Date.now() - PPC.t0) / 1000)));
  const mult = comebackToday() ? 10 : 1, grown = ppMode() === "grown";
  S.coins += 2 * mult; if (!grown) ding(true); if (!grown || mult > 1) toast(mult > 1 ? t("pp_cardCoins10", { n: 2 * mult }) : t("pp_cardCoins"));
  if (mult > 1 || P.cards.every(x => x.done)) { if (P.cards.every(x => x.done) && !P.paid) { P.paid = true; S.coins += 5 * mult; if (!grown) celebrate(); } thiefRestore(99); } else thiefRestore(1);
  save(); ppCounter(c.id); refreshTop();
}
/* ---------- growth graphs (everyone can see them; older students get them on the home page) ---------- */
function lineChart(vals, o = {}) {
  const W = 300, H = 110, n = vals.length, mx = Math.max(o.max || 0, ...vals.map(v => v || 0), 1), X = i => 8 + i * (W - 16) / Math.max(1, n - 1), Y = v => H - 18 - (v / mx) * (H - 34);
  const pts = vals.map((v, i) => v == null ? null : [X(i), Y(v)]), line = pts.filter(Boolean).map((p, i) => (i ? "L" : "M") + p[0].toFixed(1) + " " + p[1].toFixed(1)).join(" ");
  return `<svg viewBox="0 0 ${W} ${H}" class="chart" role="img" aria-label="${esc(o.label || "")}"><line x1="8" x2="${W - 8}" y1="${H - 18}" y2="${H - 18}" stroke="#e4e0ee"/>
   <path d="${line}" fill="none" stroke="${o.col || "#6C5CE7"}" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"/>${pts.filter(Boolean).map(p => `<circle cx="${p[0].toFixed(1)}" cy="${p[1].toFixed(1)}" r="2.2" fill="${o.col || "#6C5CE7"}"/>`).join("")}
   <text x="8" y="12" font-size="10" fill="#8a84a0">${esc(o.top || "")}</text><text x="${W - 8}" y="${H - 4}" font-size="9" fill="#8a84a0" text-anchor="end">${esc(o.end || "")}</text><text x="8" y="${H - 4}" font-size="9" fill="#8a84a0">${esc(o.start || "")}</text></svg>`;
}
function ppGrowth() {
  const days = Array.from({ length: 28 }, (_, i) => key(addDays(TODAY, i - 27))), H = ppHist();
  const mins = days.map(d => Math.round((S.log.find(l => l.date === d)?.sec || 0) / 60));
  const acc = days.map(d => H[d]?.tries ? Math.round(H[d].rights / H[d].tries * 100) : null);
  const cards = days.map(d => H[d]?.done || 0);
  const drills = (S.drills || []).filter(d => (d.hist || []).length > 1).slice(0, 3);
  const f = d => fmt(d, { month: "short", day: "numeric" });
  return `<div class="section"><div class="section-head"><h2>📈 ${t("gr_h")}</h2><span class="muted small">${t("gr_sub")}</span></div>
  <div class="card stack"><b>${t("gr_min")}</b>${lineChart(mins, { top: t("gr_minAxis"), start: f(days[0]), end: f(TK), col: "#6C5CE7" })}</div>
  <div class="card stack"><b>${t("gr_acc")}</b>${acc.some(v => v != null) ? lineChart(acc, { max: 100, top: "%", start: f(days[0]), end: f(TK), col: "#2BB673" }) : `<div class="muted small">${t("gr_none")}</div>`}</div>
  <div class="card stack"><b>${t("gr_cards")}</b>${lineChart(cards, { start: f(days[0]), end: f(TK), col: "#F5A623" })}</div>
  ${drills.map(d => `<div class="card stack"><b>♩= ${esc(d.name)}</b>${lineChart(d.hist.map(x => x.bpm), { top: "♩=", start: f(d.hist[0].date), end: f(d.hist[d.hist.length - 1].date), col: "#E5484D" })}</div>`).join("")}</div>`;
}

/* ---------- the thief ---------- */
function lastPractice() { let d = null; S.log.forEach(l => { if ((+l.sec || 0) > 0 && (!d || l.date > d)) d = l.date; }); Object.keys(ppDays()).forEach(k => { if (!d || k > d) d = k; }); return d; }
function thiefCheck() {
  const T = (S.thief ||= { applied: 0, stolen: [], news: [] }); T.news ||= []; T.stolen ||= [];
  if (T.checked === TK) return; T.checked = TK;
  T.since ||= TK;
  const off = diffDays(lastPractice() || T.since, TK), want = Math.max(0, off - 2);
  if (off < 3) T.applied = 0;
  while (T.applied < want && T.applied < 30) { thiefHit(T); T.applied++; }
  save();
}
function thiefHit(T) {
  const R = roomOf(), loot = R.items.filter(i => itemOf(i.id)?.cat !== "food").sort((a, b) => (itemOf(b.id).p || 0) - (itemOf(a.id).p || 0));
  if (loot.length) { loot.slice(0, 2).forEach(i => { R.items = R.items.filter(x => x !== i); T.stolen.push(i); T.news.push({ k: "item", id: i.id }); }); return; }
  for (const k of ["boxed", "dark", "broken", "webs"]) if (!T[k]) { T[k] = true; T.news.push({ k }); return; }
}
/* practising wins things back, newest damage first */
function thiefRestore(n) {
  const T = S.thief; if (!T) return; let got = [];
  while (n-- > 0) {
    const k = ["webs", "broken", "dark", "boxed"].find(x => T[x]);
    if (k) { T[k] = false; got.push(k); continue; }
    const i = T.stolen.pop(); if (!i) break; roomOf().items.push(i); got.push(i.id);
  }
  if (!got.length) return;
  save();
  if (got.includes("webs")) setTimeout(() => thiefScene("clean"), 600);
  else toast(t("th_back", { what: got.map(x => itemOf(x)?.n || t("th_k_" + x)).join(", ") }));
}
function thiefScene(kind) {
  const T = S.thief || {};
  if (kind === "clean") {
    openSheet(`<div class="stack" style="text-align:center"><div class="act-head"><h2>🧹 ${t("th_cleanH")}</h2><button class="icon-btn" data-act="close" aria-label="Close">${I.close}</button></div>
    <img class="th-pic th-clean" src="${ART}cleaner.webp" alt=""><div class="big-msg">${t("th_clean")}</div><button class="btn" data-act="close">OK</button></div>`);
    return;
  }
  const news = T.news.splice(0); save();
  openSheet(`<div class="stack" style="text-align:center"><div class="act-head"><h2>😱 ${t("th_h")}</h2><button class="icon-btn" data-act="close" aria-label="Close">${I.close}</button></div>
  <img class="th-pic th-run" src="${ART}thief.webp" alt="">
  <div class="th-list">${news.map(x => `<div>${x.k === "item" ? `${itemImg(x.id)} ${t("th_took", { what: esc(itemOf(x.id)?.n || "") })}` : t("th_n_" + x.k)}</div>`).join("")}</div>
  <div class="muted">${t("th_how")}</div>
  <button class="btn" data-pp="edit">✏️ ${t("pp_make")}</button></div>`);
}
function thiefNews() { if (S.thief?.news?.length && document.getElementById("sheet").hidden) thiefScene("news"); }

/* ---------- 7 days in a row: a big present from the cats ---------- */
function streakDays() { let n = 0, d = practisedOn(TK) ? TODAY : addDays(TODAY, -1); while (practisedOn(key(d)) && n < 400) { n++; d = addDays(d, -1); } return n; }
function giftCheck() {
  const n = streakDays(); S.gift ||= {};
  if (n >= 7 && n % 7 === 0 && practisedOn(TK) && S.gift.day !== TK && document.getElementById("sheet").hidden) {
    S.gift.day = TK; save();
    const rooms = ITEMS.filter(i => i.cat === "room");
    openSheet(`<div class="stack" style="text-align:center"><div class="act-head"><h2>🎁 ${t("gf_h")}</h2><button class="icon-btn" data-act="close" aria-label="Close">${I.close}</button></div>
    <div class="gf-scene"><img class="gf-box" src="${ART}bigpresent.webp" alt=""><img class="gf-cat" src="${ART}daizu_kiss.webp" alt=""></div>
    <div class="big-msg">${t("gf_msg", { n })}</div>
    <div class="tray wide">${rooms.map(r => `<button data-pp="paint" data-id="${r.id}" aria-label="${esc(r.n)}">${itemImg(r.id)}</button>`).join("")}</div></div>`);
  }
}

/* ---------- clicks ---------- */
document.addEventListener("click", e => {
  const b = e.target.closest("[data-pp]"); if (!b || !S) return;
  const a = b.dataset.pp;
  if (a === "edit") { PPE = null; ppEdit(); }
  else if (a === "help") ppHelp();
  else if (a === "helpGo") {
    const v = id => (document.getElementById(id)?.value || "").trim(), from = v("hpFrom").slice(0, 4), to = v("hpTo").slice(0, 4), what = b.dataset.piece;
    const mk = (hands, speed, reps) => ({ id: uid(), what, from, to, hands, speed, reps, streak: 0, tries: 0, done: false });
    S.pplan = { date: TK, cards: [mk("rh", "slow", 5), mk("lh", "slow", 5), mk("both", "slow", 3), { id: uid(), kind: "tech", tech: techToday().id, what: "", streak: 0, reps: 1, done: false }] };
    save(); closeSheet(); toast(t("pp_helpDone"));
  }
  else if (a === "addTech") { if (!ppToday()) S.pplan = { date: TK, cards: [] }; S.pplan.cards.push({ id: uid(), kind: "tech", tech: b.dataset.id, what: "", streak: 0, reps: 1, done: false }); save(); ppReadForm(); ppEdit(); }
  else if (a === "addOwn") { const v = (document.getElementById("ppOwn")?.value || "").trim(); if (!v) return; if (!ppToday()) S.pplan = { date: TK, cards: [] }; S.pplan.cards.push({ id: uid(), kind: "free", what: v.slice(0, 200), streak: 0, reps: 1, done: false }); save(); ppReadForm(); ppEdit(); }
  else if (a === "timer") {
    if (PPC.tm) return; PPC.tm = Date.now(); const id = PPC.id;
    const tick = setInterval(() => { const e = document.getElementById("ppSec"), left = 30 - Math.floor((Date.now() - PPC.tm) / 1000);
      if (PPC?.id !== id) { clearInterval(tick); return; } if (e) e.textContent = Math.max(0, left);
      if (left <= 0) { clearInterval(tick); const P = ppToday(), c = P?.cards.find(x => x.id === id); if (c && !c.done) ppComplete(P, c); } }, 250);
    ppCounter(id);
  }
  else if (a === "freeDone") { const P = ppToday(), c = P?.cards.find(x => x.id === PPC?.id); if (!c) return; c.note = (document.getElementById("ppNote")?.value || "").slice(0, 300); if (c.done) { save(); toast(t("saved")); } else ppComplete(P, c); }
  else if (a === "copy") { const y = S.pplan; S.pplan = { date: TK, cards: y.cards.map(c => ({ ...c, id: uid(), streak: 0, tries: 0, done: false })) }; save(); refresh(); }
  else if (a === "set") { ppReadForm(); PPE[b.dataset.f] = b.dataset.f === "reps" ? +b.dataset.v : b.dataset.v; ppEdit(); }
  else if (a === "add") {
    ppReadForm(); if (!PPE.what) { toast(t("pp_needWhat")); return; }
    if (!ppToday()) S.pplan = { date: TK, cards: [] };
    S.pplan.cards.push({ id: uid(), what: PPE.what.slice(0, 60), from: PPE.from.slice(0, 4), to: PPE.to.slice(0, 4), hands: PPE.hands, speed: PPE.speed, reps: PPE.reps, streak: 0, tries: 0, done: false });
    save(); PPE.from = PPE.to = ""; ppEdit();
  }
  else if (a === "del") { const P = ppToday(); if (P) { P.cards = P.cards.filter(c => c.id !== b.dataset.id); save(); ppEdit(); } }
  else if (a === "saveClose") { closeSheet(); }
  else if (a === "go") ppCounter(b.dataset.id);
  else if (a === "ok") ppHit(true);
  else if (a === "miss") ppHit(false);
  else if (a === "paint") { const R = roomOf(), id = b.dataset.id; if (!R.owned.includes(id)) R.owned.push(id); R.bg = id; save(); closeSheet(); toast(t("gf_done")); }
});
