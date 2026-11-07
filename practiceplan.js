/* ===== Today's practice plan — the heart of the app =====
   The child makes a small plan before practising: cards like "Bars 7–8 · left hand · slow · 5 in a row".
   Each card is practised with a big counter: ✓ adds one, a mistake goes back to 0 (5 in a row = done).
   Finishing cards wins things back from the thief; finishing the whole plan wins everything back.
   The thief: after 3 days without practice he comes every day — first he takes things from the room,
   then the clothes (your friend hides in a cardboard box), then the wallpaper goes dark, the window breaks,
   and finally cobwebs appear (the hedgehog cleaners clear them when you practise again).
   7 days of practice in a row: a big present from the cats — a free new wall colour. */
const PP_REPS = [3, 5, 10];
const STR_has = k => t(k) !== k;
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
/* Daizu talks on the home screen — what he says depends on the child's practice:
   practised today → eating (a special snack when it is a run of days); practised yesterday → hopeful;
   no practice → hungrier every day; never practised → asks for his first dinner. */
function ppPlead() {
  const name = esc(S.profile?.name || PROF?.display_name || ""), today = practisedOn(TK), off = daysOff(), last = lastPractice();
  const run = streakDays(), lines = [];
  /* the gap before today's practice: Daizu "comes back to life" after playing dead */
  const prevGap = () => { let d = addDays(TODAY, -1), n = 1; while (n < 400 && !practisedOn(key(d))) { d = addDays(d, -1); n++; } return n < 400 ? n : 0; };
  let pic = "paw", mood = "beg", ghost = false;
  if (today) {
    mood = "yum"; pic = "kiss"; const g = run === 1 ? prevGap() : 0;
    if (g >= 2) lines.push(t("dz_f_alive"));
    else if (run >= 7 && run % 7 === 0) lines.push(t("dz_f_star", { n: run }));
    else if (run >= 2) lines.push(t("dz_f_run", { n: run }));
    else lines.push(t("dz_f_today"));
    if (S.sangOn === TK) lines.push(t("dz_f_sang"));
  } else if (!last) { lines.push(t("dz_f_first")); }
  else if (off <= 1) {
    mood = "hope"; pic = "guitar"; lines.push(t("dz_f_hope", { name }));
    if (run >= 2) lines.push(t("dz_f_hopeRun", { n: run }));
  } else {
    mood = "dead";
    if (off === 2) lines.push(t("dz_f_dead2"));
    else if (off <= 6) { ghost = true; lines.push(t("dz_f_deadN", { n: off })); lines.push(t("dz_f_deadTalk", { name })); }
    else if (off <= 14) { ghost = true; lines.push(t("dz_f_deadWeek", { n: off })); }
    else { ghost = true; lines.push(t("dz_f_deadLong")); }
    lines.push(t("dz_f_wake"));
  }
  let offer = "";
  if (!today && last && (off >= 2 || comebackToday())) { if (!comebackToday()) { S.comeback = { day: TK }; save(); } offer = `<div class="small dz-offer">${t("pl_pleadOffer")}</div>`; }
  return `<div class="section"><div class="card pp-plead dz-${mood}"><div class="dz-pic"><img src="${ART}daizu_${pic}.webp" alt="Daizu">${ghost ? `<img class="dz-ghost-orbit" src="${ART}sakura_guitar.webp" alt="Sakura">` : ""}</div><div class="grow"><b>${lines[0]}</b>${lines.slice(1).map(l => `<div class="small">${l}</div>`).join("")}${offer}</div></div></div>`;
}
/* technique items that were changed: soft wrist → straight line, finger lifts removed */
function techMigrate() {
  const fix = arr => (arr || []).map(id => id === "wrist" ? "line" : id).filter(id => id !== "lift");
  let ch = false;
  if (S.pplan?.cards) { const n = S.pplan.cards.length; S.pplan.cards = S.pplan.cards.filter(c => !(c.kind === "tech" && c.tech === "lift")); S.pplan.cards.forEach(c => { if (c.kind === "tech" && c.tech === "wrist") { c.tech = "line"; ch = true; } }); ch ||= n !== S.pplan.cards.length; }
  if (S.thw?.tech?.some(id => id === "wrist" || id === "lift")) S.thw.tech = fix(S.thw.tech);
  if (ch) save();
}
function ppHome() {
  techMigrate(); ppSyncActs();
  const P = ppToday(), y = S.pplan && S.pplan.date !== TK && S.pplan.cards?.length ? S.pplan : null, M = ppMode();
  if (!P || !P.cards.length) return `<div class="section"><div class="card pp-card stack"><div class="section-head"><h2>📝 ${t("pp_title")}</h2></div>${hwBanner()}
   <div class="muted">${t("pp_why")}</div>
   ${M !== "grown" ? `<button class="btn block" data-pp="help">✨ ${t("pp_help")}</button>` : ""}
   <button class="btn ${M !== "grown" ? "soft" : ""} block" data-pp="edit">✏️ ${t("pp_make")}</button>${y ? `<button class="btn soft block" data-pp="copy">↺ ${t("pp_copy")}</button>` : ""}</div></div>`;
  const done = P.cards.filter(c => c.done).length;
  return `<div class="section"><div class="card pp-card stack"><div class="section-head"><h2>📝 ${t("pp_title")}</h2><span class="pill ${done === P.cards.length ? "g" : "m"}">${done}/${P.cards.length}</span></div>${hwBanner()}
   <div class="pp-list">${P.cards.map(c => `<button class="pp-item ${c.done ? "done" : ""}" data-pp="go" data-id="${c.id}">
     <span class="pp-chk">${c.done ? "✓" : ""}</span><span class="grow"><b>${esc(ppTitle(c))}</b><span class="muted small">${ppHow(c)}</span></span>
     ${ppDots(c)}</button>`).join("")}</div>
   ${done === P.cards.length ? `<div class="pp-all">🎉 ${t("pp_allDone")}</div><button class="btn soft block" data-act="planOpen">🎥 ${t("pp_nextPlan")}</button>` : ""}
   <button class="btn ghost sm" data-pp="edit">✏️ ${t("pp_edit")}</button></div></div>`;
}
const ppTitle = c => c.kind === "vid" ? "📺 " + c.what : c.kind === "act" ? t("wz_x_" + c.act) : c.kind === "tech" ? techOf(c.tech).em + " " + t("tc_" + c.tech) : c.what + (c.from ? ` · ${t("pp_bars")} ${c.from}${c.to && c.to !== c.from ? "–" + c.to : ""}` : "");
const ppHow = c => c.kind === "vid" ? t("hw_watchCard") : c.kind === "act" ? t("pp_inApp") : c.kind === "tech" ? t("pp_30s") : c.kind === "free" ? t("pp_ownStep") : [t("pp_h_" + c.hands), t("pp_s_" + c.speed), t("pp_inRow", { n: c.reps })].join(" · ");
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
  if (c.kind === "act") { if (!c.done) openAct(c.act); return; }
  PPC = { id, t0: PPC?.id === id ? PPC.t0 : Date.now(), tm: PPC?.id === id ? PPC.tm : null };
  if (c.kind === "vid") {
    openSheet(`<div class="stack pp-counter"><div class="act-head"><h2>${esc(ppTitle(c))}</h2><button class="icon-btn" data-act="close" aria-label="Close">${I.close}</button></div>
    ${/^https?:\/\//i.test(c.url || "") ? `<a class="btn soft block" href="${esc(c.url)}" target="_blank" rel="noopener">▶ ${t("watch")} ↗</a>` : `<div class="muted">${t("noLink")}</div>`}
    ${c.done ? `<div class="pp-all">✓ ${t("pp_cardDone")}</div><button class="btn block" data-act="close">OK</button>` : `<button class="btn block" data-pp="freeDone">✓ ${t("hw_watched")}</button>`}</div>`);
    return;
  }
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
  ${c.tips?.length ? `<div class="card pp-remember">💬 <b>${t("pp_remember")}</b> ${c.tips.map(k => (SAID.find(s => s[0] === k) || [0, ""])[1] + " " + esc(STR_has("wz_s_" + k) ? t("wz_s_" + k) : k)).join(" · ")}</div>` : ""}
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
  else if (a === "help") { PPW = null; ppWizard(); }
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

