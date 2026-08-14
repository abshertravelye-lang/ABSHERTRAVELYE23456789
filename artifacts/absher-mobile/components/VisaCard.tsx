import colorsData from '@/constants/colors';
import React from 'react';
import { Image } from 'expo-image';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useLanguage } from '@/context/LanguageContext';
import { useColors } from '@/hooks/useColors';
import type { Visa } from '@workspace/api-client-react';

// ── helpers ──────────────────────────────────────────────────────────────────

function getCategoryLabel(t: any, type: string) {
  const map: Record<string, string> = {
    tourist: t('visas.category.tourist'), business: t('visas.category.business'), medical: t('visas.category.medical'),
    visit: t('visas.category.visit'), study: t('visas.category.study'), umrah: t('visas.category.umrah'),
  };
  return map[type] || type;
}

function getEntryLabel(t: any, type: string) {
  const map: Record<string, string> = {
    single: t('visas.entry.single'), multiple: t('visas.entry.multiple'), transit: t('visas.entry.transit'),
  };
  return map[type] || type;
}

const COUNTRY_IMAGES: Record<string, string> = {
  SA: 'https://images.unsplash.com/photo-1586724237569-f3d0c1dee8c6?w=600',
  AE: 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=600',
  TR: 'https://images.unsplash.com/photo-1524231757912-21f4fe3a7200?w=600',
  TH: 'https://images.unsplash.com/photo-1508009603885-50cf7c579365?w=600',
  MY: 'https://images.unsplash.com/photo-1508050919630-b135583b29ab?w=600',
  EG: 'https://images.unsplash.com/photo-1568322445389-f64ac2515020?w=600',
  OM: 'https://images.unsplash.com/photo-1586686507413-3bd73a16eb01?w=600',
  QA: 'https://images.unsplash.com/photo-1577475038887-f5b84e77d9c3?w=600',
  JO: 'https://images.unsplash.com/photo-1580834341580-8c17a3a630ca?w=600',
  ID: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=600',
  SG: 'https://images.unsplash.com/photo-1525625293386-3f8f99389edd?w=600',
  IN: 'https://images.unsplash.com/photo-1524492412937-b28074a5d7da?w=600',
  GB: 'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=600',
  FR: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=600',
  DE: 'https://images.unsplash.com/photo-1467269204594-9661b134dd2b?w=600',
  IT: 'https://images.unsplash.com/photo-1529260830199-42c24126f198?w=600',
  US: 'https://images.unsplash.com/photo-1485738422979-f5c462d49f74?w=600',
  CN: 'https://images.unsplash.com/photo-1508804185872-d7badad00f7d?w=600',
  JP: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=600',
  AU: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600',
};

function flagEmoji(code: string): string {
  const c = (code || '').toUpperCase();
  if (c.length !== 2) return '🌍';
  return String.fromCodePoint(...[...c].map(x => 0x1F1E6 + x.charCodeAt(0) - 65));
}

function countryImg(visa: Visa): string {
  if (visa.imageUrl) return visa.imageUrl;
  const code = (visa.countryCode || '').toUpperCase();
  return COUNTRY_IMAGES[code] || 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=600';
}

// ── Full Card (vertical) ─────────────────────────────────────────────────────

type Props = { visa: Visa; onPress?: () => void; style?: object };

