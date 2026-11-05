/* ===== Animal avatars (full body), coin shop items and the student's own room =====
   All characters and items are original drawings. Avatar data:
   { animal, fur, outfit, oc (outfit colour), acc (head), bag, jewel, bg } */
const ANIMALS = ["bunny", "cat", "dog", "panda", "fox", "penguin", "hamster"];
const ANIMAL_FUR = { bunny: 0, cat: 3, dog: 4, panda: 1, fox: 5, penguin: 8, hamster: 6 };
const FURS = ["#FFF6EC", "#FFFFFF", "#FFD3DF", "#E8C9A8", "#B7B4C2", "#F59B4C", "#F7D9A6", "#C9B8F2", "#3B3F5C", "#A7E3CF"];
const OUTFITS = ["tee", "dress", "overalls", "hoodie", "sailor"];
const OCOLS = ["#7C6CF0", "#FF7FA8", "#4CC59A", "#FFB04C", "#5BB4F5", "#F25C5C", "#FFFFFF", "#3A3A48"];
const AVBG = ["#EFEAFF", "#FFE6EF", "#E2F7EE", "#FFF0DC", "#E1F1FF", "#FFF7CC", "#2A2F45"];

function shade(hex, p) {
  const n = parseInt(hex.slice(1), 16); let r = n >> 16, g = (n >> 8) & 255, b = n & 255;
  const f = v => Math.max(0, Math.min(255, Math.round(p < 0 ? v * (1 + p) : v + (255 - v) * p)));
  return "#" + ((1 << 24) + (f(r) << 16) + (f(g) << 8) + f(b)).toString(16).slice(1);
}
/* older avatars (human faces) are moved to an animal once */
function petOf(a) {
  a = a || {};
  if (a.animal && ANIMALS.includes(a.animal)) return a;
  const g = (typeof S !== "undefined" && S && S.profile && S.profile.gender) || "";
  const animal = g === "boy" ? "dog" : g === "girl" ? "bunny" : "cat";
  return { animal, fur: ANIMAL_FUR[animal], outfit: g === "girl" ? "dress" : "tee", oc: Math.min(+a.shirt || 0, OCOLS.length - 1),
    acc: ITEMS.some(i => i.id === a.acc && i.cat === "wear") ? a.acc : "none", bag: null, jewel: null, bg: Math.min(+a.bg || 0, AVBG.length - 1) };
}

