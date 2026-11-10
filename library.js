/* ===== The piece & scale library (built in) =====
   Pieces: Level → Composer → Collection → Piece. Levels are rough ABRSM-like levels (0 = Initial … 8).
   An item is a title, or "#a-b" for numbered pieces (No. a … No. b). A row can be split over several levels.
   Scales: ABRSM Piano scales & arpeggios (2025–26 syllabus), Grade Initial–8, with a YouTube search for a model. */
const PLIB = [
  /* --- studies & exercises --- */
  [0, "Beyer", "Vorschule im Klavierspiel, Op. 101", ["#1-50"]],
  [1, "Beyer", "Vorschule im Klavierspiel, Op. 101", ["#51-106"]],
  [1, "Czerny", "Op. 599 (Practical Method for Beginners)", ["#1-50"]],
  [2, "Czerny", "Op. 599 (Practical Method for Beginners)", ["#51-100"]],
  [2, "Czerny", "100 Progressive Studies, Op. 139", ["#1-50"]],
  [3, "Czerny", "100 Progressive Studies, Op. 139", ["#51-100"]],
  [3, "Czerny", "Op. 261 (125 Exercises in Passage-Playing)", ["#1-125"]],
  [4, "Czerny", "Op. 849 (30 Études de mécanisme)", ["#1-15"]],
  [5, "Czerny", "Op. 849 (30 Études de mécanisme)", ["#16-30"]],
  [6, "Czerny", "The School of Velocity, Op. 299", ["#1-20"]],
  [7, "Czerny", "The School of Velocity, Op. 299", ["#21-40"]],
  [8, "Czerny", "The Art of Finger Dexterity, Op. 740", ["#1-50"]],
  [2, "Hanon", "The Virtuoso Pianist — Part 1", ["#1-20"]],
  [4, "Hanon", "The Virtuoso Pianist — Part 2", ["#21-43"]],
  [6, "Hanon", "The Virtuoso Pianist — Part 3", ["#44-60"]],
  [3, "Burgmüller", "25 Easy and Progressive Studies, Op. 100", ["La candeur", "Arabesque", "Pastorale", "Petite réunion", "Innocence", "Progrès", "Le courant limpide", "La gracieuse", "La chasse", "Tendre fleur", "La bergeronnette", "L'adieu", "Consolation"]],
  [4, "Burgmüller", "25 Easy and Progressive Studies, Op. 100", ["La styrienne", "Ballade", "Douce plainte", "La babillarde", "Inquiétude", "Ave Maria", "Tarentelle", "L'harmonie des anges", "Barcarolle", "Le retour", "L'hirondelle", "La chevaleresque"]],
  [5, "Burgmüller", "18 Characteristic Studies, Op. 109", ["#1-18"]],
  [6, "Burgmüller", "12 Brilliant and Melodious Studies, Op. 105", ["#1-12"]],
  [5, "S. Heller", "25 Melodious Studies, Op. 45", ["#1-25"]],
  [4, "S. Heller", "25 Studies, Op. 47", ["#1-25"]],
  /* --- Bach --- */
  [1, "J. S. Bach", "Notebook for Anna Magdalena Bach", ["Minuet in G, BWV Anh. 114", "Minuet in G minor, BWV Anh. 115", "Minuet in G, BWV Anh. 116", "Minuet in F, BWV Anh. 113", "Minuet in A minor, BWV Anh. 120", "Minuet in D minor, BWV Anh. 132"]],
  [2, "J. S. Bach", "Notebook for Anna Magdalena Bach", ["Musette in D, BWV Anh. 126", "March in D, BWV Anh. 122", "March in G, BWV Anh. 124", "Polonaise in G minor, BWV Anh. 119", "Polonaise in G minor, BWV Anh. 123", "Polonaise in F, BWV Anh. 117a", "Minuet in B♭, BWV Anh. 118", "Minuet in C minor, BWV Anh. 121", "March in E♭, BWV Anh. 127", "Polonaise in D minor, BWV Anh. 128"]],
  [4, "J. S. Bach", "Little Preludes", ["Prelude in C, BWV 924", "Prelude in D, BWV 925", "Prelude in D minor, BWV 926", "Prelude in F, BWV 927", "Prelude in F, BWV 928", "Prelude in C, BWV 933", "Prelude in C minor, BWV 934", "Prelude in D minor, BWV 935", "Prelude in D, BWV 936", "Prelude in E, BWV 937", "Prelude in E minor, BWV 938", "Prelude in C, BWV 939", "Prelude in D minor, BWV 940", "Prelude in E minor, BWV 941", "Prelude in A minor, BWV 942", "Prelude in C, BWV 943", "Prelude in C minor, BWV 999"]],
  [5, "J. S. Bach", "Two-Part Inventions", ["Invention No. 1 in C, BWV 772", "Invention No. 4 in D minor, BWV 775", "Invention No. 8 in F, BWV 779", "Invention No. 13 in A minor, BWV 784", "Invention No. 14 in B♭, BWV 785"]],
  [6, "J. S. Bach", "Two-Part Inventions", ["Invention No. 2 in C minor, BWV 773", "Invention No. 3 in D, BWV 774", "Invention No. 5 in E♭, BWV 776", "Invention No. 6 in E, BWV 777", "Invention No. 7 in E minor, BWV 778", "Invention No. 9 in F minor, BWV 780", "Invention No. 10 in G, BWV 781", "Invention No. 11 in G minor, BWV 782", "Invention No. 12 in A, BWV 783", "Invention No. 15 in B minor, BWV 786"]],
  [7, "J. S. Bach", "Three-Part Sinfonias", ["#1-15"]],
  [8, "J. S. Bach", "The Well-Tempered Clavier, Book 1", ["#1-24"]],
  /* --- Mozart --- */
  [1, "Mozart", "Notebook for Nannerl (early pieces)", ["Minuet in G, K. 1", "Minuet in F, K. 2", "Allegro in B♭, K. 3", "Minuet in F, K. 4", "Minuet in F, K. 5", "Andante in C, K. 1a", "Allegro in C, K. 1b"]],
  [3, "Mozart", "Pieces", ["Minuet in D, K. 355", "Allegro in F, K. 15a", "Rondo in F, K. 15hh"]],
  [3, "Mozart", "Viennese Sonatinas", ["Sonatina No. 1 in C", "Sonatina No. 2 in A", "Sonatina No. 3 in D", "Sonatina No. 4 in B♭", "Sonatina No. 5 in F", "Sonatina No. 6 in C"]],
  [5, "Mozart", "Piano Sonatas", ["Sonata in C, K. 545 (1st movt)", "Sonata in C, K. 545 (2nd movt)", "Sonata in C, K. 545 (3rd movt)"]],
  [6, "Mozart", "Piano Sonatas", ["Sonata in G, K. 283", "Sonata in F, K. 280", "Sonata in C, K. 330", "Fantasia in D minor, K. 397"]],
  [7, "Mozart", "Piano Sonatas", ["Sonata in F, K. 332", "Sonata in B♭, K. 333", "Sonata in D, K. 311", "Rondo in D, K. 485"]],
  [8, "Mozart", "Piano Sonatas", ["Sonata in A, K. 331 (Alla turca)", "Sonata in A minor, K. 310", "Sonata in C minor, K. 457", "Sonata in F, K. 533/494"]],
  /* --- Beethoven --- */
  [2, "Beethoven", "Pieces", ["Russian Folk Song, WoO 158", "Écossaise in G, WoO 23", "German Dance in C, WoO 8"]],
  [3, "Beethoven", "Sonatinas", ["Sonatina in G, Anh. 5 No. 1", "Sonatina in F, Anh. 5 No. 2"]],
  [4, "Beethoven", "Pieces", ["Für Elise, WoO 59", "Six Variations on 'Nel cor più', WoO 70", "Bagatelle in G minor, Op. 119 No. 1", "Bagatelle in C, Op. 119 No. 2"]],
  [5, "Beethoven", "Piano Sonatas", ["Sonata in G minor, Op. 49 No. 1", "Sonata in G, Op. 49 No. 2", "Bagatelles, Op. 33"]],
  [7, "Beethoven", "Piano Sonatas", ["Sonata in G, Op. 79", "'Moonlight' Sonata, Op. 27 No. 2 (1st movt)", "Sonata in C minor, Op. 10 No. 1", "Sonata in F minor, Op. 2 No. 1"]],
  [8, "Beethoven", "Piano Sonatas", ["'Pathétique' Sonata, Op. 13", "Sonata in E♭, Op. 31 No. 3", "Sonata in D, Op. 10 No. 3", "Rondo in C, Op. 51 No. 1"]],
  /* --- sonatinas --- */
  [3, "Clementi", "Sonatinas, Op. 36", ["Sonatina No. 1 in C", "Sonatina No. 2 in G", "Sonatina No. 3 in C"]],
  [4, "Clementi", "Sonatinas, Op. 36", ["Sonatina No. 4 in F", "Sonatina No. 5 in G", "Sonatina No. 6 in D"]],
  [4, "Kuhlau", "Sonatinas, Op. 55", ["Sonatina No. 1 in C", "Sonatina No. 2 in G", "Sonatina No. 3 in C"]],
  [5, "Kuhlau", "Sonatinas, Op. 55", ["Sonatina No. 4 in F", "Sonatina No. 5 in D", "Sonatina No. 6 in C"]],
  [3, "Diabelli", "Sonatinas, Op. 151", ["Sonatina No. 1 in G", "Sonatina No. 2 in C", "Sonatina No. 3 in F", "Sonatina No. 4 in C"]],
  [4, "Dussek", "Sonatinas, Op. 20", ["#1-6"]],
  /* --- children's albums --- */
  [3, "Schumann", "Album für die Jugend, Op. 68", ["Melodie", "Soldatenmarsch", "Trällerliedchen", "Ein Choral", "Stückchen", "Armes Waisenkind", "Jägerliedchen", "Wilder Reiter", "Volksliedchen", "Fröhlicher Landmann", "Sicilianisch", "Knecht Ruprecht", "Mai, lieber Mai", "Kleine Studie", "Frühlingsgesang", "Erster Verlust", "Kleiner Morgenwanderer", "Schnitterliedchen"]],
  [5, "Schumann", "Album für die Jugend, Op. 68", ["Kleine Romanze", "Ländliches Lied", "*** (No. 21)", "Rundgesang", "Reiterstück", "Ernteliedchen", "Nachklänge aus dem Theater", "*** (No. 26)", "Canonisches Liedchen", "Erinnerung", "Fremder Mann", "*** (No. 30)", "Kriegslied", "Sheherazade", "Weinlesezeit – fröhliche Zeit!", "Thema", "Mignon", "Lied italienischer Marinari", "Matrosenlied", "Winterszeit I", "Winterszeit II", "Kleine Fuge", "Nordisches Lied", "Figurierter Choral", "Sylvesterlied"]],
  [6, "Schumann", "Kinderszenen, Op. 15", ["Von fremden Ländern und Menschen", "Kuriose Geschichte", "Hasche-Mann", "Bittendes Kind", "Glückes genug", "Wichtige Begebenheit", "Träumerei", "Am Kamin", "Ritter vom Steckenpferd", "Fast zu ernst", "Fürchtenmachen", "Kind im Einschlummern", "Der Dichter spricht"]],
  [3, "Tchaikovsky", "Album for the Young, Op. 39", ["Morning Prayer", "Winter Morning", "Mama", "The Hobby-Horse", "March of the Wooden Soldiers", "The Sick Doll", "The Doll's Funeral", "Waltz", "The New Doll", "Mazurka", "Russian Song", "Peasant Plays the Accordion"]],
  [4, "Tchaikovsky", "Album for the Young, Op. 39", ["Kamarinskaya", "Polka", "Italian Song", "Old French Song", "German Song", "Neapolitan Song", "Nanny's Tale", "Baba Yaga", "Sweet Dreams", "Song of the Lark", "The Organ-Grinder Sings", "In Church"]],
  [7, "Tchaikovsky", "The Seasons, Op. 37a", ["January: At the Fireside", "February: Carnival", "March: Song of the Lark", "April: Snowdrop", "May: White Nights", "June: Barcarolle", "July: Song of the Reaper", "August: Harvest", "September: The Hunt", "October: Autumn Song", "November: Troika", "December: Christmas"]],
  [0, "Kabalevsky", "24 Little Pieces, Op. 39", ["#1-12"]],
  [1, "Kabalevsky", "24 Little Pieces, Op. 39", ["#13-24"]],
  [3, "Kabalevsky", "30 Children's Pieces, Op. 27", ["#1-15"]],
  [4, "Kabalevsky", "30 Children's Pieces, Op. 27", ["#16-30"]],
  [2, "Kabalevsky", "Variations", ["Easy Variations, Op. 40 No. 1", "Easy Variations, Op. 40 No. 2"]],
  [2, "Gillock", "Pieces", ["Swinging Beat", "Little Flower Girl of Paris", "Sunset", "Spooky Footsteps"]],
  [3, "Gillock", "Pieces", ["Holiday in Paris", "Flamenco", "Autumn Is Here", "Forest Dawn"]],
  [4, "Gillock", "Pieces", ["Fountain in the Rain", "Arabesque Sentimentale", "Valse Etude", "Spanish Gypsies"]],
  [5, "Gillock", "Pieces", ["Champagne Toccata", "Argentina"]],
  [1, "Bartók", "Mikrokosmos, Book 1", ["#1-36"]],
  [2, "Bartók", "Mikrokosmos, Book 2", ["#37-66"]],
  [3, "Bartók", "Mikrokosmos, Book 3", ["#67-96"]],
  [3, "Bartók", "For Children, Vol. 1", ["#1-40"]],
  [4, "Gurlitt", "Pieces", ["The Hunt, Op. 117 No. 15", "Allegretto scherzando", "Song, Op. 172 No. 1"]],
  [3, "Grieg", "Lyric Pieces, Op. 12", ["Arietta", "Waltz", "Watchman's Song", "Elfin Dance", "Folk Song", "Norwegian Melody", "Album Leaf", "National Song"]],
  [5, "Grieg", "Lyric Pieces", ["Butterfly, Op. 43 No. 1", "Notturno, Op. 54 No. 4", "March of the Trolls, Op. 54 No. 3", "Wedding Day at Troldhaugen, Op. 65 No. 6"]],
  [4, "Satie", "Pieces", ["Gymnopédie No. 1", "Gymnopédie No. 2", "Gymnopédie No. 3", "Gnossienne No. 1"]],
  /* --- romantic & later --- */
  [5, "Chopin", "Waltzes", ["Waltz in A minor, B. 150", "Waltz in B minor, Op. 69 No. 2", "Waltz in A♭, Op. 69 No. 1"]],
  [5, "Chopin", "Preludes, Op. 28", ["No. 4 in E minor", "No. 6 in B minor", "No. 7 in A", "No. 20 in C minor"]],
  [6, "Chopin", "Nocturnes", ["Nocturne in E minor, Op. 72 No. 1", "Nocturne in C♯ minor, B. 49 (posth.)", "Nocturne in E♭, Op. 9 No. 2"]],
  [6, "Chopin", "Waltzes", ["Waltz in D♭, Op. 64 No. 1 ('Minute')", "Waltz in C♯ minor, Op. 64 No. 2", "Waltz in E minor, B. 56"]],
  [8, "Chopin", "Pieces", ["Fantaisie-Impromptu, Op. 66", "Ballade No. 1, Op. 23", "Étude in E, Op. 10 No. 3", "Polonaise in A, Op. 40 No. 1"]],
  [4, "Mendelssohn", "Songs without Words", ["Op. 30 No. 3", "Op. 102 No. 3"]],
  [6, "Mendelssohn", "Songs without Words", ["Op. 19 No. 1", "Op. 19 No. 6 (Venetian Boat Song)", "Op. 62 No. 6 (Spring Song)", "Op. 30 No. 6"]],
  [6, "Debussy", "Children's Corner", ["Doctor Gradus ad Parnassum", "Jimbo's Lullaby", "Serenade for the Doll", "The Snow is Dancing", "The Little Shepherd", "Golliwogg's Cake-walk"]],
  [7, "Debussy", "Pieces", ["Arabesque No. 1", "Arabesque No. 2", "Rêverie", "La fille aux cheveux de lin"]],
  [8, "Debussy", "Pieces", ["Clair de lune (Suite bergamasque)", "Prélude (Pour le piano)"]],
  [5, "Joplin", "Rags", ["The Entertainer", "The Easy Winners"]],
  [8, "Joplin", "Rags", ["Maple Leaf Rag"]],
];
const PLIB_LEVELS = [0, 1, 2, 3, 4, 5, 6, 7, 8];
/* every library piece, flattened: { id, title (shown in the plan), composer, lv, coll, name } */
let PLIB_FLAT = null;
function plibFlat() {
  if (PLIB_FLAT) return PLIB_FLAT;
  const out = [];
  PLIB.forEach(([lv, comp, coll, items], r) => {
    const names = [];
    items.forEach(it => { const m = /^#(\d+)-(\d+)$/.exec(it); if (m) for (let n = +m[1]; n <= +m[2]; n++) names.push("No. " + n); else names.push(it); });
    const short = coll.replace(/\s*\(.*\)$/, "");
    names.forEach((nm, i) => out.push({ id: "pl:" + r + ":" + i, lv, composer: comp, coll, name: nm,
      title: /^No\. \d+$/.test(nm) ? `${comp} ${short} ${nm}` : `${nm} (${comp})` }));
  });
  return PLIB_FLAT = out;
}

/* ---------- ABRSM scales & arpeggios, 2025–26 syllabus (keys are what the exam asks) ---------- */
const SCALES = {
  0: [["sc", "Scales", ["C major · 1 oct · hands separately", "D minor · 1 oct · hands separately"]], ["cm", "Contrary motion", ["C major · 1 oct"]], ["ar", "Arpeggios", ["C major · hands separately", "D minor · hands separately"]]],
  1: [["sc", "Scales", ["C major · 1 oct · hands together", "G major · hands separately", "F major · hands separately", "A minor · 2 oct · hands separately", "D minor · 2 oct · hands separately"]], ["cm", "Contrary motion", ["C major · 1 oct"]], ["ar", "Arpeggios", ["G major · 1 oct · hands separately", "A minor · 1 oct · hands separately"]]],
  2: [["sc", "Scales", ["G major · 2 oct · hands together", "F major · 2 oct · hands together", "A minor · 2 oct · hands together", "D minor · 2 oct · hands together", "D major · 2 oct · hands separately", "A major · 2 oct · hands separately", "E minor · 2 oct · hands separately", "G minor · 2 oct · hands separately"]], ["cm", "Contrary motion", ["C major · 2 oct"]], ["ch", "Chromatic", ["Starting on D · 1 oct · hands separately"]], ["ar", "Arpeggios", ["D major · 2 oct · hands separately", "A major · 2 oct · hands separately", "E minor · 2 oct · hands separately", "G minor · 2 oct · hands separately"]]],
  3: [["sc", "Scales", ["D major · 2 oct · hands together", "A major · 2 oct · hands together", "E minor · 2 oct · hands together", "G minor · 2 oct · hands together", "B♭ major · 2 oct · hands separately", "E♭ major · 2 oct · hands separately", "B minor · 2 oct · hands separately", "C minor · 2 oct · hands separately"]], ["cm", "Contrary motion", ["E major · 2 oct"]], ["ch", "Chromatic", ["Contrary motion, starting on D · 1 oct"]], ["ar", "Arpeggios", ["D major · 2 oct · hands together", "A major · 2 oct · hands together", "E minor · 2 oct · hands together", "G minor · 2 oct · hands together", "B♭ major · 2 oct · hands separately", "E♭ major · 2 oct · hands separately", "B minor · 2 oct · hands separately", "C minor · 2 oct · hands separately"]]],
  4: [["sc", "Scales", ["B♭ major · 2 oct · hands together", "E♭ major · 2 oct · hands together", "B minor · 2 oct · hands together", "C minor · 2 oct · hands together", "B major · 2 oct · hands separately", "F♯ major · 2 oct · hands separately", "A♭ major · 2 oct · hands separately", "F♯ minor · 2 oct · hands separately", "F minor · 2 oct · hands separately"]], ["cm", "Contrary motion", ["E♭ major · 2 oct", "C harmonic minor · 2 oct"]], ["ch", "Chromatic", ["Starting on F♯ · 2 oct · hands together"]], ["ar", "Arpeggios", ["B♭ major · 2 oct · hands together", "E♭ major · 2 oct · hands together", "B minor · 2 oct · hands together", "C minor · 2 oct · hands together", "B major · 2 oct · hands separately", "F♯ major · 2 oct · hands separately", "A♭ major · 2 oct · hands separately", "F♯ minor · 2 oct · hands separately", "F minor · 2 oct · hands separately"]]],
  5: [["sc", "Scales", ["A major · 2 oct · hands together", "E major · 2 oct · hands together", "B major · 2 oct · hands together", "F♯ major · 2 oct · hands together", "D♭ major · 2 oct · hands together", "C♯ minor · 2 oct · hands together", "G♯ minor · 2 oct · hands together", "E♭ minor · 2 oct · hands together", "B♭ minor · 2 oct · hands together"]], ["st", "Staccato scales", ["A♭ major · 2 oct · hands separately", "F minor · 2 oct · hands separately"]], ["cm", "Contrary motion", ["D♭ major · 2 oct", "C♯ harmonic minor · 2 oct"]], ["ch", "Chromatic", ["Contrary motion, LH F♯ / RH A♯ · 2 oct"]], ["ar", "Arpeggios", ["A major · 2 oct · hands together", "E major · 2 oct · hands together", "B major · 2 oct · hands together", "F♯ major · 2 oct · hands together", "A♭ major · 2 oct · hands together", "D♭ major · 2 oct · hands together", "F♯ minor · 2 oct · hands together", "C♯ minor · 2 oct · hands together", "G♯ minor · 2 oct · hands together", "E♭ minor · 2 oct · hands together", "F minor · 2 oct · hands together", "B♭ minor · 2 oct · hands together"]], ["d7", "Diminished 7th", ["Starting on B · 2 oct · hands separately"]]],
  6: [["sc", "Scales", ["D major · 4 oct", "F major · 4 oct", "A♭ major · 4 oct", "B major · 4 oct", "D minor (harm. & mel.) · 4 oct", "F minor (harm. & mel.) · 4 oct", "G♯ minor (harm. & mel.) · 4 oct", "B minor (harm. & mel.) · 4 oct"]], ["cm", "Contrary motion", ["D major · 2 oct", "F major · 2 oct", "A♭ major · 2 oct", "B major · 2 oct", "D harmonic minor · 2 oct", "F harmonic minor · 2 oct", "G♯ harmonic minor · 2 oct", "B harmonic minor · 2 oct"]], ["ch", "Chromatic", ["LH G♯ / RH B · 4 oct · hands together"]], ["ar", "Arpeggios (root position)", ["D major · 4 oct", "F major · 4 oct", "A♭ major · 4 oct", "B major · 4 oct", "D minor · 4 oct", "F minor · 4 oct", "G♯ minor · 4 oct", "B minor · 4 oct"]], ["dom", "Dominant 7th", ["In the key of D · 4 oct", "In the key of F · 4 oct", "In the key of A♭ · 4 oct", "In the key of B · 4 oct"]], ["d7", "Diminished 7th", ["LH G♯ / RH B · 4 oct · hands together"]]],
  7: [["sc", "Scales", ["D♭ major · 4 oct", "E major · 4 oct", "G major · 4 oct", "B♭ major · 4 oct", "C♯ minor (harm. & mel.) · 4 oct", "E minor (harm. & mel.) · 4 oct", "G minor (harm. & mel.) · 4 oct", "B♭ minor (harm. & mel.) · 4 oct"]], ["s3", "A 3rd apart", ["D♭ major · 4 oct", "E major · 4 oct", "G major · 4 oct", "B♭ major · 4 oct", "C♯ harmonic minor · 4 oct", "E harmonic minor · 4 oct", "G harmonic minor · 4 oct", "B♭ harmonic minor · 4 oct"]], ["cm", "Contrary motion", ["D♭ major · 2 oct", "E major · 2 oct", "G major · 2 oct", "B♭ major · 2 oct", "C♯ harmonic minor · 2 oct", "E harmonic minor · 2 oct", "G harmonic minor · 2 oct", "B♭ harmonic minor · 2 oct"]], ["t3", "Scales in 3rds", ["G major in 3rds, legato · 2 oct · hands separately", "G major in 3rds, staccato · 2 oct · hands separately"]], ["ch", "Chromatic", ["Contrary motion, LH C♯ / RH E · 2 oct"]], ["ar", "Arpeggios (1st inversion)", ["D♭ major · 4 oct", "E major · 4 oct", "G major · 4 oct", "B♭ major · 4 oct", "C♯ minor · 4 oct", "E minor · 4 oct", "G minor · 4 oct", "B♭ minor · 4 oct"]], ["dom", "Dominant 7th", ["In the key of D♭ · 4 oct", "In the key of E · 4 oct", "In the key of G · 4 oct", "In the key of B♭ · 4 oct"]], ["d7", "Diminished 7th", ["LH B / RH E · 4 oct · hands together"]]],
  8: [["sc", "Scales", ["C major · 4 oct", "E♭ major · 4 oct", "F♯ major · 4 oct", "A major · 4 oct", "C minor (harm. & mel.) · 4 oct", "E♭ minor (harm. & mel.) · 4 oct", "F♯ minor (harm. & mel.) · 4 oct", "A minor (harm. & mel.) · 4 oct"]], ["s6", "A 6th apart", ["C major · 4 oct", "E♭ major · 4 oct", "F♯ major · 4 oct", "A major · 4 oct", "C harmonic minor · 4 oct", "E♭ harmonic minor · 4 oct", "F♯ harmonic minor · 4 oct", "A harmonic minor · 4 oct"]], ["cm", "Contrary motion", ["C major · 2 oct", "E♭ major · 2 oct", "F♯ major · 2 oct", "A major · 2 oct", "C harmonic minor · 2 oct", "E♭ harmonic minor · 2 oct", "F♯ harmonic minor · 2 oct", "A harmonic minor · 2 oct"]], ["t3", "Scales in 3rds & 6ths", ["E♭ major in 3rds, legato · 2 oct · hands separately", "C major in 6ths, staccato · 2 oct · hands separately"]], ["ch", "Chromatic & whole-tone", ["Chromatic a major 6th apart, LH E♭ / RH C · 4 oct", "Whole-tone, LH E / RH C · 4 oct"]], ["ar", "Arpeggios (2nd inversion)", ["C major · 4 oct", "E♭ major · 4 oct", "F♯ major · 4 oct", "A major · 4 oct", "C minor · 4 oct", "E♭ minor · 4 oct", "F♯ minor · 4 oct", "A minor · 4 oct"]], ["dom", "Dominant 7th", ["In the key of C · 4 oct", "In the key of E♭ · 4 oct", "In the key of F♯ · 4 oct", "In the key of A · 4 oct"]], ["d7", "Diminished 7th", ["LH E / RH C · 4 oct · hands together"]]],
};
const SC_EM = { sc: "🎼", st: "🔹", cm: "↔️", ch: "🌈", ar: "🏹", d7: "🌀", dom: "7️⃣", s3: "🎶", s6: "🎶", t3: "🎶" };
/* a model on YouTube: a search for this exact scale (the teacher can always swap in her own) */
const scaleYT = (g, cat, item) => "https://www.youtube.com/results?search_query=" + encodeURIComponent(`ABRSM ${g ? "grade " + g : "initial grade"} piano ${cat} ${item.split(" · ")[0]}`);
const scaleTitle = (cat, item) => `${cat === "Scales" ? "" : cat + ": "}${item}`;

/* ---------- picker screens (inside "Make my plan") ---------- */
function pkRecent() { return (S.recentP || []).slice(0, 8); }
function pkRemember(p) { S.recentP = [{ title: p.title, composer: p.composer || "" }].concat((S.recentP || []).filter(x => x.title !== p.title)).slice(0, 12); }
function pkRow(p, on, extra = "") {
  return `<div class="row" data-q="${esc((p.title + " " + (p.composer || "") + " " + (p.coll || p.label || "")).toLowerCase())}">
   <div class="grow"><div class="title">${esc(p.title)}</div><div class="muted small">${esc(p.composer || "")}${p.coll ? " · " + esc(p.coll) : p.label ? " · " + esc(p.label) : ""}</div></div>${extra}
   <button class="btn sm ${on ? "" : "ghost"}" data-pp="wpkAdd" data-id="${esc(p.id)}">${on ? "✓" : "＋"}</button></div>`;
}
const pkChips = (key, vals, cur, lab) => `<div class="chips">${vals.map(v => `<button class="chip ${String(cur) === String(v) ? "on" : ""}" data-pp="wpkSet" data-k="${key}" data-v="${esc(String(v))}">${lab ? lab(v) : esc(String(v))}</button>`).join("")}</div>`;
function pkAll() { return libAll().concat(plibFlat()).concat(pkRecent().map((r, i) => ({ id: "rc:" + i, title: r.title, composer: r.composer }))); }
function pkHTML(W) {
  const P = W.lib, on = p => W.pieces.includes(p.title), back = `<div class="row" style="gap:8px;align-items:center"><button class="btn ghost sm" data-pp="${P.mode === "home" ? "wLibBack" : "wpkHome"}">← ${t("lb_back")}</button><h2 style="margin:0">📚 ${t("lb_h")}</h2></div>`;
  if (P.mode === "home") {
    const R = pkRecent();
    return `${back}
     <input id="wzLibQ" style="flex:none;min-height:0;height:46px" placeholder="🔍 ${t("libSearch")}" value="${esc(P.q)}" oninput="pkSearch(this.value)">
     <div id="pkFound" class="list lib-pick">${P.q ? pkFoundHTML(W, P.q) : ""}</div>
     ${R.length ? `<div class="card stack"><b>🕘 ${t("pk_recent")}</b><div class="list">${R.map((r, i) => pkRow({ id: "rc:" + i, ...r }, on(r))).join("")}</div></div>` : ""}
     <button class="card pk-cat" data-pp="wpkMode" data-v="lib"><span class="pk-ic">🎹</span><span class="grow"><b>${t("pk_lib")}</b><span class="small muted">${t("pk_libSub")}</span></span><span>→</span></button>
     <button class="card pk-cat" data-pp="wpkMode" data-v="abrsm"><span class="pk-ic">📘</span><span class="grow"><b>ABRSM</b><span class="small muted">${t("pk_abrsmSub")}</span></span><span>→</span></button>
     ${(S.library || []).length ? `<button class="card pk-cat" data-pp="wpkMode" data-v="teacher"><span class="pk-ic">👩‍🏫</span><span class="grow"><b>${t("pk_teacher")}</b><span class="small muted">${t("pk_teacherSub")}</span></span><span>→</span></button>` : ""}
     <div class="muted small">${t("pk_hint")}</div>`;
  }
  if (P.mode === "lib") {
    const L = plibFlat(); P.lv ??= Math.max(0, Math.min(8, +(PROF?.grade ?? 1)));
    const inLv = L.filter(p => p.lv === +P.lv), comps = [...new Set(inLv.map(p => p.composer))];
    if (P.comp && !comps.includes(P.comp)) P.comp = null;
    const colls = P.comp ? [...new Set(inLv.filter(p => p.composer === P.comp).map(p => p.coll))] : [];
    if (P.coll && !colls.includes(P.coll)) P.coll = null; if (!P.coll && colls.length === 1) P.coll = colls[0];
    const rows = P.coll ? inLv.filter(p => p.composer === P.comp && p.coll === P.coll) : [];
    return `${back}<div class="label">① ${t("pk_level")}</div>${pkChips("lv", PLIB_LEVELS, P.lv, v => gradeName(v))}
     <div class="label">② ${t("pk_comp")}</div>${pkChips("comp", comps, P.comp)}
     ${P.comp ? `<div class="label">③ ${t("pk_coll")}</div>${pkChips("coll", colls, P.coll)}` : ""}
     ${rows.length ? `<div class="label">④ ${t("pk_piece")}</div><div class="list lib-pick">${rows.map(p => pkRow(p, on(p))).join("")}</div>` : ""}`;
  }
  if (P.mode === "abrsm") {
    const C = CATALOGS; P.cy ||= C[0].id; const c = C.find(x => x.id === P.cy) || C[0]; P.g ??= Math.max(0, Math.min(8, +(PROF?.grade ?? 1))); P.li ||= "A";
    const rows = c.rows.map((r, i) => ({ r, i })).filter(x => x.r[0] === +P.g && x.r[1] === P.li).map(({ r, i }) => ({ id: "cat:" + c.id + ":" + i, title: r[3], composer: r[2], label: r[4] ? "📘 " + t("pk_inBook") : "" }));
    return `${back}${pkChips("cy", C.map(x => x.id), P.cy, v => esc(C.find(x => x.id === v).short))}${pkChips("g", PLIB_LEVELS, P.g, v => gradeName(v))}${pkChips("li", ["A", "B", "C"], P.li, v => "List " + v)}
     <div class="list lib-pick">${rows.map(p => pkRow(p, on(p), `<a class="btn sm soft" href="${esc(listenUrl(p))}" target="_blank" rel="noopener">▶</a>`)).join("") || `<div class="empty">${t("lb_none")}</div>`}</div>`;
  }
  /* the teacher's own list */
  const L = S.library || [], grades = [...new Set(L.map(l => +l.grade || 0))].sort((a, b) => a - b); P.tg ??= "all";
  const rows = L.filter(l => P.tg === "all" || String(+l.grade || 0) === String(P.tg));
  return `${back}${pkChips("tg", ["all"].concat(grades), P.tg, v => v === "all" ? t("allGrades") : gradeName(+v))}
   <div class="list lib-pick">${rows.map(l => pkRow(l, on(l), `<a class="btn sm soft" href="${esc(listenUrl(l))}" target="_blank" rel="noopener">▶</a>`)).join("") || `<div class="empty">${t("lb_none")}</div>`}</div>`;
}
function pkFoundHTML(W, q) {
  const s = q.toLowerCase().trim(); if (s.length < 2) return "";
  const seen = new Set(), hits = pkAll().filter(p => { const k = p.title + "|" + p.composer; if (seen.has(k)) return false; seen.add(k); return (p.title + " " + (p.composer || "") + " " + (p.coll || "")).toLowerCase().includes(s); }).slice(0, 30);
  return hits.map(p => pkRow(p, W.pieces.includes(p.title))).join("") || `<div class="empty">${t("lb_none")}</div>`;
}
function pkSearch(q) { if (!PPW?.lib) return; PPW.lib.q = q; const el = document.getElementById("pkFound"); if (el) el.innerHTML = pkFoundHTML(PPW, q); }
function pkFind(id) { return pkAll().find(p => p.id === id); }

/* ---------- scales screen (the plan's scales step) ---------- */
function scHTML(W) {
  W.scG ??= Math.max(0, Math.min(8, +(PROF?.grade ?? 1))); W.scPick ||= [];
  const G = SCALES[W.scG] || [];
  return `<div class="label">${t("sc_grade")}</div>${`<div class="chips">${PLIB_LEVELS.map(g => `<button class="chip ${+W.scG === g ? "on" : ""}" data-pp="wscG" data-v="${g}">${gradeName(g)}</button>`).join("")}</div>`}
   ${G.map(([k, cat, items]) => `<div class="card stack sc-cat"><b>${SC_EM[k] || "🎼"} ${esc(cat)}</b><div class="sc-items">${items.map(it => { const id = W.scG + "|" + cat + "|" + it, on = W.scPick.includes(id);
     return `<div class="sc-item"><button class="chip ${on ? "on" : ""}" data-pp="wscTog" data-v="${esc(id)}">${on ? "✓ " : ""}${esc(it)}</button><a class="sc-yt" href="${esc(scaleYT(W.scG, cat, it))}" target="_blank" rel="noopener" aria-label="${t("sc_model")}">▶</a></div>`; }).join("")}</div></div>`).join("")}
   <button class="btn soft sm" data-pp="wscRand">🎲 ${t("sc_rand")}</button>
   <div class="muted small">${t("sc_hint")}</div>
   <input id="wzScale" maxlength="40" value="${esc(W.scaleTxt)}" placeholder="${t("wz_scalePh")}">`;
}
