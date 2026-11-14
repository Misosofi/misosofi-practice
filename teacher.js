/* ===== Teacher app (profiles.role = 'teacher') =====
   Tabs: Students · Library · Rewards · Settings. Opening a student shows a full-screen sheet with
   homework (incl. "Plan this week" via the plan-week function), pieces, practice history, recordings and settings. */

const TS = { me: null, prof: null, tab: "students", students: [], states: {}, days: [], tasks: [], library: [], rewards: [], reds: [], keep: 30, cur: null, det: null, week: 0, plan: null, editTask: null, libG: "all", libQ: "", giveLib: null, busy: false };
const tStu = id => TS.students.find(s => s.id === id);
const tName = id => tStu(id)?.display_name || "—";
const weekKey = off => key(addDays(monday(TODAY), off * 7));
const normT = s => String(s || "").trim().toLowerCase();

async function teacherBoot(user, prof) {
  TS.me = user; TS.prof = prof; MYEMAIL = user.email || "";
  document.documentElement.dataset.skin = "studio"; document.documentElement.dataset.kid = "0";
  await TloadAll();
  document.getElementById("app").hidden = false;
  Trefresh();
  Tcleanup().catch(e => console.warn("cleanup", e));
  document.addEventListener("visibilitychange", async () => {
    if (document.visibilityState !== "visible") return; setDates();
    if (!document.getElementById("sheet").hidden) return;
    try { await TloadAll(); setNet(true); Trefresh(); } catch (e) { if (e.net) setNet(false); }
  });
}
/* one round of parallel queries for all tabs */
async function TloadAll() {
  const me = TS.me.id;
  const students = await DB.sel("profiles", { eq: { teacher_id: me }, order: ["display_name", true] });
  const ids = students.map(s => s.id), since = key(addDays(TODAY, -62));
  const [states, days, tasks, library, rewards, reds, settings] = await Promise.all([
    ids.length ? DB.sel("student_state", { in: { student_id: ids } }) : [],
    ids.length ? DB.sel("practice_days", { in: { student_id: ids }, gte: { day: since } }) : [],
    ids.length ? DB.sel("tasks", { in: { student_id: ids }, eq: { week: WK } }) : [],
    DB.sel("library", { eq: { teacher_id: me }, order: ["title", true] }),
    DB.sel("rewards", { eq: { teacher_id: me }, order: ["price", true] }),
    ids.length ? DB.sel("redemptions", { in: { student_id: ids }, eq: { given: false }, order: ["created_at", true] }) : [],
    DB.sel("teacher_settings", { eq: { teacher_id: me } })
  ]);
  TS.students = students; TS.states = {}; states.forEach(s => TS.states[s.student_id] = s.data || {});
  if (typeof TcatLoad === "function") await TcatLoad();
  TS.days = days; TS.tasks = tasks; TS.library = library; TS.rewards = rewards; TS.reds = reds; TS.keep = settings[0]?.keep_recordings_days || 30; TS.tset = settings[0] || {};
}
/* delete recordings older than the teacher's setting (files + rows) */
async function Tcleanup() {
  const ids = TS.students.map(s => s.id); if (!ids.length) return;
  const cut = new Date(Date.now() - TS.keep * 864e5).toISOString();
  const old = await DB.sel("recordings", { in: { student_id: ids }, lt: { created_at: cut }, cols: "id,path" }); if (!old.length) return;
  await DB.rmFiles("recordings", old.map(r => r.path));
  await DB.del("recordings", { in: { id: old.map(r => r.id) } });
}
/* read-modify-write of a student's game state (teacher-owned keys: earSet, hearts, videos, abc, drills added/removed) */
async function TwriteState(sid, fn) {
  const rows = await DB.sel("student_state", { eq: { student_id: sid }, cols: "data" });
  const d = rows[0]?.data || {}; fn(d);
  await DB.ups("student_state", [{ student_id: sid, data: d, updated_at: new Date().toISOString() }], "student_id");
  TS.states[sid] = d; if (TS.det && TS.cur === sid) TS.det.state = d;
}
function Terr(e) { toast(e?.net ? t("err_net") : t("syncErr", { m: e?.message || "?" })); }
async function Tdo(fn, okMsg) { try { await fn(); if (okMsg) toast(okMsg); return true; } catch (e) { console.warn(e); Terr(e); return false; } }

