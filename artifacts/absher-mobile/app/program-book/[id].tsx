/**
 * Program Booking Request — full in-app booking form for tourism programs.
 *
 * Replaces the old Alert.prompt flow: traveler info + trip details (travel /
 * return dates picked with DatePickerModal in range mode), submitted through
 * the same authenticated /program-bookings API the web app uses.
 */
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { useQueryClient } from '@tanstack/react-query';
import { useColors } from '@/hooks/useColors';
import { useLanguage } from '@/context/LanguageContext';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/components/ui/Toast';
import { KeyboardAwareForm } from '@/components/KeyboardAwareForm';
import { Input } from '@/components/ui/Input';
import DatePickerModal from '@/components/DatePickerModal';
import NationalityPicker from '@/components/NationalityPicker';
import { getCountryByCode, getCountryByName } from '@workspace/countries';
import { NATIONALITIES } from '@/constants/nationalities';
import {
  useGetProgram,
  getGetProgramQueryKey,
  useCreateProgramBooking,
  useGetCurrentUser,
  getGetCurrentUserQueryKey,
  getListMyProgramBookingsQueryKey,
} from '@workspace/api-client-react';

const NAVY = '#052B5B';
const GOLD = '#D4AF37';

const isoToday = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

/** Counter row with +/- steppers (48dp touch targets). */
function Counter({
  label, value, min, max, onChange, colors,
}: {
  label: string; value: number; min: number; max: number;
  onChange: (v: number) => void; colors: ReturnType<typeof useColors>;
}) {
  const dec = () => { if (value > min) { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); onChange(value - 1); } };
  const inc = () => { if (value < max) { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); onChange(value + 1); } };
  return (
    <View style={[s.counterRow, { borderColor: colors.border, backgroundColor: colors.card }]}>
      <View style={s.counterControls}>
        <Pressable
          onPress={dec}
          disabled={value <= min}
          style={[s.counterBtn, { borderColor: colors.border, opacity: value <= min ? 0.35 : 1 }]}
          hitSlop={6}
        >
          <Ionicons name="remove" size={20} color={colors.foreground} />
        </Pressable>
        <Text style={[s.counterValue, { color: colors.foreground, fontFamily: 'Cairo_700Bold' }]}>{value}</Text>
        <Pressable
          onPress={inc}
          disabled={value >= max}
          style={[s.counterBtn, { borderColor: colors.border, opacity: value >= max ? 0.35 : 1 }]}
          hitSlop={6}
        >
          <Ionicons name="add" size={20} color={colors.foreground} />
        </Pressable>
      </View>
      <Text style={[s.counterLabel, { color: colors.foreground, fontFamily: 'Cairo_600SemiBold' }]}>{label}</Text>
    </View>
  );
}

