/* ===== Student app =====
   The prototype's student experience, persisted to Supabase.
   In memory the state keeps the prototype's shape (S.pieces, S.log, S.items, ...). save() works out what changed
   since the last save and queues the matching database writes (outbox, kept in localStorage so nothing is lost
   offline). Game state (avatar, coins, quest, drills, goals ...) goes to student_state.data. */

let S = null, ME = null, PROF = null, MYEMAIL = "";
/* keys stored in student_state.data; the teacher owns TEACHER_KEYS (the student only reads them) */
const PERSIST = ["v", "onboarded", "profile", "skin", "avatar", "owned", "cards", "coins", "stars", "hearts", "starDays", "quest", "drills", "drillsDel", "goals", "events", "nr", "ncBest", "ncNames", "ncLvl", "earSet", "videos", "vw", "recs", "recOn", "taskPaid", "starredPieces", "abc"];
const TEACHER_KEYS = ["earSet", "hearts", "videos", "abc"];
const clone = x => JSON.parse(JSON.stringify(x ?? null));
function defaultData() {
  return {
    v: 6, onboarded: false, profile: { name: "", gender: "", age: 10 }, skin: "studio",
    avatar: { skin: 1, hair: "short", hairColor: 0, eyes: "dots", acc: "none", shirt: 0, bg: 0 }, owned: ["none", "glasses"], cards: [],
    coins: 0, stars: 0, hearts: 0, starDays: {}, quest: {},
    drills: [{ id: "c-major-scale", name: "C major scale, hands together", target: 80, best: 0, doneOn: {} }], drillsDel: [],
    goals: [], events: [], nr: { sessions: [] }, ncBest: {}, ncNames: true, ncLvl: null,
    earSet: [0, 2, 4, 5, 7], videos: [], vw: {}, recs: [], recOn: false, taskPaid: {}, starredPieces: [], abc: true
  };
}
const kid = () => S.profile.age <= 9, teen = () => S.profile.age >= 13, coach = () => S.plan === "coach";
const gG = () => Math.max(0, Math.min(5, +S.profile.grade || 0)); /* generators cover Initial–Grade 5 */
const gradeName = g => g === 0 ? t("grade0") : t("gradeN", { n: g });
function suggestSkin() { const g = S.profile.gender, a = S.profile.age; if (a >= 13) return g === "boy" ? "arcade" : "studio"; return g === "boy" ? "space" : g === "girl" ? "garden" : "studio"; }
function applySkin() { const r = document.documentElement; r.dataset.skin = S ? S.skin : "studio"; r.dataset.kid = S && kid() ? "1" : "0"; r.lang = LANG; }
let tab = "home", feelPick = null, A = null, OB = null, shopTab = "avatar";
try { const h = location.hash.slice(1); if (["home", "pieces", "goals", "me"].includes(h)) tab = h; } catch (e) { }

/* ===== sync: local cache + outbox ===== */
let OUT = [], SNAP = null, flushing = false, flushAgain = false, flushT = null, GEN = 0;
const LSK = n => `mp-${n}-${ME}`;
const lsGet = k => { try { return JSON.parse(localStorage.getItem(k)); } catch (e) { return null; } };
const lsSet = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { } };
const saveOut = () => lsSet(LSK("outbox"), OUT);
function stateData() { const d = {}; PERSIST.forEach(k => { if (k in S) d[k] = S[k]; }); return clone(d); }
function cacheLocal() { lsSet(LSK("cache"), { state: stateData(), prof: PROF, pieces: S.pieces, log: S.log, items: S.items, library: S.library, rewards: S.rewards, redeemed: S.redeemed, remoteRecs: S.remoteRecs, teacherName: S.teacherName }); }
const isDirty = () => !!lsGet(LSK("dirty"));
/* rows as they should be in the database, keyed by id */
function computeRows() {
  const pieces = {}, days = {}, tasks = {}, reds = {};
  S.pieces.forEach(p => pieces[p.id] = { id: p.id, student_id: ME, library_id: p.libId || null, title: p.title, composer: p.composer || "", status: p.status, seconds: sec1(p.sec), sections: p.sections || [] });
  S.log.forEach(l => {
    const ps = {}; S.pieces.forEach(p => { if (p.days?.[l.date]) ps[p.id] = sec1(p.days[l.date]); });
    days[l.date] = { student_id: ME, day: l.date, seconds: sec1(l.sec), piece_seconds: ps, feel: l.feel || null, note: l.note || "" };
  });
  S.items.forEach(i => tasks[i.id] = { id: i.id, student_id: ME, week: i.week, area: i.area || "other", title: i.title, piece_id: i.pieceId || null, source: i.source === "teacher" ? "teacher" : "student", done_days: Object.keys(i.done || {}).filter(d => i.done[d]).sort() });
  S.redeemed.forEach(r => reds[r.id] = { id: r.id, student_id: ME, title: r.title, price: r.price });
  return { pieces, days, tasks, reds };
}
function queue(op) {
  const i = OUT.findIndex(o => o.k === op.k);
  if (i < 0) { OUT.push(op); return; }
  const prev = OUT[i];
  if (prev.a === "ins" && op.a === "del") { OUT.splice(i, 1); return; }          /* never reached the server */
  if (prev.a === "ins" && op.a === "upd") { prev.row = { ...prev.row, ...op.row }; return; }
  OUT[i] = op;
}
function diffAndQueue() {
  const R = computeRows(), P = SNAP || { pieces: {}, days: {}, tasks: {}, reds: {} }, J = JSON.stringify;
  for (const id in R.pieces) if (!P.pieces[id] || J(P.pieces[id]) !== J(R.pieces[id])) queue({ k: "pieces:" + id, t: "pieces", a: "ups", row: R.pieces[id] });
  for (const id in P.pieces) if (!R.pieces[id]) queue({ k: "pieces:" + id, t: "pieces", a: "del", eq: { id } });
  for (const d in R.days) if (!P.days[d] || J(P.days[d]) !== J(R.days[d])) queue({ k: "days:" + d, t: "practice_days", a: "ups", row: R.days[d], conflict: "student_id,day" });
  for (const id in R.tasks) {
    const r = R.tasks[id], p = P.tasks[id];
    if (!p) { if (r.source === "student") queue({ k: "tasks:" + id, t: "tasks", a: "ins", row: r }); }
    else if (J(p) !== J(r)) queue({ k: "tasks:" + id, t: "tasks", a: "upd", eq: { id }, row: r.source === "teacher" ? { done_days: r.done_days } : { title: r.title, area: r.area, piece_id: r.piece_id, done_days: r.done_days } });
  }
  for (const id in P.tasks) if (!R.tasks[id] && P.tasks[id].source === "student") queue({ k: "tasks:" + id, t: "tasks", a: "del", eq: { id } });
  for (const id in R.reds) if (!P.reds[id]) queue({ k: "reds:" + id, t: "redemptions", a: "ins", row: R.reds[id] });
  SNAP = R; saveOut();
}
function save() {
  if (!S || !ME) return;
  diffAndQueue(); GEN++; lsSet(LSK("dirty"), 1); cacheLocal(); scheduleFlush();
}
function scheduleFlush(ms = 1200) { clearTimeout(flushT); flushT = setTimeout(flush, ms); }
async function runOp(op) {
  if (op.a === "ups") return DB.ups(op.t, [op.row], op.conflict);
  if (op.a === "ins") { try { return await DB.ins(op.t, [op.row]); } catch (e) { if (String(e.code) === "23505" || /duplicate/i.test(e.message)) return; throw e; } }
  if (op.a === "upd") return DB.upd(op.t, op.eq, op.row);
  if (op.a === "del") return DB.del(op.t, { eq: op.eq });
  if (op.a === "prof") return DB.upd("profiles", { id: ME }, op.row);
  if (op.a === "rec") {
    const blob = MEM[op.row.id] || await idbGet(op.row.id); if (!blob) return;
    const row = { ...op.row }; if (row.piece_id && !S.pieces.some(p => p.id === row.piece_id)) row.piece_id = null;
    await DB.upload("recordings", row.path, blob, op.ctype);
    await DB.ups("recordings", [row]);
    const r = S.remoteRecs.find(x => x.id === row.id); if (r) { r.pending = false; cacheLocal(); if (tab === "me" && !A) refresh(); }
    return;
  }
  if (op.a === "recdel") { await DB.del("recordings", { eq: { id: op.id } }); try { await DB.rmFiles("recordings", [op.path]); } catch (e) { if (e.net) throw e; } return; }
}
async function pushState() {
  const rows = await DB.sel("student_state", { eq: { student_id: ME }, cols: "data" });
  const server = rows[0]?.data || {};
  if (mergeTeacher(S, server)) { cacheLocal(); if (!A && !OB) refreshTop(); }
  await DB.ups("student_state", [{ student_id: ME, data: stateData(), updated_at: new Date().toISOString() }], "student_id");
}
/* take the teacher-owned keys from the server; merge drills (teacher may add or delete) */
function mergeTeacher(target, server) {
  const before = JSON.stringify(TEACHER_KEYS.map(k => target[k])) + target.drills.length;
  TEACHER_KEYS.forEach(k => { if (k in server) target[k] = clone(server[k]); });
  const del = new Set([...(target.drillsDel || []), ...(server.drillsDel || [])]); target.drillsDel = [...del];
  const have = new Set(target.drills.map(d => d.id));
  (server.drills || []).forEach(d => { if (!have.has(d.id) && !del.has(d.id)) target.drills.push(clone(d)); });
  target.drills = target.drills.filter(d => !del.has(d.id));
  return before !== JSON.stringify(TEACHER_KEYS.map(k => target[k])) + target.drills.length;
}
async function flush() {
  if (!ME) return;
  if (flushing) { flushAgain = true; return; }
  flushing = true;
  try {
    while (OUT.length) {
      const op = OUT[0];
      try { await runOp(op); }
      catch (e) { if (e.net) { setNet(false); return; } console.warn("sync", op, e); toast(t("syncErr", { m: e.message })); }
      OUT.shift(); saveOut();
    }
    if (isDirty()) {
      const g = GEN;
      try { await pushState(); if (g === GEN) localStorage.removeItem(LSK("dirty")); }
      catch (e) { if (e.net) { setNet(false); return; } console.warn("state", e); toast(t("syncErr", { m: e.message })); }
    }
    setNet(true);
  } finally { flushing = false; if (flushAgain) { flushAgain = false; scheduleFlush(50); } }
}

