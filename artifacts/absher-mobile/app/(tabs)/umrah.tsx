/**
 * Umrah Visa — calm, luxurious STANDALONE landing page.
 *
 * Reached from the home «تأشيرة العمرة» service card and the Umrah tab. It feels
 * like an official government service: ONE Makkah hero image with a navy
 * overlay, the brand logo, a big title + short description, a single elegant
 * info card with a few concise service lines and a clear primary CTA that
 * opens the existing wizard (app/umrah-visa.tsx, host question first). Access
 * to existing applications («طلباتي») is kept but intentionally secondary.
 */
import React, { useMemo } from 'react';
import { StyleSheet, Text, View, ScrollView, Platform, Pressable, ActivityIndicator } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import colors from '@/constants/colors';
import { useLanguage } from '@/context/LanguageContext';
import { useAuth } from '@/context/AuthContext';
import {
  useListUmrahApplications,
  getListUmrahApplicationsQueryKey,
} from '@workspace/api-client-react';
import type { UmrahApplication } from '@workspace/api-client-react';

const NAVY = '#0A2342';
const GOLD = '#C9A24B';

const ui = {
  'umrahLanding.title': { ar: 'تأشيرة العمرة', en: 'Umrah Visa' },
  'umrahLanding.desc': {
    ar: 'قدّم طلب تأشيرة العمرة بسهولة وأمان من خلال خطوات إلكترونية واضحة.',
    en: 'Apply for an Umrah visa easily and securely through clear electronic steps.',
  },
  'umrahLanding.cardTitle': { ar: 'تأشيرة العمرة', en: 'Umrah Visa' },
  'umrahLanding.cardSubtitle': { ar: 'تقديم إلكتروني سريع', en: 'Fast electronic submission' },
  'umrahLanding.line1': { ar: 'طلب مخصص لتأشيرة العمرة', en: 'A dedicated Umrah visa request' },
  'umrahLanding.line2': { ar: 'رفع المستندات إلكترونياً', en: 'Upload documents electronically' },
  'umrahLanding.line3': { ar: 'قراءة بيانات الجواز تلقائياً', en: 'Automatic passport data reading' },
  'umrahLanding.line4': { ar: 'سداد الرسوم إلكترونياً', en: 'Pay the fees electronically' },
  'umrahLanding.line5': { ar: 'متابعة الطلب من التطبيق والمنصة', en: 'Track your request from the app and platform' },
  'umrahLanding.cta': { ar: 'ابدأ طلب تأشيرة العمرة', en: 'Start Umrah visa request' },
  'umrahLanding.myApplications': { ar: 'طلباتي', en: 'My applications' },
  'umrahLanding.noApplications': { ar: 'لا توجد طلبات حالياً', en: 'No applications yet' },
  'umrahLanding.viewAll': { ar: 'عرض الطلبات', en: 'View applications' },
} as const;

type Lang = 'ar' | 'en';
const trx = (lang: Lang, ar: string, en: string) => (lang === 'en' ? en : ar);

function statusLabel(status: string, lang: Lang): { label: string; color: string } {
  switch (status) {
    case 'awaiting_payment': return { label: trx(lang, 'بانتظار الدفع', 'Awaiting payment'), color: colors.gold };
    case 'submitted': return { label: trx(lang, 'تم التقديم', 'Submitted'), color: colors.gold };
    case 'under_review': return { label: trx(lang, 'قيد المراجعة', 'Under review'), color: colors.cyan };
    case 'processing': return { label: trx(lang, 'قيد المعالجة', 'Processing'), color: colors.cyan };
    case 'approved': return { label: trx(lang, 'تم الاعتماد', 'Approved'), color: '#16A34A' };
    case 'completed': return { label: trx(lang, 'مكتملة', 'Completed'), color: '#16A34A' };
    case 'rejected': return { label: trx(lang, 'مرفوض', 'Rejected'), color: '#EF4444' };
    default: return { label: trx(lang, 'تم التقديم', 'Submitted'), color: colors.gold };
  }
}

