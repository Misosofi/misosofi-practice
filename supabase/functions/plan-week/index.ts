// plan-week: turns the teacher's spoken notes (Japanese or English) into this week's homework in English.
// Runs on Supabase Edge Functions. The Claude API key lives only here, as the secret ANTHROPIC_API_KEY.
import { createClient } from "npm:@supabase/supabase-js@2.45.4";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const AREAS = ["piece", "sight", "tech", "solf", "ear", "theory", "nr", "other"];
const EAR = ["Do", "Di", "Re", "Ri", "Mi", "Fa", "Fi", "So", "Si", "La", "Li", "Ti"];
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...CORS, "Content-Type": "application/json" } });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST") return json({ error: "POST only" }, 405);

  // Only signed-in teachers may use it (this is what keeps the API credits safe).
  const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, {
    global: { headers: { Authorization: req.headers.get("Authorization") ?? "" } },
  });
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return json({ error: "Please sign in." }, 401);
  const { data: me } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (me?.role !== "teacher") return json({ error: "Teachers only." }, 403);

  let body: { notes?: string; pieces?: string[] };
  try { body = await req.json(); } catch { return json({ error: "Bad request." }, 400); }
  const notes = String(body.notes ?? "").slice(0, 6000).trim();
  if (!notes) return json({ error: "Nothing to turn into tasks." }, 400);
  const pieces = (body.pieces ?? []).map(String).slice(0, 200);

  const prompt = "You help a piano teacher. At the end of each lesson she speaks her notes for the coming week, usually in Japanese, sometimes mixed with English. Turn them into clear weekly homework for her student, written in simple English a child can follow." + "\n" +
    "Work out what she means and write it as practical homework (what to practise, which bars, which hands, how fast, how often). Do not add instructions she did not give." + "\n" +
    "The student's pieces and the teacher's library: " + (pieces.length ? pieces.map((x) => "\"" + x + "\"").join(", ") : "none") + ". She may say these titles in katakana or Japanese; match them to the exact title from this list." + "\n" +
    "Areas: piece (practising a piece), sight (sight-reading), tech (scales, arpeggios, technique), solf (solfège, singing), ear (ear training, guessing notes), theory (theory, or watching a theory video), nr (Note Catcher, the note-reading game), other." + "\n" +
    "For each task give \"area\", \"title\" (English, at most 100 characters, without the piece name when \"piece\" is set), \"piece\" (only for area piece: the exact title from the list, or a new English title if she names a piece that is not on the list), and \"tempo\" (a number, only when she gives a metronome speed for a scale or technique exercise)." + "\n" +
    "If she says which notes to use for ear training, add \"earNotes\" using these names only: " + EAR.join(" ") + "." + "\n" +
    "Reply with only JSON in this shape: {\"tasks\":[{\"area\":\"piece\",\"title\":\"Bars 9–16 hands separately, slowly\",\"piece\":\"Lonely Road\"},{\"area\":\"tech\",\"title\":\"G major scale, hands together\",\"tempo\":72}],\"earNotes\":[\"Do\",\"Re\",\"Mi\"]}" + "\n" +
    "Teacher's notes:" + "\n" +
    "<<<" + notes + ">>>";

  const r = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Authorization": "Bearer " + (Deno.env.get("ANTHROPIC_API_KEY") || Deno.env.get("ANTHROPIC_API_KEYANTHROPIC_API_KEY") || "").trim(),
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
    },
    body: JSON.stringify({ model: "claude-sonnet-5-5", max_tokens: 1500, messages: [{ role: "user", content: prompt }] }),
  });
  if (!r.ok) {
    let detail = "";
    try { const e = await r.json(); detail = (e && e.error && (e.error.type + ": " + e.error.message)) || ""; } catch { /* ignore */ }
    return json({ error: "Claude is not available right now.", status: r.status, detail: detail.slice(0, 300) }, 502);
  }
  const out = await r.json();
  const text: string = (out.content ?? []).map((c: { text?: string }) => c.text ?? "").join("");
  const start = text.indexOf("{"), end = text.lastIndexOf("}");
  let parsed: { tasks?: unknown[]; earNotes?: unknown[] } = {};
  try { parsed = JSON.parse(text.slice(start, end + 1)); } catch { return json({ error: "Could not read the answer. Try again." }, 502); }

  const tasks = (parsed.tasks ?? []).flatMap((t) => {
    const x = t as Record<string, unknown>;
    if (!x || !x.title) return [];
    const area = AREAS.includes(String(x.area)) ? String(x.area) : "other";
    return [{
      area,
      title: String(x.title).slice(0, 140),
      piece: area === "piece" && x.piece ? String(x.piece).slice(0, 80) : null,
      tempo: Number(x.tempo) || null,
    }];
  });
  const earNotes = (parsed.earNotes ?? []).map(String).filter((n) => EAR.includes(n));
  return json({ tasks, earNotes, usage: out.usage });
});
