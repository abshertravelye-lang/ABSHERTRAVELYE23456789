import React from 'react';
import { StyleSheet, Text, View, ViewStyle, TextStyle } from 'react-native';
import { useColors } from '@/hooks/useColors';

export interface BadgeProps {
  label: string;
  variant?: 'primary' | 'success' | 'warning' | 'error' | 'outline' | 'gold';
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export function Badge({ label, variant = 'primary', style, textStyle }: BadgeProps) {
  const c = useColors();

  const getStyle = () => {
    switch (variant) {
      case 'primary': return { bg: c.primary + '15', text: c.primary };
      case 'success': return { bg: c.success + '15', text: c.success };
      case 'warning': return { bg: c.warning + '15', text: c.warning };
      case 'error': return { bg: c.error + '15', text: c.error };
      case 'gold': return { bg: c.accent + '15', text: c.accent };
      case 'outline': return { bg: 'transparent', text: c.foreground, border: c.border };
      default: return { bg: c.primary + '15', text: c.primary };
    }
  };

  const vStyle = getStyle();

  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor: vStyle.bg,
          borderColor: vStyle.border || 'transparent',
          borderWidth: variant === 'outline' ? 1 : 0,
        },
        style,
      ]}
    >
      <Text style={[styles.text, { color: vStyle.text }, textStyle]}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    alignSelf: 'flex-start',
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    fontFamily: 'Cairo_600SemiBold',
    fontSize: 12,
  },
});
