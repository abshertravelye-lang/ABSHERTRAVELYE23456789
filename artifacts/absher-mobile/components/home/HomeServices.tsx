import React from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, Platform } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '@/hooks/useColors';
import { getImageUrl } from '@/hooks/useImageUrl';
import { useLanguage } from '@/context/LanguageContext';
import type { Visa, VisaCountry } from '@workspace/api-client-react';

const GOLD = '#D4A017';
const GOLD_ACTIVE = '#F4C542';
const NAVY = '#062B5B';
const GREEN = '#0B5E3B';

// ── Destination Card ──────────────────────────────────────────────────────────

export function DestinationCard({
  visa,
  country,
  onPress,
}: {
  visa: Visa;
  country?: VisaCountry;
  onPress: () => void;
}) {
  const colors = useColors();
  const { t, lang, isRTL } = useLanguage();
  const isDark = colors.background === '#031B3A'; // Check from tokens
  
  const imgUrl = getImageUrl(country?.imageUrl);
  const flag = country?.flagEmoji || '🌍';
  const name = lang === 'ar' ? visa.countryAr : visa.countryEn;


  return (
    <Pressable
      style={({ pressed }) => [
        styles.destCard,
        {
          backgroundColor: colors.card,
          borderColor: colors.border,
          transform: [{ scale: pressed ? 0.98 : 1 }],
          marginRight: isRTL ? 0 : 16,
          marginLeft: isRTL ? 16 : 0,
        },
      ]}
      onPress={onPress}
    >
      <View style={styles.destImageWrap}>
        <Image
          source={imgUrl ? { uri: imgUrl } : require('@/assets/images/hero.jpg')}
          style={styles.destImage}
          contentFit="cover"
          transition={200}
        />
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.7)']}
          style={StyleSheet.absoluteFillObject}
        />
        <View style={[styles.destFlagBadge, isRTL ? { left: 12 } : { right: 12 }]}>
          <Text style={styles.destFlag}>{flag}</Text>
        </View>
        <Text style={[styles.destName, { fontFamily: 'Cairo_700Bold', textAlign: isRTL ? 'right' : 'left' }]}>{name}</Text>
      </View>

      <View style={styles.destInfo}>
        <View style={[styles.destRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
          <Text style={[styles.destType, { color: colors.textSecondary, fontFamily: 'Cairo_600SemiBold' }]}>
            {visa.visaType}
          </Text>
          <Text style={[styles.destPrice, { color: colors.primary, fontFamily: 'Cairo_700Bold' }]}>
            {visa.fee} {visa.currency}
          </Text>
        </View>

        <View style={[styles.destFooter, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
          <View style={[styles.destFooterItem, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
            <Ionicons name="time-outline" size={14} color={colors.textSecondary} />
            <Text style={[styles.destFooterText, { color: colors.textSecondary, fontFamily: 'Cairo_400Regular' }]}>
              {visa.processingDays} {t('common.days')}
            </Text>
          </View>
          <View style={[styles.destArrow, isRTL && { transform: [{ rotate: '180deg' }] }]}>
            <Ionicons name="arrow-forward" size={16} color={colors.card} />
          </View>
        </View>
      </View>
    </Pressable>
  );
}

// ── Main Services Grid ────────────────────────────────────────────────────────

export type ServiceAction = {
  id: string;
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  route: string;
  color: string;
  isUmrah?: boolean;
  fullWidth?: boolean;
};

export function MainServicesGrid({
  actions,
  onActionPress,
}: {
  actions: ServiceAction[];
  onActionPress: (route: string) => void;
}) {
  const colors = useColors();
  const { t, lang, isRTL } = useLanguage();

  return (
    <View style={[styles.servicesGrid, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
      {actions.map((action) => {
        if (action.isUmrah) {
          return (
            <Pressable
              key={action.id}
              style={({ pressed }) => [
                styles.umrahCard,
                { transform: [{ scale: pressed ? 0.98 : 1 }] },
              ]}
              onPress={() => onActionPress(action.route)}
            >
              <LinearGradient
                colors={[GREEN, '#06402B']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={[styles.umrahGradient, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}
              >
                <View style={styles.umrahIconWrap}>
                  <Ionicons name={action.icon} size={28} color={GOLD} />
                </View>
                <Text style={[styles.umrahTitle, { fontFamily: 'Cairo_700Bold', textAlign: isRTL ? 'right' : 'left' }]}>
                  {action.title}
                </Text>
                <Ionicons name="sparkles" size={16} color={GOLD} style={[styles.umrahSparkle, isRTL ? { left: 14 } : { right: 14 }]} />
              </LinearGradient>
            </Pressable>
          );
        }

        return (
          <Pressable
            key={action.id}
            style={({ pressed }) => [
              styles.serviceCard,
              action.fullWidth && { width: '100%', flexDirection: isRTL ? 'row-reverse' : 'row', alignItems: 'center' },
              {
                backgroundColor: colors.card,
                borderColor: colors.border,
                transform: [{ scale: pressed ? 0.98 : 1 }],
                alignItems: action.fullWidth ? 'center' : (isRTL ? 'flex-end' : 'flex-start'),
              },
            ]}
            onPress={() => onActionPress(action.route)}
          >
            <View style={[action.fullWidth ? { flexDirection: isRTL ? 'row-reverse' : 'row', alignItems: 'center', gap: 14 } : null]}>
              <View style={[styles.serviceIconWrap, { backgroundColor: `${action.color}15` }]}>
                <Ionicons name={action.icon} size={28} color={action.color} />
              </View>
              <Text
                style={[
                  styles.serviceTitle, 
                  { color: colors.text, fontFamily: 'Cairo_700Bold', textAlign: isRTL ? 'right' : 'left' },
                  action.fullWidth && { fontSize: 16 }
                ]}
                numberOfLines={2}
              >
                {action.title}
              </Text>
            </View>
            {!action.fullWidth && (
              <View style={[styles.serviceCta, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                <Text style={[styles.serviceCtaText, { fontFamily: 'Cairo_700Bold' }]}>
                  {t('homeTab.cta.startNow' as any)}
                </Text>
                <Ionicons name={isRTL ? "arrow-back" : "arrow-forward"} size={14} color={NAVY} />
              </View>
            )}
            {action.fullWidth && (
              <Ionicons name={isRTL ? 'arrow-back' : 'arrow-forward'} size={18} color={colors.textSecondary} style={{ marginLeft: isRTL ? 0 : 'auto', marginRight: isRTL ? 'auto' : 0 }} />
            )}
          </Pressable>
        );
      })}
    </View>
  );
}

// ── Quick Stats ───────────────────────────────────────────────────────────────

export function QuickStats({
  stats,
}: {
  stats: { active: number; approved: number; pending: number; trips: number };
}) {
  const colors = useColors();
  const { t, lang, isRTL } = useLanguage();
  const router = require('expo-router').router;

  const data = [
    { label: t('homeTab.stats.activeVisas'), value: stats.active, color: '#3B82F6', icon: 'document-text' },
    { label: t('homeTab.stats.approvedVisas'), value: stats.approved, color: '#10B981', icon: 'checkmark-circle' },
    { label: t('homeTab.stats.pendingVisas'), value: stats.pending, color: '#F59E0B', icon: 'time' },
    { label: t('homeTab.stats.trips'), value: stats.trips, color: colors.skyBlue, icon: 'airplane' },
  ];

  return (
    <View style={styles.statsGrid}>
      {data.map((item, idx) => (
        <Pressable
          key={idx}
          style={({ pressed }) => [
            styles.statCard, 
            { backgroundColor: colors.card, borderColor: colors.border },
            { transform: [{ scale: pressed ? 0.98 : 1 }] }
          ]}
          onPress={() => router.push('/(tabs)/bookings' as any)}
        >
          <View style={[styles.statHeader, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
            <View style={[styles.statIconWrap, { backgroundColor: `${item.color}15` }]}>
              <Ionicons name={item.icon as any} size={18} color={item.color} />
            </View>
            <Text style={[styles.statValue, { color: colors.text, fontFamily: 'Cairo_700Bold' }]}>
              {item.value}
            </Text>
          </View>
          <Text style={[styles.statLabel, { color: colors.textSecondary, fontFamily: 'Cairo_500Medium', textAlign: isRTL ? 'right' : 'left' }]}>
            {item.label}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  // Destinations
  destCard: {
    width: 240,
    borderRadius: 20,
    borderWidth: 1,
    overflow: 'hidden',
    marginRight: 16,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 12 },
      android: { elevation: 4 },
      web: { boxShadow: '0 4px 12px rgba(0,0,0,0.08)' } as any,
    }),
  },
  destImageWrap: {
    height: 140,
    width: '100%',
    position: 'relative',
    justifyContent: 'flex-end',
    padding: 14,
  },
  destImage: {
    ...StyleSheet.absoluteFillObject,
  },
  destFlagBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderRadius: 16,
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  destFlag: {
    fontSize: 18,
  },
  destName: {
    color: '#FFF',
    fontSize: 18,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  destInfo: {
    padding: 14,
  },
  destRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  destType: {
    fontSize: 13,
  },
  destPrice: {
    fontSize: 15,
  },
  destFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  destFooterItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  destFooterText: {
    fontSize: 12,
  },
  destArrow: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: GOLD,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Services
  servicesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    paddingHorizontal: 20,
    marginTop: 16,
  },
  serviceCard: {
    width: '48%',
    borderRadius: 20,
    borderWidth: 1,
    padding: 16,
    flexDirection: 'column',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    minHeight: 140,
    ...Platform.select({
      ios: { shadowColor: '#052B5B', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 10 },
      android: { elevation: 3 },
      web: { boxShadow: '0 4px 12px rgba(5,43,91,0.06)' } as any,
    }),
  },
  serviceIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  serviceTitle: {
    fontSize: 15,
    lineHeight: 22,
  },
  serviceCta: {
    alignItems: 'center', gap: 4,
    backgroundColor: GOLD, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 6,
    marginTop: 12, alignSelf: 'stretch', justifyContent: 'center'
  },
  serviceCtaText: {
    fontSize: 12, color: NAVY
  },
  umrahCard: {
    width: '100%',
    borderRadius: 16,
    overflow: 'hidden',
    ...Platform.select({
      ios: { shadowColor: GREEN, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 10 },
      android: { elevation: 6 },
      web: { boxShadow: '0 6px 16px rgba(11,94,59,0.3)' } as any,
    }),
  },
  umrahGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 18,
    gap: 14,
  },
  umrahIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: 'rgba(212,160,23,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(212,160,23,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  umrahTitle: {
    color: '#FFF',
    fontSize: 18,
    flex: 1,
  },
  umrahSparkle: {
    position: 'absolute',
    top: 14,
    right: 14,
    opacity: 0.7,
  },

  // Stats
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 20,
    gap: 12,
  },
  statCard: {
    width: '48%',
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 6 },
      android: { elevation: 2 },
      web: { boxShadow: '0 2px 8px rgba(0,0,0,0.04)' } as any,
    }),
  },
  statHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  statIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statValue: {
    fontSize: 22,
  },
  statLabel: {
    fontSize: 13,
  },
});
