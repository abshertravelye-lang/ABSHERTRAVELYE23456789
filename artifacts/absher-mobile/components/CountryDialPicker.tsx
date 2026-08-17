import React, { useMemo, useState } from 'react';
import {
  FlatList,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { COUNTRIES, getCountryByCode, type CountryOption } from '@workspace/countries';
import { useColors } from '@/hooks/useColors';
import { useLanguage } from '@/context/LanguageContext';

const GOLD = '#D4AF37';

// Only countries that actually have a dial code, sorted by localized name.
const DIALABLE = COUNTRIES.filter((c) => c.dialCode);

type CountryDialPickerProps = {
  /** Currently selected ISO alpha-2 code (e.g. "SA"). */
  value: string;
  onChange: (code: string) => void;
};

/**
 * A pressable pill (flag + dial code + chevron) that opens a searchable,
 * RTL-friendly modal listing every country with a calling code.
 */
export function CountryDialPicker({ value, onChange }: CountryDialPickerProps) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { lang, writingDirection, t } = useLanguage();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');

  const selected = getCountryByCode(value) ?? getCountryByCode('SA')!;

  const localizedName = (c: CountryOption) => (lang === 'ar' ? c.nameAr : c.nameEn);

  const sorted = useMemo(
    () =>
      [...DIALABLE].sort((a, b) => localizedName(a).localeCompare(localizedName(b), lang)),
    [lang],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLocaleLowerCase();
    if (!q) return sorted;
    const digits = q.replace(/[^0-9]/g, '');
    return sorted.filter(
      (c) =>
        c.nameAr.toLocaleLowerCase().includes(q) ||
        c.nameEn.toLocaleLowerCase().includes(q) ||
        c.code.toLocaleLowerCase().includes(q) ||
        (digits ? c.dialCode.replace('+', '').includes(digits) : c.dialCode.includes(q)),
    );
  }, [query, sorted]);

  const topInset = Platform.OS === 'web' ? 67 : insets.top;
  const bottomInset = Platform.OS === 'web' ? 34 : Math.max(insets.bottom, 16);

  const select = (code: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onChange(code);
    setOpen(false);
    setQuery('');
  };

  return (
    <>
      <Pressable
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          setOpen(true);
        }}
        style={[styles.trigger, { borderColor: colors.border }]}
      >
        <Ionicons name="chevron-down" size={16} color={colors.mutedForeground} />
        <Text style={[styles.dial, { color: colors.foreground, fontFamily: 'Cairo_700Bold' }]}>
          {selected.dialCode}
        </Text>
        <Text style={styles.flag}>{selected.flag}</Text>
      </Pressable>

      <Modal visible={open} animationType="slide" onRequestClose={() => setOpen(false)}>
        <View style={[styles.modal, { backgroundColor: colors.background, paddingTop: topInset + 12 }]}>
          <View style={styles.modalHeader}>
            <Pressable onPress={() => setOpen(false)} hitSlop={10}>
              <Ionicons name="close" size={26} color={colors.foreground} />
            </Pressable>
            <Text style={[styles.modalTitle, { color: colors.foreground, fontFamily: 'Cairo_700Bold' }]}>
              {t('country.title')}
            </Text>
            <View style={{ width: 26 }} />
          </View>

          <View style={[styles.searchRow, { backgroundColor: colors.muted, borderColor: colors.border }]}>
            <Ionicons name="search" size={18} color={colors.mutedForeground} />
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder={t('country.searchPlaceholder')}
              placeholderTextColor={colors.mutedForeground}
              autoCapitalize="none"
              style={[styles.searchInput, { color: colors.foreground, fontFamily: 'Cairo_400Regular', writingDirection }]}
            />
          </View>

          <FlatList
            data={filtered}
            keyExtractor={(item) => item.code}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{ paddingBottom: bottomInset + 16 }}
            initialNumToRender={20}
            renderItem={({ item }) => {
              const active = item.code === selected.code;
              return (
                <Pressable
                  onPress={() => select(item.code)}
                  style={({ pressed }) => [
                    styles.row,
                    { borderBottomColor: colors.border, opacity: pressed ? 0.7 : 1 },
                    active && { backgroundColor: colors.muted },
                  ]}
                >
                  <Text style={[styles.rowDial, { color: colors.mutedForeground, fontFamily: 'Cairo_600SemiBold' }]}>
                    {item.dialCode}
                  </Text>
                  <View style={styles.rowNameWrap}>
                    <Text
                      numberOfLines={1}
                      style={[styles.rowName, { color: colors.foreground, fontFamily: 'Cairo_600SemiBold', writingDirection }]}
                    >
                      {localizedName(item)}
                    </Text>
                  </View>
                  <Text style={styles.rowFlag}>{item.flag}</Text>
                  {active && <Ionicons name="checkmark-circle" size={20} color={GOLD} style={{ marginLeft: 8 }} />}
                </Pressable>
              );
            }}
          />
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  trigger: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    borderRightWidth: 1,
    marginRight: 4,
  },
  dial: { fontSize: 15 },
  flag: { fontSize: 20 },
  modal: { flex: 1, paddingHorizontal: 16 },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  modalTitle: { fontSize: 18 },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: Platform.OS === 'ios' ? 12 : 6,
    minHeight: 48,
    marginBottom: 12,
  },
  searchInput: { flex: 1, fontSize: 15, textAlign: 'right' },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 4,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 4,
  },
  rowDial: { fontSize: 14, minWidth: 54 },
  rowNameWrap: { flex: 1, paddingHorizontal: 8 },
  rowName: { fontSize: 15, textAlign: 'right' },
  rowFlag: { fontSize: 22 },
});
