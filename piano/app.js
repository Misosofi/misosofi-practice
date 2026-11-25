const APPV = "20261125a";
/* iPhone は「ズームしない」設定を むしするので、2かい つづけて たたいた ときの ズームと、ピンチの ズームを ここで とめる */
(function () {
  let last = 0;
  document.addEventListener("touchend", e => { const t = Date.now(); if (t - last < 400) e.preventDefault(); last = t; }, { passive: false });
  ["gesturestart", "gesturechange", "gestureend"].forEach(n => document.addEventListener(n, e => e.preventDefault(), { passive: false }));
  document.addEventListener("dblclick", e => e.preventDefault(), { passive: false });
  document.addEventListener("touchmove", e => { if (e.touches && e.touches.length > 1) e.preventDefault(); }, { passive: false });
})();
// 古い版が残っていたら最新に入れかえる
(function(){try{fetch("index.html?t="+Date.now(),{cache:"no-store"}).then(r=>r.text()).then(h=>{const m=h.match(/app\.js\?v=(\w+)/);if(m&&m[1]!==APPV&&sessionStorage.getItem("miso-rl")!==m[1]){sessionStorage.setItem("miso-rl",m[1]);location.reload();}}).catch(()=>{});}catch(e){}})();
/* ===== ピアノのえほん（みそそっフィ ピアノ導入コース）試作 =====
   文章は「Piano Picture Book（ピアノのえほん）」しまだあつこ作 のまま。絵：Juan Macias。
   コインは 正解したとき・ピアノで本当にひけたとき だけ。 */
"use strict";
const ART = "../parts/art/";
const $ = id => document.getElementById(id);
const view = $("view");
const KEY = "miso-piano-v1";
let S = { name: "", age: 0, likes: "", play: "", coins: 0, scene: "home" };
try { Object.assign(S, JSON.parse(localStorage.getItem(KEY) || "{}")); } catch (e) { }
const save = () => { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { } };
const esc = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const wait = ms => new Promise(r => setTimeout(r, ms));
const P = window.MisoPiano;

/* ---------- coins & effects ---------- */
function showCoins() { $("coinN").textContent = S.coins; }
function earn(n, el) {
  S.coins += n; save(); showCoins(); const c = $("coins"); c.classList.remove("pop"); void c.offsetWidth; c.classList.add("pop");
  burst(el);
}
function burst(el) {
  const r = el ? el.getBoundingClientRect() : { left: innerWidth / 2, top: innerHeight / 2, width: 0, height: 0 };
  const cx = r.left + r.width / 2, cy = r.top + r.height / 2, cols = ["#F2B544", "#7FB2D6", "#E98C7E", "#8DBF7A"];
  for (let i = 0; i < 14; i++) {
    const d = document.createElement("i"), a = Math.random() * 6.28, dist = 50 + Math.random() * 70;
    d.style.left = cx + "px"; d.style.top = cy + "px"; d.style.background = cols[i % 4];
    d.style.setProperty("--x", Math.cos(a) * dist + "px"); d.style.setProperty("--y", Math.sin(a) * dist + "px");
    $("burst").appendChild(d); setTimeout(() => d.remove(), 950);
  }
}
/* くりーとの 絵は 場面ごとに かえる（同じ絵ばかりに ならないように） */
const KURI = ["kuriito_dance.webp", "kuriito_dance_flip.webp", "kuriito_sit.webp"];
const kuriPick = () => { let h = 0; for (const c of S.scene || "") h = (h * 31 + c.charCodeAt(0)) >>> 0; return KURI[h % KURI.length]; };
const kuri = (cls = "") => `<img class="kuri ${cls}" src="${ART}${kuriPick()}" alt="くろねこのくりーと">`;
const bubble = (html, who = "くりーと") => `<div class="bubble"><span class="who">${who}</span>${html}</div>`;
const hero = (html, cls) => { if (html) setTimeout(() => { if (!(window.MisoListen && MisoListen.running)) speak(html); }, 350); return `<div class="hero">${kuri(cls)}${bubble(html)}</div>`; };
/* なまえを よんでから 話す くりーと（レッスンの はじめ と おわり） */
const heroN = (html, cls) => { if (S.name) setTimeout(() => { playName(); }, 200); return hero(S.name ? `${esc(nm())}${html.startsWith("こんにちは") ? "、" : "！<br>"}${html}` : html, cls); };


/* ---------- 子どもの なまえ（よびかた つき）と、おうちのひとが 録音した「なまえの こえ」 ---------- */
const nm = () => (S.name || "") + (S.suffix || "");
let nameBlob = null, nameBusy = null;
const nameDB = () => new Promise(ok => { try { const r = indexedDB.open("miso-piano-name", 1); r.onupgradeneeded = () => r.result.createObjectStore("k"); r.onsuccess = () => ok(r.result); r.onerror = () => ok(null); } catch (e) { ok(null); } });
async function nameLoad() { const db = await nameDB(); if (!db) return; await new Promise(ok => { const q = db.transaction("k").objectStore("k").get("name"); q.onsuccess = () => { nameBlob = q.result || null; ok(); }; q.onerror = ok; }); }
async function nameSave(b) { nameBlob = b; const db = await nameDB(); if (!db) return; await new Promise(ok => { const t = db.transaction("k", "readwrite"); t.objectStore("k").put(b, "name"); t.oncomplete = ok; t.onerror = ok; }); }
/* なまえを よぶ：録音が あれば その声、なければ 何も ならさない（文字には いつも 出す） */
function playName() {
  /* なまえの こえは つかわない（ほかの こえと あわないため・2026-11-17） */
  return Promise.resolve();
  if (!nameBlob) return Promise.resolve(false);
  const a = new Audio(URL.createObjectURL(nameBlob));
  if (window.MisoListen) MisoListen.mute(2500);
  nameBusy = new Promise(ok => { a.onended = () => ok(true); a.onerror = () => ok(false); setTimeout(() => ok(true), 2500); a.play().catch(() => ok(false)); }).then(r => { nameBusy = null; return r; });
  return nameBusy;
}
/* なまえを よんでから、その文を 言う（文字は「〇〇ちゃん、…」） */
function cheer(el, text, cls = "say ok") {
  if (el) { el.className = cls; el.textContent = (S.name ? nm() + "、" : "") + text; }
  if (window.MisoListen && MisoListen.running) return;
  playName().then(() => speak(text));
}
nameLoad();

/* ---------- piano keyboard ---------- */
const BLACK_PC = { 1: 0, 3: 1, 6: 3, 8: 4, 10: 5 };        // black key → white index it sits after
const WHITE_PC = [0, 2, 4, 5, 7, 9, 11];
const isBlack = m => (m % 12) in BLACK_PC;
const groupOf = m => { const pc = m % 12, o = Math.floor(m / 12); return pc === 1 || pc === 3 ? { n: 2, id: o + "-2", keys: [o * 12 + 1, o * 12 + 3] } : { n: 3, id: o + "-3", keys: [o * 12 + 6, o * 12 + 8, o * 12 + 10] }; };
/* くろい けんばんを おしたら、その グループ（ふたつ／みっつ）を まとめて ならす */
/* こどもが くろい けんばんを おした ときは、どの ばめんでも グループごと（ふたつ いっぺん／みっつ いっぺん）ならす */
let KEYTAP = null;
{ const _play = P.play.bind(P); P.play = (m, ...a) => { if (KEYTAP === m && isBlack(m)) { KEYTAP = null; groupOf(m).keys.forEach(k => _play(k, ...a)); return; } return _play(m, ...a); }; }
const gp = (m, dur = .6, vol = .22) => { if (isBlack(m)) P.chord(groupOf(m).keys, 0, dur, vol * .8); else P.play(m, 0, dur, vol); };
/* ねんれいで くりかえしの かずを かえる：1さい＝ぜんぶ、2さい＝ひとつとばし、3さい〜＝ふたつとばし（さいていでも 3こ） */
function byAge(list, min = 3) {
  /* どれを とばすかは アツコさんが きめる（2026-11-17）。きまるまでは ぜんぶ やる */
  return list;
}
/* こえを 音の 時計で ぴったりの タイミングに ならす（一部分だけ も ならせる） */
const VBUF = {};
async function loadV(id) {
  if (VBUF[id] || !VOICE_HAVE.has(id)) return VBUF[id]; const c = P.ac(); if (!c) return;
  try { const r = await fetch("voice/" + id + ".mp3?v=" + APPV); VBUF[id] = await c.decodeAudioData(await r.arrayBuffer()); } catch (e) { }
  return VBUF[id];
}
function playVAt(id, when, off = 0, dur) {
  const b = VBUF[id], c = P.ac(); if (!b || !c) return;
  const src = c.createBufferSource(); src.buffer = b; const g = c.createGain(); g.gain.value = .95; src.connect(g); g.connect(c.destination);
  const t = Math.max(when, c.currentTime); if (dur) src.start(t, off, dur); else src.start(t, off);
  if (window.MisoListen && MisoListen.running) MisoListen.mute(((t - c.currentTime) + (dur || b.duration)) * 1000 + 300);
}
/* 「いち・に・さん・はい」「さん・はい」を 1拍ずつ きりわけて、テンポに あわせて ならす（アツコさんの 録音から） */
const COUNT_CUTS = { E2: [[0.03, .5], [.64, .42], [1.27, .45], [1.88, .4]], D13: [[0.05, .5], [.67, .38]] };
function countIn(id, t0, beat) { (COUNT_CUTS[id] || []).forEach(([o, d], k) => playVAt(id, t0 + k * beat - .05, o, d)); }
/* ストリングスのような ひびき（リズムなし）：どの けんばんを ひいても きれいに きこえる */
function pad(notes, vol = .05) {
  const c = P.ac(); if (!c) return () => { };
  const out = c.createGain(), lp = c.createBiquadFilter(); lp.type = "lowpass"; lp.frequency.value = 1100; lp.Q.value = .4;
  out.gain.setValueAtTime(0, c.currentTime); out.gain.linearRampToValueAtTime(vol, c.currentTime + 2.2);
  lp.connect(out); out.connect(c.destination); const os = [];
  notes.forEach(m => [-6, 0, 6].forEach(dt => { const o = c.createOscillator(); o.type = "sawtooth"; o.frequency.value = 440 * Math.pow(2, (m - 69) / 12); o.detune.value = dt;
    const lfo = c.createOscillator(), lg = c.createGain(); lfo.frequency.value = .2 + Math.random() * .2; lg.gain.value = 4; lfo.connect(lg); lg.connect(o.detune); lfo.start();
    o.connect(lp); o.start(); os.push(o, lfo); }));
  return () => { const t = c.currentTime; out.gain.cancelScheduledValues(t); out.gain.setValueAtTime(out.gain.value, t); out.gain.linearRampToValueAtTime(0, t + 1.2); os.forEach(o => { try { o.stop(t + 1.3); } catch (e) { } }); };
}
const PAD_WHITE = [36, 43, 48, 50, 55, 62];   // ド・ソ・レ（ひらいた ひびき）
const PAD_BLACK = [42, 49, 54, 56, 61, 66];   // ソ♭・レ♭・ラ♭
function keyboard(low, octaves, onKey) {
  const box = document.createElement("div"); box.className = "kbd-wrap";
  box.innerHTML = `<div class="kbd"><div class="keys"></div></div>`;
  const keys = box.querySelector(".keys"), nW = octaves * 7, els = {};
  for (let o = 0; o < octaves; o++) WHITE_PC.forEach((pc, i) => {
    const m = low + o * 12 + pc, k = document.createElement("div"); k.className = "w"; k.dataset.m = m;
    k.style.left = ((o * 7 + i) / nW * 100) + "%"; k.style.width = (100 / nW) + "%"; keys.appendChild(k); els[m] = k;
  });
  for (let o = 0; o < octaves; o++) for (const pc in BLACK_PC) {
    const m = low + o * 12 + Number(pc), k = document.createElement("div"); k.className = "b"; k.dataset.m = m;
    const cx = (o * 7 + BLACK_PC[pc] + 1) / nW * 100; k.style.left = `calc(${cx}% - ${100 / nW * 0.3}%)`; k.style.width = (100 / nW * 0.6) + "%";
    keys.appendChild(k); els[m] = k;
  }
  const hit = e => {
    const r = keys.getBoundingClientRect(), x = e.clientX - r.left, y = e.clientY - r.top, ww = r.width / nW;
    if (y < r.height * 0.62) {            // upper part: the nearest black key wins (big targets for small fingers)
      let best = null, bd = 1e9;
      for (let o = 0; o < octaves; o++) for (const pc in BLACK_PC) { const cx = (o * 7 + BLACK_PC[pc] + 1) * ww, d = Math.abs(cx - x); if (d < bd) { bd = d; best = low + o * 12 + Number(pc); } }
      if (bd < ww * 0.55) return best;
    }
    const i = Math.max(0, Math.min(nW - 1, Math.floor(x / ww))); return low + Math.floor(i / 7) * 12 + WHITE_PC[i % 7];
  };
  keys.addEventListener("pointerdown", e => {
    e.preventDefault(); const m = hit(e); const el = els[m];
    if (el && !isBlack(m)) { el.classList.add("down"); setTimeout(() => el.classList.remove("down"), 180); }
    KEYTAP = m; try { if (onKey) onKey(m, el); else P.play(m, 0, 0.9); } finally { KEYTAP = null; }
  });
  box.els = els; box.keys = keys; box.nW = nW; box.low = low; box.onKey = onKey;
  const bx = m => (Math.floor((m - low) / 12) * 7 + BLACK_PC[m % 12] + 1) / nW * 100;
  box.tag = (list, text, cls) => { const t = document.createElement("div"); t.className = "tag " + cls; t.textContent = text;
    t.style.left = `calc(6px + (100% - 12px) * ${(bx(list[0]) + bx(list[list.length - 1])) / 200})`; box.querySelector(".kbd").appendChild(t); return t; };
  return box;
}
const groupsIn = (low, octaves) => { const g = []; for (let o = 0; o < octaves; o++) { const b = low + o * 12; g.push(groupOf(b + 1), groupOf(b + 6)); } return g; };

/* ---------- scenes ---------- */
const SCENES = {};
let cleanup = null;
/* もどる：いままで 見た ばめんを おぼえておく（アプリを とじても のこる） */
/* セリフの とちゅうで つぎの がめんに いかない：
   こどもが タップして すすむ とき → すぐ（こえは とめる）／じどうで すすむ とき → いまの セリフが おわるまで まつ */
