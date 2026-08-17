import countries from "i18n-iso-countries";
import arLocale from "i18n-iso-countries/langs/ar.json";
import enLocale from "i18n-iso-countries/langs/en.json";

countries.registerLocale(arLocale as never);
countries.registerLocale(enLocale as never);

export interface CountryOption {
  /** ISO 3166-1 alpha-2 code, e.g. "SA" */
  code: string;
  nameAr: string;
  nameEn: string;
  /** Unicode flag emoji, e.g. 🇸🇦 */
  flag: string;
  /** E.164 international calling code including leading "+", e.g. "+966". Empty string when unknown. */
  dialCode: string;
}

function flagEmoji(code: string): string {
  return code
    .toUpperCase()
    .replace(/./g, (c) => String.fromCodePoint(127397 + c.charCodeAt(0)));
}

/**
 * ISO 3166-1 alpha-2 → E.164 country calling code (with leading "+").
 * Complete map covering all assigned country/territory codes.
 *
 * NANP territories each carry their own distinguishable area-code prefix
 * (e.g. AI → +1264, BS → +1242) so that longest-match parsing can resolve
 * them correctly and the picker builds the right international number.
 * US and CA stay at +1 as the primary NANP entries.
 */
export const DIAL_CODES: Record<string, string> = {
  AD: "+376",   AE: "+971",   AF: "+93",    AG: "+1268",  AI: "+1264",
  AL: "+355",   AM: "+374",   AO: "+244",   AQ: "+672",   AR: "+54",
  AS: "+1684",  AT: "+43",    AU: "+61",    AW: "+297",   AX: "+358",
  AZ: "+994",   BA: "+387",   BB: "+1246",  BD: "+880",   BE: "+32",
  BF: "+226",   BG: "+359",   BH: "+973",   BI: "+257",   BJ: "+229",
  BL: "+590",   BM: "+1441",  BN: "+673",   BO: "+591",   BQ: "+599",
  BR: "+55",    BS: "+1242",  BT: "+975",   BV: "+47",    BW: "+267",
  BY: "+375",   BZ: "+501",   CA: "+1",     CC: "+61",    CD: "+243",
  CF: "+236",   CG: "+242",   CH: "+41",    CI: "+225",   CK: "+682",
  CL: "+56",    CM: "+237",   CN: "+86",    CO: "+57",    CR: "+506",
  CU: "+53",    CV: "+238",   CW: "+599",   CX: "+61",    CY: "+357",
  CZ: "+420",   DE: "+49",    DJ: "+253",   DK: "+45",    DM: "+1767",
  DO: "+1809",  DZ: "+213",   EC: "+593",   EE: "+372",   EG: "+20",
  EH: "+212",   ER: "+291",   ES: "+34",    ET: "+251",   FI: "+358",
  FJ: "+679",   FK: "+500",   FM: "+691",   FO: "+298",   FR: "+33",
  GA: "+241",   GB: "+44",    GD: "+1473",  GE: "+995",   GF: "+594",
  GG: "+44",    GH: "+233",   GI: "+350",   GL: "+299",   GM: "+220",
  GN: "+224",   GP: "+590",   GQ: "+240",   GR: "+30",    GS: "+500",
  GT: "+502",   GU: "+1671",  GW: "+245",   GY: "+592",   HK: "+852",
  HM: "+672",   HN: "+504",   HR: "+385",   HT: "+509",   HU: "+36",
  ID: "+62",    IE: "+353",   IL: "+972",   IM: "+44",    IN: "+91",
  IO: "+246",   IQ: "+964",   IR: "+98",    IS: "+354",   IT: "+39",
  JE: "+44",    JM: "+1876",  JO: "+962",   JP: "+81",    KE: "+254",
  KG: "+996",   KH: "+855",   KI: "+686",   KM: "+269",   KN: "+1869",
  KP: "+850",   KR: "+82",    KW: "+965",   KY: "+1345",  KZ: "+7",
  LA: "+856",   LB: "+961",   LC: "+1758",  LI: "+423",   LK: "+94",
  LR: "+231",   LS: "+266",   LT: "+370",   LU: "+352",   LV: "+371",
  LY: "+218",   MA: "+212",   MC: "+377",   MD: "+373",   ME: "+382",
  MF: "+590",   MG: "+261",   MH: "+692",   MK: "+389",   ML: "+223",
  MM: "+95",    MN: "+976",   MO: "+853",   MP: "+1670",  MQ: "+596",
  MR: "+222",   MS: "+1664",  MT: "+356",   MU: "+230",   MV: "+960",
  MW: "+265",   MX: "+52",    MY: "+60",    MZ: "+258",   NA: "+264",
  NC: "+687",   NE: "+227",   NF: "+672",   NG: "+234",   NI: "+505",
  NL: "+31",    NO: "+47",    NP: "+977",   NR: "+674",   NU: "+683",
  NZ: "+64",    OM: "+968",   PA: "+507",   PE: "+51",    PF: "+689",
  PG: "+675",   PH: "+63",    PK: "+92",    PL: "+48",    PM: "+508",
  PN: "+64",    PR: "+1787",  PS: "+970",   PT: "+351",   PW: "+680",
  PY: "+595",   QA: "+974",   RE: "+262",   RO: "+40",    RS: "+381",
  RU: "+7",     RW: "+250",   SA: "+966",   SB: "+677",   SC: "+248",
  SD: "+249",   SE: "+46",    SG: "+65",    SH: "+290",   SI: "+386",
  SJ: "+47",    SK: "+421",   SL: "+232",   SM: "+378",   SN: "+221",
  SO: "+252",   SR: "+597",   SS: "+211",   ST: "+239",   SV: "+503",
  SX: "+1721",  SY: "+963",   SZ: "+268",   TC: "+1649",  TD: "+235",
  TF: "+262",   TG: "+228",   TH: "+66",    TJ: "+992",   TK: "+690",
  TL: "+670",   TM: "+993",   TN: "+216",   TO: "+676",   TR: "+90",
  TT: "+1868",  TV: "+688",   TW: "+886",   TZ: "+255",   UA: "+380",
  UG: "+256",   UM: "+1",     US: "+1",     UY: "+598",   UZ: "+998",
  VA: "+379",   VC: "+1784",  VE: "+58",    VG: "+1284",  VI: "+1340",
  VN: "+84",    VU: "+678",   WF: "+681",   WS: "+685",   YE: "+967",
  YT: "+262",   ZA: "+27",    ZM: "+260",   ZW: "+263",
};

