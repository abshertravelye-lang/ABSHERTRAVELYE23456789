import React from 'react';
import { StyleSheet, View, ViewProps } from 'react-native';
import { useColors } from '@/hooks/useColors';

export interface CardProps extends ViewProps {
  elevated?: boolean;
}

export function Card({ style, elevated = true, ...props }: CardProps) {
  const c = useColors();

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: c.card,
          borderColor: c.border,
          borderWidth: elevated ? 0 : 1,
        },
        elevated && {
          boxShadow: `0px 6px 16px ${c.foreground}0A`, // Equivalent to opacity 0.04-0.05
          elevation: 4,
        },
        style,
      ]}
      {...props}
    />
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    padding: 16,
    overflow: 'hidden',
  },
});
