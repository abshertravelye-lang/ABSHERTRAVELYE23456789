const fs = require('fs');
let path = 'artifacts/absher-mobile/app/(tabs)/bookings.tsx';
let code = fs.readFileSync(path, 'utf-8');

code = code.replace(/const STATUS_CONFIG = \{([\s\S]*?)\};/, "function getStatusConfig(t: any) {\n  return {\n$1  };\n}");

code = code.replace(/const TYPE_CONFIG = \{([\s\S]*?)\};/, "function getTypeConfig(t: any) {\n  return {\n$1  };\n}");

code = code.replace(/STATUS_CONFIG\[([^\]]+)\]/g, "getStatusConfig(t)[$1]");
code = code.replace(/TYPE_CONFIG\[([^\]]+)\]/g, "getTypeConfig(t)[$1]");

// In TYPE_CONFIG, there are hardcoded arabic labels:
code = code.replace(/'رحلة طيران'/g, "t('booking.type.flight')");
code = code.replace(/'فندق'/g, "t('booking.type.hotel')");
code = code.replace(/'برنامج سياحي'/g, "t('booking.type.program')");
code = code.replace(/'تأشيرة'/g, "t('booking.type.visa')");

fs.writeFileSync(path, code);
