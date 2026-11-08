/* ===== Bonus story: the cats' band — animated, with music =====
   One chapter per practice day. Tap to go to the next line. Each chapter ends with a music-word question:
   every answer plays its own animated ending (with music in that style), then the meaning of the word is shown,
   and the right word with its meaning. Right answer → the story goes on. Wrong answer → the chapter comes back
   on the next practice day (never twice on the same day). After the last chapter of a week, the weekly recording opens the next week.
   Scene = background (bg) + props (emoji fx) + actors (the 3D cats) + one line of text. m = music style. */

/* who: speaker name; a: actors [picture, x %, animation]; fx: props; bg: day / dusk / night / room / magic / stage / wall */
const STORY = [
  { ch: 1, pic: "daizu_guitar", opts: ["Grave", "Andante", "Presto"], ok: 2,
    intro: [
      { bg: "day", m: "walk", fx: ["poster"], a: [["daizu_paw", 30, "in-l"]], who: "daizu" },
      { bg: "day", fx: ["poster", "fishrain"], a: [["daizu_kiss", 30, "jump"]], who: "daizu" },
      { bg: "day", fx: ["rumble"], a: [["daizu_angry", 40, "shake"]], who: "daizu" }],
    end: [
      [{ bg: "dusk", m: "slow", fx: ["sunset"], a: [["daizu_paw", 40, "slowwalk"]] }, { bg: "night", fx: ["stars", "moon", "qmarks"], a: [["daizu_angry", 50, "lost"]] }],
      [{ bg: "day", m: "walk", a: [["daizu_paw", 40, "walk"]] }, { bg: "room", m: "sad", fx: ["bowls", "burp"], a: [["kuriito_kiss", 72, "bob"], ["daizu_angry", 25, "shake"]] }],
      [{ bg: "day", m: "fast", fx: ["wind"], a: [["daizu_paw", 50, "zoom"]] }, { bg: "room", m: "happy", fx: ["fishbowl", "sparkle"], a: [["daizu_kiss", 45, "jump"]] }]] },
  { ch: 1, pic: "kuriito_guitar", opts: ["Fortissimo (ff)", "Mezzo forte (mf)", "Pianissimo (pp)"], ok: 2,
    intro: [
      { bg: "night", m: "night", fx: ["moon", "stars", "houses", "zzz"], a: [["daizu_guitar", 28, "in-l"]], who: "daizu" },
      { bg: "night", fx: ["moon", "stars", "houses", "zzz"], a: [["daizu_guitar", 28, ""], ["kuriito_paw", 70, "in-r"]], who: "kuriito" },
      { bg: "night", fx: ["moon", "stars", "houses", "zzz"], a: [["daizu_guitar", 28, ""], ["kuriito_paw", 70, "bob"]] }],
    end: [
      [{ bg: "night", m: "loud", fx: ["houses", "lightsOn", "alarm", "shakeAll"], a: [["kuriito_guitar", 50, "shake"]] }, { bg: "night", fx: ["houses", "slippers"], a: [["kuriito_angry", 50, "runaway"]] }],
      [{ bg: "night", m: "mid", fx: ["houses", "dogs"], a: [["kuriito_guitar", 40, "bob"]] }, { bg: "night", fx: ["houses", "dogs"], a: [["kuriito_angry", 50, "runaway"]] }],
      [{ bg: "night", m: "night", fx: ["moon", "stars", "houses", "zzz", "notes"], a: [["kuriito_guitar", 50, "sway"]] }, { bg: "night", m: "happy", fx: ["moonclap", "stars", "sparkle"], a: [["daizu_kiss", 30, "jump"], ["kuriito_kiss", 68, "jump"]] }]] },
  { ch: 1, pic: "matcha_guitar", opts: ["Staccato", "Legato", "Accent"], ok: 1,
    intro: [
      { bg: "magic", m: "spell", fx: ["sparkle"], a: [["matcha_paw", 65, "in-r"]], who: "matcha" },
      { bg: "magic", fx: ["sparkle"], a: [["daizu_guitar", 25, "jump"], ["matcha_paw", 65, ""]], who: "daizu" },
      { bg: "magic", fx: ["wave"], a: [["daizu_guitar", 25, ""], ["matcha_paw", 65, "bob"]], who: "matcha" }],
    end: [
      [{ bg: "magic", m: "stacc", fx: ["dots"], a: [["matcha_paw", 60, "hop"]] }, { bg: "magic", fx: ["ukes"], a: [["daizu_angry", 30, "shake"], ["matcha_paw", 70, ""]] }],
      [{ bg: "magic", m: "spell", fx: ["swirl", "sparkle"], a: [["matcha_paw", 60, "sway"]] }, { bg: "magic", m: "happy", fx: ["sparkle", "notes"], a: [["daizu_guitar", 30, "jump"], ["matcha_kiss", 68, "jump"]] }],
      [{ bg: "magic", m: "accent", fx: ["flash", "bang"], a: [["matcha_paw", 55, "shake"]] }, { bg: "magic", fx: ["smoke", "zap"], a: [["matcha_angry", 50, "shake"]] }]] },
  { ch: 1, pic: "azuki_guitar", opts: ["Crescendo", "Diminuendo", "Fermata"], ok: 0,
    intro: [
      { bg: "stage", m: "walk", fx: ["carpet"], a: [["azuki_paw", 50, "in-r"]], who: "azuki" },
      { bg: "stage", fx: ["carpet", "doormat"], a: [["azuki_paw", 50, "bob"]], who: "azuki" },
      { bg: "stage", fx: ["carpet"], a: [["azuki_kiss", 50, "sway"]], who: "azuki" }],
    end: [
      [{ bg: "stage", m: "cresc", fx: ["carpet", "growNotes"], a: [["azuki_paw", 50, "march"]] }, { bg: "stage", m: "happy", fx: ["confetti", "spot"], a: [["azuki_kiss", 50, "bow"]] }],
      [{ bg: "stage", m: "dim", fx: ["carpet", "fade"], a: [["azuki_paw", 50, "march"]] }, { bg: "stage", fx: ["carpet"], a: [["daizu_guitar", 15, "turned"], ["azuki_angry", 60, "shake"]] }],
      [{ bg: "stage", m: "ferm", fx: ["carpet", "clock"], a: [["azuki_paw", 50, "freeze"]] }, { bg: "stage", fx: ["carpet", "ice", "clock"], a: [["azuki_paw", 50, "frozen"]] }]] },
  { ch: 1, pic: "sakura_guitar", opts: ["Accelerando", "Ritardando", "A tempo"], ok: 1, ghost: true,
    intro: [
      { bg: "wall", m: "ghost", fx: ["moon", "stars"], a: [["sakura_paw", 62, "ghostin"]] },
      { bg: "wall", fx: ["moon", "stars"], a: [["daizu_angry", 25, "shiver"], ["sakura_paw", 62, "float"]], who: "daizu" },
      { bg: "wall", fx: ["moon", "stars"], a: [["daizu_angry", 25, "shiver"], ["sakura_paw", 62, "float"]] }],
    end: [
      [{ bg: "wall", m: "accel", fx: ["wind"], a: [["sakura_paw", 60, "blownaway"]] }, { bg: "wall", fx: ["wind"], a: [["daizu_paw", 40, "bob"]] }],
      [{ bg: "wall", m: "rit", fx: ["moon", "stars"], a: [["sakura_kiss", 55, "floatin"]] }, { bg: "wall", fx: ["moon", "stars"], a: [["sakura_paw", 60, "float"]], who: "sakura" }, { bg: "stage", m: "happy", fx: ["spot", "eyes"], a: [["daizu_paw", 20, "turn"], ["matcha_paw", 45, "turn"], ["sakura_kiss", 72, "float"]] }],
      [{ bg: "wall", m: "walk", fx: ["moon"], a: [["sakura_paw", 50, "floatpast"]] }, { bg: "wall", fx: ["moon", "stars"], a: [["daizu_paw", 40, "bob"]] }]] },
];
const TERM = { "Grave": "grave", "Andante": "andante", "Presto": "presto", "Fortissimo (ff)": "ff", "Mezzo forte (mf)": "mf", "Pianissimo (pp)": "pp", "Staccato": "stacc", "Legato": "legato", "Accent": "accent", "Crescendo": "cresc", "Diminuendo": "dim", "Fermata": "ferm", "Accelerando": "accel", "Ritardando": "rit", "A tempo": "atempo" };
const CATNAME = { daizu: "Daizu", kuriito: "Kuriito", matcha: "Matcha", azuki: "Azuki", sakura: "Sakura" };

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
  if (ready) body = `<button class="btn block" data-story="open">🎬 ${t("st_new", { n })}</button>`;
  else if (lock === "rec") body = `<div class="small">${t("st_needRec")}</div>`;
  else if (lock === "end") body = `<div class="small">${t("st_soon")}</div>`;
  else if (st.last === TK) body = `<div class="small">${st.retry ? t("st_retryNext", { n }) : t("st_tomorrow", { n })}</div>`;
  else body = `<div class="small"><b>${t("st_practise", { n })}</b></div>`;
  return `<div class="section"><div class="card stack story-card"><div class="section-head"><h2>🎁 ${t("st_h")}</h2><span class="pill m">${Math.min(st.seen, STORY.length)}/${STORY.length}</span></div>
   <div class="muted small">${t("st_what")}</div>${body}${st.seen ? `<button class="linkbtn" data-story="list">${t("st_again")}</button>` : ""}</div></div>`;
}

