/* ===== "Send Daizu" =====
   From Atsuko's picture book: Daizu the cat sings flamenco when hungry. A child spends coins to send Daizu to a classmate.
   Daizu squeezes in through a gap (no doorbell), sings "I'm hungry" with the guitar and holds out a paw.
   Give a treat from your room → a kiss and goodbye (+coins for both). No treat → Daizu stomps off in a huff.
   Same rules as visits (same teacher, parents switched visits on). One Daizu per sender per day. Server: patch-04-daizu.sql */
const DAIZU_COST = 10;
let DZ = { list: [], shown: {}, scene: null };
/* the Misosofi cats. ready = pictures are made. enter: "bang" (bursts the door open — only cats can!) or "ghost" (floats through the wall)
   when: "dark" = can only be sent at dusk/night (rare). arrive: "night" = only appears when it is night at the friend's house */
const CATS = {
  daizu: { n: "Daizu", ready: true, enter: "bang", cost: 10 },
  kuriito: { n: "Kuriito", ready: true, enter: "bang", cost: 10 },
  matcha: { n: "Matcha", ready: true, enter: "bang", cost: 10 },
  azuki: { n: "Azuki", ready: true, enter: "bang", cost: 15, when: "dark" },
  sakura: { n: "Sakura", ready: true, enter: "ghost", cost: 15, arrive: "night" },
};
const catOf = x => CATS[x?.cat] ? x.cat : "daizu";
const isDusk = () => { const h = new Date().getHours(); return h >= 18 || h < 7; };
/* what Daizu wants today: a different treat for every trip */
const WISH = ["c_kibble", "c_kibble", "c_tuna", "c_tuna", "c_treat"];   /* cats only eat cat food */
const wishOf = id => { let h = 0; for (const c of String(id)) h = (h * 31 + c.charCodeAt(0)) >>> 0; return WISH[h % WISH.length]; };

function demoDaizu(fn, a) {
  const K = "misosofi-demo-daizu", st = (() => { try { return JSON.parse(localStorage.getItem(K)) || {}; } catch (e) { return {}; } })();
  st.t ??= [];
  const put = () => { try { localStorage.setItem(K, JSON.stringify(st)); } catch (e) { } };
  const names = { "demo-mia": ["Mia", { animal: "bunny", outfit: "dress", bg: 1 }], "demo-kenta": ["Kenta", { animal: "boy", outfit: "jacket", bg: 4 }], "demo-yuki": ["Yuki", { animal: "tofu", outfit: "plain", bg: 2 }] };
  if ((typeof TS === "undefined" || !TS?.me) && !st.t.some(x => x.from === "demo-kenta" && x.day === TK)) st.t.unshift({ id: "dz-in-" + TK, from: "demo-kenta", to: "me", day: TK, cat: "daizu", status: "sent", food: "" });
  let out = null;
  names.teacher = ["Teacher", {}, "teacher"];
  const me = typeof TS !== "undefined" && TS?.me ? TS.me.id : "me";
  const who = id => names[id] || [(typeof TS !== "undefined" && TS?.students?.find(x => x.id === id)?.display_name) || "Student", {}, "student"];
  if (fn === "daizu_mine" || fn === "cats_mine") out = st.t.filter(x => x.from === me || x.to === me).map(x => { const oid = x.from === me ? x.to : x.from, o = who(oid); return { id: x.id, day: x.day, cat: x.cat || "daizu", status: x.status, food: x.food, msg: x.msg || "", other_id: oid, other_name: o[0], other_avatar: o[1], other_role: o[2] || "student", mine: x.from === me }; });
  else if (fn === "send_cat") { if (st.t.some(x => x.from === me && x.to === a.target && x.day === TK && x.cat === a.cat_)) throw new Error("This cat already went out today"); st.t.unshift({ id: "dz-" + uid(), from: me, to: a.target, day: TK, cat: a.cat_, msg: a.msg_ || "", status: me === "me" && a.target !== "teacher" ? "fed" : "sent", food: me === "me" && a.target !== "teacher" ? "f_banana" : "" }); }
  else if (fn === "send_daizu") { if (st.t.some(x => x.from === "me" && x.day === TK && x.cat === a.cat_)) throw new Error("This cat already went out today"); st.t.unshift({ id: "dz-" + uid(), from: "me", to: a.target, day: TK, cat: a.cat_, status: "fed", food: "f_banana" }); }
  else if (fn === "daizu_answer") { const x = st.t.find(y => y.id === a.trip); x.status = a.fed ? "fed" : "angry"; x.food = a.food_ || ""; }
  put(); return out;
}
const dzrpc = (fn, a) => DB.demo ? Promise.resolve(demoDaizu(fn, a)) : DB.rpc(fn, a);

