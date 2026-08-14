import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '@/hooks/useColors';
import { useLanguage } from '@/context/LanguageContext';
import type { SafeUser } from '@workspace/api-client-react';

type PassportSummaryProps = {
  user: SafeUser;
  onEditPress: () => void;
};

export default function PassportSummary({ user, onEditPress }: PassportSummaryProps) {
  const colors = useColors();
  const { t } = useLanguage();
  const hasPassport = !!user.passportNumber || !!user.passportImageUrl;

  return (
    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border, shadowColor: colors.primary }]}>
      <View style={styles.header}>
        <Pressable onPress={onEditPress} hitSlop={12} style={({ pressed }) => [pressed && { opacity: 0.6 }]}>
          <Text style={[styles.editBtn, { color: colors.accent, fontFamily: 'Cairo_600SemiBold' }]}>{(t('common.edit') as string) || 'تعديل'}</Text>
        </Pressable>
        <View style={styles.titleRow}>
          <Text style={[styles.title, { color: colors.foreground, fontFamily: 'Cairo_700Bold' }]}>{(t('profile.passportTitle') as string) || 'بيانات جواز السفر'}</Text>
          <View style={[styles.iconWrap, { backgroundColor: colors.goldTint }]}>
            <Ionicons name="airplane" size={18} color={colors.accent} />
          </View>
        </View>
      </View>

      {hasPassport ? (
        <View style={styles.body}>
          <View style={[styles.row, { borderBottomColor: colors.border }]}>
            <Text style={[styles.value, { color: colors.foreground, fontFamily: 'Cairo_600SemiBold' }]}>
              {user.passportNumber || '—'}
            </Text>
            <Text style={[styles.label, { color: colors.mutedForeground, fontFamily: 'Cairo_400Regular' }]}>{(t('profile.passportNumber') as string) || 'رقم الجواز'}</Text>
          </View>
          <View style={[styles.row, { borderBottomColor: colors.border }]}>
            <Text style={[styles.value, { color: colors.foreground, fontFamily: 'Cairo_600SemiBold' }]}>
              {user.nationality || '—'}
            </Text>
            <Text style={[styles.label, { color: colors.mutedForeground, fontFamily: 'Cairo_400Regular' }]}>{(t('profile.nationality') as string) || 'الجنسية'}</Text>
          </View>
          <View style={[styles.row, { borderBottomWidth: 0 }]}>
            <Text style={[styles.value, { color: colors.foreground, fontFamily: 'Cairo_600SemiBold' }]}>
              {user.passportExpiryDate ? user.passportExpiryDate.split('T')[0] : '—'}
            </Text>
            <Text style={[styles.label, { color: colors.mutedForeground, fontFamily: 'Cairo_400Regular' }]}>{(t('profile.passportExpiry') as string) || 'تاريخ الانتهاء'}</Text>
          </View>
        </View>
      ) : (
        <Pressable style={styles.empty} onPress={onEditPress}>
          <View style={[styles.emptyIcon, { backgroundColor: colors.muted }]}>
            <Ionicons name="document-text-outline" size={24} color={colors.mutedForeground} />
          </View>
          <Text style={[styles.emptyText, { color: colors.mutedForeground, fontFamily: 'Cairo_400Regular' }]}>
            {(t('profile.passportEmpty') as string) || 'لم تقم بإضافة بيانات جواز السفر حتى الآن. أضفها لتسهيل التقديم على التأشيرات.'}
          </Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 20,
    marginTop: -20,
    borderRadius: 20,
    borderWidth: 1,
    padding: 16,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.05,
    shadowRadius: 16,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  title: {
    fontSize: 16,
  },
  editBtn: {
    fontSize: 14,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: {
    gap: 0,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  label: {
    fontSize: 14,
  },
  value: {
    fontSize: 15,
  },
  empty: {
    alignItems: 'center',
    paddingVertical: 12,
    gap: 12,
  },
  emptyIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 20,
  },
});
