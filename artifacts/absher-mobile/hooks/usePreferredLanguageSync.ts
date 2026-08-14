/**
 * usePreferredLanguageSync — keeps users.preferredLanguage in sync with the
 * app's active language. When the language toggles AND the user is
 * authenticated, PATCH the profile (fire-and-forget). Must be used inside both
 * the AuthProvider and LanguageProvider.
 */
import { useEffect, useRef } from 'react';
import { updateProfile } from '@workspace/api-client-react';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';

export function usePreferredLanguageSync() {
  const { user, accessToken } = useAuth();
  const { lang } = useLanguage();
  const lastSynced = useRef<string | null>(null);

  useEffect(() => {
    if (!user || !accessToken) return;
    if (lastSynced.current === lang) return;
    lastSynced.current = lang;
    // Fire and forget — never block the UI or surface errors.
    updateProfile({ preferredLanguage: lang }).catch(() => {});
  }, [user, accessToken, lang]);
}
