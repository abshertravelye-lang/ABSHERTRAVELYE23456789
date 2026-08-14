import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useLanguage } from '@/context/LanguageContext';
import colors from '@/constants/colors';

const GOLD = colors.gold;

type LanguageToggleProps = {
  /** 'light' for dark backgrounds (navy hero), 'dark' for light backgrounds. */
  variant?: 'light' | 'dark';
  style?: object;
};

/**
 * Compact pill language switcher (globe + target language label).
 * Toggles between Arabic and English via LanguageContext.
 */
export function LanguageToggle({ variant = 'light', style }: LanguageToggleProps) {
  const { toggle, t } = useLanguage();

  const onLight = variant === 'light';
  const fg = onLight ? '#FFFFFF' : colors.light.foreground;
  const bg = onLight ? 'rgba(255,255,255,0.12)' : 'rgba(5,43,91,0.06)';
  const borderColor = onLight ? 'rgba(212,175,55,0.5)' : 'rgba(5,43,91,0.15)';

  return (
    <Pressable
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        toggle();
      }}
      style={({ pressed }) => [
        styles.pill,
        { backgroundColor: bg, borderColor, opacity: pressed ? 0.8 : 1 },
        style,
      ]}
      accessibilityRole="button"
    >
      <Ionicons name="globe-outline" size={16} color={GOLD} />
      <Text style={[styles.label, { color: fg, fontFamily: 'Cairo_700Bold' }]}>
        {t('lang.toggle')}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
  },
  label: { fontSize: 13 },
});