/* ---------- the plan interview: children often can't put their practice into words,
   so the app asks simple questions one by one and turns the answers into today's homework ---------- */
const SAID = [["fingers", "🖐"], ["eyes", "👀"], ["count", "🥁"], ["slow", "🐢"], ["hands", "✋"], ["dyn", "🔊"], ["legato", "〰️"], ["round", "🟠"], ["pedal", "🦶"]];
const EXTRAS = ["nr", "ear", "sight", "solf", "theory"];
let PPW = null;
function ppWizard() {
  const W = PPW ||= hwPrefill({ step: 0, pieces: [], bars: {}, said: [], saidTxt: "", scales: null, scaleTxt: "", tech: null, techIds: [], extras: [], vids: [] });
  const titles = [...new Set(S.pieces.filter(p => p.status !== "done").map(p => p.title).concat((W.hw?.pieces || []).map(p => p.title), W.pieces))];
  const steps = wzSteps();
  if (steps[W.step] === "bars" && !W.pieces.length) W.step++;
  const st = steps[W.step], yn = (f, v) => `<button class="btn ${W[f] === v ? "" : "soft"} big-choice" data-pp="w" data-f="${f}" data-v="${v}">${v ? "👍 " + t("wz_yes") : "🙅 " + t("wz_no")}</button>`;
  let body = "";
  if (st === "teacher") body = hwStepHTML(W);
  if (st === "pieces") body = `<h2>${t("wz_q_pieces")}</h2><div class="wz-opts">${titles.map(n => `<button class="wz-opt ${W.pieces.includes(n) ? "on" : ""}" data-pp="wTog" data-f="pieces" data-v="${esc(n)}">🎵 ${esc(n)}</button>`).join("")}</div>
    ${(S.library || []).length ? `<button class="btn soft" data-pp="wLib">📚 ${t("lb_choose")}</button>` : ""}
    <div class="add"><input id="wzNewPiece" maxlength="60" placeholder="${t("wz_otherPiece")}"><button class="btn ghost sm" data-pp="wAddPiece">＋ ${t("add")}</button></div>`;
  if (st === "pieces" && W.lib) body = libPicker(W);
  if (st === "bars") body = `<h2>${t("wz_q_bars")}</h2>${W.pieces.map(n => { const b = W.bars[n] || {}; return `<div class="card stack"><b>🎵 ${esc(n)}</b>
    <div class="pp-bars"><label class="label">${t("pp_bars")}</label><input type="number" min="1" inputmode="numeric" data-wbar="${esc(n)}" data-k="from" value="${esc(b.from || "")}" placeholder="7"><span>–</span><input type="number" min="1" inputmode="numeric" data-wbar="${esc(n)}" data-k="to" value="${esc(b.to || "")}" placeholder="8"></div>
    <button class="chip ${b.whole ? "on" : ""}" data-pp="wWhole" data-v="${esc(n)}">${t("wz_whole")}</button></div>`; }).join("")}`;
  if (st === "said" && W.pieces.length > 1) body = `<h2>${t("wz_q_said")}</h2>${W.pieces.map((p, pi) => `<div class="wz-piece"><div class="label">🎵 ${esc(p)}</div><div class="chips">${SAID.map(([k, e]) => `<button class="chip ${(W.saidBy?.[p] || []).includes(k) ? "on" : ""}" data-pp="wTogP" data-p="${pi}" data-v="${k}">${e} ${t("wz_s_" + k)}</button>`).join("")}</div></div>`).join("")}
    <input id="wzSaid" maxlength="80" value="${esc(W.saidTxt)}" placeholder="${t("wz_saidOther")}">`;
  else if (st === "said") body = `<h2>${t("wz_q_said")}</h2><div class="wz-opts">${SAID.map(([k, e]) => `<button class="wz-opt ${W.said.includes(k) ? "on" : ""}" data-pp="wTog" data-f="said" data-v="${k}">${e} ${t("wz_s_" + k)}</button>`).join("")}</div>
    <input id="wzSaid" maxlength="80" value="${esc(W.saidTxt)}" placeholder="${t("wz_saidOther")}">`;
  if (st === "scales") body = `<h2>${t("wz_q_scales")}</h2><div class="wz-yn">${yn("scales", true)}${yn("scales", false)}</div>${W.scales ? `<input id="wzScale" maxlength="40" value="${esc(W.scaleTxt)}" placeholder="${t("wz_scalePh")}">` : ""}`;
  if (st === "tech") body = `<h2>${t("wz_q_tech")}</h2><div class="wz-yn">${yn("tech", true)}${yn("tech", false)}</div>${W.tech ? `<div class="wz-opts">${TECH.map(x => `<button class="wz-opt ${W.techIds.includes(x.id) ? "on" : ""}" data-pp="wTog" data-f="techIds" data-v="${x.id}">${x.em} ${t("tc_" + x.id)}</button>`).join("")}</div>` : ""}`;
  if (st === "extras") body = `<h2>${t("wz_q_extras")}</h2><div class="wz-opts">${EXTRAS.map(k => `<button class="wz-opt ${W.extras.includes(k) ? "on" : ""}" data-pp="wTog" data-f="extras" data-v="${k}">${t("wz_x_" + k)}</button>`).join("")}${(W.hwVids || []).map(v => `<button class="wz-opt ${W.vids.some(x => x.id === v.id) ? "on" : ""}" data-pp="wVid" data-v="${esc(v.id)}">📺 ${esc(v.title)}</button>`).join("")}</div>`;
  if (st === "done") { const cards = wzCards(); body = `<h2>📋 ${t("wz_result")}</h2>${hwMissing(W)}<div class="muted small">${t("wz_resultHow")}</div><div class="pp-list">${cards.map((c, i) => `<div class="pp-item pp-preview"><span class="pp-num">${i + 1}</span><span class="grow"><b>${esc(ppTitle(c))}</b><span class="muted small">${ppHow(c)}</span>${c.tips?.length ? `<span class="small pp-tips">${c.tips.map(k => (SAID.find(s => s[0] === k) || [0, "💬"])[1] + " " + (t("wz_s_" + k) || k)).join(" · ")}</span>` : ""}</span></div>`).join("") || `<div class="muted">${t("wz_empty")}</div>`}</div>`; }
  openSheet(`<div class="stack wz"><div class="act-head"><h2>✨ ${t("pp_help")}</h2><button class="icon-btn" data-act="close" aria-label="Close">${I.close}</button></div>
  <div class="qprog">${steps.map((_, i) => `<span class="${i < W.step ? "ok" : i === W.step ? "cur" : ""}"></span>`).join("")}</div>
  ${body}
  ${st !== "teacher" && st !== "done" && typeof hwHint === "function" ? hwHint(W, st) : ""}
  <div class="wz-nav">${W.step ? `<button class="btn ghost" data-pp="wBack">← ${t("wz_back")}</button>` : "<span></span>"}${st === "done" ? `<button class="btn" data-pp="wSave">✓ ${t("wz_save")}</button>` : `<button class="btn" data-pp="wNext">${t("next")} →</button>`}</div></div>`);
  if (st === "teacher") hwHydrateKid();
}
const wzSteps = () => (PPW?.hw ? ["teacher"] : []).concat(["pieces", "bars", "said", "scales", "tech", "extras", "done"]);
function wzRead() {
  const W = PPW; if (!W) return;
  document.querySelectorAll("[data-wbar]").forEach(i => { const b = W.bars[i.dataset.wbar] ||= {}; b[i.dataset.k] = i.value.trim().slice(0, 4); if (i.value) b.whole = false; });
  const s = document.getElementById("wzSaid"); if (s) W.saidTxt = s.value.trim().slice(0, 80);
  const sc = document.getElementById("wzScale"); if (sc) W.scaleTxt = sc.value.trim().slice(0, 40);
}
function wzCards() {
  const W = PPW, young = ppMode() === "young", slow = true;
  const saidOf = n => W.pieces.length > 1 && W.saidBy ? (W.saidBy[n] || []) : W.said;
  let sep = W.said.includes("hands") || young, tips = [];
  const out = [], mk = (what, from, to, hands, speed, reps) => ({ id: uid(), what, from: from || "", to: to || "", hands, speed, reps, streak: 0, tries: 0, done: false, tips: tips.slice() });
  W.pieces.forEach(n => {
    const sd = saidOf(n); sep = sd.includes("hands") || young;
    tips = sd.filter(k => !["hands", "slow", "round"].includes(k)).concat(W.saidTxt ? [W.saidTxt] : []);
    const b = W.bars[n] || {};
    if (b.from && !b.whole) { if (sep) { out.push(mk(n, b.from, b.to, "rh", "slow", 5)); out.push(mk(n, b.from, b.to, "lh", "slow", 5)); } out.push(mk(n, b.from, b.to, "both", slow ? "slow" : "mid", sep ? 3 : 5)); }
    else out.push(mk(n, "", "", "both", "mid", 3));
  });
  tips = [];
  if (W.scales) out.push({ ...mk(W.scaleTxt || t("pp_scales"), "", "", "both", "mid", 3), tips: [] });
  const tech = W.tech ? (W.techIds.length ? W.techIds : [techToday().id]) : W.said.includes("round") ? ["tip"] : [];
  [...new Set(tech)].forEach(id => out.push({ id: uid(), kind: "tech", tech: id, what: "", streak: 0, reps: 1, done: false }));
  W.extras.forEach(k => out.push({ id: uid(), kind: "act", act: k, what: "", streak: 0, reps: 1, done: false }));
  (W.vids || []).forEach(v => { if (v?.title) out.push({ id: uid(), kind: "vid", vid: v.id, what: v.title, url: v.url || "", streak: 0, reps: 1, done: false }); });
  return out;
}
/* app activities in the plan tick themselves when the game was played today */
function ppSyncActs() { const P = ppToday(); if (!P) return; const Q = q(); let ch = false; P.cards.forEach(c => { if (c.kind === "act" && !c.done && Q[c.act]) { c.done = true; ppDays()[TK] = 1; histAdd("done"); ch = true; } }); if (ch) save(); }
document.addEventListener("click", e => {
  const b = e.target.closest("[data-pp]"); if (!b || !S || !PPW && !/^w/.test(b.dataset.pp)) return;
  const a = b.dataset.pp, W = PPW; if (!/^w/.test(a)) return;
  if (a === "wNext") { wzRead(); W.step++; ppWizard(); }
  else if (a === "wBack") { wzRead(); W.step = Math.max(0, W.step - 1); if (wzSteps()[W.step] === "bars" && !W.pieces.length) W.step--; ppWizard(); }
  else if (a === "wTog") { wzRead(); const f = W[b.dataset.f], v = b.dataset.v, i = f.indexOf(v); i < 0 ? f.push(v) : f.splice(i, 1); ppWizard(); }
  else if (a === "wTogP") { wzRead(); const p = W.pieces[+b.dataset.p]; W.saidBy ||= {}; const f = W.saidBy[p] ||= [], i = f.indexOf(b.dataset.v); i < 0 ? f.push(b.dataset.v) : f.splice(i, 1);
    W.said = [...new Set(W.pieces.flatMap(x => W.saidBy[x] || []))]; ppWizard(); }
  else if (a === "w") { wzRead(); W[b.dataset.f] = b.dataset.v === "true"; ppWizard(); }
  else if (a === "wWhole") { wzRead(); const bb = W.bars[b.dataset.v] ||= {}; bb.whole = !bb.whole; if (bb.whole) bb.from = bb.to = ""; ppWizard(); }
  else if (a === "wAddPiece") { const i = document.getElementById("wzNewPiece"), v = (i?.value || "").trim().slice(0, 60); if (v && !W.pieces.includes(v)) W.pieces.push(v); wzRead(); ppWizard(); }
  else if (a === "wLib") { wzRead(); W.lib = { g: libDefaultGrade(), b: "", q: "" }; ppWizard(); }
  else if (a === "wLibBack") { W.lib = null; ppWizard(); }
  else if (a === "wLibG") { W.lib.g = b.dataset.v; W.lib.b = ""; ppWizard(); }
  else if (a === "wLibB") { W.lib.b = W.lib.b === b.dataset.v ? "" : b.dataset.v; ppWizard(); }
  else if (a === "wLibAdd") { const l = (S.library || []).find(x => x.id === b.dataset.id); if (!l) return; const i = W.pieces.indexOf(l.title);
    if (i < 0) { W.pieces.push(l.title); if (!S.pieces.some(p => p.libId === l.id || p.title === l.title)) { S.pieces.push({ id: uid(), libId: l.id, title: l.title, composer: l.composer || "", status: "learning", sec: 0, days: {}, sections: [] }); save(); } }
    else W.pieces.splice(i, 1);
    ppWizard(); }
  else if (a === "wHelp") { wzRead(); hwApply(W, wzSteps()[W.step]); ppWizard(); }
  else if (a === "wFix") { ["pieces", "bars", "said", "scales", "tech", "extras"].forEach(st => hwApply(W, st)); ppWizard(); }
  else if (a === "wVid") { wzRead(); const v = (W.hwVids || []).find(x => x.id === b.dataset.v), i = W.vids.findIndex(x => x.id === b.dataset.v); i < 0 ? v && W.vids.push(v) : W.vids.splice(i, 1); ppWizard(); }
  else if (a === "wSave") { const cards = wzCards(); if (!cards.length) { toast(t("wz_empty")); return; } S.pplan = { date: TK, cards }; if (W.hw) S.thwSeen = W.hw.id; save(); PPW = null; closeSheet(); toast(t("pp_helpDone")); }
});

