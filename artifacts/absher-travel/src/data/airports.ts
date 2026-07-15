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
