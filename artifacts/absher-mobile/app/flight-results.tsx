import React, { useMemo, useState } from 'react';
import { FlatList, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import { useLanguage } from '@/context/LanguageContext';
import { useSearchFlights } from '@workspace/api-client-react';
import type { SearchFlightsParams } from '@workspace/api-client-react';
import { FlightCard } from '@/components/FlightCard';
import { EmptyState } from '@/components/EmptyState';

const SORT_OPTS = [
  { value: 'cheapest', labelKey: 'flightResults.sort.cheapest' },
  { value: 'fastest', labelKey: 'flightResults.sort.fastest' },
  { value: 'best_value', labelKey: 'flightResults.sort.best' },
];

export default function FlightResultsScreen() {
  const { q } = useLocalSearchParams<{ q: string }>();
  const colors = useColors();
  const { t } = useLanguage();
  const insets = useSafeAreaInsets();
  const topInset = Platform.OS === 'web' ? 67 : insets.top;
  const bottomInset = Platform.OS === 'web' ? 34 : 0;

  const [sort, setSort] = useState<'cheapest' | 'fastest' | 'best_value'>('cheapest');

  const params = useMemo<SearchFlightsParams>(() => {
    try {
      const parsed = JSON.parse(q || '{}');
      return { ...parsed, sort };
    } catch {
      return { sort };
    }
  }, [q, sort]);

  const { data, isLoading, error } = useSearchFlights(params);

  const origin = params.origin;
  const dest = params.destination;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: topInset + 12, backgroundColor: '#052B5B', paddingBottom: 16 }]}>
        <View style={styles.headerRow}>
          <Pressable onPress={() => router.back()}>
            <Ionicons name="arrow-forward" size={22} color="#FFFFFF" />
          </Pressable>
          <View style={styles.routeInfo}>
            <Text style={[styles.routeText, { fontFamily: 'Cairo_700Bold' }]}>
              {origin} → {dest}
            </Text>
            <Text style={[styles.routeSub, { fontFamily: 'Cairo_400Regular' }]}>
              {params.departureDate} · {params.adults || 1} {t('flightResults.passenger')}
            </Text>
          </View>
          <View style={{ width: 22 }} />
        </View>

        {/* Sort */}
        <View style={styles.sortRow}>
          {SORT_OPTS.map((s) => (
            <Pressable
              key={s.value}
              style={[styles.sortChip, { backgroundColor: sort === s.value ? '#D4AF37' : 'rgba(255,255,255,0.15)' }]}
              onPress={() => setSort(s.value as any)}
            >
              <Text style={[styles.sortText, { color: sort === s.value ? '#052B5B' : 'rgba(255,255,255,0.8)', fontFamily: 'Cairo_600SemiBold' }]}>
                {t(s.labelKey)}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      {error ? (
        <EmptyState icon="airplane-outline" title={t('flightResults.searchError')} description={t('flightResults.searchErrorDesc')} actionLabel={t('flightResults.back')} onAction={() => router.back()} />
      ) : isLoading ? (
        <EmptyState loading title={t('flightResults.searching')} />
      ) : !data?.offers?.length ? (
        <EmptyState icon="airplane-outline" title={t('flightResults.noFlights')} description={t('flightResults.noFlightsDesc')} actionLabel={t('flightResults.newSearch')} onAction={() => router.back()} />
      ) : (
        <>
          <View style={[styles.resultsMeta, { backgroundColor: colors.muted }]}>
            <Text style={[styles.resultsCount, { color: colors.mutedForeground, fontFamily: 'Cairo_400Regular' }]}>
              {t('flightResults.available').replace('{count}', String(data.totalResults))}
            </Text>
          </View>
          <FlatList
            data={data.offers}
            keyExtractor={(o) => o.providerOfferId}
            renderItem={({ item }) => (
              <FlightCard
                offer={item}
                onPress={() =>
                  router.push({
                    pathname: '/flight-booking',
                    params: { offer: JSON.stringify(item) },
                  })
                }
              />
            )}
            contentContainerStyle={{ padding: 16, paddingBottom: bottomInset + 20 }}
            showsVerticalScrollIndicator={false}
          />
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 16 },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  routeInfo: { alignItems: 'center' },
  routeText: { color: '#FFFFFF', fontSize: 18 },
  routeSub: { color: 'rgba(255,255,255,0.7)', fontSize: 13, marginTop: 2 },
  sortRow: { flexDirection: 'row', gap: 8 },
  sortChip: { flex: 1, borderRadius: 20, paddingVertical: 8, alignItems: 'center' },
  sortText: { fontSize: 13 },
  resultsMeta: { paddingHorizontal: 16, paddingVertical: 8 },
  resultsCount: { fontSize: 13, textAlign: 'right' },
});
