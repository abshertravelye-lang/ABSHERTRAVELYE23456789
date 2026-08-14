export interface Airport {
  iata: string;
  nameAr: string;
  nameEn: string;
  cityAr: string;
  cityEn: string;
  countryAr: string;
  countryEn: string;
  countryCode: string;
  searchKeywords: string[]; // extra search terms
}

export const AIRPORTS: Airport[] = [
  // ═══════════════ مصر ═══════════════
  { iata: "CAI", nameAr: "مطار القاهرة الدولي", nameEn: "Cairo International", cityAr: "القاهرة", cityEn: "Cairo", countryAr: "مصر", countryEn: "Egypt", countryCode: "EG", searchKeywords: ["egypt","مصر","cairo","القاهرة","cai"] },
  { iata: "HRG", nameAr: "مطار الغردقة الدولي", nameEn: "Hurghada International", cityAr: "الغردقة", cityEn: "Hurghada", countryAr: "مصر", countryEn: "Egypt", countryCode: "EG", searchKeywords: ["egypt","مصر","hurghada","الغردقة","hrg"] },
  { iata: "SSH", nameAr: "مطار شرم الشيخ الدولي", nameEn: "Sharm El-Sheikh International", cityAr: "شرم الشيخ", cityEn: "Sharm El-Sheikh", countryAr: "مصر", countryEn: "Egypt", countryCode: "EG", searchKeywords: ["egypt","مصر","sharm","شرم"] },
  { iata: "LXR", nameAr: "مطار الأقصر الدولي", nameEn: "Luxor International", cityAr: "الأقصر", cityEn: "Luxor", countryAr: "مصر", countryEn: "Egypt", countryCode: "EG", searchKeywords: ["egypt","مصر","luxor","الأقصر"] },
  { iata: "ASW", nameAr: "مطار أسوان الدولي", nameEn: "Aswan International", cityAr: "أسوان", cityEn: "Aswan", countryAr: "مصر", countryEn: "Egypt", countryCode: "EG", searchKeywords: ["egypt","مصر","aswan","أسوان"] },
  { iata: "HBE", nameAr: "مطار برج العرب الدولي", nameEn: "Borg El Arab International", cityAr: "الإسكندرية", cityEn: "Alexandria", countryAr: "مصر", countryEn: "Egypt", countryCode: "EG", searchKeywords: ["egypt","مصر","alexandria","الإسكندرية","اسكندرية"] },
  { iata: "RMF", nameAr: "مطار مرسى علم الدولي", nameEn: "Marsa Alam International", cityAr: "مرسى علم", cityEn: "Marsa Alam", countryAr: "مصر", countryEn: "Egypt", countryCode: "EG", searchKeywords: ["egypt","مصر","marsa alam","مرسى علم"] },
  { iata: "HMB", nameAr: "مطار سوهاج الدولي", nameEn: "Sohag International", cityAr: "سوهاج", cityEn: "Sohag", countryAr: "مصر", countryEn: "Egypt", countryCode: "EG", searchKeywords: ["egypt","مصر","sohag","سوهاج"] },
  { iata: "ABU", nameAr: "مطار أبو سمبل", nameEn: "Abu Simbel Airport", cityAr: "أبو سمبل", cityEn: "Abu Simbel", countryAr: "مصر", countryEn: "Egypt", countryCode: "EG", searchKeywords: ["egypt","مصر","abu simbel"] },

  // ═══════════════ المملكة العربية السعودية ═══════════════
  { iata: "RUH", nameAr: "مطار الملك خالد الدولي", nameEn: "King Khalid International", cityAr: "الرياض", cityEn: "Riyadh", countryAr: "المملكة العربية السعودية", countryEn: "Saudi Arabia", countryCode: "SA", searchKeywords: ["saudi","سعودية","riyadh","الرياض","ksa"] },
  { iata: "JED", nameAr: "مطار الملك عبدالعزيز الدولي", nameEn: "King Abdulaziz International", cityAr: "جدة", cityEn: "Jeddah", countryAr: "المملكة العربية السعودية", countryEn: "Saudi Arabia", countryCode: "SA", searchKeywords: ["saudi","سعودية","jeddah","جدة"] },
  { iata: "DMM", nameAr: "مطار الملك فهد الدولي", nameEn: "King Fahd International", cityAr: "الدمام", cityEn: "Dammam", countryAr: "المملكة العربية السعودية", countryEn: "Saudi Arabia", countryCode: "SA", searchKeywords: ["saudi","سعودية","dammam","الدمام"] },
  { iata: "MED", nameAr: "مطار الأمير محمد بن عبدالعزيز", nameEn: "Prince Mohammad bin Abdulaziz", cityAr: "المدينة المنورة", cityEn: "Medina", countryAr: "المملكة العربية السعودية", countryEn: "Saudi Arabia", countryCode: "SA", searchKeywords: ["saudi","سعودية","medina","المدينة","medina"] },
  { iata: "AHB", nameAr: "مطار أبها الدولي", nameEn: "Abha International", cityAr: "أبها", cityEn: "Abha", countryAr: "المملكة العربية السعودية", countryEn: "Saudi Arabia", countryCode: "SA", searchKeywords: ["saudi","سعودية","abha","أبها"] },
  { iata: "TUU", nameAr: "مطار تبوك الإقليمي", nameEn: "Tabuk Regional", cityAr: "تبوك", cityEn: "Tabuk", countryAr: "المملكة العربية السعودية", countryEn: "Saudi Arabia", countryCode: "SA", searchKeywords: ["saudi","سعودية","tabuk","تبوك"] },
  { iata: "GIZ", nameAr: "مطار جيزان الإقليمي", nameEn: "Jizan Regional", cityAr: "جازان", cityEn: "Jizan", countryAr: "المملكة العربية السعودية", countryEn: "Saudi Arabia", countryCode: "SA", searchKeywords: ["saudi","سعودية","jizan","جازان"] },
  { iata: "HAS", nameAr: "مطار حائل الإقليمي", nameEn: "Hail Regional", cityAr: "حائل", cityEn: "Hail", countryAr: "المملكة العربية السعودية", countryEn: "Saudi Arabia", countryCode: "SA", searchKeywords: ["saudi","سعودية","hail","حائل"] },
  { iata: "EAM", nameAr: "مطار نجران", nameEn: "Najran Airport", cityAr: "نجران", cityEn: "Najran", countryAr: "المملكة العربية السعودية", countryEn: "Saudi Arabia", countryCode: "SA", searchKeywords: ["saudi","سعودية","najran","نجران"] },

  // ═══════════════ الإمارات ═══════════════
  { iata: "DXB", nameAr: "مطار دبي الدولي", nameEn: "Dubai International", cityAr: "دبي", cityEn: "Dubai", countryAr: "الإمارات العربية المتحدة", countryEn: "UAE", countryCode: "AE", searchKeywords: ["uae","إمارات","dubai","دبي"] },
  { iata: "AUH", nameAr: "مطار أبوظبي الدولي", nameEn: "Abu Dhabi International", cityAr: "أبوظبي", cityEn: "Abu Dhabi", countryAr: "الإمارات العربية المتحدة", countryEn: "UAE", countryCode: "AE", searchKeywords: ["uae","إمارات","abu dhabi","أبوظبي"] },
  { iata: "SHJ", nameAr: "مطار الشارقة الدولي", nameEn: "Sharjah International", cityAr: "الشارقة", cityEn: "Sharjah", countryAr: "الإمارات العربية المتحدة", countryEn: "UAE", countryCode: "AE", searchKeywords: ["uae","إمارات","sharjah","الشارقة"] },
  { iata: "RKT", nameAr: "مطار رأس الخيمة الدولي", nameEn: "Ras Al Khaimah International", cityAr: "رأس الخيمة", cityEn: "Ras Al Khaimah", countryAr: "الإمارات العربية المتحدة", countryEn: "UAE", countryCode: "AE", searchKeywords: ["uae","إمارات","rak","رأس الخيمة"] },
  { iata: "DWC", nameAr: "مطار آل مكتوم الدولي", nameEn: "Al Maktoum International", cityAr: "دبي", cityEn: "Dubai", countryAr: "الإمارات العربية المتحدة", countryEn: "UAE", countryCode: "AE", searchKeywords: ["uae","إمارات","dubai world central","دبي"] },

  // ═══════════════ الكويت، البحرين، قطر، عُمان ═══════════════
  { iata: "KWI", nameAr: "مطار الكويت الدولي", nameEn: "Kuwait International", cityAr: "الكويت", cityEn: "Kuwait City", countryAr: "الكويت", countryEn: "Kuwait", countryCode: "KW", searchKeywords: ["kuwait","كويت"] },
  { iata: "BAH", nameAr: "مطار البحرين الدولي", nameEn: "Bahrain International", cityAr: "المنامة", cityEn: "Manama", countryAr: "البحرين", countryEn: "Bahrain", countryCode: "BH", searchKeywords: ["bahrain","بحرين"] },
  { iata: "DOH", nameAr: "مطار حمد الدولي", nameEn: "Hamad International", cityAr: "الدوحة", cityEn: "Doha", countryAr: "قطر", countryEn: "Qatar", countryCode: "QA", searchKeywords: ["qatar","قطر","doha","الدوحة"] },
  { iata: "MCT", nameAr: "مطار مسقط الدولي", nameEn: "Muscat International", cityAr: "مسقط", cityEn: "Muscat", countryAr: "سلطنة عُمان", countryEn: "Oman", countryCode: "OM", searchKeywords: ["oman","عمان","muscat","مسقط"] },
  { iata: "SLL", nameAr: "مطار صلالة", nameEn: "Salalah Airport", cityAr: "صلالة", cityEn: "Salalah", countryAr: "سلطنة عُمان", countryEn: "Oman", countryCode: "OM", searchKeywords: ["oman","عمان","salalah","صلالة"] },

  // ═══════════════ تركيا ═══════════════
  { iata: "IST", nameAr: "مطار إسطنبول", nameEn: "Istanbul Airport", cityAr: "إسطنبول", cityEn: "Istanbul", countryAr: "تركيا", countryEn: "Turkey", countryCode: "TR", searchKeywords: ["turkey","تركيا","istanbul","إسطنبول"] },
  { iata: "SAW", nameAr: "مطار إسطنبول صبيحة كوكجن", nameEn: "Istanbul Sabiha Gökçen", cityAr: "إسطنبول", cityEn: "Istanbul", countryAr: "تركيا", countryEn: "Turkey", countryCode: "TR", searchKeywords: ["turkey","تركيا","istanbul","إسطنبول","sabiha"] },
  { iata: "AYT", nameAr: "مطار أنطاليا الدولي", nameEn: "Antalya International", cityAr: "أنطاليا", cityEn: "Antalya", countryAr: "تركيا", countryEn: "Turkey", countryCode: "TR", searchKeywords: ["turkey","تركيا","antalya","أنطاليا"] },
  { iata: "ESB", nameAr: "مطار أنقرة أتاتورك", nameEn: "Ankara Esenboğa", cityAr: "أنقرة", cityEn: "Ankara", countryAr: "تركيا", countryEn: "Turkey", countryCode: "TR", searchKeywords: ["turkey","تركيا","ankara","أنقرة"] },
  { iata: "ADB", nameAr: "مطار إزمير أدنان مندريس", nameEn: "İzmir Adnan Menderes", cityAr: "إزمير", cityEn: "Izmir", countryAr: "تركيا", countryEn: "Turkey", countryCode: "TR", searchKeywords: ["turkey","تركيا","izmir","إزمير"] },

  // ═══════════════ المغرب، تونس، ليبيا ═══════════════
  { iata: "CMN", nameAr: "مطار محمد الخامس", nameEn: "Mohammed V International", cityAr: "الدار البيضاء", cityEn: "Casablanca", countryAr: "المغرب", countryEn: "Morocco", countryCode: "MA", searchKeywords: ["morocco","مغرب","casablanca","الدار البيضاء"] },
  { iata: "RAK", nameAr: "مطار مراكش المنارة", nameEn: "Marrakesh Menara", cityAr: "مراكش", cityEn: "Marrakesh", countryAr: "المغرب", countryEn: "Morocco", countryCode: "MA", searchKeywords: ["morocco","مغرب","marrakesh","مراكش"] },
  { iata: "TUN", nameAr: "مطار تونس قرطاج", nameEn: "Tunis-Carthage International", cityAr: "تونس", cityEn: "Tunis", countryAr: "تونس", countryEn: "Tunisia", countryCode: "TN", searchKeywords: ["tunisia","تونس"] },
  { iata: "TIP", nameAr: "مطار طرابلس الدولي", nameEn: "Tripoli International", cityAr: "طرابلس", cityEn: "Tripoli", countryAr: "ليبيا", countryEn: "Libya", countryCode: "LY", searchKeywords: ["libya","ليبيا","tripoli","طرابلس"] },

  // ═══════════════ الأردن، لبنان، سوريا، العراق ═══════════════
  { iata: "AMM", nameAr: "مطار الملكة علياء الدولي", nameEn: "Queen Alia International", cityAr: "عمّان", cityEn: "Amman", countryAr: "الأردن", countryEn: "Jordan", countryCode: "JO", searchKeywords: ["jordan","أردن","amman","عمان"] },
  { iata: "BEY", nameAr: "مطار رفيق الحريري الدولي", nameEn: "Rafic Hariri International", cityAr: "بيروت", cityEn: "Beirut", countryAr: "لبنان", countryEn: "Lebanon", countryCode: "LB", searchKeywords: ["lebanon","لبنان","beirut","بيروت"] },
  { iata: "BGW", nameAr: "مطار بغداد الدولي", nameEn: "Baghdad International", cityAr: "بغداد", cityEn: "Baghdad", countryAr: "العراق", countryEn: "Iraq", countryCode: "IQ", searchKeywords: ["iraq","عراق","baghdad","بغداد"] },
  { iata: "BSR", nameAr: "مطار البصرة الدولي", nameEn: "Basra International", cityAr: "البصرة", cityEn: "Basra", countryAr: "العراق", countryEn: "Iraq", countryCode: "IQ", searchKeywords: ["iraq","عراق","basra","البصرة"] },

  // ═══════════════ إنجلترا وأوروبا ═══════════════
  { iata: "LHR", nameAr: "مطار هيثرو", nameEn: "London Heathrow", cityAr: "لندن", cityEn: "London", countryAr: "المملكة المتحدة", countryEn: "UK", countryCode: "GB", searchKeywords: ["uk","britain","لندن","london","england","انجلترا","heathrow"] },
  { iata: "LGW", nameAr: "مطار لندن غاتويك", nameEn: "London Gatwick", cityAr: "لندن", cityEn: "London", countryAr: "المملكة المتحدة", countryEn: "UK", countryCode: "GB", searchKeywords: ["uk","لندن","london","gatwick"] },
  { iata: "CDG", nameAr: "مطار شارل ديغول", nameEn: "Paris Charles de Gaulle", cityAr: "باريس", cityEn: "Paris", countryAr: "فرنسا", countryEn: "France", countryCode: "FR", searchKeywords: ["france","فرنسا","paris","باريس"] },
  { iata: "FRA", nameAr: "مطار فرانكفورت", nameEn: "Frankfurt Airport", cityAr: "فرانكفورت", cityEn: "Frankfurt", countryAr: "ألمانيا", countryEn: "Germany", countryCode: "DE", searchKeywords: ["germany","ألمانيا","frankfurt","فرانكفورت"] },
  { iata: "FCO", nameAr: "مطار روما فيوميتشينو", nameEn: "Rome Fiumicino", cityAr: "روما", cityEn: "Rome", countryAr: "إيطاليا", countryEn: "Italy", countryCode: "IT", searchKeywords: ["italy","إيطاليا","rome","روما"] },
  { iata: "BCN", nameAr: "مطار برشلونة الدولي", nameEn: "Barcelona El Prat", cityAr: "برشلونة", cityEn: "Barcelona", countryAr: "إسبانيا", countryEn: "Spain", countryCode: "ES", searchKeywords: ["spain","إسبانيا","barcelona","برشلونة"] },
  { iata: "AMS", nameAr: "مطار شيبهول أمستردام", nameEn: "Amsterdam Schiphol", cityAr: "أمستردام", cityEn: "Amsterdam", countryAr: "هولندا", countryEn: "Netherlands", countryCode: "NL", searchKeywords: ["netherlands","هولندا","amsterdam","أمستردام"] },

  // ═══════════════ آسيا ═══════════════
  { iata: "BKK", nameAr: "مطار سوفارنابهومي", nameEn: "Suvarnabhumi Airport", cityAr: "بانكوك", cityEn: "Bangkok", countryAr: "تايلاند", countryEn: "Thailand", countryCode: "TH", searchKeywords: ["thailand","تايلاند","bangkok","بانكوك"] },
  { iata: "KUL", nameAr: "مطار كوالالمبور الدولي", nameEn: "Kuala Lumpur International", cityAr: "كوالالمبور", cityEn: "Kuala Lumpur", countryAr: "ماليزيا", countryEn: "Malaysia", countryCode: "MY", searchKeywords: ["malaysia","ماليزيا","kuala lumpur","كوالالمبور"] },
  { iata: "SIN", nameAr: "مطار سنغافورة شانغي", nameEn: "Singapore Changi", cityAr: "سنغافورة", cityEn: "Singapore", countryAr: "سنغافورة", countryEn: "Singapore", countryCode: "SG", searchKeywords: ["singapore","سنغافورة"] },
  { iata: "DEL", nameAr: "مطار إنديرا غاندي الدولي", nameEn: "Indira Gandhi International", cityAr: "نيودلهي", cityEn: "New Delhi", countryAr: "الهند", countryEn: "India", countryCode: "IN", searchKeywords: ["india","الهند","delhi","دلهي"] },
  { iata: "MLE", nameAr: "مطار فيليفارو الدولي", nameEn: "Velana International", cityAr: "ماليه", cityEn: "Male", countryAr: "المالديف", countryEn: "Maldives", countryCode: "MV", searchKeywords: ["maldives","المالديف","male","ماليه"] },
  { iata: "NRT", nameAr: "مطار طوكيو ناريتا", nameEn: "Tokyo Narita International", cityAr: "طوكيو", cityEn: "Tokyo", countryAr: "اليابان", countryEn: "Japan", countryCode: "JP", searchKeywords: ["japan","اليابان","tokyo","طوكيو"] },
  { iata: "DPS", nameAr: "مطار نغوراه راي", nameEn: "Ngurah Rai International", cityAr: "بالي", cityEn: "Bali", countryAr: "إندونيسيا", countryEn: "Indonesia", countryCode: "ID", searchKeywords: ["indonesia","إندونيسيا","bali","بالي"] },

  // ═══════════════ اليمن ═══════════════
  { iata: "SAH", nameAr: "مطار صنعاء الدولي", nameEn: "Sana'a International Airport", cityAr: "صنعاء", cityEn: "Sana'a", countryAr: "اليمن", countryEn: "Yemen", countryCode: "YE", searchKeywords: ["yemen","يمن","sanaa","صنعاء","sana'a"] },
  { iata: "ADE", nameAr: "مطار عدن الدولي", nameEn: "Aden International Airport", cityAr: "عدن", cityEn: "Aden", countryAr: "اليمن", countryEn: "Yemen", countryCode: "YE", searchKeywords: ["yemen","يمن","aden","عدن"] },
  { iata: "MKX", nameAr: "مطار الريان المكلا", nameEn: "Mukalla Riyan Airport", cityAr: "المكلا", cityEn: "Mukalla", countryAr: "اليمن", countryEn: "Yemen", countryCode: "YE", searchKeywords: ["yemen","يمن","mukalla","المكلا","ريان"] },
  { iata: "TAI", nameAr: "مطار تعز الدولي", nameEn: "Ta'izz International Airport", cityAr: "تعز", cityEn: "Ta'izz", countryAr: "اليمن", countryEn: "Yemen", countryCode: "YE", searchKeywords: ["yemen","يمن","taizz","تعز","taiz"] },
  { iata: "HOD", nameAr: "مطار الحديدة الدولي", nameEn: "Hodeidah International Airport", cityAr: "الحديدة", cityEn: "Hodeidah", countryAr: "اليمن", countryEn: "Yemen", countryCode: "YE", searchKeywords: ["yemen","يمن","hodeidah","الحديدة","hodeida"] },
  { iata: "GXF", nameAr: "مطار سيئون", nameEn: "Seiyun Airport", cityAr: "سيئون", cityEn: "Seiyun", countryAr: "اليمن", countryEn: "Yemen", countryCode: "YE", searchKeywords: ["yemen","يمن","seiyun","سيئون","حضرموت","hadhramaut"] },
  { iata: "BHN", nameAr: "مطار بيحان", nameEn: "Beihan Airport", cityAr: "بيحان", cityEn: "Beihan", countryAr: "اليمن", countryEn: "Yemen", countryCode: "YE", searchKeywords: ["yemen","يمن","beihan","بيحان"] },
  { iata: "SCT", nameAr: "مطار سقطرى", nameEn: "Socotra Airport", cityAr: "سقطرى", cityEn: "Socotra", countryAr: "اليمن", countryEn: "Yemen", countryCode: "YE", searchKeywords: ["yemen","يمن","socotra","سقطرى","sokotora"] },

  // ═══════════════ المملكة العربية السعودية – مطارات إضافية ═══════════════
  { iata: "TIF", nameAr: "مطار الطائف الدولي", nameEn: "Ta'if International Airport", cityAr: "الطائف", cityEn: "Ta'if", countryAr: "المملكة العربية السعودية", countryEn: "Saudi Arabia", countryCode: "SA", searchKeywords: ["saudi","سعودية","taif","الطائف"] },
  { iata: "ELQ", nameAr: "مطار الأمير نايف الإقليمي", nameEn: "Prince Nayef bin Abdulaziz Regional", cityAr: "بريدة", cityEn: "Buraydah", countryAr: "المملكة العربية السعودية", countryEn: "Saudi Arabia", countryCode: "SA", searchKeywords: ["saudi","سعودية","buraydah","بريدة","qassim","القصيم"] },
  { iata: "HOF", nameAr: "مطار الأحساء الدولي", nameEn: "Al-Ahsa International Airport", cityAr: "الأحساء", cityEn: "Al-Ahsa", countryAr: "المملكة العربية السعودية", countryEn: "Saudi Arabia", countryCode: "SA", searchKeywords: ["saudi","سعودية","ahsa","الأحساء","hofuf","الهفوف"] },
  { iata: "URY", nameAr: "مطار قريات", nameEn: "Gurayat Airport", cityAr: "قريات", cityEn: "Gurayat", countryAr: "المملكة العربية السعودية", countryEn: "Saudi Arabia", countryCode: "SA", searchKeywords: ["saudi","سعودية","gurayat","قريات"] },
  { iata: "AQI", nameAr: "مطار عرعر", nameEn: "Arar Airport", cityAr: "عرعر", cityEn: "Arar", countryAr: "المملكة العربية السعودية", countryEn: "Saudi Arabia", countryCode: "SA", searchKeywords: ["saudi","سعودية","arar","عرعر"] },
  { iata: "WAE", nameAr: "مطار وادي الدواسر", nameEn: "Wadi Al-Dawasir Airport", cityAr: "وادي الدواسر", cityEn: "Wadi Al-Dawasir", countryAr: "المملكة العربية السعودية", countryEn: "Saudi Arabia", countryCode: "SA", searchKeywords: ["saudi","سعودية","wadi dawasir","وادي الدواسر"] },
  { iata: "SHW", nameAr: "مطار شرورة", nameEn: "Sharurah Airport", cityAr: "شرورة", cityEn: "Sharurah", countryAr: "المملكة العربية السعودية", countryEn: "Saudi Arabia", countryCode: "SA", searchKeywords: ["saudi","سعودية","sharurah","شرورة"] },

  // ═══════════════ الجزائر والسودان ═══════════════
  { iata: "ALG", nameAr: "مطار هواري بومدين", nameEn: "Houari Boumediene Airport", cityAr: "الجزائر العاصمة", cityEn: "Algiers", countryAr: "الجزائر", countryEn: "Algeria", countryCode: "DZ", searchKeywords: ["algeria","الجزائر","algiers","الجزائر العاصمة"] },
  { iata: "ORN", nameAr: "مطار أحمد بن بيلة", nameEn: "Oran Es Sénia Airport", cityAr: "وهران", cityEn: "Oran", countryAr: "الجزائر", countryEn: "Algeria", countryCode: "DZ", searchKeywords: ["algeria","الجزائر","oran","وهران"] },
  { iata: "KRT", nameAr: "مطار الخرطوم الدولي", nameEn: "Khartoum Hamad International", cityAr: "الخرطوم", cityEn: "Khartoum", countryAr: "السودان", countryEn: "Sudan", countryCode: "SD", searchKeywords: ["sudan","سودان","khartoum","الخرطوم"] },
  { iata: "PZU", nameAr: "مطار بورتسودان الدولي", nameEn: "Port Sudan New International", cityAr: "بورتسودان", cityEn: "Port Sudan", countryAr: "السودان", countryEn: "Sudan", countryCode: "SD", searchKeywords: ["sudan","سودان","port sudan","بورتسودان"] },

  // ═══════════════ سوريا وفلسطين ═══════════════
  { iata: "DAM", nameAr: "مطار دمشق الدولي", nameEn: "Damascus International Airport", cityAr: "دمشق", cityEn: "Damascus", countryAr: "سوريا", countryEn: "Syria", countryCode: "SY", searchKeywords: ["syria","سوريا","damascus","دمشق"] },
  { iata: "ALP", nameAr: "مطار حلب الدولي", nameEn: "Aleppo International Airport", cityAr: "حلب", cityEn: "Aleppo", countryAr: "سوريا", countryEn: "Syria", countryCode: "SY", searchKeywords: ["syria","سوريا","aleppo","حلب"] },

  // ═══════════════ إيران وباكستان وأفغانستان ═══════════════
  { iata: "IKA", nameAr: "مطار إمام خميني الدولي", nameEn: "Imam Khomeini International", cityAr: "طهران", cityEn: "Tehran", countryAr: "إيران", countryEn: "Iran", countryCode: "IR", searchKeywords: ["iran","إيران","tehran","طهران"] },
  { iata: "KHI", nameAr: "مطار جناح الدولي", nameEn: "Jinnah International Airport", cityAr: "كراتشي", cityEn: "Karachi", countryAr: "باكستان", countryEn: "Pakistan", countryCode: "PK", searchKeywords: ["pakistan","باكستان","karachi","كراتشي"] },
  { iata: "ISB", nameAr: "مطار إسلام آباد الدولي", nameEn: "Islamabad International Airport", cityAr: "إسلام آباد", cityEn: "Islamabad", countryAr: "باكستان", countryEn: "Pakistan", countryCode: "PK", searchKeywords: ["pakistan","باكستان","islamabad","إسلام آباد"] },
  { iata: "LHE", nameAr: "مطار علامة إقبال الدولي", nameEn: "Allama Iqbal International", cityAr: "لاهور", cityEn: "Lahore", countryAr: "باكستان", countryEn: "Pakistan", countryCode: "PK", searchKeywords: ["pakistan","باكستان","lahore","لاهور"] },

  // ═══════════════ جنوب وجنوب شرق آسيا – إضافي ═══════════════
  { iata: "BOM", nameAr: "مطار شاتراباتي شيفاجي", nameEn: "Chhatrapati Shivaji International", cityAr: "مومباي", cityEn: "Mumbai", countryAr: "الهند", countryEn: "India", countryCode: "IN", searchKeywords: ["india","الهند","mumbai","مومباي","bombay","بومباي"] },
  { iata: "MAA", nameAr: "مطار تشيناي الدولي", nameEn: "Chennai International Airport", cityAr: "تشيناي", cityEn: "Chennai", countryAr: "الهند", countryEn: "India", countryCode: "IN", searchKeywords: ["india","الهند","chennai","تشيناي","madras"] },
  { iata: "HYD", nameAr: "مطار حيدر آباد الراجيف غاندي", nameEn: "Rajiv Gandhi International", cityAr: "حيدر آباد", cityEn: "Hyderabad", countryAr: "الهند", countryEn: "India", countryCode: "IN", searchKeywords: ["india","الهند","hyderabad","حيدرآباد"] },
  { iata: "COK", nameAr: "مطار كوتشي الدولي", nameEn: "Cochin International Airport", cityAr: "كوتشي", cityEn: "Kochi", countryAr: "الهند", countryEn: "India", countryCode: "IN", searchKeywords: ["india","الهند","kochi","كوتشي","cochin","كوتشين","kerala","كيرالا"] },
  { iata: "TRV", nameAr: "مطار ترفاندروم الدولي", nameEn: "Thiruvananthapuram International", cityAr: "ترفاندروم", cityEn: "Thiruvananthapuram", countryAr: "الهند", countryEn: "India", countryCode: "IN", searchKeywords: ["india","الهند","trivandrum","ترفاندروم","kerala","كيرالا"] },
  { iata: "DAC", nameAr: "مطار شاه جلال الدولي", nameEn: "Hazrat Shahjalal International", cityAr: "دكا", cityEn: "Dhaka", countryAr: "بنغلاديش", countryEn: "Bangladesh", countryCode: "BD", searchKeywords: ["bangladesh","بنغلاديش","dhaka","دكا"] },
  { iata: "CMB", nameAr: "مطار باندارانايكي الدولي", nameEn: "Bandaranaike International", cityAr: "كولومبو", cityEn: "Colombo", countryAr: "سريلانكا", countryEn: "Sri Lanka", countryCode: "LK", searchKeywords: ["sri lanka","سريلانكا","colombo","كولومبو"] },
  { iata: "CGK", nameAr: "مطار سوكارنو هاتا الدولي", nameEn: "Soekarno-Hatta International", cityAr: "جاكرتا", cityEn: "Jakarta", countryAr: "إندونيسيا", countryEn: "Indonesia", countryCode: "ID", searchKeywords: ["indonesia","إندونيسيا","jakarta","جاكرتا"] },
  { iata: "MNL", nameAr: "مطار نينوي أكينو الدولي", nameEn: "Ninoy Aquino International", cityAr: "مانيلا", cityEn: "Manila", countryAr: "الفلبين", countryEn: "Philippines", countryCode: "PH", searchKeywords: ["philippines","الفلبين","manila","مانيلا"] },
  { iata: "SGN", nameAr: "مطار تان سون نهات", nameEn: "Tan Son Nhat International", cityAr: "هوشي منه", cityEn: "Ho Chi Minh City", countryAr: "فيتنام", countryEn: "Vietnam", countryCode: "VN", searchKeywords: ["vietnam","فيتنام","ho chi minh","هوشي منه","saigon"] },
  { iata: "HAN", nameAr: "مطار نوي باي الدولي", nameEn: "Noi Bai International Airport", cityAr: "هانوي", cityEn: "Hanoi", countryAr: "فيتنام", countryEn: "Vietnam", countryCode: "VN", searchKeywords: ["vietnam","فيتنام","hanoi","هانوي"] },

  // ═══════════════ شرق آسيا ═══════════════
  { iata: "HKG", nameAr: "مطار هونغ كونغ الدولي", nameEn: "Hong Kong International", cityAr: "هونغ كونغ", cityEn: "Hong Kong", countryAr: "هونغ كونغ", countryEn: "Hong Kong", countryCode: "HK", searchKeywords: ["hong kong","هونغ كونغ"] },
  { iata: "ICN", nameAr: "مطار إنتشيون الدولي", nameEn: "Incheon International Airport", cityAr: "سيول", cityEn: "Seoul", countryAr: "كوريا الجنوبية", countryEn: "South Korea", countryCode: "KR", searchKeywords: ["korea","كوريا","seoul","سيول","incheon"] },
  { iata: "PEK", nameAr: "مطار بيجين كابيتال", nameEn: "Beijing Capital International", cityAr: "بيجين", cityEn: "Beijing", countryAr: "الصين", countryEn: "China", countryCode: "CN", searchKeywords: ["china","الصين","beijing","بيجين","بكين"] },
  { iata: "PVG", nameAr: "مطار شنغهاي بودونغ", nameEn: "Shanghai Pudong International", cityAr: "شنغهاي", cityEn: "Shanghai", countryAr: "الصين", countryEn: "China", countryCode: "CN", searchKeywords: ["china","الصين","shanghai","شنغهاي"] },
  { iata: "HND", nameAr: "مطار طوكيو هانيدا", nameEn: "Tokyo Haneda Airport", cityAr: "طوكيو", cityEn: "Tokyo", countryAr: "اليابان", countryEn: "Japan", countryCode: "JP", searchKeywords: ["japan","اليابان","tokyo","طوكيو","haneda"] },
  { iata: "KIX", nameAr: "مطار كانساي الدولي", nameEn: "Kansai International Airport", cityAr: "أوساكا", cityEn: "Osaka", countryAr: "اليابان", countryEn: "Japan", countryCode: "JP", searchKeywords: ["japan","اليابان","osaka","أوساكا","kansai"] },

  // ═══════════════ أوروبا – إضافي ═══════════════
  { iata: "MAD", nameAr: "مطار مدريد بارخاس", nameEn: "Madrid Barajas Airport", cityAr: "مدريد", cityEn: "Madrid", countryAr: "إسبانيا", countryEn: "Spain", countryCode: "ES", searchKeywords: ["spain","إسبانيا","madrid","مدريد"] },
  { iata: "MXP", nameAr: "مطار ميلانو مالبينسا", nameEn: "Milan Malpensa Airport", cityAr: "ميلانو", cityEn: "Milan", countryAr: "إيطاليا", countryEn: "Italy", countryCode: "IT", searchKeywords: ["italy","إيطاليا","milan","ميلانو"] },
  { iata: "MUC", nameAr: "مطار ميونخ", nameEn: "Munich Airport", cityAr: "ميونخ", cityEn: "Munich", countryAr: "ألمانيا", countryEn: "Germany", countryCode: "DE", searchKeywords: ["germany","ألمانيا","munich","ميونخ"] },
  { iata: "ZRH", nameAr: "مطار زيورخ", nameEn: "Zurich Airport", cityAr: "زيورخ", cityEn: "Zurich", countryAr: "سويسرا", countryEn: "Switzerland", countryCode: "CH", searchKeywords: ["switzerland","سويسرا","zurich","زيورخ"] },
  { iata: "VIE", nameAr: "مطار فيينا الدولي", nameEn: "Vienna International Airport", cityAr: "فيينا", cityEn: "Vienna", countryAr: "النمسا", countryEn: "Austria", countryCode: "AT", searchKeywords: ["austria","النمسا","vienna","فيينا"] },
  { iata: "BRU", nameAr: "مطار بروكسل زافنتيم", nameEn: "Brussels Airport", cityAr: "بروكسل", cityEn: "Brussels", countryAr: "بلجيكا", countryEn: "Belgium", countryCode: "BE", searchKeywords: ["belgium","بلجيكا","brussels","بروكسل"] },
  { iata: "ARN", nameAr: "مطار ستوكهولم أرلاندا", nameEn: "Stockholm Arlanda Airport", cityAr: "ستوكهولم", cityEn: "Stockholm", countryAr: "السويد", countryEn: "Sweden", countryCode: "SE", searchKeywords: ["sweden","السويد","stockholm","ستوكهولم"] },
  { iata: "ATH", nameAr: "مطار أثينا إيلفثيريوس فينيزيلوس", nameEn: "Athens Eleftherios Venizelos", cityAr: "أثينا", cityEn: "Athens", countryAr: "اليونان", countryEn: "Greece", countryCode: "GR", searchKeywords: ["greece","اليونان","athens","أثينا"] },
  { iata: "GVA", nameAr: "مطار جنيف الدولي", nameEn: "Geneva International Airport", cityAr: "جنيف", cityEn: "Geneva", countryAr: "سويسرا", countryEn: "Switzerland", countryCode: "CH", searchKeywords: ["switzerland","سويسرا","geneva","جنيف"] },
  { iata: "LIS", nameAr: "مطار لشبونة هومبرتو ديلغادو", nameEn: "Lisbon Humberto Delgado", cityAr: "لشبونة", cityEn: "Lisbon", countryAr: "البرتغال", countryEn: "Portugal", countryCode: "PT", searchKeywords: ["portugal","البرتغال","lisbon","لشبونة"] },

  // ═══════════════ روسيا وجورجيا وأذربيجان ═══════════════
  { iata: "SVO", nameAr: "مطار شيريميتيفو الدولي", nameEn: "Sheremetyevo International", cityAr: "موسكو", cityEn: "Moscow", countryAr: "روسيا", countryEn: "Russia", countryCode: "RU", searchKeywords: ["russia","روسيا","moscow","موسكو"] },
  { iata: "DME", nameAr: "مطار دوموديدوفو", nameEn: "Domodedovo International", cityAr: "موسكو", cityEn: "Moscow", countryAr: "روسيا", countryEn: "Russia", countryCode: "RU", searchKeywords: ["russia","روسيا","moscow","موسكو","domodedovo"] },
  { iata: "TBS", nameAr: "مطار تبليسي الدولي", nameEn: "Tbilisi International Airport", cityAr: "تبليسي", cityEn: "Tbilisi", countryAr: "جورجيا", countryEn: "Georgia", countryCode: "GE", searchKeywords: ["georgia","جورجيا","tbilisi","تبليسي"] },
  { iata: "GYD", nameAr: "مطار حيدر علييف الدولي", nameEn: "Heydar Aliyev International", cityAr: "باكو", cityEn: "Baku", countryAr: "أذربيجان", countryEn: "Azerbaijan", countryCode: "AZ", searchKeywords: ["azerbaijan","أذربيجان","baku","باكو"] },

  // ═══════════════ أمريكا الشمالية ═══════════════
  { iata: "JFK", nameAr: "مطار جون كينيدي الدولي", nameEn: "John F. Kennedy International", cityAr: "نيويورك", cityEn: "New York", countryAr: "الولايات المتحدة", countryEn: "USA", countryCode: "US", searchKeywords: ["usa","أمريكا","new york","نيويورك","jfk"] },
  { iata: "LAX", nameAr: "مطار لوس أنجلوس الدولي", nameEn: "Los Angeles International", cityAr: "لوس أنجلوس", cityEn: "Los Angeles", countryAr: "الولايات المتحدة", countryEn: "USA", countryCode: "US", searchKeywords: ["usa","أمريكا","los angeles","لوس أنجلوس","lax"] },
  { iata: "ORD", nameAr: "مطار شيكاغو أوهير", nameEn: "O'Hare International Airport", cityAr: "شيكاغو", cityEn: "Chicago", countryAr: "الولايات المتحدة", countryEn: "USA", countryCode: "US", searchKeywords: ["usa","أمريكا","chicago","شيكاغو"] },
  { iata: "IAD", nameAr: "مطار واشنطن دالاس", nameEn: "Washington Dulles International", cityAr: "واشنطن", cityEn: "Washington DC", countryAr: "الولايات المتحدة", countryEn: "USA", countryCode: "US", searchKeywords: ["usa","أمريكا","washington","واشنطن","dc"] },
  { iata: "MIA", nameAr: "مطار ميامي الدولي", nameEn: "Miami International Airport", cityAr: "ميامي", cityEn: "Miami", countryAr: "الولايات المتحدة", countryEn: "USA", countryCode: "US", searchKeywords: ["usa","أمريكا","miami","ميامي"] },
  { iata: "YYZ", nameAr: "مطار تورنتو بيرسون الدولي", nameEn: "Toronto Pearson International", cityAr: "تورنتو", cityEn: "Toronto", countryAr: "كندا", countryEn: "Canada", countryCode: "CA", searchKeywords: ["canada","كندا","toronto","تورنتو"] },

  // ═══════════════ أفريقيا ═══════════════
  { iata: "ADD", nameAr: "مطار بولي الدولي", nameEn: "Addis Ababa Bole International", cityAr: "أديس أبابا", cityEn: "Addis Ababa", countryAr: "إثيوبيا", countryEn: "Ethiopia", countryCode: "ET", searchKeywords: ["ethiopia","إثيوبيا","addis ababa","أديس أبابا"] },
  { iata: "NBO", nameAr: "مطار جومو كينياتا الدولي", nameEn: "Jomo Kenyatta International", cityAr: "نيروبي", cityEn: "Nairobi", countryAr: "كينيا", countryEn: "Kenya", countryCode: "KE", searchKeywords: ["kenya","كينيا","nairobi","نيروبي"] },
  { iata: "JNB", nameAr: "مطار أور تامبو الدولي", nameEn: "O.R. Tambo International", cityAr: "جوهانسبرغ", cityEn: "Johannesburg", countryAr: "جنوب أفريقيا", countryEn: "South Africa", countryCode: "ZA", searchKeywords: ["south africa","جنوب أفريقيا","johannesburg","جوهانسبرغ"] },
  { iata: "LOS", nameAr: "مطار مرتلا محمد الدولي", nameEn: "Murtala Muhammed International", cityAr: "لاغوس", cityEn: "Lagos", countryAr: "نيجيريا", countryEn: "Nigeria", countryCode: "NG", searchKeywords: ["nigeria","نيجيريا","lagos","لاغوس"] },
  { iata: "MBA", nameAr: "مطار مومباسا مويي الدولي", nameEn: "Mombasa Moi International", cityAr: "مومباسا", cityEn: "Mombasa", countryAr: "كينيا", countryEn: "Kenya", countryCode: "KE", searchKeywords: ["kenya","كينيا","mombasa","مومباسا"] },

  // ═══════════════ أوروبا الشرقية وتركيا – إضافي ═══════════════
  { iata: "ANK", nameAr: "مطار أنقرة", nameEn: "Ankara Etimesgut Airport", cityAr: "أنقرة", cityEn: "Ankara", countryAr: "تركيا", countryEn: "Turkey", countryCode: "TR", searchKeywords: ["turkey","تركيا","ankara","أنقرة"] },
  { iata: "TZX", nameAr: "مطار طرابزون", nameEn: "Trabzon Airport", cityAr: "طرابزون", cityEn: "Trabzon", countryAr: "تركيا", countryEn: "Turkey", countryCode: "TR", searchKeywords: ["turkey","تركيا","trabzon","طرابزون"] },
  { iata: "GZT", nameAr: "مطار غازي عنتاب أوغاكجيلار", nameEn: "Gaziantep Oğuzeli Airport", cityAr: "غازي عنتاب", cityEn: "Gaziantep", countryAr: "تركيا", countryEn: "Turkey", countryCode: "TR", searchKeywords: ["turkey","تركيا","gaziantep","غازي عنتاب"] },

  // ═══════════════ أوقيانوسيا ═══════════════
  { iata: "SYD", nameAr: "مطار سيدني كينغسفورد سميث", nameEn: "Sydney Kingsford Smith Airport", cityAr: "سيدني", cityEn: "Sydney", countryAr: "أستراليا", countryEn: "Australia", countryCode: "AU", searchKeywords: ["australia","أستراليا","sydney","سيدني"] },
  { iata: "MEL", nameAr: "مطار ملبورن الدولي", nameEn: "Melbourne Airport", cityAr: "ملبورن", cityEn: "Melbourne", countryAr: "أستراليا", countryEn: "Australia", countryCode: "AU", searchKeywords: ["australia","أستراليا","melbourne","ملبورن"] },
];

