/**
 * Biometric helpers (fingerprint / Face ID) built on expo-local-authentication.
 *
 * expo-local-authentication has NO web support, so every entry point is
 * guarded by Platform.OS !== 'web'. Device-credential (PIN/pattern) fallback
 * stays enabled so users with a broken sensor are never locked out.
 */
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SETTINGS_KEY = '@absher_settings';

type LocalAuthModule = typeof import('expo-local-authentication');

async function getModule(): Promise<LocalAuthModule | null> {
  if (Platform.OS === 'web') return null;
  try {
    return await import('expo-local-authentication');
  } catch {
    return null;
  }
}

/** Hardware present AND at least one biometric enrolled. */
export async function isBiometricAvailable(): Promise<boolean> {
  const LocalAuth = await getModule();
  if (!LocalAuth) return false;
  try {
    const [hasHardware, isEnrolled] = await Promise.all([
      LocalAuth.hasHardwareAsync(),
      LocalAuth.isEnrolledAsync(),
    ]);
    return hasHardware && isEnrolled;
  } catch {
    return false;
  }
}

/**
 * Prompt for biometric auth. Returns true on success.
 * Falls back to the device PIN/passcode sheet when biometrics fail.
 */
export async function authenticateBiometric(lang: 'ar' | 'en'): Promise<boolean> {
  const LocalAuth = await getModule();
  if (!LocalAuth) return false;
  try {
    const result = await LocalAuth.authenticateAsync({
      promptMessage: lang === 'ar' ? 'تأكيد هويتك للمتابعة' : 'Verify your identity to continue',
      cancelLabel: lang === 'ar' ? 'إلغاء' : 'Cancel',
      disableDeviceFallback: false,
    });
    return result.success;
  } catch {
    return false;
  }
}

/** Read the biometric-lock preference from the shared settings blob. */
export async function isBiometricLockEnabled(): Promise<boolean> {
  if (Platform.OS === 'web') return false;
  try {
    const raw = await AsyncStorage.getItem(SETTINGS_KEY);
    if (!raw) return false;
    return JSON.parse(raw)?.biometrics === true;
  } catch {
    return false;
  }
}

/** Persist the biometric-lock preference into the shared settings blob. */
export async function setBiometricLockEnabled(enabled: boolean): Promise<void> {
  try {
    const raw = await AsyncStorage.getItem(SETTINGS_KEY);
    const settings = raw ? JSON.parse(raw) : {};
    settings.biometrics = enabled;
    await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch {
    // preference write failed — nothing else to do
  }
}
