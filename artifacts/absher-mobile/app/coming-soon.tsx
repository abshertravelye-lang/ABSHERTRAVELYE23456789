import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { useLanguage } from '@/context/LanguageContext';

const GOLD = '#D4AF37';

const SERVICES: Record<string, { icon: keyof typeof Ionicons.glyphMap; ar: string; en: string; arDesc: string; enDesc: string }> = {
  flights: {
    icon: 'airplane',
    ar: 'حجز رحلات الطيران',
    en: 'Flight Booking',
    arDesc: 'نعمل على إطلاق خدمة حجز الرحلات الجوية بأفضل الأسعار وأكثر الخيارات تنوعاً. ترقبوا إطلاقها قريباً.',
    enDesc: 'We are working on launching flight booking with the best prices and widest options. Stay tuned.',
  },
  hotels: {
    icon: 'business',
    ar: 'حجز الفنادق',
    en: 'Hotel Booking',
    arDesc: 'نعمل على إطلاق خدمة حجز الفنادق لتوفير أفضل الخيارات والأسعار في مختلف الوجهات. ترقبوا إطلاقها قريباً.',
    enDesc: 'We are working on launching hotel booking with the best options and prices across destinations. Stay tuned.',
  },
};

export default function ComingSoonScreen() {
  const { service } = useLocalSearchParams<{ service?: string }>();
  const { lang } = useLanguage();
  const insets = useSafeAreaInsets();
  const ar = lang === 'ar';
  const meta = SERVICES[service ?? 'flights'] ?? SERVICES.flights;

  return (
    <LinearGradient colors={['#081A33', '#0A2342', '#0D2C55']} style={styles.container}>
      <View style={[styles.content, { paddingTop: insets.top + 24, paddingBottom: insets.bottom + 24 }]}>
        <View style={styles.iconRing}>
          <View style={styles.iconCircle}>
            <Ionicons name={meta.icon} size={44} color={GOLD} />
          </View>
        </View>

        <Text style={[styles.title, { fontFamily: 'Cairo_700Bold' }]}>
          {ar ? 'ستتوفر هذه الخدمة قريباً' : 'This service is coming soon'}
        </Text>
        <Text style={[styles.subtitle, { fontFamily: 'Cairo_700Bold' }]}>
          {ar ? meta.ar : meta.en}
        </Text>
        <Text style={[styles.desc, { fontFamily: 'Cairo_400Regular' }]}>
          {ar ? meta.arDesc : meta.enDesc}
        </Text>

        <View style={styles.soonPill}>
          <Ionicons name="time-outline" size={16} color={GOLD} />
          <Text style={[styles.soonText, { fontFamily: 'Cairo_600SemiBold' }]}>{ar ? 'قريباً' : 'Soon'}</Text>
        </View>

        <Pressable
          style={({ pressed }) => [styles.homeBtn, { opacity: pressed ? 0.85 : 1 }]}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            if (router.canGoBack()) router.back();
            else router.replace('/(tabs)');
          }}
        >
          <Text style={[styles.homeBtnText, { fontFamily: 'Cairo_700Bold' }]}>
            {ar ? 'العودة للرئيسية' : 'Back to Home'}
          </Text>
        </Pressable>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32, gap: 14 },
  iconRing: {
    width: 120, height: 120, borderRadius: 60, borderWidth: 1.5, borderColor: GOLD,
    alignItems: 'center', justifyContent: 'center', marginBottom: 10,
  },
  iconCircle: {
    width: 106, height: 106, borderRadius: 53, backgroundColor: 'rgba(212, 175, 55, 0.10)',
    alignItems: 'center', justifyContent: 'center',
  },
  title: { color: '#FFFFFF', fontSize: 26, textAlign: 'center' },
  subtitle: { color: GOLD, fontSize: 18, textAlign: 'center' },
  desc: { color: 'rgba(255,255,255,0.85)', fontSize: 14.5, lineHeight: 24, textAlign: 'center', maxWidth: 340 },
  soonPill: {
    flexDirection: 'row-reverse', alignItems: 'center', gap: 8, marginTop: 12,
    paddingHorizontal: 22, paddingVertical: 10, borderRadius: 24,
    borderWidth: 1, borderColor: 'rgba(212, 175, 55, 0.5)', backgroundColor: 'rgba(255,255,255,0.04)',
  },
  soonText: { color: GOLD, fontSize: 14 },
  homeBtn: {
    marginTop: 22, backgroundColor: GOLD, paddingHorizontal: 42, paddingVertical: 14, borderRadius: 12,
  },
  homeBtnText: { color: '#0A2342', fontSize: 16 },
});
