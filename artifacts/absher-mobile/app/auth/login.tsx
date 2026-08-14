/**
 * ABSHER TRAVEL — unified Auth screen (Sign In + Sign Up in one screen).
 *
 * Redesigned to match the premium mockup: airplane-window sky hero on the left
 * with an overlapping white sheet, centered logo + tagline, segmented tabs that
 * switch between the login and register forms, gold-iconed fields, navy gradient
 * primary button, a decorative Google button (no backend OAuth → "coming soon"
 * toast), and a footer row of trust badges.
 *
 * All existing auth logic is preserved: useLoginUser / useRegisterUser
 * mutations, setAuth token storage, router.replace to the home tabs, and validation.
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
import { useTheme } from '@/context/ThemeContext';
import { CountryDialPicker } from '@/components/CountryDialPicker';

const NAVY = '#0A2342';
const NAVY_DARK = '#071525';
const NAVY_2 = '#163354';
const GOLD = '#C9A24B';
const SKY_IMG = { uri: 'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?auto=format&fit=crop&w=800&q=80' };

type Tab = 'login' | 'register';

/** Heuristic: treat an identifier as a phone when it's mostly digits / starts with + or a digit. */
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
  const { t, lang, toggle, writingDirection, isRTL } = useLanguage();
  const { resolved: themeMode, setMode: setThemeMode } = useTheme();
  const isDark = themeMode === 'dark';
  const toggleTheme = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setThemeMode(isDark ? 'light' : 'dark');
  };

  const loginMutation = useLoginUser();
  const registerMutation = useRegisterUser();

  const params = useLocalSearchParams<{ tab?: string }>();
  const [tab, setTab] = useState<Tab>(params.tab === 'register' ? 'register' : 'login');

  // --- Login state ---
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  // Inline error banner — Alert.alert is a no-op on web, so errors must render in the form itself.
  const [formError, setFormError] = useState<string | null>(null);

  // --- Register state ---
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', phone: '', password: '', confirmPassword: '' });
  const [dialCountry, setDialCountry] = useState('SA');
  const [showRegPass, setShowRegPass] = useState(false);
  const set = (k: keyof typeof form, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const topInset = Platform.OS === 'web' ? 24 : insets.top;

  // -------------------------------------------------------------------------
  // Handlers
  // -------------------------------------------------------------------------
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
          router.replace("/(tabs)");
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
          router.replace("/(tabs)");
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

  const handleGoogle = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Alert.alert(t('auth.googleSoonTitle'), t('auth.googleSoonBody'));
  };

  const switchTab = (next: Tab) => {
    Haptics.selectionAsync();
    setFormError(null);
    setTab(next);
  };

  /** Red inline banner shown above the submit button when sign-in/registration fails. */
  const ErrorBanner = () =>
    formError ? (
      <View style={styles.errorBanner}>
        <Ionicons name="alert-circle" size={18} color="#DC2626" />
        <Text style={[styles.errorBannerText, { fontFamily: 'Cairo_600SemiBold' }]}>{formError}</Text>
      </View>
    ) : null;

  // -------------------------------------------------------------------------
  // Reusable field
  // -------------------------------------------------------------------------
  const Field = ({
    label,
    icon,
    value,
    onChangeText,
    placeholder,
    keyboardType,
    secure,
    showSecure,
    onToggleSecure,
    ltr,
  }: {
    label: string;
    icon: keyof typeof Ionicons.glyphMap;
    value: string;
    onChangeText: (v: string) => void;
    placeholder: string;
    keyboardType?: 'default' | 'email-address' | 'phone-pad';
    secure?: boolean;
    showSecure?: boolean;
    onToggleSecure?: () => void;
    ltr?: boolean;
  }) => (
    <View style={styles.field}>
      <View style={styles.labelRow}>
        <Text style={[styles.label, { color: colors.foreground, fontFamily: 'Cairo_700Bold', writingDirection }]}>{label}</Text>
        <Ionicons name={icon} size={17} color={GOLD} />
      </View>
      <View style={[styles.inputRow, { backgroundColor: colors.muted, borderColor: colors.border }]}>
        {secure && (
          <Pressable onPress={onToggleSecure} hitSlop={8}>
            <Ionicons name={showSecure ? 'eye-off-outline' : 'eye-outline'} size={20} color={colors.mutedForeground} />
          </Pressable>
        )}
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.mutedForeground}
          keyboardType={keyboardType || 'default'}
          autoCapitalize="none"
          secureTextEntry={secure && !showSecure}
          style={[
            styles.input,
            { color: colors.foreground, fontFamily: 'Cairo_400Regular' },
            ltr ? { textAlign: 'left', writingDirection: 'ltr' } : { textAlign: 'right', writingDirection },
          ]}
        />
      </View>
    </View>
  );

  const trustBadges = [
    { icon: 'shield-checkmark-outline' as const, title: t('auth.trust.secure.title'), caption: t('auth.trust.secure.caption') },
    { icon: 'headset-outline' as const, title: t('auth.trust.support.title'), caption: t('auth.trust.support.caption') },
    { icon: 'ribbon-outline' as const, title: t('auth.trust.experience.title'), caption: t('auth.trust.experience.caption') },
  ];

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: colors.background }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        style={{ flex: 1, backgroundColor: colors.background }}
        contentContainerStyle={{ flexGrow: 1, paddingBottom: 24 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Hero */}
        <View style={styles.hero}>
          <Image source={SKY_IMG} style={StyleSheet.absoluteFill as never} contentFit="cover" />
          {/* Navy curved shape on the left */}
          <LinearGradient
            colors={[NAVY_DARK, NAVY, 'rgba(22,51,84,0.35)']}
            start={{ x: 0, y: 0.3 }}
            end={{ x: 1, y: 0.7 }}
            style={StyleSheet.absoluteFill}
          />

          {/* Top row: working dark/light toggle + language pill */}
          <View style={[styles.heroTop, { paddingTop: topInset + 10 }]}>
            <Pressable
              onPress={toggleTheme}
              style={styles.moonBtn}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              <Ionicons name={isDark ? 'sunny-outline' : 'moon-outline'} size={20} color={isDark ? GOLD : 'rgba(255,255,255,0.9)'} />
            </Pressable>
            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                toggle();
              }}
              style={styles.langPill}
            >
              <Ionicons name="globe-outline" size={16} color={GOLD} />
              <Text style={[styles.langText, { fontFamily: 'Cairo_700Bold' }]}>{lang === 'ar' ? 'AR' : 'EN'}</Text>
              <Ionicons name="chevron-down" size={13} color="rgba(255,255,255,0.7)" />
            </Pressable>
          </View>

          {/* Logo + brand name + tagline */}
          <View style={styles.brandWrap}>
            <Image source={require('@/assets/images/absher-logo-transparent.png')} style={styles.logo} contentFit="contain" />
            <Text style={[styles.brandName, { fontFamily: 'Cairo_700Bold' }]}>ABSHER TRAVEL</Text>
            <Text style={[styles.tagline, { fontFamily: 'Cairo_600SemiBold' }]}>{t('auth.tagline')}</Text>
          </View>
        </View>

        {/* Card */}
        <View style={[styles.card, { backgroundColor: colors.card }]}>
          {/* Segmented tabs */}
          <View style={[styles.tabs, { backgroundColor: colors.muted, flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
            <Pressable style={[styles.tab, tab === 'login' && styles.tabActive]} onPress={() => switchTab('login')}>
              {tab === 'login' ? (
                <LinearGradient colors={[NAVY, NAVY_2]} style={StyleSheet.absoluteFill as never} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} />
              ) : null}
              <Ionicons name="log-in-outline" size={18} color={tab === 'login' ? '#FFFFFF' : colors.mutedForeground} />
              <Text style={[styles.tabText, { color: tab === 'login' ? '#FFFFFF' : colors.mutedForeground, fontFamily: 'Cairo_700Bold' }]}>
                {t('auth.tabLogin')}
              </Text>
            </Pressable>
            <Pressable style={[styles.tab, tab === 'register' && styles.tabActive]} onPress={() => switchTab('register')}>
              {tab === 'register' ? (
                <LinearGradient colors={[NAVY, NAVY_2]} style={StyleSheet.absoluteFill as never} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} />
              ) : null}
              <Ionicons name="person-add-outline" size={18} color={tab === 'register' ? '#FFFFFF' : colors.mutedForeground} />
              <Text style={[styles.tabText, { color: tab === 'register' ? '#FFFFFF' : colors.mutedForeground, fontFamily: 'Cairo_700Bold' }]}>
                {t('auth.tabRegister')}
              </Text>
            </Pressable>
          </View>

          {tab === 'login' ? (
            <View style={styles.formBody}>
              <Field
                label={t('auth.identifier')}
                icon="person-outline"
                value={identifier}
                onChangeText={setIdentifier}
                placeholder={t('auth.identifierPlaceholder')}
                keyboardType="email-address"
              />
              <Field
                label={t('login.password')}
                icon="lock-closed-outline"
                value={password}
                onChangeText={setPassword}
                placeholder={t('register.passwordPlaceholder')}
                secure
                showSecure={showPass}
                onToggleSecure={() => setShowPass(!showPass)}
              />

              <Pressable onPress={() => router.push('/auth/forgot-password')} style={styles.forgotWrap}>
                <Text style={[styles.forgotLink, { color: NAVY, fontFamily: 'Cairo_600SemiBold' }]}>{t('login.forgot')}</Text>
              </Pressable>

              <ErrorBanner />

              <Pressable onPress={handleLogin} disabled={loginMutation.isPending} style={({ pressed }) => [styles.primaryBtnWrap, { opacity: pressed || loginMutation.isPending ? 0.9 : 1 }]}>
                <LinearGradient colors={[NAVY, NAVY_2]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.primaryBtn}>
                  <Text style={[styles.primaryBtnText, { fontFamily: 'Cairo_700Bold' }]}>
                    {loginMutation.isPending ? t('login.submitting') : t('login.submit')}
                  </Text>
                  <Ionicons name={isRTL ? 'arrow-back' : 'arrow-forward'} size={20} color="#FFFFFF" />
                </LinearGradient>
              </Pressable>

              {/* Divider */}
              <View style={styles.dividerRow}>
                <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
                <Text style={[styles.dividerText, { color: colors.mutedForeground, fontFamily: 'Cairo_400Regular' }]}>{t('auth.orContinue')}</Text>
                <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
              </View>

              {/* Google */}
              <Pressable onPress={handleGoogle} style={({ pressed }) => [styles.googleBtn, { backgroundColor: colors.card, borderColor: colors.border, opacity: pressed ? 0.9 : 1 }]}>
                <Text style={[styles.googleText, { color: colors.foreground, fontFamily: 'Cairo_700Bold' }]}>{t('auth.googleSignIn')}</Text>
                <Image source={{ uri: 'https://www.google.com/favicon.ico' }} style={styles.googleIcon} contentFit="contain" />
              </Pressable>
            </View>
          ) : (
            <View style={styles.formBody}>
              <View style={[styles.nameRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                <View style={{ flex: 1 }}>
                  <Field label={t('register.firstName')} icon="person-outline" value={form.firstName} onChangeText={(v) => set('firstName', v)} placeholder={t('register.firstNamePlaceholder')} />
                </View>
                <View style={{ flex: 1 }}>
                  <Field label={t('register.lastName')} icon="person-outline" value={form.lastName} onChangeText={(v) => set('lastName', v)} placeholder={t('register.lastNamePlaceholder')} />
                </View>
              </View>

              <Field label={t('register.email')} icon="mail-outline" value={form.email} onChangeText={(v) => set('email', v)} placeholder={t('register.emailPlaceholder')} keyboardType="email-address" ltr />

              {/* Phone with dial code */}
              <View style={styles.field}>
                <View style={styles.labelRow}>
                  <Text style={[styles.label, { color: colors.foreground, fontFamily: 'Cairo_700Bold', writingDirection }]}>{t('register.phone')}</Text>
                  <Ionicons name="call-outline" size={17} color={GOLD} />
                </View>
                <View style={[styles.inputRow, styles.phoneRow, { backgroundColor: colors.muted, borderColor: colors.border }]}>
                  <TextInput
                    value={form.phone}
                    onChangeText={(v) => set('phone', v)}
                    placeholder={t('register.phonePlaceholder')}
                    placeholderTextColor={colors.mutedForeground}
                    keyboardType="phone-pad"
                    style={[styles.input, { color: colors.foreground, fontFamily: 'Cairo_400Regular', textAlign: 'left', writingDirection: 'ltr', paddingHorizontal: 8 }]}
                  />
                  <CountryDialPicker value={dialCountry} onChange={setDialCountry} />
                </View>
              </View>

              <Field label={t('register.password')} icon="lock-closed-outline" value={form.password} onChangeText={(v) => set('password', v)} placeholder={t('register.passwordPlaceholder')} secure showSecure={showRegPass} onToggleSecure={() => setShowRegPass(!showRegPass)} />
              <Field label={t('register.confirmPassword')} icon="lock-closed-outline" value={form.confirmPassword} onChangeText={(v) => set('confirmPassword', v)} placeholder={t('register.confirmPasswordPlaceholder')} secure showSecure={showRegPass} onToggleSecure={() => setShowRegPass(!showRegPass)} />

              <ErrorBanner />

              <Pressable onPress={handleRegister} disabled={registerMutation.isPending} style={({ pressed }) => [styles.primaryBtnWrap, { opacity: pressed || registerMutation.isPending ? 0.9 : 1 }]}>
                <LinearGradient colors={[NAVY, NAVY_2]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.primaryBtn}>
                  <Text style={[styles.primaryBtnText, { fontFamily: 'Cairo_700Bold' }]}>
                    {registerMutation.isPending ? t('register.submitting') : t('register.submit')}
                  </Text>
                  <Ionicons name={isRTL ? 'arrow-back' : 'arrow-forward'} size={20} color="#FFFFFF" />
                </LinearGradient>
              </Pressable>

              <View style={styles.dividerRow}>
                <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
                <Text style={[styles.dividerText, { color: colors.mutedForeground, fontFamily: 'Cairo_400Regular' }]}>{t('auth.orContinue')}</Text>
                <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
              </View>

              <Pressable onPress={handleGoogle} style={({ pressed }) => [styles.googleBtn, { backgroundColor: colors.card, borderColor: colors.border, opacity: pressed ? 0.9 : 1 }]}>
                <Text style={[styles.googleText, { color: colors.foreground, fontFamily: 'Cairo_700Bold' }]}>{t('auth.googleSignIn')}</Text>
                <Image source={{ uri: 'https://www.google.com/favicon.ico' }} style={styles.googleIcon} contentFit="contain" />
              </Pressable>
            </View>
          )}
        </View>

        {/* Trust badges */}
        <View style={styles.trustRow}>
          {trustBadges.map((b) => (
            <View key={b.title} style={styles.trustItem}>
              <View style={styles.trustIcon}>
                <Ionicons name={b.icon} size={20} color={GOLD} />
              </View>
              <Text style={[styles.trustTitle, { color: colors.foreground, fontFamily: 'Cairo_700Bold' }]} numberOfLines={1}>{b.title}</Text>
              <Text style={[styles.trustCaption, { color: colors.mutedForeground, fontFamily: 'Cairo_400Regular' }]} numberOfLines={2}>{b.caption}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  hero: { height: 360, position: 'relative', overflow: 'hidden' },
  heroTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20 },
  moonBtn: { width: 42, height: 42, borderRadius: 21, backgroundColor: 'rgba(255,255,255,0.14)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.18)', alignItems: 'center', justifyContent: 'center' },
  langPill: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(255,255,255,0.15)', borderColor: 'rgba(201,162,75,0.5)', borderWidth: 1, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 22 },
  langText: { color: '#FFFFFF', fontSize: 13 },
  brandWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingBottom: 34, gap: 2 },
  logo: { width: 300, height: 140 },
  brandName: { color: '#FFFFFF', fontSize: 22, letterSpacing: 4, marginTop: 6, textShadowColor: 'rgba(0,0,0,0.35)', textShadowOffset: { width: 0, height: 2 }, textShadowRadius: 8 },
  tagline: { color: GOLD, fontSize: 13.5, marginTop: 3, letterSpacing: 0.3 },

  card: { marginHorizontal: 16, marginTop: -40, borderRadius: 28, padding: 18, shadowColor: NAVY, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.12, shadowRadius: 20, elevation: 8 },
  tabs: { borderRadius: 16, padding: 5, gap: 4 },
  tab: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14, borderRadius: 12, overflow: 'hidden' },
  tabActive: { shadowColor: NAVY, shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.25, shadowRadius: 6, elevation: 4 },
  tabText: { fontSize: 14 },

  formBody: { gap: 16, marginTop: 18 },
  field: { gap: 8 },
  labelRow: { flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'flex-start', gap: 7 },
  label: { fontSize: 14, textAlign: 'right' },
  inputRow: { flexDirection: 'row', alignItems: 'center', borderRadius: 14, borderWidth: 1, paddingHorizontal: 16, paddingVertical: 15, gap: 12 },
  phoneRow: { paddingHorizontal: 8, paddingVertical: Platform.OS === 'ios' ? 12 : 4 },
  input: { flex: 1, fontSize: 15 },
  nameRow: { gap: 12 },

  forgotWrap: { alignSelf: 'flex-start', marginTop: -6 },
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
  errorBannerText: { color: '#DC2626', fontSize: 13, flex: 1 },
  forgotLink: { fontSize: 13 },

  primaryBtnWrap: { borderRadius: 16, marginTop: 4, shadowColor: NAVY, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.25, shadowRadius: 12, elevation: 6 },
  primaryBtn: { borderRadius: 16, paddingVertical: 17, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 },
  primaryBtnText: { color: '#FFFFFF', fontSize: 17 },

  dividerRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 4 },
  dividerLine: { flex: 1, height: 1 },
  dividerText: { fontSize: 12 },

  googleBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12, borderWidth: 1, borderRadius: 16, paddingVertical: 15 },
  googleText: { fontSize: 15 },
  googleIcon: { width: 20, height: 20 },

  trustRow: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 20, marginTop: 24, gap: 8 },
  trustItem: { flex: 1, alignItems: 'center', gap: 5 },
  trustIcon: { width: 42, height: 42, borderRadius: 21, backgroundColor: 'rgba(201,162,75,0.12)', alignItems: 'center', justifyContent: 'center', marginBottom: 2 },
  trustTitle: { fontSize: 12, textAlign: 'center' },
  trustCaption: { fontSize: 10, textAlign: 'center', lineHeight: 15 },
});
