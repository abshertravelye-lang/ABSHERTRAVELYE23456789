/**
 * AnimatedPressable — a Pressable with a smooth scale press animation.
 *
 * Drop-in replacement for Pressable: same props, plus a light spring scale
 * so tappable surfaces feel responsive and premium. Built on the standard
 * Pressable (no gesture-handler) so press semantics — including scroll
 * cancellation — stay identical to React Native defaults.
 */
import React from 'react';
import { Pressable, PressableProps, StyleProp, ViewStyle } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';

const AnimatedPressableBase = Animated.createAnimatedComponent(Pressable);

interface AnimatedPressableProps extends Omit<PressableProps, 'style'> {
  style?: StyleProp<ViewStyle>;
  children: React.ReactNode;
  /** Scale when pressed. Default 0.97 */
  pressedScale?: number;
}

export function AnimatedPressable({
  children,
  style,
  pressedScale = 0.97,
  onPressIn,
  onPressOut,
  ...rest
}: AnimatedPressableProps) {
  const scale = useSharedValue(1);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <AnimatedPressableBase
      style={[style, animStyle]}
      onPressIn={(e) => {
        scale.value = withSpring(pressedScale, { damping: 20, stiffness: 300 });
        onPressIn?.(e);
      }}
      onPressOut={(e) => {
        scale.value = withSpring(1, { damping: 18, stiffness: 260 });
        onPressOut?.(e);
      }}
      {...rest}
    >
      {children}
    </AnimatedPressableBase>
  );
}