/* ===== loading ===== */
function mapTask(x) { const done = {}; (x.done_days || []).forEach(d => done[d] = true); return { id: x.id, week: x.week, area: x.area, title: x.title, pieceId: x.piece_id, source: x.source === "student" ? "me" : "teacher", done }; }
function mapRec(r) { return { id: r.id, kind: r.kind, date: key(new Date(r.created_at)), dur: +r.seconds || 0, piece: r.piece_id, listened: r.listened, heart: r.heart, comment: r.comment, path: r.path, remote: true }; }
async function loadStudent() {
  const pr = await DB.sel("profiles", { eq: { id: ME } });
  if (pr[0]) PROF = pr[0];
  const tid = PROF.teacher_id, since = key(addDays(TODAY, -70)), wk0 = key(addDays(monday(TODAY), -7));
  const [st, pieces, days, tasks, lib, rew, reds, recs, tp] = await Promise.all([
    DB.sel("student_state", { eq: { student_id: ME } }),
    DB.sel("pieces", { eq: { student_id: ME }, order: ["created_at", true] }),
    DB.sel("practice_days", { eq: { student_id: ME }, gte: { day: since } }),
    DB.sel("tasks", { eq: { student_id: ME }, gte: { week: wk0 }, order: ["created_at", true] }),
    tid ? DB.sel("library", { eq: { teacher_id: tid }, order: ["title", true] }) : [],
    tid ? DB.sel("rewards", { eq: { teacher_id: tid }, order: ["price", true] }) : [],
    DB.sel("redemptions", { eq: { student_id: ME }, order: ["created_at", false], limit: 60 }),
    DB.sel("recordings", { eq: { student_id: ME }, order: ["created_at", false], limit: 60 }),
    tid ? DB.sel("profiles", { eq: { id: tid }, cols: "id,display_name" }) : []
  ]);
  const server = st[0]?.data || {};
  let base = Object.assign(defaultData(), clone(server));
  const cache = lsGet(LSK("cache"));
  if (isDirty() && cache?.state) { PERSIST.forEach(k => { if (!TEACHER_KEYS.includes(k) && k in cache.state) base[k] = cache.state[k]; }); mergeTeacher(base, server); }
  S = base;
  if (!S.onboarded && !S.profile.name) S.profile.name = PROF.display_name || "";
  S.profile.grade = PROF.grade; S.plan = PROF.plan;
  if (PROF.display_name) S.profile.name = PROF.display_name;
  S.pieces = pieces.map(p => ({ id: p.id, libId: p.library_id, title: p.title, composer: p.composer, status: p.status, sec: +p.seconds || 0, sections: p.sections || [], days: {} }));
  days.forEach(d => { for (const pid in d.piece_seconds || {}) { const p = S.pieces.find(x => x.id === pid); if (p) p.days[d.day] = +d.piece_seconds[pid] || 0; } });
  S.log = days.map(d => ({ date: d.day, sec: +d.seconds || 0, feel: d.feel, note: d.note || "" }));
  S.items = tasks.map(mapTask);
  S.library = lib; S.rewards = rew;
  S.redeemed = reds.map(r => ({ id: r.id, title: r.title, price: r.price, date: key(new Date(r.created_at)), given: r.given }));
  const pend = (cache?.remoteRecs || []).filter(r => r.pending && OUT.some(o => o.k === "rec:" + r.id));
  S.remoteRecs = [...pend, ...recs.map(mapRec)];
  S.teacherName = tp[0]?.display_name || "";
  prune();
  SNAP = computeRows(); cacheLocal();
}
function loadFromCache() {
  const c = lsGet(LSK("cache")); if (!c?.state) return false;
  S = Object.assign(defaultData(), c.state); PROF = c.prof || PROF;
  Object.assign(S, { pieces: c.pieces || [], log: c.log || [], items: c.items || [], library: c.library || [], rewards: c.rewards || [], redeemed: c.redeemed || [], remoteRecs: c.remoteRecs || [], teacherName: c.teacherName || "" });
  S.profile.grade = PROF.grade; S.plan = PROF.plan;
  SNAP = computeRows(); return true;
}
function prune() {
  const cut = key(addDays(TODAY, -60));
  for (const d in S.quest) if (d < cut) delete S.quest[d];
  S.drills.forEach(d => { for (const k in d.doneOn || {}) if (k < cut) delete d.doneOn[k]; for (const k in d.paidOn || {}) if (k < cut) delete d.paidOn[k]; });
  for (const k in S.taskPaid) if (k.slice(-10) < cut) delete S.taskPaid[k];
}
async function studentBoot(user, prof) {
  ME = user.id; MYEMAIL = user.email || ""; PROF = prof;
  OUT = lsGet(LSK("outbox")) || []; GEN = isDirty() ? 1 : 0;
  try {
    if (OUT.length) await flushOpsOnly();
    await loadStudent();
  } catch (e) {
    if (!loadFromCache()) throw e;
    setNet(!e.net ? true : false);
  }
  document.getElementById("app").hidden = false;
  refresh();
  if (!S.onboarded) { OB = { step: 0 }; onboarding(); }
  if (OUT.length || isDirty()) scheduleFlush(300);
  window.addEventListener("online", () => scheduleFlush(100));
  window.addEventListener("offline", () => setNet(false));
  document.addEventListener("visibilitychange", async () => {
    if (document.visibilityState === "hidden") { clearTimeout(flushT); flush(); return; }
    const oldTK = TK; setDates();
    if (A || OB || OUT.length || isDirty() || flushing) { if (oldTK !== TK) refresh(); return; }
    try { await loadStudent(); setNet(true); if (!A && !OB) refresh(); } catch (e) { if (e.net) setNet(false); }
  });
}
async function flushOpsOnly() { while (OUT.length) { try { await runOp(OUT[0]); } catch (e) { if (e.net) throw e; console.warn(e); } OUT.shift(); saveOut(); } }

/* ===== rewards (coin rules from the prototype) ===== */
const q = () => S.quest[TK] || (S.quest[TK] = {});
/* coins grow with effort: every bit of practice earns; the first one of each area today adds the quest bonus */
function award(kind, bonus, extra = 0) { const Q = q(); let n = extra; if (!Q[kind]) { Q[kind] = 1; n += bonus; } if (n > 0) { S.coins += n; toast(n === 1 ? t("coinGot") : t("coinsGot", { n })); } save(); checkStar(); return n; }
function earn(n) { if (n > 0) { S.coins += n; save(); toast(n === 1 ? t("coinGot") : t("coinsGot", { n })); } }
function checkStar() {
  const Q = q(), others = ORDER.filter(k => k !== "piece" && Q[k]).length;
  if (Q.piece && others >= 3 && !S.starDays[TK]) { S.starDays[TK] = 1; S.stars++; save(); setTimeout(() => { celebrate(); toast("+1 ★ " + t("starGot")); refreshTop(); }, 900); }
}
function celebrate() {
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) return; const c = document.createElement("div"); c.className = "confetti";
  const cols = ["var(--accent)", "var(--accent2)", "var(--gold)", "var(--good)", "var(--heart)"];
  for (let i = 0; i < 60; i++) { const e = document.createElement("i"); e.style.left = Math.random() * 100 + "%"; e.style.background = cols[i % 5]; e.style.animationDelay = Math.random() * .5 + "s"; c.appendChild(e); }
  document.body.appendChild(c); setTimeout(() => c.remove(), 2400);
}
function addSec(sec) { let l = S.log.find(x => x.date === TK); if (!l) { l = { date: TK, sec: 0, feel: null, note: "" }; S.log.push(l); } l.sec = (+l.sec || 0) + sec; }
const pieceToday = () => S.pieces.reduce((a, p) => a + (p.days?.[TK] || 0), 0);

/* ===== recordings & scores ===== */
let mr = null, recStart = 0, isRec = false; const MEM = {}, URLS = {}, RURL = {}; let dbP;
function idb() { return dbP ||= new Promise((res, rej) => { const r = indexedDB.open("misosofi-rec", 1); r.onupgradeneeded = () => r.result.createObjectStore("b"); r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error); }); }
async function idbPut(k, v) { try { const d = await idb(); await new Promise((res, rej) => { const tx = d.transaction("b", "readwrite"); tx.objectStore("b").put(v, k); tx.oncomplete = res; tx.onerror = () => rej(tx.error); }); } catch (e) { } }
async function idbGet(k) { try { const d = await idb(); return await new Promise((res, rej) => { const r = d.transaction("b").objectStore("b").get(k); r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error); }); } catch (e) { return null; } }
async function idbDel(k) { try { const d = await idb(); await new Promise(res => { const tx = d.transaction("b", "readwrite"); tx.objectStore("b").delete(k); tx.oncomplete = res; tx.onerror = res; }); } catch (e) { } }
function extOf(blob) {
  const m = { "audio/webm": "webm", "audio/mp4": "m4a", "audio/x-m4a": "m4a", "audio/aac": "aac", "audio/mpeg": "mp3", "audio/wav": "wav", "audio/x-wav": "wav", "audio/ogg": "ogg", "video/mp4": "mp4", "video/quicktime": "mov", "video/webm": "webm" };
  const ty = String(blob.type || "").split(";")[0]; if (m[ty]) return m[ty];
  const n = String(blob.name || ""); const e = n.includes(".") ? n.split(".").pop().toLowerCase().replace(/[^a-z0-9]/g, "") : ""; return e || "bin";
}
async function saveRec(blob, dur, pid, kind = "audio") {
  const id = uid(); MEM[id] = blob; await idbPut(id, blob);
  if (coach()) {
    const ext = extOf(blob), row = { id, student_id: ME, kind, path: `${ME}/${id}.${ext}`, seconds: sec1(dur), piece_id: pid || null };
    S.remoteRecs.unshift({ id, kind, date: TK, dur: Math.round(dur || 0), piece: pid || null, listened: false, heart: false, comment: "", path: row.path, remote: true, pending: true });
    queue({ k: "rec:" + id, t: "recordings", a: "rec", row, ctype: blob.type || (kind === "video" ? "video/mp4" : "audio/webm") }); saveOut();
  } else S.recs.unshift({ id, kind, date: TK, dur: Math.round(dur || 0), piece: pid || null });
  save();
  toast(kind === "video" ? t("videoSent") : coach() ? t("recSent") : t("recSaved")); refresh(); if (A) renderAct();
}
async function startRec(pid) {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true }); const chunks = []; mr = new MediaRecorder(stream); recStart = Date.now(); isRec = true;
    mr.ondataavailable = e => { if (e.data.size) chunks.push(e.data); };
    mr.onstop = () => { stream.getTracks().forEach(x => x.stop()); isRec = false; const type = (mr && mr.mimeType) || chunks[0]?.type || "audio/webm"; saveRec(new Blob(chunks, { type }), (Date.now() - recStart) / 1000, pid); mr = null; };
    mr.start(1000); if (A) renderAct();
  } catch (e) { isRec = false; toast(t("micBlocked")); if (A) renderAct(); }
}
function stopRec() { if (mr && mr.state !== "inactive") mr.stop(); }
async function signed(bucket, path, dl) { const k = bucket + "/" + path + "|" + (dl || ""), c = RURL[k]; if (c && c.exp > Date.now()) return c.u; const u = await DB.url(bucket, path, dl); RURL[k] = { u, exp: Date.now() + 50 * 60e3 }; return u; }
function hydrateMedia(root) {
  root.querySelectorAll("[data-rec]").forEach(async a => {
    const id = a.dataset.rec; if (URLS[id]) { a.src = URLS[id]; return; }
    const b = MEM[id] || await idbGet(id); if (b) { URLS[id] = URL.createObjectURL(b); a.src = URLS[id]; return; }
    const r = (S.remoteRecs || []).find(x => x.id === id);
    if (r && !r.pending) { try { a.src = await signed("recordings", r.path); } catch (e) { const m = document.createElement("div"); m.className = "muted small"; m.textContent = t("err_net"); a.replaceWith(m); } return; }
    const m = document.createElement("div"); m.className = "muted small"; m.textContent = t("onlyHere"); a.replaceWith(m);
  });
}
const allRecs = () => [...(S.remoteRecs || []), ...S.recs.map(r => ({ ...r, local: true }))].sort((a, b) => a.date < b.date ? 1 : a.date > b.date ? -1 : 0);
function recRow(r) {
  const p = S.pieces.find(x => x.id === r.piece), c = r.remote;
  return `<div class="row" style="align-items:flex-start"><div class="grow">
  <div style="display:flex;justify-content:space-between;gap:8px;align-items:center;flex-wrap:wrap"><div class="title">${r.kind === "video" ? ico("video") + " " : ""}${fmt(r.date, { weekday: "short", month: "short", day: "numeric" })} · ${fmtDur(r.dur)}</div>
  ${c ? `<span style="display:flex;align-items:center;gap:6px">${r.heart ? ico("heart", "ic-heart") : ""}<span class="pill ${r.pending ? "m" : r.listened ? "g" : "a"}">${r.pending ? t("recUploading") : r.listened ? t("listened") : t("sent")}</span></span>` : ""}</div>
  ${p ? `<div class="muted small">${esc(p.title)}</div>` : ""}
  ${r.kind === "video" ? `<video controls playsinline preload="metadata" data-rec="${r.id}"></video>` : `<audio controls preload="metadata" data-rec="${r.id}"></audio>`}
  ${c && r.comment ? `<div class="tcomment"><strong>${t("teacherSays")}:</strong> ${esc(r.comment)}</div>` : ""}
 </div><button class="x" data-act="delRec" data-id="${r.id}" aria-label="Delete">×</button></div>`;
}
const libOf = p => p && p.libId ? S.library.find(l => l.id === p.libId) : null;
const scoreName = l => (l.title.replace(/[^\w\- ]+/g, "").trim() || "score") + "." + (String(l.score_path).split(".").pop() || "pdf");
async function showScore(libId) {
  const l = S.library.find(x => x.id === libId); if (!l?.score_path) return;
  const back = A ? `<button class="btn soft sm" data-act="scoreBack">${I.back}</button>` : "";
  const head = `<div class="act-head">${back}<h2>${esc(l.title)}</h2><button class="icon-btn" data-act="${A ? "scoreBack" : "close"}" aria-label="Close">${I.close}</button></div>`;
  openSheet(`<div class="stack">${head}<div class="card empty">${t("loading")}</div></div>`, true);
  try {
    const u = await signed("scores", l.score_path), dl = DB.demo ? u : await signed("scores", l.score_path, scoreName(l));
    const isImg = /\.(png|jpe?g|gif|webp|heic)$/i.test(l.score_path);
    openSheet(`<div class="stack">${head}${isImg ? `<img class="scoreimg" src="${esc(u)}" alt="${esc(l.title)}">` : ""}
    <a class="btn" href="${esc(u)}" target="_blank" rel="noopener">${t("scoreOpen")}</a>
    <a class="btn soft" href="${esc(dl)}" download="${esc(scoreName(l))}">${t("dlScore")}</a><div class="muted small">${t("scoreOnly")}</div></div>`, true);
  } catch (e) { openSheet(`<div class="stack">${head}<div class="card empty">${t("dlNo")}</div></div>`, true); }
}