async function catsList() { try { return (await dzrpc("cats_mine")) || []; } catch (e) { try { return (await dzrpc("daizu_mine")) || []; } catch (e2) { return []; } } }
async function daizuLoad() { DZ.list = await catsList(); payDaizuKisses(); }
const isTeacherTrip = x => x.other_role === "teacher";
const sentToday = cat => DZ.list.find(x => x.mine && !isTeacherTrip(x) && x.day === TK && catOf(x) === cat);
const sentTeacherToday = cat => DZ.list.find(x => x.mine && isTeacherTrip(x) && x.day === TK && catOf(x) === cat);
/* send with a message (new server function), falling back to the old one */
async function sendCat(target, cat, msg) { try { return await dzrpc("send_cat", { target, cat_: cat, msg_: msg || "" }); } catch (e) { if (/send_cat|PGRST202|schema cache/i.test(e.message || "")) return dzrpc("send_daizu", { target, cat_: cat }); throw e; } }
const readyCats = () => Object.keys(CATS).filter(k => CATS[k].ready);

/* the sender gets 3 coins back for every kiss Daizu brings home */
function payDaizuKisses() {
  S.dzPaid ||= {}; let n = 0;
  DZ.list.filter(x => x.mine && x.status === "fed" && !S.dzPaid[x.id]).forEach(x => { S.dzPaid[x.id] = 1; n++; });
  if (n) { S.coins += 3 * n; save(); toast(t("dz_kissBack")); }
}
function daizuBtn(m) {
  const left = readyCats().filter(c => !sentToday(c));
  return `<button class="btn sm ghost dz-send ${left.length ? "" : "dim"}" data-dz="send" data-id="${esc(m.id)}" ${left.length ? "" : "disabled"}>🐱 ${t("dz_send")}</button>`;
}
function daizuNews() {
  const rows = DZ.list.filter(x => x.mine && x.day >= key(addDays(TODAY, -1))).slice(0, 3);
  if (!rows.length) return "";
  const line = x => { const o = { name: esc(x.other_name), cat: CATS[catOf(x)].n, food: esc(itemOf(x.food)?.n || t("dz_aTreat")) }; if (isTeacherTrip(x)) return x.status === "sent" ? t("tc_onWay", o) : t("tc_thanked", o); return x.status === "sent" ? t("dz_onWay", o) : x.status === "fed" ? t("dz_fedNews", o) : t("dz_angryNews", o); };
  return `<div class="card dz-news">${rows.map(x => `<div class="row"><img src="${ART}${catOf(x)}_${x.status === "fed" ? "kiss" : x.status === "angry" ? "angry" : "paw"}.webp" alt=""><div class="grow small">${line(x)}</div></div>`).join("")}</div>`;
}

/* ---------- sending ---------- */
function daizuSendSheet(id) {
  const m = VIS.mates.find(x => x.id === id); if (!m) return;
  const card = c => { const C = CATS[c], sent = sentToday(c), dark = C.when === "dark" && !isDusk();
    return `<div class="card dz-choice"><img src="${ART}${c}_guitar.webp" alt="${C.n}"><div class="grow"><b>${C.n}</b>${C.when === "dark" || C.arrive ? ` <span class="pill m">${t("dz_rare")}</span>` : ""}<div class="muted small">${t("dz_how_" + c, { name: esc(m.name) })}</div>
     <button class="btn sm" data-dz="go" data-cat="${c}" data-id="${esc(id)}" ${sent || dark ? "disabled" : ""}>${sent ? t("dz_wentOut") : dark ? t("dz_onlyDark") : `🐾 ${t("dz_sendGo")} · ${I.coin}${C.cost}`}</button></div></div>`; };
  openSheet(`<div class="stack"><div class="act-head"><h2>${t("dz_sendH", { name: esc(m.name) })}</h2><button class="icon-btn" data-act="close" aria-label="Close">${I.close}</button></div>
  ${readyCats().map(card).join("")}
  <div class="muted small">${t("dz_oncePerDay")}</div></div>`);
}
async function daizuGo(id, cat) {
  const C = CATS[cat] || CATS.daizu; cat = CATS[cat] ? cat : "daizu";
  if ((S.coins || 0) < C.cost) { toast(t("notEnough")); return; }
  if (C.when === "dark" && !isDusk()) { toast(t("dz_onlyDark")); return; }
  try { await dzrpc("send_daizu", { target: id, cat_: cat }); } catch (e) { toast(e.message); return; }
  S.coins -= C.cost; save(); refreshTop?.();
  const m = VIS.mates.find(x => x.id === id);
  openSheet(`<div class="stack" style="text-align:center"><div class="act-head"><h2>🐾</h2><button class="icon-btn" data-act="close" aria-label="Close">${I.close}</button></div>
  <div class="dz-stage dz-leave-stage"><img class="dz-walk" src="${ART}${cat}_paw.webp" alt=""></div>
  <div class="big-msg">${t("dz_sent", { name: esc(m?.name || ""), cat: C.n })}</div><button class="btn" data-act="close">OK</button></div>`);
  VIS.at = 0; visitsLoad(true);
}

