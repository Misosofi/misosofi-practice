/* ===== Animal friends (3D clay pictures), coin shop, the student's own room and the growing instrument =====
   Pictures live in assets/art/*.webp (all original, generated for Misosofi).
   Avatar data: { animal, outfit, shape, bg } */
const ART = "assets/art/";
const ANIMALS = ["boy", "girl", "bunny", "cat", "dog", "panda", "fox", "penguin", "hamster", "tofu", "edamame", "tako", "pudding", "ebi"];
const OUTFITS = ["tee", "dress", "hoodie"];
/* the two kids have their own clothes */
const KID_OUTFITS = { boy: ["hoodie", "jacket", "tee"], girl: ["jacket", "raincoat", "overalls"], tofu: ["plain"], edamame: ["plain"], tako: ["plain"], pudding: ["plain"], ebi: ["plain"] };
const outfitsOf = an => KID_OUTFITS[an] || OUTFITS;
const SHAPES = { round: 1.1, normal: 1, slim: 0.9 };
const AVBG = ["#EFEAFF", "#FFE6EF", "#E2F7EE", "#FFF0DC", "#E1F1FF", "#FFF7CC", "#2A2F45"];

/* older avatars (drawn faces or the first animal version) are moved to the new pictures once */
function petOf(a) {
  a = a || {};
  const g = (typeof S !== "undefined" && S && S.profile && S.profile.gender) || "";
  const animal = ANIMALS.includes(a.animal) ? a.animal : g === "boy" ? "dog" : g === "girl" ? "bunny" : "cat";
  const list = outfitsOf(animal);
  const outfit = list.includes(a.outfit) ? a.outfit : KID_OUTFITS[animal] ? list[0] : a.outfit === "overalls" || a.outfit === "sailor" ? "tee" : g === "girl" ? "dress" : "tee";
  return { animal, outfit, shape: SHAPES[a.shape] ? a.shape : "normal", bg: Math.min(+a.bg || 0, AVBG.length - 1) };
}
const petSrc = a => ART + a.animal + "_" + a.outfit + ".webp";
const HEADCROP = { bunny: [128, 30], cat: [118, 8], dog: [104, 8], panda: [118, 6], fox: [118, 10], penguin: [122, 10], hamster: [118, 8], boy: [112, 4], girl: [118, 6], tofu: [100, 40], edamame: [150, 14], tako: [125, 22], pudding: [100, 45], ebi: [150, 26] };

/* the character: full body, or just the head for small round pictures */
function avatarSVG(a, o = {}) {
  a = petOf(a);
  const sc = SHAPES[a.shape] || 1;
  const hc = HEADCROP[a.animal];
  if (o.head) return `<span class="pet-head" style="background-image:url('${petSrc(a)}');background-size:${hc[0]}% auto;background-position:50% ${hc[1]}%;${o.bg === false ? "" : `background-color:${AVBG[a.bg]}`}" role="img" aria-label="${esc(a.animal)}"></span>`;
  return `<span class="pet-full" style="${o.room || o.bg === false ? "" : `background:${AVBG[a.bg]};`}"><img src="${petSrc(a)}" alt="${esc(a.animal)}" draggable="false" style="transform:scaleX(${sc})"></span>`;
}

/* ---------- shop catalogue: everything is placed in the room ----------
   w = width in the room (% of the room's width); multi = can buy more than one; food can be given to your friend */
