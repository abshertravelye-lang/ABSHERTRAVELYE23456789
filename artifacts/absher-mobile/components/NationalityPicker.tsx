/**
 * NationalityPicker — منتقي الجنسية مع بحث فوري
 *
 * يظهر كزر ضغط يفتح modal به:
 *   - حقل بحث بالاسم أو الجنسية
 *   - قائمة مرتبة أبجدياً بالعربية
 *   - كل عنصر: علم + اسم الدولة + الجنسية
 */
import React, { useRef, useState } from 'react';
import {
  FlatList, Modal, Pressable, StyleSheet,
  Text, TextInput, View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useColors } from '@/hooks/useColors';
import brand from '@/constants/colors';
import { Nationality, searchNationalities } from '@/constants/nationalities';

interface Props {
  value: string;          // الجنسية المختارة (demonymAr)
  onChange: (n: Nationality) => void;
  placeholder?: string;
}

export default function NationalityPicker({ value, onChange, placeholder = 'اختر الجنسية' }: Props) {
  const colors = useColors();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const inputRef = useRef<TextInput>(null);

  const results = searchNationalities(query);

  const select = (n: Nationality) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onChange(n);
    setOpen(false);
    setQuery('');
  };

  const hasValue = !!value;

  return (
    <>
      {/* ── Trigger ───────────────────────────────────────────────────────── */}
      <Pressable
        style={({ pressed }) => [
          p.trigger,
          {
            backgroundColor: colors.muted,
            borderColor: colors.border,
            opacity: pressed ? 0.8 : 1,
          },
        ]}
        onPress={() => setOpen(true)}
      >
        {hasValue ? (
          <Text style={[p.triggerValue, { color: colors.foreground, fontFamily: 'Cairo_600SemiBold' }]}>
            {value}
          </Text>
        ) : (
          <Text style={[p.triggerPlaceholder, { color: colors.mutedForeground, fontFamily: 'Cairo_400Regular' }]}>
            {placeholder}
          </Text>
        )}
        <Ionicons name="chevron-down" size={16} color={colors.mutedForeground} />
      </Pressable>

      {/* ── Modal ─────────────────────────────────────────────────────────── */}
      <Modal visible={open} animationType="slide" presentationStyle="pageSheet">
        <View style={[p.sheet, { backgroundColor: colors.background }]}>

          {/* Header */}
          <View style={[p.header, { borderBottomColor: colors.border, backgroundColor: colors.card }]}>
            <Pressable onPress={() => { setOpen(false); setQuery(''); }} hitSlop={12}>
              <Ionicons name="close" size={24} color={colors.foreground} />
            </Pressable>
            <Text style={[p.headerTitle, { color: colors.foreground, fontFamily: 'Cairo_700Bold' }]}>
              اختر الجنسية
            </Text>
            <View style={{ width: 24 }} />
          </View>

          {/* Search */}
          <View style={[p.searchWrap, { backgroundColor: colors.muted, borderColor: colors.border }]}>
            <Ionicons name="search" size={18} color={colors.mutedForeground} />
            <TextInput
              ref={inputRef}
              value={query}
              onChangeText={setQuery}
              placeholder="ابحث باسم الدولة أو الجنسية..."
              placeholderTextColor={colors.mutedForeground}
              style={[p.searchInput, { color: colors.foreground, fontFamily: 'Cairo_400Regular' }]}
              textAlign="right"
              autoCorrect={false}
              autoCapitalize="none"
            />
            {query.length > 0 && (
              <Pressable onPress={() => setQuery('')} hitSlop={8}>
                <Ionicons name="close-circle" size={18} color={colors.mutedForeground} />
              </Pressable>
            )}
          </View>

          {/* Count */}
          <Text style={[p.count, { color: colors.mutedForeground, fontFamily: 'Cairo_400Regular' }]}>
            {results.length} جنسية
          </Text>

          {/* List */}
          <FlatList
            data={results}
            keyExtractor={n => n.code}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            ItemSeparatorComponent={() => (
              <View style={[p.sep, { backgroundColor: colors.border }]} />
            )}
            renderItem={({ item }) => (
              <Pressable
                style={({ pressed }) => [
                  p.item,
                  { backgroundColor: pressed ? colors.muted : colors.background },
                ]}
                onPress={() => select(item)}
              >
                {/* Right: flag + names */}
                <View style={p.itemRight}>
                  <Text style={p.itemFlag}>{item.flag}</Text>
                  <View style={p.itemTexts}>
                    <Text style={[p.itemCountry, { color: colors.foreground,      fontFamily: 'Cairo_600SemiBold' }]}>
                      {item.nameAr}
                    </Text>
                    <Text style={[p.itemDemonym, { color: colors.mutedForeground, fontFamily: 'Cairo_400Regular' }]}>
                      {item.demonymAr}
                    </Text>
                  </View>
                </View>
                {/* Left: code badge */}
                <View style={[p.codeBadge, { backgroundColor: brand.gold + '22' }]}>
                  <Text style={[p.codeText, { color: brand.gold, fontFamily: 'Cairo_700Bold' }]}>
                    {item.code}
                  </Text>
                </View>
              </Pressable>
            )}
            ListEmptyComponent={() => (
              <View style={p.empty}>
                <Text style={[p.emptyText, { color: colors.mutedForeground, fontFamily: 'Cairo_400Regular' }]}>
                  لا توجد نتائج لـ "{query}"
                </Text>
              </View>
            )}
          />
        </View>
      </Modal>
    </>
  );
}

const p = StyleSheet.create({
  trigger:          { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderRadius: 10, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 14 },
  triggerValue:     { fontSize: 14, flex: 1, textAlign: 'right' },
  triggerPlaceholder:{ fontSize: 14, flex: 1, textAlign: 'right' },
  sheet:            { flex: 1 },
  header:           { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderBottomWidth: 1 },
  headerTitle:      { fontSize: 16 },
  searchWrap:       { flexDirection: 'row', alignItems: 'center', margin: 12, borderRadius: 12, borderWidth: 1, paddingHorizontal: 12, gap: 8, minHeight: 48 },
  searchInput:      { flex: 1, paddingVertical: 12, fontSize: 14 },
  count:            { fontSize: 12, textAlign: 'right', paddingHorizontal: 16, marginBottom: 4 },
  sep:              { height: StyleSheet.hairlineWidth, marginHorizontal: 16 },
  item:             { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12 },
  itemRight:        { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  itemFlag:         { fontSize: 28 },
  itemTexts:        { gap: 2, flex: 1 },
  itemCountry:      { fontSize: 15 },
  itemDemonym:      { fontSize: 12 },
  codeBadge:        { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 4 },
  codeText:         { fontSize: 12 },
  empty:            { padding: 40, alignItems: 'center' },
  emptyText:        { fontSize: 14, textAlign: 'center' },
});
