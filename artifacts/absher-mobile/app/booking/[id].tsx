import React from 'react';
import { ActivityIndicator, Alert, Linking, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { useColors } from '@/hooks/useColors';
import { useLanguage } from '@/context/LanguageContext';
import { useGetBooking, getGetBookingQueryKey } from '@workspace/api-client-react';

const STATUS_STEPS = [
  { key: 'pending', labelKey: 'bookingDetail.step.pending' },
  { key: 'confirmed', labelKey: 'bookingDetail.step.confirmed' },
  { key: 'completed', labelKey: 'bookingDetail.step.completed' }
] as const;

const TYPE_CONFIG = {
  flight:  { icon: 'airplane' as const,       labelKey: 'bookingDetail.type.flight', color: '#052B5B' },
  hotel:   { icon: 'bed-outline' as const,    labelKey: 'bookingDetail.type.hotel',  color: '#7C3AED' },
  program: { icon: 'globe-outline' as const,  labelKey: 'bookingDetail.type.program', color: '#0891B2' },
  visa:    { icon: 'card-outline' as const,   labelKey: 'bookingDetail.type.visa',   color: '#D97706' },
};

function formatDate(iso: string | null | undefined, locale: string) {
  if (!iso) return '---';
  return new Date(iso).toLocaleDateString(locale, { day: 'numeric', month: 'long', year: 'numeric' });
}

export default function BookingDetailScreen() {
  const colors = useColors();
  const { t, lang } = useLanguage();
  const locale = lang === 'ar' ? 'ar-SA' : 'en-US';
  const insets = useSafeAreaInsets();
  const topInset = Platform.OS === 'web' ? 67 : insets.top;
  const bottomInset = Platform.OS === 'web' ? 34 : Math.max(insets.bottom, 20);

  const { id } = useLocalSearchParams<{ id: string }>();
  const bookingId = Number(id);

  const { data: booking, isLoading, error } = useGetBooking(bookingId, {
    query: { enabled: !!bookingId, queryKey: getGetBookingQueryKey(bookingId) }
  });

  if (isLoading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#D4AF37" />
      </View>
    );
  }

  if (error || !booking) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { paddingTop: topInset + 12, backgroundColor: '#052B5B' }]}>
          <Pressable onPress={() => router.back()} hitSlop={10}>
            <Ionicons name="arrow-forward" size={24} color="#FFFFFF" />
          </Pressable>
        </View>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={64} color={colors.destructive} />
          <Text style={[styles.errorText, { color: colors.foreground, fontFamily: 'Cairo_600SemiBold' }]}>
            {t('bookingDetail.loadError')}
          </Text>
        </View>
      </View>
    );
  }

  const typeConf = TYPE_CONFIG[booking.type as keyof typeof TYPE_CONFIG] || TYPE_CONFIG.flight;
  const isCancelled = booking.status === 'cancelled';

  // Determine current step index
  let currentStepIndex = 0;
  if (booking.status === 'confirmed') currentStepIndex = 1;
  if ((booking.status as string) === 'completed') currentStepIndex = 2;

  const handleShare = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const msg = `${t('bookingDetail.shareBookingLabel')}\n${t('bookingDetail.shareRef')} #${booking.id}\n${t('bookingDetail.shareType')} ${t(typeConf.labelKey)}\n${t('bookingDetail.shareClient')} ${booking.clientName}\n${t('bookingDetail.shareStatus')} ${isCancelled ? t('bookingDetail.shareCancelled') : t(STATUS_STEPS[currentStepIndex].labelKey)}`;
    Linking.openURL(`whatsapp://send?text=${encodeURIComponent(msg)}`);
  };

  const handleDownload = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Alert.alert(t('flow.comingSoon'), t('bookingDetail.downloadComingSoon'));
  };

  const handleSupport = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push('/support-chat');
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: topInset + 12, backgroundColor: '#052B5B' }]}>
        <View style={styles.headerRow}>
          <Pressable onPress={() => router.back()} hitSlop={10}>
            <Ionicons name="arrow-forward" size={24} color="#FFFFFF" />
          </Pressable>
          <Text style={[styles.headerTitle, { fontFamily: 'Cairo_700Bold' }]}>{t('bookingDetail.title')} #{booking.id}</Text>
          <View style={{ width: 24 }} />
        </View>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: bottomInset + 40, gap: 16 }}>
        {/* Hero Section */}
        <View style={[styles.heroCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={[styles.heroIconWrap, { backgroundColor: `${typeConf.color}15` }]}>
            <Ionicons name={typeConf.icon} size={36} color={typeConf.color} />
          </View>
          <Text style={[styles.heroTitle, { color: colors.foreground, fontFamily: 'Cairo_700Bold' }]}>
            {booking.destination || booking.clientName}
          </Text>
          <Text style={[styles.heroSubtitle, { color: colors.mutedForeground, fontFamily: 'Cairo_600SemiBold' }]}>
            {t(typeConf.labelKey)}
          </Text>

          {isCancelled && (
            <View style={[styles.cancelledBadge, { backgroundColor: '#FEE2E2' }]}>
              <Text style={[styles.cancelledText, { color: '#991B1B', fontFamily: 'Cairo_700Bold' }]}>{t('bookingDetail.cancelled')}</Text>
            </View>
          )}
        </View>

        {/* Status Timeline */}
        {!isCancelled && (
          <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.sectionTitle, { color: colors.foreground, fontFamily: 'Cairo_700Bold' }]}>{t('bookingDetail.statusTitle')}</Text>
            <View style={styles.timeline}>
              {STATUS_STEPS.map((step, index) => {
                const isActive = index <= currentStepIndex;
                const isCurrent = index === currentStepIndex;
                const isLast = index === STATUS_STEPS.length - 1;
                
                return (
                  <View key={step.key} style={styles.timelineStepContainer}>
                    <View style={styles.timelineIconContainer}>
                      <View style={[
                        styles.timelineDot,
                        { 
                          backgroundColor: isActive ? '#D4AF37' : colors.muted,
                          borderColor: isActive ? '#D4AF37' : colors.border
                        }
                      ]}>
                        {isActive && <Ionicons name="checkmark" size={14} color="#FFFFFF" />}
                      </View>
                      {!isLast && (
                        <View style={[
                          styles.timelineLine,
                          { backgroundColor: index < currentStepIndex ? '#D4AF37' : colors.muted }
                        ]} />
                      )}
                    </View>
                    <View style={styles.timelineContent}>
                      <Text style={[
                        styles.timelineLabel,
                        { 
                          color: isCurrent ? colors.foreground : colors.mutedForeground,
                          fontFamily: isCurrent ? 'Cairo_700Bold' : 'Cairo_600SemiBold'
                        }
                      ]}>
                        {t(step.labelKey)}
                      </Text>
                    </View>
                  </View>
                );
              })}
            </View>
          </View>
        )}

        {/* Flight specific details */}
        {booking.type === 'flight' && (
          <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.sectionTitle, { color: colors.foreground, fontFamily: 'Cairo_700Bold' }]}>{t('bookingDetail.flightDetails')}</Text>
            <View style={styles.detailRow}>
              <Text style={[styles.detailValue, { color: colors.foreground, fontFamily: 'Cairo_600SemiBold' }]}>SV-1042</Text>
              <Text style={[styles.detailLabel, { color: colors.mutedForeground, fontFamily: 'Cairo_400Regular' }]}>{t('bookingDetail.flightNumber')}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={[styles.detailValue, { color: colors.foreground, fontFamily: 'Cairo_600SemiBold' }]}>{t('bookingDetail.riyadh')} (RUH)</Text>
              <Text style={[styles.detailLabel, { color: colors.mutedForeground, fontFamily: 'Cairo_400Regular' }]}>{t('bookingDetail.departure')}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={[styles.detailValue, { color: colors.foreground, fontFamily: 'Cairo_600SemiBold' }]}>{t('bookingDetail.dubai')} (DXB)</Text>
              <Text style={[styles.detailLabel, { color: colors.mutedForeground, fontFamily: 'Cairo_400Regular' }]}>{t('bookingDetail.arrival')}</Text>
            </View>
          </View>
        )}

        {/* Travel Dates */}
        <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.foreground, fontFamily: 'Cairo_700Bold' }]}>{t('bookingDetail.travelDates')}</Text>
          <View style={styles.detailRow}>
            <Text style={[styles.detailValue, { color: colors.foreground, fontFamily: 'Cairo_600SemiBold' }]}>{formatDate(booking.travelDate, locale)}</Text>
            <Text style={[styles.detailLabel, { color: colors.mutedForeground, fontFamily: 'Cairo_400Regular' }]}>{t('bookingDetail.departureDate')}</Text>
          </View>
          {booking.returnDate && (
            <View style={styles.detailRow}>
              <Text style={[styles.detailValue, { color: colors.foreground, fontFamily: 'Cairo_600SemiBold' }]}>{formatDate(booking.returnDate, locale)}</Text>
              <Text style={[styles.detailLabel, { color: colors.mutedForeground, fontFamily: 'Cairo_400Regular' }]}>{t('bookingDetail.returnDate')}</Text>
            </View>
          )}
        </View>

        {/* Passengers */}
        <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.foreground, fontFamily: 'Cairo_700Bold' }]}>{t('bookingDetail.passengers')}</Text>
          <View style={styles.detailRow}>
            <Text style={[styles.detailValue, { color: colors.foreground, fontFamily: 'Cairo_600SemiBold' }]}>{booking.clientName}</Text>
            <Text style={[styles.detailLabel, { color: colors.mutedForeground, fontFamily: 'Cairo_400Regular' }]}>{t('bookingDetail.bookingHolder')}</Text>
          </View>
          {booking.adults ? (
            <View style={styles.detailRow}>
              <Text style={[styles.detailValue, { color: colors.foreground, fontFamily: 'Cairo_600SemiBold' }]}>{booking.adults} {t('bookingDetail.adultUnit')}</Text>
              <Text style={[styles.detailLabel, { color: colors.mutedForeground, fontFamily: 'Cairo_400Regular' }]}>{t('bookingDetail.travelerCount')}</Text>
            </View>
          ) : null}
        </View>

        {/* Price Breakdown */}
        {booking.totalPrice && (
          <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.sectionTitle, { color: colors.foreground, fontFamily: 'Cairo_700Bold' }]}>{t('bookingDetail.paymentDetails')}</Text>
            <View style={styles.detailRow}>
              <Text style={[styles.detailValue, { color: '#16A34A', fontFamily: 'Cairo_700Bold', fontSize: 18 }]}>
                {booking.totalPrice.toLocaleString(locale)} {booking.type === 'flight' ? 'USD' : t('bookingDetail.currencySar')}
              </Text>
              <Text style={[styles.detailLabel, { color: colors.mutedForeground, fontFamily: 'Cairo_400Regular' }]}>{t('bookingDetail.totalPaid')}</Text>
            </View>
          </View>
        )}

      </ScrollView>

      {/* Action Buttons Fixed at Bottom */}
      <View style={[styles.bottomActions, { paddingBottom: bottomInset + 10, backgroundColor: colors.card, borderTopColor: colors.border }]}>
        <View style={styles.actionGrid}>
          <Pressable style={({ pressed }) => [styles.actionBtn, { backgroundColor: '#16A34A', opacity: pressed ? 0.8 : 1 }]} onPress={handleShare}>
            <Ionicons name="logo-whatsapp" size={20} color="#FFFFFF" />
            <Text style={[styles.actionBtnText, { fontFamily: 'Cairo_700Bold', color: '#FFFFFF' }]}>{t('bookingDetail.share')}</Text>
          </Pressable>
          <Pressable style={({ pressed }) => [styles.actionBtn, { backgroundColor: colors.muted, opacity: pressed ? 0.8 : 1 }]} onPress={handleDownload}>
            <Ionicons name="download-outline" size={20} color={colors.foreground} />
            <Text style={[styles.actionBtnText, { fontFamily: 'Cairo_700Bold', color: colors.foreground }]}>{t('bookingDetail.downloadPdf')}</Text>
          </Pressable>
        </View>
        <Pressable style={({ pressed }) => [styles.supportBtn, { borderColor: '#052B5B', opacity: pressed ? 0.8 : 1 }]} onPress={handleSupport}>
          <Ionicons name="headset-outline" size={20} color="#052B5B" />
          <Text style={[styles.supportBtnText, { color: '#052B5B', fontFamily: 'Cairo_700Bold' }]}>{t('bookingDetail.contactSupport')}</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 16, paddingBottom: 16 },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  headerTitle: { color: '#FFFFFF', fontSize: 20 },
  errorContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 16 },
  errorText: { fontSize: 18 },
  
  heroCard: { padding: 24, borderRadius: 16, borderWidth: 1, alignItems: 'center', gap: 8 },
  heroIconWrap: { width: 72, height: 72, borderRadius: 24, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  heroTitle: { fontSize: 24, textAlign: 'center' },
  heroSubtitle: { fontSize: 16 },
  cancelledBadge: { marginTop: 8, paddingHorizontal: 16, paddingVertical: 6, borderRadius: 20 },
  cancelledText: { fontSize: 14 },

  section: { padding: 20, borderRadius: 16, borderWidth: 1, gap: 16 },
  sectionTitle: { fontSize: 16, textAlign: 'right', marginBottom: 4 },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 4 },
  detailLabel: { fontSize: 14 },
  detailValue: { fontSize: 15, flex: 1, textAlign: 'left', paddingRight: 16 },

  timeline: { gap: 0 },
  timelineStepContainer: { flexDirection: 'row-reverse', alignItems: 'flex-start' },
  timelineIconContainer: { width: 30, alignItems: 'center' },
  timelineDot: { width: 24, height: 24, borderRadius: 12, borderWidth: 2, alignItems: 'center', justifyContent: 'center', zIndex: 2 },
  timelineLine: { width: 2, height: 40, marginTop: -2, zIndex: 1 },
  timelineContent: { flex: 1, paddingRight: 12, paddingBottom: 30, paddingTop: 2 },
  timelineLabel: { fontSize: 15, textAlign: 'right' },

  bottomActions: { paddingHorizontal: 16, paddingTop: 16, borderTopWidth: 1, gap: 12 },
  actionGrid: { flexDirection: 'row', gap: 12 },
  actionBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14, borderRadius: 12 },
  actionBtnText: { fontSize: 15 },
  supportBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14, borderRadius: 12, borderWidth: 1.5 },
  supportBtnText: { fontSize: 15 },
});