/* ----- top, tabs ----- */
const TTABS = { students: "users", library: "book", rewards: "gift", settings: "gear" };
function Trefresh() {
  document.getElementById("top").innerHTML = `<span class="ava-mini tlogo" aria-hidden="true">${I.note}</span><div class="who"><div class="n">${esc(t("t_hello", { name: TS.prof.display_name || "" }))}</div><div class="lv">${t("t_role")}</div></div>`;
  const v = document.getElementById("view");
  v.innerHTML = ({ students: TvStudents, library: TvLibrary, rewards: TvRewards, settings: TvSettings })[TS.tab]();
  document.getElementById("tabs").innerHTML = Object.entries(TTABS).map(([k, ic]) => `<button data-act="tTab" data-t="${k}" ${k === TS.tab ? 'aria-current="page"' : ""}>${I[ic]}<span>${t("t_" + k)}${k === "rewards" && TS.reds.length ? ` (${TS.reds.length})` : ""}</span></button>`).join("");
}
const inviteUrl = () => APP_URL + "?" + (DB.demo ? "demo=1&" : "") + "join=" + TS.me.id;
function TinviteCard() {
  return `<div class="card stack teacher"><div class="section-head"><h2>${t("t_invite")}</h2></div><div class="muted small">${t("t_inviteD")}</div>
 <input id="tInviteUrl" readonly value="${esc(inviteUrl())}" style="flex:none;font-size:.8rem"><button class="btn" data-act="tCopyInvite">${I.link} ${t("t_copy")}</button></div>`;
}
function TweekSummary(sid) {
  const ds = TS.days.filter(d => d.student_id === sid && +d.seconds > 0), wk = ds.filter(d => d.day >= WK);
  const secs = wk.reduce((a, d) => a + (+d.seconds || 0), 0), tk = TS.tasks.filter(x => x.student_id === sid);
  const last = ds.map(d => d.day).sort().pop();
  return { days: new Set(wk.map(d => d.day)).size, mins: Math.round(secs / 60), done: tk.filter(x => (x.done_days || []).length).length, total: tk.length, last };
}
function TvStudents() {
  const L = TS.students;
  return `${typeof TcatInbox === "function" ? TcatInbox() : ""}<div class="section"><h2>${t("t_students")}</h2>
 <div class="list">${L.length ? L.map(s => {
    const w = TweekSummary(s.id), st = TS.states[s.id] || {}, av = st.avatar;
    return `<button class="row trow" data-act="tOpen" data-id="${s.id}"><span class="ava-mini" style="pointer-events:none">${av ? avatarSVG(av, { head: true, noCheeks: (st.profile?.age || 10) >= 13 }) : I.user}</span>
   <span class="grow"><span class="title">${esc(s.display_name || "—")}</span> <span class="pill a">${gradeName(s.grade)}</span>${s.plan === "coach" ? ` <span class="pill y">${t("plan_coach")}</span>` : ""}
   <span class="muted small" style="display:block">${t("weekH")}: ${t("t_days", { n: w.days })} · ${t("t_min", { n: w.mins })} · ${t("t_tasks", { a: w.done, b: w.total })}</span>
   <span class="muted small" style="display:block">${w.last ? t("t_last", { d: fmt(w.last, { weekday: "short", month: "short", day: "numeric" }) }) : t("t_never")}</span></span></button>`;
  }).join("") : `<div class="empty">${t("t_noStudents")}</div>`}</div></div>
 <div class="section">${TinviteCard()}</div>`;
}
/* ready-made exam lists: add one grade at a time to the library (pieces already there are skipped) */
function TcatalogCard() {
  if (typeof CATALOGS === "undefined") return "";
  return CATALOGS.map(c => { const grades = [...new Set(c.rows.map(r => r[0]))];
    const has = g => c.rows.filter(r => r[0] === g).every(r => TS.library.some(l => l.title === r[3] && +l.grade === g));
    return `<div class="card stack" style="background:var(--soft,#F6F4FF)"><b>📚 ${esc(c.name)}</b><div class="muted small">${t("cat_d")}</div>
     <div class="chips">${grades.map(g => `<button class="chip ${has(g) ? "on" : ""}" data-act="tCatAdd" data-c="${c.id}" data-g="${g}" ${has(g) ? "disabled" : ""}>${has(g) ? "✓ " : "＋ "}${gradeName(g)}</button>`).join("")}</div></div>`; }).join("");
}
function TvLibrary() {
  const L = TS.library.filter(l => (TS.libG === "all" || String(l.grade) === String(TS.libG)));
  return `<div class="section">${TcatalogCard()}</div><div class="section"><div class="card teacher stack"><div class="section-head"><h2>${t("libH")}</h2><span class="muted small">${t("t_libCount", { n: TS.library.length })}</span></div><div class="muted small">${t("libSub")} ${t("scoreOnly")}</div>
 <input id="tLibQ" placeholder="${t("libSearch")}" value="${esc(TS.libQ)}" style="flex:none">
 <div class="chips">${["all", 0, 1, 2, 3, 4, 5, 6, 7, 8].map(g => `<button class="chip ${String(TS.libG) === String(g) ? "on" : ""}" data-act="tLibG" data-g="${g}">${g === "all" ? t("allGrades") : gradeName(g)}</button>`).join("")}</div>
 <div class="list">${L.length ? L.map(l => `<div class="row lib-row" data-q="${esc((l.title + " " + l.composer).toLowerCase())}" ${TS.libQ && !(l.title + " " + l.composer).toLowerCase().includes(TS.libQ) ? "hidden" : ""} style="align-items:flex-start"><div class="grow"><div class="title">${esc(l.title)}</div><div class="muted small">${esc(l.composer || "—")} · ${gradeName(+l.grade || 0)}${l.label ? " · " + esc(l.label) : ""}</div>
   <div class="chips" style="margin-top:6px"><button class="btn sm" data-act="tLibGive" data-id="${l.id}">${t("libGive")}</button><a class="btn sm soft" href="${esc(listenUrl(l))}" target="_blank" rel="noopener">▶ ${t("lb_listen")}${l.yt_url ? "" : " 🔍"}</a>
   ${l.score_path ? `<button class="btn sm soft" data-act="tScore" data-id="${l.id}">${t("score")}</button>` : ""}<span class="btn sm soft filebtn">${t("attachScore")}<input type="file" class="tScoreFile" data-id="${l.id}" accept="application/pdf,image/*"></span></div>
   <form class="add" data-form="tLibYt" data-id="${l.id}" style="margin-top:6px"><input id="ly-${l.id}" type="url" maxlength="300" value="${esc(l.yt_url || "")}" placeholder="${t("lb_ytPh")}"><button class="btn sm ghost" type="submit">${t("save")}</button></form></div>
   <button class="x" data-act="tLibDel" data-id="${l.id}" aria-label="Delete">×</button></div>`).join("") : `<div class="empty">${t("libEmpty")}</div>`}</div>
 <h3 style="font-size:1rem">${t("libAdd")}</h3><form class="add" data-form="tLib"><input id="lT" placeholder="${t("libTitle")}" required maxlength="140" style="flex-basis:100%"><input id="lC" placeholder="${t("libComposer")}" maxlength="80"><select id="lG" style="flex:0 1 120px">${[0, 1, 2, 3, 4, 5, 6, 7, 8].map(g => `<option value="${g}">${gradeName(g)}</option>`).join("")}</select><input id="lL" placeholder="${t("libLabel")}" maxlength="60"><input id="lY" type="url" placeholder="${t("lb_ytPh")}" maxlength="300" style="flex-basis:100%"><button class="btn sm" type="submit">${t("add")}</button></form>
 <h3 style="font-size:1rem">${t("libPaste")}</h3><div class="muted small">${t("libPasteHow")}</div><form class="add" data-form="tLibPaste"><textarea id="lP" placeholder="Fireworks Minuet | Handel | 1 | ABRSM Grade 1 2025–26 | https://youtu.be/…&#10;Song without Words | Spindler | 1 | ABRSM Grade 1 2025–26"></textarea><button class="btn sm" type="submit">${t("libPasteBtn")}</button></form>
 </div></div>`;
}
function TvRewards() {
  return `<div class="section"><h2>${t("t_pendingH")}</h2><div class="list">${TS.reds.length ? TS.reds.map(r => `<div class="row"><div class="grow"><div class="title">${esc(r.title)}</div><div class="muted small">${esc(tName(r.student_id))} · ${fmt(key(new Date(r.created_at)))} · ${I.coin.replace("<svg", '<svg class="ico" style="width:14px;height:14px;color:var(--gold)"')}${r.price}</div></div><button class="btn sm" data-act="tGiven" data-id="${r.id}">${t("given")}</button></div>`).join("") : `<div class="empty">${t("t_noPending")}</div>`}</div></div>
 <div class="section"><h2>${t("t_rewardsH")}</h2><div class="list">${TS.rewards.length ? TS.rewards.map(r => `<div class="row"><div class="grow"><div class="title">${esc(r.title)}</div><span class="price">${I.coin}${r.price}</span></div><button class="x" data-act="tRewardDel" data-id="${r.id}" aria-label="Delete">×</button></div>`).join("") : `<div class="empty">—</div>`}</div>
 <form class="add" data-form="tReward"><input id="rT" placeholder="${t("rTitlePh")}" required maxlength="100"><input id="rP" type="number" min="1" value="100" style="flex:0 1 90px" aria-label="Price"><button class="btn sm" type="submit">${t("add")}</button></form></div>`;
}
function TvSettings() {
  return `<div class="section">${TinviteCard()}</div>${instButton() ? `<div class="section">${instButton()}</div>` : ""}
 <div class="section"><div class="card stack"><h2>${t("t_name")}</h2><form class="add" data-form="tName"><input id="tNm" value="${esc(TS.prof.display_name || "")}" maxlength="60" required><button class="btn sm" type="submit">${t("save")}</button></form></div></div>
 <div class="section"><div class="card stack teacher"><h2>👫 ${t("tr_h")}</h2>
  <label class="toggle" style="border:0;padding:0"><span><strong>${t("tr_cats")}</strong><br><span class="muted small">${t("tr_catsD")}</span></span><input type="checkbox" id="tCatsOn" ${TS.tset?.cats_from_students ? "checked" : ""}></label>
  <div><strong>${t("tr_terms")}</strong><div class="muted small">${t("tr_termsD")}</div></div>
  <textarea id="tTerms" maxlength="2000" style="min-height:130px">${esc(TS.tset?.visit_terms || t("fl_termsDefault"))}</textarea>
  <button class="btn" data-act="tRules">${t("save")}</button></div></div>
 <div class="section">${typeof TvoxCard === "function" ? (setTimeout(TvoxCheck, 0), TvoxCard()) : ""}</div>
 <div class="section"><div class="card stack"><h2>${t("t_keepRecs")}</h2><div class="chips">${[7, 14, 30].map(n => `<button class="chip ${TS.keep === n ? "on" : ""}" data-act="tKeep" data-n="${n}">${t("t_daysN", { n })}</button>`).join("")}</div><div class="muted small">${t("t_keepD")}</div></div></div>
 <div class="section"><div class="card stack"><div class="label">${t("languageH")}</div><div class="chips"><button class="chip on">English</button><button class="chip" disabled>日本語 · ${t("soon")}</button><button class="chip" disabled>Español · ${t("soon")}</button></div>
 <div class="muted small">${t("au_signedInAs", { e: esc(MYEMAIL) })}</div><button class="btn ghost" data-act="signOut">${t("au_signOut")}</button></div></div>`;
}

