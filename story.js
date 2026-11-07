/* ===== The cats' band story: one episode for every day you practise =====
   Week 1 has five episodes. The next week's story starts only after the weekly recording is sent. */
const STORY = [
  { ch: 1, pic: "daizu_guitar", k: "st_1" },
  { ch: 1, pic: "kuriito_guitar", k: "st_2" },
  { ch: 1, pic: "matcha_angry", k: "st_3" },
  { ch: 1, pic: "azuki_paw", k: "st_4" },
  { ch: 1, pic: "sakura_guitar", k: "st_5", ghost: true },
];
const storyS = () => (S.story ||= { seen: 0, last: "" });
/* the next chapter needs a weekly recording sent after the last chapter ended */
function storyLocked() {
  const st = storyS(), nx = STORY[st.seen]; if (!nx) return "end";
  const prevCh = st.seen ? STORY[st.seen - 1].ch : nx.ch;
  if (nx.ch !== prevCh && !Object.values(S.weekRec || {}).some(r => r.date >= (st.chEnd || ""))) return "rec";
  return "";
}
function storyCard() {
  if (!S || typeof practisedOn !== "function") return "";
  const st = storyS(), lock = storyLocked(), today = practisedOn(TK), newOne = today && st.last !== TK && !lock;
  const ep = st.seen + 1;
  let body;
  if (newOne) body = `<button class="btn block" data-story="open">📖 ${t("st_new", { n: ep })}</button>`;
  else if (lock === "rec") body = `<div class="small">${t("st_needRec")}</div>`;
  else if (lock === "end") body = `<div class="small">${t("st_soon")}</div>`;
  else if (st.last === TK) body = `<div class="small">${t("st_tomorrow", { n: ep })}</div>`;
  else body = `<div class="small">${t("st_practise", { n: ep })}</div>`;
  return `<div class="section"><div class="card stack story-card"><div class="section-head"><h2>📖 ${t("st_h")}</h2><span class="pill m">${t("st_week", { n: STORY[Math.min(st.seen, STORY.length - 1)].ch })} · ${Math.min(st.seen, STORY.length)}/${STORY.length}</span></div>
   ${body}${st.seen ? `<button class="linkbtn" data-story="list">${t("st_again")}</button>` : ""}</div></div>`;
}
function storyShow(i, isNew) {
  const E = STORY[i]; if (!E) return;
  openSheet(`<div class="stack story-sheet"><div class="act-head"><h2>📖 ${t("st_ep", { n: i + 1 })}</h2><button class="icon-btn" data-act="close" aria-label="Close">${I.close}</button></div>
   <div class="story-pic ${E.ghost ? "ghosty" : ""}"><img src="${ART}${E.pic}.webp" alt=""></div>
   <div class="story-text">${t(E.k).split("\n").map(l => `<p>${esc(l)}</p>`).join("")}</div>
   ${i === STORY.length - 1 ? `<div class="card small" style="text-align:center"><b>${t("st_toBe")}</b><br>${t("st_needRec")}</div>` : ""}
   <button class="btn block" data-act="close">${isNew ? t("st_ok") : "OK"}</button></div>`);
  if (isNew) { ding(true); }
}
document.addEventListener("click", e => {
  const b = e.target.closest("[data-story]"); if (!b || !S) return;
  const st = storyS();
  if (b.dataset.story === "open") { if (storyLocked() || st.last === TK || !practisedOn(TK)) return; const i = st.seen; st.seen++; st.last = TK; if (st.seen === STORY.length || STORY[st.seen]?.ch !== STORY[i].ch) st.chEnd = TK; save(); storyShow(i, true); refresh(); }
  else if (b.dataset.story === "list") openSheet(`<div class="stack"><div class="act-head"><h2>📖 ${t("st_h")}</h2><button class="icon-btn" data-act="close" aria-label="Close">${I.close}</button></div>
    <div class="list">${STORY.slice(0, st.seen).map((E, i) => `<button class="row pp-item" data-story="ep" data-i="${i}"><img src="${ART}${E.pic}.webp" alt="" style="width:44px;height:44px;object-fit:contain"><span class="grow"><b>${t("st_ep", { n: i + 1 })}</b></span></button>`).join("")}</div></div>`);
  else if (b.dataset.story === "ep") storyShow(+b.dataset.i, false);
});
