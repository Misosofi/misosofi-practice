/* ===== Visiting classmates' rooms =====
   Same teacher only, a parent switches it on (password again), the teacher can switch it off.
   Every step is a music question, and a wrong answer means "not today":
   1) the visitor hears the doorbell and names its notes → the bell rings at the friend's house
   2) the friend answers a music word to open the door
   3) the visitor reads a note to step inside → looks around and leaves one stamp.
   Server side: supabase/patch-03-visits.sql (all writes go through checked functions). */
let VIS = { set: null, mates: [], list: [], at: 0, busy: false, q: null };
const STAMPS = { heart: "💗", star: "⭐", note: "🎵", clap: "👏", smile: "😊" };
const BELLS = [[76, 72], [79, 72], [72, 79], [79, 76], [76, 79], [72, 76], [84, 79], [77, 74], [81, 77], [74, 79]];
const midiName = m => { const i = [0, 2, 4, 5, 7, 9, 11].indexOf(((m % 12) + 12) % 12); return i < 0 ? "?" : noteLabel(i); };

/* ---------- demo backend: two pretend classmates so the whole thing can be tried with ?demo=1 ---------- */
function demoRpc(fn, a) {
  const K = "misosofi-demo-visits", st = (() => { try { return JSON.parse(localStorage.getItem(K)) || {}; } catch (e) { return {}; } })();
  st.on ??= false; st.v ??= [];
  const put = () => { try { localStorage.setItem(K, JSON.stringify(st)); } catch (e) { } };
  const mates = [{ id: "demo-mia", name: "Mia", avatar: { animal: "bunny", outfit: "dress", bg: 1 } }, { id: "demo-kenta", name: "Kenta", avatar: { animal: "boy", outfit: "jacket", bg: 4 } }, { id: "demo-yuki", name: "Yuki", avatar: { animal: "tofu", outfit: "plain", bg: 2 } }];
  const room = { bg: "room_city", items: [{ u: "a", id: "t_dino", placed: true, x: 70, y: 92 }, { u: "b", id: "h_plant", placed: true, x: 12, y: 78 }, { u: "c", id: "r_skate", placed: true, x: 40, y: 98 }], me: { x: 55, y: 90 }, inst: { x: 26, y: 82 } };
  if (!st.v.some(v => v.from === "demo-mia" && v.day === TK)) st.v.unshift({ id: "dv-in-" + TK, from: "demo-mia", to: "me", day: TK, status: "rung", stamp: "" });
  const row = v => { const o = mates.find(m => m.id === (v.from === "me" ? v.to : v.from)); return { id: v.id, day: v.day, status: v.status, stamp: v.stamp, other_name: o.name, other_avatar: o.avatar, mine: v.from === "me", to_id: v.to, from_id: v.from }; };
  const find = id => st.v.find(v => v.id === id);
  let out = null;
  if (fn === "set_visiting") st.on = !!a.on_;
  else if (fn === "classmates") out = st.on ? mates.map(m => ({ id: m.id, name: m.name, avatar: m.avatar })) : [];
  else if (fn === "my_visits") out = st.v.map(row);
  else if (fn === "ring_bell") { if (st.v.some(v => v.from === "me" && v.to === a.target && v.day === TK)) throw new Error("You already rang today"); st.v.unshift({ id: "dv-" + uid(), from: "me", to: a.target, day: TK, status: "open", stamp: "" }); }
  else if (fn === "answer_door") { const v = find(a.visit); v.status = a.ok ? "open" : "closed"; if (a.ok) setTimeout(() => { v.stamp = "star"; put(); }, 10); }
  else if (fn === "step_in") { const v = find(a.visit); v.status = a.ok ? "inside" : "stuck"; }
  else if (fn === "friend_room") { const v = find(a.visit), o = mates.find(m => m.id === v.to); out = [{ name: o.name, avatar: o.avatar, room, stars: 18 }]; }
  else if (fn === "leave_stamp") find(a.visit).stamp = a.st;
  put();
  if (fn === "visit_setting") return [{ allowed: st.on, teacher_off: false }];
  return out;
}
const vrpc = (fn, a) => DB.demo ? Promise.resolve(demoRpc(fn, a)) : DB.rpc(fn, a);

async function visitsLoad(force) {
  if (VIS.busy || (!force && Date.now() - VIS.at < 30000)) return;
  VIS.busy = true;
  try {
    if (DB.demo) VIS.set = demoRpc("visit_setting")[0];
    else { const r = await DB.sel("visit_settings", { eq: { student_id: ME } }); VIS.set = r[0] || { allowed: false, teacher_off: false }; }
    if (VIS.set.allowed && !VIS.set.teacher_off) {
      const [m, l] = await Promise.all([vrpc("classmates"), vrpc("my_visits")]);
      VIS.mates = m || []; VIS.list = l || [];
    } else { VIS.mates = []; VIS.list = []; }
    VIS.at = Date.now();
    VIS.err = false;
  } catch (e) { VIS.err = true; }
  VIS.busy = false;
  const c = document.getElementById("friendsCard"); if (c) c.outerHTML = friendsCard();
  const b = document.getElementById("bellBanner"); if (b) b.outerHTML = bellBanner();
}

