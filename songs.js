/* ===== Atsuko's own pieces (songbook). All music © Misosofi. =====
   Notation: notes like C4 D4 G3 (letter + octave, # or b after the letter), rests "r".
   Length after a dot-free suffix: e = eighth, q = quarter (default), h = half, w = whole; add "." for dotted.
   Fingering after a colon: G4:5. Bars are separated with "|". */
const SONGS = [
  {
    id: "vincent-1", title: "Vincent's Little Walk", grade: 1, key: 0, ts: "4/4", tempo: 92, by: "Atsuko Shimada",
    rh: "r G4:5 r G4 | E4 C4 D4h | F4 r D4 r | E4 D4 C4h | rh C4e D4e E4e F4e | G4 G4:4 A4h:5 | G4 r D4:3 C4e B3e | C4 r C5h",
    lh: "G3:1 r G3 r | G3 r G3h | r G3 r G3 | G3 F3 E3h | C3e D3e E3e F3e G3h | E3 E3 F3h | r G3 F3 E3e D3e | E3 G3 C3h",
  },
];
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
function songExercise(song) { return { key: song.key, keyAcc: song.key, ts: song.ts, rh: parseVoice(song.rh), lh: parseVoice(song.lh), mode: "tog" }; }
