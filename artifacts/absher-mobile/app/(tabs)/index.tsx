import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  BackHandler,
  Dimensions,
  FlatList,
  ImageSourcePropType,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import ConfirmDialog from '@/components/ConfirmDialog';
import { useColors } from '@/hooks/useColors';
import { useLanguage } from '@/context/LanguageContext';
import { getImageSource, getImageUrl } from '@/hooks/useImageUrl';
import {
  useListNotifications,
  useListOffers,
  useGetCurrentUser,
  useListVisas,
  useListVisaCountries,
  useListVisaApplications,
  useListMyBookings,
} from '@workspace/api-client-react';
import type { Offer } from '@workspace/api-client-react';

const NAVY = '#0A2342';
const NAVY_2 = '#163354';
const GOLD = '#C9A24B';

const { width: SCREEN_W } = Dimensions.get('window');
const H_PAD = 20;
const CAROUSEL_W = SCREEN_W - H_PAD * 2;
const AUTO_ADVANCE_MS = 5000;

/** Resolve an offer image (external URL or /objects path) to an RN Image source. */
function resolveOfferImage(imageUrl: string | null | undefined): ImageSourcePropType {
  if (imageUrl && imageUrl.startsWith('/objects/')) {
    const src = getImageSource(imageUrl);
    if (src) return src;
  }
  const url = getImageUrl(imageUrl);
  if (url) return { uri: url };
  return require('@/assets/images/hero.jpg');
}

/* ---------------------------------------------------------------------------
 * Promotional carousel — auto-rotating + swipeable, RTL-aware, backend-fed.
 * ------------------------------------------------------------------------- */
function OffersCarousel({ offers }: { offers: Offer[] }) {
  const { t, lang, isRTL } = useLanguage();
  const listRef = useRef<FlatList<Offer>>(null);
  const [index, setIndex] = useState(0);
  const indexRef = useRef(0);

  // In RTL, a horizontal FlatList visually starts from the right; the
  // underlying scroll offset math stays LTR, so we render items in logical
  // order and rely on `inverted` for RTL to match reading direction.
  const inverted = isRTL;

  const goTo = useCallback(
    (i: number, animated = true) => {
      if (offers.length === 0) return;
      const clamped = ((i % offers.length) + offers.length) % offers.length;
      indexRef.current = clamped;
      setIndex(clamped);
      listRef.current?.scrollToOffset({ offset: clamped * CAROUSEL_W, animated });
    },
    [offers.length],
  );

  // Auto-advance timer.
  useEffect(() => {
    if (offers.length <= 1) return;
    const id = setInterval(() => goTo(indexRef.current + 1), AUTO_ADVANCE_MS);
    return () => clearInterval(id);
  }, [offers.length, goTo]);

  const onMomentumEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const i = Math.round(e.nativeEvent.contentOffset.x / CAROUSEL_W);
    indexRef.current = i;
    setIndex(i);
  };

  const openOffer = (offer: Offer) => {
    if (offer.linkUrl) router.push(offer.linkUrl as never);
  };

  const renderItem = ({ item }: { item: Offer }) => {
    const title = lang === 'ar' ? item.titleAr : item.titleEn;
    const desc = lang === 'ar' ? item.descriptionAr : item.descriptionEn;
    return (
      <Pressable onPress={() => openOffer(item)} style={{ width: CAROUSEL_W }}>
        <LinearGradient
          colors={[NAVY, NAVY_2]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.slide}
        >
          {/* Offer photo — right side circular-masked feel per mockup */}
          <View style={styles.slideImageWrap} pointerEvents="none">
            <Image source={resolveOfferImage(item.imageUrl)} style={styles.slideImage} contentFit="cover" />
            <LinearGradient
              colors={['rgba(10,35,66,0.95)', 'rgba(10,35,66,0.35)', 'rgba(10,35,66,0)']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={StyleSheet.absoluteFill}
            />
          </View>

          <View style={[styles.slideCopy, { alignItems: 'flex-end' }]}>
            <Text style={[styles.slideKicker, { fontFamily: 'Cairo_600SemiBold' }]} numberOfLines={1}>
              {t('home.featuredOffers')}
            </Text>
            <Text style={[styles.slideTitle, { fontFamily: 'Cairo_700Bold' }]} numberOfLines={2}>
              {title}
            </Text>
            {!!desc && (
              <Text style={[styles.slideDesc, { fontFamily: 'Cairo_400Regular' }]} numberOfLines={2}>
                {desc}
              </Text>
            )}

            <Pressable
              onPress={() => openOffer(item)}
              style={({ pressed }) => [styles.exploreBtn, { opacity: pressed ? 0.8 : 1 }]}
            >
              <Ionicons name={isRTL ? 'chevron-back' : 'chevron-forward'} size={16} color={GOLD} />
              <Text style={[styles.exploreBtnText, { fontFamily: 'Cairo_700Bold' }]}>{t('home.exploreOffers')}</Text>
            </Pressable>
          </View>

          {/* Discount badge */}
          {!!item.discountLabel && (
            <View style={styles.discountBadge}>
              <Text style={[styles.discountText, { fontFamily: 'Cairo_700Bold' }]} numberOfLines={2}>
                {item.discountLabel}
              </Text>
            </View>
          )}
        </LinearGradient>
      </Pressable>
    );
  };

  return (
    <View accessibilityLabel={t('home.carousel.a11y')}>
      <FlatList
        ref={listRef}
        data={offers}
        keyExtractor={(o) => String(o.id)}
        renderItem={renderItem}
        horizontal
        pagingEnabled
        inverted={inverted}
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={onMomentumEnd}
        getItemLayout={(_, i) => ({ length: CAROUSEL_W, offset: CAROUSEL_W * i, index: i })}
        decelerationRate="fast"
        snapToInterval={CAROUSEL_W}
      />

      {offers.length > 1 && (
        <View style={styles.dots}>
          {offers.map((o, i) => (
            <View
              key={o.id}
              style={[
                styles.dot,
                i === index ? { backgroundColor: GOLD, width: 20 } : { backgroundColor: 'rgba(10,35,66,0.2)' },
              ]}
            />
          ))}
        </View>
      )}
    </View>
  );
}

