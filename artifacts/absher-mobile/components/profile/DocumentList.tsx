import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '@/hooks/useColors';
import { useLanguage } from '@/context/LanguageContext';
import type { SafeUser } from '@workspace/api-client-react';

type DocumentListProps = {
  user: SafeUser;
  onUploadPress: () => void;
};

export default function DocumentList({ user, onUploadPress }: DocumentListProps) {
  const colors = useColors();
  const { t } = useLanguage();

  const documents = [
    { key: 'passport', label: (t('profile.docPassport') as string) || 'صورة جواز السفر', url: user.passportImageUrl, icon: 'book' as const },
    { key: 'gcc_front', label: (t('profile.docGccFront') as string) || 'مستند الإقامة (أمامي)', url: user.gccResidenceFrontUrl, icon: 'card' as const },
    { key: 'gcc_back', label: (t('profile.docGccBack') as string) || 'مستند الإقامة (خلفي)', url: user.gccResidenceBackUrl, icon: 'card' as const },
    { key: 'european', label: (t('profile.docEuropean') as string) || 'تأشيرة سابقة (أوروبية)', url: user.europeanDocumentUrl, icon: 'map' as const },
  ].filter(d => !!d.url);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.mutedForeground, fontFamily: 'Cairo_600SemiBold' }]}>{(t('profile.docsTitle') as string) || 'المستندات المرفوعة'}</Text>
      </View>

      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        {documents.length > 0 ? (
          documents.map((doc, index) => (
            <View 
              key={doc.key} 
              style={[
                styles.docItem, 
                { borderBottomColor: colors.border },
                index === documents.length - 1 && { borderBottomWidth: 0 }
              ]}
            >
              <View style={styles.docActions}>
                <Ionicons name="checkmark-circle" size={20} color={colors.success} />
              </View>
              <View style={styles.docInfo}>
                <Text style={[styles.docLabel, { color: colors.foreground, fontFamily: 'Cairo_600SemiBold' }]}>{doc.label}</Text>
                <Text style={[styles.docStatus, { color: colors.success, fontFamily: 'Cairo_400Regular' }]}>{(t('profile.docsUploaded') as string) || 'تم الرفع'}</Text>
              </View>
              <View style={[styles.docIcon, { backgroundColor: colors.muted }]}>
                <Ionicons name={doc.icon} size={20} color={colors.mutedForeground} />
              </View>
            </View>
          ))
        ) : (
          <Pressable style={styles.empty} onPress={onUploadPress}>
            <View style={[styles.emptyIcon, { backgroundColor: colors.muted }]}>
              <Ionicons name="cloud-upload-outline" size={24} color={colors.mutedForeground} />
            </View>
            <Text style={[styles.emptyText, { color: colors.mutedForeground, fontFamily: 'Cairo_400Regular' }]}>
              {(t('profile.docsEmpty') as string) || 'لا توجد مستندات مرفوعة. اضغط هنا لرفع المستندات.'}
            </Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 20,
    marginTop: 24,
  },
  header: {
    marginBottom: 8,
    alignItems: 'flex-end',
    paddingHorizontal: 4,
  },
  title: {
    fontSize: 14,
  },
  card: {
    borderRadius: 18,
    borderWidth: 1,
    overflow: 'hidden',
  },
  docItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 12,
  },
  docIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  docInfo: {
    flex: 1,
    alignItems: 'flex-end',
  },
  docLabel: {
    fontSize: 14,
    marginBottom: 2,
  },
  docStatus: {
    fontSize: 12,
  },
  docActions: {
    padding: 8,
  },
  empty: {
    alignItems: 'center',
    paddingVertical: 24,
    gap: 12,
  },
  emptyIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 24,
  },
});
