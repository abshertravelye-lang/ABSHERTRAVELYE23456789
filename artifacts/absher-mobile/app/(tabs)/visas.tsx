import React, { useMemo, useState } from 'react';
import {
  FlatList, Platform, Pressable, RefreshControl, ScrollView,
  StyleSheet, Text, TextInput, View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLanguage } from '@/context/LanguageContext';
import { useColors } from '@/hooks/useColors';
import { useListVisas, useGetCurrentUser, getGetCurrentUserQueryKey } from '@workspace/api-client-react';
import { isSameCountry } from '@workspace/countries';
import { useAuth } from '@/context/AuthContext';
import { VisaCard, VisaCardHorizontal } from '@/components/VisaCard';
import { EmptyState, SkeletonRow } from '@/components/EmptyState';
import { VisaCategories, VisaCategory } from '@/components/visas/VisaCategories';

// ── filter data ──────────────────────────────────────────────────────────────

function getEntryFilters(t: any) {
  return [

  { value: '', label: t('visas.filter.anyEntry') },
  { value: 'single', label: t('visas.filter.singleEntry') },
  { value: 'multiple', label: t('visas.filter.multipleEntry') },
  ] as const;
}

function getProcFilters(t: any) {
  return [

  { value: '', label: t('visas.filter.anyDuration') },
  { value: 'express', label: t('visas.speed.fast') },
  { value: 'standard', label: t('visas.speed.standard') },
  { value: 'long', label: t('visas.speed.slow') },
  ] as const;
}

// ── Section header ────────────────────────────────────────────────────────────

function SectionHeader({
  icon, title, subtitle, color,
}: { icon: string; title: string; subtitle?: string; color: string }) {
  const colors = useColors();
  return (
    <View style={styles.sectionHeader}>
      <View style={[styles.sectionIconWrap, { backgroundColor: color + '18' }]}>
        <Ionicons name={icon as any} size={20} color={color} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[styles.sectionTitle, { color: colors.foreground, fontFamily: 'Cairo_700Bold' }]}>{title}</Text>
        {subtitle && <Text style={[styles.sectionSub, { color: colors.mutedForeground, fontFamily: 'Cairo_400Regular' }]}>{subtitle}</Text>}
      </View>
    </View>
  );
}

// ── Main Screen ───────────────────────────────────────────────────────────────

