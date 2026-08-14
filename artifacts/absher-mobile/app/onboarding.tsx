/**
 * ABSHER TRAVEL — Onboarding (3 slides, daytime airport design)
 * Matches the reference mockups: light sky background, floating logo,
 * white bottom card with slide-specific content.
 */
import React, { useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import { LanguageToggle } from '@/components/LanguageToggle';

const { width, height } = Dimensions.get('window');

const NAVY = '#0A2342';
const NAVY2 = '#163354';
const GOLD = '#D4A017';

// Daytime airport hero shared across all slides
const AIRPORT_BG = {
  uri: 'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?auto=format&fit=crop&w=1200&q=80',
};

type SlideData = {
  id: string;
  titleAr: string;
  titleEn: string;
  subtitleAr: string;
  subtitleEn: string;
  content: 'features' | 'services' | 'cta';
};

const SLIDES: SlideData[] = [
  {
    id: '1',
    titleAr: 'رحلتك تبدأ هنا',
    titleEn: 'Your Journey Starts Here',
    subtitleAr: 'خدمات سفر متكاملة بلمسة واحدة',
    subtitleEn: 'Complete travel services in one touch',
    content: 'features',
  },
  {
    id: '2',
    titleAr: 'شريكك الموثوق في السفر',
    titleEn: 'Your Trusted Travel Partner',
    subtitleAr: 'تأشيرات  •  حجوزات طيران  •  عمرة',
    subtitleEn: 'Visas  •  Flights  •  Umrah',
    content: 'services',
  },
  {
    id: '3',
    titleAr: 'ابدأ رحلتك اليوم',
    titleEn: 'Start Your Journey Today',
    subtitleAr: 'انضم إلى آلاف المسافرين الذين يثقون بأبشر',
    subtitleEn: 'Join thousands of travelers who trust Absher',
    content: 'cta',
  },
];

const FEATURES = [
  { icon: 'shield-checkmark-outline' as const, labelAr: 'أمانة وموثوقة', labelEn: 'Safe & Trusted', captionAr: 'حماية كاملة\nلبياناتك ومعاملاتك', captionEn: 'Full protection for\nyour data & transactions' },
  { icon: 'time-outline' as const, labelAr: 'سرعة في الإنجاز', labelEn: 'Fast Processing', captionAr: 'إنجاز طلباتك خلال\ndقائق', captionEn: 'Process your requests\nin minutes' },
  { icon: 'globe-outline' as const, labelAr: 'تغطية واسعة', labelEn: 'Wide Coverage', captionAr: 'خدماتنا متوفرة\nحول العالم', captionEn: 'Our services available\nworldwide' },
];

const SERVICES = [
  { icon: 'book-outline' as const, labelAr: 'تأشيرات إلكترونية', labelEn: 'E-Visas', captionAr: 'قدم طلبك واحصل على تأشيرتك بسهولة وأمان', captionEn: 'Apply and get your visa easily and securely', emoji: '🛂' },
  { icon: 'airplane-outline' as const, labelAr: 'حجوزات طيران', labelEn: 'Flight Bookings', captionAr: 'احجز رحلتك المفضلة بأفضل الأسعار إلى جميع الوجهات', captionEn: 'Book your preferred flight at the best prices', emoji: '✈️' },
  { icon: 'home-outline' as const, labelAr: 'العمرة والحج', labelEn: 'Umrah & Hajj', captionAr: 'خدمات متكاملة لرحلتك الإيمانية براحة واطمئنان', captionEn: 'Comprehensive services for your spiritual journey', emoji: '🕋' },
];

function FeaturesContent({ isRTL }: { isRTL: boolean }) {
  return (
    <View style={styles.featuresWrap}>
      <View style={styles.featureSectionHeader}>
        <Text style={[styles.featureSectionTitle, { fontFamily: 'Cairo_700Bold' }]}>
          تجربة سفر أسهل وأسرع
        </Text>
        <View style={styles.goldUnderline} />
      </View>
      <View style={[styles.featuresRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
        {FEATURES.map((f) => (
          <View key={f.labelAr} style={styles.featureItem}>
            <View style={styles.featureIconCircle}>
              <Ionicons name={f.icon} size={26} color={NAVY} />
            </View>
            <Text style={[styles.featureLabel, { fontFamily: 'Cairo_700Bold' }]}>
              {f.labelAr}
            </Text>
            <Text style={[styles.featureCaption, { fontFamily: 'Cairo_400Regular' }]}>
              {f.captionAr}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

function ServicesContent() {
  return (
    <View style={styles.servicesWrap}>
      {SERVICES.map((s) => (
        <View key={s.labelAr} style={styles.serviceCard}>
          <View style={styles.serviceEmoji}>
            <Text style={{ fontSize: 30 }}>{s.emoji}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.serviceTitle, { fontFamily: 'Cairo_700Bold' }]}>{s.labelAr}</Text>
            <Text style={[styles.serviceCaption, { fontFamily: 'Cairo_400Regular' }]}>{s.captionAr}</Text>
          </View>
        </View>
      ))}
    </View>
  );
}

function CTAContent({ onStart }: { onStart: () => void }) {
  return (
    <View style={styles.ctaWrap}>
      <Text style={[styles.ctaHeadline, { fontFamily: 'Cairo_700Bold' }]}>
        🌟 أكثر من ١٠٠٠ عميل راضٍ
      </Text>
      <Text style={[styles.ctaSubtext, { fontFamily: 'Cairo_400Regular' }]}>
        انضم إلى مجتمع المسافرين الذين يثقون بأبشر ترافل لتنظيم رحلاتهم
      </Text>
      <Pressable
        style={({ pressed }) => [styles.ctaStartBtn, { opacity: pressed ? 0.9 : 1 }]}
        onPress={onStart}
      >
        <LinearGradient colors={[NAVY, NAVY2]} style={styles.ctaStartGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
          <Text style={[styles.ctaStartText, { fontFamily: 'Cairo_700Bold' }]}>ابدأ الآن</Text>
          <Ionicons name="arrow-back" size={20} color="#fff" />
        </LinearGradient>
      </Pressable>
    </View>
  );
}

export default function OnboardingScreen() {
  const { user } = useAuth();
  const { isRTL } = useLanguage();
  const insets = useSafeAreaInsets();
  const topInset = Platform.OS === 'web' ? 52 : insets.top;
  const bottomInset = Platform.OS === 'web' ? 34 : Math.max(insets.bottom, 20);

  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollX = useRef(new Animated.Value(0)).current;
  const listRef = useRef<Animated.FlatList>(null);

  const viewableItemsChanged = useRef(({ viewableItems }: any) => {
    if (viewableItems[0]) setCurrentIndex(viewableItems[0].index ?? 0);
  }).current;
  const viewConfig = useRef({ viewAreaCoveragePercentThreshold: 50 }).current;

  const handleComplete = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await AsyncStorage.setItem('@absher_onboarded', 'true');
    router.replace(user ? '/(tabs)' : '/auth/login');
  };

  const scrollToNext = () => {
    if (currentIndex < SLIDES.length - 1) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      listRef.current?.scrollToIndex({ index: currentIndex + 1 });
    } else {
      handleComplete();
    }
  };

  const cardHeight = height * 0.52;

  return (
    <View style={styles.root}>
      {/* ── Background: shared airport image ── */}
      <Image source={AIRPORT_BG} style={StyleSheet.absoluteFill} contentFit="cover" />
      {/* Soft sky gradient to smooth the top */}
      <LinearGradient
        colors={['rgba(255,255,255,0.25)', 'rgba(255,255,255,0)']}
        style={[StyleSheet.absoluteFill, { height: height * 0.5 }]}
      />

      {/* ── Top bar ── */}
      <View style={[styles.topBar, { paddingTop: topInset + 6 }]} pointerEvents="box-none">
        <LanguageToggle variant="light" />
        <Pressable onPress={handleComplete} hitSlop={10}>
          <Text style={[styles.skipText, { fontFamily: 'Cairo_600SemiBold' }]}>تخطي</Text>
        </Pressable>
      </View>

      {/* ── Logo: fixed in the upper area ── */}
      <View style={[styles.logoArea, { paddingTop: topInset + 60 }]}>
        <View style={styles.logoCard}>
          <Image
            source={require('@/assets/images/icon.png')}
            style={styles.logoImg}
            contentFit="contain"
          />
        </View>
        <Text style={[styles.brandName, { fontFamily: 'Cairo_700Bold' }]}>ABSHER</Text>
        <View style={styles.brandTravelRow}>
          <View style={styles.brandLine} />
          <Text style={[styles.brandTravel, { fontFamily: 'Cairo_400Regular' }]}>TRAVEL</Text>
          <View style={styles.brandLine} />
        </View>
      </View>

      {/* ── Bottom sliding card ── */}
      <View style={[styles.cardContainer, { height: cardHeight }]}>
        <Animated.FlatList
          ref={listRef}
          data={SLIDES}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          bounces={false}
          keyExtractor={(item) => item.id}
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { x: scrollX } } }],
            { useNativeDriver: false },
          )}
          onViewableItemsChanged={viewableItemsChanged}
          viewabilityConfig={viewConfig}
          renderItem={({ item }) => (
            <View style={[styles.slide, { width, height: cardHeight }]}>
              {/* Card white background */}
              <View style={styles.card}>
                {/* Title row */}
                <View style={styles.titleRow}>
                  <Text style={[styles.slideTitle, { fontFamily: 'Cairo_700Bold' }]}>
                    {item.titleAr}
                  </Text>
                  {item.subtitleAr ? (
                    <Text style={[styles.slideSubtitle, { fontFamily: 'Cairo_400Regular' }]}>
                      • {item.subtitleAr}
                    </Text>
                  ) : null}
                </View>

                {/* Slide-specific content */}
                <View style={{ flex: 1 }}>
                  {item.content === 'features' && <FeaturesContent isRTL={isRTL} />}
                  {item.content === 'services' && <ServicesContent />}
                  {item.content === 'cta' && <CTAContent onStart={handleComplete} />}
                </View>
              </View>
            </View>
          )}
        />

        {/* ── Footer: dots + next button ── */}
        <View style={[styles.footer, { paddingBottom: bottomInset }]}>
          {/* Dots */}
          <View style={styles.dots}>
            {SLIDES.map((_, i) => {
              const inputRange = [(i - 1) * width, i * width, (i + 1) * width];
              const dotWidth = scrollX.interpolate({ inputRange, outputRange: [8, 24, 8], extrapolate: 'clamp' });
              const opacity = scrollX.interpolate({ inputRange, outputRange: [0.3, 1, 0.3], extrapolate: 'clamp' });
              return (
                <Animated.View
                  key={i}
                  style={[styles.dot, { width: dotWidth, opacity, backgroundColor: NAVY }]}
                />
              );
            })}
          </View>

          {/* Next button — wide navy + gold arrow */}
          {currentIndex < SLIDES.length - 1 ? (
            <Pressable
              style={({ pressed }) => [styles.nextBtn, { opacity: pressed ? 0.9 : 1 }]}
              onPress={scrollToNext}
            >
              <LinearGradient
                colors={[NAVY, NAVY2]}
                style={styles.nextGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <Text style={[styles.nextText, { fontFamily: 'Cairo_700Bold' }]}>التالي</Text>
                <View style={styles.nextArrow}>
                  <Ionicons name="arrow-back" size={18} color={NAVY} />
                </View>
              </LinearGradient>
            </Pressable>
          ) : null}
        </View>
      </View>
    </View>
  );
}

const CARD_RADIUS = 32;

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#E8F4FD' },

  topBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
  },
  skipText: { color: NAVY, fontSize: 15 },

  logoArea: {
    alignItems: 'center',
    paddingBottom: 16,
  },
  logoCard: {
    width: 110,
    height: 110,
    borderRadius: 28,
    backgroundColor: 'rgba(255,255,255,0.85)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18,
    shadowRadius: 18,
    elevation: 10,
    marginBottom: 8,
  },
  logoImg: { width: 100, height: 100, borderRadius: 24 },
  brandName: { color: NAVY, fontSize: 26, letterSpacing: 4, marginBottom: 2 },
  brandTravelRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  brandLine: { width: 28, height: 1.5, backgroundColor: NAVY, opacity: 0.6 },
  brandTravel: { color: NAVY, fontSize: 13, letterSpacing: 6, opacity: 0.85 },

  cardContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  slide: { alignItems: 'center' },
  card: {
    width: width,
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: CARD_RADIUS,
    borderTopRightRadius: CARD_RADIUS,
    paddingHorizontal: 22,
    paddingTop: 24,
    paddingBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 12,
  },

  titleRow: { alignItems: 'flex-end', marginBottom: 16 },
  slideTitle: { fontSize: 24, color: NAVY, textAlign: 'right' },
  slideSubtitle: { fontSize: 13, color: '#64748B', marginTop: 4, textAlign: 'right' },

  // Features (slide 1)
  featuresWrap: { flex: 1 },
  featureSectionHeader: { alignItems: 'center', marginBottom: 18 },
  featureSectionTitle: { fontSize: 17, color: '#1E293B', textAlign: 'center' },
  goldUnderline: { width: 40, height: 3, backgroundColor: GOLD, borderRadius: 2, marginTop: 6 },
  featuresRow: { gap: 8, justifyContent: 'space-between' },
  featureItem: { flex: 1, alignItems: 'center', gap: 8, paddingHorizontal: 4 },
  featureIconCircle: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: '#EFF6FF',
    borderWidth: 1.5,
    borderColor: '#BFDBFE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureLabel: { fontSize: 12, color: NAVY, textAlign: 'center' },
  featureCaption: { fontSize: 10, color: '#64748B', textAlign: 'center', lineHeight: 15 },

  // Services (slide 2)
  servicesWrap: { flex: 1, gap: 10 },
  serviceCard: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 14,
    backgroundColor: '#F8FAFF',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  serviceEmoji: {
    width: 52,
    height: 52,
    borderRadius: 14,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  serviceTitle: { fontSize: 15, color: NAVY, textAlign: 'right' },
  serviceCaption: { fontSize: 12, color: '#64748B', textAlign: 'right', marginTop: 2, lineHeight: 18 },

  // CTA (slide 3)
  ctaWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16 },
  ctaHeadline: { fontSize: 18, color: NAVY, textAlign: 'center' },
  ctaSubtext: { fontSize: 14, color: '#64748B', textAlign: 'center', lineHeight: 22, paddingHorizontal: 12 },
  ctaStartBtn: { width: '100%', borderRadius: 16, overflow: 'hidden', shadowColor: NAVY, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.3, shadowRadius: 12, elevation: 6 },
  ctaStartGradient: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 17, gap: 10 },
  ctaStartText: { color: '#fff', fontSize: 18 },

  // Footer
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 22,
    paddingTop: 10,
    backgroundColor: '#fff',
    gap: 14,
  },
  dots: { flexDirection: 'row', justifyContent: 'center', gap: 6 },
  dot: { height: 8, borderRadius: 4 },

  nextBtn: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: NAVY,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  nextGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 10,
  },
  nextText: { color: '#fff', fontSize: 18 },
  nextArrow: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: GOLD,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