export function getDialCode(code?: string | null): string {
  if (!code) return "";
  return DIAL_CODES[code.toUpperCase()] ?? "";
}

const alpha2Names = countries.getNames("en", { select: "official" });

export const COUNTRIES: CountryOption[] = Object.keys(alpha2Names)
  .map((code) => ({
    code,
    nameEn: countries.getName(code, "en") ?? code,
    nameAr: countries.getName(code, "ar") ?? countries.getName(code, "en") ?? code,
    flag: flagEmoji(code),
    dialCode: DIAL_CODES[code.toUpperCase()] ?? "",
  }))
  .sort((a, b) => a.nameEn.localeCompare(b.nameEn));

export function getCountryByCode(code?: string | null): CountryOption | undefined {
  if (!code) return undefined;
  return COUNTRIES.find((c) => c.code === code.toUpperCase());
}

export function getCountryByName(name?: string | null): CountryOption | undefined {
  if (!name) return undefined;
  const normalized = name.trim().toLocaleLowerCase();
  return COUNTRIES.find(
    (c) => c.nameAr.toLocaleLowerCase() === normalized || c.nameEn.toLocaleLowerCase() === normalized,
  );
}

// ── Canonicalization ────────────────────────────────────────────────────────
// Common abbreviations / alternate spellings mapped to ISO alpha-2 codes.
// Used so legacy free-text values ("UAE", "KSA", …) resolve to one canonical country.
const COUNTRY_ALIASES: Record<string, string> = {
  uae: "AE",
  "u.a.e": "AE",
  "u.a.e.": "AE",
  emirates: "AE",
  ksa: "SA",
  "k.s.a": "SA",
  "saudi": "SA",
  usa: "US",
  "u.s.a": "US",
  "u.s.a.": "US",
  "united states of america": "US",
  america: "US",
  uk: "GB",
  "u.k": "GB",
  "u.k.": "GB",
  britain: "GB",
  "great britain": "GB",
  england: "GB",
  czechia: "CZ",
  "czech republic": "CZ",
  russia: "RU",
  "russian federation": "RU",
  "south korea": "KR",
  "korea, republic of": "KR",
  "north korea": "KP",
  syria: "SY",
  "syrian arab republic": "SY",
  iran: "IR",
  "iran, islamic republic of": "IR",
  vietnam: "VN",
  "viet nam": "VN",
  laos: "LA",
  moldova: "MD",
  bolivia: "BO",
  venezuela: "VE",
  tanzania: "TZ",
  brunei: "BN",
  "dr congo": "CD",
  "democratic republic of the congo": "CD",
  "congo-kinshasa": "CD",
  congo: "CG",
  "cape verde": "CV",
  "ivory coast": "CI",
  "côte d'ivoire": "CI",
  "cote d'ivoire": "CI",
  turkey: "TR",
  türkiye: "TR",
  palestine: "PS",
  "palestinian territories": "PS",
  macedonia: "MK",
  "north macedonia": "MK",
  burma: "MM",
  myanmar: "MM",
  taiwan: "TW",
  "timor-leste": "TL",
  "east timor": "TL",
  eswatini: "SZ",
  swaziland: "SZ",
};

