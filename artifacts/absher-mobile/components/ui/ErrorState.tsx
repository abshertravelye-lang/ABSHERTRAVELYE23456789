import React from 'react';
import { StyleSheet, Text, View, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '@/hooks/useColors';
import { Button } from './Button';

export interface ErrorStateProps {
  title?: string;
  description?: string;
  onRetry?: () => void;
  retryLabel?: string;
  style?: ViewStyle;
}

export function ErrorState({
  title = 'Something went wrong',
  description = 'We encountered an error while trying to load this content. Please try again.',
  onRetry,
  retryLabel = 'Try Again',
  style,
}: ErrorStateProps) {
  const c = useColors();

  return (
    <View style={[styles.container, style]}>
      <View style={[styles.iconContainer, { backgroundColor: c.error + '15' }]}>
        <Ionicons name="alert-circle-outline" size={48} color={c.error} />
      </View>
      <Text style={[styles.title, { color: c.foreground }]}>{title}</Text>
      <Text style={[styles.description, { color: c.mutedForeground }]}>{description}</Text>
      {onRetry && (
        <Button
          label={retryLabel}
          onPress={onRetry}
          variant="outline"
          style={styles.retryButton}
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
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  title: {
    fontFamily: 'Cairo_700Bold',
    fontSize: 18,
    marginBottom: 8,
    textAlign: 'center',
  },
  description: {
    fontFamily: 'Cairo_400Regular',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  retryButton: {
    minWidth: 160,
  },
});