/* ---------- the character ---------- */
function avatarSVG(a, o = {}) {
  a = petOf(a);
  const an = a.animal, F = FURS[a.fur] ?? FURS[0], D = shade(F, F === "#FFFFFF" || F === "#FFF6EC" ? -0.22 : -0.28), OC = OCOLS[a.oc] ?? OCOLS[0], OD = shade(OC, -0.25);
  const pink = "#FFB3C7", ink = "#2A2030", st = `stroke="${D}" stroke-width="2.2" stroke-linejoin="round"`;
  const dark = an === "panda" ? "#2E2B3A" : an === "penguin" ? F : D;
  let s = "";
  if (o.bg !== false && !o.room) s += `<rect x="-20" y="-20" width="160" height="200" fill="${AVBG[a.bg] ?? AVBG[0]}"/>`;
  s += `<ellipse cx="60" cy="153" rx="27" ry="4.5" fill="#00000022"/>`;
  /* tail */
  if (an === "bunny") s += `<circle cx="83" cy="131" r="8" fill="${shade(F, .5)}" ${st}/>`;
  if (an === "cat") s += `<path d="M78 134 Q100 130 96 106" fill="none" stroke="${D}" stroke-width="9" stroke-linecap="round"/><path d="M78 134 Q100 130 96 106" fill="none" stroke="${F}" stroke-width="5" stroke-linecap="round"/>`;
  if (an === "dog") s += `<path d="M78 132 Q94 128 92 114" fill="none" stroke="${D}" stroke-width="8" stroke-linecap="round"/><path d="M78 132 Q94 128 92 114" fill="none" stroke="${F}" stroke-width="4.5" stroke-linecap="round"/>`;
  if (an === "fox") s += `<g transform="rotate(-35 88 122)"><ellipse cx="94" cy="118" rx="11" ry="20" fill="${F}" ${st}/><path d="M88 102 Q94 96 100 102 Q96 108 94 106 Q92 108 88 102Z" fill="#fff"/></g>`;
  if (an === "panda") s += `<circle cx="81" cy="132" r="6" fill="#2E2B3A"/>`;
  /* legs and feet */
  const legC = an === "panda" ? "#2E2B3A" : an === "penguin" ? "#FFB347" : F;
  s += `<rect x="45" y="130" width="12" height="18" rx="6" fill="${legC}" ${st}/><rect x="63" y="130" width="12" height="18" rx="6" fill="${legC}" ${st}/>`;
  s += `<ellipse cx="50" cy="149" rx="9" ry="5" fill="${legC === F ? shade(F, -.1) : legC}" ${st}/><ellipse cx="70" cy="149" rx="9" ry="5" fill="${legC === F ? shade(F, -.1) : legC}" ${st}/>`;
  /* outfit */
  const ost = `stroke="${OD}" stroke-width="2.2" stroke-linejoin="round"`;
  if (a.outfit === "dress") s += `<path d="M45 101 L75 101 L88 140 Q60 147 32 140 Z" fill="${OC}" ${ost}/><path d="M36 133 Q60 139 84 133" fill="none" stroke="#fff" stroke-width="2.5" stroke-dasharray="1 5" stroke-linecap="round"/>`;
  else if (a.outfit === "overalls") s += `<path d="M42 102 Q40 136 46 138 L74 138 Q80 136 78 102 Z" fill="#FFFFFF" stroke="#C9C4D6" stroke-width="2"/><path d="M45 114 L75 114 L76 138 L44 138 Z" fill="${OC}" ${ost}/><path d="M47 114 L49 102 M73 114 L71 102" stroke="${OC}" stroke-width="4" stroke-linecap="round"/><circle cx="49" cy="117" r="1.8" fill="#FFD966"/><circle cx="71" cy="117" r="1.8" fill="#FFD966"/>`;
  else if (a.outfit === "hoodie") s += `<path d="M41 102 Q38 138 46 140 L74 140 Q82 138 79 102 Z" fill="${OC}" ${ost}/><path d="M50 126 h20 v8 h-20 z" fill="${OD}" opacity=".45"/><path d="M55 103 v9 M65 103 v9" stroke="#fff" stroke-width="2" stroke-linecap="round"/>`;
  else if (a.outfit === "sailor") s += `<path d="M41 102 Q38 138 46 140 L74 140 Q82 138 79 102 Z" fill="#FFFFFF" stroke="#C9C4D6" stroke-width="2"/><path d="M44 101 L60 116 L76 101 L72 99 L60 109 L48 99Z" fill="${OC}" ${ost}/><path d="M57 115 L60 121 L63 115 Z" fill="#F25C5C"/><path d="M44 132 H76" stroke="${OC}" stroke-width="3"/>`;
  else s += `<path d="M41 102 Q38 138 46 140 L74 140 Q82 138 79 102 Z" fill="${OC}" ${ost}/><path d="M53 101 Q60 107 67 101" fill="none" stroke="${OD}" stroke-width="2"/>`;
  if (an === "penguin" && a.outfit !== "dress") s += `<ellipse cx="60" cy="124" rx="10" ry="12" fill="#fff" opacity=".0"/>`;
  /* arms */
  const armC = an === "panda" ? "#2E2B3A" : F;
  s += `<ellipse cx="38" cy="117" rx="7" ry="13" transform="rotate(22 38 117)" fill="${armC}" ${st}/><ellipse cx="82" cy="117" rx="7" ry="13" transform="rotate(-22 82 117)" fill="${armC}" ${st}/>`;
  /* jewellery and bag */
  if (a.jewel) s += JEWELS[a.jewel] || "";
  if (a.bag) s += BAGS[a.bag] || "";
  /* ears behind the head */
  if (an === "bunny") s += `<g transform="rotate(-12 46 30)"><ellipse cx="46" cy="22" rx="10" ry="25" fill="${F}" ${st}/><ellipse cx="46" cy="24" rx="5" ry="17" fill="${pink}"/></g><g transform="rotate(12 74 30)"><ellipse cx="74" cy="22" rx="10" ry="25" fill="${F}" ${st}/><ellipse cx="74" cy="24" rx="5" ry="17" fill="${pink}"/></g>`;
  if (an === "cat") s += `<path d="M30 52 L36 18 L58 34 Z" fill="${F}" ${st}/><path d="M36 42 L39 26 L50 35Z" fill="${pink}"/><path d="M90 52 L84 18 L62 34 Z" fill="${F}" ${st}/><path d="M84 42 L81 26 L70 35Z" fill="${pink}"/>`;
  if (an === "fox") s += `<path d="M28 54 L32 12 L58 34 Z" fill="${F}" ${st}/><path d="M33 28 L32 14 L42 22Z" fill="#3B2A2A"/><path d="M92 54 L88 12 L62 34 Z" fill="${F}" ${st}/><path d="M87 28 L88 14 L78 22Z" fill="#3B2A2A"/>`;
  if (an === "panda") s += `<circle cx="31" cy="36" r="12" fill="#2E2B3A"/><circle cx="89" cy="36" r="12" fill="#2E2B3A"/>`;
  if (an === "hamster") s += `<circle cx="34" cy="38" r="10" fill="${F}" ${st}/><circle cx="34" cy="38" r="5" fill="${pink}"/><circle cx="86" cy="38" r="10" fill="${F}" ${st}/><circle cx="86" cy="38" r="5" fill="${pink}"/>`;
  /* head */
  if (an === "hamster") s += `<ellipse cx="60" cy="66" rx="39" ry="34" fill="${F}" ${st}/><ellipse cx="60" cy="80" rx="27" ry="17" fill="${shade(F, .55)}"/>`;
  else if (an === "penguin") s += `<circle cx="60" cy="64" r="36" fill="${F}" ${st}/><path d="M60 50 Q76 36 84 56 Q92 82 60 96 Q28 82 36 56 Q44 36 60 50Z" fill="#FFFFFF"/>`;
  else s += `<circle cx="60" cy="64" r="36" fill="${F}" ${st}/>`;
  if (an === "fox") s += `<path d="M26 70 Q40 96 60 98 Q80 96 94 70 Q78 84 60 76 Q42 84 26 70Z" fill="#FFFFFF"/>`;
  if (an === "dog") s += `<ellipse cx="60" cy="81" rx="15" ry="11" fill="${shade(F, .5)}"/>`;
  if (an === "panda") s += `<ellipse cx="46" cy="67" rx="8" ry="10" transform="rotate(25 46 67)" fill="#2E2B3A"/><ellipse cx="74" cy="67" rx="8" ry="10" transform="rotate(-25 74 67)" fill="#2E2B3A"/>`;
  /* floppy dog ears go over the head */
  if (an === "dog") s += `<ellipse cx="28" cy="58" rx="10" ry="21" transform="rotate(18 28 58)" fill="${shade(F, -.18)}" ${st}/><ellipse cx="92" cy="58" rx="10" ry="21" transform="rotate(-18 92 58)" fill="${shade(F, -.18)}" ${st}/>`;
  /* eyes */
  const ey = an === "penguin" ? 66 : 68, eyeW = an === "panda" ? "#fff" : null;
  s += [47, 73].map(x => `<ellipse cx="${x}" cy="${ey}" rx="4.8" ry="6" fill="${ink}"/><circle cx="${x - 1.6}" cy="${ey - 2.4}" r="1.9" fill="#fff"/><circle cx="${x + 1.4}" cy="${ey + 2}" r=".9" fill="#fff"/>`).join("");
  if (eyeW) s += "";
  if (!o.noCheeks) s += `<ellipse cx="37" cy="80" rx="6" ry="3.6" fill="#FF8FAB" opacity=".55"/><ellipse cx="83" cy="80" rx="6" ry="3.6" fill="#FF8FAB" opacity=".55"/>`;
  /* nose and mouth */
  if (an === "penguin") s += `<path d="M54 76 L66 76 L60 84 Z" fill="#FFB347" stroke="#E08A1E" stroke-width="1.5" stroke-linejoin="round"/>`;
  else {
    const nose = an === "dog" || an === "panda" || an === "fox" ? "#2A2030" : "#FF7E9D";
    s += `<ellipse cx="60" cy="77" rx="${an === "dog" ? 4.5 : 3}" ry="${an === "dog" ? 3.2 : 2.2}" fill="${nose}"/>`;
    s += `<path d="M53 81 Q56.5 85 60 81 Q63.5 85 67 81" fill="none" stroke="${ink}" stroke-width="1.8" stroke-linecap="round"/>`;
    if (an === "hamster") s += `<rect x="57.5" y="82.5" width="5" height="4" rx="1" fill="#fff" stroke="${ink}" stroke-width="1"/>`;
    if (an === "cat") s += `<path d="M26 74 L40 76 M26 80 L40 79 M94 74 L80 76 M94 80 L80 79" stroke="${D}" stroke-width="1.4" stroke-linecap="round"/>`;
  }
  /* head accessory */
  if (a.acc && a.acc !== "none") s += HATS[a.acc] || "";
  const vb = o.head ? "14 8 92 92" : "0 0 120 160";
  return `<svg viewBox="${vb}" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${esc(an)}">${s}</svg>`;
}

