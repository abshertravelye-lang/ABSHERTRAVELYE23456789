import React from 'react';
import { ScrollView, Pressable, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '@/hooks/useColors';
import { useLanguage } from '@/context/LanguageContext';

export type VisaCategory = '' | 'tourist' | 'business' | 'umrah' | 'medical' | 'study' | 'family' | 'transit';

export const VISA_CATEGORIES: { value: VisaCategory; labelKey: any; icon: keyof typeof Ionicons.glyphMap }[] = [
  { value: '', labelKey: 'visas.category.all', icon: 'globe-outline' },
  { value: 'tourist', labelKey: 'visas.category.tourist', icon: 'sunny-outline' },
  { value: 'business', labelKey: 'visas.category.business', icon: 'briefcase-outline' },
  { value: 'umrah', labelKey: 'visas.category.umrah', icon: 'moon-outline' },
  { value: 'medical', labelKey: 'visas.category.medical', icon: 'medkit-outline' },
  { value: 'study', labelKey: 'visas.category.study', icon: 'school-outline' },
  { value: 'family', labelKey: 'visas.category.family', icon: 'people-outline' },
  { value: 'transit', labelKey: 'visas.category.transit', icon: 'airplane-outline' },
];

type Props = {
  selected: VisaCategory;
  onSelect: (val: VisaCategory) => void;
};

export function VisaCategories({ selected, onSelect }: Props) {
  const colors = useColors();
  const { t } = useLanguage();

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={[styles.container, { backgroundColor: colors.background, borderBottomColor: colors.border }]}
      contentContainerStyle={styles.content}
    >
      {VISA_CATEGORIES.map((item) => {
        const isActive = item.value === selected;
        return (
          <Pressable
            key={item.value}
            onPress={() => onSelect(item.value)}
            style={({ pressed }) => [
              styles.chip,
              {
                backgroundColor: isActive ? colors.navy : colors.card,
                borderColor: isActive ? colors.gold : colors.border,
                opacity: pressed ? 0.8 : 1,
                shadowColor: isActive ? colors.gold : 'transparent',
                elevation: isActive ? 2 : 0,
              }
            ]}
          >
            <Ionicons
              name={item.icon}
              size={18}
              color={isActive ? colors.gold : colors.textSecondary}
            />
            <Text
              style={[
                styles.label,
                {
                  color: isActive ? '#FFFFFF' : colors.textSecondary,
                  fontFamily: isActive ? 'Cairo_700Bold' : 'Cairo_600SemiBold',
                }
              ]}
              numberOfLines={1}
            >
              {t(item.labelKey)}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexGrow: 0,
  },
  content: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 10,
    flexDirection: 'row',
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    height: 48,
    borderRadius: 24,
    borderWidth: 1.5,
    gap: 8,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  label: {
    fontSize: 14,
    includeFontPadding: false,
    writingDirection: 'rtl',
  }
});
