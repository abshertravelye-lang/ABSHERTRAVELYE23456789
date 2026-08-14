/**
 * In-app support chat for ABSHER TRAVEL.
 *
 * Real, backend-connected chat (no WhatsApp/external redirect):
 *  - Logged in: POST /support/conversation (get-or-create) → GET /support/messages,
 *    polled every 5s; send via POST /support/messages. Greets by first name.
 *  - Guest: asks for a name → POST /support/guest/conversation, stores guestToken
 *    in AsyncStorage; guest message list/send endpoints, polled every 5s.
 *  - If a stored guest token exists and the user is now authenticated, we claim
 *    the guest conversation once (fire-and-forget) so history is preserved.
 *
 * Design: pearl background, navy header with ABSHER TRAVEL branding, customer
 * bubbles navy (trailing edge), staff bubbles white card (leading edge),
 * timestamps, inverted FlatList, KeyboardAvoidingView, send bar.
 */
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import { useColors } from '@/hooks/useColors';
import { useLanguage } from '@/context/LanguageContext';
import { useAuth } from '@/context/AuthContext';
import {
  useGetOrCreateSupportConversation,
  useListSupportMessages,
  getListSupportMessagesQueryKey,
  useSendSupportMessage,
  useCreateGuestSupportConversation,
  useListGuestSupportMessages,
  getListGuestSupportMessagesQueryKey,
  useSendGuestSupportMessage,
  useClaimGuestSupportConversation,
} from '@workspace/api-client-react';
import type { SupportMessage } from '@workspace/api-client-react';

const NAVY = '#0A2342';
const NAVY_2 = '#163354';
const GOLD = '#C9A24B';
const GUEST_TOKEN_KEY = '@absher_support_guest_token';
const POLL_MS = 5000;

function formatTime(iso: string, lang: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleTimeString(lang === 'en' ? 'en-GB' : 'ar-SA', { hour: '2-digit', minute: '2-digit' });
  } catch {
    return '';
  }
}

/** Injected greeting bubble (client-side only; never persisted). */
type GreetingBubble = { id: string; sender: 'staff'; body: string; createdAt: string; synthetic: true };
type Bubble = SupportMessage | GreetingBubble;

