import React, { useEffect, useState } from 'react';
import { I18nManager, View } from 'react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { KeyboardProvider } from 'react-native-keyboard-controller';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { AnimatedSplash } from '@/components/AnimatedSplash';
import {
  Cairo_400Regular,
  Cairo_600SemiBold,
  Cairo_700Bold,
  useFonts,
} from '@expo-google-fonts/cairo';
import { router, Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { setBaseUrl } from '@workspace/api-client-react';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { ThemeProvider } from '@/context/ThemeContext';
import { LanguageProvider } from '@/context/LanguageContext';
import { useNotificationObserver } from '@/hooks/useNotificationObserver';
import { usePreferredLanguageSync } from '@/hooks/usePreferredLanguageSync';

// Set API base URL — Expo runs outside the proxy and needs an absolute URL
setBaseUrl(`https://${process.env.EXPO_PUBLIC_DOMAIN}`);

// Default to RTL (Arabic). LanguageProvider overrides this dynamically
// when a stored language preference is found.
I18nManager.allowRTL(true);
I18nManager.forceRTL(true);

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

const ONBOARDED_KEY = '@absher_onboarded';

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, staleTime: 30_000 } },
});

function RootLayoutNav() {
  // Notification tap handling + preferred-language sync live here so they run
  // inside the Auth/Language providers.
  useNotificationObserver();
  usePreferredLanguageSync();
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="welcome" options={{ headerShown: false }} />
      <Stack.Screen name="onboarding" options={{ headerShown: false }} />
      <Stack.Screen name="program/[id]" options={{ headerShown: false }} />
      <Stack.Screen name="visa/[id]" options={{ headerShown: false }} />
      <Stack.Screen name="destination/[id]" options={{ headerShown: false }} />
      <Stack.Screen name="flight-results" options={{ headerShown: false }} />
      <Stack.Screen name="flight-booking" options={{ headerShown: false }} />
      <Stack.Screen name="notifications" options={{ headerShown: false }} />
      <Stack.Screen name="coming-soon" options={{ headerShown: false }} />
      <Stack.Screen name="auth/login" options={{ headerShown: false, presentation: 'modal' }} />
      <Stack.Screen name="auth/register" options={{ headerShown: false, presentation: 'modal' }} />
      <Stack.Screen name="auth/otp" options={{ headerShown: false }} />
      <Stack.Screen name="auth/forgot-password" options={{ headerShown: false }} />
      <Stack.Screen name="profile-edit" options={{ headerShown: false, presentation: 'modal' }} />
      <Stack.Screen name="settings" options={{ headerShown: false }} />
      <Stack.Screen name="wallet" options={{ headerShown: false }} />
      <Stack.Screen name="booking/[id]" options={{ headerShown: false }} />
      <Stack.Screen name="visa-tracking/[id]" options={{ headerShown: false }} />
      <Stack.Screen name="umrah-tracking/[id]" options={{ headerShown: false }} />
      <Stack.Screen name="umrah-visa" options={{ headerShown: false }} />
      <Stack.Screen name="support-chat" options={{ headerShown: false }} />
    </Stack>
  );
}

/**
 * Decides the entry route once fonts, persisted auth, and the onboarding flag
 * are all known. Runs exactly once and keeps the animated splash visible until
 * the routing decision is made, so users never see a flash of the tab bar.
 */
function BootstrapGate({ appReady, onRouted }: { appReady: boolean; onRouted: () => void }) {
  const { user, isLoading: authLoading } = useAuth();
  const [routed, setRouted] = useState(false);

  useEffect(() => {
    if (routed || !appReady || authLoading) return;

    let cancelled = false;
    (async () => {
      let onboarded = false;
      try {
        onboarded = (await AsyncStorage.getItem(ONBOARDED_KEY)) === 'true';
      } catch {
        onboarded = false;
      }
      if (cancelled) return;

      if (!onboarded) {
        router.replace('/onboarding');
      } else if (!user) {
        router.replace('/auth/login');
      }
      // Authenticated + onboarded users stay on the default (tabs) route.

      setRouted(true);
      onRouted();
    })();

    return () => {
      cancelled = true;
    };
  }, [appReady, authLoading, user, routed, onRouted]);

  return null;
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Cairo_400Regular,
    Cairo_600SemiBold,
    Cairo_700Bold,
  });

  const [routed, setRouted] = useState(false);
  const [splashHidden, setSplashHidden] = useState(false);

  const appReady = fontsLoaded || !!fontError;

  useEffect(() => {
    if (appReady) {
      SplashScreen.hideAsync();
    }
  }, [appReady]);

  if (!appReady) return null;

  return (
    <SafeAreaProvider>
      <ErrorBoundary>
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <ThemeProvider>
              <LanguageProvider>
              <GestureHandlerRootView style={{ flex: 1 }}>
                <KeyboardProvider>
                  <RootLayoutNav />
                  <BootstrapGate appReady={appReady} onRouted={() => setRouted(true)} />
                  {!splashHidden && (
                    <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}>
                      <AnimatedSplash
                        hide={routed}
                        onFinish={() => setSplashHidden(true)}
                      />
                    </View>
                  )}
                </KeyboardProvider>
              </GestureHandlerRootView>
              </LanguageProvider>
            </ThemeProvider>
          </AuthProvider>
        </QueryClientProvider>
      </ErrorBoundary>
    </SafeAreaProvider>
  );
}
