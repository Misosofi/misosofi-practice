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
const WISH = ["f_banana", "f_apple", "f_candy", "f_donut", "f_icecream", "f_cake", "f_macarons"];
const wishOf = id => { let h = 0; for (const c of String(id)) h = (h * 31 + c.charCodeAt(0)) >>> 0; return WISH[h % WISH.length]; };

function demoDaizu(fn, a) {
  const K = "misosofi-demo-daizu", st = (() => { try { return JSON.parse(localStorage.getItem(K)) || {}; } catch (e) { return {}; } })();
  st.t ??= [];
  const put = () => { try { localStorage.setItem(K, JSON.stringify(st)); } catch (e) { } };
  const names = { "demo-mia": ["Mia", { animal: "bunny", outfit: "dress", bg: 1 }], "demo-kenta": ["Kenta", { animal: "boy", outfit: "jacket", bg: 4 }], "demo-yuki": ["Yuki", { animal: "tofu", outfit: "plain", bg: 2 }] };
  if (!st.t.some(x => x.from === "demo-kenta" && x.day === TK)) st.t.unshift({ id: "dz-in-" + TK, from: "demo-kenta", to: "me", day: TK, cat: "daizu", status: "sent", food: "" });
  let out = null;
  if (fn === "daizu_mine") out = st.t.map(x => { const o = names[x.from === "me" ? x.to : x.from]; return { id: x.id, day: x.day, cat: x.cat || "daizu", status: x.status, food: x.food, other_name: o[0], other_avatar: o[1], mine: x.from === "me" }; });
  else if (fn === "send_daizu") { if (st.t.some(x => x.from === "me" && x.day === TK && x.cat === a.cat_)) throw new Error("This cat already went out today"); st.t.unshift({ id: "dz-" + uid(), from: "me", to: a.target, day: TK, cat: a.cat_, status: "fed", food: "f_banana" }); }
  else if (fn === "daizu_answer") { const x = st.t.find(y => y.id === a.trip); x.status = a.fed ? "fed" : "angry"; x.food = a.food_ || ""; }
  put(); return out;
}
const dzrpc = (fn, a) => DB.demo ? Promise.resolve(demoDaizu(fn, a)) : DB.rpc(fn, a);

