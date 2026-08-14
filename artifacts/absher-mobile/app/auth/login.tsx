/**
 * ABSHER TRAVEL — Auth screen (Sign In + Sign Up)
 * Redesigned to match the daytime airport reference mockup:
 * light sky/airport hero, transparent logo, Arabic title, white card with
 * segmented tabs, clean fields (no labels, icon on right), social login row,
 * and a minimal footer.
 */
import React, { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { getDialCode } from '@workspace/countries';
import { useColors } from '@/hooks/useColors';
import { useLoginUser, useRegisterUser } from '@workspace/api-client-react';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import { CountryDialPicker } from '@/components/CountryDialPicker';

const NAVY = '#0A2342';
const NAVY2 = '#163354';
const GOLD = '#D4A017';

const AIRPORT_BG = {
  uri: 'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?auto=format&fit=crop&w=1200&q=80',
};

type Tab = 'login' | 'register';

function isPhoneIdentifier(value: string): boolean {
  const v = value.trim();
  if (!v) return false;
  if (v.includes('@')) return false;
  return /^[+0-9][0-9\s()-]*$/.test(v);
}

export default function AuthScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { setAuth } = useAuth();
  const { t, lang, toggle, isRTL } = useLanguage();

  const loginMutation = useLoginUser();
  const registerMutation = useRegisterUser();

  const params = useLocalSearchParams<{ tab?: string }>();
  const [tab, setTab] = useState<Tab>(params.tab === 'register' ? 'register' : 'login');

  // Login state
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Register state
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', phone: '', password: '', confirmPassword: '' });
  const [dialCountry, setDialCountry] = useState('SA');
  const [showRegPass, setShowRegPass] = useState(false);
  const set = (k: keyof typeof form, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const topInset = Platform.OS === 'web' ? 24 : insets.top;

  const handleLogin = () => {
    setFormError(null);
    if (!identifier || !password) {
      setFormError(t('login.missingBody'));
      Alert.alert(t('login.missingTitle'), t('login.missingBody'));
      return;
    }
    const data = isPhoneIdentifier(identifier)
      ? { phone: identifier.replace(/[\s()-]/g, ''), password }
      : { email: identifier.trim(), password };
    loginMutation.mutate(
      { data },
      {
        onSuccess: async (res) => {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          await setAuth(res);
          router.replace('/(tabs)');
        },
        onError: () => {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
          setFormError(t('login.errorBody'));
          Alert.alert(t('login.errorTitle'), t('login.errorBody'));
        },
      },
    );
  };

  const buildFullPhone = () => {
    const local = form.phone.replace(/[^0-9]/g, '').replace(/^0+/, '');
    if (!local) return undefined;
    const dial = getDialCode(dialCountry) || '+966';
    return `${dial}${local}`;
  };

  const handleRegister = () => {
    setFormError(null);
    const fullPhone = buildFullPhone();
    if (!form.email && !fullPhone) { setFormError(t('register.missingContact')); Alert.alert(t('register.missingTitle'), t('register.missingContact')); return; }
    if (!form.password) { setFormError(t('register.missingPassword')); Alert.alert(t('register.missingTitle'), t('register.missingPassword')); return; }
    if (form.password !== form.confirmPassword) { setFormError(t('register.passwordMismatch')); Alert.alert(t('register.errorTitle'), t('register.passwordMismatch')); return; }
    if (form.password.length < 8) { setFormError(t('register.passwordShort')); Alert.alert(t('register.errorTitle'), t('register.passwordShort')); return; }

    registerMutation.mutate(
      { data: { email: form.email || undefined, phone: fullPhone, password: form.password, firstName: form.firstName || undefined, lastName: form.lastName || undefined } },
      {
        onSuccess: async (res) => {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          await setAuth(res);
          router.replace('/(tabs)');
        },
        onError: (err: unknown) => {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
          const serverMsg = (err as { error?: string })?.error;
          setFormError(serverMsg || t('register.errorBody'));
          Alert.alert(t('register.errorTitle'), serverMsg || t('register.errorBody'));
        },
      },
    );
  };

  const handleSocialLogin = (provider: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Alert.alert(t('auth.googleSoonTitle'), t('auth.googleSoonBody'));
  };

  const switchTab = (next: Tab) => {
    Haptics.selectionAsync();
    setFormError(null);
    setTab(next);
  };

  const ErrorBanner = () =>
    formError ? (
      <View style={styles.errorBanner}>
        <Ionicons name="alert-circle" size={16} color="#DC2626" />
        <Text style={[styles.errorText, { fontFamily: 'Cairo_600SemiBold' }]}>{formError}</Text>
      </View>
    ) : null;

  /** Clean input field: icon on right, placeholder, no label */
  const Field = ({
    icon,
    value,
    onChangeText,
    placeholder,
    keyboardType,
    secure,
    showSecure,
    onToggleSecure,
    ltr,
    leftSlot,
  }: {
    icon: keyof typeof Ionicons.glyphMap;
    value: string;
    onChangeText: (v: string) => void;
    placeholder: string;
    keyboardType?: 'default' | 'email-address' | 'phone-pad';
    secure?: boolean;
    showSecure?: boolean;
    onToggleSecure?: () => void;
    ltr?: boolean;
    leftSlot?: React.ReactNode;
  }) => (
    <View style={[styles.field, { borderColor: colors.border, backgroundColor: colors.background }]}>
      {/* Left slot (eye toggle or phone picker) */}
      {leftSlot ?? (secure ? (
        <Pressable onPress={onToggleSecure} hitSlop={8} style={styles.fieldLeft}>
          <Ionicons name={showSecure ? 'eye-off-outline' : 'eye-outline'} size={20} color="#94A3B8" />
        </Pressable>
      ) : null)}

      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#94A3B8"
        keyboardType={keyboardType || 'default'}
        autoCapitalize="none"
        secureTextEntry={secure && !showSecure}
        style={[
          styles.fieldInput,
          { color: colors.foreground, fontFamily: 'Cairo_400Regular' },
          ltr ? { textAlign: 'left', writingDirection: 'ltr' } : { textAlign: 'right' },
        ]}
      />

      {/* Right icon */}
      <View style={styles.fieldRight}>
        <Ionicons name={icon} size={19} color="#94A3B8" />
      </View>
    </View>
  );

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: '#E8F4FD' }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ flexGrow: 1, paddingBottom: 32 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* ── Hero ── */}
        <View style={styles.hero}>
          <Image source={AIRPORT_BG} style={StyleSheet.absoluteFill as never} contentFit="cover" />
          {/* Light gradient at top, stronger fade at bottom to blend with card */}
          <LinearGradient
            colors={['rgba(255,255,255,0.15)', 'rgba(255,255,255,0.0)', 'rgba(255,255,255,0.6)']}
            style={StyleSheet.absoluteFill}
          />

          {/* Top bar: language toggle */}
          <View style={[styles.heroTop, { paddingTop: topInset + 10 }]}>
            <Pressable
              onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); toggle(); }}
              style={styles.langPill}
            >
              <Ionicons name="globe-outline" size={16} color={NAVY} />
              <Text style={[styles.langText, { fontFamily: 'Cairo_700Bold' }]}>
                {lang === 'ar' ? 'العربية' : 'English'}
              </Text>
            </Pressable>
          </View>

          {/* Logo + brand */}
          <View style={styles.heroBrand}>
            <Image
              source={require('@/assets/images/logo-icon-transparent.png')}
              style={styles.heroLogoImg}
              contentFit="contain"
            />
            <Text style={[styles.heroTitle, { fontFamily: 'Cairo_700Bold' }]}>رحلتك تبدأ هنا</Text>
            <Text style={[styles.heroSubtitle, { fontFamily: 'Cairo_400Regular' }]}>
              خدمات سفر متكاملة بلمسة واحدة
            </Text>
          </View>
        </View>

        {/* ── Card ── */}
        <View style={[styles.card, { backgroundColor: colors.card }]}>

          {/* Tabs */}
          <View style={styles.tabs}>
            <Pressable
              style={[styles.tabItem, tab === 'login' && styles.tabActive]}
              onPress={() => switchTab('login')}
            >
              <Text
                style={[
                  styles.tabText,
                  { fontFamily: 'Cairo_700Bold', color: tab === 'login' ? NAVY : '#94A3B8' },
                ]}
              >
                تسجيل الدخول
              </Text>
              {tab === 'login' && <View style={styles.tabUnderline} />}
            </Pressable>
            <Pressable
              style={[styles.tabItem, tab === 'register' && styles.tabActive]}
              onPress={() => switchTab('register')}
            >
              <Text
                style={[
                  styles.tabText,
                  { fontFamily: 'Cairo_700Bold', color: tab === 'register' ? NAVY : '#94A3B8' },
                ]}
              >
                إنشاء حساب جديد
              </Text>
              {tab === 'register' && <View style={styles.tabUnderline} />}
            </Pressable>
          </View>

          {/* ── LOGIN FORM ── */}
          {tab === 'login' ? (
            <View style={styles.form}>
              <Field
                icon="person-outline"
                value={identifier}
                onChangeText={setIdentifier}
                placeholder="البريد الإلكتروني أو رقم الجوال"
                keyboardType="email-address"
              />
              <Field
                icon="lock-closed-outline"
                value={password}
                onChangeText={setPassword}
                placeholder="كلمة المرور"
                secure
                showSecure={showPass}
                onToggleSecure={() => setShowPass(!showPass)}
              />

              {/* Remember me + Forgot */}
              <View style={[styles.rememberRow, { flexDirection: isRTL ? 'row' : 'row-reverse' }]}>
                <Pressable
                  onPress={() => router.push('/auth/forgot-password')}
                  hitSlop={8}
                >
                  <Text style={[styles.forgotLink, { fontFamily: 'Cairo_600SemiBold', color: NAVY }]}>
                    نسيت كلمة المرور؟
                  </Text>
                </Pressable>
                <Pressable
                  style={styles.rememberWrap}
                  onPress={() => setRememberMe((v) => !v)}
                >
                  <Text style={[styles.rememberLabel, { fontFamily: 'Cairo_400Regular', color: colors.foreground }]}>
                    تذكرني
                  </Text>
                  <View style={[styles.checkbox, rememberMe && { backgroundColor: NAVY, borderColor: NAVY }]}>
                    {rememberMe && <Ionicons name="checkmark" size={14} color="#fff" />}
                  </View>
                </Pressable>
              </View>

              <ErrorBanner />

              {/* Login button */}
              <Pressable
                onPress={handleLogin}
                disabled={loginMutation.isPending}
                style={({ pressed }) => [styles.primaryBtnWrap, { opacity: pressed || loginMutation.isPending ? 0.88 : 1 }]}
              >
                <LinearGradient
                  colors={[NAVY, NAVY2]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.primaryBtn}
                >
                  <Text style={[styles.primaryBtnText, { fontFamily: 'Cairo_700Bold' }]}>
                    {loginMutation.isPending ? 'جاري الدخول...' : 'تسجيل الدخول'}
                  </Text>
                  <Ionicons name="arrow-back" size={20} color="#fff" />
                </LinearGradient>
              </Pressable>

              {/* Divider */}
              <View style={styles.dividerRow}>
                <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
                <Text style={[styles.dividerText, { color: '#94A3B8', fontFamily: 'Cairo_400Regular' }]}>
                  أو سجل الدخول باستخدام
                </Text>
                <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
              </View>

              {/* Social buttons */}
              <View style={styles.socialRow}>
                <Pressable
                  style={({ pressed }) => [styles.socialBtn, { borderColor: colors.border, backgroundColor: colors.background, opacity: pressed ? 0.8 : 1 }]}
                  onPress={() => handleSocialLogin('apple')}
                >
                  <Ionicons name="logo-apple" size={18} color={colors.foreground} />
                  <Text style={[styles.socialText, { color: colors.foreground, fontFamily: 'Cairo_600SemiBold' }]}>Apple</Text>
                </Pressable>
                <Pressable
                  style={({ pressed }) => [styles.socialBtn, { borderColor: colors.border, backgroundColor: colors.background, opacity: pressed ? 0.8 : 1 }]}
                  onPress={() => handleSocialLogin('google')}
                >
                  <Image source={{ uri: 'https://www.google.com/favicon.ico' }} style={{ width: 18, height: 18 }} contentFit="contain" />
                  <Text style={[styles.socialText, { color: colors.foreground, fontFamily: 'Cairo_600SemiBold' }]}>Google</Text>
                </Pressable>
                <Pressable
                  style={({ pressed }) => [styles.socialBtn, { borderColor: colors.border, backgroundColor: colors.background, opacity: pressed ? 0.8 : 1 }]}
                  onPress={() => handleSocialLogin('phone')}
                >
                  <Ionicons name="call-outline" size={18} color={colors.foreground} />
                  <Text style={[styles.socialText, { color: colors.foreground, fontFamily: 'Cairo_600SemiBold' }]}>رقم الجوال</Text>
                </Pressable>
              </View>
            </View>
          ) : (
            /* ── REGISTER FORM ── */
            <View style={styles.form}>
              <View style={[styles.nameRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                <View style={{ flex: 1 }}>
                  <Field icon="person-outline" value={form.firstName} onChangeText={(v) => set('firstName', v)} placeholder="الاسم الأول" />
                </View>
                <View style={{ flex: 1 }}>
                  <Field icon="person-outline" value={form.lastName} onChangeText={(v) => set('lastName', v)} placeholder="الاسم الأخير" />
                </View>
              </View>

              <Field icon="mail-outline" value={form.email} onChangeText={(v) => set('email', v)} placeholder="البريد الإلكتروني" keyboardType="email-address" ltr />

              {/* Phone with dial code */}
              <View style={[styles.field, { borderColor: colors.border, backgroundColor: colors.background }]}>
                <CountryDialPicker value={dialCountry} onChange={setDialCountry} />
                <TextInput
                  value={form.phone}
                  onChangeText={(v) => set('phone', v)}
                  placeholder="رقم الجوال"
                  placeholderTextColor="#94A3B8"
                  keyboardType="phone-pad"
                  style={[styles.fieldInput, { color: colors.foreground, fontFamily: 'Cairo_400Regular', textAlign: 'left', writingDirection: 'ltr' }]}
                />
                <View style={styles.fieldRight}>
                  <Ionicons name="call-outline" size={19} color="#94A3B8" />
                </View>
              </View>

              <Field icon="lock-closed-outline" value={form.password} onChangeText={(v) => set('password', v)} placeholder="كلمة المرور" secure showSecure={showRegPass} onToggleSecure={() => setShowRegPass(!showRegPass)} />
              <Field icon="lock-closed-outline" value={form.confirmPassword} onChangeText={(v) => set('confirmPassword', v)} placeholder="تأكيد كلمة المرور" secure showSecure={showRegPass} onToggleSecure={() => setShowRegPass(!showRegPass)} />

              <ErrorBanner />

              <Pressable
                onPress={handleRegister}
                disabled={registerMutation.isPending}
                style={({ pressed }) => [styles.primaryBtnWrap, { opacity: pressed || registerMutation.isPending ? 0.88 : 1 }]}
              >
                <LinearGradient
                  colors={[NAVY, NAVY2]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.primaryBtn}
                >
                  <Text style={[styles.primaryBtnText, { fontFamily: 'Cairo_700Bold' }]}>
                    {registerMutation.isPending ? 'جاري التسجيل...' : 'إنشاء الحساب'}
                  </Text>
                  <Ionicons name="arrow-back" size={20} color="#fff" />
                </LinearGradient>
              </Pressable>
            </View>
          )}
        </View>

        {/* ── Footer ── */}
        <View style={styles.footerRow}>
          <View style={styles.footerItem}>
            <Ionicons name="shield-checkmark-outline" size={22} color={NAVY} />
            <View>
              <Text style={[styles.footerTitle, { fontFamily: 'Cairo_700Bold', color: NAVY }]}>أمان تام</Text>
              <Text style={[styles.footerCaption, { fontFamily: 'Cairo_400Regular', color: '#64748B' }]}>بياناتك محمية</Text>
            </View>
          </View>
          <View style={styles.footerDivider} />
          <Pressable style={styles.footerItem} onPress={() => router.push('/support-chat')}>
            <Ionicons name="headset-outline" size={22} color={NAVY} />
            <View>
              <Text style={[styles.footerTitle, { fontFamily: 'Cairo_700Bold', color: NAVY }]}>تحتاج مساعدة؟</Text>
              <Text style={[styles.footerCaption, { fontFamily: 'Cairo_400Regular', color: '#64748B' }]}>تواصل مع الدعم</Text>
            </View>
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  // Hero
  hero: { height: 320, position: 'relative', overflow: 'hidden' },
  heroTop: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  langPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.85)',
    borderColor: 'rgba(10,35,66,0.2)',
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
  },
  langText: { color: NAVY, fontSize: 13 },
  heroBrand: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingBottom: 28 },
  heroLogoImg: {
    width: 120,
    height: 120,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.22,
    shadowRadius: 16,
  },
  heroTitle: { color: NAVY, fontSize: 26, textAlign: 'center' },
  heroSubtitle: { color: '#334155', fontSize: 13, marginTop: 4, textAlign: 'center' },

  // Card
  card: {
    marginHorizontal: 16,
    marginTop: -32,
    borderRadius: 28,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 24,
    shadowColor: '#0A2342',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 24,
    elevation: 10,
  },

  // Tabs
  tabs: {
    flexDirection: 'row-reverse',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    marginBottom: 20,
  },
  tabItem: { flex: 1, alignItems: 'center', paddingBottom: 12, position: 'relative' },
  tabActive: {},
  tabText: { fontSize: 14 },
  tabUnderline: {
    position: 'absolute',
    bottom: -1,
    left: 12,
    right: 12,
    height: 2.5,
    backgroundColor: NAVY,
    borderRadius: 2,
  },

  // Form
  form: { gap: 14 },
  nameRow: { gap: 10 },

  // Field
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: Platform.OS === 'ios' ? 15 : 4,
    minHeight: 54,
    gap: 8,
  },
  fieldLeft: { paddingHorizontal: 2 },
  fieldInput: { flex: 1, fontSize: 14, minHeight: 40 },
  fieldRight: { paddingHorizontal: 2 },

  // Remember me
  rememberRow: { alignItems: 'center', justifyContent: 'space-between' },
  rememberWrap: { flexDirection: 'row-reverse', alignItems: 'center', gap: 8 },
  rememberLabel: { fontSize: 13 },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 5,
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  forgotLink: { fontSize: 13 },

  // Error
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  errorText: { color: '#DC2626', fontSize: 13, flex: 1 },

  // Primary button
  primaryBtnWrap: {
    borderRadius: 16,
    shadowColor: NAVY,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.28,
    shadowRadius: 14,
    elevation: 6,
    overflow: 'hidden',
  },
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 17,
    gap: 10,
  },
  primaryBtnText: { color: '#fff', fontSize: 17 },

  // Divider
  dividerRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginVertical: 2 },
  dividerLine: { flex: 1, height: 1 },
  dividerText: { fontSize: 12 },

  // Social
  socialRow: { flexDirection: 'row-reverse', gap: 10 },
  socialBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 13,
  },
  socialText: { fontSize: 12 },

  // Footer
  footerRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 24,
    marginHorizontal: 16,
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 20,
    gap: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  footerItem: { flex: 1, flexDirection: 'row-reverse', alignItems: 'center', gap: 10, justifyContent: 'center' },
  footerDivider: { width: 1, height: 36, backgroundColor: '#E2E8F0', marginHorizontal: 8 },
  footerTitle: { fontSize: 12 },
  footerCaption: { fontSize: 11, marginTop: 1 },
});