const ITEMS = [
  { id: "f_banana", cat: "food", n: "Banana", p: 8, w: 13, multi: 1 }, { id: "f_apple", cat: "food", n: "Apple", p: 8, w: 10, multi: 1 },
  { id: "f_candy", cat: "food", n: "Lollipop", p: 10, w: 9, multi: 1 }, { id: "f_donut", cat: "food", n: "Donut", p: 15, w: 11, multi: 1 },
  { id: "f_icecream", cat: "food", n: "Ice cream", p: 18, w: 9, multi: 1 }, { id: "f_cake", cat: "food", n: "Strawberry cake", p: 25, w: 12, multi: 1 },
  { id: "f_macarons", cat: "food", n: "Macaron tower", p: 35, w: 12, multi: 1 },
  { id: "b_backpack", cat: "bag", n: "Music backpack", p: 40, w: 13 }, { id: "b_heartpurse", cat: "bag", n: "Heart bag", p: 60, w: 13 },
  { id: "j_jewelbox", cat: "bag", n: "Jewellery box", p: 80, w: 13 }, { id: "j_crown", cat: "bag", n: "Crown", p: 120, w: 11 },
  { id: "r_bike", cat: "ride", n: "Bicycle", p: 80, w: 30 }, { id: "r_train", cat: "ride", n: "Toy train", p: 90, w: 30 }, { id: "r_car", cat: "ride", n: "Red car", p: 150, w: 28 },
  { id: "h_gift", cat: "home", n: "Present", p: 20, w: 12, multi: 1 }, { id: "h_plant", cat: "home", n: "Plant", p: 25, w: 13, multi: 1 },
  { id: "h_shelf", cat: "home", n: "Bookshelf", p: 50, w: 17 }, { id: "h_sofa", cat: "home", n: "Sofa", p: 70, w: 32 }, { id: "h_bed", cat: "home", n: "Bed", p: 80, w: 34 },
  { id: "room_pink", cat: "room", n: "Pink room", p: 0 }, { id: "room_yellow", cat: "room", n: "Sunny room", p: 40 },
  { id: "room_mint", cat: "room", n: "Night room", p: 50 }, { id: "room_music", cat: "room", n: "Music room", p: 60 },
  { id: "room_city", cat: "room", n: "City loft", p: 70 },
  { id: "r_skate", cat: "ride", n: "Skateboard", p: 60, w: 18 }, { id: "h_futon", cat: "home", n: "Futon", p: 35, w: 30 },
  { id: "t_robot", cat: "toy", n: "Robot", p: 45, w: 12 }, { id: "t_dino", cat: "toy", n: "Dino", p: 45, w: 13 },
  { id: "t_rocket", cat: "toy", n: "Rocket", p: 55, w: 11 }, { id: "r_guitar", cat: "toy", n: "Guitar", p: 70, w: 11 },
];
const itemOf = id => ITEMS.find(i => i.id === id);
const SHOPCATS = ["food", "toy", "bag", "ride", "home", "room"];

/* the piano grows with your stars */
const INSTR = [
  { id: "i1_paper", n: "Paper keyboard", stars: 0, w: 20 }, { id: "i2_melodica", n: "Melodica", stars: 3, w: 22 },
  { id: "i3_toykeys", n: "Toy keyboard", stars: 8, w: 24 }, { id: "i4_keyboard", n: "Keyboard", stars: 15, w: 30 },
  { id: "i5_digital", n: "Digital piano", stars: 25, w: 30 }, { id: "i6_upright", n: "Upright piano", stars: 40, w: 32 },
  { id: "i7_grand", n: "Grand piano", stars: 60, w: 36 }, { id: "i8_concert", n: "Concert grand", stars: 90, w: 40 },
];
const instrNow = () => { let k = 0; INSTR.forEach((x, i) => { if ((S.stars || 0) >= x.stars) k = i; }); return k; };
const itemImg = id => `<img src="${ART}${id}.webp" alt="" draggable="false" loading="lazy">`;

/* ---------- the room ---------- */
function roomOf() {
  if (!S.room || !Array.isArray(S.room.items)) S.room = {};
  const R = S.room;
  if (!itemOf(R.bg)) R.bg = "room_pink";
  R.owned = (R.owned || []).filter(id => itemOf(id)); if (!R.owned.includes("room_pink")) R.owned.unshift("room_pink");
  R.items = (R.items || []).filter(i => itemOf(i.id));
  R.me ||= { x: 62, y: 92 }; R.inst ||= { x: 28, y: 86 };
  R.happy = +R.happy || 0;
  return R;
}
let ROOM = { edit: false, sel: null, drag: null, cat: "food" };