/* ---------- things the character wears (drawn in the 120×160 avatar space) ---------- */
const HATS = {
  glasses: `<g fill="none" stroke="#3A3A48" stroke-width="2.4"><circle cx="47" cy="68" r="9"/><circle cx="73" cy="68" r="9"/><path d="M56 68 h8"/></g>`,
  bow: `<g transform="translate(80 34) rotate(18)"><path d="M0 0 L-14 -9 Q-17 0 -14 9 Z" fill="#FF6F9C" stroke="#D84A78" stroke-width="2" stroke-linejoin="round"/><path d="M0 0 L14 -9 Q17 0 14 9 Z" fill="#FF6F9C" stroke="#D84A78" stroke-width="2" stroke-linejoin="round"/><circle r="4.5" fill="#FF8FB1" stroke="#D84A78" stroke-width="2"/></g>`,
  cap: `<path d="M27 50 Q30 22 60 22 Q90 22 93 50 Z" fill="#F25C5C" stroke="#C23B3B" stroke-width="2.2"/><path d="M60 47 Q92 44 106 52 Q92 56 60 52Z" fill="#F25C5C" stroke="#C23B3B" stroke-width="2.2" stroke-linejoin="round"/><circle cx="60" cy="22" r="3" fill="#C23B3B"/>`,
  flower: `<g transform="translate(82 36)">${[0, 72, 144, 216, 288].map(r => `<ellipse rx="5" ry="8" transform="rotate(${r}) translate(0 -7)" fill="#FFF" stroke="#F4A3BF" stroke-width="1.6"/>`).join("")}<circle r="4.5" fill="#FFD34D"/></g>`,
  stars: `<path d="M78 30 l3 6 6.5 1 -4.7 4.5 1.1 6.5 -5.9-3.1 -5.9 3.1 1.1-6.5 -4.7-4.5 6.5-1z" fill="#FFD34D" stroke="#E0A800" stroke-width="1.4" stroke-linejoin="round"/><path d="M40 34 l2 4 4.4.6 -3.2 3 .8 4.4 -4-2.1 -4 2.1 .8-4.4 -3.2-3 4.4-.6z" fill="#FFD34D" stroke="#E0A800" stroke-width="1.2" stroke-linejoin="round"/>`,
  headphones: `<path d="M26 66 Q26 24 60 24 Q94 24 94 66" fill="none" stroke="#3A3A48" stroke-width="5" stroke-linecap="round"/><rect x="18" y="58" width="13" height="20" rx="6" fill="#7C6CF0" stroke="#3A3A48" stroke-width="2"/><rect x="89" y="58" width="13" height="20" rx="6" fill="#7C6CF0" stroke="#3A3A48" stroke-width="2"/>`,
  beret: `<ellipse cx="62" cy="33" rx="30" ry="11" fill="#E14B6E" stroke="#A8304F" stroke-width="2.2"/><circle cx="64" cy="22" r="3" fill="#A8304F"/>`,
  crown: `<path d="M40 38 L42 18 L51 28 L60 14 L69 28 L78 18 L80 38 Z" fill="#FFD34D" stroke="#D99A00" stroke-width="2.2" stroke-linejoin="round"/><circle cx="60" cy="31" r="3" fill="#F25C8C"/><circle cx="48" cy="33" r="2.2" fill="#5BB4F5"/><circle cx="72" cy="33" r="2.2" fill="#4CC59A"/>`,
  tiara: `<path d="M38 40 Q60 26 82 40" fill="none" stroke="#D9DCE8" stroke-width="3.5" stroke-linecap="round"/><path d="M60 22 l3 7 7 1 -5 4.6 1.3 7 -6.3-3.4 -6.3 3.4 1.3-7 -5-4.6 7-1z" fill="#BFE6FF" stroke="#7FB6DA" stroke-width="1.4" stroke-linejoin="round"/>`,
  partyhat: `<path d="M60 4 L76 40 Q60 46 44 40 Z" fill="#7C6CF0" stroke="#5547C0" stroke-width="2" stroke-linejoin="round"/><path d="M52 22 L68 26 M48 32 L72 36" stroke="#FFD34D" stroke-width="3"/><circle cx="60" cy="5" r="4.5" fill="#FF7FA8"/>`,
};
const BAGS = {
  tote: `<path d="M44 100 L84 124" stroke="#B07A4A" stroke-width="2.5"/><path d="M76 122 h20 l-2 20 h-16 z" fill="#F7E3C4" stroke="#B07A4A" stroke-width="2" stroke-linejoin="round"/><path d="M81 122 Q86 114 91 122" fill="none" stroke="#B07A4A" stroke-width="2"/><text x="86" y="137" font-size="9" text-anchor="middle" fill="#B07A4A">♪</text>`,
  backpack: `<rect x="27" y="104" width="12" height="26" rx="4" fill="#5BB4F5" stroke="#2F7FBF" stroke-width="2"/><path d="M44 100 L36 108 M76 100 L84 108" stroke="#2F7FBF" stroke-width="3" stroke-linecap="round"/>`,
  heartpurse: `<path d="M44 100 L84 122" stroke="#E14B6E" stroke-width="2"/><path d="M86 140 L76 130 Q72 124 78 121 Q83 119 86 124 Q89 119 94 121 Q100 124 96 130 Z" fill="#FF7FA8" stroke="#E14B6E" stroke-width="2" stroke-linejoin="round"/>`,
  starbag: `<path d="M44 100 L84 122" stroke="#D99A00" stroke-width="2"/><path d="M86 118 l4 8 8.5 1.2 -6.2 6 1.5 8.5 -7.8-4.1 -7.8 4.1 1.5-8.5 -6.2-6 8.5-1.2z" fill="#FFD34D" stroke="#D99A00" stroke-width="2" stroke-linejoin="round"/>`,
};
const JEWELS = {
  pearls: `<path d="M47 100 Q60 112 73 100" fill="none" stroke="#fff" stroke-width="4.5" stroke-dasharray=".1 5.5" stroke-linecap="round"/><path d="M47 100 Q60 112 73 100" fill="none" stroke="#D9D4E6" stroke-width="5.5" stroke-dasharray=".1 5.5" stroke-linecap="round" opacity=".35"/>`,
  heart: `<path d="M48 100 Q60 108 72 100" fill="none" stroke="#D99A00" stroke-width="1.4"/><path d="M60 114 L55 109 Q53 106 56 105 Q58 104 60 106.5 Q62 104 64 105 Q67 106 65 109 Z" fill="#F25C8C" stroke="#C23B6B" stroke-width="1.2"/>`,
  medal: `<path d="M52 100 L58 112 M68 100 L62 112" stroke="#5BB4F5" stroke-width="3.5"/><circle cx="60" cy="117" r="6.5" fill="#FFD34D" stroke="#D99A00" stroke-width="2"/><text x="60" y="120" font-size="7" text-anchor="middle" fill="#8A6200" font-weight="700">1</text>`,
  bracelet: `<ellipse cx="85" cy="126" rx="6" ry="2.6" transform="rotate(-22 85 126)" fill="none" stroke="#FFD34D" stroke-width="2.4"/><circle cx="87" cy="128" r="1.8" fill="#F25C8C"/>`,
  bowtie: `<path d="M60 103 L50 98 L50 108 Z M60 103 L70 98 L70 108 Z" fill="#F25C5C" stroke="#B83838" stroke-width="1.6" stroke-linejoin="round"/><circle cx="60" cy="103" r="2.6" fill="#B83838"/>`,
};

/* ---------- shop catalogue ----------
   cat: wear | bag | jewel (worn) · food | ride | home (placed in the room) · wall | floor (room style)
   w = width in the room as % of the room width; multi = can buy more than one */
