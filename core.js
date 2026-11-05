/* ===== utils ===== */
const pad=n=>String(n).padStart(2,"0");
const key=d=>d.getFullYear()+"-"+pad(d.getMonth()+1)+"-"+pad(d.getDate());
const parse=k=>{const[y,m,d]=k.split("-").map(Number);return new Date(y,m-1,d)};
const addDays=(d,n)=>{const x=new Date(d);x.setDate(x.getDate()+n);return x};
const monday=d=>{const x=new Date(d.getFullYear(),d.getMonth(),d.getDate());return addDays(x,-((x.getDay()+6)%7))};
let TODAY,TK,WK,MK,DAYNO;
/* dates are recomputed when the app comes back to the foreground (it may stay open past midnight) */
function setDates(){TODAY=new Date();TK=key(TODAY);WK=key(monday(TODAY));MK=TK.slice(0,7);DAYNO=Math.floor(parse(TK)/864e5)}
setDates();
const diffDays=(a,b)=>Math.round((parse(b)-parse(a))/864e5);
const fmt=(k,o={month:"short",day:"numeric"})=>parse(k).toLocaleDateString(LANG,o);
/* ids are real UUIDs so they can be stored in the database as-is */
const uid=()=>{try{if(crypto.randomUUID)return crypto.randomUUID()}catch(e){}const b=crypto.getRandomValues(new Uint8Array(16));b[6]=b[6]&15|64;b[8]=b[8]&63|128;const h=[...b].map(x=>x.toString(16).padStart(2,"0")).join("");return h.slice(0,8)+"-"+h.slice(8,12)+"-"+h.slice(12,16)+"-"+h.slice(16,20)+"-"+h.slice(20)};
const isUuid=s=>/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(String(s||""));
const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const rnd=n=>Math.floor(Math.random()*n);
const pick=a=>a[rnd(a.length)];
const shuffle=a=>{a=[...a];for(let i=a.length-1;i>0;i--){const j=rnd(i+1);[a[i],a[j]]=[a[j],a[i]]}return a};
const withAns=(ans,pool,n=4)=>shuffle([ans,...shuffle([...new Set(pool)].filter(x=>x!==ans)).slice(0,n-1)]);
/* exact time: seconds are kept as seconds */
function fmtDur(s){s=Math.round(s||0);const h=Math.floor(s/3600),m=Math.floor(s%3600/60),x=s%60;if(h)return `${h} h ${m} min`;if(m)return `${m} min ${pad(x)} s`;return `${x} s`}
const clockOf=s=>{s=Math.max(0,Math.round(s));return pad(Math.floor(s/60))+":"+pad(s%60)};

/* ===== icons ===== */
const I={
 star:'<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.5l2.9 6 6.6.8-4.9 4.5 1.3 6.5L12 17l-5.9 3.3 1.3-6.5L2.5 9.3l6.6-.8z"/></svg>',
 coin:'<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9.5" fill="currentColor"/><circle cx="12" cy="12" r="6.6" fill="none" stroke="#fff" stroke-opacity=".55" stroke-width="1.5"/><path d="M10.5 15V8.4l4.5-1V14" fill="none" stroke="#fff" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/><circle cx="9.3" cy="15.2" r="1.5" fill="#fff"/><circle cx="13.8" cy="14.2" r="1.5" fill="#fff"/></svg>',
 heart:'<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 21s-7.5-4.6-9.5-9.3C1.1 8.3 3.3 4.5 7 4.5c2 0 3.5 1.1 5 3 1.5-1.9 3-3 5-3 3.7 0 5.9 3.8 4.5 7.2C19.5 16.4 12 21 12 21z"/></svg>',
 heartO:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20s-7-4.3-8.8-8.6C1.9 8.3 3.9 5 7.2 5c1.9 0 3.3 1 4.8 2.8C13.5 6 14.9 5 16.8 5c3.3 0 5.3 3.3 4 6.4C19 15.7 12 20 12 20z"/></svg>',
 gear:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="3.2"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M4.9 19.1L7 17M17 7l2.1-2.1"/></svg>',
 piano:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="M8 5v14M13 5v14M18 5v14" stroke-width="1.6"/><path d="M6.5 5v7M10.5 5v7M15.5 5v7" stroke-width="2.6"/></svg>',
 eye:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/></svg>',
 bolt:'<svg viewBox="0 0 24 24" fill="currentColor"><path d="M13 2L4 14h6l-1 8 9-12h-6z"/></svg>',
 metro:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><path d="M8 3h8l4 18H4z"/><path d="M12 17l5-10"/></svg>',
 mic:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0014 0M12 18v3"/></svg>',
 ear:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M7 9a5 5 0 0110 0c0 3-3 4-3 7a3 3 0 01-6 0"/><path d="M10 10a2 2 0 014 0"/></svg>',
 book:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><path d="M4 5a2 2 0 012-2h13v16H6a2 2 0 00-2 2z"/><path d="M4 21V5M9 8h6M9 12h5"/></svg>',
 dot:'<svg viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="12" r="5"/></svg>',
 home:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><path d="M3 11l9-7 9 7v9a1 1 0 01-1 1h-5v-6h-6v6H4a1 1 0 01-1-1z"/></svg>',
 note:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="7" cy="17" r="3"/><path d="M10 17V4l9-2v12"/><circle cx="16" cy="14" r="3"/></svg>',
 flag:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 21V4M5 4h12l-2.5 4.5L17 13H5"/></svg>',
 user:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="8" r="4"/><path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6"/></svg>',
 close:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>',
 play:'<svg viewBox="0 0 24 24" fill="currentColor"><path d="M7 4l13 8-13 8z"/></svg>',
 lock:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 018 0v3"/></svg>',
 video:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><rect x="3" y="6" width="13" height="12" rx="2"/><path d="M16 10l5-3v10l-5-3z"/></svg>'
};
const ico=(n,cls="")=>`<span class="ico ${cls}">${I[n]}</span>`;
const ACT={piece:{ic:"piano",col:"var(--accent)",coins:10},sight:{ic:"eye",col:"#2F8FD8",coins:6},nr:{ic:"bolt",col:"#E07A1F",coins:5},
 tech:{ic:"metro",col:"#7A5BD6",coins:6},solf:{ic:"mic",col:"#D9466F",coins:6},ear:{ic:"ear",col:"#1C9A73",coins:6},theory:{ic:"book",col:"#B8740F",coins:6},other:{ic:"dot",col:"#7C8395",coins:0}};
