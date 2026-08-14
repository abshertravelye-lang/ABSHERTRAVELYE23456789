/**
 * DatePickerModal — professional mobile date picker supporting:
 *   mode="single"   → pick one date (e.g. departure)
 *   mode="range"    → pick start + end date (departure + return)
 *   mode="birth"    → year → month → day (for date of birth, year-first UX)
 *   mode="passport" → same stepped UX as "birth"
 */
import React, { useState, useMemo } from 'react';
import {
  Modal, Pressable, ScrollView, StyleSheet, Text, View, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { useColors } from '@/hooks/useColors';
import { useLanguage } from '@/context/LanguageContext';

const MONTH_KEYS = [
  'datePicker.month.jan', 'datePicker.month.feb', 'datePicker.month.mar', 'datePicker.month.apr',
  'datePicker.month.may', 'datePicker.month.jun', 'datePicker.month.jul', 'datePicker.month.aug',
  'datePicker.month.sep', 'datePicker.month.oct', 'datePicker.month.nov', 'datePicker.month.dec',
] as const;

/* ── helpers ─────────────────────────────────────────────────────────────── */
const pad = (n: number) => String(n).padStart(2, '0');
const toISO = (y: number, m: number, d: number) => `${y}-${pad(m)}-${pad(d)}`;
const parseISO = (s: string): { y: number; m: number; d: number } | null => {
  if (!s || s.length < 10) return null;
  const [y, m, d] = s.split('-').map(Number);
  if (!y || !m || !d) return null;
  return { y, m, d };
};
const daysInMonth = (y: number, m: number) => new Date(y, m, 0).getDate();
const today = () => new Date();
const isoToday = () => toISO(today().getFullYear(), today().getMonth() + 1, today().getDate());

const MONTHS_EN = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const DAYS_AR   = ['أح','اث','ث','أر','خ','ج','س'];
const DAYS_EN   = ['Su','Mo','Tu','We','Th','Fr','Sa'];

function compareDate(a: string, b: string): number {
  return a < b ? -1 : a > b ? 1 : 0;
}

/* ── types ───────────────────────────────────────────────────────────────── */
export interface DatePickerModalProps {
  visible: boolean;
  onClose: () => void;
  /** For single/range: YYYY-MM-DD. For birth/passport: YYYY-MM-DD. */
  value: string;
  /** Only for range mode: return date. */
  value2?: string;
  /** Called with ISO string on confirm. */
  onSelect: (date: string) => void;
  /** Only for range mode. */
  onSelect2?: (date: string) => void;
  mode: 'single' | 'range' | 'birth' | 'passport';
  /** Minimum selectable date (ISO). */
  minDate?: string;
  /** Maximum selectable date (ISO). */
  maxDate?: string;
  /** Label shown in header. */
  label: string;
  lang?: 'ar' | 'en';
}

/* ═══════════════════════════════════════════════════════════════════════════
   Calendar picker (single & range)
   ═══════════════════════════════════════════════════════════════════════════ */
function CalendarPicker({
  value, value2, onSelect, onSelect2, mode, minDate, maxDate, lang, onClose,
}: {
  value: string; value2?: string;
  onSelect: (d: string) => void; onSelect2?: (d: string) => void;
  mode: 'single' | 'range'; minDate?: string; maxDate?: string;
  lang: 'ar' | 'en'; onClose: () => void;
}) {
  const colors = useColors();
  const { t } = useLanguage();
  const MONTHS = MONTH_KEYS.map((k) => t(k));
  const DAYS = lang === 'ar' ? DAYS_AR : DAYS_EN;
  const now = today();
  const initYear  = parseISO(value)?.y  ?? now.getFullYear();
  const initMonth = parseISO(value)?.m  ?? now.getMonth() + 1;

  const [viewYear,  setViewYear]  = useState(initYear);
  const [viewMonth, setViewMonth] = useState(initMonth);
  const [pickStep, setPickStep] = useState<'start' | 'end'>('start');
  const [tempStart, setTempStart] = useState(value);
  const [tempEnd,   setTempEnd]   = useState(value2 ?? '');

  const prevMonth = () => {
    if (viewMonth === 1) { setViewYear(viewYear - 1); setViewMonth(12); }
    else setViewMonth(viewMonth - 1);
  };
  const nextMonth = () => {
    if (viewMonth === 12) { setViewYear(viewYear + 1); setViewMonth(1); }
    else setViewMonth(viewMonth + 1);
  };

  const grid = useMemo(() => {
    const firstDow = new Date(viewYear, viewMonth - 1, 1).getDay();
    const dim = daysInMonth(viewYear, viewMonth);
    const cells: (number | null)[] = [];
    for (let i = 0; i < firstDow; i++) cells.push(null);
    for (let d = 1; d <= dim; d++) cells.push(d);
    while (cells.length % 7 !== 0) cells.push(null);
    return cells;
  }, [viewYear, viewMonth]);

  const getDayState = (day: number | null): 'empty' | 'disabled' | 'start' | 'end' | 'inRange' | 'today' | 'normal' => {
    if (!day) return 'empty';
    const iso = toISO(viewYear, viewMonth, day);
    if (minDate && compareDate(iso, minDate) < 0) return 'disabled';
    if (maxDate && compareDate(iso, maxDate) > 0) return 'disabled';
    if (iso === tempStart) return 'start';
    if (iso === tempEnd)   return 'end';
    if (tempStart && tempEnd && compareDate(iso, tempStart) > 0 && compareDate(iso, tempEnd) < 0) return 'inRange';
    if (iso === isoToday()) return 'today';
    return 'normal';
  };

  const isDayDisabled = (day: number | null) => {
    if (!day) return true;
    const iso = toISO(viewYear, viewMonth, day);
    if (minDate && compareDate(iso, minDate) < 0) return true;
    if (maxDate && compareDate(iso, maxDate) > 0) return true;
    return false;
  };

  const onDayPress = (day: number) => {
    const iso = toISO(viewYear, viewMonth, day);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (mode === 'single') {
      setTempStart(iso);
      return;
    }
    if (pickStep === 'start' || !tempStart) {
      setTempStart(iso); setTempEnd(''); setPickStep('end');
    } else {
      if (compareDate(iso, tempStart) < 0) {
        setTempStart(iso); setTempEnd(''); setPickStep('end');
      } else {
        setTempEnd(iso); setPickStep('start');
      }
    }
  };

  const confirm = () => {
    if (!tempStart) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onSelect(tempStart);
    if (mode === 'range' && onSelect2) onSelect2(tempEnd);
    onClose();
  };

  const clear = () => { setTempStart(''); setTempEnd(''); setPickStep('start'); };

  return (
    <View style={{ flex: 1 }}>
      {/* Scrollable calendar content */}
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: 8 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Month navigator */}
        <View style={[cal.nav, { borderBottomColor: colors.border }]}>
          <Pressable onPress={nextMonth} style={cal.navBtn} hitSlop={12}>
            <Ionicons name="chevron-forward" size={22} color={colors.foreground} />
          </Pressable>
          <Text style={[cal.navTitle, { color: colors.foreground, fontFamily: 'Cairo_700Bold' }]}>
            {MONTHS[viewMonth - 1]} {viewYear}
          </Text>
          <Pressable onPress={prevMonth} style={cal.navBtn} hitSlop={12}>
            <Ionicons name="chevron-back" size={22} color={colors.foreground} />
          </Pressable>
        </View>

        {/* Range hint */}
        {mode === 'range' && (
          <Text style={[cal.hint, { color: colors.mutedForeground, fontFamily: 'Cairo_400Regular' }]}>
            {pickStep === 'start' ? t('datePicker.pickDeparture') : t('datePicker.pickReturn')}
          </Text>
        )}

        {/* Day headers */}
        <View style={cal.dayRow}>
          {DAYS.map((d, i) => (
            <Text key={i} style={[cal.dayHdr, { color: colors.mutedForeground, fontFamily: 'Cairo_600SemiBold' }]}>{d}</Text>
          ))}
        </View>

        {/* Grid */}
        <View style={cal.grid}>
          {grid.map((day, idx) => {
            const st = getDayState(day);
            if (st === 'empty') return <View key={idx} style={cal.cell} />;
            const disabled = isDayDisabled(day);
            const isStart  = st === 'start';
            const isEnd    = st === 'end';
            const inRange  = st === 'inRange';
            const isToday  = st === 'today';
            return (
              <Pressable
                key={idx}
                style={[
                  cal.cell,
                  inRange  && { backgroundColor: '#052B5B20' },
                  (isStart || isEnd) && { backgroundColor: '#052B5B15', borderRadius: 10 },
                ]}
                onPress={() => !disabled && day && onDayPress(day)}
                disabled={disabled}
              >
                <View style={[
                  cal.dayCircle,
                  isStart || isEnd
                    ? { backgroundColor: '#052B5B', borderRadius: 10 }
                    : isToday
                    ? { borderWidth: 1.5, borderColor: '#D4AF37', borderRadius: 10 }
                    : undefined,
                ]}>
                  <Text style={[
                    cal.dayText,
                    { color: disabled ? colors.border : isStart || isEnd ? '#FFFFFF' : isToday ? '#D4AF37' : colors.foreground },
                    { fontFamily: isStart || isEnd ? 'Cairo_700Bold' : 'Cairo_400Regular' },
                  ]}>
                    {day}
                  </Text>
                </View>
              </Pressable>
            );
          })}
        </View>

        {/* Selected dates display */}
        {(tempStart || tempEnd) && (
          <View style={[cal.rangeDisplay, { borderColor: colors.border, backgroundColor: colors.muted }]}>
            {tempStart && (
              <View style={cal.rangeItem}>
                <Text style={[cal.rangeLabel, { color: colors.mutedForeground, fontFamily: 'Cairo_400Regular' }]}>
                  {mode === 'range' ? t('datePicker.departure') : t('datePicker.selectedDate')}
                </Text>
                <Text style={[cal.rangeDate, { color: '#052B5B', fontFamily: 'Cairo_700Bold' }]}>{tempStart}</Text>
              </View>
            )}
            {mode === 'range' && (
              <>
                <Ionicons name="arrow-back" size={16} color={colors.mutedForeground} />
                <View style={cal.rangeItem}>
                  <Text style={[cal.rangeLabel, { color: colors.mutedForeground, fontFamily: 'Cairo_400Regular' }]}>{t('datePicker.return')}</Text>
                  <Text style={[cal.rangeDate, { color: tempEnd ? '#052B5B' : colors.mutedForeground, fontFamily: 'Cairo_700Bold' }]}>
                    {tempEnd || '—'}
                  </Text>
                </View>
              </>
            )}
          </View>
        )}
      </ScrollView>

      {/* ── Action buttons — always pinned at bottom ── */}
      <View style={[cal.actions, { borderTopColor: colors.border }]}>
        <Pressable style={[cal.btnClear, { borderColor: colors.border }]} onPress={clear}>
          <Text style={[cal.btnClearText, { color: colors.mutedForeground, fontFamily: 'Cairo_600SemiBold' }]}>{t('datePicker.clear')}</Text>
        </Pressable>
        <Pressable
          style={[cal.btnConfirm, { backgroundColor: tempStart ? '#052B5B' : colors.muted }]}
          onPress={confirm}
          disabled={!tempStart}
        >
          <Ionicons name="checkmark" size={18} color={tempStart ? '#FFFFFF' : colors.mutedForeground} />
          <Text style={[cal.btnConfirmText, { color: tempStart ? '#FFFFFF' : colors.mutedForeground, fontFamily: 'Cairo_700Bold' }]}>
            {t('datePicker.confirm')}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const cal = StyleSheet.create({
  nav: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 12, paddingHorizontal: 20, borderBottomWidth: StyleSheet.hairlineWidth },
  navBtn: { padding: 4 },
  navTitle: { fontSize: 17 },
  hint: { textAlign: 'center', fontSize: 12, paddingTop: 6, paddingBottom: 2 },
  dayRow: { flexDirection: 'row', paddingHorizontal: 8, paddingTop: 10, paddingBottom: 4 },
  dayHdr: { flex: 1, textAlign: 'center', fontSize: 12 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 8 },
  cell: { width: `${100/7}%`, aspectRatio: 1, alignItems: 'center', justifyContent: 'center' },
  dayCircle: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center', borderRadius: 10 },
  dayText: { fontSize: 14 },
  rangeDisplay: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 16, marginTop: 12, marginHorizontal: 20, padding: 12, borderWidth: 1, borderRadius: 12 },
  rangeItem: { alignItems: 'center', gap: 2 },
  rangeLabel: { fontSize: 11 },
  rangeDate: { fontSize: 14 },
  actions: { flexDirection: 'row', gap: 10, padding: 14, borderTopWidth: StyleSheet.hairlineWidth },
  btnClear: { flex: 1, borderRadius: 12, borderWidth: 1, paddingVertical: 14, alignItems: 'center' },
  btnClearText: { fontSize: 14 },
  btnConfirm: { flex: 2, borderRadius: 12, paddingVertical: 14, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 6 },
  btnConfirmText: { fontSize: 15 },
});

