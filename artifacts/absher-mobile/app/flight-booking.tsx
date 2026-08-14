/**
 * flight-booking.tsx — شاشة حجز الرحلة متعددة الخطوات
 * Step 1: بيانات المسافرين
 * Step 2: مراجعة وتأكيد
 * Step 3: تم الحجز
 */
import React, { useState } from 'react';
import {
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleProp,
  StyleSheet,
  Text,
  TextInput,
  View,
  ViewStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { useColors } from '@/hooks/useColors';
import { useCreateBooking } from '@workspace/api-client-react';
import type { FlightOffer } from '@workspace/api-client-react';
import NationalityPicker from '@/components/NationalityPicker';
import type { Nationality } from '@/constants/nationalities';

// ── Dial code data ────────────────────────────────────────────────────────────
const DIAL_CODES = [
  { code: 'YE', dial: '+967', nameAr: 'اليمن' },
  { code: 'SA', dial: '+966', nameAr: 'السعودية' },
  { code: 'AE', dial: '+971', nameAr: 'الإمارات' },
  { code: 'OM', dial: '+968', nameAr: 'عُمان' },
  { code: 'KW', dial: '+965', nameAr: 'الكويت' },
  { code: 'QA', dial: '+974', nameAr: 'قطر' },
  { code: 'BH', dial: '+973', nameAr: 'البحرين' },
  { code: 'EG', dial: '+20', nameAr: 'مصر' },
  { code: 'JO', dial: '+962', nameAr: 'الأردن' },
  { code: 'IQ', dial: '+964', nameAr: 'العراق' },
  { code: 'SY', dial: '+963', nameAr: 'سوريا' },
  { code: 'LB', dial: '+961', nameAr: 'لبنان' },
  { code: 'PS', dial: '+970', nameAr: 'فلسطين' },
  { code: 'MA', dial: '+212', nameAr: 'المغرب' },
  { code: 'DZ', dial: '+213', nameAr: 'الجزائر' },
  { code: 'TN', dial: '+216', nameAr: 'تونس' },
  { code: 'LY', dial: '+218', nameAr: 'ليبيا' },
  { code: 'SD', dial: '+249', nameAr: 'السودان' },
  { code: 'IN', dial: '+91', nameAr: 'الهند' },
  { code: 'PK', dial: '+92', nameAr: 'باكستان' },
  { code: 'TR', dial: '+90', nameAr: 'تركيا' },
  { code: 'GB', dial: '+44', nameAr: 'بريطانيا' },
  { code: 'US', dial: '+1', nameAr: 'أمريكا' },
];

const TITLES = ['Mr', 'Mrs', 'Ms', 'Miss'];
const MONTHS_AR = [
  'يناير','فبراير','مارس','أبريل','مايو','يونيو',
  'يوليو','أغسطس','سبتمبر','أكتوبر','نوفمبر','ديسمبر',
];

const CURRENT_YEAR = new Date().getFullYear();
const BIRTH_YEARS = Array.from({ length: 80 }, (_, i) => CURRENT_YEAR - 17 - i);
const PASSPORT_YEARS_ISSUE = Array.from({ length: 20 }, (_, i) => CURRENT_YEAR - i);
const PASSPORT_YEARS_EXPIRY = Array.from({ length: 15 }, (_, i) => CURRENT_YEAR + i);
const DAYS = Array.from({ length: 31 }, (_, i) => i + 1);

interface PassengerData {
  title: string;
  firstName: string;
  lastName: string;
  gender: 'male' | 'female' | '';
  dobDay: string;
  dobMonth: string;
  dobYear: string;
  email: string;
  dialCode: string;
  phone: string;
  passportNumber: string;
  nationality: string;
  passportIssueDay: string;
  passportIssueMonth: string;
  passportIssueYear: string;
  passportExpiryDay: string;
  passportExpiryMonth: string;
  passportExpiryYear: string;
}

function emptyPassenger(): PassengerData {
  return {
    title: '',
    firstName: '',
    lastName: '',
    gender: '',
    dobDay: '',
    dobMonth: '',
    dobYear: '',
    email: '',
    dialCode: '+967',
    phone: '',
    passportNumber: '',
    nationality: '',
    passportIssueDay: '',
    passportIssueMonth: '',
    passportIssueYear: '',
    passportExpiryDay: '',
    passportExpiryMonth: '',
    passportExpiryYear: '',
  };
}

// ── Inline mini-picker modal ──────────────────────────────────────────────────
function PickerModal({
  visible,
  title,
  items,
  onSelect,
  onClose,
  renderItem,
}: {
  visible: boolean;
  title: string;
  items: (string | number)[];
  onSelect: (v: string) => void;
  onClose: () => void;
  renderItem?: (v: string | number) => string;
}) {
  const colors = useColors();
  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" transparent={false}>
      <View style={[pm.sheet, { backgroundColor: colors.background }]}>
        <View style={[pm.header, { borderBottomColor: colors.border, backgroundColor: colors.card }]}>
          <Pressable onPress={onClose} hitSlop={12}>
            <Ionicons name="close" size={24} color={colors.foreground} />
          </Pressable>
          <Text style={[pm.title, { color: colors.foreground, fontFamily: 'Cairo_700Bold' }]}>{title}</Text>
          <View style={{ width: 24 }} />
        </View>
        <FlatList
          data={items}
          keyExtractor={(i) => String(i)}
          renderItem={({ item }) => (
            <Pressable
              style={({ pressed }) => [pm.item, { borderBottomColor: colors.border, backgroundColor: pressed ? colors.muted : colors.background }]}
              onPress={() => { onSelect(String(item)); onClose(); }}
            >
              <Text style={[pm.itemText, { color: colors.foreground, fontFamily: 'Cairo_600SemiBold' }]}>
                {renderItem ? renderItem(item) : String(item)}
              </Text>
            </Pressable>
          )}
        />
      </View>
    </Modal>
  );
}
const pm = StyleSheet.create({
  sheet: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderBottomWidth: 1 },
  title: { fontSize: 16 },
  item: { paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: StyleSheet.hairlineWidth },
  itemText: { fontSize: 16, textAlign: 'right' },
});