/* what the thief leaves behind: a cracked window and cobwebs (drawn, not pictures) */
const CRACKS = `<svg class="th-crack" viewBox="0 0 100 60" aria-hidden="true"><g fill="none" stroke="#fff" stroke-width=".7" stroke-linecap="round" opacity=".9"><path d="M50 22 L44 8 L41 2 M50 22 L58 6 M50 22 L66 20 L80 16 M50 22 L62 34 L70 46 M50 22 L40 30 L30 40 M50 22 L34 20 L22 15 M44 8 L36 6 M62 34 L74 34 M40 30 L42 42"/><circle cx="50" cy="22" r="1.6" fill="#fff"/></g></svg>`;
const WEB = (x, y, r, rot) => { let s = `<g transform="translate(${x} ${y}) rotate(${rot})">`; for (let i = 0; i <= 6; i++) { const a = i * 15 * Math.PI / 180; s += `<line x1="0" y1="0" x2="${(r * Math.cos(a)).toFixed(1)}" y2="${(r * Math.sin(a)).toFixed(1)}"/>`; } for (let k = 1; k <= 4; k++) { const rr = r * k / 4; let d = ""; for (let i = 0; i <= 6; i++) { const a = i * 15 * Math.PI / 180; d += (i ? " Q" + ((rr * .82) * Math.cos(a - .13)).toFixed(1) + " " + ((rr * .82) * Math.sin(a - .13)).toFixed(1) + " " : "M") + (rr * Math.cos(a)).toFixed(1) + " " + (rr * Math.sin(a)).toFixed(1); } s += `<path d="${d}"/>`; } return s + "</g>"; };
const WEBS = `<svg class="th-webs" viewBox="0 0 100 78" preserveAspectRatio="none" aria-hidden="true"><g fill="none" stroke="#fff" stroke-width=".35" opacity=".85">${WEB(0, 0, 22, 0)}${WEB(100, 0, 20, 90)}${WEB(0, 78, 14, -90)}</g><g stroke="#fff" stroke-width=".3"><line x1="72" y1="0" x2="72" y2="14"/></g><circle cx="72" cy="15" r="1.4" fill="#2A2438"/></svg>`;
/* night: 8 pm to 7 am, or when the student turns the lights off */
const isNight = () => { if (ROOM.lights === "off") return true; if (ROOM.lights === "on") return false; const h = new Date().getHours(); return h >= 20 || h < 7; };
/* where your friend sleeps: a bed, then a futon, otherwise on the floor */
function sleepSpot(R) {
  const on = id => R.items.find(i => i.placed && i.id === id);
  const b = on("h_bed"), f = on("h_futon");
  if (b) return { x: b.x + 1, y: b.y - 4, w: 15, where: "bed" };
  if (f) return { x: f.x + 1, y: f.y + 0.5, w: 15, where: "futon" };
  return { x: R.me.x, y: Math.min(99, R.me.y + 3), w: 15, where: "floor" };
}
function roomHTML(edit) {
  const R = roomOf(), ins = INSTR[instrNow()], night = !edit && isNight(), sp = night && !S.thief?.boxed ? sleepSpot(R) : null;
  const meY = sp ? sp.y + 0.5 : R.me.y;
  const objs = R.items.filter(i => i.placed).map(i => ({ k: "i", i, y: i.y }))
    .concat([{ k: "me", y: meY }, { k: "inst", y: R.inst.y }]).sort((a, b) => a.y - b.y);
  let toyN = 0;
  const el = o => {
    if (o.k === "me" && sp) return `<div class="ri me sleep" data-ri="me" style="left:${sp.x}%;top:${sp.y}%;width:${sp.w}%;z-index:${Math.round(meY)}">${avatarSVG(S.avatar, { room: true })}<span class="zzz">z<b>z</b><i>Z</i></span></div>`;
    if (o.k === "me") return `<div class="ri me ${ROOM.sel === "me" ? "sel" : ""}" data-ri="me" style="left:${R.me.x}%;top:${R.me.y}%;width:22%;z-index:${Math.round(R.me.y)}">${S.thief?.boxed ? `<span class="pet-full"><img src="${ART}boxed.webp" alt="" draggable="false"></span>` : avatarSVG(S.avatar, { room: true })}<span class="hearts" id="hearts"></span><span class="notes" id="notes"></span></div>`;
    if (o.k === "inst") return `<div class="ri ${ROOM.sel === "inst" ? "sel" : ""}" data-ri="inst" style="left:${R.inst.x}%;top:${R.inst.y}%;width:${ins.w}%;z-index:${Math.round(R.inst.y)}">${itemImg(ins.id)}</div>`;
    const it = itemOf(o.i.id);
    const alive = night && it.cat === "toy" && o.i.id !== "r_guitar";
    return `<div class="ri ${ROOM.sel === o.i.u ? "sel" : ""} ${o.i.flip ? "flip" : ""} ${it.cat === "food" && !edit && !night ? "food" : ""} ${alive ? "alive" : ""}" data-ri="${o.i.u}" style="left:${o.i.x}%;top:${o.i.y}%;width:${it.w}%;z-index:${Math.round(o.i.y)}${alive ? `;--d:${(toyN++ * 0.37) % 1.5}s;--k:${toyN % 3}` : ""}">${itemImg(o.i.id)}</div>`;
  };
  const sel = ROOM.sel && ROOM.sel.length > 6 ? R.items.find(i => i.u === ROOM.sel) : null;
  const TH = S.thief || {};
  return `<div class="room ${edit ? "edit" : ""} ${night ? "night" : ""} ${TH.dark ? "th-dark" : ""}" id="room" style="background-image:url('${ART}${R.bg}.webp')">${objs.map(el).join("")}${night ? `<span class="moon" aria-hidden="true">☾</span>` : ""}${TH.broken ? CRACKS : ""}${TH.webs ? WEBS : ""}</div>
  ${edit && sel ? `<div class="chips room-tools"><button class="btn sm soft" data-act="rmFlip">↔ ${t("rm_flip")}</button><button class="btn sm soft" data-act="rmFront">${t("rm_front")}</button><button class="btn sm soft" data-act="rmAway">${t("rm_away")}</button></div>` : edit ? `<div class="muted small">${t("rm_hint")}</div>` : ""}`;
}
function instrLine() {
  const k = instrNow(), cur = INSTR[k], nx = INSTR[k + 1];
  return `<div class="card instr"><span class="instr-pic">${itemImg(cur.id)}</span><div class="grow"><b>${esc(cur.n)}</b><div class="muted small">${nx ? t("in_next", { n: nx.stars - (S.stars || 0), name: nx.n }) : t("in_top")}</div>
   <div class="bar"><i style="width:${nx ? Math.round(((S.stars || 0) - cur.stars) / (nx.stars - cur.stars) * 100) : 100}%"></i></div></div></div>`;
}
function roomCard() {
  const R = roomOf();
  const night = isNight(), sp = night && !S.thief?.boxed ? sleepSpot(R) : null, hasG = R.items.some(i => i.id === "r_guitar");
  const hint = night ? t("rm_nightHint") + (sp.where === "floor" ? " " + t("rm_floorHint") : "") : t("rm_feedHint");
  return `<div class="section"><div class="section-head"><h2>${t("rm_title", { name: esc(S.profile.name || "") })}</h2><span class="pill m">♥ ${R.happy}</span></div>${roomHTML(false)}
  <div class="muted small">${hint}</div>
  <div class="chips room-acts">${night ? "" : `<button class="btn sm soft" data-act="rmSing">🎤 ${t("rm_sing")} <span class="price">${I.coin}${SING_COST}</span></button><button class="btn sm soft ${hasG ? "" : "dim"}" data-act="rmGuitar">🎸 ${t("rm_guitar")} <span class="price">${I.coin}${GUITAR_COST}</span></button>`}
   <button class="btn sm ghost" data-act="rmLights">${night ? "💡 " + t("rm_lightsOn") : "🌙 " + t("rm_lightsOff")}</button></div>
  <div class="chips"><button class="btn" data-act="rmEdit">${t("rm_decorate")}</button><button class="btn soft" data-act="avatar">${t("editAvatar")}</button></div>${instrLine()}</div>`;
}
function roomTray() {
  const R = roomOf(), loose = R.items.filter(i => !i.placed);
  return `<div class="label">${t("rm_tray")}</div>${loose.length ? `<div class="tray">${loose.map(i => `<button data-act="rmPlace" data-id="${i.u}" aria-label="${esc(itemOf(i.id).n)}">${itemImg(i.id)}</button>`).join("")}</div>` : `<div class="muted small">${t("rm_trayEmpty")}</div>`}
  <div class="label">${t("rm_style")}</div><div class="tray wide">${R.owned.map(id => `<button class="${R.bg === id ? "on" : ""}" data-act="rmStyle" data-id="${id}" aria-label="${esc(itemOf(id).n)}">${itemImg(id)}</button>`).join("")}</div>`;
}
function roomSheet() {
  openSheet(`<div class="stack"><div class="act-head"><h2>${t("rm_decorate")}</h2><button class="icon-btn" data-act="close" aria-label="Close">${I.close}</button></div><div id="roomWrap">${roomHTML(true)}</div><div id="trayWrap">${roomTray()}</div></div>`, true);
  bindRoom();
}
function rerenderRoom() { const w = document.getElementById("roomWrap"); if (!w) return; w.innerHTML = roomHTML(true); const tw = document.getElementById("trayWrap"); if (tw) tw.innerHTML = roomTray(); bindRoom(); }
function bindRoom() {
  const room = document.getElementById("room"); if (!room || !room.classList.contains("edit")) return;
  room.onpointerdown = e => {
    const n = e.target.closest(".ri"); if (!n) { ROOM.sel = null; rerenderRoom(); return; }
    e.preventDefault(); const r = room.getBoundingClientRect();
    ROOM.drag = { n, id: n.dataset.ri, r, sx: e.clientX, sy: e.clientY, moved: false };
    try { room.setPointerCapture(e.pointerId); } catch (_) { }
  };
  room.onpointermove = e => {
    const d = ROOM.drag; if (!d) return;
    if (Math.abs(e.clientX - d.sx) + Math.abs(e.clientY - d.sy) > 4) d.moved = true;
    if (!d.moved) return;
    const x = Math.max(4, Math.min(96, (e.clientX - d.r.left) / d.r.width * 100)), y = Math.max(20, Math.min(99, (e.clientY - d.r.top) / d.r.height * 100));
    d.n.style.left = x + "%"; d.n.style.top = y + "%"; d.n.style.zIndex = Math.round(y); d.x = x; d.y = y;
  };
  room.onpointerup = () => {
    const d = ROOM.drag; ROOM.drag = null; if (!d) return; const R = roomOf();
    const tgt = d.id === "me" ? R.me : d.id === "inst" ? R.inst : R.items.find(i => i.u === d.id);
    if (d.moved && tgt) { tgt.x = Math.round(d.x * 10) / 10; tgt.y = Math.round(d.y * 10) / 10; save(); }
    ROOM.sel = d.id; rerenderRoom();
  };
}
/* tapping a treat (outside decorating) gives it to your friend */
function feed(u) {
  const R = roomOf(), i = R.items.find(x => x.u === u); if (!i || itemOf(i.id)?.cat !== "food") return false;
  R.items = R.items.filter(x => x !== i); R.happy++; save();
  const box = document.querySelector('[data-ri="' + u + '"]'); if (box) box.classList.add("eaten");
  setTimeout(() => { refresh(); const h = document.getElementById("hearts"); if (h) { h.textContent = "♥ ♥ ♥"; h.classList.add("go"); } }, 350);
  toast(t("rm_yum")); return true;
}
/* ---------- coin actions: sing a song or play the guitar (sounds use the real piano) ---------- */
const SING_COST = 2, GUITAR_COST = 3;
const SONG_SING = [[72, 0, .4], [74, .4, .4], [76, .8, .4], [72, 1.2, .4], [79, 1.6, .8], [77, 2.4, .4], [76, 2.8, .4], [74, 3.2, .4], [72, 3.6, 1]];
const SONG_GUITAR = [[[48, 55, 60, 64, 67], 0], [[48, 55, 60, 64, 67], .5], [[45, 52, 57, 60, 64], 1], [[45, 52, 57, 60, 64], 1.5], [[41, 48, 53, 57, 60], 2], [[43, 50, 55, 59, 62], 2.5], [[48, 55, 60, 64, 72], 3]];
function perform(kind) {
  if (isNight()) { toast(t("rm_sleeping")); return; }
  const R = roomOf(), cost = kind === "sing" ? SING_COST : GUITAR_COST;
  if (kind === "guitar" && !R.items.some(i => i.id === "r_guitar")) { toast(t("rm_needGuitar")); return; }
  if ((S.coins || 0) < cost) { toast(t("notEnough")); return; }
  if (ROOM.busy) return; ROOM.busy = true;
  S.coins -= cost; R.happy++; save(); if (typeof refreshTop === "function") refreshTop();
  if (kind === "sing") SONG_SING.forEach(([m, w, d]) => tone(m, w + .05, d * 1.4, .32));
  else SONG_GUITAR.forEach(([ch, w]) => ch.forEach((m, k) => tone(m, w + .05 + k * .025, .9, .2)));
  const me = document.querySelector('.room:not(.edit) [data-ri="me"]'), n = document.getElementById("notes");
  if (me) me.classList.add(kind === "sing" ? "singing" : "strumming");
  if (me && kind === "guitar") me.insertAdjacentHTML("beforeend", `<span class="held-guitar">${itemImg("r_guitar")}</span>`);
  if (n) { n.innerHTML = "<i>♪</i><i>♫</i><i>♪</i><i>♬</i>"; n.classList.add("go"); }
  setTimeout(() => { ROOM.busy = false; refresh(); }, 4300);
}
function roomAction(act, id) {
  const R = roomOf(), sel = R.items.find(i => i.u === ROOM.sel);
  if (act === "rmSing") { perform("sing"); return true; }
  if (act === "rmGuitar") { perform("guitar"); return true; }
  if (act === "rmLights") { ROOM.lights = isNight() ? "on" : "off"; refresh(); return true; }
  if (act === "rmEdit") { ROOM.sel = null; roomSheet(); return true; }
  if (act === "rmPlace") { const i = R.items.find(x => x.u === id); if (i) { i.placed = true; i.x = 50; i.y = 85; ROOM.sel = i.u; save(); rerenderRoom(); } return true; }
  if (act === "rmAway") { if (sel) { sel.placed = false; ROOM.sel = null; save(); rerenderRoom(); } return true; }
  if (act === "rmFlip") { if (sel) { sel.flip = !sel.flip; save(); rerenderRoom(); } return true; }
  if (act === "rmFront") { if (sel) { sel.y = Math.min(99, sel.y + 0.1); R.items = R.items.filter(i => i !== sel).concat(sel); save(); rerenderRoom(); } return true; }
  if (act === "rmStyle") { if (itemOf(id)?.cat === "room") { R.bg = id; save(); rerenderRoom(); } return true; }
  return false;
}
document.addEventListener("click", e => { const f = e.target.closest(".room:not(.edit) .ri.food"); if (f) feed(f.dataset.ri); });