/* ═══════════════════════════════════════════════════════════════════════════
   Stepped picker (birth / passport): Year → Month → Day
   ═══════════════════════════════════════════════════════════════════════════ */
function SteppedPicker({
  value, onSelect, minDate, maxDate, mode, onClose,
}: {
  value: string; onSelect: (d: string) => void;
  minDate?: string; maxDate?: string;
  mode: 'birth' | 'passport'; onClose: () => void;
}) {
  const colors = useColors();
  const { t, lang } = useLanguage();
  const MONTHS = MONTH_KEYS.map((k) => t(k));
  const now = today();

  const parsed = parseISO(value);
  const [step,  setStep]  = useState<'year' | 'month' | 'day'>('year');
  const [selYear,  setSelYear]  = useState<number>(parsed?.y ?? 0);
  const [selMonth, setSelMonth] = useState<number>(parsed?.m ?? 0);
  const [selDay,   setSelDay]   = useState<number>(parsed?.d ?? 0);

  const minY = parseISO(minDate ?? '')?.y ?? (mode === 'birth' ? 1924 : 1960);
  const maxY = parseISO(maxDate ?? '')?.y ?? (mode === 'birth' ? now.getFullYear() - 1 : now.getFullYear() + 20);

  const years = useMemo(() => {
    const arr: number[] = [];
    for (let y = maxY; y >= minY; y--) arr.push(y);
    return arr;
  }, [minY, maxY]);

  const months = useMemo(() => Array.from({ length: 12 }, (_, i) => i + 1), []);

  const days = useMemo(() => {
    if (!selYear || !selMonth) return [];
    const dim = daysInMonth(selYear, selMonth);
    return Array.from({ length: dim }, (_, i) => i + 1);
  }, [selYear, selMonth]);

  const pickYear = (y: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelYear(y);
    setSelMonth(0);
    setSelDay(0);
    setStep('month');
  };

  const pickMonth = (m: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelMonth(m);
    setSelDay(0);
    setStep('day');
  };

  const pickDay = (d: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelDay(d);
    const iso = toISO(selYear, selMonth, d);
    onSelect(iso);
    onClose();
  };

  const stepLabel = step === 'year'
    ? t('datePicker.pickYear')
    : step === 'month'
    ? `${selYear} — ${t('datePicker.pickMonth')}`
    : `${selYear} / ${pad(selMonth)} — ${t('datePicker.pickDay')}`;

  return (
    <View style={{ flex: 1 }}>
      {/* Breadcrumb */}
      <View style={[sp.breadcrumb, { borderBottomColor: colors.border }]}>
        <Text style={[sp.stepLabel, { color: colors.foreground, fontFamily: 'Cairo_600SemiBold' }]}>{stepLabel}</Text>
        {step !== 'year' && (
          <Pressable onPress={() => setStep(step === 'day' ? 'month' : 'year')} hitSlop={12}>
            <Ionicons name="arrow-forward" size={20} color='#D4AF37' />
          </Pressable>
        )}
      </View>

      {/* Year list */}
      {step === 'year' && (
        <ScrollView contentContainerStyle={sp.listContent} showsVerticalScrollIndicator={false}>
          {years.map((y) => (
            <Pressable
              key={y}
              style={[sp.item, { backgroundColor: y === selYear ? '#052B5B' : colors.card, borderColor: colors.border }]}
              onPress={() => pickYear(y)}
            >
              <Text style={[sp.itemText, { color: y === selYear ? '#FFFFFF' : colors.foreground, fontFamily: y === selYear ? 'Cairo_700Bold' : 'Cairo_400Regular' }]}>
                {y}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      )}

      {/* Month list */}
      {step === 'month' && (
        <ScrollView contentContainerStyle={sp.gridContent} showsVerticalScrollIndicator={false}>
          <View style={sp.grid3}>
            {months.map((m) => (
              <Pressable
                key={m}
                style={[sp.monthItem, { backgroundColor: m === selMonth ? '#052B5B' : colors.card, borderColor: colors.border }]}
                onPress={() => pickMonth(m)}
              >
                <Text style={[sp.monthText, { color: m === selMonth ? '#FFFFFF' : colors.foreground, fontFamily: m === selMonth ? 'Cairo_700Bold' : 'Cairo_400Regular' }]}>
                  {MONTHS[m - 1]}
                </Text>
                <Text style={[sp.monthEn, { color: m === selMonth ? 'rgba(255,255,255,0.7)' : colors.mutedForeground, fontFamily: 'Cairo_400Regular' }]}>
                  {MONTHS_EN[m - 1]}
                </Text>
              </Pressable>
            ))}
          </View>
        </ScrollView>
      )}

      {/* Day list */}
      {step === 'day' && (
        <ScrollView contentContainerStyle={sp.gridContent} showsVerticalScrollIndicator={false}>
          <View style={sp.grid7}>
            {days.map((d) => {
              const iso = toISO(selYear, selMonth, d);
              const disabled = (minDate && compareDate(iso, minDate) < 0) || (maxDate && compareDate(iso, maxDate) > 0);
              return (
                <Pressable
                  key={d}
                  style={[
                    sp.dayItem,
                    { backgroundColor: d === selDay ? '#052B5B' : colors.card, borderColor: colors.border, opacity: disabled ? 0.35 : 1 },
                  ]}
                  onPress={() => !disabled && pickDay(d)}
                  disabled={!!disabled}
                >
                  <Text style={[sp.dayText, { color: d === selDay ? '#FFFFFF' : colors.foreground, fontFamily: d === selDay ? 'Cairo_700Bold' : 'Cairo_400Regular' }]}>
                    {d}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </ScrollView>
      )}
    </View>
  );
}

const sp = StyleSheet.create({
  breadcrumb: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderBottomWidth: StyleSheet.hairlineWidth },
  stepLabel: { fontSize: 15 },
  listContent: { padding: 12, gap: 6 },
  item: { borderRadius: 10, borderWidth: 1, paddingVertical: 14, paddingHorizontal: 20, alignItems: 'center' },
  itemText: { fontSize: 16 },
  gridContent: { padding: 12 },
  grid3: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  monthItem: { width: '31%', borderRadius: 12, borderWidth: 1, paddingVertical: 16, alignItems: 'center', gap: 2 },
  monthText: { fontSize: 15 },
  monthEn: { fontSize: 11 },
  grid7: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  dayItem: { width: '12.5%', aspectRatio: 1, borderRadius: 10, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  dayText: { fontSize: 15 },
});

/* ═══════════════════════════════════════════════════════════════════════════
   Main export
   ═══════════════════════════════════════════════════════════════════════════ */
export default function DatePickerModal(props: DatePickerModalProps) {
  const { visible, onClose, mode, value, value2, onSelect, onSelect2, minDate, maxDate, label, lang = 'ar' } = props;
  const colors = useColors();
  const insets = useSafeAreaInsets();

  const isCalendar = mode === 'single' || mode === 'range';
  const isStepped  = mode === 'birth'  || mode === 'passport';

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose} transparent>
      <View style={[ms.overlay]}>
        <Pressable style={ms.backdrop} onPress={onClose} />
        <View style={[ms.sheet, { backgroundColor: colors.card, paddingBottom: insets.bottom + 8 }]}>
          {/* Header */}
          <View style={[ms.header, { borderBottomColor: colors.border }]}>
            <Pressable onPress={onClose} hitSlop={12}>
              <Ionicons name="close" size={22} color={colors.mutedForeground} />
            </Pressable>
            <Text style={[ms.title, { color: colors.foreground, fontFamily: 'Cairo_700Bold' }]}>{label}</Text>
            <View style={{ width: 22 }} />
          </View>

          {isCalendar && (
            <CalendarPicker
              value={value} value2={value2}
              onSelect={onSelect} onSelect2={onSelect2}
              mode={mode as 'single' | 'range'}
              minDate={minDate} maxDate={maxDate}
              lang={lang} onClose={onClose}
            />
          )}

          {isStepped && (
            <SteppedPicker
              value={value}
              onSelect={onSelect}
              minDate={minDate} maxDate={maxDate}
              mode={mode as 'birth' | 'passport'}
              onClose={onClose}
            />
          )}
        </View>
      </View>
    </Modal>
  );
}

/* ── convenience trigger button ─────────────────────────────────────────── */
export function DateField({
  value, placeholder, onPress, colors,
}: {
  value: string; placeholder: string;
  onPress: () => void;
  colors: ReturnType<typeof useColors>;
}) {
  return (
    <Pressable
      style={[df.field, { borderColor: colors.border }]}
      onPress={onPress}
    >
      <Ionicons name="calendar-outline" size={18} color={colors.mutedForeground} />
      <Text style={[df.text, { color: value ? colors.foreground : colors.mutedForeground, fontFamily: value ? 'Cairo_600SemiBold' : 'Cairo_400Regular' }]}>
        {value || placeholder}
      </Text>
    </Pressable>
  );
}

const ms = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end' },
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.4)' },
  sheet: { borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '90%', minHeight: 500, overflow: 'hidden' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderBottomWidth: StyleSheet.hairlineWidth },
  title: { fontSize: 17 },
});

const df = StyleSheet.create({
  field: { flexDirection: 'row', alignItems: 'center', gap: 10, borderBottomWidth: 1, paddingBottom: 10, paddingTop: 4 },
  text: { flex: 1, fontSize: 14, textAlign: 'right' },
});
