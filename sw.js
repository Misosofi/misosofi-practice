/* Service worker: caches the app shell so the app opens offline.
   Supabase API/Auth/Storage/Functions requests are never cached (they are not intercepted at all).
   Bump VERSION on every deploy so phones pick up the new files. */
const VERSION = "misosofi-practice-v1.5.0";
const SHELL = [
  "./", "./index.html", "./styles.css", "./config.js", "./strings.js", "./core.js", "./data.js", "./songs.js", "./pitch.js", "./pets.js", "./plan.js", "./visits.js", "./student.js", "./teacher.js", "./install.js", "./app.js",
  "./manifest.webmanifest", "./icons/icon-192.png", "./icons/icon-512.png", "./icons/apple-touch-icon.png", "./icons/favicon-32.png"
];
const ASSETS = "misosofi-assets-v1"; /* piano samples and pictures: kept across app updates */
const CDN = "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.45.4/dist/umd/supabase.min.js";

self.addEventListener("install", e => {
  e.waitUntil((async () => {
    const c = await caches.open(VERSION);
    await c.addAll(SHELL);
    try { await c.add(new Request(CDN, { mode: "cors" })); } catch (err) { /* fetched on first use instead */ }
    await self.skipWaiting();
  })());
});
self.addEventListener("activate", e => {
  e.waitUntil((async () => {
    for (const k of await caches.keys()) if (k !== VERSION && k !== ASSETS) await caches.delete(k);
    await self.clients.claim();
  })());
});
self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (/\.supabase\.(co|in)$/.test(url.hostname)) return;            /* never touch the API */
  const sameOrigin = url.origin === self.location.origin;
  const fonts = url.hostname === "fonts.googleapis.com" || url.hostname === "fonts.gstatic.com";
  if (!sameOrigin && !fonts && req.url !== CDN) return;
  if (sameOrigin && url.searchParams.has("join")) return;           /* invite links: always fresh */
  if (sameOrigin && url.pathname.includes("/assets/")) {
    e.respondWith((async () => { const c = await caches.open(ASSETS), hit = await c.match(req); if (hit) return hit; const r = await fetch(req); if (r.ok) c.put(req, r.clone()); return r; })());
    return;
  }
  if (req.mode === "navigate") {
    /* network first for the page itself, cached shell when offline */
    e.respondWith((async () => {
      try { const r = await fetch(req); if (r.ok) { const c = await caches.open(VERSION); c.put("./index.html", r.clone()); } return r; }
      catch (err) { return (await caches.match("./index.html")) || (await caches.match("./")) || Response.error(); }
    })());
    return;
  }
  /* stale-while-revalidate for scripts, styles, icons, fonts */
  e.respondWith((async () => {
    const c = await caches.open(VERSION), hit = await c.match(req, { ignoreSearch: sameOrigin });
    const net = fetch(req).then(r => { if (r && (r.ok || r.type === "opaque")) c.put(req, r.clone()); return r; }).catch(() => null);
    return hit || (await net) || Response.error();
  })());
});
