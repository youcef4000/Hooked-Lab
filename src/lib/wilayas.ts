/* ============================================================================
   Les 58 wilayas d'Algerie (decoupage de 2021) et leurs communes.

   Le pays est passe de 48 a 58 wilayas en 2021 : les 10 circonscriptions
   administratives du Sud (Timimoun, Bordj Badji Mokhtar, Ouled Djellal,
   Beni Abbes, In Salah, In Guezzam, Touggourt, Djanet, El M'Ghair, El Meniaa)
   sont devenues des wilayas a part entiere.

   Les communes listees sont celles reellement desservies par les
   transporteurs COD. Ce n'est pas la liste administrative complete des 1541
   communes : une commune ou aucun livreur ne passe n'a rien a faire dans un
   formulaire de commande — elle ne produit que des colis retournes.

   Les tarifs sont des ordres de grandeur 2025-2026, a recouper avec la grille
   de ton transporteur (Yalidine, ZR Express, Noest, Maystro...).
   ========================================================================== */

export type ZoneLivraison = 1 | 2 | 3 | 4;

export interface Wilaya {
  /** Code officiel sur deux chiffres, tel qu'il apparait sur les plaques. */
  code: string;
  nom: string;
  nomAr: string;
  zone: ZoneLivraison;
  communes: string[];
}

/** Tarifs indicatifs par zone, en DZD. */
export const TARIFS_ZONE: Record<ZoneLivraison, { domicile: number; stopdesk: number }> = {
  1: { domicile: 500, stopdesk: 350 },
  2: { domicile: 700, stopdesk: 450 },
  3: { domicile: 850, stopdesk: 500 },
  4: { domicile: 1300, stopdesk: 800 },
};

export const LIBELLE_ZONE: Record<ZoneLivraison, string> = {
  1: "Alger et couronne",
  2: "Nord et Centre",
  3: "Hauts plateaux et extremites",
  4: "Grand Sud",
};

