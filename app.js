/* ===== Boot, auth screens, routing ===== */
const PARAMS = new URLSearchParams(location.search);
const DEMO = PARAMS.get("demo") === "1";
const RECOVERY_URL = /type=recovery/.test(location.hash);
const HASH_ERR = (() => { const m = location.hash.match(/error_description=([^&]+)/); return m ? decodeURIComponent(m[1].replace(/\+/g, " ")) : ""; })();
let DB = null, MODE = "boot", AUTH = { mode: "in", msg: "", err: "", busy: false };

let toastT;
function toast(m) { const el = document.getElementById("toast"); el.textContent = m; el.hidden = false; clearTimeout(toastT); toastT = setTimeout(() => el.hidden = true, 2600); }
function setNet(online) { const n = document.getElementById("net"); if (n) n.hidden = !!online; }
function showBoot(msg, retry) {
  const b = document.getElementById("boot"); b.hidden = false;
  b.innerHTML = `<div class="boot-in">${retry ? "" : `<div class="spin" aria-hidden="true"></div>`}<div>${esc(msg || t("loading"))}</div>${retry ? `<button class="btn" data-act="reload">${t("retry")}</button>` : ""}</div>`;
}
function hideBoot() { document.getElementById("boot").hidden = true; }

/* remember ?join=<teacher uuid> until the user is signed in */
(function captureJoin() {
  const j = PARAMS.get("join"); if (!j) return;
  if (isUuid(j)) { try { localStorage.setItem("mp-join", j); } catch (e) { } } else AUTH.err = t("err_badJoin");
  PARAMS.delete("join");
  try { history.replaceState(null, "", location.pathname + (PARAMS.toString() ? "?" + PARAMS : "") + location.hash); } catch (e) { }
})();
const pendingJoin = () => { try { return localStorage.getItem("mp-join"); } catch (e) { return null; } };

async function boot() {
  applyBase();
  if ("serviceWorker" in navigator && !DEMO && location.protocol === "https:") navigator.serviceWorker.register("./sw.js").catch(e => console.warn("sw", e));
  if (DEMO) document.getElementById("demo").hidden = false;
  window.addEventListener("online", () => setNet(true));
  window.addEventListener("offline", () => setNet(false));
  if (!navigator.onLine) setNet(false);
  try { DB = DEMO ? demoDB() : supabaseDB(); }
  catch (e) { showBoot(t("err_noLib"), true); return; }
  DB.onAuth((ev, u) => { if (ev === "PASSWORD_RECOVERY") { AUTH.mode = "setpw"; showAuth(); } });
  let user = null;
  try { user = await DB.session(); } catch (e) { console.warn(e); }
  if (HASH_ERR) AUTH.err = HASH_ERR;
  if (user && RECOVERY_URL) { AUTH.mode = "setpw"; showAuth(); return; }
  if (!user) { AUTH.mode = pendingJoin() ? "up" : "in"; showAuth(); return; }
  enter(user);
}
function applyBase() { const r = document.documentElement; r.dataset.skin = "studio"; r.lang = LANG; document.getElementById("demo").textContent = t("demoBanner"); document.getElementById("net").textContent = t("offline"); document.title = t("appName"); }

async function enter(user) {
  MODE = "boot"; document.getElementById("auth").hidden = true; showBoot(t("loading"));
  let prof = null;
  try { prof = (await DB.sel("profiles", { eq: { id: user.id } }))[0]; }
  catch (e) {
    if (e.net) { try { prof = JSON.parse(localStorage.getItem("mp-prof-" + user.id)); } catch (_) { } setNet(false); }
    if (!prof) { showBoot(e.net ? t("err_load") : t("err_generic") + " (" + e.message + ")", true); return; }
  }
  if (!prof) { showBoot(t("err_load"), true); return; }
  /* invite link: connect this student to the teacher */
  const j = pendingJoin();
  if (j && prof.role === "student" && j !== prof.teacher_id && navigator.onLine) {
    if (!prof.teacher_id || confirm(t("changeTeacher"))) {
      try { await DB.upd("profiles", { id: user.id }, { teacher_id: j }); prof.teacher_id = j; setTimeout(() => toast(t("au_joined")), 600); }
      catch (e) { setTimeout(() => toast(/foreign key|violates/i.test(e.message) ? t("err_badJoin") : t("syncErr", { m: e.message })), 600); }
    }
  }
  if (j) try { localStorage.removeItem("mp-join"); } catch (e) { }
  try { localStorage.setItem("mp-prof-" + user.id, JSON.stringify(prof)); } catch (e) { }
  try {
    if (prof.role === "teacher") { MODE = "teacher"; await teacherBoot(user, prof); }
    else { MODE = "student"; await studentBoot(user, prof); }
    hideBoot();
  } catch (e) { console.error(e); MODE = "boot"; showBoot(e.net ? t("err_load") : t("err_generic") + " (" + e.message + ")", true); }
}
async function signOutNow() {
  try { if (MODE === "student" && typeof flush === "function") { clearTimeout(flushT); await flush(); } } catch (e) { }
  const id = ME || TS.me?.id;
  try { await DB.signOut(); } catch (e) { }
  if (id && !(OUT && OUT.length)) ["cache", "dirty", "outbox"].forEach(n => { try { localStorage.removeItem(`mp-${n}-${id}`); } catch (e) { } });
  location.replace(location.pathname + (DEMO ? "?demo=1" : ""));
}