export function VisaCard({ visa, onPress, style }: Props) {
  const { t } = useLanguage();
  const colors = useColors();
  const img = countryImg(visa);
  const flag = flagEmoji(visa.countryCode || '');

  return (
    <Pressable
      style={({ pressed }) => [styles.card, { backgroundColor: colors.card, opacity: pressed ? 0.93 : 1 }, style]}
      onPress={onPress}
    >
      {/* Image Header */}
      <View style={styles.imgWrap}>
        <Image
          source={{ uri: img }}
          style={styles.img}
          contentFit="cover"
          transition={300}
        />
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.65)']}
          style={StyleSheet.absoluteFillObject}
        />
        {/* Country badge */}
        <View style={styles.countryBadge}>
          <Text style={styles.flagText}>{flag}</Text>
          <View>
            <Text style={styles.countryName}>{visa.countryAr}</Text>
            <Text style={styles.visaType}>{getCategoryLabel(t, visa.category || '') || visa.visaType}</Text>
          </View>
        </View>
        {/* Price */}
        <View style={styles.priceBadge}>
          <Text style={styles.priceText}>{Number(visa.fee).toLocaleString()}</Text>
          <Text style={styles.priceCur}>{visa.currency}</Text>
        </View>
        {/* Entry type badge */}
        {visa.entryType === 'multiple' && (
          <View style={styles.multiEntryBadge}>
            <Text style={styles.multiEntryText}>{t('visas.entry.multiple')}</Text>
          </View>
        )}
      </View>

      {/* Stats Row */}
      <View style={[styles.statsRow, { borderBottomColor: colors.border }]}>
        <View style={styles.stat}>
          <Ionicons name="time-outline" size={14} color={colors.text} />
          <Text style={[styles.statVal, { color: colors.text, fontFamily: 'Cairo_700Bold' }]}>{visa.processingDays}</Text>
          <Text style={[styles.statLabel, { color: colors.mutedForeground, fontFamily: 'Cairo_400Regular' }]}>{t('visas.duration.day')}</Text>
        </View>
        <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
        <View style={styles.stat}>
          <Ionicons name="calendar-outline" size={14} color={colors.text} />
          <Text style={[styles.statVal, { color: colors.text, fontFamily: 'Cairo_700Bold' }]}>{visa.stayDuration || '—'}</Text>
          <Text style={[styles.statLabel, { color: colors.mutedForeground, fontFamily: 'Cairo_400Regular' }]}>{visa.stayDuration ? t('visas.duration.stayDays') : ''}</Text>
        </View>
        <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
        <View style={styles.stat}>
          <Ionicons name="airplane-outline" size={14} color={colors.text} />
          <Text style={[styles.statVal, { color: colors.text, fontFamily: 'Cairo_700Bold', fontSize: 10 }]}>
            {getEntryLabel(t, visa.entryType) || visa.entryType}
          </Text>
        </View>
      </View>

      {/* Apply Button */}
      <View style={styles.footer}>
        <View style={[styles.applyBtn, { backgroundColor: colorsData.static.gold }]}>
          <Text style={[styles.applyText, { fontFamily: 'Cairo_700Bold' }]}>{t('visas.applyNow')}</Text>
          <Ionicons name="arrow-back" size={14} color={colorsData.static.navy} />
        </View>
        <View style={[styles.detailBtn, { borderColor: colors.primary }]}>
          <Text style={[styles.detailText, { color: colors.primary, fontFamily: 'Cairo_600SemiBold' }]}>{t('common.details')}</Text>
        </View>
      </View>
    </Pressable>
  );
}

// ── Horizontal Compact Card ──────────────────────────────────────────────────

export function VisaCardHorizontal({ visa, onPress, width = 200 }: { visa: Visa; onPress?: () => void; width?: number }) {
  const { t } = useLanguage();
  const colors = useColors();
  const img = countryImg(visa);
  const flag = flagEmoji(visa.countryCode || '');

  return (
    <Pressable
      style={({ pressed }) => [styles.hCard, { width, opacity: pressed ? 0.92 : 1, backgroundColor: colors.card }]}
      onPress={onPress}
    >
      <View style={styles.hImgWrap}>
        <Image source={{ uri: img }} style={styles.hImg} contentFit="cover" transition={300} />
        <LinearGradient colors={['transparent', 'rgba(0,0,0,0.7)']} style={StyleSheet.absoluteFillObject} />
        <View style={styles.hPriceBadge}>
          <Text style={styles.hPriceText}>{Number(visa.fee).toLocaleString()} {visa.currency}</Text>
        </View>
        <View style={styles.hCountry}>
          <Text style={styles.hFlag}>{flag}</Text>
          <Text style={[styles.hCountryName, { fontFamily: 'Cairo_700Bold' }]} numberOfLines={1}>{visa.countryAr}</Text>
        </View>
      </View>
      <View style={styles.hBody}>
        <Text style={[styles.hType, { fontFamily: 'Cairo_400Regular' }]} numberOfLines={1}>
          {getCategoryLabel(t, visa.category || '') || visa.visaType}
        </Text>
        <View style={styles.hStats}>
          <Ionicons name="time-outline" size={12} color="#64748B" />
          <Text style={[styles.hStatText, { fontFamily: 'Cairo_400Regular' }]}>{visa.processingDays} {t('visas.duration.days')}</Text>
        </View>
      </View>
    </Pressable>
  );
}

// ── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  // Full card
  card: {
    borderRadius: 18,
    overflow: 'hidden',
    marginBottom: 14,
    shadowColor: colorsData.static.navy,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.10,
    shadowRadius: 10,
    elevation: 4,
  },
  imgWrap: { height: 160, position: 'relative' },
  img: { width: '100%', height: '100%' },
  countryBadge: {
    position: 'absolute', bottom: 10, left: 12,
    flexDirection: 'row', alignItems: 'center', gap: 8,
  },
  flagText: { fontSize: 24 },
  countryName: { color: '#FFFFFF', fontFamily: 'Cairo_700Bold', fontSize: 15 },
  visaType: { color: 'rgba(255,255,255,0.75)', fontSize: 11, fontFamily: 'Cairo_400Regular' },
  priceBadge: {
    position: 'absolute', top: 10, right: 10,
    backgroundColor: colorsData.static.gold, borderRadius: 10,
    paddingHorizontal: 10, paddingVertical: 4,
    flexDirection: 'row', alignItems: 'center', gap: 3,
  },
  priceText: { color: colorsData.static.navy, fontFamily: 'Cairo_700Bold', fontSize: 13 },
  priceCur: { color: colorsData.static.navy, fontFamily: 'Cairo_400Regular', fontSize: 10 },
  multiEntryBadge: {
    position: 'absolute', top: 10, left: 10,
    backgroundColor: 'rgba(10,35,66,0.75)', borderRadius: 8,
    paddingHorizontal: 8, paddingVertical: 3,
  },
  multiEntryText: { color: colorsData.static.gold, fontSize: 10, fontFamily: 'Cairo_600SemiBold' },
  statsRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around',
    paddingVertical: 12, paddingHorizontal: 8, borderBottomWidth: 1,
  },
  stat: { alignItems: 'center', gap: 2, flex: 1 },
  statVal: { fontSize: 13 },
  statLabel: { fontSize: 10 },
  statDivider: { width: 1, height: 28 },
  footer: {
    flexDirection: 'row', gap: 8, padding: 12, alignItems: 'center',
  },
  applyBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, borderRadius: 12, paddingVertical: 11,
  },
  applyText: { color: colorsData.static.navy, fontSize: 14 },
  detailBtn: {
    borderWidth: 1.5, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 11,
  },
  detailText: { fontSize: 13 },

  // Horizontal card
  hCard: {
    borderRadius: 16, overflow: 'hidden',
    marginEnd: 12,
    shadowColor: colorsData.static.navy, shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08, shadowRadius: 8, elevation: 3,
  },
  hImgWrap: { height: 120, position: 'relative' },
  hImg: { width: '100%', height: '100%' },
  hPriceBadge: {
    position: 'absolute', top: 8, right: 8,
    backgroundColor: colorsData.static.gold, borderRadius: 8,
    paddingHorizontal: 8, paddingVertical: 3,
  },
  hPriceText: { color: colorsData.static.navy, fontFamily: 'Cairo_700Bold', fontSize: 11 },
  hCountry: {
    position: 'absolute', bottom: 8, left: 8,
    flexDirection: 'row', alignItems: 'center', gap: 5,
  },
  hFlag: { fontSize: 18 },
  hCountryName: { color: '#FFFFFF', fontSize: 13 },
  hBody: { padding: 10 },
  hType: { fontSize: 12, color: '#64748B', textAlign: 'right' },
  hStats: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4, justifyContent: 'flex-end' },
  hStatText: { fontSize: 11, color: '#64748B' },
});
