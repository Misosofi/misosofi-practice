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
  playName().then(() => voice(text, true));
}
nameLoad();

/* ---------- piano keyboard ---------- */
const BLACK_PC = { 1: 0, 3: 1, 6: 3, 8: 4, 10: 5 };        // black key → white index it sits after
const WHITE_PC = [0, 2, 4, 5, 7, 9, 11];
const isBlack = m => (m % 12) in BLACK_PC;
const groupOf = m => { const pc = m % 12, o = Math.floor(m / 12); return pc === 1 || pc === 3 ? { n: 2, id: o + "-2", keys: [o * 12 + 1, o * 12 + 3] } : { n: 3, id: o + "-3", keys: [o * 12 + 6, o * 12 + 8, o * 12 + 10] }; };
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
    if (onKey) onKey(m, el); else P.play(m, 0, 0.9);
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
function go(name) {
  if (cleanup) { try { cleanup(); } catch (e) { } cleanup = null; }
  S.scene = name; save(); view.innerHTML = ""; const sc = document.createElement("section"); sc.className = "scene"; view.appendChild(sc);
  SCENES[name](sc); window.scrollTo(0, 0);
}
const next = (sc, label, to, cls = "") => { const b = document.createElement("button"); b.className = "btn big " + cls; b.textContent = label; b.onclick = () => { P.ac(); go(to); }; sc.appendChild(b); return b; };

SCENES.home = sc => {
  sc.innerHTML = `<h1 class="title"><small>みそそっフィ</small>ピアノのえほん</h1>
    <div class="endpic">${kuri("dance")}</div>
    <p class="small">ピアノといっしょに あそぼう！</p><div class="grow"></div>`;
  if (!S.name) { const b = next(sc, "はじめる", "intro1"); b.addEventListener("click", () => P.load()); return; }
  [["sk1", "しろ と くろ", ""], ["lesson1", "ふたつ と みっつ", "light"], ["l2a", "たかい おと・ひくい おと", "light"], ["l3", "あそびの きょく", "light"]].forEach(([to, t, c], i) => {
    const b = next(sc, "", to, c); b.innerHTML = `<small style="display:block;font-size:13px">レッスン${i}${to === "l3" ? "（きょく じゅんびちゅう）" : ""}</small>${t}`; b.addEventListener("click", () => P.load()); });
  const r = document.createElement("button"); r.className = "btn light"; r.style.fontSize = "15px"; r.style.minHeight = "44px"; r.textContent = "はじめから（なまえ・とし）"; r.onclick = () => go("intro1"); sc.appendChild(r);
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
  [2, 3, 4, 5, 6, 7, 8, 9].forEach(a => { const x = document.createElement("button"); x.className = "btn light" + (S.age === a ? " on" : ""); x.textContent = a;
    x.onclick = () => { S.age = a; save(); box.querySelectorAll(".btn").forEach(y => y.classList.toggle("on", y === x)); b.disabled = false; }; box.appendChild(x); });
  b = next(sc, "つぎへ", "intro3"); b.disabled = !S.age;
};