const ORDER=["piece","sight","nr","tech","solf","ear","theory"];

/* ===== avatar (original art) ===== */
const SKINS=["#FBE0CB","#F2C6A0","#D9A37A","#B57A52","#8A5636","#5E3A24"];
const HAIRC=["#2B1D16","#5A3520","#A0612E","#E2B04A","#D9542F","#6E5BD6","#E46FA4","#2E8FD6"];
const SHIRTS=["#5B4BDB","#D63F84","#1FA37A","#FF8A3D","#2F8FD8","#3A3A48","#F2C14B"];
const BGS=["#E9E4FF","#FFE1EC","#DDF5EA","#FFEBD6","#DCEFFF","#2A2F45","#FFF4C2"];
const HAIRS=["short","spiky","long","bun","curly","pigtails"];
const EYES=["dots","happy","sparkle","cool"];
const ACCS=[{id:"none",price:0},{id:"glasses",price:0},{id:"bow",price:20},{id:"cap",price:20},{id:"stars",price:30},{id:"flower",price:30},{id:"headphones",price:40},{id:"visor",price:45},{id:"crown",price:80}];
function avatarSVG(a,o={}){
 const sk=SKINS[a.skin]||SKINS[1],hc=HAIRC[a.hairColor]||HAIRC[0],sh=SHIRTS[a.shirt]||SHIRTS[0],bg=BGS[a.bg]||BGS[0];
 let back="",front="";const cap=`<path d="M30 54 Q30 22 60 20 Q90 22 90 54 Q84 38 60 35 Q36 38 30 54Z" fill="${hc}"/>`;
 switch(a.hair){
  case"short":front=cap;break;
  case"spiky":front=`<path d="M29 54 L30 30 L38 36 L42 18 L50 30 L58 14 L64 29 L74 16 L76 32 L86 24 L90 54 Q84 38 60 36 Q36 38 29 54Z" fill="${hc}"/>`;break;
  case"long":back=`<path d="M26 54 Q24 18 60 17 Q96 18 94 54 L97 104 Q80 96 76 70 L44 70 Q40 96 23 104Z" fill="${hc}"/>`;front=cap;break;
  case"bun":front=`<circle cx="60" cy="15" r="11" fill="${hc}"/>`+cap;break;
  case"curly":front=[[34,40],[42,28],[54,22],[66,22],[78,28],[86,40],[30,52],[90,52]].map(([x,y])=>`<circle cx="${x}" cy="${y}" r="9.5" fill="${hc}"/>`).join("");break;
  case"pigtails":back=`<circle cx="24" cy="58" r="11" fill="${hc}"/><circle cx="96" cy="58" r="11" fill="${hc}"/>`;front=cap;break;
 }
 const eyes={happy:`<path d="M45 61 Q49 56 53 61M67 61 Q71 56 75 61" stroke="#2B1D16" stroke-width="3" fill="none" stroke-linecap="round"/>`,
  sparkle:`<circle cx="49" cy="60" r="5.2" fill="#2B1D16"/><circle cx="71" cy="60" r="5.2" fill="#2B1D16"/><circle cx="51" cy="58" r="1.8" fill="#fff"/><circle cx="73" cy="58" r="1.8" fill="#fff"/>`,
  cool:`<path d="M44 60h10M66 60h10" stroke="#2B1D16" stroke-width="3.4" stroke-linecap="round"/>`}[a.eyes]||`<circle cx="49" cy="60" r="3.6" fill="#2B1D16"/><circle cx="71" cy="60" r="3.6" fill="#2B1D16"/>`;
 const cheeks=o.noCheeks?"":`<circle cx="42" cy="70" r="4.5" fill="#F27C9A" opacity=".35"/><circle cx="78" cy="70" r="4.5" fill="#F27C9A" opacity=".35"/>`;
 const acc={glasses:`<g fill="none" stroke="#2B1D16" stroke-width="2.4"><circle cx="49" cy="60" r="8"/><circle cx="71" cy="60" r="8"/><path d="M57 60h6"/></g>`,
  bow:`<g fill="#E8457F"><path d="M88 26 L102 16 L101 37Z"/><path d="M88 26 L74 16 L75 37Z"/><circle cx="88" cy="26" r="4.5"/></g>`,
  cap:`<path d="M28 44 Q30 17 60 16 Q90 17 92 44Z" fill="${sh}"/><path d="M60 42 Q86 40 106 46 Q86 51 60 47Z" fill="${sh}" opacity=".85"/>`,
  stars:["M33 30","M85 26"].map(p=>`<path d="${p} l3 6 6 1 -4.5 4 1 6.5 -5.5 -3 -5.5 3 1 -6.5 -4.5 -4 6 -1z" fill="#FFC93C"/>`).join(""),
  headphones:`<path d="M28 58 Q28 20 60 20 Q92 20 92 58" fill="none" stroke="#2A2F45" stroke-width="6"/><rect x="21" y="52" width="13" height="20" rx="5" fill="#FF7140"/><rect x="86" y="52" width="13" height="20" rx="5" fill="#FF7140"/>`,
  flower:`<g transform="translate(88 30)">${[0,72,144,216,288].map(r=>`<ellipse rx="5" ry="8" transform="rotate(${r}) translate(0 -7)" fill="#FF8FB8"/>`).join("")}<circle r="4.5" fill="#FFC93C"/></g>`,
  visor:`<rect x="34" y="52" width="52" height="15" rx="7.5" fill="#3EC5FF" opacity=".92"/><rect x="38" y="55" width="20" height="4" rx="2" fill="#fff" opacity=".7"/>`,
  crown:`<path d="M38 30 L42 12 L51 24 L60 8 L69 24 L78 12 L82 30Z" fill="#FFC93C" stroke="#D7891B" stroke-width="1.5"/><circle cx="60" cy="22" r="3" fill="#E8457F"/>`}[a.acc]||"";
 return `<svg viewBox="0 0 120 120" role="img" aria-label="Avatar"><rect width="120" height="120" fill="${bg}"/>${back}<path d="M20 122 Q22 92 60 90 Q98 92 100 122Z" fill="${sh}"/><rect x="53" y="80" width="14" height="12" fill="${sk}"/><circle cx="60" cy="60" r="30" fill="${sk}"/>${front}${eyes}${cheeks}<path d="M51 73 Q60 80 69 73" stroke="#2B1D16" stroke-width="2.6" fill="none" stroke-linecap="round"/>${acc}</svg>`;
}
function mascotSVG(){return `<svg viewBox="0 0 64 72" aria-hidden="true"><path d="M44 8 L44 50" stroke="var(--ink)" stroke-width="4" stroke-linecap="round"/><path d="M44 8 Q60 14 58 30 Q54 20 44 20Z" fill="var(--accent2)"/><ellipse cx="28" cy="52" rx="19" ry="15" fill="var(--accent)" transform="rotate(-18 28 52)"/><circle cx="22" cy="50" r="3.4" fill="#fff"/><circle cx="34" cy="46" r="3.4" fill="#fff"/><circle cx="22.6" cy="50.6" r="1.7" fill="#1E1B2E"/><circle cx="34.6" cy="46.6" r="1.7" fill="#1E1B2E"/><path d="M23 58 Q30 61 36 55" stroke="#fff" stroke-width="2.4" fill="none" stroke-linecap="round"/></svg>`}
/* composer cards: collectible with coins (no portraits, just colour + initials) */
const CARDS=[
 {id:"bach",n:"J. S. Bach",y:"1685–1750",f:"Had 20 children, and several of them became composers too.",p:25,c:"#8A5A2B"},
 {id:"mozart",n:"W. A. Mozart",y:"1756–1791",f:"Wrote his first little pieces when he was only 5.",p:30,c:"#B5487A"},
 {id:"beethoven",n:"L. van Beethoven",y:"1770–1827",f:"Kept composing great music even after he lost his hearing.",p:40,c:"#4B4F9E"},
 {id:"chopin",n:"F. Chopin",y:"1810–1849",f:"Wrote almost all of his music for the piano.",p:35,c:"#2F7F86"},
 {id:"clara",n:"Clara Schumann",y:"1819–1896",f:"Famous pianist and one of the first to play concerts from memory.",p:40,c:"#9B4FB5"},
 {id:"tchaik",n:"P. I. Tchaikovsky",y:"1840–1893",f:"Wrote the music for The Nutcracker ballet.",p:35,c:"#C0563A"},
 {id:"debussy",n:"C. Debussy",y:"1862–1918",f:"Wrote “Clair de lune”, one of the most loved piano pieces.",p:45,c:"#3B7DC4"},
 {id:"joplin",n:"Scott Joplin",y:"c.1868–1917",f:"Called the “King of Ragtime”. He wrote “The Entertainer”.",p:50,c:"#B88A12"}];