/* ----- student detail ----- */
async function TopenStudent(sid) {
  TS.cur = sid; TS.det = null; TS.plan = null; TS.week = 0; TS.editTask = null;
  TopenSheet(`<div class="stack">${TdetHead()}<div class="card empty">${t("loading")}</div></div>`);
  try { await TloadDetail(); TrenderDetail(); }
  catch (e) { TopenSheet(`<div class="stack">${TdetHead()}<div class="card stack"><div>${t("err_load")}</div><button class="btn" data-act="tOpen" data-id="${sid}">${t("retry")}</button></div></div>`); }
}
async function TloadDetail() {
  const sid = TS.cur;
  const [tasks, pieces, recs, st, days] = await Promise.all([
    DB.sel("tasks", { eq: { student_id: sid }, gte: { week: weekKey(-1) }, lte: { week: weekKey(1) }, order: ["created_at", true] }),
    DB.sel("pieces", { eq: { student_id: sid }, order: ["created_at", true] }),
    DB.sel("recordings", { eq: { student_id: sid }, order: ["created_at", false], limit: 40 }),
    DB.sel("student_state", { eq: { student_id: sid } }),
    DB.sel("practice_days", { eq: { student_id: sid }, gte: { day: key(addDays(TODAY, -62)) } })
  ]);
  TS.det = { tasks, pieces, recs, state: st[0]?.data || {}, days };
  TS.states[sid] = TS.det.state;
}
function TopenSheet(html) { const sh = document.getElementById("sheet"); sh.classList.add("full"); document.getElementById("panel").innerHTML = html; sh.hidden = false; }
function TcloseSheet() { const wasStudent = !!TS.cur; document.getElementById("sheet").hidden = true; TS.cur = null; TS.det = null; TS.plan = null; TS.hw = null; THwStop(); TS.giveLib = null; Trefresh(); if (wasStudent) TloadAll().then(Trefresh).catch(e => { if (e.net) setNet(false); }); }
function TdetHead() {
  const s = tStu(TS.cur), st = TS.states[TS.cur] || {};
  return `<div class="act-head">${st.avatar ? `<span class="ava-mini" style="cursor:default">${avatarSVG(st.avatar, { head: true })}</span>` : ""}<h2>${esc(s?.display_name || "—")}</h2><button class="icon-btn" data-act="tClose" aria-label="Close">${I.close}</button></div>`;
}
function TrenderDetail() {
  if (!TS.det) return; const sid = TS.cur, s = tStu(TS.cur), D = TS.det, st = D.state, wk = weekKey(TS.week);
  const tasks = D.tasks.filter(x => x.week === wk), pieceT = id => D.pieces.find(p => p.id === id)?.title;
  const ear = Array.isArray(st.earSet) ? st.earSet : [0, 2, 4, 5, 7], drillsDel = new Set(st.drillsDel || []), drills = (st.drills || []).filter(d => !drillsDel.has(d.id));
  const start = monday(addDays(TODAY, -21)), cells = [...Array(28)].map((_, i) => key(addDays(start, i))), byDay = {}; D.days.forEach(d => byDay[d.day] = +d.seconds || 0);
  const lv = x => !x ? "" : x < 600 ? "l1" : x < 1500 ? "l2" : "l3";
  const hist = D.days.filter(d => +d.seconds > 0 || d.note || d.feel).sort((a, b) => a.day < b.day ? 1 : -1).slice(0, 14);
  const P = TS.plan;
  const html = `<div class="stack">${TdetHead()}
 <div class="card stack"><div class="chips"><span class="pill m">${t("t_starsN", { n: +st.stars || 0 })}</span><span class="pill m">${t("t_coinsN", { n: +st.coins || 0 })}</span>${+st.profile?.age ? `<span class="pill m">${t("t_age", { n: +st.profile.age })}</span>` : ""}</div>
  <label class="toggle" style="border:0;padding:0"><strong>${t("t_grade")}</strong><select id="tGrade" style="flex:0 1 170px">${[0, 1, 2, 3, 4, 5, 6, 7, 8].map(g => `<option value="${g}" ${s.grade === g ? "selected" : ""}>${gradeName(g)}</option>`).join("")}</select></label>
  <div><strong>${t("t_plan")}</strong><div class="chips" style="margin-top:6px">${["free", "coach"].map(p => `<button class="chip ${s.plan === p ? "on" : ""}" data-act="tPlanSet" data-v="${p}">${t("plan_" + p)}</button>`).join("")}</div><div class="muted small" style="margin-top:4px">${t("planD_" + s.plan)}</div></div></div>

 <div class="card teacher stack"><div class="section-head"><h2>${t("planH")}</h2><span class="pill a">${I.sparkle.replace("<svg", '<svg style="width:12px;height:12px"')} AI</span></div>
  <div class="muted small">${t("planHow")}</div>
  <textarea id="planText" placeholder="${t("planPh")}" style="min-height:120px" maxlength="6000">${esc(P?.text || "")}</textarea>
  <button class="btn" data-act="tPlanMake" ${P?.busy ? "disabled" : ""}>${P?.busy ? t("planThinking") : t("planMake")}</button>
  ${P?.note ? `<div class="muted small">${esc(P.note)}</div>` : ""}
  ${P?.tasks?.length ? `<div class="list">${P.tasks.map((x, i) => `<div class="row">${areaIc(x.area)}<div class="grow"><div class="title">${esc(x.title)}</div><div class="muted small">${t("a_" + x.area)}${x.piece ? ` · <strong>${esc(x.piece)}</strong>${x.newPiece ? ` <span class="pill y">${t("newPiece")}</span>` : ""}` : ""}${x.tempo ? ` · ♩=${+x.tempo}` : ""}</div></div><button class="x" data-act="tPlanDrop" data-i="${i}" aria-label="Remove">×</button></div>`).join("")}</div>${P.ear?.length ? `<div class="muted small">${t("earLabel")}: ${P.ear.map(i => CHROM[i]).join(" ")}</div>` : ""}<button class="btn block" data-act="tPlanAdd" ${TS.busy ? "disabled" : ""}>${t("planAddAll")} · ${esc(t("t_week", { d: fmt(wk) }))}</button>` : ""}
 </div>
 ${typeof TWeekCard === "function" ? TWeekCard(st, D) : ""}
 ${typeof TVreqCard === "function" ? TVreqCard(st, D) : ""}
 ${typeof TTimerCard === "function" ? TTimerCard(st, D) : ""}
 ${typeof TPaperCard === "function" ? TPaperCard(st) : ""}
 ${THwCard(st, D)}
 ${typeof TcatSendCard === "function" ? TcatSendCard(sid) : ""}

 <div class="section" style="margin-block:4px"><div class="section-head"><h2>${t("t_tasksH")}</h2></div>
  <div class="chips">${[-1, 0, 1].map(o => `<button class="chip ${TS.week === o ? "on" : ""}" data-act="tWeek" data-o="${o}">${t(o < 0 ? "t_weekPrev" : o > 0 ? "t_weekNext" : "t_weekThis")}</button>`).join("")}<span class="muted small" style="align-self:center">${esc(t("t_week", { d: fmt(wk) }))}</span></div>
  <div class="list">${tasks.length ? tasks.map(x => TS.editTask === x.id && x.source === "teacher" ? `<form class="add row" data-form="tTaskEdit" data-id="${x.id}"><input id="te-${x.id}" value="${esc(x.title)}" maxlength="140" required><button class="btn sm" type="submit">${t("save")}</button></form>` :
    `<div class="row">${areaIc(x.area)}<div class="grow"><div class="title">${esc(x.title)}</div><div class="muted small">${x.piece_id && pieceT(x.piece_id) ? `<strong>${esc(pieceT(x.piece_id))}</strong> · ` : ""}${x.source === "teacher" ? t("fromTeacher") : t("t_studentTask")}${(x.done_days || []).length ? ` · <span style="color:var(--good);font-weight:800">✓ ${t("t_ticked", { n: x.done_days.length })}</span>` : ""}</div></div>
     ${x.source === "teacher" ? `<button class="btn sm soft" data-act="tTaskEdit" data-id="${x.id}">${t("t_edit")}</button>` : ""}<button class="x" data-act="tTaskDel" data-id="${x.id}" aria-label="Delete">×</button></div>`).join("") : `<div class="empty">${t("weekEmpty")}</div>`}</div>
  <form class="add" data-form="tTaskAdd"><select id="taA" style="flex:0 1 150px" aria-label="Area">${["piece", "sight", "nr", "tech", "solf", "ear", "theory", "other"].map(a => `<option value="${a}">${t("a_" + a)}</option>`).join("")}</select>
   <select id="taP" style="flex:1 1 150px" aria-label="Piece"><option value="">${t("t_noPiece")}</option>${D.pieces.map(p => `<option value="${p.id}">${esc(p.title)}</option>`).join("")}</select>
   <input id="taT" placeholder="${t("t_taskPh")}" required maxlength="140" style="flex-basis:100%"><button class="btn sm" type="submit">${t("t_addTask")}</button></form></div>

 <div class="section" style="margin-block:4px"><h2>${t("t_piecesH")}</h2><div class="list">${D.pieces.length ? D.pieces.map(p => `<div class="row"><div class="grow"><div class="title">${esc(p.title)}</div><div class="muted small">${t("st_" + p.status)} · ${fmtDur(+p.seconds || 0)} ${t("totalTime")}</div></div><button class="x" data-act="tPieceDel" data-id="${p.id}" aria-label="Delete">×</button></div>`).join("") : `<div class="empty">—</div>`}</div>
  <form class="stack tp-new card" data-form="tPieceNew"><b>➕ ${t("t_pnH")}</b><div class="muted small">${t("t_pnHow")}</div>
   <input id="tpT" placeholder="${t("t_pnTitle")}" maxlength="120"><input id="tpC" placeholder="${t("t_pnComp")}" maxlength="80">
   <label class="btn soft block">📷 ${t("t_pnPhoto")}<input type="file" id="tpF" accept="image/*,application/pdf" hidden onchange="document.getElementById('tpFn').textContent=this.files[0]?'✓ '+this.files[0].name:''"></label><span class="small muted" id="tpFn"></span>
   <button class="btn block" type="submit">${t("t_pnAdd")}</button></form>
  ${TS.library.length ? `<form class="add" data-form="tGive"><select id="tgL" aria-label="${t("t_giveLib")}">${TS.library.map(l => `<option value="${l.id}" ${D.pieces.some(p => p.library_id === l.id) ? "disabled" : ""}>${esc(l.title)}</option>`).join("")}</select><button class="btn sm" type="submit">${t("libGive")}</button></form>` : ""}</div>

 <div class="section" style="margin-block:4px"><h2>${t("techH")}</h2><div class="list">${drills.length ? drills.map(d => `<div class="row"><div class="grow"><div class="title">${esc(d.name)}</div><div class="muted small">${t("targetBpm")} ♩=${+d.target || "—"} · ${t("bestBpm")} ♩=${+d.best || "—"}</div></div><button class="x" data-act="tDrillDel" data-id="${esc(d.id)}" aria-label="Delete">×</button></div>`).join("") : `<div class="empty">—</div>`}</div>
  <form class="add" data-form="tDrill"><input id="tdN" placeholder="${t("drillPh")}" required maxlength="100"><input id="tdT" type="number" min="30" max="240" value="80" style="flex:0 1 80px" aria-label="Tempo"><button class="btn sm" type="submit">${t("addDrill")}</button></form></div>

 <div class="card stack"><h2>${t("t_notesH")}</h2>
  <div><strong>${t("earLabel")}</strong><div class="chips" style="margin-top:6px">${CHROM.map((n, i) => `<button class="chip ${ear.includes(i) ? "on" : ""}" data-act="tEar" data-i="${i}">${n}</button>`).join("")}</div></div>
  <label class="toggle" style="border:0;padding:0"><span><strong>${t("abcLabel")}</strong><br><span class="muted small">${t("abcD")}</span></span><input type="checkbox" id="tAbc" ${st.abc !== false ? "checked" : ""}></label>
  <div><strong>${t("videosAdmin")}</strong>${(st.videos || []).map(v => `<div style="display:flex;gap:6px;align-items:center"><span class="grow small">${esc(v.title)}${v.url ? "" : " · —"}</span><button class="x" data-act="tVidDel" data-id="${esc(v.id)}" aria-label="Delete">×</button></div>`).join("")}
  <form class="add" data-form="tVid" style="margin-top:6px"><input id="vT" placeholder="${t("vTitlePh")}" required maxlength="100"><input id="vU" type="url" placeholder="${t("vUrlPh")}"><button class="btn sm" type="submit">${t("add")}</button></form></div></div>

 <div class="section" style="margin-block:4px"><h2>${t("t_history")}</h2><div class="card stack"><div class="heat">${t("wd").map(w => `<div class="label" style="text-align:center">${w}</div>`).join("")}${cells.map(d => `<div class="c ${lv(byDay[d])} ${d === TK ? "t" : ""}">${d > TK || !byDay[d] ? "" : Math.max(1, Math.round(byDay[d] / 60))}</div>`).join("")}</div></div>
  <div class="list">${hist.length ? hist.map(d => `<div class="row" style="align-items:flex-start"><div class="grow"><div class="title">${fmt(d.day, { weekday: "short", month: "short", day: "numeric" })} · ${fmtDur(+d.seconds || 0)}${d.feel ? ` <span class="pill m">${t("feel_" + d.feel)}</span>` : ""}</div>${d.note ? `<div class="muted small">${esc(d.note)}</div>` : ""}</div></div>`).join("") : `<div class="empty">${t("t_noHistory")}</div>`}</div></div>

 ${TplanProgress(st, D)}
 <div class="section" style="margin-block:4px" id="tVisit" data-sid="${esc(sid)}"></div>
${(() => { const p = (Array.isArray(st.plans) ? st.plans : [])[0]; if (!p) return ""; return `<div class="section" style="margin-block:4px"><h2>${t("t_planH")}</h2><div class="card stack"><div class="muted small">${esc(fmt(p.date))}${p.done ? " · ✓" : ""}</div>${p.path ? (p.kind === "video" ? `<video class="plan-video" data-tplan="${esc(p.path)}" controls playsinline preload="metadata"></video>` : `<audio data-tplan="${esc(p.path)}" controls preload="none"></audio>`) : ""}${p.text ? `<div class="plan-text">${esc(p.text)}</div>` : ""}</div></div>`; })()}
 <div class="section" style="margin-block:4px"><h2>${t("t_recs")}</h2><div class="list">${D.recs.length ? D.recs.map(r => `<div class="row" style="align-items:flex-start"><div class="grow">
   <div class="title">${r.kind === "video" ? ico("video") + " " : ""}${fmt(key(new Date(r.created_at)), { weekday: "short", month: "short", day: "numeric" })} · ${fmtDur(+r.seconds || 0)} ${r.listened ? `<span class="pill g">${t("listened")}</span>` : ""}</div>
   ${r.piece_id && pieceT(r.piece_id) ? `<div class="muted small">${esc(pieceT(r.piece_id))}</div>` : ""}
   ${r.kind === "video" ? `<video controls playsinline preload="metadata" data-trec="${r.id}"></video>` : `<audio controls preload="metadata" data-trec="${r.id}"></audio>`}
   <form class="add" data-form="tComment" data-id="${r.id}" style="margin-top:8px;flex-wrap:nowrap"><button type="button" class="heartbtn ${r.heart ? "on" : ""}" data-act="tHeart" data-id="${r.id}" aria-label="Give a heart">${r.heart ? I.heart : I.heartO}</button><input id="cm-${r.id}" placeholder="${t("commentPh")}" value="${esc(r.comment || "")}" maxlength="500"><button class="btn sm" type="submit">${t("send")}</button></form>
  </div></div>`).join("") : `<div class="empty">${s.plan === "coach" ? t("t_noRecs") : t("planD_free")}</div>`}</div></div>
 </div>`;
  const panel = document.getElementById("panel"), y = panel.scrollTop;
  TopenSheet(html); panel.scrollTop = y;
  tVisitFill(sid); THwAfter();
  panel.querySelectorAll("[data-tplan]").forEach(async a => { try { a.src = await signed("recordings", a.dataset.tplan); } catch (e) { } });
  panel.querySelectorAll("[data-trec]").forEach(async a => { const r = D.recs.find(x => x.id === a.dataset.trec); try { a.src = await signed("recordings", r.path); } catch (e) { const m = document.createElement("div"); m.className = "muted small"; m.textContent = t("err_net"); a.replaceWith(m); } });
}
/* the student's own practice plan (made with the question wizard), how far they got, and growth lines */
function TplanProgress(st, D) {
  const P = st.pplan, H = st.ppHist || {}, days = Array.from({ length: 28 }, (_, i) => key(addDays(TODAY, i - 27)));
  const byDay = {}; D.days.forEach(d => byDay[d.day] = +d.seconds || 0);
  const mins = days.map(d => Math.round((byDay[d] || 0) / 60));
  const acc = days.map(d => H[d]?.tries ? Math.round(H[d].rights / H[d].tries * 100) : null);
  const cards = days.map(d => H[d]?.done || 0);
  const f = d => fmt(d, { month: "short", day: "numeric" });
  const cs = P?.cards || [], done = cs.filter(c => c.done).length;
  const tips = c => (c.tips || []).map(k => (SAID.find(x => x[0] === k) || [0, ""])[1]).join("");
  const plan = cs.length ? `<div class="muted small">${esc(fmt(P.date, { weekday: "short", month: "short", day: "numeric" }))}${P.date === TK ? ` · ${t("t_pp_today")}` : ""} · ${t("t_pp_done", { a: done, b: cs.length })}</div>
   <div class="pp-list">${cs.map(c => `<div class="pp-item ${c.done ? "done" : ""}"><span class="pp-chk">${c.done ? "✓" : ""}</span><span class="grow"><b>${esc(ppTitle(c))}</b><span class="muted small">${ppHow(c)}${!c.kind && c.tries ? ` · ${t("t_pp_tries", { n: c.tries })}` : ""}${!c.kind && !c.done && c.streak ? ` · ${t("t_pp_streak", { n: c.streak })}` : ""}${c.note ? ` · ${esc(c.note)}` : ""} ${tips(c)}</span></span></div>`).join("")}</div>` : `<div class="empty">${t("t_pp_none")}</div>`;
  const th = st.thief || {}, thiefOn = (th.stolen || []).length || th.boxed;
  return `<div class="section" style="margin-block:4px"><div class="section-head"><h2>📝 ${t("t_pp_h")}</h2></div><div class="card stack">${plan}${thiefOn ? `<div class="muted small">🦹 ${t("t_pp_thief")}</div>` : ""}</div></div>
  <div class="section" style="margin-block:4px"><div class="section-head"><h2>📈 ${t("t_gr_h")}</h2><span class="muted small">${t("gr_sub")}</span></div>
   <div class="card stack"><b>${t("gr_min")}</b>${lineChart(mins, { top: t("gr_minAxis"), start: f(days[0]), end: f(TK), col: "#6C5CE7" })}</div>
   <div class="card stack"><b>${t("gr_acc")}</b>${acc.some(v => v != null) ? lineChart(acc, { max: 100, top: "%", start: f(days[0]), end: f(TK), col: "#2BB673" }) : `<div class="muted small">${t("gr_none")}</div>`}</div>
   <div class="card stack"><b>${t("gr_cards")}</b>${lineChart(cards, { start: f(days[0]), end: f(TK), col: "#F5A623" })}</div></div>`;
}
function TfindLib(title) { return TS.library.find(l => normT(l.title) === normT(title)); }
function TfindPiece(title) { return TS.det.pieces.find(p => normT(p.title) === normT(title)); }
function fallbackPlan(text) { return text.split(/\n|。|\. |;|・/).map(s => s.trim()).filter(s => s.length > 2).map(s => ({ area: guessArea(s), title: s.slice(0, 120), piece: null, tempo: null })); }
async function TplanMake() {
  const text = (document.getElementById("planText")?.value || "").trim();
  if (!text) { TS.plan = { text, note: t("planNone") }; TrenderDetail(); return; }
  TS.plan = { text, busy: true }; TrenderDetail();
  const titles = [...new Set([...TS.det.pieces.map(p => p.title), ...TS.library.map(l => l.title)])];
  let tasks = null, ear = null, note = "";
  try {
    const r = await DB.planWeek({ notes: text, pieces: titles });
    tasks = (r.tasks || []).filter(x => x && x.title).map(x => ({ area: ACT[x.area] ? x.area : "other", title: String(x.title).slice(0, 140), piece: x.area === "piece" && x.piece ? String(x.piece).slice(0, 80) : null, tempo: +x.tempo || null }));
    ear = (r.earNotes || []).map(n => CHROM.indexOf(String(n))).filter(i => i >= 0);
  } catch (e) { console.warn("plan-week", e); tasks = fallbackPlan(text); note = t("planErr", { m: e.net ? t("err_net") : e.message }); }
  if (TS.plan?.text !== text) return; /* closed or changed meanwhile */
  tasks.forEach(x => { if (x.piece) { const p = TfindPiece(x.piece), l = !p && TfindLib(x.piece); x.newPiece = !p && !l; if (p) x.piece = p.title; else if (l) x.piece = l.title; } });
  TS.plan = { text, tasks, ear, note: tasks.length ? note : t("planNone") }; TrenderDetail();
}
async function TplanAdd() {
  const P = TS.plan, sid = TS.cur, wk = weekKey(TS.week); if (!P?.tasks?.length || TS.busy) return;
  TS.busy = true; TrenderDetail();
  const newPieces = [], rows = [], newDrills = [], st = TS.det.state, haveDrill = n => (st.drills || []).some(d => normT(d.name) === normT(n)) || newDrills.some(d => normT(d.name) === normT(n));
  P.tasks.forEach(x => {
    let pid = null;
    if (x.piece) {
      let p = TfindPiece(x.piece) || newPieces.find(q => normT(q.title) === normT(x.piece));
      if (!p) { const l = TfindLib(x.piece); p = l ? (TS.det.pieces.find(q => q.library_id === l.id) || null) : null;
        if (!p) { p = l ? { id: uid(), student_id: sid, library_id: l.id, title: l.title, composer: l.composer || "" } : { id: uid(), student_id: sid, title: x.piece, composer: "" }; newPieces.push(p); } }
      pid = p.id;
    }
    if (x.area === "tech" && x.tempo && !haveDrill(x.title)) newDrills.push({ id: uid(), name: x.title, target: +x.tempo, best: 0, doneOn: {} });
    rows.push({ id: uid(), student_id: sid, week: wk, area: x.area, title: x.title, piece_id: pid, source: "teacher" });
  });
  const ok = await Tdo(async () => {
    if (newPieces.length) await DB.ins("pieces", newPieces);
    await DB.ins("tasks", rows);
    if (newDrills.length || (P.ear && P.ear.length >= 2)) await TwriteState(sid, d => { if (newDrills.length) d.drills = [...(d.drills || []), ...newDrills]; if (P.ear && P.ear.length >= 2) d.earSet = [...new Set(P.ear)].sort((a, b) => a - b); });
  }, t("t_addedN", { n: rows.length }));
  TS.busy = false;
  if (ok) { TS.plan = null; await TreloadDetail(); } else TrenderDetail();
}
async function TreloadDetail() { try { await TloadDetail(); } catch (e) { Terr(e); } TrenderDetail(); }
async function TshowScore(libId) {
  const l = TS.library.find(x => x.id === libId); if (!l?.score_path) return;
  const head = `<div class="act-head"><h2>${esc(l.title)}</h2><button class="icon-btn" data-act="tClose" aria-label="Close">${I.close}</button></div>`;
  TopenSheet(`<div class="stack">${head}<div class="card empty">${t("loading")}</div></div>`);
  try {
    const u = await signed("scores", l.score_path), isImg = /\.(png|jpe?g|gif|webp|heic)$/i.test(l.score_path);
    TopenSheet(`<div class="stack">${head}${isImg ? `<img class="scoreimg" src="${esc(u)}" alt="${esc(l.title)}">` : ""}<a class="btn" href="${esc(u)}" target="_blank" rel="noopener">${t("scoreOpen")}</a></div>`);
  } catch (e) { TopenSheet(`<div class="stack">${head}<div class="card empty">${t("dlNo")}</div></div>`); }
}
function TgiveSheet(libId) {
  const l = TS.library.find(x => x.id === libId); TS.giveLib = libId;
  TopenSheet(`<div class="stack"><div class="act-head"><h2>${t("t_giveTo")}</h2><button class="icon-btn" data-act="tClose" aria-label="Close">${I.close}</button></div><div class="title">${esc(l.title)}</div>
  <div class="list">${TS.students.length ? TS.students.map(s => `<button class="row trow" data-act="tGiveTo" data-id="${s.id}"><span class="grow title">${esc(s.display_name || "—")}</span><span class="pill a">${gradeName(s.grade)}</span></button>`).join("") : `<div class="empty">${t("t_noStudents")}</div>`}</div></div>`);
}
async function TgiveLib(sid, libId) {
  const l = TS.library.find(x => x.id === libId); if (!l) return false;
  const have = await DB.sel("pieces", { eq: { student_id: sid, library_id: libId }, cols: "id" });
  if (have.length) { toast(t("t_alreadyHas")); return false; }
  await DB.ins("pieces", [{ id: uid(), student_id: sid, library_id: l.id, title: l.title, composer: l.composer || "" }]); return true;
}

