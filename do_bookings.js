const fs = require('fs');

let bPath = 'artifacts/absher-mobile/app/(tabs)/bookings.tsx';
let bCode = fs.readFileSync(bPath, 'utf-8');

if (!bCode.includes('useLanguage')) {
  bCode = bCode.replace("import * as Haptics from 'expo-haptics';", "import * as Haptics from 'expo-haptics';\nimport { useLanguage } from '@/context/LanguageContext';");
}
if (!bCode.includes('const { t } = useLanguage();')) {
  bCode = bCode.replace("const insets = useSafeAreaInsets();", "const insets = useSafeAreaInsets();\n  const { t } = useLanguage();");
}
bCode = bCode.replace(/received:\s*\{ label: 'تم الاستلام',/g, "received:            { label: t('status.received'),");
bCode = bCode.replace(/under_review:\s*\{ label: 'قيد المراجعة',/g, "under_review:        { label: t('status.underReview'),");
bCode = bCode.replace(/awaiting_documents:\s*\{ label: 'بانتظار مستندات',/g, "awaiting_documents:  { label: t('status.awaitingDocuments'),");
bCode = bCode.replace(/documents_uploaded:\s*\{ label: 'تم رفع المستندات',/g, "documents_uploaded:  { label: t('status.documentsUploaded'),");
bCode = bCode.replace(/sent_to_embassy:\s*\{ label: 'أُرسل للسفارة',/g, "sent_to_embassy:     { label: t('status.sentToEmbassy'),");
bCode = bCode.replace(/processing:\s*\{ label: 'قيد المعالجة',/g, "processing:          { label: t('status.processing'),");
bCode = bCode.replace(/issued:\s*\{ label: 'صدرت التأشيرة',/g, "issued:              { label: t('status.issued'),");
bCode = bCode.replace(/approved:\s*\{ label: 'مقبول',/g, "approved:            { label: t('status.approved'),");
bCode = bCode.replace(/completed:\s*\{ label: 'مكتمل',/g, "completed:           { label: t('status.completed'),");
bCode = bCode.replace(/rejected:\s*\{ label: 'مرفوض',/g, "rejected:            { label: t('status.rejected'),");
bCode = bCode.replace(/cancelled:\s*\{ label: 'ملغي',/g, "cancelled:           { label: t('status.cancelled'),");
bCode = bCode.replace(/pending:\s*\{ label: 'قيد الانتظار',/g, "pending:             { label: t('status.pending'),");
bCode = bCode.replace(/confirmed:\s*\{ label: 'مؤكد',/g, "confirmed: { label: t('status.confirmed'),");

bCode = bCode.replace(">طلب تأشيرة<", ">{t('tracking.visaRequest')}<");
bCode = bCode.replace(">رقم التتبع<", ">{t('tracking.reference')}<");
bCode = bCode.replace(">تتبع الطلب<", ">{t('tracking.title')}<");
bCode = bCode.replace("title: 'طلبات التأشيرة'", "title: t('tracking.applications')");
bCode = bCode.replace("title: 'الحجوزات'", "title: t('tracking.bookings')");
bCode = bCode.replace(">طلباتي<", ">{t('nav.bookings')}<");
bCode = bCode.replace(">{apps.length} {apps.length === 1 ? 'طلب' : 'طلبات'}<", ">{apps.length} {t('tracking.requests')}<");
bCode = bCode.replace("title=\"سجّل دخولك لعرض طلباتك\"", "title={t('tracking.empty.loginTitle')}");
bCode = bCode.replace("description=\"بعد تسجيل الدخول ستجد هنا جميع طلبات التأشيرة التي قدّمتها وحالة كل طلب\"", "description={t('tracking.empty.loginDesc')}");
bCode = bCode.replace("actionLabel=\"تسجيل الدخول\"", "actionLabel={t('welcome.login')}");
bCode = bCode.replace("title=\"خطأ في تحميل الطلبات\"", "title={t('tracking.error.title')}");
bCode = bCode.replace("description=\"تعذر تحميل طلباتك، حاول مرة أخرى\"", "description={t('tracking.error.desc')}");
bCode = bCode.replace("actionLabel=\"إعادة المحاولة\"", "actionLabel={t('common.retry')}");
bCode = bCode.replace("title=\"لا توجد طلبات بعد\"", "title={t('tracking.empty.noRequestsTitle')}");
bCode = bCode.replace("description=\"لم تقدّم أي طلب تأشيرة حتى الآن. ابدأ طلبك الأول الآن\"", "description={t('tracking.empty.noRequestsDesc')}");
bCode = bCode.replace("actionLabel=\"تقديم طلب تأشيرة\"", "actionLabel={t('visas.apply')}");

bCode = bCode.replace(/const APP_STATUS: Record[^=]+=\s*\{([\s\S]*?)\};/, "function getAppStatus(t: any, status: string) {\n  const map: Record<string, { label: string; bg: string; text: string; icon: keyof typeof Ionicons.glyphMap }> = {\n$1  };\n  return map[status] || { label: status, bg: '#F1F5F9', text: '#475569', icon: 'help-circle-outline' };\n}");

bCode = bCode.replace(/const BOOKING_STATUS: Record[^=]+=\s*\{([\s\S]*?)\};/, "function getBookingStatus(t: any, status: string) {\n  const map: Record<string, { label: string; bg: string; text: string }> = {\n$1  };\n  return map[status] || { label: status, bg: '#F1F5F9', text: '#475569' };\n}");

bCode = bCode.replace(/APP_STATUS\[([^\]]+)\]/g, "getAppStatus(t, $1)");
bCode = bCode.replace(/BOOKING_STATUS\[([^\]]+)\]/g, "getBookingStatus(t, $1)");

// Wait, the BOOKING_STATUS matching string is `const BOOKING_STATUS = {` not `const BOOKING_STATUS: Record`!
bCode = bCode.replace(/const BOOKING_STATUS = \{([\s\S]*?)\};/, "function getBookingStatus(t: any, status: string) {\n  const map: Record<string, { label: string; bg: string; text: string }> = {\n$1  };\n  return map[status] || { label: status, bg: '#F1F5F9', text: '#475569' };\n}");

fs.writeFileSync(bPath, bCode);
