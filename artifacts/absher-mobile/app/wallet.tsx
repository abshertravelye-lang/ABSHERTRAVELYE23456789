import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, Platform, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useColors } from '@/hooks/useColors';
import { useLanguage } from '@/context/LanguageContext';
import { useAuth } from '@/context/AuthContext';
import { EmptyState } from '@/components/EmptyState';
import { useGetMyWallet, getGetMyWalletQueryKey } from '@workspace/api-client-react';

const tr = (lang: string, ar: string, en: string) => (lang === 'ar' ? ar : en);

export default function WalletScreen() {
  const colors = useColors();
  const { t, lang } = useLanguage();
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const topInset = Platform.OS === 'web' ? 67 : insets.top;
  const bottomInset = Platform.OS === 'web' ? 34 : Math.max(insets.bottom, 20);

  const { data: wallet, isLoading, refetch, isRefetching } = useGetMyWallet({
    query: { enabled: !!user, queryKey: getGetMyWalletQueryKey() },
  });

  const [isRefreshing, setIsRefreshing] = useState(false);
  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await refetch();
    setIsRefreshing(false);
  }, [refetch]);

  const handleAction = (actionName: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert(t('common.comingSoon'), t('wallet.actionSoon').replace('{action}', actionName));
  };

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString(lang === 'ar' ? 'ar-SA' : 'en-US', { day: 'numeric', month: 'short', year: 'numeric' });

  const header = (
    <View style={[styles.header, { paddingTop: topInset + 12, backgroundColor: '#052B5B' }]}>
      <View style={styles.headerRow}>
        <Pressable onPress={() => router.back()} hitSlop={10}>
          <Ionicons name="arrow-forward" size={24} color="#FFFFFF" />
        </Pressable>
        <Text style={[styles.headerTitle, { fontFamily: 'Cairo_700Bold' }]}>{t('payment.wallet')}</Text>
        <View style={{ width: 24 }} />
      </View>
    </View>
  );

  // Not signed in → prompt to log in (wallet is per-user).
  if (!user) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        {header}
        <View style={styles.centerWrap}>
          <EmptyState
            icon="wallet-outline"
            title={tr(lang, 'سجّل الدخول لعرض محفظتك', 'Sign in to view your wallet')}
            description={tr(lang, 'الرصيد والمعاملات مرتبطة بحسابك.', 'Balance and transactions are tied to your account.')}
          />
          <Pressable
            style={({ pressed }) => [styles.loginBtn, { backgroundColor: '#052B5B', opacity: pressed ? 0.85 : 1 }]}
            onPress={() => router.push('/auth/login')}
          >
            <Text style={[styles.loginBtnText, { fontFamily: 'Cairo_700Bold' }]}>{tr(lang, 'تسجيل الدخول', 'Sign in')}</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  if (isLoading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        {header}
        <View style={styles.centerWrap}>
          <ActivityIndicator size="large" color="#D4AF37" />
        </View>
      </View>
    );
  }

  // Feature disabled from the admin dashboard → the wallet disappears entirely.
  if (wallet && !wallet.enabled) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        {header}
        <View style={styles.centerWrap}>
          <EmptyState
            icon="wallet-outline"
            title={tr(lang, 'المحفظة غير متاحة حالياً', 'Wallet is currently unavailable')}
            description={tr(lang, 'تم إيقاف خدمة المحفظة مؤقتاً.', 'The wallet service is temporarily disabled.')}
          />
        </View>
      </View>
    );
  }

  const balance = wallet?.balance ?? 0;
  const currencyLabel = wallet?.currency === 'SAR' ? t('wallet.currency') : (wallet?.currency ?? t('wallet.currency'));
  const transactions = wallet?.transactions ?? [];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {header}

      <ScrollView
        contentContainerStyle={{ paddingBottom: bottomInset + 40 }}
        refreshControl={
          <RefreshControl refreshing={isRefreshing || isRefetching} onRefresh={handleRefresh} tintColor="#D4AF37" />
        }
      >
        {/* Balance Card */}
        <View style={styles.cardContainer}>
          <LinearGradient
            colors={['#1e3c72', '#052B5B']}
            style={styles.balanceCard}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <View style={styles.cardDeco1} />
            <View style={styles.cardDeco2} />

            <View style={styles.cardHeader}>
              <View style={[styles.badge, { backgroundColor: 'rgba(212, 175, 55, 0.2)' }]}>
                <Text style={[styles.badgeText, { color: '#D4AF37', fontFamily: 'Cairo_600SemiBold' }]}>{t('wallet.active')}</Text>
              </View>
              <Text style={[styles.cardLabel, { fontFamily: 'Cairo_400Regular' }]}>{t('wallet.availableBalance')}</Text>
            </View>

            <View style={styles.balanceRow}>
              <Text style={[styles.currency, { fontFamily: 'Cairo_600SemiBold' }]}>{currencyLabel}</Text>
              <Text style={[styles.balanceAmount, { fontFamily: 'Cairo_700Bold' }]}>
                {balance.toLocaleString(lang === 'ar' ? 'ar-SA' : 'en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </Text>
            </View>

            <View style={styles.cardFooter}>
              <Text style={[styles.accountLabel, { fontFamily: 'Cairo_400Regular' }]}>
                {tr(lang, 'صاحب المحفظة', 'Wallet holder')}
              </Text>
              <Text style={[styles.accountNumber, { fontFamily: 'Cairo_600SemiBold' }]} numberOfLines={1}>
                {[user.firstName, user.lastName].filter(Boolean).join(' ') || user.email}
              </Text>
            </View>
          </LinearGradient>
        </View>

        {/* Quick Actions */}
        <View style={styles.actionsRow}>
          <Pressable style={styles.actionBtn} onPress={() => handleAction(t('wallet.withdraw'))}>
            <View style={[styles.actionIconWrap, { backgroundColor: colors.muted }]}>
              <Ionicons name="arrow-down-outline" size={24} color="#052B5B" />
            </View>
            <Text style={[styles.actionText, { color: colors.foreground, fontFamily: 'Cairo_600SemiBold' }]}>{t('wallet.withdraw')}</Text>
          </Pressable>
          <Pressable style={styles.actionBtn} onPress={() => handleAction(t('wallet.transfer'))}>
            <View style={[styles.actionIconWrap, { backgroundColor: colors.muted }]}>
              <Ionicons name="swap-horizontal-outline" size={24} color="#052B5B" />
            </View>
            <Text style={[styles.actionText, { color: colors.foreground, fontFamily: 'Cairo_600SemiBold' }]}>{t('wallet.transfer')}</Text>
          </Pressable>
          <Pressable style={styles.actionBtn} onPress={() => handleAction(t('wallet.deposit'))}>
            <View style={[styles.actionIconWrap, { backgroundColor: '#FFF9E6' }]}>
              <Ionicons name="add-outline" size={24} color="#D4AF37" />
            </View>
            <Text style={[styles.actionText, { color: colors.foreground, fontFamily: 'Cairo_600SemiBold' }]}>{t('wallet.deposit')}</Text>
          </Pressable>
        </View>

        {/* Transactions List */}
        <View style={styles.transactionsSection}>
          <View style={styles.transactionsHeader}>
            <Text style={[styles.transactionsTitle, { color: colors.foreground, fontFamily: 'Cairo_700Bold' }]}>{t('wallet.history')}</Text>
          </View>

          {transactions.length === 0 ? (
            <EmptyState
              icon="receipt-outline"
              title={t('wallet.empty.title')}
              description={t('wallet.empty.desc')}
            />
          ) : (
            <View style={[styles.transactionsList, { backgroundColor: colors.card }]}>
              {transactions.map((tx, index) => {
                const isCredit = tx.type === 'credit';
                const txColor = isCredit ? '#16A34A' : colors.foreground;
                const statusLabel =
                  tx.status === 'completed' ? t('wallet.txSuccess')
                  : tx.status === 'pending' ? tr(lang, 'قيد المعالجة', 'Pending')
                  : tr(lang, 'فشلت', 'Failed');
                return (
                  <View
                    key={tx.id}
                    style={[
                      styles.transactionItem,
                      { borderBottomColor: colors.border },
                      index === transactions.length - 1 && { borderBottomWidth: 0 },
                    ]}
                  >
                    <View style={styles.txLeft}>
                      <Text style={[styles.txAmount, { color: txColor, fontFamily: 'Cairo_700Bold' }]}>
                        {isCredit ? '+' : '-'}{tx.amount.toLocaleString(lang === 'ar' ? 'ar-SA' : 'en-US')} {currencyLabel}
                      </Text>
                      <Text style={[styles.txDate, { color: colors.mutedForeground, fontFamily: 'Cairo_400Regular' }]}>
                        {formatDate(tx.createdAt)}
                      </Text>
                    </View>

                    <View style={styles.txRight}>
                      <View style={styles.txInfo}>
                        <Text style={[styles.txTitle, { color: colors.foreground, fontFamily: 'Cairo_600SemiBold' }]} numberOfLines={1}>
                          {lang === 'ar' ? tx.titleAr : tx.titleEn}
                        </Text>
                        <Text style={[styles.txStatus, { color: colors.mutedForeground, fontFamily: 'Cairo_400Regular' }]}>
                          {statusLabel}
                        </Text>
                      </View>
                      <View style={[styles.txIconWrap, { backgroundColor: isCredit ? 'rgba(22, 163, 74, 0.1)' : colors.muted }]}>
                        <Ionicons
                          name={isCredit ? 'arrow-down-outline' : 'arrow-up-outline'}
                          size={18}
                          color={isCredit ? '#16A34A' : '#052B5B'}
                        />
                      </View>
                    </View>
                  </View>
                );
              })}
            </View>
          )}
        </View>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 16, paddingBottom: 16 },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  headerTitle: { color: '#FFFFFF', fontSize: 20 },

  centerWrap: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24, gap: 16 },
  loginBtn: { paddingHorizontal: 32, paddingVertical: 12, borderRadius: 14 },
  loginBtnText: { color: '#FFFFFF', fontSize: 16 },

  cardContainer: { padding: 16, marginTop: 8 },
  balanceCard: {
    borderRadius: 20,
    padding: 24,
    height: 180,
    justifyContent: 'space-between',
    overflow: 'hidden',
    shadowColor: '#052B5B',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  cardDeco1: { position: 'absolute', width: 200, height: 200, borderRadius: 100, backgroundColor: 'rgba(255,255,255,0.05)', top: -50, right: -50 },
  cardDeco2: { position: 'absolute', width: 150, height: 150, borderRadius: 75, backgroundColor: 'rgba(212, 175, 55, 0.08)', bottom: -40, left: -20 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardLabel: { color: 'rgba(255,255,255,0.8)', fontSize: 15 },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  badgeText: { fontSize: 12 },
  balanceRow: { flexDirection: 'row', alignItems: 'baseline', gap: 6, alignSelf: 'flex-end', marginTop: 10 },
  balanceAmount: { color: '#FFFFFF', fontSize: 40, lineHeight: 48 },
  currency: { color: '#D4AF37', fontSize: 18 },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 },
  accountLabel: { color: 'rgba(255,255,255,0.6)', fontSize: 12 },
  accountNumber: { color: 'rgba(255,255,255,0.9)', fontSize: 14, maxWidth: 200 },

  actionsRow: { flexDirection: 'row', paddingHorizontal: 24, paddingVertical: 16, justifyContent: 'space-around' },
  actionBtn: { alignItems: 'center', gap: 8 },
  actionIconWrap: { width: 56, height: 56, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  actionText: { fontSize: 14 },

  transactionsSection: { padding: 16, marginTop: 8 },
  transactionsHeader: { marginBottom: 12, paddingHorizontal: 4 },
  transactionsTitle: { fontSize: 18, textAlign: 'right' },
  transactionsList: { borderRadius: 16, overflow: 'hidden' },
  transactionItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: StyleSheet.hairlineWidth },
  txLeft: { alignItems: 'flex-start', gap: 4 },
  txAmount: { fontSize: 16, writingDirection: 'ltr' },
  txDate: { fontSize: 12 },
  txRight: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1, justifyContent: 'flex-end' },
  txInfo: { alignItems: 'flex-end', gap: 2, flex: 1 },
  txTitle: { fontSize: 15, textAlign: 'right' },
  txStatus: { fontSize: 12 },
  txIconWrap: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
});