export default function ProgramBookScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const programId = Number(id);
  const colors = useColors();
  const { t, lang } = useLanguage();
  const insets = useSafeAreaInsets();
  const { user: authUser, accessToken } = useAuth();
  const { showToast } = useToast();
  const queryClient = useQueryClient();

  const { data: program, isLoading } = useGetProgram(programId, {
    query: { queryKey: getGetProgramQueryKey(programId), enabled: Number.isFinite(programId) && programId > 0 },
  });
  const { data: currentUser } = useGetCurrentUser({
    query: { queryKey: getGetCurrentUserQueryKey(), enabled: !!accessToken },
  });
  const submitMutation = useCreateProgramBooking();

  // ── Form state ──────────────────────────────────────────────────────────
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [natCode, setNatCode] = useState('');       // ISO alpha-2 sent to the API
  const [natLabel, setNatLabel] = useState('');     // Arabic demonym shown in the picker
  const [travelDate, setTravelDate] = useState('');
  const [returnDate, setReturnDate] = useState('');
  const [dateOpen, setDateOpen] = useState(false);
  const [adults, setAdults] = useState(2);
  const [children, setChildren] = useState(0);
  const [infants, setInfants] = useState(0);
  const [rooms, setRooms] = useState(1);
  const [roomType, setRoomType] = useState('');
  const [notes, setNotes] = useState('');
  const [prefilled, setPrefilled] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [result, setResult] = useState<{ requestNumber: string } | null>(null);

  const emailRef = useRef<TextInput>(null);
  const phoneRef = useRef<TextInput>(null);

  // ── Auth gate ───────────────────────────────────────────────────────────
  useEffect(() => {
    if (!authUser) {
      showToast({ type: 'warning', message: t('programBook.loginRequired'), duration: 4000 });
      router.replace('/auth/login');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authUser]);

  // ── Prefill from profile (once) ─────────────────────────────────────────
  useEffect(() => {
    const u = currentUser || authUser;
    if (!u || prefilled) return;
    setFullName(v => v || [u.firstName, u.lastName].filter(Boolean).join(' '));
    setEmail(v => v || (u.email ?? ''));
    setPhone(v => v || (u.phone ?? ''));
    if (!natCode && u.nationality) {
      const code =
        getCountryByCode(u.nationality)?.code ?? getCountryByName(u.nationality)?.code ?? '';
      if (code) {
        setNatCode(code);
        const n = NATIONALITIES.find(x => x.code === code);
        setNatLabel(n ? n.demonymAr : code);
      }
    }
    setPrefilled(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser, authUser, prefilled]);

  const validate = (): string | null => {
    if (fullName.trim().length < 3) return t('programBook.errFullName');
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) return t('programBook.errEmail');
    if (phone.trim().length < 6) return t('programBook.errPhone');
    if (!natCode) return t('programBook.errNationality');
    if (!travelDate) return t('programBook.errTravelDate');
    return null;
  };

  const handleSubmit = () => {
    if (submitMutation.isPending) return;
    const err = validate();
    setFormError(err);
    if (err) return;
    submitMutation.mutate(
      {
        data: {
          programId,
          fullName: fullName.trim(),
          email: email.trim(),
          phone: phone.trim(),
          nationality: natCode,
          adults,
          children,
          infants,
          travelDate,
          ...(returnDate ? { returnDate } : {}),
          rooms,
          ...(roomType ? { roomType } : {}),
          ...(notes.trim() ? { customerNotes: notes.trim() } : {}),
        },
      },
      {
        onSuccess: (res) => {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          queryClient.invalidateQueries({ queryKey: getListMyProgramBookingsQueryKey() });
          setResult({ requestNumber: res.requestNumber });
        },
        onError: () => {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
          setFormError(t('programBook.errSubmit'));
        },
      },
    );
  };

  const fmtDate = (iso: string) => {
    if (!iso) return '';
    const [y, m, d] = iso.split('-').map(Number);
    return new Date(y, m - 1, d).toLocaleDateString(lang === 'ar' ? 'ar-SA' : 'en-US', {
      day: 'numeric', month: 'short', year: 'numeric',
    });
  };

  if (isLoading || !authUser) {
    return (
      <View style={[s.loading, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color="#2563EB" />
      </View>
    );
  }

  if (!program) {
    return (
      <View style={[s.loading, { backgroundColor: colors.background }]}>
        <Text style={{ color: colors.mutedForeground, fontFamily: 'Cairo_400Regular', fontSize: 16 }}>
          {t('programDetail.notFound')}
        </Text>
      </View>
    );
  }

  // ── Success screen ────────────────────────────────────────────────────────
  if (result) {
    return (
      <View style={[s.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
        <View style={s.successWrap}>
          <View style={s.successIcon}>
            <Ionicons name="checkmark-circle" size={72} color="#16A34A" />
          </View>
          <Text style={[s.successTitle, { color: colors.foreground, fontFamily: 'Cairo_700Bold' }]}>
            {t('programBook.successTitle')}
          </Text>
          <Text style={[s.successBody, { color: colors.mutedForeground, fontFamily: 'Cairo_400Regular' }]}>
            {t('programBook.successBody')}
          </Text>
          <View style={[s.reqBox, { borderColor: colors.border, backgroundColor: colors.card }]}>
            <Text style={[s.reqLabel, { color: colors.mutedForeground, fontFamily: 'Cairo_600SemiBold' }]}>
              {t('programBook.requestNumber')}
            </Text>
            <Text style={[s.reqNumber, { fontFamily: 'Cairo_700Bold' }]}>{result.requestNumber}</Text>
          </View>
          <Pressable
            style={[s.primaryBtn, { backgroundColor: NAVY }]}
            onPress={() => router.replace('/(tabs)/account')}
          >
            <Text style={[s.primaryBtnText, { fontFamily: 'Cairo_700Bold' }]}>{t('programBook.trackBooking')}</Text>
          </Pressable>
          <Pressable
            style={[s.secondaryBtn, { borderColor: colors.border }]}
            onPress={() => router.replace('/(tabs)')}
          >
            <Text style={[s.secondaryBtnText, { color: colors.foreground, fontFamily: 'Cairo_600SemiBold' }]}>
              {t('programBook.backHome')}
            </Text>
          </Pressable>
        </View>
      </View>
    );
  }

  const title = lang === 'ar' ? program.titleAr : program.titleEn;

  return (
    <View style={[s.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[s.header, { paddingTop: insets.top + 8, backgroundColor: NAVY }]}>
        <Pressable onPress={() => router.back()} style={s.headerBack} hitSlop={8}>
          <Ionicons name={lang === 'ar' ? 'arrow-forward' : 'arrow-back'} size={22} color="#FFFFFF" />
        </Pressable>
        <View style={s.headerTexts}>
          <Text style={[s.headerTitle, { fontFamily: 'Cairo_700Bold' }]}>{t('programBook.title')}</Text>
          <Text style={[s.headerSub, { fontFamily: 'Cairo_600SemiBold' }]} numberOfLines={1}>{title}</Text>
        </View>
      </View>

      <KeyboardAwareForm contentContainerStyle={s.content} bottomPadding={40 + insets.bottom}>
        {/* Program summary */}
        <View style={[s.summary, { borderColor: colors.border, backgroundColor: colors.card }]}>
          <View style={{ flex: 1 }}>
            <Text style={[s.summaryTitle, { color: colors.foreground, fontFamily: 'Cairo_700Bold' }]} numberOfLines={2}>{title}</Text>
            <Text style={[s.summaryMeta, { color: colors.mutedForeground, fontFamily: 'Cairo_400Regular' }]}>
              {program.days} {t('programDetail.dayUnit')}{program.destination ? ` · ${program.destination}` : ''}
            </Text>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={[s.summaryPrice, { fontFamily: 'Cairo_700Bold' }]}>
              {Number(program.price).toLocaleString(lang === 'ar' ? 'ar-SA' : 'en-US')}
            </Text>
            <Text style={[s.summaryCurrency, { color: colors.mutedForeground, fontFamily: 'Cairo_400Regular' }]}>
              {program.currency || t('programDetail.currency')} {t('programBook.perPerson')}
            </Text>
          </View>
        </View>

        {/* ── Traveler info ── */}
        <Text style={[s.section, { color: colors.foreground, fontFamily: 'Cairo_700Bold' }]}>
          {t('programBook.travelerSection')}
        </Text>
        <Input
          label={t('programBook.fullName')}
          value={fullName}
          onChangeText={setFullName}
          returnKeyType="next"
          blurOnSubmit={false}
          onSubmitEditing={() => emailRef.current?.focus()}
        />
        <Input
          ref={emailRef}
          label={t('programBook.email')}
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          returnKeyType="next"
          blurOnSubmit={false}
          onSubmitEditing={() => phoneRef.current?.focus()}
        />
        <Input
          ref={phoneRef}
          label={t('programBook.phone')}
          value={phone}
          onChangeText={setPhone}
          keyboardType="phone-pad"
          returnKeyType="done"
        />
        <Text style={[s.fieldLabel, { color: colors.foreground, fontFamily: 'Cairo_600SemiBold' }]}>
          {t('programBook.nationality')}
        </Text>
        <NationalityPicker
          value={natLabel}
          onChange={(n) => { setNatCode(n.code); setNatLabel(n.demonymAr); }}
        />

        {/* ── Trip details ── */}
        <Text style={[s.section, { color: colors.foreground, fontFamily: 'Cairo_700Bold', marginTop: 20 }]}>
          {t('programBook.tripSection')}
        </Text>

        {/* Date range trigger */}
        <Pressable
          style={[s.dateTrigger, { borderColor: colors.border, backgroundColor: colors.card }]}
          onPress={() => setDateOpen(true)}
        >
          <Ionicons name="calendar-outline" size={20} color={NAVY} />
          <View style={{ flex: 1 }}>
            <Text style={[s.dateLabel, { color: colors.mutedForeground, fontFamily: 'Cairo_400Regular' }]}>
              {t('programBook.tripDates')}
            </Text>
            {travelDate ? (
              <Text style={[s.dateValue, { color: colors.foreground, fontFamily: 'Cairo_700Bold' }]}>
                {fmtDate(travelDate)}{returnDate ? `  ←  ${fmtDate(returnDate)}` : ''}
              </Text>
            ) : (
              <Text style={[s.dateValue, { color: colors.mutedForeground, fontFamily: 'Cairo_400Regular' }]}>
                {t('programBook.selectDates')}
              </Text>
            )}
          </View>
          <Ionicons name={lang === 'ar' ? 'chevron-back' : 'chevron-forward'} size={18} color={colors.mutedForeground} />
        </Pressable>

        <DatePickerModal
          visible={dateOpen}
          onClose={() => setDateOpen(false)}
          mode="range"
          value={travelDate}
          value2={returnDate}
          onSelect={setTravelDate}
          onSelect2={setReturnDate}
          minDate={isoToday()}
          label={t('programBook.tripDates')}
          lang={lang}
        />

        {/* Travelers */}
        <Counter label={t('programBook.adults')} value={adults} min={1} max={50} onChange={setAdults} colors={colors} />
        <Counter label={t('programBook.children')} value={children} min={0} max={50} onChange={setChildren} colors={colors} />
        <Counter label={t('programBook.infants')} value={infants} min={0} max={20} onChange={setInfants} colors={colors} />
        <Counter label={t('programBook.rooms')} value={rooms} min={1} max={50} onChange={setRooms} colors={colors} />

        {/* Room type chips (if the program defines them) */}
        {!!program.roomTypes?.length && (
          <>
            <Text style={[s.fieldLabel, { color: colors.foreground, fontFamily: 'Cairo_600SemiBold' }]}>
              {t('programBook.roomType')}
            </Text>
            <View style={s.chips}>
              {program.roomTypes.map((rt) => {
                const active = roomType === rt;
                return (
                  <Pressable
                    key={rt}
                    onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setRoomType(active ? '' : rt); }}
                    style={[
                      s.chip,
                      active
                        ? { backgroundColor: NAVY, borderColor: NAVY }
                        : { backgroundColor: colors.card, borderColor: colors.border },
                    ]}
                  >
                    <Text style={{
                      color: active ? '#FFFFFF' : colors.foreground,
                      fontFamily: active ? 'Cairo_700Bold' : 'Cairo_400Regular',
                      fontSize: 13,
                    }}>
                      {rt}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </>
        )}

        {/* Notes */}
        <Input
          label={t('programBook.notes')}
          value={notes}
          onChangeText={setNotes}
          multiline
          numberOfLines={3}
          style={{ minHeight: 72, textAlignVertical: 'top' }}
          returnKeyType="default"
        />

        {/* Error */}
        {formError && (
          <View style={s.errorBox}>
            <Ionicons name="alert-circle" size={18} color="#DC2626" />
            <Text style={[s.errorText, { fontFamily: 'Cairo_600SemiBold' }]}>{formError}</Text>
          </View>
        )}

        {/* Submit */}
        <Pressable
          style={({ pressed }) => [
            s.submitBtn,
            { backgroundColor: GOLD, opacity: pressed || submitMutation.isPending ? 0.85 : 1 },
          ]}
          onPress={handleSubmit}
          disabled={submitMutation.isPending}
        >
          {submitMutation.isPending ? (
            <ActivityIndicator color={NAVY} />
          ) : (
            <>
              <Text style={[s.submitText, { fontFamily: 'Cairo_700Bold' }]}>{t('programBook.submit')}</Text>
              <Ionicons name="send" size={18} color={NAVY} style={{ transform: [{ scaleX: lang === 'ar' ? -1 : 1 }] }} />
            </>
          )}
        </Pressable>
      </KeyboardAwareForm>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1 },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 16, paddingBottom: 14,
  },
  headerBack: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center', justifyContent: 'center',
  },
  headerTexts: { flex: 1 },
  headerTitle: { color: '#FFFFFF', fontSize: 17, textAlign: 'right' },
  headerSub: { color: GOLD, fontSize: 13, textAlign: 'right' },
  content: { padding: 20, gap: 12 },
  summary: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    borderWidth: 1, borderRadius: 14, padding: 14,
  },
  summaryTitle: { fontSize: 15, textAlign: 'right' },
  summaryMeta: { fontSize: 12, textAlign: 'right', marginTop: 2 },
  summaryPrice: { fontSize: 18, color: NAVY },
  summaryCurrency: { fontSize: 11 },
  section: { fontSize: 16, textAlign: 'right', marginTop: 8 },
  fieldLabel: { fontSize: 14, textAlign: 'right', marginTop: 4 },
  dateTrigger: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12,
    minHeight: 56,
  },
  dateLabel: { fontSize: 12, textAlign: 'right' },
  dateValue: { fontSize: 15, textAlign: 'right', marginTop: 2 },
  counterRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 8,
    minHeight: 56,
  },
  counterLabel: { fontSize: 14 },
  counterControls: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  counterBtn: {
    width: 48, height: 48, borderRadius: 12, borderWidth: 1,
    alignItems: 'center', justifyContent: 'center',
  },
  counterValue: { fontSize: 16, minWidth: 28, textAlign: 'center' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'flex-end' },
  chip: {
    borderWidth: 1, borderRadius: 20, paddingHorizontal: 16,
    minHeight: 48, alignItems: 'center', justifyContent: 'center',
  },
  errorBox: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#FEF2F2', borderRadius: 10, padding: 12,
  },
  errorText: { color: '#DC2626', fontSize: 13, flex: 1, textAlign: 'right' },
  submitBtn: {
    borderRadius: 14, minHeight: 56, flexDirection: 'row',
    alignItems: 'center', justifyContent: 'center', gap: 10, marginTop: 8,
  },
  submitText: { color: NAVY, fontSize: 16 },
  successWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 28, gap: 8 },
  successIcon: { marginBottom: 8 },
  successTitle: { fontSize: 20, textAlign: 'center' },
  successBody: { fontSize: 14, textAlign: 'center', lineHeight: 24, marginBottom: 8 },
  reqBox: {
    borderWidth: 1, borderRadius: 14, paddingVertical: 14, paddingHorizontal: 28,
    alignItems: 'center', gap: 4, marginBottom: 16, alignSelf: 'stretch',
  },
  reqLabel: { fontSize: 12 },
  reqNumber: { fontSize: 20, color: NAVY, letterSpacing: 2 },
  primaryBtn: {
    alignSelf: 'stretch', minHeight: 52, borderRadius: 14,
    alignItems: 'center', justifyContent: 'center',
  },
  primaryBtnText: { color: '#FFFFFF', fontSize: 15 },
  secondaryBtn: {
    alignSelf: 'stretch', minHeight: 52, borderRadius: 14, borderWidth: 1,
    alignItems: 'center', justifyContent: 'center', marginTop: 10,
  },
  secondaryBtnText: { fontSize: 15 },
});
