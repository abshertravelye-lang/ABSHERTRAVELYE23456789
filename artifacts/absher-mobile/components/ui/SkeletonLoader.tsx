import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, ViewStyle, View, DimensionValue } from 'react-native';
import { useColors } from '@/hooks/useColors';

export interface SkeletonLoaderProps {
  width?: DimensionValue;
  height?: DimensionValue;
  borderRadius?: number;
  style?: ViewStyle;
}

export function SkeletonLoader({ width = '100%', height = 20, borderRadius = 8, style }: SkeletonLoaderProps) {
  const c = useColors();
  const opacityAnim = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(opacityAnim, {
          toValue: 0.7,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 0.3,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [opacityAnim]);

  return (
    <Animated.View
      style={[
        {
          width,
          height,
          borderRadius,
          backgroundColor: c.border, // using border color as skeleton base
          opacity: opacityAnim,
        },
        style,
      ]}
    />
  );
}

export function SkeletonCard() {
  return (
    <View style={styles.card}>
      <SkeletonLoader height={140} borderRadius={12} style={styles.mb} />
      <SkeletonLoader width="80%" height={20} style={styles.mb} />
      <SkeletonLoader width="50%" height={16} />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 16,
    borderRadius: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'transparent', // replaced in parent typically, handled by wrapper
  },
  mb: {
    marginBottom: 12,
  },
});