SCENES.intro3 = sc => {
  sc.innerHTML = hero("ぼくは、おんがくが だいすき！<br>うたったり、ピアノを ひいたりするんだ。<br>みんなも おんがくは すきかな？") + `<div class="choices"></div><div class="grow"></div>`;
  const box = sc.querySelector(".choices");
  ["だいすき", "すき"].forEach(t => { const x = document.createElement("button"); x.className = "btn light big"; x.textContent = t;
    x.onclick = () => { S.likes = t; save(); P.chord(t === "だいすき" ? [60, 64, 67, 72] : [60, 64, 67], 0, 1.2, 0.22); setTimeout(() => go("intro4"), 650); }; box.appendChild(x); });
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
      (say.textContent = "", voice("")); b = next(sc, "つぎへ", "intro5");
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
const LESSON_OF = sc => /^sk/.test(sc) ? "sk" : /^lesson1/.test(sc) ? "l1" : /^l2/.test(sc) ? "l2" : /^l3/.test(sc) ? "l3" : null;
const LESSON_NAME = { sk: "レッスン0 しろ と くろ", l1: "レッスン1 ふたつ と みっつ", l2: "レッスン2 たかい おと・ひくい おと", l3: "レッスン3 あそびの きょく" };
function missOne() { const k = LESSON_OF(S.scene); if (!k) return; S.miss = S.miss || {}; S.miss[k] = (S.miss[k] || 0) + 1; save(); }
function missReset(k) { S.miss = S.miss || {}; S.miss[k] = 0; save(); }
/* めやす（仮）：0〜2こ＝つぎへ、3〜5こ＝もういちど が おすすめ、6こ いじょう＝もういちど やろう */
function lessonResult(sc, k, again, nextSc, nextLabel) {
  const n = (S.miss && S.miss[k]) || 0, lv = n <= 2 ? 3 : n <= 5 ? 2 : 1;
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
const VOICE_TEXT = {"A1": "こんにちは！ぼくの なまえは、くりーと。くろねこの くりーと だよ。みんなの なまえは、なにかな？", "A2": "よろしくね！ぼくは、6さい。みんなは なんさいかな？", "A3": "ぼくは、おんがくが だいすき！うたったり、ピアノを ひいたりするんだ。みんなも おんがくは すきかな？", "A4": "さっそく みんなと いっしょに、したの がっきを ひくよ。ねえ みんな、この がっき、なにか わかる？", "A5": "そう、ピアノだよ！ピアノには「くろい けんばん」と「しろい けんばん」が あるよ。", "A6": "じゃあ これから、たくさん たのしく ぼくと おんがくで あそぼう！ぼくと まいにち、いっしょに あそんでほしいんだ！あそんでくれる？", "B1": "まっしろ！これは しろ だよ。", "B2": "まっくろ！これは くろ だよ。", "B3": "しろは どっち？", "B4": "くろは どっち？", "B5": "しろい ねこさんは どっち？", "B6": "くろい ねこさんは どっち？", "B7": "しろい けんばんは どっち？", "B8": "くろい けんばんは どっち？", "B9": "こっちかな？", "B10": "こんどは くろい けんばん だけ、ノック ノック してみよう！コン コン！", "B11": "それは しろ だよ。くろい けんばんは どこかな？", "B12": "じょうず！くろい けんばん だけ ノック できたね！", "B13": "しろ と くろ、わかったね！よく がんばりました！また あした、あおうね！", "C1": "よーく みてみると、くろい けんばんは「ふたつの グループ」と「みっつの グループ」が あるよ。", "C2": "ひくい ところから たかい ところへ、「ふたつ、みっつ」と かぞえてみよう！", "C3": "ふたつ", "C4": "みっつ", "C5": "ふたつの くろい けんばんの グループを ぜんぶ タップしてみよう。まちがわないように よーく みてね。みっつじゃないからね。ふたつだよ！", "C6": "いいね！ふたつだね！", "C7": "ダメダメ〜、それは みっつ だよ。", "C8": "じゃあ、クイズだよ！ひかった くろい けんばんは ふたつ？それとも みっつ？", "C9": "みんなの ピアノで、ふたつの くろい けんばんの グループを みつけてみよう。みつけたら、グーを つくって「たんたん」って かるく ひいてみよう。", "C10": "たん！もういっかい！", "C11": "じょうずに ひけたかな？よく がんばりました！きょうの おんがくの あそびは これで おしまい！また あした、あおうね！", "D1": "こんにちは！くりーと だよ！きょうも いっしょに あそぼう！ふたつの くろい けんばんの グループ、おぼえてるかな？ひとつ タップしてみて！", "D2": "おぼえてたね！", "D3": "ピアノの みぎの はしっこは たかい おと、ひだりの はしっこは ひくい おと だよ。ひかった ふたつの グループは たかい？ひくい？", "D4": "こんどは みないで、みみで きいてね。ぞうさん？ことりさん？", "D5": "せいかい！ぞうさんの ひくい おと！", "D6": "せいかい！ことりさんの たかい おと！", "D7": "みんなの ピアノで、いちばん たかい ところの ふたつの くろい けんばんを、みぎてで グーを つくって「たんたん！」", "D8": "たかい おとは、ことりさんの ように かわいい おと だったかな？", "D9": "こんどは いちばん ひくい ところの ふたつの くろい けんばんを、ひだりてで グーを つくって「たんたん！」", "D10": "ひくい おとは、ぞうさんの ように、おおきな ふとい おと だったかな？", "D11": "あれ？だいずの おへやから、おかしな おとが きこえるよ…。ちょっと のぞきみに いってみない？", "D12": "まんなかの ふたつの くろい けんばんで、「タ タ タン！」って ノック してね。くりーとの まねっこ だよ。", "D13": "さん、はい！", "D14": "コンコン… あれ？へんじが ないね。もういちど！", "D15": "ドアが すこし あいたよ！もういっかい！", "D16": "だいず、なに してるの？", "D17": "いまは だめ〜！", "D18": "あーっ！だいず、ぬすみぐい してたー！", "D19": "もう、だいずったら！みんな、ノック じょうず だったよ！", "D20": "きょうは、たかい おと と ひくい おと が わかったね！よく がんばりました！また あした、あおうね！", "E1": "おんがくに あわせて、くろい けんばんで グーを つくって「たんたん」しよう！ひかった グループを ひいてね。", "E2": "いち、に、さん、はい！", "E3": "ふたつ！", "E4": "みっつ！", "E5": "みぎて", "E6": "ひだりて", "E7": "りょうて", "E8": "せいかい！", "E9": "いいね！", "E10": "じょうず！", "E11": "ざんねん、もういちど よーく みてね。", "E12": "もういちど よーく きいてね。", "E13": "それは しろい けんばん だよ。", "E14": "それは みっつの グループ だよ。"};
const VOICE_HAVE = new Set(["A1", "A2", "A3", "A4", "A5", "A6", "B1", "B10", "B11", "B12", "B13", "B2", "B3", "B4", "B5", "B6", "B7", "B8", "B9", "C1", "C10", "C11", "C2", "C3", "C4", "C5", "C6", "C7", "C8", "C9"]);
/* アツコさんの声：文が台本と同じなら録音を流す。録音がない文は、speak は機械の声、voice は何も言わない。
   声を流している間は、マイクが声を拾わないように止める。 */
const vnorm = t => String(t).split(nm() || "\u0000").join("").split(S.name || "\u0000").join("").replace(/<[^>]+>/g, "").replace(/[\s、。！？!?「」『』（）()…・〜~ー,.]/g, "");
const VOICE_BY_TEXT = {}; for (const id in VOICE_TEXT) VOICE_BY_TEXT[vnorm(VOICE_TEXT[id])] = id;
let vAudio = null, vLast = "", vLastAt = 0, pendingSound = null;
/* リンクから ひらいた ときなど、まだ 画面に さわっていないと iPhone は 音を 止める → さいしょに さわった ときに 流す */
document.addEventListener("pointerdown", () => { if (pendingSound) { const f = pendingSound; pendingSound = null; f(); } }, true);
function playVoice(id) {
  if (!VOICE_HAVE.has(id)) return false;
  if (nameBusy) { vLast = vnorm(VOICE_TEXT[id] || ""); vLastAt = Date.now(); nameBusy.then(() => playVoice(id)); return true; }
  try { if (window.speechSynthesis) speechSynthesis.cancel(); } catch (e) { }
  if (vAudio) { vAudio.pause(); vAudio = null; }
  vLast = vnorm(VOICE_TEXT[id] || ""); vLastAt = Date.now();
  const a = new Audio("voice/" + id + ".mp3"); vAudio = a;
  a.addEventListener("loadedmetadata", () => { if (window.MisoListen) MisoListen.mute((a.duration || 3) * 1000 + 300); });
  if (window.MisoListen) MisoListen.mute(4000);
  a.play().catch(() => { pendingSound = () => a.play().catch(() => { }); }); return true;
}
const playVoiceThen = async (id, maxMs = 7000) => { if (nameBusy) await nameBusy; return await new Promise(ok => { if (!playVoice(id)) return ok(false); const a = vAudio, t = setTimeout(() => ok(true), maxMs); a.addEventListener("ended", () => { clearTimeout(t); ok(true); }, { once: true }); a.addEventListener("error", () => { clearTimeout(t); ok(false); }, { once: true }); }); };
const voice = (t, force) => { if (!force && window.MisoListen && MisoListen.running) return false; const n = vnorm(t), id = VOICE_BY_TEXT[n]; if (!id) return false; const now = Date.now(); if (n === vLast && now - vLastAt < 1500) return true; vLast = n; vLastAt = now; return playVoice(id); };
const speak = t => { if (voice(t, true)) return; try { if (!window.speechSynthesis) return; speechSynthesis.cancel(); const u = new SpeechSynthesisUtterance(t.replace(/<[^>]+>/g, "")); u.lang = "ja-JP"; u.rate = 0.9; u.pitch = 1.3; speechSynthesis.speak(u); if (!navigator.userActivation || !navigator.userActivation.hasBeenActive) pendingSound = () => { speechSynthesis.cancel(); speechSynthesis.speak(u); }; } catch (e) { } };
const SK_TAG = `<span class="lesson-tag">レッスン0 ・ しろ と くろ</span>`;
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
  const NEED = 8; let n = 0, done = false;
  sc.innerHTML = SK_TAG + hero("こんどは くろい けんばん だけ<br>ノック ノック してみよう！<br>コン コン！");
  
  const say = document.createElement("div"); say.className = "say";
  const knocks = document.createElement("div"); knocks.className = "knocks"; knocks.innerHTML = "<i></i>".repeat(NEED);
  const kb = keyboard(60, 1, (m, el, real) => {
    if (done) return;
    if (isBlack(m)) {
      if (!real) { P.play(m, 0, 0.6, 0.28); knock(); } el.classList.remove("found"); void el.offsetWidth; el.classList.add("found"); setTimeout(() => el.classList.remove("found"), 300);
      knocks.children[n].classList.add("on"); n++; say.className = "say ok"; say.textContent = n % 2 ? "コン！" : "コン コン！";
      if (n >= NEED) { done = true; cheer(say, "じょうず！くろい けんばん だけ ノック できたね！"); P.pinpon(); earn(2, kb); setTimeout(() => go("skend"), 1700); }
    } else { if (!real) P.play(m, 0, 0.5, 0.15); say.className = "say"; (say.textContent = "それは しろ だよ。くろい けんばん は どこかな？", voice("それは しろ だよ。くろい けんばん は どこかな？")); }
  });
  kb.classList.add("tall"); sc.appendChild(realKeysSwitch(sc, kb, kb.onKey)); sc.appendChild(kb); sc.appendChild(say); sc.appendChild(knocks);
};
function knock() { const c = P.ac(); if (!c) return; const t = c.currentTime; [0, 0.12].forEach(d => { const o = c.createOscillator(), g = c.createGain(); o.type = "triangle"; o.frequency.setValueAtTime(900, t + d); o.frequency.exponentialRampToValueAtTime(300, t + d + 0.06); g.gain.setValueAtTime(0.25, t + d); g.gain.exponentialRampToValueAtTime(0.001, t + d + 0.08); o.connect(g); g.connect(c.destination); o.start(t + d); o.stop(t + d + 0.1); }); }

SCENES.skend = sc => {
  sc.innerHTML = SK_TAG + heroN("しろ と くろ、わかったね！<br>よく がんばりました！<br>また あした、あおうね！", "dance") +
    `<div class="endpic"><img src="${ART}cat_black.webp" alt="" style="max-height:120px"><img src="${ART}cat_white.webp" alt="" style="max-height:120px"></div>
`;
  P.chord([60, 64, 67, 72], 0, 1.6, 0.22);
  lessonResult(sc, "sk", "sk1", "lesson1", "つぎの レッスンへ（ふたつ と みっつ）");
};

/* レッスン1-1：ふたつ と みっつ を見てみる */
SCENES.lesson1 = sc => {
  missReset("l1");
  sc.innerHTML = `<span class="lesson-tag">チャプター1 ・ レッスン1</span>` +
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
  sc.innerHTML = `<span class="lesson-tag">チャプター1 ・ レッスン1</span>` +
    hero("ふたつの くろいけんばんの グループを ぜんぶ タップしてみよう。<br>まちがわないように よーくみてね。<br>みっつじゃないからね。ふたつだよ！");
  const low = 48, oct = 3, all = groupsIn(low, oct).filter(g => g.n === 2), found = new Set();
  const say = document.createElement("div"); say.className = "say"; say.innerHTML = "&nbsp;";
  const dots = document.createElement("div"); dots.className = "dots"; dots.innerHTML = all.map(() => "<i></i>").join("");
  const kb = keyboard(low, oct, (m, el) => {
    P.play(m, 0, 0.7, 0.25);
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
  sc.innerHTML = `<span class="lesson-tag">チャプター1 ・ レッスン1</span>` + hero("じゃあ、クイズだよ！<br>ひかった くろいけんばんは<br>ふたつ？ それとも みっつ？");
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
  sc.innerHTML = `<span class="lesson-tag">チャプター1 ・ レッスン1</span>` +
    hero("みんなの ピアノで、ふたつの くろいけんばんの グループを みつけてみよう。<br>みつけたら、グーを つくって「たんたん」って かるく ひいてみよう。") +
    `<div class="mic" id="mic"><div class="ring"><svg viewBox="0 0 24 24" fill="none" stroke="#4F8DBA" stroke-width="2" stroke-linecap="round"><rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3"/></svg></div>
      <div class="taps"><span>たん</span><span>たん</span></div></div>
    <div class="say" id="say">&nbsp;</div><div class="grow"></div>`;
  const say = sc.querySelector("#say"), mic = sc.querySelector("#mic"), taps = sc.querySelectorAll(".taps span");
  const start = document.createElement("button"); start.className = "btn big sky"; start.textContent = "ピアノで きかせてね"; sc.appendChild(start);
  const skip = document.createElement("button"); skip.className = "btn light"; skip.textContent = "ピアノが ないときは こちら"; sc.appendChild(skip);
  let hits = 0, lastAt = 0, done = false;
  const finish = () => { done = true; MisoListen.stop(); mic.classList.remove("on"); cheer(say, "じょうず！ふたつの グループだね！"); P.pinpon(); earn(3, mic); setTimeout(() => go("lesson1end"), 1600); };
  start.onclick = async () => {
    start.disabled = true; say.className = "say"; (say.textContent = "きいているよ…", voice("きいているよ…"));
    try {
      await MisoListen.start({
        onLevel: db => mic.style.setProperty("--lv", Math.max(.8, Math.min(1.25, .8 + (db + 60) / 80))),
        onNote: m => {
          if (done) return; const pc = m % 12, now = performance.now();
          if (pc === 1 || pc === 3) {
            if (now - lastAt < 150) return; lastAt = now; taps[Math.min(hits, 1)].classList.add("on"); hits++;
            if (hits >= 2) finish(); else { say.className = "say ok"; (say.textContent = "たん！もういっかい！", voice("たん！もういっかい！")); }
          } else if (pc === 6 || pc === 8 || pc === 10) { say.className = "say ng"; (say.textContent = "それは みっつの グループだよ", voice("それは みっつの グループだよ")); }
          else { say.className = "say ng"; (say.textContent = "それは しろい けんばんだよ", voice("それは しろい けんばんだよ")); }
        }
      });
      mic.classList.add("on"); start.hidden = true;
    } catch (e) { start.disabled = false; say.className = "say ng"; (say.textContent = "マイクが つかえなかったよ", voice("マイクが つかえなかったよ")); }
  };
  /* ピアノがない日：画面のけんばんで。コインはなし（本物のピアノで ひけたときだけ） */
  skip.onclick = () => { MisoListen.stop(); go("lesson1end"); };
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
const L2_TAG = `<span class="lesson-tag">チャプター1 ・ レッスン2</span>`;
const imgPick = (src, alt) => `<img src="${ART}${src}" alt="${alt}">`;

SCENES.l2a = sc => {
  missReset("l2");
  sc.innerHTML = L2_TAG + heroN("こんにちは！くりーと だよ！<br>きょうも いっしょに あそぼう！<br>ふたつの くろい けんばんの グループ、おぼえてるかな？<br>ひとつ タップしてみて！");
  
  const say = document.createElement("div"); say.className = "say"; say.innerHTML = "&nbsp;";
  let ok = false;
  const kb = keyboard(48, 2, (m, el) => {
    P.play(m, 0, 0.7, 0.25); if (ok) return;
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
        lock = true; b.classList.add("yes"); say.className = "say ok"; say.textContent = k === "hi" ? "せいかい！ことりさんの たかい おと！" : "せいかい！ぞうさんの ひくい おと！";
        P.pinpon(); earn(1, b); dots.children[q].classList.add("on");
        setTimeout(() => { b.classList.remove("yes"); if (++q >= opt.n) go(opt.next); else ask(); }, 1400);
      } else { softNo(); say.className = "say"; (say.textContent = "もういちど よーく ", voice("もういちど よーく ")) + (opt.ear ? "きいてね" : "みてね"); const r = buttons[want]; r.classList.remove("hint"); void r.offsetWidth; r.classList.add("hint"); setTimeout(() => opt.play && opt.play(want), 500); }
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
  let i = 0, hits = 0, lastAt = 0, done = false;
  sc.innerHTML = L2_TAG + `<div class="hero"><img class="kuri" id="l2dImg" src="${ART}bird.webp" alt=""><div class="bubble" id="l2dB"></div></div>
    <div class="mic" id="mic"><div class="ring"><svg viewBox="0 0 24 24" fill="none" stroke="#4F8DBA" stroke-width="2" stroke-linecap="round"><rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3"/></svg></div>
    <div class="taps"><span>たん</span><span>たん</span></div></div><div class="say" id="say">&nbsp;</div><div class="grow"></div>`;
  const say = sc.querySelector("#say"), mic = sc.querySelector("#mic"), taps = sc.querySelectorAll(".taps span");
  const start = document.createElement("button"); start.className = "btn big sky"; start.textContent = "ピアノで きかせてね"; sc.appendChild(start);
  const skip = document.createElement("button"); skip.className = "btn light"; skip.textContent = "ピアノが ないときは こちら"; sc.appendChild(skip);
  const show = () => { const s = steps[i]; sc.querySelector("#l2dB").innerHTML = `<span class="who">くりーと</span>${s.text}`; sc.querySelector("#l2dImg").src = ART + s.img; taps.forEach(t => t.classList.remove("on")); hits = 0; speak(s.text); };
  const stepDone = () => {
    const s = steps[i]; cheer(say, "じょうず！"); P.pinpon(); earn(2, mic); sc.querySelector("#l2dB").innerHTML = `<span class="who">くりーと</span>${s.after}`; speak(s.after);
    if (++i >= steps.length) { done = true; MisoListen.stop(); mic.classList.remove("on"); setTimeout(() => go("l2e"), 2600); }
    else setTimeout(() => { say.innerHTML = "&nbsp;"; show(); }, 2600);
  };
  start.onclick = async () => {
    start.disabled = true; say.className = "say"; (say.textContent = "きいているよ…", voice("きいているよ…"));
    MisoListen.opt.low = 28; MisoListen.opt.maxHz = 4200;
    try {
      await MisoListen.start({
        onLevel: db => mic.style.setProperty("--lv", Math.max(.8, Math.min(1.25, .8 + (db + 60) / 80))),
        onNote: m => {
          if (done) return; const pc = m % 12, now = performance.now(), s = steps[i];
          if (pc !== 1 && pc !== 3) { say.className = "say ng"; say.textContent = isBlack(m) ? "それは みっつの グループだよ" : "それは しろい けんばんだよ"; return; }
          if (!s.ok(m)) { say.className = "say ng"; say.textContent = s.k === "hi" ? "もっと みぎの、たかい ところだよ" : "もっと ひだりの、ひくい ところだよ"; return; }
          if (now - lastAt < 150) return; lastAt = now; taps[Math.min(hits, 1)].classList.add("on"); hits++;
          if (hits >= 2) stepDone(); else { say.className = "say ok"; (say.textContent = "たん！もういっかい！", voice("たん！もういっかい！")); }
        }
      });
      mic.classList.add("on"); start.hidden = true;
    } catch (e) { start.disabled = false; say.className = "say ng"; (say.textContent = "マイクが つかえなかったよ", voice("マイクが つかえなかったよ")); }
  };
  skip.onclick = () => { MisoListen.stop(); go("l2e"); };
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
    if (phase !== "you") { if (!real) P.play(m, 0, .4, .15); return; }
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
      else { say.className = "say ok"; say.textContent = ["コンコン… あれ？ へんじが ないね。もういちど！", "ドアが すこし あいたよ！もういっかい！"][round - 1]; setTimeout(demo, 1700); }
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
  lessonResult(sc, "l2", "l2a", "l3", "つぎの レッスンへ（あそびの きょく）");
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
const L3_TAG = `<span class="lesson-tag">チャプター1 ・ レッスン3</span>`;
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
    for (let b = 0; b < song.lead; b++) timers.push(setTimeout(() => { say.className = "say"; say.textContent = ["いち", "に", "さん", "はい！"][b] || ""; }, (t0 + b * beat) * 1000));
    song.cues.forEach(([cb, n, h], i) => {
      const at = (t0 + (song.lead + cb) * beat) * 1000;
      timers.push(setTimeout(() => {
        clear(); const g = groupsIn(48, 2).filter(x => x.n === n); const pick = h === "L" ? g[0] : h === "R" ? g[g.length - 1] : null;
        (pick ? [pick] : g).forEach(x => x.keys.forEach(k => kb.els[k].classList.add(n === 2 ? "glow2" : "glow3")));
        active = { n, done: false }; say.className = "say"; say.textContent = n === 2 ? "ふたつ！ たんたん" : "みっつ！ たんたん";
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

/* ---------- 保護者の方へ ---------- */
const PARENT = {
  l2: `<h2>保護者の方へ（レッスン2）</h2><p>ここでは、二つの黒鍵盤と同時に、高い・低いの認識をしていきます。三つの鍵盤を選んでいたら、必ず指摘してあげてください。</p><p>高い・低いは、目と耳、両方でわかれば合格です。耳のクイズでは、まず音を聞かせてから選ばせてください。</p><p>だいずのお部屋のノックは「1、2」の代わりです。「さん、はい！」のあとに、タ タ タン とノックします。この段階では、音楽的であることより、わかりやすさを大事にしています。</p>
    <div class="check"><b>保護者チェックシート</b><label><input type="checkbox" data-c="two2"> 二つの黒鍵盤</label><label><input type="checkbox" data-c="hiEye"> 高い：目でわかる</label><label><input type="checkbox" data-c="hiEar"> 高い：耳でわかる（弾いてあげる）</label><label><input type="checkbox" data-c="loEye"> 低い：目でわかる</label><label><input type="checkbox" data-c="loEar"> 低い：耳でわかる（弾いてあげる）</label></div>`,
  sk: `<h2>保護者の方へ（レッスン0：しろ と くろ）</h2><p>1歳半ごろからのレッスンです。まず「しろ」と「くろ」を見分けます。画面いっぱいの白と黒 → 半分ずつ → 白い猫と黒い猫 → 白い鍵盤と黒い鍵盤、と進み、最後に黒い鍵盤だけをノックします。</p><p>まちがえても叱らず、正しい方が光るのを一緒に見てあげてください。お子様がタップできないときは、指をそえて一緒にどうぞ。</p>
    <div class="check"><b>保護者チェックシート</b><label><input type="checkbox" data-c="wk"> 「しろ」「くろ」と言われて指させる</label><label><input type="checkbox" data-c="kkey"> 黒い鍵盤だけを押せる</label></div>`,
  default: `<h2>保護者の方へ</h2><p>「ピアノのえほん」は、みそそっフィ絶対音感コースで養った音感を基盤にピアノを学んでいきます。ピアノが弾けない保護者の方でも心配はいりません。お子様と一緒に読み進めてください。</p><p>コインは、正解したときと、本物のピアノで弾けたときだけ増えます。</p>`,
  lesson: `<h2>保護者の方へ（レッスン1）</h2><p>ここでは、二つの黒鍵盤の認識をします。三つの鍵盤を選んでいたら、必ず指摘してあげてください。</p><p>レッスン1を何度か繰り返して練習してから、レッスン2へ進みましょう。</p>
    <div class="check"><b>保護者チェックシート</b><label><input type="checkbox" data-c="two"> 二つの黒鍵盤がわかる</label></div>`
};
$("parentBtn").onclick = () => {
  const html = S.scene.startsWith("lesson1") ? PARENT.lesson : S.scene.startsWith("sk") ? PARENT.sk : S.scene.startsWith("l2") ? PARENT.l2 : PARENT.default;
  const hist = Object.keys(LESSON_NAME).filter(k => S.hist && S.hist[k] && S.hist[k].length).map(k => `<li>${LESSON_NAME[k]}：${S.hist[k].slice(-5).map(h => `${h.d.slice(5).replace("-", "/")} まちがい${h.miss}`).join("、")}</li>`).join("");
  $("sheetIn").innerHTML = html + (hist ? `<h2 style="margin-top:14px">これまでの きろく</h2><ul>${hist}</ul><p style="font-size:13px">まちがいが 0〜2こ：次へ進んでOK ／ 3〜5こ：もう一度がおすすめ ／ 6こ以上：もう一度やりましょう。お子様には数ではなく ★ で伝えています。</p>` : "") + `<button class="btn" style="width:100%;margin-top:12px" id="closeSheet">とじる</button>`;
  const ck = S.check || {}; $("sheetIn").querySelectorAll("[data-c]").forEach(c => { c.checked = !!ck[c.dataset.c]; c.onchange = () => { S.check = { ...(S.check || {}), [c.dataset.c]: c.checked }; save(); }; });
  $("sheet").hidden = false; $("closeSheet").onclick = () => { $("sheet").hidden = true; };
};
$("sheet").addEventListener("click", e => { if (e.target.id === "sheet") $("sheet").hidden = true; });

showCoins();
const start = new URLSearchParams(location.search).get("s");
go(start && SCENES[start] ? start : "home");
document.addEventListener("pointerdown", () => P.load(), { once: true });
