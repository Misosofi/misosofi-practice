/* ===== Atsuko's own pieces (songbook). All music © Misosofi. =====
   Notation: notes like C4 D4 G3 (letter + octave, # or b after the letter), rests "r".
   Length after a dot-free suffix: e = eighth, q = quarter (default), h = half, w = whole; add "." for dotted.
   Fingering after a colon: G4:5. Bars are separated with "|". */
let SONGS = []; /* loaded from the database after sign-in (the music is not in this public code) */
const LETTER_STEP = { C: 0, D: 1, E: 2, F: 3, G: 4, A: 5, B: 6 };
const LEN = { e: .5, q: 1, h: 2, w: 4 };
function parseVoice(src) {
  return src.split(/\s+/).filter(t => t && t !== "|").map(tok => {
    const [main, fing] = tok.split(":");
    const m = main.match(/^(r|([A-G])([#b]?)(\d))([eqhw]?)(\.?)$/);
    if (!m) throw new Error("Bad note " + tok);
    let dur = LEN[m[5] || "q"]; if (m[6]) dur *= 1.5;
    if (m[1] === "r") return { rest: true, dur };
    const d = dia(LETTER_STEP[m[2]], +m[4]), alt = m[3] === "#" ? 1 : m[3] === "b" ? -1 : 0;
    const n = { d, dur, alt }; if (alt) n.sym = alt > 0 ? "♯" : "♭"; if (fing) n.f = fing;
    return n;
  });
}
function evNote(e) {
  if (e.rest) return { rest: true, dur: e.dur };
  const ps = e.n.map(nm => { const m = nm.match(/^([A-G])([#b]?)(-?\d)$/); return { d: dia(LETTER_STEP[m[1]], +m[3]), alt: m[2] === "#" ? 1 : m[2] === "b" ? -1 : 0 }; });
  const n = { d: ps[0].d, alt: ps[0].alt, dur: e.dur }; if (ps[0].alt) n.sym = ps[0].alt > 0 ? "♯" : "♭";
  if (ps.length > 1) n.chord = ps.slice(1).map(p => p.d); if (e.f) n.f = e.f; if (e.art) n.art = e.art; return n;
}
function songExercise(song) {
  if (song.data) return { key: song.key, keyAcc: song.key, ts: song.ts, rh: song.data.rh.ev.map(evNote), lh: song.data.lh.ev.map(evNote), mode: "tog", marks: { rh: song.data.rh.marks, lh: song.data.lh.marks } };
  return { key: song.key, keyAcc: song.key, ts: song.ts, rh: parseVoice(song.rh), lh: parseVoice(song.lh), mode: "tog" };
}
