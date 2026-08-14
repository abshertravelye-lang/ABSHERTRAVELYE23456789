const fs = require('fs');
const path = require('path');

const files = [
  'artifacts/absher-mobile/components/visas/VisaCategories.tsx',
  'artifacts/absher-mobile/app/(tabs)/visas.tsx',
  'artifacts/absher-mobile/app/(tabs)/bookings.tsx',
  'artifacts/absher-mobile/components/VisaCard.tsx'
];

let categoriesCode = fs.readFileSync(files[0], 'utf-8');
categoriesCode = categoriesCode.replace(
  /export const VISA_CATEGORIES.*?\];/s,
  `export const VISA_CATEGORIES: { value: VisaCategory; labelKey: any; icon: keyof typeof Ionicons.glyphMap }[] = [
  { value: '', labelKey: 'visas.category.all', icon: 'globe-outline' },
  { value: 'tourist', labelKey: 'visas.category.tourist', icon: 'sunny-outline' },
  { value: 'business', labelKey: 'visas.category.business', icon: 'briefcase-outline' },
  { value: 'umrah', labelKey: 'visas.category.umrah', icon: 'moon-outline' },
  { value: 'medical', labelKey: 'visas.category.medical', icon: 'medkit-outline' },
  { value: 'study', labelKey: 'visas.category.study', icon: 'school-outline' },
  { value: 'family', labelKey: 'visas.category.family', icon: 'people-outline' },
  { value: 'transit', labelKey: 'visas.category.transit', icon: 'airplane-outline' },
];`
);
// add useLanguage import
if (!categoriesCode.includes('useLanguage')) {
  categoriesCode = categoriesCode.replace("import { useColors } from '@/hooks/useColors';", "import { useColors } from '@/hooks/useColors';\nimport { useLanguage } from '@/context/LanguageContext';");
}
// add const { t } = useLanguage(); inside VisaCategories
categoriesCode = categoriesCode.replace("const colors = useColors();", "const colors = useColors();\n  const { t } = useLanguage();");
categoriesCode = categoriesCode.replace("{item.label}", "{t(item.labelKey)}");
fs.writeFileSync(files[0], categoriesCode);

let visasCode = fs.readFileSync(files[1], 'utf-8');
if (!visasCode.includes('useLanguage')) {
  visasCode = visasCode.replace("import { useSafeAreaInsets } from 'react-native-safe-area-context';", "import { useSafeAreaInsets } from 'react-native-safe-area-context';\nimport { useLanguage } from '@/context/LanguageContext';");
}
if (!visasCode.includes('const { t } = useLanguage();')) {
  visasCode = visasCode.replace("const insets = useSafeAreaInsets();", "const insets = useSafeAreaInsets();\n  const { t } = useLanguage();");
}
// manual replacements
visasCode = visasCode.replace("{ value: '', label: 'أي دخول' }", "{ value: '', label: t('visas.filter.anyEntry') }");
visasCode = visasCode.replace("{ value: 'single', label: 'دخول واحد' }", "{ value: 'single', label: t('visas.filter.singleEntry') }");
visasCode = visasCode.replace("{ value: 'multiple', label: 'دخول متعدد' }", "{ value: 'multiple', label: t('visas.filter.multipleEntry') }");
visasCode = visasCode.replace("{ value: '', label: 'أي مدة' }", "{ value: '', label: t('visas.filter.anyDuration') }");
visasCode = visasCode.replace("{ value: 'express', label: '1-3 أيام' }", "{ value: 'express', label: t('visas.speed.fast') }");
visasCode = visasCode.replace("{ value: 'standard', label: '4-7 أيام' }", "{ value: 'standard', label: t('visas.speed.standard') }");
visasCode = visasCode.replace("{ value: 'long', label: '+7 أيام' }", "{ value: 'long', label: t('visas.speed.slow') }");
visasCode = visasCode.replace("مركز التأشيرات", "{t('visas.hub.title')}");
visasCode = visasCode.replace("{active.length > 0 ? \\`${active.length}+ تأشيرة متاحة\\` : 'جميع الوجهات العالمية'}", "{active.length > 0 ? `${active.length}+ ${t('visas.hub.availableVisas')}` : t('visas.hub.allDestinations')}");
visasCode = visasCode.replace("placeholder=\"ابحث عن دولة أو نوع تأشيرة...\"", "placeholder={t('visas.hub.searchPlaceholder') as string}");
visasCode = visasCode.replace("{ n: \\`${active.length}+\\`, l: 'تأشيرة' }", "{ n: `${active.length}+`, l: t('visas.hub.visaCount') }");
visasCode = visasCode.replace("{ n: \\`${fastApproval.length}+\\`, l: 'موافقة سريعة' }", "{ n: `${fastApproval.length}+`, l: t('visas.hub.fastApproval') }");
visasCode = visasCode.replace("{ n: \\`${multipleEntry.length}+\\`, l: 'دخول متعدد' }", "{ n: `${multipleEntry.length}+`, l: t('visas.hub.multipleEntry') }");
visasCode = visasCode.replace(">نوع الدخول<", ">{t('visas.filter.entryType')}<");
visasCode = visasCode.replace(">مدة المعالجة<", ">{t('visas.filter.processingTime')}<");
visasCode = visasCode.replace("title=\"خطأ في التحميل\"", "title={t('common.loadingError')}");
visasCode = visasCode.replace("description=\"تعذر تحميل التأشيرات\"", "description={t('visas.error.loading')}");
visasCode = visasCode.replace("actionLabel=\"إعادة المحاولة\"", "actionLabel={t('common.retry')}");
visasCode = visasCode.replace(">{filtered.length} نتيجة<", ">{filtered.length} {t('common.result')}<");
visasCode = visasCode.replace("title=\"لا توجد تأشيرات\"", "title={t('visas.empty.title')}");
visasCode = visasCode.replace("description=\"لا توجد نتائج مطابقة لبحثك\"", "description={t('visas.empty.noMatch')}");
visasCode = visasCode.replace(">تأشيرة العمرة<", ">{t('umrah.title')}<");
visasCode = visasCode.replace(">تقديم فوري مع مسح الجواز تلقائياً<", ">{t('umrah.instantApply')}<");
visasCode = visasCode.replace("title=\"موافقة سريعة\"", "title={t('visas.hub.fastApproval')}");
visasCode = visasCode.replace("subtitle={`\\${fastApproval.length} تأشيرة خلال 1-3 أيام`}", "subtitle={`${fastApproval.length} ${t('visas.section.fastApprovalSub')}`}");
visasCode = visasCode.replace("title=\"الأقل سعراً\"", "title={t('visas.section.lowestPrice')}");
visasCode = visasCode.replace("subtitle=\"ابدأ رحلتك بتكلفة معقولة\"", "subtitle={t('visas.section.lowestPriceSub')}");
visasCode = visasCode.replace("title=\"دخول متعدد\"", "title={t('visas.hub.multipleEntry')}");
visasCode = visasCode.replace("subtitle=\"استمتع بالدخول أكثر من مرة\"", "subtitle={t('visas.section.multipleEntrySub')}");
visasCode = visasCode.replace("title=\"أحدث التأشيرات\"", "title={t('visas.section.newest')}");
visasCode = visasCode.replace("subtitle=\"تمت إضافتها مؤخراً\"", "subtitle={t('visas.section.newestSub')}");
visasCode = visasCode.replace("title=\"جميع التأشيرات\"", "title={t('visas.category.all')}");
visasCode = visasCode.replace("subtitle={`\\${active.length} وجهة متاحة`}", "subtitle={`${active.length} ${t('visas.section.destinationsAvailable')}`}");
visasCode = visasCode.replace("description=\"لم يتم إضافة أي تأشيرات بعد\"", "description={t('visas.empty.noVisas')}");
fs.writeFileSync(files[1], visasCode);