const ITEMS = [
  { id: "none", cat: "wear", n: "Nothing", p: 0 }, { id: "glasses", cat: "wear", n: "Glasses", p: 0 }, { id: "bow", cat: "wear", n: "Bow", p: 20 }, { id: "flower", cat: "wear", n: "Flower", p: 25 },
  { id: "cap", cat: "wear", n: "Cap", p: 30 }, { id: "stars", cat: "wear", n: "Star clips", p: 30 }, { id: "beret", cat: "wear", n: "Beret", p: 40 }, { id: "headphones", cat: "wear", n: "Headphones", p: 50 },
  { id: "partyhat", cat: "wear", n: "Party hat", p: 40 }, { id: "tiara", cat: "wear", n: "Tiara", p: 80 }, { id: "crown", cat: "wear", n: "Crown", p: 100 },
  { id: "tote", cat: "bag", n: "Music tote", p: 35 }, { id: "backpack", cat: "bag", n: "Backpack", p: 45 }, { id: "heartpurse", cat: "bag", n: "Heart purse", p: 60 }, { id: "starbag", cat: "bag", n: "Star bag", p: 70 },
  { id: "bowtie", cat: "jewel", n: "Bow tie", p: 25 }, { id: "bracelet", cat: "jewel", n: "Bracelet", p: 35 }, { id: "heart", cat: "jewel", n: "Heart necklace", p: 50 }, { id: "pearls", cat: "jewel", n: "Pearls", p: 70 }, { id: "medal", cat: "jewel", n: "Gold medal", p: 120 },
  { id: "banana", cat: "food", n: "Banana", p: 8, w: 9, multi: 1 }, { id: "apple", cat: "food", n: "Apple", p: 8, w: 8, multi: 1 }, { id: "onigiri", cat: "food", n: "Rice ball", p: 10, w: 9, multi: 1 },
  { id: "candy", cat: "food", n: "Lollipop", p: 10, w: 7, multi: 1 }, { id: "donut", cat: "food", n: "Donut", p: 15, w: 9, multi: 1 }, { id: "icecream", cat: "food", n: "Ice cream", p: 18, w: 8, multi: 1 },
  { id: "cake", cat: "food", n: "Strawberry cake", p: 25, w: 11, multi: 1 }, { id: "macarons", cat: "food", n: "Macaron tower", p: 35, w: 10, multi: 1 },
  { id: "balloon", cat: "ride", n: "Balloon", p: 12, w: 9, multi: 1 }, { id: "scooter", cat: "ride", n: "Scooter", p: 60, w: 18 }, { id: "bike", cat: "ride", n: "Bicycle", p: 80, w: 26 },
  { id: "train", cat: "ride", n: "Toy train", p: 90, w: 28 }, { id: "car", cat: "ride", n: "Red car", p: 150, w: 32 },
  { id: "cushion", cat: "home", n: "Cushion", p: 12, w: 12, multi: 1 }, { id: "plant", cat: "home", n: "Plant", p: 20, w: 11, multi: 1 }, { id: "rug", cat: "home", n: "Round rug", p: 25, w: 36 },
  { id: "lamp", cat: "home", n: "Lamp", p: 30, w: 10 }, { id: "clock", cat: "home", n: "Clock", p: 30, w: 11 }, { id: "poster", cat: "home", n: "Music poster", p: 25, w: 15 },
  { id: "window", cat: "home", n: "Window", p: 40, w: 24 }, { id: "stand", cat: "home", n: "Music stand", p: 35, w: 12 }, { id: "shelf", cat: "home", n: "Bookshelf", p: 50, w: 20 },
  { id: "sofa", cat: "home", n: "Sofa", p: 70, w: 32 }, { id: "bed", cat: "home", n: "Bed", p: 80, w: 36 }, { id: "gift", cat: "home", n: "Present", p: 20, w: 10, multi: 1 },
  { id: "piano", cat: "home", n: "Grand piano", p: 200, w: 40 },
  { id: "w_cream", cat: "wall", n: "Cream", p: 0 }, { id: "w_dots", cat: "wall", n: "Pink dots", p: 30 }, { id: "w_stripes", cat: "wall", n: "Mint stripes", p: 30 },
  { id: "w_notes", cat: "wall", n: "Music notes", p: 40 }, { id: "w_clouds", cat: "wall", n: "Clouds", p: 40 }, { id: "w_night", cat: "wall", n: "Starry night", p: 60 },
  { id: "f_wood", cat: "floor", n: "Wood", p: 0 }, { id: "f_check", cat: "floor", n: "Checks", p: 30 }, { id: "f_pink", cat: "floor", n: "Pink carpet", p: 30 }, { id: "f_grass", cat: "floor", n: "Grass", p: 40 },
];
const itemOf = id => ITEMS.find(i => i.id === id);
const WORN = { wear: "acc", bag: "bag", jewel: "jewel" };
const SHOPCATS = ["wear", "bag", "jewel", "food", "ride", "home", "wall"];

