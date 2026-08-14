import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '@/hooks/useColors';
import { getImageUrl } from '@/hooks/useImageUrl';
import type { Program } from '@workspace/api-client-react';

type Props = { program: Program; onPress?: () => void; wide?: boolean };

export function ProgramCard({ program, onPress, wide }: Props) {
  const colors = useColors();
  const imageUri = getImageUrl(program.imageUrl);
  const cardWidth = wide ? '100%' : 220;

  return (
    <Pressable
      style={({ pressed }) => [
        styles.card,
        { backgroundColor: colors.card, shadowColor: colors.primary, width: cardWidth, opacity: pressed ? 0.92 : 1 },
      ]}
      onPress={onPress}
    >
      <Image
        source={imageUri ? { uri: imageUri } : require('@/assets/images/hero.jpg')}
        style={[styles.image, wide && { height: 180 }]}
        contentFit="cover"
      />
      <View style={styles.body}>
        <Text style={[styles.title, { color: colors.foreground, fontFamily: 'Cairo_700Bold' }]} numberOfLines={2}>
          {program.titleAr}
        </Text>
        <View style={styles.meta}>
          <View style={styles.metaItem}>
            <Ionicons name="time-outline" size={13} color={colors.mutedForeground} />
            <Text style={[styles.metaText, { color: colors.mutedForeground, fontFamily: 'Cairo_400Regular' }]}>
              {program.days} يوم
            </Text>
          </View>
          {program.country && (
            <View style={styles.metaItem}>
              <Ionicons name="location-outline" size={13} color={colors.mutedForeground} />
              <Text style={[styles.metaText, { color: colors.mutedForeground, fontFamily: 'Cairo_400Regular' }]}>
                {program.country}
              </Text>
            </View>
          )}
        </View>
        <View style={[styles.footer, { borderTopColor: colors.border }]}>
          <Text style={[styles.price, { color: '#052B5B', fontFamily: 'Cairo_700Bold' }]}>
            {program.price.toLocaleString('ar-SA')} {program.currency || 'ريال'}
          </Text>
          <View style={[styles.bookBtn, { backgroundColor: '#052B5B' }]}>
            <Text style={[styles.bookBtnText, { fontFamily: 'Cairo_600SemiBold' }]}>احجز</Text>
          </View>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    overflow: 'hidden',
    marginLeft: 12,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  image: { width: '100%', height: 140 },
  body: { padding: 12 },
  title: { fontSize: 14, marginBottom: 8, textAlign: 'right' },
  meta: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10, marginBottom: 10 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  metaText: { fontSize: 12 },
  footer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1, paddingTop: 10 },
  price: { fontSize: 15 },
  bookBtn: { borderRadius: 8, paddingHorizontal: 12, paddingVertical: 5 },
  bookBtnText: { color: '#FFFFFF', fontSize: 12 },
});
