import React from 'react';
import { StyleSheet, Text, View, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '@/hooks/useColors';
import { Button } from './Button';

export interface SuccessStateProps {
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  style?: ViewStyle;
}

export function SuccessState({
  title,
  description,
  actionLabel,
  onAction,
  style,
}: SuccessStateProps) {
  const c = useColors();

  return (
    <View style={[styles.container, style]}>
      <View style={[styles.iconContainer, { backgroundColor: c.success + '15' }]}>
        <Ionicons name="checkmark-circle-outline" size={56} color={c.success} />
      </View>
      <Text style={[styles.title, { color: c.foreground }]}>{title}</Text>
      {description && (
        <Text style={[styles.description, { color: c.mutedForeground }]}>{description}</Text>
      )}
      {actionLabel && onAction && (
        <Button
          label={actionLabel}
          onPress={onAction}
          variant="primary"
          style={styles.actionButton}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    minHeight: 240,
  },
  iconContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  title: {
    fontFamily: 'Cairo_700Bold',
    fontSize: 20,
    marginBottom: 12,
    textAlign: 'center',
  },
  description: {
    fontFamily: 'Cairo_400Regular',
    fontSize: 15,
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 24,
  },
  actionButton: {
    minWidth: 200,
  },
});