let bookingsCode = fs.readFileSync(files[2], 'utf-8');
if (!bookingsCode.includes('useLanguage')) {
  bookingsCode = bookingsCode.replace("import * as Haptics from 'expo-haptics';", "import * as Haptics from 'expo-haptics';\nimport { useLanguage } from '@/context/LanguageContext';");
}
if (!bookingsCode.includes('const { t } = useLanguage();')) {
  bookingsCode = bookingsCode.replace("const insets = useSafeAreaInsets();", "const insets = useSafeAreaInsets();\n  const { t } = useLanguage();");
}
bookingsCode = bookingsCode.replace(/received:\s*\{ label: 'تم الاستلام',/g, "received:            { label: t('status.received'),");
bookingsCode = bookingsCode.replace(/under_review:\s*\{ label: 'قيد المراجعة',/g, "under_review:        { label: t('status.underReview'),");
bookingsCode = bookingsCode.replace(/awaiting_documents:\s*\{ label: 'بانتظار مستندات',/g, "awaiting_documents:  { label: t('status.awaitingDocuments'),");
bookingsCode = bookingsCode.replace(/documents_uploaded:\s*\{ label: 'تم رفع المستندات',/g, "documents_uploaded:  { label: t('status.documentsUploaded'),");
bookingsCode = bookingsCode.replace(/sent_to_embassy:\s*\{ label: 'أُرسل للسفارة',/g, "sent_to_embassy:     { label: t('status.sentToEmbassy'),");
bookingsCode = bookingsCode.replace(/processing:\s*\{ label: 'قيد المعالجة',/g, "processing:          { label: t('status.processing'),");
bookingsCode = bookingsCode.replace(/issued:\s*\{ label: 'صدرت التأشيرة',/g, "issued:              { label: t('status.issued'),");
bookingsCode = bookingsCode.replace(/approved:\s*\{ label: 'مقبول',/g, "approved:            { label: t('status.approved'),");
bookingsCode = bookingsCode.replace(/completed:\s*\{ label: 'مكتمل',/g, "completed:           { label: t('status.completed'),");
bookingsCode = bookingsCode.replace(/rejected:\s*\{ label: 'مرفوض',/g, "rejected:            { label: t('status.rejected'),");
bookingsCode = bookingsCode.replace(/cancelled:\s*\{ label: 'ملغي',/g, "cancelled:           { label: t('status.cancelled'),");
bookingsCode = bookingsCode.replace(/pending:\s*\{ label: 'قيد الانتظار',/g, "pending:             { label: t('status.pending'),");
bookingsCode = bookingsCode.replace(/confirmed:\s*\{ label: 'مؤكد',/g, "confirmed: { label: t('status.confirmed'),");

bookingsCode = bookingsCode.replace(">طلب تأشيرة<", ">{t('tracking.visaRequest')}<");
bookingsCode = bookingsCode.replace(">رقم التتبع<", ">{t('tracking.reference')}<");
bookingsCode = bookingsCode.replace(">تتبع الطلب<", ">{t('tracking.title')}<");
bookingsCode = bookingsCode.replace("title: 'طلبات التأشيرة'", "title: t('tracking.applications')");
bookingsCode = bookingsCode.replace("title: 'الحجوزات'", "title: t('tracking.bookings')");
bookingsCode = bookingsCode.replace(">طلباتي<", ">{t('nav.bookings')}<");
bookingsCode = bookingsCode.replace(">{apps.length} {apps.length === 1 ? 'طلب' : 'طلبات'}<", ">{apps.length} {t('tracking.requests')}<");
bookingsCode = bookingsCode.replace("title=\"سجّل دخولك لعرض طلباتك\"", "title={t('tracking.empty.loginTitle')}");
bookingsCode = bookingsCode.replace("description=\"بعد تسجيل الدخول ستجد هنا جميع طلبات التأشيرة التي قدّمتها وحالة كل طلب\"", "description={t('tracking.empty.loginDesc')}");
bookingsCode = bookingsCode.replace("actionLabel=\"تسجيل الدخول\"", "actionLabel={t('welcome.login')}");
bookingsCode = bookingsCode.replace("title=\"خطأ في تحميل الطلبات\"", "title={t('tracking.error.title')}");
bookingsCode = bookingsCode.replace("description=\"تعذر تحميل طلباتك، حاول مرة أخرى\"", "description={t('tracking.error.desc')}");
bookingsCode = bookingsCode.replace("actionLabel=\"إعادة المحاولة\"", "actionLabel={t('common.retry')}");
bookingsCode = bookingsCode.replace("title=\"لا توجد طلبات بعد\"", "title={t('tracking.empty.noRequestsTitle')}");
bookingsCode = bookingsCode.replace("description=\"لم تقدّم أي طلب تأشيرة حتى الآن. ابدأ طلبك الأول الآن\"", "description={t('tracking.empty.noRequestsDesc')}");
bookingsCode = bookingsCode.replace("actionLabel=\"تقديم طلب تأشيرة\"", "actionLabel={t('visas.apply')}");
// ensure t is accessible where variables are defined (status dictionaries inside components? yes they are inside BookingsScreen).
fs.writeFileSync(files[2], bookingsCode);


let cardCode = fs.readFileSync(files[3], 'utf-8');
if (!cardCode.includes('useLanguage')) {
  cardCode = cardCode.replace("import { LinearGradient } from 'expo-linear-gradient';", "import { LinearGradient } from 'expo-linear-gradient';\nimport { useLanguage } from '@/context/LanguageContext';");
}
if (!cardCode.includes('const { t } = useLanguage();')) {
  cardCode = cardCode.replace("export function VisaCard({ visa, onPress }: Props) {", "export function VisaCard({ visa, onPress }: Props) {\n  const { t } = useLanguage();");
}
cardCode = cardCode.replace("tourist: 'سياحية', business: 'تجارية', medical: 'طبية',", "tourist: t('visas.category.tourist'), business: t('visas.category.business'), medical: t('visas.category.medical'),");
cardCode = cardCode.replace("visit: 'زيارة', study: 'دراسية', umrah: 'عمرة',", "visit: t('visas.category.visit'), study: t('visas.category.study'), umrah: t('visas.category.umrah'),");
cardCode = cardCode.replace("single: 'دخول واحد', multiple: 'دخول متعدد', transit: 'عبور',", "single: t('visas.entry.single'), multiple: t('visas.entry.multiple'), transit: t('visas.entry.transit'),");
cardCode = cardCode.replace(">دخول متعدد<", ">{t('visas.entry.multiple')}<");
cardCode = cardCode.replace(">يوم<", ">{t('visas.duration.day')}<");
cardCode = cardCode.replace("? 'يوم إقامة' : ''", "? t('visas.duration.stayDays') : ''");
cardCode = cardCode.replace(">تقدم الآن<", ">{t('visas.applyNow')}<");
cardCode = cardCode.replace(">التفاصيل<", ">{t('common.details')}<");
cardCode = cardCode.replace(">{visa.processingDays} أيام<", ">{visa.processingDays} {t('visas.duration.days')}<");

if (!cardCode.includes('const { t } = useLanguage();', cardCode.indexOf('VisaCardHorizontal'))) {
  cardCode = cardCode.replace("export function VisaCardHorizontal({ visa, onPress }: Props) {", "export function VisaCardHorizontal({ visa, onPress }: Props) {\n  const { t } = useLanguage();");
}

fs.writeFileSync(files[3], cardCode);