// ── DialCodeModal ─────────────────────────────────────────────────────────────
function DialCodeModal({ visible, onSelect, onClose }: { visible: boolean; onSelect: (d: string) => void; onClose: () => void }) {
  const colors = useColors();
  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={[pm.sheet, { backgroundColor: colors.background }]}>
        <View style={[pm.header, { borderBottomColor: colors.border, backgroundColor: colors.card }]}>
          <Pressable onPress={onClose} hitSlop={12}>
            <Ionicons name="close" size={24} color={colors.foreground} />
          </Pressable>
          <Text style={[pm.title, { color: colors.foreground, fontFamily: 'Cairo_700Bold' }]}>رمز الدولة</Text>
          <View style={{ width: 24 }} />
        </View>
        <FlatList
          data={DIAL_CODES}
          keyExtractor={(i) => i.code}
          renderItem={({ item }) => (
            <Pressable
              style={({ pressed }) => [pm.item, { borderBottomColor: colors.border, backgroundColor: pressed ? colors.muted : colors.background }]}
              onPress={() => { onSelect(item.dial); onClose(); }}
            >
              <Text style={[pm.itemText, { color: colors.foreground, fontFamily: 'Cairo_600SemiBold' }]}>
                {item.nameAr} ({item.dial})
              </Text>
            </Pressable>
          )}
        />
      </View>
    </Modal>
  );
}

