import React, { useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { useColors } from '@/hooks/useColors';
import { useLanguage } from '@/context/LanguageContext';
import { useGetProgram, useCreateBooking } from '@workspace/api-client-react';
import { getImageUrl } from '@/hooks/useImageUrl';

export default function ProgramDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colors = useColors();
  const { t, lang } = useLanguage();
  const insets = useSafeAreaInsets();

  const { data: program, isLoading } = useGetProgram(Number(id));
  const createBooking = useCreateBooking();
  const [booked, setBooked] = useState(false);

  const handleBook = () => {
    Alert.prompt
      ? Alert.prompt(t('programDetail.bookNow'), t('programDetail.bookPromptBody'), [
          { text: t('flow.cancel'), style: 'cancel' },
          {
            text: t('programDetail.confirmBooking'),
            onPress: (name?: string) => confirmBook(name || t('programDetail.defaultClient')),
          },
        ])
      : Alert.alert(t('programDetail.bookNow'), t('programDetail.bookConfirmBody'), [
          { text: t('flow.cancel'), style: 'cancel' },
          { text: t('flow.confirm'), onPress: () => confirmBook(t('programDetail.defaultClient')) },
        ]);
  };

  const confirmBook = (name: string) => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    createBooking.mutate(
      {
        data: {
          type: 'program',
          clientName: name,
          clientPhone: '0500000000',
          destination: program?.country,
          notes: `${t('programDetail.notePrefix')} ${program?.titleAr}`,
          totalPrice: program?.price,
        },
      },
      {
        onSuccess: () => {
          setBooked(true);
          Alert.alert(t('programDetail.bookedTitle'), t('programDetail.bookedBody'));
        },
        onError: () => Alert.alert(t('flow.error'), t('programDetail.bookError')),
      }
    );
  };

  if (isLoading) {
    return (
      <View style={[styles.loading, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color="#2563EB" />
      </View>
    );
  }

  if (!program) {
    return (
      <View style={[styles.loading, { backgroundColor: colors.background }]}>
        <Text style={[styles.errorText, { color: colors.mutedForeground, fontFamily: 'Cairo_400Regular' }]}>{t('programDetail.notFound')}</Text>
      </View>
    );
  }

  const imageUri = getImageUrl(program.imageUrl);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Hero Image */}
        <View style={styles.heroContainer}>
          <Image
            source={imageUri ? { uri: imageUri } : require('@/assets/images/hero.jpg')}
            style={styles.heroImage}
            contentFit="cover"
          />
          <LinearGradient colors={['rgba(10,35,66,0.6)', 'transparent', 'transparent']} style={StyleSheet.absoluteFill} />
          <Pressable style={[styles.backBtn, { top: insets.top + 12 }]} onPress={() => router.back()}>
            <Ionicons name="arrow-forward" size={22} color="#FFFFFF" />
          </Pressable>
        </View>

        <View style={styles.content}>
          {/* Title + Price */}
          <View style={styles.titleRow}>
            <Text style={[styles.price, { color: '#052B5B', fontFamily: 'Cairo_700Bold' }]}>
              {program.price.toLocaleString(lang === 'ar' ? 'ar-SA' : 'en-US')} {program.currency || t('programDetail.currency')}
            </Text>
            <Text style={[styles.title, { color: colors.foreground, fontFamily: 'Cairo_700Bold' }]}>{program.titleAr}</Text>
          </View>

          {/* Meta badges */}
          <View style={styles.badges}>
            <View style={[styles.badge, { backgroundColor: '#F0F5FF' }]}>
              <Ionicons name="time-outline" size={14} color="#052B5B" />
              <Text style={[styles.badgeText, { color: '#052B5B', fontFamily: 'Cairo_600SemiBold' }]}>{program.days} {t('programDetail.dayUnit')}</Text>
            </View>
            {program.country && (
              <View style={[styles.badge, { backgroundColor: '#F0F5FF' }]}>
                <Ionicons name="location-outline" size={14} color="#052B5B" />
                <Text style={[styles.badgeText, { color: '#052B5B', fontFamily: 'Cairo_600SemiBold' }]}>{program.country}</Text>
              </View>
            )}
            {program.cities?.map((c) => (
              <View key={c} style={[styles.badge, { backgroundColor: colors.muted }]}>
                <Text style={[styles.badgeText, { color: colors.mutedForeground, fontFamily: 'Cairo_400Regular' }]}>{c}</Text>
              </View>
            ))}
          </View>

          {/* Description */}
          {program.descriptionAr && (
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.foreground, fontFamily: 'Cairo_700Bold' }]}>{t('programDetail.description')}</Text>
              <Text style={[styles.desc, { color: colors.mutedForeground, fontFamily: 'Cairo_400Regular' }]}>{program.descriptionAr}</Text>
            </View>
          )}

          {/* Included Services */}
          {!!program.includedServices?.length && (
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.foreground, fontFamily: 'Cairo_700Bold' }]}>{t('programDetail.includedServices')}</Text>
              {program.includedServices.map((s, i) => (
                <View key={i} style={styles.serviceRow}>
                  <Text style={[styles.serviceText, { color: colors.foreground, fontFamily: 'Cairo_400Regular' }]}>{s}</Text>
                  <Ionicons name="checkmark-circle" size={18} color="#16A34A" />
                </View>
              ))}
            </View>
          )}

          {/* Itinerary */}
          {!!program.dailyItinerary?.length && (
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.foreground, fontFamily: 'Cairo_700Bold' }]}>{t('programDetail.dailyItinerary')}</Text>
              {program.dailyItinerary.map((day) => (
                <View key={day.day} style={[styles.dayCard, { backgroundColor: colors.muted, borderColor: colors.border }]}>
                  <View style={[styles.dayBadge, { backgroundColor: '#052B5B' }]}>
                    <Text style={[styles.dayNum, { fontFamily: 'Cairo_700Bold' }]}>{t('programDetail.dayPrefix')} {day.day}</Text>
                  </View>
                  <View style={styles.dayBody}>
                    <Text style={[styles.dayTitle, { color: colors.foreground, fontFamily: 'Cairo_700Bold' }]}>{day.titleAr}</Text>
                    <Text style={[styles.dayDesc, { color: colors.mutedForeground, fontFamily: 'Cairo_400Regular' }]}>{day.descriptionAr}</Text>
                  </View>
                </View>
              ))}
            </View>
          )}

          <View style={{ height: 100 }} />
        </View>
      </ScrollView>

      {/* Book Button */}
      <View style={[styles.footer, { paddingBottom: insets.bottom + 16, backgroundColor: colors.card, borderTopColor: colors.border }]}>
        <Pressable
          style={({ pressed }) => [
            styles.bookBtn,
            { backgroundColor: booked ? '#16A34A' : '#052B5B', opacity: pressed ? 0.9 : 1 },
          ]}
          onPress={handleBook}
          disabled={booked || createBooking.isPending}
        >
          {createBooking.isPending ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <>
              <Ionicons name={booked ? 'checkmark-circle' : 'calendar-outline'} size={20} color="#FFFFFF" />
              <Text style={[styles.bookBtnText, { fontFamily: 'Cairo_700Bold' }]}>
                {booked ? t('programDetail.booked') : t('programDetail.bookNow')}
              </Text>
            </>
          )}
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  errorText: { fontSize: 16 },
  heroContainer: { position: 'relative' },
  heroImage: { width: '100%', height: 280 },
  backBtn: { position: 'absolute', right: 16, width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(0,0,0,0.4)', alignItems: 'center', justifyContent: 'center' },
  content: { padding: 20 },
  titleRow: { marginBottom: 14 },
  title: { fontSize: 22, textAlign: 'right', marginBottom: 6 },
  price: { fontSize: 18, textAlign: 'right' },
  badges: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'flex-end', marginBottom: 20 },
  badge: { flexDirection: 'row', alignItems: 'center', gap: 4, borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6 },
  badgeText: { fontSize: 13 },
  section: { marginBottom: 20 },
  sectionTitle: { fontSize: 17, marginBottom: 10, textAlign: 'right' },
  desc: { fontSize: 14, lineHeight: 24, textAlign: 'right' },
  serviceRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8, justifyContent: 'flex-end' },
  serviceText: { fontSize: 14, textAlign: 'right', flex: 1 },
  dayCard: { borderRadius: 12, borderWidth: 1, padding: 14, marginBottom: 10, flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  dayBadge: { borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6, minWidth: 60, alignItems: 'center' },
  dayNum: { color: '#FFFFFF', fontSize: 12 },
  dayBody: { flex: 1 },
  dayTitle: { fontSize: 14, textAlign: 'right', marginBottom: 4 },
  dayDesc: { fontSize: 13, textAlign: 'right', lineHeight: 20 },
  footer: { padding: 16, borderTopWidth: 1 },
  bookBtn: { borderRadius: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 16, gap: 10 },
  bookBtnText: { color: '#FFFFFF', fontSize: 16 },
});