let lastTap = 0;
document.addEventListener("pointerdown", () => { lastTap = Date.now(); }, true);
const voiceBusy = () => (vAudio && !vAudio.paused && !vAudio.ended) || (window.speechSynthesis && speechSynthesis.speaking);
function stopVoice() { try { if (vAudio) { vAudio.pause(); vAudio = null; } if (window.speechSynthesis) speechSynthesis.cancel(); } catch (e) { } }
let goWait = 0;
function go(name, back) {
  clearTimeout(goWait);
  const byTap = Date.now() - lastTap < 1000;
  if (byTap) stopVoice();
  else if (voiceBusy()) { const t0 = Date.now(), from = S.scene; const w = () => { if (S.scene !== from) return; if (voiceBusy() && Date.now() - t0 < 12000) goWait = setTimeout(w, 150); else goTo(name, back); }; goWait = setTimeout(w, 150); return; }
  goTo(name, back);
}
function goTo(name, back) {
  /* ちいさい子の「しろ と くろ」：画面に 文字や キャラクターを 出さない。耳で きいて、目で 見るのは 白と黒の 色だけ */
  document.body.classList.toggle("quiet", /^sk[1-5]$/.test(name) || /^intro(W|23|GP|LR)$/.test(name));
  if (cleanup) { try { cleanup(); } catch (e) { } cleanup = null; }
  S.nav = S.nav || [];
  if (!back && name !== "home" && S.scene && S.scene !== "home" && S.scene !== name) { S.nav.push(S.scene); S.nav = S.nav.slice(-40); }
  /* つづきから：さいごに いた レッスンの ばめんを ほぞん */
  if (name !== "home" && !/^intro/.test(name)) S.last = name;
  S.scene = name; save();
  drawSteps(name); view.innerHTML = ""; const sc = document.createElement("section"); sc.className = "scene"; view.appendChild(sc);
  SCENES[name](sc); window.scrollTo(0, 0);
}
function goBack() { $("sheet").hidden = true; const prev = (S.nav || []).pop(); go(prev && SCENES[prev] ? prev : "home", true); }
/* レッスンの ばめんの ならび：上の 点で「いま どこ」が わかる。左右に スライドで まえ・つぎ */
const SEQ = {
  intro: ["intro1", "intro2", "intro3", "introW", "intro4", "intro23", "introGP", "introLR", "intro5"],
  sk: ["sk1", "sk2", "sk3", "sk4", "sk5", "skend"],
  w2: ["w2a", "w2b", "w2s1", "w2c", "w2s2", "w2end"],
  l1: ["lesson1", "lesson1find", "lesson1quiz", "lesson1piano", "lesson1end"],
  l2: ["l2a", "l2b", "l2c", "l2d", "l2e", "l2f", "l2g", "l2end"],
  g3: ["g3", "g3end"],
  r4: ["r4i", "r4j", "r4a", "r4b", "r4c", "r4end"]
};
const seqOf = name => { for (const k in SEQ) { const i = SEQ[k].indexOf(name); if (i >= 0) return { list: SEQ[k], i }; } return null; };
function drawSteps(name) {
  const home = name === "home", hb = $("homeBtn"), st = $("steps");
  if (hb) hb.hidden = home;
  const q = seqOf(name); if (!st) return;
  if (!q || home) { st.hidden = true; return; }
  st.hidden = false;
  $("stepDots").innerHTML = q.list.map((_, k) => `<i class="${k < q.i ? "done" : k === q.i ? "now" : ""}"></i>`).join("");
  $("prevBtn").disabled = q.i === 0 && !(S.nav && S.nav.length);
  $("nextBtn").disabled = q.i === q.list.length - 1 || (name === "intro1" && !S.name);
}
function stepGo(dir) {
  const q = seqOf(S.scene); $("sheet").hidden = true;
  if (dir < 0) { if (q && q.i > 0) go(q.list[q.i - 1], true); else goBack(); return; }
  if (!q || q.i >= q.list.length - 1 || (S.scene === "intro1" && !S.name)) return;
  P.ac(); go(q.list[q.i + 1]);
}
const next = (sc, label, to, cls = "") => { const b = document.createElement("button"); b.className = "btn big " + cls; b.textContent = label; b.onclick = () => { P.ac(); go(to); }; sc.appendChild(b); return b; };

SCENES.home = sc => {
  sc.innerHTML = `<h1 class="title"><small>みそそっフィ</small>ピアノのえほん</h1>
    <div class="endpic">${kuri("dance")}</div>
    <p class="small">ピアノといっしょに あそぼう！</p><div class="grow"></div>`;
  if (!S.name) { const b = next(sc, "はじめる", "intro1"); b.addEventListener("click", () => P.load()); return; }
  /* つづきから はじめる */
  if (S.last && SCENES[S.last] && S.last !== "home") {
    const k = LESSON_OF(S.last), b = next(sc, "", S.last, "cont");
    b.innerHTML = `<small style="display:block;font-size:13px">${k && LESSON_NAME[k] ? LESSON_NAME[k] : ""}</small>▶ つづきから はじめる`; b.addEventListener("click", () => P.load());
  }
  const LIST = [["sk1", "sk", "しろ と くろ", "チャプター1 レッスン1"], ["w2a", "w2", "くろ・しろで えんそう", "チャプター1 レッスン2"], ["lesson1", "l1", "ふたつ と みっつ", "チャプター2 レッスン1"], ["l2a", "l2", "たかい おと・ひくい おと", "チャプター2 レッスン2"], ["g3", "g3", "ふたつ・みっつの きょく", "チャプター2 レッスン3"], ["r4i", "r4", "ふたつで あそぼう・リズムの まねっこ", "チャプター2 レッスン4"]];
  LIST.forEach(([to, k, t, sub]) => {
    const d = S.done && S.done[k], b = next(sc, "", to, "light lessonbtn");
    b.addEventListener("click", () => { S.nav = []; }, true);
    b.innerHTML = `<small style="display:block;font-size:13px">${sub}</small>${t}${d ? `<span class="donestar">${"★".repeat(d)}</span>` : ""}`; b.addEventListener("click", () => P.load()); });
  const ag = document.createElement("div"); ag.className = "agerow"; ag.innerHTML = `<span class="small">ねんれい</span>` + [1, 2, 3, 4, 5, 6].map(a => `<button type="button" class="${(S.age || 0) === a || (a === 6 && S.age > 6) ? "on" : ""}" data-a="${a}">${a}${a === 6 ? "〜" : ""}</button>`).join("");
  ag.querySelectorAll("button").forEach(x => x.onclick = () => { S.age = +x.dataset.a; save(); ag.querySelectorAll("button").forEach(y => y.classList.toggle("on", y === x)); }); sc.appendChild(ag);
  const r = document.createElement("button"); r.className = "btn light"; r.style.fontSize = "15px"; r.style.minHeight = "44px"; r.textContent = "はじめから（なまえ・とし）"; r.onclick = () => go("intro1"); sc.appendChild(r);
};

/* ===== はじめまして（2026-11-25 アツコさんの順番）：
   なまえ → とし → おんがく すき？ → しろ と くろ → この がっき なにか しってる？ → ふたつ と みっつ（りんご）→ グー と パー → ことりさん・ぞうさんの おてて
   画面の 文字は すくなく、耳で きく。目で 見るのは 色や 絵だけ ===== */
function tapSteps(sc, steps, nextSc) {
  /* steps: [{html, say, onShow}]。画面を タップすると つぎへ */
  let i = 0;
  const box = document.createElement("div"); box.className = "istage"; sc.appendChild(box);
  const tip = document.createElement("div"); tip.className = "itap"; tip.textContent = "▶"; sc.appendChild(tip);
  const show = () => { const st = steps[i]; box.innerHTML = st.html; box.classList.remove("pop"); void box.offsetWidth; box.classList.add("pop"); if (st.say) speak(st.say); if (st.onShow) st.onShow(box); };
  const adv = e => { if (e && e.target.closest(".kbd, .keys")) return; P.ac(); if (++i >= steps.length) go(nextSc); else show(); };
  box.onclick = adv; tip.onclick = adv; show();
}
SCENES.introW = sc => {
  /* しろ と くろ：画面いっぱいの 色だけ */
  const steps = ["w", "k"]; let i = 0;
  const fill = document.createElement("div"); fill.className = "fill"; document.body.appendChild(fill);
  const prev = cleanup; cleanup = () => { fill.remove(); if (prev) prev(); };
  const show = () => { const w = steps[i] === "w"; fill.className = "fill " + (w ? "white" : "black"); fill.innerHTML = ""; speak(w ? "まっしろ。これは、しろ、だよ。" : "まっくろ。これは、くろ、だよ。"); };
  fill.onclick = () => { P.ac(); if (++i >= steps.length) go("intro4"); else show(); };
  show();
};
const APPLES = n => `<div class="apples a${n}">${"<span>🍎</span>".repeat(n)}</div>`;
SCENES.intro23 = sc => {
  tapSteps(sc, [
    { html: APPLES(2), say: "りんごが ふたつ。" },
    { html: APPLES(3), say: "りんごが みっつ。" },
    { html: `<div class="kbdslot"></div>`, say: "くろい けんばんにも、ふたつ と みっつが あるよ。さわってみてね。",
      onShow: box => { const kb = keyboard(48, 2, (m, el) => { if (isBlack(m)) { P.chord(groupOf(m).keys, 0, .7, .2); groupOf(m).keys.forEach(k => { const e = kb.els[k]; e.classList.remove("found"); void e.offsetWidth; e.classList.add("found"); setTimeout(() => e.classList.remove("found"), 500); }); } else P.play(m, 0, .6, .22); });
        kb.classList.add("tall"); box.querySelector(".kbdslot").appendChild(kb); } }
  ], "introGP");
};
SCENES.introGP = sc => {
  let t = null;
  const prev = cleanup; cleanup = () => { clearInterval(t); if (prev) prev(); };
  tapSteps(sc, [
    { html: `<div class="hand">✊</div>`, say: "グー、できるかな？" },
    { html: `<div class="hand">🖐️</div>`, say: "パー、できるかな？" },
    { html: `<div class="hand" id="gp">✊</div>`, say: "グー、パー、グー、パー！",
      onShow: box => { let k = 0; clearInterval(t); t = setInterval(() => { const h = box.querySelector("#gp"); if (!h) return clearInterval(t); h.textContent = ++k % 2 ? "🖐️" : "✊"; if (k >= 7) clearInterval(t); }, 650); } }
  ], "introLR");
};
SCENES.introLR = sc => {
  /* みぎて・ひだりては ことば でなく、ことりさん（たかい・みぎ）と ぞうさん（ひくい・ひだり）の めじるしで */
  const two = on => `<div class="lr"><img class="${on === "L" ? "up" : ""}" src="${ART}elephant.webp" alt=""><img class="${on === "R" ? "up" : ""}" src="${ART}bird.webp" alt=""></div>`;
  tapSteps(sc, [
    { html: two("R"), say: "こっちは、ことりさんの おてて。", onShow: () => P.play(84, 0, .6, .2) },
    { html: two("L"), say: "こっちは、ぞうさんの おてて。", onShow: () => P.play(36, 0, .8, .25) },
    { html: two("R"), say: "ことりさんの おてて、あげてね！" },
    { html: two("L"), say: "ぞうさんの おてて、あげてね！" }
  ], "intro5");
};
SCENES.intro1 = sc => {
  sc.innerHTML = hero("こんにちは！ぼくの なまえは、くりーと。<br>くろねこの くりーと だよ。<br>みんなの なまえは、なにかな？") +
    `<input class="name" id="nm" maxlength="12" placeholder="なまえ" value="${esc(S.name)}" autocomplete="off">
     <div class="sfx"><span class="small">よびかた</span>${["ちゃん", "くん", ""].map(x => `<button type="button" class="btn light${(S.suffix ?? "ちゃん") === x ? " on" : ""}" data-x="${x}">${x || "なし"}</button>`).join("")}</div>
     <div class="namerec card"><div class="small" style="text-align:left">おうちのひとへ：お子さまの なまえを、よぶように 録音してください（例「ゆいちゃーん！」）。くりーとが ときどき この声で よびます。</div>
       <div class="row"><button type="button" class="btn sky" id="nrec">● なまえを 録音</button><button type="button" class="btn light" id="nplay">▶ 聞く</button></div></div>
     <p class="small">おうちのひとが いれてあげてね</p><div class="grow"></div>`;
  const b = next(sc, "つぎへ", "intro2"); const nmEl = sc.querySelector("#nm");
  if (S.suffix === undefined) S.suffix = "ちゃん";
  sc.querySelectorAll(".sfx .btn").forEach(x => x.onclick = () => { S.suffix = x.dataset.x; save(); sc.querySelectorAll(".sfx .btn").forEach(y => y.classList.toggle("on", y === x)); });
  const upd = () => { b.disabled = !nmEl.value.trim(); }; nmEl.oninput = upd; upd();
  b.addEventListener("click", () => { S.name = nmEl.value.trim(); save(); }, true);
  const rb = sc.querySelector("#nrec"), pb = sc.querySelector("#nplay"); pb.disabled = !nameBlob; nameLoad().then(() => { pb.disabled = !nameBlob; });
  let rec = null;
  rb.onclick = async () => {
    if (rec && rec.state === "recording") { rec.stop(); return; }
    let st; try { st = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true } }); } catch (e) { rb.textContent = "マイクが つかえません"; return; }
    const ch = []; const mt = ["audio/mp4", "audio/webm"].find(t => MediaRecorder.isTypeSupported && MediaRecorder.isTypeSupported(t)) || "";
    rec = new MediaRecorder(st, mt ? { mimeType: mt } : undefined); rec.ondataavailable = e => e.data.size && ch.push(e.data);
    rec.onstop = async () => { st.getTracks().forEach(t => t.stop()); const bl = new Blob(ch, { type: rec.mimeType || mt }); if (bl.size > 800) { await nameSave(bl); pb.disabled = false; } rb.textContent = "● もういちど 録音"; rb.classList.remove("on"); };
    rec.start(250); rb.textContent = "■ とめる"; rb.classList.add("on"); setTimeout(() => { if (rec.state === "recording") rec.stop(); }, 4000);
  };
  pb.onclick = () => playName();
};

SCENES.intro2 = sc => {
  setTimeout(() => playName(), 150); sc.innerHTML = hero(`${esc(nm())}、よろしくね！<br>ぼくは、6さい。<br>みんなは なんさいかな？`) + `<div class="ages"></div><div class="grow"></div>`;
  const box = sc.querySelector(".ages"); let b;
  [1, 2, 3, 4, 5, 6, 7, 8, 9].forEach(a => { const x = document.createElement("button"); x.className = "btn light" + (S.age === a ? " on" : ""); x.textContent = a;
    x.onclick = () => { S.age = a; save(); box.querySelectorAll(".btn").forEach(y => y.classList.toggle("on", y === x)); b.disabled = false; }; box.appendChild(x); });
  b = next(sc, "つぎへ", "intro3"); b.disabled = !S.age;
};

SCENES.intro3 = sc => {
  sc.innerHTML = hero("ぼくは、おんがくが だいすき！<br>うたったり、ピアノを ひいたりするんだ。<br>みんなも おんがくは すきかな？") + `<div class="choices"></div><div class="grow"></div>`;
  const box = sc.querySelector(".choices");
  ["だいすき", "すき"].forEach(t => { const x = document.createElement("button"); x.className = "btn light big"; x.textContent = t;
    x.onclick = () => { S.likes = t; save(); P.chord(t === "だいすき" ? [60, 64, 67, 72] : [60, 64, 67], 0, 1.2, 0.22); setTimeout(() => go("introW"), 650); }; box.appendChild(x); });
};

SCENES.intro4 = sc => {
  sc.innerHTML = hero("さっそく みんなといっしょに、したの がっきを ひくよ。<br>ねえみんな、この がっき、なにか わかる？");
  const kb = keyboard(60, 2); sc.appendChild(kb);
  const say = document.createElement("div"); say.className = "say"; (say.textContent = "さわってみてね", voice("さわってみてね")); sc.appendChild(say);
  let n = 0; const grow = document.createElement("div"); grow.className = "grow"; sc.appendChild(grow);
  let b = null;
  kb.keys.addEventListener("pointerdown", () => {
    if (++n === 3) {
      sc.querySelector(".bubble").innerHTML = `<span class="who">くりーと</span>そう、ピアノだよ！<br>ピアノには「くろい けんばん」と「しろい けんばん」が あるよ。`; playVoice("A5");
      (say.textContent = "", voice("")); b = next(sc, "つぎへ", "intro23");
    }
  });
};

SCENES.intro5 = sc => {
  sc.innerHTML = hero("じゃあ これから、たくさん たのしく ぼくと おんがくで あそぼう！<br>ぼくと まいにち、いっしょに あそんでほしいんだ！<br>あそんでくれる？", "dance") + `<div class="choices"></div><div class="grow"></div>`;
  const box = sc.querySelector(".choices");
  ["あそぶ", "すこしあそぶ"].forEach(t => { const x = document.createElement("button"); x.className = "btn big " + (t === "あそぶ" ? "" : "light"); x.textContent = t;
    x.onclick = () => { S.play = t; save(); P.chord([60, 64, 67, 72], 0, 1.4, 0.22); go("sk1"); }; box.appendChild(x); });
};

/* ===== レッスン0：しろ と くろ（1さい半〜） =====
   ① 画面ぜんぶ しろ／くろ → ② 半分ずつ「しろは どっち？」 → ③ しろい ねこ・くろい ねこ
   → ④ けんばん「くろい けんばんは どっち？」 → ⑤ くろい けんばんだけ ノック ノック
   小さい子なので、まちがえても ブーは鳴らさない（やさしい音で、正しい方が光る）。 */