/* ===== music ===== */
const LET=["C","D","E","F","G","A","B"],SOL=["Do","Re","Mi","Fa","So","La","Ti"],SEMI=[0,2,4,5,7,9,11];
const CHROM=["Do","Di","Re","Ri","Mi","Fa","Fi","So","Si","La","Li","Ti"];
const dia=(letter,oct)=>oct*7+letter;
const midiOf=(d,alt=0)=>12*(Math.floor(d/7)+1)+SEMI[((d%7)+7)%7]+alt;
const SHARP_ORDER=[3,0,4,1,5,2,6],FLAT_ORDER=[6,2,5,1,4,0,3];
const keyAlt=(letter,acc)=>acc>0?(SHARP_ORDER.slice(0,acc).includes(letter)?1:0):acc<0?(FLAT_ORDER.slice(0,-acc).includes(letter)?-1:0):0;
const ACCSYM={"-1":"♭","0":"♮","1":"♯","2":"𝄪"};
/* keys used for sight-reading and theory, ABRSM-style grade pools */
const KEYS={
 "C":{t:0,a:0},"G":{t:4,a:1},"D":{t:1,a:2},"A":{t:5,a:3},"E":{t:2,a:4},"B":{t:6,a:5},"F♯":{t:3,a:6},
 "F":{t:3,a:-1},"B♭":{t:6,a:-2},"E♭":{t:2,a:-3},"A♭":{t:5,a:-4},"D♭":{t:1,a:-5},"G♭":{t:4,a:-6},
 "a":{t:5,a:0,m:1},"e":{t:2,a:1,m:1},"b":{t:6,a:2,m:1},"f♯":{t:3,a:3,m:1},"c♯":{t:0,a:4,m:1},"g♯":{t:4,a:5,m:1},"d♯":{t:1,a:6,m:1},
 "d":{t:1,a:-1,m:1},"g":{t:4,a:-2,m:1},"c":{t:0,a:-3,m:1},"f":{t:3,a:-4,m:1},"b♭":{t:6,a:-5,m:1},"e♭":{t:2,a:-6,m:1}};
