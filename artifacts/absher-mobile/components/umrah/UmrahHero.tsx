import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { useColors } from '@/hooks/useColors';
import { LinearGradient } from 'expo-linear-gradient';

export function UmrahHero({ title, subtitle }: { title: string; subtitle: string }) {
  const c = useColors();

  return (
    <View style={styles.container}>
      <Image 
        source={require('@/assets/images/umrah-hero.jpg')} 
        style={StyleSheet.absoluteFillObject}
        contentFit="cover"
      />
      <LinearGradient
        colors={['transparent', c.background]}
        locations={[0.2, 1]}
        style={StyleSheet.absoluteFillObject}
      />
      {/* Dark overlay for contrast */}
      <View style={[StyleSheet.absoluteFillObject, { backgroundColor: 'rgba(3, 27, 58, 0.4)' }]} />
      
      <View style={styles.content}>
        <View style={[styles.badge, { backgroundColor: c.accent + '20', borderColor: c.accent }]}>
          <Text style={[styles.badgeText, { color: c.accent }]}>Premium</Text>
        </View>
        <Text style={[styles.title, { color: '#FFFFFF' }]}>{title}</Text>
        <Text style={[styles.subtitle, { color: '#E2E8F0' }]}>{subtitle}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 320,
    width: '100%',
    justifyContent: 'flex-end',
  },
  content: {
    padding: 24,
    paddingBottom: 32,
    alignItems: 'flex-end', // RTL
  },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    marginBottom: 12,
  },
  badgeText: {
    fontFamily: 'Cairo_600SemiBold',
    fontSize: 12,
  },
  title: {
    fontFamily: 'Cairo_700Bold',
    fontSize: 32,
    textAlign: 'right',
    marginBottom: 6,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
  },
  subtitle: {
    fontFamily: 'Cairo_400Regular',
    fontSize: 16,
    textAlign: 'right',
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
});