/* ---------------------------------------------------------------------------
 * Services 2x2 grid.
 * ------------------------------------------------------------------------- */
type ServiceDef = {
  key: string;
  titleKey: string;
  descKey: string;
  icon: keyof typeof Ionicons.glyphMap;
  image: ImageSourcePropType;
  route: string;
  distinctive?: boolean;
};

const FLIGHTS_IMG = { uri: 'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?auto=format&fit=crop&w=800&q=80' };
const HOTELS_IMG = { uri: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80' };
const VISAS_IMG = { uri: 'https://images.unsplash.com/photo-1569098644584-210bcd375b59?auto=format&fit=crop&w=800&q=80' };

function ServiceCard({ service }: { service: ServiceDef }) {
  const { t, isRTL } = useLanguage();
  const { width: winW } = useWindowDimensions();
  // 2-column grid: subtract horizontal padding (×2) and gap between columns
  const cardW = (winW - H_PAD * 2 - 12) / 2;

  return (
    <Pressable
      onPress={() => router.push(service.route as never)}
      style={({ pressed }) => [
        styles.service,
        { width: cardW, opacity: pressed ? 0.88 : 1, transform: [{ scale: pressed ? 0.97 : 1 }] },
      ]}
    >
      {/* Background image */}
      <View style={StyleSheet.absoluteFillObject}>
        <Image source={service.image} style={StyleSheet.absoluteFill as never} contentFit="cover" />
        {/* Two-stop gradient: top transparent → bottom dark navy */}
        <LinearGradient
          colors={['rgba(8,28,58,0.08)', 'rgba(8,28,58,0.55)', 'rgba(8,28,58,0.96)']}
          locations={[0, 0.45, 1]}
          style={StyleSheet.absoluteFill}
        />
      </View>

      {/* Icon badge — top corner (right for RTL, left for LTR) */}
      <View style={[
        styles.serviceIconRing,
        service.distinctive && { borderColor: GOLD, backgroundColor: 'rgba(10,35,66,0.55)' },
        isRTL ? { right: 12, left: null as any } : { left: 12, right: null as any },
      ]}>
        <Ionicons name={service.icon} size={20} color={GOLD} />
      </View>

      {/* Text block — always at bottom, aligned to reading direction */}
      <View style={[styles.serviceCopy, { alignItems: isRTL ? 'flex-end' : 'flex-start' }]}>
        <Text
          style={[styles.serviceTitle, { fontFamily: 'Cairo_700Bold', textAlign: isRTL ? 'right' : 'left' }]}
          numberOfLines={2}
        >
          {t(service.titleKey)}
        </Text>
        <Text
          style={[styles.serviceDesc, { fontFamily: 'Cairo_400Regular', textAlign: isRTL ? 'right' : 'left' }]}
          numberOfLines={2}
        >
          {t(service.descKey)}
        </Text>

        {/* Inline arrow row */}
        <View style={[styles.serviceArrowRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
          <View style={styles.serviceArrowPill}>
            <Ionicons
              name={isRTL ? 'arrow-back-outline' : 'arrow-forward-outline'}
              size={13}
              color={NAVY}
            />
          </View>
        </View>
      </View>
    </Pressable>
  );
}

/* ---------------------------------------------------------------------------
 * Home screen.
 * ------------------------------------------------------------------------- */
export default function HomeScreen() {
  const colors = useColors();
  const { t, lang, isRTL, toggle } = useLanguage();
  const insets = useSafeAreaInsets();

  useGetCurrentUser();
  const { data: notifications, refetch: refetchNotifs } = useListNotifications();
  const { data: offers, refetch: refetchOffers } = useListOffers();
  const { refetch: refetchVisas } = useListVisas();
  const { refetch: refetchCountries } = useListVisaCountries({ activeOnly: true });
  const { refetch: refetchApps } = useListVisaApplications();
  const { refetch: refetchBookings } = useListMyBookings();

  const unreadCount = (notifications || []).filter((n) => !n.isRead).length;
  const [refreshing, setRefreshing] = useState(false);
  const [exitVisible, setExitVisible] = useState(false);

  // Active offers only — sorted by sortOrder. The API already returns active
  // offers; we defensively filter and never show demo data when empty.
  const activeOffers = useMemo(() => {
    const list = (offers || []).filter((o) => o.isActive);
    return [...list].sort((a, b) => a.sortOrder - b.sortOrder);
  }, [offers]);

  const services: ServiceDef[] = useMemo(
    () => [
      {
        key: 'flights',
        titleKey: 'home.services.flights.title',
        descKey: 'home.services.flights.desc',
        icon: 'airplane-outline',
        image: FLIGHTS_IMG,
        route: '/coming-soon?service=flights',
      },
      {
        key: 'hotels',
        titleKey: 'home.services.hotels.title',
        descKey: 'home.services.hotels.desc',
        icon: 'bed-outline',
        image: HOTELS_IMG,
        route: '/coming-soon?service=hotels',
      },
      {
        key: 'evisas',
        titleKey: 'home.services.evisas.title',
        descKey: 'home.services.evisas.desc',
        icon: 'document-text-outline',
        image: VISAS_IMG,
        route: '/(tabs)/visas',
      },
      {
        key: 'umrah',
        titleKey: 'home.services.umrah.title',
        descKey: 'home.services.umrah.desc',
        icon: 'moon-outline',
        image: require('@/assets/images/umrah-hero.jpg'),
        route: '/(tabs)/umrah',
        distinctive: true,
      },
    ],
    [],
  );

  useFocusEffect(
    useCallback(() => {
      if (Platform.OS === 'web') return;
      const sub = BackHandler.addEventListener('hardwareBackPress', () => {
        setExitVisible(true);
        return true;
      });
      return () => sub.remove();
    }, []),
  );

  const refresh = async () => {
    setRefreshing(true);
    await Promise.all([
      refetchNotifs(),
      refetchOffers(),
      refetchVisas(),
      refetchCountries(),
      refetchApps(),
      refetchBookings(),
    ]);
    setRefreshing(false);
  };

  return (
    <>
      <ScrollView
        style={{ backgroundColor: colors.background }}
        contentContainerStyle={{ paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={colors.accent} />}
      >
        {/* Header */}
        <View style={[styles.header, { paddingTop: Math.max(insets.top + 16, 40), backgroundColor: colors.background }]}>
          <View style={[styles.topBar, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
            <Pressable style={[styles.iconBtn, { backgroundColor: colors.card }]} onPress={() => router.push('/(tabs)/notifications')}>
              <Ionicons name="notifications-outline" size={23} color={colors.primary} />
              {unreadCount > 0 && <View style={styles.badge} />}
            </Pressable>
            <Image
              source={require('@/assets/images/absher-travel-logo-nobg.png')}
              style={styles.logo}
              contentFit="contain"
              tintColor={colors.primary}
            />
            <Pressable style={[styles.langPill, { backgroundColor: colors.card }]} onPress={toggle}>
              <Text style={[styles.lang, { color: colors.primary }]}>{lang === 'ar' ? 'AR' : 'EN'}</Text>
              <Ionicons name="globe-outline" size={16} color={colors.primary} />
            </Pressable>
          </View>
        </View>

        {/* Promotional carousel — hidden entirely when no active offers */}
        {activeOffers.length > 0 && (
          <View style={styles.carouselPad}>
            <OffersCarousel offers={activeOffers} />
          </View>
        )}

        {/* Our services */}
        <View style={[styles.sectionHeader, { alignItems: isRTL ? 'flex-end' : 'flex-start' }]}>
          <Text style={[styles.sectionTitle, { color: colors.primary, fontFamily: 'Cairo_700Bold' }]}>
            {t('home.ourServices')}
          </Text>
          <View style={[styles.titleLine, { backgroundColor: colors.accent }]} />
        </View>

        <View style={styles.grid}>
          {services.map((s) => (
            <ServiceCard key={s.key} service={s} />
          ))}
        </View>
      </ScrollView>

      <ConfirmDialog
        visible={exitVisible}
        icon="exit-outline"
        title={t('home.exit.title')}
        message={t('home.exit.message')}
        cancelLabel={t('common.cancel')}
        confirmLabel={t('common.confirm')}
        onCancel={() => setExitVisible(false)}
        onConfirm={() => {
          setExitVisible(false);
          BackHandler.exitApp();
        }}
      />
    </>
  );
}

const styles = StyleSheet.create({
  header: { paddingHorizontal: H_PAD, paddingBottom: 18 },
  topBar: { justifyContent: 'space-between', alignItems: 'center' },
  iconBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
  },
  badge: { position: 'absolute', top: 10, right: 10, width: 8, height: 8, borderRadius: 4, backgroundColor: GOLD },
  logo: { width: 140, height: 66 },
  langPill: {
    flexDirection: 'row',
    gap: 5,
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
  },
  lang: { fontFamily: 'Cairo_700Bold', fontSize: 12 },

  /* Carousel */
  carouselPad: { paddingHorizontal: H_PAD },
  slide: {
    width: CAROUSEL_W,
    height: 200,
    borderRadius: 24,
    overflow: 'hidden',
    position: 'relative',
    justifyContent: 'center',
  },
  slideImageWrap: { position: 'absolute', top: 0, bottom: 0, right: 0, width: '60%' },
  slideImage: { width: '100%', height: '100%' },
  slideCopy: { paddingVertical: 22, paddingHorizontal: 22, width: '72%', zIndex: 2 },
  slideKicker: { color: GOLD, fontSize: 13, marginBottom: 4, textAlign: 'right' },
  slideTitle: { color: '#FFFFFF', fontSize: 22, textAlign: 'right', lineHeight: 30 },
  slideDesc: { color: 'rgba(255,255,255,0.82)', fontSize: 12.5, marginTop: 6, textAlign: 'right', lineHeight: 20 },
  exploreBtn: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1.5,
    borderColor: GOLD,
    backgroundColor: 'rgba(201,162,75,0.12)',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginTop: 16,
  },
  exploreBtnText: { color: GOLD, fontSize: 13 },
  discountBadge: {
    position: 'absolute',
    bottom: 18,
    right: 18,
    backgroundColor: 'rgba(201,162,75,0.16)',
    borderColor: GOLD,
    borderWidth: 1.5,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
    maxWidth: 120,
    alignItems: 'center',
    zIndex: 3,
  },
  discountText: { color: '#FFFFFF', fontSize: 13, textAlign: 'center', lineHeight: 20 },
  dots: { flexDirection: 'row', justifyContent: 'center', gap: 6, marginTop: 12 },
  dot: { width: 7, height: 7, borderRadius: 4 },

  /* Services */
  sectionHeader: { marginTop: 26, marginHorizontal: H_PAD, gap: 7 },
  sectionTitle: { fontSize: 20 },
  titleLine: { width: 36, height: 3, borderRadius: 2 },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    paddingHorizontal: H_PAD,
    marginTop: 16,
    marginBottom: 8,
  },
  service: {
    height: 172,
    borderRadius: 20,
    overflow: 'hidden',
    padding: 14,
    justifyContent: 'flex-end',
    backgroundColor: NAVY,
    shadowColor: '#000',
    shadowOpacity: 0.22,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
  },
  serviceIconRing: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 1.5,
    borderColor: 'rgba(201,162,75,0.65)',
    backgroundColor: 'rgba(8,28,58,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  serviceCopy: { gap: 2 },
  serviceTitle: { color: '#FFFFFF', fontSize: 14, lineHeight: 20 },
  serviceDesc: { color: 'rgba(255,255,255,0.72)', fontSize: 11, lineHeight: 16 },
  serviceArrowRow: { marginTop: 8, alignItems: 'center' },
  serviceArrowPill: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: GOLD,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
