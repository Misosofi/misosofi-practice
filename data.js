/* ===== Data access =====
   One small interface used by the whole app. Two implementations:
   - supabaseDB(): the real backend (Supabase Auth, Postgres with RLS, Storage, Edge Function "plan-week").
   - demoDB():     an in-browser fake (localStorage + IndexedDB) used with ?demo=1 for testing without network.
   Every method throws an Error on failure; err.net === true means "no connection" (the write can be retried). */

const APP_URL = (() => { const u = new URL(location.href); u.search = ""; u.hash = ""; return u.href.replace(/index\.html$/, ""); })();

function dbError(e, fallback) {
  const msg = String(e?.message || e?.error_description || e?.error || fallback || "Error");
  const err = new Error(msg);
  err.code = e?.code || e?.statusCode || e?.status || "";
  err.net = (typeof navigator !== "undefined" && navigator.onLine === false) || /failed to fetch|networkerror|load failed|network request failed|fetch failed|timed? ?out/i.test(msg);
  return err;
}

/* ---------- real backend ---------- */
function supabaseDB() {
  const cfg = window.MISOSOFI_CONFIG;
  if (!cfg || !window.supabase || !window.supabase.createClient) throw dbError({ message: "Failed to fetch supabase-js" });
  const sb = window.supabase.createClient(cfg.supabaseUrl, cfg.supabaseAnonKey, {
    auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true, storageKey: "misosofi-auth" }
  });
  const ok = r => { if (r.error) throw dbError(r.error); return r.data; };
  const filt = (q, o = {}) => {
    for (const k in o.eq || {}) q = q.eq(k, o.eq[k]);
    for (const k in o.in || {}) q = q.in(k, o.in[k]);
    for (const k in o.gte || {}) q = q.gte(k, o.gte[k]);
    for (const k in o.lte || {}) q = q.lte(k, o.lte[k]);
    for (const k in o.lt || {}) q = q.lt(k, o.lt[k]);
    return q;
  };
  const wrap = fn => async (...a) => { try { return await fn(...a); } catch (e) { throw e instanceof Error && "net" in e ? e : dbError(e); } };
  const authListeners = [];
  sb.auth.onAuthStateChange((ev, session) => authListeners.forEach(f => { try { f(ev, session?.user || null); } catch (e) { console.error(e); } }));
  return {
    demo: false,
    session: wrap(async () => {
      let r = null; try { r = await sb.auth.getSession(); } catch (e) { r = { error: e, data: {} }; }
      const u = r.data?.session?.user; if (u) return { id: u.id, email: u.email };
      /* offline with an expired token: keep the stored user so the app opens from its local cache */
      if (!navigator.onLine || (r.error && dbError(r.error).net)) { try { const s = JSON.parse(localStorage.getItem("misosofi-auth")); const su = s?.user || s?.currentSession?.user; if (su?.id) return { id: su.id, email: su.email, offline: true }; } catch (e) { } }
      if (r.error) throw dbError(r.error); return null;
    }),
    onAuth: f => authListeners.push(f),
    signIn: wrap(async (email, password) => { const r = await sb.auth.signInWithPassword({ email, password }); if (r.error) throw dbError(r.error); return { id: r.data.user.id, email: r.data.user.email }; }),
    signUp: wrap(async (email, password, name, redirect) => {
      const r = await sb.auth.signUp({ email, password, options: { data: { name }, emailRedirectTo: redirect || APP_URL } });
      if (r.error) throw dbError(r.error);
      /* when the email already exists Supabase returns a user without identities */
      if (r.data.user && Array.isArray(r.data.user.identities) && r.data.user.identities.length === 0) throw dbError({ message: "User already registered" });
      return { user: r.data.user ? { id: r.data.user.id, email: r.data.user.email } : null, needsConfirm: !r.data.session };
    }),
    resetPw: wrap(async (email, redirect) => ok(await sb.auth.resetPasswordForEmail(email, { redirectTo: redirect || APP_URL }))),
    resend: wrap(async (email, redirect) => ok(await sb.auth.resend({ type: "signup", email, options: { emailRedirectTo: redirect || APP_URL } }))),
    setPw: wrap(async password => ok(await sb.auth.updateUser({ password }))),
    signOut: wrap(async () => { await sb.auth.signOut(); }),
    sel: wrap(async (table, o = {}) => {
      let q = filt(sb.from(table).select(o.cols || "*"), o);
      if (o.order) q = q.order(o.order[0], { ascending: o.order[1] !== false });
      if (o.limit) q = q.limit(o.limit);
      return ok(await q) || [];
    }),
    ins: wrap(async (table, rows) => { ok(await sb.from(table).insert(rows)); }),
    ups: wrap(async (table, rows, onConflict) => { ok(await sb.from(table).upsert(rows, onConflict ? { onConflict } : undefined)); }),
    upd: wrap(async (table, eq, patch) => { ok(await filt(sb.from(table).update(patch), { eq })); }),
    del: wrap(async (table, o) => { ok(await filt(sb.from(table).delete(), o.eq || o.in ? o : { eq: o })); }),
    upload: wrap(async (bucket, path, blob, contentType) => {
      const r = await sb.storage.from(bucket).upload(path, blob, { contentType: contentType || blob.type || "application/octet-stream", upsert: false });
      if (r.error && !/exists|duplicate/i.test(r.error.message || "")) throw dbError(r.error);
    }),
    url: wrap(async (bucket, path, download) => {
      const r = await sb.storage.from(bucket).createSignedUrl(path, 3600, download ? { download } : undefined);
      if (r.error) throw dbError(r.error); return r.data.signedUrl;
    }),
    rmFiles: wrap(async (bucket, paths) => { if (paths.length) ok(await sb.storage.from(bucket).remove(paths)); }),
    rpc: wrap(async (fn, args) => ok(await sb.rpc(fn, args || {}))),
    planWeek: wrap(async body => {
      const r = await sb.functions.invoke("plan-week", { body });
      if (r.error) {
        let m = r.error.message;
        try { const j = await r.error.context.json(); if (j?.error) m = j.error; } catch (e) { }
        throw dbError({ message: m });
      }
      if (r.data?.error) throw dbError({ message: r.data.error });
      return r.data;
    })
  };
}