function UmrahAppRow({ app, lang }: { app: UmrahApplication; lang: Lang }) {
  const c = useColors();
  const st = statusLabel(app.status, lang);
  const date = app.createdAt ? new Date(app.createdAt).toLocaleDateString(lang === 'en' ? 'en-GB' : 'ar-SA') : '';
  return (
    <Pressable
      onPress={() => router.push(`/umrah-tracking/${app.id}` as never)}
      style={({ pressed }) => [styles.appRow, { borderColor: c.border, backgroundColor: c.card, opacity: pressed ? 0.9 : 1 }]}
    >
      <Ionicons name="chevron-back" size={18} color={c.mutedForeground} />
      <View style={{ flex: 1, alignItems: 'flex-end', gap: 6 }}>
        <View style={styles.appTopRow}>
          <View style={[styles.chip, { backgroundColor: st.color + '1A', borderColor: st.color }]}>
            <Text style={[styles.chipText, { color: st.color, fontFamily: 'Cairo_700Bold' }]}>{st.label}</Text>
          </View>
          <Text style={[styles.appTracking, { color: c.foreground, fontFamily: 'Cairo_700Bold' }]}>{app.trackingNumber}</Text>
        </View>
        {!!date && <Text style={[styles.appMeta, { color: c.mutedForeground, fontFamily: 'Cairo_400Regular' }]}>{date}</Text>}
      </View>
    </Pressable>
  );
}

