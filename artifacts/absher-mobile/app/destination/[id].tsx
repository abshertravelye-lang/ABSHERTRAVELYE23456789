import React from 'react';
import { ActivityIndicator, FlatList, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import { useGetDestination, useListPrograms } from '@workspace/api-client-react';
import { getImageUrl } from '@/hooks/useImageUrl';
import { ProgramCard } from '@/components/ProgramCard';

export default function DestinationDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colors = useColors();
  const insets = useSafeAreaInsets();

  const { data: dest, isLoading } = useGetDestination(Number(id));
  const { data: programs } = useListPrograms();

  if (isLoading) return <View style={[styles.loading, { backgroundColor: colors.background }]}><ActivityIndicator size="large" color="#2563EB" /></View>;
  if (!dest) return <View style={[styles.loading, { backgroundColor: colors.background }]}><Text style={{ fontFamily: 'Cairo_400Regular', color: colors.mutedForeground }}>لم يتم العثور على الوجهة</Text></View>;

  const imageUri = getImageUrl(dest.imageUrl);
  const relatedPrograms = programs?.filter((p) => p.country === dest.country).slice(0, 5);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Hero */}
        <View style={styles.heroWrapper}>
          <Image
            source={imageUri ? { uri: imageUri } : require('@/assets/images/hero.jpg')}
            style={styles.hero}
            contentFit="cover"
          />
          <LinearGradient colors={['rgba(10,35,66,0.6)', 'transparent', 'transparent']} style={StyleSheet.absoluteFill} />
          <Pressable style={[styles.backBtn, { top: insets.top + 12 }]} onPress={() => router.back()}>
            <Ionicons name="arrow-forward" size={22} color="#FFFFFF" />
          </Pressable>
          <View style={[styles.heroInfo, { bottom: 0 }]}>
            <LinearGradient colors={['transparent', 'rgba(10,35,66,0.85)']} style={StyleSheet.absoluteFill} />
            <View style={{ padding: 20, paddingTop: 40 }}>
              <Text style={[styles.destName, { fontFamily: 'Cairo_700Bold' }]}>{dest.nameAr}</Text>
              <Text style={[styles.destCountry, { fontFamily: 'Cairo_400Regular' }]}>{dest.country}</Text>
            </View>
          </View>
        </View>

        <View style={styles.content}>
          {dest.descriptionAr && (
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.foreground, fontFamily: 'Cairo_700Bold' }]}>عن الوجهة</Text>
              <Text style={[styles.desc, { color: colors.mutedForeground, fontFamily: 'Cairo_400Regular' }]}>{dest.descriptionAr}</Text>
            </View>
          )}

          {!!relatedPrograms?.length && (
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.foreground, fontFamily: 'Cairo_700Bold' }]}>برامج في {dest.nameAr}</Text>
              <FlatList
                horizontal
                inverted
                data={relatedPrograms}
                keyExtractor={(p) => String(p.id)}
                renderItem={({ item }) => (
                  <ProgramCard program={item} onPress={() => router.push(`/program/${item.id}` as any)} />
                )}
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ paddingLeft: 4 }}
              />
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  heroWrapper: { position: 'relative', height: 300 },
  hero: { width: '100%', height: '100%' },
  backBtn: { position: 'absolute', right: 16, width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(0,0,0,0.4)', alignItems: 'center', justifyContent: 'center' },
  heroInfo: { position: 'absolute', left: 0, right: 0 },
  destName: { color: '#FFFFFF', fontSize: 26 },
  destCountry: { color: 'rgba(255,255,255,0.8)', fontSize: 15 },
  content: { padding: 20 },
  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 18, textAlign: 'right', marginBottom: 10 },
  desc: { fontSize: 14, lineHeight: 24, textAlign: 'right' },
});
