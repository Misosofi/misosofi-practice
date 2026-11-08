/* ===== The zoo: take your treats to the animals =====
   Every animal loves one food from the shop. Give it, the animal munches and thanks you, and you become friends.
   Friendship hearts are kept in S.zoo; 5 hearts = best friends (a zoo stamp). No coins here: coins come only from practising. */
const ZOO = [
  { id: "monkey", food: "f_banana" }, { id: "elephant", food: "f_apple" }, { id: "rabbit", food: "f_cucumber" },
  { id: "parrot", food: "f_pepper" }, { id: "bear", food: "f_honey" }, { id: "penguin", food: "f_fish" },
];
const ZBEST = 5;
let ZOOF = null;
function zooCard(z) {
  const R = roomOf(), have = R.items.filter(i => i.id === z.food).length, n = (S.zoo || {})[z.id] || 0, F = itemOf(z.food);
  return `<div class="zoo-card ${ZOOF === z.id ? "focus" : ""}" id="zc-${z.id}">
   <div class="zoo-pen">${z.id === "monkey" ? `<button class="zoo-sensei" data-zoo="sensei" aria-label="${t("z_sensei")}"><img src="${ART}z_sensei.webp" alt=""></button>` : ""}<img class="zoo-ani" src="${ART}z_${z.id}.webp" alt=""><span class="zoo-say" id="zs-${z.id}"></span></div>
   <b>${t("z_" + z.id)}</b>
   <div class="small zoo-loves">${t("z_loves")} <img src="${ART}${z.food}.webp" alt=""> ${esc(F.n)}</div>
   <div class="zoo-hearts">${Array.from({ length: ZBEST }, (_, k) => k < n ? "♥" : "♡").join("")}${n >= ZBEST ? ` <span class="zoo-stamp">⭐ ${t("z_best")}</span>` : ""}</div>
   ${have ? `<button class="btn sm block" data-zoo="give" data-a="${z.id}">🎁 ${t("z_give", { food: esc(F.n) })} <span class="muted small">×${have}</span></button>`
     : `<button class="btn sm soft block" data-zoo="buy" data-a="${z.id}">${t("z_buy", { food: esc(F.n) })} · ${I.coin}${F.p}</button>`}
  </div>`;
}
function zooOpen(focus) {
  ZOOF = focus || null;
  openSheet(`<div class="stack zoo"><div class="act-head"><h2>🦁 ${t("z_title")}</h2><button class="icon-btn" data-act="close" aria-label="Close">${I.close}</button></div>
   <div class="zoo-sign">${t("z_hi")}</div>
   <div class="zoo-grid">${ZOO.map(zooCard).join("")}</div></div>`);
  if (ZOOF) setTimeout(() => document.getElementById("zc-" + ZOOF)?.scrollIntoView({ behavior: "smooth", block: "center" }), 250);
}
function zooGive(id, btn) {
  const z = ZOO.find(x => x.id === id), R = roomOf(); if (!z) return;
  const items = R.items.filter(i => i.id === z.food); if (!items.length) return;
  const it = items.find(i => !i.in) || items[0];
  R.items = R.items.filter(i => i !== it); S.zoo = { ...(S.zoo || {}) }; S.zoo[id] = (S.zoo[id] || 0) + 1; save();
  const ani = document.querySelector(`#zc-${id} .zoo-ani`), say = document.getElementById("zs-" + id);
  btn.disabled = true;
  /* the treat flies from the button into the animal's mouth */
  if (ani) {
    const a = btn.getBoundingClientRect(), b = ani.getBoundingClientRect(), f = document.createElement("img");
    f.src = ART + z.food + ".webp"; f.className = "zoo-fly"; f.style.left = (a.left + a.width / 2 - 22) + "px"; f.style.top = (a.top - 10) + "px"; document.body.appendChild(f);
    requestAnimationFrame(() => { f.style.transform = `translate(${b.left + b.width / 2 - (a.left + a.width / 2)}px, ${b.top + b.height * .45 - a.top + 10}px) scale(.5) rotate(30deg)`; });
    setTimeout(() => {
      f.remove(); ani.classList.add("zmunch"); if (say) { say.textContent = t("rm_munch"); say.classList.add("on"); }
      [0, .25, .5, .75].forEach(w => { try { tone(88, w, .08, .18); } catch (e) { } });
      setTimeout(() => { if (say) say.textContent = t("z_thanks"); ani.classList.remove("zmunch"); ani.classList.add("zhappy"); try { tone(84, 0, .3, .25); tone(88, .12, .3, .25); tone(91, .24, .5, .25); } catch (e) { } }, 1100);
      setTimeout(() => {
        if (S.zoo[id] === ZBEST) { celebrate(); toast(t("z_bestNow", { animal: t("z_" + id) })); }
        const c = document.getElementById("zc-" + id); if (c) c.outerHTML = zooCard(z); if (typeof refresh === "function" && !document.querySelector(".zoo")) refresh();
      }, 2600);
    }, 720);
  }
}
document.addEventListener("click", e => {
  const b = e.target.closest("[data-zoo]"); if (!b) return; const a = b.dataset.zoo, id = b.dataset.a;
  if (a === "open") zooOpen();
  else if (a === "sensei") { const s = document.getElementById("zs-monkey"), L = t("z_senseiSay").split("|"); if (s) { s.textContent = L[Math.floor(Math.random() * L.length)]; s.classList.add("on"); clearTimeout(s._t); s._t = setTimeout(() => s.classList.remove("on"), 2500); } [79, 84, 79, 84].forEach((m, k) => { try { tone(m, k * .09, .12, .2); } catch (er) { } }); b.classList.remove("hop"); void b.offsetWidth; b.classList.add("hop"); }
  else if (a === "give") zooGive(id, b);
  else if (a === "buy") { const z = ZOO.find(x => x.id === id); if (!z) return; const before = roomOf().items.length; petBuy(z.food); if (roomOf().items.length > before) { ZOOF = id; zooOpen(id); } }
});
