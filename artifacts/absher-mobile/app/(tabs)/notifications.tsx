import React, { useState } from 'react';
import { FlatList, Platform, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { useColors } from '@/hooks/useColors';
import { useLanguage } from '@/context/LanguageContext';
import { useListNotifications, useMarkNotificationRead, useMarkAllNotificationsRead } from '@workspace/api-client-react';
import type { Notification } from '@workspace/api-client-react';
import { EmptyState } from '@/components/EmptyState';

function getNotifIcon(type?: string | null): keyof typeof Ionicons.glyphMap {
  if (!type) return 'notifications-outline';
  if (type.includes('flight') || type.includes('booking')) return 'airplane-outline';
  if (type.includes('visa') || type.includes('application')) return 'globe-outline'; // In mockup, visa is passport icon? We use globe or document
  if (type.includes('program')) return 'pricetag-outline';
  if (type.includes('promo') || type.includes('offer')) return 'pricetag-outline';
  if (type.includes('alert')) return 'document-text-outline';
  return 'information-circle-outline';
}

function getNotifColor(type?: string | null): string {
  if (!type) return '#6B7280';
  if (type.includes('flight') || type.includes('booking')) return '#0A2342';
  if (type.includes('visa') || type.includes('application')) return '#10B981'; // Greenish
  if (type.includes('program')) return '#D4A017'; // Gold
  if (type.includes('promo') || type.includes('offer')) return '#D4A017';
  if (type.includes('alert')) return '#EF4444'; // Red
  return '#6B7280';
}

function formatNotifDate(iso: string, lang: string): string {
  // Simple mockup formatting: "منذ 1 ساعة"
  const date = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffH = Math.floor(diffMin / 60);
  const diffD = Math.floor(diffH / 24);

  if (lang === 'ar') {
    if (diffMin < 1) return 'الآن';
    if (diffMin < 60) return `منذ ${diffMin} دقيقة`;
    if (diffH < 24) return `منذ ${diffH} ساعة`;
    if (diffD === 1) return 'منذ يوم';
    return `منذ ${diffD} يوم`;
  } else {
    if (diffMin < 1) return 'Just now';
    if (diffMin < 60) return `${diffMin}m ago`;
    if (diffH < 24) return `${diffH}h ago`;
    if (diffD === 1) return '1d ago';
    return `${diffD}d ago`;
  }
}

function NotifItem({ notification, onMarkRead }: { notification: Notification; onMarkRead: (id: string) => void }) {
  const colors = useColors();
  const { lang, isRTL } = useLanguage();
  const icon = getNotifIcon(notification.relatedEntityType);
  const iconColor = getNotifColor(notification.relatedEntityType);
  const isUnread = !notification.isRead;
  const title = lang === 'ar' ? notification.titleAr : (notification.titleEn || notification.titleAr);
  const message = lang === 'ar' ? notification.messageAr : (notification.messageEn || notification.messageAr);

  return (
    <Pressable
      style={({ pressed }) => [
        styles.card,
        {
          backgroundColor: colors.card,
          flexDirection: isRTL ? 'row-reverse' : 'row',
          opacity: pressed ? 0.7 : 1,
        },
      ]}
      onPress={() => {
        if (isUnread) {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          onMarkRead(notification.id);
        }
        const entityId = notification.relatedEntityId;
        if (notification.relatedEntityType === 'visa_application' && entityId) {
          router.push(`/visa-tracking/${entityId}` as never);
          return;
        }
        if (notification.relatedEntityType === 'umrah_application' && entityId) {
          router.push(`/umrah-tracking/${entityId}` as never);
          return;
        }
        const url = (notification as any).url;
        if (typeof url === 'string' && url.length > 0) {
          router.push(url as never);
        }
      }}
    >
      {/* Unread dot - positioned at the start edge */}
      <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: isUnread ? '#0A2342' : 'transparent', marginTop: 8 }} />

      <View style={[styles.cardContent, { alignItems: isRTL ? 'flex-end' : 'flex-start' }]}>
        <Text style={[styles.cardTitle, { color: colors.text, fontFamily: 'Cairo_700Bold' }]}>{title}</Text>
        <Text style={[styles.cardMessage, { color: colors.textSecondary, fontFamily: 'Cairo_400Regular', textAlign: isRTL ? 'right' : 'left' }]} numberOfLines={2}>
          {message}
        </Text>
      </View>

      <View style={styles.cardRight}>
        <View style={[styles.iconWrap, { backgroundColor: `${iconColor}15` }]}>
          <Ionicons name={icon} size={24} color={iconColor} />
          {isUnread && (
            <View style={styles.statusCheck}>
              <Ionicons name="checkmark-circle" size={14} color="#3B82F6" />
            </View>
          )}
        </View>
        <Text style={[styles.dateText, { color: colors.textSecondary, fontFamily: 'Cairo_400Regular' }]}>
          {formatNotifDate(notification.createdAt, lang)}
        </Text>
      </View>
    </Pressable>
  );
}

