/* ===== Technique: short 30-second exercises with simple pictures =====
   DRAFT texts for Atsuko to check. Each one can be added to today's plan as a "30 seconds" card. */
const TECH = [
  { id: "tip", em: "☝️", pic: "tip" },
  { id: "line", em: "🚪", pic: "line" },
  { id: "ball", em: "🟠", pic: "ball" },
  { id: "thumb", em: "👍", pic: "thumb" },
  { id: "lift", em: "🎹", pic: "lift" },
];
const techOf = id => TECH.find(x => x.id === id) || TECH[0];
/* the technique for today rotates, so small children get a different one each day */
const techToday = () => TECH[DAYNO % TECH.length];

/* side view of a finger: three bones. good = the nail joint stays round; bad = it collapses backwards */
function fingerSVG(bad) {
  const J = bad ? [98, 70] : [100, 50], T = bad ? [124, 78] : [108, 80];
  return `<svg viewBox="0 0 140 100" class="tech-svg ${bad ? "bad" : "good"}" aria-hidden="true">
   <rect x="0" y="80" width="140" height="18" rx="3" fill="#fff" stroke="#c9c4d6"/>
   <path d="M30 40 L72 30 L${J[0]} ${J[1]} L${T[0]} ${T[1]}" fill="none" stroke="#F2C7A5" stroke-width="15" stroke-linecap="round" stroke-linejoin="round"/>
   <circle cx="72" cy="30" r="4" fill="#d9a07c"/><circle cx="${J[0]}" cy="${J[1]}" r="4.5" fill="${bad ? "#E5484D" : "#d9a07c"}"/>
   <text x="70" y="16" text-anchor="middle" font-size="16" font-weight="900" fill="${bad ? "#E5484D" : "#2BB673"}">${bad ? "✗" : "✓"}</text></svg>`;
}
/* side view of the forearm and hand: good = one straight line from the elbow to the knuckles (like turning a doorknob); bad = the wrist sags */
function armSVG(bad) {
  const W = bad ? [86, 62] : [86, 46], K = bad ? [112, 44] : [112, 46];
  return `<svg viewBox="0 0 140 100" class="tech-svg ${bad ? "bad" : "good"}" aria-hidden="true">
   <rect x="0" y="80" width="140" height="18" rx="3" fill="#fff" stroke="#c9c4d6"/>
   ${bad ? "" : `<line x1="10" y1="46" x2="118" y2="46" stroke="#2BB673" stroke-width="1.6" stroke-dasharray="4 3"/>`}
   <path d="M12 46 L${W[0]} ${W[1]} L${K[0]} ${K[1]} L126 80" fill="none" stroke="#F2C7A5" stroke-width="15" stroke-linecap="round" stroke-linejoin="round"/>
   <circle cx="12" cy="46" r="4" fill="#d9a07c"/><circle cx="${W[0]}" cy="${W[1]}" r="4.5" fill="${bad ? "#E5484D" : "#d9a07c"}"/>
   <text x="70" y="16" text-anchor="middle" font-size="16" font-weight="900" fill="${bad ? "#E5484D" : "#2BB673"}">${bad ? "✗" : "✓"}</text></svg>`;
}
function techPic(id) {
  if (id === "tip") return `<div class="tech-pics">${fingerSVG(false)}${fingerSVG(true)}</div>`;
  if (id === "line") return `<div class="tech-pics">${armSVG(false)}${armSVG(true)}</div>`;
  if (id === "ball") return `<svg viewBox="0 0 160 90" class="tech-svg" aria-hidden="true"><rect x="0" y="72" width="160" height="16" rx="3" fill="#fff" stroke="#c9c4d6"/><circle cx="80" cy="52" r="20" fill="#FFB44D"/><path d="M28 72 Q36 20 80 18 Q124 20 132 72" fill="none" stroke="#F2C7A5" stroke-width="14" stroke-linecap="round"/></svg>`;
  if (id === "wrist") return `<svg viewBox="0 0 160 90" class="tech-svg" aria-hidden="true"><rect x="0" y="72" width="160" height="16" rx="3" fill="#fff" stroke="#c9c4d6"/><path d="M20 40 Q60 30 90 46 L110 70" fill="none" stroke="#F2C7A5" stroke-width="14" stroke-linecap="round"/><path d="M60 18 L60 8 M54 14 L60 8 L66 14 M60 60 L60 70" stroke="#6C5CE7" stroke-width="3" fill="none" stroke-linecap="round"/><text x="72" y="16" font-size="11" fill="#6C5CE7" font-weight="700">up</text><text x="72" y="66" font-size="11" fill="#6C5CE7" font-weight="700">down</text></svg>`;
  const keys = (marks) => `<svg viewBox="0 0 160 70" class="tech-svg" aria-hidden="true">${[0, 1, 2, 3, 4, 5, 6].map(i => `<rect x="${8 + i * 20.5}" y="8" width="20" height="56" rx="2" fill="#fff" stroke="#c9c4d6"/>`).join("")}${[0, 1, 3, 4, 5].map(i => `<rect x="${22 + i * 20.5}" y="8" width="12" height="34" rx="1.5" fill="#2A2438"/>`).join("")}${marks}</svg>`;
  if (id === "thumb") return keys(`<ellipse cx="18" cy="52" rx="8" ry="6" fill="#F2C7A5" stroke="#d9a07c"/><circle cx="12" cy="56" r="2.5" fill="#E5484D"/>`);
  return keys([0, 1, 2, 3, 4].map(i => `<circle cx="${18 + i * 20.5}" cy="54" r="7" fill="${i === 2 ? "#6C5CE7" : "#F2C7A5"}"/><text x="${18 + i * 20.5}" y="58" text-anchor="middle" font-size="9" font-weight="800" fill="${i === 2 ? "#fff" : "#7a5a44"}">${i + 1}</text>`).join("") + `<path d="M59 36 L59 24 M54 29 L59 24 L64 29" stroke="#6C5CE7" stroke-width="2.5" fill="none" stroke-linecap="round"/>`);
}
