/* ===== The zoo: one big zoo park. Drag a treat from your basket onto an animal =====
   Every animal loves one food. The right food → it munches and thanks you (friendship hearts, 5 = best friends).
   The wrong food → "no thanks, I love …". Sweets → "sweets make animals sick!".
   Atsuko-sensei runs around among the monkeys: drag a party pie (or a sweet) onto her and SPLAT.
   No coins here: coins come only from practising. Hearts are kept in S.zoo, splats in S.zooHits. */
const ZOO = [
  { id: "monkey", food: "f_banana", x: 34, y: 33, h: 15 }, { id: "elephant", food: "f_apple", x: 78, y: 27, h: 19 },
  { id: "rabbit", food: "f_cucumber", x: 18, y: 52, h: 14 }, { id: "parrot", food: "f_pepper", x: 72, y: 62, h: 13 },
  { id: "bear", food: "f_honey", x: 33, y: 90, h: 17 }, { id: "penguin", food: "f_fish", x: 64, y: 86, h: 15 },
];
const ZBEST = 5, ZFOODS = ["f_banana", "f_apple", "f_cucumber", "f_pepper", "f_honey", "f_fish", "f_pie"];
let ZOOF = null, ZDRAG = null, ZSHOP = false;
const throwables = () => roomOf().items.filter(i => SWEETS.includes(i.id));

function zooTray() {
  const R = roomOf(), cnt = {};
  R.items.forEach(i => { if (itemOf(i.id)?.cat === "food" && !CATFOOD.includes(i.id)) cnt[i.id] = (cnt[i.id] || 0) + 1; });
  const ids = Object.keys(cnt);
  return `<div class="zt-row"><div class="zt-items">${ids.length ? ids.map(id => `<span class="zt-item" data-zf="${id}"><img src="${ART}${id}.webp" alt="${esc(itemOf(id).n)}" draggable="false"><b>${cnt[id]}</b></span>`).join("") : `<span class="muted small">${t("z_trayEmpty")}</span>`}</div>
   <button class="btn sm soft zt-shopbtn" data-zoo="shop">🛒</button></div>
   ${ZSHOP ? `<div class="zt-shop">${ZFOODS.map(id => { const F = itemOf(id); return `<button class="zt-buy" data-zoo="buy" data-f="${id}"><img src="${ART}${id}.webp" alt=""><span>${esc(F.n.replace(/ \(.*\)/, ""))}</span><span class="price">${I.coin}${F.p}</span></button>`; }).join("")}</div>` : ""}`;
}
function zooWorld() {
  return `<div class="zoo-world" id="zooWorld" style="background-image:url('${ART}zoo_bg.webp')">
   ${ZOO.map(z => { const n = (S.zoo || {})[z.id] || 0; return `<div class="zw-ani ${ZOOF === z.id ? "focus" : ""}" id="zw-${z.id}" data-zani="${z.id}" style="left:${z.x}%;top:${z.y}%;height:${z.h}%">
     <img src="${ART}z_${z.id}.webp" alt="${t("z_" + z.id)}" draggable="false"><span class="zw-hearts">${n >= ZBEST ? "⭐" : "♥".repeat(n) || "♡"}</span><span class="zoo-say ${z.x > 60 ? "say-r" : z.x < 25 ? "say-l" : ""}" id="zs-${z.id}"></span></div>`; }).join("")}
   <div class="zw-ani zw-sensei ${ZOOF === "sensei" ? "focus" : ""}" id="zw-sensei" data-zani="sensei"><img src="${ART}z_sensei.webp" alt="${t("z_sensei")}" draggable="false"><span class="zoo-say" id="zs-sensei"></span></div>
  </div>`;
}
function zooOpen(focus) {
  ZOOF = focus || null; ZSHOP = false;
  openSheet(`<div class="stack zoo"><div class="act-head"><h2>🦁 ${t("z_title")}</h2><button class="icon-btn" data-act="close" aria-label="Close">${I.close}</button></div>
   <div class="zoo-sign small">${t("z_hi2")}</div>${zooWorld()}<div class="zoo-tray" id="zooTray">${zooTray()}</div></div>`);
  if (ZOOF) setTimeout(() => zSay(ZOOF, ZOOF === "sensei" ? t("z_aimHint") : t("z_hereMe"), 2800), 300);
}
const zTray = () => { const e = document.getElementById("zooTray"); if (e) e.innerHTML = zooTray(); };
function zSay(id, txt, ms = 2200) { const s = document.getElementById("zs-" + id); if (!s) return; s.textContent = txt; s.classList.add("on"); clearTimeout(s._t); s._t = setTimeout(() => s.classList.remove("on"), ms); }
const zPick = k => { const L = t(k).split("|"); return L[Math.floor(Math.random() * L.length)]; };
const zHit = (a, x, y, m = 14) => { const r = a.getBoundingClientRect(); return x > r.left - m && x < r.right + m && y > r.top - m && y < r.bottom + m; };

