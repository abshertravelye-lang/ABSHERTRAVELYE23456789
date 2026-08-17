/**
 * Full-screen biometric lock overlay.
 *
 * When the biometric-lock preference is enabled and a user session exists,
 * this gate covers the app on cold start and whenever the app returns from
 * the background, until the user passes fingerprint / Face ID (with the
 * device PIN as the OS-level fallback). "Use password" logs the session out
 * and returns to the login screen as the app-level fallback path.
 *
 * Web never locks (expo-local-authentication has no web support).
 */
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { AppState, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import { useColors } from '@/hooks/useColors';
import { authenticateBiometric, isBiometricAvailable, isBiometricLockEnabled } from '@/lib/biometrics';
import { haptics } from '@/lib/haptics';

/** Time in background (ms) after which the lock re-arms. */
const RELOCK_AFTER_MS = 30_000;

export function BiometricLockGate() {
  const { user, isLoading, logout } = useAuth();
  const { lang } = useLanguage();
  const colors = useColors();

  const [locked, setLocked] = useState(false);
  const [checking, setChecking] = useState(false);
  const [failed, setFailed] = useState(false);
  const backgroundedAt = useRef<number | null>(null);
  const promptedRef = useRef(false);
  // The cold-start lock must arm exactly once, and only for a session that
  // was RESTORED from storage at startup. A user who just typed their
  // password (setAuth → user changes later) has already proven their
  // identity and must NOT be locked again — otherwise "Sign in with
  // password instead" would loop back into the lock screen forever.
  const startupCheckDone = useRef(false);

  const tryUnlock = useCallback(async () => {
    if (promptedRef.current) return;
    promptedRef.current = true;
    setChecking(true);
    setFailed(false);
    const ok = await authenticateBiometric(lang);
    setChecking(false);
    promptedRef.current = false;
    if (ok) {
      haptics.success();
      setLocked(false);
    } else {
      haptics.error();
      setFailed(true);
    }
  }, [lang]);

  // Cold start: arm the lock only for a session restored from storage.
  // Runs once, the first time the auth bootstrap finishes. If no user was
  // restored at that moment, any later login is a fresh password/register
  // authentication and never re-arms this gate.
  useEffect(() => {
    if (Platform.OS === 'web' || isLoading || startupCheckDone.current) return;
    startupCheckDone.current = true;
    if (!user) return; // no restored session — nothing to protect at startup
    let cancelled = false;
    (async () => {
      const [enabled, available] = await Promise.all([
        isBiometricLockEnabled(),
        isBiometricAvailable(),
      ]);
      if (!cancelled && enabled && available) {
        setLocked(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isLoading, user]);

  // Re-arm the lock when returning from background.
  useEffect(() => {
    if (Platform.OS === 'web') return;
    const sub = AppState.addEventListener('change', (next) => {
      if (next === 'background') {
        backgroundedAt.current = Date.now();
      } else if (next === 'active' && backgroundedAt.current) {
        const away = Date.now() - backgroundedAt.current;
        backgroundedAt.current = null;
        if (away >= RELOCK_AFTER_MS && user) {
          void (async () => {
            const [enabled, available] = await Promise.all([
              isBiometricLockEnabled(),
              isBiometricAvailable(),
            ]);
            if (enabled && available) setLocked(true);
          })();
        }
      }
    });
    return () => sub.remove();
  }, [user]);

  // Auto-prompt as soon as the lock screen appears.
  useEffect(() => {
    if (locked && !checking && !failed) {
      void tryUnlock();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [locked]);

  const handleUsePassword = useCallback(async () => {
    haptics.light();
    setLocked(false);
    await logout();
    router.replace('/auth/login');
  }, [logout]);

  if (!locked || !user) return null;

  return (
    <View style={[StyleSheet.absoluteFill, styles.container, { backgroundColor: colors.background }]}>
      <Image
        source={require('@/assets/images/logo-icon-transparent.png')}
        style={styles.logo}
        contentFit="contain"
      />
      <View style={[styles.iconWrap, { backgroundColor: `${colors.primary}15` }]}>
        <Ionicons name="finger-print" size={44} color={colors.primary} />
      </View>
      <Text style={[styles.title, { color: colors.text, fontFamily: 'Cairo_700Bold' }]}>
        {lang === 'ar' ? 'التطبيق مقفل' : 'App Locked'}
      </Text>
      <Text style={[styles.subtitle, { color: colors.textSecondary, fontFamily: 'Cairo_400Regular' }]}>
        {lang === 'ar'
          ? 'استخدم البصمة أو التعرف على الوجه للمتابعة'
          : 'Use fingerprint or Face ID to continue'}
      </Text>

      <Pressable
        onPress={() => {
          haptics.medium();
          void tryUnlock();
        }}
        disabled={checking}
        style={({ pressed }) => [
          styles.unlockBtn,
          { backgroundColor: colors.primary, opacity: pressed || checking ? 0.85 : 1 },
        ]}
      >
        <Ionicons name="finger-print-outline" size={20} color="#FFFFFF" />
        <Text style={[styles.unlockText, { fontFamily: 'Cairo_700Bold' }]}>
          {checking
            ? lang === 'ar' ? 'جارٍ التحقق...' : 'Verifying...'
            : lang === 'ar' ? 'فتح القفل' : 'Unlock'}
        </Text>
      </Pressable>

      {failed ? (
        <Text style={[styles.failedText, { color: colors.error, fontFamily: 'Cairo_600SemiBold' }]}>
          {lang === 'ar' ? 'فشل التحقق، حاول مرة أخرى' : 'Verification failed, try again'}
        </Text>
      ) : null}

      <Pressable onPress={handleUsePassword} hitSlop={8} style={styles.passwordLink}>
        <Text style={[styles.passwordText, { color: colors.textSecondary, fontFamily: 'Cairo_600SemiBold' }]}>
          {lang === 'ar' ? 'تسجيل الدخول بكلمة المرور' : 'Sign in with password instead'}
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    zIndex: 1000,
    elevation: 1000,
  },
  logo: { width: 96, height: 96, marginBottom: 24 },
  iconWrap: {
    width: 88,
    height: 88,
    borderRadius: 44,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  title: { fontSize: 22, marginBottom: 6 },
  subtitle: { fontSize: 14, textAlign: 'center', marginBottom: 28 },
  unlockBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 16,
  },
  unlockText: { color: '#FFFFFF', fontSize: 15 },
  failedText: { fontSize: 13, marginTop: 14 },
  passwordLink: { marginTop: 22 },
  passwordText: { fontSize: 13, textDecorationLine: 'underline' },
});
