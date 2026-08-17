import React, { useEffect, useRef } from 'react';
import {
  Animated,
  DimensionValue,
  StyleSheet,
  View,
  ViewStyle,
} from 'react-native';
import { useColors } from '@/hooks/useColors';

export interface SkeletonLoaderProps {
  width?: DimensionValue;
  height?: DimensionValue;
  borderRadius?: number;
  style?: ViewStyle;
}

export function SkeletonLoader({
  width = '100%',
  height = 20,
  borderRadius = 8,
  style,
}: SkeletonLoaderProps) {
  const c = useColors();
  // Shimmer animation: pulse between dim and bright
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(anim, {
          toValue: 1,
          duration: 900,
          useNativeDriver: true,
        }),
        Animated.timing(anim, {
          toValue: 0,
          duration: 900,
          useNativeDriver: true,
        }),
      ]),
    ).start();
  }, [anim]);

  const opacity = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.25, 0.55],
  });

  return (
    <Animated.View
      style={[
        {
          width,
          height,
          borderRadius,
          backgroundColor: c.border,
          opacity,
        },
        style,
      ]}
    />
  );
}

/** Full card skeleton — image + title + subtitle */
export function SkeletonCard({ style }: { style?: ViewStyle }) {
  const c = useColors();
  return (
    <View
      style={[
        styles.card,
        { backgroundColor: c.card, borderColor: c.border },
        style,
      ]}
    >
      <SkeletonLoader height={140} borderRadius={10} style={styles.mb} />
      <SkeletonLoader width="75%" height={18} style={styles.mb} />
      <SkeletonLoader width="45%" height={14} />
    </View>
  );
}

/** Horizontal row skeleton — icon + two text lines */
export function SkeletonRow({
  height = 80,
  width,
  style,
}: {
  height?: number;
  width?: number | string;
  style?: ViewStyle;
}) {
  const c = useColors();
  return (
    <View
      style={[
        styles.row,
        { backgroundColor: c.card, height, width: width as any },
        style,
      ]}
    >
      <SkeletonLoader width={52} height={52} borderRadius={14} />
      <View style={styles.rowLines}>
        <SkeletonLoader width="60%" height={16} style={styles.mb8} />
        <SkeletonLoader width="40%" height={13} />
      </View>
    </View>
  );
}

/** List of n card skeletons */
export function SkeletonList({ count = 3, style }: { count?: number; style?: ViewStyle }) {
  return (
    <View style={style}>
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} style={styles.listCard} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 14,
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
  },
  row: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 14,
    borderRadius: 16,
    padding: 14,
  },
  rowLines: {
    flex: 1,
    gap: 8,
  },
  mb: { marginBottom: 10 },
  mb8: { marginBottom: 0 },
  listCard: { marginBottom: 14 },
});