/* ---------- まちがいの かず（レッスンごと）→ おわりに「もういちど」を すすめる ---------- */
const LESSON_OF = sc => /^sk/.test(sc) ? "sk" : /^lesson1/.test(sc) ? "l1" : /^l2/.test(sc) ? "l2" : /^l3/.test(sc) ? "l3" : /^w2/.test(sc) ? "w2" : /^g3/.test(sc) ? "g3" : /^r4/.test(sc) ? "r4" : null;
const LESSON_NAME = { sk: "1-1 しろ と くろ", w2: "1-2 くろ・しろで えんそう", l1: "2-1 ふたつ と みっつ", l2: "2-2 たかい おと・ひくい おと", g3: "2-3 ふたつ・みっつの きょく", r4: "2-4 ふたつで あそぼう・リズムの まねっこ" };
function missOne() { const k = LESSON_OF(S.scene); if (!k) return; S.miss = S.miss || {}; S.miss[k] = (S.miss[k] || 0) + 1; save(); }
function missReset(k) { S.miss = S.miss || {}; S.miss[k] = 0; save(); }
/* めやす（仮）：0〜2こ＝つぎへ、3〜5こ＝もういちど が おすすめ、6こ いじょう＝もういちど やろう */
function lessonResult(sc, k, again, nextSc, nextLabel) {
  const n = (S.miss && S.miss[k]) || 0, lv = n <= 2 ? 3 : n <= 5 ? 2 : 1;
  S.done = S.done || {}; S.done[k] = Math.max(S.done[k] || 0, lv);
  S.hist = S.hist || {}; (S.hist[k] = S.hist[k] || []).push({ d: new Date().toISOString().slice(0, 10), miss: n }); S.hist[k] = S.hist[k].slice(-10); save();
  const msg = lv === 3 ? "ばっちり！ つぎの レッスンに すすめるよ！" : lv === 2 ? "あと すこし！ もういちど やると、もっと じょうずに なるよ。" : "もういちど この レッスンを やってみよう！";
  const box = document.createElement("div"); box.className = "result r" + lv;
  box.innerHTML = `<div class="stars">${"★".repeat(lv)}<span class="off">${"★".repeat(3 - lv)}</span></div><div class="rmsg">${msg}</div><p class="small">コイン ${S.coins}こ</p>`;
  sc.appendChild(box); setTimeout(() => voice(msg), 2600);
  const g = document.createElement("div"); g.className = "grow"; sc.appendChild(g);
  const a = document.createElement("button"), b = nextSc ? document.createElement("button") : null;
  a.textContent = "もういちど やる"; a.onclick = () => go(again);
  if (b) { b.textContent = nextLabel; b.onclick = () => go(nextSc); }
  if (lv === 3 && b) { b.className = "btn big"; a.className = "btn light"; sc.appendChild(b); sc.appendChild(a); }
  else { a.className = "btn big"; sc.appendChild(a); if (b) { b.className = "btn light"; b.style.fontSize = "16px"; sc.appendChild(b); } }
  const h = document.createElement("button"); h.className = "btn light"; h.style.fontSize = "16px"; h.style.minHeight = "48px"; h.textContent = "おうちに もどる"; h.onclick = () => go("home"); sc.appendChild(h);
}
const softNo = () => { missOne(); P.play(55, 0, 0.5, 0.12); };
const VOICE_TEXT = {"A1": "こんにちは！ぼくの なまえは、くりーと。くろねこの くりーと だよ。みんなの なまえは、なにかな？", "A2": "よろしくね！ぼくは、6さい。みんなは なんさいかな？", "A3": "ぼくは、おんがくが だいすき！うたったり、ピアノを ひいたりするんだ。みんなも おんがくは すきかな？", "A4": "さっそく みんなと いっしょに、したの がっきを ひくよ。ねえ みんな、この がっき、なにか わかる？", "A5": "そう、ピアノだよ！ピアノには「くろい けんばん」と「しろい けんばん」が あるよ。", "A6": "じゃあ これから、たくさん たのしく ぼくと おんがくで あそぼう！ぼくと まいにち、いっしょに あそんでほしいんだ！あそんでくれる？", "B1": "まっしろ！これは しろ だよ。", "B2": "まっくろ！これは くろ だよ。", "B3": "しろは どっち？", "B4": "くろは どっち？", "B5": "しろい ねこさんは どっち？", "B6": "くろい ねこさんは どっち？", "B7": "しろい けんばんは どっち？", "B8": "くろい けんばんは どっち？", "B9": "こっちかな？", "B10": "こんどは くろい けんばん だけ、ノック ノック してみよう！コン コン！", "B10k": "コン コン！", "B11": "それは しろ だよ。くろい けんばんは どこかな？", "B12": "じょうず！くろい けんばん だけ ノック できたね！", "B13": "しろ と くろ、わかったね！よく がんばりました！また あした、あおうね！", "C1": "よーく みてみると、くろい けんばんは「ふたつの グループ」と「みっつの グループ」が あるよ。", "C2": "ひくい ところから たかい ところへ、「ふたつ、みっつ」と かぞえてみよう！", "C3": "ふたつ", "C4": "みっつ", "C5": "ふたつの くろい けんばんの グループを ぜんぶ タップしてみよう。まちがわないように よーく みてね。みっつじゃないからね。ふたつだよ！", "C6": "いいね！ふたつだね！", "C7": "ダメダメ〜、それは みっつ だよ。", "C8": "じゃあ、クイズだよ！ひかった くろい けんばんは ふたつ？それとも みっつ？", "C9": "みんなの ピアノで、ふたつの くろい けんばんの グループを みつけてみよう。みつけたら、グーを つくって「たんたん」って かるく ひいてみよう。", "C10": "たん！もういっかい！", "C11": "じょうずに ひけたかな？よく がんばりました！きょうの おんがくの あそびは これで おしまい！また あした、あおうね！", "D1": "こんにちは！くりーと だよ！きょうも いっしょに あそぼう！ふたつの くろい けんばんの グループ、おぼえてるかな？ひとつ タップしてみて！", "D2": "おぼえてたね！", "D3": "ピアノの みぎの はしっこは たかい おと、ひだりの はしっこは ひくい おと だよ。ひかった ふたつの グループは たかい？ひくい？", "D4": "こんどは みないで、みみで きいてね。ぞうさん？ことりさん？", "D5": "せいかい！ぞうさんの ひくい おと！", "D6": "せいかい！ことりさんの たかい おと！", "D7": "みんなの ピアノで、いちばん たかい ところの ふたつの くろい けんばんを、みぎてで グーを つくって「たんたん！」", "D8": "たかい おとは、ことりさんの ように かわいい おと だったかな？", "D9": "こんどは いちばん ひくい ところの ふたつの くろい けんばんを、ひだりてで グーを つくって「たんたん！」", "D10": "ひくい おとは、ぞうさんの ように、おおきな ふとい おと だったかな？", "D11": "あれ？だいずの おへやから、おかしな おとが きこえるよ…。ちょっと のぞきみに いってみない？", "D12": "まんなかの ふたつの くろい けんばんで、「タ タ タン！」って ノック してね。くりーとの まねっこ だよ。", "D13": "さん、はい！", "D14": "コンコン… あれ？へんじが ないね。もういちど！", "D15": "ドアが すこし あいたよ！もういっかい！", "D16": "だいず、なに してるの？", "D17": "いまは だめ〜！", "D18": "あーっ！だいず、ぬすみぐい してたー！", "D19": "もう、だいずったら！みんな、ノック じょうず だったよ！", "D20": "きょうは、たかい おと と ひくい おと が わかったね！よく がんばりました！また あした、あおうね！", "E1": "おんがくに あわせて、くろい けんばんで グーを つくって「たんたん」しよう！ひかった グループを ひいてね。", "E2": "いち、に、さん、はい！", "E3": "ふたつ！", "E4": "みっつ！", "E5": "みぎて", "E6": "ひだりて", "E7": "りょうて", "E8": "せいかい！", "E9": "いいね！", "E10": "じょうず！", "E11": "ざんねん、もういちど よーく みてね。", "E12": "もういちど よーく きいてね。", "E13": "それは しろい けんばん だよ。", "E14": "それは みっつの グループ だよ。", "F1": "きょうは、くろい けんばん と しろい けんばんで えんそう しよう！さいしょに、しろ と くろ の おさらい だよ。", "F2": "しろい けんばんを タップしてね", "F3": "くろい けんばんを タップしてね", "F4": "それは しろ だよ", "F5": "それは くろ だよ", "F6": "きょうは くろで えんそう しよう！おんがくに あわせて、くろい けんばんを すきなように ひいてね。", "F7": "それは しろ だよ。きょうは くろ！", "F8": "くろで じょうずに えんそう できたね！", "F9": "こんどは しろで えんそう しよう！しろい けんばんを すきなように ひいてね。", "F10": "それは くろ だよ。きょうは しろ！", "F11": "しろで じょうずに えんそう できたね！", "F12": "もっと たくさん ひいてみよう！", "F13": "くろ と しろで、じょうずに えんそう できたね！よく がんばりました！また あした、あおうね！", "F14": "くろい けんばんの きょく だよ。「ふたつ」って いったら ふたつの グループ、「みっつ」って いったら みっつの グループを ひいてね。", "F15": "それは ふたつ だよ", "F16": "ふたつ と みっつ、ばっちり だね！よく がんばりました！また あした、あおうね！", "G1": "ふたつが ひかったら、タップしてね。みっつは ダメ、だよ。", "G17": "ふたつ、いいね！", "I1": "タン", "I2": "タ", "I3": "たーあー", "K1": "りんごが ふたつ。", "K2": "りんごが みっつ。", "K3": "くろい けんばんにも、ふたつ と みっつが あるよ。さわってみてね。", "K4": "グー、できるかな？", "K5": "パー、できるかな？", "K6": "グー、パー、グー、パー！", "K7": "こっちは、ことりさんの おてて。", "K8": "こっちは、ぞうさんの おてて。", "K9": "ことりさんの おてて、あげてね！", "K10": "ぞうさんの おてて、あげてね！", "G2": "ふたつは いいね！", "G3": "みっつは ダメ！", "G4": "みっつは ダメ、がまん できたね！", "G5": "ふたつは いいよ！", "G6": "くりーとの まねっこ だよ。みぎてで、ふたつの くろい けんばんを ひいてね。ワルツに のって、タタ タン タン！", "G7": "こんどは ひだりて だよ。ひだりてで、ふたつの くろい けんばんを ひいてね。", "G8": "きいてね。", "G9": "どうぞ！", "G10": "ぴったり！", "G11": "もういちど きいてね。", "G12": "ちょっと おおかったね。もういちど きいてね。", "G13": "だいじょうぶ、つぎ いこう！", "G14": "ふたつは いい、みっつは ダメ、ばっちり だね！リズムも じょうず！よく がんばりました！また あした、あおうね！", "H1": "くりーとの まねっこ だよ。くりーとが「ターあー」と ひいたら、「さん、はい！」で くろい けんばんを ひいてね。", "H2": "こんどは しろい けんばんで まねっこ！「さん、はい！」で ひいてね。", "H3": "ぴったり あわせて ひけたね！", "G15": "くろい けんばんには、ふたつの グループ と みっつの グループが あったね。おぼえてる？", "G16": "この レッスンでは、ふたつの グループで あそぶよ。みっつは おやすみ。「ふたつは いい、みっつは ダメ」だよ。"};
const VOICE_HAVE = new Set(["A1", "A2", "A3", "A4", "A5", "A6", "B1", "B10", "B10k", "B11", "B12", "B13", "B2", "B3", "B4", "B5", "B6", "B7", "B8", "B9", "C1", "C10", "C11", "C2", "C3", "C4", "C5", "C6", "C7", "C8", "C9", "D1", "D10", "D11", "D12", "D13", "D14", "D15", "D16", "D17", "D18", "D19", "D2", "D20", "D3", "D4", "D5", "D6", "D7", "D8", "D9", "E1", "E10", "E11", "E12", "E13", "E14", "E2", "E3", "E4", "E5", "E6", "E7", "E8", "E9", "F1", "F10", "F11", "F12", "F13", "F14", "F15", "F16", "F2", "F3", "F4", "F5", "F6", "F7", "F8", "F9", "G1", "G10", "G11", "G12", "G13", "G14", "G15", "G16", "G17", "G2", "G3", "G4", "G5", "G6", "G7", "G8", "G9", "H1", "H2", "H3", "I1", "I2", "I3"]);
/* アツコさんの声：文が台本と同じなら録音を流す。録音がない文は、speak は機械の声、voice は何も言わない。
   声を流している間は、マイクが声を拾わないように止める。 */
const vnorm = t => String(t).split(nm() || "\u0000").join("").split(S.name || "\u0000").join("").replace(/<[^>]+>/g, "").replace(/[\s、。！？!?「」『』（）()…・〜~ー,.]/g, "");
const VOICE_BY_TEXT = {}; for (const id in VOICE_TEXT) VOICE_BY_TEXT[vnorm(VOICE_TEXT[id])] = id;
let vAudio = null, vLast = "", vLastAt = 0, pendingSound = null;
/* リンクから ひらいた ときなど、まだ 画面に さわっていないと iPhone は 音を 止める → さいしょに さわった ときに 流す */
document.addEventListener("pointerdown", () => { if (pendingSound) { const f = pendingSound; pendingSound = null; f(); } }, true);
function playVoice(id) {
  if (!VOICE_HAVE.has(id)) return false;
  /* まえの セリフが まだ とちゅう（タップされて いない）なら、おわってから ながす */
  if (vAudio && !vAudio.paused && !vAudio.ended && Date.now() - lastTap > 600 && !nameBusy) { const cur = vAudio; cur.addEventListener("ended", () => { if (vAudio === cur) playVoice(id); }, { once: true }); return true; }
  if (nameBusy) { vLast = vnorm(VOICE_TEXT[id] || ""); vLastAt = Date.now(); nameBusy.then(() => playVoice(id)); return true; }
  try { if (window.speechSynthesis) speechSynthesis.cancel(); } catch (e) { }
  if (vAudio) { vAudio.pause(); vAudio = null; }
  vLast = vnorm(VOICE_TEXT[id] || ""); vLastAt = Date.now();
  const a = new Audio("voice/" + id + ".mp3?v=" + APPV); vAudio = a;
  a.addEventListener("loadedmetadata", () => { if (window.MisoListen) MisoListen.mute((a.duration || 3) * 1000 + 300); });
  if (window.MisoListen) MisoListen.mute(4000);
  a.play().catch(() => { pendingSound = () => a.play().catch(() => { }); }); return true;
}
const playVoiceThen = async (id, maxMs = 7000) => { if (nameBusy) await nameBusy; return await new Promise(ok => { if (!playVoice(id)) return ok(false); const a = vAudio, t = setTimeout(() => ok(true), maxMs); a.addEventListener("ended", () => { clearTimeout(t); ok(true); }, { once: true }); a.addEventListener("error", () => { clearTimeout(t); ok(false); }, { once: true }); }); };
const voice = (t, force) => { if (!force && window.MisoListen && MisoListen.running) return false; const n = vnorm(t), id = VOICE_BY_TEXT[n]; if (!id) return false; const now = Date.now(); if (n === vLast && now - vLastAt < 1500) return true; vLast = n; vLastAt = now; return playVoice(id); };
const speak = t => { if (voice(t, true)) return; try { if (!window.speechSynthesis) return; speechSynthesis.cancel(); const u = new SpeechSynthesisUtterance(t.replace(/<[^>]+>/g, "")); u.lang = "ja-JP"; u.rate = 0.9; u.pitch = 1.3; speechSynthesis.speak(u); if (!navigator.userActivation || !navigator.userActivation.hasBeenActive) pendingSound = () => { speechSynthesis.cancel(); speechSynthesis.speak(u); }; } catch (e) { } };
const SK_TAG = `<span class="lesson-tag">チャプター1 ・ レッスン1</span>`;
function dotsEl(n) { const d = document.createElement("div"); d.className = "dots"; d.innerHTML = "<i></i>".repeat(n); return d; }

