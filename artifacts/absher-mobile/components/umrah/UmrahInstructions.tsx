import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '@/hooks/useColors';

export function UmrahInstructions({ t }: { t: (k: string) => string }) {
  const c = useColors();

  const instructions = [
    { icon: 'heart', title: t('umrahUi.guide1.title'), desc: t('umrahUi.guide1.desc') },
    { icon: 'navigate', title: t('umrahUi.guide2.title'), desc: t('umrahUi.guide2.desc') },
    { icon: 'briefcase', title: t('umrahUi.guide3.title'), desc: t('umrahUi.guide3.desc') },
    { icon: 'medkit', title: t('umrahUi.guide4.title'), desc: t('umrahUi.guide4.desc') },
  ] as const;

  return (
    <View style={styles.container}>
      <Text style={[styles.sectionTitle, { color: c.foreground }]}>{t('umrahUi.guidance')}</Text>
      
      <View style={styles.grid}>
        {instructions.map((item, idx) => (
          <View key={idx} style={[styles.card, { backgroundColor: c.card, borderColor: c.border }]}>
            <View style={[styles.iconBox, { backgroundColor: c.umrahGreen + '15' }]}>
              <Ionicons name={item.icon} size={24} color={c.umrahGreen} />
            </View>
            <Text style={[styles.title, { color: c.foreground }]}>{item.title}</Text>
            <Text style={[styles.desc, { color: c.mutedForeground }]}>{item.desc}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 8,
    marginBottom: 32,
  },
  sectionTitle: {
    fontFamily: 'Cairo_700Bold',
    fontSize: 20,
    textAlign: 'right',
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 16,
  },
  card: {
    width: '47%',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'flex-end',
  },
  iconBox: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  title: {
    fontFamily: 'Cairo_600SemiBold',
    fontSize: 14,
    textAlign: 'right',
    marginBottom: 6,
  },
  desc: {
    fontFamily: 'Cairo_400Regular',
    fontSize: 12,
    textAlign: 'right',
    lineHeight: 18,
  },
});