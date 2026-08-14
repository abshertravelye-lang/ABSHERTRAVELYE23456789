export interface Airport {
  iata: string;
  nameAr: string;
  nameEn: string;
  cityAr: string;
  cityEn: string;
  countryAr: string;
  countryEn: string;
  flag: string;
}

export const AIRPORTS: Airport[] = [
  // ── المملكة العربية السعودية ─────────────────────────────────────────────
  { iata:'RUH', nameAr:'مطار الملك خالد الدولي',      nameEn:'King Khalid International Airport',          cityAr:'الرياض',   cityEn:'Riyadh',    countryAr:'السعودية', countryEn:'Saudi Arabia', flag:'🇸🇦' },
  { iata:'JED', nameAr:'مطار الملك عبدالعزيز الدولي', nameEn:'King Abdulaziz International Airport',       cityAr:'جدة',      cityEn:'Jeddah',    countryAr:'السعودية', countryEn:'Saudi Arabia', flag:'🇸🇦' },
  { iata:'MED', nameAr:'مطار الأمير محمد بن عبدالعزيز الدولي', nameEn:'Prince Mohammad Bin Abdulaziz Airport', cityAr:'المدينة المنورة', cityEn:'Medina', countryAr:'السعودية', countryEn:'Saudi Arabia', flag:'🇸🇦' },
  { iata:'DMM', nameAr:'مطار الملك فهد الدولي',       nameEn:'King Fahd International Airport',            cityAr:'الدمام',   cityEn:'Dammam',    countryAr:'السعودية', countryEn:'Saudi Arabia', flag:'🇸🇦' },
  { iata:'AHB', nameAr:'مطار أبها الدولي',             nameEn:'Abha International Airport',                 cityAr:'أبها',     cityEn:'Abha',      countryAr:'السعودية', countryEn:'Saudi Arabia', flag:'🇸🇦' },
  { iata:'TUU', nameAr:'مطار تبوك الإقليمي',           nameEn:'Tabuk Regional Airport',                     cityAr:'تبوك',     cityEn:'Tabuk',     countryAr:'السعودية', countryEn:'Saudi Arabia', flag:'🇸🇦' },
  { iata:'GIZ', nameAr:'مطار جازان الإقليمي',          nameEn:'Jizan Regional Airport',                     cityAr:'جازان',    cityEn:'Jizan',     countryAr:'السعودية', countryEn:'Saudi Arabia', flag:'🇸🇦' },
  { iata:'HOF', nameAr:'مطار الأحساء الدولي',          nameEn:'Al-Ahsa International Airport',              cityAr:'الأحساء',  cityEn:'Al-Ahsa',   countryAr:'السعودية', countryEn:'Saudi Arabia', flag:'🇸🇦' },
  { iata:'ELQ', nameAr:'مطار الغيداء الدولي',          nameEn:'Al Ghaydah Airport',                         cityAr:'القصيم',   cityEn:'Qassim',    countryAr:'السعودية', countryEn:'Saudi Arabia', flag:'🇸🇦' },
  { iata:'TIF', nameAr:'مطار الطائف الدولي',           nameEn:'Taif International Airport',                 cityAr:'الطائف',   cityEn:'Taif',      countryAr:'السعودية', countryEn:'Saudi Arabia', flag:'🇸🇦' },
  { iata:'WAE', nameAr:'مطار وادي الدواسر',             nameEn:'Wadi Al-Dawasir Airport',                    cityAr:'وادي الدواسر', cityEn:'Wadi Al-Dawasir', countryAr:'السعودية', countryEn:'Saudi Arabia', flag:'🇸🇦' },
  { iata:'URY', nameAr:'مطار القريات',                  nameEn:'Qurayyat Airport',                           cityAr:'القريات',  cityEn:'Qurayyat',  countryAr:'السعودية', countryEn:'Saudi Arabia', flag:'🇸🇦' },
  { iata:'HAS', nameAr:'مطار حائل الدولي',              nameEn:'Hail International Airport',                 cityAr:'حائل',     cityEn:'Hail',      countryAr:'السعودية', countryEn:'Saudi Arabia', flag:'🇸🇦' },
  { iata:'RAE', nameAr:'مطار عرعر',                    nameEn:'Arar Airport',                               cityAr:'عرعر',     cityEn:'Arar',      countryAr:'السعودية', countryEn:'Saudi Arabia', flag:'🇸🇦' },
  { iata:'NBT', nameAr:'مطار نيوم',                    nameEn:'Neom Bay Airport',                           cityAr:'نيوم',     cityEn:'Neom',      countryAr:'السعودية', countryEn:'Saudi Arabia', flag:'🇸🇦' },

  // ── الإمارات العربية المتحدة ──────────────────────────────────────────────
  { iata:'DXB', nameAr:'مطار دبي الدولي',              nameEn:'Dubai International Airport',                cityAr:'دبي',      cityEn:'Dubai',     countryAr:'الإمارات', countryEn:'UAE', flag:'🇦🇪' },
  { iata:'AUH', nameAr:'مطار أبوظبي الدولي',           nameEn:'Abu Dhabi International Airport',            cityAr:'أبوظبي',   cityEn:'Abu Dhabi', countryAr:'الإمارات', countryEn:'UAE', flag:'🇦🇪' },
  { iata:'DWC', nameAr:'مطار آل مكتوم الدولي',         nameEn:'Al Maktoum International Airport',           cityAr:'دبي',      cityEn:'Dubai',     countryAr:'الإمارات', countryEn:'UAE', flag:'🇦🇪' },
  { iata:'SHJ', nameAr:'مطار الشارقة الدولي',          nameEn:'Sharjah International Airport',              cityAr:'الشارقة',  cityEn:'Sharjah',   countryAr:'الإمارات', countryEn:'UAE', flag:'🇦🇪' },
  { iata:'AAN', nameAr:'مطار العين الدولي',             nameEn:'Al Ain International Airport',               cityAr:'العين',    cityEn:'Al Ain',    countryAr:'الإمارات', countryEn:'UAE', flag:'🇦🇪' },
  { iata:'RKT', nameAr:'مطار رأس الخيمة الدولي',       nameEn:'Ras Al Khaimah International Airport',       cityAr:'رأس الخيمة', cityEn:'Ras Al Khaimah', countryAr:'الإمارات', countryEn:'UAE', flag:'🇦🇪' },
  { iata:'FJR', nameAr:'مطار الفجيرة الدولي',          nameEn:'Fujairah International Airport',             cityAr:'الفجيرة',  cityEn:'Fujairah',  countryAr:'الإمارات', countryEn:'UAE', flag:'🇦🇪' },

  // ── مصر ──────────────────────────────────────────────────────────────────
  { iata:'CAI', nameAr:'مطار القاهرة الدولي',          nameEn:'Cairo International Airport',                cityAr:'القاهرة',  cityEn:'Cairo',     countryAr:'مصر', countryEn:'Egypt', flag:'🇪🇬' },
  { iata:'HBE', nameAr:'مطار برج العرب الدولي',        nameEn:'Borg El Arab International Airport',         cityAr:'الإسكندرية', cityEn:'Alexandria', countryAr:'مصر', countryEn:'Egypt', flag:'🇪🇬' },
  { iata:'SSH', nameAr:'مطار شرم الشيخ الدولي',        nameEn:'Sharm El Sheikh International Airport',      cityAr:'شرم الشيخ', cityEn:'Sharm El Sheikh', countryAr:'مصر', countryEn:'Egypt', flag:'🇪🇬' },
  { iata:'HRG', nameAr:'مطار الغردقة الدولي',          nameEn:'Hurghada International Airport',             cityAr:'الغردقة',  cityEn:'Hurghada',  countryAr:'مصر', countryEn:'Egypt', flag:'🇪🇬' },
  { iata:'LXR', nameAr:'مطار الأقصر الدولي',           nameEn:'Luxor International Airport',                cityAr:'الأقصر',   cityEn:'Luxor',     countryAr:'مصر', countryEn:'Egypt', flag:'🇪🇬' },
  { iata:'ASW', nameAr:'مطار أسوان الدولي',            nameEn:'Aswan International Airport',                cityAr:'أسوان',    cityEn:'Aswan',     countryAr:'مصر', countryEn:'Egypt', flag:'🇪🇬' },
  { iata:'ABS', nameAr:'مطار أبو سمبل',                nameEn:'Abu Simbel Airport',                         cityAr:'أبو سمبل', cityEn:'Abu Simbel', countryAr:'مصر', countryEn:'Egypt', flag:'🇪🇬' },
  { iata:'TCP', nameAr:'مطار طابا الدولي',              nameEn:'Taba International Airport',                 cityAr:'طابا',     cityEn:'Taba',      countryAr:'مصر', countryEn:'Egypt', flag:'🇪🇬' },
  { iata:'RMF', nameAr:'مطار مرسى علم الدولي',         nameEn:'Marsa Alam International Airport',           cityAr:'مرسى علم', cityEn:'Marsa Alam', countryAr:'مصر', countryEn:'Egypt', flag:'🇪🇬' },

  // ── الكويت ────────────────────────────────────────────────────────────────
  { iata:'KWI', nameAr:'مطار الكويت الدولي',           nameEn:'Kuwait International Airport',               cityAr:'الكويت',   cityEn:'Kuwait City', countryAr:'الكويت', countryEn:'Kuwait', flag:'🇰🇼' },

  // ── قطر ───────────────────────────────────────────────────────────────────
  { iata:'DOH', nameAr:'مطار حمد الدولي',              nameEn:'Hamad International Airport',                cityAr:'الدوحة',   cityEn:'Doha',      countryAr:'قطر', countryEn:'Qatar', flag:'🇶🇦' },

  // ── البحرين ───────────────────────────────────────────────────────────────
  { iata:'BAH', nameAr:'مطار البحرين الدولي',          nameEn:'Bahrain International Airport',              cityAr:'المنامة',  cityEn:'Manama',    countryAr:'البحرين', countryEn:'Bahrain', flag:'🇧🇭' },

  // ── عُمان ─────────────────────────────────────────────────────────────────
  { iata:'MCT', nameAr:'مطار مسقط الدولي',             nameEn:'Muscat International Airport',               cityAr:'مسقط',     cityEn:'Muscat',    countryAr:'عُمان', countryEn:'Oman', flag:'🇴🇲' },
  { iata:'SLL', nameAr:'مطار صلالة',                   nameEn:'Salalah Airport',                            cityAr:'صلالة',    cityEn:'Salalah',   countryAr:'عُمان', countryEn:'Oman', flag:'🇴🇲' },
  { iata:'DQM', nameAr:'مطار الدقم الدولي',            nameEn:'Duqm International Airport',                 cityAr:'الدقم',    cityEn:'Duqm',      countryAr:'عُمان', countryEn:'Oman', flag:'🇴🇲' },
  { iata:'SUH', nameAr:'مطار صور',                     nameEn:'Sur Airport',                                cityAr:'صور',      cityEn:'Sur',       countryAr:'عُمان', countryEn:'Oman', flag:'🇴🇲' },

  // ── الأردن ────────────────────────────────────────────────────────────────
  { iata:'AMM', nameAr:'مطار الملكة علياء الدولي',     nameEn:'Queen Alia International Airport',           cityAr:'عمّان',    cityEn:'Amman',     countryAr:'الأردن', countryEn:'Jordan', flag:'🇯🇴' },
  { iata:'AQJ', nameAr:'مطار الملك الحسين الدولي',     nameEn:'King Hussein International Airport',         cityAr:'العقبة',   cityEn:'Aqaba',     countryAr:'الأردن', countryEn:'Jordan', flag:'🇯🇴' },

  // ── لبنان ─────────────────────────────────────────────────────────────────
  { iata:'BEY', nameAr:'مطار رفيق الحريري الدولي',     nameEn:'Beirut Rafic Hariri International Airport',  cityAr:'بيروت',    cityEn:'Beirut',    countryAr:'لبنان', countryEn:'Lebanon', flag:'🇱🇧' },

  // ── العراق ────────────────────────────────────────────────────────────────
  { iata:'BGW', nameAr:'مطار بغداد الدولي',            nameEn:'Baghdad International Airport',              cityAr:'بغداد',    cityEn:'Baghdad',   countryAr:'العراق', countryEn:'Iraq', flag:'🇮🇶' },
  { iata:'BSR', nameAr:'مطار البصرة الدولي',           nameEn:'Basra International Airport',                cityAr:'البصرة',   cityEn:'Basra',     countryAr:'العراق', countryEn:'Iraq', flag:'🇮🇶' },
  { iata:'EBL', nameAr:'مطار أربيل الدولي',            nameEn:'Erbil International Airport',                cityAr:'أربيل',    cityEn:'Erbil',     countryAr:'العراق', countryEn:'Iraq', flag:'🇮🇶' },
  { iata:'NJF', nameAr:'مطار النجف الأشرف الدولي',     nameEn:'Al Najaf International Airport',             cityAr:'النجف',    cityEn:'Najaf',     countryAr:'العراق', countryEn:'Iraq', flag:'🇮🇶' },
  { iata:'ISU', nameAr:'مطار السليمانية الدولي',       nameEn:'Sulaymaniyah International Airport',         cityAr:'السليمانية', cityEn:'Sulaymaniyah', countryAr:'العراق', countryEn:'Iraq', flag:'🇮🇶' },

  // ── اليمن ─────────────────────────────────────────────────────────────────
  { iata:'ADE', nameAr:'مطار عدن الدولي',              nameEn:'Aden International Airport',                 cityAr:'عدن',      cityEn:'Aden',      countryAr:'اليمن', countryEn:'Yemen', flag:'🇾🇪' },
  { iata:'SAH', nameAr:'مطار صنعاء الدولي',            nameEn:'Sanaa International Airport',                cityAr:'صنعاء',    cityEn:'Sanaa',     countryAr:'اليمن', countryEn:'Yemen', flag:'🇾🇪' },

  // ── تركيا ─────────────────────────────────────────────────────────────────
  { iata:'IST', nameAr:'مطار إسطنبول',                 nameEn:'Istanbul Airport',                           cityAr:'إسطنبول',  cityEn:'Istanbul',  countryAr:'تركيا', countryEn:'Turkey', flag:'🇹🇷' },
  { iata:'SAW', nameAr:'مطار صبيحة كوكجن',             nameEn:'Istanbul Sabiha Gokcen Airport',             cityAr:'إسطنبول',  cityEn:'Istanbul',  countryAr:'تركيا', countryEn:'Turkey', flag:'🇹🇷' },
  { iata:'ADB', nameAr:'مطار أدنان مندريس',            nameEn:'Izmir Adnan Menderes Airport',               cityAr:'إزمير',    cityEn:'Izmir',     countryAr:'تركيا', countryEn:'Turkey', flag:'🇹🇷' },
  { iata:'AYT', nameAr:'مطار أنطاليا',                 nameEn:'Antalya Airport',                            cityAr:'أنطاليا',  cityEn:'Antalya',   countryAr:'تركيا', countryEn:'Turkey', flag:'🇹🇷' },
  { iata:'ESB', nameAr:'مطار أنقرة أتاتورك',           nameEn:'Ankara Esenboga Airport',                    cityAr:'أنقرة',    cityEn:'Ankara',    countryAr:'تركيا', countryEn:'Turkey', flag:'🇹🇷' },
  { iata:'DLM', nameAr:'مطار دالامان',                 nameEn:'Dalaman Airport',                            cityAr:'دالامان',  cityEn:'Dalaman',   countryAr:'تركيا', countryEn:'Turkey', flag:'🇹🇷' },
  { iata:'BJV', nameAr:'مطار بودروم ميلاس',            nameEn:'Milas-Bodrum Airport',                       cityAr:'بودروم',   cityEn:'Bodrum',    countryAr:'تركيا', countryEn:'Turkey', flag:'🇹🇷' },
  { iata:'GZT', nameAr:'مطار غازي عنتاب',              nameEn:'Gaziantep Oguzeli Airport',                  cityAr:'غازي عنتاب', cityEn:'Gaziantep', countryAr:'تركيا', countryEn:'Turkey', flag:'🇹🇷' },
  { iata:'TZX', nameAr:'مطار طرابزون',                 nameEn:'Trabzon Airport',                            cityAr:'طرابزون',  cityEn:'Trabzon',   countryAr:'تركيا', countryEn:'Turkey', flag:'🇹🇷' },

  // ── المغرب ────────────────────────────────────────────────────────────────
  { iata:'CMN', nameAr:'مطار محمد الخامس الدولي',      nameEn:'Mohammed V International Airport',           cityAr:'الدار البيضاء', cityEn:'Casablanca', countryAr:'المغرب', countryEn:'Morocco', flag:'🇲🇦' },
  { iata:'RAK', nameAr:'مطار مراكش المنارة الدولي',    nameEn:'Marrakech Menara Airport',                   cityAr:'مراكش',    cityEn:'Marrakech', countryAr:'المغرب', countryEn:'Morocco', flag:'🇲🇦' },
  { iata:'AGA', nameAr:'مطار أكادير المصاحبة',         nameEn:'Agadir Al Massira Airport',                  cityAr:'أكادير',   cityEn:'Agadir',    countryAr:'المغرب', countryEn:'Morocco', flag:'🇲🇦' },
  { iata:'FEZ', nameAr:'مطار فاس سايس',                nameEn:'Fes-Sais Airport',                           cityAr:'فاس',      cityEn:'Fes',       countryAr:'المغرب', countryEn:'Morocco', flag:'🇲🇦' },
  { iata:'TNG', nameAr:'مطار طنجة ابن بطوطة',          nameEn:'Ibn Battouta Airport',                       cityAr:'طنجة',     cityEn:'Tangier',   countryAr:'المغرب', countryEn:'Morocco', flag:'🇲🇦' },
  { iata:'OUD', nameAr:'مطار وجدة أنجاد',              nameEn:'Oujda Angads Airport',                       cityAr:'وجدة',     cityEn:'Oujda',     countryAr:'المغرب', countryEn:'Morocco', flag:'🇲🇦' },
  { iata:'RBA', nameAr:'مطار الرباط سلا',              nameEn:'Rabat-Salé Airport',                         cityAr:'الرباط',   cityEn:'Rabat',     countryAr:'المغرب', countryEn:'Morocco', flag:'🇲🇦' },

  // ── تونس ──────────────────────────────────────────────────────────────────
  { iata:'TUN', nameAr:'مطار تونس قرطاج',              nameEn:'Tunis-Carthage International Airport',       cityAr:'تونس',     cityEn:'Tunis',     countryAr:'تونس', countryEn:'Tunisia', flag:'🇹🇳' },
  { iata:'SFA', nameAr:'مطار صفاقس تاليل',             nameEn:'Sfax-Thyna International Airport',           cityAr:'صفاقس',    cityEn:'Sfax',      countryAr:'تونس', countryEn:'Tunisia', flag:'🇹🇳' },
  { iata:'MIR', nameAr:'مطار المنستير',                nameEn:'Monastir Habib Bourguiba Airport',           cityAr:'المنستير', cityEn:'Monastir',  countryAr:'تونس', countryEn:'Tunisia', flag:'🇹🇳' },
  { iata:'DJE', nameAr:'مطار جربة',                    nameEn:'Djerba-Zarzis Airport',                      cityAr:'جربة',     cityEn:'Djerba',    countryAr:'تونس', countryEn:'Tunisia', flag:'🇹🇳' },
  { iata:'NBE', nameAr:'مطار المبروك',                 nameEn:'Enfidha-Hammamet International Airport',     cityAr:'الحمامات', cityEn:'Hammamet',  countryAr:'تونس', countryEn:'Tunisia', flag:'🇹🇳' },

  // ── الجزائر ───────────────────────────────────────────────────────────────
  { iata:'ALG', nameAr:'مطار هواري بومدين',            nameEn:'Algiers Houari Boumediene Airport',          cityAr:'الجزائر',  cityEn:'Algiers',   countryAr:'الجزائر', countryEn:'Algeria', flag:'🇩🇿' },
  { iata:'ORN', nameAr:'مطار وهران أحمد بن بلة',       nameEn:'Oran Ahmed Ben Bella Airport',               cityAr:'وهران',    cityEn:'Oran',      countryAr:'الجزائر', countryEn:'Algeria', flag:'🇩🇿' },
  { iata:'CZL', nameAr:'مطار قسنطينة',                 nameEn:'Constantine Ain El Bey Airport',             cityAr:'قسنطينة',  cityEn:'Constantine', countryAr:'الجزائر', countryEn:'Algeria', flag:'🇩🇿' },
  { iata:'AAE', nameAr:'مطار عنابة',                   nameEn:'Annaba Rabah Bitat Airport',                 cityAr:'عنابة',    cityEn:'Annaba',    countryAr:'الجزائر', countryEn:'Algeria', flag:'🇩🇿' },

  // ── ليبيا ─────────────────────────────────────────────────────────────────
  { iata:'TIP', nameAr:'مطار طرابلس الدولي',           nameEn:'Tripoli International Airport',              cityAr:'طرابلس',   cityEn:'Tripoli',   countryAr:'ليبيا', countryEn:'Libya', flag:'🇱🇾' },
  { iata:'BEN', nameAr:'مطار بنغازي',                  nameEn:'Benghazi Benina Airport',                    cityAr:'بنغازي',   cityEn:'Benghazi',  countryAr:'ليبيا', countryEn:'Libya', flag:'🇱🇾' },

  // ── السودان ───────────────────────────────────────────────────────────────
  { iata:'KRT', nameAr:'مطار الخرطوم',                 nameEn:'Khartoum International Airport',             cityAr:'الخرطوم',  cityEn:'Khartoum',  countryAr:'السودان', countryEn:'Sudan', flag:'🇸🇩' },

  // ── باكستان ───────────────────────────────────────────────────────────────
  { iata:'KHI', nameAr:'مطار جناح الدولي',             nameEn:'Jinnah International Airport',               cityAr:'كراتشي',   cityEn:'Karachi',   countryAr:'باكستان', countryEn:'Pakistan', flag:'🇵🇰' },
  { iata:'LHE', nameAr:'مطار علامه إقبال الدولي',      nameEn:'Allama Iqbal International Airport',         cityAr:'لاهور',    cityEn:'Lahore',    countryAr:'باكستان', countryEn:'Pakistan', flag:'🇵🇰' },
  { iata:'ISB', nameAr:'مطار إسلام أباد الدولي',       nameEn:'Islamabad International Airport',            cityAr:'إسلام آباد', cityEn:'Islamabad', countryAr:'باكستان', countryEn:'Pakistan', flag:'🇵🇰' },
  { iata:'PEW', nameAr:'مطار بيشاور',                  nameEn:'Bacha Khan International Airport',           cityAr:'بيشاور',   cityEn:'Peshawar',  countryAr:'باكستان', countryEn:'Pakistan', flag:'🇵🇰' },
  { iata:'MUX', nameAr:'مطار ملتان الدولي',            nameEn:'Multan International Airport',               cityAr:'ملتان',    cityEn:'Multan',    countryAr:'باكستان', countryEn:'Pakistan', flag:'🇵🇰' },
  { iata:'SKT', nameAr:'مطار سيالكوت الدولي',          nameEn:'Sialkot International Airport',              cityAr:'سيالكوت',  cityEn:'Sialkot',   countryAr:'باكستان', countryEn:'Pakistan', flag:'🇵🇰' },

  // ── الهند ─────────────────────────────────────────────────────────────────
  { iata:'DEL', nameAr:'مطار إنديرا غاندي الدولي',     nameEn:'Indira Gandhi International Airport',        cityAr:'دلهي',     cityEn:'Delhi',     countryAr:'الهند', countryEn:'India', flag:'🇮🇳' },
  { iata:'BOM', nameAr:'مطار شاتراباتي شيفاجي',        nameEn:'Chhatrapati Shivaji Maharaj Airport',        cityAr:'مومباي',   cityEn:'Mumbai',    countryAr:'الهند', countryEn:'India', flag:'🇮🇳' },
  { iata:'MAA', nameAr:'مطار تشيناي الدولي',           nameEn:'Chennai International Airport',              cityAr:'تشيناي',   cityEn:'Chennai',   countryAr:'الهند', countryEn:'India', flag:'🇮🇳' },
  { iata:'BLR', nameAr:'مطار بنغالور الدولي',          nameEn:'Kempegowda International Airport',           cityAr:'بنغالور',  cityEn:'Bangalore', countryAr:'الهند', countryEn:'India', flag:'🇮🇳' },
  { iata:'CCU', nameAr:'مطار نيتاجي سوباش شاندرا',     nameEn:'Netaji Subhash Chandra Bose Airport',        cityAr:'كولكاتا',  cityEn:'Kolkata',   countryAr:'الهند', countryEn:'India', flag:'🇮🇳' },
  { iata:'HYD', nameAr:'مطار حيدر آباد الدولي',        nameEn:'Rajiv Gandhi International Airport',         cityAr:'حيدر آباد', cityEn:'Hyderabad', countryAr:'الهند', countryEn:'India', flag:'🇮🇳' },
  { iata:'COK', nameAr:'مطار كوتشي الدولي',            nameEn:'Cochin International Airport',               cityAr:'كوتشي',    cityEn:'Kochi',     countryAr:'الهند', countryEn:'India', flag:'🇮🇳' },
  { iata:'AMD', nameAr:'مطار أحمد آباد الدولي',        nameEn:'Sardar Vallabhbhai Patel International',     cityAr:'أحمد آباد', cityEn:'Ahmedabad', countryAr:'الهند', countryEn:'India', flag:'🇮🇳' },
  { iata:'TRV', nameAr:'مطار تريفاندروم الدولي',       nameEn:'Trivandrum International Airport',           cityAr:'تيروفانانتابوروم', cityEn:'Thiruvananthapuram', countryAr:'الهند', countryEn:'India', flag:'🇮🇳' },

  // ── المملكة المتحدة ───────────────────────────────────────────────────────
  { iata:'LHR', nameAr:'مطار لندن هيثرو',              nameEn:'London Heathrow Airport',                    cityAr:'لندن',     cityEn:'London',    countryAr:'المملكة المتحدة', countryEn:'UK', flag:'🇬🇧' },
  { iata:'LGW', nameAr:'مطار لندن غاتويك',             nameEn:'London Gatwick Airport',                     cityAr:'لندن',     cityEn:'London',    countryAr:'المملكة المتحدة', countryEn:'UK', flag:'🇬🇧' },
  { iata:'STN', nameAr:'مطار لندن ستانستد',            nameEn:'London Stansted Airport',                    cityAr:'لندن',     cityEn:'London',    countryAr:'المملكة المتحدة', countryEn:'UK', flag:'🇬🇧' },
  { iata:'MAN', nameAr:'مطار مانشستر',                 nameEn:'Manchester Airport',                         cityAr:'مانشستر',  cityEn:'Manchester', countryAr:'المملكة المتحدة', countryEn:'UK', flag:'🇬🇧' },
  { iata:'BHX', nameAr:'مطار برمنغهام',                nameEn:'Birmingham Airport',                         cityAr:'برمنغهام', cityEn:'Birmingham', countryAr:'المملكة المتحدة', countryEn:'UK', flag:'🇬🇧' },
  { iata:'EDI', nameAr:'مطار إدنبرة',                  nameEn:'Edinburgh Airport',                          cityAr:'إدنبرة',   cityEn:'Edinburgh', countryAr:'المملكة المتحدة', countryEn:'UK', flag:'🇬🇧' },
  { iata:'GLA', nameAr:'مطار غلاسكو',                  nameEn:'Glasgow Airport',                            cityAr:'غلاسكو',   cityEn:'Glasgow',   countryAr:'المملكة المتحدة', countryEn:'UK', flag:'🇬🇧' },

  // ── فرنسا ─────────────────────────────────────────────────────────────────
  { iata:'CDG', nameAr:'مطار شارل ديغول الدولي',       nameEn:'Charles de Gaulle International Airport',    cityAr:'باريس',    cityEn:'Paris',     countryAr:'فرنسا', countryEn:'France', flag:'🇫🇷' },
  { iata:'ORY', nameAr:'مطار أورلي',                   nameEn:'Paris Orly Airport',                         cityAr:'باريس',    cityEn:'Paris',     countryAr:'فرنسا', countryEn:'France', flag:'🇫🇷' },
  { iata:'NCE', nameAr:'مطار نيس الدولي',              nameEn:'Nice Côte d\'Azur Airport',                  cityAr:'نيس',      cityEn:'Nice',      countryAr:'فرنسا', countryEn:'France', flag:'🇫🇷' },
  { iata:'LYS', nameAr:'مطار ليون سان إكزوبيري',       nameEn:'Lyon-Saint Exupéry Airport',                 cityAr:'ليون',     cityEn:'Lyon',      countryAr:'فرنسا', countryEn:'France', flag:'🇫🇷' },
  { iata:'MRS', nameAr:'مطار مارسيليا برونياس',        nameEn:'Marseille Provence Airport',                 cityAr:'مارسيليا', cityEn:'Marseille', countryAr:'فرنسا', countryEn:'France', flag:'🇫🇷' },

  // ── ألمانيا ────────────────────────────────────────────────────────────────
  { iata:'FRA', nameAr:'مطار فرانكفورت الدولي',        nameEn:'Frankfurt Airport',                          cityAr:'فرانكفورت', cityEn:'Frankfurt', countryAr:'ألمانيا', countryEn:'Germany', flag:'🇩🇪' },
  { iata:'MUC', nameAr:'مطار ميونيخ',                  nameEn:'Munich Airport',                             cityAr:'ميونيخ',   cityEn:'Munich',    countryAr:'ألمانيا', countryEn:'Germany', flag:'🇩🇪' },
  { iata:'BER', nameAr:'مطار برلين براندنبورغ',        nameEn:'Berlin Brandenburg Airport',                 cityAr:'برلين',    cityEn:'Berlin',    countryAr:'ألمانيا', countryEn:'Germany', flag:'🇩🇪' },
  { iata:'DUS', nameAr:'مطار دوسلدورف',                nameEn:'Düsseldorf Airport',                         cityAr:'دوسلدورف', cityEn:'Dusseldorf', countryAr:'ألمانيا', countryEn:'Germany', flag:'🇩🇪' },
  { iata:'HAM', nameAr:'مطار هامبورغ',                 nameEn:'Hamburg Airport',                            cityAr:'هامبورغ',  cityEn:'Hamburg',   countryAr:'ألمانيا', countryEn:'Germany', flag:'🇩🇪' },
  { iata:'CGN', nameAr:'مطار كولونيا بون',             nameEn:'Cologne Bonn Airport',                       cityAr:'كولونيا',  cityEn:'Cologne',   countryAr:'ألمانيا', countryEn:'Germany', flag:'🇩🇪' },
  { iata:'STR', nameAr:'مطار شتوتغارت',                nameEn:'Stuttgart Airport',                          cityAr:'شتوتغارت', cityEn:'Stuttgart', countryAr:'ألمانيا', countryEn:'Germany', flag:'🇩🇪' },

  // ── هولندا ────────────────────────────────────────────────────────────────
  { iata:'AMS', nameAr:'مطار أمستردام سخيبول',         nameEn:'Amsterdam Airport Schiphol',                 cityAr:'أمستردام', cityEn:'Amsterdam', countryAr:'هولندا', countryEn:'Netherlands', flag:'🇳🇱' },

  // ── إيطاليا ───────────────────────────────────────────────────────────────
  { iata:'FCO', nameAr:'مطار روما فيوميتشينو',         nameEn:'Rome Fiumicino Airport',                     cityAr:'روما',     cityEn:'Rome',      countryAr:'إيطاليا', countryEn:'Italy', flag:'🇮🇹' },
  { iata:'MXP', nameAr:'مطار ميلانو ماالبينسا',        nameEn:'Milan Malpensa Airport',                     cityAr:'ميلانو',   cityEn:'Milan',     countryAr:'إيطاليا', countryEn:'Italy', flag:'🇮🇹' },
  { iata:'VCE', nameAr:'مطار البندقية',                nameEn:'Venice Marco Polo Airport',                  cityAr:'البندقية', cityEn:'Venice',    countryAr:'إيطاليا', countryEn:'Italy', flag:'🇮🇹' },
  { iata:'NAP', nameAr:'مطار نابولي',                  nameEn:'Naples International Airport',               cityAr:'نابولي',   cityEn:'Naples',    countryAr:'إيطاليا', countryEn:'Italy', flag:'🇮🇹' },

  // ── إسبانيا ───────────────────────────────────────────────────────────────
  { iata:'MAD', nameAr:'مطار مدريد بَراخاس',           nameEn:'Adolfo Suárez Madrid-Barajas Airport',       cityAr:'مدريد',    cityEn:'Madrid',    countryAr:'إسبانيا', countryEn:'Spain', flag:'🇪🇸' },
  { iata:'BCN', nameAr:'مطار برشلونة',                 nameEn:'Barcelona El Prat Airport',                  cityAr:'برشلونة',  cityEn:'Barcelona', countryAr:'إسبانيا', countryEn:'Spain', flag:'🇪🇸' },
  { iata:'AGP', nameAr:'مطار ملقة كوستا ديل سول',      nameEn:'Málaga-Costa del Sol Airport',               cityAr:'ملقة',     cityEn:'Malaga',    countryAr:'إسبانيا', countryEn:'Spain', flag:'🇪🇸' },
  { iata:'PMI', nameAr:'مطار مايوركا',                 nameEn:'Palma de Mallorca Airport',                  cityAr:'مايوركا',  cityEn:'Palma',     countryAr:'إسبانيا', countryEn:'Spain', flag:'🇪🇸' },
  { iata:'TFS', nameAr:'مطار تينيريفي جنوب',           nameEn:'Tenerife South Airport',                     cityAr:'تينيريفي', cityEn:'Tenerife',  countryAr:'إسبانيا', countryEn:'Spain', flag:'🇪🇸' },

  // ── اليونان ───────────────────────────────────────────────────────────────
  { iata:'ATH', nameAr:'مطار أثينا الدولي',            nameEn:'Athens International Airport',               cityAr:'أثينا',    cityEn:'Athens',    countryAr:'اليونان', countryEn:'Greece', flag:'🇬🇷' },
  { iata:'HER', nameAr:'مطار هيراكليون نيكوس كازانتزاكيس', nameEn:'Heraklion International Airport',       cityAr:'هيراكليون', cityEn:'Heraklion', countryAr:'اليونان', countryEn:'Greece', flag:'🇬🇷' },
  { iata:'RHO', nameAr:'مطار رودس',                    nameEn:'Rhodes International Airport',               cityAr:'رودس',     cityEn:'Rhodes',    countryAr:'اليونان', countryEn:'Greece', flag:'🇬🇷' },
  { iata:'CFU', nameAr:'مطار كورفو',                   nameEn:'Corfu International Airport',                cityAr:'كورفو',    cityEn:'Corfu',     countryAr:'اليونان', countryEn:'Greece', flag:'🇬🇷' },

  // ── قبرص ──────────────────────────────────────────────────────────────────
  { iata:'LCA', nameAr:'مطار لارنكا الدولي',           nameEn:'Larnaca International Airport',              cityAr:'لارنكا',   cityEn:'Larnaca',   countryAr:'قبرص', countryEn:'Cyprus', flag:'🇨🇾' },
  { iata:'PFO', nameAr:'مطار بافوس الدولي',            nameEn:'Paphos International Airport',               cityAr:'بافوس',    cityEn:'Paphos',    countryAr:'قبرص', countryEn:'Cyprus', flag:'🇨🇾' },

  // ── سويسرا ────────────────────────────────────────────────────────────────
  { iata:'ZRH', nameAr:'مطار زيورخ',                   nameEn:'Zürich Airport',                             cityAr:'زيورخ',    cityEn:'Zurich',    countryAr:'سويسرا', countryEn:'Switzerland', flag:'🇨🇭' },
  { iata:'GVA', nameAr:'مطار جنيف',                    nameEn:'Geneva Airport',                             cityAr:'جنيف',     cityEn:'Geneva',    countryAr:'سويسرا', countryEn:'Switzerland', flag:'🇨🇭' },

  // ── النمسا ────────────────────────────────────────────────────────────────
  { iata:'VIE', nameAr:'مطار فيينا الدولي',            nameEn:'Vienna International Airport',               cityAr:'فيينا',    cityEn:'Vienna',    countryAr:'النمسا', countryEn:'Austria', flag:'🇦🇹' },

  // ── بلجيكا ────────────────────────────────────────────────────────────────
  { iata:'BRU', nameAr:'مطار بروكسل',                  nameEn:'Brussels Airport',                           cityAr:'بروكسل',   cityEn:'Brussels',  countryAr:'بلجيكا', countryEn:'Belgium', flag:'🇧🇪' },

  // ── البرتغال ──────────────────────────────────────────────────────────────
  { iata:'LIS', nameAr:'مطار لشبونة',                  nameEn:'Lisbon Humberto Delgado Airport',            cityAr:'لشبونة',   cityEn:'Lisbon',    countryAr:'البرتغال', countryEn:'Portugal', flag:'🇵🇹' },
  { iata:'OPO', nameAr:'مطار بورتو',                   nameEn:'Francisco Sá Carneiro Airport',              cityAr:'بورتو',    cityEn:'Porto',     countryAr:'البرتغال', countryEn:'Portugal', flag:'🇵🇹' },

  // ── السويد ────────────────────────────────────────────────────────────────
  { iata:'ARN', nameAr:'مطار ستوكهولم أرلاندا',        nameEn:'Stockholm Arlanda Airport',                  cityAr:'ستوكهولم', cityEn:'Stockholm', countryAr:'السويد', countryEn:'Sweden', flag:'🇸🇪' },

  // ── النرويج ───────────────────────────────────────────────────────────────
  { iata:'OSL', nameAr:'مطار أوسلو',                   nameEn:'Oslo Gardermoen Airport',                    cityAr:'أوسلو',    cityEn:'Oslo',      countryAr:'النرويج', countryEn:'Norway', flag:'🇳🇴' },

  // ── الدنمارك ──────────────────────────────────────────────────────────────
  { iata:'CPH', nameAr:'مطار كوبنهاغن',                nameEn:'Copenhagen Airport',                         cityAr:'كوبنهاغن', cityEn:'Copenhagen', countryAr:'الدنمارك', countryEn:'Denmark', flag:'🇩🇰' },

  // ── روسيا ─────────────────────────────────────────────────────────────────
  { iata:'SVO', nameAr:'مطار شيريميتيفو الدولي',       nameEn:'Sheremetyevo International Airport',         cityAr:'موسكو',    cityEn:'Moscow',    countryAr:'روسيا', countryEn:'Russia', flag:'🇷🇺' },
  { iata:'DME', nameAr:'مطار دوموديدوفو',              nameEn:'Domodedovo International Airport',           cityAr:'موسكو',    cityEn:'Moscow',    countryAr:'روسيا', countryEn:'Russia', flag:'🇷🇺' },
  { iata:'VKO', nameAr:'مطار فنوكوفو',                 nameEn:'Vnukovo International Airport',              cityAr:'موسكو',    cityEn:'Moscow',    countryAr:'روسيا', countryEn:'Russia', flag:'🇷🇺' },
  { iata:'LED', nameAr:'مطار بولكوفو',                 nameEn:'Pulkovo Airport',                            cityAr:'سانت بطرسبرغ', cityEn:'Saint Petersburg', countryAr:'روسيا', countryEn:'Russia', flag:'🇷🇺' },

  // ── تايلاند ───────────────────────────────────────────────────────────────
  { iata:'BKK', nameAr:'مطار سوفارنابومي',             nameEn:'Suvarnabhumi Airport',                       cityAr:'بانكوك',   cityEn:'Bangkok',   countryAr:'تايلاند', countryEn:'Thailand', flag:'🇹🇭' },
  { iata:'DMK', nameAr:'مطار دون مواينغ',              nameEn:'Don Mueang International Airport',           cityAr:'بانكوك',   cityEn:'Bangkok',   countryAr:'تايلاند', countryEn:'Thailand', flag:'🇹🇭' },
  { iata:'HKT', nameAr:'مطار فوكيت',                   nameEn:'Phuket International Airport',               cityAr:'فوكيت',    cityEn:'Phuket',    countryAr:'تايلاند', countryEn:'Thailand', flag:'🇹🇭' },
  { iata:'CNX', nameAr:'مطار تشيانغ ماي',              nameEn:'Chiang Mai International Airport',           cityAr:'تشيانغ ماي', cityEn:'Chiang Mai', countryAr:'تايلاند', countryEn:'Thailand', flag:'🇹🇭' },

  // ── ماليزيا ───────────────────────────────────────────────────────────────
  { iata:'KUL', nameAr:'مطار كوالالمبور الدولي',       nameEn:'Kuala Lumpur International Airport',         cityAr:'كوالالمبور', cityEn:'Kuala Lumpur', countryAr:'ماليزيا', countryEn:'Malaysia', flag:'🇲🇾' },
  { iata:'PEN', nameAr:'مطار بينانغ الدولي',           nameEn:'Penang International Airport',               cityAr:'بينانغ',   cityEn:'Penang',    countryAr:'ماليزيا', countryEn:'Malaysia', flag:'🇲🇾' },
  { iata:'BKI', nameAr:'مطار كوتا كينابالو',           nameEn:'Kota Kinabalu International Airport',        cityAr:'كوتا كينابالو', cityEn:'Kota Kinabalu', countryAr:'ماليزيا', countryEn:'Malaysia', flag:'🇲🇾' },

  // ── سنغافورة ──────────────────────────────────────────────────────────────
  { iata:'SIN', nameAr:'مطار سنغافورة تشانغي',         nameEn:'Singapore Changi Airport',                   cityAr:'سنغافورة', cityEn:'Singapore', countryAr:'سنغافورة', countryEn:'Singapore', flag:'🇸🇬' },

  // ── إندونيسيا ─────────────────────────────────────────────────────────────
  { iata:'CGK', nameAr:'مطار سوكارنو هاتا الدولي',     nameEn:'Soekarno-Hatta International Airport',       cityAr:'جاكرتا',   cityEn:'Jakarta',   countryAr:'إندونيسيا', countryEn:'Indonesia', flag:'🇮🇩' },
  { iata:'DPS', nameAr:'مطار نغوراه راي الدولي',       nameEn:'Ngurah Rai International Airport',           cityAr:'بالي',     cityEn:'Bali',      countryAr:'إندونيسيا', countryEn:'Indonesia', flag:'🇮🇩' },

  // ── كوريا الجنوبية ────────────────────────────────────────────────────────
  { iata:'ICN', nameAr:'مطار إنتشيون الدولي',          nameEn:'Incheon International Airport',              cityAr:'سيول',     cityEn:'Seoul',     countryAr:'كوريا الجنوبية', countryEn:'South Korea', flag:'🇰🇷' },

  // ── اليابان ───────────────────────────────────────────────────────────────
  { iata:'NRT', nameAr:'مطار ناريتا الدولي',           nameEn:'Narita International Airport',               cityAr:'طوكيو',    cityEn:'Tokyo',     countryAr:'اليابان', countryEn:'Japan', flag:'🇯🇵' },
  { iata:'HND', nameAr:'مطار هانيدا',                  nameEn:'Tokyo Haneda Airport',                       cityAr:'طوكيو',    cityEn:'Tokyo',     countryAr:'اليابان', countryEn:'Japan', flag:'🇯🇵' },
  { iata:'KIX', nameAr:'مطار كانساي الدولي',           nameEn:'Kansai International Airport',               cityAr:'أوساكا',   cityEn:'Osaka',     countryAr:'اليابان', countryEn:'Japan', flag:'🇯🇵' },

  // ── الصين وهونغ كونغ ─────────────────────────────────────────────────────
  { iata:'PEK', nameAr:'مطار بكين العاصمة',            nameEn:'Beijing Capital International Airport',      cityAr:'بكين',     cityEn:'Beijing',   countryAr:'الصين', countryEn:'China', flag:'🇨🇳' },
  { iata:'PKX', nameAr:'مطار بكين داكسينغ',            nameEn:'Beijing Daxing International Airport',       cityAr:'بكين',     cityEn:'Beijing',   countryAr:'الصين', countryEn:'China', flag:'🇨🇳' },
  { iata:'PVG', nameAr:'مطار شنغهاي بودونغ',           nameEn:'Shanghai Pudong International Airport',      cityAr:'شنغهاي',   cityEn:'Shanghai',  countryAr:'الصين', countryEn:'China', flag:'🇨🇳' },
  { iata:'CAN', nameAr:'مطار غوانغتشو بايون',          nameEn:'Guangzhou Baiyun International Airport',     cityAr:'غوانغتشو', cityEn:'Guangzhou', countryAr:'الصين', countryEn:'China', flag:'🇨🇳' },
  { iata:'HKG', nameAr:'مطار هونغ كونغ الدولي',        nameEn:'Hong Kong International Airport',            cityAr:'هونغ كونغ', cityEn:'Hong Kong', countryAr:'هونغ كونغ', countryEn:'Hong Kong', flag:'🇭🇰' },

  // ── الولايات المتحدة ──────────────────────────────────────────────────────
  { iata:'JFK', nameAr:'مطار جون كيندي الدولي',        nameEn:'John F. Kennedy International Airport',      cityAr:'نيويورك',  cityEn:'New York',  countryAr:'الولايات المتحدة', countryEn:'USA', flag:'🇺🇸' },
  { iata:'LAX', nameAr:'مطار لوس أنجلوس الدولي',       nameEn:'Los Angeles International Airport',          cityAr:'لوس أنجلوس', cityEn:'Los Angeles', countryAr:'الولايات المتحدة', countryEn:'USA', flag:'🇺🇸' },
  { iata:'ORD', nameAr:'مطار أوهير الدولي',            nameEn:'O\'Hare International Airport',              cityAr:'شيكاغو',   cityEn:'Chicago',   countryAr:'الولايات المتحدة', countryEn:'USA', flag:'🇺🇸' },
  { iata:'MIA', nameAr:'مطار ميامي الدولي',            nameEn:'Miami International Airport',                cityAr:'ميامي',    cityEn:'Miami',     countryAr:'الولايات المتحدة', countryEn:'USA', flag:'🇺🇸' },
  { iata:'IAD', nameAr:'مطار دالاس الدولي',            nameEn:'Washington Dulles International Airport',    cityAr:'واشنطن',   cityEn:'Washington', countryAr:'الولايات المتحدة', countryEn:'USA', flag:'🇺🇸' },
  { iata:'SFO', nameAr:'مطار سان فرانسيسكو الدولي',   nameEn:'San Francisco International Airport',        cityAr:'سان فرانسيسكو', cityEn:'San Francisco', countryAr:'الولايات المتحدة', countryEn:'USA', flag:'🇺🇸' },
  { iata:'DFW', nameAr:'مطار دالاس فورت ورث',          nameEn:'Dallas/Fort Worth International Airport',    cityAr:'دالاس',    cityEn:'Dallas',    countryAr:'الولايات المتحدة', countryEn:'USA', flag:'🇺🇸' },
  { iata:'ATL', nameAr:'مطار أتلانتا الدولي',          nameEn:'Hartsfield-Jackson Atlanta Airport',         cityAr:'أتلانتا',  cityEn:'Atlanta',   countryAr:'الولايات المتحدة', countryEn:'USA', flag:'🇺🇸' },

  // ── كندا ──────────────────────────────────────────────────────────────────
  { iata:'YYZ', nameAr:'مطار تورونتو بيرسون',          nameEn:'Toronto Pearson International Airport',      cityAr:'تورونتو',  cityEn:'Toronto',   countryAr:'كندا', countryEn:'Canada', flag:'🇨🇦' },
  { iata:'YVR', nameAr:'مطار فانكوفر الدولي',          nameEn:'Vancouver International Airport',            cityAr:'فانكوفر',  cityEn:'Vancouver', countryAr:'كندا', countryEn:'Canada', flag:'🇨🇦' },
  { iata:'YUL', nameAr:'مطار مونتريال',                nameEn:'Montréal-Trudeau International Airport',     cityAr:'مونتريال', cityEn:'Montreal',  countryAr:'كندا', countryEn:'Canada', flag:'🇨🇦' },

  // ── أستراليا ──────────────────────────────────────────────────────────────
  { iata:'SYD', nameAr:'مطار سيدني الدولي',            nameEn:'Sydney Kingsford Smith Airport',             cityAr:'سيدني',    cityEn:'Sydney',    countryAr:'أستراليا', countryEn:'Australia', flag:'🇦🇺' },
  { iata:'MEL', nameAr:'مطار ملبورن الدولي',           nameEn:'Melbourne Airport',                          cityAr:'ملبورن',   cityEn:'Melbourne', countryAr:'أستراليا', countryEn:'Australia', flag:'🇦🇺' },

  // ── كينيا وأفريقيا ────────────────────────────────────────────────────────
  { iata:'NBO', nameAr:'مطار جومو كينياتا الدولي',     nameEn:'Jomo Kenyatta International Airport',        cityAr:'نيروبي',   cityEn:'Nairobi',   countryAr:'كينيا', countryEn:'Kenya', flag:'🇰🇪' },
  { iata:'ADD', nameAr:'مطار بولي الدولي',             nameEn:'Bole International Airport',                 cityAr:'أديس أبابا', cityEn:'Addis Ababa', countryAr:'إثيوبيا', countryEn:'Ethiopia', flag:'🇪🇹' },
  { iata:'JNB', nameAr:'مطار أو.آر. تامبو الدولي',     nameEn:'O.R. Tambo International Airport',           cityAr:'جوهانسبرغ', cityEn:'Johannesburg', countryAr:'جنوب أفريقيا', countryEn:'South Africa', flag:'🇿🇦' },
  { iata:'CPT', nameAr:'مطار كيب تاون الدولي',         nameEn:'Cape Town International Airport',            cityAr:'كيب تاون', cityEn:'Cape Town', countryAr:'جنوب أفريقيا', countryEn:'South Africa', flag:'🇿🇦' },
  { iata:'LOS', nameAr:'مطار مورتالا محمد الدولي',     nameEn:'Murtala Muhammed International Airport',     cityAr:'لاغوس',    cityEn:'Lagos',     countryAr:'نيجيريا', countryEn:'Nigeria', flag:'🇳🇬' },
  { iata:'ABV', nameAr:'مطار أبوجا الدولي',            nameEn:'Nnamdi Azikiwe International Airport',       cityAr:'أبوجا',    cityEn:'Abuja',     countryAr:'نيجيريا', countryEn:'Nigeria', flag:'🇳🇬' },
  { iata:'ACC', nameAr:'مطار كوتوكا الدولي',           nameEn:'Kotoka International Airport',               cityAr:'أكرا',     cityEn:'Accra',     countryAr:'غانا', countryEn:'Ghana', flag:'🇬🇭' },
  { iata:'DAR', nameAr:'مطار جوليوس نيريري الدولي',    nameEn:'Julius Nyerere International Airport',       cityAr:'دار السلام', cityEn:'Dar es Salaam', countryAr:'تنزانيا', countryEn:'Tanzania', flag:'🇹🇿' },
  { iata:'ZNZ', nameAr:'مطار زنجبار',                  nameEn:'Zanzibar International Airport',             cityAr:'زنجبار',   cityEn:'Zanzibar',  countryAr:'تنزانيا', countryEn:'Tanzania', flag:'🇹🇿' },
  { iata:'KGL', nameAr:'مطار كيغالي الدولي',           nameEn:'Kigali International Airport',               cityAr:'كيغالي',   cityEn:'Kigali',    countryAr:'رواندا', countryEn:'Rwanda', flag:'🇷🇼' },
  { iata:'DKR', nameAr:'مطار بلاز ديوف الدولي',        nameEn:'Blaise Diagne International Airport',        cityAr:'داكار',    cityEn:'Dakar',     countryAr:'السنغال', countryEn:'Senegal', flag:'🇸🇳' },
  { iata:'MBA', nameAr:'مطار مومباسا',                  nameEn:'Mombasa Moi International Airport',          cityAr:'مومباسا',  cityEn:'Mombasa',   countryAr:'كينيا', countryEn:'Kenya', flag:'🇰🇪' },

  // ── إيران ─────────────────────────────────────────────────────────────────
  { iata:'IKA', nameAr:'مطار الإمام الخميني الدولي',   nameEn:'Imam Khomeini International Airport',        cityAr:'طهران',    cityEn:'Tehran',    countryAr:'إيران', countryEn:'Iran', flag:'🇮🇷' },
  { iata:'MHD', nameAr:'مطار مشهد الدولي',             nameEn:'Mashhad International Airport',              cityAr:'مشهد',     cityEn:'Mashhad',   countryAr:'إيران', countryEn:'Iran', flag:'🇮🇷' },

  // ── أذربيجان ──────────────────────────────────────────────────────────────
  { iata:'GYD', nameAr:'مطار باكو الدولي',             nameEn:'Heydar Aliyev International Airport',        cityAr:'باكو',     cityEn:'Baku',      countryAr:'أذربيجان', countryEn:'Azerbaijan', flag:'🇦🇿' },

  // ── كازاخستان ─────────────────────────────────────────────────────────────
  { iata:'ALA', nameAr:'مطار ألماتي الدولي',           nameEn:'Almaty International Airport',               cityAr:'ألماتي',   cityEn:'Almaty',    countryAr:'كازاخستان', countryEn:'Kazakhstan', flag:'🇰🇿' },
  { iata:'NQZ', nameAr:'مطار نور سلطان',               nameEn:'Nursultan Nazarbayev International Airport', cityAr:'نور سلطان', cityEn:'Nur-Sultan', countryAr:'كازاخستان', countryEn:'Kazakhstan', flag:'🇰🇿' },

  // ── أوزبكستان ─────────────────────────────────────────────────────────────
  { iata:'TAS', nameAr:'مطار طشقند',                   nameEn:'Tashkent International Airport',             cityAr:'طشقند',    cityEn:'Tashkent',  countryAr:'أوزبكستان', countryEn:'Uzbekistan', flag:'🇺🇿' },
  { iata:'SKD', nameAr:'مطار سمرقند',                  nameEn:'Samarkand Airport',                          cityAr:'سمرقند',   cityEn:'Samarkand', countryAr:'أوزبكستان', countryEn:'Uzbekistan', flag:'🇺🇿' },

  // ── المكسيك والبرازيل ─────────────────────────────────────────────────────
  { iata:'MEX', nameAr:'مطار المكسيك الدولي',          nameEn:'Mexico City International Airport',          cityAr:'المكسيك',  cityEn:'Mexico City', countryAr:'المكسيك', countryEn:'Mexico', flag:'🇲🇽' },
  { iata:'GRU', nameAr:'مطار ساو باولو غوارولوس',      nameEn:'São Paulo-Guarulhos International Airport',  cityAr:'ساو باولو', cityEn:'São Paulo', countryAr:'البرازيل', countryEn:'Brazil', flag:'🇧🇷' },
  { iata:'GIG', nameAr:'مطار ريو دي جانيرو',           nameEn:'Rio de Janeiro-Galeão Airport',              cityAr:'ريو دي جانيرو', cityEn:'Rio de Janeiro', countryAr:'البرازيل', countryEn:'Brazil', flag:'🇧🇷' },

  // ── الفلبين ───────────────────────────────────────────────────────────────
  { iata:'MNL', nameAr:'مطار مانيلا الدولي',           nameEn:'Ninoy Aquino International Airport',         cityAr:'مانيلا',   cityEn:'Manila',    countryAr:'الفلبين', countryEn:'Philippines', flag:'🇵🇭' },
  { iata:'CEB', nameAr:'مطار سيبو الدولي',             nameEn:'Mactan-Cebu International Airport',          cityAr:'سيبو',     cityEn:'Cebu',      countryAr:'الفلبين', countryEn:'Philippines', flag:'🇵🇭' },

  // ── بولندا ────────────────────────────────────────────────────────────────
  { iata:'WAW', nameAr:'مطار وارسو شوبان',             nameEn:'Warsaw Chopin Airport',                      cityAr:'وارسو',    cityEn:'Warsaw',    countryAr:'بولندا', countryEn:'Poland', flag:'🇵🇱' },

  // ── رومانيا ───────────────────────────────────────────────────────────────
  { iata:'OTP', nameAr:'مطار هنري كواندا',             nameEn:'Henri Coandă International Airport',         cityAr:'بوخارست', cityEn:'Bucharest', countryAr:'رومانيا', countryEn:'Romania', flag:'🇷🇴' },
];

export function searchAirports(query: string): Airport[] {
  if (!query.trim()) return [];
  const q = query.trim().toLowerCase();
  const results = AIRPORTS.filter((a) =>
    a.iata.toLowerCase().includes(q) ||
    a.nameAr.toLowerCase().includes(q) ||
    a.nameEn.toLowerCase().includes(q) ||
    a.cityAr.toLowerCase().includes(q) ||
    a.cityEn.toLowerCase().includes(q) ||
    a.countryAr.toLowerCase().includes(q) ||
    a.countryEn.toLowerCase().includes(q)
  );
  // Sort: exact IATA match first, then IATA starts-with, then others
  return results.sort((a, b) => {
    const aExact = a.iata.toLowerCase() === q ? 0 : a.iata.toLowerCase().startsWith(q) ? 1 : 2;
    const bExact = b.iata.toLowerCase() === q ? 0 : b.iata.toLowerCase().startsWith(q) ? 1 : 2;
    return aExact - bExact;
  });
}