export default function SupportChatScreen() {
  const c = useColors();
  const { t, lang, isRTL } = useLanguage();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const isAuthed = !!user;

  const topInset = Platform.OS === 'web' ? 20 : insets.top;
  const bottomInset = Platform.OS === 'web' ? 16 : Math.max(insets.bottom, 12);

  const [guestToken, setGuestToken] = useState<string | null>(null);
  const [guestTokenLoaded, setGuestTokenLoaded] = useState(false);
  const [nameInput, setNameInput] = useState('');
  const [draft, setDraft] = useState('');
  const claimedRef = useRef(false);

  const firstName = (user?.firstName || '').trim();

  // ---- Load persisted guest token on mount ----
  useEffect(() => {
    AsyncStorage.getItem(GUEST_TOKEN_KEY)
      .then((tok) => {
        if (tok) setGuestToken(tok);
      })
      .finally(() => setGuestTokenLoaded(true));
  }, []);

  // =========================================================================
  // Authenticated flow
  // =========================================================================
  const getOrCreate = useGetOrCreateSupportConversation();
  const claimGuest = useClaimGuestSupportConversation();
  const [authReady, setAuthReady] = useState(false);

  useEffect(() => {
    if (!isAuthed || !guestTokenLoaded || authReady) return;
    // Claim a prior guest conversation once (fire-and-forget), then ensure the
    // user's conversation exists.
    (async () => {
      if (guestToken && !claimedRef.current) {
        claimedRef.current = true;
        try {
          await claimGuest.mutateAsync({ data: { token: guestToken } });
          await AsyncStorage.removeItem(GUEST_TOKEN_KEY);
          setGuestToken(null);
        } catch {
          // ignore — claim is best-effort
        }
      }
      try {
        await getOrCreate.mutateAsync();
      } catch {
        // handled by error UI below
      } finally {
        setAuthReady(true);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthed, guestTokenLoaded]);

  const authMessagesQuery = useListSupportMessages(undefined, {
    query: {
      enabled: isAuthed && authReady,
      queryKey: getListSupportMessagesQueryKey(undefined),
      refetchInterval: POLL_MS,
    },
  });
  const sendAuth = useSendSupportMessage();

  // =========================================================================
  // Guest flow
  // =========================================================================
  const createGuest = useCreateGuestSupportConversation();

  const guestMessagesQuery = useListGuestSupportMessages(
    { token: guestToken ?? '' },
    {
      query: {
        enabled: !isAuthed && !!guestToken,
        queryKey: getListGuestSupportMessagesQueryKey({ token: guestToken ?? '' }),
        refetchInterval: POLL_MS,
      },
    },
  );
  const sendGuest = useSendGuestSupportMessage();

  // =========================================================================
  // Shared derived state
  // =========================================================================
  const rawMessages: SupportMessage[] = useMemo(() => {
    const data = isAuthed ? authMessagesQuery.data : guestMessagesQuery.data;
    return Array.isArray(data) ? data : [];
  }, [isAuthed, authMessagesQuery.data, guestMessagesQuery.data]);

  const greeting = useMemo<GreetingBubble>(() => {
    const body = isAuthed && firstName
      ? t('supportChat.greeting').replace('{name}', firstName)
      : t('supportChat.greetingGuest');
    return { id: '__greeting__', sender: 'staff', body, createdAt: '', synthetic: true };
  }, [isAuthed, firstName, t]);

  // Inverted FlatList expects newest-first; keep greeting as the oldest (last).
  const bubbles: Bubble[] = useMemo(() => {
    const ordered = [...rawMessages].sort(
      (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
    );
    return [...ordered.reverse(), greeting];
  }, [rawMessages, greeting]);

  const needsName = !isAuthed && guestTokenLoaded && !guestToken;
  const isLoading = isAuthed
    ? (!authReady || (authMessagesQuery.isLoading && !authMessagesQuery.data))
    : (!!guestToken && guestMessagesQuery.isLoading && !guestMessagesQuery.data);
  const loadError = isAuthed
    ? (!!getOrCreate.error || !!authMessagesQuery.error)
    : !!guestMessagesQuery.error;

  // ---- Actions ----
  const startGuest = useCallback(async () => {
    const name = nameInput.trim();
    if (!name) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      const res = await createGuest.mutateAsync({ data: { name } });
      await AsyncStorage.setItem(GUEST_TOKEN_KEY, res.guestToken);
      setGuestToken(res.guestToken);
    } catch {
      // ignore — user can retry
    }
  }, [nameInput, createGuest]);

  const handleSend = useCallback(async () => {
    const body = draft.trim();
    if (!body) return;
    setDraft('');
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      if (isAuthed) {
        await sendAuth.mutateAsync({ data: { body } });
        await authMessagesQuery.refetch();
      } else if (guestToken) {
        await sendGuest.mutateAsync({ data: { token: guestToken, body } });
        await guestMessagesQuery.refetch();
      }
    } catch {
      // restore draft so the user doesn't lose their text
      setDraft(body);
    }
  }, [draft, isAuthed, guestToken, sendAuth, sendGuest, authMessagesQuery, guestMessagesQuery]);

  const retry = useCallback(() => {
    if (isAuthed) {
      setAuthReady(false);
      authMessagesQuery.refetch();
    } else if (guestToken) {
      guestMessagesQuery.refetch();
    }
  }, [isAuthed, guestToken, authMessagesQuery, guestMessagesQuery]);

  // =========================================================================
  // Render
  // =========================================================================
  const renderBubble = ({ item }: { item: Bubble }) => {
    const isCustomer = item.sender === 'customer';
    return (
      <View style={[styles.row, { justifyContent: isCustomer ? 'flex-end' : 'flex-start' }]}>
        {!isCustomer && (
          <View style={styles.staffAvatar}>
            <Ionicons name="headset" size={15} color={GOLD} />
          </View>
        )}
        <View style={{ maxWidth: '78%' }}>
          {!isCustomer && (
            <Text style={[styles.senderLabel, { color: c.mutedForeground, fontFamily: 'Cairo_600SemiBold' }]}>
              {t('supportChat.staffName')}
            </Text>
          )}
          <View
            style={[
              styles.bubble,
              isCustomer
                ? { backgroundColor: NAVY, borderTopRightRadius: 4 }
                : { backgroundColor: c.card, borderColor: c.border, borderWidth: 1, borderTopLeftRadius: 4 },
            ]}
          >
            <Text
              style={[
                styles.bubbleText,
                { color: isCustomer ? '#FFFFFF' : c.foreground, fontFamily: 'Cairo_400Regular', textAlign: isRTL ? 'right' : 'left' },
              ]}
            >
              {item.body}
            </Text>
          </View>
          {!!item.createdAt && (
            <Text
              style={[
                styles.time,
                { color: c.mutedForeground, fontFamily: 'Cairo_400Regular', textAlign: isCustomer ? 'left' : 'right' },
              ]}
            >
              {formatTime(item.createdAt, lang)}
            </Text>
          )}
        </View>
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: c.background }]}>
      {/* Header */}
      <LinearGradient colors={[NAVY, NAVY_2]} style={[styles.header, { paddingTop: topInset + 12 }]}>
        <View style={styles.headerRow}>
          <Pressable
            onPress={() => (router.canGoBack() ? router.back() : router.replace('/(tabs)' as never))}
            hitSlop={10}
            style={styles.backBtn}
          >
            <Ionicons name={isRTL ? 'arrow-forward' : 'arrow-back'} size={22} color="#FFFFFF" />
          </Pressable>
          <View style={styles.headerCenter}>
            <Text style={[styles.headerTitle, { fontFamily: 'Cairo_700Bold' }]}>{t('supportChat.title')}</Text>
            <View style={styles.brandRow}>
              <Ionicons name="ellipse" size={7} color={GOLD} />
              <Text style={[styles.headerSub, { fontFamily: 'Cairo_400Regular' }]}>{t('supportChat.headerSubtitle')}</Text>
            </View>
          </View>
          <View style={{ width: 40 }} />
        </View>
      </LinearGradient>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={0}
      >
        {needsName ? (
          /* ---- Guest name gate ---- */
          <View style={styles.gate}>
            <View style={[styles.gateIcon, { backgroundColor: GOLD + '1A' }]}>
              <Ionicons name="chatbubbles-outline" size={40} color={GOLD} />
            </View>
            <Text style={[styles.gatePrompt, { color: c.foreground, fontFamily: 'Cairo_600SemiBold' }]}>
              {t('supportChat.guestPrompt')}
            </Text>
            <Text style={[styles.gateLabel, { color: c.mutedForeground, fontFamily: 'Cairo_600SemiBold' }]}>
              {t('supportChat.nameLabel')}
            </Text>
            <TextInput
              value={nameInput}
              onChangeText={setNameInput}
              placeholder={t('supportChat.namePlaceholder')}
              placeholderTextColor={c.mutedForeground}
              style={[styles.gateInput, { backgroundColor: c.card, borderColor: c.border, color: c.foreground, textAlign: isRTL ? 'right' : 'left', fontFamily: 'Cairo_400Regular' }]}
              returnKeyType="go"
              onSubmitEditing={startGuest}
              editable={!createGuest.isPending}
            />
            <Pressable
              onPress={startGuest}
              disabled={!nameInput.trim() || createGuest.isPending}
              style={({ pressed }) => [
                styles.gateBtn,
                { backgroundColor: !nameInput.trim() ? c.muted : GOLD, opacity: pressed ? 0.85 : 1 },
              ]}
            >
              {createGuest.isPending ? (
                <ActivityIndicator size="small" color={NAVY} />
              ) : (
                <Text style={[styles.gateBtnText, { color: !nameInput.trim() ? c.mutedForeground : NAVY, fontFamily: 'Cairo_700Bold' }]}>
                  {t('supportChat.continue')}
                </Text>
              )}
            </Pressable>
          </View>
        ) : isLoading ? (
          <View style={styles.centerFill}>
            <ActivityIndicator size="large" color={GOLD} />
          </View>
        ) : loadError ? (
          <View style={styles.centerFill}>
            <Ionicons name="cloud-offline-outline" size={56} color={c.mutedForeground} />
            <Text style={[styles.errorText, { color: c.foreground, fontFamily: 'Cairo_600SemiBold' }]}>
              {t('supportChat.loadError')}
            </Text>
            <Pressable onPress={retry} style={[styles.retryBtn, { borderColor: GOLD }]}>
              <Ionicons name="refresh" size={16} color={GOLD} />
              <Text style={[styles.retryText, { color: GOLD, fontFamily: 'Cairo_700Bold' }]}>{t('supportChat.retry')}</Text>
            </Pressable>
          </View>
        ) : (
          <>
            <FlatList
              data={bubbles}
              keyExtractor={(b) => b.id}
              renderItem={renderBubble}
              inverted
              contentContainerStyle={{ padding: 16, gap: 4 }}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            />

            {/* Input bar */}
            <View style={[styles.inputBar, { backgroundColor: c.card, borderTopColor: c.border, paddingBottom: bottomInset, flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
              <TextInput
                value={draft}
                onChangeText={setDraft}
                placeholder={t('supportChat.inputPlaceholder')}
                placeholderTextColor={c.mutedForeground}
                multiline
                style={[styles.input, { backgroundColor: c.background, color: c.foreground, textAlign: isRTL ? 'right' : 'left', fontFamily: 'Cairo_400Regular' }]}
              />
              <Pressable
                onPress={handleSend}
                disabled={!draft.trim()}
                style={({ pressed }) => [
                  styles.sendBtn,
                  { backgroundColor: draft.trim() ? GOLD : c.muted, opacity: pressed ? 0.85 : 1 },
                ]}
              >
                <Ionicons name="send" size={18} color={draft.trim() ? NAVY : c.mutedForeground} style={isRTL ? { transform: [{ scaleX: -1 }] } : undefined} />
              </Pressable>
            </View>
          </>
        )}
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 16, paddingBottom: 16 },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerCenter: { flex: 1, alignItems: 'center' },
  headerTitle: { color: '#FFFFFF', fontSize: 18 },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 3 },
  headerSub: { color: 'rgba(255,255,255,0.75)', fontSize: 12 },

  centerFill: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 16, padding: 24 },
  errorText: { fontSize: 15, textAlign: 'center' },
  retryBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1.5, borderRadius: 12, paddingHorizontal: 18, paddingVertical: 10 },
  retryText: { fontSize: 14 },

  gate: { flex: 1, padding: 24, gap: 12, alignItems: 'center', justifyContent: 'center' },
  gateIcon: { width: 84, height: 84, borderRadius: 26, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  gatePrompt: { fontSize: 16, textAlign: 'center', lineHeight: 26, marginBottom: 8 },
  gateLabel: { fontSize: 13, alignSelf: 'stretch', textAlign: 'center' },
  gateInput: { alignSelf: 'stretch', borderWidth: 1, borderRadius: 14, paddingHorizontal: 16, paddingVertical: 14, fontSize: 15 },
  gateBtn: { alignSelf: 'stretch', borderRadius: 14, paddingVertical: 15, alignItems: 'center', marginTop: 4 },
  gateBtnText: { fontSize: 16 },

  row: { flexDirection: 'row', alignItems: 'flex-end', gap: 8, marginVertical: 3 },
  staffAvatar: { width: 30, height: 30, borderRadius: 15, backgroundColor: NAVY, alignItems: 'center', justifyContent: 'center', marginBottom: 18 },
  senderLabel: { fontSize: 11, marginBottom: 3, marginHorizontal: 4 },
  bubble: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: 16 },
  bubbleText: { fontSize: 14.5, lineHeight: 22 },
  time: { fontSize: 10.5, marginTop: 3, marginHorizontal: 4 },

  inputBar: { alignItems: 'flex-end', gap: 10, paddingHorizontal: 12, paddingTop: 10, borderTopWidth: 1 },
  input: { flex: 1, maxHeight: 120, minHeight: 44, borderRadius: 22, paddingHorizontal: 16, paddingTop: 11, paddingBottom: 11, fontSize: 14.5 },
  sendBtn: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
});
