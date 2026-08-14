/**
 * bookings.tsx — شاشة طلباتي — ABSHER TRAVEL Premium
 * عرض جميع حجوزات المستخدم مع تصميم فاخر يتماشى مع هوية العلامة
 */
import React, { useState, useMemo } from 'react';
import {
  FlatList,
  Platform,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
  ScrollView,
} from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { useLanguage } from '@/context/LanguageContext';
import { useColors } from '@/hooks/useColors';
import { useListMyBookings } from '@workspace/api-client-react';
import type { Booking } from '@workspace/api-client-react';
import { EmptyState } from '@/components/EmptyState';

// Formatter
function formatDate(iso: string, lang: string) {
  if (!iso) return '---';
  return new Date(iso).toLocaleDateString(lang === 'ar' ? 'ar-EG' : 'en-US', { day: 'numeric', month: 'long', year: 'numeric' });
}

export default function BookingsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { t, lang, isRTL } = useLanguage();
  const topInset = Platform.OS === 'web' ? 20 : insets.top;
  
  const { data, isLoading, error, refetch, isRefetching } = useListMyBookings();
  const bookings: Booking[] = Array.isArray(data) ? data : [];

  const [activeFilter, setActiveFilter] = useState('all');

  const filters = [
    { id: 'all', label: lang === 'ar' ? 'الكل' : 'All' },
    { id: 'visa', label: lang === 'ar' ? 'التأشيرات' : 'Visas' },
    { id: 'umrah', label: lang === 'ar' ? 'تأشيرة العمرة' : 'Umrah' },
    { id: 'flight', label: lang === 'ar' ? 'حجوزات الطيران' : 'Flights' },
    { id: 'hotel', label: lang === 'ar' ? 'حجوزات الفنادق' : 'Hotels' },
  ];

  const stats = useMemo(() => [
    { id: 'pending', label: lang === 'ar' ? 'في الانتظار' : 'Pending', count: bookings.filter(b => b.status === 'pending').length, icon: 'time-outline', color: '#D97706', bg: '#FEF3C7' },
    { id: 'confirmed', label: lang === 'ar' ? 'مكتملة' : 'Completed', count: bookings.filter(b => b.status === 'confirmed').length, icon: 'checkmark-outline', color: '#059669', bg: '#D1FAE5' },
    { id: 'processing', label: lang === 'ar' ? 'قيد المعالجة' : 'Processing', count: 0, icon: 'airplane-outline', color: '#0284C7', bg: '#E0F2FE' },
    { id: 'cancelled', label: lang === 'ar' ? 'مرفوضة' : 'Rejected', count: bookings.filter(b => b.status === 'cancelled').length, icon: 'close-outline', color: '#DC2626', bg: '#FEE2E2' },
  ], [bookings, lang]);

  const filteredBookings = useMemo(() => {
    return bookings.filter(b => {
      if (activeFilter === 'all') return true;
      if (activeFilter === 'umrah') return (b.type as string) === 'program' || (b.type as string) === 'umrah';
      return b.type === activeFilter;
    });
  }, [bookings, activeFilter]);

  const renderBookingCard = ({ item }: { item: Booking }) => {
    // Status config
    let statusConf;
    switch (item.status) {
      case 'pending': statusConf = { label: t('status.pending') || 'في الانتظار', color: '#D97706', bg: '#FEF3C7' }; break;
      case 'confirmed': statusConf = { label: t('status.confirmed') || 'مكتملة', color: '#059669', bg: '#D1FAE5' }; break;
      case 'cancelled': statusConf = { label: t('status.cancelled') || 'مرفوضة', color: '#DC2626', bg: '#FEE2E2' }; break;
      default: statusConf = { label: item.status, color: '#6B7280', bg: '#F3F4F6' }; break;
    }

    // Type config
    let typeConf;
    switch (item.type) {
      case 'flight': typeConf = { label: t('booking.type.flight') || 'حجز طيران', icon: 'airplane', color: '#059669', bg: '#D1FAE5', prefix: 'FLY' }; break;
      case 'hotel': typeConf = { label: t('booking.type.hotel') || 'حجز فندق', icon: 'bed', color: '#4F46E5', bg: '#E0E7FF', prefix: 'HTL' }; break;
      case 'program': typeConf = { label: t('booking.type.program') || 'تأشيرة عمرة', icon: 'cube', color: '#D97706', bg: '#FEF3C7', prefix: 'UMRAH' }; break;
      case 'visa': typeConf = { label: t('booking.type.visa') || 'تأشيرة سياحية', icon: 'book', color: '#0284C7', bg: '#E0F2FE', prefix: 'VISA' }; break;
      default: typeConf = { label: item.type, icon: 'document-text', color: '#6B7280', bg: '#F3F4F6', prefix: 'REQ' }; break;
    }

    const year = new Date(item.createdAt).getFullYear() || new Date().getFullYear();
    const formattedId = `#${typeConf.prefix}-${year}-${item.id}`;

    return (
      <View style={[styles.card, { backgroundColor: colors.card, flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
        {/* Right side: Icon */}
        <View style={[styles.cardIconBox, { backgroundColor: typeConf.bg }]}>
          <Ionicons name={typeConf.icon as any} size={22} color={typeConf.color} />
        </View>

        {/* Middle: Info */}
        <View style={[styles.cardInfo, { alignItems: isRTL ? 'flex-end' : 'flex-start' }]}>
          <Text style={[styles.cardTitle, { color: colors.primary, fontFamily: 'Cairo_700Bold' }]} numberOfLines={1}>
            {typeConf.label} {item.destination ? `- ${item.destination}` : ''}
          </Text>
          <Text style={[styles.cardSub, { color: colors.textSecondary, fontFamily: 'Cairo_400Regular' }]}>
            {lang === 'ar' ? 'رقم الطلب:' : 'Order No:'} {formattedId}
          </Text>
          <Text style={[styles.cardSub, { color: colors.textSecondary, fontFamily: 'Cairo_400Regular' }]}>
            {lang === 'ar' ? 'تاريخ الطلب:' : 'Date:'} {formatDate(item.createdAt, lang)}
          </Text>
        </View>

        {/* Left side: Actions */}
        <View style={[styles.cardActions, { alignItems: isRTL ? 'flex-start' : 'flex-end' }]}>
          <View style={[styles.statusChip, { backgroundColor: statusConf.bg }]}>
            <View style={[styles.statusDot, { backgroundColor: statusConf.color }]} />
            <Text style={[styles.statusText, { color: statusConf.color, fontFamily: 'Cairo_600SemiBold' }]}>
              {statusConf.label}
            </Text>
          </View>
          <Pressable 
            style={({ pressed }) => [styles.detailsBtn, { borderColor: colors.border, opacity: pressed ? 0.7 : 1 }]} 
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.push(`/booking/${item.id}` as any);
            }}
          >
            <Text style={[styles.detailsBtnText, { color: colors.textSecondary, fontFamily: 'Cairo_600SemiBold' }]}>
              {lang === 'ar' ? 'عرض التفاصيل' : 'Details'}
            </Text>
          </Pressable>
        </View>

        {/* Chevron */}
        <View style={[styles.chevronBox, { marginLeft: isRTL ? 0 : 6, marginRight: isRTL ? 6 : 0 }]}>
          <Ionicons name={isRTL ? 'chevron-back' : 'chevron-forward'} size={18} color={colors.textSecondary} />
        </View>
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: Math.max(topInset + 16, 40), backgroundColor: colors.background }]}>
        <View style={[styles.topBar, { flexDirection: 'row' }]}>
          <Pressable style={styles.iconBtn} onPress={() => { if(router.canGoBack()) router.back(); else router.push('/(tabs)'); }}>
            <Ionicons name="chevron-back" size={23} color={colors.primary} />
          </Pressable>
          <Image source={require('@/assets/images/absher-travel-logo-nobg.png')} style={styles.logo} contentFit="contain" />
          <Pressable style={styles.langPill} onPress={() => {}}>
            <Text style={[styles.lang, { color: colors.primary }]}>{lang === 'ar' ? 'AR' : 'EN'}</Text>
            <Ionicons name="globe-outline" size={16} color={colors.primary} />
          </Pressable>
        </View>
      </View>

      {/* Main List */}
      <FlatList
        data={filteredBookings}
        keyExtractor={b => String(b.id)}
        renderItem={renderBookingCard}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={colors.accent} />}
        ListHeaderComponent={
          <View style={styles.listHeaderContainer}>
            {/* Page Titles */}
            <View style={[styles.pageTitleContainer, { alignItems: 'center' }]}>
              <Text style={[styles.pageTitle, { color: colors.primary, fontFamily: 'Cairo_700Bold' }]}>
                {t('nav.bookings') || 'طلباتي'}
              </Text>
              <Text style={[styles.pageSubtitle, { color: colors.textSecondary, fontFamily: 'Cairo_400Regular' }]}>
                {lang === 'ar' ? 'تابع جميع طلباتك وحالة كل طلب بسهولة' : 'Track all your requests and their status easily'}
              </Text>
              <View style={[styles.titleUnderline, { backgroundColor: colors.accent }]} />
            </View>

            {/* Filters */}
            <View style={styles.filtersWrapper}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={[styles.filtersContent, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                {filters.map((f, i) => (
                  <Pressable 
                    key={f.id} 
                    style={[
                      styles.filterChip, 
                      activeFilter === f.id ? { backgroundColor: colors.primary } : { backgroundColor: colors.card }
                    ]} 
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      setActiveFilter(f.id);
                    }}
                  >
                    <Text style={[
                      styles.filterText, 
                      { 
                        color: activeFilter === f.id ? '#FFFFFF' : colors.text, 
                        fontFamily: activeFilter === f.id ? 'Cairo_700Bold' : 'Cairo_600SemiBold' 
                      }
                    ]}>
                      {f.label}
                    </Text>
                  </Pressable>
                ))}
              </ScrollView>
            </View>

            {/* Stats Grid */}
            <View style={[styles.statsGrid, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
              {stats.map(s => (
                <View key={s.id} style={[styles.statCard, { backgroundColor: colors.card }]}>
                  <View style={[styles.statIconWrapper, { borderColor: `${s.color}60` }]}>
                    <Ionicons name={s.icon as any} size={14} color={s.color} />
                  </View>
                  <Text style={[styles.statCount, { color: colors.primary, fontFamily: 'Cairo_700Bold' }]}>{s.count}</Text>
                  <Text style={[styles.statLabel, { color: colors.textSecondary, fontFamily: 'Cairo_400Regular' }]}>{s.label}</Text>
                </View>
              ))}
            </View>

            {/* Section Title */}
            <View style={[styles.listSectionHeader, { alignItems: isRTL ? 'flex-end' : 'flex-start' }]}>
              <Text style={[styles.listTitle, { color: colors.primary, fontFamily: 'Cairo_700Bold' }]}>
                {lang === 'ar' ? 'قائمة الطلبات' : 'Requests List'}
              </Text>
              <View style={[styles.listTitleUnderline, { backgroundColor: colors.accent }]} />
            </View>

            {/* Empty States */}
            {error ? (
              <EmptyState
                icon="calendar-outline"
                title={t('tracking.error.title')}
                description={t('tracking.error.desc')}
                actionLabel={t('common.retry')}
                onAction={() => refetch()}
              />
            ) : isLoading ? (
              <EmptyState loading title={t('common.loading')} />
            ) : filteredBookings.length === 0 ? (
              <EmptyState
                icon="calendar-outline"
                title={t('tracking.empty.noRequestsTitle') || 'لا توجد طلبات'}
                description={t('tracking.empty.noRequestsDesc') || 'لم تقم بتقديم أي طلبات بعد.'}
                actionLabel={t('booking.searchFlights') || 'احجز الآن'}
                onAction={() => router.push('/(tabs)/flights')}
              />
            ) : null}
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  topBar: {
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  iconBtn: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
    shadowColor: '#0A2342',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
  },
  logo: {
    width: 130,
    height: 40,
  },
  langPill: {
    flexDirection: 'row',
    gap: 4,
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    elevation: 2,
    shadowColor: '#0A2342',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
  },
  lang: {
    fontFamily: 'Cairo_700Bold',
    fontSize: 12,
  },
  listHeaderContainer: {
    paddingBottom: 10,
  },
  pageTitleContainer: {
    marginTop: 12,
    marginBottom: 24,
    gap: 6,
  },
  pageTitle: {
    fontSize: 22,
  },
  pageSubtitle: {
    fontSize: 13,
  },
  titleUnderline: {
    width: 35,
    height: 2,
    borderRadius: 2,
    marginTop: 4,
  },
  filtersWrapper: {
    marginBottom: 20,
  },
  filtersContent: {
    paddingHorizontal: 20,
    gap: 10,
  },
  filterChip: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 24,
    shadowColor: '#0A2342',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  filterText: {
    fontSize: 13,
  },
  statsGrid: {
    paddingHorizontal: 20,
    gap: 10,
    marginBottom: 30,
    justifyContent: 'space-between',
  },
  statCard: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 4,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#0A2342',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 1,
    gap: 6,
  },
  statIconWrapper: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  statCount: {
    fontSize: 17,
    lineHeight: 22,
  },
  statLabel: {
    fontSize: 10,
    textAlign: 'center',
  },
  listSectionHeader: {
    paddingHorizontal: 20,
    marginBottom: 16,
    gap: 6,
  },
  listTitle: {
    fontSize: 16,
  },
  listTitleUnderline: {
    width: 25,
    height: 2,
    borderRadius: 2,
  },
  card: {
    marginHorizontal: 20,
    borderRadius: 16,
    padding: 14,
    marginBottom: 14,
    shadowColor: '#0A2342',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
    alignItems: 'center',
  },
  cardIconBox: {
    width: 52,
    height: 52,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardInfo: {
    flex: 1,
    marginHorizontal: 12,
    gap: 5,
  },
  cardTitle: {
    fontSize: 14,
  },
  cardSub: {
    fontSize: 11,
  },
  cardActions: {
    gap: 10,
    justifyContent: 'center',
  },
  statusChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 12,
    gap: 5,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontSize: 10,
  },
  detailsBtn: {
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  detailsBtnText: {
    fontSize: 10,
  },
  chevronBox: {
    justifyContent: 'center',
  }
});
