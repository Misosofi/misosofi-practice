/* ===== This week's mission =====
   Every free-practice game should be played at least once a week. Each day the app picks two games that are not
   done yet this week (random, but the same all day). Each game opens at the child's own level (the level the game
   remembers, or the next rhythm week), so the mission always fits. All done in a week → a big bonus. */
const MS_KEYS = ["rhythm", "flash", "ear", "solf", "numb", "cplace", "sight", "nr", "tech", "theory"];
const MS_IC = { rhythm: "🍎", flash: "⚡", ear: "👂", solf: "🎤", numb: "🔢", cplace: "🏠", sight: "👀", nr: "🎹", tech: "✋", theory: "📖" };
function msWeek() { const d = new Date(TK + "T12:00:00"), dow = (d.getDay() + 6) % 7, out = []; for (let i = 0; i < 7; i++) { const x = new Date(d); x.setDate(d.getDate() - dow + i); out.push(x.toISOString().slice(0, 10)); } return out; }
function msDone() { const D = new Set(); msWeek().forEach(day => { const Q = S.quest?.[day]; if (Q) MS_KEYS.forEach(k => { if (Q[k]) D.add(k); }); }); return D; }
function msName(k) { return k === "rhythm" ? t("rs_h") : k === "flash" ? t("fl_h") : k === "numb" ? t("nb_h") : k === "cplace" ? t("cp_h") : t("a_" + k); }
function msPicks(D) {
  const left = MS_KEYS.filter(k => !D.has(k)); let h = 0; for (const ch of TK + (S.name || "")) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  const r = () => (h = (h * 1103515245 + 12345) >>> 0) / 4294967296, a = left.slice();
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a.slice(0, 2);
}
function msGoAttr(k) {
  if (k === "rhythm") return `data-rs="open" data-u="${typeof rsOpenN === "function" ? (rsS(), rsOpenN() - 1) : 0}"`;
  if (k === "flash") return `data-fl="open"`; if (k === "numb") return `data-nb="open"`; if (k === "cplace") return `data-cp="open"`;
  return `data-act="open" data-k="${k}"`;
}
function msCard() {
  if (!S) return ""; const D = msDone(), wk = msWeek()[0], n = MS_KEYS.filter(k => D.has(k)).length, all = n === MS_KEYS.length;
  if (all && !(S.msBonus ||= {})[wk]) { S.msBonus[wk] = TK; setTimeout(() => { earn(10); celebrate(); toast(t("ms_allDone")); }, 400); save(); }
  const picks = msPicks(D);
  return `<div class="card ms-card stack"><div class="row" style="justify-content:space-between;align-items:center"><b>🗓️ ${t("ms_h")}</b><span class="small muted">${n} / ${MS_KEYS.length}</span></div>
   <div class="ms-dots">${MS_KEYS.map(k => `<span class="ms-dot ${D.has(k) ? "on" : ""}" title="${esc(msName(k))}">${MS_IC[k]}</span>`).join("")}</div>
   ${all ? `<div class="ms-all">🏆 ${t("ms_allDone")}</div>` : `<div class="small muted">${t("ms_today")}</div>${picks.map(k => `<button class="btn block ms-go" ${msGoAttr(k)}>${MS_IC[k]} ${esc(msName(k))} →</button>`).join("")}`}</div>`;
}