/* ---------- Daizu arrives at my place ---------- */
function daizuArrive() {
  if (typeof S === "undefined" || !S) return;
  if (DZ.scene && document.getElementById("sheet").hidden) { if (!DZ.scene.done) DZ.shown[DZ.scene.id] = 0; DZ.scene = null; }
  const x = DZ.list.find(y => !y.mine && y.status === "sent" && !DZ.shown[y.id] && CATS[catOf(y)].ready && (CATS[catOf(y)].arrive !== "night" || isNight()));
  if (!x || DZ.scene || !document.getElementById("sheet").hidden) return;
  DZ.shown[x.id] = 1; DZ.scene = { id: x.id, from: x.other_name, cat: catOf(x), wish: wishOf(x.id), step: "knock", fromTeacher: isTeacherTrip(x), msg: x.msg || "" };
  dzRender(); [0, .25, .5].forEach(w => tone(50, w, .12, .25));
}
function myTreats() {
  const R = roomOf(), seen = {};
  return R.items.filter(i => CATFOOD.includes(i.id) && !seen[i.id] && (seen[i.id] = 1));
}
function dzRender() {
  const sc = DZ.scene; if (!sc) return;
  if (sc.step === "knock") return openSheet(`<div class="stack knock" style="text-align:center"><div class="knock-door">🚪<span class="knock-q">?</span></div>
   <h2>${t("dz_knockH")}</h2><div class="muted">${sc.fromTeacher ? t("dz_knockT") : t("dz_knockF", { name: esc(sc.from) })}</div>
   <button class="btn block big-open" data-dz="open">🚪 ${t("dz_open")}</button></div>`);
  const fromT = sc.fromTeacher;
  const pic = { peek: "guitar", sing: "guitar", ask: "paw", gift: "paw", kiss: "kiss", angry: "angry" }[sc.step];
  const C = CATS[sc.cat], W = itemOf(sc.wish);
  const bubble = { peek: C.enter === "ghost" ? t("dz_ghost", { cat: C.n }) : t("dz_bang", { cat: C.n }), sing: `<span id="dzLyric">${t("dz_l1")}</span>`,
    ask: `${t("dz_wish", { food: esc(W.n) })}<span class="dz-wish">${itemImg(sc.wish)}</span>`, gift: `${t("tc_gift")}${sc.msg ? `<br><b>“${esc(sc.msg)}”</b>` : ""}`, kiss: fromT ? t("tc_bye") : sc.gotWish ? t("dz_thanksBig") : t("dz_thanksSoSo", { food: esc(W.n) }), angry: t("dz_hmph", { cat: C.n }) }[sc.step];
  let ctl = "";
  if (sc.step === "peek") ctl = `<button class="btn" data-dz="sing">🎸 ${t("dz_listen")}</button>`;
  if (sc.step === "ask") {
    const tr = myTreats();
    ctl = `<div class="label">${t("dz_giveH")}</div>${tr.length ? `<div class="tray">${tr.map(i => `<button data-dz="feed" data-id="${i.u}" aria-label="${esc(itemOf(i.id).n)}">${itemImg(i.id)}</button>`).join("")}</div>` : `<div class="muted small">${t("dz_noTreats")}</div>
`}
      ${!tr.some(i => i.id === sc.wish) && (S.coins || 0) >= itemOf(sc.wish).p ? `<button class="btn soft" data-dz="buyfeed">${t("dz_buyWish", { food: esc(itemOf(sc.wish).n) })} · ${I.coin}${itemOf(sc.wish).p}</button>` : ""}
      <button class="btn ghost" data-dz="refuse">${t("dz_refuse")}</button>`;
  }
  if (sc.step === "gift") ctl = `<button class="btn" data-dz="thank">💖 ${t("tc_thankBtn")} · +${I.coin}5</button>`;
  if (sc.step === "kiss" || sc.step === "angry") ctl = `<button class="btn" data-dz="end">← ${t("dz_back")}</button>`;
  openSheet(`<div class="stack"><div class="act-head"><h2>🐱 ${fromT ? t("tc_fromTeacher", { cat: C.n }) : t("dz_title", { name: esc(sc.from), cat: C.n })}</h2><span class="purse" id="dzPurse">${I.coin}<b>${(S.coins || 0) - (sc.step === "kiss" && sc.coins && !sc.counted ? sc.coins : 0)}</b></span>${sc.step === "kiss" || sc.step === "angry" ? `<button class="icon-btn" data-dz="end" aria-label="Close">${I.close}</button>` : ""}</div>
  <div class="dz-say">${bubble}</div>
  ${sc.step === "kiss" && sc.coins ? `<div class="coinfly" aria-live="polite">${Array.from({ length: sc.coins }, (_, i) => `<span style="--i:${i}">${I.coin}</span>`).join("")}<b id="coinCount">+0</b></div>` : ""}
  <div class="dz-stage ${roomOf().me.x > 50 ? "dz-left" : ""} ${sc.step === "peek" ? "dz-enter-" + C.enter : ""} ${isNight() ? "night" : ""}">${sc.step === "peek" && C.enter === "bang" ? `<span class="dz-boom">BAM!</span>` : ""}${friendRoomHTML({ room: S.room, avatar: S.avatar, stars: S.stars })}
   <div class="dz-cat dz-${sc.step} ${C.enter === "ghost" ? "dz-ghostcat" : ""}"><img src="${ART}${sc.cat}_${pic}.webp" alt="${C.n}">${sc.step === "sing" ? `<span class="notes go"><i>♪</i><i>♫</i><i>♪</i><i>♬</i></span>` : ""}${sc.step === "kiss" ? `<span class="dz-hearts">💋 ♥ ♥</span>` : ""}${sc.step === "angry" ? `<span class="dz-puff">💢</span>` : ""}</div></div>
  ${ctl}</div>`, true);
}
/* each cat has its own song (all played on the piano), 4 lines of about 1.4 s */
function dzSong(cat) {
  cat = CATS[cat] ? cat : "daizu";
  const T = (m, w, d, v = .26) => tone(m, w, d, v), CH = (ns, w, d, v = .16) => ns.forEach((m, k) => tone(m, w + k * .02, d, v));
  if (cat === "daizu") {   /* flamenco: Andalusian cadence Am–G–F–E */
    const ch = [[45, 57, 60, 64], [43, 55, 59, 62], [41, 53, 57, 60], [40, 52, 56, 59, 64]];
    [0, 1.4, 2.8, 4.2].forEach((w, i) => { ch[i].forEach((m, k) => tone(m, w + k * .03, 1.3, .2)); ch[i].slice(1).forEach((m, k) => tone(m, w + .7 + k * .025, .6, .14)); });
    [[76, 0, .35], [77, .35, .35], [76, .7, .7], [74, 1.4, .35], [72, 1.75, .35], [71, 2.1, .7], [72, 2.8, .35], [71, 3.15, .35], [69, 3.5, .7], [68, 4.2, 1.2]].forEach(([m, w, d]) => T(m, w + .02, d * 1.3, .3));
  } else if (cat === "kuriito") {   /* bright pop song: C–G–Am–F, bouncy */
    [[48, 55, 60, 64], [43, 55, 59, 62], [45, 57, 60, 64], [41, 53, 57, 60]].forEach((c, i) => { CH(c, i * 1.4, .6); CH(c.slice(1), i * 1.4 + .7, .5, .12); });
    [[72, 0], [72, .35], [76, .7], [79, 1.05], [79, 1.4], [77, 1.75], [76, 2.1], [74, 2.45], [76, 2.8], [77, 3.15], [79, 3.5], [81, 3.85], [79, 4.2], [76, 4.55], [72, 4.9]].forEach(([m, w]) => T(m, w, .4, .3));
  } else if (cat === "matcha") {   /* magic: whole-tone sparkles and a spell going up */
    const wt = [72, 74, 76, 78, 80, 82, 84, 86, 88, 90];
    [0, 2.8].forEach(w0 => wt.forEach((m, i) => T(m, w0 + i * .07, .5, .14)));
    [1.4, 4.2].forEach(w0 => wt.slice().reverse().forEach((m, i) => T(m, w0 + i * .07, .5, .12)));
    [[48, 52, 56], [50, 54, 58], [52, 56, 60], [48, 52, 56, 60]].forEach((c, i) => CH(c, i * 1.4, 1.3, .14));
    [[84, .6], [90, 2], [86, 3.4], [96, 4.9]].forEach(([m, w]) => T(m, w, .9, .18));
  } else if (cat === "azuki") {   /* elegant jazz: swing with walking bass, Gm7–C7–Fmaj7–D7 */
    const ch = [[55, 58, 62, 65], [52, 55, 58, 64], [53, 57, 60, 64], [54, 57, 60, 66]], bass = [[43, 46, 48, 50], [48, 46, 45, 43], [41, 45, 48, 41], [50, 48, 45, 42]];
    ch.forEach((c, i) => { CH(c, i * 1.4 + .02, .5, .13); CH(c, i * 1.4 + .95, .3, .1); bass[i].forEach((m, k) => T(m, i * 1.4 + k * .35, .32, .22)); });
    [[74, 0], [72, .47], [70, .7], [69, 1.17], [67, 1.4], [70, 1.87], [72, 2.1], [76, 2.57], [77, 2.8], [76, 3.27], [74, 3.5], [72, 3.97], [74, 4.2], [70, 4.67], [69, 4.9]].forEach(([m, w]) => T(m, w, .36, .26));
  } else {   /* Sakura's lullaby: slow and soft, in three */
    [[45, 52, 57], [50, 53, 57], [45, 52, 57], [40, 52, 56]].forEach((c, i) => { T(c[0], i * 1.4, 1.3, .14); T(c[1], i * 1.4 + .47, .5, .09); T(c[2], i * 1.4 + .93, .5, .09); });
    [[76, 0, .9], [74, .93, .47], [72, 1.4, .93], [69, 2.33, .47], [72, 2.8, .93], [74, 3.73, .47], [71, 4.2, 1.4]].forEach(([m, w, d]) => T(m, w, d * 1.2, .2));
  }
  const L = [1, 2, 3, 4].map(n => t(cat === "daizu" ? "dz_l" + n : "dz_l_" + cat + n));
  L.forEach((l, i) => setTimeout(() => { const e = document.getElementById("dzLyric"); if (e) e.textContent = l; }, i * 1400));
}
/* door sounds: a cat bursts the door open (BAM!), a ghost floats in (whoooo) */
function dzNoise(c, dur) { const b = c.createBuffer(1, Math.floor(c.sampleRate * dur), c.sampleRate), d = b.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / d.length, 2); const s = c.createBufferSource(); s.buffer = b; return s; }
function dzBang() {
  const c = ac(); if (!c || c.state !== "running") return false; const t0 = c.currentTime + .02;
  const n = dzNoise(c, .35), f = c.createBiquadFilter(), g = c.createGain(); f.type = "lowpass"; f.frequency.value = 900; g.gain.setValueAtTime(.9, t0); g.gain.exponentialRampToValueAtTime(.001, t0 + .35); n.connect(f); f.connect(g); g.connect(outNode()); n.start(t0);
  const o = c.createOscillator(), og = c.createGain(); o.frequency.setValueAtTime(120, t0); o.frequency.exponentialRampToValueAtTime(40, t0 + .3); og.gain.setValueAtTime(.8, t0); og.gain.exponentialRampToValueAtTime(.001, t0 + .4); o.connect(og); og.connect(outNode()); o.start(t0); o.stop(t0 + .45);
  [0, .09].forEach(w => { const k = c.createOscillator(), kg = c.createGain(); k.type = "square"; k.frequency.value = 180; kg.gain.setValueAtTime(.12, t0 + .25 + w); kg.gain.exponentialRampToValueAtTime(.001, t0 + .31 + w); k.connect(kg); kg.connect(outNode()); k.start(t0 + .25 + w); k.stop(t0 + .33 + w); });
  return true;
}
function dzWhoosh() {
  const c = ac(); if (!c || c.state !== "running") return false; const t0 = c.currentTime + .02;
  const n = dzNoise(c, 1.4), f = c.createBiquadFilter(), g = c.createGain(); f.type = "bandpass"; f.Q.value = 3; f.frequency.setValueAtTime(300, t0); f.frequency.exponentialRampToValueAtTime(2200, t0 + 1.2); g.gain.setValueAtTime(.001, t0); g.gain.linearRampToValueAtTime(.5, t0 + .5); g.gain.exponentialRampToValueAtTime(.001, t0 + 1.4); n.connect(f); f.connect(g); g.connect(outNode()); n.start(t0);
  const o = c.createOscillator(), og = c.createGain(), lfo = c.createOscillator(), lg = c.createGain(); o.type = "sine"; o.frequency.setValueAtTime(520, t0); o.frequency.linearRampToValueAtTime(780, t0 + 1.3); lfo.frequency.value = 6; lg.gain.value = 18; lfo.connect(lg); lg.connect(o.frequency);
  og.gain.setValueAtTime(.001, t0); og.gain.linearRampToValueAtTime(.12, t0 + .4); og.gain.exponentialRampToValueAtTime(.001, t0 + 1.5); o.connect(og); og.connect(outNode()); o.start(t0); lfo.start(t0); o.stop(t0 + 1.6); lfo.stop(t0 + 1.6);
  return true;
}
const dzEnterSound = cat => (CATS[cat]?.enter === "ghost" ? dzWhoosh : dzBang)();
async function dzFinish(fed, food) {
  const sc = DZ.scene; if (!sc || sc.done) return; sc.done = true; sc.gotWish = food === sc.wish;
  try { await dzrpc("daizu_answer", { trip: sc.id, fed, food_: food || "" }); } catch (e) { toast(e.message); }
  if (fed) { sc.coins = sc.gotWish ? 5 : 2; S.coins += sc.coins; roomOf().happy++; save(); ding(true); [84, 88, 91].forEach((m, i) => tone(m, i * .12, .5, .18)); }
  else { tone(45, 0, .5, .3); tone(44, .25, .7, .3); }
  sc.step = fed ? "kiss" : "angry"; dzRender(); if (fed) coinCount(sc.coins);
}
document.addEventListener("click", e => {
  const b = e.target.closest("[data-dz]"); if (!b || !S) return;
  const a = b.dataset.dz, sc = DZ.scene;
  if (a === "send") daizuSendSheet(b.dataset.id);
  else if (a === "go") daizuGo(b.dataset.id, b.dataset.cat);
  else if (a === "open" && sc && sc.step === "knock") { ac(); sc.step = "peek"; sc.banged = true; dzRender(); setTimeout(() => dzEnterSound(sc.cat), 40); }
  else if (a === "sing" && sc) { ac(); sc.step = "sing"; dzRender(); const late = !sc.banged && (sc.banged = true); if (late) setTimeout(() => dzEnterSound(sc.cat), 30); setTimeout(() => dzSong(sc.cat), late ? 700 : 0); setTimeout(() => { if (DZ.scene === sc && sc.step === "sing") { sc.step = sc.fromTeacher ? "gift" : "ask"; dzRender(); } }, 6200); }
  else if (a === "thank" && sc && !sc.done) { sc.done = true; dzrpc("daizu_answer", { trip: sc.id, fed: true, food_: "" }).catch(e => toast(e.message)); S.coins += 5; save(); sc.coins = 5; sc.step = "kiss"; dzRender(); coinCount(5); }
  else if (a === "toT") catToTeacherSheet();
  else if (a === "goT") catToTeacherGo(b.dataset.cat);
  else if (a === "msgT") { DZ.tmsg = b.dataset.v; catToTeacherSheet(); }
  else if (a === "feed" && sc) { const R = roomOf(), i = R.items.find(x => x.u === b.dataset.id); if (!i) return; R.items = R.items.filter(x => x !== i); save(); dzFinish(true, i.id); }
  else if (a === "buyfeed" && sc) { const w = itemOf(sc.wish); if ((S.coins || 0) < w.p) return; S.coins -= w.p; save(); dzFinish(true, sc.wish); }
  else if (a === "refuse" && sc) dzFinish(false);
  else if (a === "end") { DZ.scene = null; closeSheet(); VIS.at = 0; visitsLoad(true); }
});