const keyName=k=>KEYS[k].m?k.toUpperCase()+" minor":k+" major";
const SIGHT_KEYS=[["C"],["C","G","F","a","d"],["C","G","F","D","a","d","e"],["C","G","F","D","A","B♭","a","d","e","g","b"],["C","G","F","D","A","B♭","E♭","a","d","e","g","b","f♯","c"],["C","G","F","D","A","B♭","E♭","E","A♭","a","d","e","g","b","f♯","c","c♯","f"]];
const THEORY_MAJ=[["C","G","D","F"],["C","G","D","F"],["C","G","D","F","A","B♭","E♭"],["C","G","D","F","A","B♭","E♭","E","A♭"],["C","G","D","F","A","B♭","E♭","E","A♭","B","D♭"],["C","G","D","F","A","B♭","E♭","E","A♭","B","D♭","F♯","G♭"]];
const THEORY_MIN=[[],[],["a","e","d"],["a","e","d","b","f♯","g","c","c♯","f"],["a","e","d","b","f♯","g","c","c♯","f","g♯","b♭"],["a","e","d","b","f♯","g","c","c♯","f","g♯","b♭","d♯","e♭"]];
const TERMS=[
 [["allegro","quick, lively"],["andante","at a walking pace"],["adagio","slow"],["moderato","at a moderate speed"],["forte (f)","loud"],["piano (p)","soft"],["crescendo","gradually getting louder"],["diminuendo","gradually getting softer"],["legato","smoothly"],["staccato","short, detached"],["rallentando","gradually getting slower"],["a tempo","back to the original speed"]],
 [["allegretto","fairly quick"],["lento","slow"],["presto","very fast"],["largo","slow, broad"],["cantabile","in a singing style"],["dolce","sweetly"],["accelerando","gradually getting faster"],["poco","a little"],["molto","very, much"],["sempre","always"],["da capo (D.C.)","repeat from the beginning"],["fine","the end"]],
 [["grazioso","gracefully"],["con moto","with movement"],["sostenuto","sustained"],["tranquillo","calm"],["leggiero","lightly"],["maestoso","majestically"],["vivace","lively, quick"],["simile","in the same way"],["subito","suddenly"]],
 [["animato","animated, lively"],["espressivo","expressively"],["giocoso","playful, merry"],["morendo","dying away"],["con fuoco","with fire"],["scherzando","playfully"],["tenuto","held"],["ritenuto","held back"]],
 [["smorzando","dying away"],["stringendo","gradually getting faster"],["sotto voce","in an undertone, quietly"],["attacca","go straight on"],["calando","getting softer and slower"]]];
const TECHN=["tonic","supertonic","mediant","subdominant","dominant","submediant","leading note"];
let AC=null;
function ac(){try{if(!AC)AC=new(window.AudioContext||window.webkitAudioContext)();if(AC.state==="suspended")AC.resume()}catch(e){}return AC}
function tone(midi,when=0,dur=1.1,vol=.3){const c=ac();if(!c)return;const t0=c.currentTime+when,f=440*Math.pow(2,(midi-69)/12);
 const g=c.createGain();g.gain.setValueAtTime(.0001,t0);g.gain.exponentialRampToValueAtTime(vol,t0+.01);g.gain.exponentialRampToValueAtTime(.0001,t0+dur);g.connect(c.destination);
 [[1,"triangle",1],[2,"sine",.35],[3,"sine",.12]].forEach(([m,ty,v])=>{const o=c.createOscillator(),gg=c.createGain();o.type=ty;o.frequency.value=f*m;gg.gain.value=v;o.connect(gg);gg.connect(g);o.start(t0);o.stop(t0+dur+.05)})}
function click(acc){const c=ac();if(!c)return;const o=c.createOscillator(),g=c.createGain();o.frequency.value=acc?1500:1000;g.gain.setValueAtTime(.3,c.currentTime);g.gain.exponentialRampToValueAtTime(.0001,c.currentTime+.06);o.connect(g);g.connect(c.destination);o.start();o.stop(c.currentTime+.07)}
function ding(ok){if(ok){tone(84,0,.25,.14);tone(88,.09,.35,.14)}else tone(57,0,.35,.12)}
const MUSICFONT=`'Noto Music','Bravura','Apple Symbols',serif`,INK="#2A2438";
const SHARP_STEPS=[8,5,9,6,3,7,4],FLAT_STEPS=[4,7,3,6,2,5,1];
/* single staff (theory, solfège): treble bottom line E4 = d30, bass bottom line G2 = d18 */
function staff({clef="treble",notes=[],keyAcc=0,width=220}){
 const top=34,gap=12,bot=top+4*gap,base=clef==="treble"?30:18,y=d=>bot-(d-base)*gap/2,shift=clef==="treble"?0:-2;
 let s=`<svg viewBox="0 0 ${width} 130" width="${width}" role="img" aria-label="Music staff">`;
 for(let i=0;i<5;i++)s+=`<line x1="4" x2="${width-4}" y1="${top+i*gap}" y2="${top+i*gap}" stroke="${INK}" stroke-width="1.3"/>`;
 s+=clefGlyph(clef,8,top,gap);let x=48;
 const n=Math.abs(keyAcc);s+=keySig(keyAcc,x,y,base,shift,gap);x+=n*gap*1.05;
 if(n)x+=10;
 const stp=notes.length?Math.min(64,(width-x-20)/notes.length):0;
 notes.forEach((nt,i)=>{const nx=x+stp*(i+.5)+8;s+=noteHead(nt,nx,y,base);if((nt.dur??4)<4){const up=(nt.d-base)<4,sx=up?nx+6:nx-6,y1=y(nt.d),y2=up?y1-34:y1+34;s+=`<line x1="${sx}" x2="${sx}" y1="${y1}" y2="${y2}" stroke="${INK}" stroke-width="1.6"/>`}});
 return s+"</svg>";
}
function accG(sym,x,y,g){const k=sym==="♯"?1:sym==="♭"?-1:sym==="♮"?0:null,L=(x1,y1,x2,y2,w)=>`<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${INK}" stroke-width="${w}"/>`;
 if(k===1)return L(x-.25*g,y-1.25*g,x-.25*g,y+1.45*g,.12*g)+L(x+.25*g,y-1.45*g,x+.25*g,y+1.25*g,.12*g)+L(x-.6*g,y-.25*g,x+.6*g,y-.62*g,.34*g)+L(x-.6*g,y+.62*g,x+.6*g,y+.25*g,.34*g);
 if(k===-1)return L(x-.32*g,y-2*g,x-.32*g,y+.55*g,.13*g)+`<path d="M${x-.32*g} ${y+.55*g} C${x+.2*g} ${y+.2*g} ${x+.75*g} ${y-.3*g} ${x+.45*g} ${y-.62*g} C${x+.2*g} ${y-.88*g} ${x-.12*g} ${y-.55*g} ${x-.32*g} ${y-.22*g}" fill="none" stroke="${INK}" stroke-width="${.22*g}" stroke-linejoin="round"/>`;
 if(k===0)return L(x-.25*g,y-1.4*g,x-.25*g,y+.6*g,.12*g)+L(x+.25*g,y-.6*g,x+.25*g,y+1.4*g,.12*g)+L(x-.25*g,y-.28*g,x+.25*g,y-.5*g,.3*g)+L(x-.25*g,y+.5*g,x+.25*g,y+.28*g,.3*g);
 return `<text x="${x}" y="${y+5}" font-size="${g*1.6}" font-weight="700" fill="${INK}" text-anchor="middle">${sym}</text>`}
