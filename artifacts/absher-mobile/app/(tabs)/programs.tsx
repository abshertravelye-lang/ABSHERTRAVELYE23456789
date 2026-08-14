import React, { useMemo, useState } from 'react';
import { FlatList, Platform, Pressable, RefreshControl, StyleSheet, Text, TextInput, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import { useLanguage } from '@/context/LanguageContext';
import { useListPrograms } from '@workspace/api-client-react';
import { ProgramCard } from '@/components/ProgramCard';
import { EmptyState } from '@/components/EmptyState';

const SORT_OPTIONS = [
  { value: 'default', labelKey: 'programsTab.sort.newest' },
  { value: 'price_asc', labelKey: 'programsTab.sort.priceAsc' },
  { value: 'price_desc', labelKey: 'programsTab.sort.priceDesc' },
  { value: 'days_asc', labelKey: 'programsTab.sort.shortest' },
];

export default function ProgramsScreen() {
  const colors = useColors();
  const { t } = useLanguage();
  const insets = useSafeAreaInsets();
  const topInset = Platform.OS === 'web' ? 67 : insets.top;
  const bottomInset = Platform.OS === 'web' ? 34 : 0;

  const [search, setSearch] = useState('');
  const [sort, setSort] = useState('default');

  const { data: programs, isLoading, error, refetch } = useListPrograms();
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const filtered = useMemo(() => {
    if (!programs) return [];
    let list = programs.filter((p) => p.isActive && (!search || p.titleAr.includes(search)));
    if (sort === 'price_asc') list = [...list].sort((a, b) => a.price - b.price);
    else if (sort === 'price_desc') list = [...list].sort((a, b) => b.price - a.price);
    else if (sort === 'days_asc') list = [...list].sort((a, b) => a.days - b.days);
    return list;
  }, [programs, search, sort]);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <LinearGradient colors={['#071525', '#052B5B', '#1E3A5F']} style={[styles.header, { paddingTop: topInset + 16 }]}>
        <Text style={[styles.headerTitle, { fontFamily: 'Cairo_700Bold' }]}>{t('programsTab.title')}</Text>
        <Text style={[styles.headerSub, { fontFamily: 'Cairo_400Regular' }]}>
          {filtered.length > 0 ? t('programsTab.countAvailable').replace('{count}', String(filtered.length)) : t('programsTab.discover')}
        </Text>
        <View style={[styles.searchBar, { backgroundColor: 'rgba(255,255,255,0.12)', borderColor: 'rgba(212,175,55,0.35)' }]}>
          <Ionicons name="search" size={18} color="rgba(255,255,255,0.7)" />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder={t('programsTab.searchPlaceholder')}
            placeholderTextColor="rgba(255,255,255,0.5)"
            style={[styles.searchInput, { color: '#FFFFFF', fontFamily: 'Cairo_400Regular' }]}
          />
        </View>
      </LinearGradient>

      {/* Sort Chips */}
      <FlatList
        horizontal
        inverted
        data={SORT_OPTIONS}
        keyExtractor={(s) => s.value}
        renderItem={({ item }) => (
          <Pressable
            style={[styles.chip, { backgroundColor: sort === item.value ? '#D4AF37' : colors.muted }]}
            onPress={() => setSort(item.value)}
          >
            <Text style={[styles.chipText, { color: sort === item.value ? '#052B5B' : colors.mutedForeground, fontFamily: 'Cairo_600SemiBold' }]}>
              {t(item.labelKey)}
            </Text>
          </Pressable>
        )}
        contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 10, gap: 8 }}
        showsHorizontalScrollIndicator={false}
        style={[styles.chips, { borderBottomColor: colors.border }]}
      />

      {error ? (
        <EmptyState icon="globe-outline" title={t('programsTab.loadError')} actionLabel={t('programsTab.retry')} onAction={() => refetch()} />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(p) => String(p.id)}
          renderItem={({ item }) => (
            <ProgramCard
              program={item}
              wide
              onPress={() => router.push(`/program/${item.id}` as any)}
            />
          )}
          contentContainerStyle={{ padding: 16, paddingBottom: bottomInset + 90 }}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#D4AF37" colors={['#D4AF37']} />}
          ListEmptyComponent={
            isLoading
              ? <EmptyState loading title="" />
              : <EmptyState icon="globe-outline" title={t('programsTab.empty')} description={t('programsTab.emptyDesc')} />
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 16, paddingBottom: 16, borderBottomLeftRadius: 24, borderBottomRightRadius: 24 },
  headerTitle: { fontSize: 22, color: '#D4AF37', textAlign: 'right' },
  headerSub: { fontSize: 13, color: 'rgba(255,255,255,0.65)', textAlign: 'right', marginTop: 4, marginBottom: 12 },
  searchBar: { flexDirection: 'row', alignItems: 'center', borderRadius: 14, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 11, gap: 10 },
  searchInput: { flex: 1, fontSize: 15, textAlign: 'right' },
  chips: { borderBottomWidth: 1 },
  chip: { borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8 },
  chipText: { fontSize: 13 },
});