SCENES.sk1 = sc => {
  missReset("sk");
  const steps = ["w", "k", "w", "k"]; let i = 0;
  const fill = document.createElement("div"); fill.className = "fill"; document.body.appendChild(fill);
  cleanup = () => fill.remove();
  const show = () => {
    const w = steps[i] === "w";
    fill.className = "fill " + (w ? "white" : "black");
    fill.innerHTML = `<div class="fill-word">${w ? "しろ" : "くろ"}</div><div class="fill-cat">${kuri()}<div class="bubble">${w ? "まっしろ！これは しろ だよ。" : "まっくろ！これは くろ だよ。"}</div></div><div class="fill-tap">タップして つぎへ</div>`;
    speak(w ? "まっしろ。これは、しろ、だよ。" : "まっくろ。これは、くろ、だよ。"); P.play(w ? 84 : 48, 0, 0.9, 0.2);
  };
  fill.onclick = () => { P.ac(); if (++i >= steps.length) go("sk2"); else show(); };
  show();
};

function pickScene(sc, opt) {
  /* opt: {intro, n, ask(q)→"w"|"k", draw(box, sides), say(q)} */
  opt = { ...opt, n: Math.max(2, byAge(new Array(opt.n).fill(0), 2).length) };
  sc.innerHTML = SK_TAG + hero(opt.intro);
  const stage = document.createElement("div"); stage.className = opt.cls; sc.appendChild(stage);
  const say = document.createElement("div"); say.className = "say"; say.innerHTML = "&nbsp;"; sc.appendChild(say);
  const dots = dotsEl(opt.n); sc.appendChild(dots);
  const grow = document.createElement("div"); grow.className = "grow"; sc.appendChild(grow);
  const qs = []; for (let k = 0; k < opt.n; k++) qs.push(k % 2 ? "k" : "w"); if (Math.random() < .5) qs.reverse();
  let q = 0, lock = false;
  const ask = () => {
    lock = false; const want = qs[q], order = Math.random() < .5 ? ["w", "k"] : ["k", "w"];
    stage.innerHTML = ""; order.forEach(c => { const el = opt.draw(c); el.dataset.c = c; stage.appendChild(el);
      el.onclick = () => {
        if (lock) return;
        if (c === want) {
          lock = true; el.classList.add("yes"); if (q % 2) cheer(say, "せいかい！"); else { say.className = "say ok"; (say.textContent = "せいかい！", voice("せいかい！")); } P.pinpon(); earn(1, el); dots.children[q].classList.add("on");
          if (++q >= opt.n) setTimeout(() => go(opt.next), 1300); else setTimeout(ask, 1300);
        } else { softNo(); say.className = "say"; (say.textContent = "こっちかな？", voice("こっちかな？")); const r = stage.querySelector(`[data-c="${want}"]`); r.classList.remove("hint"); void r.offsetWidth; r.classList.add("hint"); }
      }; });
    const t = (want === "w" ? opt.askW : opt.askK); sc.querySelector(".bubble").innerHTML = `<span class="who">くりーと</span>${t}`; say.innerHTML = "&nbsp;"; speak(t);
  };
  setTimeout(ask, 400);
}

SCENES.sk2 = sc => pickScene(sc, { intro: "", n: 6, cls: "halves", next: "sk3", askW: "しろは どっち？", askK: "くろは どっち？",
  draw: c => { const d = document.createElement("button"); d.className = "half " + (c === "w" ? "white" : "black"); d.setAttribute("aria-label", c === "w" ? "しろ" : "くろ"); return d; } });

SCENES.sk3 = sc => pickScene(sc, { intro: "", n: 4, cls: "pair", next: "sk4", askW: "しろい ねこさんは どっち？", askK: "くろい ねこさんは どっち？",
  draw: c => { const d = document.createElement("button"); d.className = "pick"; d.innerHTML = `<img src="${ART}cat_${c === "w" ? "white" : "black"}.webp" alt="${c === "w" ? "しろい ねこ" : "くろい ねこ"}">`; return d; } });

SCENES.sk4 = sc => pickScene(sc, { intro: "", n: 4, cls: "pair", next: "sk5", askW: "しろい けんばんは どっち？", askK: "くろい けんばんは どっち？",
  draw: c => { const d = document.createElement("button"); d.className = "pick keypick"; d.innerHTML = `<span class="bigkey ${c === "w" ? "kw" : "kb"}"></span>`;
    d.addEventListener("pointerdown", () => P.play(c === "w" ? 60 : 61, 0, 0.8, 0.25)); return d; } });

/* ----- キーボード（ほんものの楽器）で やる：マイクで 聞いて、画面の けんばんと 同じ ように あつかう -----
   小さい子は iPad の 画面を たたくより、おもちゃの キーボードや ピアノを たたく ほうが かんたん。
   黒鍵と白鍵の 音の ちがいを、アプリが 聞き分ける。 */
function realKeysSwitch(sc, kb, onKey, label = "キーボード・ピアノで やる") {
  const row = document.createElement("div"); row.className = "mic-switch";
  row.innerHTML = `<button class="btn sky" type="button">🎹 ${label}</button><span class="small mic-state">がめんの けんばんでも できるよ</span>`;
  const btn = row.querySelector("button"), st = row.querySelector(".mic-state");
  let on = false;
  btn.onclick = async () => {
    if (on) { MisoListen.stop(); on = false; btn.textContent = "🎹 " + label; st.textContent = "がめんの けんばんでも できるよ"; row.classList.remove("on"); return; }
    try {
      MisoListen.opt.low = 28; MisoListen.opt.maxHz = 4200;
      await MisoListen.start({ onNote: m => { const v = kb.low + (m % 12); onKey(v, kb.els[v], true); } });
      on = true; row.classList.add("on"); btn.textContent = "🎹 きいているよ（とめる）"; st.textContent = "キーボードを ひいてね";
    } catch (e) { st.textContent = "マイクが つかえなかったよ"; }
  };
  const prev = cleanup; cleanup = () => { if (prev) prev(); MisoListen.stop(); MisoListen.opt.low = 45; MisoListen.opt.maxHz = 2200; };
  return row;
}

SCENES.sk5 = sc => {
  /* くりーとが「コン コン！」→ こどもが 2かい ノック → また くりーとが「コン コン！」…（いわれた かずだけ たたく） */
  const NEED = 8; let n = 0, done = false, lock = true;
  sc.innerHTML = SK_TAG + hero("こんどは くろい けんばん だけ<br>ノック ノック してみよう！<br>コン コン！");
  const say = document.createElement("div"); say.className = "say"; say.innerHTML = "&nbsp;";
  const knocks = document.createElement("div"); knocks.className = "knocks"; knocks.innerHTML = "<i></i>".repeat(NEED);
  const demo = () => {
    lock = true; say.className = "say"; say.textContent = "コン コン！"; playVoice("B10k");
    const k = [61, 63, 66, 68, 70][Math.floor(Math.random() * 5)];
    
    setTimeout(() => { lock = false; say.className = "say"; say.textContent = "どうぞ！"; }, 1100);
  };
  const kb = keyboard(60, 1, (m, el, real) => {
    if (done) return;
    if (lock) { if (!real) P.play(m, 0, 0.4, 0.12); return; }
    if (isBlack(m)) {
      if (!real) { P.play(m, 0, 0.6, 0.28); knock(); } el.classList.remove("found"); void el.offsetWidth; el.classList.add("found"); setTimeout(() => el.classList.remove("found"), 300);
      knocks.children[n].classList.add("on"); n++; say.className = "say ok"; say.textContent = n % 2 ? "コン！" : "コン コン！";
      if (n >= NEED) { done = true; setTimeout(() => cheer(say, "じょうず！くろい けんばん だけ ノック できたね！"), 400); P.pinpon(); earn(2, kb); setTimeout(() => go("skend"), 2200); }
      else if (n % 2 === 0) { lock = true; setTimeout(demo, 900); }
    } else { if (!real) P.play(m, 0, 0.5, 0.15); say.className = "say"; (say.textContent = "それは しろ だよ。くろい けんばん は どこかな？", voice("それは しろ だよ。くろい けんばん は どこかな？")); }
  });
  kb.classList.add("tall"); sc.appendChild(realKeysSwitch(sc, kb, kb.onKey)); sc.appendChild(kb); sc.appendChild(say); sc.appendChild(knocks);
  /* さいしょの せつめいが おわったら はじめる */
  setTimeout(() => { if (S.scene === "sk5" && lock && n === 0) { lock = false; say.textContent = "どうぞ！"; } }, 6000);
};
function knock() { const c = P.ac(); if (!c) return; const t = c.currentTime; [0, 0.12].forEach(d => { const o = c.createOscillator(), g = c.createGain(); o.type = "triangle"; o.frequency.setValueAtTime(900, t + d); o.frequency.exponentialRampToValueAtTime(300, t + d + 0.06); g.gain.setValueAtTime(0.25, t + d); g.gain.exponentialRampToValueAtTime(0.001, t + d + 0.08); o.connect(g); g.connect(c.destination); o.start(t + d); o.stop(t + d + 0.1); }); }

SCENES.skend = sc => {
  sc.innerHTML = SK_TAG + heroN("しろ と くろ、わかったね！<br>よく がんばりました！<br>また あした、あおうね！", "dance") +
    `<div class="endpic"><img src="${ART}cat_black.webp" alt="" style="max-height:120px"><img src="${ART}cat_white.webp" alt="" style="max-height:120px"></div>
`;
  P.chord([60, 64, 67, 72], 0, 1.6, 0.22);
  lessonResult(sc, "sk", "sk1", "w2a", "つぎの レッスンへ（くろ・しろで えんそう）");
};

/* レッスン1-1：ふたつ と みっつ を見てみる */
SCENES.lesson1 = sc => {
  missReset("l1");
  sc.innerHTML = `<span class="lesson-tag">チャプター2 ・ レッスン1</span>` +
    heroN("よーく みてみると、くろい けんばんは<br>「ふたつの グループ」と<br>「みっつの グループ」が あるよ。") +
    `<p class="small">ひくい ところから たかい ところへ、「ふたつ、みっつ」と かぞえてみよう！</p>`;
  const kb = keyboard(48, 2); sc.appendChild(kb);
  const row = document.createElement("div"); row.className = "row"; sc.appendChild(row);
  const again = document.createElement("button"); again.className = "btn light"; again.textContent = "もういちど"; row.appendChild(again);
  const grow = document.createElement("div"); grow.className = "grow"; sc.appendChild(grow);
  let stop = false; cleanup = () => { stop = true; };
  async function show() {
    again.disabled = true; kb.querySelectorAll(".tag").forEach(t => t.remove()); Object.values(kb.els).forEach(e => e.classList.remove("glow2", "glow3"));
    for (const g of groupsIn(48, 2)) {
      if (stop) return; g.keys.forEach(m => kb.els[m].classList.add(g.n === 2 ? "glow2" : "glow3"));
      kb.tag(g.keys, g.n === 2 ? "ふたつ" : "みっつ", "t" + g.n);
      playVoice(g.n === 2 ? "C3" : "C4"); P.chord(g.keys, 0.35, 0.8, 0.2); await wait(1300);
    }
    again.disabled = false;
  }
  again.onclick = show;
  (async () => { await wait(250); if (await playVoiceThen("C1")) { if (stop) return; await playVoiceThen("C2"); } if (!stop) show(); })();
  next(sc, "わかった！", "lesson1find");
};

/* レッスン1-2：ふたつのグループに チェック（タップでさがす） */
SCENES.lesson1find = sc => {
  sc.innerHTML = `<span class="lesson-tag">チャプター2 ・ レッスン1</span>` +
    hero("ふたつの くろいけんばんの グループを ぜんぶ タップしてみよう。<br>まちがわないように よーくみてね。<br>みっつじゃないからね。ふたつだよ！");
  const low = 48, oct = 3, all = groupsIn(low, oct).filter(g => g.n === 2), found = new Set();
  const say = document.createElement("div"); say.className = "say"; say.innerHTML = "&nbsp;";
  const dots = document.createElement("div"); dots.className = "dots"; dots.innerHTML = all.map(() => "<i></i>").join("");
  const kb = keyboard(low, oct, (m, el) => {
    gp(m, 0.7, 0.25);
    if (!isBlack(m)) { say.className = "say"; (say.textContent = "くろい けんばんを さがしてね", voice("くろい けんばんを さがしてね")); return; }
    const g = groupOf(m);
    if (g.n === 2) {
      if (found.has(g.id)) return;
      found.add(g.id); g.keys.forEach(k => kb.els[k].classList.add("found"));
      say.className = "say ok"; (say.textContent = "いいね！ふたつだね！", voice("いいね！ふたつだね！")); setTimeout(() => P.pinpon(), 200); earn(1, el);
      dots.querySelectorAll("i").forEach((d, i) => d.classList.toggle("on", i < found.size));
      if (found.size === all.length) setTimeout(() => go("lesson1quiz"), 1300);
    } else {
      g.keys.forEach(k => { const e = kb.els[k]; e.classList.remove("wrong"); void e.offsetWidth; e.classList.add("wrong"); });
      say.className = "say ng"; (say.textContent = "ダメダメ〜、それは みっつ だよ", voice("ダメダメ〜、それは みっつ だよ")); setTimeout(() => (missOne(), P.buzz()), 150);
    }
  });
  sc.appendChild(kb); sc.appendChild(say); sc.appendChild(dots);
};

/* レッスン1-3：ひかった グループは ふたつ？みっつ？ */
SCENES.lesson1quiz = sc => {
  sc.innerHTML = `<span class="lesson-tag">チャプター2 ・ レッスン1</span>` + hero("じゃあ、クイズだよ！<br>ひかった くろいけんばんは<br>ふたつ？ それとも みっつ？");
  const low = 48, oct = 2, kb = keyboard(low, oct); sc.appendChild(kb);
  const say = document.createElement("div"); say.className = "say"; say.innerHTML = "&nbsp;"; sc.appendChild(say);
  const ch = document.createElement("div"); ch.className = "choices"; sc.appendChild(ch);
  const dots = document.createElement("div"); dots.className = "dots"; sc.appendChild(dots);
  const groups = groupsIn(low, oct), N = 4;
  const order = [2, 3, 3, 2].sort(() => Math.random() - 0.5).map(n => { const c = groups.filter(g => g.n === n); return c[Math.floor(Math.random() * c.length)]; });
  dots.innerHTML = order.map(() => "<i></i>").join("");
  let q = 0, lock = false;
  const ask = () => { Object.values(kb.els).forEach(e => e.classList.remove("ask", "found", "glow3")); order[q].keys.forEach(k => kb.els[k].classList.add("ask")); P.chord(order[q].keys, 0, 0.8, 0.2); lock = false; say.innerHTML = "&nbsp;"; };
  [["ふたつ", 2], ["みっつ", 3]].forEach(([t, n]) => {
    const b = document.createElement("button"); b.className = "btn big " + (n === 2 ? "sky" : "light"); b.textContent = t; ch.appendChild(b);
    b.onclick = () => {
      if (lock) return; lock = true; const g = order[q];
      if (g.n === n) {
        g.keys.forEach(k => { kb.els[k].classList.remove("ask"); kb.els[k].classList.add(n === 2 ? "found" : "glow3"); });
        if (q % 2) cheer(say, "せいかい！"); else { say.className = "say ok"; (say.textContent = "せいかい！", voice("せいかい！")); } P.pinpon(); earn(1, b); dots.children[q].classList.add("on");
        q++; setTimeout(() => q >= N ? go("lesson1piano") : ask(), 1200);
      } else { say.className = "say ng"; (say.textContent = "ざんねん、もういちど よーくみてね", voice("ざんねん、もういちど よーくみてね")); (missOne(), P.buzz()); setTimeout(() => { lock = false; }, 600); }
    };
  });
  setTimeout(ask, 500);
};

