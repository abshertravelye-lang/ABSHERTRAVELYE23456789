const fs = require('fs');

// 1. app/(tabs)/bookings.tsx
let bPath = 'artifacts/absher-mobile/app/(tabs)/bookings.tsx';
let bCode = fs.readFileSync(bPath, 'utf-8');

bCode = bCode.replace(/const APP_STATUS: Record[^=]+=\s*\{([\s\S]*?)\};/, "function getAppStatus(t: any, status: string) {\n  const map: Record<string, { label: string; bg: string; text: string; icon: keyof typeof Ionicons.glyphMap }> = {\n$1  };\n  return map[status] || { label: status, bg: '#F1F5F9', text: '#475569', icon: 'help-circle-outline' };\n}");

bCode = bCode.replace(/const BOOKING_STATUS: Record[^=]+=\s*\{([\s\S]*?)\};/, "function getBookingStatus(t: any, status: string) {\n  const map: Record<string, { label: string; bg: string; text: string }> = {\n$1  };\n  return map[status] || { label: status, bg: '#F1F5F9', text: '#475569' };\n}");

bCode = bCode.replace(/APP_STATUS\[([^\]]+)\]/g, "getAppStatus(t, $1)");
bCode = bCode.replace(/BOOKING_STATUS\[([^\]]+)\]/g, "getBookingStatus(t, $1)");
fs.writeFileSync(bPath, bCode);

// 2. app/(tabs)/visas.tsx
let vPath = 'artifacts/absher-mobile/app/(tabs)/visas.tsx';
let vCode = fs.readFileSync(vPath, 'utf-8');

vCode = vCode.replace(/const ENTRY_FILTERS = \[([\s\S]*?)\] as const;/, "function getEntryFilters(t: any) {\n  return [\n$1  ] as const;\n}");

vCode = vCode.replace(/const PROC_FILTERS = \[([\s\S]*?)\] as const;/, "function getProcFilters(t: any) {\n  return [\n$1  ] as const;\n}");

vCode = vCode.replace(/ENTRY_FILTERS\.map/g, "getEntryFilters(t).map");
vCode = vCode.replace(/PROC_FILTERS\.map/g, "getProcFilters(t).map");
fs.writeFileSync(vPath, vCode);

// 3. VisaCard.tsx
let cPath = 'artifacts/absher-mobile/components/VisaCard.tsx';
let cCode = fs.readFileSync(cPath, 'utf-8');
// Fix VisaCardHorizontal
if (!cCode.includes('const { t } = useLanguage();', cCode.indexOf('VisaCardHorizontal'))) {
  cCode = cCode.replace("export function VisaCardHorizontal({ visa, onPress }: Props) {", "export function VisaCardHorizontal({ visa, onPress }: Props) {\n  const { t } = useLanguage();");
}
fs.writeFileSync(cPath, cCode);