async function daizuLoad() { try { DZ.list = (await dzrpc("daizu_mine")) || []; } catch (e) { DZ.list = []; } payDaizuKisses(); }
const sentToday = cat => DZ.list.find(x => x.mine && x.day === TK && catOf(x) === cat);
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
  const line = x => { const o = { name: esc(x.other_name), cat: CATS[catOf(x)].n, food: esc(itemOf(x.food)?.n || t("dz_aTreat")) }; return x.status === "sent" ? t("dz_onWay", o) : x.status === "fed" ? t("dz_fedNews", o) : t("dz_angryNews", o); };
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
  if (DZ.scene && document.getElementById("sheet").hidden) { if (!DZ.scene.done) DZ.shown[DZ.scene.id] = 0; DZ.scene = null; }
  const x = DZ.list.find(y => !y.mine && y.status === "sent" && !DZ.shown[y.id] && CATS[catOf(y)].ready && (CATS[catOf(y)].arrive !== "night" || isNight()));
  if (!x || DZ.scene || !document.getElementById("sheet").hidden) return;
  DZ.shown[x.id] = 1; DZ.scene = { id: x.id, from: x.other_name, cat: catOf(x), wish: wishOf(x.id), step: "peek" };
  dzRender();
}
function myTreats() {
  const R = roomOf(), seen = {};
  return R.items.filter(i => itemOf(i.id)?.cat === "food" && !seen[i.id] && (seen[i.id] = 1));
}
function dzRender() {
  const sc = DZ.scene; if (!sc) return;
  const pic = { peek: "guitar", sing: "guitar", ask: "paw", kiss: "kiss", angry: "angry" }[sc.step];
  const C = CATS[sc.cat], W = itemOf(sc.wish);
  const bubble = { peek: C.enter === "ghost" ? t("dz_ghost", { cat: C.n }) : t("dz_bang", { cat: C.n }), sing: `<span id="dzLyric">${t("dz_l1")}</span>`,
    ask: `${t("dz_wish", { food: esc(W.n) })}<span class="dz-wish">${itemImg(sc.wish)}</span>`, kiss: sc.gotWish ? t("dz_thanksBig") : t("dz_thanksSoSo", { food: esc(W.n) }), angry: t("dz_hmph", { cat: C.n }) }[sc.step];
  let ctl = "";
  if (sc.step === "peek") ctl = `<button class="btn" data-dz="sing">🎸 ${t("dz_listen")}</button>`;
  if (sc.step === "ask") {
    const tr = myTreats();
    ctl = `<div class="label">${t("dz_giveH")}</div>${tr.length ? `<div class="tray">${tr.map(i => `<button data-dz="feed" data-id="${i.u}" aria-label="${esc(itemOf(i.id).n)}">${itemImg(i.id)}</button>`).join("")}</div>` : `<div class="muted small">${t("dz_noTreats")}</div>
`}
      ${!tr.some(i => i.id === sc.wish) && (S.coins || 0) >= itemOf(sc.wish).p ? `<button class="btn soft" data-dz="buyfeed">${t("dz_buyWish", { food: esc(itemOf(sc.wish).n) })} · ${I.coin}${itemOf(sc.wish).p}</button>` : ""}
      <button class="btn ghost" data-dz="refuse">${t("dz_refuse")}</button>`;
  }
  if (sc.step === "kiss" || sc.step === "angry") ctl = `<button class="btn" data-dz="end">OK</button>`;
  openSheet(`<div class="stack"><div class="act-head"><h2>🐱 ${t("dz_title", { name: esc(sc.from), cat: C.n })}</h2>${sc.step === "kiss" || sc.step === "angry" ? `<button class="icon-btn" data-dz="end" aria-label="Close">${I.close}</button>` : ""}</div>
  <div class="dz-stage ${sc.step === "peek" ? "dz-enter-" + C.enter : ""} ${isNight() ? "night" : ""}">${sc.step === "peek" && C.enter === "bang" ? `<span class="dz-boom">BAM!</span>` : ""}${friendRoomHTML({ room: S.room, avatar: S.avatar, stars: S.stars })}
   <div class="dz-cat dz-${sc.step} ${C.enter === "ghost" ? "dz-ghostcat" : ""}"><div class="dz-bubble">${bubble}</div><img src="${ART}${sc.cat}_${pic}.webp" alt="${C.n}">${sc.step === "sing" ? `<span class="notes go"><i>♪</i><i>♫</i><i>♪</i><i>♬</i></span>` : ""}${sc.step === "kiss" ? `<span class="dz-hearts">💋 ♥ ♥</span>` : ""}${sc.step === "angry" ? `<span class="dz-puff">💢</span>` : ""}</div></div>
  ${ctl}</div>`, true);
}
/* a flamenco "I'm hungry" song on the piano: the Andalusian cadence Am–G–F–E with a strummed feel and a little sung line */
function dzSong() {
  const ch = [[45, 57, 60, 64], [43, 55, 59, 62], [41, 53, 57, 60], [40, 52, 56, 59, 64]];
  [0, 1.4, 2.8, 4.2].forEach((w, i) => { ch[i].forEach((m, k) => tone(m, w + k * .03, 1.3, .2)); ch[i].slice(1).forEach((m, k) => tone(m, w + .7 + k * .025, .6, .14)); });
  [[76, 0, .35], [77, .35, .35], [76, .7, .7], [74, 1.4, .35], [72, 1.75, .35], [71, 2.1, .7], [72, 2.8, .35], [71, 3.15, .35], [69, 3.5, .7], [68, 4.2, 1.2]].forEach(([m, w, d]) => tone(m, w + .02, d * 1.3, .3));
  const L = [t("dz_l1"), t("dz_l2"), t("dz_l3"), t("dz_l4")];
  L.forEach((l, i) => setTimeout(() => { const e = document.getElementById("dzLyric"); if (e) e.textContent = l; }, i * 1400));
}
async function dzFinish(fed, food) {
  const sc = DZ.scene; if (!sc || sc.done) return; sc.done = true; sc.gotWish = food === sc.wish;
  try { await dzrpc("daizu_answer", { trip: sc.id, fed, food_: food || "" }); } catch (e) { toast(e.message); }
  if (fed) { S.coins += sc.gotWish ? 5 : 2; roomOf().happy++; save(); ding(true); [84, 88, 91].forEach((m, i) => tone(m, i * .12, .5, .18)); }
  else { tone(45, 0, .5, .3); tone(44, .25, .7, .3); }
  sc.step = fed ? "kiss" : "angry"; dzRender();
}
document.addEventListener("click", e => {
  const b = e.target.closest("[data-dz]"); if (!b || !S) return;
  const a = b.dataset.dz, sc = DZ.scene;
  if (a === "send") daizuSendSheet(b.dataset.id);
  else if (a === "go") daizuGo(b.dataset.id, b.dataset.cat);
  else if (a === "sing" && sc) { sc.step = "sing"; dzRender(); dzSong(); setTimeout(() => { if (DZ.scene === sc && sc.step === "sing") { sc.step = "ask"; dzRender(); } }, 6200); }
  else if (a === "feed" && sc) { const R = roomOf(), i = R.items.find(x => x.u === b.dataset.id); if (!i) return; R.items = R.items.filter(x => x !== i); save(); dzFinish(true, i.id); }
  else if (a === "buyfeed" && sc) { const w = itemOf(sc.wish); if ((S.coins || 0) < w.p) return; S.coins -= w.p; save(); dzFinish(true, sc.wish); }
  else if (a === "refuse" && sc) dzFinish(false);
  else if (a === "end") { DZ.scene = null; closeSheet(); VIS.at = 0; visitsLoad(true); }
});