/* ---------- a cat for my teacher ("I practised!", "Homework done!", "Thank you!") — free, no visit permission needed ---------- */
const T_MSGS = ["tc_m_practised", "tc_m_homework", "tc_m_thanks", "tc_m_hard"];
function teacherCatCard() {
  const ok = readyCats().some(c => !sentTeacherToday(c));
  return `<div class="card row tcat-card"><img src="${ART}kuriito_paw.webp" alt="" class="tcat-ic"><div class="grow"><b>${t("tc_toTeacherH")}</b><div class="muted small">${t("tc_toTeacherD")}</div></div>
   <button class="btn sm ${ok ? "" : "dim"}" data-dz="toT" ${ok ? "" : "disabled"}>🐾 ${t("tc_send")}</button></div>`;
}
function catToTeacherSheet() {
  DZ.tmsg ||= T_MSGS[0];
  const card = c => { const C = CATS[c], sent = sentTeacherToday(c);
    return `<button class="tcat-pick" data-dz="goT" data-cat="${c}" ${sent ? "disabled" : ""}><img src="${ART}${c}_guitar.webp" alt=""><span>${C.n}${sent ? " ✓" : ""}</span></button>`; };
  openSheet(`<div class="stack"><div class="act-head"><h2>🐱 ${t("tc_toTeacherH")}</h2><button class="icon-btn" data-act="close" aria-label="Close">${I.close}</button></div>
   <div class="label">${t("tc_whatSay")}</div><div class="chips">${T_MSGS.map(k => `<button class="chip ${DZ.tmsg === k ? "on" : ""}" data-dz="msgT" data-v="${k}">${t(k)}</button>`).join("")}</div>
   <div class="label">${t("tc_whichCat")}</div><div class="tcat-grid">${readyCats().map(card).join("")}</div>
   <div class="muted small">${t("tc_free")}</div></div>`);
}
async function catToTeacherGo(cat) {
  let tid = "teacher";
  if (!DB.demo) { try { tid = (await DB.sel("profiles", { eq: { id: ME }, cols: "teacher_id" }))[0]?.teacher_id; } catch (e) { tid = null; } }
  if (!tid) { toast(t("tc_noTeacher")); return; }
  try { await sendCat(tid, cat, t(DZ.tmsg || T_MSGS[0])); } catch (e) { toast(e.message); return; }
  const C = CATS[cat];
  openSheet(`<div class="stack" style="text-align:center"><div class="act-head"><h2>🐾</h2><button class="icon-btn" data-act="close" aria-label="Close">${I.close}</button></div>
  <div class="dz-stage dz-leave-stage"><img class="dz-walk" src="${ART}${cat}_paw.webp" alt=""></div>
  <div class="big-msg">${t("tc_sentT", { cat: C.n })}</div><button class="btn" data-act="close">OK</button></div>`);
  await daizuLoad(); const c = document.getElementById("friendsCard"); if (c) c.outerHTML = friendsCard();
}

