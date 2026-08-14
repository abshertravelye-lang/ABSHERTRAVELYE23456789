const fs = require('fs');
let path = 'artifacts/absher-mobile/app/(tabs)/bookings.tsx';
let code = fs.readFileSync(path, 'utf-8');

code = code.replace(/function BookingCard\(\{ booking \}: \{ booking: Booking \}\) \{/g, "function BookingCard({ booking }: { booking: Booking }) {\n  const { t } = useLanguage();");
code = code.replace(/STATUS_CONFIG\.pending/g, "getStatusConfig(t).pending");
code = code.replace(/TYPE_CONFIG\.flight/g, "getTypeConfig(t).flight");

fs.writeFileSync(path, code);