export default function UmrahTab() {
  const c = useColors();
  const { lang } = useLanguage();
  const insets = useSafeAreaInsets();
  const { user: authUser } = useAuth();

  const topInset = Platform.OS === 'web' ? 24 : insets.top;
  const bottomInset = Platform.OS === 'web' ? 34 : Math.max(insets.bottom, 16);

  const t = (key: keyof typeof ui) => ui[key][lang as Lang];

  const { data: applications, isLoading: appsLoading } = useListUmrahApplications({
    query: { enabled: !!authUser, queryKey: getListUmrahApplicationsQueryKey() },
  });

  const umrahApps = useMemo(() => {
    const list = applications ?? [];
    return [...list].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [applications]);

  const handleApply = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push('/umrah-visa' as never);
  };

  const infoLines: { icon: keyof typeof Ionicons.glyphMap; key: keyof typeof ui }[] = [
    { icon: 'moon-outline', key: 'umrahLanding.line1' },
    { icon: 'cloud-upload-outline', key: 'umrahLanding.line2' },
    { icon: 'scan-outline', key: 'umrahLanding.line3' },
    { icon: 'card-outline', key: 'umrahLanding.line4' },
    { icon: 'phone-portrait-outline', key: 'umrahLanding.line5' },
  ];

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: c.background }]}
      contentContainerStyle={{ paddingBottom: bottomInset + 28 }}
      showsVerticalScrollIndicator={false}
      bounces={false}
    >
      {/* ── HERO ─────────────────────────────────────────────────────────── */}
      <View style={styles.hero}>
        <Image source={require('@/assets/images/umrah-hero.jpg')} style={StyleSheet.absoluteFill as never} contentFit="cover" />
        <LinearGradient
          colors={['rgba(10,35,66,0.55)', 'rgba(10,35,66,0.82)', c.background]}
          locations={[0, 0.6, 1]}
          style={StyleSheet.absoluteFill}
        />
        <View style={[styles.heroContent, { paddingTop: topInset + 28 }]}>
          <Image source={require('@/assets/images/absher-logo-transparent.png')} style={styles.logo} contentFit="contain" />
          <Text style={[styles.heroTitle, { fontFamily: 'Cairo_700Bold' }]}>{t('umrahLanding.title')}</Text>
          <Text style={[styles.heroDesc, { fontFamily: 'Cairo_400Regular' }]}>{t('umrahLanding.desc')}</Text>
        </View>
      </View>

      {/* ── MAIN SERVICE CARD ────────────────────────────────────────────── */}
      <View style={styles.content}>
        <View style={[styles.mainCard, { backgroundColor: c.card, borderColor: c.border }]}>
          <View style={styles.mainCardHead}>
            <View style={{ flex: 1, alignItems: 'flex-end' }}>
              <Text style={[styles.mainTitle, { color: c.foreground, fontFamily: 'Cairo_700Bold' }]}>{t('umrahLanding.cardTitle')}</Text>
              <Text style={[styles.mainSubtitle, { color: colors.umrahGreen, fontFamily: 'Cairo_600SemiBold' }]}>{t('umrahLanding.cardSubtitle')}</Text>
            </View>
            <View style={[styles.mainIcon, { backgroundColor: colors.umrahGreen + '14' }]}>
              <Ionicons name="moon" size={26} color={colors.umrahGreen} />
            </View>
          </View>

          <View style={styles.infoList}>
            {infoLines.map((line) => (
              <View key={line.key} style={styles.infoLine}>
                <Text style={[styles.infoText, { color: c.foreground, fontFamily: 'Cairo_400Regular' }]}>{t(line.key)}</Text>
                <View style={[styles.infoIcon, { backgroundColor: c.goldTint }]}>
                  <Ionicons name={line.icon} size={16} color={GOLD} />
                </View>
              </View>
            ))}
          </View>

          <Pressable
            onPress={handleApply}
            style={({ pressed }) => [styles.ctaBtn, { opacity: pressed ? 0.92 : 1 }]}
          >
            <LinearGradient colors={[colors.umrahGreen, '#0A3D28']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.ctaGradient}>
              <Ionicons name="arrow-back" size={20} color="#FFFFFF" />
              <Text style={[styles.ctaText, { fontFamily: 'Cairo_700Bold' }]}>{t('umrahLanding.cta')}</Text>
            </LinearGradient>
          </Pressable>
        </View>

        {/* ── SECONDARY: MY APPLICATIONS ─────────────────────────────────── */}
        <View style={styles.appsSection}>
          <Text style={[styles.appsHeading, { color: c.mutedForeground, fontFamily: 'Cairo_600SemiBold' }]}>{t('umrahLanding.myApplications')}</Text>
          {appsLoading ? (
            <ActivityIndicator color={colors.gold} style={{ marginVertical: 16 }} />
          ) : umrahApps.length === 0 ? (
            <Text style={[styles.appsEmpty, { color: c.mutedForeground, fontFamily: 'Cairo_400Regular' }]}>{t('umrahLanding.noApplications')}</Text>
          ) : (
            <View style={{ gap: 10 }}>
              {umrahApps.slice(0, 3).map((app) => (
                <UmrahAppRow key={app.id} app={app} lang={lang as Lang} />
              ))}
            </View>
          )}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },

  hero: { height: 340, width: '100%', justifyContent: 'flex-start', overflow: 'hidden' },
  heroContent: { alignItems: 'center', paddingHorizontal: 28, gap: 10 },
  logo: { width: 170, height: 84, marginBottom: 6 },
  heroTitle: { color: '#FFFFFF', fontSize: 30, textAlign: 'center', textShadowColor: 'rgba(0,0,0,0.45)', textShadowOffset: { width: 0, height: 2 }, textShadowRadius: 8 },
  heroDesc: { color: '#E8EDF4', fontSize: 14.5, textAlign: 'center', lineHeight: 23, maxWidth: 340 },

  content: { paddingHorizontal: 20, marginTop: -44 },

  mainCard: {
    borderRadius: 24,
    borderWidth: 1,
    padding: 22,
    gap: 20,
    shadowColor: NAVY,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.14,
    shadowRadius: 24,
    elevation: 10,
  },
  mainCardHead: { flexDirection: 'row-reverse', alignItems: 'center', gap: 14 },
  mainTitle: { fontSize: 21, textAlign: 'right' },
  mainSubtitle: { fontSize: 14, textAlign: 'right', marginTop: 2 },
  mainIcon: { width: 54, height: 54, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },

  infoList: { gap: 14 },
  infoLine: { flexDirection: 'row-reverse', alignItems: 'center', gap: 12 },
  infoIcon: { width: 30, height: 30, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  infoText: { flex: 1, fontSize: 14.5, textAlign: 'right', lineHeight: 22 },

  ctaBtn: { borderRadius: 16, overflow: 'hidden', shadowColor: colors.umrahGreen, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.28, shadowRadius: 12, elevation: 6 },
  ctaGradient: { flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'center', gap: 10, paddingVertical: 17 },
  ctaText: { color: '#FFFFFF', fontSize: 17 },

  appsSection: { marginTop: 28, gap: 12 },
  appsHeading: { fontSize: 14, textAlign: 'right' },
  appsEmpty: { fontSize: 13.5, textAlign: 'right', paddingVertical: 8 },

  appRow: { flexDirection: 'row-reverse', alignItems: 'center', gap: 10, borderWidth: 1, borderRadius: 14, padding: 14 },
  appTopRow: { flexDirection: 'row-reverse', alignItems: 'center', gap: 8, flexWrap: 'wrap', justifyContent: 'flex-start' },
  appTracking: { fontSize: 15, writingDirection: 'ltr' },
  appMeta: { fontSize: 12.5 },
  chip: { flexDirection: 'row-reverse', alignItems: 'center', gap: 4, borderWidth: 1, borderRadius: 16, paddingHorizontal: 10, paddingVertical: 4 },
  chipText: { fontSize: 11.5 },
});