function restG(dur,cx,top,g){
 if(dur>=4)return `<rect x="${cx-.6*g}" y="${top+g}" width="${1.2*g}" height="${.5*g}" fill="${INK}"/>`;
 if(dur>=2)return `<rect x="${cx-.6*g}" y="${top+1.5*g}" width="${1.2*g}" height="${.5*g}" fill="${INK}"/>`;
 if(dur>=1)return `<path d="M${cx-.25*g} ${top+.85*g} L${cx+.35*g} ${top+1.55*g} L${cx-.15*g} ${top+2.15*g} L${cx+.38*g} ${top+2.8*g} C${cx-.35*g} ${top+2.5*g} ${cx-.45*g} ${top+3.1*g} ${cx+.05*g} ${top+3.45*g}" fill="none" stroke="${INK}" stroke-width="${.3*g}" stroke-linejoin="round" stroke-linecap="round"/>`;
 return `<circle cx="${cx-.15*g}" cy="${top+1.65*g}" r="${.22*g}" fill="${INK}"/><path d="M${cx-.25*g} ${top+1.8*g} Q${cx+.15*g} ${top+1.95*g} ${cx+.35*g} ${top+1.5*g} L${cx-.05*g} ${top+3*g}" fill="none" stroke="${INK}" stroke-width="${.14*g}" stroke-linecap="round"/>`}
function keySig(keyAcc,x,yOf,base,shift,g){let s="";const n=Math.abs(keyAcc);for(let i=0;i<n;i++){const st=(keyAcc>0?SHARP_STEPS:FLAT_STEPS)[i]+shift;s+=accG(keyAcc>0?"♯":"♭",x+i*g*1.05,yOf(base+st),g)}return s}
function timeSig(T,x,top,g){const f=`font-family="Georgia,'Times New Roman',serif" font-weight="900" font-size="${g*2.75}" fill="${INK}" text-anchor="middle"`;return `<text x="${x}" y="${top+2*g-.6}" ${f}>${T.n}</text><text x="${x}" y="${top+4*g-.6}" ${f}>${T.d}</text>`}
function trebleClef(x,top,g){const X=x+g*.95,Y=top+3*g,P=(a,b)=>`${(X+a*g).toFixed(1)} ${(Y+b*g).toFixed(1)}`;
 return `<g aria-hidden="true"><path d="M${P(.22,.12)} C${P(-.38,.18)} ${P(-.42,-.62)} ${P(.15,-.66)} C${P(.95,-.66)} ${P(1.05,.62)} ${P(.08,.82)} C${P(-.95,.98)} ${P(-1.25,-.45)} ${P(-.62,-1.15)} C${P(-.05,-1.75)} ${P(.8,-2.4)} ${P(.68,-3.5)} C${P(.6,-4.2)} ${P(-.05,-4.25)} ${P(-.25,-3.6)} C${P(-.42,-2.95)} ${P(-.08,-1.05)} ${P(.18,.95)} C${P(.33,1.95)} ${P(.22,2.38)} ${P(-.32,2.4)}" fill="none" stroke="${INK}" stroke-width="${(g*.2).toFixed(2)}" stroke-linecap="round" stroke-linejoin="round"/><circle cx="${(X-.42*g).toFixed(1)}" cy="${(Y+2.05*g).toFixed(1)}" r="${(g*.34).toFixed(1)}" fill="${INK}"/></g>`}
function clefGlyph(clef,x,top,gap){return clef==="treble"?trebleClef(x,top,gap):(()=>{const F=top+gap,X=x+2;return `<g aria-hidden="true"><circle cx="${X+5}" cy="${F+1}" r="${gap*.38}" fill="${INK}"/><path d="M${X+3} ${F} C${X+3} ${top-gap*.55}, ${X+gap*2.1} ${top-gap*.55}, ${X+gap*2.1} ${F+gap*.6} C${X+gap*2.1} ${F+gap*1.9}, ${X+gap*1.1} ${top+gap*3.2}, ${X} ${top+gap*3.9}" fill="none" stroke="${INK}" stroke-width="${gap*.28}" stroke-linecap="round"/><circle cx="${X+gap*2.7}" cy="${F-gap*.45}" r="${gap*.19}" fill="${INK}"/><circle cx="${X+gap*2.7}" cy="${F+gap*.45}" r="${gap*.19}" fill="${INK}"/></g>`})()}
function noteHead(nt,nx,y,base,opt={}){let s="";const ny=y(nt.d),st=nt.d-base;
 for(let L=-2;L>=st;L-=2)s+=`<line x1="${nx-11}" x2="${nx+11}" y1="${y(base+L)}" y2="${y(base+L)}" stroke="${INK}" stroke-width="1.3"/>`;
 for(let L=10;L<=st;L+=2)s+=`<line x1="${nx-11}" x2="${nx+11}" y1="${y(base+L)}" y2="${y(base+L)}" stroke="${INK}" stroke-width="1.3"/>`;
 if(nt.sym)s+=accG(nt.sym,nx-17,ny,opt.gap||11);
 const hollow=(nt.dur??4)>=2;
 s+=`<ellipse cx="${nx}" cy="${ny}" rx="6.6" ry="4.8" transform="rotate(-20 ${nx} ${ny})" fill="${hollow?"#FFFDF8":INK}" stroke="${INK}" stroke-width="${hollow?2:1}"/>`;
 if(nt.dur===3||nt.dur===1.5||nt.dur===.75)s+=`<circle cx="${nx+12}" cy="${ny-(st%2===0?3:0)}" r="2.2" fill="${INK}"/>`;
 return s}