/* レッスン1-4：ほんものの ピアノで グー「タンタン」（マイクで聞く） */
SCENES.lesson1piano = sc => {
  sc.innerHTML = `<span class="lesson-tag">チャプター2 ・ レッスン1</span>` +
    hero("みんなの ピアノで、ふたつの くろいけんばんの グループを みつけてみよう。<br>みつけたら、グーを つくって「たんたん」って かるく ひいてみよう。") +
    `<div class="mic" id="mic"><div class="ring"><svg viewBox="0 0 24 24" fill="none" stroke="#4F8DBA" stroke-width="2" stroke-linecap="round"><rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3"/></svg></div>
      <div class="taps"><span>たん</span><span>たん</span></div></div>
    <div class="say" id="say">&nbsp;</div><div class="grow"></div>`;
  const say = sc.querySelector("#say"), mic = sc.querySelector("#mic"), taps = sc.querySelectorAll(".taps span");
  const start = document.createElement("button"); start.className = "btn big sky"; start.textContent = "ピアノで きかせてね"; sc.appendChild(start);
  const skip = document.createElement("button"); skip.className = "btn light"; skip.textContent = "ピアノが ないときは こちら"; sc.appendChild(skip);
  let hits = 0, lastAt = 0, done = false, screen = false;
  const finish = () => { done = true; MisoListen.stop(); mic.classList.remove("on"); cheer(say, "じょうず！ふたつの グループだね！"); P.pinpon(); earn(screen ? 1 : 3, mic); setTimeout(() => go("lesson1end"), 1600); };
  const onNote = m => {
    if (done) return; const pc = m % 12, now = performance.now();
    if (pc === 1 || pc === 3) {
      if (now - lastAt < 150) return; lastAt = now; taps[Math.min(hits, 1)].classList.add("on"); hits++;
      if (hits >= 2) finish(); else { say.className = "say ok"; (say.textContent = "たん！もういっかい！", voice("たん！もういっかい！")); }
    } else if (pc === 6 || pc === 8 || pc === 10) { say.className = "say ng"; (say.textContent = "それは みっつの グループだよ", voice("それは みっつの グループだよ")); }
    else { say.className = "say ng"; (say.textContent = "それは しろい けんばんだよ", voice("それは しろい けんばんだよ")); }
  };
  start.onclick = async () => {
    start.disabled = true; say.className = "say"; (say.textContent = "きいているよ…", voice("きいているよ…"));
    try {
      await MisoListen.start({
        onLevel: db => mic.style.setProperty("--lv", Math.max(.8, Math.min(1.25, .8 + (db + 60) / 80))),
        onNote
      });
      mic.classList.add("on"); start.hidden = true;
    } catch (e) { start.disabled = false; say.className = "say ng"; (say.textContent = "マイクが つかえなかったよ", voice("マイクが つかえなかったよ")); }
  };
  /* ピアノがない日：とばさずに、画面の けんばんで 同じ ことを する（コインは すこしだけ） */
  skip.onclick = () => {
    MisoListen.stop(); screen = true; start.hidden = true; skip.hidden = true; mic.classList.remove("on"); mic.querySelector(".ring").hidden = true;
    const kb = keyboard(48, 2, m => { P.play(m, 0, .6, .25); onNote(m); }); kb.classList.add("tall"); mic.after(kb);
    say.className = "say"; say.textContent = "がめんの けんばんで、ふたつの グループを「たん たん」";
  };
  cleanup = () => MisoListen.stop();
};

SCENES.lesson1end = sc => {
  sc.innerHTML = heroN("じょうずに ひけたかな？<br>よく がんばりました！<br>きょうの おんがくの あそびは これで おしまい！<br>また あした、あおうね！", "dance");
  P.chord([60, 64, 67, 72], 0, 1.6, 0.22); setTimeout(() => P.chord([65, 69, 72, 77], 0.9, 1.6, 0.2), 0);
  lessonResult(sc, "l1", "lesson1", "l2a", "つぎの レッスンへ（たかい おと・ひくい おと）");
};

/* ===== レッスン2：たかい おと・ひくい おと と だいずの おへや =====
   本のチャプター1 レッスン2 のとおり：
   ① ふたつのグループの おさらい → ② 目で：たかい？ひくい？ → ③ 耳で：ことりさん？ぞうさん？
   → ④ 本物のピアノで いちばん たかい／ひくい グループを「たんたん」→ ⑤ だいずの おへやを「タタタン」と ノック */
const L2_TAG = `<span class="lesson-tag">チャプター2 ・ レッスン2</span>`;
const imgPick = (src, alt) => `<img src="${ART}${src}" alt="${alt}">`;

SCENES.l2a = sc => {
  missReset("l2");
  sc.innerHTML = L2_TAG + heroN("こんにちは！くりーと だよ！<br>きょうも いっしょに あそぼう！<br>ふたつの くろい けんばんの グループ、おぼえてるかな？<br>ひとつ タップしてみて！");
  
  const say = document.createElement("div"); say.className = "say"; say.innerHTML = "&nbsp;";
  let ok = false;
  const kb = keyboard(48, 2, (m, el) => {
    gp(m, 0.7, 0.25); if (ok) return;
    if (!isBlack(m)) { say.className = "say"; (say.textContent = "くろい けんばんだよ", voice("くろい けんばんだよ")); return; }
    const g = groupOf(m);
    if (g.n === 2) { ok = true; g.keys.forEach(k => kb.els[k].classList.add("found")); cheer(say, "おぼえてたね！"); P.pinpon(); earn(1, el); setTimeout(() => go("l2b"), 1300); }
    else { g.keys.forEach(k => { const e = kb.els[k]; e.classList.remove("wrong"); void e.offsetWidth; e.classList.add("wrong"); }); say.className = "say ng"; (say.textContent = "それは みっつ だよ", voice("それは みっつ だよ")); softNo(); }
  });
  sc.appendChild(kb); sc.appendChild(say);
};

/* ピアノ全体（88けん）を小さく出して、はしっこの グループを光らせる */
function fullKeyboard() { const kb = keyboard(24, 7); kb.classList.add("full"); return kb; }
function hiLoQuiz(sc, opt) {
  sc.innerHTML = L2_TAG + hero(opt.intro);
  const stage = document.createElement("div"); stage.className = "hl-stage"; sc.appendChild(stage);
  const say = document.createElement("div"); say.className = "say"; say.innerHTML = "&nbsp;"; sc.appendChild(say);
  const ch = document.createElement("div"); ch.className = "pair"; sc.appendChild(ch);
  const dots = dotsEl(opt.n); sc.appendChild(dots);
  const qs = []; for (let k = 0; k < opt.n; k++) qs.push(k % 2 ? "lo" : "hi"); qs.sort(() => Math.random() - .5);
  let q = 0, lock = false;
  const buttons = {};
  [["lo", "elephant.webp", "ひくい（ぞうさん）"], ["hi", "bird.webp", "たかい（ことりさん）"]].forEach(([k, img, t]) => {
    const b = document.createElement("button"); b.className = "pick hl"; b.dataset.c = k; b.innerHTML = imgPick(img, t) + `<span>${t.split("（")[0]}</span>`; ch.appendChild(b); buttons[k] = b;
    b.onclick = () => {
      if (lock) return; const want = qs[q];
      if (k === want) {
        lock = true; b.classList.add("yes"); say.className = "say ok"; say.textContent = k === "hi" ? "せいかい！ことりさんの たかい おと！" : "せいかい！ぞうさんの ひくい おと！"; voice(say.textContent);
        P.pinpon(); earn(1, b); dots.children[q].classList.add("on");
        setTimeout(() => { b.classList.remove("yes"); if (++q >= opt.n) go(opt.next); else ask(); }, 1400);
      } else { softNo(); say.className = "say"; say.textContent = "もういちど よーく " + (opt.ear ? "きいてね" : "みてね"); voice(say.textContent); const r = buttons[want]; r.classList.remove("hint"); void r.offsetWidth; r.classList.add("hint"); setTimeout(() => opt.play && opt.play(want), 500); }
    };
  });
  const ask = () => { lock = false; say.innerHTML = "&nbsp;"; opt.show(stage, qs[q]); };
  setTimeout(ask, 500);
}
/* ことりさん＝たかい ふたつの グループを ♩♩♩♩ かるく、ぞうさん＝ひくい グループを 𝅗𝅥𝅗𝅥 おもく */
function playHiLo(c) {
  if (c === "hi") { [0, .35, .7, 1.05].forEach(t => P.chord([97, 99], t, 0.25, 0.16)); }
  else { [0, .9].forEach(t => P.chord([25, 27], t, 0.8, 0.38)); }
}

SCENES.l2b = sc => hiLoQuiz(sc, { n: 4, next: "l2c",
  intro: "ピアノの みぎの はしっこは たかい おと、ひだりの はしっこは ひくい おと だよ。<br>ひかった ふたつの グループは たかい？ ひくい？",
  show: (stage, c) => { stage.innerHTML = ""; const kb = fullKeyboard(); stage.appendChild(kb); const keys = c === "hi" ? [97, 99] : [25, 27]; keys.forEach(k => kb.els[k].classList.add("ask")); } });

SCENES.l2c = sc => hiLoQuiz(sc, { n: 4, next: "l2d", ear: true, play: playHiLo,
  intro: "こんどは みないで、みみで きいてね。<br>ぞうさん？ ことりさん？",
  show: (stage, c) => { stage.innerHTML = `<button class="btn sky big listen-again" type="button">もういちど きく</button>`; stage.querySelector("button").onclick = () => playHiLo(c); setTimeout(() => playHiLo(c), 300); } });

/* ④ 本物のピアノ：いちばん たかい グループを みぎてで、いちばん ひくい グループを ひだりてで「たんたん」 */
SCENES.l2d = sc => {
  const steps = [
    { k: "hi", text: "みんなの ピアノで、いちばん たかい ところの ふたつの くろい けんばんを、みぎてで グーを つくって「たんたん！」", ok: m => m >= 73, img: "bird.webp", after: "たかい おとは ことりさんの ように かわいい おと だったかな？" },
    { k: "lo", text: "こんどは いちばん ひくい ところの ふたつの くろい けんばんを、ひだりてで グーを つくって「たんたん！」", ok: m => m <= 51, img: "elephant.webp", after: "ひくい おとは ぞうさんの ように、おおきな ふとい おと だったかな？" }];
  let i = 0, hits = 0, lastAt = 0, done = false, screen = null;
  sc.innerHTML = L2_TAG + `<div class="hero"><img class="kuri" id="l2dImg" src="${ART}bird.webp" alt=""><div class="bubble" id="l2dB"></div></div>
    <div class="mic" id="mic"><div class="ring"><svg viewBox="0 0 24 24" fill="none" stroke="#4F8DBA" stroke-width="2" stroke-linecap="round"><rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3"/></svg></div>
    <div class="taps"><span>たん</span><span>たん</span></div></div><div class="say" id="say">&nbsp;</div><div class="grow"></div>`;
  const say = sc.querySelector("#say"), mic = sc.querySelector("#mic"), taps = sc.querySelectorAll(".taps span");
  const start = document.createElement("button"); start.className = "btn big sky"; start.textContent = "ピアノで きかせてね"; sc.appendChild(start);
  const skip = document.createElement("button"); skip.className = "btn light"; skip.textContent = "ピアノが ないときは こちら"; sc.appendChild(skip);
  const show = () => { const s = steps[i]; if (screen) screenKb(); sc.querySelector("#l2dB").innerHTML = `<span class="who">くりーと</span>${s.text}`; sc.querySelector("#l2dImg").src = ART + s.img; taps.forEach(t => t.classList.remove("on")); hits = 0; speak(s.text); };
  const stepDone = () => {
    const s = steps[i]; cheer(say, "じょうず！"); P.pinpon(); earn(screen ? 1 : 2, mic); sc.querySelector("#l2dB").innerHTML = `<span class="who">くりーと</span>${s.after}`; speak(s.after);
    if (++i >= steps.length) { done = true; MisoListen.stop(); mic.classList.remove("on"); setTimeout(() => go("l2e"), 2600); }
    else setTimeout(() => { say.innerHTML = "&nbsp;"; show(); }, 2600);
  };
  start.onclick = async () => {
    start.disabled = true; say.className = "say"; (say.textContent = "きいているよ…", voice("きいているよ…"));
    MisoListen.opt.low = 28; MisoListen.opt.maxHz = 4200;
    try {
      await MisoListen.start({
        onLevel: db => mic.style.setProperty("--lv", Math.max(.8, Math.min(1.25, .8 + (db + 60) / 80))),
        onNote: m => onNote(m)
      });
      mic.classList.add("on"); start.hidden = true;
    } catch (e) { start.disabled = false; say.className = "say ng"; (say.textContent = "マイクが つかえなかったよ", voice("マイクが つかえなかったよ")); }
  };
  function onNote(m) {
          if (done) return; const pc = m % 12, now = performance.now(), s = steps[i];
          if (pc !== 1 && pc !== 3) { say.className = "say ng"; say.textContent = isBlack(m) ? "それは みっつの グループだよ" : "それは しろい けんばんだよ"; return; }
          if (!s.ok(m)) { say.className = "say ng"; say.textContent = s.k === "hi" ? "もっと みぎの、たかい ところだよ" : "もっと ひだりの、ひくい ところだよ"; return; }
          if (now - lastAt < 150) return; lastAt = now; taps[Math.min(hits, 1)].classList.add("on"); hits++;
          if (hits >= 2) stepDone(); else { say.className = "say ok"; (say.textContent = "たん！もういっかい！", voice("たん！もういっかい！")); }
  }
  /* ピアノがない日：とばさずに、画面の けんばんで。たかい とき は みぎの はしっこ、ひくい とき は ひだりの はしっこを 見せる */
  function screenKb() {
    if (screen) screen.remove(); const hi = steps[i].k === "hi";
    screen = keyboard(hi ? 84 : 24, 2, m => { P.play(m, 0, .6, .25); onNote(m); }); screen.classList.add("tall");
    const cap = document.createElement("div"); cap.className = "small"; cap.style.textAlign = hi ? "right" : "left"; cap.textContent = hi ? "ピアノの みぎの はしっこ →" : "← ピアノの ひだりの はしっこ";
    screen.prepend(cap); mic.after(screen);
  }
  skip.onclick = () => {
    MisoListen.stop(); start.hidden = true; skip.hidden = true; mic.classList.remove("on"); mic.querySelector(".ring").hidden = true;
    screenKb(); say.className = "say"; say.textContent = "がめんの けんばんで やってみよう";
  };
  cleanup = () => { MisoListen.stop(); MisoListen.opt.low = 45; MisoListen.opt.maxHz = 2200; };
  show();
};

/* ⑤ だいずの おへや：まんなかの ふたつの くろい けんばんで「タタタン」と ノック（3かい）→ ドアが あく */
SCENES.l2e = sc => {
  sc.innerHTML = L2_TAG + hero("あれ？ だいずの おへやから、おかしな おとが きこえるよ…<br>ちょっと のぞきみに いってみない？") + `<div class="choices"></div><div class="grow"></div>`;
  
  P.play(79, 0.2, 0.2, 0.12); P.play(76, 0.45, 0.2, 0.12);
  const box = sc.querySelector(".choices");
  ["いく", "ちょっとだけ いく"].forEach((t, i) => { const x = document.createElement("button"); x.className = "btn big " + (i ? "light" : ""); x.textContent = t; x.onclick = () => go("l2f"); box.appendChild(x); });
};