// ── DateTriplePicker ──────────────────────────────────────────────────────────
function DateTriplePicker({
  label,
  day, month, year,
  onDay, onMonth, onYear,
  yearsList,
  colors,
}: {
  label: string;
  day: string; month: string; year: string;
  onDay: (v: string) => void;
  onMonth: (v: string) => void;
  onYear: (v: string) => void;
  yearsList: number[];
  colors: ReturnType<typeof import('@/hooks/useColors').useColors>;
}) {
  const [showDay, setShowDay] = useState(false);
  const [showMonth, setShowMonth] = useState(false);
  const [showYear, setShowYear] = useState(false);

  const btnStyle: StyleProp<ViewStyle> = [dtp.btn, { backgroundColor: colors.muted, borderColor: colors.border }];
  const txtStyle = { color: day ? colors.foreground : colors.mutedForeground, fontFamily: 'Cairo_600SemiBold' as const, fontSize: 13 as const };

  return (
    <View style={dtp.wrap}>
      <Text style={[dtp.label, { color: colors.mutedForeground, fontFamily: 'Cairo_400Regular' }]}>{label}</Text>
      <View style={dtp.row}>
        <Pressable style={btnStyle} onPress={() => setShowDay(true)}>
          <Text style={txtStyle}>{day || 'اليوم'}</Text>
          <Ionicons name="chevron-down" size={13} color={colors.mutedForeground} />
        </Pressable>
        <Pressable style={btnStyle} onPress={() => setShowMonth(true)}>
          <Text style={txtStyle}>{month ? MONTHS_AR[Number(month) - 1] : 'الشهر'}</Text>
          <Ionicons name="chevron-down" size={13} color={colors.mutedForeground} />
        </Pressable>
        <Pressable style={btnStyle} onPress={() => setShowYear(true)}>
          <Text style={txtStyle}>{year || 'السنة'}</Text>
          <Ionicons name="chevron-down" size={13} color={colors.mutedForeground} />
        </Pressable>
      </View>
      <PickerModal visible={showDay} title="اختر اليوم" items={DAYS} onSelect={onDay} onClose={() => setShowDay(false)} />
      <PickerModal visible={showMonth} title="اختر الشهر" items={Array.from({ length: 12 }, (_, i) => i + 1)} onSelect={onMonth} onClose={() => setShowMonth(false)} renderItem={(v) => MONTHS_AR[Number(v) - 1]} />
      <PickerModal visible={showYear} title="اختر السنة" items={yearsList} onSelect={onYear} onClose={() => setShowYear(false)} />
    </View>
  );
}
const dtp = StyleSheet.create({
  wrap: { gap: 6 },
  label: { fontSize: 13, textAlign: 'right' },
  row: { flexDirection: 'row', gap: 8 },
  btn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderRadius: 10, borderWidth: 1, paddingHorizontal: 10, paddingVertical: 12 },
});

// ── StepIndicator ─────────────────────────────────────────────────────────────
function StepIndicator({ step, colors }: { step: number; colors: ReturnType<typeof import('@/hooks/useColors').useColors> }) {
  const steps = ['بيانات المسافر', 'المراجعة', 'التأكيد'];
  return (
    <View style={si.wrap}>
      {steps.map((s, i) => {
        const active = i + 1 === step;
        const done = i + 1 < step;
        return (
          <React.Fragment key={i}>
            <View style={si.stepWrap}>
              <View style={[si.dot, { backgroundColor: done || active ? '#D4AF37' : 'rgba(255,255,255,0.3)' }]}>
                {done
                  ? <Ionicons name="checkmark" size={12} color="#052B5B" />
                  : <Text style={[si.dotNum, { color: active ? '#052B5B' : 'rgba(255,255,255,0.6)', fontFamily: 'Cairo_700Bold' }]}>{i + 1}</Text>
                }
              </View>
              <Text style={[si.label, { color: active ? '#D4AF37' : 'rgba(255,255,255,0.5)', fontFamily: active ? 'Cairo_700Bold' : 'Cairo_400Regular' }]}>{s}</Text>
            </View>
            {i < steps.length - 1 && <View style={[si.line, { backgroundColor: done ? '#D4AF37' : 'rgba(255,255,255,0.2)' }]} />}
          </React.Fragment>
        );
      })}
    </View>
  );
}
const si = StyleSheet.create({
  wrap: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 4 },
  stepWrap: { alignItems: 'center', gap: 4 },
  dot: { width: 26, height: 26, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  dotNum: { fontSize: 12 },
  label: { fontSize: 10 },
  line: { flex: 1, height: 2, marginHorizontal: 4, marginBottom: 16 },
});

