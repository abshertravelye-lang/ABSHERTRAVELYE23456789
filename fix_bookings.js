const fs = require('fs');

let bPath = 'artifacts/absher-mobile/app/(tabs)/bookings.tsx';
let bCode = fs.readFileSync(bPath, 'utf-8');

bCode = bCode.replace(/const BOOKING_STATUS = \{([\s\S]*?)\};/, "function getBookingStatus(t: any, status: string) {\n  const map: Record<string, { label: string; bg: string; text: string }> = {\n$1  };\n  return map[status] || { label: status, bg: '#F1F5F9', text: '#475569' };\n}");
fs.writeFileSync(bPath, bCode);

let cPath = 'artifacts/absher-mobile/components/VisaCard.tsx';
let cCode = fs.readFileSync(cPath, 'utf-8');
if (!cCode.includes('const { t } = useLanguage();', cCode.indexOf('export function VisaCard'))) {
  cCode = cCode.replace("export function VisaCard({ visa, onPress, style }: Props) {", "export function VisaCard({ visa, onPress, style }: Props) {\n  const { t } = useLanguage();");
}
fs.writeFileSync(cPath, cCode);