/* ===== top & views ===== */
function topBar() {
  return `<button class="ava-mini" data-act="tab" data-t="me" aria-label="${t("meH")}">${avatarSVG(S.avatar, { noCheeks: teen() })}</button>
 <div class="who"><div class="n">${esc((teen() ? t("hi_teen", { name: S.profile.name || "…" }) : t("hi", { name: S.profile.name || "…" })))}</div><div class="lv">${gradeName(S.profile.grade)}${coach() ? " · " + t("plan_coach") : ""}</div></div>
 <div class="counters"><span class="ctr" title="${t("statsStars")}"><span class="ic-star">${I.star}</span>${S.stars}</span><span class="ctr" title="${t("statsCoins")}"><span class="ic-coin">${I.coin}</span>${S.coins}</span>${coach() ? `<span class="ctr" title="${t("statsHearts")}"><span class="ic-heart">${I.heart}</span>${+S.hearts || 0}</span>` : ""}</div>
 <button class="icon-btn" data-act="settings" aria-label="${t("settings")}">${I.gear}</button>`;
}
function refreshTop() { document.getElementById("top").innerHTML = topBar(); }
const TABS = { home: "home", pieces: "note", goals: "flag", me: "user" };
function countdownCard(e) { const n = diffDays(TK, e.date); return `<div class="countdown"><div class="num">${n}</div><div class="grow"><div class="label">${n === 0 ? t("today_") : (n === 1 ? t("dayLeft") : t("daysLeft"))}</div><div class="title">${esc(e.title)}</div><div class="muted small">${fmt(e.date, { weekday: "short", month: "short", day: "numeric" })}${e.piece ? " · " + esc(e.piece) : ""}</div></div></div>`; }
function dueTag(date) { const n = diffDays(TK, date); if (n < 0) return `<span class="tag-due late">${t("overdue", { n: -n })}</span>`; if (n === 0) return `<span class="tag-due">${t("dueToday")}</span>`; return `<span class="tag-due">${t("dueIn", { n })}</span>`; }
function ring(done, total) { const r = 30, c = 2 * Math.PI * r, p = done / total; return `<svg class="ring" viewBox="0 0 74 74" role="img" aria-label="${done} of ${total}"><circle cx="37" cy="37" r="${r}" fill="none" stroke="var(--line)" stroke-width="8"/><circle cx="37" cy="37" r="${r}" fill="none" stroke="var(--good)" stroke-width="8" stroke-linecap="round" stroke-dasharray="${c * p} ${c}" transform="rotate(-90 37 37)"/><text x="37" y="43" text-anchor="middle" font-size="18">${done}/${total}</text></svg>`; }
const areaIc = a => `<span class="area" style="background:${(ACT[a] || ACT.other).col}" title="${t("a_" + a)}">${I[(ACT[a] || ACT.other).ic]}</span>`;
function vHome() {
  const Q = q(), done = ORDER.filter(k => Q[k]).length, starred = !!S.starDays[TK], pt = pieceToday();
  const ev = S.events.filter(e => e.date >= TK).sort((a, b) => a.date < b.date ? -1 : 1)[0];
  const rem = []; S.events.forEach(e => e.steps.forEach(s => { if (!s.done && diffDays(TK, s.date) <= 7) rem.push({ e, s }); })); rem.sort((a, b) => a.s.date < b.s.date ? -1 : 1);
  const items = S.items.filter(i => i.week === WK), tl = S.log.find(l => l.date === TK);
  const msg = starred ? t("m_star") : Q.piece ? t("m_greet2") : t("m_greet");
  return `${!teen() ? `<div class="section mascot">${mascotSVG()}<div class="bubble">${msg}</div></div>` : ""}
 ${!PROF.teacher_id ? `<div class="section"><div class="card muted small">${t("noTeacher")}</div></div>` : ""}
 ${ev ? `<div class="section">${countdownCard(ev)}</div>` : ""}
 <div class="section"><div class="card quest-head">${ring(done, 7)}<div class="grow"><h2>${t("questH")}</h2><div class="muted small">${starred ? ico("star", "ic-star") + " " + t("starGot") : t("questSub")}</div></div></div>
 <div class="tiles">${ORDER.map(k => { const a = ACT[k]; return `<button class="tile ${k === "piece" ? "hero" : ""} ${Q[k] ? "done" : ""}" data-act="open" data-k="${k}"><span class="ic" style="background:${a.col}">${I[a.ic]}</span><span><span class="nm">${t("a_" + k)}</span><br><span class="sub">${k === "piece" ? t("a_piece_s") : t("s_" + k)}</span>${k === "piece" && pt > 0 ? `<br><span class="today">${t("todayTime", { t: fmtDur(pt) })}</span>` : ""}</span><span class="rw price">${I.coin}${a.coins}</span><span class="tick">✓</span></button>`; }).join("")}</div></div>
 <div class="section"><div class="section-head"><h2>${t("weekH")}</h2><span class="muted small">${t("weekSub")}</span></div><div class="list">${items.length ? items.map(i => `<div class="row"><button class="chk ${i.done?.[TK] ? "on" : ""}" data-act="toggleItem" data-id="${i.id}" aria-label="${esc(i.title)}">✓</button>${areaIc(i.area || "other")}<div class="grow"><div class="title">${esc(i.title)}</div><div class="muted small">${i.pieceId && S.pieces.find(p => p.id === i.pieceId) ? `<strong>${esc(S.pieces.find(p => p.id === i.pieceId).title)}</strong> · ` : ""}${i.source === "teacher" ? t("fromTeacher") : t("mine")}</div></div>${i.source === "teacher" ? `<span class="lock" title="${t("fromTeacher")}">${I.lock}</span>` : `<button class="x" data-act="delItem" data-id="${i.id}" aria-label="Delete">×</button>`}</div>`).join("") : `<div class="empty">${t("weekEmpty")}</div>`}</div>
 <form class="add" data-form="own"><input id="ownT" placeholder="${t("ownPh")}" required maxlength="140"><button class="btn sm" type="submit">${t("addOwn")}</button></form></div>
 ${rem.length ? `<div class="section"><h2>${t("remindersH")}</h2><div class="list">${rem.map(({ e, s }) => `<div class="row"><button class="chk ${s.done ? "on" : ""}" data-act="toggleStep" data-e="${e.id}" data-s="${s.id}" aria-label="${esc(s.text)}">✓</button><div class="grow"><div class="title">${esc(s.text)}</div><div class="muted small">${esc(e.title)}</div></div>${dueTag(s.date)}</div>`).join("")}</div></div>` : ""}
 <div class="section"><div class="card stack"><h2>${t("howToday")}</h2><div class="chips">${["hard", "ok", "great"].map(f => `<button class="chip ${(feelPick ?? tl?.feel) === f ? "on" : ""}" data-act="feel" data-f="${f}">${t("feel_" + f)}</button>`).join("")}</div>
 <form class="add" data-form="log"><textarea id="logNote" placeholder="${t("notePh")}" maxlength="1000">${esc(tl?.note || "")}</textarea><button class="btn" type="submit">${t("save")}</button></form></div></div>`;
}
function vStudentLib() {
  const L = S.library; if (!L.length) return "";
  return `<div class="section"><div class="section-head"><h2>${t("libStudentH")}</h2><span class="muted small">${t("libStudentSub")}</span></div>
 <div class="list">${L.map(l => `<div class="row"><div class="grow"><div class="title">${esc(l.title)}</div><div class="muted small">${esc(l.composer || "—")} · ${gradeName(+l.grade || 0)}${l.label ? " · " + esc(l.label) : ""}</div></div>${l.score_path ? `<button class="btn sm soft" data-act="score" data-id="${l.id}">${t("score")}</button>` : `<span class="muted small">${t("noScore")}</span>`}</div>`).join("")}</div></div>`;
}
function vPieces() {
  return `<div class="section"><h2>${t("piecesH")}</h2>${S.pieces.length ? S.pieces.map(p => {
    const dn = p.sections.filter(s => s.done).length, tot = p.sections.length || 1;
    return `<div class="card stack"><div style="display:flex;justify-content:space-between;gap:8px"><div class="grow"><div class="title" style="font-size:1.05rem">${esc(p.title)}</div><div class="muted small">${esc(p.composer || "")}</div></div><button class="x" data-act="delPiece" data-id="${p.id}" aria-label="Delete">×</button></div>
 <div class="timebox"><div><span class="muted small">${t("todayPiece")}</span><b>${fmtDur(p.days?.[TK] || 0)}</b></div><div><span class="muted small">${t("totalPiece")}</span><b>${fmtDur(p.sec || 0)}</b></div></div>
 <div class="chips">${["learning", "polishing", "ready"].map(s => `<button class="chip ${p.status === s ? "on" : ""}" data-act="pstatus" data-id="${p.id}" data-s="${s}">${t("st_" + s)}</button>`).join("")}</div>
 <div class="bar"><i style="width:${Math.round(dn / tot * 100)}%"></i></div>
 <div class="list">${p.sections.map(s => `<div class="row"><button class="chk ${s.done ? "on" : ""}" data-act="psec" data-id="${p.id}" data-s="${s.id}" aria-label="${esc(s.name)}">✓</button><div class="grow">${esc(s.name)}</div></div>`).join("") || `<div class="empty">—</div>`}</div>
 <form class="add" data-form="sec" data-id="${p.id}"><input id="sec-${p.id}" placeholder="${t("sectionPh")}" required maxlength="80"><button class="btn sm soft" type="submit">${t("add")}</button></form>
 <div class="chips"><button class="btn" data-act="open" data-k="piece" data-p="${p.id}">${I.play} ${t("practise")}</button>${libOf(p)?.score_path ? `<button class="btn soft" data-act="score" data-id="${p.libId}">${t("score")}</button>` : ""}</div></div>`;
  }).join("") : `<div class="card empty">${t("noPieces")}</div>`}</div>
 <div class="section"><div class="card stack"><h2>${t("addPiece")}</h2><form class="add" data-form="piece"><input id="pTitle" placeholder="${t("piecePh")}" required maxlength="120" style="flex-basis:100%"><input id="pComp" placeholder="${t("composerPh")}" maxlength="80"><button class="btn" type="submit">${t("add")}</button></form></div></div>
 ${vStudentLib()}`;
}
function vGoals() {
  const goals = S.goals.filter(g => g.month === MK), evs = [...S.events].sort((a, b) => a.date < b.date ? -1 : 1);
  return `<div class="section"><div class="section-head"><h2>${t("monthGoalH")}</h2><span class="label">${fmt(TK, { month: "long" })}</span></div>
 <div class="list">${goals.length ? goals.map(g => `<div class="row"><button class="chk ${g.done ? "on" : ""}" data-act="toggleGoal" data-id="${g.id}" aria-label="${esc(g.text)}">✓</button><div class="grow"><div class="title">${esc(g.text)}</div></div><button class="x" data-act="delGoal" data-id="${g.id}" aria-label="Delete">×</button></div>`).join("") : `<div class="empty">${t("monthEmpty")}</div>`}</div>
 <form class="add" data-form="goal"><input id="goalText" placeholder="${t("goalPh")}" required maxlength="140"><button class="btn" type="submit">${t("add")}</button></form></div>
 <div class="section"><h2>${t("eventsH")}</h2>${evs.length ? evs.map(e => `<div class="card stack">${e.date >= TK ? countdownCard(e) : `<div class="title">${esc(e.title)}</div>`}
 <div class="list">${[...e.steps].sort((a, b) => a.date < b.date ? -1 : 1).map(s => `<div class="row"><button class="chk ${s.done ? "on" : ""}" data-act="toggleStep" data-e="${e.id}" data-s="${s.id}" aria-label="${esc(s.text)}">✓</button><div class="grow"><div class="title">${esc(s.text)}</div><div class="muted small">${fmt(s.date)}</div></div>${s.done ? "" : dueTag(s.date)}<button class="x" data-act="delStep" data-e="${e.id}" data-s="${s.id}" aria-label="Delete">×</button></div>`).join("") || `<div class="empty">—</div>`}</div>
 <form class="add" data-form="step" data-e="${e.id}"><input id="stT-${e.id}" placeholder="${t("stepPh")}" required maxlength="140"><input id="stD-${e.id}" type="date" required><button class="btn sm" type="submit">${t("addStep")}</button></form>
 <button class="btn sm ghost" data-act="delEvent" data-id="${e.id}" style="align-self:flex-start">${t("del")}</button></div>`).join("") : `<div class="card empty">${t("noEvents")}</div>`}
 <div class="card stack"><h2>${t("addEvent")}</h2><form class="add" data-form="event"><input id="evT" placeholder="${t("eventPh")}" required maxlength="120" style="flex-basis:100%"><input id="evP" placeholder="${t("piecePh")}" maxlength="120"><input id="evD" type="date" required><button class="btn" type="submit">${t("add")}</button></form></div></div>`;
}
function shopSection() {
  const tabs = `<div class="chips">${["avatar", "cards", "rewards"].map(k => `<button class="chip ${shopTab === k ? "on" : ""}" data-act="shopTab" data-v="${k}">${t("sh_" + k)}</button>`).join("")}</div>`;
  let body = "";
  if (shopTab === "avatar") body = `<div class="shop">${ACCS.map(a => { const own = S.owned.includes(a.id), on = S.avatar.acc === a.id; return `<button class="${on ? "on" : ""}" data-act="shop" data-id="${a.id}"><span class="face">${avatarSVG({ ...S.avatar, acc: a.id }, { noCheeks: teen() })}</span><span>${a.id === "none" ? "—" : a.id}</span>${own ? `<span class="muted">${on ? "✓" : t("wear")}</span>` : `<span class="price">${I.coin}${a.price}</span>`}</button>`; }).join("")}</div>`;
  if (shopTab === "cards") body = `<div class="muted small">${t("cardsSub")} ${S.cards.length}/${CARDS.length}</div><div class="cards">${CARDS.map(c => {
    const own = S.cards.includes(c.id); const ini = c.n.split(/[ .]+/).filter(Boolean).map(w => w[0]).slice(-2).join("");
    return own ? `<div class="ccard pop" style="background:${c.c}"><span class="init">${ini}</span><span class="nm">${c.n}</span><span class="yr">${c.y}</span><span class="fact">${c.f}</span></div>` : `<button class="ccard locked" data-act="card" data-id="${c.id}"><span class="init">?</span><span class="nm">${c.n}</span><span class="price">${I.coin}${c.p}</span></button>`;
  }).join("")}</div>`;
  if (shopTab === "rewards") {
    const mine = S.redeemed.filter(r => !r.given); body = `<div class="muted small">${t("rewardsSub")}</div><div class="list">${S.rewards.length ? S.rewards.map(r => `<div class="row"><div class="grow"><div class="title">${esc(r.title)}</div><span class="price">${I.coin}${r.price}</span></div><button class="btn sm" data-act="redeem" data-id="${r.id}">${t("redeem")}</button></div>`).join("") : `<div class="empty">${t("noRewards")}</div>`}</div>
  ${mine.length ? `<div class="list">${mine.map(r => `<div class="row"><div class="grow"><div class="title">${esc(r.title)}</div><div class="muted small">${fmt(r.date)}</div></div><span class="pill y">${t("waiting")}</span></div>`).join("")}</div>` : ""}`;
  }
  return `<div class="section"><h2>${t("shopH")}</h2>${tabs}${body}</div>`;
}
function vMe() {
  const start = monday(addDays(TODAY, -21)), cells = [...Array(28)].map((_, i) => key(addDays(start, i)));
  const byDay = {}; S.log.forEach(l => byDay[l.date] = (byDay[l.date] || 0) + (+l.sec || 0)); const lv = s => !s ? "" : s < 600 ? "l1" : s < 1500 ? "l2" : "l3"; const inR = S.log.filter(l => l.date >= cells[0] && l.date <= TK);
  const recs = allRecs();
  return `<div class="section" style="text-align:center;align-items:center"><div class="ava-big pop">${avatarSVG(S.avatar, { noCheeks: teen() })}</div><h2>${esc(S.profile.name)}</h2><button class="btn sm ghost" data-act="avatar">${t("editAvatar")}</button></div>
 <div class="stats" style="${coach() ? "" : "grid-template-columns:1fr 1fr"}"><div class="card"><div class="v"><span class="ico ic-star">${I.star}</span>${S.stars}</div><div class="k">${t("statsStars")}</div></div><div class="card"><div class="v"><span class="ico ic-coin">${I.coin}</span>${S.coins}</div><div class="k">${t("statsCoins")}</div></div>${coach() ? `<div class="card"><div class="v"><span class="ico ic-heart">${I.heart}</span>${+S.hearts || 0}</div><div class="k">${t("statsHearts")}</div></div>` : ""}</div>
 ${shopSection()}
 <div class="section"><h2>${t("last4")}</h2><div class="card stack"><div class="heat">${t("wd").map(w => `<div class="label" style="text-align:center">${w}</div>`).join("")}${cells.map(d => `<div class="c ${lv(byDay[d])} ${d === TK ? "t" : ""}">${d > TK || !byDay[d] ? "" : Math.max(1, Math.round(byDay[d] / 60))}</div>`).join("")}</div>
 <div class="muted small">${fmtDur(inR.reduce((a, l) => a + (+l.sec || 0), 0))} ${t("totalTime")} · ${new Set(inR.filter(l => +l.sec > 0).map(l => l.date)).size} ${t("daysPracticed")} · ${t("noStreak")}</div></div></div>
 <div class="section"><h2>${coach() ? t("recsH") : t("myRecs")}</h2><div class="list">${recs.length ? recs.map(recRow).join("") : `<div class="empty">${t("recsEmpty")}</div>`}</div></div>`;
}