/* ----- events ----- */
function teacherClick(b) {
  const a = b.dataset.act, id = b.dataset.id;
  switch (a) {
    case "tTab": TS.tab = b.dataset.t; Trefresh(); scrollTo(0, 0); return;
    case "signOut": signOutNow(); return;
    case "tCopyInvite": {
      const u = inviteUrl(), done = () => toast(t("t_copied"));
      if (navigator.clipboard?.writeText) navigator.clipboard.writeText(u).then(done, () => { const i = document.getElementById("tInviteUrl"); i.select(); try { document.execCommand("copy"); done(); } catch (e) { } });
      else { const i = document.getElementById("tInviteUrl"); i.select(); try { document.execCommand("copy"); done(); } catch (e) { } }
      return;
    }
    case "tOpen": TopenStudent(id); return;
    case "tClose": TcloseSheet(); return;
    case "tPlanSet": Tdo(async () => { await DB.upd("profiles", { id: TS.cur }, { plan: b.dataset.v }); tStu(TS.cur).plan = b.dataset.v; }, t("saved")).then(TrenderDetail); return;
    case "tWeek": TS.week = +b.dataset.o; TrenderDetail(); return;
    case "tPlanMake": TplanMake(); return;
    case "tPlanDrop": TS.plan.tasks.splice(+b.dataset.i, 1); TrenderDetail(); return;
    case "tPlanAdd": TplanAdd(); return;
    case "tTaskEdit": TS.editTask = id; TrenderDetail(); document.getElementById("te-" + id)?.focus(); return;
    case "tTaskDel": if (!confirm(t("confirmDel"))) return; Tdo(() => DB.del("tasks", { eq: { id } }), t("deleted")).then(TreloadDetail); return;
    case "tPieceDel": if (!confirm(t("confirmDel"))) return; Tdo(() => DB.del("pieces", { eq: { id } }), t("deleted")).then(TreloadDetail); return;
    case "tDrillDel": Tdo(() => TwriteState(TS.cur, d => { d.drills = (d.drills || []).filter(x => x.id !== id); d.drillsDel = [...new Set([...(d.drillsDel || []), id])]; })).then(TrenderDetail); return;
    case "tEar": {
      const i = +b.dataset.i; Tdo(() => TwriteState(TS.cur, d => { let s = Array.isArray(d.earSet) ? d.earSet : [0, 2, 4, 5, 7]; s = s.includes(i) ? s.filter(x => x !== i) : [...s, i]; if (s.length < 2) s = [0, 2]; d.earSet = s.sort((x, y) => x - y); })).then(TrenderDetail); return;
    }
    case "tVidDel": Tdo(() => TwriteState(TS.cur, d => { d.videos = (d.videos || []).filter(v => v.id !== id); })).then(TrenderDetail); return;
    case "tHeart": {
      const r = TS.det.recs.find(x => x.id === id), h = !r.heart, sid = TS.cur;
      Tdo(async () => { await DB.upd("recordings", { id }, { heart: h, listened: true }); r.heart = h; r.listened = true; await TwriteState(sid, d => { d.hearts = Math.max(0, (+d.hearts || 0) + (h ? 1 : -1)); }); }).then(TrenderDetail); return;
    }
    case "tLibG": TS.libG = b.dataset.g === "all" ? "all" : +b.dataset.g; Trefresh(); return;
    case "tLibGive": TgiveSheet(id); return;
    case "tGiveTo": { const libId = TS.giveLib; Tdo(async () => { if (await TgiveLib(id, libId)) toast(t("t_givenTo", { name: tName(id) })); }).then(() => TcloseSheet()); return; }
    case "tLibDel": if (!confirm(t("confirmDel"))) return; {
      const l = TS.library.find(x => x.id === id);
      Tdo(async () => { await DB.del("library", { eq: { id } }); if (l?.score_path) { try { await DB.rmFiles("scores", [l.score_path]); } catch (e) { } } TS.library = TS.library.filter(x => x.id !== id); }, t("deleted")).then(Trefresh); return;
    }
    case "tScore": TshowScore(id); return;
    case "tRewardDel": Tdo(async () => { await DB.del("rewards", { eq: { id } }); TS.rewards = TS.rewards.filter(x => x.id !== id); }, t("deleted")).then(Trefresh); return;
    case "tGiven": Tdo(async () => { await DB.upd("redemptions", { id }, { given: true }); TS.reds = TS.reds.filter(x => x.id !== id); }, t("saved")).then(Trefresh); return;
    case "tCatAdd": { const c = CATALOGS.find(x => x.id === b.dataset.c), g = +b.dataset.g; if (!c) return;
      const rows = c.rows.filter(r => r[0] === g && !TS.library.some(l => l.title === r[3] && +l.grade === g)).map(r => ({ id: uid(), teacher_id: TS.me.id, title: r[3].slice(0, 140), composer: r[2].slice(0, 80), grade: g, label: `${c.short} · List ${r[1]}${r[4] ? " 📘" : ""}`.slice(0, 60) }));
      if (!rows.length) return; b.disabled = true;
      Tdo(() => DB.ins("library", rows), t("libAdded", { n: rows.length })).then(ok => { if (ok) { TS.library.push(...rows.map(r => ({ ...r, score_path: null, yt_url: "" }))); TS.library.sort((a, b) => a.title.localeCompare(b.title)); } Trefresh(); }); return; }
    case "tRules": { const c = document.getElementById("tCatsOn").checked, txt = document.getElementById("tTerms").value.slice(0, 2000);
      Tdo(async () => { await DB.ups("teacher_settings", [{ teacher_id: TS.me.id, keep_recordings_days: TS.keep, cats_from_students: c, visit_terms: txt }], "teacher_id"); TS.tset = { ...TS.tset, cats_from_students: c, visit_terms: txt }; }, t("saved")); return; }
    case "tKeep": { const n = +b.dataset.n; Tdo(async () => { await DB.ups("teacher_settings", [{ teacher_id: TS.me.id, keep_recordings_days: n, cats_from_students: !!TS.tset?.cats_from_students, visit_terms: TS.tset?.visit_terms || "" }], "teacher_id"); TS.keep = n; }, t("saved")).then(() => { Trefresh(); Tcleanup().catch(() => { }); }); return; }
  }
}
function teacherInput(e) {
  if (e.target.id === "tLibQ") { const v = e.target.value.trim().toLowerCase(); TS.libQ = v; document.querySelectorAll(".lib-row").forEach(r => r.hidden = !!v && !r.dataset.q.includes(v)); }
  if (e.target.id === "planText" && !TS.plan?.busy) { TS.plan = TS.plan || {}; TS.plan.text = e.target.value; }
}
function teacherChange(e) {
  const b = e.target;
  if (b.id === "tGrade") { const g = +b.value; Tdo(async () => { await DB.upd("profiles", { id: TS.cur }, { grade: g }); tStu(TS.cur).grade = g; }, t("saved")); }
  if (b.id === "tAbc") { const v = b.checked; Tdo(() => TwriteState(TS.cur, d => { d.abc = v; }), t("saved")); }
  if (b.classList?.contains("tScoreFile") && b.files[0]) {
    const f = b.files[0], l = TS.library.find(x => x.id === b.dataset.id); if (!l) return;
    if (f.size > 50e6) { toast(t("err_generic")); return; }
    const safe = (f.name || "score").normalize("NFKD").replace(/[^\w.\-]+/g, "_").slice(-80) || "score.pdf", path = `${TS.me.id}/${l.id}/${Date.now()}-${safe}`, old = l.score_path;
    toast(t("t_scoreUp"));
    Tdo(async () => { await DB.upload("scores", path, f, f.type || "application/pdf"); await DB.upd("library", { id: l.id }, { score_path: path }); l.score_path = path; if (old) { try { await DB.rmFiles("scores", [old]); } catch (e) { } } }, t("scoreSaved")).then(Trefresh);
  }
}
async function teacherSubmit(e) {
  const f = e.target.dataset.form, v = id => (document.getElementById(id)?.value || "").trim(), me = TS.me.id;
  if (f === "tLib") { const title = v("lT"); if (!title) return; const row = { id: uid(), teacher_id: me, title, composer: v("lC"), grade: +v("lG") || 0, label: v("lL") }; if (v("lY")) row.yt_url = v("lY").slice(0, 300); if (await Tdo(() => DB.ins("library", [row]), t("saved"))) { TS.library.push({ ...row, score_path: null }); TS.library.sort((a, b) => a.title.localeCompare(b.title)); Trefresh(); } return; }
  if (f === "tLibYt") { const id = e.target.dataset.id, u = v("ly-" + id).slice(0, 300); if (u && !/^https?:\/\//.test(u)) { toast(t("lb_badUrl")); return; }
    if (await Tdo(() => DB.upd("library", { id }, { yt_url: u }), t("saved"))) { const l = TS.library.find(x => x.id === id); if (l) l.yt_url = u; Trefresh(); } return; }
  if (f === "tLibPaste") {
    const rows = v("lP").split(/\n+/).map(x => x.trim()).filter(Boolean).map(line => { const [title, composer = "", grade = "", label = "", yt = ""] = line.split("|").map(x => x.trim()); const g = parseInt(String(grade).replace(/[^0-9]/g, "")); if (!title) return null; const r = { id: uid(), teacher_id: me, title: title.slice(0, 140), composer: composer.slice(0, 80), grade: isNaN(g) ? 0 : Math.max(0, Math.min(8, g)), label: label.slice(0, 60) }; if (/^https?:\/\//.test(yt)) r.yt_url = yt.slice(0, 300); return r; }).filter(Boolean);
    if (!rows.length) return;
    if (await Tdo(() => DB.ins("library", rows), t("libAdded", { n: rows.length }))) { TS.library.push(...rows.map(r => ({ ...r, score_path: null }))); TS.library.sort((a, b) => a.title.localeCompare(b.title)); Trefresh(); }
    return;
  }
  if (f === "tReward") { const title = v("rT"); if (!title) return; const row = { id: uid(), teacher_id: me, title, price: Math.max(1, Math.round(+v("rP") || 100)) }; if (await Tdo(() => DB.ins("rewards", [row]), t("saved"))) { TS.rewards.push(row); TS.rewards.sort((a, b) => a.price - b.price); Trefresh(); } return; }
  if (f === "tName") { const n = v("tNm"); if (!n) return; if (await Tdo(() => DB.upd("profiles", { id: me }, { display_name: n }), t("saved"))) { TS.prof.display_name = n; Trefresh(); } return; }
  const sid = TS.cur; if (!sid) return;
  /* a piece for THIS student: it goes into the teacher's list too (with the photo of the score), and is given to the student */
  if (f === "tPieceNew") { const file = document.getElementById("tpF")?.files?.[0]; let title = v("tpT"); if (!title && !file) return;
    title ||= "📷 " + new Date().toLocaleDateString(undefined, { day: "numeric", month: "short" });
    const lib = { id: uid(), teacher_id: me, title: title.slice(0, 140), composer: v("tpC").slice(0, 80), grade: +(tStu(sid)?.grade || 0), label: "" };
    const ok = await Tdo(async () => {
      await DB.ins("library", [lib]);
      if (file) { if (file.size > 50e6) throw new Error("too big"); const safe = (file.name || "score.jpg").normalize("NFKD").replace(/[^\w.\-]+/g, "_").slice(-80) || "score.jpg", path = `${me}/${lib.id}/${Date.now()}-${safe}`;
        await DB.upload("scores", path, file, file.type || "image/jpeg"); await DB.upd("library", { id: lib.id }, { score_path: path }); lib.score_path = path; }
      await DB.ins("pieces", [{ id: uid(), student_id: sid, library_id: lib.id, title: lib.title, composer: lib.composer }]);
    }, t("saved"));
    if (ok) { TS.library.push({ score_path: null, yt_url: "", ...lib }); TS.library.sort((a, b) => a.title.localeCompare(b.title)); }
    return TreloadDetail(); }
  if (f === "tTaskAdd") { const title = v("taT"); if (!title) return; const row = { id: uid(), student_id: sid, week: weekKey(TS.week), area: v("taA") || "other", title, piece_id: v("taP") || null, source: "teacher" }; await Tdo(() => DB.ins("tasks", [row]), t("saved")); return TreloadDetail(); }
  if (f === "tTaskEdit") { const id = e.target.dataset.id, title = v("te-" + id); if (!title) return; TS.editTask = null; await Tdo(() => DB.upd("tasks", { id }, { title }), t("saved")); return TreloadDetail(); }
  if (f === "tGive") { const libId = v("tgL"); if (!libId) return; await Tdo(async () => { if (await TgiveLib(sid, libId)) toast(t("libGiven")); }); return TreloadDetail(); }
  if (f === "tDrill") { const name = v("tdN"); if (!name) return; const target = Math.max(30, Math.min(240, +v("tdT") || 80)); await Tdo(() => TwriteState(sid, d => { d.drills = [...(d.drills || []), { id: uid(), name, target, best: 0, doneOn: {} }]; }), t("saved")); return TrenderDetail(); }
  if (f === "tVid") { const title = v("vT"), url = v("vU"); if (!title) return; if (url && !/^https?:\/\//i.test(url)) { toast(t("err_generic")); return; } await Tdo(() => TwriteState(sid, d => { d.videos = [...(d.videos || []), { id: uid(), title, url }]; }), t("saved")); return TrenderDetail(); }
  if (f === "tComment") { const id = e.target.dataset.id, r = TS.det.recs.find(x => x.id === id), c = v("cm-" + id); await Tdo(async () => { await DB.upd("recordings", { id }, { comment: c, listened: true }); r.comment = c; r.listened = true; }, t("saved")); return TrenderDetail(); }
}
/* mark a recording as listened when the teacher plays it */
document.addEventListener("play", e => {
  const id = e.target?.dataset?.trec; if (!id || !TS.det) return; const r = TS.det.recs.find(x => x.id === id);
  if (r && !r.listened) { r.listened = true; DB.upd("recordings", { id }, { listened: true }).catch(() => { r.listened = false; }); }
}, true);