/* ---------- teacher side: cats arriving from students, and sending a reward cat ---------- */
let TCAT = { list: [], pick: "kuriito", msg: "" };
async function TcatLoad() { TCAT.list = await catsList(); }
function TcatInbox() {
  const inbox = TCAT.list.filter(x => !x.mine && x.status === "sent");
  const done = TCAT.list.filter(x => !x.mine && x.status !== "sent" && x.day === TK);
  if (!inbox.length && !done.length) return "";
  return `<div class="section"><h2>🐱 ${t("tc_inboxH")}</h2><div class="list">${inbox.map(x => `<div class="row tcat-in"><img src="${ART}${catOf(x)}_paw.webp" alt="" class="tcat-ic"><div class="grow"><div class="title">${t("tc_inboxLine", { name: esc(x.other_name), cat: CATS[catOf(x)].n })}</div>${x.msg ? `<div class="small">“${esc(x.msg)}”</div>` : ""}<div class="muted small">${esc(fmt(x.day))}</div></div>
   <button class="btn sm" data-tcat="thank" data-id="${esc(x.id)}">💖 ${t("tc_thankBtn")}</button></div>`).join("")}
   ${done.map(x => `<div class="row tcat-in"><img src="${ART}${catOf(x)}_kiss.webp" alt="" class="tcat-ic"><div class="grow small muted">${t("tc_thankedT", { name: esc(x.other_name), cat: CATS[catOf(x)].n })}</div></div>`).join("")}</div></div>`;
}
function TcatSendCard(sid) {
  const sentTo = c => TCAT.list.some(x => x.mine && x.other_id === sid && x.day === TK && catOf(x) === c);
  const last = TCAT.list.find(x => x.mine && x.other_id === sid);
  return `<div class="card stack teacher tcat-send"><div class="section-head"><h2>🐱 ${t("tc_sendH")}</h2></div><div class="muted small">${t("tc_sendD")}</div>
   <div class="tcat-grid">${readyCats().map(c => `<button class="tcat-pick ${TCAT.pick === c ? "on" : ""}" data-tcat="pick" data-v="${c}" ${sentTo(c) ? "disabled" : ""}><img src="${ART}${c}_guitar.webp" alt=""><span>${CATS[c].n}${sentTo(c) ? " ✓" : ""}</span></button>`).join("")}</div>
   <div class="chips">${["tc_p_great", "tc_p_hw", "tc_p_proud"].map(k => `<button class="chip" data-tcat="pmsg" data-v="${k}">${t(k)}</button>`).join("")}</div>
   <input id="tcatMsg" maxlength="80" value="${esc(TCAT.msg)}" placeholder="${t("tc_msgPh")}">
   <button class="btn" data-tcat="send" data-id="${esc(sid)}">🐾 ${t("tc_sendBtn", { cat: CATS[TCAT.pick]?.n || "" })}</button>
   ${last ? `<div class="muted small">${last.status === "sent" ? t("tc_lastWait", { cat: CATS[catOf(last)].n }) : t("tc_lastThanked", { cat: CATS[catOf(last)].n })}</div>` : ""}</div>`;
}
document.addEventListener("click", async e => {
  const b = e.target.closest("[data-tcat]"); if (!b || typeof TS === "undefined" || !TS?.me) return;
  const a = b.dataset.tcat, keep = () => { const i = document.getElementById("tcatMsg"); if (i) TCAT.msg = i.value.slice(0, 80); };
  if (a === "pick") { keep(); TCAT.pick = b.dataset.v; TrenderDetail(); }
  else if (a === "pmsg") { TCAT.msg = t(b.dataset.v); TrenderDetail(); }
  else if (a === "send") {
    keep(); b.disabled = true;
    try { await sendCat(b.dataset.id, TCAT.pick, TCAT.msg); toast(t("tc_sentS", { cat: CATS[TCAT.pick].n })); TCAT.msg = ""; } catch (err) { toast(err.message); }
    await TcatLoad(); TrenderDetail();
  }
  else if (a === "thank") {
    b.disabled = true;
    try { await dzrpc("daizu_answer", { trip: b.dataset.id, fed: true, food_: "" }); [84, 88, 91].forEach((m, i) => tone(m, i * .12, .5, .18)); } catch (err) { toast(err.message); }
    await TcatLoad(); Trefresh();
  }
});