/**
 * Resolve any country input (ISO alpha-2 code, English name, Arabic name,
 * or common alias like "UAE") to its ISO alpha-2 code, or undefined.
 */
export function canonicalCountryCode(input?: string | null): string | undefined {
  if (!input) return undefined;
  const trimmed = input.trim();
  if (!trimmed) return undefined;
  // ISO alpha-2 code
  if (/^[A-Za-z]{2}$/.test(trimmed) && getCountryByCode(trimmed)) return trimmed.toUpperCase();
  // Alias table
  const alias = COUNTRY_ALIASES[trimmed.toLocaleLowerCase()];
  if (alias) return alias;
  // Exact English/Arabic name
  const byName = getCountryByName(trimmed);
  if (byName) return byName.code;
  // Any name variant known to i18n-iso-countries (official/alias names)
  const viaLib = countries.getAlpha2Code(trimmed, "en") ?? countries.getAlpha2Code(trimmed, "ar");
  return viaLib ?? undefined;
}

/**
 * Resolve any country input to the canonical English name used across the app,
 * or undefined when it cannot be recognized.
 */
export function canonicalCountryEn(input?: string | null): string | undefined {
  const code = canonicalCountryCode(input);
  return code ? getCountryByCode(code)?.nameEn : undefined;
}

/**
 * Exact-match country comparison on canonical values (never substring).
 * Unrecognized values only match when the raw strings are identical
 * after trimming and case-folding.
 */
export function isSameCountry(a?: string | null, b?: string | null): boolean {
  if (!a || !b) return false;
  const ca = canonicalCountryCode(a);
  const cb = canonicalCountryCode(b);
  if (ca && cb) return ca === cb;
  return a.trim().toLocaleLowerCase() === b.trim().toLocaleLowerCase();
}

/** Canonical GCC country list (English names as produced by this library). */
export const GCC_COUNTRY_CODES = ["SA", "AE", "KW", "QA", "BH", "OM"] as const;
export const GCC_COUNTRIES: CountryOption[] = GCC_COUNTRY_CODES.map(
  (code) => getCountryByCode(code)!,
);

