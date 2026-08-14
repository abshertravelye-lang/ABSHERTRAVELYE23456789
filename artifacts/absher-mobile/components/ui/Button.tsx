import React from 'react';
import { Pressable, StyleSheet, Text, ViewStyle, TextStyle, ActivityIndicator } from 'react-native';
import { useColors } from '@/hooks/useColors';

export interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'gold' | 'secondary' | 'ghost' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  icon?: React.ReactNode;
}

export function Button({
  label,
  onPress,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  style,
  textStyle,
  icon,
}: ButtonProps) {
  const c = useColors();

  const getBgColor = (pressed: boolean) => {
    if (disabled) return c.muted;
    switch (variant) {
      case 'primary': return pressed ? c.primaryActive : c.primary;
      case 'gold': return pressed ? c.accentActive : c.accent;
      case 'secondary': return pressed ? c.mutedForeground : c.muted;
      case 'outline':
      case 'ghost': return pressed ? c.muted : 'transparent';
      default: return c.primary;
    }
  };

  const getTextColor = () => {
    if (disabled) return c.mutedForeground;
    switch (variant) {
      case 'primary': return c.primaryForeground || '#FFFFFF';
      case 'gold': return '#FFFFFF';
      case 'secondary': return c.foreground;
      case 'outline':
      case 'ghost': return c.primary;
      default: return c.primaryForeground || '#FFFFFF';
    }
  };

  const getBorderColor = () => {
    if (disabled) return c.muted;
    if (variant === 'outline') return c.border;
    return 'transparent';
  };

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.base,
        styles[size],
        {
          backgroundColor: getBgColor(pressed),
          borderColor: getBorderColor(),
          borderWidth: variant === 'outline' ? 1.5 : 0,
        },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={getTextColor()} />
      ) : (
        <>
          {icon}
          <Text style={[styles.text, styles[`text_${size}`], { color: getTextColor() }, textStyle]}>
            {label}
          </Text>
        </>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
    gap: 8,
  },
  sm: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    minHeight: 36,
  },
  md: {
    paddingVertical: 14,
    paddingHorizontal: 24,
    minHeight: 48, // Touch target
  },
  lg: {
    paddingVertical: 16,
    paddingHorizontal: 32,
    minHeight: 56,
  },
  text: {
    fontFamily: 'Cairo_700Bold',
  },
  text_sm: {
    fontSize: 14,
  },
  text_md: {
    fontSize: 16,
  },
  text_lg: {
    fontSize: 18,
  },
});