SCENES.l2f = sc => {
  const ROUNDS = 3; let round = 0, taps = [], phase = "demo", tmr = 0;
  sc.innerHTML = L2_TAG + hero("まんなかの ふたつの くろい けんばんで、「タタタン！」って ノック してね。<br>くりーとの まねっこ だよ。") +
    `<div class="door-wrap"><div class="door" id="door"><div class="knob"></div><div class="plate">だいず</div></div><img class="door-in" src="${ART}calico_cookie.webp" alt="だいず"></div>
`;
  const say = document.createElement("div"); say.className = "say"; say.id = "say"; say.innerHTML = "&nbsp;"; const door = sc.querySelector("#door");
  const dots = dotsEl(ROUNDS); const kb = keyboard(60, 1, (m, el, real) => {
    if (phase !== "you") { if (!real) gp(m, .4, .15); return; }
    if (!(m === 61 || m === 63)) { if (!real) P.play(m, 0, .4, .15); say.className = "say"; (say.textContent = "まんなかの ふたつの くろい けんばん だよ", voice("まんなかの ふたつの くろい けんばん だよ")); return; }
    if (!real) { P.chord([61, 63], 0, .35, .22); knock(); } el.classList.add("found"); setTimeout(() => el.classList.remove("found"), 200);
    taps.push(performance.now()); clearTimeout(tmr); tmr = setTimeout(check, 900);
  });
  /* 押した けんばんは まんなかの ふたつ（ド♯・レ♯）だけ ひかる */
  kb.els[61].classList.add("glow2"); kb.els[63].classList.add("glow2");
  sc.appendChild(realKeysSwitch(sc, kb, kb.onKey)); sc.appendChild(kb); sc.appendChild(say); sc.appendChild(dots);
  /* お手本：さん、はい！ → タ タ タン（♪♪♩ テンポ ♩=90） */
  const beat = 60 / 90;
  async function demo() {
    phase = "demo"; taps = []; say.className = "say"; (say.textContent = "きいてね… タ タ タン！", voice("きいてね… タ タ タン！"));
    MisoListen.mute(beat * 2000 + 900); await wait(500); [0, beat / 2, beat].forEach(t => { setTimeout(() => { knock(); P.chord([61, 63], 0, t === beat ? .5 : .2, .2); }, t * 1000); });
    await wait(beat * 2000 + 300);
    (say.textContent = "さん、はい！", voice("さん、はい！")); speak("さん、はい"); await wait(900);
    phase = "you"; (say.textContent = "どうぞ！ タ タ タン！", voice("どうぞ！ タ タ タン！"));
  }
  function check() {
    phase = "check"; const t = taps; taps = [];
    let ok = t.length === 3; if (ok) { const g1 = t[1] - t[0], g2 = t[2] - t[1]; ok = g1 > 120 && g2 > 120 && g1 < 900 && g2 < 900 && Math.max(g1, g2) / Math.min(g1, g2) < 1.9; }
    if (ok) {
      dots.children[round].classList.add("on"); round++; earn(1, door); P.pinpon();
      door.style.setProperty("--open", round / ROUNDS);
      if (round >= ROUNDS) { phase = "end"; say.className = "say ok"; cheer(say, "ガチャ！ ドアが あいたよ！"); setTimeout(() => go("l2g"), 1200); }
      else { say.className = "say ok"; say.textContent = ["コンコン… あれ？ へんじが ないね。もういちど！", "ドアが すこし あいたよ！もういっかい！"][round - 1]; playVoice(round === 1 ? "D14" : "D15"); setTimeout(demo, 1700); }
    } else { softNo(); say.className = "say"; say.textContent = t.length < 3 ? "タ タ タン、みっつ ノック だよ。もういちど！" : "タ タ タン、もういちど きいてね"; setTimeout(demo, 1500); }
  }
  { const prev = cleanup; cleanup = () => { clearTimeout(tmr); if (prev) prev(); }; }
  setTimeout(demo, 900);
};

SCENES.l2g = sc => {
  sc.innerHTML = L2_TAG + `<div class="peek"><img src="${ART}calico_cookie.webp" alt="クッキーを たべる だいず"></div>` +
    hero("だいず、なに してるの？", "") + `<div class="grow"></div>`;
  const lines = [["だいず", "いまは だめ〜！"], ["くりーと", "あーっ！ だいず、ぬすみぐい してたー！"], ["くりーと", "もう、だいずったら！<br>みんな、ノック じょうず だったよ！"]];
  let k = 0; const b = sc.querySelector(".bubble");
  speak("だいず、なに してるの？");
  const nxt = document.createElement("button"); nxt.className = "btn big"; nxt.textContent = "つぎへ"; sc.appendChild(nxt);
  nxt.onclick = () => {
    if (k >= lines.length) { go("l2end"); return; }
    const [who, t] = lines[k++]; b.innerHTML = `<span class="who">${who}</span>${t}`; speak(t); if (k === 1) { P.play(72, 0, .2, .2); P.play(67, .15, .4, .2); }
  };
};

SCENES.l2end = sc => {
  sc.innerHTML = L2_TAG + heroN("きょうは、たかい おと と ひくい おと が わかったね！<br>よく がんばりました！<br>また あした、あおうね！", "dance") +
    `<div class="endpic"><img src="${ART}elephant.webp" alt="" style="max-height:130px"><img src="${ART}bird.webp" alt="" style="max-height:110px"></div>
`;
  P.chord([60, 64, 67, 72], 0, 1.6, 0.22);
  lessonResult(sc, "l2", "l2a", "g3", "つぎの レッスンへ（ふたつ・みっつの きょく）");
};

/* ===== レッスン3：ふたつ・みっつの あそびの きょく（はこ だけ。音源と 合図は あとで 入れる） =====
   きょくの データ：
     audio : アツコさんの 音源（mp3）。まだ ない ときは null → アプリの ピアノで 仮の 伴奏
     bpm   : はやさ、 lead: 最初の 合図までの 拍数
     cues  : [拍, グループ(2か3), 手("R"/"L"/"RL")] … どこで「タンタン」するか
   音源が 来たら、ここに ファイル名 と 合図を 書き足す だけで うごく。 */
const L3_SONGS = [
  { id: "demo", title: "ふたつ・みっつ マーチ（かり）", audio: null, bpm: 96, lead: 4,
    cues: [[0, 2, "R"], [2, 2, "R"], [4, 3, "R"], [6, 3, "R"], [8, 2, "L"], [10, 2, "L"], [12, 3, "L"], [14, 3, "L"], [16, 2, "RL"], [18, 3, "RL"], [20, 2, "RL"], [22, 2, "RL"]] }
];
const L3_TAG = `<span class="lesson-tag">チャプター2 ・ レッスン4（じゅんびちゅう）</span>`;
SCENES.l3 = sc => {
  sc.innerHTML = L3_TAG + heroN("おんがくに あわせて、くろい けんばんで グーを つくって「たんたん」しよう！<br>ひかった グループを ひいてね。") +
    `<div class="card small" style="text-align:left">保護者の方へ：このレッスンの曲（音源）は準備中です。今は仮の曲で、しくみだけ試せます。年齢や理解度によっては、このレッスンを飛ばしてチャプター2へ進んでも大丈夫です。</div>`;
  const song = L3_SONGS[0], beat = 60 / song.bpm;
  const say = document.createElement("div"); say.className = "say"; say.innerHTML = "&nbsp;";
  const hand = document.createElement("div"); hand.className = "say"; hand.innerHTML = "&nbsp;";
  let hits = 0, active = null, startAt = 0, timers = [], playing = false;
  const kb = keyboard(48, 2, (m, el, real) => {
    if (!real) P.play(m, 0, .4, .2);
    if (!playing || !active || !isBlack(m)) return;
    const g = groupOf(m); if (g.n !== active.n || active.done) return;
    active.done = true; hits++; g.keys.forEach(k => kb.els[k] && kb.els[k].classList.add("found")); say.className = "say ok"; (say.textContent = "いいね！", voice("いいね！"));
  });
  hand.className = "say"; sc.appendChild(realKeysSwitch(sc, kb, kb.onKey)); sc.appendChild(kb); sc.appendChild(hand); sc.appendChild(say);
  const startBtn = document.createElement("button"); startBtn.className = "btn big"; startBtn.textContent = "はじめる"; sc.appendChild(startBtn);
  const clear = () => Object.values(kb.els).forEach(e => e.classList.remove("glow2", "glow3", "found"));
  function accompaniment(t0) { /* 仮の伴奏：ド・ソの ピアノ（音源が 来たら そちらを 鳴らす） */
    const total = song.lead + song.cues[song.cues.length - 1][0] + 4;
    for (let b = 0; b < total; b++) { P.play(b % 2 ? 43 : 36, t0 + b * beat, beat * .9, .18); if (b % 2 === 0) P.chord([60, 64, 67], t0 + b * beat, beat * .8, .08); }
  }
  startBtn.onclick = () => {
    startBtn.hidden = true; playing = true; hits = 0; P.ac();
    const t0 = 0.3; accompaniment(t0);
    if (!(window.MisoListen && MisoListen.running)) setTimeout(() => playVoice("E2"), Math.max(0, (t0 - 0.15) * 1000));
    for (let b = 0; b < song.lead; b++) timers.push(setTimeout(() => { say.className = "say"; say.textContent = ["いち", "に", "さん", "はい！"][b] || ""; }, (t0 + b * beat) * 1000));
    song.cues.forEach(([cb, n, h], i) => {
      const at = (t0 + (song.lead + cb) * beat) * 1000;
      timers.push(setTimeout(() => {
        clear(); const g = groupsIn(48, 2).filter(x => x.n === n); const pick = h === "L" ? g[0] : h === "R" ? g[g.length - 1] : null;
        (pick ? [pick] : g).forEach(x => x.keys.forEach(k => kb.els[k].classList.add(n === 2 ? "glow2" : "glow3")));
        active = { n, done: false }; say.className = "say"; say.textContent = n === 2 ? "ふたつ！ たんたん" : "みっつ！ たんたん"; if (!(window.MisoListen && MisoListen.running)) playVoice(n === 2 ? "E3" : "E4");
        hand.textContent = h === "R" ? "みぎて" : h === "L" ? "ひだりて" : "りょうて";
      }, at));
    });
    const end = (t0 + (song.lead + song.cues[song.cues.length - 1][0] + 3) * beat) * 1000;
    timers.push(setTimeout(() => {
      playing = false; clear(); hand.innerHTML = "&nbsp;"; const got = Math.min(hits, song.cues.length);
      say.className = "say ok"; say.textContent = `${song.cues.length}かいの うち ${got}かい できたよ！`;
      if (got > 0) earn(Math.ceil(got / 3), say);
      const again = document.createElement("button"); again.className = "btn light"; again.textContent = "もういちど"; again.onclick = () => go("l3"); sc.appendChild(again);
      next(sc, "おうちに もどる", "home");
    }, end));
  };
  const prev = cleanup; cleanup = () => { timers.forEach(clearTimeout); if (prev) prev(); };
};

/* ===== チャプター1 レッスン2：くろで えんそう・しろで えんそう =====
   ① しろ／くろの けんばんを タップ → ② きょうは くろで えんそう（くろい けんばん だけで すきに ひく。くろだけの 伴奏）
   → ③ きょうは しろで えんそう（しろい けんばん だけ。伴奏つき）
   チャプター1は しろ と くろ だけ。ふたつ・みっつは チャプター2 から。 */
const C2_TAG = `<span class="lesson-tag">チャプター1 ・ レッスン2</span>`;
const G3_TAG = `<span class="lesson-tag">チャプター2 ・ レッスン3</span>`;
const C2_BEAT = 60 / 100;
/* 録音が あれば アツコさんの声、なければ 機械の声（マイクを つかっている ときは だまる） */
const sv = t => { if (window.MisoListen && MisoListen.running) return; speak(t); };

SCENES.w2a = sc => {
  missReset("w2");
  const INTRO = "きょうは、くろい けんばん と しろい けんばんで えんそう しよう！<br>さいしょに、しろ と くろ の おさらい だよ。";
  sc.innerHTML = C2_TAG + `<div class="hero">${kuri()}${bubble((S.name ? esc(nm()) + "！<br>" : "") + INTRO)}</div>`;
  const say = document.createElement("div"); say.className = "say"; say.innerHTML = "&nbsp;";
  const qs = ["w", "k", "k", "w"].sort(() => Math.random() - .5), dots = dotsEl(qs.length); let q = 0, lock = true;
  const ASK = { w: "しろい けんばんを タップしてね", k: "くろい けんばんを タップしてね" };
  const kb = keyboard(48, 2, (m, el) => {
    P.play(m, 0, .6, .25); if (lock) return;
    const c = isBlack(m) ? "k" : "w";
    if (c === qs[q]) {
      lock = true; el.classList.add("found"); setTimeout(() => el.classList.remove("found"), 900);
      if (q % 2) cheer(say, "せいかい！"); else { say.className = "say ok"; say.textContent = "せいかい！"; voice("せいかい！"); }
      P.pinpon(); earn(1, el); dots.children[q].classList.add("on");
      if (++q >= qs.length) setTimeout(() => go("w2b"), 1300); else setTimeout(ask, 1300);
    } else { softNo(); say.className = "say ng"; say.textContent = c === "w" ? "それは しろ だよ" : "それは くろ だよ"; sv(say.textContent); }
  });
  const ask = () => { lock = false; sc.querySelector(".bubble").innerHTML = `<span class="who">くりーと</span>${ASK[qs[q]]}`; say.innerHTML = "&nbsp;"; speak(ASK[qs[q]]); };
  kb.classList.add("tall"); sc.appendChild(kb); sc.appendChild(say); sc.appendChild(dots);
  (async () => { await wait(300); if (S.name) await playName(); if (!(await playVoiceThen("F1", 9000))) { speak(INTRO); await wait(5500); } await wait(300); if (S.scene === "w2a") ask(); })();
};

/* 伴奏：1小節＝4拍。ベース（1・3拍）と 和音（2・4拍）の「ブン チャッ」。
   timers で 1小節ずつ 予約するので、ページを はなれると すぐ 止まる。 */
function backing(bars, prog, onBar) {
  const timers = []; let on = true;
  bars.forEach((_, i) => timers.push(setTimeout(() => {
    if (!on) return; const [bass, ch] = prog[i % prog.length];
    P.play(bass, 0, C2_BEAT * 1.8, .2); P.chord(ch, C2_BEAT, C2_BEAT * .8, .07);
    P.play(bass + 7, C2_BEAT * 2, C2_BEAT * 1.8, .16); P.chord(ch, C2_BEAT * 3, C2_BEAT * .8, .07);
    if (onBar) onBar(i);
  }, i * 4 * C2_BEAT * 1000)));
  return () => { on = false; timers.forEach(clearTimeout); };
}
const PROG_WHITE = [[36, [60, 64, 67]], [41, [60, 65, 69]], [43, [59, 62, 67]], [36, [60, 64, 67]]];       // ド・ファ・ソ・ド
const PROG_BLACK = [[42, [61, 66, 70]], [39, [58, 63, 66]], [42, [61, 66, 70]], [37, [61, 65, 68]]];       // くろい けんばんの ひびき（ソ♭・ミ♭m・ソ♭・レ♭）

function freePlay(sc, o) {
  const BARS = 6, GOAL = 10;
  sc.innerHTML = C2_TAG + `<div class="today ${o.color === "w" ? "tw" : "tk"}">きょうは ${o.color === "w" ? "しろ" : "くろ"}！</div>` + hero(o.intro);
  const say = document.createElement("div"); say.className = "say"; say.innerHTML = "&nbsp;";
  const meter = document.createElement("div"); meter.className = "meter"; meter.innerHTML = "<b></b>";
  let n = 0, playing = false, stop = null, lastWrong = 0;
  const kb = keyboard(48, 2, (m, el, real) => {
    const good = o.color === "w" ? !isBlack(m) : isBlack(m);
    if (!real) P.play(m, 0, good ? .7 : .4, good ? .3 : .15);
    if (!playing) return;
    if (good) {
      n++; meter.firstChild.style.width = Math.min(100, n / GOAL * 100) + "%";
      if (el) { el.classList.remove("found"); void el.offsetWidth; el.classList.add("found"); setTimeout(() => el.classList.remove("found"), 250); }
      if (n === GOAL) { say.className = "say ok"; say.textContent = "じょうず！"; sv("じょうず！"); setTimeout(endPlay, 900); }
    } else {
      const now = Date.now(); if (now - lastWrong < 1200) return; lastWrong = now;
      missOne(); say.className = "say ng"; say.textContent = o.wrong; sv(o.wrong);
      if (el) { el.classList.remove("wrong"); void el.offsetWidth; el.classList.add("wrong"); }
    }
  });
  kb.classList.add("tall", o.color === "w" ? "only-w" : "only-k");
  sc.appendChild(realKeysSwitch(sc, kb, kb.onKey)); sc.appendChild(kb); sc.appendChild(meter); sc.appendChild(say);
  const startBtn = document.createElement("button"); startBtn.className = "btn big"; startBtn.textContent = "はじめる"; sc.appendChild(startBtn);
  startBtn.onclick = () => {
    startBtn.hidden = true; P.ac(); playing = true; n = 0; say.className = "say"; say.textContent = "すきなように ひいてね♪";
    stop = pad(o.color === "w" ? PAD_WHITE : PAD_BLACK);
    endT = setTimeout(endPlay, 18000);
  };
  let endT = 0, ended = false;
  function endPlay() {
      if (ended || !playing) return; ended = true; clearTimeout(endT);
      playing = false; if (stop) stop(); stop = null;
      if (n >= 6) { cheer(say, o.done); P.pinpon(); earn(n >= GOAL ? 2 : 1, meter); }
      else { say.className = "say"; say.textContent = o.more; sv(o.more); }
      const again = document.createElement("button"); again.className = "btn light"; again.textContent = "もういちど ひく"; again.onclick = () => go(S.scene); sc.appendChild(again);
      next(sc, "つぎへ", o.next);
  }
  const prev = cleanup; cleanup = () => { playing = false; if (stop) stop(); if (prev) prev(); };
}

