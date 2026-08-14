import React, { useRef, useState } from 'react';
import { Animated, Dimensions, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '@/hooks/useColors';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import { LanguageToggle } from '@/components/LanguageToggle';
import type { TranslationKey } from '@/constants/i18n';

const { width, height } = Dimensions.get('window');

type Slide = {
  id: string;
  titleKey: TranslationKey;
  subtitleKey: TranslationKey;
  /** Slide 1 shows the logo instead of an icon. */
  icon: 'document-text' | 'airplane' | null;
  isLogo?: boolean;
};

const SLIDES: Slide[] = [
  { id: '1', titleKey: 'onboarding.slide1.title', subtitleKey: 'onboarding.slide1.subtitle', icon: null, isLogo: true },
  { id: '2', titleKey: 'onboarding.slide2.title', subtitleKey: 'onboarding.slide2.subtitle', icon: 'document-text' },
  { id: '3', titleKey: 'onboarding.slide3.title', subtitleKey: 'onboarding.slide3.subtitle', icon: 'airplane' },
];

export default function OnboardingScreen() {
  const colors = useColors();
  const { user } = useAuth();
  const { t, writingDirection } = useLanguage();
  const insets = useSafeAreaInsets();
  const topInset = Platform.OS === 'web' ? 67 : insets.top;
  const bottomInset = Platform.OS === 'web' ? 34 : Math.max(insets.bottom, 20);

  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollX = useRef(new Animated.Value(0)).current;
  const slidesRef = useRef<Animated.FlatList>(null);

  const viewableItemsChanged = useRef(({ viewableItems }: any) => {
    if (viewableItems[0]) {
      setCurrentIndex(viewableItems[0].index);
    }
  }).current;

  const viewConfig = useRef({ viewAreaCoveragePercentThreshold: 50 }).current;

  const handleComplete = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await AsyncStorage.setItem('@absher_onboarded', 'true');
    // Authenticated users go straight to the app; everyone else lands on the
    // premium welcome screen to sign in / register / explore.
    router.replace(user ? '/(tabs)' : '/auth/login');
  };

  const scrollToNext = () => {
    if (currentIndex < SLIDES.length - 1) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      slidesRef.current?.scrollToIndex({ index: currentIndex + 1 });
    } else {
      handleComplete();
    }
  };

  const scrollToPrev = () => {
    if (currentIndex > 0) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      slidesRef.current?.scrollToIndex({ index: currentIndex - 1 });
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Language toggle */}
      <View style={[styles.langToggle, { top: topInset + 6 }]} pointerEvents="box-none">
        <LanguageToggle variant="light" />
      </View>

      {/* Skip Button */}
      <Pressable
        style={[styles.skipButton, { top: topInset + 10 }]}
        onPress={handleComplete}
      >
        <Text style={[styles.skipText, { color: colors.mutedForeground, fontFamily: 'Cairo_600SemiBold' }]}>
          {t('onboarding.skip')}
        </Text>
      </Pressable>

      <Animated.FlatList
        ref={slidesRef}
        data={SLIDES}
        horizontal
        showsHorizontalScrollIndicator={false}
        pagingEnabled
        bounces={false}
        keyExtractor={(item) => item.id}
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { x: scrollX } } }], {
          useNativeDriver: false,
        })}
        onViewableItemsChanged={viewableItemsChanged}
        viewabilityConfig={viewConfig}
        renderItem={({ item, index }) => (
          <View style={[styles.slide, { width }]}>
            <LinearGradient
              colors={['#071525', '#052B5B', '#1E3A5F']}
              style={styles.illustrationArea}
            >
              {item.isLogo ? (
                <View style={styles.logoWrap}>
                  <Image
                    source={require('@/assets/images/icon.png')}
                    style={styles.logo}
                    contentFit="contain"
                  />
                </View>
              ) : (
                <View style={[styles.iconCircle, { backgroundColor: 'rgba(212, 175, 55, 0.15)', borderColor: '#D4AF37' }]}>
                  <Ionicons name={item.icon ?? 'airplane'} size={80} color="#D4AF37" />
                </View>
              )}
            </LinearGradient>
            <View style={styles.contentArea}>
              <Text style={[styles.title, { color: colors.foreground, fontFamily: 'Cairo_700Bold', writingDirection }]}>
                {t(item.titleKey)}
              </Text>
              <Text style={[styles.subtitle, { color: colors.mutedForeground, fontFamily: 'Cairo_400Regular', writingDirection }]}>
                {t(item.subtitleKey)}
              </Text>
            </View>
          </View>
        )}
      />

      <View style={[styles.footer, { paddingBottom: bottomInset }]}>
        {/* Indicators */}
        <View style={styles.indicators}>
          {SLIDES.map((_, i) => {
            const inputRange = [(i - 1) * width, i * width, (i + 1) * width];
            const dotWidth = scrollX.interpolate({
              inputRange,
              outputRange: [8, 28, 8],
              extrapolate: 'clamp',
            });
            const opacity = scrollX.interpolate({
              inputRange,
              outputRange: [0.3, 1, 0.3],
              extrapolate: 'clamp',
            });
            return (
              <Animated.View
                key={i}
                style={[
                  styles.dot,
                  { width: dotWidth, opacity, backgroundColor: '#D4AF37' },
                ]}
              />
            );
          })}
        </View>

        {/* Controls */}
        <View style={styles.controls}>
          <Pressable
            style={[styles.navBtn, { opacity: currentIndex === 0 ? 0 : 1, backgroundColor: colors.muted }]}
            onPress={scrollToPrev}
            disabled={currentIndex === 0}
          >
            <Ionicons name="arrow-back" size={24} color={colors.foreground} />
          </Pressable>

          <Pressable
            style={({ pressed }) => [
              styles.primaryBtn,
              { backgroundColor: '#D4AF37', opacity: pressed ? 0.9 : 1 },
              currentIndex === SLIDES.length - 1 && styles.primaryBtnExpanded
            ]}
            onPress={scrollToNext}
          >
            {currentIndex === SLIDES.length - 1 ? (
              <Text style={[styles.primaryBtnText, { fontFamily: 'Cairo_700Bold' }]}>{t('onboarding.start')}</Text>
            ) : (
              <Ionicons name="arrow-forward" size={24} color="#052B5B" />
            )}
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  langToggle: { position: 'absolute', left: 20, zIndex: 10 },
  skipButton: { position: 'absolute', right: 20, zIndex: 10, padding: 8 },
  skipText: { fontSize: 16 },
  slide: { flex: 1, alignItems: 'center' },
  illustrationArea: {
    width: '100%',
    height: height * 0.55,
    borderBottomLeftRadius: 40,
    borderBottomRightRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoWrap: {
    width: 220,
    height: 220,
    borderRadius: 40,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#071525',
    shadowColor: '#D4AF37',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 22,
    elevation: 8,
  },
  logo: { width: 212, height: 212 },
  logoTitle: { fontSize: 24, color: '#D4AF37', letterSpacing: 1 },
  logoSubtitle: { fontSize: 18, color: 'rgba(255,255,255,0.85)' },
  iconCircle: {
    width: 170,
    height: 170,
    borderRadius: 85,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
  },
  contentArea: { flex: 1, paddingHorizontal: 32, paddingTop: 44, alignItems: 'center' },
  title: { fontSize: 28, textAlign: 'center', marginBottom: 18 },
  subtitle: { fontSize: 16, textAlign: 'center', lineHeight: 26 },
  footer: { paddingHorizontal: 32, paddingBottom: 20 },
  indicators: { flexDirection: 'row', justifyContent: 'center', marginBottom: 36 },
  dot: { height: 8, borderRadius: 4, marginHorizontal: 4 },
  controls: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  navBtn: { width: 54, height: 54, borderRadius: 27, alignItems: 'center', justifyContent: 'center' },
  primaryBtn: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#D4AF37',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  primaryBtnExpanded: { width: '100%', borderRadius: 20 },
  primaryBtnText: { color: '#052B5B', fontSize: 18 },
});
