import * as countries from "i18n-iso-countries";
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
}

function flagEmoji(code: string): string {
  return code
    .toUpperCase()
    .replace(/./g, (c) => String.fromCodePoint(127397 + c.charCodeAt(0)));
}

const alpha2Names = countries.getNames("en", { select: "official" });

export const COUNTRIES: CountryOption[] = Object.keys(alpha2Names)
  .map((code) => ({
    code,
    nameEn: countries.getName(code, "en") ?? code,
    nameAr: countries.getName(code, "ar") ?? countries.getName(code, "en") ?? code,
    flag: flagEmoji(code),
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
