/**
 * PhoneDialField — React Native component for phone number entry with country dial-code picker.
 * Shows a flag + dial code selector button, then a TextInput for the local number part.
 * Used in: profile-edit.tsx (phone + WhatsApp), matching the pattern in auth/login.tsx.
 *
 * All country/dial-code data comes from the canonical @workspace/countries
 * exports (DIAL_COUNTRIES / parseInternationalPhone / buildInternationalPhone)
 * — no local copies, so web and mobile can never diverge.
 */
import React, { useState, useMemo } from 'react';
import {
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  DIAL_COUNTRIES,
  getDialCode,
  parseInternationalPhone,
  buildInternationalPhone,
  type CountryOption,
} from '@workspace/countries';
import { useLanguage } from '@/context/LanguageContext';

const NAVY = '#052B5B';

/* Arab/common countries shown first, then the rest alphabetically (nameEn order from source) */
const PRIORITY_CODES = ['SA','AE','OM','KW','QA','BH','EG','JO','IQ','SY','LB','MA','DZ','TN','LY','SD','SO','MR','PS','DJ','KM','YE'];
const DIAL_CODE_OPTIONS: CountryOption[] = [
  ...PRIORITY_CODES.map(code => DIAL_COUNTRIES.find(c => c.code === code)).filter(
    (c): c is CountryOption => Boolean(c),
  ),
  ...DIAL_COUNTRIES.filter(c => !PRIORITY_CODES.includes(c.code)),
];

/** Parse "+966501234567" → { dialCode: "SA", local: "501234567" } (canonical logic). */
export function parseFullPhone(full: string): { dialCode: string; local: string } {
  const { countryCode, local } = parseInternationalPhone(full);
  return { dialCode: countryCode, local };
}

/** Build "+966501234567" from parts. Returns "" when local is empty (explicit clear). */
export function buildFullPhone(dialCode: string, local: string): string {
  return buildInternationalPhone(dialCode, local);
}

type PhoneDialFieldProps = {
  label: string;
  dialCode: string;
  local: string;
  onDialChange: (code: string) => void;
  onLocalChange: (v: string) => void;
  colors: {
    muted: string;
    border: string;
    foreground: string;
    mutedForeground: string;
  };
  /** forward ref for focus chaining */
  inputRef?: React.RefObject<TextInput>;
  onSubmitEditing?: () => void;
  returnKeyType?: 'next' | 'done';
};

