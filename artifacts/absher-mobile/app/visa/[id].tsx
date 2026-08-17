/**
 * Visa detail + application screen — profile-driven.
 *
 * The backend reads ALL personal data (name, nationality, passport, photos)
 * from the stored user profile. This screen only collects:
 *   • optional additional-doc uploads that are NOT already on the profile
 *   • agreement to terms
 *
 * Nationality selection is removed entirely — the server enforces eligibility
 * using the stored profile; the UI just confirms what we already know.
 */
import React, { useState } from 'react';
import {
  ActivityIndicator, Modal, Pressable, ScrollView,
  StyleSheet, Text, TextInput, View,
} from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { useColors } from '@/hooks/useColors';
import { useLanguage } from '@/context/LanguageContext';
import {
  useGetVisa,
  useCreateVisaApplication,
  useGetCurrentUser,
  getGetCurrentUserQueryKey,
  useListVisaCustomFields,
  getListVisaCustomFieldsQueryKey,
  getListVisaApplicationsQueryKey,
} from '@workspace/api-client-react';
import { useAuth } from '@/context/AuthContext';
import { useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/components/ui/Toast';

// ─────────────────────────────────────────────────────────────────────────────

const STATUS_COLORS: Record<string, string> = {
  available: '#16A34A', suspended: '#EAB308', closed: '#EF4444',
};

function flagEmoji(code: string): string {
  const c = (code || '').toUpperCase();
  if (c.length !== 2) return '🌍';
  return String.fromCodePoint(...[...c].map(x => 0x1F1E6 + x.charCodeAt(0) - 65));
}

function countryImg(visa: { imageUrl?: string | null; countryCode?: string | null }): string {
  if (visa.imageUrl) return visa.imageUrl;
  const DEFAULTS: Record<string, string> = {
    SA: 'https://images.unsplash.com/photo-1586724237569-f3d0c1dee8c6?w=800',
    AE: 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=800',
    TR: 'https://images.unsplash.com/photo-1524231757912-21f4fe3a7200?w=800',
    TH: 'https://images.unsplash.com/photo-1508009603885-50cf7c579365?w=800',
    MY: 'https://images.unsplash.com/photo-1508050919630-b135583b29ab?w=800',
    EG: 'https://images.unsplash.com/photo-1568322445389-f64ac2515020?w=800',
    OM: 'https://images.unsplash.com/photo-1586686507413-3bd73a16eb01?w=800',
    QA: 'https://images.unsplash.com/photo-1577475038887-f5b84e77d9c3?w=800',
    JO: 'https://images.unsplash.com/photo-1580834341580-8c17a3a630ca?w=800',
    ID: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=800',
    SG: 'https://images.unsplash.com/photo-1525625293386-3f8f99389edd?w=800',
    IN: 'https://images.unsplash.com/photo-1524492412937-b28074a5d7da?w=800',
    GB: 'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=800',
    FR: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=800',
    DE: 'https://images.unsplash.com/photo-1467269204594-9661b134dd2b?w=800',
    IT: 'https://images.unsplash.com/photo-1529260830199-42c24126f198?w=800',
    US: 'https://images.unsplash.com/photo-1485738422979-f5c462d49f74?w=800',
    CN: 'https://images.unsplash.com/photo-1508804185872-d7badad00f7d?w=800',
    JP: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=800',
    AU: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800',
  };
  const code = (visa.countryCode || '').toUpperCase();
  return DEFAULTS[code] || 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=800';
}

/** Mirrors backend isProfileComplete() */
function isProfileComplete(user: any): boolean {
  if (!user) return false;
  return !!(
    user.firstName && user.lastName && user.phone &&
    user.nationality && user.dateOfBirth &&
    user.profilePhotoUrl && user.passportNumber && user.passportExpiryDate
  );
}

// ─────────────────────────────────────────────────────────────────────────────

export default function VisaDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colors = useColors();
  const { t, lang } = useLanguage();
  const insets = useSafeAreaInsets();
  const { user: authUser, accessToken } = useAuth();
  const queryClient = useQueryClient();

  const { data: visa, isLoading } = useGetVisa(Number(id));
  const { data: customFields } = useListVisaCustomFields(Number(id), {
    query: { enabled: !!id, queryKey: getListVisaCustomFieldsQueryKey(Number(id)) },
  });
  const { data: currentUser } = useGetCurrentUser({
    query: {
      staleTime: 30000,
      queryKey: getGetCurrentUserQueryKey(),
      enabled: !!authUser,
    },
  });

  const createApp = useCreateVisaApplication();
  const { showToast } = useToast();

  const [customResponses, setCustomResponses]       = useState<Record<string, string>>({});
  const [agreed, setAgreed]                         = useState(false);
  const [showApplySheet, setShowApplySheet]         = useState(false);

  // ── Gate checks ────────────────────────────────────────────────────────────
  const openApplySheet = () => {
    if (!authUser) {
      showToast({
        type: 'warning',
        message: lang === 'ar' ? 'يجب تسجيل الدخول للتقديم على التأشيرة' : 'You must log in to apply',
        duration: 4000,
      });
      router.push('/auth/login');
      return;
    }
    const user = currentUser || authUser;
    if (!isProfileComplete(user)) {
      showToast({
        type: 'warning',
        message: lang === 'ar' ? 'يرجى إكمال بياناتك الشخصية أولاً' : 'Please complete your profile first',
        duration: 4000,
      });
      router.push('/(tabs)/account');
      return;
    }
    setShowApplySheet(true);
  };

  // ── Submit ─────────────────────────────────────────────────────────────────
  const submit = () => {
    if (!agreed) {
      showToast({ type: 'warning', message: lang === 'ar' ? 'يجب الموافقة على الشروط والأحكام' : 'Please agree to the terms' });
      return;
    }
    const missingRequired = (customFields || []).filter(
      (f: any) => f.required && !(customResponses[String(f.id)] || '').trim(),
    );
    if (missingRequired.length > 0) {
      const label = lang === 'ar' ? missingRequired[0].labelAr : missingRequired[0].labelEn;
      showToast({ type: 'warning', message: `${lang === 'ar' ? 'يرجى تعبئة: ' : 'Please fill: '}${label}` });
      return;
    }

    createApp.mutate(
      {
        data: {
          visaId: Number(id),
          agreedToTerms: true,
          // The server builds the application entirely from the stored profile;
          // only visa-specific custom answers travel with the request.
          customFieldResponses: customResponses,
        } as any,
      },
      {
        onSuccess: () => {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          setShowApplySheet(false);
          // Invalidate the visa-applications list so "طلباتي" updates
          queryClient.invalidateQueries({ queryKey: getListVisaApplicationsQueryKey() });
          showToast({
            type: 'success',
            message: lang === 'ar' ? '✅ تم تقديم طلبك بنجاح! سنراجعه ونُخطرك بالحالة.' : '✅ Application submitted! We will notify you of updates.',
            duration: 5000,
          });
          setTimeout(() => router.push('/(tabs)/account'), 1800);
        },
        onError: (err: any) => {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
          const msg = err?.data?.error || err?.message || (lang === 'ar' ? 'حدث خطأ، يرجى المحاولة مجدداً.' : 'An error occurred, please try again.');
          showToast({ type: 'error', message: msg });
        },
      },
    );
  };

  // ── Loading / not found ───────────────────────────────────────────────────
  if (isLoading)
    return (
      <View style={[s.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.navy} />
      </View>
    );
  if (!visa)
    return (
      <View style={[s.center, { backgroundColor: colors.background }]}>
        <Text style={{ color: colors.mutedForeground, fontFamily: 'Cairo_400Regular' }}>
          {t('visaDetail.notFound')}
        </Text>
      </View>
    );

  const statusColor  = STATUS_COLORS[visa.status] || '#64748B';
  const countryName  = lang === 'ar' ? visa.countryAr : ((visa as any).countryEn || visa.countryAr);
  const img          = countryImg(visa);
  const flag         = flagEmoji(visa.countryCode || '');
  const isAvailable  = visa.isActive && visa.status === 'available';
  const user         = currentUser || authUser;

  return (
    <View style={[s.container, { backgroundColor: colors.background }]}>
      {/* ── Top bar ─────────────────────────────────────────────────────── */}
      <View style={[s.topBar, { paddingTop: insets.top + 12 }]}>
        <Pressable style={[s.iconBtn, { backgroundColor: colors.card }]} onPress={() => router.back()}>
          <Ionicons name="chevron-forward" size={22} color={colors.primary} />
        </Pressable>
        <Image
          source={require('@/assets/images/absher-travel-logo-nobg.png')}
          style={s.logo}
          contentFit="contain"
          tintColor={colors.primary}
        />
        <View style={s.iconBtn} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* ── Hero image ──────────────────────────────────────────────── */}
        <View style={s.heroWrap}>
          <Image source={{ uri: img }} style={s.heroImg} contentFit="cover" />
          <View style={s.heroOverlay} />
          <View style={s.heroContent}>
            <Text style={s.heroFlag}>{flag}</Text>
            <Text style={[s.heroTitle, { fontFamily: 'Cairo_700Bold' }]}>
              {lang === 'ar' ? `تأشيرة ${countryName}` : `${countryName} Visa`}
            </Text>
            <Text style={[s.heroSub, { fontFamily: 'Cairo_400Regular' }]}>
              {visa.visaType}
            </Text>
            <View style={[s.statusBadge, { backgroundColor: statusColor + '22', borderColor: statusColor }]}>
              <View style={[s.statusDot, { backgroundColor: statusColor }]} />
              <Text style={[s.statusText, { color: statusColor, fontFamily: 'Cairo_700Bold' }]}>
                {visa.status === 'available' ? 'متاحة للتقديم' : 'غير متاحة حالياً'}
              </Text>
            </View>
          </View>
        </View>

        {/* ── Key stats ───────────────────────────────────────────────── */}
        <View style={[s.statsRow, { backgroundColor: colors.card }]}>
          {[
            { icon: 'time-outline', label: 'المعالجة', value: `${visa.processingDays} ${lang === 'ar' ? 'يوم' : 'days'}` },
            { icon: 'calendar-outline', label: 'المكوث', value: visa.stayDuration ? `${visa.stayDuration} ${lang === 'ar' ? 'يوم' : 'd'}` : '—' },
            { icon: 'earth-outline', label: 'الدخول', value: visa.entryType === 'single' ? 'مرة واحدة' : visa.entryType === 'multiple' ? 'متعدد' : 'عبور' },
            { icon: 'shield-outline', label: 'الصلاحية', value: visa.validityDays ? `${visa.validityDays} ${lang === 'ar' ? 'يوم' : 'd'}` : '—' },
          ].map((s2, i) => (
            <View key={i} style={s.statItem}>
              <Ionicons name={s2.icon as any} size={20} color={colors.accent} />
              <Text style={[s.statLabel, { color: colors.mutedForeground, fontFamily: 'Cairo_400Regular' }]}>{s2.label}</Text>
              <Text style={[s.statValue, { color: colors.text, fontFamily: 'Cairo_700Bold' }]}>{s2.value}</Text>
            </View>
          ))}
        </View>

        {/* ── Fee card ────────────────────────────────────────────────── */}
        <View style={[s.feeCard, { backgroundColor: colors.primary }]}>
          <View>
            <Text style={[s.feeLabel, { fontFamily: 'Cairo_400Regular' }]}>رسوم التأشيرة</Text>
            <Text style={[s.feeAmount, { fontFamily: 'Cairo_700Bold' }]}>
              {Number(visa.fee).toLocaleString()} {visa.currency}
            </Text>
          </View>
          <Ionicons name="card-outline" size={32} color="rgba(255,255,255,0.4)" />
        </View>

        {/* ── Description ─────────────────────────────────────────────── */}
        {(lang === 'ar' ? (visa as any).descriptionAr : (visa as any).descriptionEn) && (
          <View style={[s.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={s.sectionHeader}>
              <Ionicons name="information-circle-outline" size={18} color={colors.navy} />
              <Text style={[s.sectionTitle, { color: colors.foreground, fontFamily: 'Cairo_700Bold' }]}>نبذة عن التأشيرة</Text>
            </View>
            <Text style={[s.bodyText, { color: colors.textSecondary, fontFamily: 'Cairo_400Regular' }]}>
              {lang === 'ar' ? (visa as any).descriptionAr : (visa as any).descriptionEn}
            </Text>
          </View>
        )}

        {/* ── Required documents ──────────────────────────────────────── */}
        <View style={[s.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={s.sectionHeader}>
            <Ionicons name="documents-outline" size={18} color={colors.navy} />
            <Text style={[s.sectionTitle, { color: colors.foreground, fontFamily: 'Cairo_700Bold' }]}>المستندات المطلوبة</Text>
          </View>
          {[
            { flag: visa.requiresPassportImage !== false,   label: 'صورة جواز السفر',      icon: 'card-outline' },
            { flag: visa.requiresPersonalPhoto !== false,   label: 'صورة شخصية حديثة',     icon: 'person-circle-outline' },
            { flag: visa.requiresResidencyImage === true,   label: 'بطاقة الإقامة',         icon: 'id-card-outline' },
            { flag: visa.acceptsSchengenResidency || visa.acceptsUkResidency || visa.acceptsUsVisa || visa.acceptsCanadaResidency || visa.acceptsAustraliaResidency,
              label: 'تأشيرة / إقامة بديلة',  icon: 'earth-outline' },
          ].filter(d => d.flag).map((d, i) => (
            <View key={i} style={[s.docRow, { borderColor: colors.border }]}>
              <View style={[s.docIcon, { backgroundColor: colors.iconBg }]}>
                <Ionicons name={d.icon as any} size={18} color={colors.navy} />
              </View>
              <Text style={[s.docLabel, { color: colors.foreground, fontFamily: 'Cairo_600SemiBold' }]}>{d.label}</Text>
              <Ionicons name="checkmark-circle" size={18} color={colors.success} />
            </View>
          ))}
          {visa.documents && (
            <Text style={[s.bodyText, { color: colors.textSecondary, fontFamily: 'Cairo_400Regular', marginTop: 8 }]}>
              {visa.documents}
            </Text>
          )}
        </View>

        {/* ── Eligibility info ────────────────────────────────────────── */}
        {((visa.allowedNationalities?.length ?? 0) > 0 || (visa.blockedNationalities?.length ?? 0) > 0) && (
          <View style={[s.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={s.sectionHeader}>
              <Ionicons name="globe-outline" size={18} color={colors.navy} />
              <Text style={[s.sectionTitle, { color: colors.foreground, fontFamily: 'Cairo_700Bold' }]}>شروط الأهلية</Text>
            </View>
            {(visa.allowedNationalities?.length ?? 0) > 0 && (
              <View style={s.tagWrap}>
                <Text style={[s.tagGroupLabel, { color: colors.mutedForeground, fontFamily: 'Cairo_600SemiBold' }]}>الجنسيات المسموح بها:</Text>
                <View style={s.tags}>
                  {(visa.allowedNationalities ?? []).map(n => (
                    <View key={n} style={[s.tag, { backgroundColor: '#DCFCE7', borderColor: '#BBF7D0' }]}>
                      <Text style={[s.tagText, { color: '#166534', fontFamily: 'Cairo_600SemiBold' }]}>{n}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}
            {(visa.blockedNationalities?.length ?? 0) > 0 && (
              <View style={[s.tagWrap, { marginTop: 8 }]}>
                <Text style={[s.tagGroupLabel, { color: colors.mutedForeground, fontFamily: 'Cairo_600SemiBold' }]}>الجنسيات المحظورة:</Text>
                <View style={s.tags}>
                  {(visa.blockedNationalities ?? []).map(n => (
                    <View key={n} style={[s.tag, { backgroundColor: '#FEE2E2', borderColor: '#FECACA' }]}>
                      <Text style={[s.tagText, { color: '#991B1B', fontFamily: 'Cairo_600SemiBold' }]}>{n}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}
          </View>
        )}

        {/* ── Notes ───────────────────────────────────────────────────── */}
        {visa.notes && (
          <View style={[s.section, { backgroundColor: '#FFF7ED', borderColor: '#FED7AA' }]}>
            <View style={s.sectionHeader}>
              <Ionicons name="warning-outline" size={18} color="#EA580C" />
              <Text style={[s.sectionTitle, { color: '#9A3412', fontFamily: 'Cairo_700Bold' }]}>ملاحظات مهمة</Text>
            </View>
            <Text style={[s.bodyText, { color: '#9A3412', fontFamily: 'Cairo_400Regular' }]}>{visa.notes}</Text>
          </View>
        )}

        <View style={{ height: 120 }} />
      </ScrollView>

      {/* ── Sticky footer ───────────────────────────────────────────────── */}
      {isAvailable && (
        <View style={[s.footer, { paddingBottom: insets.bottom + 16, backgroundColor: colors.card, borderTopColor: colors.border }]}>
          <View style={s.footerTop}>
            <View>
              <Text style={[s.footerFeeLabel, { color: colors.mutedForeground, fontFamily: 'Cairo_400Regular' }]}>رسوم التأشيرة</Text>
              <Text style={[s.footerFee, { color: colors.primary, fontFamily: 'Cairo_700Bold' }]}>
                {Number(visa.fee).toLocaleString()} {visa.currency}
              </Text>
            </View>
            <Pressable
              style={({ pressed }) => [s.applyBtn, { backgroundColor: colors.navy, opacity: pressed ? 0.9 : 1 }]}
              onPress={openApplySheet}
            >
              <Ionicons name="send-outline" size={18} color="#FFF" />
              <Text style={[s.applyBtnText, { fontFamily: 'Cairo_700Bold' }]}>
                {!authUser ? 'سجّل دخولك للتقديم' : 'ابدأ التقديم'}
              </Text>
            </Pressable>
          </View>
        </View>
      )}

      {/* ══════════════════════════════════════════════════════════════════
          Application sheet — profile-driven, no re-entry of saved data
          ══════════════════════════════════════════════════════════════════ */}
      <Modal visible={showApplySheet} animationType="slide" presentationStyle="pageSheet">
        <View style={[s.modal, { backgroundColor: colors.background }]}>
          {/* Modal header */}
          <View style={[s.modalHeader, { borderBottomColor: colors.border, backgroundColor: colors.card }]}>
            <Pressable onPress={() => setShowApplySheet(false)} hitSlop={10}>
              <Ionicons name="close" size={24} color={colors.foreground} />
            </Pressable>
            <Text style={[s.modalTitle, { color: colors.foreground, fontFamily: 'Cairo_700Bold' }]}>
              طلب تأشيرة {countryName}
            </Text>
            <View style={{ width: 24 }} />
          </View>

          <ScrollView contentContainerStyle={s.modalContent} keyboardShouldPersistTaps="handled">

            {/* ── Profile summary (read-only) ─────────────────────────── */}
            <View style={[s.profileCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={[s.profileCardHeader, { backgroundColor: colors.primary }]}>
                <Ionicons name="person-circle-outline" size={20} color="#FFF" />
                <Text style={[s.profileCardHeaderText, { fontFamily: 'Cairo_700Bold' }]}>بياناتك الشخصية (محفوظة تلقائياً)</Text>
              </View>
              <View style={s.profileCardBody}>
                <Text style={[s.profileCardNote, { color: colors.mutedForeground, fontFamily: 'Cairo_400Regular' }]}>
                  يستخدم النظام بياناتك المحفوظة تلقائياً — لا حاجة لإعادة إدخال أي شيء.
                </Text>
                {[
                  { icon: 'person-outline',   label: 'الاسم',        value: `${user?.firstName || ''} ${user?.lastName || ''}`.trim() },
                  { icon: 'globe-outline',    label: 'الجنسية',      value: (user as any)?.nationality },
                  { icon: 'card-outline',     label: 'رقم الجواز',   value: (user as any)?.passportNumber },
                  { icon: 'call-outline',     label: 'رقم الهاتف',   value: (user as any)?.phone },
                  { icon: 'mail-outline',     label: 'البريد',       value: (user as any)?.email },
                  { icon: 'calendar-outline', label: 'تاريخ الميلاد', value: (user as any)?.dateOfBirth },
                ].filter(f => f.value).map((f, i) => (
                  <View key={i} style={[s.profileRow, { borderColor: colors.border }]}>
                    <View style={[s.profileRowIcon, { backgroundColor: colors.iconBg }]}>
                      <Ionicons name={f.icon as any} size={16} color={colors.navy} />
                    </View>
                    <View style={s.profileRowText}>
                      <Text style={[s.profileRowLabel, { color: colors.mutedForeground, fontFamily: 'Cairo_400Regular' }]}>{f.label}</Text>
                      <Text style={[s.profileRowValue, { color: colors.foreground, fontFamily: 'Cairo_600SemiBold' }]}>{f.value}</Text>
                    </View>
                    <Ionicons name="checkmark-circle" size={18} color={colors.success} />
                  </View>
                ))}
                {/* GCC residency badge */}
                {(user as any)?.isGccResident && (user as any)?.gccResidenceCountry && (
                  <View style={[s.badge, { backgroundColor: '#DBEAFE', borderColor: '#BFDBFE' }]}>
                    <Ionicons name="flag-outline" size={14} color="#1D4ED8" />
                    <Text style={[s.badgeText, { color: '#1D4ED8', fontFamily: 'Cairo_600SemiBold' }]}>
                      إقامة خليجية · {(user as any).gccResidenceCountry}
                    </Text>
                  </View>
                )}
                {/* European doc badge */}
                {(user as any)?.isEuropeanResident && (user as any)?.europeanDocumentType && (
                  <View style={[s.badge, { backgroundColor: '#F3E8FF', borderColor: '#E9D5FF' }]}>
                    <Ionicons name="globe-outline" size={14} color="#6D28D9" />
                    <Text style={[s.badgeText, { color: '#6D28D9', fontFamily: 'Cairo_600SemiBold' }]}>
                      وثيقة أوروبية · {(user as any).europeanDocumentType}
                    </Text>
                  </View>
                )}
                <Pressable onPress={() => { setShowApplySheet(false); router.push('/(tabs)/account'); }}>
                  <Text style={[s.editProfileLink, { color: colors.primary, fontFamily: 'Cairo_600SemiBold' }]}>
                    ← تعديل الملف الشخصي
                  </Text>
                </Pressable>
              </View>
            </View>

            {/* ── Custom fields (visa-specific) ───────────────────────── */}
            {customFields && customFields.length > 0 && (
              <View style={[s.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <View style={s.sectionHeader}>
                  <Ionicons name="list-outline" size={18} color={colors.navy} />
                  <Text style={[s.sectionTitle, { color: colors.foreground, fontFamily: 'Cairo_700Bold' }]}>معلومات إضافية</Text>
                </View>
                {customFields.map((field: any) => {
                  const key = String(field.id);
                  const value = customResponses[key] || '';
                  const setValue = (v: string) =>
                    setCustomResponses(prev => ({ ...prev, [key]: v }));
                  return (
                    <View key={field.id} style={s.field}>
                      <Text style={[s.fieldLabel, { color: colors.foreground, fontFamily: 'Cairo_600SemiBold' }]}>
                        {lang === 'ar' ? field.labelAr : field.labelEn}
                        {field.required && <Text style={{ color: '#EF4444' }}> *</Text>}
                      </Text>
                      {field.fieldType === 'select' && (field.options?.length ?? 0) > 0 ? (
                        <View style={s.tags}>
                          {(field.options as string[]).map(opt => (
                            <Pressable
                              key={opt}
                              onPress={() => setValue(opt)}
                              style={[s.tag, {
                                backgroundColor: value === opt ? colors.navy : colors.muted,
                                borderColor: value === opt ? colors.navy : colors.border,
                              }]}
                            >
                              <Text style={[s.tagText, {
                                color: value === opt ? '#FFF' : colors.foreground,
                                fontFamily: 'Cairo_600SemiBold',
                              }]}>{opt}</Text>
                            </Pressable>
                          ))}
                        </View>
                      ) : (
                        <TextInput
                          value={value}
                          onChangeText={setValue}
                          placeholder={(lang === 'ar' ? field.placeholderAr : field.placeholderEn) || ''}
                          placeholderTextColor={colors.mutedForeground}
                          style={[s.fieldInput, {
                            backgroundColor: colors.muted,
                            borderColor: colors.border,
                            color: colors.foreground,
                            fontFamily: 'Cairo_400Regular',
                            padding: 12,
                            textAlign: 'right',
                          }]}
                        />
                      )}
                    </View>
                  );
                })}
              </View>
            )}

            {/* ── Terms ───────────────────────────────────────────────── */}
            <Pressable
              style={[s.termsRow, { backgroundColor: colors.card, borderColor: agreed ? colors.navy : colors.border }]}
              onPress={() => setAgreed(a => !a)}
            >
              <Ionicons
                name={agreed ? 'checkbox' : 'square-outline'}
                size={24}
                color={agreed ? colors.navy : colors.mutedForeground}
              />
              <Text style={[s.termsText, { color: colors.foreground, fontFamily: 'Cairo_400Regular' }]}>
                أقر بأن جميع بياناتي الشخصية في ملفي صحيحة وأوافق على الشروط والأحكام وسياسة الخصوصية.
              </Text>
            </Pressable>

            {/* ── Visa summary ────────────────────────────────────────── */}
            <View style={[s.summaryCard, { backgroundColor: colors.iconBg, borderColor: colors.border }]}>
              <View style={s.summaryRow}>
                <Text style={[s.summaryLabel, { color: colors.mutedForeground, fontFamily: 'Cairo_400Regular' }]}>التأشيرة</Text>
                <Text style={[s.summaryValue, { color: colors.foreground, fontFamily: 'Cairo_700Bold' }]}>{countryName}</Text>
              </View>
              <View style={s.summaryRow}>
                <Text style={[s.summaryLabel, { color: colors.mutedForeground, fontFamily: 'Cairo_400Regular' }]}>الرسوم</Text>
                <Text style={[s.summaryValue, { color: colors.primary, fontFamily: 'Cairo_700Bold' }]}>
                  {Number(visa.fee).toLocaleString()} {visa.currency}
                </Text>
              </View>
              <View style={s.summaryRow}>
                <Text style={[s.summaryLabel, { color: colors.mutedForeground, fontFamily: 'Cairo_400Regular' }]}>المعالجة</Text>
                <Text style={[s.summaryValue, { color: colors.foreground, fontFamily: 'Cairo_700Bold' }]}>{visa.processingDays} يوم</Text>
              </View>
            </View>

            {/* ── Submit button ────────────────────────────────────────── */}
            <Pressable
              style={({ pressed }) => [
                s.submitBtn,
                { backgroundColor: agreed ? colors.navy : colors.border, opacity: pressed ? 0.9 : 1 },
              ]}
              onPress={submit}
              disabled={createApp.isPending || !agreed}
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

            <Text style={[s.footerNote, { color: colors.mutedForeground, fontFamily: 'Cairo_400Regular' }]}>
              سيتم إرسال طلبك فوراً وستصلك إشعارات بحالة الطلب.
            </Text>
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  container:  { flex: 1 },
  center:     { flex: 1, alignItems: 'center', justifyContent: 'center' },

  topBar: {
    flexDirection: 'row-reverse', justifyContent: 'space-between',
    alignItems: 'center', paddingHorizontal: 20, paddingBottom: 10,
  },
  iconBtn: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  logo:    { width: 120, height: 40 },

  heroWrap:    { height: 260, position: 'relative' },
  heroImg:     { ...StyleSheet.absoluteFillObject },
  heroOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(10,35,66,0.60)' },
  heroContent: { position: 'absolute', bottom: 24, right: 20, left: 20 },
  heroFlag:    { fontSize: 36, marginBottom: 4 },
  heroTitle:   { fontSize: 22, color: '#FFF', marginBottom: 4 },
  heroSub:     { fontSize: 13, color: 'rgba(255,255,255,0.75)', marginBottom: 10 },
  statusBadge: { flexDirection: 'row-reverse', alignItems: 'center', gap: 6, alignSelf: 'flex-end',
                 paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, borderWidth: 1 },
  statusDot:   { width: 7, height: 7, borderRadius: 4 },
  statusText:  { fontSize: 12 },

  statsRow: { flexDirection: 'row-reverse', justifyContent: 'space-around', paddingVertical: 16, marginHorizontal: 16,
              marginTop: 16, borderRadius: 16, elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8 },
  statItem:  { alignItems: 'center', gap: 4 },
  statLabel: { fontSize: 10, textAlign: 'center' },
  statValue: { fontSize: 13, textAlign: 'center' },

  feeCard: { flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between',
             marginHorizontal: 16, marginTop: 12, borderRadius: 16, padding: 20 },
  feeLabel:  { color: 'rgba(255,255,255,0.7)', fontSize: 12, textAlign: 'right' },
  feeAmount: { color: '#FFF', fontSize: 22, textAlign: 'right', marginTop: 2 },

  section: { marginHorizontal: 16, marginTop: 12, borderRadius: 16, borderWidth: 1, padding: 16, gap: 10 },
  sectionHeader: { flexDirection: 'row-reverse', alignItems: 'center', gap: 8, marginBottom: 4 },
  sectionTitle:  { fontSize: 15 },
  bodyText:      { fontSize: 13, lineHeight: 22, textAlign: 'right' },

  docRow:  { flexDirection: 'row-reverse', alignItems: 'center', gap: 10, paddingVertical: 10,
             borderBottomWidth: StyleSheet.hairlineWidth },
  docIcon: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  docLabel:{ flex: 1, fontSize: 13, textAlign: 'right' },

  tagWrap:      { gap: 6 },
  tagGroupLabel:{ fontSize: 11, textAlign: 'right' },
  tags:         { flexDirection: 'row-reverse', flexWrap: 'wrap', gap: 6 },
  tag:          { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, borderWidth: 1 },
  tagText:      { fontSize: 11 },

  footer:    { padding: 16, borderTopWidth: 1 },
  footerTop: { flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between' },
  footerFeeLabel: { fontSize: 11, textAlign: 'right' },
  footerFee:      { fontSize: 18, textAlign: 'right' },
  applyBtn:     { flexDirection: 'row-reverse', alignItems: 'center', gap: 8,
                  borderRadius: 14, paddingVertical: 14, paddingHorizontal: 24 },
  applyBtnText: { color: '#FFF', fontSize: 15 },

  // ── Modal ──────────────────────────────────────────────────────────────────
  modal:       { flex: 1 },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
                 padding: 16, borderBottomWidth: 1 },
  modalTitle:  { fontSize: 16 },
  modalContent:{ padding: 16, gap: 14, paddingBottom: 40 },

  profileCard:       { borderRadius: 16, borderWidth: 1, overflow: 'hidden' },
  profileCardHeader: { flexDirection: 'row-reverse', alignItems: 'center', gap: 8, padding: 14 },
  profileCardHeaderText: { color: '#FFF', fontSize: 14 },
  profileCardBody:   { padding: 14, gap: 10 },
  profileCardNote:   { fontSize: 12, textAlign: 'right', lineHeight: 18, marginBottom: 6 },
  profileRow:        { flexDirection: 'row-reverse', alignItems: 'center', gap: 10,
                       paddingVertical: 8, borderBottomWidth: StyleSheet.hairlineWidth },
  profileRowIcon:    { width: 32, height: 32, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  profileRowText:    { flex: 1 },
  profileRowLabel:   { fontSize: 10, textAlign: 'right' },
  profileRowValue:   { fontSize: 13, textAlign: 'right' },
  badge:             { flexDirection: 'row-reverse', alignItems: 'center', gap: 6,
                       borderWidth: 1, borderRadius: 20, paddingHorizontal: 10, paddingVertical: 5, alignSelf: 'flex-end' },
  badgeText:         { fontSize: 12 },
  editProfileLink:   { fontSize: 12, textAlign: 'right', marginTop: 6 },

  field:      { gap: 6 },
  fieldLabel: { fontSize: 13, textAlign: 'right' },
  fieldInput: { borderRadius: 10, borderWidth: 1 },

  termsRow: { flexDirection: 'row-reverse', alignItems: 'flex-start', gap: 10,
              borderRadius: 12, borderWidth: 1.5, padding: 14 },
  termsText: { flex: 1, fontSize: 12, textAlign: 'right', lineHeight: 20 },

  summaryCard: { borderRadius: 12, borderWidth: 1, padding: 14, gap: 8 },
  summaryRow:  { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center' },
  summaryLabel:{ fontSize: 12 },
  summaryValue:{ fontSize: 14 },

  submitBtn:     { borderRadius: 14, paddingVertical: 16, alignItems: 'center',
                   flexDirection: 'row-reverse', justifyContent: 'center', gap: 8 },
  submitBtnText: { color: '#FFFFFF', fontSize: 16 },
  footerNote:    { textAlign: 'center', fontSize: 11, lineHeight: 18 },
});