export default function NotificationsTab() {
  const colors = useColors();
  const { t, lang, isRTL } = useLanguage();
  const insets = useSafeAreaInsets();
  
  const { data, isLoading, error, refetch, isRefetching } = useListNotifications();
  const markRead = useMarkNotificationRead();
  const notifications: Notification[] = Array.isArray(data) ? data : [];

  const [activeFilter, setActiveFilter] = useState('all');

  const filters = [
    { id: 'all', label: lang === 'ar' ? 'الكل' : 'All' },
    { id: 'unread', label: lang === 'ar' ? 'غير مقروءة' : 'Unread' },
    { id: 'alerts', label: lang === 'ar' ? 'تنبيهات' : 'Alerts' },
    { id: 'offers', label: lang === 'ar' ? 'عروض وخصومات' : 'Offers' },
  ];

  const filteredNotifs = notifications.filter(n => {
    if (activeFilter === 'unread') return !n.isRead;
    if (activeFilter === 'alerts') return n.relatedEntityType?.includes('alert') || n.relatedEntityType?.includes('visa');
    if (activeFilter === 'offers') return n.relatedEntityType?.includes('promo') || n.relatedEntityType?.includes('offer');
    return true;
  });

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <FlatList
        data={filteredNotifs}
        keyExtractor={(n) => n.id}
        contentContainerStyle={{ paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={() => refetch()} tintColor={colors.primary} />}
        ListHeaderComponent={
          <View style={[styles.header, { paddingTop: Math.max(insets.top + 16, 40) }]}>
            {/* Top Bar */}
            <View style={[styles.topBar, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
              <Pressable onPress={() => {}} style={[styles.iconBtn, { backgroundColor: colors.card }]}>
                <Ionicons name="options-outline" size={24} color={colors.primary} />
              </Pressable>
              
              <View style={styles.logoWrap}>
                <Image
                  source={require('@/assets/images/absher-travel-logo-nobg.png')}
                  style={styles.logo}
                  contentFit="contain"
                  tintColor={colors.primary}
                />
              </View>
              
              <View style={[styles.langPill, { backgroundColor: colors.card }]}>
                <Text style={[styles.langText, { color: colors.primary }]}>{lang === 'ar' ? 'AR' : 'EN'}</Text>
                <Ionicons name="globe-outline" size={16} color={colors.primary} />
              </View>
            </View>

            {/* Title Area */}
            <View style={styles.titleArea}>
              <Text style={[styles.title, { color: colors.primary, fontFamily: 'Cairo_700Bold', textAlign: 'center' }]}>
                {lang === 'ar' ? 'الإشعارات' : 'Notifications'}
              </Text>
              <Text style={[styles.subtitle, { color: colors.textSecondary, fontFamily: 'Cairo_400Regular', textAlign: 'center' }]}>
                {lang === 'ar' ? 'جميع التنبيهات والتحديثات الخاصة بك' : 'All your alerts and updates'}
              </Text>
              <View style={[styles.divider, { backgroundColor: colors.accent }]} />
            </View>

            {/* Filters */}
            <View style={[styles.filtersRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
              {filters.map(f => (
                <Pressable
                  key={f.id}
                  onPress={() => setActiveFilter(f.id)}
                  style={[
                    styles.filterChip,
                    { backgroundColor: activeFilter === f.id ? colors.primary : colors.card }
                  ]}
                >
                  <Text style={[
                    styles.filterText,
                    { color: activeFilter === f.id ? '#FFFFFF' : colors.textSecondary, fontFamily: activeFilter === f.id ? 'Cairo_700Bold' : 'Cairo_600SemiBold' }
                  ]}>
                    {f.label}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>
        }
        ListEmptyComponent={
          !isLoading ? (
            <EmptyState
              icon="notifications-off-outline"
              title={lang === 'ar' ? 'لا توجد إشعارات' : 'No notifications'}
              description=""
            />
          ) : null
        }
        renderItem={({ item }) => (
          <NotifItem notification={item} onMarkRead={(id) => markRead.mutate({ id }, { onSuccess: () => refetch() })} />
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 20, paddingBottom: 16, zIndex: 1 },
  topBar: { justifyContent: 'space-between', alignItems: 'center' },
  iconBtn: {
    width: 44, height: 44, borderRadius: 22,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2
  },
  logoWrap: { height: 50, width: 120 },
  logo: { flex: 1 },
  langPill: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2
  },
  langText: { fontSize: 12, fontFamily: 'Cairo_700Bold' },
  titleArea: { marginTop: 24, alignItems: 'center' },
  title: { fontSize: 22 },
  subtitle: { fontSize: 13, marginTop: 4 },
  divider: { width: 40, height: 2, borderRadius: 1, marginTop: 12 },
  filtersRow: { marginTop: 24, gap: 8, flexWrap: 'wrap' },
  filterChip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
  filterText: { fontSize: 13 },
  card: {
    marginHorizontal: 20, marginBottom: 12, padding: 16,
    borderRadius: 16, alignItems: 'flex-start', gap: 12,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.03, shadowRadius: 12, elevation: 2
  },
  cardContent: { flex: 1, gap: 4 },
  cardTitle: { fontSize: 14 },
  cardMessage: { fontSize: 12, lineHeight: 18 },
  cardRight: { alignItems: 'center', gap: 8 },
  iconWrap: { width: 48, height: 48, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  statusCheck: { position: 'absolute', bottom: -4, right: -4, borderRadius: 8 },
  dateText: { fontSize: 11 },
});