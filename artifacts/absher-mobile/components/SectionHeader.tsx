import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useColors } from '@/hooks/useColors';
import { useLanguage } from '@/context/LanguageContext';

type Props = { style?: any; title: string; onSeeAll?: () => void; hideSeeAll?: boolean };

export function SectionHeader({ title, onSeeAll, hideSeeAll, style }: Props) {
  const colors = useColors();
  const { t, isRTL } = useLanguage();
  return (
    <View style={[styles.row, style, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
      <Text style={[styles.title, { color: colors.foreground, fontFamily: 'Cairo_700Bold' }]}>{title}</Text>
      {!hideSeeAll && onSeeAll && (
        <Pressable onPress={onSeeAll}>
          <Text style={[styles.seeAll, { color: colors.secondary, fontFamily: 'Cairo_600SemiBold' }]}>
            {t('common.viewAll')}
          </Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  title: { fontSize: 18 },
  seeAll: { fontSize: 13 },
});
