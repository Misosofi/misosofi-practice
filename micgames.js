/* ===== Microphone in the games (uses pitch.js; nothing is recorded or sent) =====
   Solfège: the child sings the note on the staff; holding the right note (any octave) for about half a second counts.
   Note Catcher: "play on my piano" mode — the child plays the note on a real piano instead of tapping the screen. */
const MIC = { on: false, mode: null, hold: 0, heard: null, t0: 0 };
const pcOf = m => ((m % 12) + 12) % 12;
function micStop() { if (MIC.on) { try { pitchStop(); } catch (e) { } } MIC.on = false; MIC.mode = null; }
function micLiveHTML() {
  return `<div class="mic-live" id="micLive"><span class="mic-dot"></span><span id="micNote">${t("mic_listening")}</span><span class="mic-bar"><i id="micLvl"></i></span></div>`;
}
function micShow(o) {
  const n = document.getElementById("micNote"), l = document.getElementById("micLvl");
  if (l) l.style.width = Math.round((o.level || 0) * 100) + "%";
  if (n) n.textContent = o.midi != null ? pcName(o.midi) : t("mic_listening");
}
async function micStart(mode, onLive, onNote) {
  micStop();
  try { await pitchStart(onNote || null, onLive || null); S.micOk = true; MIC.on = true; MIC.mode = mode; MIC.hold = 0; MIC.t0 = Date.now(); return true; }
  catch (e) { toast(t("micBlocked")); return false; }
}

/* ---------- solfège: sing it ---------- */
function solfMicBtn() {
  if (A?.k !== "solf" || A.picked != null) return "";
  if (A.tap) return "";
  if (MIC.mode !== "solf" && S.micOk) setTimeout(() => { if (A?.k === "solf" && A.picked == null && !A.tap && MIC.mode !== "solf") micStart("solf", solfLive).then(ok => ok && renderAct()); }, 150);
  return MIC.mode === "solf" ? `${micLiveHTML()}<div class="big-msg" style="text-align:center">🎤 ${t("mic_singNow")}</div>`
    : `<button class="btn block" data-mic="solf" style="padding:18px">🎤 ${t("mic_sing")}</button>`;
}
function solfLive(o) {
  micShow(o);
  if (!A || A.k !== "solf" || A.picked != null) return;
  const Q = A.qs[A.i]; if (!Q) return;
  if (o.midi != null && pcOf(o.midi) === pcOf(Q.midi) && Math.abs(o.cents) < 45) MIC.hold++; else MIC.hold = Math.max(0, MIC.hold - 1);
  if (o.midi != null) MIC.heard = o.midi;
  if (MIC.hold >= 14) {   /* about half a second on the right note */
    micStop(); A.picked = Q.ans; A.res[A.i] = true; A.sung = true; S.sangOn = TK; ding(true); renderAct();
  } else if (Date.now() - MIC.t0 > 15000) { micStop(); toast(MIC.heard != null ? t("mic_heard", { n: pcName(MIC.heard) }) : t("mic_quiet")); A.tap = true; renderAct(); }
}

/* ---------- Note Catcher: play on my piano ---------- */
function ncMicToggle() { return `<label class="toggle" style="border:0;padding:0"><span><strong>🎹 ${t("mic_ncOn")}</strong><br><span class="muted small">${t("mic_ncHow")}</span></span><input type="checkbox" id="ncMicOn" ${S.ncMic ? "checked" : ""}></label>`; }
function ncMicNote(midi) {
  const R = A?.run; if (!R || R.lock || R.i >= NC_N) return;
  const ok = pcOf(midi) === R.cur.pc;
  const key = document.querySelector(`[data-act="ncKey"][data-pc="${R.cur.pc}"]`);
  if (key) key.classList.add(ok ? "hit" : "miss");
  if (!ok) { const wrong = document.querySelector(`[data-act="ncKey"][data-pc="${pcOf(midi)}"]`); if (wrong) wrong.classList.add("miss"); if (key) key.classList.add("hit"); }
  R.res[R.i] = ok; if (ok) R.ok++; R.lock = true;
  const fb = document.getElementById("ncFb"); if (fb) { fb.className = "nc-fb " + (ok ? "ok" : "no"); fb.textContent = ok ? "✓ " + pcName(midi) : t("nc_heard", { n: pcName(midi) }); }
  setTimeout(() => { if (!A?.run) return; R.lock = false; R.i++; if (R.i >= NC_N) { ncFinish(); micStop(); } else R.cur = ncNote(NC_LEVELS.find(x => x.id === R.lvl), R.cur); renderAct(); refreshTop(); }, ok ? 260 : 1000);
}

document.addEventListener("click", async e => {
  const b = e.target.closest("[data-mic]"); if (!b || !S) return;
  if (b.dataset.mic === "solf") { ac(); if (await micStart("solf", solfLive)) renderAct(); }
  else if (b.dataset.mic === "stop") { micStop(); renderAct(); }
});
document.addEventListener("change", e => { if (e.target.id === "ncMicOn") { S.ncMic = e.target.checked; save(); } });
