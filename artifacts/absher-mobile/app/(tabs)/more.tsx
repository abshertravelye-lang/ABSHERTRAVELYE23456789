import React from 'react';
import { FlatList, Pressable, StyleSheet, Text, View, Platform } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import { useLanguage } from '@/context/LanguageContext';

export default function MoreScreen() {
  const colors = useColors();
  const { t, lang, isRTL, toggle } = useLanguage();
  const insets = useSafeAreaInsets();
  
  const isDark = colors.background === '#041021';

  const items = [
    {
      id: 'programs',
      title: t('nav.programs') as string,
      subtitle: t('more.programs.subtitle') as string,
      icon: 'compass-outline',
      route: '/(tabs)/programs',
    },
    {
      id: 'bookings',
      title: t('more.bookings.title') as string,
      subtitle: t('more.bookings.subtitle') as string,
      icon: 'clipboard-outline',
      route: '/(tabs)/bookings',
    },
    {
      id: 'documents',
      title: t('more.documents.title') as string,
      subtitle: t('more.documents.subtitle') as string,
      icon: 'folder-open-outline',
      route: '/(tabs)/account', // Or documents if it exists
    },
    {
      id: 'notifications',
      title: t('notifications.title') as string,
      subtitle: t('more.notifications.subtitle') as string,
      icon: 'notifications-outline',
      route: '/(tabs)/notifications',
    },
    {
      id: 'support',
      title: t('more.support.title') as string,
      subtitle: t('more.support.subtitle') as string,
      icon: 'headset-outline',
      route: 'support',
    },
    {
      id: 'help',
      title: t('more.help.title') as string,
      subtitle: t('more.help.subtitle') as string,
      icon: 'help-circle-outline',
      route: 'help',
    },
    {
      id: 'settings',
      title: t('settings.title') as string,
      subtitle: t('more.settings.subtitle') as string,
      icon: 'settings-outline',
      route: '/settings',
    },
  ];

  const handlePress = (route: string) => {
    if (route === 'support') {
      // Primary "Contact Us" now opens the real in-app support chat.
      router.push('/support-chat' as any);
    } else if (route === 'help') {
      // Help Center placeholder — left as-is.
    } else {
      router.push(route as any);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Background Watermark */}
      <View style={styles.watermarkContainer}>
        <Image 
          source={require('@/assets/images/absher-logo-transparent.png')}
          style={styles.watermark}
          contentFit="contain"
          tintColor={isDark ? 'rgba(255,255,255,0.03)' : 'rgba(10,35,66,0.03)'}
        />
      </View>

      <FlatList
        data={items}
        keyExtractor={item => item.id}
        contentContainerStyle={{ paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View style={[styles.header, { paddingTop: Math.max(insets.top + 16, 40) }]}>
            {/* Top Bar */}
            <View style={[styles.topBar, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
              <Pressable onPress={() => router.push('/(tabs)/notifications' as any)} style={[styles.iconBtn, { backgroundColor: colors.card }]}>
                <Ionicons name="notifications-outline" size={24} color={colors.primary} />
                <View style={styles.badge} />
              </Pressable>
              
              <View style={styles.logoWrap}>
                <Image
                  source={require('@/assets/images/absher-travel-logo-nobg.png')}
                  style={styles.logo}
                  contentFit="contain"
                  tintColor={colors.primary}
                />
              </View>
              
              <Pressable onPress={toggle} style={[styles.langPill, { backgroundColor: colors.card }]}>
                <Text style={[styles.langText, { color: colors.primary }]}>{lang === 'ar' ? 'AR' : 'EN'}</Text>
                <Ionicons name="globe-outline" size={16} color={colors.primary} />
              </Pressable>
            </View>

            {/* Title Area */}
            <View style={styles.titleArea}>
              <Text style={[styles.title, { color: colors.primary, fontFamily: 'Cairo_700Bold', textAlign: 'center' }]}>
                {t('more.title') as string}
              </Text>
              <Text style={[styles.subtitle, { color: colors.textSecondary, fontFamily: 'Cairo_400Regular', textAlign: 'center' }]}>
                {t('more.subtitle') as string}
              </Text>
            </View>
          </View>
        }
        renderItem={({ item }) => (
          <Pressable
            style={({ pressed }) => [
              styles.card,
              { 
                backgroundColor: colors.card,
                flexDirection: isRTL ? 'row-reverse' : 'row',
                opacity: pressed ? 0.7 : 1,
              }
            ]}
            onPress={() => handlePress(item.route)}
          >
            <View style={[styles.cardIconWrap, { borderColor: colors.border }]}>
              <Ionicons name={item.icon as any} size={24} color={colors.primary} />
            </View>
            
            <View style={[styles.cardContent, { alignItems: isRTL ? 'flex-end' : 'flex-start' }]}>
              <Text style={[styles.cardTitle, { color: colors.text, fontFamily: 'Cairo_600SemiBold' }]}>{item.title}</Text>
              <Text style={[styles.cardSubtitle, { color: colors.textSecondary, fontFamily: 'Cairo_400Regular', textAlign: isRTL ? 'right' : 'left' }]}>{item.subtitle}</Text>
            </View>
            
            <Ionicons 
              name={isRTL ? "chevron-back" : "chevron-forward"} 
              size={20} 
              color={colors.textSecondary} 
            />
          </Pressable>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  watermarkContainer: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    alignItems: 'center', justifyContent: 'flex-start',
    paddingTop: 100,
    zIndex: 0,
    pointerEvents: 'none'
  },
  watermark: { width: '150%', height: 300, opacity: 0.5 },
  header: { paddingHorizontal: 20, paddingBottom: 32, zIndex: 1 },
  topBar: { justifyContent: 'space-between', alignItems: 'center' },
  iconBtn: {
    width: 44, height: 44, borderRadius: 22,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2
  },
  badge: {
    position: 'absolute', top: 12, right: 12, width: 8, height: 8, borderRadius: 4, backgroundColor: '#D4AF37',
  },
  logoWrap: { height: 50, width: 120 },
  logo: { flex: 1 },
  langPill: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2
  },
  langText: { fontSize: 12, fontFamily: 'Cairo_700Bold' },
  titleArea: { marginTop: 32, alignItems: 'center' },
  title: { fontSize: 24 },
  subtitle: { fontSize: 14, marginTop: 8 },
  card: {
    marginHorizontal: 20, marginBottom: 12, padding: 16,
    borderRadius: 16, alignItems: 'center', gap: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.03, shadowRadius: 12, elevation: 2
  },
  cardIconWrap: {
    width: 48, height: 48, borderRadius: 12,
    borderWidth: 1, alignItems: 'center', justifyContent: 'center',
  },
  cardContent: { flex: 1, gap: 4 },
  cardTitle: { fontSize: 16 },
  cardSubtitle: { fontSize: 12, lineHeight: 18 },
});