SCENES.w2c = sc => freePlay(sc, { color: "w", prog: PROG_WHITE, next: "w2s2",
  intro: "こんどは しろで えんそう しよう！<br>しろい けんばんを すきなように ひいてね。",
  wrong: "それは くろ だよ。きょうは しろ！", done: "しろで じょうずに えんそう できたね！", more: "もっと たくさん ひいてみよう！" });

SCENES.w2b = sc => freePlay(sc, { color: "k", prog: PROG_BLACK, next: "w2s1",
  intro: "きょうは くろで えんそう しよう！<br>おんがくに あわせて、くろい けんばんを すきなように ひいてね。",
  wrong: "それは しろ だよ。きょうは くろ！", done: "くろで じょうずに えんそう できたね！", more: "もっと たくさん ひいてみよう！" });

/* チャプター2 レッスン3 ふたつ・みっつの きょく：1小節ごとに「ふたつ！」「みっつ！」。光らない → 2拍たっても ひけないと ヒントで 光る */
SCENES.g3 = sc => {
  missReset("g3");
  const CUES = byAge([2, 2, 3, 3, 2, 3, 2, 3, 3, 2], 4);
  sc.innerHTML = G3_TAG + heroN("くろい けんばんの きょく だよ。<br>「ふたつ」って いったら ふたつの グループ、<br>「みっつ」って いったら みっつの グループを ひいてね。");
  const say = document.createElement("div"); say.className = "say"; say.innerHTML = "&nbsp;";
  const dots = dotsEl(CUES.length);
  let active = null, hits = 0, stop = null, timers = [];
  const clear = () => Object.values(kb.els).forEach(e => e.classList.remove("glow2", "glow3", "found"));
  const kb = keyboard(48, 2, (m, el, real) => {
    if (!real) gp(m, .5, .22);
    if (!active || active.done || !isBlack(m)) return;
    const g = groupOf(m);
    if (g.n === active.n) { active.done = true; hits++; dots.children[active.i].classList.add("on"); g.keys.forEach(k => kb.els[k].classList.add("found")); say.className = "say ok"; say.textContent = ["いいね！", "じょうず！", "せいかい！"][hits % 3]; }
    else if (!active.warned) { active.warned = true; missOne(); say.className = "say ng"; say.textContent = g.n === 3 ? "それは みっつ だよ" : "それは ふたつ だよ"; }
  });
  kb.classList.add("tall");
  sc.appendChild(realKeysSwitch(sc, kb, kb.onKey)); sc.appendChild(kb); sc.appendChild(say); sc.appendChild(dots);
  const startBtn = document.createElement("button"); startBtn.className = "btn big"; startBtn.textContent = "はじめる"; sc.appendChild(startBtn);
  /* リズムなしの ひびきの なかで、3びょうごとに「ふたつ！」「みっつ！」 */
  const GAP = 3200;
  startBtn.onclick = () => {
    startBtn.hidden = true; P.ac(); hits = 0; loadV("E3"); loadV("E4");
    stop = pad(PAD_BLACK); say.className = "say"; say.textContent = "♪";
    CUES.forEach((n, ci) => timers.push(setTimeout(() => {
      clear(); active = { n, i: ci, done: false };
      say.className = "say"; say.textContent = n === 2 ? "ふたつ！" : "みっつ！"; if (!(window.MisoListen && MisoListen.running)) playVoice(n === 2 ? "E3" : "E4");
    }, 2000 + ci * GAP)));
    timers.push(setTimeout(() => {
      active = null; clear(); if (stop) stop(); stop = null;
      say.className = "say ok"; say.textContent = `${CUES.length}かいの うち ${hits}かい できたよ！`;
      if (hits >= CUES.length / 2) { earn(hits >= CUES.length * .8 ? 2 : 1, dots); P.pinpon(); }
      const again = document.createElement("button"); again.className = "btn light"; again.textContent = "もういちど ひく"; again.onclick = () => go("g3"); sc.appendChild(again);
      next(sc, "つぎへ", "g3end");
    }, 2000 + CUES.length * GAP + 400));
  };
  const prev = cleanup; cleanup = () => { active = null; timers.forEach(clearTimeout); if (stop) stop(); if (prev) prev(); };
};

/* ===== チャプター1 レッスン2：おんがくに あわせて「はい！」で ひく =====
   有名な 曲（作曲者が なくなって ながい ので 自由に つかえる 曲）を アプリの ピアノで 編曲。
   1小節に 2かい（1拍め・3拍め）「はい！」の 合図。合図に あわせて きめられた 色の けんばんを ひく。
   くろの 曲は ソ♭の 調（くろい けんばんを どこ ひいても きれいに きこえる）、しろの 曲は ドの 調。
   アツコさんの 曲が できたら、ここの データを いれかえる だけで うごく。 */
const SONGS_W2 = {
  /* ベートーヴェン「よろこびの歌」（交響曲第9番より）ソ♭の 調 */
  joy: { title: "よろこびの うた", by: "ベートーヴェン", bpm: 96, color: "k",
    mel: [[70,1],[70,1],[71,1],[73,1], [73,1],[71,1],[70,1],[68,1], [66,1],[66,1],[68,1],[70,1], [70,1.5],[68,.5],[68,2],
          [70,1],[70,1],[71,1],[73,1], [73,1],[71,1],[70,1],[68,1], [66,1],[66,1],[68,1],[70,1], [68,1.5],[66,.5],[66,2]],
    harm: ["I","I","V","V","I","I","V","V","I","I","V","V","I","I","V","I"],
    chords: { I: [42, [58, 61, 66]], V: [37, [56, 61, 65]] } },
  /* きらきら星（モーツァルト「きらきら星変奏曲」の テーマ）ドの 調 */
  star: { title: "きらきらぼし", by: "モーツァルト", bpm: 100, color: "w",
    mel: [[72,1],[72,1],[79,1],[79,1], [81,1],[81,1],[79,2], [77,1],[77,1],[76,1],[76,1], [74,1],[74,1],[72,2],
          [79,1],[79,1],[77,1],[77,1], [76,1],[76,1],[74,2], [79,1],[79,1],[77,1],[77,1], [76,1],[76,1],[74,2],
          [72,1],[72,1],[79,1],[79,1], [81,1],[81,1],[79,2], [77,1],[77,1],[76,1],[76,1], [74,1],[74,1],[72,2]],
    harm: ["C","C","F","C","F","C","G","C","C","G","C","G","C","G","C","G","C","C","F","C","F","C","G","C"],
    chords: { C: [36, [60, 64, 67]], F: [41, [60, 65, 69]], G: [43, [59, 62, 67]] } }
};
/* こえに あわせて ひく（よびかけ と こたえ）：
   くりーとが「ターあー」と くろ（しろ）を ひく →「さん、はい！」→ こどもが 1かい ひく。タイミングの はんていは しない */
function playAlong(sc, o) {
  const isK = SONGS_W2[o.song].color === "k";
  sc.innerHTML = C2_TAG + `<div class="today ${isK ? "tk" : "tw"}">はい、${isK ? "くろ" : "しろ"}！</div>` + hero(o.intro) +
    `<div class="cue" id="cue"><span>${isK ? "くろ" : "しろ"}</span></div>`;
  const cueEl = sc.querySelector("#cue"), say = document.createElement("div"); say.className = "say"; say.innerHTML = "&nbsp;";
  const N = byAge(new Array(8).fill(0), 3).length, dots = dotsEl(N);
  let r = 0, turn = false, timers = [], stopPad = null, lastWrong = 0, wait = 0;
  const T = (f, ms) => timers.push(setTimeout(f, ms));
  const keysOf = isK ? [49, 51, 54, 56, 58, 61, 63, 66, 68, 70] : [48, 50, 52, 53, 55, 57, 59, 60, 62, 64, 65, 67, 69, 71];
  const kb = keyboard(48, 2, (m, el, real) => {
    const good = isK ? isBlack(m) : !isBlack(m);
    if (!real) P.play(m, 0, good ? 1.4 : .3, good ? .28 : .12);
    if (!turn) return;
    if (!good) { const t = Date.now(); if (t - lastWrong > 1500) { lastWrong = t; say.className = "say ng"; say.textContent = isK ? "それは しろ だよ。くろ だよ！" : "それは くろ だよ。しろ だよ！"; } return; }
    turn = false; clearTimeout(wait); dots.children[r].classList.add("on"); cueEl.classList.remove("go"); cueEl.classList.add("hit");
    if (el) { el.classList.remove("found"); void el.offsetWidth; el.classList.add("found"); setTimeout(() => el.classList.remove("found"), 600); }
    say.className = "say ok"; say.textContent = "いいね！"; earn(1, el || cueEl);
    r++; T(r >= N ? finish : round, 1500);
  });
  kb.classList.add("tall", isK ? "only-k" : "only-w");
  sc.appendChild(realKeysSwitch(sc, kb, kb.onKey)); sc.appendChild(kb); sc.appendChild(say); sc.appendChild(dots);
  const startBtn = document.createElement("button"); startBtn.className = "btn big"; startBtn.textContent = "はじめる"; sc.appendChild(startBtn);
  function round() {
    cueEl.classList.remove("hit", "go"); turn = false;
    /* くりーとの ばん：ながい 音（ター）を 1つ */
    const m = keysOf[Math.floor(Math.random() * keysOf.length)], e = kb.els[m];
    say.className = "say"; say.textContent = "ター…"; if (!playVoice("I3")) { }
    P.play(m, .05, 1.6, .3);
    if (window.MisoListen) MisoListen.mute(3400);
    /* さん、はい！ → こどもの ばん */
    T(() => { say.textContent = "さん、はい！"; playVoice("D13"); }, 1900);
    T(() => { turn = true; cueEl.classList.add("go"); say.textContent = isK ? "くろ を ひいてね" : "しろ を ひいてね";
      wait = setTimeout(() => { if (turn) { say.textContent = "ゆっくりで いいよ。もういちど"; T(round, 1200); turn = false; } }, 6000); }, 2900);
  }
  function finish() {
    if (stopPad) stopPad(); stopPad = null;
    cheer(say, "ぴったり あわせて ひけたね！"); P.pinpon();
    const again = document.createElement("button"); again.className = "btn light"; again.textContent = "もういちど ひく"; again.onclick = () => go(S.scene); sc.appendChild(again);
    next(sc, "つぎへ", o.next);
  }
  startBtn.onclick = () => { startBtn.hidden = true; P.ac(); stopPad = pad(isK ? PAD_BLACK : PAD_WHITE, .035); T(round, 1500); };
  const prev = cleanup; cleanup = () => { turn = false; clearTimeout(wait); timers.forEach(clearTimeout); if (stopPad) stopPad(); if (prev) prev(); };
}
SCENES.w2s1 = sc => playAlong(sc, { song: "joy", next: "w2c",
  intro: "くりーとの まねっこ だよ。<br>くりーとが「ターあー」と ひいたら、<br>「さん、はい！」で くろい けんばんを ひいてね。" });
SCENES.w2s2 = sc => playAlong(sc, { song: "star", next: "w2end",
  intro: "こんどは しろい けんばんで まねっこ！<br>「さん、はい！」で ひいてね。" });

SCENES.w2end = sc => {
  sc.innerHTML = C2_TAG + heroN("くろ と しろで、じょうずに えんそう できたね！<br>よく がんばりました！<br>また あした、あおうね！", "dance") +
    `<div class="endpic"><img src="${ART}cat_black.webp" alt="" style="max-height:110px"><img src="${ART}cat_white.webp" alt="" style="max-height:110px"></div>`;
  P.chord([60, 64, 67, 72], 0, 1.6, 0.2);
  lessonResult(sc, "w2", "w2a", "lesson1", "チャプター2へ（ふたつ と みっつ）");
};
SCENES.g3end = sc => {
  sc.innerHTML = G3_TAG + heroN("ふたつ と みっつ、ばっちり だね！<br>よく がんばりました！<br>また あした、あおうね！", "dance");
  P.chord([54, 58, 61, 66], 0, 1.6, 0.2);
  lessonResult(sc, "g3", "g3", "r4i", "つぎの レッスンへ（ふたつは いい・みっつは ダメ）");
};

/* ===== チャプター2 レッスン4：ふたつは いい、みっつは ダメ ＋ リズムの まねっこ（みぎて → ひだりて） =====
   ① ひかった グループが ふたつなら タップ、みっつなら タップしない（ふたつは いい、みっつは ダメ）
   ② ワルツ（3びょうし）に のって、くりーとの リズムを まねする：みぎてで
   ③ おなじ ことを ひだりてで
   リズムは「よむ」のでは なく「きいて まねする」。よむのは チャプター3 から。 */
const R4_TAG = `<span class="lesson-tag">チャプター2 ・ レッスン4</span>`;
const R4_BEAT = 60 / 80;   /* ちいさい子 むけに ゆっくり */
/* リズム：1小節（3拍）の なかの 音の ながさ（拍）。タン＝4分音符、タ・タ＝8分音符、ター＝2分音符。
   画面には 書かない（耳で きいて まねする）。おなじ リズムを 2かいずつ → ねんれいで へらす */
const R4_PAT = [[1, 1, 1], [2, 1], [.5, .5, 1, 1], [1, .5, .5, 1], [.5, .5, .5, .5, 1]];
const R4_ALL = R4_PAT.flatMap(d => [d, d]);
const R4_SYL = d => d === 2 ? "I3" : d === 1 ? "I1" : "I2";   // ター・タン・タ
/* ワルツの 伴奏 1小節：ブン・チャッ・チャッ */
function waltzBar(at, bass, ch) { P.play(bass, at, R4_BEAT * 1.2, .2); P.chord(ch, at + R4_BEAT, R4_BEAT * .6, .07); P.chord(ch, at + R4_BEAT * 2, R4_BEAT * .6, .07); }
const R4_PROG = [[42, [58, 61, 66]], [37, [56, 61, 65]]];

