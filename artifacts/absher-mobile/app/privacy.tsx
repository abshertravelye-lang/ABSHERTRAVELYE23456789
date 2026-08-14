import React from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import { useLanguage } from '@/context/LanguageContext';

type Section = { title: string; intro?: string; bullets?: string[]; body?: string[] };

export default function PrivacyScreen() {
  const colors = useColors();
  const { t } = useLanguage();
  const insets = useSafeAreaInsets();
  const topInset = Platform.OS === 'web' ? 67 : insets.top;
  const bottomInset = Platform.OS === 'web' ? 34 : insets.bottom;

  const LAST_UPDATED = t('legal.lastUpdatedDate') as string;

  const SECTIONS: Section[] = [
    {
      title: (t('privacy.sections.1.title') as string) || '1. البيانات التي نجمعها',
      intro: (t('privacy.sections.1.intro') as string) || 'نقوم بجمع البيانات التالية لتقديم خدماتنا بالشكل الأمثل:',
      bullets: [
        (t('privacy.sections.1.bullets.1') as string) || 'بيانات الحساب: الاسم، البريد الإلكتروني، رقم الهاتف، ورقم الواتساب.',
        (t('privacy.sections.1.bullets.2') as string) || 'بيانات جواز السفر: رقم الجواز، الجنسية، تاريخ الميلاد، وتواريخ الإصدار والانتهاء — لغرض معالجة طلبات التأشيرة.',
        (t('privacy.sections.1.bullets.3') as string) || 'المستندات والصور المرفوعة: صورة جواز السفر، الصورة الشخصية، ومستندات الإقامة اللازمة لإتمام الطلبات.',
        (t('privacy.sections.1.bullets.4') as string) || 'بيانات الاستخدام: معلومات تقنية حول تفاعلك مع التطبيق لتحسين تجربتك.',
      ],
    },
    {
      title: (t('privacy.sections.2.title') as string) || '2. كيفية استخدام بياناتك',
      intro: (t('privacy.sections.2.intro') as string) || 'نستخدم بياناتك للأغراض التالية فقط:',
      bullets: [
        (t('privacy.sections.2.bullets.1') as string) || 'معالجة طلبات التأشيرة وتقديمها إلى الجهات الرسمية والسفارات المختصة.',
        (t('privacy.sections.2.bullets.2') as string) || 'إدارة حجوزاتك ورحلاتك وبرامجك السياحية.',
        (t('privacy.sections.2.bullets.3') as string) || 'التواصل معك بشأن حالة طلباتك وإشعارك بالتحديثات المهمة.',
        (t('privacy.sections.2.bullets.4') as string) || 'تحسين خدماتنا وتجربة استخدام التطبيق.',
      ],
    },
    {
      title: (t('privacy.sections.3.title') as string) || '3. مشاركة البيانات',
      body: [
        (t('privacy.sections.3.body.1') as string) || 'لا نبيع بياناتك الشخصية لأي طرف ثالث. قد نشارك بياناتك ومستنداتك فقط مع الجهات الحكومية والسفارات والقنصليات ومزوّدي الخدمات الضروريين لمعالجة طلبك (مثل شركات الطيران أو مقدمي خدمات التأشيرات).',
        (t('privacy.sections.3.body.2') as string) || 'قد نُفصح عن البيانات عند طلبها قانونياً من الجهات المختصة.',
      ],
    },
    {
      title: (t('privacy.sections.4.title') as string) || '4. حماية البيانات',
      body: [
        (t('privacy.sections.4.body.1') as string) || 'نتخذ تدابير أمنية تقنية وتنظيمية معقولة لحماية بياناتك من الوصول أو الاستخدام غير المصرّح به. يتم نقل المستندات وتخزينها عبر قنوات مؤمّنة.',
        (t('privacy.sections.4.body.2') as string) || 'رغم حرصنا، لا يمكن ضمان أمان مطلق لأي وسيلة نقل عبر الإنترنت بنسبة 100%.',
      ],
    },
    {
      title: (t('privacy.sections.5.title') as string) || '5. الاحتفاظ بالبيانات',
      body: [
        (t('privacy.sections.5.body.1') as string) || 'نحتفظ ببياناتك ومستنداتك طوال المدة اللازمة لتقديم الخدمة والامتثال للالتزامات القانونية. يمكنك طلب حذف حسابك وبياناتك في أي وقت من خلال إعدادات التطبيق أو بالتواصل معنا.',
      ],
    },
    {
      title: (t('privacy.sections.6.title') as string) || '6. حقوقك',
      intro: (t('privacy.sections.6.intro') as string) || 'لديك الحق في:',
      bullets: [
        (t('privacy.sections.6.bullets.1') as string) || 'الوصول إلى بياناتك الشخصية وتصحيحها من خلال شاشة الملف الشخصي.',
        (t('privacy.sections.6.bullets.2') as string) || 'طلب حذف حسابك وبياناتك بشكل نهائي.',
        (t('privacy.sections.6.bullets.3') as string) || 'سحب موافقتك على معالجة بياناتك في أي وقت.',
      ],
    },
    {
      title: (t('privacy.sections.7.title') as string) || '7. الأذونات على الجهاز',
      body: [
        (t('privacy.sections.7.body.1') as string) || 'قد يطلب التطبيق إذن الوصول إلى معرض الصور أو الكاميرا لرفع المستندات والصورة الشخصية. تُستخدم هذه الأذونات فقط عند قيامك برفع ملف، ولا نصل إليها في الخلفية.',
      ],
    },
    {
      title: (t('privacy.sections.8.title') as string) || '8. التواصل معنا',
      body: [
        (t('privacy.sections.8.body.1') as string) || 'إذا كان لديك أي استفسار حول سياسة الخصوصية أو ترغب في ممارسة أي من حقوقك، يمكنك التواصل مع فريق الدعم عبر القنوات المتاحة داخل التطبيق.',
      ],
    },
  ];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topInset + 12, backgroundColor: colors.primary }]}>
        <View style={styles.headerRow}>
          <Pressable onPress={() => router.back()} hitSlop={10}>
            <Ionicons name="arrow-forward" size={24} color="#FFFFFF" />
          </Pressable>
          <Text style={[styles.headerTitle, { fontFamily: 'Cairo_700Bold' }]}>{(t('legal.privacy.title') as string) || 'سياسة الخصوصية'}</Text>
          <View style={{ width: 24 }} />
        </View>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: bottomInset + 40 }} showsVerticalScrollIndicator={false}>
        <View style={[styles.intro, { backgroundColor: colors.card, borderColor: colors.border, shadowColor: colors.primary }]}>
          <View style={[styles.introIcon, { backgroundColor: colors.cyanTint }]}>
            <Ionicons name="lock-closed-outline" size={26} color={colors.secondary} />
          </View>
          <Text style={[styles.introTitle, { color: colors.foreground, fontFamily: 'Cairo_700Bold' }]}>
            {(t('privacy.introTitle') as string) || 'خصوصيتك تهمّنا'}
          </Text>
          <Text style={[styles.introSub, { color: colors.mutedForeground, fontFamily: 'Cairo_400Regular' }]}>
            {(t('privacy.introSub') as string) || 'نوضح لك كيف نجمع بياناتك ونستخدمها ونحميها'} — {(t('terms.lastUpdated') as string) || 'آخر تحديث:'} {LAST_UPDATED}
          </Text>
        </View>

        {SECTIONS.map((sec) => (
          <View key={sec.title} style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.foreground, fontFamily: 'Cairo_700Bold' }]}>
              {sec.title}
            </Text>
            {sec.intro ? (
              <Text style={[styles.paragraph, { color: colors.mutedForeground, fontFamily: 'Cairo_400Regular' }]}>
                {sec.intro}
              </Text>
            ) : null}
            {sec.bullets?.map((b, i) => (
              <View key={i} style={styles.bulletRow}>
                <Text style={[styles.bulletText, { color: colors.mutedForeground, fontFamily: 'Cairo_400Regular' }]}>
                  {b}
                </Text>
                <View style={[styles.bulletDot, { backgroundColor: colors.accent }]} />
              </View>
            ))}
            {sec.body?.map((p, i) => (
              <Text
                key={i}
                style={[styles.paragraph, { color: colors.mutedForeground, fontFamily: 'Cairo_400Regular' }]}
              >
                {p}
              </Text>
            ))}
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 16, paddingBottom: 16, borderBottomLeftRadius: 24, borderBottomRightRadius: 24 },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  headerTitle: { color: '#FFFFFF', fontSize: 20 },
  intro: { borderRadius: 18, borderWidth: 1, padding: 24, alignItems: 'center', gap: 10, marginBottom: 24, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 2 },
  introIcon: { width: 56, height: 56, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  introTitle: { fontSize: 18, textAlign: 'center' },
  introSub: { fontSize: 13, textAlign: 'center', lineHeight: 22 },
  section: { marginBottom: 24, paddingHorizontal: 8 },
  sectionTitle: { fontSize: 16, textAlign: 'right', marginBottom: 10 },
  paragraph: { fontSize: 14, textAlign: 'right', lineHeight: 26, marginBottom: 12 },
  bulletRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 12 },
  bulletDot: { width: 6, height: 6, borderRadius: 3, marginTop: 10 },
  bulletText: { flex: 1, fontSize: 14, textAlign: 'right', lineHeight: 26 },
});