/* ---------- demo backend (?demo=1) ---------- */
const DEMO_TEACHER = "a0000000-0000-4000-8000-000000000001";
function demoDB() {
  const KEY = "misosofi-demo-db-v1", SKEY = "misosofi-demo-session";
  const PK = { profiles: ["id"], student_state: ["student_id"], practice_days: ["student_id", "day"], teacher_settings: ["teacher_id"] };
  const now = () => new Date().toISOString();
  const DEF = {
    profiles: () => ({ role: "student", display_name: "", teacher_id: null, plan: "free", grade: 1, created_at: now() }),
    student_state: () => ({ data: {}, updated_at: now() }),
    library: () => ({ id: uid(), composer: "", grade: 0, label: "", score_path: null, created_at: now() }),
    pieces: () => ({ id: uid(), library_id: null, composer: "", status: "learning", seconds: 0, sections: [], created_at: now() }),
    tasks: () => ({ id: uid(), area: "other", piece_id: null, source: "teacher", done_days: [], created_at: now() }),
    practice_days: () => ({ seconds: 0, piece_seconds: {}, feel: null, note: "" }),
    recordings: () => ({ id: uid(), kind: "audio", seconds: 0, piece_id: null, listened: false, heart: false, comment: "", created_at: now() }),
    rewards: () => ({ id: uid() }),
    redemptions: () => ({ id: uid(), given: false, created_at: now() }),
    teacher_settings: () => ({ keep_recordings_days: 30 })
  };
  const seed = () => {
    const T = DEMO_TEACHER, lib = (title, composer, grade, label) => ({ ...DEF.library(), teacher_id: T, title, composer, grade, label });
    return {
      users: [{ id: T, email: "teacher@demo.test", pw: "demo1234" }],
      t: {
        profiles: [{ ...DEF.profiles(), id: T, role: "teacher", display_name: "Demo Teacher" }],
        student_state: [{ student_id: T, data: {}, updated_at: now() }],
        library: [lib("Minuet in G, BWV Anh. 114", "Petzold", 2, "Book 1"), lib("Arabesque, Op. 100 No. 2", "Burgmüller", 3, "Book 2"),
          lib("Sonatina in C, Op. 36 No. 1, 1st mvt", "Clementi", 3, "Book 2"), lib("The Wild Horseman, Op. 68 No. 8", "Schumann", 3, "Book 2")],
        pieces: [], tasks: [], practice_days: [], recordings: [], redemptions: [], teacher_settings: [],
        rewards: [{ id: uid(), teacher_id: T, title: "Choose a sticker at your lesson", price: 100 }, { id: uid(), teacher_id: T, title: "Teacher plays your favourite song", price: 150 }, { id: uid(), teacher_id: T, title: "Pick your next fun piece", price: 300 }]
      }
    };
  };
  let D; try { D = JSON.parse(localStorage.getItem(KEY)); } catch (e) { D = null; }
  if (!D || !D.t) D = seed();
  const persist = () => { try { localStorage.setItem(KEY, JSON.stringify(D)); } catch (e) { } };
  persist();
  const clone = x => JSON.parse(JSON.stringify(x));
  const match = (r, o = {}) => {
    for (const k in o.eq || {}) if (r[k] !== o.eq[k]) return false;
    for (const k in o.in || {}) if (!o.in[k].includes(r[k])) return false;
    for (const k in o.gte || {}) if (!(r[k] >= o.gte[k])) return false;
    for (const k in o.lte || {}) if (!(r[k] <= o.lte[k])) return false;
    for (const k in o.lt || {}) if (!(r[k] < o.lt[k])) return false;
    return true;
  };
  const pkOf = (t, r) => (PK[t] || ["id"]).map(k => r[k]).join("|");
  const delay = (ms = 30) => new Promise(r => setTimeout(r, ms));
  let files = null;
  const fdb = () => files ||= new Promise((res, rej) => { const r = indexedDB.open("misosofi-demo-files", 1); r.onupgradeneeded = () => r.result.createObjectStore("f"); r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error); });
  const fput = async (k, v) => { const d = await fdb(); await new Promise((res, rej) => { const tx = d.transaction("f", "readwrite"); tx.objectStore("f").put(v, k); tx.oncomplete = res; tx.onerror = () => rej(tx.error); }); };
  const fget = async k => { const d = await fdb(); return new Promise((res, rej) => { const r = d.transaction("f").objectStore("f").get(k); r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error); }); };
  const fdel = async k => { const d = await fdb(); await new Promise(res => { const tx = d.transaction("f", "readwrite"); tx.objectStore("f").delete(k); tx.oncomplete = res; tx.onerror = res; }); };
  const listeners = [];
  const me = () => { try { return JSON.parse(localStorage.getItem(SKEY)); } catch (e) { return null; } };
  const newUser = (email, pw, name) => {
    const id = uid(); D.users.push({ id, email, pw });
    D.t.profiles.push({ ...DEF.profiles(), id, display_name: name || "" });
    D.t.student_state.push({ student_id: id, data: {}, updated_at: now() });
    persist(); return { id, email };
  };
  const api = {
    demo: true,
    session: async () => me(),
    onAuth: f => listeners.push(f),
    signIn: async (email, pw) => {
      await delay(); const u = D.users.find(x => x.email.toLowerCase() === String(email).toLowerCase() && x.pw === pw);
      if (!u) throw dbError({ message: "Invalid login credentials" });
      const s = { id: u.id, email: u.email }; localStorage.setItem(SKEY, JSON.stringify(s)); listeners.forEach(f => f("SIGNED_IN", s)); return s;
    },
    signUp: async (email, pw, name) => {
      await delay(); if (D.users.some(x => x.email.toLowerCase() === String(email).toLowerCase())) throw dbError({ message: "User already registered" });
      const u = newUser(email, pw, name); localStorage.setItem(SKEY, JSON.stringify(u)); return { user: u, needsConfirm: false };
    },
    resetPw: async () => { await delay(); },
    resend: async () => { await delay(); },
    setPw: async pw => { const s = me(); const u = s && D.users.find(x => x.id === s.id); if (u) { u.pw = pw; persist(); } },
    signOut: async () => { localStorage.removeItem(SKEY); },
    sel: async (table, o = {}) => {
      await delay(); let rows = (D.t[table] || []).filter(r => match(r, o));
      if (o.order) { const [c, asc] = o.order; rows = rows.slice().sort((a, b) => (a[c] < b[c] ? -1 : a[c] > b[c] ? 1 : 0) * (asc === false ? -1 : 1)); }
      if (o.limit) rows = rows.slice(0, o.limit);
      return clone(rows);
    },
    ins: async (table, rows) => {
      await delay(); for (const r of [].concat(rows)) {
        const row = { ...DEF[table](), ...clone(r) };
        if (D.t[table].some(x => pkOf(table, x) === pkOf(table, row))) throw dbError({ message: "duplicate key value violates unique constraint", code: "23505" });
        D.t[table].push(row);
      } persist();
    },
    ups: async (table, rows) => {
      await delay(); for (const r of [].concat(rows)) {
        const i = D.t[table].findIndex(x => pkOf(table, x) === pkOf(table, r));
        if (i >= 0) D.t[table][i] = { ...D.t[table][i], ...clone(r) }; else D.t[table].push({ ...DEF[table](), ...clone(r) });
      } persist();
    },
    upd: async (table, eq, patch) => { await delay(); D.t[table].forEach((r, i) => { if (match(r, { eq })) D.t[table][i] = { ...r, ...clone(patch) }; }); persist(); },
    del: async (table, o) => {
      await delay(); const q = o.eq || o.in ? o : { eq: o };
      const gone = D.t[table].filter(r => match(r, q)); D.t[table] = D.t[table].filter(r => !match(r, q));
      if (table === "pieces") { const ids = gone.map(r => r.id);["tasks", "recordings"].forEach(t => D.t[t].forEach(r => { if (ids.includes(r.piece_id)) r.piece_id = null; })); }
      persist();
    },
    upload: async (bucket, path, blob) => { await delay(); await fput(bucket + "/" + path, blob); },
    url: async (bucket, path) => { const b = await fget(bucket + "/" + path); if (!b) throw dbError({ message: "Object not found" }); return URL.createObjectURL(b); },
    rmFiles: async (bucket, paths) => { for (const p of paths) await fdel(bucket + "/" + p); },
    /* canned answer so the teacher flow can be tested without the Claude API */
    planWeek: async body => {
      await delay(400); const notes = String(body.notes || "").trim(); if (!notes) throw dbError({ message: "Nothing to turn into tasks." });
      const ps = body.pieces || [], first = ps[0] || "Minuet in G, BWV Anh. 114";
      return {
        tasks: [
          { area: "piece", title: "Bars 9–16 hands separately, slowly", piece: first, tempo: null },
          { area: "piece", title: "Play from the beginning without stopping", piece: "Lonely Road", tempo: null },
          { area: "tech", title: "G major scale, hands together", piece: null, tempo: 72 },
          { area: "ear", title: "Guess the notes: Do Re Mi Fa So", piece: null, tempo: null },
          { area: "theory", title: "Watch the key signature video", piece: null, tempo: null }
        ], earNotes: ["Do", "Re", "Mi", "Fa", "So"]
      };
    },
    /* demo helpers */
    demoNewStudent: () => { const n = D.users.length + 1; return { email: `student${n}@demo.test`, pw: "demo1234" }; },
    demoReset: () => { localStorage.removeItem(KEY); localStorage.removeItem(SKEY); }
  };
  return api;
}
