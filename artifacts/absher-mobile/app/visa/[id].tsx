import React, { useState } from 'react';
import {
  ActivityIndicator, Alert, Modal, Pressable, ScrollView,
  StyleSheet, Text, TextInput, View, Image as RNImage
} from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { useColors } from '@/hooks/useColors';
import { useLanguage } from '@/context/LanguageContext';
import { useGetVisa, useCreateVisaApplication } from '@workspace/api-client-react';
import DatePickerModal, { DateField } from '@/components/DatePickerModal';
import ImageUploader from '@/components/ImageUploader';
import { useAuth } from '@/context/AuthContext';

const STATUS_LABEL_KEYS: Record<string, string> = {
  available: 'visaDetail.status.available', suspended: 'visaDetail.status.suspended', closed: 'visaDetail.status.closed',
};
const STATUS_COLORS: Record<string, string> = {
  available: '#16A34A', suspended: '#EAB308', closed: '#EF4444',
};

type DatePickerKey = 'dateOfBirth' | 'passportIssueDate' | 'passportExpiryDate';

const todayISO = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

export default function VisaDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colors = useColors();
  const { t, lang } = useLanguage();
  const insets = useSafeAreaInsets();
  const { user: authUser } = useAuth();

  const { data: visa, isLoading } = useGetVisa(Number(id));
  const createApp = useCreateVisaApplication();

  const [showForm,     setShowForm]     = useState(false);
  const [activePicker, setActivePicker] = useState<DatePickerKey | null>(null);

  const [form, setForm] = useState({
    fullName: '', nationality: '', passportNumber: '',
    passportIssueDate: '', passportExpiryDate: '', dateOfBirth: '',
    gender: 'male' as 'male' | 'female',
    email: '', phone: '',
    agreedToTerms: false,
    // image URLs (populated by ImageUploader after upload)
    personalPhotoUrl: '',
    passportImageUrl: '',
    residencyImageUrl: '',
    residencyBackImageUrl: '',
    visaImageUrl: '',
    alternativeVisaNumber: '',
    alternativeVisaExpiry: '',
  });

  const set = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) =>
    setForm(f => ({ ...f, [k]: v }));

  /** Auth + profile-completeness gate before opening the application form. */
  const openApplicationForm = () => {
    if (!authUser) {
      Alert.alert(
        'تسجيل الدخول مطلوب',
        'يجب تسجيل الدخول للتقديم على التأشيرة',
        [
          { text: 'إلغاء', style: 'cancel' },
          { text: 'تسجيل الدخول', onPress: () => router.push('/auth/login') },
        ],
      );
      return;
    }
    const profileComplete = !!(
      authUser.firstName && authUser.lastName && authUser.phone &&
      authUser.nationality && authUser.dateOfBirth &&
      authUser.profilePhotoUrl && authUser.passportNumber && authUser.passportExpiryDate
    );
    if (!profileComplete) {
      Alert.alert(
        'الملف الشخصي غير مكتمل',
        'يرجى إكمال بياناتك الشخصية قبل التقديم على التأشيرة',
        [
          { text: 'إلغاء', style: 'cancel' },
          { text: 'إكمال الملف', onPress: () => router.push('/(tabs)/account') },
        ],
      );
      return;
    }
    setShowForm(true);
  };

  // Determine whether each doc section is required based on visa flags
  const needsPersonalPhoto  = visa?.requiresPersonalPhoto  !== false; // default true
  const needsPassportImage  = visa?.requiresPassportImage  !== false; // default true
  const needsResidencyImage = visa?.requiresResidencyImage === true;
  const needsAltVisa =
    visa?.acceptsSchengenResidency || visa?.acceptsUkResidency ||
    visa?.acceptsUsVisa || visa?.acceptsCanadaResidency || visa?.acceptsAustraliaResidency;

  const submit = () => {
    if (!form.fullName || !form.nationality || !form.passportNumber || !form.email || !form.phone) {
      Alert.alert(t('visaDetail.missingDataTitle'), t('visaDetail.missingDataBody'));
      return;
    }
    if (!form.agreedToTerms) {
      Alert.alert(t('visaDetail.agreementRequiredTitle'), t('visaDetail.agreementRequiredBody'));
      return;
    }
    if (needsPersonalPhoto && !form.personalPhotoUrl) {
      Alert.alert(t('visaDetail.photoRequiredTitle'), t('visaDetail.uploadPersonalPhoto'));
      return;
    }
    if (needsPassportImage && !form.passportImageUrl) {
      Alert.alert(t('visaDetail.photoRequiredTitle'), t('visaDetail.uploadPassportImage'));
      return;
    }
    if (needsResidencyImage && !form.residencyImageUrl) {
      Alert.alert(t('visaDetail.photoRequiredTitle'), t('visaDetail.uploadResidencyImage'));
      return;
    }

    createApp.mutate(
      {
        data: {
          visaId: Number(id),
          eligibilityPath: 'direct',
          fullName: form.fullName,
          nationality: form.nationality,
          passportNumber: form.passportNumber,
          passportIssueDate:  form.passportIssueDate  || '2020-01-01',
          passportExpiryDate: form.passportExpiryDate || '2030-01-01',
          dateOfBirth:        form.dateOfBirth        || '1990-01-01',
          gender: form.gender,
          email: form.email,
          phone: form.phone,
          agreedToTerms: true,
          personalPhotoUrl:     form.personalPhotoUrl     || undefined,
          passportImageUrl:     form.passportImageUrl     || undefined,
          residencyImageUrl:    form.residencyImageUrl    || undefined,
          visaImageUrl:         form.visaImageUrl         || undefined,
          alternativeVisaNumber: form.alternativeVisaNumber || undefined,
          alternativeVisaExpiry: form.alternativeVisaExpiry || undefined,
        },
      },
      {
        onSuccess: () => {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          setShowForm(false);
          Alert.alert(t('visaDetail.submitSuccessTitle'), t('visaDetail.submitSuccessBody'));
        },
        onError: (err: any) =>
          Alert.alert(t('flow.error'), err?.message || t('visaDetail.submitError')),
      },
    );
  };

  if (isLoading)
    return (
      <View style={[s.loading, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.navy} />
      </View>
    );
  if (!visa)
    return (
      <View style={[s.loading, { backgroundColor: colors.background }]}>
        <Text style={{ color: colors.mutedForeground, fontFamily: 'Cairo_400Regular' }}>
          {t('visaDetail.notFound')}
        </Text>
      </View>
    );

  const statusColor = STATUS_COLORS[visa.status] || '#64748B';
  const countryName = lang === 'ar' ? visa.countryAr : ((visa as any).countryEn || visa.countryAr);

  const isGCC = ['SA', 'AE', 'QA', 'KW', 'BH', 'OM'].includes(visa.countryCode || '');

  const datePickerConfigs: Record<DatePickerKey, { label: string; mode: 'birth' | 'passport'; minDate?: string; maxDate?: string }> = {
    dateOfBirth:        { label: t('visaDetail.dateOfBirth'),          mode: 'birth',    maxDate: todayISO() },
    passportIssueDate:  { label: t('visaDetail.passportIssueDate'),    mode: 'passport', maxDate: todayISO() },
    passportExpiryDate: { label: t('visaDetail.passportExpiryDate'),   mode: 'passport', minDate: todayISO() },
  };
  const activeConfig = activePicker ? datePickerConfigs[activePicker] : null;

  const allowedCountries = [
    { name: 'الإمارات العربية المتحدة', flag: 'AE', allowed: true },
    { name: 'المملكة العربية السعودية', flag: 'SA', allowed: true },
    { name: 'دولة الكويت', flag: 'KW', allowed: true },
    { name: 'دولة قطر', flag: 'QA', allowed: true },
    { name: 'سلطنة عمان', flag: 'OM', allowed: true },
    { name: 'مملكة البحرين', flag: 'BH', allowed: true },
  ];

  function flagEmoji(code: string): string {
    const c = (code || '').toUpperCase();
    if (c.length !== 2) return '🌍';
    return String.fromCodePoint(...[...c].map(x => 0x1F1E6 + x.charCodeAt(0) - 65));
  }

  return (
    <View style={[s.container, { backgroundColor: colors.background }]}>
      <View style={[s.topBar, { paddingTop: insets.top + 12 }]}>
         <Pressable style={s.iconBtn} onPress={() => router.back()}>
           <Ionicons name="chevron-forward" size={22} color={colors.primary} />
         </Pressable>
         <Image source={require('@/assets/images/absher-travel-logo-nobg.png')} style={s.logo} contentFit="contain" />
         <View style={s.headerRight}>
            <Pressable style={s.langPill}><Text style={[s.langText, { color: colors.primary }]}>AR</Text><Ionicons name="globe-outline" size={14} color={colors.primary} /></Pressable>
            <Pressable style={s.iconBtn}><Ionicons name="headset-outline" size={20} color={colors.primary} /></Pressable>
         </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={s.heroSection}>
          <Text style={[s.heroTitle, { color: colors.primary, fontFamily: 'Cairo_700Bold' }]}>
            طلب تأشيرة {countryName}
          </Text>
          <Text style={[s.heroSub, { color: colors.textSecondary, fontFamily: 'Cairo_400Regular' }]}>
            سافر بسهولة واحصل على تأشيرتك الإلكترونية في دقائق
          </Text>
          
          <View style={s.heroIllustration}>
             <View style={s.heroCircle}>
                <Ionicons name="earth" size={80} color={colors.accent} style={{ opacity: 0.2 }} />
             </View>
             <View style={[s.passport, { backgroundColor: colors.primary }]}>
                <Text style={s.passportTitle}>{isGCC ? 'GCC' : 'VISA'}</Text>
                {isGCC && <Text style={s.passportSub}>VISA</Text>}
                <Ionicons name="globe-outline" size={isGCC ? 30 : 40} color={colors.accent} style={{ marginTop: isGCC ? 10 : 20 }} />
             </View>
          </View>
        </View>

        <View style={s.progressStrip}>
          {[
            { num: 1, label: 'البيانات الأساسية', sub: 'جنسيتك' },
            { num: 2, label: 'بيانات الطلب', sub: 'تفاصيلك' },
            { num: 3, label: 'المستندات', sub: 'رفع المستندات' },
            { num: 4, label: 'مراجعة الطلب', sub: 'مراجعة وتأكيد' },
            { num: 5, label: 'الدفع', sub: 'دفع الرسوم' },
          ].map((step, i) => (
            <React.Fragment key={i}>
              <View style={s.stepItem}>
                <View style={[s.stepNum, { backgroundColor: i === 0 ? colors.accent : '#F1F5F9' }]}>
                  <Text style={[s.stepNumText, { color: i === 0 ? '#FFFFFF' : colors.textSecondary, fontFamily: 'Cairo_700Bold' }]}>{step.num}</Text>
                </View>
                <Text style={[s.stepLabel, { color: i === 0 ? colors.text : colors.textSecondary, fontFamily: 'Cairo_700Bold' }]}>{step.label}</Text>
                <Text style={[s.stepSub, { color: colors.textSecondary, fontFamily: 'Cairo_400Regular' }]}>{step.sub}</Text>
              </View>
              {i < 4 && <View style={[s.stepLine, { backgroundColor: '#E2E8F0' }]} />}
            </React.Fragment>
          ))}
        </View>

        <View style={[s.contentCard, { backgroundColor: colors.card }]}>
           <Text style={[s.cardTitle, { color: colors.primary, fontFamily: 'Cairo_700Bold' }]}>الجنسية</Text>
           <Text style={[s.cardSub, { color: colors.textSecondary, fontFamily: 'Cairo_400Regular' }]}>اختر جنسيتك لمعرفة إمكانية التقديم</Text>
           
           <Pressable style={s.dropdown} onPress={openApplicationForm}>
             <Ionicons name="chevron-down" size={20} color={colors.textSecondary} />
             <Text style={[s.dropdownText, { color: colors.textSecondary, fontFamily: 'Cairo_400Regular' }]}>اختر جنسيتك</Text>
             <Ionicons name="globe-outline" size={20} color={colors.primary} />
           </Pressable>
        </View>

        {isGCC && (
          <View style={[s.contentCard, { backgroundColor: colors.card, marginTop: 12 }]}>
            <Text style={[s.cardTitle, { color: colors.primary, fontFamily: 'Cairo_700Bold' }]}>الدول المسموح لها بالتقديم</Text>
            <Text style={[s.cardSub, { color: colors.textSecondary, fontFamily: 'Cairo_400Regular' }]}>يمكن لحاملي جوازات السفر التالية التقديم على تأشيرة دول مجلس التعاون الخليجي إلكترونياً</Text>
            
            <View style={s.flagsGrid}>
              {allowedCountries.map((c, i) => (
                <View key={i} style={s.flagCard}>
                  <View style={s.flagCircle}>
                    <Text style={s.flagEmoji}>{flagEmoji(c.flag)}</Text>
                  </View>
                  <Text style={[s.flagName, { color: colors.text, fontFamily: 'Cairo_600SemiBold' }]}>{c.name}</Text>
                  <View style={[s.allowedChip, { backgroundColor: 'rgba(22,163,74,0.1)' }]}>
                    <Text style={[s.allowedText, { color: colors.success, fontFamily: 'Cairo_600SemiBold' }]}>مسموح</Text>
                  </View>
                </View>
              ))}
            </View>

            <View style={[s.infoBanner, { backgroundColor: '#F8FAFC' }]}>
              <View style={{ flex: 1, paddingRight: 12 }}>
                <Text style={[s.infoBannerTitle, { color: colors.text, fontFamily: 'Cairo_600SemiBold' }]}>لا تجد جنسيتك في القائمة؟</Text>
                <Text style={[s.infoBannerSub, { color: colors.textSecondary, fontFamily: 'Cairo_400Regular' }]}>
                  حالياً لا يمكنك التقديم إلكترونياً. يرجى التواصل مع فريق الدعم لمعرفة خيارات التقديم المتاحة.
                </Text>
              </View>
              <View style={[s.infoBannerIcon, { backgroundColor: colors.primary }]}>
                 <Ionicons name="information" size={20} color="#FFFFFF" />
              </View>
            </View>
          </View>
        )}

        <View style={s.trustStrip}>
          <View style={s.trustStripLeft}>
            <View style={s.trustShield}>
              <Ionicons name="shield-checkmark" size={24} color={colors.accent} />
            </View>
          </View>
          <View style={s.trustStripRight}>
            <Text style={[s.trustTitle, { color: colors.text, fontFamily: 'Cairo_700Bold' }]}>تجربة آمنة وموثوقة</Text>
            <Text style={[s.trustSub, { color: colors.textSecondary, fontFamily: 'Cairo_400Regular' }]}>
              نضمن لك حماية بياناتك وخصوصيتك وفق أعلى معايير الأمان
            </Text>
          </View>
        </View>

        <View style={{ height: 120 }} />
      </ScrollView>

      {/* ── Apply Button (mocked on this screen to open form) ──────────────── */}
      <View style={[s.footer, { paddingBottom: insets.bottom + 16, backgroundColor: colors.card, borderTopColor: colors.border }]}>
        <Pressable
          style={({ pressed }) => [s.applyBtn, { backgroundColor: colors.navy, opacity: pressed ? 0.9 : 1 }]}
          onPress={openApplicationForm}
        >
          <Text style={[s.applyBtnText, { fontFamily: 'Cairo_700Bold' }]}>
            {!authUser ? 'سجل دخولك للتقديم' : 'ابدأ بتقديم طلبك'}
          </Text>
        </Pressable>
      </View>

      {/* ═══════════════════════════════════════════════════════════════════
          Application Form Modal (Kept fully intact)
          ═══════════════════════════════════════════════════════════════════ */}
      <Modal visible={showForm} animationType="slide" presentationStyle="pageSheet">
        <View style={[s.modal, { backgroundColor: colors.background }]}>
          <View style={[s.modalHeader, { borderBottomColor: colors.border, backgroundColor: colors.card }]}>
            <Pressable onPress={() => setShowForm(false)} hitSlop={10}>
              <Ionicons name="close" size={24} color={colors.foreground} />
            </Pressable>
            <Text style={[s.modalTitle, { color: colors.foreground, fontFamily: 'Cairo_700Bold' }]}>
              طلب تأشيرة {countryName}
            </Text>
            <View style={{ width: 24 }} />
          </View>

          <ScrollView contentContainerStyle={s.formContent} keyboardShouldPersistTaps="handled">
            {/* ── Personal Info ──────────────────────────────────────────── */}
            <View style={[s.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={s.sectionHeader}>
                <Ionicons name="person-outline" size={18} color={colors.navy} />
                <Text style={[s.sectionHeaderText, { color: colors.foreground, fontFamily: 'Cairo_700Bold' }]}>
                  البيانات الشخصية
                </Text>
              </View>

              {([
                { key: 'fullName',    label: 'الاسم الكامل',       placeholder: 'محمد أحمد السعيد',  keyboard: 'default' },
                { key: 'nationality', label: 'الجنسية',             placeholder: 'سعودي',              keyboard: 'default' },
                { key: 'email',       label: 'البريد الإلكتروني',   placeholder: 'example@email.com',  keyboard: 'email-address' },
                { key: 'phone',       label: 'رقم الهاتف',          placeholder: '+966 50 000 0000',   keyboard: 'phone-pad' },
              ] as { key: keyof typeof form; label: string; placeholder: string; keyboard: any }[]).map(f => (
                <View key={String(f.key)} style={s.field}>
                  <Text style={[s.fieldLabel, { color: colors.foreground, fontFamily: 'Cairo_600SemiBold' }]}>{f.label}</Text>
                  <TextInput
                    value={String(form[f.key])}
                    onChangeText={v => set(f.key as any, v)}
                    placeholder={f.placeholder}
                    placeholderTextColor={colors.mutedForeground}
                    keyboardType={f.keyboard}
                    style={[s.fieldInput, { backgroundColor: colors.muted, borderColor: colors.border, color: colors.foreground, fontFamily: 'Cairo_400Regular' }]}
                    textAlign="right"
                  />
                </View>
              ))}

              <View style={s.field}>
                <Text style={[s.fieldLabel, { color: colors.foreground, fontFamily: 'Cairo_600SemiBold' }]}>تاريخ الميلاد</Text>
                <DateField
                  value={form.dateOfBirth}
                  placeholder="اختر تاريخ الميلاد"
                  onPress={() => setActivePicker('dateOfBirth')}
                  colors={colors}
                />
              </View>

              <View style={s.field}>
                <Text style={[s.fieldLabel, { color: colors.foreground, fontFamily: 'Cairo_600SemiBold' }]}>الجنس</Text>
                <View style={s.genderRow}>
                  {(['male', 'female'] as const).map(g => (
                    <Pressable
                      key={g}
                      style={[s.genderBtn, { backgroundColor: form.gender === g ? colors.navy : colors.muted, borderColor: colors.border }]}
                      onPress={() => set('gender', g)}
                    >
                      <Text style={[s.genderText, { color: form.gender === g ? '#FFFFFF' : colors.foreground, fontFamily: 'Cairo_600SemiBold' }]}>
                        {g === 'male' ? '👨  ذكر' : '👩  أنثى'}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>
            </View>

            {/* ── Passport ──────────────────────────────────────────────── */}
            <View style={[s.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={s.sectionHeader}>
                <Ionicons name="card-outline" size={18} color={colors.navy} />
                <Text style={[s.sectionHeaderText, { color: colors.foreground, fontFamily: 'Cairo_700Bold' }]}>
                  بيانات جواز السفر
                </Text>
              </View>

              <View style={s.field}>
                <Text style={[s.fieldLabel, { color: colors.foreground, fontFamily: 'Cairo_600SemiBold' }]}>رقم الجواز</Text>
                <TextInput
                  value={form.passportNumber}
                  onChangeText={v => set('passportNumber', v)}
                  placeholder="رقم الجواز"
                  placeholderTextColor={colors.mutedForeground}
                  autoCapitalize="characters"
                  style={[s.fieldInput, { backgroundColor: colors.muted, borderColor: colors.border, color: colors.foreground, fontFamily: 'Cairo_400Regular' }]}
                  textAlign="right"
                />
              </View>

              <View style={s.twoCol}>
                <View style={{ flex: 1 }}>
                  <Text style={[s.fieldLabel, { color: colors.foreground, fontFamily: 'Cairo_600SemiBold' }]}>تاريخ الإصدار</Text>
                  <DateField
                    value={form.passportIssueDate}
                    placeholder="اختر التاريخ"
                    onPress={() => setActivePicker('passportIssueDate')}
                    colors={colors}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[s.fieldLabel, { color: colors.foreground, fontFamily: 'Cairo_600SemiBold' }]}>تاريخ الانتهاء</Text>
                  <DateField
                    value={form.passportExpiryDate}
                    placeholder="اختر التاريخ"
                    onPress={() => setActivePicker('passportExpiryDate')}
                    colors={colors}
                  />
                  {form.passportExpiryDate && form.passportExpiryDate < todayISO() && (
                    <Text style={[s.warn, { fontFamily: 'Cairo_400Regular' }]}>⚠️ الجواز منتهٍ</Text>
                  )}
                </View>
              </View>
            </View>

            {/* ── Documents ─────────────────────────────────────────────── */}
            <View style={[s.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={s.sectionHeader}>
                <Ionicons name="documents-outline" size={18} color={colors.navy} />
                <Text style={[s.sectionHeaderText, { color: colors.foreground, fontFamily: 'Cairo_700Bold' }]}>
                  المستندات المطلوبة
                </Text>
              </View>

              {needsPersonalPhoto && (
                <ImageUploader
                  label="الصورة الشخصية"
                  sublabel="صورة حديثة بخلفية بيضاء"
                  icon="person-circle-outline"
                  required
                  value={form.personalPhotoUrl}
                  onUpload={url => set('personalPhotoUrl', url)}
                  onRemove={() => set('personalPhotoUrl', '')}
                />
              )}

              {needsPassportImage && (
                <ImageUploader
                  label="صورة الجواز"
                  sublabel="الصفحة الأولى مع البيانات الشخصية"
                  icon="card-outline"
                  required
                  value={form.passportImageUrl}
                  onUpload={url => set('passportImageUrl', url)}
                  onRemove={() => set('passportImageUrl', '')}
                />
              )}

              {needsResidencyImage && (
                <>
                  <ImageUploader
                    label="صورة الإقامة (وجه)"
                    sublabel="الجهة الأمامية للإقامة"
                    icon="id-card-outline"
                    required
                    value={form.residencyImageUrl}
                    onUpload={url => set('residencyImageUrl', url)}
                    onRemove={() => set('residencyImageUrl', '')}
                  />
                  <ImageUploader
                    label="صورة الإقامة (ظهر)"
                    sublabel="الجهة الخلفية للإقامة"
                    icon="id-card-outline"
                    value={form.residencyBackImageUrl}
                    onUpload={url => set('residencyBackImageUrl', url)}
                    onRemove={() => set('residencyBackImageUrl', '')}
                  />
                </>
              )}

              {needsAltVisa && (
                <>
                  <ImageUploader
                    label="صورة التأشيرة البديلة"
                    sublabel={
                      [
                        visa?.acceptsSchengenResidency && 'شنغن',
                        visa?.acceptsUkResidency        && 'بريطانيا',
                        visa?.acceptsUsVisa             && 'أمريكا',
                        visa?.acceptsCanadaResidency    && 'كندا',
                        visa?.acceptsAustraliaResidency && 'أستراليا',
                      ]
                        .filter(Boolean)
                        .join(' · ') || 'تأشيرة بديلة'
                    }
                    icon="earth-outline"
                    value={form.visaImageUrl}
                    onUpload={url => set('visaImageUrl', url)}
                    onRemove={() => set('visaImageUrl', '')}
                  />
                  <View style={s.field}>
                    <Text style={[s.fieldLabel, { color: colors.foreground, fontFamily: 'Cairo_600SemiBold' }]}>رقم التأشيرة البديلة</Text>
                    <TextInput
                      value={form.alternativeVisaNumber}
                      onChangeText={v => set('alternativeVisaNumber', v)}
                      placeholder="رقم التأشيرة"
                      placeholderTextColor={colors.mutedForeground}
                      style={[s.fieldInput, { backgroundColor: colors.muted, borderColor: colors.border, color: colors.foreground, fontFamily: 'Cairo_400Regular' }]}
                      textAlign="right"
                    />
                  </View>
                </>
              )}
            </View>

            {/* ── Terms ─────────────────────────────────────────────────── */}
            <Pressable
              style={[s.termsRow, { backgroundColor: colors.card, borderColor: colors.border }]}
              onPress={() => set('agreedToTerms', !form.agreedToTerms)}
            >
              <Ionicons
                name={form.agreedToTerms ? 'checkbox' : 'square-outline'}
                size={24}
                color={form.agreedToTerms ? colors.navy : colors.mutedForeground}
              />
              <Text style={[s.termsText, { color: colors.foreground, fontFamily: 'Cairo_400Regular' }]}>
                أوافق على الشروط والأحكام وسياسة الخصوصية وأقر بصحة المعلومات المُدخلة
              </Text>
            </Pressable>

            {/* ── Submit ────────────────────────────────────────────────── */}
            <Pressable
              style={({ pressed }) => [s.submitBtn, { backgroundColor: colors.navy, opacity: pressed ? 0.9 : 1 }]}
              onPress={submit}
              disabled={createApp.isPending}
            >
              {createApp.isPending ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <>
                  <Ionicons name="send" size={18} color="#FFFFFF" />
                  <Text style={[s.submitBtnText, { fontFamily: 'Cairo_700Bold' }]}>تقديم الطلب</Text>
                </>
              )}
            </Pressable>
          </ScrollView>
        </View>

        {activeConfig && (
          <DatePickerModal
            visible={activePicker !== null}
            onClose={() => setActivePicker(null)}
            mode={activeConfig.mode}
            value={form[activePicker!] as string}
            onSelect={d => { set(activePicker! as any, d); setActivePicker(null); }}
            minDate={activeConfig.minDate}
            maxDate={activeConfig.maxDate}
            label={activeConfig.label}
          />
        )}
      </Modal>
    </View>
  );
}

const s = StyleSheet.create({
  container:       { flex: 1 },
  loading:         { flex: 1, alignItems: 'center', justifyContent: 'center' },
  
  topBar: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingBottom: 10 },
  iconBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center', elevation: 2, shadowColor: '#0A2342', shadowOpacity: 0.05, shadowRadius: 8 },
  logo: { width: 120, height: 40 },
  headerRight: { flexDirection: 'row-reverse', gap: 8 },
  langPill: { flexDirection: 'row-reverse', gap: 4, alignItems: 'center', backgroundColor: '#FFFFFF', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, elevation: 2, shadowColor: '#0A2342', shadowOpacity: 0.05, shadowRadius: 8 },
  langText: { fontFamily: 'Cairo_700Bold', fontSize: 12 },

  heroSection: { alignItems: 'center', paddingHorizontal: 24, paddingTop: 24, paddingBottom: 24 },
  heroTitle: { fontSize: 24, textAlign: 'center', marginBottom: 8 },
  heroSub: { fontSize: 14, textAlign: 'center', lineHeight: 22 },
  heroIllustration: { position: 'relative', width: 200, height: 220, alignItems: 'center', justifyContent: 'center', marginTop: 10 },
  heroCircle: { position: 'absolute', width: 160, height: 160, borderRadius: 80, backgroundColor: '#F0F4F8', alignItems: 'center', justifyContent: 'center' },
  passport: { width: 110, height: 160, borderRadius: 8, padding: 16, alignItems: 'center', elevation: 8, shadowColor: '#0A2342', shadowOpacity: 0.2, shadowRadius: 12, shadowOffset: { width: -4, height: 8 }, transform: [{ rotate: '5deg' }] },
  passportTitle: { color: '#C9A24B', fontSize: 20, fontFamily: 'Cairo_700Bold', marginTop: 10 },
  passportSub: { color: '#C9A24B', fontSize: 12, fontFamily: 'Cairo_600SemiBold', letterSpacing: 2 },

  progressStrip: { flexDirection: 'row-reverse', justifyContent: 'center', alignItems: 'flex-start', paddingHorizontal: 16, marginBottom: 24 },
  stepItem: { alignItems: 'center', width: 60 },
  stepNum: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  stepNumText: { fontSize: 14 },
  stepLabel: { fontSize: 10, textAlign: 'center', marginBottom: 2 },
  stepSub: { fontSize: 8, textAlign: 'center' },
  stepLine: { width: 16, height: 2, marginTop: 14 },

  contentCard: { marginHorizontal: 20, borderRadius: 16, padding: 20, elevation: 2, shadowColor: '#0A2342', shadowOpacity: 0.05, shadowRadius: 8 },
  cardTitle: { fontSize: 16, textAlign: 'right', marginBottom: 4 },
  cardSub: { fontSize: 12, textAlign: 'right', marginBottom: 16 },
  dropdown: { flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14 },
  dropdownText: { fontSize: 14, flex: 1, textAlign: 'right', marginHorizontal: 10 },

  flagsGrid: { flexDirection: 'row-reverse', flexWrap: 'wrap', gap: 12, justifyContent: 'space-between' },
  flagCard: { width: '31%', alignItems: 'center', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 12, padding: 12 },
  flagCircle: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#F8FAFC', alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  flagEmoji: { fontSize: 24 },
  flagName: { fontSize: 10, textAlign: 'center', marginBottom: 8, height: 28 },
  allowedChip: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  allowedText: { fontSize: 9 },

  infoBanner: { flexDirection: 'row-reverse', alignItems: 'center', borderRadius: 12, padding: 16, marginTop: 16 },
  infoBannerIcon: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  infoBannerTitle: { fontSize: 13, textAlign: 'right', marginBottom: 4 },
  infoBannerSub: { fontSize: 11, textAlign: 'right', lineHeight: 18 },

  trustStrip: { flexDirection: 'row-reverse', alignItems: 'center', backgroundColor: '#FFFFFF', marginHorizontal: 20, marginTop: 24, borderRadius: 16, padding: 16, elevation: 2, shadowColor: '#0A2342', shadowOpacity: 0.05, shadowRadius: 6 },
  trustStripLeft: { marginLeft: 12 },
  trustShield: { width: 46, height: 46, borderRadius: 23, backgroundColor: 'rgba(201,162,75,0.1)', alignItems: 'center', justifyContent: 'center' },
  trustStripRight: { flex: 1, alignItems: 'flex-end' },
  trustTitle: { fontSize: 14, marginBottom: 2 },
  trustSub: { fontSize: 10, textAlign: 'right', lineHeight: 16 },

  footer:          { padding: 16, borderTopWidth: 1, position: 'absolute', bottom: 0, left: 0, right: 0 },
  applyBtn:        { borderRadius: 14, alignItems: 'center', justifyContent: 'center', paddingVertical: 16 },
  applyBtnText:    { color: '#FFFFFF', fontSize: 16 },
  // ── Modal ────────────────────────────────────────────────────────────────
  modal:           { flex: 1 },
  modalHeader:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderBottomWidth: 1 },
  modalTitle:      { fontSize: 16 },
  formContent:     { padding: 16, gap: 14, paddingBottom: 60 },
  // ── Sections ─────────────────────────────────────────────────────────────
  section:         { borderRadius: 16, borderWidth: 1, padding: 16, gap: 14 },
  sectionHeader:   { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 2 },
  sectionHeaderText:{ fontSize: 15 },
  // ── Fields ───────────────────────────────────────────────────────────────
  field:           { gap: 6 },
  fieldLabel:      { fontSize: 14, textAlign: 'right' },
  fieldInput:      { borderRadius: 10, borderWidth: 1, padding: 13, fontSize: 14 },
  twoCol:          { flexDirection: 'row', gap: 10 },
  warn:            { fontSize: 11, color: '#EF4444', textAlign: 'right', marginTop: 3 },
  genderRow:       { flexDirection: 'row', gap: 10 },
  genderBtn:       { flex: 1, borderRadius: 10, borderWidth: 1, paddingVertical: 12, alignItems: 'center' },
  genderText:      { fontSize: 14 },
  // ── Terms / Submit ────────────────────────────────────────────────────────
  termsRow:        { flexDirection: 'row', alignItems: 'flex-start', gap: 10, borderRadius: 12, borderWidth: 1, padding: 14 },
  termsText:       { fontSize: 13, flex: 1, textAlign: 'right', lineHeight: 20 },
  submitBtn:       { borderRadius: 14, paddingVertical: 16, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 8, marginTop: 4 },
  submitBtnText:   { color: '#FFFFFF', fontSize: 16 },
});
