import React, { useState, useEffect, useCallback } from 'react';
import {
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { useColors } from '@/hooks/useColors';
import { useLanguage } from '@/context/LanguageContext';
import {
  useGetNotificationPreferences,
  useUpdateNotificationPreferences,
  type NotificationPreferencesUpdate,
} from '@workspace/api-client-react';
import { useQueryClient } from '@tanstack/react-query';

interface PrefToggle {
  key: keyof NotificationPreferencesUpdate;
  titleAr: string;
  titleEn: string;
  descAr: string;
  descEn: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
}

const CATEGORY_PREFS: PrefToggle[] = [
  {
    key: 'notifyBooking',
    titleAr: 'الحجوزات والرحلات',
    titleEn: 'Bookings & flights',
    descAr: 'تحديثات حجوزاتك ورحلاتك الجوية',
    descEn: 'Updates on your bookings and flights',
    icon: 'airplane-outline',
    color: '#0A2342',
  },
  {
    key: 'notifyVisa',
    titleAr: 'التأشيرات والعمرة',
    titleEn: 'Visas & Umrah',
    descAr: 'تحديثات طلبات التأشيرة والعمرة',
    descEn: 'Updates on your visa and Umrah applications',
    icon: 'globe-outline',
    color: '#10B981',
  },
  {
    key: 'notifyPromo',
    titleAr: 'العروض والبرامج',
    titleEn: 'Offers & programs',
    descAr: 'عروض سياحية وبرامج خاصة',
    descEn: 'Tourism offers and special programs',
    icon: 'pricetag-outline',
    color: '#D4A017',
  },
  {
    key: 'notifySystem',
    titleAr: 'إشعارات النظام',
    titleEn: 'System notifications',
    descAr: 'تنبيهات حسابك والإشعارات الإدارية',
    descEn: 'Account alerts and admin messages',
    icon: 'information-circle-outline',
    color: '#6366F1',
  },
];

export default function NotificationSettingsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { lang, isRTL } = useLanguage();
  const queryClient = useQueryClient();

  const topInset = Platform.OS === 'web' ? 67 : Math.max(insets.top + 16, 40);
  const bottomInset = Platform.OS === 'web' ? 34 : Math.max(insets.bottom, 20);

  const { data: prefs, isLoading } = useGetNotificationPreferences();
  const { mutate: savePrefs, isPending: isSaving } = useUpdateNotificationPreferences();

  // Local state mirrors server state; updated optimistically on toggle
  const [local, setLocal] = useState<NotificationPreferencesUpdate>({
    pushEnabled: true,
    notifyBooking: true,
    notifyVisa: true,
    notifyPromo: true,
    notifySystem: true,
  });

  useEffect(() => {
    if (prefs) {
      setLocal({
        pushEnabled: prefs.pushEnabled,
        notifyBooking: prefs.notifyBooking,
        notifyVisa: prefs.notifyVisa,
        notifyPromo: prefs.notifyPromo,
        notifySystem: prefs.notifySystem,
      });
    }
  }, [prefs]);

  const toggle = useCallback(
    (key: keyof NotificationPreferencesUpdate, value: boolean) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      const next = { ...local, [key]: value };
      setLocal(next);

      savePrefs(
        { data: { [key]: value } },
        {
          onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['/api/notification-preferences'] });
          },
          onError: () => {
            // Revert on error
            setLocal((prev: NotificationPreferencesUpdate) => ({ ...prev, [key]: !value }));
            Alert.alert(
              lang === 'ar' ? 'خطأ' : 'Error',
              lang === 'ar' ? 'فشل حفظ الإعداد' : 'Failed to save setting',
            );
          },
        },
      );
    },
    [local, savePrefs, queryClient, lang],
  );

  const pushOff = local.pushEnabled === false;

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={{ paddingBottom: bottomInset + 20 }}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={[styles.header, { paddingTop: topInset }]}>
        <View style={[styles.headerRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
          <Pressable
            style={[styles.backBtn, { backgroundColor: colors.card }]}
            onPress={() => router.back()}
          >
            <Ionicons
              name={isRTL ? 'chevron-forward' : 'chevron-back'}
              size={22}
              color={colors.primary}
            />
          </Pressable>
          <Text style={[styles.headerTitle, { color: colors.text, fontFamily: 'Cairo_700Bold' }]}>
            {lang === 'ar' ? 'إعدادات الإشعارات' : 'Notification settings'}
          </Text>
          <View style={{ width: 44 }} />
        </View>
      </View>

      {isLoading ? (
        <View style={styles.loader}>
          <ActivityIndicator color={colors.primary} size="large" />
        </View>
      ) : (
        <View style={{ paddingHorizontal: 20, gap: 16 }}>

          {/* Master push switch */}
          <View style={[styles.card, { backgroundColor: colors.card, shadowColor: colors.primary }]}>
            <View style={[styles.row, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
              <View style={[styles.iconWrap, { backgroundColor: pushOff ? colors.border : `${colors.primary}18` }]}>
                <Ionicons
                  name="notifications-outline"
                  size={22}
                  color={pushOff ? colors.textSecondary : colors.primary}
                />
              </View>
              <View style={[styles.textBlock, { alignItems: isRTL ? 'flex-end' : 'flex-start' }]}>
                <Text style={[styles.rowTitle, { color: colors.text, fontFamily: 'Cairo_600SemiBold' }]}>
                  {lang === 'ar' ? 'الإشعارات الفورية' : 'Push notifications'}
                </Text>
                <Text style={[styles.rowDesc, { color: colors.textSecondary, fontFamily: 'Cairo_400Regular', textAlign: isRTL ? 'right' : 'left' }]}>
                  {lang === 'ar'
                    ? 'استقبال الإشعارات على جهازك'
                    : 'Receive notifications on your device'}
                </Text>
              </View>
              <Switch
                value={local.pushEnabled ?? true}
                onValueChange={(v) => toggle('pushEnabled', v)}
                trackColor={{ false: colors.border, true: `${colors.primary}80` }}
                thumbColor={local.pushEnabled ? colors.primary : colors.textSecondary}
                disabled={isSaving}
              />
            </View>
          </View>

          {/* Category toggles */}
          {!pushOff && (
            <>
              <Text style={[styles.sectionLabel, { color: colors.textSecondary, fontFamily: 'Cairo_600SemiBold', textAlign: isRTL ? 'right' : 'left' }]}>
                {lang === 'ar' ? 'أنواع الإشعارات' : 'Notification types'}
              </Text>
              <View style={[styles.card, { backgroundColor: colors.card, shadowColor: colors.primary }]}>
                {CATEGORY_PREFS.map((pref, idx) => {
                  const enabled = local[pref.key] ?? true;
                  const isLast = idx === CATEGORY_PREFS.length - 1;
                  return (
                    <View key={String(pref.key)}>
                      <View style={[styles.row, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                        <View style={[styles.iconWrap, { backgroundColor: enabled ? `${pref.color}18` : colors.border }]}>
                          <Ionicons
                            name={pref.icon}
                            size={20}
                            color={enabled ? pref.color : colors.textSecondary}
                          />
                        </View>
                        <View style={[styles.textBlock, { alignItems: isRTL ? 'flex-end' : 'flex-start' }]}>
                          <Text style={[styles.rowTitle, { color: enabled ? colors.text : colors.textSecondary, fontFamily: 'Cairo_600SemiBold' }]}>
                            {lang === 'ar' ? pref.titleAr : pref.titleEn}
                          </Text>
                          <Text style={[styles.rowDesc, { color: colors.textSecondary, fontFamily: 'Cairo_400Regular', textAlign: isRTL ? 'right' : 'left' }]}>
                            {lang === 'ar' ? pref.descAr : pref.descEn}
                          </Text>
                        </View>
                        <Switch
                          value={enabled}
                          onValueChange={(v) => toggle(pref.key, v)}
                          trackColor={{ false: colors.border, true: `${pref.color}80` }}
                          thumbColor={enabled ? pref.color : colors.textSecondary}
                          disabled={isSaving}
                        />
                      </View>
                      {!isLast && <View style={[styles.divider, { backgroundColor: colors.border }]} />}
                    </View>
                  );
                })}
              </View>
            </>
          )}

          {/* Info note */}
          <View style={[styles.infoBox, { backgroundColor: `${colors.primary}0D`, borderColor: `${colors.primary}30` }]}>
            <Ionicons name="information-circle-outline" size={18} color={colors.primary} style={{ marginTop: 1 }} />
            <Text style={[styles.infoText, { color: colors.primary, fontFamily: 'Cairo_400Regular', textAlign: isRTL ? 'right' : 'left' }]}>
              {lang === 'ar'
                ? 'يتم حفظ إعداداتك فوراً. ستظل الإشعارات تظهر في صندوق الإشعارات حتى عند إيقاف الإشعارات الفورية.'
                : 'Settings are saved instantly. Notifications still appear in your inbox even when push is off.'}
            </Text>
          </View>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 20, paddingBottom: 20 },
  headerRow: { alignItems: 'center', justifyContent: 'space-between' },
  backBtn: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8 },
  headerTitle: { fontSize: 18 },
  loader: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 60 },
  sectionLabel: { fontSize: 13, paddingHorizontal: 4 },
  card: { borderRadius: 20, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.04, shadowRadius: 12, elevation: 2, overflow: 'hidden' },
  row: { alignItems: 'center', padding: 16, gap: 12 },
  iconWrap: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  textBlock: { flex: 1, gap: 2 },
  rowTitle: { fontSize: 14 },
  rowDesc: { fontSize: 12, lineHeight: 18 },
  divider: { height: StyleSheet.hairlineWidth, marginHorizontal: 16 },
  infoBox: { flexDirection: 'row', gap: 10, padding: 14, borderRadius: 14, borderWidth: 1, alignItems: 'flex-start' },
  infoText: { flex: 1, fontSize: 12, lineHeight: 18 },
});