/* someone is at my door (shown on Today and in Me) */
const knocking = () => VIS.list.filter(v => !v.mine && v.status === "rung");
function bellBanner() {
  const k = knocking()[0];
  if (!k) return `<div id="bellBanner"></div>`;
  return `<div id="bellBanner" class="section"><button class="card bell-card" data-vact="door" data-id="${esc(k.id)}">
   <span class="bell-ava">${avatarSVG(k.other_avatar, { head: true })}</span><span class="grow"><b>🔔 ${t("vi_atDoor", { name: esc(k.other_name) })}</b><span class="muted small">${t("vi_atDoorHow")}</span></span></button></div>`;
}

function friendsCard() {
  if (VIS.err && !VIS.set) return `<div id="friendsCard"></div>`;
  const s = VIS.set;
  const head = `<div class="section-head"><h2>👫 ${t("vi_title")}</h2></div>`;
  if (!s) return `<div class="section" id="friendsCard">${head}<div class="card muted small">${t("vi_loading")}</div></div>`;
  if (s.teacher_off) return `<div class="section" id="friendsCard">${head}<div class="card muted small">${t("vi_teacherOff")}</div></div>`;
  if (!s.allowed) return `<div class="section" id="friendsCard">${head}<div class="card stack"><div class="muted">${t("vi_intro")}</div><button class="btn" data-vact="parent">${t("vi_parentOn")}</button></div></div>`;
  const today = VIS.list.filter(v => v.day >= key(addDays(TODAY, -1)));
  const mine = today.filter(v => v.mine), toMe = VIS.list.filter(v => !v.mine);
  const failed = id => (S.bellFail || {})[id] === TK, rangToday = id => mine.some(v => v.to_id === id && v.day === TK);
  const myRow = v => {
    const st = { rung: t("vi_waiting"), open: t("vi_opened"), closed: t("vi_closed"), inside: v.stamp ? t("vi_leftStamp", { s: STAMPS[v.stamp] || "" }) : t("vi_inside"), stuck: t("vi_stuck") }[v.status];
    const btn = v.status === "open" ? `<button class="btn sm" data-vact="enter" data-id="${esc(v.id)}">${t("vi_stepIn")}</button>` : v.status === "inside" ? `<button class="btn sm soft" data-vact="room" data-id="${esc(v.id)}">${t("vi_look")}</button>` : "";
    return `<div class="row"><span class="mate-ava">${avatarSVG(v.other_avatar, { head: true })}</span><div class="grow"><div class="title">${esc(v.other_name)}</div><div class="muted small">${st}</div></div>${btn}</div>`;
  };
  const stamps = toMe.filter(v => v.stamp).slice(0, 4);
  return `<div class="section" id="friendsCard">${head}
  ${stamps.length ? `<div class="card stamps-in">${stamps.map(v => `<span>${STAMPS[v.stamp] || ""} ${t("vi_gotStamp", { name: esc(v.other_name) })}</span>`).join("")}</div>` : ""}
  ${mine.length ? `<div class="list">${mine.map(myRow).join("")}</div>` : ""}
  <div class="label">${t("vi_classmates")}</div>
  ${VIS.mates.length ? `<div class="mates">${VIS.mates.map(m => {
    const off = failed(m.id) || rangToday(m.id);
    return `<button class="mate ${off ? "dim" : ""}" data-vact="visit" data-id="${esc(m.id)}" ${off ? "disabled" : ""}><span class="mate-ava">${avatarSVG(m.avatar, { head: true })}</span><span>${esc(m.name)}</span><span class="muted small">${failed(m.id) ? t("vi_tomorrow") : rangToday(m.id) ? "✓" : "🔔 " + t("vi_ring")}</span></button>`;
  }).join("")}</div>` : `<div class="card muted small">${t("vi_noMates")}</div>`}
  <div class="muted small">${t("vi_rules")}</div>
  <button class="btn ghost sm" data-vact="parentOff">${t("vi_parentOff")}</button></div>`;
}

