import React, { useRef } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  ViewStyle,
  TextStyle,
  ActivityIndicator,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
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
  /** Prevent accidental double-taps. Default: true */
  preventDoublePress?: boolean;
  testID?: string;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

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
  preventDoublePress = true,
  testID,
}: ButtonProps) {
  const c = useColors();
  const scale = useSharedValue(1);
  const lastPressRef = useRef(0);
  const [pressed, setPressed] = React.useState(false);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

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

  const handlePress = () => {
    if (disabled || loading) return;
    if (preventDoublePress) {
      const now = Date.now();
      if (now - lastPressRef.current < 700) return;
      lastPressRef.current = now;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress();
  };

  return (
    <AnimatedPressable
      onPress={handlePress}
      disabled={disabled || loading}
      onPressIn={() => {
        setPressed(true);
        scale.value = withSpring(0.97, { damping: 20, stiffness: 300 });
      }}
      onPressOut={() => {
        setPressed(false);
        scale.value = withSpring(1, { damping: 18, stiffness: 260 });
      }}
      style={[
        styles.base,
        styles[size],
        {
          backgroundColor: getBgColor(pressed),
          borderColor: getBorderColor(),
          borderWidth: variant === 'outline' ? 1.5 : 0,
          opacity: disabled ? 0.55 : 1,
        },
        animStyle,
        style,
      ]}
      testID={testID}
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
    </AnimatedPressable>
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
