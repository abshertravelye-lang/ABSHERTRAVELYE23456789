/**
 * DocumentTile — premium upload tile for the visa wizard.
 * Supports camera / gallery / PDF via an action sheet.
 * Shows an image preview for images and a file card for PDFs.
 *
 * It only picks a local asset and returns it to the parent via onPick;
 * the parent owns the actual upload (signed-URL PUT) logic.
 */
import React from 'react';
import { Alert, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import * as Haptics from 'expo-haptics';
import { useColors } from '@/hooks/useColors';
import { useLanguage } from '@/context/LanguageContext';
import colors from '@/constants/colors';

export interface PickedAsset {
  uri: string;
  name: string;
  mimeType: string;
  isPdf: boolean;
}

interface Props {
  label: string;
  hint?: string;
  icon?: keyof typeof Ionicons.glyphMap;
  required?: boolean;
  asset: PickedAsset | null;
  onPick: (asset: PickedAsset) => void;
  onClear: () => void;
  /** allow PDF documents in addition to images (default true) */
  allowPdf?: boolean;
  /** compact single-line style (used inside dense forms) */
  compact?: boolean;
}

export default function DocumentTile({
  label, hint, icon = 'cloud-upload-outline', required = false,
  asset, onPick, onClear, allowPdf = true, compact = false,
}: Props) {
  const c = useColors();
  const { t } = useLanguage();

  const pickFromLibrary = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(t('flow.permissionRequired'), t('docTile.galleryPermission'));
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.85,
    });
    if (!result.canceled && result.assets[0]) {
      const a = result.assets[0];
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      onPick({
        uri: a.uri,
        name: a.fileName ?? `image_${Date.now()}.jpg`,
        mimeType: a.mimeType ?? 'image/jpeg',
        isPdf: false,
      });
    }
  };

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(t('flow.permissionRequired'), t('docTile.cameraPermission'));
      return;
    }
    const result = await ImagePicker.launchCameraAsync({ quality: 0.85 });
    if (!result.canceled && result.assets[0]) {
      const a = result.assets[0];
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      onPick({
        uri: a.uri,
        name: a.fileName ?? `photo_${Date.now()}.jpg`,
        mimeType: a.mimeType ?? 'image/jpeg',
        isPdf: false,
      });
    }
  };

  const pickPdf = async () => {
    const result = await DocumentPicker.getDocumentAsync({
      type: 'application/pdf',
      copyToCacheDirectory: true,
    });
    if (!result.canceled && result.assets?.[0]) {
      const a = result.assets[0];
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      onPick({
        uri: a.uri,
        name: a.name ?? `document_${Date.now()}.pdf`,
        mimeType: a.mimeType ?? 'application/pdf',
        isPdf: true,
      });
    }
  };

  const showOptions = () => {
    const buttons: { text: string; onPress?: () => void; style?: 'cancel' | 'destructive' }[] = [];
    if (Platform.OS !== 'web') {
      buttons.push({ text: t('flow.camera'), onPress: takePhoto });
    }
    buttons.push({ text: t('flow.gallery'), onPress: pickFromLibrary });
    if (allowPdf) buttons.push({ text: t('flow.pdfFile'), onPress: pickPdf });
    buttons.push({ text: t('flow.cancel'), style: 'cancel' });

    // On web Alert with many buttons is unreliable — go straight to gallery/pdf choice.
    if (Platform.OS === 'web') {
      if (allowPdf) {
        Alert.alert(label, t('docTile.chooseMethod'), [
          { text: t('flow.gallery'), onPress: pickFromLibrary },
          { text: t('flow.pdfFile'), onPress: pickPdf },
          { text: t('flow.cancel'), style: 'cancel' },
        ]);
      } else {
        pickFromLibrary();
      }
      return;
    }
    Alert.alert(label, t('docTile.chooseMethod'), buttons);
  };

  const clear = () => {
    Alert.alert(t('docTile.deleteTitle'), t('docTile.deleteBody'), [
      { text: t('docTile.delete'), style: 'destructive', onPress: () => { onClear(); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); } },
      { text: t('flow.cancel'), style: 'cancel' },
    ]);
  };

  const has = !!asset;

  return (
    <View style={s.wrap}>
      <View style={s.labelRow}>
        <View style={s.labelLeft}>
          <Text style={[s.label, { color: c.foreground, fontFamily: 'Cairo_600SemiBold' }]}>
            {label}{required && <Text style={{ color: c.destructive }}> *</Text>}
          </Text>
          {hint && (
            <Text style={[s.hint, { color: c.mutedForeground, fontFamily: 'Cairo_400Regular' }]}>{hint}</Text>
          )}
        </View>
        {has && (
          <View style={[s.badge, { backgroundColor: c.success + '18', borderColor: c.success }]}>
            <Ionicons name="checkmark-circle" size={13} color={c.success} />
            <Text style={[s.badgeText, { color: c.success, fontFamily: 'Cairo_600SemiBold' }]}>{t('docTile.uploaded')}</Text>
          </View>
        )}
      </View>

      {has && asset.isPdf ? (
        // ── PDF file card ──
        <View style={[s.pdfCard, { backgroundColor: c.goldTint, borderColor: colors.gold }]}>
          <View style={[s.pdfIcon, { backgroundColor: colors.gold }]}>
            <Ionicons name="document-text" size={22} color={colors.navy} />
          </View>
          <View style={s.pdfInfo}>
            <Text style={[s.pdfName, { color: c.foreground, fontFamily: 'Cairo_600SemiBold' }]} numberOfLines={1}>
              {asset.name}
            </Text>
            <Text style={[s.pdfType, { color: c.mutedForeground, fontFamily: 'Cairo_400Regular' }]}>
              {t('docTile.pdfFile')}
            </Text>
          </View>
          <View style={s.pdfActions}>
            <Pressable onPress={showOptions} hitSlop={8} style={[s.pdfBtn, { backgroundColor: colors.navy }]}>
              <Ionicons name="swap-horizontal" size={16} color="#FFFFFF" />
            </Pressable>
            <Pressable onPress={clear} hitSlop={8} style={[s.pdfBtn, { backgroundColor: c.destructive }]}>
              <Ionicons name="trash" size={15} color="#FFFFFF" />
            </Pressable>
          </View>
        </View>
      ) : (
        <Pressable
          style={({ pressed }) => [
            s.box,
            {
              borderColor: has ? colors.gold : c.border,
              backgroundColor: has ? c.goldTint : c.muted,
              borderStyle: has ? 'solid' : 'dashed',
              opacity: pressed ? 0.85 : 1,
              minHeight: compact ? 120 : 170,
            },
          ]}
          onPress={showOptions}
        >
          {has && asset ? (
            <>
              <Image source={{ uri: asset.uri }} style={s.preview} contentFit="cover" />
              <View style={s.previewOverlay}>
                <Pressable style={[s.overlayBtn, { backgroundColor: colors.navy + 'E6' }]} onPress={showOptions}>
                  <Ionicons name="pencil" size={14} color="#FFFFFF" />
                  <Text style={[s.overlayBtnText, { fontFamily: 'Cairo_600SemiBold' }]}>{t('docTile.change')}</Text>
                </Pressable>
                <Pressable style={[s.overlayBtn, { backgroundColor: c.destructive + 'E6' }]} onPress={clear}>
                  <Ionicons name="trash" size={14} color="#FFFFFF" />
                  <Text style={[s.overlayBtnText, { fontFamily: 'Cairo_600SemiBold' }]}>{t('docTile.delete')}</Text>
                </Pressable>
              </View>
            </>
          ) : (
            <View style={s.empty}>
              <View style={[s.emptyIcon, { backgroundColor: c.goldTint }]}>
                <Ionicons name={icon} size={26} color={colors.gold} />
              </View>
              <Text style={[s.emptyTitle, { color: c.foreground, fontFamily: 'Cairo_600SemiBold' }]}>
                {t('docTile.tapToUpload')}
              </Text>
              <Text style={[s.emptyHint, { color: c.mutedForeground, fontFamily: 'Cairo_400Regular' }]}>
                {allowPdf ? t('docTile.sourcesWithPdf') : t('docTile.sourcesNoPdf')}
              </Text>
            </View>
          )}
        </Pressable>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  wrap: { gap: 8 },
  labelRow: { flexDirection: 'row-reverse', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 },
  labelLeft: { flex: 1, alignItems: 'flex-end', gap: 2 },
  label: { fontSize: 14, textAlign: 'right' },
  hint: { fontSize: 11.5, textAlign: 'right' },
  badge: { flexDirection: 'row-reverse', alignItems: 'center', gap: 4, borderWidth: 1, borderRadius: 20, paddingHorizontal: 8, paddingVertical: 3 },
  badgeText: { fontSize: 11 },
  box: { borderRadius: 16, borderWidth: 1.5, overflow: 'hidden' },
  preview: { width: '100%', height: 190 },
  previewOverlay: { ...StyleSheet.absoluteFillObject, justifyContent: 'flex-end', flexDirection: 'row', gap: 10, padding: 10 },
  overlayBtn: { flexDirection: 'row-reverse', alignItems: 'center', gap: 5, borderRadius: 20, paddingHorizontal: 14, paddingVertical: 7 },
  overlayBtnText: { color: '#FFFFFF', fontSize: 13 },
  empty: { alignItems: 'center', justifyContent: 'center', padding: 24, gap: 8 },
  emptyIcon: { width: 54, height: 54, borderRadius: 27, alignItems: 'center', justifyContent: 'center' },
  emptyTitle: { fontSize: 14, textAlign: 'center' },
  emptyHint: { fontSize: 12, textAlign: 'center' },
  pdfCard: { flexDirection: 'row-reverse', alignItems: 'center', gap: 12, borderWidth: 1.5, borderRadius: 16, padding: 14 },
  pdfIcon: { width: 46, height: 46, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  pdfInfo: { flex: 1, alignItems: 'flex-end', gap: 2 },
  pdfName: { fontSize: 14, textAlign: 'right' },
  pdfType: { fontSize: 12, textAlign: 'right' },
  pdfActions: { flexDirection: 'row-reverse', gap: 8 },
  pdfBtn: { width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
});
