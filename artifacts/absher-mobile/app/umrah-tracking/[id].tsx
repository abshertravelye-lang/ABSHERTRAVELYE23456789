/**
 * Umrah application tracking — mirrors app/visa-tracking/[id].tsx (timeline,
 * status, admin notes, issued-visa download via signed URL) for Umrah
 * applications fetched from GET /umrah-applications/:id.
 */
import React from 'react';
import { ActivityIndicator, Alert, Linking, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { useColors } from '@/hooks/useColors';
import colors from '@/constants/colors';
import { useLanguage } from '@/context/LanguageContext';
import {
  useGetUmrahApplication,
  getGetUmrahApplicationQueryKey,
  customFetch,
} from '@workspace/api-client-react';

type Lang = 'ar' | 'en';
const tr = (lang: Lang, ar: string, en: string) => (lang === 'en' ? en : ar);

/**
 * Storage object paths are served by the API at /api/storage/objects/*.
 * Rewrite "/objects/uploads/<uuid>" to the absolute served URL.
 */
function toIssuedVisaUrl(path: string): string {
  if (/^https?:\/\//.test(path)) return path;
  const origin = `https://${process.env.EXPO_PUBLIC_DOMAIN}`;
  if (path.startsWith('/objects/')) return `${origin}/api/storage${path}`;
  if (path.startsWith('/api/')) return `${origin}${path}`;
  return `${origin}${path.startsWith('/') ? '' : '/'}${path}`;
}

/** Ordered timeline steps (Umrah). */
function timeline(lang: Lang) {
  return [
    { key: 'submitted', label: tr(lang, 'تقديم الطلب', 'Application submitted'), desc: tr(lang, 'تم استلام طلب تأشيرة العمرة', 'Your Umrah application was received'), icon: 'document-text-outline' as const },
    { key: 'review', label: tr(lang, 'قيد المراجعة', 'Under review'), desc: tr(lang, 'يتم التحقق من البيانات والمستندات', 'Verifying data and documents'), icon: 'search-outline' as const },
    { key: 'processing', label: tr(lang, 'قيد المعالجة', 'Processing'), desc: tr(lang, 'جارٍ معالجة الطلب لدى الجهات المختصة', 'Processing with the relevant authorities'), icon: 'sync-outline' as const },
    { key: 'approved', label: tr(lang, 'الاعتماد', 'Approved'), desc: tr(lang, 'تمت الموافقة على الطلب', 'Your application was approved'), icon: 'shield-checkmark-outline' as const },
    { key: 'completed', label: tr(lang, 'جاهزة للاستلام', 'Ready'), desc: tr(lang, 'تأشيرتك جاهزة للتحميل', 'Your visa is ready to download'), icon: 'ribbon-outline' as const },
  ];
}

/** Map API status → { index, rejected, label, color }. */
function mapStatus(status: string, lang: Lang) {
  switch (status) {
    case 'awaiting_payment':
    case 'submitted':
      return { index: 0, rejected: false, label: tr(lang, 'تم التقديم', 'Submitted'), color: colors.gold };
    case 'under_review':
      return { index: 1, rejected: false, label: tr(lang, 'قيد المراجعة', 'Under review'), color: colors.cyan };
    case 'processing':
      return { index: 2, rejected: false, label: tr(lang, 'قيد المعالجة', 'Processing'), color: colors.cyan };
    case 'approved':
      return { index: 3, rejected: false, label: tr(lang, 'تم الاعتماد', 'Approved'), color: '#16A34A' };
    case 'completed':
      return { index: 4, rejected: false, label: tr(lang, 'مكتملة', 'Completed'), color: '#16A34A' };
    case 'rejected':
      return { index: -1, rejected: true, label: tr(lang, 'مرفوض', 'Rejected'), color: '#EF4444' };
    default:
      return { index: 0, rejected: false, label: tr(lang, 'تم التقديم', 'Submitted'), color: colors.gold };
  }
}

function paymentLabel(status: string, lang: Lang) {
  switch (status) {
    case 'paid': return { label: tr(lang, 'مدفوع', 'Paid'), color: '#16A34A' };
    case 'failed': return { label: tr(lang, 'فشل الدفع', 'Payment failed'), color: '#EF4444' };
    default: return { label: tr(lang, 'غير مدفوع', 'Unpaid'), color: colors.gold };
  }
}

export default function UmrahTrackingScreen() {
  const c = useColors();
  const { lang } = useLanguage();
  const insets = useSafeAreaInsets();
  const topInset = Platform.OS === 'web' ? 67 : insets.top;
  const bottomInset = Platform.OS === 'web' ? 34 : Math.max(insets.bottom, 20);

  const { id } = useLocalSearchParams<{ id: string }>();

  const { data: application, isLoading, error } = useGetUmrahApplication(String(id), {
    query: { enabled: !!id, queryKey: getGetUmrahApplicationQueryKey(String(id)) },
  });

  const Header = ({ title }: { title: string }) => (
    <LinearGradient colors={[colors.umrahGreen, '#0A3D28']} style={[styles.header, { paddingTop: topInset + 12 }]}>
      <View style={styles.headerRow}>
        <Pressable onPress={() => (router.canGoBack() ? router.back() : router.replace('/(tabs)' as never))} hitSlop={10} style={styles.backBtn}>
          <Ionicons name="arrow-forward" size={22} color="#FFFFFF" />
        </Pressable>
        <Text style={[styles.headerTitle, { fontFamily: 'Cairo_700Bold' }]}>{title}</Text>
        <View style={{ width: 40 }} />
      </View>
    </LinearGradient>
  );

  if (isLoading) {
    return (
      <View style={[styles.container, { backgroundColor: c.background }]}>
        <Header title={tr(lang, 'تتبع طلب العمرة', 'Track Umrah application')} />
        <View style={styles.centerFill}>
          <ActivityIndicator size="large" color={colors.gold} />
        </View>
      </View>
    );
  }

  if (error || !application) {
    return (
      <View style={[styles.container, { backgroundColor: c.background }]}>
        <Header title={tr(lang, 'تتبع طلب العمرة', 'Track Umrah application')} />
        <View style={styles.centerFill}>
          <Ionicons name="alert-circle-outline" size={64} color={c.destructive} />
          <Text style={[styles.errorText, { color: c.foreground, fontFamily: 'Cairo_600SemiBold' }]}>
            {tr(lang, 'حدث خطأ أثناء تحميل الطلب', 'An error occurred while loading the application')}
          </Text>
        </View>
      </View>
    );
  }

  const st = mapStatus(application.status || 'submitted', lang);
  const pay = paymentLabel(application.paymentStatus || 'unpaid', lang);
  const trackingRef = application.trackingNumber ?? `#${application.id}`;
  const steps = timeline(lang);

  const adminNote = (application.adminNotes ?? '').trim();
  const issuedVisaUrl = (application.issuedVisaUrl ?? '').trim();
  const hasVisaFile = issuedVisaUrl.length > 0;

  const handleDownload = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (!hasVisaFile) {
      Alert.alert(tr(lang, 'التأشيرة غير متوفرة بعد', 'Visa not available yet'), tr(lang, 'لم يتم إصدار ملف التأشيرة بعد. سنعلمك فور جاهزيته.', 'Your visa file has not been issued yet. We will notify you once it is ready.'));
      return;
    }
    let url = toIssuedVisaUrl(issuedVisaUrl);
    try {
      if (issuedVisaUrl.startsWith('/objects/')) {
        const signed = await customFetch<{ url: string }>(
          `/api/storage/sign?path=${encodeURIComponent(issuedVisaUrl)}&download=1`,
        );
        url = toIssuedVisaUrl(signed.url);
      }
    } catch {
      Alert.alert(tr(lang, 'تعذر فتح الملف', 'Could not open file'), tr(lang, 'حدث خطأ أثناء تجهيز رابط التحميل. حاول مجدداً.', 'An error occurred preparing the download link. Try again.'));
      return;
    }
    try {
      if (Platform.OS === 'web') {
        window.open(url, '_blank');
      } else {
        const supported = await Linking.canOpenURL(url);
        if (supported) await Linking.openURL(url);
        else Alert.alert(tr(lang, 'تعذر فتح الملف', 'Could not open file'), tr(lang, 'حدث خطأ أثناء محاولة فتح ملف التأشيرة.', 'An error occurred opening the visa file.'));
      }
    } catch {
      Alert.alert(tr(lang, 'تعذر فتح الملف', 'Could not open file'), tr(lang, 'حدث خطأ أثناء محاولة فتح ملف التأشيرة.', 'An error occurred opening the visa file.'));
    }
  };

  const submittedDate = application.createdAt
    ? new Date(application.createdAt).toLocaleDateString(lang === 'en' ? 'en-GB' : 'ar-SA')
    : undefined;

  return (
    <View style={[styles.container, { backgroundColor: c.background }]}>
      <Header title={tr(lang, 'تتبع طلب تأشيرة العمرة', 'Track Umrah visa application')} />

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: bottomInset + 100, gap: 16 }} showsVerticalScrollIndicator={false}>
        {/* Hero */}
        <View style={[styles.heroCard, { backgroundColor: c.card, borderColor: c.border }]}>
          <View style={[styles.heroIconWrap, { backgroundColor: colors.umrahGreen + '18' }]}>
            <Ionicons name="moon" size={34} color={colors.umrahGreen} />
          </View>
          <Text style={[styles.heroTitle, { color: c.foreground, fontFamily: 'Cairo_700Bold' }]}>
            {tr(lang, 'تأشيرة العمرة', 'Umrah Visa')}
          </Text>
          <View style={[styles.refPill, { backgroundColor: c.muted }]}>
            <Ionicons name="pricetag-outline" size={14} color={c.mutedForeground} />
            <Text style={[styles.refNumber, { color: c.foreground, fontFamily: 'Cairo_700Bold' }]}>{trackingRef}</Text>
          </View>
          <View style={styles.badgeRow}>
            <View style={[styles.statusBadge, { backgroundColor: st.color + '1A', borderColor: st.color }]}>
              <View style={[styles.statusDot, { backgroundColor: st.color }]} />
              <Text style={[styles.statusText, { color: st.color, fontFamily: 'Cairo_700Bold' }]}>{st.label}</Text>
            </View>
            <View style={[styles.statusBadge, { backgroundColor: pay.color + '1A', borderColor: pay.color }]}>
              <Ionicons name="card-outline" size={13} color={pay.color} />
              <Text style={[styles.statusText, { color: pay.color, fontFamily: 'Cairo_700Bold' }]}>{pay.label}</Text>
            </View>
          </View>
        </View>

        {/* Rejected banner */}
        {st.rejected && (
          <View style={[styles.rejectBanner, { backgroundColor: '#FEE2E2', borderColor: '#EF4444' }]}>
            <Ionicons name="close-circle" size={22} color="#991B1B" />
            <View style={{ flex: 1 }}>
              <Text style={[styles.rejectTitle, { fontFamily: 'Cairo_700Bold' }]}>{tr(lang, 'تم رفض الطلب', 'Application rejected')}</Text>
              <Text style={[styles.rejectDesc, { fontFamily: 'Cairo_400Regular' }]}>
                {adminNote || tr(lang, 'يرجى التواصل مع الدعم لمزيد من التفاصيل', 'Please contact support for more details')}
              </Text>
            </View>
          </View>
        )}

        {/* Admin note */}
        {!st.rejected && adminNote.length > 0 && (
          <View style={styles.adminNoteCard}>
            <View style={styles.adminNoteHeader}>
              <View style={styles.adminNoteIconWrap}>
                <Ionicons name="chatbubble-ellipses" size={18} color="#0A2342" />
              </View>
              <Text style={[styles.adminNoteTitle, { fontFamily: 'Cairo_700Bold' }]}>{tr(lang, 'ملاحظة من الإدارة', 'Note from the team')}</Text>
            </View>
            <Text style={[styles.adminNoteBody, { fontFamily: 'Cairo_600SemiBold' }]}>{adminNote}</Text>
          </View>
        )}

        {/* Issued visa file */}
        {hasVisaFile && (
          <View style={[styles.section, { backgroundColor: c.card, borderColor: '#16A34A' }]}>
            <View style={styles.docRow}>
              <View style={styles.docLeft}>
                <View style={[styles.docIcon, { backgroundColor: 'rgba(22, 163, 74, 0.12)' }]}>
                  <Ionicons name="document-attach" size={20} color="#16A34A" />
                </View>
                <View>
                  <Text style={[styles.docName, { color: c.foreground, fontFamily: 'Cairo_700Bold' }]}>{tr(lang, 'ملف التأشيرة', 'Visa file')}</Text>
                  <Text style={[styles.docHint, { color: c.mutedForeground, fontFamily: 'Cairo_400Regular' }]}>{tr(lang, 'جاهز للتحميل', 'Ready to download')}</Text>
                </View>
              </View>
              <Ionicons name="checkmark-circle" size={24} color="#16A34A" />
            </View>
          </View>
        )}

        {/* Timeline */}
        <View style={[styles.section, { backgroundColor: c.card, borderColor: c.border }]}>
          <Text style={[styles.sectionTitle, { color: c.foreground, fontFamily: 'Cairo_700Bold' }]}>{tr(lang, 'مراحل الطلب', 'Application stages')}</Text>
          <View style={styles.timeline}>
            {steps.map((s, index) => {
              const isPast = !st.rejected && index < st.index;
              const isCurrent = !st.rejected && index === st.index;
              const isActive = isPast || isCurrent;
              const isLast = index === steps.length - 1;
              const dotBg = isPast ? colors.gold : isCurrent ? c.card : c.muted;
              const dotBorder = isActive ? colors.gold : c.border;
              const iconColor = isPast ? colors.navy : isCurrent ? colors.gold : c.mutedForeground;
              return (
                <View key={s.key} style={styles.timelineRow}>
                  <View style={styles.timelineIconCol}>
                    <View style={[styles.timelineDot, { backgroundColor: dotBg, borderColor: dotBorder }]}>
                      {isPast ? <Ionicons name="checkmark" size={16} color={colors.navy} /> : <Ionicons name={s.icon} size={15} color={iconColor} />}
                    </View>
                    {!isLast && <View style={[styles.timelineLine, { backgroundColor: isPast ? colors.gold : c.border }]} />}
                  </View>
                  <View style={styles.timelineContent}>
                    <Text style={[styles.timelineLabel, { color: isCurrent ? colors.gold : isActive ? c.foreground : c.mutedForeground, fontFamily: isCurrent ? 'Cairo_700Bold' : 'Cairo_600SemiBold' }]}>
                      {s.label}
                    </Text>
                    {isActive && (
                      <Text style={[styles.timelineDesc, { color: c.mutedForeground, fontFamily: 'Cairo_400Regular' }]}>{s.desc}</Text>
                    )}
                    {isActive && index === 0 && submittedDate && (
                      <Text style={[styles.timelineDate, { color: c.mutedForeground, fontFamily: 'Cairo_400Regular' }]}>{submittedDate}</Text>
                    )}
                  </View>
                </View>
              );
            })}
          </View>
        </View>

        {/* Applicant + application summary */}
        <View style={[styles.section, { backgroundColor: c.card, borderColor: c.border }]}>
          <Text style={[styles.sectionTitle, { color: c.foreground, fontFamily: 'Cairo_700Bold' }]}>{tr(lang, 'بيانات الطلب', 'Application details')}</Text>
          {([
            [tr(lang, 'اسم المعتمر', 'Pilgrim name'), application.fullName],
            [tr(lang, 'الجنسية', 'Nationality'), application.nationality],
            [tr(lang, 'رقم الجواز', 'Passport number'), application.passportNumber],
            [tr(lang, 'نوع الطلب', 'Application type'), tr(lang, 'تأشيرة العمرة', 'Umrah visa')],
            [tr(lang, 'رقم جوال المستضيف', 'Host phone'), application.sponsorPhone],
            [tr(lang, 'المبلغ', 'Amount'), application.feeAmount != null ? `${application.feeAmount} ${application.feeCurrency}` : undefined],
            [tr(lang, 'رقم العملية', 'Payment reference'), application.paymentReference],
            [tr(lang, 'تاريخ التقديم', 'Submission date'), submittedDate],
          ] as [string, string | null | undefined][]).map(([k, v]) =>
            v ? (
              <View key={k} style={[styles.infoRow, { borderBottomColor: c.border }]}>
                <Text style={[styles.infoVal, { color: c.foreground, fontFamily: 'Cairo_600SemiBold' }]}>{v}</Text>
                <Text style={[styles.infoKey, { color: c.mutedForeground, fontFamily: 'Cairo_400Regular' }]}>{k}</Text>
              </View>
            ) : null,
          )}
        </View>

        {/* Documents */}
        <View style={[styles.section, { backgroundColor: c.card, borderColor: c.border }]}>
          <Text style={[styles.sectionTitle, { color: c.foreground, fontFamily: 'Cairo_700Bold' }]}>{tr(lang, 'المستندات المرفقة', 'Attached documents')}</Text>
          {([
            [tr(lang, 'صورة الجواز', 'Passport image'), !!application.passportImageUrl],
            [tr(lang, 'الصورة الشخصية', 'Personal photo'), !!application.personalPhotoUrl],
            [tr(lang, 'صورة إقامة المستضيف', 'Host residency image'), !!application.sponsorResidencyImageUrl],
          ] as [string, boolean][]).map(([name, uploaded]) => (
            <View key={name} style={styles.docRow}>
              <View style={styles.docLeft}>
                <View style={[styles.docIcon, { backgroundColor: c.muted }]}>
                  <Ionicons name="document-outline" size={18} color={c.foreground} />
                </View>
                <Text style={[styles.docName, { color: c.foreground, fontFamily: 'Cairo_600SemiBold' }]}>{name}</Text>
              </View>
              <Ionicons name={uploaded ? 'checkmark-circle' : 'remove-circle-outline'} size={22} color={uploaded ? '#16A34A' : c.mutedForeground} />
            </View>
          ))}
        </View>
      </ScrollView>

      {/* Footer */}
      <View style={[styles.footer, { paddingBottom: bottomInset + 10, backgroundColor: c.card, borderTopColor: c.border }]}>
        <Pressable
          style={({ pressed }) => [styles.downloadBtn, { backgroundColor: hasVisaFile ? colors.gold : c.muted, opacity: pressed ? 0.85 : 1 }]}
          onPress={handleDownload}
          disabled={!hasVisaFile}
        >
          <Ionicons name="download-outline" size={20} color={hasVisaFile ? colors.navy : c.mutedForeground} />
          <Text style={[styles.downloadBtnText, { color: hasVisaFile ? colors.navy : c.mutedForeground, fontFamily: 'Cairo_700Bold' }]}>
            {hasVisaFile ? tr(lang, 'تحميل التأشيرة', 'Download visa') : tr(lang, 'التأشيرة غير متوفرة بعد', 'Visa not available yet')}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 16, paddingBottom: 16 },
  headerRow: { flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between' },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { color: '#FFFFFF', fontSize: 18, flex: 1, textAlign: 'center' },
  centerFill: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 16 },
  errorText: { fontSize: 16 },

  heroCard: { padding: 24, borderRadius: 18, borderWidth: 1, alignItems: 'center', gap: 10 },
  heroIconWrap: { width: 72, height: 72, borderRadius: 22, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  heroTitle: { fontSize: 20, textAlign: 'center' },
  refPill: { flexDirection: 'row-reverse', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  refNumber: { fontSize: 14, writingDirection: 'ltr' },
  badgeRow: { flexDirection: 'row-reverse', flexWrap: 'wrap', gap: 8, justifyContent: 'center' },
  statusBadge: { flexDirection: 'row-reverse', alignItems: 'center', gap: 8, marginTop: 2, paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, borderWidth: 1 },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  statusText: { fontSize: 13 },

  rejectBanner: { flexDirection: 'row-reverse', alignItems: 'flex-start', gap: 12, padding: 16, borderRadius: 16, borderWidth: 1 },
  rejectTitle: { fontSize: 15, color: '#991B1B', textAlign: 'right' },
  rejectDesc: { fontSize: 13, color: '#991B1B', textAlign: 'right', marginTop: 2, lineHeight: 20 },

  section: { padding: 18, borderRadius: 18, borderWidth: 1, gap: 8 },
  sectionTitle: { fontSize: 16, textAlign: 'right', marginBottom: 8 },

  adminNoteCard: { padding: 18, borderRadius: 16, borderWidth: 1, borderColor: 'rgba(212, 175, 55, 0.5)', backgroundColor: 'rgba(212, 175, 55, 0.10)', gap: 10 },
  adminNoteHeader: { flexDirection: 'row-reverse', alignItems: 'center', gap: 10 },
  adminNoteIconWrap: { width: 34, height: 34, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(212, 175, 55, 0.25)' },
  adminNoteTitle: { fontSize: 15, color: '#0A2342', textAlign: 'right' },
  adminNoteBody: { fontSize: 14, color: '#3F3F46', textAlign: 'right', lineHeight: 24 },

  timeline: { gap: 0 },
  timelineRow: { flexDirection: 'row-reverse', alignItems: 'flex-start' },
  timelineIconCol: { width: 36, alignItems: 'center' },
  timelineDot: { width: 36, height: 36, borderRadius: 18, borderWidth: 2, alignItems: 'center', justifyContent: 'center', zIndex: 2 },
  timelineLine: { width: 2.5, height: 40, marginTop: -1, zIndex: 1, borderRadius: 2 },
  timelineContent: { flex: 1, paddingRight: 14, paddingBottom: 26, paddingTop: 6 },
  timelineLabel: { fontSize: 15, textAlign: 'right' },
  timelineDesc: { fontSize: 12.5, textAlign: 'right', marginTop: 2, lineHeight: 18 },
  timelineDate: { fontSize: 12, textAlign: 'right', marginTop: 3 },

  infoRow: { flexDirection: 'row-reverse', justifyContent: 'space-between', paddingVertical: 11, borderBottomWidth: StyleSheet.hairlineWidth },
  infoKey: { fontSize: 13 },
  infoVal: { fontSize: 14, flexShrink: 1, textAlign: 'left', marginLeft: 12 },

  docRow: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8 },
  docLeft: { flexDirection: 'row-reverse', alignItems: 'center', gap: 12 },
  docIcon: { width: 38, height: 38, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  docName: { fontSize: 14 },
  docHint: { fontSize: 12 },

  footer: { paddingHorizontal: 16, paddingTop: 14, borderTopWidth: 1 },
  downloadBtn: { flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 16, borderRadius: 14 },
  downloadBtnText: { fontSize: 16 },
});