/* ===== activities ===== */
function openSheet(html, full) { const sh = document.getElementById("sheet"); sh.classList.toggle("full", !!full); const p = document.getElementById("panel"); p.innerHTML = html; sh.hidden = false; if (S) hydrateMedia(p); }
function closeSheet() { stopMetro(); if (A?.run?.timer) clearInterval(A.run.timer); if (A && A.start) savePieceTime(); if (A && A.timer) clearInterval(A.timer); if (isRec) stopRec(); A = null; document.getElementById("sheet").hidden = true; refresh(); }
function actHead(k) { return `<div class="act-head"><span class="ic" style="background:${ACT[k].col}">${I[ACT[k].ic]}</span><h2>${t("a_" + k)}</h2>${q()[k] ? `<span class="pill g">✓</span>` : `<span class="price">${I.coin}${ACT[k].coins}</span>`}<button class="icon-btn" data-act="close" aria-label="Close">${I.close}</button></div>`; }
function openAct(k, opt = {}) { A = { k, ...opt }; renderAct(); if (k === "ear") setTimeout(() => A && A.qs && tone(A.qs[0].midi), 300); }
function renderAct() { if (!A) return; const k = A.k; const b = k === "piece" ? actPiece() : k === "sight" ? actSight() : k === "nr" ? actNR() : k === "tech" ? actTech() : k === "theory" ? actTheory() : actQuiz(); openSheet(actHead(k) + b, true); }
/* piece practice: exact seconds */
const elapsed = () => A && A.start ? (Date.now() - A.start) / 1000 : 0;
function actPiece() {
  if (!S.pieces.length) return `<div class="card empty">${t("noPieces")}</div>`;
  if (!A.pid || !S.pieces.find(p => p.id === A.pid)) A.pid = S.pieces[0].id; A.goal ??= 10; const p = S.pieces.find(x => x.id === A.pid), el = elapsed();
  const c = coach();
  return `<div class="stack"><div class="label">${t("choosePiece")}</div>
 <div class="chips">${S.pieces.map(x => `<button class="chip ${x.id === A.pid ? "on" : ""}" data-act="ppick" data-id="${x.id}" ${A.start ? "disabled" : ""}>${esc(x.title)}</button>`).join("")}</div>
 <div class="chips">${[5, 10, 15, 0].map(m => `<button class="chip ${A.goal === m ? "on" : ""}" data-act="pgoal" data-m="${m}" ${A.start ? "disabled" : ""}>${m ? t("minutes", { n: m }) : t("free")}</button>`).join("")}</div>
 <div class="card stack" style="align-items:center"><div class="bigclock" id="clock">${clockOf(A.goal ? A.goal * 60 - el : el)}</div>
 ${isRec ? `<span class="live">${t("recording")}</span>` : ""}<div class="muted small" id="keepMsg">${A.start ? (A.goal && el >= A.goal * 60 ? t("goalReached") : t("keep")) : ""}</div>
 <div class="timebox"><div><span class="muted small">${t("todayPiece")}</span><b id="tToday">${fmtDur((p.days?.[TK] || 0) + el)}</b></div><div><span class="muted small">${t("totalPiece")}</span><b id="tTotal">${fmtDur((p.sec || 0) + el)}</b></div></div>
 <button class="btn block" data-act="${A.start ? "pstop" : "pstart"}">${A.start ? t("stop") : I.play + " " + t("start")}</button>
 <label class="toggle" style="border:0;padding:0;width:100%"><span><strong>${c ? t("recTeacher") : t("recSelf")}</strong><br><span class="muted small">${c ? t("recTeacherInfo") : t("recSelfInfo")}</span></span><input type="checkbox" id="recOn" ${S.recOn ? "checked" : ""} ${A.start ? "disabled" : ""}></label>
 <div class="chips"><span class="btn sm soft filebtn">${t("attach")}<input type="file" id="recFile" accept="audio/*"></span>${c ? `<span class="btn sm soft filebtn">${I.video} ${t("video")}<input type="file" id="vidFile" accept="video/*"></span>` : ""}</div></div>
 ${(() => { const its = S.items.filter(i => i.week === WK && i.pieceId === p.id); return its.length ? `<h2>${t("teacherForPiece")}</h2><div class="list">${its.map(i => `<div class="row"><button class="chk ${i.done?.[TK] ? "on" : ""}" data-act="toggleItem" data-id="${i.id}" aria-label="${esc(i.title)}">✓</button><div class="grow"><div class="title">${esc(i.title)}</div></div></div>`).join("")}</div>` : ""; })()}
 ${libOf(p)?.score_path ? `<button class="btn soft" data-act="score" data-id="${p.libId}">${t("score")}</button>` : ""}
 <h2>${t("sectionsH")}</h2><div class="list">${p.sections.map(s => `<div class="row"><button class="chk ${s.done ? "on" : ""}" data-act="psec" data-id="${p.id}" data-s="${s.id}" aria-label="${esc(s.name)}">✓</button><div class="grow">${esc(s.name)}</div></div>`).join("") || `<div class="empty">—</div>`}</div></div>`;
}
function tickPiece() {
  if (!A || !A.start) return; const el = elapsed(), p = S.pieces.find(x => x.id === A.pid), $ = id => document.getElementById(id);
  if ($("clock")) $("clock").textContent = clockOf(A.goal ? A.goal * 60 - el : el);
  if ($("tToday")) $("tToday").textContent = fmtDur((p.days?.[TK] || 0) + el); if ($("tTotal")) $("tTotal").textContent = fmtDur((p.sec || 0) + el);
  if (A.goal && !A.goalHit && el >= A.goal * 60) { A.goalHit = 1; ding(true); celebrate(); if ($("keepMsg")) $("keepMsg").textContent = t("goalReached"); }
}
function savePieceTime() {
  const el = elapsed(); clearInterval(A.timer); A.start = null; stopRec(); if (el < 1) return;
  const p = S.pieces.find(x => x.id === A.pid); if (!p) return; p.sec = (p.sec || 0) + el; p.days = p.days || {}; p.days[TK] = (p.days[TK] || 0) + el; addSec(el); save();
  const pt = pieceToday(), Q = q(), mins = Math.floor(pt / 60), extra = Math.max(0, mins - (Q.piecePaid || 0)); Q.piecePaid = mins;
  if (pt >= 300 && !Q.piece) award("piece", ACT.piece.coins, extra); else if (extra) earn(extra); else { save(); toast(t("saved") + " · " + fmtDur(el)); }
  if (pt >= 600 && !Q.piece10) { Q.piece10 = 1; S.coins += 5; save(); setTimeout(() => toast(t("bonus10")), 1500); }
}
/* sight-reading */
function actSight() {
  const g = gG(); A.nb ??= 2; if (!A.ex) A.ex = genSight(g, g === 0 ? 2 : A.nb);
  const E = A.ex, w = Math.min(540, Math.max(320, window.innerWidth - 56));
  const hands = E.mode === "single" ? (E.single === "bass" ? t("sightLH") : t("sightRH")) : E.mode === "pass" ? t("sightPass") : t("sightTog");
  return `<div class="stack"><h2>${t("sightH")}</h2><div class="muted small">${t("sightHow")}</div>
 <div class="chips"><span class="pill a">${gradeName(S.profile.grade)}</span><span class="pill m">${keyName(E.key)}</span><span class="pill m">${E.ts}</span><span class="pill y">${hands}</span></div>
 <div class="staffbox stack" style="gap:4px">${sightLines(E, w)}</div>
 ${g > 0 ? `<div class="chips">${[2, 4].map(n => `<button class="chip ${A.nb === n ? "on" : ""}" data-act="sightBars" data-n="${n}">${t("bars", { n })}</button>`).join("")}</div>` : ""}
 ${A.rated ? `<div class="card" style="text-align:center;font-weight:800">${t("sightSaved")}</div><div class="opts"><button class="btn" data-act="sightHear">${I.play} ${t("hearIt")}</button><button class="btn soft" data-act="sightNew">${t("newOne")}</button></div>`
      : `<div class="opts" style="grid-template-columns:1fr 1fr 1fr">${["smooth", "some", "hard"].map(r => `<button class="opt" data-act="sightRate" data-r="${r}">${t("r_" + r)}</button>`).join("")}</div>`}</div>`;
}
function splitBars(notes, L) { const out = []; let cur = [], pos = 0; notes.forEach(n => { cur.push(n); pos += n.dur; if (Math.abs(pos - L) < 1e-6) { out.push(cur); cur = []; pos = 0; } }); if (cur.length) out.push(cur); return out; }
function sightLines(E, w) {
  const L = TSS[E.ts].len, R = splitBars(E.rh, L), Lh = splitBars(E.lh, L), nb = Math.max(R.length, Lh.length);
  if (nb <= 2) return grand({ keyAcc: E.keyAcc, ts: E.ts, rh: E.rh, lh: E.lh, width: w, single: E.single });
  let html = ""; for (let i = 0; i < nb; i += 2) html += grand({ keyAcc: E.keyAcc, ts: E.ts, rh: R.slice(i, i + 2).flat(), lh: Lh.slice(i, i + 2).flat(), width: w, single: E.single, noTime: i > 0 }); return html;
}
function playSight() { const E = A.ex, spb = .6;[E.rh, E.lh].forEach(v => { let pos = 0; v.forEach(n => { if (!n.rest) { tone(midiOf(n.d, n.alt), pos * spb, Math.max(.35, n.dur * spb), .26); (n.chord || []).forEach(c => tone(midiOf(c, keyAlt(m7(c), E.keyAcc)), pos * spb, n.dur * spb, .2)); } pos += n.dur; }); }); }
/* Note Catcher: our own note-reading game (tap mode) */
const NC_LEVELS = [
  { id: "t1", name: "Treble: Middle C to G", clef: "treble", lo: dia(0, 4), hi: dia(4, 4) },
  { id: "b1", name: "Bass: F to Middle C", clef: "bass", lo: dia(3, 3), hi: dia(0, 4) },
  { id: "t2", name: "Treble: Middle C to C", clef: "treble", lo: dia(0, 4), hi: dia(0, 5) },
  { id: "b2", name: "Bass: C to C", clef: "bass", lo: dia(0, 3), hi: dia(0, 4) },
  { id: "g1", name: "Both clefs: C to C", clef: "both", lo: dia(0, 3), hi: dia(0, 5) },
  { id: "t3", name: "Treble: the whole staff", clef: "treble", lo: dia(2, 4), hi: dia(3, 5) },
  { id: "b3", name: "Bass: the whole staff", clef: "bass", lo: dia(4, 2), hi: dia(5, 3) },
  { id: "l1", name: "Ledger lines", clef: "both", lo: dia(2, 2), hi: dia(2, 6), ledger: true },
  { id: "x1", name: "Sharps and flats", clef: "both", lo: dia(0, 3), hi: dia(0, 5), acc: true }];
