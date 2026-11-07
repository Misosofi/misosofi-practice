/* ===== Bonus story: the cats' band =====
   One chapter per practice day. Each chapter ends with a music-word question: the answer decides how the story ends.
   Right answer → the story goes on. Wrong answer → a funny bad ending, and the chapter comes back on the next practice day
   (never twice on the same day). After the last chapter of a week, the weekly recording opens the next week. */
const STORY = [
  { ch: 1, pic: "daizu_guitar", k: "st_1", opts: ["Grave", "Andante", "Presto"], ok: 2 },
  { ch: 1, pic: "kuriito_guitar", k: "st_2", opts: ["Fortissimo (ff)", "Mezzo forte (mf)", "Pianissimo (pp)"], ok: 2 },
  { ch: 1, pic: "matcha_guitar", k: "st_3", opts: ["Staccato", "Legato", "Accent"], ok: 1, bad: "matcha_angry" },
  { ch: 1, pic: "azuki_guitar", k: "st_4", opts: ["Crescendo", "Diminuendo", "Fermata"], ok: 0 },
  { ch: 1, pic: "sakura_guitar", k: "st_5", opts: ["Accelerando", "Ritardando", "A tempo"], ok: 1, ghost: true },
];
const storyS = () => (S.story ||= { seen: 0, last: "" });
function storyLocked() {
  const st = storyS(), nx = STORY[st.seen]; if (!nx) return "end";
  const prevCh = st.seen ? STORY[st.seen - 1].ch : nx.ch;
  if (nx.ch !== prevCh && !Object.values(S.weekRec || {}).some(r => r.date >= (st.chEnd || ""))) return "rec";
  return "";
}
function storyCard() {
  if (!S || typeof practisedOn !== "function") return "";
  const st = storyS(), lock = storyLocked(), today = practisedOn(TK), ready = today && st.last !== TK && !lock, n = st.seen + 1;
  let body;
  if (ready) body = `<button class="btn block" data-story="open">📖 ${t("st_new", { n })}</button>`;
  else if (lock === "rec") body = `<div class="small">${t("st_needRec")}</div>`;
  else if (lock === "end") body = `<div class="small">${t("st_soon")}</div>`;
  else if (st.last === TK) body = `<div class="small">${st.retry ? t("st_retryNext", { n }) : t("st_tomorrow", { n })}</div>`;
  else body = `<div class="small"><b>${t("st_practise", { n })}</b></div>`;
  return `<div class="section"><div class="card stack story-card"><div class="section-head"><h2>🎁 ${t("st_h")}</h2><span class="pill m">${Math.min(st.seen, STORY.length)}/${STORY.length}</span></div>
   <div class="muted small">${t("st_what")}</div>${body}${st.seen ? `<button class="linkbtn" data-story="list">${t("st_again")}</button>` : ""}</div></div>`;
}
const stPic = (E, pic) => `<div class="story-pic ${E.ghost ? "ghosty" : ""}"><img src="${ART}${pic || E.pic}.webp" alt=""></div>`;
const stLines = k => t(k).split("\n").map(l => `<p>${esc(l)}</p>`).join("");
function storyShow(i, mode, pick) {
  const E = STORY[i]; if (!E) return;
  const head = `<div class="act-head"><h2>📖 ${t("st_ep", { n: i + 1 })}</h2><button class="icon-btn" data-act="close" aria-label="Close">${I.close}</button></div>`;
  if (mode === "ask") return openSheet(`<div class="stack story-sheet">${head}${stPic(E)}<div class="story-text">${stLines(E.k)}</div>
   <div class="story-q"><b>🎵 ${t(E.k + "_q")}</b></div>
   <div class="opts story-opts">${E.opts.map((o, j) => `<button class="opt" data-story="ans" data-i="${i}" data-j="${j}">${j + 1}. ${esc(o)}</button>`).join("")}</div></div>`);
  /* the ending (after answering, or when watching again) */
  const j = pick ?? E.ok, right = j === E.ok;
  openSheet(`<div class="stack story-sheet">${head}${stPic(E, right ? E.pic : E.bad)}
   <div class="story-ans ${right ? "ok" : "no"}"><b>${esc(E.opts[j])}</b></div>
   <div class="story-text">${stLines(E.k + "_e" + j)}</div>
   ${mode === "answer" ? `<div class="card small" style="text-align:center">${right ? (i === STORY.length - 1 ? `<b>${t("st_toBe")}</b><br>${t("st_needRec")}` : t("st_rightNext", { n: i + 2 })) : t("st_wrongNext")}</div>` : ""}
   <button class="btn block" data-act="close">OK</button></div>`);
}
document.addEventListener("click", e => {
  const b = e.target.closest("[data-story]"); if (!b || !S) return;
  const st = storyS();
  if (b.dataset.story === "open") { if (storyLocked() || st.last === TK || !practisedOn(TK)) return; storyShow(st.seen, "ask"); }
  else if (b.dataset.story === "ans") {
    const i = +b.dataset.i, j = +b.dataset.j, E = STORY[i]; if (i !== st.seen || st.last === TK) return;
    st.last = TK; if (j === E.ok) { st.seen++; st.retry = false; if (!STORY[st.seen] || STORY[st.seen].ch !== E.ch) st.chEnd = TK; ding(true); } else { st.retry = true; ding(false); }
    save(); storyShow(i, "answer", j); refresh();
  }
  else if (b.dataset.story === "list") openSheet(`<div class="stack"><div class="act-head"><h2>🎁 ${t("st_h")}</h2><button class="icon-btn" data-act="close" aria-label="Close">${I.close}</button></div>
    <div class="list">${STORY.slice(0, st.seen).map((E, i) => `<button class="row pp-item" data-story="ep" data-i="${i}"><img src="${ART}${E.pic}.webp" alt="" style="width:44px;height:44px;object-fit:contain"><span class="grow"><b>${t("st_ep", { n: i + 1 })}</b></span></button>`).join("")}</div></div>`);
  else if (b.dataset.story === "ep") storyShow(+b.dataset.i, "again");
});
