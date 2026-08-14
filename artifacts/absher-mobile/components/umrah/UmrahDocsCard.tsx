import React from 'react';
import { StyleSheet, Text, View, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useColors } from '@/hooks/useColors';
import { Card } from '@/components/ui/Card';
import type { SafeUser } from '@workspace/api-client-react';

export function UmrahDocsCard({ user, t }: { user?: SafeUser; t: (k: string) => string }) {
  const c = useColors();

  // Determine if documents are complete
  // For umrah, we need a complete profile, which includes passport and personal photo.
  // Actually, we can just use `user.isProfileComplete` if the API exposes it, 
  // but since `isProfileComplete` might be on the extended SafeUser or we can check fields.
  // Let's check user completeness natively.
  const isComplete = user && (user as any).isProfileComplete;

  return (
    <Card style={styles.card}>
      <View style={styles.contentRow}>
        <View style={styles.textContainer}>
          <Text style={[styles.title, { color: c.foreground }]}>{t('umrahUi.docsStatus')}</Text>
          <Text style={[styles.subtitle, { color: c.mutedForeground }]}>{t('umrahUi.docsDesc')}</Text>
          
          <View style={[styles.statusBadge, { backgroundColor: isComplete ? c.success + '15' : c.warning + '15' }]}>
            <Ionicons name={isComplete ? "shield-checkmark" : "warning"} size={16} color={isComplete ? c.success : c.warning} />
            <Text style={[styles.statusText, { color: isComplete ? c.success : c.warning }]}>
              {isComplete ? t('umrahUi.docsComplete') : t('umrahUi.docsIncomplete')}
            </Text>
          </View>
        </View>
        
        <View style={styles.iconContainer}>
          <View style={[styles.iconCircle, { backgroundColor: c.muted }]}>
            <Ionicons name="folder-open" size={28} color={c.primary} />
            {!isComplete && (
              <View style={[styles.alertDot, { backgroundColor: c.warning, borderColor: c.card }]} />
            )}
          </View>
        </View>
      </View>

      {!isComplete && (
        <Pressable 
          onPress={() => router.push('/profile-edit')}
          style={({ pressed }) => [
            styles.updateBtn,
            { backgroundColor: c.muted, opacity: pressed ? 0.8 : 1 }
          ]}
        >
          <Text style={[styles.updateBtnText, { color: c.primary }]}>{t('common.edit')}</Text>
          <Ionicons name="chevron-back" size={16} color={c.primary} />
        </Pressable>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 20,
    marginBottom: 16,
  },
  contentRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  textContainer: {
    flex: 1,
    alignItems: 'flex-end',
    marginRight: 16,
  },
  title: {
    fontFamily: 'Cairo_700Bold',
    fontSize: 18,
    marginBottom: 4,
  },
  subtitle: {
    fontFamily: 'Cairo_400Regular',
    fontSize: 14,
    marginBottom: 12,
  },
  statusBadge: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },
  statusText: {
    fontFamily: 'Cairo_600SemiBold',
    fontSize: 12,
  },
  iconContainer: {
    position: 'relative',
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  alertDot: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
  },
  updateBtn: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 16,
    gap: 4,
  },
  updateBtnText: {
    fontFamily: 'Cairo_600SemiBold',
    fontSize: 14,
  },
});