// ── PassengerForm ─────────────────────────────────────────────────────────────
function PassengerForm({
  data,
  onChange,
  index,
  colors,
}: {
  data: PassengerData;
  onChange: (d: PassengerData) => void;
  index: number;
  colors: ReturnType<typeof import('@/hooks/useColors').useColors>;
}) {
  const [showDial, setShowDial] = useState(false);
  const set = (key: keyof PassengerData, value: string) => onChange({ ...data, [key]: value });

  const inputStyle = [pf.input, { backgroundColor: colors.muted, borderColor: colors.border, color: colors.foreground }];

  return (
    <View style={[pf.card, { backgroundColor: colors.card }]}>
      <Text style={[pf.cardTitle, { color: '#052B5B', fontFamily: 'Cairo_700Bold' }]}>
        المسافر {index + 1}
      </Text>

      {/* Title chips */}
      <View style={pf.field}>
        <Text style={[pf.label, { color: colors.mutedForeground, fontFamily: 'Cairo_400Regular' }]}>اللقب</Text>
        <View style={pf.chipRow}>
          {TITLES.map((t) => (
            <Pressable
              key={t}
              style={[pf.chip, { backgroundColor: data.title === t ? '#052B5B' : colors.muted, borderColor: data.title === t ? '#D4AF37' : colors.border }]}
              onPress={() => set('title', t)}
            >
              <Text style={[pf.chipText, { color: data.title === t ? '#FFFFFF' : colors.foreground, fontFamily: 'Cairo_600SemiBold' }]}>{t}</Text>
            </Pressable>
          ))}
        </View>
      </View>

      {/* Name */}
      <View style={pf.field}>
        <Text style={[pf.label, { color: colors.mutedForeground, fontFamily: 'Cairo_400Regular' }]}>الاسم الأول (كما في الجواز)</Text>
        <TextInput
          style={[inputStyle, { fontFamily: 'Cairo_400Regular' }]}
          value={data.firstName}
          onChangeText={(v) => set('firstName', v)}
          placeholder="Given Name"
          placeholderTextColor={colors.mutedForeground}
          autoCapitalize="characters"
          textAlign="right"
        />
      </View>

      <View style={pf.field}>
        <Text style={[pf.label, { color: colors.mutedForeground, fontFamily: 'Cairo_400Regular' }]}>اسم العائلة</Text>
        <TextInput
          style={[inputStyle, { fontFamily: 'Cairo_400Regular' }]}
          value={data.lastName}
          onChangeText={(v) => set('lastName', v)}
          placeholder="Family Name"
          placeholderTextColor={colors.mutedForeground}
          autoCapitalize="characters"
          textAlign="right"
        />
      </View>

      {/* Gender */}
      <View style={pf.field}>
        <Text style={[pf.label, { color: colors.mutedForeground, fontFamily: 'Cairo_400Regular' }]}>الجنس</Text>
        <View style={pf.chipRow}>
          {([{ v: 'male', l: 'ذكر' }, { v: 'female', l: 'أنثى' }] as const).map(({ v, l }) => (
            <Pressable
              key={v}
              style={[pf.chip, { flex: 1, backgroundColor: data.gender === v ? '#052B5B' : colors.muted, borderColor: data.gender === v ? '#D4AF37' : colors.border }]}
              onPress={() => set('gender', v)}
            >
              <Text style={[pf.chipText, { color: data.gender === v ? '#FFFFFF' : colors.foreground, fontFamily: 'Cairo_600SemiBold' }]}>{l}</Text>
            </Pressable>
          ))}
        </View>
      </View>

      {/* Date of Birth */}
      <View style={pf.field}>
        <DateTriplePicker
          label="تاريخ الميلاد"
          day={data.dobDay} month={data.dobMonth} year={data.dobYear}
          onDay={(v) => set('dobDay', v)}
          onMonth={(v) => set('dobMonth', v)}
          onYear={(v) => set('dobYear', v)}
          yearsList={BIRTH_YEARS}
          colors={colors}
        />
      </View>

      {/* Email */}
      <View style={pf.field}>
        <Text style={[pf.label, { color: colors.mutedForeground, fontFamily: 'Cairo_400Regular' }]}>البريد الإلكتروني</Text>
        <TextInput
          style={[inputStyle, { fontFamily: 'Cairo_400Regular' }]}
          value={data.email}
          onChangeText={(v) => set('email', v)}
          placeholder="example@email.com"
          placeholderTextColor={colors.mutedForeground}
          keyboardType="email-address"
          autoCapitalize="none"
          textAlign="right"
        />
      </View>

      {/* Phone */}
      <View style={pf.field}>
        <Text style={[pf.label, { color: colors.mutedForeground, fontFamily: 'Cairo_400Regular' }]}>رقم الجوال</Text>
        <View style={pf.phoneRow}>
          <Pressable
            style={[pf.dialBtn, { backgroundColor: colors.muted, borderColor: colors.border }]}
            onPress={() => setShowDial(true)}
          >
            <Text style={[pf.dialText, { color: colors.foreground, fontFamily: 'Cairo_600SemiBold' }]}>{data.dialCode}</Text>
            <Ionicons name="chevron-down" size={14} color={colors.mutedForeground} />
          </Pressable>
          <TextInput
            style={[inputStyle, pf.phoneInput, { fontFamily: 'Cairo_400Regular' }]}
            value={data.phone}
            onChangeText={(v) => set('phone', v)}
            placeholder="7XXXXXXXX"
            placeholderTextColor={colors.mutedForeground}
            keyboardType="phone-pad"
            textAlign="right"
          />
        </View>
        <DialCodeModal visible={showDial} onSelect={(d) => set('dialCode', d)} onClose={() => setShowDial(false)} />
      </View>

      {/* Passport Number */}
      <View style={pf.field}>
        <Text style={[pf.label, { color: colors.mutedForeground, fontFamily: 'Cairo_400Regular' }]}>رقم الجواز</Text>
        <TextInput
          style={[inputStyle, { fontFamily: 'Cairo_400Regular' }]}
          value={data.passportNumber}
          onChangeText={(v) => set('passportNumber', v.toUpperCase())}
          placeholder="A12345678"
          placeholderTextColor={colors.mutedForeground}
          autoCapitalize="characters"
          textAlign="right"
        />
      </View>

      {/* Nationality */}
      <View style={pf.field}>
        <Text style={[pf.label, { color: colors.mutedForeground, fontFamily: 'Cairo_400Regular' }]}>الجنسية</Text>
        <NationalityPicker
          value={data.nationality}
          onChange={(n: Nationality) => set('nationality', n.demonymAr)}
          placeholder="اختر الجنسية"
        />
      </View>

      {/* Passport Issue Date */}
      <View style={pf.field}>
        <DateTriplePicker
          label="تاريخ إصدار الجواز"
          day={data.passportIssueDay} month={data.passportIssueMonth} year={data.passportIssueYear}
          onDay={(v) => set('passportIssueDay', v)}
          onMonth={(v) => set('passportIssueMonth', v)}
          onYear={(v) => set('passportIssueYear', v)}
          yearsList={PASSPORT_YEARS_ISSUE}
          colors={colors}
        />
      </View>

      {/* Passport Expiry Date */}
      <View style={pf.field}>
        <DateTriplePicker
          label="تاريخ انتهاء الجواز"
          day={data.passportExpiryDay} month={data.passportExpiryMonth} year={data.passportExpiryYear}
          onDay={(v) => set('passportExpiryDay', v)}
          onMonth={(v) => set('passportExpiryMonth', v)}
          onYear={(v) => set('passportExpiryYear', v)}
          yearsList={PASSPORT_YEARS_EXPIRY}
          colors={colors}
        />
      </View>
    </View>
  );
}