/* ----- auth screens ----- */
function authMsg(e) {
  const m = String(e?.message || "");
  if (e?.net) return t("err_net");
  if (/invalid login|invalid credentials/i.test(m)) return t("err_login");
  if (/already registered|already exists/i.test(m)) return t("err_exists");
  if (/rate limit|too many|security purposes/i.test(m)) return t("err_rate");
  if (/not confirmed/i.test(m)) return t("err_confirmFirst");
  if (/password/i.test(m) && /(at least|short|weak|characters)/i.test(m)) return t("err_pwShort");
  if (/email/i.test(m) && /invalid/i.test(m)) return t("err_email");
  return m || t("err_generic");
}
function showAuth() {
  MODE = "auth"; hideBoot(); document.getElementById("app").hidden = true;
  const el = document.getElementById("auth"); el.hidden = false;
  const A_ = AUTH, busy = A_.busy ? "disabled" : "";
  const field = (id, type, label, extra = "") => `<label class="fld"><span class="label">${label}</span><input id="${id}" type="${type}" ${extra} ${busy}></label>`;
  let body = "";
  if (A_.mode === "in") body = `<h1>${t("au_signIn")}</h1><form class="stack" data-form="aIn">${field("aE", "email", t("au_email"), 'autocomplete="email" required')}${field("aP", "password", t("au_pw"), 'autocomplete="current-password" required')}
   <button class="btn block" type="submit" ${busy}>${A_.busy ? t("wait") : t("au_signIn")}</button></form>
   <button class="linkbtn" data-act="aMode" data-m="reset">${t("au_forgot")}</button><button class="linkbtn" data-act="aMode" data-m="up">${t("au_toSignUp")}</button>`;
  if (A_.mode === "up") body = `<h1>${t("au_signUp")}</h1><form class="stack" data-form="aUp">${field("aN", "text", t("au_childName"), 'autocomplete="off" maxlength="40" required')}<div class="muted small">${t("au_childNameD")}</div>
   ${field("aE", "email", t("au_email"), 'autocomplete="email" required')}${field("aP", "password", t("au_pwNew"), 'autocomplete="new-password" minlength="8" required')}
   <button class="btn block" type="submit" ${busy}>${A_.busy ? t("wait") : t("au_signUp")}</button></form><button class="linkbtn" data-act="aMode" data-m="in">${t("au_toSignIn")}</button>`;
  if (A_.mode === "reset") body = `<h1>${t("au_resetH")}</h1><div class="muted">${t("au_resetD")}</div><form class="stack" data-form="aReset">${field("aE", "email", t("au_email"), 'autocomplete="email" required')}
   <button class="btn block" type="submit" ${busy}>${A_.busy ? t("wait") : t("au_sendReset")}</button></form><button class="linkbtn" data-act="aMode" data-m="in">${t("au_back")}</button>`;
  if (A_.mode === "setpw") body = `<h1>${t("au_setPw")}</h1><form class="stack" data-form="aSetPw">${field("aP", "password", t("au_pwNew"), 'autocomplete="new-password" minlength="8" required')}
   <button class="btn block" type="submit" ${busy}>${A_.busy ? t("wait") : t("save")}</button></form>`;
  if (A_.mode === "confirm") body = `<h1>${t("au_signUp")}</h1><div class="card">${t("au_confirm")}</div><button class="btn block" data-act="aMode" data-m="in">${t("au_signIn")}</button>`;
  el.innerHTML = `<div class="auth-in"><div class="brand"><span class="logo">${I.note}</span><div><div class="brand-n">${t("appName")}</div><div class="muted small">${t("au_tagline")}</div></div></div>
  ${pendingJoin() ? `<div class="card teacher small">${t("au_join")}</div>` : ""}
  ${A_.err ? `<div class="card errbox" role="alert">${esc(A_.err)}</div>` : ""}${A_.msg ? `<div class="card okbox" role="status">${esc(A_.msg)}</div>` : ""}
  <div class="card stack">${body}</div>
  ${DB?.demo ? `<div class="card stack"><div class="label">${t("demoH")}</div><button class="btn soft" data-act="aDemoT">${t("demoTeacher")}</button><button class="btn soft" data-act="aDemoS">${t("demoStudent")}</button></div>` : ""}</div>`;
}
function authClick(b) {
  const a = b.dataset.act;
  if (a === "reload") { location.reload(); return; }
  if (a === "aMode") { AUTH = { mode: b.dataset.m, msg: "", err: "", busy: false }; showAuth(); return; }
  if (a === "aDemoT") { authRun(async () => enter(await DB.signIn("teacher@demo.test", "demo1234"))); return; }
  if (a === "aDemoS") {
    const c = DB.demoNewStudent(); try { if (!pendingJoin()) localStorage.setItem("mp-join", DEMO_TEACHER); } catch (e) { }
    authRun(async () => { const r = await DB.signUp(c.email, c.pw, ""); enter(r.user); }); return;
  }
}
async function authRun(fn) {
  AUTH.busy = true; AUTH.err = ""; AUTH.msg = ""; showAuth();
  try { await fn(); AUTH.busy = false; }
  catch (e) { console.warn(e); AUTH.busy = false; AUTH.err = authMsg(e); showAuth(); }
}
function authSubmit(e) {
  const f = e.target.dataset.form, v = id => (document.getElementById(id)?.value || "").trim();
  const email = v("aE"), pw = document.getElementById("aP")?.value || "";
  const bad = m => { AUTH.err = m; showAuth(); };
  if (f !== "aSetPw" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return bad(t("err_email"));
  if (f === "aIn") return authRun(async () => enter(await DB.signIn(email, pw)));
  if (f === "aUp") {
    const name = v("aN"); if (!name) return bad(t("err_name")); if (pw.length < 8) return bad(t("err_pwShort"));
    const j = pendingJoin(), redirect = APP_URL + (j ? "?join=" + j : "");
    return authRun(async () => {
      const r = await DB.signUp(email, pw, name, redirect);
      if (r.needsConfirm) { AUTH = { mode: "confirm", msg: "", err: "", busy: false }; showAuth(); return; }
      enter(r.user);
    });
  }
  if (f === "aReset") return authRun(async () => { await DB.resetPw(email, APP_URL); AUTH = { mode: "in", msg: t("au_resetSent"), err: "", busy: false }; showAuth(); });
  if (f === "aSetPw") {
    if (pw.length < 8) return bad(t("err_pwShort"));
    return authRun(async () => { await DB.setPw(pw); try { history.replaceState(null, "", location.pathname + location.search); } catch (_) { } toast(t("au_pwSaved")); enter(await DB.session()); });
  }
}

/* ----- one set of listeners, routed by mode ----- */
document.addEventListener("click", e => {
  const b = e.target.closest("[data-act]"); if (!b || b.disabled) return;
  if (b.dataset.act === "reload") { location.reload(); return; }
  if (MODE === "student") studentClick(b, e); else if (MODE === "teacher") teacherClick(b, e); else authClick(b, e);
});
document.addEventListener("submit", e => {
  e.preventDefault();
  if (MODE === "student") studentSubmit(e); else if (MODE === "teacher") teacherSubmit(e); else authSubmit(e);
});
document.addEventListener("input", e => { if (MODE === "student") studentInput(e); else if (MODE === "teacher") teacherInput(e); });
document.addEventListener("change", e => { if (MODE === "student") studentChange(e); else if (MODE === "teacher") teacherChange(e); });
document.getElementById("sheet").addEventListener("click", e => {
  if (e.target.id !== "sheet") return;
  if (MODE === "student" && !OB && !(A && A.start)) closeSheet();
  if (MODE === "teacher" && !TS.busy) TcloseSheet();
});
window.addEventListener("error", e => console.error("page error", e.message));
boot();