/* ---------- shop ---------- */
function ownsItem(it) { const R = roomOf(); if (it.cat === "room") return R.owned.includes(it.id); return !it.multi && R.items.some(i => i.id === it.id); }
function petShop() {
  const cat = SHOPCATS.includes(ROOM.cat) ? ROOM.cat : "food", R = roomOf();
  return `<div class="chips">${SHOPCATS.map(k => `<button class="chip ${cat === k ? "on" : ""}" data-act="petCat" data-v="${k}">${t("pc_" + k)}</button>`).join("")}</div>
  <div class="shop pshop">${ITEMS.filter(i => i.cat === cat).map(it => {
    const own = ownsItem(it), nIn = it.multi ? R.items.filter(i => i.id === it.id).length : 0, on = it.cat === "room" && R.bg === it.id;
    const status = on ? `<span class="muted">✓</span>` : own ? `<span class="muted">${it.cat === "room" ? t("rm_use") : t("rm_inRoom")}</span>` : `<span class="price">${I.coin}${it.p}</span>`;
    return `<button class="${on ? "on" : ""}" data-act="petBuy" data-id="${it.id}"><span class="face sq">${itemImg(it.id)}</span><span>${esc(it.n)}${nIn ? ` ×${nIn}` : ""}</span>${status}</button>`;
  }).join("")}</div>`;
}
function petBuy(id) {
  const it = itemOf(id); if (!it) return; const R = roomOf();
  if (!ownsItem(it)) {
    if (it.p > (S.coins || 0)) { toast(t("notEnough")); return; }
    S.coins -= it.p;
    if (it.cat === "room") R.owned.push(it.id);
    else R.items.push({ u: uid(), id: it.id, placed: true, x: 14 + Math.random() * 72, y: 74 + Math.random() * 20 });
    toast(it.cat === "room" ? t("bought") : t("rm_bought")); celebrate();
  }
  if (it.cat === "room") R.bg = it.id;
  save(); refresh();
}

