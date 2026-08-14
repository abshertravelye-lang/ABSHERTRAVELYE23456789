import React from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { useTheme } from '@/context/ThemeContext';
import { useLanguage } from '@/context/LanguageContext';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { Tabs } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import colors from '@/constants/colors';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const NAVY = colors.static.primaryNavy;
const GOLD = colors.static.premiumGold;

export default function TabLayout() {
  const { resolved } = useTheme();
  const { t, lang } = useLanguage();
  const insets = useSafeAreaInsets();
  const isDark = resolved === 'dark';
  const isIOS = Platform.OS === 'ios';

  const tabBg = isDark ? colors.dark.card : '#FFFFFF';
  const inactive = isDark ? colors.dark.textSecondary : colors.light.textSecondary;
  const activeText = isDark ? GOLD : NAVY;

  const CustomIcon = ({ name, outline, filled, focused, label }: { name: string, outline: any, filled: any, focused: boolean, label: string }) => {
    const isCenter = label === t('nav.home');
    
    if (focused) {
      return (
        <View style={[
          styles.activeIconContainer,
          isCenter ? styles.activeCenterContainer : {},
          { backgroundColor: isDark ? '#FFFFFF' : NAVY }
        ]}>
          {isIOS ? (
            <SymbolView name={name as any} tintColor={isDark ? NAVY : GOLD} size={22} />
          ) : (
            <Ionicons name={filled} size={22} color={isDark ? NAVY : GOLD} />
          )}
        </View>
      );
    }

    return isIOS ? (
      <SymbolView name={name as any} tintColor={inactive} size={24} />
    ) : (
      <Ionicons name={outline} size={24} color={inactive} />
    );
  };

  return (
    <Tabs
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
          }
        ],
        tabBarBackground: () =>
          isIOS ? (
            <BlurView
              intensity={95}
              tint={isDark ? "dark" : "light"}
              style={[StyleSheet.absoluteFill, { borderRadius: 32, overflow: 'hidden', backgroundColor: isDark ? 'rgba(10,35,66,0.8)' : 'rgba(255,255,255,0.8)' }]}
            />
          ) : null,
      }}
    >
      <Tabs.Screen name="more"
        options={{ title: lang === 'ar' ? 'المزيد' : 'More',
          tabBarIcon: ({ focused }) => <CustomIcon name="square.grid.2x2" outline="grid-outline" filled="grid" focused={focused} label="more" /> }} />
          
      <Tabs.Screen name="bookings"
        options={{ title: t('nav.bookings'),
          tabBarIcon: ({ focused }) => <CustomIcon name="calendar" outline="calendar-outline" filled="calendar" focused={focused} label="bookings" /> }} />
          
      <Tabs.Screen name="index"
        options={{ title: t('nav.home'),
          tabBarIcon: ({ focused }) => <CustomIcon name="house" outline="home-outline" filled="home" focused={focused} label={t('nav.home')} /> }} />
          
      <Tabs.Screen name="notifications"
        options={{ title: lang === 'ar' ? 'الإشعارات' : 'Notifications',
          tabBarIcon: ({ focused }) => <CustomIcon name="bell" outline="notifications-outline" filled="notifications" focused={focused} label="notifications" /> }} />
          
      <Tabs.Screen name="account"
        options={{ title: t('nav.account'),
          tabBarIcon: ({ focused }) => <CustomIcon name="person" outline="person-outline" filled="person" focused={focused} label="account" /> }} />
      
      {/* Hidden tabs */}
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
    marginTop: -16, // Lift it up slightly
  }
});