export function searchAirports(query: string): Airport[] {
  if (!query || query.trim().length < 1) return [];
  const q = query.trim().toLowerCase();

  const results: Array<{ airport: Airport; score: number }> = [];

  for (const airport of AIRPORTS) {
    let score = 0;
    const iata = airport.iata.toLowerCase();
    const cityAr = airport.cityAr.toLowerCase();
    const cityEn = airport.cityEn.toLowerCase();
    const nameAr = airport.nameAr.toLowerCase();
    const nameEn = airport.nameEn.toLowerCase();
    const countryAr = airport.countryAr.toLowerCase();
    const countryEn = airport.countryEn.toLowerCase();

    if (iata === q) score += 100;
    else if (iata.startsWith(q)) score += 80;
    else if (cityAr === q || cityEn === q) score += 90;
    else if (cityAr.startsWith(q) || cityEn.startsWith(q)) score += 70;
    else if (cityAr.includes(q) || cityEn.includes(q)) score += 50;
    else if (countryAr === q || countryEn.toLowerCase() === q) score += 45;
    else if (countryAr.includes(q) || countryEn.toLowerCase().includes(q)) score += 35;
    else if (nameAr.includes(q) || nameEn.includes(q)) score += 30;
    else if (airport.searchKeywords.some(k => k.includes(q))) score += 25;

    if (score > 0) results.push({ airport, score });
  }

  return results
    .sort((a, b) => b.score - a.score)
    .slice(0, 10)
    .map(r => r.airport);
}
