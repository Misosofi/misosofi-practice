/* ===== "Add to Home Screen" helper =====
   Android / Chrome / Edge / desktop: one tap opens the browser's own install dialog.
   iPhone / iPad (Apple does not allow a one-tap install): a short picture guide. */
const INST = { evt: null, shown: false };
window.addEventListener("beforeinstallprompt", e => { e.preventDefault(); INST.evt = e; if (INST.want) installMaybe(); });
window.addEventListener("appinstalled", () => { INST.evt = null; installHide(); try { localStorage.setItem("mp-installed", "1"); } catch (e) { } });

const instStandalone = () => (window.matchMedia && matchMedia("(display-mode: standalone)").matches) || navigator.standalone === true;
const instIOS = () => /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
const instIPad = () => /iPad/.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
const instMobile = () => instIOS() || /Android/i.test(navigator.userAgent);
const instInApp = () => /FBAN|FBAV|Instagram|Line\/|WhatsApp|GSA\//i.test(navigator.userAgent);

const IC_SHARE = `<svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><path d="M12 3v12M7.5 7.5 12 3l4.5 4.5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M8 10H6a1 1 0 0 0-1 1v9a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-9a1 1 0 0 0-1-1h-2" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>`;
const IC_ADD = `<svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><rect x="4" y="4" width="16" height="16" rx="4" fill="none" stroke="currentColor" stroke-width="2"/><path d="M12 8.5v7M8.5 12h7" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>`;
const IC_DOTS = `<svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><circle cx="12" cy="5" r="2" fill="currentColor"/><circle cx="12" cy="12" r="2" fill="currentColor"/><circle cx="12" cy="19" r="2" fill="currentColor"/></svg>`;

/* called after sign-in; shows the banner unless already installed or put off */
function installMaybe(force) {
  if (typeof DEMO !== "undefined" && DEMO && !force) return;
  if (instStandalone()) return;
  if (!force) {
    if (!instMobile() && !INST.evt) { INST.want = true; return; } // computers: only when the browser can install
    try { const l = +localStorage.getItem("mp-install-later") || 0; if (Date.now() < l) return; } catch (e) { }
  }
  if (INST.shown) return; INST.shown = true;
  let el = document.getElementById("inst");
  if (!el) { el = document.createElement("div"); el.id = "inst"; el.className = "inst"; document.body.appendChild(el); }
  el.innerHTML = `<img src="icons/icon-192.png" alt="" width="44" height="44">
    <div class="inst-t"><b>${esc(t("in_title"))}</b><span>${esc(t("in_sub"))}</span></div>
    <div class="inst-b"><button class="btn sm" data-inst="add">${esc(t("in_add"))}</button><button class="inst-x" data-inst="later" aria-label="${esc(t("in_later"))}">${esc(t("in_later"))}</button></div>`;
  el.hidden = false;
  el.onclick = installClick;
}
function installHide() { const el = document.getElementById("inst"); if (el) el.hidden = true; INST.shown = false; }
async function installClick(e) {
  const b = e.target.closest("[data-inst]"); if (!b) return;
  const a = b.dataset.inst;
  if (a === "later") { try { localStorage.setItem("mp-install-later", String(Date.now() + 5 * 864e5)); } catch (_) { } installHide(); return; }
  if (a === "add") {
    if (INST.evt) {
      const ev = INST.evt; INST.evt = null;
      try { ev.prompt(); const c = await ev.userChoice; if (c && c.outcome === "accepted") installHide(); } catch (_) { installGuide(); }
      return;
    }
    installGuide();
  }
}
/* picture guide for iPhone / iPad / browsers without an install button */
function installGuide() {
  let g = document.getElementById("instg");
  if (!g) { g = document.createElement("div"); g.id = "instg"; g.className = "instg"; document.body.appendChild(g); }
  const ios = instIOS(), ipad = instIPad();
  let steps;
  if (instInApp()) steps = [[IC_DOTS, t("in_inapp")]];
  else if (ios) steps = [
    [IC_SHARE, ipad ? t("in_ios1_ipad") : t("in_ios1")],
    [IC_ADD, t("in_ios2")],
    ["<b class='instg-n'>Add</b>", t("in_ios3")],
  ];
  else steps = [[IC_DOTS, t("in_and1")], [IC_ADD, t("in_and2")]];
  g.innerHTML = `<div class="instg-p" role="dialog" aria-modal="true" aria-labelledby="instg-h">
      <h2 id="instg-h">${esc(t("in_title"))}</h2>
      <ol>${steps.map((s, i) => `<li><span class="instg-i">${s[0]}</span><span><b>${i + 1}.</b> ${esc(s[1])}</span></li>`).join("")}</ol>
      <p class="muted small">${esc(t("in_after"))}</p>
      <button class="btn block" data-g="ok">${esc(t("in_ok"))}</button>
    </div>
    ${ios && !ipad && !instInApp() ? `<div class="instg-arrow" aria-hidden="true">↓</div>` : ""}`;
  g.hidden = false;
  g.onclick = e => { if (e.target === g || e.target.closest("[data-g]")) g.hidden = true; };
}