/* room objects, each in its own viewBox; anchored at bottom centre */
const ART = {
  banana: ["0 0 40 30", `<path d="M4 10 Q10 28 34 22 Q38 20 36 16 Q16 22 8 6 Z" fill="#FFE066" stroke="#D9A800" stroke-width="2" stroke-linejoin="round"/><path d="M6 8 L4 4" stroke="#7A5A1E" stroke-width="3" stroke-linecap="round"/>`],
  apple: ["0 0 30 32", `<path d="M15 9 Q4 4 3 16 Q4 30 15 29 Q26 30 27 16 Q26 4 15 9Z" fill="#F25C5C" stroke="#B83838" stroke-width="2"/><path d="M15 9 Q15 4 18 2" stroke="#7A5A1E" stroke-width="2.5" fill="none" stroke-linecap="round"/><ellipse cx="21" cy="5" rx="5" ry="2.5" fill="#4CC59A" transform="rotate(-20 21 5)"/><ellipse cx="9" cy="14" rx="2" ry="4" fill="#fff" opacity=".5"/>`],
  onigiri: ["0 0 34 30", `<path d="M17 2 Q24 4 31 22 Q32 28 26 28 H8 Q2 28 3 22 Q10 4 17 2Z" fill="#fff" stroke="#C9C4D6" stroke-width="2"/><rect x="10" y="18" width="14" height="10" rx="2" fill="#2E3A3A"/><circle cx="13" cy="14" r="1.3" fill="#2A2030"/><circle cx="21" cy="14" r="1.3" fill="#2A2030"/>`],
  candy: ["0 0 24 46", `<path d="M12 22 V44" stroke="#fff" stroke-width="3" stroke-linecap="round"/><path d="M12 22 V44" stroke="#C9C4D6" stroke-width="1"/><circle cx="12" cy="12" r="10" fill="#FF8FB1" stroke="#E14B6E" stroke-width="2"/><path d="M12 12 m-6 0 a6 6 0 1 0 6-6 a3 3 0 1 0 3 3" fill="none" stroke="#fff" stroke-width="2.2"/>`],
  donut: ["0 0 36 26", `<ellipse cx="18" cy="14" rx="16" ry="11" fill="#E8B57A" stroke="#B9824A" stroke-width="2"/><path d="M4 12 Q18 0 32 12 Q30 18 18 16 Q6 18 4 12Z" fill="#FF8FB1"/><ellipse cx="18" cy="12" rx="5" ry="3" fill="#B9824A"/><g stroke-width="2" stroke-linecap="round"><path d="M10 9 l2 1" stroke="#FFD34D"/><path d="M24 8 l2-1" stroke="#5BB4F5"/><path d="M26 13 l2 1" stroke="#fff"/><path d="M9 14 l1 2" stroke="#4CC59A"/></g>`],
  icecream: ["0 0 28 44", `<path d="M6 20 L14 42 L22 20 Z" fill="#E8B57A" stroke="#B9824A" stroke-width="2" stroke-linejoin="round"/><circle cx="14" cy="16" r="9" fill="#FFC6D9" stroke="#E88AAE" stroke-width="2"/><circle cx="14" cy="7" r="4" fill="#F25C5C"/>`],
  cake: ["0 0 44 40", `<path d="M4 18 H40 V34 Q22 40 4 34 Z" fill="#FFF3E6" stroke="#E0B98A" stroke-width="2"/><path d="M4 18 Q8 24 12 18 Q16 24 20 18 Q24 24 28 18 Q32 24 36 18 Q38 22 40 18" fill="#FFC6D9" stroke="#E88AAE" stroke-width="1.6"/><path d="M4 26 H40" stroke="#FF8FB1" stroke-width="3"/><path d="M14 18 Q14 9 18 8 Q22 9 22 18" fill="#F25C5C"/><path d="M26 18 Q26 11 29 10 Q32 11 32 18" fill="#F25C5C"/><path d="M8 18 Q8 13 11 12 Q14 13 14 18" fill="#F25C5C"/>`],
  macarons: ["0 0 36 46", ["#FFC6D9", "#C9B8F2", "#A7E3CF", "#FFE08A", "#FFC6D9"].map((c, i) => `<rect x="${4 + i * 2}" y="${36 - i * 8}" width="${28 - i * 4}" height="7" rx="3.5" fill="${c}" stroke="${shade(c, -.3)}" stroke-width="1.5"/>`).join("") + `<circle cx="18" cy="2" r="2" fill="#F25C5C"/>`],
  balloon: ["0 0 30 70", `<path d="M15 34 Q10 50 16 58 Q20 64 15 70" fill="none" stroke="#8C88A0" stroke-width="1.2"/><ellipse cx="15" cy="17" rx="13" ry="16" fill="#FF7FA8" stroke="#D84A78" stroke-width="2"/><path d="M12 33 L18 33 L15 37Z" fill="#D84A78"/><ellipse cx="10" cy="11" rx="3" ry="5" fill="#fff" opacity=".5"/>`],
  scooter: ["0 0 60 52", `<circle cx="12" cy="44" r="7" fill="#3A3A48"/><circle cx="48" cy="44" r="7" fill="#3A3A48"/><circle cx="12" cy="44" r="3" fill="#B7B4C2"/><circle cx="48" cy="44" r="3" fill="#B7B4C2"/><path d="M12 44 H46 M46 44 L42 6" stroke="#4CC59A" stroke-width="5" stroke-linecap="round"/><path d="M34 6 H50" stroke="#3A3A48" stroke-width="4" stroke-linecap="round"/>`],
  bike: ["0 0 80 52", `<g fill="none" stroke="#3A3A48" stroke-width="4"><circle cx="16" cy="36" r="13"/><circle cx="64" cy="36" r="13"/></g><path d="M16 36 L32 16 H56 L64 36 M32 16 L40 36 L56 16 M40 36 L16 36" fill="none" stroke="#5BB4F5" stroke-width="4" stroke-linejoin="round" stroke-linecap="round"/><path d="M28 12 h10" stroke="#3A3A48" stroke-width="4" stroke-linecap="round"/><path d="M56 16 L54 8 h8" fill="none" stroke="#3A3A48" stroke-width="3.5" stroke-linecap="round"/><path d="M62 30 Q74 18 76 26" fill="none" stroke="#FF7FA8" stroke-width="0"/>`],
  train: ["0 0 90 44", `<rect x="4" y="12" width="30" height="22" rx="4" fill="#F25C5C" stroke="#B83838" stroke-width="2"/><rect x="10" y="4" width="14" height="12" rx="2" fill="#F25C5C" stroke="#B83838" stroke-width="2"/><rect x="14" y="16" width="8" height="7" rx="1.5" fill="#BFE6FF"/><rect x="38" y="14" width="22" height="20" rx="4" fill="#FFD34D" stroke="#D99A00" stroke-width="2"/><rect x="64" y="14" width="22" height="20" rx="4" fill="#5BB4F5" stroke="#2F7FBF" stroke-width="2"/><path d="M34 26 h4 M60 26 h4" stroke="#3A3A48" stroke-width="2"/>${[12, 26, 44, 54, 70, 80].map(x => `<circle cx="${x}" cy="37" r="5" fill="#3A3A48"/><circle cx="${x}" cy="37" r="1.8" fill="#B7B4C2"/>`).join("")}`],
  car: ["0 0 100 54", `<path d="M6 36 Q6 24 18 22 L30 8 Q34 4 42 4 H66 Q74 4 78 10 L88 22 Q96 24 96 36 V40 H6 Z" fill="#F25C5C" stroke="#B83838" stroke-width="2.5" stroke-linejoin="round"/><path d="M34 10 H50 V22 H24 Z M56 10 H70 L80 22 H56 Z" fill="#BFE6FF" stroke="#7FB6DA" stroke-width="1.5" stroke-linejoin="round"/><circle cx="26" cy="42" r="10" fill="#3A3A48"/><circle cx="76" cy="42" r="10" fill="#3A3A48"/><circle cx="26" cy="42" r="4" fill="#D9DCE8"/><circle cx="76" cy="42" r="4" fill="#D9DCE8"/><ellipse cx="92" cy="30" rx="3" ry="2.5" fill="#FFE066"/>`],
  cushion: ["0 0 44 28", `<path d="M4 8 Q22 2 40 8 Q44 16 40 24 Q22 28 4 24 Q0 16 4 8Z" fill="#C9B8F2" stroke="#9A86D6" stroke-width="2"/><circle cx="22" cy="16" r="2.5" fill="#9A86D6"/>`],
  plant: ["0 0 40 60", `<path d="M10 40 H30 L27 58 H13 Z" fill="#E8956B" stroke="#B9683F" stroke-width="2" stroke-linejoin="round"/><path d="M20 40 Q8 30 6 14 Q16 18 20 40 Q22 18 32 8 Q34 26 20 40 Q28 28 38 26 Q34 38 20 40" fill="#4CC59A" stroke="#2E9A73" stroke-width="2" stroke-linejoin="round"/>`],
  rug: ["0 0 130 34", `<ellipse cx="65" cy="17" rx="62" ry="15" fill="#FFC6D9" stroke="#E88AAE" stroke-width="2"/><ellipse cx="65" cy="17" rx="46" ry="10" fill="none" stroke="#fff" stroke-width="2.5" stroke-dasharray="2 6" stroke-linecap="round"/>`],
  lamp: ["0 0 34 80", `<path d="M6 4 H28 L32 26 H2 Z" fill="#FFE08A" stroke="#D9A800" stroke-width="2" stroke-linejoin="round"/><path d="M17 26 V74" stroke="#8C88A0" stroke-width="3"/><ellipse cx="17" cy="76" rx="11" ry="3.5" fill="#8C88A0"/>`],
  clock: ["0 0 40 40", `<circle cx="20" cy="20" r="17" fill="#fff" stroke="#7C6CF0" stroke-width="3.5"/><path d="M20 20 V10 M20 20 L27 24" stroke="#3A3A48" stroke-width="2.5" stroke-linecap="round"/>${[0, 90, 180, 270].map(r => `<circle cx="20" cy="7" r="1.4" fill="#3A3A48" transform="rotate(${r} 20 20)"/>`).join("")}`],
  poster: ["0 0 50 64", `<rect x="3" y="3" width="44" height="58" rx="3" fill="#FFF7CC" stroke="#E0B95A" stroke-width="2.5"/><path d="M18 46 V18 L36 14 V42" fill="none" stroke="#7C6CF0" stroke-width="3"/><ellipse cx="14" cy="46" rx="5" ry="4" fill="#7C6CF0"/><ellipse cx="32" cy="42" rx="5" ry="4" fill="#7C6CF0"/><path d="M18 18 L36 14 V20 L18 24Z" fill="#7C6CF0"/>`],
  window: ["0 0 80 70", `<rect x="4" y="4" width="72" height="56" rx="6" fill="#BFE6FF" stroke="#fff" stroke-width="6"/><rect x="4" y="4" width="72" height="56" rx="6" fill="none" stroke="#D9C9A8" stroke-width="2"/><path d="M40 4 V60 M4 32 H76" stroke="#fff" stroke-width="5"/><circle cx="60" cy="18" r="6" fill="#FFE066"/><path d="M12 54 Q18 46 26 50 Q30 44 36 50" fill="#fff"/><rect x="0" y="60" width="80" height="8" rx="3" fill="#E8C9A8" stroke="#C9A57E" stroke-width="1.5"/>`],
  stand: ["0 0 40 80", `<rect x="4" y="4" width="32" height="22" rx="2" fill="#3A3A48"/><rect x="8" y="7" width="24" height="16" fill="#fff"/><path d="M11 12 H29 M11 16 H29 M11 20 H29" stroke="#8C88A0" stroke-width="1"/><path d="M20 26 V72 M20 72 L8 78 M20 72 L32 78 M20 72 V78" stroke="#3A3A48" stroke-width="3" stroke-linecap="round"/>`],
  shelf: ["0 0 64 80", `<rect x="3" y="3" width="58" height="74" rx="4" fill="#E8C9A8" stroke="#B98F64" stroke-width="2.5"/><path d="M3 28 H61 M3 53 H61" stroke="#B98F64" stroke-width="2.5"/>${[["#F25C5C", 8], ["#5BB4F5", 15], ["#FFD34D", 22], ["#4CC59A", 29], ["#C9B8F2", 40]].map(([c, x]) => `<rect x="${x}" y="9" width="6" height="18" rx="1" fill="${c}"/>`).join("")}${[["#FF8FB1", 8], ["#7C6CF0", 15], ["#FFB04C", 30], ["#4CC59A", 37]].map(([c, x]) => `<rect x="${x}" y="34" width="6" height="18" rx="1" fill="${c}"/>`).join("")}<circle cx="50" cy="44" r="6" fill="#4CC59A"/><rect x="10" y="62" width="16" height="14" rx="2" fill="#FFF7CC"/>`],
  sofa: ["0 0 100 54", `<rect x="8" y="6" width="84" height="30" rx="12" fill="#7C6CF0" stroke="#5547C0" stroke-width="2.5"/><rect x="2" y="22" width="18" height="26" rx="8" fill="#8F82FF" stroke="#5547C0" stroke-width="2.5"/><rect x="80" y="22" width="18" height="26" rx="8" fill="#8F82FF" stroke="#5547C0" stroke-width="2.5"/><rect x="16" y="28" width="68" height="18" rx="6" fill="#8F82FF" stroke="#5547C0" stroke-width="2.5"/><path d="M50 30 V46" stroke="#5547C0" stroke-width="2"/><path d="M14 48 v4 M86 48 v4" stroke="#5547C0" stroke-width="4" stroke-linecap="round"/>`],
  bed: ["0 0 110 62", `<rect x="4" y="4" width="22" height="52" rx="6" fill="#E8C9A8" stroke="#B98F64" stroke-width="2.5"/><rect x="20" y="28" width="86" height="22" rx="6" fill="#fff" stroke="#C9C4D6" stroke-width="2"/><rect x="48" y="24" width="58" height="26" rx="8" fill="#FFC6D9" stroke="#E88AAE" stroke-width="2"/><path d="M56 32 h4 M68 38 h4 M82 32 h4 M94 40 h4" stroke="#fff" stroke-width="3" stroke-linecap="round"/><ellipse cx="34" cy="28" rx="12" ry="7" fill="#fff" stroke="#C9C4D6" stroke-width="2"/><path d="M22 50 v8 M102 50 v8" stroke="#B98F64" stroke-width="4" stroke-linecap="round"/>`],
  gift: ["0 0 34 36", `<rect x="3" y="12" width="28" height="22" rx="2" fill="#5BB4F5" stroke="#2F7FBF" stroke-width="2"/><rect x="1" y="8" width="32" height="8" rx="2" fill="#7CC4FA" stroke="#2F7FBF" stroke-width="2"/><path d="M17 8 V34" stroke="#FF7FA8" stroke-width="5"/><path d="M17 8 Q8 0 10 6 Q12 9 17 8 Q26 0 24 6 Q22 9 17 8" fill="#FF7FA8" stroke="#D84A78" stroke-width="1.5"/>`],
  piano: ["0 0 120 80", `<path d="M10 22 Q12 8 40 8 Q60 8 76 16 Q96 26 112 26 Q116 30 112 34 H10 Z" fill="#2A2733" stroke="#14121A" stroke-width="2.5" stroke-linejoin="round"/><path d="M14 8 L40 -6" stroke="#2A2733" stroke-width="3"/><rect x="8" y="34" width="106" height="10" rx="2" fill="#2A2733"/><rect x="10" y="36" width="44" height="7" fill="#fff"/>${[...Array(10)].map((_, i) => `<path d="M${14 + i * 4} 36 v7" stroke="#C9C4D6" stroke-width=".8"/>`).join("")}${[0, 1, 3, 4, 5, 7, 8].map(i => `<rect x="${15 + i * 4}" y="36" width="2.2" height="4.2" fill="#2A2733"/>`).join("")}<path d="M16 44 V74 M100 44 V74 M60 44 V70" stroke="#2A2733" stroke-width="5" stroke-linecap="round"/><path d="M52 70 h16" stroke="#D9A800" stroke-width="3" stroke-linecap="round"/>`],
};
const WALLS = {
  w_cream: c => `<rect width="360" height="190" fill="#FFF6EA"/>`,
  w_dots: c => `<defs><pattern id="pd${c}" width="24" height="24" patternUnits="userSpaceOnUse"><rect width="24" height="24" fill="#FFE6EF"/><circle cx="6" cy="6" r="3" fill="#FFB3C7"/><circle cx="18" cy="18" r="3" fill="#FFB3C7"/></pattern></defs><rect width="360" height="190" fill="url(#pd${c})"/>`,
  w_stripes: c => `<defs><pattern id="ps${c}" width="24" height="10" patternUnits="userSpaceOnUse"><rect width="24" height="10" fill="#E2F7EE"/><rect width="10" height="10" fill="#C8EEDD"/></pattern></defs><rect width="360" height="190" fill="url(#ps${c})"/>`,
  w_notes: c => `<defs><pattern id="pn${c}" width="44" height="44" patternUnits="userSpaceOnUse"><rect width="44" height="44" fill="#EFEAFF"/><text x="8" y="18" font-size="14" fill="#C9B8F2">♪</text><text x="28" y="38" font-size="14" fill="#C9B8F2">♫</text></pattern></defs><rect width="360" height="190" fill="url(#pn${c})"/>`,
  w_clouds: c => `<rect width="360" height="190" fill="#DDF0FF"/>${[[50, 40], [170, 70], [290, 36], [110, 130], [250, 140]].map(([x, y]) => `<g fill="#fff"><ellipse cx="${x}" cy="${y}" rx="22" ry="11"/><ellipse cx="${x + 14}" cy="${y - 7}" rx="13" ry="10"/><ellipse cx="${x - 12}" cy="${y - 4}" rx="10" ry="8"/></g>`).join("")}`,
  w_night: c => `<rect width="360" height="190" fill="#2B2F5C"/>${[[30, 30], [80, 90], [140, 40], [200, 110], [260, 50], [320, 120], [110, 150], [300, 20], [180, 160], [40, 140]].map(([x, y], i) => `<path d="M${x} ${y - 5} L${x + 1.5} ${y - 1.5} L${x + 5} ${y} L${x + 1.5} ${y + 1.5} L${x} ${y + 5} L${x - 1.5} ${y + 1.5} L${x - 5} ${y} L${x - 1.5} ${y - 1.5}Z" fill="${i % 2 ? "#FFE58A" : "#fff"}"/>`).join("")}<circle cx="300" cy="70" r="16" fill="#FFF3B0"/><circle cx="308" cy="64" r="14" fill="#2B2F5C"/>`,
};
const FLOORS = {
  f_wood: c => `<rect y="190" width="360" height="110" fill="#E8C49B"/>${[0, 1, 2, 3, 4].map(i => `<path d="M0 ${206 + i * 22} H360" stroke="#D2A879" stroke-width="2"/>`).join("")}`,
  f_check: c => `<defs><pattern id="fc${c}" width="40" height="40" patternUnits="userSpaceOnUse"><rect width="40" height="40" fill="#fff"/><rect width="20" height="20" fill="#FFD9E4"/><rect x="20" y="20" width="20" height="20" fill="#FFD9E4"/></pattern></defs><rect y="190" width="360" height="110" fill="url(#fc${c})"/>`,
  f_pink: c => `<rect y="190" width="360" height="110" fill="#FFC9DA"/><rect y="190" width="360" height="110" fill="none" stroke="#fff" stroke-width="0"/>`,
  f_grass: c => `<rect y="190" width="360" height="110" fill="#9EDC8F"/>${[...Array(24)].map((_, i) => `<path d="M${(i * 37) % 350 + 6} ${210 + (i * 23) % 80} l3 -7 l3 7" fill="none" stroke="#6CBF5E" stroke-width="2"/>`).join("")}`,
};
const itemSVG = id => { const a = ART[id]; return a ? `<svg viewBox="${a[0]}" xmlns="http://www.w3.org/2000/svg">${a[1]}</svg>` : ""; };
/* small picture for the shop */
function itemThumb(it, av) {
  if (WORN[it.cat]) return avatarSVG({ ...av, [WORN[it.cat]]: it.id === "none" ? (it.cat === "wear" ? "none" : null) : it.id }, { head: it.cat === "wear", noCheeks: false });
  if (it.cat === "wall") return `<svg viewBox="0 0 360 300">${WALLS[it.id]("t" + it.id)}<rect y="190" width="360" height="110" fill="#E8C49B"/></svg>`;
  if (it.cat === "floor") return `<svg viewBox="0 180 360 120">${FLOORS[it.id]("t" + it.id)}</svg>`;
  return itemSVG(it.id);
}

