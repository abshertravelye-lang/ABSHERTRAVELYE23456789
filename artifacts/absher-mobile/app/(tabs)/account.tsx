import React, { useState } from 'react';
import { Alert, Platform, Pressable, ScrollView, StyleSheet, Text, View, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { Image } from 'expo-image';
import { useColors } from '@/hooks/useColors';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import ConfirmDialog from '@/components/ConfirmDialog';
import { useListVisaApplications, useListMyBookings } from '@workspace/api-client-react';

const COMPLETION_FIELDS = [
  'firstName', 'lastName', 'phone', 'nationality', 'dateOfBirth',
  'passportNumber', 'passportExpiryDate', 'profilePhotoUrl', 'passportImageUrl',
];

export default function AccountScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const topInset = Platform.OS === 'web' ? 67 : Math.max(insets.top + 16, 40);
  const bottomInset = Platform.OS === 'web' ? 34 : Math.max(insets.bottom, 20);
  
  const { user, isLoading, logout } = useAuth();
  const { t, lang, isRTL } = useLanguage();
  const [logoutVisible, setLogoutVisible] = useState(false);
  
  const { data: apps, refetch: refetchApps } = useListVisaApplications();
  const { data: bookings, refetch: refetchBookings } = useListMyBookings();
  const [refreshing, setRefreshing] = useState(false);

  const refresh = async () => {
    setRefreshing(true);
    await Promise.all([refetchApps(), refetchBookings()]);
    setRefreshing(false);
  };

  const handleLogout = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setLogoutVisible(true);
  };

  const confirmLogout = async () => {
    setLogoutVisible(false);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    await logout();
    router.replace('/auth/login');
  };

  if (isLoading) return null;

  // Guest View
  if (!user) {
    return (
      <ScrollView
        style={[styles.container, { backgroundColor: colors.background }]}
        contentContainerStyle={{ paddingBottom: bottomInset + 90 }}
      >
        <View style={[styles.header, { paddingTop: topInset }]}>
          <View style={[styles.topBar, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
            <View style={{ width: 44 }} />
            <Image source={require('@/assets/images/absher-travel-logo-nobg.png')} style={styles.logo} contentFit="contain" />
            <Pressable style={[styles.langPill, { backgroundColor: colors.card }]} onPress={() => {}}>
              <Text style={[styles.lang, { color: colors.primary }]}>{lang === 'ar' ? 'AR' : 'EN'}</Text>
              <Ionicons name="globe-outline" size={16} color={colors.primary} />
            </Pressable>
          </View>
        </View>

        <View style={[styles.guestHero, { backgroundColor: colors.card }]}>
          <View style={[styles.avatarPlaceholder, { backgroundColor: colors.goldTint, borderColor: colors.accent }]}>
            <Ionicons name="person" size={52} color={colors.accent} />
          </View>
          <Text style={[styles.guestTitle, { color: colors.text, fontFamily: 'Cairo_700Bold' }]}>{t('profile.guestWelcome') as string}</Text>
          <Text style={[styles.guestSub, { color: colors.textSecondary, fontFamily: 'Cairo_400Regular' }]}>
            {t('profile.guestSubtitle') as string}
          </Text>
        </View>

        <View style={styles.authButtons}>
          <Pressable
            style={({ pressed }) => [styles.loginBtn, { backgroundColor: colors.primary, opacity: pressed ? 0.9 : 1 }]}
            onPress={() => router.push('/auth/login')}
          >
            <Text style={[styles.loginBtnText, { color: '#FFFFFF', fontFamily: 'Cairo_700Bold' }]}>{t('welcome.login') as string}</Text>
          </Pressable>
          <Pressable
            style={({ pressed }) => [styles.registerBtn, { borderColor: colors.primary, opacity: pressed ? 0.9 : 1 }]}
            onPress={() => router.push('/auth/register')}
          >
            <Text style={[styles.registerBtnText, { color: colors.primary, fontFamily: 'Cairo_600SemiBold' }]}>{t('welcome.register') as string}</Text>
          </Pressable>
        </View>
      </ScrollView>
    );
  }

  const filledCount = COMPLETION_FIELDS.filter((k) => !!(user as any)[k]).length;
  const completion = Math.round((filledCount / COMPLETION_FIELDS.length) * 100);
  const isComplete = completion >= 100;

  const activeCount = (apps?.filter(a => a.status === 'received' || a.status === 'under_review' || a.status === 'awaiting_documents' || a.status === 'documents_uploaded' || a.status === 'sent_to_embassy').length || 0) + (bookings?.filter(b => b.status === 'pending' || b.status === 'confirmed').length || 0);
  const completedCount = (apps?.filter(a => a.status === 'issued' || a.status === 'completed' || a.status === 'rejected' || a.status === 'cancelled').length || 0) + (bookings?.filter(b => b.status === 'cancelled').length || 0);

  const stats = [
    { id: 'active', icon: 'document-text-outline', label: lang === 'ar' ? 'طلبات نشطة' : 'Active requests', count: activeCount },
    { id: 'completed', icon: 'checkmark-circle-outline', label: lang === 'ar' ? 'طلبات مكتملة' : 'Completed', count: completedCount },
  ];

  const menuItems = [
    { id: 'info', icon: 'person-outline', title: lang === 'ar' ? 'المعلومات الشخصية' : 'Personal info', sub: lang === 'ar' ? 'إدارة بياناتك ومعلومات التواصل' : 'Manage your data and contact info', route: '/profile-edit' },
    { id: 'docs', icon: 'id-card-outline', title: lang === 'ar' ? 'الوثائق والمستندات' : 'Documents', sub: lang === 'ar' ? 'إدارة مستنداتك وملفاتك الشخصية' : 'Manage your files and documents', route: '/profile-edit' },
    { id: 'pay', icon: 'wallet-outline', title: lang === 'ar' ? 'وسائل الدفع' : 'Payment methods', sub: lang === 'ar' ? 'إدارة بطاقاتك وطرق الدفع الخاصة بك' : 'Manage your cards and payment methods', route: '/wallet' },
    { id: 'sec', icon: 'shield-checkmark-outline', title: lang === 'ar' ? 'الأمان والخصوصية' : 'Security and Privacy', sub: lang === 'ar' ? 'إعدادات الأمان والخصوصية' : 'Security settings and privacy', route: '/settings' },
    { id: 'notif', icon: 'notifications-outline', title: lang === 'ar' ? 'الإشعارات' : 'Notifications', sub: lang === 'ar' ? 'تخصيص الإشعارات والتنبيهات' : 'Customize notifications and alerts', route: '/notifications' },
    { id: 'help', icon: 'headset-outline', title: lang === 'ar' ? 'الدعم والمساعدة' : 'Help & Support', sub: lang === 'ar' ? 'تواصل معنا للحصول على المساعدة' : 'Contact us for assistance', action: () => router.push('/support-chat') },
    { id: 'logout', icon: 'log-out-outline', title: lang === 'ar' ? 'تسجيل الخروج' : 'Logout', sub: lang === 'ar' ? 'تسجيل الخروج من حسابك' : 'Sign out of your account', action: handleLogout, destructive: true },
  ];

  return (
    <ScrollView 
      style={[styles.container, { backgroundColor: colors.background }]} 
      contentContainerStyle={{ paddingBottom: bottomInset + 90 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={colors.accent} />}
      showsVerticalScrollIndicator={false}
    >
      <View style={[styles.header, { paddingTop: topInset }]}>
        <View style={[styles.topBar, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
          <Pressable style={[styles.iconBtn, { backgroundColor: colors.card }]} onPress={() => router.push('/(tabs)/notifications')}>
            <Ionicons name="notifications-outline" size={23} color={colors.primary} />
          </Pressable>
          <Image source={require('@/assets/images/absher-travel-logo-nobg.png')} style={styles.logo} contentFit="contain" tintColor={colors.primary} />
          <Pressable style={[styles.langPill, { backgroundColor: colors.card }]} onPress={() => {}}>
            <Text style={[styles.lang, { color: colors.primary }]}>{lang === 'ar' ? 'AR' : 'EN'}</Text>
            <Ionicons name="globe-outline" size={16} color={colors.primary} />
          </Pressable>
        </View>
      </View>

      <View style={{ paddingHorizontal: 20, marginTop: 16 }}>
        <View style={[styles.userCard, { backgroundColor: colors.card, shadowColor: colors.primary }]}>
          <View style={[styles.userInfoRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
            
            <View style={[styles.avatarWrap, { borderColor: colors.accent }]}>
              {user.profilePhotoUrl ? (
                <Image source={{ uri: user.profilePhotoUrl }} style={styles.avatarImg} contentFit="cover" />
              ) : (
                <View style={[styles.avatarImg, { backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' }]}>
                  <Text style={{ color: '#FFF', fontSize: 24, fontFamily: 'Cairo_700Bold' }}>{user.firstName?.charAt(0) || user.email?.charAt(0).toUpperCase() || '?'}</Text>
                </View>
              )}
              <View style={[styles.verifiedBadge, { backgroundColor: colors.success, borderColor: colors.card }]}>
                <Ionicons name="checkmark" size={12} color="#FFF" />
              </View>
            </View>

            <View style={[styles.userDetails, { alignItems: isRTL ? 'flex-end' : 'flex-start' }]}>
              <Text style={[styles.userName, { color: colors.text, fontFamily: 'Cairo_700Bold', textAlign: isRTL ? 'right' : 'left' }]}>
                {user.firstName} {user.lastName}
              </Text>
              <Text style={[styles.userEmail, { color: colors.textSecondary, fontFamily: 'Cairo_400Regular', textAlign: isRTL ? 'right' : 'left' }]}>
                {user.email}
              </Text>
              {user.phone && (
                <Text style={[styles.userPhone, { color: colors.textSecondary, fontFamily: 'Cairo_400Regular', textAlign: isRTL ? 'right' : 'left' }]}>
                  {user.phone}
                </Text>
              )}
            </View>
            
            <Pressable onPress={() => router.push('/profile-edit')} style={{ padding: 8 }}>
              <Ionicons name={isRTL ? "chevron-back" : "chevron-forward"} size={20} color={colors.textSecondary} />
            </Pressable>
          </View>

          <View style={[styles.completionBanner, { backgroundColor: isComplete ? `${colors.success}15` : colors.goldTint }]}>
            <View style={{ flexDirection: isRTL ? 'row-reverse' : 'row', alignItems: 'center', justifyContent: 'space-between' }}>
               <View style={{ flexDirection: isRTL ? 'row-reverse' : 'row', alignItems: 'center', gap: 8 }}>
                 <Text style={[styles.completionText, { color: isComplete ? colors.success : colors.warning, fontFamily: 'Cairo_600SemiBold' }]}>
                   {isComplete ? (lang === 'ar' ? 'تم إكمال الملف الشخصي' : 'Profile completed') : (lang === 'ar' ? 'أكمل ملفك الشخصي' : 'Complete your profile')}
                 </Text>
               </View>
               <Ionicons name="checkmark-circle" size={20} color={isComplete ? colors.success : colors.warning} />
            </View>
            {!isComplete && (
               <Text style={[styles.completionSub, { color: colors.textSecondary, fontFamily: 'Cairo_400Regular', textAlign: isRTL ? 'right' : 'left', marginTop: 4 }]}>
                 {lang === 'ar' ? 'ملفك الشخصي غير مكتمل، يرجى إكماله للاستفادة من جميع خدماتنا.' : 'Your profile is incomplete, please complete it.'}
               </Text>
            )}
            {isComplete && (
               <Text style={[styles.completionSub, { color: colors.textSecondary, fontFamily: 'Cairo_400Regular', textAlign: isRTL ? 'right' : 'left', marginTop: 4 }]}>
                 {lang === 'ar' ? 'ملفك الشخصي مكتمل وجاهز للاستفادة من جميع خدماتنا.' : 'Your profile is complete and ready.'}
               </Text>
            )}
          </View>
        </View>

        {stats.length > 0 && (
          <View style={[styles.statsStrip, { backgroundColor: colors.card, shadowColor: colors.primary, flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
            {stats.map((stat, idx) => (
              <React.Fragment key={stat.id}>
                <View style={styles.statItem}>
                  <Ionicons name={stat.icon as any} size={24} color={colors.primary} />
                  <Text style={[styles.statCount, { color: colors.text, fontFamily: 'Cairo_700Bold' }]}>{stat.count}</Text>
                  <Text style={[styles.statLabel, { color: colors.textSecondary, fontFamily: 'Cairo_400Regular' }]}>{stat.label}</Text>
                </View>
                {idx < stats.length - 1 && <View style={[styles.statDivider, { backgroundColor: colors.border }]} />}
              </React.Fragment>
            ))}
          </View>
        )}

        <View style={[styles.menuList, { backgroundColor: colors.card, shadowColor: colors.primary }]}>
          {menuItems.map((item, index) => {
            const isLast = index === menuItems.length - 1;
            const itemColor = item.destructive ? colors.error : colors.primary;
            return (
              <Pressable
                key={item.id}
                style={({ pressed }) => [
                  styles.menuRow,
                  { borderBottomColor: colors.border, opacity: pressed ? 0.7 : 1, flexDirection: isRTL ? 'row-reverse' : 'row' },
                  isLast && { borderBottomWidth: 0 }
                ]}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  if (item.action) item.action();
                  else if (item.route) router.push(item.route as any);
                }}
              >
                <View style={[styles.menuIconWrap, { backgroundColor: item.destructive ? 'rgba(220,38,38,0.1)' : colors.iconBg }]}>
                  <Ionicons name={item.icon as any} size={22} color={itemColor} />
                </View>
                <View style={[styles.menuTextWrap, { alignItems: isRTL ? 'flex-end' : 'flex-start' }]}>
                  <Text style={[styles.menuTitle, { color: item.destructive ? colors.error : colors.text, fontFamily: 'Cairo_600SemiBold', textAlign: isRTL ? 'right' : 'left' }]}>{item.title}</Text>
                  <Text style={[styles.menuSub, { color: colors.textSecondary, fontFamily: 'Cairo_400Regular', textAlign: isRTL ? 'right' : 'left' }]}>{item.sub}</Text>
                </View>
                <Ionicons name={isRTL ? "chevron-back" : "chevron-forward"} size={20} color={colors.textSecondary} />
              </Pressable>
            );
          })}
        </View>

      </View>

      <ConfirmDialog
        visible={logoutVisible}
        icon="log-out-outline"
        confirmStyle="destructive"
        title={t('profile.logoutConfirmTitle') as string || 'هل تريد تسجيل الخروج؟'}
        message={t('profile.logoutConfirmBody') as string || 'هل أنت متأكد أنك تريد تسجيل الخروج من حسابك؟'}
        cancelLabel={t('common.cancel') as string || 'إلغاء'}
        confirmLabel={t('profile.logout') as string || 'تسجيل الخروج'}
        onCancel={() => setLogoutVisible(false)}
        onConfirm={confirmLogout}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 20, paddingBottom: 16 },
  topBar: { justifyContent: 'space-between', alignItems: 'center' },
  iconBtn: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8 },
  logo: { width: 140, height: 40 },
  langPill: { flexDirection: 'row', gap: 5, alignItems: 'center', paddingHorizontal: 12, paddingVertical: 9, borderRadius: 20, elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8 },
  lang: { fontFamily: 'Cairo_700Bold', fontSize: 12 },
  
  guestHero: { margin: 20, padding: 32, alignItems: 'center', borderRadius: 24, shadowColor: '#0A2342', shadowOpacity: 0.05, shadowRadius: 12, elevation: 2 },
  avatarPlaceholder: { width: 90, height: 90, borderRadius: 45, alignItems: 'center', justifyContent: 'center', marginBottom: 16, borderWidth: 2 },
  guestTitle: { fontSize: 22, marginBottom: 8 },
  guestSub: { fontSize: 14, textAlign: 'center', lineHeight: 22 },
  authButtons: { paddingHorizontal: 20, gap: 12 },
  loginBtn: { borderRadius: 16, paddingVertical: 16, alignItems: 'center', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 4 },
  loginBtnText: { fontSize: 16 },
  registerBtn: { borderRadius: 16, paddingVertical: 16, alignItems: 'center', borderWidth: 1.5 },
  registerBtnText: { fontSize: 16 },

  userCard: { borderRadius: 24, padding: 20, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.04, shadowRadius: 12, elevation: 2 },
  userInfoRow: { alignItems: 'center', justifyContent: 'space-between' },
  avatarWrap: { position: 'relative', width: 70, height: 70, borderRadius: 35, borderWidth: 2, padding: 2 },
  avatarImg: { width: '100%', height: '100%', borderRadius: 35 },
  verifiedBadge: { position: 'absolute', bottom: 0, right: 0, width: 22, height: 22, borderRadius: 11, alignItems: 'center', justifyContent: 'center', borderWidth: 2 },
  userDetails: { flex: 1, paddingHorizontal: 16 },
  userName: { fontSize: 18, marginBottom: 2 },
  userEmail: { fontSize: 13, marginBottom: 2 },
  userPhone: { fontSize: 13 },
  completionBanner: { marginTop: 20, padding: 12, borderRadius: 12 },
  completionText: { fontSize: 13 },
  completionSub: { fontSize: 11, lineHeight: 18 },

  statsStrip: { marginTop: 16, borderRadius: 20, paddingVertical: 16, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.04, shadowRadius: 12, elevation: 2, alignItems: 'center', justifyContent: 'space-evenly' },
  statItem: { flex: 1, alignItems: 'center', gap: 4 },
  statCount: { fontSize: 20, marginTop: 4 },
  statLabel: { fontSize: 12 },
  statDivider: { width: 1, height: '60%' },

  menuList: { marginTop: 16, borderRadius: 24, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.04, shadowRadius: 12, elevation: 2, overflow: 'hidden' },
  menuRow: { alignItems: 'center', padding: 16, borderBottomWidth: StyleSheet.hairlineWidth, gap: 12 },
  menuIconWrap: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  menuTextWrap: { flex: 1, gap: 2 },
  menuTitle: { fontSize: 15 },
  menuSub: { fontSize: 12 },
});