export const WILAYAS: Wilaya[] = [
  {
    code: "01",
    nom: "Adrar",
    nomAr: "أدرار",
    zone: 4,
    communes: ["Adrar", "Reggane", "Aoulef", "Fenoughil", "Zaouiet Kounta", "Tsabit", "In Zghmir", "Tamest", "Bouda", "Timiaouine", "Sali", "Akabli"],
  },
  {
    code: "02",
    nom: "Chlef",
    nomAr: "الشلف",
    zone: 2,
    communes: ["Chlef", "Ténès", "Ouled Fares", "Boukadir", "El Karimia", "Oued Fodda", "Aïn Merane", "Zeboudja", "Abou El Hassan", "Beni Haoua", "Sobha", "Taougrit", "Chettia", "Sendjas", "Harchoun", "Oued Sly", "El Marsa", "Bouzeghaïa"],
  },
  {
    code: "03",
    nom: "Laghouat",
    nomAr: "الأغواط",
    zone: 3,
    communes: ["Laghouat", "Aflou", "Ksar El Hirane", "Aïn Madhi", "Hassi R'Mel", "Brida", "El Assafia", "Gueltat Sidi Saad", "Sidi Makhlouf", "Hassi Delaa", "Tadjmout", "Aïn Sidi Ali"],
  },
  {
    code: "04",
    nom: "Oum El Bouaghi",
    nomAr: "أم البواقي",
    zone: 3,
    communes: ["Oum El Bouaghi", "Aïn Beïda", "Aïn M'lila", "Aïn Fakroun", "Aïn Kercha", "Meskiana", "F'kirina", "Sigus", "Souk Naamane", "Dhalaa", "Ksar Sbahi", "Bir Chouhada"],
  },
  {
    code: "05",
    nom: "Batna",
    nomAr: "باتنة",
    zone: 3,
    communes: ["Batna", "Barika", "Merouana", "Arris", "N'Gaous", "Aïn Touta", "Tazoult", "Seggana", "Ras El Aioun", "Timgad", "Chemora", "El Madher", "Bouzina", "Menaa", "Djezzar", "Ouled Si Slimane", "Fesdis", "Seriana", "Theniet El Abed"],
  },
  {
    code: "06",
    nom: "Béjaïa",
    nomAr: "بجاية",
    zone: 2,
    communes: ["Béjaïa", "Akbou", "El Kseur", "Sidi Aïch", "Amizour", "Kherrata", "Tichy", "Aokas", "Souk El Tenine", "Seddouk", "Tazmalt", "Ighil Ali", "Barbacha", "Chemini", "Adekar", "Melbou", "Darguina", "Ouzellaguen", "Timezrit", "Tinebdar"],
  },
  {
    code: "07",
    nom: "Biskra",
    nomAr: "بسكرة",
    zone: 3,
    communes: ["Biskra", "Tolga", "Sidi Okba", "Ouled Djellal", "El Kantara", "Zeribet El Oued", "Ourlal", "Foughala", "Djemorah", "M'Chouneche", "Sidi Khaled", "Chetma", "El Outaya", "Branis"],
  },
  {
    code: "08",
    nom: "Béchar",
    nomAr: "بشار",
    zone: 4,
    communes: ["Béchar", "Kenadsa", "Abadla", "Taghit", "Béni Ounif", "Lahmar", "Boukais", "Mogheul", "Erg Ferradj", "Meridja"],
  },
  {
    code: "09",
    nom: "Blida",
    nomAr: "البليدة",
    zone: 1,
    communes: ["Blida", "Boufarik", "Larbaa", "Mouzaïa", "El Affroun", "Meftah", "Ouled Yaïch", "Bougara", "Beni Mered", "Chiffa", "Soumaa", "Chebli", "Oued Alleug", "Guerrouaou", "Ben Khelil", "Bouinan", "Hammam Melouane", "Djebabra", "Aïn Romana", "Beni Tamou", "Souhane", "Chrea", "Ouled Slama"],
  },
  {
    code: "10",
    nom: "Bouira",
    nomAr: "البويرة",
    zone: 2,
    communes: ["Bouira", "Lakhdaria", "Sour El Ghozlane", "M'Chedallah", "Aïn Bessem", "Bechloul", "Kadiria", "Bordj Okhriss", "El Hachimia", "Haizer", "Chorfa", "Aomar", "Dirah", "Bir Ghbalou", "Raouraoua", "Souk El Khemis", "El Adjiba", "Ath Mansour"],
  },
  {
    code: "11",
    nom: "Tamanrasset",
    nomAr: "تمنراست",
    zone: 4,
    communes: ["Tamanrasset", "Abalessa", "In Ghar", "Idles", "Tazrouk", "In Amguel"],
  },
  {
    code: "12",
    nom: "Tébessa",
    nomAr: "تبسة",
    zone: 3,
    communes: ["Tébessa", "Bir El Ater", "Cheria", "El Aouinet", "Morsott", "El Kouif", "Ouenza", "Hammamet", "Negrine", "El Ma Labiodh", "Bekkaria", "Boulhaf Dir", "Stah Guentis", "El Meridj"],
  },
  {
    code: "13",
    nom: "Tlemcen",
    nomAr: "تلمسان",
    zone: 2,
    communes: ["Tlemcen", "Maghnia", "Remchi", "Ghazaouet", "Nedroma", "Sebdou", "Hennaya", "Chetouane", "Mansourah", "Ouled Mimoun", "Bensekrane", "Beni Boussaid", "Sabra", "Marsa Ben M'Hidi", "Bab El Assa", "Hammam Boughrara", "Aïn Tallout", "Beni Snous", "Souani", "El Fehoul"],
  },
  {
    code: "14",
    nom: "Tiaret",
    nomAr: "تيارت",
    zone: 3,
    communes: ["Tiaret", "Frenda", "Sougueur", "Ksar Chellala", "Mahdia", "Rahouia", "Aïn Deheb", "Dahmouni", "Medroussa", "Hamadia", "Mechraa Safa", "Oued Lilli", "Tousnina", "Serghine", "Aïn Kermes"],
  },
  {
    code: "15",
    nom: "Tizi Ouzou",
    nomAr: "تيزي وزو",
    zone: 2,
    communes: ["Tizi Ouzou", "Azazga", "Draa Ben Khedda", "Tigzirt", "Larbaa Nath Irathen", "Boghni", "Draa El Mizan", "Ouadhias", "Azeffoun", "Ain El Hammam", "Freha", "Makouda", "Tizi Rached", "Beni Douala", "Maatkas", "Mekla", "Tizi Gheniff", "Bouzeguene", "Iferhounene", "Ouaguenoun", "Tadmait", "Sidi Naamane", "Timizart", "Boudjima", "Souk El Thenine", "Aghribs"],
  },
  {
    code: "16",
    nom: "Alger",
    nomAr: "الجزائر",
    zone: 1,
    communes: ["Alger Centre", "Bab El Oued", "Bab Ezzouar", "Hussein Dey", "El Harrach", "Kouba", "Bir Mourad Raïs", "Hydra", "El Biar", "Ben Aknoun", "Cheraga", "Dely Ibrahim", "Ouled Fayet", "Draria", "Birkhadem", "Baraki", "Les Eucalyptus", "Dar El Beïda", "Rouiba", "Reghaïa", "Aïn Taya", "Bordj El Kiffan", "Bordj El Bahri", "El Marsa", "Staoueli", "Zeralda", "Mahelma", "Rahmania", "Souidania", "Baba Hassen", "El Achour", "Saoula", "Douera", "Khraicia", "Tessala El Merdja", "Birtouta", "Sidi Moussa", "Bourouba", "Bachdjarah", "Oued Smar", "Mohammadia", "Bologhine", "Casbah", "Oued Koriche", "Raïs Hamidou", "Hammamet", "Beni Messous", "Bouzareah", "El Madania", "Belouizdad", "Sidi M'Hamed", "El Mouradia", "Gue de Constantine", "Ain Benian", "Herraoua", "Heuraoua", "Sehaoula"],
  },
  {
    code: "17",
    nom: "Djelfa",
    nomAr: "الجلفة",
    zone: 3,
    communes: ["Djelfa", "Aïn Oussera", "Messaad", "Hassi Bahbah", "El Idrissia", "Charef", "Dar Chioukh", "Birine", "Sidi Ladjel", "Aïn El Ibel", "Faidh El Botma", "Zaccar", "Had Sahary", "El Guedid", "Sed Rahal"],
  },
  {
    code: "18",
    nom: "Jijel",
    nomAr: "جيجل",
    zone: 2,
    communes: ["Jijel", "Taher", "El Milia", "Chekfa", "El Aouana", "Ziama Mansouriah", "Settara", "Texenna", "Emir Abdelkader", "Sidi Abdelaziz", "Kaous", "El Ancer", "Djimla", "Boudria Beni Yadjis", "Ouled Yahia Khedrouche"],
  },
  {
    code: "19",
    nom: "Sétif",
    nomAr: "سطيف",
    zone: 2,
    communes: ["Sétif", "El Eulma", "Aïn Oulmene", "Bougaa", "Aïn Arnat", "Aïn Azel", "Bouandas", "Beni Aziz", "Djemila", "Hammam Guergour", "Hammam Sokhna", "Guidjel", "Aïn El Kebira", "Salah Bey", "Aïn Abessa", "Babor", "Beni Ourtilane", "El Ouricia", "Guenzet", "Bir El Arch", "Amoucha", "Ras El Ma", "Tala Ifacene"],
  },
  {
    code: "20",
    nom: "Saïda",
    nomAr: "سعيدة",
    zone: 3,
    communes: ["Saïda", "Aïn El Hadjar", "Youb", "Sidi Boubekeur", "El Hassasna", "Ouled Brahim", "Hounet", "Tircine", "Aïn Soltane", "Doui Thabet", "Moulay Larbi"],
  },
  {
    code: "21",
    nom: "Skikda",
    nomAr: "سكيكدة",
    zone: 2,
    communes: ["Skikda", "Collo", "Azzaba", "El Harrouch", "Tamalous", "Ben Azzouz", "Ramdane Djamel", "Sidi Mezghiche", "El Hadaiek", "Filfila", "Aïn Kechra", "Zitouna", "Ouled Attia", "Bekkouche Lakhdar", "Emdjez Edchich", "Salah Bouchaour", "Kerkera", "Beni Zid"],
  },
  {
    code: "22",
    nom: "Sidi Bel Abbès",
    nomAr: "سيدي بلعباس",
    zone: 2,
    communes: ["Sidi Bel Abbès", "Telagh", "Sfisef", "Ben Badis", "Ras El Ma", "Merine", "Mostefa Ben Brahim", "Tessala", "Sidi Lahcene", "Aïn El Berd", "Moulay Slissen", "Marhoum", "Tenira", "Sidi Ali Benyoub", "Boukhanefis", "Lamtar", "Tabia", "Zerouala"],
  },
  {
    code: "23",
    nom: "Annaba",
    nomAr: "عنابة",
    zone: 2,
    communes: ["Annaba", "El Bouni", "El Hadjar", "Sidi Amar", "Berrahal", "Chetaïbi", "Aïn Berda", "Eulma", "Seraidi", "Oued El Aneb", "Cheurfa", "Treat"],
  },
  {
    code: "24",
    nom: "Guelma",
    nomAr: "قالمة",
    zone: 2,
    communes: ["Guelma", "Oued Zenati", "Bouchegouf", "Hammam Debagh", "Heliopolis", "Aïn Makhlouf", "Khezara", "Hammam N'Bail", "Boumahra Ahmed", "Aïn Hessania", "Medjez Amar", "Nechmaya", "Guelaat Bou Sbaa", "Houari Boumediene"],
  },
  {
    code: "25",
    nom: "Constantine",
    nomAr: "قسنطينة",
    zone: 2,
    communes: ["Constantine", "El Khroub", "Aïn Smara", "Hamma Bouziane", "Didouche Mourad", "Zighoud Youcef", "Beni Hamidane", "Ibn Ziad", "Ouled Rahmoune", "Ain Abid", "Messaoud Boudjeriou"],
  },
  {
    code: "26",
    nom: "Médéa",
    nomAr: "المدية",
    zone: 2,
    communes: ["Médéa", "Berrouaghia", "Ksar El Boukhari", "Tablat", "Ouzera", "El Omaria", "Beni Slimane", "Sidi Naamane", "Chahbounia", "Aïn Boucif", "Ouamri", "Souagui", "Seghouane", "El Azizia", "Bouskene", "Chellalet El Adhaoura", "Bir Ben Laabed", "Draa Essamar"],
  },
  {
    code: "27",
    nom: "Mostaganem",
    nomAr: "مستغانم",
    zone: 2,
    communes: ["Mostaganem", "Sidi Ali", "Aïn Tedeles", "Bouguirat", "Achaacha", "Hassi Mameche", "Mesra", "Sidi Lakhdar", "Kheireddine", "Mazagran", "Sayada", "Fornaka", "Stidia", "Ouled Boughalem", "Hadjadj", "Sour", "Aïn Nouissy", "Khadra"],
  },
  {
    code: "28",
    nom: "M'Sila",
    nomAr: "المسيلة",
    zone: 3,
    communes: ["M'Sila", "Bou Saada", "Sidi Aïssa", "Aïn El Melh", "Magra", "Ouled Derradj", "Hammam Dhalaa", "Chellal", "Khoubana", "Berhoum", "Djebel Messaad", "Aïn El Hadjel", "Medjedel", "Ben Srour", "Sidi Ameur", "El Hamel", "Bir Foda"],
  },
  {
    code: "29",
    nom: "Mascara",
    nomAr: "معسكر",
    zone: 2,
    communes: ["Mascara", "Sig", "Mohammadia", "Ghriss", "Tighennif", "Bouhanifia", "Oued El Abtal", "Hachem", "El Bordj", "Zahana", "Aouf", "Tizi", "Froha", "Matemore", "Oggaz", "Sidi Kada", "El Menaouer", "Ain Fares"],
  },
  {
    code: "30",
    nom: "Ouargla",
    nomAr: "ورقلة",
    zone: 4,
    communes: ["Ouargla", "Hassi Messaoud", "N'Goussa", "Rouissat", "Sidi Khouiled", "El Borma", "Aïn Beida", "El Hadjira", "Taibet", "Hassi Ben Abdellah"],
  },
  {
    code: "31",
    nom: "Oran",
    nomAr: "وهران",
    zone: 1,
    communes: ["Oran", "Bir El Djir", "Es Senia", "Arzew", "Aïn El Turk", "Bethioua", "Gdyel", "Mers El Kebir", "Boutlelis", "Oued Tlelat", "Hassi Bounif", "Hassi Ben Okba", "Sidi Chami", "El Kerma", "Misserghin", "Bousfer", "El Ançor", "Tafraoui", "Aïn El Kerma", "Ben Freha", "Hassi Mefsoukh", "Sidi Ben Yebka", "Marsat El Hadjadj"],
  },
  {
    code: "32",
    nom: "El Bayadh",
    nomAr: "البيض",
    zone: 3,
    communes: ["El Bayadh", "Bougtoub", "Rogassa", "Brezina", "El Abiodh Sidi Cheikh", "Labiodh", "Chellala", "Boualem", "Ghassoul", "Stitten", "Aïn El Orak"],
  },
  {
    code: "33",
    nom: "Illizi",
    nomAr: "إليزي",
    zone: 4,
    communes: ["Illizi", "In Amenas", "Debdeb", "Bordj Omar Driss"],
  },
  {
    code: "34",
    nom: "Bordj Bou Arréridj",
    nomAr: "برج بوعريريج",
    zone: 2,
    communes: ["Bordj Bou Arréridj", "Ras El Oued", "Mansoura", "Medjana", "El Achir", "Bordj Zemoura", "Bir Kasdali", "Djaafra", "El Hamadia", "Sidi Embarek", "Aïn Taghrout", "El Anseur", "Ghilassa", "Tefreg", "Belimour", "Khelil"],
  },
  {
    code: "35",
    nom: "Boumerdès",
    nomAr: "بومرداس",
    zone: 1,
    communes: ["Boumerdès", "Boudouaou", "Bordj Menaïel", "Dellys", "Khemis El Khechna", "Reghaïa", "Naciria", "Isser", "Zemmouri", "Corso", "Thenia", "Ouled Moussa", "Hammedi", "Tidjelabine", "Baghlia", "Si Mustapha", "Chabet El Ameur", "Legata", "Ammal", "Larbatache", "Ouled Aissa", "Beni Amrane", "Sidi Daoud", "Afir"],
  },
  {
    code: "36",
    nom: "El Tarf",
    nomAr: "الطارف",
    zone: 3,
    communes: ["El Tarf", "El Kala", "Bouhadjar", "Ben M'Hidi", "Dréan", "Besbes", "Chebaita Mokhtar", "Bouteldja", "Zitouna", "Aïn El Assel", "Souarekh", "Chihani", "Berrihane", "Echatt"],
  },
  {
    code: "37",
    nom: "Tindouf",
    nomAr: "تندوف",
    zone: 4,
    communes: ["Tindouf", "Oum El Assel"],
  },
  {
    code: "38",
    nom: "Tissemsilt",
    nomAr: "تيسمسيلت",
    zone: 3,
    communes: ["Tissemsilt", "Theniet El Had", "Lardjem", "Bordj Bou Naama", "Khemisti", "Lazharia", "Ammari", "Bordj Emir Abdelkader", "Youssoufia", "Beni Chaib", "Sidi Lantri"],
  },
  {
    code: "39",
    nom: "El Oued",
    nomAr: "الوادي",
    zone: 4,
    communes: ["El Oued", "Guemar", "Debila", "Robbah", "Magrane", "Hassani Abdelkrim", "Reguiba", "Bayadha", "Kouinine", "Hassi Khalifa", "Taleb Larbi", "Trifaoui", "Nakhla", "Oued El Alenda", "Douar El Ma", "Ourmes"],
  },
  {
    code: "40",
    nom: "Khenchela",
    nomAr: "خنشلة",
    zone: 3,
    communes: ["Khenchela", "Kais", "Chechar", "Bouhmama", "El Hamma", "Ouled Rechache", "Babar", "Aïn Touila", "Tamza", "Djellal", "M'Toussa", "Baghai", "Ensigha"],
  },
  {
    code: "41",
    nom: "Souk Ahras",
    nomAr: "سوق أهراس",
    zone: 3,
    communes: ["Souk Ahras", "Sedrata", "M'Daourouch", "Taoura", "Heddada", "Mechroha", "Ouled Driss", "Bir Bouhouche", "Zaarouria", "Khemissa", "Merahna", "Oum El Adhaim", "Sidi Fredj"],
  },
  {
    code: "42",
    nom: "Tipaza",
    nomAr: "تيبازة",
    zone: 1,
    communes: ["Tipaza", "Kolea", "Cherchell", "Hadjout", "Bou Ismaïl", "Fouka", "Douaouda", "Ahmer El Ain", "Damous", "Gouraya", "Menaceur", "Sidi Amar", "Bourkika", "Attatba", "Sidi Rached", "Nador", "Chaiba", "Merad", "Beni Milleuk", "Larhat", "Messelmoun", "Aghbal", "Hadjret Ennous", "Sidi Ghiles"],
  },
  {
    code: "43",
    nom: "Mila",
    nomAr: "ميلة",
    zone: 2,
    communes: ["Mila", "Chelghoum Laïd", "Ferdjioua", "Grarem Gouga", "Teleghma", "Tadjenanet", "Oued Endja", "Rouached", "Sidi Merouane", "Aïn Beida Harriche", "Bouhatem", "Tassadane Haddada", "Terrai Bainen", "Zeghaia", "Sidi Khelifa", "Amira Arras"],
  },
  {
    code: "44",
    nom: "Aïn Defla",
    nomAr: "عين الدفلى",
    zone: 2,
    communes: ["Aïn Defla", "Khemis Miliana", "Miliana", "El Attaf", "Djelida", "Bourached", "Hammam Righa", "Rouina", "El Abadia", "Boumedfaa", "Djendel", "Aïn Lechiakh", "Bathia", "Tiberkanine", "Zeddine", "Aïn Bouyahia", "Sidi Lakhdar", "Bir Ould Khelifa", "Tacheta Zougagha", "Arib"],
  },
  {
    code: "45",
    nom: "Naâma",
    nomAr: "النعامة",
    zone: 3,
    communes: ["Naâma", "Mécheria", "Aïn Sefra", "Moghrar", "Tiout", "Sfissifa", "Asla", "Mekmen Ben Amar", "Djenien Bourezg", "Kasdir", "El Biod"],
  },
  {
    code: "46",
    nom: "Aïn Témouchent",
    nomAr: "عين تموشنت",
    zone: 2,
    communes: ["Aïn Témouchent", "Beni Saf", "Hammam Bou Hadjar", "El Malah", "Aïn El Arbaa", "El Amria", "Oulhaça El Gheraba", "Chaabat El Leham", "Terga", "Sidi Ben Adda", "Aghlal", "Ouled Boudjemaa", "Hassi El Ghella", "Bouzedjar", "El Emir Abdelkader"],
  },
  {
    code: "47",
    nom: "Ghardaïa",
    nomAr: "غرداية",
    zone: 4,
    communes: ["Ghardaïa", "Metlili", "Berriane", "El Guerrara", "Bounoura", "Daya Ben Dahoua", "El Atteuf", "Zelfana", "Sebseb", "Mansoura"],
  },
  {
    code: "48",
    nom: "Relizane",
    nomAr: "غليزان",
    zone: 2,
    communes: ["Relizane", "Oued Rhiou", "Mazouna", "Zemmoura", "Ammi Moussa", "Yellel", "Sidi M'Hamed Ben Ali", "El Matmar", "Djidiouia", "Mendes", "Sidi Khettab", "Belaassel Bouzegza", "Kalaa", "Ain Tarek", "Had Echkalla", "Oued Essalem"],
  },
  {
    code: "49",
    nom: "Timimoun",
    nomAr: "تيميمون",
    zone: 4,
    communes: ["Timimoun", "Aougrout", "Charouine", "Ouled Said", "Metarfa", "Tinerkouk", "Deldoul", "Ksar Kaddour", "Talmine"],
  },
  {
    code: "50",
    nom: "Bordj Badji Mokhtar",
    nomAr: "برج باجي مختار",
    zone: 4,
    communes: ["Bordj Badji Mokhtar", "Timiaouine"],
  },
  {
    code: "51",
    nom: "Ouled Djellal",
    nomAr: "أولاد جلال",
    zone: 4,
    communes: ["Ouled Djellal", "Sidi Khaled", "Doucen", "Ras El Miaad", "Chaiba", "Besbes"],
  },
  {
    code: "52",
    nom: "Béni Abbès",
    nomAr: "بني عباس",
    zone: 4,
    communes: ["Béni Abbès", "Igli", "Kerzaz", "Ouled Khodeir", "Timoudi", "Tamtert", "El Ouata", "Beni Ikhlef"],
  },
  {
    code: "53",
    nom: "In Salah",
    nomAr: "عين صالح",
    zone: 4,
    communes: ["In Salah", "In Ghar", "Foggaret Ezzoua"],
  },
  {
    code: "54",
    nom: "In Guezzam",
    nomAr: "عين قزام",
    zone: 4,
    communes: ["In Guezzam", "Tin Zaouatine"],
  },
  {
    code: "55",
    nom: "Touggourt",
    nomAr: "تقرت",
    zone: 4,
    communes: ["Touggourt", "Temacine", "Megarine", "Nezla", "Zaouia El Abidia", "Tebesbest", "El Hadjira", "Sidi Slimane", "Blidet Amor", "Taibet"],
  },
  {
    code: "56",
    nom: "Djanet",
    nomAr: "جانت",
    zone: 4,
    communes: ["Djanet", "Bordj El Haouas"],
  },
  {
    code: "57",
    nom: "El M'Ghair",
    nomAr: "المغير",
    zone: 4,
    communes: ["El M'Ghair", "Djamaa", "Sidi Amrane", "M'Rara", "Still", "Oum Touyour", "Sidi Khelil"],
  },
  {
    code: "58",
    nom: "El Meniaa",
    nomAr: "المنيعة",
    zone: 4,
    communes: ["El Meniaa", "Hassi Gara", "Hassi Fehal"],
  },
];

/* ------------------------------------------------------------------ acces */

/** Index par code, pour retrouver une wilaya en O(1). */
const PAR_CODE = new Map(WILAYAS.map((w) => [w.code, w]));

export function wilayaParCode(code: string): Wilaya | undefined {
  return PAR_CODE.get(code);
}

/** Communes d'une wilaya, triees. Tableau vide si le code est inconnu. */
export function communesDe(code: string): string[] {
  return wilayaParCode(code)?.communes ?? [];
}

/** Libelle affiche dans le menu deroulant : "16 - Alger". */
export function libelleWilaya(w: Wilaya): string {
  return `${w.code} - ${w.nom}`;
}

/** Tarif de livraison indicatif pour une wilaya. */
export function tarifLivraison(code: string): { domicile: number; stopdesk: number } | null {
  const w = wilayaParCode(code);
  return w ? TARIFS_ZONE[w.zone] : null;
}

export const NOMBRE_COMMUNES = WILAYAS.reduce((n, w) => n + w.communes.length, 0);