/* grand staff for sight-reading */
const TSS={"2/4":{n:2,d:4,len:2,grp:1},"3/4":{n:3,d:4,len:3,grp:1},"4/4":{n:4,d:4,len:4,grp:2},"3/8":{n:3,d:8,len:1.5,grp:1.5},"6/8":{n:6,d:8,len:3,grp:1.5}};
const barsOf=(notes,len)=>Math.round(notes.reduce((a,n)=>a+n.dur,0)/len);
const allD=nt=>nt.chord?[nt.d,...nt.chord]:[nt.d];
function grand({keyAcc,ts,rh,lh,width,single,noTime,final=true}){
 const T=TSS[ts],gap=11,tT=30,bT=tT+4*gap+52,H=single?tT+4*gap+40:bT+4*gap+34;
 const yAt=(top,base)=>d=>top+4*gap-(d-base)*gap/2;
 const staves=single?[[tT,single]]:[[tT,"treble"],[bT,"bass"]],lastTop=staves[staves.length-1][0];
 const L0=single?10:16,endX=Math.round(width-8),sb=(top)=>top+4*gap;
 let s=`<svg viewBox="0 0 ${width} ${H}" width="${width}" role="img" aria-label="Sight-reading exercise">`;
 staves.forEach(([top,clef])=>{for(let i=0;i<5;i++)s+=`<line x1="${L0}" x2="${endX}" y1="${top+i*gap}" y2="${top+i*gap}" stroke="${INK}" stroke-width="1.2" shape-rendering="crispEdges"/>`;s+=clefGlyph(clef,L0+3,top,gap)});
 s+=`<line x1="${L0}" x2="${L0}" y1="${tT}" y2="${sb(lastTop)}" stroke="${INK}" stroke-width="1.4" shape-rendering="crispEdges"/>`;
 if(!single){const a=tT,b=sb(lastTop),m=(a+b)/2,h=b-a;s+=`<path d="M${L0-3} ${a} C${L0-10} ${a+h*.06} ${L0-4} ${m-h*.1} ${L0-11} ${m} C${L0-4} ${m+h*.1} ${L0-10} ${b-h*.06} ${L0-3} ${b}" fill="none" stroke="${INK}" stroke-width="2.6" stroke-linecap="round"/>`}
 let x=L0+44;const n=Math.abs(keyAcc),ksw=n*gap*1.05;
 staves.forEach(([top,clef])=>{const base=clef==="treble"?30:18,yy=yAt(top,base),shift=clef==="treble"?0:-2;
  s+=keySig(keyAcc,x+gap*.5,yy,base,shift,gap);
  if(!noTime)s+=timeSig(T,x+ksw+(n?gap*.9:0)+gap*.9,top,gap)});
 x+=ksw+(n?gap*.9:0)+(noTime?gap*.6:gap*2.4);
 const total=Math.max(1,barsOf(rh.length?rh:lh,T.len)),W=(endX-x-6)/(total*T.len);
 for(let b=1;b<=total;b++){const last=b===total,bx=last?endX:Math.round(x+b*T.len*W)+.5;
  if(last&&final)s+=`<line x1="${bx-7}" x2="${bx-7}" y1="${tT}" y2="${sb(lastTop)}" stroke="${INK}" stroke-width="1.3"/><line x1="${bx-2}" x2="${bx-2}" y1="${tT}" y2="${sb(lastTop)}" stroke="${INK}" stroke-width="4"/>`;
  else s+=`<line x1="${last?bx-.65:bx}" x2="${last?bx-.65:bx}" y1="${tT}" y2="${sb(lastTop)}" stroke="${INK}" stroke-width="1.3"/>`}
 const voice=(notes,top,clef)=>{const base=clef==="treble"?30:18,yy=yAt(top,base);let pos=0,out="";
  const P=notes.map(nt=>{const o={nt,pos,nx:x+pos*W+11};pos+=nt.dur;return o});const done=new Set();
  const heads=o=>allD(o.nt).forEach((dd,j)=>out+=noteHead({...o.nt,d:dd,sym:j===0?o.nt.sym:null},o.nx,yy,base));
  for(let i=0;i<P.length;i++){const o=P[i];if(done.has(i))continue;
   if(o.nt.rest){const full=o.nt.dur>=T.len-1e-6,cx=full?x+(Math.floor(o.pos/T.len+1e-6)+.5)*T.len*W:o.nx;out+=restG(full&&T.len!==2?4:o.nt.dur,cx,top,gap);continue}
   heads(o);
   if(o.nt.f){const ny=yy(Math.max(...allD(o.nt))),ly=yy(Math.min(...allD(o.nt))),fy=clef==="treble"?Math.min(top-5,ny-14):Math.max(top+4*gap+15,ly+20);out+=`<text x="${o.nx}" y="${fy}" font-size="12" font-weight="700" fill="${INK}" text-anchor="middle" font-family="Georgia,serif">${o.nt.f}</text>`}if(o.nt.dur>=4)continue;
   if(o.nt.dur<1){const gi=Math.floor(o.pos/T.grp+1e-6),G=[];let j=i;while(j<P.length&&!P[j].nt.rest&&P[j].nt.dur<1&&Math.floor(P[j].pos/T.grp+1e-6)===gi){G.push(P[j]);j++}
    if(G.length>=2){G.slice(1).forEach((q,k)=>{heads(q);done.add(i+k+1)});
     const avg=G.reduce((a,q)=>a+q.nt.d,0)/G.length,up=(avg-base)<4;
     const by=up?Math.min(...G.map(q=>yy(Math.max(...allD(q.nt)))))-30:Math.max(...G.map(q=>yy(Math.min(...allD(q.nt)))))+30;
     const sxOf=q=>up?q.nx+6:q.nx-6;
     G.forEach(q=>{const d=allD(q.nt);out+=`<line x1="${sxOf(q)}" x2="${sxOf(q)}" y1="${up?yy(Math.min(...d)):yy(Math.max(...d))}" y2="${by}" stroke="${INK}" stroke-width="1.5"/>`});
     out+=`<line x1="${sxOf(G[0])}" x2="${sxOf(G[G.length-1])}" y1="${by}" y2="${by}" stroke="${INK}" stroke-width="4.5"/>`;
     const by2=by+(up?7:-7);for(let k=0;k<G.length;k++){if(G[k].nt.dur<=.25){const a=sxOf(G[k]);if(G[k+1]&&G[k+1].nt.dur<=.25){out+=`<line x1="${a}" x2="${sxOf(G[k+1])}" y1="${by2}" y2="${by2}" stroke="${INK}" stroke-width="4.5"/>`;k++}else{const b2=k>0?a-9:a+9;out+=`<line x1="${Math.min(a,b2)}" x2="${Math.max(a,b2)}" y1="${by2}" y2="${by2}" stroke="${INK}" stroke-width="4.5"/>`}}}
     continue}}
   const d=allD(o.nt),lo=Math.min(...d),hi=Math.max(...d),up=((lo+hi)/2-base)<4,sx=up?o.nx+6:o.nx-6,y1=up?yy(lo):yy(hi),y2=up?yy(hi)-32:yy(lo)+32;
   out+=`<line x1="${sx}" x2="${sx}" y1="${y1}" y2="${y2}" stroke="${INK}" stroke-width="1.5"/>`;
   const fl=o.nt.dur<=.25?2:o.nt.dur<1?1:0;for(let f=0;f<fl;f++){const yy0=y2+(up?f*7:-f*7);out+=up?`<path d="M${sx} ${yy0} q9 7 7 18" stroke="${INK}" stroke-width="2.4" fill="none"/>`:`<path d="M${sx} ${yy0} q9 -7 7 -18" stroke="${INK}" stroke-width="2.4" fill="none"/>`}}
  return out};
 if(single)s+=voice(single==="bass"?lh:rh,tT,single);else{s+=voice(rh,tT,"treble");s+=voice(lh,bT,"bass")}
 return s+"</svg>";
}

