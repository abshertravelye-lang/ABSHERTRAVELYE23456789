/**
 * Home dashboard building blocks — ABSHER TRAVEL Premium
 * Reusable pieces for the redesigned home screen: e-visa services banner,
 * quick-actions grid, and a compact country card.
 */
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { AppImage } from '@/components/AppImage';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '@/hooks/useColors';
import { getImageUrl } from '@/hooks/useImageUrl';
import { useLanguage } from '@/context/LanguageContext';
import type { VisaCountry } from '@workspace/api-client-react';

const GOLD = '#D4A017';
const NAVY = '#062B5B';
const SKY = '#38BDF8';

// ── E-visa services banner ────────────────────────────────────────────────────

export function EVisaBanner({ onPress }: { onPress: () => void }) {
  const { t, isRTL, lang } = useLanguage();
  return (
    <Pressable
      style={({ pressed }) => [styles.banner, { opacity: pressed ? 0.95 : 1 }]}
      onPress={onPress}
    >
      <LinearGradient
        colors={['#062B5B', '#0D4A8C']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.bannerGradient}
      >
        {/* decorative sky blue accents instead of arcs */}
        <View style={styles.bannerGlow} />
        
        <View style={[styles.bannerContent, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
          <View style={[styles.bannerText, { alignItems: isRTL ? 'flex-end' : 'flex-start' }]}>
            <View style={[styles.bannerTag, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
              <Ionicons name="sparkles" size={12} color={SKY} />
              <Text style={[styles.bannerTagText, { fontFamily: 'Cairo_600SemiBold' }]}>
                {t('homeTab.tag.digitalService' as any)}
              </Text>
            </View>
            <Text style={[styles.bannerTitle, { fontFamily: 'Cairo_700Bold', textAlign: isRTL ? 'right' : 'left' }]}>
              {t('homeTab.services.electronicVisa' as any)}
            </Text>
            <Text style={[styles.bannerSub, { fontFamily: 'Cairo_400Regular', textAlign: isRTL ? 'right' : 'left' }]}>
              {t('homeTab.tag.digitalServiceSub' as any)}
            </Text>
            <View style={[styles.bannerCta, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
              <Text style={[styles.bannerCtaText, { fontFamily: 'Cairo_700Bold' }]}>
                {t('homeTab.cta.startNow' as any)}
              </Text>
              <Ionicons name={isRTL ? "arrow-back" : "arrow-forward"} size={16} color={NAVY} />
            </View>
          </View>
          <View style={styles.bannerIconWrap}>
            <Ionicons name="document-text" size={40} color={GOLD} />
          </View>
        </View>
      </LinearGradient>
    </Pressable>
  );
}

// ── Quick actions grid ────────────────────────────────────────────────────────

export type QuickAction = {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  color: string;
  onPress: () => void;
};

export function QuickActionsGrid({ actions }: { actions: QuickAction[] }) {
  const colors = useColors();
  return (
    <View style={styles.grid}>
      {actions.map((a) => (
        <Pressable
          key={a.label}
          style={({ pressed }) => [
            styles.gridItem,
            { backgroundColor: colors.card, shadowColor: NAVY, opacity: pressed ? 0.9 : 1 },
          ]}
          onPress={a.onPress}
        >
          <View style={[styles.gridIcon, { backgroundColor: `${a.color}18` }]}>
            <Ionicons name={a.icon} size={24} color={a.color} />
          </View>
          <Text
            style={[styles.gridLabel, { color: colors.foreground, fontFamily: 'Cairo_600SemiBold' }]}
            numberOfLines={2}
          >
            {a.label}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

// ── Country card (compact, horizontal carousel) ───────────────────────────────

function flagEmoji(code?: string | null): string {
  const c = (code || '').toUpperCase();
  if (c.length !== 2) return '🌍';
  return String.fromCodePoint(...[...c].map((x) => 0x1f1e6 + x.charCodeAt(0) - 65));
}

export function CountryCard({ country, onPress }: { country: VisaCountry; onPress: () => void }) {
  const colors = useColors();
  const { isRTL } = useLanguage();
  const img = getImageUrl(country.imageUrl);

  return (
    <Pressable
      style={({ pressed }) => [styles.country, { opacity: pressed ? 0.92 : 1, shadowColor: NAVY }, isRTL ? { marginLeft: 12 } : { marginRight: 12 }]}
      onPress={onPress}
    >
      <AppImage
        source={img ? { uri: img } : require('@/assets/images/hero.jpg')}
        style={StyleSheet.absoluteFillObject}
        contentFit="cover"
        transition={250}
      />
      <LinearGradient colors={['transparent', 'rgba(5,43,91,0.92)']} style={StyleSheet.absoluteFill} />
      <View style={styles.countryBadge}>
        <Text style={styles.countryFlag}>{country.flagEmoji || flagEmoji(country.countryCode)}</Text>
      </View>
      <View style={styles.countryFooter}>
        <Text style={[styles.countryName, { fontFamily: 'Cairo_700Bold', textAlign: isRTL ? 'right' : 'left' }]} numberOfLines={1}>
          {isRTL ? country.nameAr : country.nameEn}
        </Text>
        {typeof country.visaCount === 'number' && country.visaCount > 0 && (
          <Text style={[styles.countryCount, { fontFamily: 'Cairo_400Regular', textAlign: isRTL ? 'right' : 'left' }]}>
            {country.visaCount} {isRTL ? 'تأشيرة' : 'Visas'}
          </Text>
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  // Banner
  banner: {
    marginHorizontal: 20,
    borderRadius: 22,
    overflow: 'hidden',
    shadowColor: NAVY,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 8,
  },
  bannerGradient: { padding: 20, minHeight: 150, justifyContent: 'center' },
  bannerGlow: {
    position: 'absolute', top: -40, left: -30, width: 130, height: 130,
    borderRadius: 65, backgroundColor: 'rgba(212,175,55,0.14)',
  },
  bannerGlow2: {
    position: 'absolute', bottom: -50, left: 60, width: 120, height: 120,
    borderRadius: 60, backgroundColor: 'rgba(56,189,248,0.10)',
  },
  bannerContent: { flexDirection: 'row-reverse', alignItems: 'center', gap: 14 },
  bannerText: { flex: 1, alignItems: 'flex-end' },
  bannerTag: {
    alignItems: 'center', gap: 5,
    backgroundColor: 'rgba(56,189,248,0.15)', borderWidth: 1,
    borderColor: 'rgba(56,189,248,0.3)', borderRadius: 20,
    paddingHorizontal: 10, paddingVertical: 4, marginBottom: 10,
  },
  bannerTagText: { fontSize: 11, color: SKY },
  bannerTitle: { fontSize: 22, color: '#FFFFFF' },
  bannerSub: {
    fontSize: 13, color: 'rgba(255,255,255,0.75)',
    marginTop: 6, marginBottom: 14, lineHeight: 20,
  },
  bannerCta: {
    alignItems: 'center', gap: 8,
    backgroundColor: GOLD, borderRadius: 12, paddingHorizontal: 18, paddingVertical: 10,
  },
  bannerCtaText: { fontSize: 14, color: NAVY },
  bannerIconWrap: {
    width: 72, height: 72, borderRadius: 20,
    backgroundColor: 'rgba(212,160,23,0.15)', borderWidth: 1,
    borderColor: 'rgba(212,160,23,0.3)', alignItems: 'center', justifyContent: 'center',
  },
  // Grid
  grid: {
    flexDirection: 'row-reverse', flexWrap: 'wrap', justifyContent: 'space-between',
    paddingHorizontal: 20, marginTop: 18, gap: 12,
  },
  gridItem: {
    width: '47%', borderRadius: 18, paddingVertical: 18, paddingHorizontal: 14,
    flexDirection: 'row-reverse', alignItems: 'center', gap: 12,
    shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.08, shadowRadius: 8, elevation: 3,
  },
  gridIcon: { width: 46, height: 46, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  gridLabel: { flex: 1, fontSize: 13, textAlign: 'right' },
  // Country
  country: {
    width: 140, height: 170, borderRadius: 18, overflow: 'hidden',
    justifyContent: 'flex-end',
    shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.12, shadowRadius: 8, elevation: 3,
  },
  countryBadge: {
    position: 'absolute', top: 10, right: 10, width: 36, height: 36, borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.9)', alignItems: 'center', justifyContent: 'center',
  },
  countryFlag: { fontSize: 20 },
  countryFooter: { padding: 12 },
  countryName: { color: '#FFFFFF', fontSize: 15, textAlign: 'right' },
  countryCount: { color: 'rgba(255,255,255,0.8)', fontSize: 11, textAlign: 'right', marginTop: 2 },
});
