import React from 'react';
import { StyleSheet, Text, View, Pressable, Platform, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useColors } from '@/hooks/useColors';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import type { VisaApplication } from '@workspace/api-client-react';

export function UmrahTrackingCard({ 
  application, 
  t 
}: { 
  application?: VisaApplication; 
  t: (k: string) => string; 
}) {
  const c = useColors();

  if (!application) {
    return (
      <Card style={styles.card}>
        <View style={styles.header}>
          <View style={[styles.iconBox, { backgroundColor: c.muted }]}>
            <Ionicons name="document-text-outline" size={24} color={c.mutedForeground} />
          </View>
          <View style={styles.headerText}>
            <Text style={[styles.title, { color: c.foreground }]}>{t('umrahUi.tracking')}</Text>
            <Text style={[styles.subtitle, { color: c.mutedForeground }]}>{t('umrahUi.noApplications')}</Text>
          </View>
        </View>
      </Card>
    );
  }

  const isIssued = application.status === 'issued' || application.status === 'completed';
  const hasVisaDoc = !!application.visaImageUrl;

  const handleDownload = () => {
    if (hasVisaDoc) {
      if (Platform.OS === 'web') {
        window.open(application.visaImageUrl as string, '_blank');
      } else {
        Linking.openURL(application.visaImageUrl as string);
      }
    }
  };

  return (
    <Card style={styles.card}>
      <View style={styles.header}>
        <View style={[styles.iconBox, { backgroundColor: isIssued ? c.success + '15' : c.accent + '15' }]}>
          <Ionicons name={isIssued ? "checkmark-circle" : "time"} size={24} color={isIssued ? c.success : c.accent} />
        </View>
        <View style={styles.headerText}>
          <Text style={[styles.title, { color: c.foreground }]}>{t('umrahUi.tracking')}</Text>
          <Text style={[styles.subtitle, { color: c.mutedForeground }]}>
            {t('umrahUi.latestStatus')} <Text style={{ color: c.foreground, fontFamily: 'Cairo_600SemiBold' }}>{t(`status.${application.status.replace(/_([a-z])/g, (g) => g[1].toUpperCase())}`)}</Text>
          </Text>
        </View>
      </View>

      <View style={[styles.separator, { backgroundColor: c.border }]} />

      <View style={styles.actions}>
        <Button 
          label={t('common.readMore')} 
          variant="outline" 
          onPress={() => router.push(`/visa-tracking/${application.id}` as never)} 
          style={{ flex: 1 }}
        />
        {isIssued ? (
          <Button 
            label={hasVisaDoc ? t('umrahUi.download') : t('umrahUi.availableWhenIssued')} 
            variant={hasVisaDoc ? "gold" : "secondary"} 
            disabled={!hasVisaDoc}
            onPress={handleDownload} 
            style={{ flex: 1 }}
            icon={hasVisaDoc ? <Ionicons name="download-outline" size={18} color="#FFF" /> : undefined}
          />
        ) : null}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 20,
    marginBottom: 16,
  },
  header: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 16,
  },
  iconBox: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerText: {
    flex: 1,
    alignItems: 'flex-end',
  },
  title: {
    fontFamily: 'Cairo_700Bold',
    fontSize: 18,
    marginBottom: 4,
  },
  subtitle: {
    fontFamily: 'Cairo_400Regular',
    fontSize: 14,
  },
  separator: {
    height: 1,
    width: '100%',
    marginVertical: 16,
  },
  actions: {
    flexDirection: 'row-reverse',
    gap: 12,
  },
});