/* Sight-reading generator, following ABRSM's published piano sight-reading parameters (2025–26 syllabus; the app never shows the ABRSM name).
   Initial: one hand at a time, C major / D minor, 4/4 2/4, five-finger tonic–dominant.
   Grade 1: + G, F major, A minor, 3/4, dotted minims; both hands used but they take turns (never together).
   Grade 2: + D major, E, G minor; hands together; quavers, dotted crotchet–quaver.
   Grade 3: + A, B♭, E♭ major, B minor; 3/8; simple semiquavers; outside five-finger position; 2-note chords.
   Grade 4: + 6/8.   Grade 5: + E, A♭ major, F♯, C minor; simple syncopation; two notes in the left hand. */
const SKEY=[["C","d"],["C","d","G","F","a"],["C","d","G","F","a","D","e","g"],["C","d","G","F","a","D","e","g","A","B♭","E♭","b"],["C","d","G","F","a","D","e","g","A","B♭","E♭","b"],["C","d","G","F","a","D","e","g","A","B♭","E♭","b","E","A♭","f♯","c"]];
const STS=[["4/4","2/4"],["4/4","3/4","2/4"],["4/4","3/4","2/4"],["4/4","3/4","2/4","3/8"],["4/4","3/4","2/4","3/8","6/8"],["4/4","3/4","2/4","3/8","6/8"]];
const RP={"4/4":[[0,[1,1,1,1]],[0,[2,1,1]],[0,[1,1,2]],[0,[2,2]],[1,[3,1]],[2,[.5,.5,1,1,1]],[2,[1,.5,.5,2]],[2,[1.5,.5,2]],[2,[1,1,1.5,.5]],[3,[.25,.25,.5,1,2]],[3,[1,1,.25,.25,.5,1]],[5,[1,2,1]]],
 "3/4":[[0,[1,1,1]],[0,[2,1]],[0,[1,2]],[2,[.5,.5,1,1]],[2,[1,.5,.5,1]],[2,[1.5,.5,1]],[3,[.25,.25,.5,1,1]],[5,[.5,1,.5,1]]],
 "2/4":[[0,[1,1]],[0,[2]],[2,[.5,.5,1]],[2,[1,.5,.5]],[2,[1.5,.5]],[3,[.25,.25,.5,1]]],
 "3/8":[[3,[.5,.5,.5]],[3,[1,.5]],[3,[.25,.25,.5,.5]]],
 "6/8":[[4,[1.5,1.5]],[4,[1,.5,1,.5]],[4,[.5,.5,.5,1.5]],[4,[1.5,1,.5]],[4,[.5,.5,.5,.5,.5,.5]]]};