/* ---------- the room ---------- */
function defaultRoom() { return { wall: "w_cream", floor: "f_wood", me: { x: 50, y: 86 }, items: [], owned: ["w_cream", "f_wood"] }; }
function roomOf() { if (!S.room || !S.room.items) S.room = defaultRoom(); S.room.owned ||= ["w_cream", "f_wood"]; S.room.me ||= { x: 50, y: 86 }; return S.room; }
let ROOM = { edit: false, sel: null, drag: null, cat: "wear" };

function roomHTML(edit) {
  const R = roomOf();
  const placed = R.items.filter(i => i.placed);
  const objs = placed.map(i => ({ k: "i", i, y: i.y })).concat([{ k: "me", y: R.me.y }]).sort((a, b) => a.y - b.y);
  const el = o => {
    if (o.k === "me") return `<div class="ri me ${ROOM.sel === "me" ? "sel" : ""}" data-ri="me" style="left:${R.me.x}%;top:${R.me.y}%;width:24%;z-index:${Math.round(R.me.y)}">${avatarSVG(S.avatar, { room: true, noCheeks: teen() })}</div>`;
    const it = itemOf(o.i.id); if (!it) return "";
    return `<div class="ri ${ROOM.sel === o.i.u ? "sel" : ""} ${o.i.flip ? "flip" : ""}" data-ri="${o.i.u}" style="left:${o.i.x}%;top:${o.i.y}%;width:${it.w}%;z-index:${Math.round(o.i.y)}">${itemSVG(o.i.id)}</div>`;
  };
  const sel = ROOM.sel && ROOM.sel !== "me" ? R.items.find(i => i.u === ROOM.sel) : null;
  return `<div class="room ${edit ? "edit" : ""}" id="room"><svg class="room-bg" viewBox="0 0 360 300" preserveAspectRatio="none" aria-hidden="true">${(WALLS[R.wall] || WALLS.w_cream)("r")}${(FLOORS[R.floor] || FLOORS.f_wood)("r")}<path d="M0 190 H360" stroke="#0000001a" stroke-width="5"/></svg>${objs.map(el).join("")}</div>
  ${edit && sel ? `<div class="chips room-tools"><button class="btn sm soft" data-act="rmFlip">↔ ${t("rm_flip")}</button><button class="btn sm soft" data-act="rmFront">${t("rm_front")}</button><button class="btn sm soft" data-act="rmAway">${t("rm_away")}</button></div>` : edit ? `<div class="muted small">${t("rm_hint")}</div>` : ""}`;
}
function roomTray() {
  const R = roomOf(), loose = R.items.filter(i => !i.placed);
  return `<div class="label">${t("rm_tray")}</div>${loose.length ? `<div class="tray">${loose.map(i => `<button data-act="rmPlace" data-id="${i.u}" aria-label="${esc(itemOf(i.id)?.n || "")}">${itemSVG(i.id)}</button>`).join("")}</div>` : `<div class="muted small">${t("rm_trayEmpty")}</div>`}
  <div class="label">${t("rm_style")}</div><div class="tray">${R.owned.map(id => { const it = itemOf(id); const on = R.wall === id || R.floor === id; return `<button class="${on ? "on" : ""}" data-act="rmStyle" data-id="${id}" aria-label="${esc(it.n)}">${itemThumb(it, S.avatar)}</button>`; }).join("")}</div>`;
}
/* the "Me" page top: room + buttons */
function roomCard() {
  return `<div class="section"><div class="section-head"><h2>${t("rm_title", { name: esc(S.profile.name || "") })}</h2></div>${roomHTML(false)}
  <div class="chips"><button class="btn" data-act="rmEdit">${t("rm_decorate")}</button><button class="btn soft" data-act="avatar">${t("editAvatar")}</button></div></div>`;
}
function roomSheet() {
  openSheet(`<div class="stack"><div class="act-head"><h2>${t("rm_decorate")}</h2><button class="icon-btn" data-act="close" aria-label="Close">${I.close}</button></div><div id="roomWrap">${roomHTML(true)}</div><div id="trayWrap">${roomTray()}</div></div>`, true);
  bindRoom();
}
function rerenderRoom() { const w = document.getElementById("roomWrap"); if (!w) return; w.innerHTML = roomHTML(true); const tw = document.getElementById("trayWrap"); if (tw) tw.innerHTML = roomTray(); bindRoom(); }
function bindRoom() {
  const room = document.getElementById("room"); if (!room || !room.classList.contains("edit")) return;
  room.onpointerdown = e => {
    const n = e.target.closest(".ri"); if (!n) { ROOM.sel = null; rerenderRoom(); return; }
    e.preventDefault(); const r = room.getBoundingClientRect();
    ROOM.drag = { n, id: n.dataset.ri, r, sx: e.clientX, sy: e.clientY, moved: false };
    try { room.setPointerCapture(e.pointerId); } catch (_) { }
  };
  room.onpointermove = e => {
    const d = ROOM.drag; if (!d) return;
    if (Math.abs(e.clientX - d.sx) + Math.abs(e.clientY - d.sy) > 4) d.moved = true;
    if (!d.moved) return;
    const x = Math.max(4, Math.min(96, (e.clientX - d.r.left) / d.r.width * 100)), y = Math.max(12, Math.min(99, (e.clientY - d.r.top) / d.r.height * 100));
    d.n.style.left = x + "%"; d.n.style.top = y + "%"; d.n.style.zIndex = Math.round(y); d.x = x; d.y = y;
  };
  room.onpointerup = () => {
    const d = ROOM.drag; ROOM.drag = null; if (!d) return; const R = roomOf();
    const tgt = d.id === "me" ? R.me : R.items.find(i => i.u === d.id);
    if (d.moved && tgt) { tgt.x = Math.round(d.x * 10) / 10; tgt.y = Math.round(d.y * 10) / 10; save(); }
    ROOM.sel = d.id; rerenderRoom();
  };
}
function roomAction(act, id) {
  const R = roomOf(), sel = R.items.find(i => i.u === ROOM.sel);
  if (act === "rmEdit") { ROOM.sel = null; roomSheet(); return true; }
  if (act === "rmPlace") { const i = R.items.find(x => x.u === id); if (i) { i.placed = true; i.x = 50; i.y = 80; ROOM.sel = i.u; save(); rerenderRoom(); } return true; }
  if (act === "rmAway") { if (sel) { sel.placed = false; ROOM.sel = null; save(); rerenderRoom(); } return true; }
  if (act === "rmFlip") { if (sel) { sel.flip = !sel.flip; save(); rerenderRoom(); } return true; }
  if (act === "rmFront") { if (sel) { sel.y = Math.min(99, sel.y + 0.1); R.items = R.items.filter(i => i !== sel).concat(sel); save(); rerenderRoom(); } return true; }
  if (act === "rmStyle") { const it = itemOf(id); if (it) { if (it.cat === "wall") R.wall = id; else R.floor = id; save(); rerenderRoom(); } return true; }
  return false;
}