/* ---------- a one-try question in the sheet ---------- */
function vQuestion(title, q, extra = "") {
  VIS.q.q = q;
  openSheet(`<div class="stack"><div class="act-head"><h2>${title}</h2><button class="icon-btn" data-act="close" aria-label="Close">${I.close}</button></div>
  <div class="muted">${t("vi_oneTry")}</div>${extra}
  <div class="card stack" style="text-align:center"><b>${q.p}</b>${q.vis ? `<div class="staffbox">${q.vis}</div>` : ""}</div>
  <div class="opts">${q.opts.map(o => `<button class="btn soft" data-vact="ans" data-v="${esc(o)}">${esc(o)}</button>`).join("")}</div></div>`);
}
function vResult(ok, msg, more = "") {
  ding(ok);
  openSheet(`<div class="stack" style="text-align:center"><div class="act-head"><h2>${ok ? "🎉" : "🔒"}</h2><button class="icon-btn" data-act="close" aria-label="Close">${I.close}</button></div>
  <div class="big-msg">${msg}</div>${more}<button class="btn" data-act="close">OK</button></div>`);
}
function bellPlay() { const b = VIS.q?.bell; if (!b) return; b.forEach((m, i) => tone(m, i * .55, 1.2, .34)); }

async function vAnswer(v) {
  const Q = VIS.q; if (!Q || Q.done) return; Q.done = true;
  const ok = v === Q.q.ans;
  try {
    if (Q.kind === "bell") {
      if (ok) { await vrpc("ring_bell", { target: Q.id }); vResult(true, t("vi_bellOk", { name: esc(Q.name) })); }
      else { S.bellFail = { ...(S.bellFail || {}), [Q.id]: TK }; save(); vResult(false, t("vi_bellNo", { ans: esc(Q.q.ans) })); }
    } else if (Q.kind === "door") {
      await vrpc("answer_door", { visit: Q.id, ok });
      if (ok) { S.coins += 2; save(); vResult(true, t("vi_doorOk", { name: esc(Q.name) })); }
      else vResult(false, t("vi_doorNo", { ans: esc(Q.q.ans), w: esc(Q.q.w || "") }));
    } else if (Q.kind === "enter") {
      await vrpc("step_in", { visit: Q.id, ok });
      if (ok) { S.coins += 1; save(); VIS.at = 0; openFriendRoom(Q.id); }
      else vResult(false, t("vi_enterNo", { ans: esc(Q.q.ans) }));
    }
  } catch (e) { toast(e.message || "Error"); closeSheet(); }
  VIS.at = 0; visitsLoad(true);
}

async function openFriendRoom(id) {
  let r; try { r = (await vrpc("friend_room", { visit: id }) || [])[0]; } catch (e) { toast(e.message); return; }
  if (!r) { toast(t("vi_gone")); return; }
  const v = VIS.list.find(x => x.id === id), done = v && v.stamp;
  openSheet(`<div class="stack"><div class="act-head"><h2>${t("rm_title", { name: esc(r.name) })}</h2><button class="icon-btn" data-act="close" aria-label="Close">${I.close}</button></div>
  ${friendRoomHTML(r)}
  <div class="label">${t("vi_stampH")}</div>
  <div class="stamps">${Object.entries(STAMPS).map(([k, e]) => `<button class="${v?.stamp === k ? "on" : ""}" data-vact="stamp" data-id="${esc(id)}" data-v="${k}" ${done ? "disabled" : ""}>${e}</button>`).join("")}</div>
  <div class="muted small">${done ? t("vi_stampDone") : t("vi_stampHow")}</div></div>`, true);
}
/* a look-only copy of the friend's room */
function friendRoomHTML(f) {
  const R = f.room || {}, items = (R.items || []).filter(i => i.placed && itemOf(i.id) && itemOf(i.id).cat !== "room");
  const bg = itemOf(R.bg)?.cat === "room" ? R.bg : "room_pink", me = R.me || { x: 60, y: 90 }, ip = R.inst || { x: 28, y: 86 };
  let k = 0; INSTR.forEach((x, i) => { if ((f.stars || 0) >= x.stars) k = i; }); const ins = INSTR[k];
  const objs = items.map(i => ({ y: i.y, h: `<div class="ri ${i.flip ? "flip" : ""}" style="left:${i.x}%;top:${i.y}%;width:${itemOf(i.id).w}%;z-index:${Math.round(i.y)}">${itemImg(i.id)}</div>` }))
    .concat([{ y: me.y, h: `<div class="ri me" style="left:${me.x}%;top:${me.y}%;width:22%;z-index:${Math.round(me.y)}">${avatarSVG(f.avatar, { room: true })}</div>` },
    { y: ip.y, h: `<div class="ri" style="left:${ip.x}%;top:${ip.y}%;width:${ins.w}%;z-index:${Math.round(ip.y)}">${itemImg(ins.id)}</div>` }]).sort((a, b) => a.y - b.y);
  return `<div class="room" style="background-image:url('${ART}${bg}.webp')">${objs.map(o => o.h).join("")}</div>`;
}

