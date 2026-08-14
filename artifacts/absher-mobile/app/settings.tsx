import React, { useEffect, useState } from 'react';
import { Alert, Platform, Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { Image } from 'expo-image';
import { useColors } from '@/hooks/useColors';
import { useTheme } from '@/context/ThemeContext';
import { useLanguage } from '@/context/LanguageContext';
import ConfirmDialog from '@/components/ConfirmDialog';

export default function SettingsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const topInset = Platform.OS === 'web' ? 67 : Math.max(insets.top + 16, 40);
  const bottomInset = Platform.OS === 'web' ? 34 : Math.max(insets.bottom, 20);
  
  const { mode, setMode } = useTheme();
  const { lang, toggle: toggleLang, t, isRTL } = useLanguage();

  const [settings, setSettings] = useState({
    pushNotifs: true,
    emailNotifs: true,
    smsNotifs: false,
    biometrics: false,
  });
  
  const [deleteVisible, setDeleteVisible] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem('@absher_settings').then((val) => {
      if (val) {
        try {
          setSettings(JSON.parse(val));
        } catch {}
      }
    });
  }, []);

  const updateSetting = async (key: keyof typeof settings, value: boolean) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    await AsyncStorage.setItem('@absher_settings', JSON.stringify(newSettings));
  };

  const handlePressComingSoon = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Alert.alert(t('settings.comingSoonTitle') as string || 'قريباً', t('settings.comingSoonBody') as string || 'هذه الميزة ستكون متاحة في التحديث القادم.');
  };

  const handleBiometricsToggle = (v: boolean) => {
    if (v) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      Alert.alert(
        (t('common.comingSoon') as string) || 'قريباً',
        (t('settings.biometricSoonBody') as string) || 'الدخول بالبصمة سيكون متاحاً قريباً.'
      );
    } else {
      updateSetting('biometrics', v);
    }
  };

  const confirmDeleteAccount = () => {
    setDeleteVisible(false);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    router.replace('/(tabs)/' as never);
  };

  const Section = ({ title, children }: { title: string, children: React.ReactNode }) => (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { color: colors.text, fontFamily: 'Cairo_700Bold', textAlign: isRTL ? 'right' : 'left' }]}>{title}</Text>
      <View style={[styles.sectionCard, { backgroundColor: colors.card, shadowColor: colors.primary }]}>
        {children}
      </View>
    </View>
  );

  const RowItem = ({ 
    icon, 
    title, 
    subtitle,
    value, 
    type = 'link', 
    onPress, 
    boolValue, 
    onToggle,
    destructive,
    isLast
  }: any) => (
    <Pressable 
      style={({ pressed }) => [
        styles.row, 
        { borderBottomColor: colors.border, flexDirection: isRTL ? 'row-reverse' : 'row' },
        pressed && type === 'link' ? { opacity: 0.7 } : undefined,
        isLast && { borderBottomWidth: 0 }
      ]}
      onPress={type === 'link' ? onPress || handlePressComingSoon : undefined}
    >
      <View style={[styles.rowIconWrap, { backgroundColor: destructive ? 'rgba(220,38,38,0.1)' : colors.iconBg }]}>
        <Ionicons name={icon} size={20} color={destructive ? colors.error : colors.primary} />
      </View>
      <View style={[styles.rowTextWrap, { alignItems: isRTL ? 'flex-end' : 'flex-start' }]}>
        <Text style={[
          styles.rowTitle, 
          { color: destructive ? colors.error : colors.text, fontFamily: 'Cairo_600SemiBold', textAlign: isRTL ? 'right' : 'left' }
        ]}>{title}</Text>
        {subtitle && <Text style={[styles.rowSubtitle, { color: colors.textSecondary, fontFamily: 'Cairo_400Regular', textAlign: isRTL ? 'right' : 'left' }]}>{subtitle}</Text>}
      </View>
      
      <View style={[styles.rowActionWrap, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
        {type === 'link' && (
          <>
            {value && <Text style={[styles.rowValue, { color: colors.textSecondary, fontFamily: 'Cairo_400Regular' }]}>{value}</Text>}
            <Ionicons name={isRTL ? "chevron-back" : "chevron-forward"} size={18} color={colors.textSecondary} />
          </>
        )}
        {type === 'switch' && (
          <Switch
            value={boolValue}
            onValueChange={onToggle}
            trackColor={{ false: colors.border, true: colors.accent }}
            thumbColor={Platform.OS === 'ios' ? '#FFFFFF' : boolValue ? '#FFFFFF' : '#f4f3f4'}
            style={{ transform: [{ scaleX: 0.8 }, { scaleY: 0.8 }] }}
          />
        )}
      </View>
    </Pressable>
  );

  return (
    <ScrollView showsVerticalScrollIndicator={false} style={[styles.container, { backgroundColor: colors.background }]} contentContainerStyle={{ paddingBottom: bottomInset + 40 }}>
      <View style={[styles.header, { paddingTop: topInset }]}>
        <View style={[styles.topBar, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
          <Pressable style={[styles.iconBtn, { backgroundColor: colors.card }]} onPress={() => router.back()}>
            <Ionicons name={isRTL ? "chevron-forward" : "chevron-back"} size={22} color={colors.primary} />
          </Pressable>
          <Image source={require('@/assets/images/absher-travel-logo-nobg.png')} style={styles.logo} contentFit="contain" tintColor={colors.primary} />
          <Pressable style={[styles.langPill, { backgroundColor: colors.card }]} onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            toggleLang();
          }}>
            <Text style={[styles.lang, { color: colors.primary }]}>{lang === 'ar' ? 'AR' : 'EN'}</Text>
            <Ionicons name="globe-outline" size={16} color={colors.primary} />
          </Pressable>
        </View>
      </View>

      <View style={styles.heroSection}>
        <Text style={[styles.heroTitle, { color: colors.primary, fontFamily: 'Cairo_700Bold' }]}>{lang === 'ar' ? 'الأمان والخصوصية' : 'Security & Privacy'}</Text>
        <Text style={[styles.heroSub, { color: colors.textSecondary, fontFamily: 'Cairo_400Regular' }]}>{lang === 'ar' ? 'إدارة إعدادات الأمان وحماية حسابك وبياناتك' : 'Manage your security settings and protect your data'}</Text>
        
        <View style={[styles.shieldWrap, { backgroundColor: colors.primary }]}>
           <Ionicons name="shield" size={120} color={colors.primary} style={{ position: 'absolute' }} />
           <Ionicons name="shield-outline" size={120} color="rgba(255,255,255,0.06)" />
           <Ionicons name="lock-closed" size={32} color={colors.accent} style={{ position: 'absolute' }} />
        </View>
      </View>

      <View style={{ paddingHorizontal: 20 }}>
        <View style={[styles.secureCard, { backgroundColor: colors.card, shadowColor: colors.primary }]}>
          <View style={[styles.secureRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
            <View style={[styles.secureIconWrap, { backgroundColor: `${colors.success}20` }]}>
               <Ionicons name="shield-checkmark" size={24} color={colors.success} />
            </View>
            <View style={[styles.secureTextWrap, { alignItems: isRTL ? 'flex-end' : 'flex-start' }]}>
               <Text style={[styles.secureTitle, { color: colors.success, fontFamily: 'Cairo_700Bold' }]}>{lang === 'ar' ? 'حسابك آمن' : 'Account Secure'}</Text>
               <Text style={[styles.secureDesc, { color: colors.textSecondary, fontFamily: 'Cairo_400Regular', textAlign: isRTL ? 'right' : 'left' }]}>{lang === 'ar' ? 'تم تأمين حسابك وجميع إعدادات الأمان مفعلة.' : 'Your account is secured and all settings active.'}</Text>
            </View>
          </View>
          
          <View style={[styles.stepsContainer, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
            <View style={[styles.stepLine, { backgroundColor: colors.success }]} />
            {['كلمة المرور', 'التحقق الثنائي', 'البريد الإلكتروني', 'رقم الجوال'].map((step, i) => (
              <View key={step} style={styles.stepItem}>
                <View style={[styles.stepCircle, { backgroundColor: colors.success }]}>
                  <Ionicons name="checkmark" size={12} color="#FFF" />
                </View>
                <Text style={[styles.stepText, { color: colors.textSecondary, fontFamily: 'Cairo_400Regular' }]}>{lang === 'ar' ? step : ['Password', '2FA', 'Email', 'Phone'][i]}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.sectionsContainer}>
          <Section title={lang === 'ar' ? 'إعدادات الأمان' : 'Security Settings'}>
            <RowItem icon="lock-closed-outline" title={lang === 'ar' ? 'كلمة المرور' : 'Password'} subtitle={lang === 'ar' ? 'قم بتغيير كلمة المرور الخاصة بحسابك' : 'Change your account password'} onPress={() => router.push('/profile-edit' as never)} />
            <RowItem icon="shield-checkmark-outline" title={lang === 'ar' ? 'التحقق بخطوتين' : 'Two-Factor Auth'} subtitle={lang === 'ar' ? 'تفعيل ميزة التحقق بخطوتين لزيادة الحماية' : 'Enable 2FA for extra security'} type="switch" boolValue={true} onToggle={() => {}} />
            <RowItem icon="finger-print-outline" title={lang === 'ar' ? 'الدخول بالبصمة' : 'Biometrics'} subtitle={lang === 'ar' ? 'استخدام البصمة لتسجيل الدخول' : 'Use biometrics to login'} type="switch" boolValue={settings.biometrics} onToggle={handleBiometricsToggle} />
            <RowItem icon="desktop-outline" title={lang === 'ar' ? 'جلسات الأجهزة' : 'Active Sessions'} subtitle={lang === 'ar' ? 'عرض وإدارة الأجهزة التي تم تسجيل الدخول منها' : 'Manage your active logged-in devices'} />
            <RowItem icon="time-outline" title={lang === 'ar' ? 'تاريخ الدخول' : 'Login History'} subtitle={lang === 'ar' ? 'عرض سجل الدخول إلى حسابك' : 'View your account login history'} isLast />
          </Section>

          <Section title={lang === 'ar' ? 'الخصوصية' : 'Privacy'}>
            <RowItem icon="person-outline" title={lang === 'ar' ? 'إدارة البيانات والموافقة' : 'Data & Consent'} subtitle={lang === 'ar' ? 'إدارة بياناتك الشخصية والموافقات المرتبطة' : 'Manage your personal data and consents'} />
            <RowItem icon="shield-half-outline" title={lang === 'ar' ? 'صلاحيات التطبيق' : 'App Permissions'} subtitle={lang === 'ar' ? 'إدارة الأذونات والصلاحيات التي يستخدمها التطبيق' : 'Manage permissions used by the app'} />
            <RowItem icon="document-text-outline" title={lang === 'ar' ? 'سياسة الخصوصية' : 'Privacy Policy'} subtitle={lang === 'ar' ? 'عرض سياسة الخصوصية الخاصة بنا' : 'View our privacy policy'} onPress={() => router.push('/privacy' as never)} />
            <RowItem icon="trash-outline" title={lang === 'ar' ? 'حذف الحساب' : 'Delete Account'} subtitle={lang === 'ar' ? 'حذف حسابك بشكل نهائي وجميع بياناتك' : 'Permanently delete your account and data'} destructive onPress={() => setDeleteVisible(true)} isLast />
          </Section>

          <Section title={lang === 'ar' ? 'إعدادات التطبيق' : 'App Settings'}>
            <RowItem icon="moon-outline" title={lang === 'ar' ? 'المظهر الداكن' : 'Dark Mode'} type="switch" boolValue={mode === 'dark'} onToggle={(v: boolean) => setMode(v ? 'dark' : 'light')} />
            <RowItem icon="notifications-outline" title={lang === 'ar' ? 'إشعارات التطبيق' : 'Push Notifications'} type="switch" boolValue={settings.pushNotifs} onToggle={(v: boolean) => updateSetting('pushNotifs', v)} />
            <RowItem icon="mail-outline" title={lang === 'ar' ? 'رسائل البريد الإلكتروني' : 'Email Notifications'} type="switch" boolValue={settings.emailNotifs} onToggle={(v: boolean) => updateSetting('emailNotifs', v)} isLast />
          </Section>
        </View>

        <Text style={[styles.version, { color: colors.textSecondary, fontFamily: 'Cairo_400Regular' }]}>
          {lang === 'ar' ? 'الإصدار' : 'Version'} 1.0.0
        </Text>
      </View>

      <ConfirmDialog
        visible={deleteVisible}
        icon="trash-outline"
        confirmStyle="destructive"
        title={t('profile.deleteAccount') as string || 'حذف الحساب'}
        message={t('profile.deleteConfirm') as string || 'هل أنت متأكد أنك تريد حذف حسابك نهائياً؟ سيتم مسح جميع بياناتك ولن تتمكن من التراجع عن هذا الإجراء.'}
        cancelLabel={t('common.cancel') as string || 'إلغاء'}
        confirmLabel={t('profile.deleteAccount') as string || 'حذف الحساب'}
        onCancel={() => setDeleteVisible(false)}
        onConfirm={confirmDeleteAccount}
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

  heroSection: { alignItems: 'center', paddingHorizontal: 20, marginTop: 10, marginBottom: 24 },
  heroTitle: { fontSize: 22, marginBottom: 4 },
  heroSub: { fontSize: 13, textAlign: 'center' },
  shieldWrap: { width: 100, height: 110, borderRadius: 28, alignItems: 'center', justifyContent: 'center', marginTop: 24, overflow: 'hidden' },

  secureCard: { borderRadius: 24, padding: 20, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.04, shadowRadius: 12, elevation: 2 },
  secureRow: { alignItems: 'center', gap: 14 },
  secureIconWrap: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  secureTextWrap: { flex: 1, gap: 2 },
  secureTitle: { fontSize: 16 },
  secureDesc: { fontSize: 12, lineHeight: 18 },
  stepsContainer: { marginTop: 24, justifyContent: 'space-between', position: 'relative' },
  stepLine: { position: 'absolute', top: 12, left: 20, right: 20, height: 2, zIndex: 0 },
  stepItem: { alignItems: 'center', gap: 8, zIndex: 1, flex: 1 },
  stepCircle: { width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#FFF' },
  stepText: { fontSize: 10, textAlign: 'center' },

  sectionsContainer: { marginTop: 24, gap: 24 },
  section: { gap: 12 },
  sectionTitle: { fontSize: 15, paddingHorizontal: 8 },
  sectionCard: { borderRadius: 24, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.04, shadowRadius: 12, elevation: 2, overflow: 'hidden' },
  
  row: { alignItems: 'center', padding: 16, borderBottomWidth: StyleSheet.hairlineWidth, gap: 12 },
  rowIconWrap: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  rowTextWrap: { flex: 1, gap: 2 },
  rowTitle: { fontSize: 14 },
  rowSubtitle: { fontSize: 11 },
  rowActionWrap: { alignItems: 'center', gap: 6 },
  rowValue: { fontSize: 13 },

  version: { textAlign: 'center', fontSize: 12, marginTop: 32 },
});