const pf = StyleSheet.create({
  card: { borderRadius: 16, padding: 16, gap: 14, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 3 },
  cardTitle: { fontSize: 16, borderBottomWidth: 2, borderBottomColor: '#D4AF37', paddingBottom: 8, textAlign: 'right' },
  field: { gap: 6 },
  label: { fontSize: 13, textAlign: 'right' },
  input: { borderRadius: 10, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 13, fontSize: 14 },
  chipRow: { flexDirection: 'row', gap: 8 },
  chip: { borderRadius: 8, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 10 },
  chipText: { fontSize: 13 },
  phoneRow: { flexDirection: 'row', gap: 8 },
  dialBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, borderRadius: 10, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 13 },
  dialText: { fontSize: 14 },
  phoneInput: { flex: 1 },
});

// ── Main Screen ───────────────────────────────────────────────────────────────
export default function FlightBookingScreen() {
  const { offer: offerStr } = useLocalSearchParams<{ offer: string }>();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const topInset = Platform.OS === 'web' ? 67 : insets.top;

  const offer: Partial<FlightOffer> = React.useMemo(() => {
    try { return JSON.parse(offerStr || '{}'); }
    catch { return {}; }
  }, [offerStr]);

  const adults = 1; // default; could be passed via params
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [passengers, setPassengers] = useState<PassengerData[]>([emptyPassenger()]);
  const [bookingRef, setBookingRef] = useState('');

  const createBooking = useCreateBooking();

  const firstSeg = offer.segments?.[0];
  const lastSeg = offer.segments?.[offer.segments?.length - 1];

  const formatTime = (iso?: string) => {
    if (!iso) return '--';
    return new Date(iso).toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit', hour12: false });
  };

  const formatDate = (iso?: string) => {
    if (!iso) return '';
    return new Date(iso).toLocaleDateString('ar-SA', { day: 'numeric', month: 'long', year: 'numeric' });
  };

  const validateStep1 = () => {
    for (const p of passengers) {
      if (!p.firstName || !p.lastName || !p.passportNumber || !p.nationality || !p.email) {
        Alert.alert('بيانات ناقصة', 'يرجى تعبئة جميع الحقول المطلوبة');
        return false;
      }
    }
    return true;
  };

  const handleConfirm = () => {
    const p = passengers[0];
    const payload = {
      type: 'flight' as const,
      clientName: `${p.firstName} ${p.lastName}`.trim(),
      clientPhone: `${p.dialCode}${p.phone}`,
      clientEmail: p.email || undefined,
      destination: lastSeg?.destinationIata || undefined,
      travelDate: firstSeg?.departureAt?.split('T')[0] || undefined,
      adults,
      notes: `جواز: ${p.passportNumber} | جنسية: ${p.nationality}`,
      totalPrice: offer.totalPrice || undefined,
    };

    createBooking.mutate(
      { data: payload },
      {
        onSuccess: (booking) => {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          setBookingRef(`BK-${booking.id}`);
          setStep(3);
        },
        onError: () => {
          Alert.alert('خطأ', 'فشل في تأكيد الحجز، حاول مرة أخرى');
        },
      }
    );
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={[s.container, { backgroundColor: colors.background }]}>
        {/* Header */}
        <View style={[s.header, { paddingTop: topInset + 8, backgroundColor: '#052B5B' }]}>
          <View style={s.headerRow}>
            <Pressable onPress={() => (step > 1 && step < 3) ? setStep((step - 1) as 1 | 2 | 3) : router.back()}>
              <Ionicons name="arrow-forward" size={22} color="#FFFFFF" />
            </Pressable>
            <Text style={[s.headerTitle, { fontFamily: 'Cairo_700Bold' }]}>
              {step === 1 ? 'بيانات المسافرين' : step === 2 ? 'مراجعة وتأكيد' : 'تم الحجز'}
            </Text>
            <View style={{ width: 22 }} />
          </View>

          {/* Flight summary strip */}
          {(step === 1 || step === 2) && (
            <View style={s.flightStrip}>
              <Text style={[s.stripTime, { fontFamily: 'Cairo_700Bold' }]}>{formatTime(lastSeg?.arrivalAt)}</Text>
              <Text style={[s.stripCode, { fontFamily: 'Cairo_600SemiBold' }]}>{lastSeg?.destinationIata}</Text>
              <View style={s.stripMiddle}>
                <Ionicons name="airplane" size={16} color="#D4AF37" />
              </View>
              <Text style={[s.stripCode, { fontFamily: 'Cairo_600SemiBold' }]}>{firstSeg?.originIata}</Text>
              <Text style={[s.stripTime, { fontFamily: 'Cairo_700Bold' }]}>{formatTime(firstSeg?.departureAt)}</Text>
            </View>
          )}

          <StepIndicator step={step} colors={colors} />
        </View>

        {/* ── STEP 1: Passenger Form ── */}
        {step === 1 && (
          <ScrollView contentContainerStyle={s.scrollContent} keyboardShouldPersistTaps="handled">
            {passengers.map((p, i) => (
              <PassengerForm key={i} data={p} index={i} colors={colors} onChange={(d) => {
                const updated = [...passengers];
                updated[i] = d;
                setPassengers(updated);
              }} />
            ))}
            <Pressable
              style={({ pressed }) => [s.nextBtn, { opacity: pressed ? 0.9 : 1 }]}
              onPress={() => { if (validateStep1()) setStep(2); }}
            >
              <Ionicons name="arrow-back" size={18} color="#052B5B" />
              <Text style={[s.nextBtnText, { fontFamily: 'Cairo_700Bold' }]}>التالي — مراجعة</Text>
            </Pressable>
          </ScrollView>
        )}

        {/* ── STEP 2: Review ── */}
        {step === 2 && (
          <ScrollView contentContainerStyle={s.scrollContent}>
            {/* Flight details card */}
            <View style={[s.reviewCard, { backgroundColor: colors.card }]}>
              <Text style={[s.reviewSectionTitle, { color: '#052B5B', fontFamily: 'Cairo_700Bold' }]}>تفاصيل الرحلة</Text>
              <View style={s.reviewRow}>
                <Text style={[s.reviewValue, { color: colors.foreground, fontFamily: 'Cairo_600SemiBold' }]}>{firstSeg?.airlineName || '---'}</Text>
                <Text style={[s.reviewKey, { color: colors.mutedForeground, fontFamily: 'Cairo_400Regular' }]}>الناقل</Text>
              </View>
              <View style={s.reviewRow}>
                <Text style={[s.reviewValue, { color: colors.foreground, fontFamily: 'Cairo_600SemiBold' }]}>{firstSeg?.originIata} → {lastSeg?.destinationIata}</Text>
                <Text style={[s.reviewKey, { color: colors.mutedForeground, fontFamily: 'Cairo_400Regular' }]}>المسار</Text>
              </View>
              <View style={s.reviewRow}>
                <Text style={[s.reviewValue, { color: colors.foreground, fontFamily: 'Cairo_600SemiBold' }]}>{formatDate(firstSeg?.departureAt)}</Text>
                <Text style={[s.reviewKey, { color: colors.mutedForeground, fontFamily: 'Cairo_400Regular' }]}>تاريخ المغادرة</Text>
              </View>
              <View style={s.reviewRow}>
                <Text style={[s.reviewValue, { color: colors.foreground, fontFamily: 'Cairo_600SemiBold' }]}>{offer.stops === 0 ? 'مباشر' : `${offer.stops} توقف`}</Text>
                <Text style={[s.reviewKey, { color: colors.mutedForeground, fontFamily: 'Cairo_400Regular' }]}>الرحلة</Text>
              </View>
            </View>

            {/* Passenger summary */}
            {passengers.map((p, i) => (
              <View key={i} style={[s.reviewCard, { backgroundColor: colors.card }]}>
                <Text style={[s.reviewSectionTitle, { color: '#052B5B', fontFamily: 'Cairo_700Bold' }]}>المسافر {i + 1}</Text>
                <View style={s.reviewRow}>
                  <Text style={[s.reviewValue, { color: colors.foreground, fontFamily: 'Cairo_600SemiBold' }]}>{p.title} {p.firstName} {p.lastName}</Text>
                  <Text style={[s.reviewKey, { color: colors.mutedForeground, fontFamily: 'Cairo_400Regular' }]}>الاسم</Text>
                </View>
                <View style={s.reviewRow}>
                  <Text style={[s.reviewValue, { color: colors.foreground, fontFamily: 'Cairo_600SemiBold' }]}>{p.nationality}</Text>
                  <Text style={[s.reviewKey, { color: colors.mutedForeground, fontFamily: 'Cairo_400Regular' }]}>الجنسية</Text>
                </View>
                <View style={s.reviewRow}>
                  <Text style={[s.reviewValue, { color: colors.foreground, fontFamily: 'Cairo_600SemiBold' }]}>{p.passportNumber}</Text>
                  <Text style={[s.reviewKey, { color: colors.mutedForeground, fontFamily: 'Cairo_400Regular' }]}>رقم الجواز</Text>
                </View>
                <View style={s.reviewRow}>
                  <Text style={[s.reviewValue, { color: colors.foreground, fontFamily: 'Cairo_600SemiBold' }]}>{p.email}</Text>
                  <Text style={[s.reviewKey, { color: colors.mutedForeground, fontFamily: 'Cairo_400Regular' }]}>البريد</Text>
                </View>
              </View>
            ))}

            {/* Price */}
            <View style={[s.priceCard, { backgroundColor: '#052B5B' }]}>
              <Text style={[s.priceCurrency, { fontFamily: 'Cairo_400Regular' }]}>{offer.currency || 'USD'}</Text>
              <Text style={[s.priceAmount, { fontFamily: 'Cairo_700Bold' }]}>
                {offer.totalPrice?.toLocaleString('ar-SA') || '---'}
              </Text>
              <Text style={[s.priceLabel, { fontFamily: 'Cairo_400Regular' }]}>إجمالي السعر</Text>
            </View>

            <Pressable
              style={({ pressed }) => [s.nextBtn, { opacity: createBooking.isPending ? 0.7 : pressed ? 0.9 : 1 }]}
              onPress={handleConfirm}
              disabled={createBooking.isPending}
            >
              <Ionicons name="checkmark-circle" size={18} color="#052B5B" />
              <Text style={[s.nextBtnText, { fontFamily: 'Cairo_700Bold' }]}>
                {createBooking.isPending ? 'جاري التأكيد...' : 'تأكيد الحجز'}
              </Text>
            </Pressable>
          </ScrollView>
        )}

        {/* ── STEP 3: Confirmed ── */}
        {step === 3 && (
          <View style={s.confirmedWrap}>
            <View style={[s.confirmedIcon, { backgroundColor: '#DCFCE7' }]}>
              <Ionicons name="checkmark-circle" size={72} color="#16A34A" />
            </View>
            <Text style={[s.confirmedTitle, { color: colors.foreground, fontFamily: 'Cairo_700Bold' }]}>تم الحجز بنجاح!</Text>
            <Text style={[s.confirmedSub, { color: colors.mutedForeground, fontFamily: 'Cairo_400Regular' }]}>
              رقم الحجز الخاص بك
            </Text>
            <View style={[s.refBadge, { backgroundColor: '#052B5B' }]}>
              <Text style={[s.refText, { fontFamily: 'Cairo_700Bold' }]}>{bookingRef}</Text>
            </View>
            <Text style={[s.confirmedHint, { color: colors.mutedForeground, fontFamily: 'Cairo_400Regular' }]}>
              سيتواصل معك فريقنا لتأكيد التفاصيل
            </Text>
            <View style={s.confirmedActions}>
              <Pressable
                style={[s.confirmedBtn, { backgroundColor: '#052B5B' }]}
                onPress={() => router.push('/(tabs)/bookings' as any)}
              >
                <Ionicons name="calendar-outline" size={18} color="#FFFFFF" />
                <Text style={[s.confirmedBtnText, { fontFamily: 'Cairo_700Bold' }]}>عرض حجوزاتي</Text>
              </Pressable>
              <Pressable
                style={[s.confirmedBtnOutline, { borderColor: '#052B5B' }]}
                onPress={() => router.push('/')}
              >
                <Ionicons name="home-outline" size={18} color="#052B5B" />
                <Text style={[s.confirmedBtnOutlineText, { color: '#052B5B', fontFamily: 'Cairo_600SemiBold' }]}>الرئيسية</Text>
              </Pressable>
            </View>
          </View>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 16, paddingBottom: 8 },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  headerTitle: { color: '#FFFFFF', fontSize: 18 },
  flightStrip: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 8, backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 10, marginBottom: 8, paddingHorizontal: 12 },
  stripTime: { color: '#FFFFFF', fontSize: 16 },
  stripCode: { color: '#D4AF37', fontSize: 13 },
  stripMiddle: { flex: 1, alignItems: 'center' },
  scrollContent: { padding: 16, gap: 16, paddingBottom: 40 },
  nextBtn: { backgroundColor: '#D4AF37', borderRadius: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 16, gap: 8 },
  nextBtnText: { color: '#052B5B', fontSize: 16 },
  reviewCard: { borderRadius: 16, padding: 16, gap: 10, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 3 },
  reviewSectionTitle: { fontSize: 15, borderBottomWidth: 2, borderBottomColor: '#D4AF37', paddingBottom: 6, textAlign: 'right' },
  reviewRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  reviewKey: { fontSize: 13 },
  reviewValue: { fontSize: 14, textAlign: 'right', flex: 1, paddingLeft: 8 },
  priceCard: { borderRadius: 16, padding: 20, alignItems: 'center', gap: 4 },
  priceLabel: { color: 'rgba(255,255,255,0.6)', fontSize: 12 },
  priceAmount: { color: '#D4AF37', fontSize: 36 },
  priceCurrency: { color: 'rgba(255,255,255,0.8)', fontSize: 14 },
  confirmedWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, gap: 16 },
  confirmedIcon: { width: 110, height: 110, borderRadius: 55, alignItems: 'center', justifyContent: 'center' },
  confirmedTitle: { fontSize: 26, textAlign: 'center' },
  confirmedSub: { fontSize: 14, textAlign: 'center' },
  refBadge: { borderRadius: 12, paddingHorizontal: 24, paddingVertical: 12 },
  refText: { color: '#D4AF37', fontSize: 20, letterSpacing: 2 },
  confirmedHint: { fontSize: 13, textAlign: 'center', lineHeight: 20 },
  confirmedActions: { width: '100%', gap: 10, marginTop: 8 },
  confirmedBtn: { borderRadius: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 15, gap: 8 },
  confirmedBtnText: { color: '#FFFFFF', fontSize: 15 },
  confirmedBtnOutline: { borderRadius: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 14, gap: 8, borderWidth: 2 },
  confirmedBtnOutlineText: { fontSize: 15 },
});
