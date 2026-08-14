import { useState } from "react";
import { Check, ChevronsUpDown, Globe } from "lucide-react";
import { COUNTRIES, getCountryByCode, getCountryByName } from "@workspace/countries";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";

interface CountrySelectProps {
  /** Either an ISO alpha-2 code (preferred) or a stored English/Arabic country name. */
  value?: string;
  /** Called with the ISO alpha-2 code of the selected country. */
  onChange: (code: string) => void;
  language: "ar" | "en";
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

// Accepts either a stored ISO code or a legacy free-text name so existing data keeps working.
function resolveSelected(value?: string) {
  if (!value) return undefined;
  return getCountryByCode(value) ?? getCountryByName(value);
}

export function CountrySelect({ value, onChange, language, placeholder, disabled, className }: CountrySelectProps) {
  const [open, setOpen] = useState(false);
  const ar = language === "ar";
  const selected = resolveSelected(value);

  // Sort countries by display name (Arabic or English) for the active language
  const sortedCountries = ar
    ? [...COUNTRIES].sort((a, b) => a.nameAr.localeCompare(b.nameAr, "ar"))
    : COUNTRIES; // Already sorted by English name

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          dir={ar ? "rtl" : "ltr"}
          className={cn("w-full justify-between font-normal", !selected && "text-muted-foreground", className)}
        >
          <span className="flex items-center gap-2 truncate">
            {selected ? (
              <>
                <span className="text-lg leading-none">{selected.flag}</span>
                <span className="truncate">{ar ? selected.nameAr : selected.nameEn}</span>
              </>
            ) : (
              <>
                <Globe className="h-4 w-4 shrink-0 opacity-50" />
                {placeholder ?? (ar ? "اختر الدولة" : "Select country")}
              </>
            )}
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50 rtl:ml-0 rtl:mr-2" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
        <Command dir={ar ? "rtl" : "ltr"} filter={(itemValue, search) => {
          const s = search.toLowerCase();
          return itemValue.toLowerCase().includes(s) ? 1 : 0;
        }}>
          <CommandInput placeholder={ar ? "ابحث عن دولة..." : "Search country..."} />
          <CommandList>
            <CommandEmpty>{ar ? "لا توجد نتائج" : "No countries found"}</CommandEmpty>
            <CommandGroup>
              {sortedCountries.map((country) => (
                <CommandItem
                  key={country.code}
                  value={`${country.code.toLowerCase()} ${country.nameEn.toLowerCase()} ${country.nameAr}`}
                  onSelect={() => {
                    onChange(country.code);
                    setOpen(false);
                  }}
                >
                  <span className="text-lg leading-none mr-2 rtl:ml-2 rtl:mr-0">{country.flag}</span>
                  <span className="flex-1 truncate">{ar ? country.nameAr : country.nameEn}</span>
                  <Check className={cn("h-4 w-4", selected?.code === country.code ? "opacity-100" : "opacity-0")} />
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