/* さいしょに：くろい けんばんには ふたつ と みっつ が ある ことを おもいだしてから */
SCENES.r4i = sc => {
  missReset("r4");
  sc.innerHTML = R4_TAG + heroN("くろい けんばんには、<br>ふたつの グループ と みっつの グループが あったね。<br>おぼえてる？");
  const kb = keyboard(48, 2, m => gp(m, .5, .22)); kb.classList.add("tall"); sc.appendChild(kb);
  groupsIn(48, 2).forEach((g, i) => setTimeout(() => { if (S.scene !== "r4i") return; g.keys.forEach(k => kb.els[k].classList.add(g.n === 2 ? "found" : "glow3")); kb.tag(g.keys, g.n === 2 ? "ふたつ" : "みっつ", "t" + g.n); P.chord(g.keys, 0, .6, .15); }, 1200 + i * 900));
  setTimeout(() => { if (S.scene === "r4i") next(sc, "つぎへ", "r4j"); }, 1200 + 4 * 900);
};
SCENES.r4j = sc => {
  sc.innerHTML = R4_TAG + hero("この レッスンでは、<br>ふたつの グループで あそぶよ。<br>みっつは おやすみ。<br>「ふたつは いい、みっつは ダメ」だよ。");
  const kb = keyboard(48, 2, m => gp(m, .5, .22)); kb.classList.add("tall"); sc.appendChild(kb);
  groupsIn(48, 2).forEach(g => { g.keys.forEach(k => kb.els[k].classList.add(g.n === 2 ? "found" : "rest")); kb.tag(g.keys, g.n === 2 ? "ふたつ" : "おやすみ", "t" + g.n); });
  next(sc, "やってみる", "r4a");
};
/* かんかくで おぼえる：ふたつが ひかったら タップして「いいね！」。みっつが ひかったら くりーとが「ダメ！」と × を つけて おわり（えらばせない） */
SCENES.r4a = sc => {
  sc.innerHTML = R4_TAG + hero("ふたつが ひかったら、タップしてね。<br>みっつは ダメ、だよ。");
  const say = document.createElement("div"); say.className = "say"; say.innerHTML = "&nbsp;";
  const seq = byAge([2, 3, 2, 2, 3, 2, 3, 2, 3, 2], 4), N = seq.length, dots = dotsEl(N);
  let q = -1, cur = null, timers = [];
  const groups = groupsIn(48, 2);
  const T = (f, ms) => timers.push(setTimeout(f, ms));
  const clear = () => { Object.values(kb.els).forEach(e => e.classList.remove("ask", "found", "nope")); kb.querySelectorAll(".tag").forEach(t => t.remove()); };
  const kb = keyboard(48, 2, m => {
    gp(m, .5, .22); if (!cur || cur.n !== 2 || cur.done || !isBlack(m)) return;
    const g = groupOf(m); if (g.n !== 2) return;
    cur.done = true; dots.children[q].classList.add("on"); g.keys.forEach(k => { kb.els[k].classList.remove("ask"); kb.els[k].classList.add("found"); }); kb.tag(g.keys, "いいね！", "t2");
    say.className = "say ok"; say.textContent = "ふたつ、いいね！"; sv("ふたつ、いいね！"); P.pinpon(); earn(1, kb.els[g.keys[0]]);
    T(step, 1500);
  });
  kb.classList.add("tall"); sc.appendChild(kb); sc.appendChild(say); sc.appendChild(dots);
  const startBtn = document.createElement("button"); startBtn.className = "btn big"; startBtn.textContent = "はじめる"; sc.appendChild(startBtn);
  function step() {
    clear();
    if (++q >= N) { cur = null; T(() => go("r4b"), 600); return; }
    const pool = groups.filter(g => g.n === seq[q]), g = pool[Math.floor(Math.random() * pool.length)];
    cur = { n: g.n, g, done: false };
    if (g.n === 2) {
      g.keys.forEach(k => kb.els[k].classList.add("ask")); say.className = "say"; say.textContent = "ふたつ！タップしてね";
    } else {
      /* みっつ：くりーとが すぐ ×。こどもは なにも しなくて いい */
      g.keys.forEach(k => kb.els[k].classList.add("nope")); kb.tag(g.keys, "✕ ダメ", "t3");
      say.className = "say ng"; say.textContent = "みっつは ダメ！"; sv("みっつは ダメ！"); P.buzz();
      dots.children[q].classList.add("on"); cur.done = true; T(step, 1800);
    }
  }
  startBtn.onclick = () => { startBtn.hidden = true; P.ac(); step(); };
  const prev = cleanup; cleanup = () => { timers.forEach(clearTimeout); if (prev) prev(); };
};

/* リズムが あっているか：音の かず と、あいだの ながさの わりあい（小さい子 むけに あまめ） */
function rhythmOk(t, d) {
  if (t.length !== d.length) return false;
  if (t.length < 2) return true;
  const gaps = []; for (let i = 1; i < t.length; i++) gaps.push(t[i] - t[i - 1]);
  const exp = d.slice(0, -1), se = exp.reduce((a, b) => a + b, 0), sg = gaps.reduce((a, b) => a + b, 0);
  if (sg / 1000 < se * R4_BEAT * .5 || sg / 1000 > se * R4_BEAT * 1.8) return false;
  return gaps.every((g, i) => Math.abs(g / sg - exp[i] / se) < .075);
}

function rhythmCopy(sc, o) {
  sc.innerHTML = R4_TAG + hero(o.intro);
  const LIST = byAge(R4_ALL, 4);
  const say = document.createElement("div"); say.className = "say"; say.innerHTML = "&nbsp;";
  const dots = dotsEl(LIST.length);
  let r = 0, taps = [], phase = "wait", timers = [], tries = 0;
  const T = (f, ms) => timers.push(setTimeout(f, Math.max(0, ms)));
  const kb = keyboard(o.low, 2, (m, el, real) => {
    if (!real) gp(m, .45, .25);
    if (phase !== "you" || !isBlack(m)) return;
    const g = groupOf(m);
    if (g.n === 3) { missOne(); say.className = "say ng"; say.textContent = "みっつは ダメ！"; return; }
    taps.push(performance.now());
  });
  kb.classList.add("tall");
  const cap = document.createElement("div"); cap.className = "small"; cap.style.textAlign = o.hand === "L" ? "left" : "right"; cap.textContent = o.hand === "L" ? "← ひだりての ほう（ひくい ところ）" : "みぎての ほう（たかい ところ）→";
  kb.prepend(cap);
  sc.appendChild(realKeysSwitch(sc, kb, kb.onKey)); sc.appendChild(kb); sc.appendChild(say); sc.appendChild(dots);
  const startBtn = document.createElement("button"); startBtn.className = "btn big"; startBtn.textContent = "はじめる"; sc.appendChild(startBtn);
  const B = R4_BEAT, bar = B * 3;
  const flash = (keys, ms) => T(() => keys.forEach(k => { kb.els[k].classList.add("glow2"); setTimeout(() => kb.els[k].classList.remove("glow2"), 220); }), ms);
  function round() {
    const D = LIST[r], g = groupsIn(o.low, 2).filter(x => x.n === 2)[o.hand === "L" ? 0 : 1], c = P.ac(); if (!c) return;
    phase = "demo"; taps = []; say.className = "say"; say.textContent = "きいてね";
    /* すべて 音の 時計で よやく：1小節め ぜんそう／2小節め くりーとの おてほん（ピアノ＋「タン」「タ」の こえ）／3小節め「さん・はい」／4小節め こどもの ばん */
    const t0 = c.currentTime + .9, rel = t => (t - c.currentTime) * 1000;
    for (let b = 0; b < 4; b++) waltzBar(t0 - c.currentTime + b * bar, ...R4_PROG[b % 2]);
    let at = t0 + bar; D.forEach(d => { P.chord(g.keys, at - c.currentTime, Math.min(d, 1.6) * B * .9, .3); playVAt(R4_SYL(d), at - .04); at += d * B; });
    if (window.MisoListen) MisoListen.mute(rel(t0 + bar * 2) + 300);
    const cnt = t0 + bar * 2;
    [0, 1, 2].forEach(k => P.play(84, cnt + k * B - c.currentTime, .1, .07));
    countIn("D13", cnt + B, B);   /* 2拍め「さん」3拍め「はい」 */
    T(() => { say.textContent = "さん、はい！"; }, rel(cnt + B));
    T(() => { phase = "you"; taps = []; say.className = "say"; say.textContent = "どうぞ！"; }, rel(t0 + bar * 3 - B * .4));
    T(check, rel(t0 + bar * 4 + B * .8));
  }
  function check() {
    phase = "check"; const D = LIST[r];
    if (rhythmOk(taps, D)) {
      say.className = "say ok"; say.textContent = "ぴったり！"; sv("ぴったり！"); P.pinpon(); earn(1, dots); dots.children[r].classList.add("on"); tries = 0;
      if (++r >= LIST.length) { T(() => go(o.next), 1500); return; }
      T(round, 1700);
    } else {
      missOne(); tries++; say.className = "say"; say.textContent = taps.length > D.length ? "ちょっと おおかったね。もういちど きいてね。" : "もういちど きいてね。"; sv(say.textContent);
      if (tries >= 3) { tries = 0; dots.children[r].classList.add("on"); say.textContent = "だいじょうぶ、つぎ いこう！"; if (++r >= LIST.length) { T(() => go(o.next), 1500); return; } }
      T(round, 1900);
    }
  }
  startBtn.onclick = () => { startBtn.hidden = true; ["D13", "I1", "I2", "I3"].forEach(loadV); round(); };
  const prev = cleanup; cleanup = () => { phase = "end"; timers.forEach(clearTimeout); if (prev) prev(); };
}

SCENES.r4b = sc => rhythmCopy(sc, { hand: "R", low: 60, next: "r4c",
  intro: "くりーとの まねっこ だよ。<br>みぎてで、ふたつの くろい けんばんを ひいてね。<br>ワルツに のって、タタ タン タン！" });
SCENES.r4c = sc => rhythmCopy(sc, { hand: "L", low: 36, next: "r4end",
  intro: "こんどは ひだりて だよ。<br>ひだりてで、ふたつの くろい けんばんを ひいてね。" });

SCENES.r4end = sc => {
  sc.innerHTML = R4_TAG + heroN("ふたつは いい、みっつは ダメ、ばっちり だね！<br>リズムも じょうず！<br>よく がんばりました！ また あした、あおうね！", "dance");
  P.chord([42, 58, 61, 66], 0, 1.6, .2);
  lessonResult(sc, "r4", "r4i", null, "");
};

/* ---------- 保護者の方へ ---------- */
const PARENT = {
  l2: `<h2>保護者の方へ（レッスン2）</h2><p>ここでは、二つの黒鍵盤と同時に、高い・低いの認識をしていきます。三つの鍵盤を選んでいたら、必ず指摘してあげてください。</p><p>高い・低いは、目と耳、両方でわかれば合格です。耳のクイズでは、まず音を聞かせてから選ばせてください。</p><p>だいずのお部屋のノックは「1、2」の代わりです。「さん、はい！」のあとに、タ タ タン とノックします。この段階では、音楽的であることより、わかりやすさを大事にしています。</p>
    <div class="check"><b>保護者チェックシート</b><label><input type="checkbox" data-c="two2"> 二つの黒鍵盤</label><label><input type="checkbox" data-c="hiEye"> 高い：目でわかる</label><label><input type="checkbox" data-c="hiEar"> 高い：耳でわかる（弾いてあげる）</label><label><input type="checkbox" data-c="loEye"> 低い：目でわかる</label><label><input type="checkbox" data-c="loEar"> 低い：耳でわかる（弾いてあげる）</label></div>`,
  sk: `<h2>保護者の方へ（レッスン0：しろ と くろ）</h2><p>1歳半ごろからのレッスンです。まず「しろ」と「くろ」を見分けます。画面いっぱいの白と黒 → 半分ずつ → 白い猫と黒い猫 → 白い鍵盤と黒い鍵盤、と進み、最後に黒い鍵盤だけをノックします。</p><p>まちがえても叱らず、正しい方が光るのを一緒に見てあげてください。お子様がタップできないときは、指をそえて一緒にどうぞ。</p>
    <div class="check"><b>保護者チェックシート</b><label><input type="checkbox" data-c="wk"> 「しろ」「くろ」と言われて指させる</label><label><input type="checkbox" data-c="kkey"> 黒い鍵盤だけを押せる</label></div>`,
  c2: `<h2>保護者の方へ（チャプター1 レッスン2／チャプター2 レッスン3）</h2><p><b>チャプター1 レッスン2</b>：「きょうは くろ」「きょうは しろ」の曲で、決められた色の鍵盤だけを使い、伴奏に合わせて好きなように弾きます。正しい音を探すのではなく、色を守って楽しく弾けたら合格です。ここではまだ、二つ・三つは気にしなくて大丈夫です。</p><p><b>チャプター2 レッスン3</b>：「ふたつ」「みっつ」と言われたグループを、音楽に合わせて弾きます。このあとのレッスンからは「二つはいい、三つはダメ」を徹底していきます。</p>
    <div class="check"><b>保護者チェックシート</b><label><input type="checkbox" data-c="c2k"> 黒い鍵盤だけで弾ける</label><label><input type="checkbox" data-c="c2w"> 白い鍵盤だけで弾ける</label><label><input type="checkbox" data-c="c223"> 「ふたつ」「みっつ」と言われて、そのグループを弾ける</label></div>`,
  r4: `<h2>保護者の方へ（チャプター2 レッスン4）</h2><p>ここから「二つの黒い鍵盤はいい、三つはダメ」を徹底します。三つのグループを弾いていたら、必ず声をかけてあげてください。</p><p>リズムは、まだ楽譜を読みません。くりーとのお手本（ワルツ・3拍子）を聞いて、まねして弾きます。「タタ タン タン」と口で言いながら弾くと、リズムが体に入ります。右手ができたら左手でも同じことをします。</p><p>小さいお子さんは、このリズムのまねっこを何度もくり返してください。楽譜でリズムを読むのはチャプター3からです。</p>
    <div class="check"><b>保護者チェックシート</b><label><input type="checkbox" data-c="r4no3"> 三つのグループを弾かない</label><label><input type="checkbox" data-c="r4R"> 右手でリズムのまねができる</label><label><input type="checkbox" data-c="r4L"> 左手でリズムのまねができる</label><label><input type="checkbox" data-c="r4say"> 「タタ タン タン」と口で言いながら弾ける</label></div>`,
  default: `<h2>保護者の方へ</h2><p>「ピアノのえほん」は、みそそっフィ絶対音感コースで養った音感を基盤にピアノを学んでいきます。ピアノが弾けない保護者の方でも心配はいりません。お子様と一緒に読み進めてください。</p><p>コインは、正解したときと、本物のピアノで弾けたときだけ増えます。</p>`,
  lesson: `<h2>保護者の方へ（レッスン1）</h2><p>ここでは、二つの黒鍵盤の認識をします。三つの鍵盤を選んでいたら、必ず指摘してあげてください。</p><p>レッスン1を何度か繰り返して練習してから、レッスン2へ進みましょう。</p>
    <div class="check"><b>保護者チェックシート</b><label><input type="checkbox" data-c="two"> 二つの黒鍵盤がわかる</label></div>`
};
$("parentBtn").onclick = () => {
  const html = S.scene.startsWith("lesson1") ? PARENT.lesson : S.scene.startsWith("sk") ? PARENT.sk : S.scene.startsWith("l2") ? PARENT.l2 : /^r4/.test(S.scene) ? PARENT.r4 : /^(w2|g3)/.test(S.scene) ? PARENT.c2 : PARENT.default;
  const hist = Object.keys(LESSON_NAME).filter(k => S.hist && S.hist[k] && S.hist[k].length).map(k => `<li>${LESSON_NAME[k]}：${S.hist[k].slice(-5).map(h => `${h.d.slice(5).replace("-", "/")} まちがい${h.miss}`).join("、")}</li>`).join("");
  $("sheetIn").innerHTML = html + (hist ? `<h2 style="margin-top:14px">これまでの きろく</h2><ul>${hist}</ul><p style="font-size:13px">まちがいが 0〜2こ：次へ進んでOK ／ 3〜5こ：もう一度がおすすめ ／ 6こ以上：もう一度やりましょう。お子様には数ではなく ★ で伝えています。</p>` : "") + `<button class="btn" style="width:100%;margin-top:12px" id="closeSheet">とじる</button>`;
  const ck = S.check || {}; $("sheetIn").querySelectorAll("[data-c]").forEach(c => { c.checked = !!ck[c.dataset.c]; c.onchange = () => { S.check = { ...(S.check || {}), [c.dataset.c]: c.checked }; save(); }; });
  $("sheet").hidden = false; $("closeSheet").onclick = () => { $("sheet").hidden = true; };
};
$("homeBtn").onclick = () => { $("sheet").hidden = true; go("home"); };
$("prevBtn").onclick = () => stepGo(-1);
$("nextBtn").onclick = () => stepGo(1);
/* 指で 左右に スライド（けんばんの 上では しない） */
(function () {
  let x0 = 0, y0 = 0, ok = false;
  document.addEventListener("touchstart", e => { const t = e.touches[0]; x0 = t.clientX; y0 = t.clientY; ok = e.touches.length === 1 && !e.target.closest(".kbd, .keys, input, textarea, .sheet, .dragzone"); }, { passive: true });
  document.addEventListener("touchend", e => {
    if (!ok || S.scene === "home") return; const t = e.changedTouches[0], dx = t.clientX - x0, dy = t.clientY - y0;
    if (Math.abs(dx) > 70 && Math.abs(dx) > Math.abs(dy) * 1.8) stepGo(dx < 0 ? 1 : -1);
  }, { passive: true });
})();
$("sheet").addEventListener("click", e => { if (e.target.id === "sheet") $("sheet").hidden = true; });

showCoins();
const start = new URLSearchParams(location.search).get("s");
go(start && SCENES[start] ? start : "home");
document.addEventListener("pointerdown", () => P.load(), { once: true });