const RE={"4/4":[[0,[4]],[0,[2,2]],[0,[1,1,2]],[2,[1.5,.5,2]]],"3/4":[[0,[3]],[0,[1,2]]],"2/4":[[0,[2]]],"3/8":[[3,[1.5]]],"6/8":[[4,[3]],[4,[1,.5,1.5]]]};
const rbar=(ts,g,last)=>pick((last?RE:RP)[ts].filter(x=>x[0]<=g).map(x=>x[1]));
const m7=x=>((x%7)+7)%7;
function genSight(g,nb){
 const kk=pick(SKEY[g]),K=KEYS[kk],ts=pick(STS[g]),T=TSS[ts];
 const rhT=dia(K.t,4),lhT=rhT-(g===1?(K.t>=4?14:7):(K.t>=3?14:7));
 const rng=g<=1?[0,4]:g===2?[-1,5]:[-3,7];if(K.t<=1)rng[0]=Math.max(rng[0],-1);
 const maxJ=g<=1?2:g===2?3:4;
 const spell=(deg,tD)=>{const d=tD+deg;let alt=keyAlt(m7(d),K.a);if(K.m&&m7(deg)===6)alt+=1;return{d,alt}};
 const mkBar=(rh,startDeg,endDeg)=>{let d=startDeg;return rh.map((dur,i)=>{if(i===0)d=startDeg;else if(i===rh.length-1&&endDeg!=null)d=endDeg;else{const j=Math.random()<.7?pick([-1,1]):pick([-2,2,-maxJ,maxJ]);let nd=d+j;if(nd<rng[0]||nd>rng[1])nd=d-j;nd=Math.max(rng[0],Math.min(rng[1],nd));
   if(K.m&&((m7(d)===5&&m7(nd)===6)||(m7(d)===6&&m7(nd)===5)))nd=Math.max(rng[0],Math.min(rng[1],d+(nd>d?2:-2)));d=nd}return{deg:d,dur}})};
 const start=pick([0,2,4].filter(x=>x>=rng[0]&&x<=rng[1])),lead=()=>pick([1,-1].filter(x=>x>=rng[0]));
 const bars=[];
 if(nb===2){const b1=mkBar(rbar(ts,g,false),start,null),rL=rbar(ts,g,true),b2=mkBar(rL,rL.length>1?pick([2,1,4].filter(x=>x<=rng[1])):0,0);if(rL.length>1)b2[b2.length-2].deg=lead();bars.push(b1,b2)}
 else{const b1=mkBar(rbar(ts,g,false),start,null),b2=mkBar(rbar(ts,g,false),Math.max(rng[0],Math.min(rng[1],b1[b1.length-1].deg+pick([-1,1]))),pick([1,4].filter(x=>x<=rng[1])));
  const b3=b1.map(n=>({...n})),rL=rbar(ts,g,true),b4=mkBar(rL,rL.length>1?2:0,0);if(rL.length>1)b4[b4.length-2].deg=lead();bars.push(b1,b2,b3,b4)}
 bars.forEach(b=>b.forEach(n=>{n.deg=Math.max(rng[0],Math.min(rng[1],n.deg))}));bars[bars.length-1][bars[bars.length-1].length-1].deg=0;
 const harm=bars.map((b,i)=>{if(i===bars.length-1)return"I";if(i===bars.length-2)return"V";return b.reduce((a,n)=>a+([0,2,4].includes(m7(n.deg))?1:-1),0)>=0?"I":"V"});
 const mode=g===0?"single":g===1?"pass":"tog";
 const rh=[],lh=[],L=T.len;
 if(mode==="single"){const hand=DAYNO%2===1?"L":"R";bars.forEach(b=>b.forEach(n=>(hand==="L"?lh:rh).push({...spell(n.deg,hand==="L"?lhT:rhT),dur:n.dur})));
  markAcc(rh,K,L);markAcc(lh,K,L);return{key:kk,keyAcc:K.a,ts,rh,lh,grade:g,mode,single:hand==="L"?"bass":"treble"}}
 if(mode==="pass"){const plan=nb===2?pick([["R","L"],["L","R"]]):pick([["R","L","R","L"],["R","R","L","L"],["L","R","L","R"],["L","L","R","R"]]);
  bars.forEach((b,i)=>{const notes=b.map(n=>({...spell(n.deg,plan[i]==="L"?lhT:rhT),dur:n.dur}));if(plan[i]==="R"){rh.push(...notes);lh.push({rest:1,dur:L})}else{lh.push(...notes);rh.push({rest:1,dur:L})}})}
 else{bars.forEach(b=>b.forEach(n=>rh.push({...spell(n.deg,rhT),dur:n.dur})));
  harm.forEach((h,i)=>{const hi=K.t>=3,R=h==="I"?0:(hi?4:-3),F=h==="I"?4:(hi?8:1),last=i===harm.length-1;let pat;
   if(last)pat=[[R,L,g>=5?F:null]];
   else if(g===2)pat=ts==="4/4"?[[R,2],[F,2]]:[[R,L]];
   else if(g<=4)pat=ts==="4/4"?[[R,2],[F,1],[R,1]]:ts==="3/4"?[[R,2],[F,1]]:ts==="2/4"?[[R,1],[F,1]]:ts==="3/8"?[[R,1.5]]:[[R,1.5],[F,1.5]];
   else pat=ts==="4/4"?[[R,2,F],[R,2,F]]:[[R,L,F]];
   pat.forEach(([d,dur,ch],j)=>{const nt={...spell(d,lhT),dur};const c=ch!=null?ch:(g>=3&&j===0&&Math.random()<.3?F:null);if(c!=null)nt.chord=[lhT+c];lh.push(nt)})})}
 markAcc(rh,K,L);markAcc(lh,K,L);
 return{key:kk,keyAcc:K.a,ts,rh,lh,grade:g,mode}}
function markAcc(arr,K,L){let bar={},pos=0;arr.forEach(n=>{if(!n.rest){const kA=keyAlt(m7(n.d),K.a),cur=bar[n.d]??kA;if(n.alt!==cur){n.sym=ACCSYM[n.alt];bar[n.d]=n.alt}}pos+=n.dur;if(Math.abs(pos%L)<1e-6||Math.abs(pos%L-L)<1e-6)bar={}})}

/* extra icons for the production app */
Object.assign(I,{
 users:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="9" cy="8" r="3.5"/><path d="M2.5 20c1-3.6 3.6-5.5 6.5-5.5s5.5 1.9 6.5 5.5"/><path d="M16 4.6a3.5 3.5 0 010 6.8M18 14.8c1.7.7 2.9 2.4 3.5 5.2"/></svg>',
 gift:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><rect x="3" y="9" width="18" height="4" rx="1"/><path d="M5 13v8h14v-8M12 9v12M12 9C10 5 6 5 7.5 8M12 9c2-4 6-4 4.5-1"/></svg>',
 link:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M10 14a4 4 0 005.7 0l3-3a4 4 0 00-5.7-5.7l-1 1"/><path d="M14 10a4 4 0 00-5.7 0l-3 3a4 4 0 005.7 5.7l1-1"/></svg>',
 sparkle:'<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l1.8 6.2L20 10l-6.2 1.8L12 18l-1.8-6.2L4 10l6.2-1.8z"/><path d="M19 15l.8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8z"/></svg>',
 back:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M15 5l-7 7 7 7"/></svg>'
});
/* exact seconds stored with one decimal */
const sec1=x=>Math.round((+x||0)*10)/10;
