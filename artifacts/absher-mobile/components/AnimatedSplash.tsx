import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import { Image } from 'expo-image';
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import colors from '@/constants/colors';

const NAVY = colors.navy;
const DEEP_NAVY = '#071525';
const GOLD = colors.gold;

type AnimatedSplashProps = {
  /** When true, the splash begins its fade-out and unmounts itself. */
  hide: boolean;
  /** Called once the fade-out animation has fully completed. */
  onFinish?: () => void;
};

/**
 * Full-screen animated splash overlay — deep navy canvas with the brand logo,
 * subtle gold accents, and a smooth fade/scale intro. Mounted from _layout.tsx
 * so it renders on web too (where the native splash inset is 0).
 */
export function AnimatedSplash({ hide, onFinish }: AnimatedSplashProps) {
  const containerOpacity = useSharedValue(1);
  const logoOpacity = useSharedValue(0);
  const logoScale = useSharedValue(0.86);
  const ringScale = useSharedValue(0.9);
  const ringOpacity = useSharedValue(0);

  // Intro animation
  useEffect(() => {
    logoOpacity.value = withTiming(1, { duration: 650, easing: Easing.out(Easing.cubic) });
    logoScale.value = withSequence(
      withTiming(1.04, { duration: 650, easing: Easing.out(Easing.cubic) }),
      withTiming(1, { duration: 350, easing: Easing.inOut(Easing.quad) }),
    );
    ringOpacity.value = withDelay(250, withTiming(1, { duration: 600 }));
    // Gentle pulsing glow ring
    ringScale.value = withDelay(
      250,
      withRepeat(
        withSequence(
          withTiming(1.12, { duration: 1100, easing: Easing.inOut(Easing.quad) }),
          withTiming(0.96, { duration: 1100, easing: Easing.inOut(Easing.quad) }),
        ),
        -1,
        true,
      ),
    );
  }, [logoOpacity, logoScale, ringOpacity, ringScale]);

  // Fade-out when requested
  useEffect(() => {
    if (!hide) return;
    logoScale.value = withTiming(1.08, { duration: 500, easing: Easing.in(Easing.cubic) });
    containerOpacity.value = withTiming(
      0,
      { duration: 500, easing: Easing.in(Easing.cubic) },
      (finished) => {
        if (finished && onFinish) runOnJS(onFinish)();
      },
    );
  }, [hide, containerOpacity, logoScale, onFinish]);

  const containerStyle = useAnimatedStyle(() => ({ opacity: containerOpacity.value }));
  const logoStyle = useAnimatedStyle(() => ({
    opacity: logoOpacity.value,
    transform: [{ scale: logoScale.value }],
  }));
  const ringStyle = useAnimatedStyle(() => ({
    opacity: ringOpacity.value * 0.5,
    transform: [{ scale: ringScale.value }],
  }));

  return (
    <Animated.View style={[StyleSheet.absoluteFill, styles.container, containerStyle]} pointerEvents={hide ? 'none' : 'auto'}>
      {/* Ambient gold accents */}
      <View style={[styles.accent, styles.accentTop]} />
      <View style={[styles.accent, styles.accentBottom]} />

      <View style={styles.center}>
        <Animated.View style={[styles.ring, ringStyle]} />
        <Animated.View style={logoStyle}>
          <Image
            source={require('@/assets/images/absher-logo-transparent.png')}
            style={styles.logo}
            contentFit="contain"
          />
        </Animated.View>
      </View>

      {/* Gold underline accent */}
      <View style={styles.bottomBar} />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: NAVY,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999,
  },
  center: { alignItems: 'center', justifyContent: 'center' },
  ring: {
    position: 'absolute',
    width: 260,
    height: 260,
    borderRadius: 130,
    borderWidth: 1.5,
    borderColor: GOLD,
  },
  logo: { width: 230, height: 92 },
  accent: {
    position: 'absolute',
    width: 320,
    height: 320,
    borderRadius: 160,
    backgroundColor: GOLD,
    opacity: 0.06,
  },
  accentTop: { top: -120, right: -100 },
  accentBottom: { bottom: -120, left: -100, backgroundColor: DEEP_NAVY, opacity: 0.5 },
  bottomBar: {
    position: 'absolute',
    bottom: 90,
    width: 56,
    height: 4,
    borderRadius: 2,
    backgroundColor: GOLD,
    opacity: 0.8,
  },
});