/* the parent's switch: the password of this account must be typed again */
function parentSheet(on) {
  openSheet(`<div class="stack"><div class="act-head"><h2>${on ? t("vi_parentOn") : t("vi_parentOff")}</h2><button class="icon-btn" data-act="close" aria-label="Close">${I.close}</button></div>
  ${on ? `<div class="card stack small">${t("vi_parentInfo")}</div>` : ""}
  <form class="stack" data-vform="parent" data-on="${on ? 1 : 0}"><label class="label" for="vpw">${t("vi_parentPw")}</label>
  <input id="vpw" type="password" autocomplete="current-password" required>
  <button class="btn" type="submit">${on ? t("vi_agree") : t("vi_parentOff")}</button></form></div>`);
}

document.addEventListener("click", e => {
  const b = e.target.closest("[data-vact]"); if (!b || !S) return;
  const act = b.dataset.vact, id = b.dataset.id;
  if (act === "parent") parentSheet(true);
  else if (act === "parentOff") parentSheet(false);
  else if (act === "ans") vAnswer(b.dataset.v);
  else if (act === "bell") bellPlay();
  else if (act === "visit") {
    const m = VIS.mates.find(x => x.id === id); if (!m) return;
    const bell = pick(BELLS), ans = bell.map(midiName).join(" – ");
    const pool = [ans]; while (pool.length < 4) { const o = pick(BELLS).map(midiName).join(" – "); if (!pool.includes(o)) pool.push(o); }
    VIS.q = { kind: "bell", id, name: m.name, bell };
    vQuestion(t("vi_bellH", { name: esc(m.name) }), { p: t("vi_bellQ"), opts: pool.sort(() => Math.random() - .5), ans }, `<button class="btn big-bell" data-vact="bell">🔔 ${t("vi_listen")}</button>`);
    setTimeout(bellPlay, 300);
  }
  else if (act === "door") {
    const v = VIS.list.find(x => x.id === id); if (!v) return;
    const q = theoryQ("term"); q.w = (q.p.match(/[“"](.+?)[”"]/) || [])[1] || "";
    VIS.q = { kind: "door", id, name: v.other_name };
    vQuestion(t("vi_doorH", { name: esc(v.other_name) }), q);
  }
  else if (act === "enter") {
    const v = VIS.list.find(x => x.id === id); if (!v) return;
    VIS.q = { kind: "enter", id, name: v.other_name };
    vQuestion(t("vi_enterH", { name: esc(v.other_name) }), theoryQ("name"));
  }
  else if (act === "room") openFriendRoom(id);
  else if (act === "stamp") {
    vrpc("leave_stamp", { visit: id, st: b.dataset.v }).then(() => { const v = VIS.list.find(x => x.id === id); if (v) v.stamp = b.dataset.v; ding(true); toast(t("vi_stampSent")); openFriendRoom(id); VIS.at = 0; visitsLoad(true); }).catch(er => toast(er.message));
  }
});
document.addEventListener("submit", async e => {
  const f = e.target.closest("[data-vform]"); if (!f) return; e.preventDefault();
  const on = f.dataset.on === "1", pw = f.querySelector("#vpw").value;
  try {
    if (!DB.demo) await DB.signIn(MYEMAIL, pw);   /* proves a grown-up who knows the password is here */
    await vrpc("set_visiting", { on_: on });
    toast(on ? t("vi_onDone") : t("vi_offDone")); VIS.at = 0; closeSheet(); visitsLoad(true);
  } catch (er) { toast(/invalid|credentials/i.test(er.message) ? t("vi_badPw") : er.message); }
});

/* ---------- teacher: see and pause a student's visits ---------- */
async function tVisitFill(sid) {
  const box = document.getElementById("tVisit"); if (!box || DB.demo) return;
  let r = null; try { r = (await DB.sel("visit_settings", { eq: { student_id: sid } }))[0]; } catch (e) { return; }
  const st = !r || !r.allowed ? t("t_viNot") : r.teacher_off ? t("t_viPaused") : t("t_viOn");
  box.innerHTML = `<h2>👫 ${t("vi_title")}</h2><div class="card stack"><div class="muted small">${st}</div>${r && r.allowed ? `<button class="btn sm soft" data-tvact="${r.teacher_off ? "on" : "off"}" data-id="${esc(sid)}">${r.teacher_off ? t("t_viResume") : t("t_viPause")}</button>` : ""}</div>`;
}
document.addEventListener("click", async e => {
  const b = e.target.closest("[data-tvact]"); if (!b) return;
  try { await DB.rpc("teacher_set_visiting", { student: b.dataset.id, off_: b.dataset.tvact === "off" }); tVisitFill(b.dataset.id); } catch (er) { toast(er.message); }
});
