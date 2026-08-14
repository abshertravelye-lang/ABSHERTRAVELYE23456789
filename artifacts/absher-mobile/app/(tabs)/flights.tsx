/**
 * flights.tsx — "قريباً" Coming Soon (رحلات + فنادق)
 * Premium illustration-style cards using gradient + icons.
 */
import React from 'react';
import { Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';

import { useLanguage } from '@/context/LanguageContext';

type ComingSoonProps = {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  desc: string;
};

function ComingSoonCard({ icon, title, desc }: ComingSoonProps) {
  const colors = useColors();
  const { t, isRTL } = useLanguage();
  return (
    <View style={[styles.card, { backgroundColor: colors.card, shadowColor: '#052B5B' }]}>
      <LinearGradient
        colors={['#062B5B', '#0D4A8C']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.cardTop}
      >
        <View style={styles.glow} />
        <View style={styles.iconWrap}>
          <Ionicons name={icon} size={52} color="#D4A017" />
        </View>
      </LinearGradient>

      <View style={[styles.cardBody, { alignItems: isRTL ? 'flex-end' : 'flex-start' }]}>
        <View style={[styles.badge, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
          <Ionicons name="time-outline" size={14} color="#D4A017" />
          <Text style={[styles.badgeText, { fontFamily: 'Cairo_600SemiBold' }]}>{t('common.comingSoon')}</Text>
        </View>
        <Text style={[styles.title, { color: colors.foreground, fontFamily: 'Cairo_700Bold', textAlign: isRTL ? 'right' : 'left' }]}>{title}</Text>
        <Text style={[styles.desc, { color: colors.mutedForeground, fontFamily: 'Cairo_400Regular', textAlign: isRTL ? 'right' : 'left' }]}>{desc}</Text>
      </View>
    </View>
  );
}

export default function FlightsScreen() {
  const colors = useColors();
  const { t, lang, isRTL } = useLanguage();
  const insets = useSafeAreaInsets();
  const topInset = Platform.OS === 'web' ? 67 : insets.top;
  const bottomInset = Platform.OS === 'web' ? 34 : 0;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <LinearGradient colors={['#062B5B', '#0D4A8C']} style={[styles.header, { paddingTop: topInset + 14 }]}>
        <Text style={[styles.headerTitle, { fontFamily: 'Cairo_700Bold', textAlign: isRTL ? 'right' : 'left' }]}>{t('flights.hubTitle')}</Text>
        <Text style={[styles.headerSub, { fontFamily: 'Cairo_400Regular', textAlign: isRTL ? 'right' : 'left' }]}>{t('flights.hubSub')}</Text>
      </LinearGradient>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ padding: 20, paddingBottom: bottomInset + 100, gap: 20 }}
      >
        <ComingSoonCard
          icon="airplane"
          title={t('flights.title')}
          desc={t('flights.comingSoon')}
        />
        <ComingSoonCard
          icon="bed"
          title={t('hotels.title')}
          desc={t('hotels.comingSoon')}
        />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 20, paddingBottom: 18, borderBottomLeftRadius: 24, borderBottomRightRadius: 24 },
  headerTitle: { fontSize: 22, color: '#D4A017' },
  headerSub: { fontSize: 13, color: 'rgba(255,255,255,0.65)', marginTop: 4 },
  card: {
    borderRadius: 22, overflow: 'hidden',
    shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.15, shadowRadius: 14, elevation: 6,
  },
  cardTop: { height: 150, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  glow: {
    position: 'absolute', top: -30, right: -20, width: 130, height: 130,
    borderRadius: 65, backgroundColor: 'rgba(56,189,248,0.14)',
  },
  iconWrap: {
    width: 96, height: 96, borderRadius: 48,
    backgroundColor: 'rgba(212,160,23,0.14)', borderWidth: 2,
    borderColor: 'rgba(212,160,23,0.3)', alignItems: 'center', justifyContent: 'center',
  },
  cardBody: { padding: 20 },
  badge: {
    alignItems: 'center', gap: 6,
    backgroundColor: 'rgba(212,160,23,0.15)', borderWidth: 1,
    borderColor: 'rgba(212,160,23,0.3)', borderRadius: 20,
    paddingHorizontal: 14, paddingVertical: 6, marginBottom: 12,
  },
  badgeText: { color: '#D4A017', fontSize: 13 },
  title: { fontSize: 20 },
  desc: { fontSize: 14, lineHeight: 24, marginTop: 8 },
});