/* ---------- shop ---------- */
function ownsItem(it) {
  if (WORN[it.cat]) return it.p === 0 || S.owned.includes(it.id);
  if (it.cat === "wall" || it.cat === "floor") return roomOf().owned.includes(it.id);
  return !it.multi && roomOf().items.some(i => i.id === it.id);
}
function petShop() {
  const cat = SHOPCATS.includes(ROOM.cat) ? ROOM.cat : "wear";
  const list = ITEMS.filter(i => cat === "wall" ? (i.cat === "wall" || i.cat === "floor") : i.cat === cat);
  const av = petOf(S.avatar);
  return `<div class="chips">${SHOPCATS.map(k => `<button class="chip ${cat === k ? "on" : ""}" data-act="petCat" data-v="${k}">${t("pc_" + k)}</button>`).join("")}</div>
  <div class="shop pshop">${list.map(it => {
    const own = ownsItem(it), worn = WORN[it.cat] && ((av[WORN[it.cat]] || (it.cat === "wear" ? "none" : null)) === (it.id === "none" ? (it.cat === "wear" ? "none" : null) : it.id));
    const nIn = it.multi ? roomOf().items.filter(i => i.id === it.id).length : 0;
    const status = worn ? `<span class="muted">✓</span>` : own ? `<span class="muted">${WORN[it.cat] ? t("wear") : (it.cat === "wall" || it.cat === "floor") ? t("rm_use") : t("rm_inRoom")}</span>` : `<span class="price">${I.coin}${it.p}</span>`;
    return `<button class="${worn ? "on" : ""}" data-act="petBuy" data-id="${it.id}"><span class="face sq">${itemThumb(it, av)}</span><span>${esc(it.n)}${nIn ? ` ×${nIn}` : ""}</span>${status}</button>`;
  }).join("")}</div>`;
}
function petBuy(id) {
  const it = itemOf(id); if (!it) return;
  S.avatar = petOf(S.avatar); const R = roomOf();
  const own = ownsItem(it);
  if (!own) {
    if (S.coins < it.p) { toast(t("notEnough")); return; }
    S.coins -= it.p;
    if (WORN[it.cat]) S.owned.push(it.id);
    else if (it.cat === "wall" || it.cat === "floor") R.owned.push(it.id);
    else R.items.push({ u: uid(), id: it.id, placed: true, x: 14 + Math.random() * 72, y: it.cat === "home" && /window|clock|poster/.test(it.id) ? 40 + Math.random() * 12 : 60 + Math.random() * 16 });
    toast(WORN[it.cat] || it.cat === "wall" || it.cat === "floor" ? t("bought") : t("rm_bought")); celebrate();
  }
  if (WORN[it.cat]) { const f = WORN[it.cat], v = it.id === "none" ? (f === "acc" ? "none" : null) : it.id; S.avatar[f] = S.avatar[f] === v && f !== "acc" ? null : v; }
  if (it.cat === "wall") R.wall = it.id; if (it.cat === "floor") R.floor = it.id;
  save(); refresh();
}

