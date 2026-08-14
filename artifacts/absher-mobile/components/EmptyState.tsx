import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '@/hooks/useColors';

type Props = {
  icon?: keyof typeof Ionicons.glyphMap;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  loading?: boolean;
};

export function EmptyState({ icon, title, description, actionLabel, onAction, loading }: Props) {
  const colors = useColors();

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color={colors.secondary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {icon && <Ionicons name={icon} size={52} color={colors.mutedForeground} style={styles.icon} />}
      <Text style={[styles.title, { color: colors.foreground, fontFamily: 'Cairo_700Bold' }]}>{title}</Text>
      {description && (
        <Text style={[styles.desc, { color: colors.mutedForeground, fontFamily: 'Cairo_400Regular' }]}>{description}</Text>
      )}
      {actionLabel && onAction && (
        <Pressable style={[styles.btn, { backgroundColor: '#052B5B' }]} onPress={onAction}>
          <Text style={[styles.btnText, { fontFamily: 'Cairo_600SemiBold' }]}>{actionLabel}</Text>
        </Pressable>
      )}
    </View>
  );
}

export function SkeletonRow({ height = 80, width, style }: { height?: number, width?: number | string, style?: any }) {
  const colors = useColors();
  return (
    <View style={[styles.skeleton, { backgroundColor: colors.muted, height, width, borderRadius: 14 }, style]} />
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, gap: 12 },
  icon: { marginBottom: 4 },
  title: { fontSize: 18, textAlign: 'center' },
  desc: { fontSize: 14, textAlign: 'center', lineHeight: 22 },
  btn: { marginTop: 8, borderRadius: 10, paddingHorizontal: 24, paddingVertical: 12 },
  btnText: { color: '#FFFFFF', fontSize: 15 },
  skeleton: { marginBottom: 10 },
});
