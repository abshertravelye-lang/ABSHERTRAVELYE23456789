import React, { useEffect } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  Easing,
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import colors from '@/constants/colors';
import { useLanguage } from '@/context/LanguageContext';
import { LanguageToggle } from '@/components/LanguageToggle';

const NAVY = colors.navy;
const GOLD = colors.gold;
const CYAN = colors.cyan;

type Action = {
  key: string;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  variant: 'gold' | 'outline' | 'ghost';
  onPress: () => void;
};

export default function WelcomeScreen() {
  const insets = useSafeAreaInsets();
  const { t } = useLanguage();
  const topInset = Platform.OS === 'web' ? 67 : insets.top;
  const bottomInset = Platform.OS === 'web' ? 34 : Math.max(insets.bottom, 24);

  const logoOpacity = useSharedValue(0);
  const logoTranslate = useSharedValue(24);

  useEffect(() => {
    logoOpacity.value = withTiming(1, { duration: 700, easing: Easing.out(Easing.cubic) });
    logoTranslate.value = withTiming(0, { duration: 700, easing: Easing.out(Easing.cubic) });
  }, [logoOpacity, logoTranslate]);

  const logoStyle = useAnimatedStyle(() => ({
    opacity: logoOpacity.value,
    transform: [{ translateY: logoTranslate.value }],
  }));

  const go = (fn: () => void) => () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    fn();
  };

  const handleContact = () => {
    // "Contact Us" opens the real in-app support chat (guest flow for
    // pre-login users) — no external WhatsApp redirect.
    router.push('/support-chat');
  };

  const actions: Action[] = [
    {
      key: 'login',
      label: t('welcome.login'),
      icon: 'log-in-outline',
      variant: 'gold',
      onPress: () => router.push('/auth/login'),
    },
    {
      key: 'register',
      label: t('welcome.register'),
      icon: 'person-add-outline',
      variant: 'outline',
      onPress: () => router.push('/auth/register'),
    },
    {
      key: 'explore',
      label: t('welcome.explore'),
      icon: 'compass-outline',
      variant: 'ghost',
      onPress: () => router.replace('/(tabs)'),
    },
    {
      key: 'contact',
      label: t('welcome.contact'),
      icon: 'chatbubbles-outline',
      variant: 'ghost',
      onPress: handleContact,
    },
  ];

  return (
    <View style={styles.root}>
      <LinearGradient colors={['#071525', NAVY, '#0E3A6E']} style={StyleSheet.absoluteFill} />

      {/* Ambient accents */}
      <View style={[styles.accent, styles.accentTop]} />
      <View style={[styles.accent, styles.accentBottom]} />

      {/* Language toggle */}
      <View style={[styles.langToggle, { top: topInset + 8 }]}>
        <LanguageToggle variant="light" />
      </View>

      <View style={[styles.content, { paddingTop: topInset + 40, paddingBottom: bottomInset }]}>
        {/* Hero */}
        <Animated.View style={[styles.hero, logoStyle]}>
          <View style={styles.logoRing}>
            <Image
              source={require('@/assets/images/absher-logo-transparent.png')}
              style={styles.logo}
              contentFit="contain"
            />
          </View>
          <Text style={[styles.brand, { fontFamily: 'Cairo_700Bold' }]}>{t('welcome.brand')}</Text>
          <View style={styles.divider} />
          <Text style={[styles.tagline, { fontFamily: 'Cairo_600SemiBold' }]}>
            {t('welcome.tagline')}
          </Text>
        </Animated.View>

        {/* Actions */}
        <View style={styles.actions}>
          {actions.map((action, index) => (
            <Animated.View
              key={action.key}
              entering={FadeInDown.delay(300 + index * 90).duration(500)}
            >
              <Pressable
                onPress={go(action.onPress)}
                style={({ pressed }) => [
                  styles.btn,
                  action.variant === 'gold' && styles.btnGold,
                  action.variant === 'outline' && styles.btnOutline,
                  action.variant === 'ghost' && styles.btnGhost,
                  { opacity: pressed ? 0.85 : 1 },
                ]}
              >
                <Ionicons
                  name={action.icon}
                  size={20}
                  color={action.variant === 'gold' ? NAVY : action.variant === 'ghost' ? CYAN : GOLD}
                />
                <Text
                  style={[
                    styles.btnText,
                    { fontFamily: 'Cairo_700Bold' },
                    action.variant === 'gold' && { color: NAVY },
                    action.variant === 'outline' && { color: '#FFFFFF' },
                    action.variant === 'ghost' && { color: 'rgba(255,255,255,0.92)' },
                  ]}
                >
                  {action.label}
                </Text>
              </Pressable>
            </Animated.View>
          ))}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: NAVY },
  langToggle: { position: 'absolute', right: 20, zIndex: 10 },
  accent: { position: 'absolute', borderRadius: 200, backgroundColor: GOLD },
  accentTop: { width: 340, height: 340, top: -140, left: -120, opacity: 0.07 },
  accentBottom: { width: 300, height: 300, bottom: -120, right: -110, backgroundColor: CYAN, opacity: 0.06 },
  content: { flex: 1, paddingHorizontal: 28, justifyContent: 'space-between' },
  hero: { alignItems: 'center', flex: 1, justifyContent: 'center', gap: 14 },
  logoRing: {
    width: 168,
    height: 168,
    borderRadius: 84,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(212,175,55,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(212,175,55,0.35)',
    marginBottom: 8,
  },
  logo: { width: 128, height: 100 },
  brand: { fontSize: 26, color: GOLD, letterSpacing: 2 },
  divider: { width: 44, height: 3, borderRadius: 2, backgroundColor: GOLD, opacity: 0.8, marginVertical: 4 },
  tagline: { fontSize: 16, color: 'rgba(255,255,255,0.9)', textAlign: 'center' },
  actions: { gap: 14 },
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    borderRadius: 16,
    paddingVertical: 17,
  },
  btnGold: {
    backgroundColor: GOLD,
    shadowColor: GOLD,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 14,
    elevation: 6,
  },
  btnOutline: { borderWidth: 1.5, borderColor: 'rgba(212,175,55,0.6)', backgroundColor: 'rgba(255,255,255,0.04)' },
  btnGhost: { backgroundColor: 'rgba(255,255,255,0.06)' },
  btnText: { fontSize: 16 },
});
