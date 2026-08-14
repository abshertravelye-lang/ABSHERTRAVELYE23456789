import React from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import { useLanguage } from '@/context/LanguageContext';

type Section = { title: string; body: string[] };

export default function TermsScreen() {
  const colors = useColors();
  const { t } = useLanguage();
  const insets = useSafeAreaInsets();
  const topInset = Platform.OS === 'web' ? 67 : insets.top;
  const bottomInset = Platform.OS === 'web' ? 34 : insets.bottom;

  const LAST_UPDATED = t('legal.lastUpdatedDate') as string;

  const SECTIONS: Section[] = [
    {
      title: (t('terms.sections.1.title') as string) || '1. مقدمة وقبول الشروط',
      body: [
        (t('terms.sections.1.body.1') as string) || 'مرحباً بك في تطبيق ABSHER TRAVEL. باستخدامك لهذا التطبيق فإنك توافق على الالتزام بهذه الشروط والأحكام كاملةً. إذا كنت لا توافق على أي بند من هذه البنود، يُرجى التوقف عن استخدام التطبيق.',
        (t('terms.sections.1.body.2') as string) || 'تحتفظ الشركة بحقها في تعديل هذه الشروط في أي وقت، وسيتم إشعارك بأي تغييرات جوهرية عبر التطبيق.',
      ],
    },
    {
      title: (t('terms.sections.2.title') as string) || '2. الخدمات المقدّمة',
      body: [
        (t('terms.sections.2.body.1') as string) || 'يوفر التطبيق خدمات حجز الرحلات والبرامج السياحية، والتقديم على التأشيرات ومعالجة طلباتها، وإدارة المستندات المتعلقة بالسفر.',
        (t('terms.sections.2.body.2') as string) || 'الخدمات المقدّمة قد تخضع لموافقة الجهات الرسمية والسفارات والقنصليات، ولا نضمن الحصول على أي تأشيرة، إذ يبقى قرار المنح بيد الجهة المختصة.',
      ],
    },
    {
      title: (t('terms.sections.3.title') as string) || '3. حساب المستخدم',
      body: [
        (t('terms.sections.3.body.1') as string) || 'أنت مسؤول عن الحفاظ على سرية بيانات الدخول الخاصة بك، وعن جميع الأنشطة التي تتم عبر حسابك.',
        (t('terms.sections.3.body.2') as string) || 'تتعهد بتقديم بيانات صحيحة ودقيقة وكاملة عند إنشاء الحساب وعند تقديم طلبات التأشيرة، وتتحمل المسؤولية الكاملة عن صحة هذه البيانات والمستندات المرفوعة.',
      ],
    },
    {
      title: (t('terms.sections.4.title') as string) || '4. المستندات وبيانات جواز السفر',
      body: [
        (t('terms.sections.4.body.1') as string) || 'عند التقديم على التأشيرات قد يُطلب منك رفع صورة جواز السفر وصورتك الشخصية ومستندات الإقامة. تُستخدم هذه المستندات حصراً لغرض معالجة طلبك لدى الجهات المختصة.',
        (t('terms.sections.4.body.2') as string) || 'تقرّ بأن جميع المستندات المرفوعة صحيحة وتخصّك أو تخص من تمثّلهم قانونياً، وتتحمل المسؤولية الكاملة عن أي مستندات مزوّرة أو غير صحيحة.',
      ],
    },
    {
      title: (t('terms.sections.5.title') as string) || '5. الرسوم والمدفوعات',
      body: [
        (t('terms.sections.5.body.1') as string) || 'تُعرض أسعار الخدمات داخل التطبيق قبل إتمام أي طلب. قد تشمل بعض الطلبات رسوماً حكومية أو رسوم سفارات غير قابلة للاسترداد.',
        (t('terms.sections.5.body.2') as string) || 'يخضع استرداد المبالغ لسياسة الإلغاء والاسترداد الخاصة بكل خدمة، وقد لا تكون بعض الرسوم قابلة للاسترجاع بعد بدء معالجة الطلب.',
      ],
    },
    {
      title: (t('terms.sections.6.title') as string) || '6. مسؤوليات المستخدم',
      body: [
        (t('terms.sections.6.body.1') as string) || 'تتعهد بعدم استخدام التطبيق لأي غرض غير قانوني أو مخالف للأنظمة المعمول بها.',
        (t('terms.sections.6.body.2') as string) || 'يُمنع رفع أي محتوى مسيء أو مخالف، أو محاولة الوصول غير المصرّح به إلى أنظمة التطبيق أو بيانات مستخدمين آخرين.',
      ],
    },
    {
      title: (t('terms.sections.7.title') as string) || '7. حدود المسؤولية',
      body: [
        (t('terms.sections.7.body.1') as string) || 'نبذل قصارى جهدنا لتقديم خدمة موثوقة، إلا أننا لا نتحمل المسؤولية عن أي تأخير أو رفض من الجهات الرسمية، أو عن الأضرار الناتجة عن معلومات غير دقيقة قدّمها المستخدم.',
        (t('terms.sections.7.body.2') as string) || 'لا نتحمل المسؤولية عن انقطاع الخدمة لأسباب فنية خارجة عن إرادتنا.',
      ],
    },
    {
      title: (t('terms.sections.8.title') as string) || '8. الملكية الفكرية',
      body: [
        (t('terms.sections.8.body.1') as string) || 'جميع الحقوق المتعلقة بالتطبيق وشعاره ومحتواه وتصميمه مملوكة للشركة، ولا يجوز نسخها أو إعادة استخدامها دون إذن خطّي مسبق.',
      ],
    },
    {
      title: (t('terms.sections.9.title') as string) || '9. التواصل معنا',
      body: [
        (t('terms.sections.9.body.1') as string) || 'لأي استفسار حول هذه الشروط والأحكام يمكنك التواصل مع فريق الدعم عبر قنوات التواصل المتاحة داخل التطبيق.',
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
          <Text style={[styles.headerTitle, { fontFamily: 'Cairo_700Bold' }]}>{(t('legal.terms.title') as string) || 'الشروط والأحكام'}</Text>
          <View style={{ width: 24 }} />
        </View>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: bottomInset + 40 }} showsVerticalScrollIndicator={false}>
        <View style={[styles.intro, { backgroundColor: colors.card, borderColor: colors.border, shadowColor: colors.primary }]}>
          <View style={[styles.introIcon, { backgroundColor: colors.goldTint }]}>
            <Ionicons name="shield-checkmark-outline" size={26} color={colors.accent} />
          </View>
          <Text style={[styles.introTitle, { color: colors.foreground, fontFamily: 'Cairo_700Bold' }]}>
            ABSHER TRAVEL
          </Text>
          <Text style={[styles.introSub, { color: colors.mutedForeground, fontFamily: 'Cairo_400Regular' }]}>
            {(t('terms.lastUpdated') as string) || 'آخر تحديث:'} {LAST_UPDATED}
          </Text>
        </View>

        {SECTIONS.map((sec) => (
          <View key={sec.title} style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.foreground, fontFamily: 'Cairo_700Bold' }]}>
              {sec.title}
            </Text>
            {sec.body.map((p, i) => (
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
  introSub: { fontSize: 13, textAlign: 'center' },
  section: { marginBottom: 24, paddingHorizontal: 8 },
  sectionTitle: { fontSize: 16, textAlign: 'right', marginBottom: 10 },
  paragraph: { fontSize: 14, textAlign: 'right', lineHeight: 26, marginBottom: 12 },
});