/* ---------- music: little piano tunes in the style of each word ---------- */
const SMUS = {
  walk: { bpm: 84, n: [[60, 1], [64, 1], [67, 1], [64, 1], [65, 1], [69, 1], [67, 2]], b: [48, 55], v: .28 },
  slow: { bpm: 40, n: [[57, 2], [60, 2], [64, 2], [62, 2], [60, 4]], b: [45, 52], v: .22 },
  fast: { bpm: 210, n: [[72, .5], [74, .5], [76, .5], [79, .5], [76, .5], [74, .5], [72, .5], [67, .5]], b: [48, 55], v: .26 },
  night: { bpm: 66, n: [[76, 1], [79, 1], [81, 2], [79, 1], [76, 1], [74, 2]], b: [48], v: .12 },
  loud: { bpm: 120, n: [[[60, 64, 67, 72], 1], [[60, 64, 67, 72], 1], [[65, 69, 72, 77], 1], [[67, 71, 74, 79], 1]], b: [36, 43], v: .95 },
  mid: { bpm: 104, n: [[67, 1], [67, 1], [69, 1], [67, 1], [72, 1], [71, 2]], b: [43, 50], v: .45 },
  spell: { bpm: 92, n: [[60, 1], [64, 1], [67, 1], [71, 1], [69, 1], [64, 1], [60, 1], [57, 1]], b: [48], v: .22, legato: true },
  stacc: { bpm: 120, n: [[72, .5], [0, .5], [74, .5], [0, .5], [76, .5], [0, .5], [72, .5], [0, .5]], v: .3, short: true },
  accent: { bpm: 100, n: [[[48, 55, 60, 64, 67, 72], 2], [0, 2]], v: 1 },
  cresc: { bpm: 96, n: [[60, 1], [64, 1], [67, 1], [72, 1]], b: [48], v: .08, grow: .08 },
  dim: { bpm: 96, n: [[72, 1], [67, 1], [64, 1], [60, 1]], b: [48], v: .5, grow: -.09 },
  ferm: { bpm: 60, n: [[[60, 64, 67], 6]], v: .25, legato: true },
  accel: { bpm: 80, n: [[60, 1], [62, 1], [64, 1], [67, 1]], v: .28, speed: 1.25 },
  rit: { bpm: 140, n: [[72, 1], [69, 1], [67, 1], [64, 1]], v: .22, speed: .82, floor: 46 },
  ghost: { bpm: 60, n: [[72, 1.5], [74, 1.5], [76, 1.5], [78, 1.5], [80, 2]], v: .12, legato: true },
  happy: { bpm: 132, n: [[72, 1], [76, 1], [79, 1], [84, 2], [79, 1], [84, 2]], b: [48, 55], v: .3 },
  sad: { bpm: 70, n: [[67, 1], [66, 1], [65, 1], [64, 3]], b: [43], v: .22 },
};
let SMU = null;
function smuStop() { if (SMU) { clearInterval(SMU.timer); SMU = null; } }
function smuPlay(style) {
  if (SMU?.style === style) return; smuStop();
  const M = SMUS[style]; if (!M) return; const c = ac(); if (!c) return;
  SMU = { style, i: 0, loop: 0, next: c.currentTime + .15, bpm: M.bpm, v: M.v };
  SMU.timer = setInterval(() => {
    if (!document.querySelector(".sc")) { smuStop(); return; }
    const c = ac(); if (!c || !SMU) return;
    while (SMU.next < c.currentTime + .4) {
      const [note, beats] = M.n[SMU.i], sec = beats * 60 / SMU.bpm, when = Math.max(0, SMU.next - c.currentTime);
      const dur = M.short ? .12 : M.legato ? sec * 1.3 : Math.min(1.4, sec * 1.05), vol = Math.max(.03, Math.min(1, SMU.v));
      (Array.isArray(note) ? note : [note]).forEach(m => { if (m) tone(m, when, dur, vol); });
      if (SMU.i === 0 && M.b) M.b.forEach(m => tone(m, when, Math.min(2.5, sec * 3), vol * .7));
      SMU.next += sec; SMU.i++;
      if (SMU.i >= M.n.length) { SMU.i = 0; SMU.loop++;
        if (M.grow) SMU.v = Math.max(.03, Math.min(1, SMU.v + M.grow));
        if (M.speed) SMU.bpm = Math.max(M.floor || 30, Math.min(260, SMU.bpm * M.speed)); }
    }
  }, 100);
}