const NC_N = 15;
function ncNote(L, prev) {
  let d, tries = 0; do {
    d = L.lo + rnd(L.hi - L.lo + 1);
    if (L.ledger && Math.random() < .7) { const pool = [dia(2, 2), dia(3, 2), dia(4, 2), dia(5, 2), dia(0, 4), dia(1, 4), dia(5, 5), dia(6, 5), dia(0, 6), dia(1, 6), dia(2, 6)]; d = pick(pool); } tries++;
  } while (prev && d === prev.d && tries < 10);
  const clef = L.clef === "both" ? (d >= dia(0, 4) ? (d === dia(0, 4) && Math.random() < .5 ? "bass" : "treble") : "bass") : L.clef;
  let alt = 0; if (L.acc && Math.random() < .6) alt = pick([1, -1]);
  return { d, alt, clef, pc: ((SEMI[m7(d)] + alt) % 12 + 12) % 12 };
}
function ncKeyboard() {
  const WH = [0, 2, 4, 5, 7, 9, 11], names = S.abc ? LET : SOL; let w = "", b = "";
  for (let o = 0; o < 2; o++)WH.forEach((pc, i) => { w += `<button class="wk" data-act="ncKey" data-pc="${pc}" data-o="${o}" aria-label="${LET[i]}">${S.ncNames ? names[i] : ""}</button>`; });
  const BL = [[0, 1], [1, 3], [3, 6], [4, 8], [5, 10]];
  for (let o = 0; o < 2; o++)BL.forEach(([wi, pc]) => { const idx = o * 7 + wi; b += `<button class="bk" data-act="ncKey" data-pc="${pc}" data-o="${o}" style="left:calc(${(idx + 1) * 100 / 14}% - ${100 / 14 * .3}%);width:${100 / 14 * .6}%" aria-label="black key"></button>`; });
  return `<div class="kbwrap"><div class="kb">${w}${b}</div></div>`;
}
function actNR() {
  if (!A.run) {
    const best = S.ncBest || {}; A.lvl ??= S.ncLvl || NC_LEVELS[0].id;
    return `<div class="stack"><div class="muted small">${t("ncHow")}</div><div class="label">${t("ncLevels")}</div>
  <div class="lvls">${NC_LEVELS.map(L => `<button class="lvl ${A.lvl === L.id ? "on" : ""}" data-act="ncLvl" data-id="${L.id}"><span class="title">${L.name}</span>${best[L.id] ? `<span class="small muted">${t("ncBest")} ${miniStars(best[L.id].stars)}</span>` : ""}</button>`).join("")}</div>
  <label class="toggle" style="border:0;padding:0"><strong>${t("ncNames")}</strong><input type="checkbox" id="ncNames" ${S.ncNames ? "checked" : ""}></label>
  <button class="btn block" data-act="ncStart">${I.play} ${t("ncStart")}</button><div class="muted small">${t("ncMic")}</div></div>`;
  }
  const R = A.run;
  if (R.i >= NC_N) {
    const c = R.ok, secs = (R.end - R.t0) / 1000, avg = secs / NC_N;
    return `<div class="result pop"><div class="stars5">${[1, 2, 3, 4, 5].map(i => `<span style="width:44px;height:44px;color:${i <= R.stars ? "var(--gold)" : "var(--line)"}">${I.star}</span>`).join("")}</div>
  <h2>${t("ncResult", { c, n: NC_N, t: fmtDur(secs) })}</h2><div class="muted">${t("ncAvg", { s: avg.toFixed(1) })}${R.newBest ? " · " + t("ncNew") : ""}</div>
  <div class="opts" style="width:100%"><button class="btn soft" data-act="ncAgain">${t("ncAgain")}</button><button class="btn" data-act="ncMenu">${t("ncLevels")}</button></div></div>`;
  }
  const N = R.cur, L = NC_LEVELS.find(x => x.id === R.lvl); const nt = { d: N.d, dur: 4 }; if (N.alt) nt.sym = N.alt > 0 ? "♯" : "♭";
  return `<div class="stack"><div class="nc-top"><span class="pill a">${L.name}</span><span class="nc-timer" id="ncT">${clockOf((Date.now() - R.t0) / 1000)}</span></div>
 <div class="qprog">${Array.from({ length: NC_N }, (_, i) => `<span class="${i < R.i ? (R.res[i] ? "ok" : "no") : i === R.i ? "cur" : ""}"></span>`).join("")}</div>
 <div class="staffbox">${staff({ clef: N.clef, notes: [nt], width: 200 })}</div>${ncKeyboard()}</div>`;
}
function ncFinish() {
  const R = A.run; R.end = Date.now(); clearInterval(R.timer); const acc = R.ok / NC_N, avg = (R.end - R.t0) / 1000 / NC_N;
  R.stars = acc >= .95 && avg <= 2 ? 5 : acc >= .9 && avg <= 3 ? 4 : acc >= .8 ? 3 : acc >= .6 ? 2 : 1;
  const best = S.ncBest[R.lvl]; if (!best || R.stars > best.stars || (R.stars === best.stars && avg < best.avg)) { S.ncBest[R.lvl] = { stars: R.stars, avg }; R.newBest = !!best; }
  S.nr.sessions.push({ id: uid(), date: TK, level: NC_LEVELS.find(x => x.id === R.lvl).name, stars: R.stars }); if (S.nr.sessions.length > 100) S.nr.sessions = S.nr.sessions.slice(-100); save();
  award("nr", ACT.nr.coins, R.ok + R.stars); if (R.stars === 5) celebrate();
}
const miniStars = n => `<span class="ministars">${[1, 2, 3, 4, 5].map(i => `<span class="${i <= n ? "" : "off"}">${I.star}</span>`).join("")}</span>`;
/* technique */
let MET = { on: false, bpm: 72, int: null, beat: 0 };
function startMetro() { stopMetro(); MET.on = true; MET.beat = 0; const f = () => { click(MET.beat % 4 === 0); document.querySelectorAll(".beat").forEach((b, i) => b.classList.toggle("on", i === MET.beat % 4)); MET.beat++; }; f(); MET.int = setInterval(f, 60000 / MET.bpm); }
function stopMetro() { clearInterval(MET.int); MET.on = false; }
function actTech() {
  return `<div class="stack"><div class="card stack" style="align-items:center"><div class="label">${t("metronome")}</div>
 <div class="metro"><button class="btn soft sm" data-act="bpm" data-d="-4" aria-label="Slower">−</button><span class="bpm" id="bpm">${MET.bpm}</span><button class="btn soft sm" data-act="bpm" data-d="4" aria-label="Faster">+</button></div>
 <div style="display:flex;gap:8px">${[0, 1, 2, 3].map(() => `<span class="beat"></span>`).join("")}</div>
 <button class="btn" data-act="metro">${MET.on ? t("mStop") : I.play + " " + t("mStart")}</button></div>
 <h2>${t("techH")}</h2><div class="muted small">${t("techHow")}</div>
 <div class="list">${S.drills.map(d => `<div class="row"><button class="chk ${d.doneOn?.[TK] ? "on" : ""}" data-act="drill" data-id="${esc(d.id)}" aria-label="${esc(d.name)}">✓</button>
 <div class="grow"><div class="title">${esc(d.name)}</div><div class="muted small">${t("targetBpm")} ♩=${+d.target || "—"} · ${t("bestBpm")} ♩=${+d.best || "—"}</div></div>
 <button class="btn sm soft setbest" data-act="setBest" data-id="${esc(d.id)}">♩=${MET.bpm}</button><button class="x" data-act="delDrill" data-id="${esc(d.id)}" aria-label="Delete">×</button></div>`).join("") || `<div class="empty">—</div>`}</div>
 <form class="add" data-form="drill"><input id="drillName" placeholder="${t("drillPh")}" required maxlength="100"><button class="btn sm" type="submit">${t("addDrill")}</button></form></div>`;
}
/* question banks */
function noteLabel(i) { return S.abc ? LET[i] + " (" + SOL[i] + ")" : SOL[i]; }
function theoryQ(type) {
  const g = Math.max(1, gG()); const maj = THEORY_MAJ[g], min = THEORY_MIN[g];
  if (type === "name") {
    const clef = Math.random() < .5 ? "treble" : "bass", base = clef === "treble" ? 30 : 18, span = g <= 1 ? 11 : g <= 2 ? 15 : 17, d = base - (g <= 1 ? 2 : 4) + rnd(span), i = ((d % 7) + 7) % 7;
    return { p: t("q_name"), vis: staff({ clef, notes: [{ d, dur: 4 }], width: 200 }), opts: withAns(noteLabel(i), LET.map((_, k) => noteLabel(k))), ans: noteLabel(i), midi: midiOf(d) };
  }
  if (type === "key") { const k = pick(maj.filter(x => x !== "C")), ans = keyName(k); return { p: t("q_key"), vis: staff({ keyAcc: KEYS[k].a, width: 200 }), opts: withAns(ans, maj.map(keyName)), ans }; }
  if (type === "keyMin") { const k = pick(min.filter(x => x !== "a")), ans = keyName(k); return { p: t("q_keyMin"), vis: staff({ keyAcc: KEYS[k].a, width: 200 }), opts: withAns(ans, min.map(keyName)), ans }; }
  if (type === "int") {
    const nm = ["", "2nd", "3rd", "4th", "5th", "6th", "7th", "Octave"], ton = pick([0, 4, 3]), g1 = 1 + rnd(7), K = KEYS[LET[ton]]; const d1 = dia(ton, 4), d2 = d1 + g1;
    const n1 = { d: d1, dur: 4 }, n2 = { d: d2, dur: 4 }; const a1 = keyAlt(ton, K.a), a2 = keyAlt(((d2 % 7) + 7) % 7, K.a); if (a1) n1.sym = ACCSYM[a1]; if (a2) n2.sym = ACCSYM[a2];
    return { p: t("q_int"), vis: staff({ notes: [n1, n2], width: 220 }), opts: withAns(nm[g1], nm.slice(1)), ans: nm[g1], midis: [midiOf(d1, a1), midiOf(d2, a2)] };
  }
  if (type === "intQ") {
    const names = { 1: "Minor 2nd", 2: "Major 2nd", 3: "Minor 3rd", 4: "Major 3rd", 5: "Perfect 4th", 6: "Augmented 4th", 7: "Perfect 5th", 8: "Minor 6th", 9: "Major 6th", 10: "Minor 7th", 11: "Major 7th", 12: "Perfect octave" };
    let d1, d2, semis; if (g <= 3) { d1 = dia(0, 4); d2 = d1 + 1 + rnd(7); } else { d1 = dia(rnd(7), 4); d2 = d1 + 1 + rnd(7); } semis = midiOf(d2) - midiOf(d1); const ans = names[semis];
    return { p: t("q_intQ"), vis: staff({ notes: [{ d: d1, dur: 4 }, { d: d2, dur: 4 }], width: 220 }), opts: withAns(ans, Object.values(names)), ans, midis: [midiOf(d1), midiOf(d2)] };
  }
  if (type === "beats") { const all = [{ dur: 4, v: "4" }, { dur: 2, v: "2" }, { dur: 1, v: "1" }, { dur: 3, v: "3" }], c = pick(all); return { p: t("q_beats"), vis: staff({ notes: [{ d: 35, dur: c.dur }], width: 150 }), opts: withAns(c.v, ["4", "3", "2", "1", "½"]), ans: c.v }; }
  if (type === "ts") {
    const pool = [["2/4", 2, "u_crotchet"], ["3/4", 3, "u_crotchet"], ["4/4", 4, "u_crotchet"]]; if (g >= 2) pool.push(["2/2", 2, "u_minim"], ["3/2", 3, "u_minim"]); if (g >= 3) pool.push(["6/8", 2, "u_dcrot"], ["9/8", 3, "u_dcrot"], ["12/8", 4, "u_dcrot"]);
    const c = pick(pool); return { p: t("q_ts", { unit: t(c[2]), ts: c[0] }), opts: withAns(String(c[1]), ["1", "2", "3", "4", "6"]), ans: String(c[1]) };
  }
  if (type === "count") { const k = pick(maj.filter(x => x !== "C")), n = Math.abs(KEYS[k].a); return { p: t("q_count", { acc: KEYS[k].a > 0 ? t("sharps") : t("flats"), key: keyName(k) }), opts: withAns(String(n), ["1", "2", "3", "4", "5", "6"]), ans: String(n) }; }
  if (type === "term") { const pool = TERMS.slice(0, Math.min(g, 5)).flat(), c = pick(pool); return { p: t("q_term", { w: c[0] }), opts: withAns(c[1], pool.map(x => x[1])), ans: c[1] }; }
  if (type === "tech") { const i = rnd(7); return { p: t("q_tech", { n: i + 1 }), opts: withAns(TECHN[i], TECHN), ans: TECHN[i] }; }
  if (type === "cad") { const c = pick([["V", "I", "Perfect"], ["IV", "I", "Plagal"], ["I", "V", "Imperfect"], ["II", "V", "Imperfect"]]); return { p: t("q_cad", { a: c[0], b: c[1] }), opts: shuffle(["Perfect", "Plagal", "Imperfect"]), ans: c[2] }; }
}
function theoryTypes() { const g = Math.max(1, gG()); const ty = ["name", "beats", "ts", "key", "int", "term", "count"]; if (g >= 2) ty.push("keyMin"); if (g >= 3) { ty.splice(ty.indexOf("int"), 1, "intQ"); ty.splice(ty.indexOf("beats"), 1); } if (g >= 4) ty.push("tech"); if (g >= 5) ty.push("cad"); return ty; }
const TOPICS = ["", "C G D F major · treble & bass clef · 2/4 3/4 4/4 · intervals by number · basic terms", "+ A B♭ E♭ major · A E D minor · 2/2 3/2", "+ E A♭ major · more minor keys · 6/8 9/8 12/8 · intervals by type", "+ B D♭ major · technical names of notes · any interval", "+ F♯ G♭ major · cadences · all keys up to 6 sharps/flats"];
const vwOf = id => S.vw[id] || (S.vw[id] = { w: {}, p: {} });
function actTheory() {
  const g = Math.max(1, gG());
  if (A.more) return actQuiz();
  if (!A.daily) { const ty = theoryTypes(); A.daily = theoryQ(ty[DAYNO % ty.length]); }
  const Q = A.daily, vids = S.videos || [];
  return `<div class="stack"><div class="card stack"><div class="section-head"><h2>${t("theoryQ")}</h2><span class="pill a">${gradeName(S.profile.grade)}</span></div>
 <h3 style="font-size:1.05rem">${esc(Q.p)}</h3>${Q.vis ? `<div class="staffbox">${Q.vis}</div>` : ""}
 <div class="opts">${Q.opts.map(o => `<button class="opt ${A.picked != null ? (o === Q.ans ? "right" : o === A.picked ? "wrong" : "") : ""}" data-act="dAns" data-o="${esc(o)}" ${A.picked != null ? "disabled" : ""}>${esc(o)}</button>`).join("")}</div>
 ${A.picked != null ? `<div style="text-align:center;font-weight:800;color:${A.picked === Q.ans ? "var(--good)" : "var(--bad)"}">${A.picked === Q.ans ? t("correct") : t("notQuite", { a: esc(Q.ans) })}</div><button class="btn soft" data-act="theoryMore">${t("more")}</button><div class="muted small" style="text-align:center">${t("moreSub")}</div>` : ""}
 </div>
 <div class="section-head"><h2>${t("videosH")}</h2><span class="muted small">${t("videosSub")}</span></div>
 <div class="list">${vids.length ? vids.map(v => `<div class="row"><button class="chk ${Object.keys(S.vw[v.id]?.w || {}).length ? "on" : ""}" data-act="vidWatched" data-id="${esc(v.id)}" aria-label="${t("watched")}">✓</button><div class="grow"><div class="title">${esc(v.title)}</div>${/^https?:\/\//i.test(v.url || "") ? `<a href="${esc(v.url)}" target="_blank" rel="noopener" class="small">${t("watch")} ↗</a>` : `<span class="muted small">${t("noLink")}</span>`}</div></div>`).join("") : `<div class="empty">—</div>`}</div>
 <div class="muted small">${t("theoryTopics", { g: gradeName(S.profile.grade) })}: ${TOPICS[g]}</div></div>`;
}
function genQuiz(kind) {
  const g = gG(), qs = [];
  if (kind === "solf") {
    const lo = g <= 1 ? dia(0, 4) : dia(5, 3), hi = g <= 1 ? dia(4, 4) : g <= 3 ? dia(0, 5) : dia(2, 5);
    for (let i = 0; i < 5; i++) {
      const d = lo + rnd(hi - lo + 1); let acc = 0; if (g >= 4 && Math.random() < .3 && [0, 1, 3, 4, 5].includes(d % 7)) acc = 1;
      const ans = acc ? CHROM[(SEMI[d % 7] + 1) % 12] : SOL[d % 7]; const n = { d, dur: 4 }; if (acc) n.sym = "♯"; qs.push({ p: t("q_name"), vis: staff({ notes: [n], width: 200 }), opts: g >= 4 ? CHROM : SOL, ans, midi: midiOf(d, acc), grid: "seven" });
    }
  }
  else if (kind === "ear") {
    const set = (S.earSet && S.earSet.length >= 2 ? S.earSet : [0, 2, 4, 5, 7]).slice().sort((a, b) => a - b), pool = set.map(i => ({ n: CHROM[i], m: 60 + i }));
    for (let i = 0; i < 5; i++) { const c = pick(pool); qs.push({ ear: true, opts: pool.map(x => x.n), ans: c.n, midi: c.m, grid: pool.length > 4 ? "seven" : "" }); }
  }
  else { const ty = theoryTypes(); for (let i = 0; i < 5; i++)qs.push(theoryQ(pick(ty))); }
  return qs;
}
function actQuiz() {
  const k = A.k; A.qs ??= genQuiz(A.more ? "theory" : k); A.i ??= 0; A.res ??= []; const how = k === "solf" ? t("solfHow") : k === "ear" ? t("earHow") : t("moreSub");
  if (A.i >= A.qs.length) {
    const c = A.res.filter(Boolean).length;
    return `<div class="result pop"><div class="score">${c}/${A.qs.length}</div><h2>${t("resultH", { c, n: A.qs.length })}</h2><div class="muted">${t("resultSub")}</div><div class="opts" style="width:100%"><button class="btn soft" data-act="again">${t("newOne")}</button><button class="btn" data-act="close">${t("done")}</button></div></div>`;
  }
  const Q = A.qs[A.i];
  return `<div class="stack"><div class="muted small">${how}${k === "ear" ? " · " + t("earSet", { n: (S.earSet || []).map(i => CHROM[i]).join(" ") }) : ""}</div><div class="qprog">${A.qs.map((_, i) => `<span class="${i < A.i ? (A.res[i] ? "ok" : "no") : i === A.i ? "cur" : ""}"></span>`).join("")}</div>
 ${Q.p ? `<h2>${esc(Q.p)}</h2>` : ""}${Q.vis ? `<div class="staffbox">${Q.vis}</div>` : ""}
 ${Q.ear ? `<div style="text-align:center;padding:16px"><button class="btn" data-act="earPlay" style="font-size:1.1rem;padding:16px 26px">${I.play} ${t("playAgain")}</button></div>` : ""}
 <div class="opts ${Q.grid || ""}">${Q.opts.map(o => `<button class="opt ${A.picked != null ? (o === Q.ans ? "right" : o === A.picked ? "wrong" : "") : ""}" data-act="ans" data-o="${esc(o)}" ${A.picked != null ? "disabled" : ""}>${esc(o)}</button>`).join("")}</div>
 ${A.picked != null ? `<div class="card" style="text-align:center;font-weight:800;color:${A.picked === Q.ans ? "var(--good)" : "var(--bad)"}">${A.picked === Q.ans ? t("correct") : t("notQuite", { a: esc(Q.ans) })}</div><button class="btn block" data-act="nextQ">${A.i === A.qs.length - 1 ? t("finish") : t("next")}</button>` : ""}</div>`;
}
function guessArea(s) {
  const x = s.toLowerCase();
  if (/sight|初見/.test(x)) return "sight"; if (/scale|arpeggio|technique|スケール|アルペジオ|テクニック|ハノン|hanon/.test(x)) return "tech";
  if (/theory|video|セオリー|動画|楽典/.test(x)) return "theory"; if (/ear|音当て|音感|聴音/.test(x)) return "ear"; if (/solf|ソルフェ|sing|歌/.test(x)) return "solf";
  if (/note rush|note catcher|ノートラッシュ/.test(x)) return "nr"; if (/bar|小節|曲|piece|sonatina|waltz/.test(x)) return "piece"; return "other";
}

/* ===== avatar editor, onboarding, settings ===== */
function avatarEditor() {
  const a = S.avatar;
  const sw = (arr, f) => `<div class="swatches">${arr.map((c, i) => `<button class="sw ${a[f] === i ? "on" : ""}" style="background:${c}" data-act="av" data-f="${f}" data-v="${i}" aria-label="${f} ${i + 1}"></button>`).join("")}</div>`;
  const ch = (arr, f) => `<div class="chips">${arr.map(v => `<button class="chip ${a[f] === v ? "on" : ""}" data-act="av" data-f="${f}" data-v="${v}">${v}</button>`).join("")}</div>`;
  return `<div class="ava-big">${avatarSVG(a, { noCheeks: teen() })}</div><div class="label">${t("skinTone")}</div>${sw(SKINS, "skin")}<div class="label">${t("hair")}</div>${ch(HAIRS, "hair")}<div class="label">${t("hairColor")}</div>${sw(HAIRC, "hairColor")}<div class="label">${t("eyes")}</div>${ch(EYES, "eyes")}<div class="label">${t("shirt")}</div>${sw(SHIRTS, "shirt")}<div class="label">${t("bgc")}</div>${sw(BGS, "bg")}`;
}
const SKINLIST = { garden: ["#FFF5F9", "#D63F84", "#8460D8"], space: ["#0D1533", "#3EC5FF", "#FF8A3D"], studio: ["#F4F3F8", "#5B4BDB", "#D9466F"], arcade: ["#121417", "#FF7140", "#4CC9F0"] };
function skinPicker() { return `<div class="skins">${Object.entries(SKINLIST).map(([k, c]) => `<button class="skin ${S.skin === k ? "on" : ""}" data-act="skin" data-v="${k}" style="background:${c[0]};color:${k === "space" || k === "arcade" ? "#fff" : "#222"}"><span class="dots">${c.map(x => `<i style="background:${x};box-shadow:0 0 0 1px #8886"></i>`).join("")}</span>${t("skin_" + k)}</button>`).join("")}</div>`; }
function avatarSheet() { openSheet(`<div class="stack"><div class="act-head"><h2>${t("editAvatar")}</h2><button class="icon-btn" data-act="close" aria-label="Close">${I.close}</button></div>${avatarEditor()}</div>`); }
function onboarding() {
  const s = OB.step; let b = "";
  if (s === 0) b = `<div class="mascot">${mascotSVG()}<div class="bubble">${t("ob0")}</div></div><h1>${t("ob1")}</h1><input id="obName" value="${esc(S.profile.name)}" autocomplete="off" maxlength="40" style="font-size:1.2rem;flex:none"><div class="muted small">${t("ob1b")}</div><button class="btn block" data-act="ob1">${t("cont")}</button>`;
  if (s === 1) b = `<h1>${t("ob2")}</h1><div class="bigchoice"><button class="${S.profile.gender === "boy" ? "on" : ""}" data-act="obG" data-v="boy"><span class="face">${avatarSVG({ skin: 1, hair: "spiky", hairColor: 1, eyes: "happy", acc: "none", shirt: 4, bg: 4 }, { noCheeks: true })}</span>${t("boy")}</button><button class="${S.profile.gender === "girl" ? "on" : ""}" data-act="obG" data-v="girl"><span class="face">${avatarSVG({ skin: 1, hair: "pigtails", hairColor: 1, eyes: "sparkle", acc: "none", shirt: 1, bg: 1 })}</span>${t("girl")}</button></div><button class="btn soft block" data-act="obG" data-v="">${t("skip")}</button>`;
  if (s === 2) b = `<h1>${t("ob3")}</h1><div class="agepick">${Array.from({ length: 13 }, (_, i) => i + 6).map(n => `<button class="${S.profile.age === n ? "on" : ""}" data-act="obAge" data-v="${n}">${n}</button>`).join("")}</div><button class="btn block" data-act="obNext">${t("cont")}</button>`;
  if (s === 3) b = `<h1>${t("ob4")}</h1>${avatarEditor()}<button class="btn block" data-act="obNext">${t("cont")}</button>`;
  if (s === 4) b = `<h1>${t("ob5")}</h1><div class="muted">${t("ob5b")}</div>${skinPicker()}<button class="btn block" data-act="obDone">${t("letsgo")}</button>`;
  openSheet(`<div class="ob-step"><div class="ob-dots">${[0, 1, 2, 3, 4].map(i => `<i class="${i === s ? "on" : ""}"></i>`).join("")}</div>${b}</div>`, true);
}
function settings() {
  openSheet(`<div class="stack"><div class="act-head"><h2>${t("settings")}</h2><button class="icon-btn" data-act="close" aria-label="Close">${I.close}</button></div>
 <div class="label">${t("themeH")}</div>${skinPicker()}<button class="btn soft" data-act="redoOb">${t("redoOb")}</button>
 <div class="label">${t("languageH")}</div><div class="chips"><button class="chip on">English</button><button class="chip" disabled>日本語 · ${t("soon")}</button><button class="chip" disabled>Español · ${t("soon")}</button></div>
 <div class="label">${t("account")}</div><div class="list">
  <div class="toggle"><span><strong>${t("myTeacher")}</strong><br><span class="muted small">${S.teacherName ? esc(S.teacherName) : t("noTeacher")}</span></span></div>
  <div class="toggle"><span><strong>${t("planLabel")}: ${t("plan_" + S.plan)}</strong><br><span class="muted small">${t("planD_" + S.plan)}</span></span></div>
  <div class="toggle"><span class="muted small">${t("au_signedInAs", { e: esc(MYEMAIL) })}</span><button class="btn sm ghost" data-act="signOut">${t("au_signOut")}</button></div>
 </div></div>`);
}

/* ===== render & events ===== */
function refresh() {
  if (!S) return; applySkin(); refreshTop(); const v = document.getElementById("view"); v.innerHTML = ({ home: vHome, pieces: vPieces, goals: vGoals, me: vMe })[tab](); hydrateMedia(v);
  document.getElementById("tabs").innerHTML = Object.entries(TABS).map(([k, ic]) => `<button data-act="tab" data-t="${k}" ${k === tab ? 'aria-current="page"' : ""}>${I[ic]}<span>${t("tab_" + k)}</span></button>`).join("");
}
function studentClick(b, e) {
  const a = b.dataset.act, id = b.dataset.id, sheetOpen = !document.getElementById("sheet").hidden;
  switch (a) {
    case "tab": tab = b.dataset.t; try { history.replaceState(null, "", location.pathname + location.search + "#" + tab); } catch (_) { } if (sheetOpen && !OB) closeSheet(); refresh(); scrollTo(0, 0); return;
    case "open": openAct(b.dataset.k, b.dataset.p ? { pid: b.dataset.p } : {}); return;
    case "close": if (!OB) closeSheet(); return;
    case "settings": settings(); return;
    case "signOut": signOutNow(); return;
    case "avatar": avatarSheet(); return;
    case "av": S.avatar[b.dataset.f] = isNaN(+b.dataset.v) ? b.dataset.v : +b.dataset.v; save(); OB ? onboarding() : avatarSheet(); refreshTop(); return;
    case "skin": S.skin = b.dataset.v; save(); applySkin(); OB ? onboarding() : settings(); refreshTop(); return;
    case "redoOb": OB = { step: 0 }; onboarding(); return;
    case "ob1": {
      const n = document.getElementById("obName").value.trim().slice(0, 40) || "Student"; S.profile.name = n; OB.step = 1;
      if (n !== PROF.display_name) { PROF.display_name = n; queue({ k: "prof", t: "profiles", a: "prof", row: { display_name: n } }); }
      save(); onboarding(); return;
    }
    case "obG": S.profile.gender = b.dataset.v; if (b.dataset.v === "girl" && S.avatar.hair === "short") { S.avatar.hair = "long"; S.avatar.shirt = 1; S.avatar.bg = 1; } if (b.dataset.v === "boy" && S.avatar.hair === "short") { S.avatar.hair = "spiky"; S.avatar.shirt = 4; S.avatar.bg = 4; } OB.step = 2; save(); onboarding(); return;
    case "obAge": S.profile.age = +b.dataset.v; save(); applySkin(); onboarding(); return;
    case "obNext": OB.step++; if (OB.step === 4) S.skin = suggestSkin(); save(); applySkin(); onboarding(); return;
    case "obDone": S.onboarded = true; OB = null; save(); document.getElementById("sheet").hidden = true; refresh(); celebrate(); return;
    case "ppick": A.pid = id; renderAct(); return;
    case "pgoal": A.goal = +b.dataset.m; renderAct(); return;
    case "pstart": ac(); A.start = Date.now(); A.goalHit = 0; A.timer = setInterval(tickPiece, 250); if (S.recOn) startRec(A.pid); renderAct(); return;
    case "pstop": savePieceTime(); renderAct(); refreshTop(); return;
    case "sightRate": A.rated = b.dataset.r; award("sight", ACT.sight.coins, 3); renderAct(); refreshTop(); return;
    case "sightHear": playSight(); return;
    case "sightNew": A.ex = null; A.rated = null; renderAct(); return;
    case "sightBars": A.nb = +b.dataset.n; A.ex = null; A.rated = null; renderAct(); return;
    case "ncLvl": A.lvl = id; S.ncLvl = id; save(); renderAct(); return;
    case "ncStart": case "ncAgain": { ac(); const lvl = A.lvl || S.ncLvl || NC_LEVELS[0].id, L = NC_LEVELS.find(x => x.id === lvl) || NC_LEVELS[0]; A.run = { lvl: L.id, i: 0, ok: 0, res: [], t0: Date.now(), cur: ncNote(L) }; A.run.timer = setInterval(() => { const e = document.getElementById("ncT"); if (e && A?.run) e.textContent = clockOf((Date.now() - A.run.t0) / 1000); }, 250); renderAct(); return; }
    case "ncMenu": if (A.run?.timer) clearInterval(A.run.timer); A.run = null; renderAct(); return;
    case "ncKey": {
      const R = A?.run; if (!R || R.lock || R.i >= NC_N) return; const pc = +b.dataset.pc, ok = pc === R.cur.pc;
      tone(ok ? midiOf(R.cur.d, R.cur.alt) : 48 + 12 * (+b.dataset.o + 1) + pc, 0, .6, .28); b.classList.add(ok ? "hit" : "miss");
      if (!ok) { const right = document.querySelector(`[data-act="ncKey"][data-pc="${R.cur.pc}"]`); if (right) right.classList.add("hit"); }
      R.res[R.i] = ok; if (ok) R.ok++; R.lock = true;
      setTimeout(() => { if (!A?.run) return; R.lock = false; R.i++; if (R.i >= NC_N) ncFinish(); else R.cur = ncNote(NC_LEVELS.find(x => x.id === R.lvl), R.cur); renderAct(); refreshTop(); }, ok ? 220 : 900); return;
    }
    case "bpm": MET.bpm = Math.max(40, Math.min(208, MET.bpm + +b.dataset.d)); if (MET.on) startMetro(); document.getElementById("bpm").textContent = MET.bpm; document.querySelectorAll(".setbest").forEach(x => x.textContent = "♩=" + MET.bpm); return;
    case "metro": ac(); MET.on ? stopMetro() : startMetro(); b.innerHTML = MET.on ? t("mStop") : I.play + " " + t("mStart"); return;
    case "drill": { const d = S.drills.find(x => x.id === id); if (!d) return; d.doneOn = d.doneOn || {}; d.doneOn[TK] = !d.doneOn[TK]; save(); if (d.doneOn[TK] && !d.paidOn?.[TK]) { d.paidOn = { ...(d.paidOn || {}), [TK]: 1 }; award("tech", ACT.tech.coins, 2); } renderAct(); refreshTop(); return; }
    case "setBest": { const d = S.drills.find(x => x.id === id); if (!d) return; d.best = Math.max(+d.best || 0, MET.bpm); save(); toast(t("saved")); renderAct(); return; }
    case "delDrill": S.drills = S.drills.filter(x => x.id !== id); if (!S.drillsDel.includes(id)) S.drillsDel.push(id); save(); renderAct(); return;
    case "dAns": { if (A.picked != null) return; const Q = A.daily; A.picked = b.dataset.o; const ok = A.picked === Q.ans; if (Q.midi) tone(Q.midi); else if (Q.midis) Q.midis.forEach((m, i) => tone(m, i * .55)); else ding(ok); award("theory", ACT.theory.coins, ok ? 2 : 0); renderAct(); refreshTop(); return; }
    case "theoryMore": A = { k: "theory", more: true }; renderAct(); return;
    case "vidWatched": { const v = vwOf(id); v.w[TK] = !v.w[TK]; if (!v.w[TK]) delete v.w[TK]; save(); if (v.w[TK] && !v.p[TK]) { v.p[TK] = 1; award("theory", ACT.theory.coins, 5); } renderAct(); refreshTop(); return; }
    case "earPlay": tone(A.qs[A.i].midi); return;
    case "ans": {
      if (A.picked != null) return; const Q = A.qs[A.i]; A.picked = b.dataset.o; const ok = A.picked === Q.ans; A.res[A.i] = ok;
      if (Q.midi && !Q.ear) tone(Q.midi); else if (Q.midis) Q.midis.forEach((m, i) => tone(m, i * .55)); else ding(ok); renderAct(); return;
    }
    case "nextQ": A.i++; A.picked = null;
      if (A.i >= A.qs.length) { const c = A.res.filter(Boolean).length; if (A.more) earn(c); else award(A.k, ACT[A.k].coins, c); if (A.res.every(Boolean)) celebrate(); }
      else if (A.qs[A.i].ear) setTimeout(() => tone(A.qs[A.i].midi), 250);
      renderAct(); refreshTop(); return;
    case "again": { const k = A.k, more = A.more; A = { k, more }; renderAct(); if (k === "ear") setTimeout(() => tone(A.qs[0].midi), 250); return; }
    case "shopTab": shopTab = b.dataset.v; break;
    case "shop": { const it = ACCS.find(x => x.id === id); if (!S.owned.includes(id)) { if (S.coins < it.price) { toast(t("notEnough")); return; } S.coins -= it.price; S.owned.push(id); toast(t("bought")); celebrate(); } S.avatar.acc = id; break; }
    case "card": { const c = CARDS.find(x => x.id === id); if (S.cards.includes(id)) return; if (S.coins < c.p) { toast(t("notEnough")); return; } S.coins -= c.p; S.cards.push(id); toast(t("cardGot")); celebrate(); break; }
    case "redeem": { const r = S.rewards.find(x => x.id === id); if (!r) return; if (S.coins < r.price) { toast(t("notEnough")); return; } S.coins -= r.price; S.redeemed.push({ id: uid(), title: r.title, price: r.price, date: TK, given: false }); toast(t("redeemed")); celebrate(); break; }
    case "score": showScore(id); return;
    case "scoreBack": renderAct(); return;
    case "toggleItem": { const i = S.items.find(x => x.id === id); if (!i) return; i.done = i.done || {}; i.done[TK] = !i.done[TK]; if (!i.done[TK]) delete i.done[TK]; const pk = i.id + "|" + TK; if (i.done[TK] && !S.taskPaid[pk]) { S.taskPaid[pk] = 1; earn(2); } save(); if (sheetOpen && A) { renderAct(); refreshTop(); return; } break; }
    case "delItem": { const i = S.items.find(x => x.id === id); if (!i || i.source === "teacher") return; S.items = S.items.filter(x => x.id !== id); break; }
    case "toggleGoal": { const g = S.goals.find(x => x.id === id); g.done = !g.done; if (g.done && !g.starred) { g.starred = 1; S.stars++; celebrate(); toast(t("goalStar")); } break; }
    case "toggleStep": { const s = S.events.find(x => x.id === b.dataset.e).steps.find(x => x.id === b.dataset.s); s.done = !s.done; break; }
    case "psec": { const p = S.pieces.find(x => x.id === id), s = p.sections.find(x => x.id === b.dataset.s); s.done = !s.done; save(); if (sheetOpen && A) { renderAct(); return; } break; }
    case "pstatus": { const p = S.pieces.find(x => x.id === id); p.status = b.dataset.s; if (p.status === "ready" && !S.starredPieces.includes(p.id)) { S.starredPieces.push(p.id); S.stars++; celebrate(); toast(t("readyStar")); } break; }
    case "delPiece": if (!confirm(t("confirmDel"))) return; S.pieces = S.pieces.filter(x => x.id !== id); S.items.forEach(i => { if (i.pieceId === id) i.pieceId = null; }); break;
    case "delGoal": S.goals = S.goals.filter(x => x.id !== id); break;
    case "delEvent": if (!confirm(t("confirmDel"))) return; S.events = S.events.filter(x => x.id !== id); break;
    case "delStep": { const ev = S.events.find(x => x.id === b.dataset.e); ev.steps = ev.steps.filter(x => x.id !== b.dataset.s); break; }
    case "delRec": {
      if (!confirm(t("confirmDel"))) return;
      const r = S.remoteRecs.find(x => x.id === id);
      if (r) { S.remoteRecs = S.remoteRecs.filter(x => x.id !== id); const pend = OUT.findIndex(o => o.k === "rec:" + id); if (pend >= 0) OUT.splice(pend, 1); else queue({ k: "recdel:" + id, t: "recordings", a: "recdel", id, path: r.path }); saveOut(); }
      else S.recs = S.recs.filter(x => x.id !== id);
      idbDel(id); delete MEM[id]; break;
    }
    case "feel": feelPick = b.dataset.f; break;
    default: return;
  }
  save(); refresh();
}
function studentInput(e) { }
function studentChange(e) {
  const b = e.target;
  if (b.id === "recOn") { S.recOn = b.checked; save(); }
  if (b.id === "ncNames") { S.ncNames = b.checked; save(); }
  if ((b.id === "recFile" || b.id === "vidFile") && b.files[0]) {
    const f = b.files[0], kind = b.id === "vidFile" ? "video" : "audio", el = document.createElement(kind), u = URL.createObjectURL(f); el.preload = "metadata";
    el.onloadedmetadata = () => { URL.revokeObjectURL(u); saveRec(f, isFinite(el.duration) ? el.duration : 0, A?.pid, kind); }; el.onerror = () => { URL.revokeObjectURL(u); saveRec(f, 0, A?.pid, kind); }; el.src = u;
  }
}
function studentSubmit(e) {
  const f = e.target.dataset.form, v = id => (document.getElementById(id)?.value || "").trim();
  if (f === "piece") { const title = v("pTitle"); if (!title) return; S.pieces.push({ id: uid(), title, composer: v("pComp"), status: "learning", sec: 0, days: {}, sections: [] }); }
  if (f === "sec") { const p = S.pieces.find(x => x.id === e.target.dataset.id), n = v("sec-" + p.id); if (!n) return; p.sections.push({ id: uid(), name: n, done: false }); }
  if (f === "own") { const title = v("ownT"); if (!title) return; S.items.push({ id: uid(), week: WK, area: guessArea(title), title, source: "me", done: {} }); }
  if (f === "goal") { const text = v("goalText"); if (!text) return; S.goals.push({ id: uid(), month: MK, text, done: false }); }
  if (f === "event") { const title = v("evT"), date = v("evD"); if (!title || !date) return; S.events.push({ id: uid(), title, date, piece: v("evP"), steps: [] }); }
  if (f === "step") { const eid = e.target.dataset.e, text = v("stT-" + eid), date = v("stD-" + eid); if (!text || !date) return; S.events.find(x => x.id === eid).steps.push({ id: uid(), text, date, done: false }); }
  if (f === "drill") { const n = v("drillName"); if (!n) return; S.drills.push({ id: uid(), name: n, target: 80, best: 0, doneOn: {} }); save(); renderAct(); return; }
  if (f === "log") { let l = S.log.find(x => x.date === TK); if (!l) { l = { date: TK, sec: 0, feel: null, note: "" }; S.log.push(l); } l.note = v("logNote"); if (feelPick) l.feel = feelPick; feelPick = null; }
  save(); toast(t("saved")); refresh();
}