export default function VisasScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { t } = useLanguage();
  const topInset = Platform.OS === 'web' ? 67 : insets.top;
  const bottomInset = Platform.OS === 'web' ? 34 : 0;

  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<VisaCategory>('');
  const [entryType, setEntryType] = useState('');
  const [processing, setProcessing] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  const { data: visas, isLoading, error, refetch, isRefetching } = useListVisas();

  // Profile-driven eligibility: signed-in users with a stored nationality only
  // see visas they qualify for. The server re-checks on application; this is a
  // UX filter, not security.
  const { user: authUser } = useAuth();
  const { data: currentUser } = useGetCurrentUser({
    query: { staleTime: 30000, queryKey: getGetCurrentUserQueryKey(), enabled: !!authUser },
  });
  const nationality = (currentUser as any)?.nationality || (authUser as any)?.nationality || '';

  const active = useMemo(() => {
    let list = (visas || []).filter(v => v.isActive && v.status === 'available');
    if (nationality) {
      list = list.filter(v => {
        if ((v.blockedNationalities ?? []).some(n => isSameCountry(n, nationality))) return false;
        const allowed = v.allowedNationalities ?? [];
        if (allowed.length > 0 && !allowed.some(n => isSameCountry(n, nationality))) return false;
        return true;
      });
    }
    return list;
  }, [visas, nationality]);

  const filtered = useMemo(() => {
    return active.filter((v) => {
      const matchSearch = !search ||
        v.countryAr.includes(search) ||
        (v.countryEn && v.countryEn.toLowerCase().includes(search.toLowerCase()));
      const matchCat = !category || v.category === category;
      const matchEntry = !entryType || v.entryType === entryType;
      const matchProc = !processing ||
        (processing === 'express' && v.processingDays <= 3) ||
        (processing === 'standard' && v.processingDays >= 4 && v.processingDays <= 7) ||
        (processing === 'long' && v.processingDays > 7);
      return matchSearch && matchCat && matchEntry && matchProc;
    });
  }, [active, search, category, entryType, processing]);

  // Section lists
  const fastApproval = useMemo(() => active.filter(v => v.processingDays <= 3), [active]);
  const multipleEntry = useMemo(() => active.filter(v => v.entryType === 'multiple'), [active]);
  const affordable = useMemo(() => [...active].sort((a, b) => Number(a.fee) - Number(b.fee)).slice(0, 8), [active]);
  const recentlyAdded = useMemo(() => [...active].sort((a, b) => b.id - a.id).slice(0, 8), [active]);

  const isSearching = !!(search || category || entryType || processing);

  const navToVisa = (id: number) => router.push(`/visa/${id}` as any);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>

      {/* ── Header ── */}
      <LinearGradient
        colors={['#071525', colors.navy, '#1A3460']}
        style={[styles.header, { paddingTop: topInset + 12 }]}
      >
        <View style={styles.headerTop}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.headerTitle, { fontFamily: 'Cairo_700Bold' }]}>{t('visas.hub.title')}</Text>
            <Text style={[styles.headerSub, { fontFamily: 'Cairo_400Regular' }]}>
              {active.length > 0 ? `${active.length}+ ${t('visas.hub.availableVisas')}` : t('visas.hub.allDestinations')}
            </Text>
          </View>
          <Pressable
            onPress={() => setShowFilters(!showFilters)}
            style={[styles.filterBtn, { backgroundColor: showFilters ? colors.gold : 'rgba(255,255,255,0.15)' }]}
          >
            <Ionicons name="options-outline" size={20} color={showFilters ? colors.navy : '#FFFFFF'} />
          </Pressable>
        </View>

        {/* Search */}
        <View style={[styles.searchBar, { backgroundColor: 'rgba(255,255,255,0.12)', borderColor: 'rgba(212,175,55,0.35)' }]}>
          <Ionicons name="search" size={18} color={colors.gold} />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder={t('visas.hub.searchPlaceholder') as string}
            placeholderTextColor="rgba(255,255,255,0.45)"
            style={[styles.searchInput, { color: '#FFFFFF', fontFamily: 'Cairo_400Regular' }]}
          />
          {!!search && (
            <Pressable onPress={() => setSearch('')}>
              <Ionicons name="close-circle" size={18} color="rgba(255,255,255,0.6)" />
            </Pressable>
          )}
        </View>

        {/* Stats Row */}
        <View style={styles.statsRow}>
          {[
            { n: `${active.length}+`, l: t('visas.hub.visaCount') },
            { n: `${fastApproval.length}+`, l: t('visas.hub.fastApproval') },
            { n: `${multipleEntry.length}+`, l: t('visas.hub.multipleEntry') },
          ].map((s, i) => (
            <View key={i} style={styles.statItem}>
              <Text style={[styles.statNum, { color: colors.gold, fontFamily: 'Cairo_700Bold' }]}>{s.n}</Text>
              <Text style={[styles.statLabel, { fontFamily: 'Cairo_400Regular' }]}>{s.l}</Text>
            </View>
          ))}
        </View>
      </LinearGradient>

      {/* ── Extra Filters Panel ── */}
      {showFilters && (
        <View style={[styles.filtersPanel, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
          <Text style={[styles.filterGroupLabel, { color: colors.mutedForeground, fontFamily: 'Cairo_600SemiBold' }]}>
            {t('visas.filter.entryType')}
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 10 }}>
            <View style={{ flexDirection: 'row', gap: 8, paddingHorizontal: 16 }}>
              {getEntryFilters(t).map(f => (
                <Pressable
                  key={f.value}
                  onPress={() => setEntryType(f.value)}
                  style={[styles.filterChip, {
                    backgroundColor: entryType === f.value ? colors.navy : colors.muted,
                    borderColor: entryType === f.value ? colors.navy : colors.border,
                  }]}
                >
                  <Text style={[styles.filterChipText, {
                    color: entryType === f.value ? '#FFFFFF' : colors.mutedForeground,
                    fontFamily: 'Cairo_600SemiBold',
                  }]}>{f.label}</Text>
                </Pressable>
              ))}
            </View>
          </ScrollView>

          <Text style={[styles.filterGroupLabel, { color: colors.mutedForeground, fontFamily: 'Cairo_600SemiBold' }]}>
            {t('visas.filter.processingTime')}
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={{ flexDirection: 'row', gap: 8, paddingHorizontal: 16 }}>
              {getProcFilters(t).map(f => (
                <Pressable
                  key={f.value}
                  onPress={() => setProcessing(f.value)}
                  style={[styles.filterChip, {
                    backgroundColor: processing === f.value ? colors.gold : colors.muted,
                    borderColor: processing === f.value ? colors.gold : colors.border,
                  }]}
                >
                  <Text style={[styles.filterChipText, {
                    color: processing === f.value ? colors.navy : colors.mutedForeground,
                    fontFamily: 'Cairo_600SemiBold',
                  }]}>{f.label}</Text>
                </Pressable>
              ))}
            </View>
          </ScrollView>
        </View>
      )}

      {/* ── Premium Category chips ── */}
      <VisaCategories selected={category} onSelect={setCategory} />

      {/* ── Content ── */}
      {error ? (
        <EmptyState icon="wifi-outline" title={t('common.loadingError')} description={t('visas.error.loading')} actionLabel={t('common.retry')} onAction={() => refetch()} />
      ) : isLoading ? (
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16, gap: 14 }}>
          <SkeletonRow height={200} />
          <SkeletonRow height={200} />
          <SkeletonRow height={200} />
        </ScrollView>
      ) : isSearching ? (
        /* Search / filter results */
        <FlatList
          data={filtered}
          keyExtractor={v => String(v.id)}
          renderItem={({ item }) => (
            <VisaCard visa={item} onPress={() => navToVisa(item.id)} style={{ marginHorizontal: 16 }} />
          )}
          contentContainerStyle={{ padding: 16, paddingBottom: bottomInset + 100 }}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={() => refetch()} tintColor={colors.gold} colors={[colors.gold]} />}
          ListHeaderComponent={
            <Text style={[styles.resultsCount, { color: colors.mutedForeground, fontFamily: 'Cairo_400Regular' }]}>
              {filtered.length} {t('common.result')}
            </Text>
          }
          ListEmptyComponent={
            <EmptyState icon="document-text-outline" title={t('visas.empty.title')} description={t('visas.empty.noMatch')} />
          }
        />
      ) : (
        /* Sections view */
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: bottomInset + 100 }}
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={() => refetch()} tintColor={colors.gold} colors={[colors.gold]} />}
        >
          {/* Umrah special banner */}
          <Pressable
            style={styles.umrahBanner}
            onPress={() => router.push('/umrah-visa' as any)}
          >
            <LinearGradient
              colors={[colors.navy, '#1E3A5F']}
              style={styles.umrahGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <View style={styles.umrahLeft}>
                <View style={styles.umrahIconWrap}>
                  <Ionicons name="moon" size={26} color={colors.gold} />
                </View>
              </View>
              <View style={styles.umrahText}>
                <Text style={[styles.umrahTitle, { color: colors.gold, fontFamily: 'Cairo_700Bold' }]}>{t('umrah.title')}</Text>
                <Text style={[styles.umrahSub, { fontFamily: 'Cairo_400Regular' }]}>{t('umrah.instantApply')}</Text>
              </View>
              <Ionicons name="arrow-back" size={20} color={colors.gold} />
            </LinearGradient>
          </Pressable>

          {/* Fast Approval */}
          {fastApproval.length > 0 && (
            <View style={styles.section}>
              <SectionHeader icon="flash" title={t('visas.hub.fastApproval')} subtitle={`${fastApproval.length} ${t('visas.section.fastApprovalSub')}`} color={colors.gold} />
              <FlatList
                horizontal
                inverted
                data={fastApproval}
                keyExtractor={v => `fa-${v.id}`}
                renderItem={({ item }) => (
                  <VisaCardHorizontal visa={item} onPress={() => navToVisa(item.id)} width={185} />
                )}
                contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 4 }}
                showsHorizontalScrollIndicator={false}
              />
            </View>
          )}

          {/* Most Affordable */}
          {affordable.length > 0 && (
            <View style={styles.section}>
              <SectionHeader icon="pricetag" title={t('visas.section.lowestPrice')} subtitle={t('visas.section.lowestPriceSub')} color={colors.success} />
              <FlatList
                horizontal
                inverted
                data={affordable}
                keyExtractor={v => `af-${v.id}`}
                renderItem={({ item }) => (
                  <VisaCardHorizontal visa={item} onPress={() => navToVisa(item.id)} width={185} />
                )}
                contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 4 }}
                showsHorizontalScrollIndicator={false}
              />
            </View>
          )}

          {/* Multiple Entry */}
          {multipleEntry.length > 0 && (
            <View style={styles.section}>
              <SectionHeader icon="airplane" title={t('visas.hub.multipleEntry')} subtitle={t('visas.section.multipleEntrySub')} color={colors.primaryActive} />
              <FlatList
                horizontal
                inverted
                data={multipleEntry}
                keyExtractor={v => `me-${v.id}`}
                renderItem={({ item }) => (
                  <VisaCardHorizontal visa={item} onPress={() => navToVisa(item.id)} width={185} />
                )}
                contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 4 }}
                showsHorizontalScrollIndicator={false}
              />
            </View>
          )}

          {/* Recently Added */}
          {recentlyAdded.length > 0 && (
            <View style={styles.section}>
              <SectionHeader icon="sparkles" title={t('visas.section.newest')} subtitle={t('visas.section.newestSub')} color="#8B5CF6" />
              <FlatList
                horizontal
                inverted
                data={recentlyAdded}
                keyExtractor={v => `ra-${v.id}`}
                renderItem={({ item }) => (
                  <VisaCardHorizontal visa={item} onPress={() => navToVisa(item.id)} width={185} />
                )}
                contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 4 }}
                showsHorizontalScrollIndicator={false}
              />
            </View>
          )}

          {/* All Visas vertical list */}
          {active.length > 0 && (
            <View style={styles.section}>
              <SectionHeader icon="globe" title={t('visas.category.all')} subtitle={`${active.length} ${t('visas.section.destinationsAvailable')}`} color={colors.navy} />
              <View style={{ paddingHorizontal: 16 }}>
                {active.slice(0, 20).map(item => (
                  <VisaCard key={item.id} visa={item} onPress={() => navToVisa(item.id)} />
                ))}
              </View>
            </View>
          )}

          {active.length === 0 && !isLoading && (
            <EmptyState icon="document-text-outline" title={t('visas.empty.title')} description={t('visas.empty.noVisas')} />
          )}
        </ScrollView>
      )}
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1 },
  // Header
  header: { paddingHorizontal: 16, paddingBottom: 16, borderBottomLeftRadius: 24, borderBottomRightRadius: 24 },
  headerTop: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 14 },
  headerTitle: { fontSize: 22, color: '#D4AF37', textAlign: 'right' },
  headerSub: { fontSize: 12, color: 'rgba(255,255,255,0.65)', textAlign: 'right' },
  filterBtn: {
    width: 40, height: 40, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center',
    marginStart: 12, marginTop: 2,
  },
  searchBar: {
    flexDirection: 'row', alignItems: 'center',
    borderRadius: 14, borderWidth: 1,
    paddingHorizontal: 14, paddingVertical: 11, gap: 10,
    minHeight: 48,
    marginBottom: 14,
  },
  searchInput: { flex: 1, fontSize: 14, textAlign: 'right' },
  // Stats
  statsRow: { flexDirection: 'row', justifyContent: 'space-around' },
  statItem: { alignItems: 'center' },
  statNum: { fontSize: 18 },
  statLabel: { fontSize: 11, color: 'rgba(255,255,255,0.6)', marginTop: 1 },
  // Filters panel
  filtersPanel: {
    paddingTop: 14, paddingBottom: 10, borderBottomWidth: 1,
  },
  filterGroupLabel: { fontSize: 12, textAlign: 'right', paddingHorizontal: 16, marginBottom: 8 },
  filterChip: {
    borderRadius: 20, borderWidth: 1,
    paddingHorizontal: 14, paddingVertical: 8,
  },
  filterChipText: { fontSize: 13 },
  // Sections
  section: { marginTop: 22 },
  sectionHeader: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingHorizontal: 16, marginBottom: 14,
  },
  sectionIconWrap: {
    width: 38, height: 38, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center',
  },
  sectionTitle: { fontSize: 16 },
  sectionSub: { fontSize: 11, marginTop: 1 },
  // Results
  resultsCount: { fontSize: 13, textAlign: 'right', marginBottom: 12 },
  // Umrah banner
  umrahBanner: {
    marginHorizontal: 16, marginTop: 16, borderRadius: 18,
    overflow: 'hidden', elevation: 4,
    shadowColor: '#052B5B', shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15, shadowRadius: 8,
  },
  umrahGradient: {
    flexDirection: 'row-reverse', alignItems: 'center',
    paddingHorizontal: 18, paddingVertical: 16, gap: 12,
  },
  umrahLeft: {},
  umrahIconWrap: {
    width: 48, height: 48, borderRadius: 24,
    backgroundColor: 'rgba(212,175,55,0.15)', borderWidth: 1.5,
    borderColor: 'rgba(212,175,55,0.4)', alignItems: 'center', justifyContent: 'center',
  },
  umrahText: { flex: 1, alignItems: 'flex-end' },
  umrahTitle: { fontSize: 16 },
  umrahSub: { fontSize: 12, color: 'rgba(255,255,255,0.7)', marginTop: 2 },
});