/* coins fly up into the purse one by one (clink, clink…), then a rainbow sparkle and a magic sound */
function coinCount(n) {
  const sc = DZ.scene, purse = document.getElementById("dzPurse"), num = purse?.querySelector("b"); let have = +(num?.textContent || 0);
  for (let i = 1; i <= n; i++) setTimeout(() => {
    const coin = document.querySelector(`.coinfly span[style*="--i:${i - 1}"]`), c = document.getElementById("coinCount");
    if (c) c.textContent = "+" + i;
    if (coin && purse && coin.animate) { const a = coin.getBoundingClientRect(), b = purse.getBoundingClientRect();
      coin.animate([{ transform: "none", opacity: 1 }, { transform: `translate(${b.left - a.left}px,${b.top - a.top}px) scale(.5)`, opacity: .2 }], { duration: 420, easing: "cubic-bezier(.5,0,.8,.4)", fill: "forwards" }); }
    setTimeout(() => { if (num) { num.textContent = ++have; purse.classList.remove("bump"); void purse.offsetWidth; purse.classList.add("bump"); } tone(88 + (i % 2) * 3, 0, .15, .2); tone(96, .04, .1, .1); }, 420);
    if (i === n) setTimeout(() => { if (sc) sc.counted = true; dzRainbow(); refreshTop?.(); }, 900);
  }, 1300 + i * 420);
}
function dzRainbow() {
  const p = document.getElementById("panel"); if (!p) return;
  const fx = document.createElement("div"); fx.className = "rainbow-fx"; fx.innerHTML = Array.from({ length: 26 }, (_, i) => `<i style="--x:${Math.random() * 100}%;--d:${(Math.random() * .8).toFixed(2)}s;--h:${i * 14}">${["✦", "★", "✧", "♪", "❀"][i % 5]}</i>`).join("") + `<b>✨ +5 ✨</b>`;
  p.appendChild(fx); setTimeout(() => fx.remove(), 2600);
  [72, 76, 79, 84, 88, 91, 96, 100].forEach((m, i) => tone(m, i * .06, .9, .12)); [84, 88, 91, 96].forEach(m => tone(m, .7, 1.6, .08));
}
