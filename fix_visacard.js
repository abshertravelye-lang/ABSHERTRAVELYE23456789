const fs = require('fs');
let cPath = 'artifacts/absher-mobile/components/VisaCard.tsx';
let cCode = fs.readFileSync(cPath, 'utf-8');

cCode = cCode.replace("export function VisaCardHorizontal({ visa, onPress, width = 200 }: { visa: Visa; onPress?: () => void; width?: number }) {", "export function VisaCardHorizontal({ visa, onPress, width = 200 }: { visa: Visa; onPress?: () => void; width?: number }) {\n  const { t } = useLanguage();");

fs.writeFileSync(cPath, cCode);
