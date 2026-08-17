import React from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { useTheme } from '@/context/ThemeContext';
import { useLanguage } from '@/context/LanguageContext';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { Tabs } from 'expo-router';
import colors from '@/constants/colors';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useUnreadNotifications } from '@/hooks/useUnreadNotifications';
import { haptics } from '@/lib/haptics';

const NAVY = colors.static.primaryNavy;
const GOLD = colors.static.premiumGold;

export default function TabLayout() {
  const { resolved } = useTheme();
  const { t, lang } = useLanguage();
  const insets = useSafeAreaInsets();
  const unreadCount = useUnreadNotifications();
  const isDark = resolved === 'dark';
  const isIOS = Platform.OS === 'ios';

  const tabBg = isDark ? colors.dark.card : '#FFFFFF';
  const inactive = isDark ? colors.dark.textSecondary : colors.light.textSecondary;
  const activeText = isDark ? GOLD : NAVY;

  // Always use Ionicons — SymbolView (expo-symbols) only works in native builds,
  // not Expo Go. Ionicons works everywhere (iOS, Android, Expo Go, web).
  const CustomIcon = ({
    outline,
    filled,
    focused,
    label,
  }: {
    outline: string;
    filled: string;
    focused: boolean;
    label: string;
  }) => {
    const isCenter = label === t('nav.home');

    if (focused) {
      return (
        <View
          style={[
            styles.activeIconContainer,
            isCenter ? styles.activeCenterContainer : {},
            { backgroundColor: isDark ? '#FFFFFF' : NAVY },
          ]}
        >
          <Ionicons name={filled as any} size={22} color={isDark ? NAVY : GOLD} />
        </View>
      );
    }

    return <Ionicons name={outline as any} size={24} color={inactive} />;
  };

  return (
    <Tabs
      screenListeners={{
        // Unified selection haptic on every tab switch.
        tabPress: () => haptics.tab(),
      }}
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: activeText,
        tabBarInactiveTintColor: inactive,
        tabBarLabelStyle: { fontFamily: 'Cairo_600SemiBold', fontSize: 11, paddingTop: 4 },
        tabBarStyle: [
          styles.tabBar,
          {
            backgroundColor: isIOS ? 'transparent' : tabBg,
            bottom: Platform.OS === 'web' ? 24 : Math.max(insets.bottom, 24),
          },
        ],
        tabBarBackground: () =>
          isIOS ? (
            <BlurView
              intensity={95}
              tint={isDark ? 'dark' : 'light'}
              style={[
                StyleSheet.absoluteFill,
                {
                  borderRadius: 32,
                  overflow: 'hidden',
                  backgroundColor: isDark
                    ? 'rgba(10,35,66,0.8)'
                    : 'rgba(255,255,255,0.8)',
                },
              ]}
            />
          ) : null,
      }}
    >
      <Tabs.Screen
        name="more"
        options={{
          title: lang === 'ar' ? 'المزيد' : 'More',
          tabBarIcon: ({ focused }) => (
            <CustomIcon
              outline="grid-outline"
              filled="grid"
              focused={focused}
              label="more"
            />
          ),
        }}
      />

      <Tabs.Screen
        name="bookings"
        options={{
          title: t('nav.bookings'),
          tabBarIcon: ({ focused }) => (
            <CustomIcon
              outline="calendar-outline"
              filled="calendar"
              focused={focused}
              label="bookings"
            />
          ),
        }}
      />

      <Tabs.Screen
        name="index"
        options={{
          title: t('nav.home'),
          tabBarIcon: ({ focused }) => (
            <CustomIcon
              outline="home-outline"
              filled="home"
              focused={focused}
              label={t('nav.home')}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="notifications"
        options={{
          title: lang === 'ar' ? 'الإشعارات' : 'Notifications',
          tabBarBadge: unreadCount > 0 ? (unreadCount > 99 ? '99+' : unreadCount) : undefined,
          tabBarBadgeStyle: {
            backgroundColor: '#EF4444',
            color: '#FFFFFF',
            fontSize: 10,
            fontFamily: 'Cairo_700Bold',
          },
          tabBarIcon: ({ focused }) => (
            <CustomIcon
              outline="notifications-outline"
              filled="notifications"
              focused={focused}
              label="notifications"
            />
          ),
        }}
      />

      <Tabs.Screen
        name="account"
        options={{
          title: t('nav.account'),
          tabBarIcon: ({ focused }) => (
            <CustomIcon
              outline="person-outline"
              filled="person"
              focused={focused}
              label="account"
            />
          ),
        }}
      />

      {/* Hidden tabs — navigable via deep links but not shown in the bar */}
      <Tabs.Screen name="flights" options={{ href: null }} />
      <Tabs.Screen name="programs" options={{ href: null }} />
      <Tabs.Screen name="visas" options={{ href: null }} />
      <Tabs.Screen name="umrah" options={{ href: null }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    position: 'absolute',
    left: 20,
    right: 20,
    height: 72,
    borderRadius: 32,
    borderTopWidth: 0,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    paddingHorizontal: 8,
    paddingBottom: 8,
    paddingTop: 8,
  },
  activeIconContainer: {
    width: 48,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeCenterContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginTop: -16,
  },
});