/* ---------- the stage ---------- */
const FXE = {
  poster: `<div class="fx fx-poster">🌙 MOON CONCERT<br><small>BANDS WANTED</small></div>`,
  fishrain: `<div class="fx fx-rain">${[0, 1, 2, 3, 4, 5].map(i => `<span style="left:${8 + i * 15}%;animation-delay:${i * .25}s">🐟</span>`).join("")}</div>`,
  rumble: `<div class="fx fx-pop" style="left:62%;top:30%">💢 grrr…</div>`,
  sunset: `<div class="fx fx-sun">🌇</div>`, stars: `<div class="fx fx-stars">✦ ✧ ✦ ✧ ✦ ✧ ✦</div>`, moon: `<div class="fx fx-moon">🌙</div>`,
  qmarks: `<div class="fx fx-q"><span>?</span><span>?</span><span>?</span></div>`,
  bowls: `<div class="fx fx-floor" style="left:44%">🥣 🥣 🥣</div>`, burp: `<div class="fx fx-pop" style="left:70%;top:18%">burp! 😋</div>`,
  wind: `<div class="fx fx-wind">💨 💨 💨</div>`, fishbowl: `<div class="fx fx-floor fx-bounce" style="left:62%">🐟🍲</div>`,
  sparkle: `<div class="fx fx-spark">✨<span>✨</span><span>⭐</span><span>✨</span></div>`,
  houses: `<div class="fx fx-houses">🏠🏡🏠🏡</div>`, zzz: `<div class="fx fx-zzz">z Z z</div>`,
  lightsOn: `<div class="fx fx-flash"></div>`, alarm: `<div class="fx fx-pop" style="left:8%;top:12%">🚨 WEE-OO!</div>`,
  shakeAll: "", slippers: `<div class="fx fx-throw"><span>🥿</span><span>🥿</span><span>🥿</span></div>`,
  dogs: `<div class="fx fx-dogs">🐕 <b>WOOF!</b> 🐕</div>`, notes: `<div class="fx fx-notes"><span>♪</span><span>♫</span><span>♪</span></div>`,
  moonclap: `<div class="fx fx-moon">🌝👏</div>`, wave: `<div class="fx fx-pop" style="left:40%;top:14%">～～～ ✨</div>`,
  dots: `<div class="fx fx-dots"><span>•</span><span>•</span><span>•</span><span>•</span></div>`,
  ukes: `<div class="fx fx-ukes"><span>🪕</span><span>🪕</span><span>🪕</span><span>🪕</span><span>🪕</span><span>🪕</span></div>`,
  swirl: `<div class="fx fx-swirl">✨🌀✨</div>`, flash: `<div class="fx fx-flash"></div>`, bang: `<div class="fx fx-bang">💥 BANG!</div>`,
  smoke: `<div class="fx fx-pop" style="left:20%;top:10%">💨💨</div>`, zap: `<div class="fx fx-pop" style="left:62%;top:8%">⚡⚡</div>`,
  carpet: `<div class="fx fx-carpet"></div>`, doormat: `<div class="fx fx-pop" style="left:6%;top:62%">(it's a doormat 🧺)</div>`,
  growNotes: `<div class="fx fx-grow"><span>♪</span><span>♫</span><span>♪</span><span>♫</span></div>`,
  confetti: `<div class="fx fx-rain">${["🎉", "🎊", "👑", "🎉", "🎊", "✨"].map((f, i) => `<span style="left:${8 + i * 15}%;animation-delay:${i * .2}s">${f}</span>`).join("")}</div>`,
  spot: `<div class="fx fx-spot"></div>`, fade: `<div class="fx fx-fadeout"></div>`, clock: `<div class="fx fx-clock">⏰</div>`, ice: `<div class="fx fx-ice">🧊</div>`,
  eyes: `<div class="fx fx-pop" style="left:38%;top:8%">👀 …YOU?</div>`,
};
function scHTML(B) {
  const fx = (B.fx || []).map(k => FXE[k] || "").join("");
  const act = (B.a || []).map(([p, x, an]) => `<img class="act an-${an || "none"}" src="${ART}${p}.webp" alt="" style="left:${x}%">`).join("");
  return `<div class="sc bg-${B.bg || "day"} ${(B.fx || []).includes("shakeAll") ? "sc-shake" : ""}"><div class="sc-ground"></div>${fx}${act}</div>`;
}
let STP = null;   /* { i, mode: "ask"|"answer"|"again", beats, b, pick } */
function stBeats(E, i, part, j) {
  if (part === "intro") return E.intro.map((B, n) => ({ ...B, k: `sb_${i + 1}_i${n + 1}` }));
  return E.end[j].map((B, n) => ({ ...B, k: `sb_${i + 1}_e${j}_${n + 1}` }));
}
function storyShow(i, mode, pick) {
  const E = STORY[i]; if (!E) return;
  acReady();
  STP = { i, mode, b: 0, pick, beats: mode === "answer" ? stBeats(E, i, "end", pick) : stBeats(E, i, "intro").concat(mode === "again" ? [{ q: true, again: true }] : [{ q: true }]) };
  storyRender();
}
function storyRender() {
  const E = STORY[STP.i], B = STP.beats[STP.b], head = `<div class="act-head"><h2>🎬 ${t("st_ep", { n: STP.i + 1 })}</h2><button class="icon-btn" data-act="close" aria-label="Close">${I.close}</button></div>`;
  if (!B) return;
  const last = STP.beats[STP.b - 1] || {}, scene = B.q ? scHTML({ ...last, a: (last.a || []).map(x => [x[0], x[1], "bob"]) }) : scHTML(B);
  let m = B.m; if (!m) for (let n = STP.b; n >= 0; n--) if (STP.beats[n]?.m) { m = STP.beats[n].m; break; }
  if (B.term) {   /* the meaning of the chosen word, and the right word */
    const j = STP.pick, right = j === E.ok, w = E.opts[j], ok = E.opts[E.ok];
    smuPlay(right ? "happy" : "sad");
    return openSheet(`<div class="stack story-sheet">${head}
     <div class="term-card ${right ? "ok" : "no"}"><div class="term-w">${right ? "⭕" : "❌"} ${esc(w)}</div><div class="term-m">= ${t("tm_" + TERM[w])}</div></div>
     ${right ? "" : `<div class="term-card ok"><div class="small">${t("st_rightWas")}</div><div class="term-w">⭕ ${esc(ok)}</div><div class="term-m">= ${t("tm_" + TERM[ok])}</div></div>`}
     ${STP.mode === "answer" ? `<div class="card small" style="text-align:center">${right ? (STP.i === STORY.length - 1 ? `<b>${t("st_toBe")}</b><br>${t("st_needRec")}` : t("st_rightNext", { n: STP.i + 2 })) : t("st_wrongNext")}</div>` : ""}
     <button class="btn block" data-act="close">OK</button></div>`);
  }
  if (m) smuPlay(m);
  const who = B.who ? `<b class="sc-who">${CATNAME[B.who]}</b>` : "";
  const body = B.q
    ? `<div class="sc-say q"><b>🎵 ${t(`st_${STP.i + 1}_q`)}</b></div><div class="opts story-opts">${E.opts.map((o, j) => `<button class="opt" data-story="${B.again ? "seeEnd" : "ans"}" data-i="${STP.i}" data-j="${j}">${j + 1}. ${esc(o)}</button>`).join("")}</div>`
    : `<button class="sc-say" data-story="next">${who}<span>${esc(t(B.k))}</span><span class="sc-tap">▶ ${t("st_tap")}</span></button>`;
  openSheet(`<div class="stack story-sheet">${head}<div class="sc-wrap" data-story="${B.q ? "" : "next"}">${scene}</div>${body}
   <div class="sc-prog">${STP.beats.map((_, n) => `<i class="${n <= STP.b ? "on" : ""}"></i>`).join("")}</div></div>`);
}
document.addEventListener("click", e => {
  const b = e.target.closest("[data-story]"); if (!b || !S || !b.dataset.story) return;
  const st = storyS(), a = b.dataset.story;
  if (a === "open") { if (storyLocked() || st.last === TK || !practisedOn(TK)) return; storyShow(st.seen, "ask"); }
  else if (a === "next") { if (!STP) return; if (STP.b < STP.beats.length - 1) { STP.b++; storyRender(); } }
  else if (a === "ans") {
    const i = +b.dataset.i, j = +b.dataset.j, E = STORY[i]; if (i !== st.seen || st.last === TK) return;
    st.last = TK; if (j === E.ok) { st.seen++; st.retry = false; if (!STORY[st.seen] || STORY[st.seen].ch !== E.ch) st.chEnd = TK; } else st.retry = true;
    save(); refresh(); storyShow(i, "answer", j); STP.beats.push({ term: true });
  }
  else if (a === "seeEnd") { const i = +b.dataset.i, j = +b.dataset.j; storyShow(i, "again2", j); STP.beats = stBeats(STORY[i], i, "end", j).concat({ term: true }); STP.mode = "again"; storyRender(); }
  else if (a === "list") openSheet(`<div class="stack"><div class="act-head"><h2>🎁 ${t("st_h")}</h2><button class="icon-btn" data-act="close" aria-label="Close">${I.close}</button></div>
    <div class="list">${STORY.slice(0, st.seen).map((E, i) => `<button class="row pp-item" data-story="ep" data-i="${i}"><img src="${ART}${E.pic}.webp" alt="" style="width:44px;height:44px;object-fit:contain"><span class="grow"><b>${t("st_ep", { n: i + 1 })}</b></span></button>`).join("")}</div></div>`);
  else if (a === "ep") storyShow(+b.dataset.i, "again");
});
