import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://idisdztwpvedtnroiian.supabase.co',
  process.env.SUPABASE_SERVICE_KEY || process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlkaXNkenR3cHZlZHRucm9paWFuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE0NTczOTQsImV4cCI6MjA5NzAzMzM5NH0.YmF0DqWmopuJs9Ci1hdFi0XDMoWRD0yfVwOuuG7WVyE'
);

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { homeTeam, awayTeam, league, fixtureId } = req.body;

  // ── Cache check ──────────────────────────────────────────────────────────
  // If we already have a prediction for this exact match, return it immediately
  // so all users see the same canonical AI prediction.
  try {
    const { data: cached } = await supabase
      .from('match_predictions')
      .select('ai_data')
      .eq('league', league)
      .eq('home_team', homeTeam)
      .eq('away_team', awayTeam)
      .single();

    if (cached?.ai_data) {
      return res.status(200).json({ ...cached.ai_data, cached: true });
    }
  } catch {}
  // ─────────────────────────────────────────────────────────────────────────

const SQUADS = {
  "Algeria": { manager: "Vladimir PETKOVIC", goalkeepers: ["Melvin MASTIL", "Oussama BENBOT", "Luca ZIDANE"], defenders: ["Aissa MANDI", "Achref ABADA", "Mohamed Amine TOUGAI", "Zineddine BELAID", "Jaouen HADJAM", "Rayan AIT-NOURI", "Rafik BELGHALI", "Ramy BENSEBAINI", "Samir CHERGUI"], midfielders: ["Ramiz ZERROUKI", "Houssem AOUAR", "Fares CHAIBI", "Hicham BOUDAOUI", "Nabil BENTALEB", "Ibrahim MAZA", "Yassine TITRAOUI"], forwards: ["Riyad MAHREZ", "Amine GOUIRI", "Anis HADJ MOUSSA", "Nadhir BENBOUALI", "Mohamed AMOURA", "Adil BOULBINA", "Fares GHEDJEMIS"] },
  "Argentina": { manager: "Lionel SCALONI", goalkeepers: ["Juan MUSSO", "Gerónimo RULLI", "Emiliano MARTÍNEZ"], defenders: ["Nicolás TAGLIAFICO", "Gonzalo MONTIEL", "Lisandro MARTÍNEZ", "Cristian ROMERO", "Nicolás OTAMENDI", "Facundo MEDINA", "Nahuel MOLINA"], midfielders: ["Marcos SENESI", "Leandro PAREDES", "Rodrigo DE PAUL", "Valentín BARCO", "Giovani LO CELSO", "Exequiel PALACIOS", "Nico GONZÁLEZ", "Alexis MAC ALLISTER", "Enzo FERNÁNDEZ"], forwards: ["Julián ÁLVAREZ", "Lionel MESSI", "Thiago ALMADA", "Giuliano SIMEONE", "Nico PAZ", "José Manuel LÓPEZ", "Lautaro MARTÍNEZ"] },
  "Australia": { manager: "Tony POPOVIĆ", goalkeepers: ["Mathew RYAN", "Paul IZZO", "Patrick BEACH"], defenders: ["Milos DEGENEK", "Alessandro CIRCATI", "Jacob ITALIANO", "Jordan BOS", "Jason GERIA", "Kai TREWIN", "Aziz BEHICH", "Harry SOUTTAR", "Cameron BURGESS", "Lucas HERRINGTON"], midfielders: ["Connor METCALFE", "Aiden O'NEILL", "Cameron DEVLIN", "Jackson IRVINE", "Paul OKON-ENGSTLER"], forwards: ["Mathew LECKIE", "Mohamed TOURE", "Ajdin HRUSTIC", "Awer MABIL", "Nestory IRANKUNDA", "Cristian VOLPATO", "Nishan VELUPILLAY", "Tete YENGI"] },
  "Austria": { manager: "Ralf RANGNICK", goalkeepers: ["Alexander SCHLAGER", "Florian WIEGELE", "Patrick PENTZ"], defenders: ["David AFFENGRUBER", "Kevin DANSO", "Stefan POSCH", "David ALABA", "Philipp LIENHART", "Phillip MWENE", "Marco FRIEDL", "Michael SVOBODA"], midfielders: ["Xaver SCHLAGER", "Nicolas SEIWALD", "Marcel SABITZER", "Florian GRILLITSCH", "Carney CHUKWUEMEKA", "Romano SCHMID", "Dejan LJUBICIC", "Konrad LAIMER", "Alexander PRASS", "Paul WANNER", "Alessandro SCHOEPF"], forwards: ["Marko ARNAUTOVIC", "Michael GREGORITSCH", "Sasa KALAJDZIC", "Patrick WIMMER"] },
  "Belgium": { manager: "Rudi GARCIA", goalkeepers: ["Thibaut COURTOIS", "Senne LAMMENS", "Mike PENDERS"], defenders: ["Zeno DEBAST", "Arthur THEATE", "Brandon MECHELE", "Maxim DE CUYPER", "Thomas MEUNIER", "Koni DE WINTER", "Joaquin SEYS", "Timothy CASTAGNE", "Nathan NGOY"], midfielders: ["Axel WITSEL", "Kevin DE BRUYNE", "Youri TIELEMANS", "Diego MOREIRA", "Hans VANAKEN", "Alexis SAELEMAEKERS", "Nicolas RASKIN", "Amadou ONANA"], forwards: ["Romelu LUKAKU", "Leandro TROSSARD", "Jeremy DOKU", "Dodi LUKEBAKIO", "Charles DE KETELAERE", "Matias FERNANDEZ-PARDO"] },
  "Bosnia and Herzegovina": { manager: "Sergej BARBAREZ", goalkeepers: ["Nikola VASILJ", "Mladen JURKAS", "Martin ZLOMISLIC"], defenders: ["Nihad MUJAKIC", "Dennis HADZIKADUNIC", "Tarik MUHAREMOVIC", "Sead KOLASINAC", "Amar DEDIC", "Nikola KATIC", "Stjepan RADELJIC", "Arjan MALIC"], midfielders: ["Benjamin TAHIROVIC", "Armin GIGOVIC", "Ivan BASIC", "Ivan SUNJIC", "Amar MEMIC", "Amir HADZIAHMETOVIC", "Dzenis BURNIC", "Ermin MAHMIC"], forwards: ["Samed BAZDAR", "Ermedin DEMIROVIC", "Edin DZEKO", "Kerim ALAJBEGOVIC", "Esmir BAJRAKTAREVIC", "Haris TABAKOVIC", "Jovo LUKIC"] },
  "Brazil": { manager: "Carlo Ancelotti", goalkeepers: ["ALISSON", "WEVERTON", "EDERSON"], defenders: ["GABRIEL MAGALHÃES", "MARQUINHOS", "ALEX SANDRO", "DANILO", "BREMER", "LÉO PEREIRA", "DOUGLAS SANTOS", "ROGER IBAÑEZ"], midfielders: ["EDERSON SILVA", "CASEMIRO", "BRUNO GUIMARÃES", "FABINHO", "DANILO SANTOS", "LUCAS PAQUETÁ"], forwards: ["VINICIUS JUNIOR", "MATHEUS CUNHA", "NEYMAR JR", "RAPHINHA", "ENDRICK", "LUIZ HENRIQUE", "GABRIEL MARTINELLI", "IGOR THIAGO", "RAYAN"] },
  "Cabo Verde": { manager: "Pedro Leitão Brito", goalkeepers: ["VOZINHA", "MARCIO ROSA", "CJ DOS SANTOS"], defenders: ["STOPIRA", "DINEY BORGES", "PICO LOPES", "LOGAN COSTA", "SIDNY LOPES CABRAL", "STEVEN MOREIRA", "WAGNER PINA", "KELVIN PIRES"], midfielders: ["KEVIN PINA", "JOVANE CABRAL", "JOAO PAULO", "JAMIRO MONTEIRO", "GARRY RODRIGUES", "DEROY DUARTE", "LAROS DUARTE", "YANNICK SEMEDO", "WILLY SEMEDO", "TELMO ARCANJO", "NUNO DA COSTA", "HELIO VARELA"], forwards: ["GILSON BENCHIMOL", "DAILON LIVRAMENTO", "RYAN MENDES"] },
  "Canada": { manager: "Jesse Alan MARSCH", goalkeepers: ["Dayne ST. CLAIR", "Maxime CREPEAU", "Owen GOODMAN"], defenders: ["Alistair JOHNSTON", "Alfie JONES", "Luc DE FOUGEROLLES", "Joel WATERMAN", "Derek CORNELIUS", "Moise BOMBITO", "Alphonso DAVIES", "Richie LARYEA", "Niko SIGUR"], midfielders: ["Mathieu CHOINIERE", "Stephen EUSTAQUIO", "Ismael KONE", "Liam MILLAR", "Jacob SHAFFELBURG", "Jonathan OSORIO", "Nathan SALIBA"], forwards: ["Cyle LARIN", "Jonathan DAVID", "Tani OLUWASEYI", "Tajon BUCHANAN", "Ali AHMED", "Promise DAVID", "Jayden NELSON"] },
  "Colombia": { manager: "Néstor Gabriel LORENZO", goalkeepers: ["David OSPINA", "Camilo VARGAS", "Alvaro MONTERO"], defenders: ["Daniel MUÑOZ", "Jhon LUCUMÍ", "Santiago ARIAS", "Yerry MINA", "Gustavo PUERTA", "Johan MOJICA", "Willer DITTA", "Deiver MACHADO", "Davinson SÁNCHEZ"], midfielders: ["Kevin CASTAÑO", "Richard RÍOS", "Jorge CARRASCAL", "James RODRÍGUEZ", "Jhon ARIAS", "Juan PORTILLA", "Jefferson LERMA", "Juan QUINTERO"], forwards: ["Luis DÍAZ", "Jhon CÓRDOBA", "Cucho HERNÁNDEZ", "Jaminton CAMPAZ", "Luis SUÁREZ", "Andrés GÓMEZ"] },
  "Congo DR": { manager: "Sébastien DESABRE", goalkeepers: ["Lionel MPASI", "Timothy FAYULU", "Matthieu EPOLO"], defenders: ["Aaron WAN-BISSAKA", "Steve KAPUADI", "Axel TUANZEBE", "Dylan BATUBINSIKA", "Joris KAYEMBE", "Chancel MBEMBA", "Gédéon KALULU", "Arthur MASUAKU"], midfielders: ["Ngalayel MUKAU", "Nathanael MBUKU", "Samuel MOUTOUSSAMY", "Théo BONGONDA", "Noah SADIKI", "Aaron TSHIBOLA", "Charles PICKEL", "Edo KAYEMBE"], forwards: ["Brian CIPENGA", "Gaël KAKUTA", "Meschack ELIA", "Cédric BAKAMBU", "Fiston MAYELE", "Yoane WISSA", "Simon BANZA"] },
  "Croatia": { manager: "Zlatko DALIĆ", goalkeepers: ["Dominik LIVAKOVIĆ", "Ivor PANDUR", "Dominik KOTARSKI"], defenders: ["Josip STANIŠIĆ", "Marin PONGRAČIĆ", "Joško GVARDIOL", "Duje ĆALETA-CAR", "Josip ŠUTALO", "Kristijan JAKIĆ", "Luka VUŠKOVIĆ", "Martin ERLIĆ"], midfielders: ["Nikola MORO", "Mateo KOVAČIĆ", "Luka MODRIĆ", "Nikola VLAŠIĆ", "Mario PAŠALIĆ", "Martin BATURINA", "Petar SUČIĆ", "Toni FRUK", "Luka SUČIĆ"], forwards: ["Andrej KRAMARIĆ", "Ante BUDIMIR", "Ivan PERIŠIĆ", "Igor MATANOVIĆ", "Marco PAŠALIĆ", "Petar MUSA"] },
  "Curaçao": { manager: "Dick ADVOCAAT", goalkeepers: ["Eloy ROOM", "Tyrick BODAK", "Trevor DOORNBUSCH"], defenders: ["Shurandy SAMBO", "Jurien GAARI", "Roshon VAN EIJMA", "Sherel FLORANUS", "Armando OBISPO", "Joshua BRENET", "Riechedly BAZOER", "Deveron FONVILLE"], midfielders: ["Godfried ROEMERATOE", "Juninho BACUNA", "Livano COMENENCIA", "Leandro BACUNA", "Arjany MARTHA", "Tahith CHONG", "Kevin FELIDA"], forwards: ["Juergen LOCADIA", "Jeremy ANTONISSE", "Sontje HANSEN", "Tyrese NOSLIN", "Kenji GORRÉ", "Jearl MARGARITHA", "Brandley KUWAS", "Gervane KASTANEER"] },
  "Czechia": { manager: "Miroslav KOUBEK", goalkeepers: ["Matěj KOVÁŘ", "Jindřich STANĚK", "Lukáš HORNÍČEK"], defenders: ["David ZIMA", "Tomáš HOLEŠ", "Robin HRANÁČ", "Vladimír COUFAL", "Štěpán CHALOUPKA", "Ladislav KREJČÍ", "David JURÁSEK", "Jaroslav ZELENÝ", "David DOUDĚRA"], midfielders: ["Vladimír DARIDA", "Lukáš ČERV", "Lukáš PROVOD", "Michal SADÍLEK", "Tomáš SOUČEK", "Alexandr SOJKA", "Hugo SOCHŮREK"], forwards: ["Adam HLOŽEK", "Patrik SCHICK", "Jan KUCHTA", "Mojmír CHYTIL", "Pavel ŠULC", "Tomáš CHORY", "Denis VIŠINSKÝ"] },
  "Côte d'Ivoire": { manager: "Emerse FAÉ", goalkeepers: ["Yahia FOFANA", "Mohamed KONÉ", "Alban LAFONT"], defenders: ["Ousmane DIOMANDÉ", "Ghislain KONAN", "Wilfried SINGO", "Odilon KOSSOUNOU", "Christopher OPERI", "Guela DOUÉ", "Emmanuel AGBADOU", "Evan NDICKA"], midfielders: ["Jean Michaël SERI", "Seko FOFANA", "Franck KESSIÉ", "Ibrahim SANGARÉ", "Parfait GUIAGON", "Christ Inao OULAI"], forwards: ["Ange-Yoan BONNY", "Simon ADINGRA", "Yan DIOMANDÉ", "Elye WAHI", "Oumar DIAKITÉ", "Amad DIALLO", "Nicolas PÉPÉ", "Evann GUESSAND", "Bazoumana TOURÉ"] },
  "Ecuador": { manager: "Sebastián Andrés BECCACECE", goalkeepers: ["Hernan GALÍNDEZ", "Moisés RAMÍREZ", "Gonzalo VALLE"], defenders: ["Félix TORRES", "Piero HINCAPIE", "Joel ORDÓÑEZ", "Willian PACHO", "Pervis ESTUPIÑÁN", "Ángelo PRECIADO", "Jackson POROZO", "Yáimar MEDINA"], midfielders: ["Jordy ALCÍVAR", "Anthony VALENCIA", "Kendry PÁEZ", "Alan MINDA", "Pedro VITE", "Denil CASTILLO", "Alan FRANCO", "Moisés CAICEDO"], forwards: ["John YEBOAH", "Kevin RODRÍGUEZ", "Enner VALENCIA", "Jordy CAICEDO", "Gonzalo PLATA", "Nilson ÁNGULO", "Jeremy ARÉVALO"] },
  "Egypt": { manager: "Hossam Hassan Hussein", goalkeepers: ["Mohamed Elshenawy", "Mahdy Soliman", "Mostafa Shoubir", "Mohamed Alaa"], defenders: ["Yasser Ibrahim", "Mohamed Hany", "Hossam Abdelmaguid", "Ramy Rabia", "Mohamed Abdelmonem", "Ahmed Fatouh", "Karim Hafez", "Tarek Alaa"], midfielders: ["Emam Ashour", "Mostafa Zico", "Hamdy Fathy", "Mohanad Lashin", "Nabil Donga", "Marawan Attia", "Mahmoud Saber"], forwards: ["Trezeguet", "Hamza Abdelkarim", "Mohamed Salah", "Haissem Hassan", "Ibrahim Adel", "Omar Marmoush", "Zizo"] },
  "England": { manager: "Thomas TUCHEL", goalkeepers: ["Jordan PICKFORD", "Dean HENDERSON", "James TRAFFORD"], defenders: ["Ezri KONSA", "Nico OREILLY", "John STONES", "Marc GUEHI", "Tino LIVRAMENTO", "Dan BURN", "Reece JAMES", "Djed SPENCE", "Jarell QUANSAH"], midfielders: ["Declan RICE", "Elliot ANDERSON", "Jude BELLINGHAM", "Jordan HENDERSON", "Kobbie MAINOO", "Morgan ROGERS", "Eberechi EZE"], forwards: ["Bukayo SAKA", "Harry KANE", "Marcus RASHFORD", "Anthony GORDON", "Ollie WATKINS", "Noni MADUEKE", "Ivan TONEY"] },
  "France": { manager: "Didier Deschamps", goalkeepers: ["Brice Samba", "Mike Maignan", "Robin Risser"], defenders: ["Malo Gusto", "Lucas Digne", "Dayot Upamecano", "Jules Koundé", "Ibrahima Konaté", "William Saliba", "Théo Hernandez", "Lucas Hernandez", "Maxence Lacroix"], midfielders: ["Manu Koné", "Aurélien Tchouaméni", "N'Golo Kanté", "Adrien Rabiot", "Warren Zaïre-Emery", "Rayan Cherki", "Maghnes Akliouche"], forwards: ["Ousmane Dembélé", "Marcus Thuram", "Kylian Mbappé", "Michael Olise", "Bradley Barcola", "Désiré Doué", "Jean-Philippe Mateta"] },
  "Germany": { manager: "Julian NAGELSMANN", goalkeepers: ["Manuel NEUER", "Oliver BAUMANN", "Alexander NÜBEL"], defenders: ["Antonio RÜDIGER", "Waldemar ANTON", "Jonathan TAH", "Joshua KIMMICH", "Nico SCHLOTTERBECK", "Nathaniel BROWN", "David RAUM", "Malick THIAW"], midfielders: ["Aleksandar PAVLOVIĆ", "Leon GORETZKA", "Jamie LEWELING", "Jamal MUSIALA", "Pascal GROSS", "Angelo STILLER", "Florian WIRTZ", "Leroy SANÉ", "Nadiem AMIRI", "Felix NMECHA", "Assan OUEDRAOGO"], forwards: ["Kai HAVERTZ", "Nick WOLTEMADE", "Maximilian BEIER", "Deniz UNDAV"] },
  "Ghana": { manager: "Carlos QUEIROZ", goalkeepers: ["Lawrence ATI ZIGI", "Joseph ANANG", "Benjamin ASARE"], defenders: ["Alidu SEIDU", "Jonas ADJETEY", "Abdul MUMIN", "Gideon MENSAH", "Baba RAHMAN", "Jerome OPOKU", "Kojo Peprah OPPONG", "Derrick LUCKASSEN", "Marvin SENAYA"], midfielders: ["Caleb YIRENKYI", "Thomas PARTEY", "Kwasi SIBO", "Antoine SEMENYO", "Elisha OWUSU", "Augustine BOAKYE"], forwards: ["Abdul FATAWU", "Jordan AYEW", "Brandon THOMAS-ASANTE", "Christopher Bonsu BAAH", "Inaki WILLIAMS", "Kamaldeen SULEMANA", "Ernest NUAMAH", "Prince ADU"] },
  "Haiti": { manager: "Sebastien MIGNE", goalkeepers: ["Johny PLACIDE", "Alexandre PIERRE", "Josue DUVERGER"], defenders: ["Carlens ARCUS", "Keeto THERMONCY", "Ricardo ADE", "Hannes DELCROIX", "Martin EXPERIENCE", "Markhus LACROIX", "Garven METUSALA", "Jean-Kevin DUVERNE", "Wilguens PAUGAIN"], midfielders: ["Carl SAINTE", "Jean-Ricner BELLEGARDE", "Danley JEAN JACQUES", "Dominique SIMON", "Woodensky PIERRE"], forwards: ["Derrick ETIENNE", "Duckens NAZON", "Louicius DEEDSON", "Ruben PROVIDENCE", "Lenny JOSEPH", "Wilson ISIDOR", "Yassin FORTUNE", "Frantzdy PIERROT", "Josue CASIMIR"] },
  "IR Iran": { manager: "Amir Ghalenoei", goalkeepers: ["Alireza BEIRANVAND", "Payam NIAZMAND", "Hossein HOSSEINI"], defenders: ["Saleh HARDANI", "Ehsan HAJISAFI", "Shoja KHALILZADEH", "Milad MOHAMMADI", "Hossein KANANI", "Arya YOUSEFI", "Ali NEMATI", "Ramin REZAEIAN", "Danial IRI"], midfielders: ["Saeid EZATOLAHI", "Alireza JAHANBAKHSH", "Mohammad MOHEBBI", "Saman GHODDOS", "Roozbeh CHESHMI", "Mehdi TORABI", "Mohammad GHORBANI", "Amirmohammad RAZAGHINIA"], forwards: ["Mehdi TAREMI", "Mehdi GHAYEDI", "Ali ALIPOUR", "Amirhossein HOSSEINZADEH", "Shahriyar MOGHANLOO", "Dennis DARGAHI"] },
  "Iraq": { manager: "Graham Arnold", goalkeepers: ["Fahad Talib", "Jalal Hassan", "Ahmed Basil"], defenders: ["Rebin Sulaka", "Hussein Ali", "Zaid Tahseen", "Akam Hashim", "Munaf Younus", "Ahmed Maknazi", "Merchas Doski", "Mustafa Saadoon", "Frans Putros"], midfielders: ["Youssef Amyn", "Ibrahim Bayesh", "Zidane Iqbal", "Amir Al-Ammari", "Kevin Yakob", "Aimar Sher", "Zaid Ismael"], forwards: ["Ali Al-Hamadi", "Mohanad Ali", "Ahmed Qasem", "Ali Yousif", "Ali Jasim", "Aymen Hussein", "Marko Farji"] },
  "Japan": { manager: "Hajime MORIYASU", goalkeepers: ["Zion SUZUKI", "Keisuke OSAKO", "Tomoki HAYAKAWA"], defenders: ["Yukinari SUGAWARA", "Shogo TANIGUCHI", "Kou ITAKURA", "Yuto NAGATOMO", "Tsuyoshi WATANABE", "Ayumu SEKO", "Hiroki ITO", "Takehiro TOMIYASU", "Junnosuke SUZUKI"], midfielders: ["Ao TANAKA", "Takefusa KUBO", "Ritsu DOAN", "Daizen MAEDA", "Keito NAKAMURA", "Junya ITO", "Daichi KAMADA", "Yuito SUZUKI", "Kaishu SANO"], forwards: ["Shuto MACHINO", "Keisuke GOTO", "Ayase UEDA", "Koki OGAWA", "Kento SHIOGAI"] },
  "Jordan": { manager: "Jamal SELLAMI", goalkeepers: ["Yazeed ABULAILA", "Nour BANIATEYAH", "Abdallah ALFAKHORI"], defenders: ["Mohammad ABUHASHEESH", "Abdallah NASIB", "Husam ABUDAHAB", "Yazan ALARAB", "Mohammad ABUALNADI", "Saleem OBAID", "Saed ALROSAN", "Ehsan HADDAD", "Anas BADAWI"], midfielders: ["Amer JAMOUS", "Noor ALRAWABDEH", "Rajaei AYED", "Ibrahim SADEH", "Mohammad ABUGHOUSH", "Mohannad ABUTAHA", "Nizar ALRASHDAN", "Mohammad ALDAOUD"], forwards: ["Mohammad ABUZRAIQ", "Ali OLWAN", "Mousa ALTAMARI", "Odeh FAKHOURY", "Mahmoud ALMARDI", "Ali AZAIZEH"] },
  "Korea Republic": { manager: "Hong Myung-Bo", goalkeepers: ["KIM Seunggyu", "SONG Bumkeun", "JO Hyeonwoo"], defenders: ["LEE Hanbeom", "KIM Minjae", "KIM Taehyeon", "LEE Taeseok", "CHO Wije", "KIM Moonhwan", "PARK Jinseob", "SEOL Youngwoo", "CASTROP Jens"], midfielders: ["LEE Gihyuk", "HWANG Inbeom", "PAIK Seungho", "LEE Jaesung", "HWANG Heechan", "BAE Junho", "LEE Kangin", "YANG Hyunjun", "KIM Jingyu", "EOM Jisung", "LEE Donggyeong"], forwards: ["SON Heungmin", "CHO Guesung", "OH Hyeongyu"] },
  "Mexico": { manager: "Javier Aguirre Onaindía", goalkeepers: ["Raul RANGEL", "Carlos ACEVEDO", "Guillermo OCHOA"], defenders: ["Jorge SANCHEZ", "Cesar MONTES", "Edson ALVAREZ", "Johan VASQUEZ", "Israel REYES", "Mateo CHAVEZ", "Jesus GALLARDO"], midfielders: ["Erik LIRA", "Luis ROMO", "Alvaro FIDALGO", "Orbelin PINEDA", "Obed VARGAS", "Gilberto MORA", "Luis CHAVEZ", "Brian GUTIERREZ"], forwards: ["Raul JIMENEZ", "Alexis VEGA", "Santiago GIMENEZ", "Armando GONZALEZ", "Julian QUINONES", "Cesar HUERTA", "Guillermo MARTINEZ", "Roberto ALVARADO"] },
  "Morocco": { manager: "Mohamed OUAHBI", goalkeepers: ["Yassine BOUNOU", "Munir EL KAJOUI", "Ahmed Reda TAGNAOUTI"], defenders: ["Achraf HAKIMI", "Noussair MAZRAOUI", "Marwane SAADANE", "Zakaria EL OUAHDI", "Issa DIOP", "Chadi RIAD", "Youssef BELAMMARI", "Redouane HALHAL", "Anass SALAH EDDINE"], midfielders: ["Sofyan AMRABAT", "Ayyoub BOUADDI", "Chemsdine TALBI", "Azzedine OUNAHI", "Ismael SAIBARI", "Samir EL MOURABET", "Gessime YASSINE", "Bilal EL KHANNOUSS", "Neil EL AYNAOUI"], forwards: ["Soufiane RAHIMI", "Brahim DIAZ", "Amine SBAI", "Ayoub EL KAABI", "Ayoube AMAIMOUNI"] },
  "Netherlands": { manager: "Ronald KOEMAN", goalkeepers: ["Bart VERBRUGGEN", "Robin ROEFS", "Mark FLEKKEN"], defenders: ["Lutsharel GEERTRUIDA", "Virgil VAN DIJK", "Nathan AKÉ", "Jan Paul VAN HECKE", "Mats WIEFFER", "Micky VAN DE VEN", "Denzel DUMFRIES", "Jorrel HATO"], midfielders: ["Marten DE ROON", "Justin KLUIVERT", "Ryan GRAVENBERCH", "Tijjani REIJNDERS", "Guus TIL", "Teun KOOPMEINERS", "Frenkie DE JONG", "Quinten TIMBER"], forwards: ["Wout WEGHORST", "Memphis DEPAY", "Cody GAKPO", "Noa LANG", "Donyell MALEN", "Brian BROBBEY", "Crysencio SUMMERVILLE"] },
  "New Zealand": { manager: "Darren BAZELEY", goalkeepers: ["Max CROCOMBE", "Alex PAULSEN", "Michael WOUD"], defenders: ["Tim PAYNE", "Francis DE VRIES", "Tyler BINDON", "Michael BOXALL", "Liberato CACACE", "Nando PIJNAKER", "Finn SURMAN", "Callan ELLIOT", "Tommy SMITH"], midfielders: ["Joe BELL", "Marko STAMENIC", "Sarpreet SINGH", "Elijah JUST", "Alex RUFER", "Ben OLD", "Callum McCOWATT", "Ryan THOMAS", "Lachlan BAYLISS"], forwards: ["Logan ROGERSON", "Chris WOOD", "Kosta BARBAROUSES", "Ben WAINE", "Jesse RANDALL"] },
  "Norway": { manager: "Ståle Solbakken", goalkeepers: ["Ørjan Nyland", "Sander Tangvik", "Egil Selvik"], defenders: ["Kristoffer Ajer", "Leo Østigård", "David Møller Wolfe", "Fredrik André Bjørkan", "Marcus Holmgren Pedersen", "Torbjørn Heggem", "Sondre Langås", "Henrik Falchener"], midfielders: ["Morten Thorsby", "Patrick Berg", "Sander Berge", "Martin Ødegaard", "Fredrik Aursnes", "Kristian Thorstvedt", "Thelo Aasgaard", "Andreas Schjelderup", "Oscar Bobb", "Jens Petter Hauge"], forwards: ["Alexander Sørloth", "Erling Haaland", "Jørgen Strand Larsen", "Antonio Nusa", "Julian Ryerson"] },
  "Panama": { manager: "Thomas Christiansen Tarín", goalkeepers: ["Luis MEJÍA", "César SAMUDIO", "Orlando MOSQUERA"], defenders: ["César BLACKMAN", "José CÓRDOBA", "Fidel ESCOBAR", "Edgardo FARIÑA", "Jiovany RAMOS", "Carlos HARVEY", "Eric DAVIS", "Andrés ANDRADE", "Amir MURILLO", "Roderick MILLER", "Jorge GUTIÉRREZ"], midfielders: ["Cristian MARTÍNEZ", "José Luis RODRÍGUEZ", "Adalberto CARRASQUILLA", "Ismael DÍAZ", "Édgar Yoel BÁRCENAS", "Alberto QUINTERO", "Aníbal GODOY", "César YANIS"], forwards: ["Tomás RODRÍGUEZ", "José FAJARDO", "Cecilio WATERMAN", "Azarías LONDOÑO"] },
  "Paraguay": { manager: "Gustavo ALFARO", goalkeepers: ["Gatito FERNÁNDEZ", "Orlando GILL", "Gastón OLVEIRA"], defenders: ["Gustavo VELÁZQUEZ", "Omar ALDERETE", "Juan José CÁCERES", "Fabián BALBUENA", "Junior ALONSO", "José CANALE", "Gustavo GÓMEZ", "Alexandro MAIDANA"], midfielders: ["Ramón SOSA", "Diego GÓMEZ", "Miguel ALMIRÓN", "MAURICIO", "Andrés CUBAS", "Damián BOBADILLA", "Braian OJEDA", "Matías GALARZA", "Gustavo CABALLERO"], forwards: ["Antonio SANABRIA", "Alejandro ROMERO GAMARRA", "Alex ARCE", "Julio ENCISO", "Gabriel ÁVALOS", "Isidro PITTA"] },
  "Portugal": { manager: "Roberto Martínez Montoliú", goalkeepers: ["Diogo COSTA", "José SÁ", "Rui SILVA"], defenders: ["Nélson SEMEDO", "Rúben DIAS", "Tomás ARAÚJO", "Diogo DALOT", "Renato VEIGA", "Gonçalo INÁCIO", "João CANCELO", "Samu COSTA", "Nuno MENDES"], midfielders: ["Matheus NUNES", "Bruno FERNANDES", "Bernardo SILVA", "João NEVES", "Rúben NEVES", "Vitinha"], forwards: ["Cristiano RONALDO", "Gonçalo RAMOS", "João FÉLIX", "Francisco TRINÇÃO", "Rafael LEÃO", "Pedro NETO", "Gonçalo GUEDES", "Francisco CONCEIÇÃO"] },
  "Qatar": { manager: "Julen Lopetegui Argote", goalkeepers: ["Mahmoud ABUNADA", "Salah ZAKARIA", "Meshaal BARSHAM"], defenders: ["Pedro MIGUEL", "Lucas MENDES", "Issa LAYE", "Jassem GABER", "Ayoub ALOUI", "Homam AHMED", "Boualem KHOUKHI", "Sultan ALBRAKE", "Alhashmi ALHUSSEIN"], midfielders: ["Abdulaziz HATEM", "Karim BOUDIAF", "Ahmed ALGANEHI", "Ahmed FATHY", "Assim MADIBO"], forwards: ["Ahmed ALAAELDIN", "Edmilson JUNIOR", "Mohammed MUNTARI", "Hassan ALHAYDOS", "Akram AFIF", "Yusuf ABDURISAG", "Almoez ALI", "Tahsin MOHAMMED", "Mohamed MANAI"] },
  "Saudi Arabia": { manager: "Georgios DONIS", goalkeepers: ["Nawaf ALAQIDI", "Mohammed ALOWAIS", "Ahmed ALKASSAR"], defenders: ["Ali MAJRASHI", "Ali LAJAMI", "Abdulelah ALAMRI", "Hassan ALTAMBAKTI", "Saud ABDULHAMID", "Nawaf BU WASHL", "Hassan KADISH", "Moteb ALHARBI", "Jehad THIKRI", "Mohammed ABU ALSHAMAT"], midfielders: ["Nasser ALDAWSARI", "Musab ALJUWAYR", "Abdullah ALKHAIBARI", "Ziyad ALJOHANI", "Ala ALHAJJI", "Mohamed KANNO"], forwards: ["Aiman YAHYA", "Feras ALBRIKAN", "Salem ALDAWSARI", "Saleh ALSHEHRI", "Khalid ALGHANNAM", "Abdullah ALHAMDDAN", "Sultan MANDASH"] },
  "Scotland": { manager: "Stephen CLARKE", goalkeepers: ["Angus GUNN", "Liam KELLY", "Craig GORDON"], defenders: ["Aaron HICKEY", "Andy ROBERTSON", "Grant HANLEY", "Kieran TIERNEY", "Jack HENDRY", "John SOUTTAR", "Dominic HYAM", "Nathan PATTERSON", "Anthony RALSTON", "Scott MCKENNA"], midfielders: ["Scott McTOMINAY", "John McGINN", "Tyler FLETCHER", "Ryan CHRISTIE", "Lewis FERGUSON", "Kenny McLEAN"], forwards: ["Lyndon DYKES", "Che ADAMS", "Ross STEWART", "Ben GANNON-DOAK", "George HIRST", "Lawrence SHANKLAND", "Findlay CURTIS"] },
  "Senegal": { manager: "Pape Thiaw", goalkeepers: ["Yehvann Diouf", "Edouard Mendy", "Mory Diaw"], defenders: ["Mamadou Sarr", "Kalidou Koulibaly", "Abdoulaye Seck", "Ismail Jakobs", "Krepin Diatta", "Moussa Niakhate", "Antoine Mendy", "El Hadji Malick Diouf"], midfielders: ["Idrissa Gana Gueye", "Pathe Ciss", "Lamine Camara", "Pape Matar Sarr", "Habib Diarra", "Bara Sapoko Ndiaye", "Pape Gueye"], forwards: ["Assane Diao", "Bamba Dieng", "Sadio Mane", "Nicolas Jackson", "Cherif Ndiaye", "Iliman Ndiaye", "Ismaila Sarr", "Ibrahim Mbaye"] },
  "South Africa": { manager: "Hugo BROOS", goalkeepers: ["Ronwen WILLIAMS", "Sipho CHAINE", "Ricardo GOSS"], defenders: ["Thabang MATULUDI", "Khulumani NDAMANE", "Aubrey MODIBA", "Mbekezeli MBOKAZI", "Samukele KABINI", "Nkosinathi SIBISI", "Khuliso MUDAU", "Ime OKON", "Olwethu MAKHANYA", "Bradley CROSS"], midfielders: ["Teboho MOKOENA", "Thalente MBATHA", "Themba ZWANE", "Sphephelo SITHOLE", "Jayden ADAMS"], forwards: ["Oswin APPOLLIS", "Tshepang MOREMI", "Lyle FOSTER", "Relebohile MOFOKENG", "Thapelo MASEKO", "Iqraam RAYNERS", "Evidence MAKGOPA", "Kamogelo SEBELEBELE"] },
  "Spain": { manager: "Luis de la Fuente Castillo", goalkeepers: ["David RAYA", "Joan GARCIA", "Unai SIMÓN"], defenders: ["Marc PUBILL", "Álex GRIMALDO", "Eric GARCÍA", "Marcos LLORENTE", "Pedro PORRO", "Aymeric LAPORTE", "Pau CUBARSÍ", "Marc CUCURELLA"], midfielders: ["Mikel MERINO", "Fabián RUIZ", "GAVI", "Álex BAENA", "RODRI", "Martín ZUBIMENDI", "PEDRI"], forwards: ["Ferran TORRES", "Dani OLMO", "Yeremy PINO", "Nico WILLIAMS", "Lamine YAMAL", "Mikel OYARZABAL", "Víctor MUÑOZ", "Borja IGLESIAS"] },
  "Sweden": { manager: "Graham POTTER", goalkeepers: ["Jacob WIDELL ZETTERSTRÖM", "Viktor JOHANSSON", "Kristoffer NORDFELDT"], defenders: ["Gustaf LAGERBIELKE", "Victor LINDELOF", "Isak HIEN", "Gabriel GUDMUNDSSON", "Herman JOHANSSON", "Daniel SVENSSON", "Hjalmar EKDAL", "Carl STARFELT", "Eric SMITH", "Alexander BERNHARDSSON", "Elliot STROUD"], midfielders: ["Lucas BERGVALL", "Benjamin NYGREN", "Ken SEMA", "Jesper KARLSTRÖM", "Yasin AYARI", "Mattias SVANBERG", "Besfort ZENELI"], forwards: ["Alexander ISAK", "Anthony ELANGA", "Viktor GYÖKERES", "Gustaf NILSSON", "Taha ALI"] },
  "Switzerland": { manager: "Murat Yakin", goalkeepers: ["Gregor KOBEL", "Yvon MVOGO", "Marvin KELLER"], defenders: ["Miro MUHEIM", "Silvan WIDMER", "Nico ELVEDI", "Manuel AKANJI", "Ricardo RODRIGUEZ", "Eray COEMERT", "Aurele AMENDA", "Luca JAQUEZ"], midfielders: ["Denis ZAKARIA", "Remo FREULER", "Johan MANZAMBI", "Granit XHAKA", "Ardon JASHARI", "Djibril SOW", "Michel AEBISCHER", "Fabian RIEDER"], forwards: ["Breel EMBOLO", "Dan NDOYE", "Christian FASSNACHT", "Ruben VARGAS", "Noah OKAFOR", "Zeki AMDOUNI", "Cedric ITTEN"] },
  "Tunisia": { manager: "Sabri LAMOUCHI", goalkeepers: ["Mouhib CHAMAKH", "Aymen DAHMEN", "Sabri BEN HESSEN"], defenders: ["Ali ABDI", "Montassar TALBI", "Omar REKIK", "Adam AROUS", "Dylan BRONN", "Mortadha BEN OUANES", "Yan VALERY", "Mohamed Amine BEN HMIDA", "Moutaz NEFFATI", "Raed CHIKHAOUI"], midfielders: ["Hannibal MEJBRI", "Ismael GHARBI", "Rani KHEDIRA", "Khalil AYARI", "Mohamed HADJ MAHMOUD", "Ellyes SKHIRI", "Anis SLIMANE", "Sebastian TOUNEKTI"], forwards: ["Elias ACHOURI", "Elias SAAD", "Hazem MASTOURI", "Rayan ELLOUMI", "Firas CHAOUAT"] },
  "Türkiye": { manager: "Vincenzo MONTELLA", goalkeepers: ["Mert GÜNOK", "Altay BAYINDIR", "Uğurcan ÇAKIR"], defenders: ["Zeki ÇELIK", "Merih DEMIRAL", "Çağlar SÖYÜNCÜ", "Eren ELMALI", "Abdülkerim BARDAKCI", "Ozan KABAK", "Mert MÜLDÜR", "Ferdi KADIOĞLU", "Samet AKAYDIN"], midfielders: ["Salih ÖZCAN", "Orkun KÖKÇÜ", "Hakan ÇALHANOĞLU", "İsmail YÜKSEK", "Kaan AYHAN"], forwards: ["Kerem AKTÜRKOĞLU", "Arda GÜLER", "Deniz GÜL", "Kenan YILDIZ", "İrfan Can KAHVECI", "Yunus AKGÜN", "Barış Alper YILMAZ", "Oğuz AYDIN", "Can UZUN"] },
  "USA": { manager: "Mauricio POCHETTINO", goalkeepers: ["Matt TURNER", "Matt FREESE", "Chris BRADY"], defenders: ["Sergiño DEST", "Chris RICHARDS", "Antonee ROBINSON", "Auston TRUSTY", "Miles ROBINSON", "Tim REAM", "Alex FREEMAN", "Max ARFSTEN", "Mark McKENZIE", "Joe SCALLY"], midfielders: ["Tyler ADAMS", "Giovanni REYNA", "Weston McKENNIE", "Sebastian BERHALTER", "Cristian ROLDAN", "Malik TILLMAN"], forwards: ["Ricardo PEPI", "Christian PULISIC", "Brenden AARONSON", "Haji WRIGHT", "Folarin BALOGUN", "Timothy WEAH", "Alex ZENDEJAS"] },
  "Uruguay": { manager: "Marcelo BIELSA", goalkeepers: ["Sergio ROCHET", "Santiago MELE", "Fernando MUSLERA"], defenders: ["Jose Maria GIMENEZ", "Sebastian CACERES", "Ronald ARAUJO", "Guillermo VARELA", "Mathias OLIVERA", "Matias VIÑA", "Santiago BUENO"], midfielders: ["Manuel UGARTE", "Rodrigo BENTANCUR", "Nicolas DE LA CRUZ", "Federico VALVERDE", "Giorgian DE ARRASCAETA", "Agustin CANOBBIO", "Emiliano MARTINEZ", "Maxi ARAUJO", "Joaquin PIQUEREZ", "Juan Manuel SANABRIA", "Rodrigo ZALAZAR"], forwards: ["Darwin NUÑEZ", "Facundo PELLISTRI", "Brian RODRIGUEZ", "Rodrigo AGUIRRE", "Federico VIÑAS"] },
  "Uzbekistan": { manager: "Fabio CANNAVARO", goalkeepers: ["Utkir YUSUPOV", "Abduvohid NEMATOV", "Botirali ERGASHEV"], defenders: ["Abdukodir KHUSANOV", "Khojiakbar ALIJONOV", "Farrukh SAYFIEV", "Rustam ASHURMATOV", "Sherzod NASRULLAEV", "Umar ESHMURODOV", "Abdulla ABDULLAEV", "Behruzjon KARIMOV", "Avazbek ULMASALIYEV", "Jakhongir UROZOV"], midfielders: ["Akmal MOZGOVOY", "Otabek SHUKUROV", "Jamshid ISKANDEROV", "Odiljon XAMROBEKOV", "Jaloliddin MASHARIPOV", "Oston URUNOV", "Dostonbek KHAMDAMOV", "Azizjon GANIEV", "Abbosbek FAYZULLAEV", "Sherzod ESANOV"], forwards: ["Eldor SHOMURODOV", "Azizbek AMONOV", "Igor SERGEEV"] },
};

  function getSquadForPrompt(teamName) {
    const squad = SQUADS[teamName];
    if (!squad) return null;
    const all = [
      ...squad.goalkeepers.map(p => `GK: ${p}`),
      ...squad.defenders.map(p => `DEF: ${p}`),
      ...squad.midfielders.map(p => `MID: ${p}`),
      ...squad.forwards.map(p => `FWD: ${p}`),
    ];
    return { players: all.join(", "), manager: squad.manager };
  }

  const homeSquad = getSquadForPrompt(homeTeam);
  const awaySquad = getSquadForPrompt(awayTeam);

  const squadInstructions = homeSquad && awaySquad
    ? `VERIFIED SQUADS — you MUST only pick players from these lists:\n${homeTeam} squad (manager: ${homeSquad.manager}): ${homeSquad.players}\n${awayTeam} squad (manager: ${awaySquad.manager}): ${awaySquad.players}\nDo NOT invent players. Do NOT use players from other teams. Only use names exactly as listed above.`
    : `CRITICAL: Only use real players who genuinely represent that national team. Verify every player nationality before including them.`;

  // Tournaments played at neutral venues — no team gets home advantage
  const NEUTRAL_VENUE_COMPETITIONS = [
    "world cup", "euro", "european championship", "copa america",
    "afcon", "africa cup of nations", "nations league finals",
    "champions league final", "club world cup",
  ];

  const isNeutralVenue = NEUTRAL_VENUE_COMPETITIONS.some(comp =>
    (league || "").toLowerCase().includes(comp)
  );

  const venueInstruction = isNeutralVenue
    ? `This match is played at a NEUTRAL VENUE as part of a tournament. Neither team has home advantage. Do NOT mention "home crowd," "home support," "at home," or any home-field advantage anywhere in your analysis or verdict. Refer to "${homeTeam}" and "${awayTeam}" by name only, never as "the hosts" or "the home side."`
    : `This is a domestic league/cup fixture. ${homeTeam} are playing at their home ground with their usual home advantage — this is a legitimate factor to mention.`;

  // Fetch injury/suspension data if we have a fixtureId
  let injuryInstruction = "";
  let insightsInstruction = "";

  if (fixtureId) {
    // Fetch injuries and insights in parallel
    const [injuryRes, insightsRes] = await Promise.allSettled([
      fetch(`https://v3.football.api-sports.io/injuries?fixture=${fixtureId}`, {
        headers: { "x-apisports-key": process.env.API_FOOTBALL_KEY },
      }),
      fetch(`https://v3.football.api-sports.io/predictions?fixture=${fixtureId}`, {
        headers: { "x-apisports-key": process.env.API_FOOTBALL_KEY },
      }),
    ]);

    // Process injuries
    try {
      if (injuryRes.status === "fulfilled" && injuryRes.value.ok) {
        const injuryData = await injuryRes.value.json();
        const injuries = injuryData.response || [];
        if (injuries.length) {
          const homeTeamId = injuries[0]?.team?.id;
          const homeOut = [];
          const awayOut = [];
          injuries.forEach(entry => {
            const label = `${entry.player?.name} (${entry.player?.reason || entry.player?.type || "unavailable"})`;
            if (entry.team?.id === homeTeamId) homeOut.push(label);
            else awayOut.push(label);
          });
          const parts = [];
          if (homeOut.length) parts.push(`${homeTeam} unavailable: ${homeOut.join(", ")}`);
          if (awayOut.length) parts.push(`${awayTeam} unavailable: ${awayOut.join(", ")}`);
          if (parts.length) {
            injuryInstruction = `INJURIES & SUSPENSIONS — these players are confirmed unavailable and MUST NOT appear in your predicted lineups: ${parts.join(" | ")}. Adjust your lineup and verdict to reflect these absences.`;
          }
        }
      }
    } catch {}

    // Process insights/predictions
    try {
      if (insightsRes.status === "fulfilled" && insightsRes.value.ok) {
        const insightsData = await insightsRes.value.json();
        const pred = insightsData.response?.[0];
        if (pred) {
          const pct = pred.predictions?.percent;
          const advice = pred.predictions?.advice;
          const goalsH = pred.predictions?.goals?.home;
          const goalsA = pred.predictions?.goals?.away;
          const homeForm = pred.teams?.home?.last_5?.form || "";
          const awayForm = pred.teams?.away?.last_5?.form || "";
          const comp = pred.comparison || {};

          const parts = [];
          if (pct) parts.push(`Statistical win probabilities: ${homeTeam} ${pct.home}, Draw ${pct.draw}, ${awayTeam} ${pct.away}`);
          if (goalsH !== null && goalsA !== null) parts.push(`Predicted goals: ${homeTeam} ${goalsH}, ${awayTeam} ${goalsA}`);
          if (homeForm || awayForm) parts.push(`Recent form: ${homeTeam} ${homeForm}, ${awayTeam} ${awayForm}`);
          if (comp.att) parts.push(`Attack strength: ${homeTeam} ${comp.att.home}, ${awayTeam} ${comp.att.away}`);
          if (comp.def) parts.push(`Defence strength: ${homeTeam} ${comp.def.home}, ${awayTeam} ${comp.def.away}`);
          if (advice) parts.push(`Statistical advice: ${advice}`);

          if (parts.length) {
            insightsInstruction = `STATISTICAL CONTEXT (use to inform your verdict but form your own independent analysis): ${parts.join(" | ")}.`;
          }
        }
      }
    } catch {}
  }

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': process.env.DEEP433_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1200,
      system: `You are a brutally honest expert football analyst. Respond with ONLY a raw JSON object. No markdown. No backticks. Just JSON. ${squadInstructions} ${venueInstruction} ${injuryInstruction} ${insightsInstruction}`,
      messages: [{
        role: 'user',
        content: `Predict this ${league} match. Team 1: ${homeTeam}, Team 2: ${awayTeam}. ${isNeutralVenue ? "Remember: neutral venue, no home advantage for either side." : `${homeTeam} play at home.`} ${injuryInstruction ? "Important: respect the injury/suspension list above in your lineup selections." : ""} ${insightsInstruction ? "Use the statistical context to inform your analysis, but do not just repeat the numbers — synthesise them into your own verdict." : ""} Return ONLY this JSON: {"scoreline":"2-1","homeGoals":2,"awayGoals":1,"outcome":"Home Win","confidence":"Medium","homeLineup":["GK","RB","CB","CB","LB","CM","CM","CM","RW","ST","LW"],"awayLineup":["GK","RB","CB","CB","LB","CM","CM","CM","RW","ST","LW"],"homeFormation":"4-3-3","awayFormation":"4-2-3-1","keyBattle":"Description","homeKeyPlayer":"Name","awayKeyPlayer":"Name","verdict":"2-3 sentence brutal honest verdict.","wildcard":"One surprise factor."} Use only players from the verified squads provided.`
      }],
    }),
  });

  const data = await response.json();
  const text = data.content?.map(b => b.text || '').join('').trim() || '';
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) return res.status(500).json({ error: 'Parse error' });

  const parsed = JSON.parse(jsonMatch[0]);

  // Save to cache for future users
  try {
    await supabase.from('match_predictions').upsert({
      league,
      home_team: homeTeam,
      away_team: awayTeam,
      ai_data: parsed,
    }, { onConflict: 'league,home_team,away_team' });
  } catch {}

  res.status(200).json(parsed);
}