export default function PhoneDialField({
  label, dialCode, local, onDialChange, onLocalChange, colors,
  inputRef, onSubmitEditing, returnKeyType = 'next',
}: PhoneDialFieldProps) {
  const { lang } = useLanguage();
  const ar = lang === 'ar';
  const insets = useSafeAreaInsets();
  const [modalOpen, setModalOpen] = useState(false);
  const [search, setSearch] = useState('');

  const selected = useMemo(
    () => DIAL_CODE_OPTIONS.find(c => c.code === dialCode) ?? DIAL_CODE_OPTIONS.find(c => c.code === 'SA')!,
    [dialCode],
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return DIAL_CODE_OPTIONS;
    return DIAL_CODE_OPTIONS.filter(c => {
      const name = (ar ? c.nameAr : c.nameEn).toLowerCase();
      return name.includes(q) || c.dialCode.includes(q) || c.code.toLowerCase().includes(q);
    });
  }, [search, ar]);

  return (
    <View style={s.field}>
      <Text style={[s.fieldLabel, { color: colors.mutedForeground, fontFamily: 'Cairo_600SemiBold' }]}>
        {label}
      </Text>
      <View style={[s.row, { backgroundColor: colors.muted, borderColor: colors.border }]}>
        {/* Dial code selector */}
        <TouchableOpacity
          onPress={() => { setSearch(''); setModalOpen(true); }}
          style={[s.dialBtn, { borderEndColor: colors.border }]}
          activeOpacity={0.7}
        >
          <Text style={s.flag}>{selected.flag}</Text>
          <Text style={[s.dialCode, { color: colors.foreground, fontFamily: 'Cairo_600SemiBold' }]}>
            {getDialCode(selected.code)}
          </Text>
          <Ionicons name="chevron-down" size={14} color={colors.mutedForeground} />
        </TouchableOpacity>

        {/* Local number input */}
        <TextInput
          ref={inputRef}
          style={[s.input, { color: colors.foreground, fontFamily: 'Cairo_400Regular' }]}
          value={local}
          onChangeText={onLocalChange}
          keyboardType="phone-pad"
          textAlign="left"
          placeholder="7xxxxxxxx"
          placeholderTextColor={colors.mutedForeground}
          autoCapitalize="none"
          returnKeyType={returnKeyType}
          blurOnSubmit={returnKeyType !== 'next'}
          onSubmitEditing={onSubmitEditing}
        />
      </View>

      {/* Country picker modal */}
      <Modal visible={modalOpen} animationType="slide" transparent onRequestClose={() => setModalOpen(false)}>
        <View style={s.overlay}>
          <View style={[s.sheet, { paddingBottom: insets.bottom + 12 }]}>
            {/* Header */}
            <View style={s.sheetHeader}>
              <Text style={[s.sheetTitle, { fontFamily: 'Cairo_700Bold' }]}>
                {ar ? 'اختر رمز الدولة' : 'Select country code'}
              </Text>
              <TouchableOpacity onPress={() => setModalOpen(false)} hitSlop={8}>
                <Ionicons name="close" size={24} color={NAVY} />
              </TouchableOpacity>
            </View>

            {/* Search bar */}
            <View style={s.searchWrap}>
              <Ionicons name="search-outline" size={16} color="#94a3b8" />
              <TextInput
                style={[s.searchInput, { fontFamily: 'Cairo_400Regular' }]}
                value={search}
                onChangeText={setSearch}
                placeholder={ar ? 'بحث...' : 'Search...'}
                placeholderTextColor="#94a3b8"
                autoCapitalize="none"
                clearButtonMode="while-editing"
              />
            </View>

            <FlatList
              data={filtered}
              keyExtractor={item => item.code}
              keyboardShouldPersistTaps="handled"
              renderItem={({ item }) => (
                <Pressable
                  onPress={() => { onDialChange(item.code); setModalOpen(false); }}
                  style={({ pressed }) => [
                    s.countryRow,
                    pressed && { backgroundColor: 'rgba(5,43,91,0.05)' },
                    item.code === dialCode && s.countryRowSelected,
                  ]}
                >
                  <Text style={s.countryFlag}>{item.flag}</Text>
                  <Text style={[s.countryDial, { fontFamily: 'Cairo_600SemiBold' }]}>
                    {item.dialCode}
                  </Text>
                  <Text style={[s.countryName, { fontFamily: item.code === dialCode ? 'Cairo_700Bold' : 'Cairo_400Regular' }]}>
                    {ar ? item.nameAr : item.nameEn}
                  </Text>
                  {item.code === dialCode && (
                    <Ionicons name="checkmark" size={16} color={NAVY} style={{ marginStart: 'auto' }} />
                  )}
                </Pressable>
              )}
              showsVerticalScrollIndicator={false}
              initialNumToRender={30}
              maxToRenderPerBatch={40}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
}

const s = StyleSheet.create({
  field: { marginBottom: 12 },
  fieldLabel: { fontSize: 12, marginBottom: 6, textAlign: 'right' },

  row: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
    minHeight: 48,
  },

  dialBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderEndWidth: 1,
  },
  flag: { fontSize: 20 },
  dialCode: { fontSize: 13 },

  input: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    textAlign: 'left',
  },

  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '80%',
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  sheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sheetTitle: { fontSize: 17, color: NAVY },

  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    borderRadius: 10,
    paddingHorizontal: 10,
    marginBottom: 10,
    gap: 6,
  },
  searchInput: { flex: 1, fontSize: 14, paddingVertical: 10, color: '#1e293b' },

  countryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    gap: 10,
    borderRadius: 10,
  },
  countryRowSelected: { backgroundColor: 'rgba(5,43,91,0.06)' },
  countryFlag: { fontSize: 22 },
  countryDial: { fontSize: 13, color: '#64748b', width: 52 },
  countryName: { fontSize: 14, color: NAVY, flex: 1 },
});