// ── Phone dial-code helpers ─────────────────────────────────────────────────
// Single source of truth for phone dial-code selection, parsing and building,
// shared by web and mobile pickers. Driven entirely by DIAL_CODES/COUNTRIES.

/** All countries/territories that have an assigned calling code — the canonical picker list. */
export const DIAL_COUNTRIES: CountryOption[] = COUNTRIES.filter((c) => c.dialCode !== "");

/**
 * Several calling codes are shared by multiple territories (+1 NANP, +44 UK
 * crown dependencies, +7 RU/KZ, …). When parsing a stored number we cannot
 * know which territory it belongs to, so we resolve to the primary country
 * for that code. Round-tripping (parse → build) always reproduces the same
 * full number regardless.
 */
const SHARED_DIAL_PREFERRED: Record<string, string> = {
  "+1": "US",
  "+7": "RU",
  "+39": "IT",
  "+44": "GB",
  "+47": "NO",
  "+61": "AU",
  "+64": "NZ",
  "+212": "MA",
  "+262": "RE",
  "+358": "FI",
  "+500": "FK",
  "+590": "GP",
  "+599": "CW",
  "+672": "NF",
};

const DIALS_BY_LENGTH_DESC: string[] = [...new Set(DIAL_COUNTRIES.map((c) => c.dialCode))].sort(
  (a, b) => b.length - a.length,
);

/**
 * Parse a stored international phone string (e.g. "+966501234567") into an
 * ISO country code + local part: { countryCode: "SA", local: "501234567" }.
 * Longest dial code wins; shared codes resolve to the primary country.
 * Unparseable/empty input falls back to { countryCode: "SA", local: <digits> }.
 */
export function parseInternationalPhone(full?: string | null): { countryCode: string; local: string } {
  const trimmed = (full ?? "").trim();
  if (!trimmed) return { countryCode: "SA", local: "" };
  // Values without an explicit international prefix are legacy/local values.
  // Do not guess from their first digits: e.g. Saudi 501... would otherwise
  // look like Belize +501 and get corrupted when the profile is saved.
  if (!trimmed.startsWith("+")) {
    return { countryCode: "SA", local: trimmed.replace(/[^0-9]/g, "") };
  }
  const normalized = trimmed;
  for (const dial of DIALS_BY_LENGTH_DESC) {
    if (normalized.startsWith(dial)) {
      const preferred = SHARED_DIAL_PREFERRED[dial];
      const countryCode =
        preferred && DIAL_CODES[preferred] === dial
          ? preferred
          : DIAL_COUNTRIES.find((c) => c.dialCode === dial)!.code;
      return { countryCode, local: normalized.slice(dial.length) };
    }
  }
  return { countryCode: "SA", local: normalized.replace(/^\+/, "") };
}

/**
 * Countries where a leading "0" is part of the national significant number
 * and must be KEPT when dialing internationally (no trunk prefix to strip).
 * Italy is the canonical case: +39 06 1234 5678 keeps the 0.
 */
const KEEP_LEADING_ZERO = new Set(["IT", "VA", "SM"]);

/**
 * Build a full international phone string from an ISO country code + local
 * part. Strips non-digits; strips trunk leading zeros only for calling plans
 * where the trunk "0" is dropped internationally (most countries) — for
 * plans where the leading zero is significant (e.g. Italy) it is preserved,
 * so parse → build round trips never corrupt stored numbers.
 * Returns "" when the local part has no digits (used to explicitly clear
 * optional phone fields).
 */
export function buildInternationalPhone(countryCode: string, local: string): string {
  const cc = countryCode?.toUpperCase() ?? "";
  let digits = local.replace(/[^0-9]/g, "");
  if (!KEEP_LEADING_ZERO.has(cc)) {
    digits = digits.replace(/^0+/, "");
  }
  if (!digits || /^0+$/.test(digits)) return "";
  const dial = DIAL_CODES[cc] || "+966";
  return `${dial}${digits}`;
}