/* ---------- character editor ---------- */
function petEditor() {
  S.avatar = petOf(S.avatar); const a = S.avatar;
  return `<div class="ava-full">${avatarSVG(a)}</div>
  <div class="label">${t("pe_animal")}</div><div class="animals">${ANIMALS.map(n => `<button class="${a.animal === n ? "on" : ""}" data-act="av" data-f="animal" data-v="${n}" aria-label="${n}">${avatarSVG({ ...a, animal: n }, { head: true })}<span>${t("an_" + n)}</span></button>`).join("")}</div>
  <div class="label">${t("pe_outfit")}</div><div class="animals three">${outfitsOf(a.animal).map(o => `<button class="${a.outfit === o ? "on" : ""}" data-act="av" data-f="outfit" data-v="${o}">${avatarSVG({ ...a, outfit: o }, { bg: false })}<span>${t("of_" + o + (a.animal === "dog" && o === "tee" ? "_dog" : ""))}</span></button>`).join("")}</div>
  <div class="label">${t("pe_shape")}</div><div class="chips">${Object.keys(SHAPES).map(s => `<button class="chip ${a.shape === s ? "on" : ""}" data-act="av" data-f="shape" data-v="${s}">${t("sh_" + s)}</button>`).join("")}</div>
  <div class="label">${t("bgc")}</div><div class="swatches">${AVBG.map((c, i) => `<button class="sw ${a.bg === i ? "on" : ""}" style="background:${c}" data-act="av" data-f="bg" data-v="${i}" aria-label="background ${i + 1}"></button>`).join("")}</div>`;
}
function petSet(f, v) {
  S.avatar = petOf(S.avatar);
  if (f === "animal" && ANIMALS.includes(v)) { S.avatar.animal = v; if (!outfitsOf(v).includes(S.avatar.outfit)) S.avatar.outfit = outfitsOf(v)[0]; }
  else if (f === "outfit" && outfitsOf(S.avatar.animal).includes(v)) S.avatar.outfit = v;
  else if (f === "shape" && SHAPES[v]) S.avatar.shape = v;
  else if (f === "bg") S.avatar.bg = +v;
}