/* ---------- character editor ---------- */
function petEditor() {
  S.avatar = petOf(S.avatar); const a = S.avatar;
  const sw = (arr, f) => `<div class="swatches">${arr.map((c, i) => `<button class="sw ${a[f] === i ? "on" : ""}" style="background:${c}" data-act="av" data-f="${f}" data-v="${i}" aria-label="${f} ${i + 1}"></button>`).join("")}</div>`;
  return `<div class="ava-full">${avatarSVG(a, { noCheeks: teen() })}</div>
  <div class="label">${t("pe_animal")}</div><div class="animals">${ANIMALS.map(n => `<button class="${a.animal === n ? "on" : ""}" data-act="av" data-f="animal" data-v="${n}" aria-label="${n}">${avatarSVG({ ...a, animal: n, fur: ANIMAL_FUR[n], acc: "none", bag: null, jewel: null }, { head: true, noCheeks: teen() })}<span>${t("an_" + n)}</span></button>`).join("")}</div>
  <div class="label">${t("pe_fur")}</div>${sw(FURS, "fur")}
  <div class="label">${t("pe_outfit")}</div><div class="chips">${OUTFITS.map(o => `<button class="chip ${a.outfit === o ? "on" : ""}" data-act="av" data-f="outfit" data-v="${o}">${t("of_" + o)}</button>`).join("")}</div>
  <div class="label">${t("pe_ocol")}</div>${sw(OCOLS, "oc")}
  <div class="label">${t("bgc")}</div>${sw(AVBG, "bg")}`;
}
function petSet(f, v) {
  S.avatar = petOf(S.avatar);
  if (f === "animal") { S.avatar.animal = v; S.avatar.fur = ANIMAL_FUR[v]; }
  else if (f === "outfit") S.avatar.outfit = v;
  else S.avatar[f] = +v;
}
