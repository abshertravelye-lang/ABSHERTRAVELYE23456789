import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '@/hooks/useColors';
import { useLanguage } from '@/context/LanguageContext';

export default function DownloadedVisas() {
  const colors = useColors();
  const { t } = useLanguage();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.mutedForeground, fontFamily: 'Cairo_600SemiBold' }]}>{(t('profile.visasTitle') as string) || 'التأشيرات والتذاكر'}</Text>
      </View>

      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={styles.empty}>
          <View style={[styles.emptyIcon, { backgroundColor: colors.cyanTint }]}>
            <Ionicons name="ticket-outline" size={24} color={colors.secondary} />
          </View>
          <Text style={[styles.emptyText, { color: colors.mutedForeground, fontFamily: 'Cairo_400Regular' }]}>
            {(t('profile.visasEmpty') as string) || 'لا توجد تأشيرات أو تذاكر حالياً. ستظهر هنا فور إصدارها لرحلتك القادمة.'}
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 20,
    marginTop: 24,
  },
  header: {
    marginBottom: 8,
    alignItems: 'flex-end',
    paddingHorizontal: 4,
  },
  title: {
    fontSize: 14,
  },
  card: {
    borderRadius: 18,
    borderWidth: 1,
    overflow: 'hidden',
  },
  empty: {
    alignItems: 'center',
    paddingVertical: 24,
    gap: 12,
  },
  emptyIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 24,
  },
});