/* ---------- choosing pieces from the teacher's library: by grade, by book, search, and listen with one tap ---------- */
const listenUrl = l => /^https?:\/\//.test(l.yt_url || "") ? l.yt_url : "https://www.youtube.com/results?search_query=" + encodeURIComponent([l.title, l.composer, "piano"].filter(Boolean).join(" "));
function libDefaultGrade() {
  const L = S.library || [], g = +(PROF?.grade ?? -1);
  return L.some(l => +l.grade === g) ? String(g) : "all";
}
function libPicker(W) {
  const L = S.library || [], P = W.lib;
  const grades = [...new Set(L.map(l => +l.grade || 0))].sort((a, b) => a - b);
  const inG = L.filter(l => P.g === "all" || String(+l.grade || 0) === P.g);
  const bk = l => (l.label || "").replace(/\s*📘$/, "");
  const books = [...new Set(inG.map(bk).filter(Boolean))].sort();
  const rows = inG.filter(l => !P.b || bk(l) === P.b);
  return `<div class="row" style="gap:8px;align-items:center"><button class="btn ghost sm" data-pp="wLibBack">← ${t("lb_back")}</button><h2 style="margin:0">📚 ${t("lb_h")}</h2></div>
   <div class="chips">${["all"].concat(grades.map(String)).map(g => `<button class="chip ${P.g === g ? "on" : ""}" data-pp="wLibG" data-v="${g}">${g === "all" ? t("allGrades") : gradeName(+g)}</button>`).join("")}</div>
   ${books.length > 1 ? `<div class="chips">${books.map(x => `<button class="chip ${P.b === x ? "on" : ""}" data-pp="wLibB" data-v="${esc(x)}">📘 ${esc(x)}</button>`).join("")}</div>` : ""}
   <input id="wzLibQ" style="flex:none;min-height:0;height:46px" placeholder="🔍 ${t("libSearch")}" value="${esc(P.q)}" oninput="libFilter(this.value)">
   <div class="list lib-pick">${rows.length ? rows.map(l => { const on = W.pieces.includes(l.title);
     return `<div class="row" data-q="${esc((l.title + " " + l.composer + " " + l.label).toLowerCase())}" ${P.q && !(l.title + " " + l.composer + " " + l.label).toLowerCase().includes(P.q.toLowerCase()) ? "hidden" : ""}>
      <div class="grow"><div class="title">${esc(l.title)}</div><div class="muted small">${esc(l.composer || "")}${l.label ? " · " + esc(l.label) : ""}</div></div>
      <a class="btn sm soft" href="${esc(listenUrl(l))}" target="_blank" rel="noopener">▶ ${t("lb_listen")}</a>
      <button class="btn sm ${on ? "" : "ghost"}" data-pp="wLibAdd" data-id="${esc(l.id)}">${on ? "✓" : "＋"}</button></div>`; }).join("") : `<div class="empty">${t("lb_none")}</div>`}</div>
   <div class="muted small">${t("lb_hint")}</div>`;
}
function libFilter(q) { if (PPW?.lib) PPW.lib.q = q; const s = q.toLowerCase(); document.querySelectorAll(".lib-pick [data-q]").forEach(r => r.hidden = !!s && !r.dataset.q.includes(s)); }
