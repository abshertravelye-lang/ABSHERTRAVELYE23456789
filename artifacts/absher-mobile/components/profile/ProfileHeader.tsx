import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useColors } from '@/hooks/useColors';
import { useLanguage } from '@/context/LanguageContext';
import type { SafeUser } from '@workspace/api-client-react';
import { getImageSource } from '@/hooks/useImageUrl';

type ProfileHeaderProps = {
  user: SafeUser;
  completion: number;
  onEditPress: () => void;
  topInset: number;
};

export default function ProfileHeader({ user, completion, onEditPress, topInset }: ProfileHeaderProps) {
  const colors = useColors();
  const { t } = useLanguage();
  const avatarSource = getImageSource(user.profilePhotoUrl);
  const fullName = [user.firstName, user.lastName].filter(Boolean).join(' ') || user.email || user.phone || (t('profile.user') as string) || 'المستخدم';

  return (
    <LinearGradient 
      colors={[colors.primary, colors.card]} 
      locations={[0, 1]}
      style={[styles.container, { paddingTop: topInset + 20 }]}
    >
      <View style={styles.content}>
        <View style={styles.textContainer}>
          <Text style={[styles.name, { color: colors.primaryForeground, fontFamily: 'Cairo_700Bold' }]} numberOfLines={1}>
            {fullName}
          </Text>
          <Text style={[styles.contact, { color: colors.primaryForeground, fontFamily: 'Cairo_400Regular' }]} numberOfLines={1}>
            {user.email || user.phone || ''}
          </Text>
          <View style={[styles.badge, { backgroundColor: colors.goldTint }]}>
            <Text style={[styles.badgeText, { color: colors.accent, fontFamily: 'Cairo_700Bold' }]}>
              ABSHER TRAVEL
            </Text>
          </View>
        </View>

        <Pressable onPress={onEditPress} style={({ pressed }) => [styles.avatarContainer, pressed && { opacity: 0.8 }]}>
          {avatarSource ? (
            <Image source={avatarSource} style={[styles.avatar, { borderColor: colors.accent }]} contentFit="cover" />
          ) : (
            <View style={[styles.avatarFallback, { backgroundColor: colors.accent, borderColor: colors.accent }]}>
              <Text style={[styles.avatarLetter, { color: colors.primary, fontFamily: 'Cairo_700Bold' }]}>
                {(user.firstName || user.email || 'M')[0].toUpperCase()}
              </Text>
            </View>
          )}
          <View style={[styles.editIcon, { backgroundColor: colors.accent, borderColor: colors.primary }]}>
            <Ionicons name="camera" size={14} color={colors.primary} />
          </View>
        </Pressable>
      </View>

      <Pressable 
        style={({ pressed }) => [
          styles.completionCard, 
          { backgroundColor: colors.card, shadowColor: colors.primary, opacity: pressed ? 0.95 : 1 }
        ]} 
        onPress={onEditPress}
      >
        <View style={styles.completionTop}>
          <Text style={[styles.completionPct, { color: colors.accent, fontFamily: 'Cairo_800ExtraBold' }]}>
            {completion}%
          </Text>
          <Text style={[styles.completionLabel, { color: colors.foreground, fontFamily: 'Cairo_600SemiBold' }]}>
            {completion >= 100 ? ((t('profile.completed') as string) || 'ملفك الشخصي مكتمل') : ((t('profile.completion') as string) || 'اكتمال الملف الشخصي')}
          </Text>
        </View>
        <View style={[styles.completionTrack, { backgroundColor: colors.muted }]}>
          <View style={[styles.completionFill, { width: `${completion}%`, backgroundColor: colors.accent }]} />
        </View>
      </Pressable>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  content: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  textContainer: {
    flex: 1,
    alignItems: 'flex-end',
    paddingRight: 16,
  },
  name: {
    fontSize: 24,
    marginBottom: 4,
  },
  contact: {
    fontSize: 14,
    opacity: 0.85,
    marginBottom: 10,
  },
  badge: {
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  badgeText: {
    fontSize: 10,
    letterSpacing: 0.5,
  },
  avatarContainer: {
    position: 'relative',
  },
  avatar: {
    width: 84,
    height: 84,
    borderRadius: 42,
    borderWidth: 3,
  },
  avatarFallback: {
    width: 84,
    height: 84,
    borderRadius: 42,
    borderWidth: 3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarLetter: {
    fontSize: 32,
  },
  editIcon: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
  },
  completionCard: {
    borderRadius: 16,
    padding: 16,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  completionTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  completionPct: {
    fontSize: 18,
  },
  completionLabel: {
    fontSize: 14,
  },
  completionTrack: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  completionFill: {
    height: '100%',
    borderRadius: 4,
  },
});
