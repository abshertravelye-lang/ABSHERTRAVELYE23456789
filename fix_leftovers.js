const fs = require('fs');

// 1. app/(tabs)/visas.tsx
let vPath = 'artifacts/absher-mobile/app/(tabs)/visas.tsx';
let vCode = fs.readFileSync(vPath, 'utf-8');

vCode = vCode.replace(/`\$\{active.length\}\+ تأشيرة متاحة`/g, "`\${active.length}+ ${t('visas.hub.availableVisas')}`");
vCode = vCode.replace(/'جميع الوجهات العالمية'/g, "t('visas.hub.allDestinations')");
vCode = vCode.replace(/'تأشيرة'/g, "t('visas.hub.visaCount')");
vCode = vCode.replace(/'موافقة سريعة'/g, "t('visas.hub.fastApproval')");
vCode = vCode.replace(/'دخول متعدد'/g, "t('visas.hub.multipleEntry')");
vCode = vCode.replace(/>نوع الدخول</g, ">{t('visas.filter.entryType')}<");
vCode = vCode.replace(/>مدة المعالجة</g, ">{t('visas.filter.processingTime')}<");
vCode = vCode.replace(/>\{filtered.length\} نتيجة</g, ">{filtered.length} {t('common.result')}<");
vCode = vCode.replace(/`\$\{fastApproval.length\} تأشيرة خلال 1-3 أيام`/g, "`\${fastApproval.length} ${t('visas.section.fastApprovalSub')}`");
vCode = vCode.replace(/`\$\{active.length\} وجهة متاحة`/g, "`\${active.length} ${t('visas.section.destinationsAvailable')}`");
vCode = vCode.replace(/title="لا توجد تأشيرات"/g, "title={t('visas.empty.title')}");

fs.writeFileSync(vPath, vCode);

// 2. app/(tabs)/bookings.tsx
let bPath = 'artifacts/absher-mobile/app/(tabs)/bookings.tsx';
let bCode = fs.readFileSync(bPath, 'utf-8');

bCode = bCode.replace(/`حجزي مع أبشر ترافل:\\n\$\{typeConf.label\}\\nرقم الحجز: #\$\{booking.id\}\\nالعميل: \$\{booking.clientName\}\\nالوجهة: \$\{booking.destination \|\| '---'\}\\nتاريخ السفر: \$\{booking.travelDate \? formatDate\(booking.travelDate\) : '---'\}\\nالحالة: \$\{status.label\}`/g, 
  "`${t('booking.share.intro')}\\n${typeConf.label}\\n${t('tracking.reference')}: #${booking.id}\\n${t('booking.share.client')}: ${booking.clientName}\\n${t('booking.destination')}: ${booking.destination || '---'}\\n${t('booking.travelDate')}: ${booking.travelDate ? formatDate(booking.travelDate) : '---'}\\n${t('booking.share.status')}: ${status.label}`");

bCode = bCode.replace(/'مسافر' : 'مسافرون'/g, "t('booking.traveler') : t('booking.travelers')");
bCode = bCode.replace(/'ر.س'/g, "t('booking.currency.sar')");

bCode = bCode.replace(/>الجوال</g, ">{t('booking.phone')}<");
bCode = bCode.replace(/>البريد</g, ">{t('booking.email')}<");
bCode = bCode.replace(/>تاريخ العودة</g, ">{t('booking.returnDate')}<");
bCode = bCode.replace(/>تاريخ الحجز:/g, ">{t('booking.bookingDate')}:<");
bCode = bCode.replace(/>مشاركة</g, ">{t('common.share')}<");
bCode = bCode.replace(/>تفاصيل</g, ">{t('common.details')}<");

bCode = bCode.replace(/>حجوزاتي</g, ">{t('nav.bookings')}<");
bCode = bCode.replace(/'حجز' : 'حجوزات'/g, "t('booking.singular') : t('booking.plural')");

bCode = bCode.replace(/title="خطأ في تحميل الحجوزات"/g, "title={t('tracking.error.title')}");
bCode = bCode.replace(/description="تعذر تحميل حجوزاتك، حاول مرة أخرى"/g, "description={t('tracking.error.desc')}");

bCode = bCode.replace(/title="جاري تحميل حجوزاتك..."/g, "title={t('common.loading')}");

bCode = bCode.replace(/title="لا توجد حجوزات"/g, "title={t('tracking.empty.noRequestsTitle')}");
bCode = bCode.replace(/description="لم تقم بأي حجز حتى الآن. ابدأ بالبحث عن رحلات أو تأشيرات"/g, "description={t('tracking.empty.noRequestsDesc')}");
bCode = bCode.replace(/actionLabel="البحث عن رحلات"/g, "actionLabel={t('booking.searchFlights')}");

fs.writeFileSync(bPath, bCode);