/* ---------- dragging a treat ---------- */
document.addEventListener("pointerdown", e => {
  const it = e.target.closest(".zt-item"); if (!it) return; e.preventDefault();
  const g = document.createElement("img"); g.src = ART + it.dataset.zf + ".webp"; g.className = "zt-ghost"; document.body.appendChild(g);
  ZDRAG = { id: it.dataset.zf, g, sx: e.clientX, sy: e.clientY, moved: false };
  g.style.left = e.clientX + "px"; g.style.top = e.clientY + "px";
});
document.addEventListener("pointermove", e => {
  const d = ZDRAG; if (!d) return; e.preventDefault(); if (Math.abs(e.clientX - d.sx) + Math.abs(e.clientY - d.sy) > 6) d.moved = true;
  d.g.style.left = e.clientX + "px"; d.g.style.top = e.clientY + "px";
  document.querySelectorAll(".zw-ani").forEach(a => a.classList.toggle("over", zHit(a, e.clientX, e.clientY, 8)));
}, { passive: false });
function zEnd(e) {
  const d = ZDRAG; ZDRAG = null; if (!d) return;
  document.querySelectorAll(".zw-ani.over").forEach(a => a.classList.remove("over"));
  const x = e.clientX, y = e.clientY;
  if (!d.moved) { d.g.remove(); toast(t("z_dragHint")); return; }
  /* Sensei first: she runs in front of the monkey */
  const all = [...document.querySelectorAll(".zw-ani")], target = all.find(a => a.dataset.zani === "sensei" && zHit(a, x, y, 18)) || all.find(a => zHit(a, x, y));
  if (!target) { d.g.classList.add("back"); d.g.style.left = d.sx + "px"; d.g.style.top = d.sy + "px"; setTimeout(() => d.g.remove(), 350); return; }
  const who = target.dataset.zani, R = roomOf();
  d.g.remove();
  if (who === "sensei") {
    if (!SWEETS.includes(d.id)) { zSay("sensei", t("z_senseiNo")); return; }
    const it = R.items.find(i => i.id === d.id); if (!it) return;
    R.items = R.items.filter(i => i !== it); S.zooHits = (S.zooHits || 0) + 1; save();
    /* a big close-up of Sensei with cream on her face, in the middle of the zoo, for a few seconds */
    const img = target.querySelector("img"); img.src = ART + "z_sensei_splat.webp"; target.classList.add("splatted");
    [48, 43, 36].forEach((m, k) => { try { tone(m, k * .06, .25, .35); } catch (er) { } });
    const W = document.getElementById("zooWorld"), cu = document.createElement("div"); cu.className = "zw-closeup";
    cu.innerHTML = `<div class="zw-splat-word">SPLAT! 💥</div><img src="${ART}z_sensei_splat.webp" alt=""><div class="zw-drops"><i></i><i></i><i></i><i></i><i></i></div><div class="zw-cu-say">${esc(zPick("z_hitSay"))}</div>`;
    W?.appendChild(cu); setTimeout(() => { try { tone(72, 0, .15, .2); tone(67, .15, .15, .2); tone(64, .3, .3, .2); } catch (er) { } }, 900);
    setTimeout(() => cu.classList.add("bye"), 4200);
    setTimeout(() => { cu.remove(); img.src = ART + "z_sensei.webp"; target.classList.remove("splatted"); zSay("sensei", t("z_again"), 2200); }, 4700); zTray(); return;
  }
  const z = ZOO.find(a => a.id === who); if (!z) return;
  const nope = msg => { zSay(who, msg, 2600); target.classList.add("nope"); setTimeout(() => target.classList.remove("nope"), 600); try { tone(55, 0, .2, .2); tone(52, .15, .25, .2); } catch (er) { } };
  if (SWEETS.includes(d.id)) return nope(t("z_noSweets"));
  if (z.food !== d.id) return nope(t("z_noThanks", { food: itemOf(z.food).n }));
  const it = R.items.find(i => i.id === d.id && !i.in) || R.items.find(i => i.id === d.id); if (!it) return;
  R.items = R.items.filter(i => i !== it); S.zoo = { ...(S.zoo || {}) }; S.zoo[who] = (S.zoo[who] || 0) + 1; save(); zTray();
  target.classList.add("zmunch"); zSay(who, t("rm_munch"), 1200); [0, .25, .5, .75].forEach(w => { try { tone(88, w, .08, .18); } catch (er) { } });
  setTimeout(() => {
    target.classList.remove("zmunch"); target.classList.add("zhappy"); zSay(who, t("z_thanks"), 2000);
    try { tone(84, 0, .3, .25); tone(88, .12, .3, .25); tone(91, .24, .5, .25); } catch (er) { }
    const h = target.querySelector(".zw-hearts"), n = S.zoo[who]; if (h) h.textContent = n >= ZBEST ? "⭐" : "♥".repeat(n);
    if (n === ZBEST) { celebrate(); toast(t("z_bestNow", { animal: t("z_" + who) })); }
    setTimeout(() => target.classList.remove("zhappy"), 1600);
  }, 1100);
}
document.addEventListener("pointerup", zEnd); document.addEventListener("pointercancel", zEnd);

document.addEventListener("click", e => {
  const b = e.target.closest("[data-zoo],[data-zani]"); if (!b) return;
  if (b.dataset.zani) {
    const id = b.dataset.zani;
    if (id === "sensei") { zSay("sensei", zPick("z_senseiSay")); [79, 84, 79, 84].forEach((m, k) => { try { tone(m, k * .09, .12, .2); } catch (er) { } }); b.classList.remove("hop"); void b.offsetWidth; b.classList.add("hop"); }
    else { const z = ZOO.find(a => a.id === id); zSay(id, t("z_iLove", { food: itemOf(z.food).n })); }
    return;
  }
  const a = b.dataset.zoo;
  if (a === "open") zooOpen();
  else if (a === "shop") { ZSHOP = !ZSHOP; zTray(); }
  else if (a === "buy") { const f = b.dataset.f, F = itemOf(f); if ((S.coins || 0) < F.p) { toast(t("notEnough")); return; } S.coins -= F.p; roomOf().items.push({ u: uid(), id: f, placed: true, x: 14 + Math.random() * 72, y: 74 + Math.random() * 20 }); save(); if (typeof refreshTop === "function") refreshTop(); try { tone(84, 0, .2, .2); } catch (er) { } zTray(); }
});
