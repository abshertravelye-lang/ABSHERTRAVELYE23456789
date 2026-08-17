import React, { useRef } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useColors } from '@/hooks/useColors';
import { useLanguage } from '@/context/LanguageContext';
import { getImageUrl } from '@/hooks/useImageUrl';
import colors from '@/constants/colors';
import type { Program } from '@workspace/api-client-react';

type Props = { program: Program; onPress?: () => void; wide?: boolean };

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function ProgramCard({ program, onPress, wide }: Props) {
  const c = useColors();
  const { lang } = useLanguage();
  const imageUri = getImageUrl(program.imageUrl);
  const cardWidth = wide ? '100%' : 220;

  const scale = useSharedValue(1);
  const lastPress = useRef(0);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePress = () => {
    const now = Date.now();
    if (now - lastPress.current < 500) return;
    lastPress.current = now;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress?.();
  };

  const formattedPrice = program.price.toLocaleString(lang === 'ar' ? 'ar-SA' : 'en-US');

  return (
    <AnimatedPressable
      style={[
        styles.card,
        { backgroundColor: c.card, shadowColor: c.primary, width: cardWidth as any },
        animStyle,
      ]}
      onPress={handlePress}
      onPressIn={() => {
        scale.value = withSpring(0.97, { damping: 20, stiffness: 300 });
      }}
      onPressOut={() => {
        scale.value = withSpring(1, { damping: 18, stiffness: 260 });
      }}
    >
      {/* Image */}
      <View style={styles.imgWrap}>
        <Image
          source={imageUri ? { uri: imageUri } : require('@/assets/images/hero.jpg')}
          style={[styles.image, wide && { height: 190 }]}
          contentFit="cover"
          transition={300}
        />
        {/* Price badge overlay */}
        <View style={styles.priceBadge}>
          <Text style={[styles.priceText, { fontFamily: 'Cairo_700Bold' }]}>
            {formattedPrice} {program.currency || (lang === 'ar' ? 'ريال' : 'SAR')}
          </Text>
        </View>
      </View>

      {/* Body */}
      <View style={styles.body}>
        <Text
          style={[styles.title, { color: c.foreground, fontFamily: 'Cairo_700Bold' }]}
          numberOfLines={2}
        >
          {program.titleAr}
        </Text>

        {/* Meta */}
        <View style={styles.meta}>
          {program.country ? (
            <View style={styles.metaChip}>
              <Ionicons name="location-outline" size={12} color={c.textSecondary} />
              <Text style={[styles.metaText, { color: c.textSecondary, fontFamily: 'Cairo_400Regular' }]}>
                {program.country}
              </Text>
            </View>
          ) : null}
          <View style={styles.metaChip}>
            <Ionicons name="time-outline" size={12} color={c.textSecondary} />
            <Text style={[styles.metaText, { color: c.textSecondary, fontFamily: 'Cairo_400Regular' }]}>
              {program.days} {lang === 'ar' ? 'يوم' : 'days'}
            </Text>
          </View>
        </View>

        {/* Footer */}
        <View style={[styles.footer, { borderTopColor: c.border }]}>
          <View style={[styles.bookBtn, { backgroundColor: c.primary }]}>
            <Ionicons name="arrow-back" size={14} color={colors.static.premiumGold} />
            <Text style={[styles.bookBtnText, { fontFamily: 'Cairo_700Bold' }]}>
              {lang === 'ar' ? 'التفاصيل' : 'Details'}
            </Text>
          </View>
        </View>
      </View>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 18,
    overflow: 'hidden',
    marginLeft: 12,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  imgWrap: { position: 'relative' },
  image: { width: '100%', height: 148 },
  priceBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: colors.static.premiumGold,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  priceText: {
    color: colors.static.primaryNavy,
    fontSize: 12,
  },
  body: { padding: 14 },
  title: { fontSize: 14, marginBottom: 10, textAlign: 'right', lineHeight: 22 },
  meta: {
    flexDirection: 'row-reverse',
    gap: 8,
    marginBottom: 12,
    flexWrap: 'wrap',
  },
  metaChip: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 3,
  },
  metaText: { fontSize: 11 },
  footer: {
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: 10,
    alignItems: 'flex-end',
  },
  bookBtn: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 6,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  bookBtnText: { color: colors.static.premiumGold, fontSize: 13 },
});
