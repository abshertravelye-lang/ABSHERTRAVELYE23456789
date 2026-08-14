/**
 * ImageUploader — single-document picker + upload component for visa documents.
 *
 * Flow:
 *   1. User taps the area → action sheet: الكاميرا / المعرض / ملف PDF / إلغاء
 *   2. expo-image-picker (camera & library) or expo-document-picker (PDF)
 *   3. The file is uploaded to POST /api/storage/uploads (multipart)
 *   4. On success: shows thumbnail (images) or a file card (PDF) + green badge,
 *      then calls onUpload(url)
 *   5. User can tap to replace, or tap ✕ to remove
 */
import React, { useState } from 'react';
import {
  ActivityIndicator, Alert, Platform,
  Pressable, StyleSheet, Text, View,
} from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import * as Haptics from 'expo-haptics';
import { useColors } from '@/hooks/useColors';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import { getImageSource } from '@/hooks/useImageUrl';
import colors from '@/constants/colors';

interface Props {
  label: string;
  sublabel?: string;
  icon?: keyof typeof Ionicons.glyphMap;
  required?: boolean;
  /**
   * The stored object PATH of the already-uploaded file (e.g.
   * "/objects/uploads/<uuid>"), or an empty string. NOT a full URL — the
   * protected object is fetched with an Authorization header when displayed.
   */
  value: string;
  onUpload: (objectPath: string) => void;
  onRemove: () => void;
  /** allow PDF documents in addition to images (default true) */
  allowPdf?: boolean;
}

const API_BASE = `https://${process.env.EXPO_PUBLIC_DOMAIN}`;

/**
 * Upload a local URI to the server; returns the stored object PATH
 * ("/objects/uploads/<uuid>"), NOT a full URL. Callers store the path; it is
 * later rendered via getImageSource() which attaches the auth header.
 */
async function uploadFile(localUri: string, token: string | null, mimeType?: string, fileName?: string): Promise<string> {
  const formData = new FormData();
  const name = fileName ?? 'photo.jpg';
  const type = mimeType ?? 'image/jpeg';
  if (Platform.OS === 'web') {
    // On web the URI is a blob:/data: URI — convert to a File so multipart works.
    const blob = await (await fetch(localUri)).blob();
    formData.append('file', new File([blob], name, { type: blob.type || type }));
  } else {
    formData.append('file', { uri: localUri, type, name } as any);
  }

  const res = await fetch(`${API_BASE}/api/storage/uploads`, {
    method: 'POST',
    // Authenticated upload — server requires a bearer token.
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    body: formData,
    // Do NOT set Content-Type — let the runtime add the boundary automatically
  });

  if (!res.ok) throw new Error(`Upload failed: ${res.status}`);
  const { objectPath } = await res.json();
  // objectPath = "/objects/uploads/<uuid>" — return the bare path.
  return objectPath;
}

const isPdfUrl = (url: string) => /\.pdf(\?|$)/i.test(url);

export default function ImageUploader({
  label, sublabel, icon = 'cloud-upload-outline', required = false,
  value, onUpload, onRemove, allowPdf = true,
}: Props) {
  const c = useColors();
  const { accessToken } = useAuth();
  const { t } = useLanguage();
  const [loading, setLoading] = useState(false);

  const doUpload = async (uri: string, mimeType?: string, fileName?: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setLoading(true);
    try {
      const url = await uploadFile(uri, accessToken, mimeType, fileName);
      onUpload(url);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {
      Alert.alert(t('uploader.errorTitle'), t('uploader.errorBody'));
    } finally {
      setLoading(false);
    }
  };

  const fromCamera = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(t('uploader.permTitle'), t('uploader.permCamera'));
      return;
    }
    const result = await ImagePicker.launchCameraAsync({ quality: 0.85 });
    if (result.canceled || !result.assets?.[0]) return;
    const a = result.assets[0];
    doUpload(a.uri, a.mimeType ?? undefined, a.fileName ?? undefined);
  };

  const fromGallery = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(t('uploader.permTitle'), t('uploader.permGallery'));
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.85 });
    if (result.canceled || !result.assets?.[0]) return;
    const a = result.assets[0];
    doUpload(a.uri, a.mimeType ?? undefined, a.fileName ?? undefined);
  };

  const fromPdf = async () => {
    const result = await DocumentPicker.getDocumentAsync({ type: 'application/pdf', copyToCacheDirectory: true });
    if (result.canceled || !result.assets?.[0]) return;
    const a = result.assets[0];
    doUpload(a.uri, a.mimeType ?? 'application/pdf', a.name ?? `document_${Date.now()}.pdf`);
  };

  const pick = () => {
    if (loading) return;
    if (Platform.OS === 'web') {
      if (allowPdf) {
        Alert.alert(label, t('uploader.chooseSource'), [
          { text: t('uploader.gallery'), onPress: fromGallery },
          { text: t('uploader.pdf'), onPress: fromPdf },
          { text: t('common.cancel'), style: 'cancel' },
        ]);
      } else {
        fromGallery();
      }
      return;
    }
    const buttons: { text: string; onPress?: () => void; style?: 'cancel' }[] = [
      { text: t('uploader.camera'), onPress: fromCamera },
      { text: t('uploader.gallery'), onPress: fromGallery },
    ];
    if (allowPdf) buttons.push({ text: t('uploader.pdf'), onPress: fromPdf });
    buttons.push({ text: t('common.cancel'), style: 'cancel' });
    Alert.alert(label, t('uploader.chooseSource'), buttons);
  };

  const remove = () => {
    Alert.alert(t('uploader.removeTitle'), t('uploader.removeBody'), [
      { text: t('uploader.remove'), style: 'destructive', onPress: () => { onRemove(); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); } },
      { text: t('common.cancel'), style: 'cancel' },
    ]);
  };

  const hasFile = !!value;
  const pdf = hasFile && isPdfUrl(value);

  return (
    <View style={s.wrap}>
      {/* Label row */}
      <View style={s.labelRow}>
        <View style={s.labelLeft}>
          {sublabel ? (
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={[s.label, { color: c.foreground, fontFamily: 'Cairo_600SemiBold' }]}>
                {label}{required && <Text style={{ color: c.destructive }}> *</Text>}
              </Text>
              <Text style={[s.sublabel, { color: c.mutedForeground, fontFamily: 'Cairo_400Regular' }]}>{sublabel}</Text>
            </View>
          ) : (
            <Text style={[s.label, { color: c.foreground, fontFamily: 'Cairo_600SemiBold' }]}>
              {label}{required && <Text style={{ color: c.destructive }}> *</Text>}
            </Text>
          )}
        </View>
        {hasFile && (
          <View style={[s.doneBadge, { backgroundColor: c.success + '18', borderColor: c.success }]}>
            <Ionicons name="checkmark-circle" size={13} color={c.success} />
            <Text style={[s.doneBadgeText, { color: c.success, fontFamily: 'Cairo_600SemiBold' }]}>{t('profile.docsUploaded')}</Text>
          </View>
        )}
      </View>

      {/* PDF card */}
      {pdf && !loading ? (
        <View style={[s.pdfCard, { backgroundColor: c.goldTint, borderColor: colors.gold }]}>
          <View style={[s.pdfIcon, { backgroundColor: colors.gold }]}>
            <Ionicons name="document-text" size={22} color={colors.navy} />
          </View>
          <View style={s.pdfInfo}>
            <Text style={[s.pdfName, { color: c.foreground, fontFamily: 'Cairo_600SemiBold' }]} numberOfLines={1}>
              {decodeURIComponent(value.split('/').pop() ?? 'document.pdf')}
            </Text>
            <Text style={[s.pdfType, { color: c.mutedForeground, fontFamily: 'Cairo_400Regular' }]}>{t('uploader.pdf')}</Text>
          </View>
          <View style={s.pdfActions}>
            <Pressable onPress={pick} hitSlop={8} style={[s.pdfBtn, { backgroundColor: colors.navy }]}>
              <Ionicons name="swap-horizontal" size={16} color="#FFFFFF" />
            </Pressable>
            <Pressable onPress={remove} hitSlop={8} style={[s.pdfBtn, { backgroundColor: c.destructive }]}>
              <Ionicons name="trash" size={15} color="#FFFFFF" />
            </Pressable>
          </View>
        </View>
      ) : (
        /* Upload area */
        <Pressable
          style={({ pressed }) => [
            s.area,
            {
              backgroundColor: hasFile ? c.goldTint : c.muted,
              borderColor: hasFile ? colors.gold : required && !hasFile ? c.destructive + '55' : c.border,
              borderStyle: hasFile ? 'solid' : 'dashed',
              opacity: pressed ? 0.85 : 1,
            },
          ]}
          onPress={pick}
        >
          {loading ? (
            <View style={s.loadingInner}>
              <ActivityIndicator size="large" color={colors.gold} />
              <Text style={[s.uploadingText, { color: c.mutedForeground, fontFamily: 'Cairo_400Regular' }]}>
                {t('uploader.uploading')}
              </Text>
            </View>
          ) : hasFile ? (
            <View style={s.thumbWrap}>
              <Image source={getImageSource(value)} style={s.thumb} contentFit="cover" />
              <View style={s.thumbOverlay}>
                <View style={s.thumbActions}>
                  <Pressable style={[s.thumbBtn, { backgroundColor: colors.navy + 'E6' }]} onPress={pick}>
                    <Ionicons name="pencil" size={15} color="#FFFFFF" />
                    <Text style={[s.thumbBtnText, { fontFamily: 'Cairo_600SemiBold' }]}>{t('uploader.change')}</Text>
                  </Pressable>
                  <Pressable style={[s.thumbBtn, { backgroundColor: c.destructive + 'E6' }]} onPress={remove}>
                    <Ionicons name="trash" size={15} color="#FFFFFF" />
                    <Text style={[s.thumbBtnText, { fontFamily: 'Cairo_600SemiBold' }]}>{t('uploader.remove')}</Text>
                  </Pressable>
                </View>
              </View>
            </View>
          ) : (
            <View style={s.emptyInner}>
              <View style={[s.iconCircle, { backgroundColor: c.goldTint }]}>
                <Ionicons name={icon} size={26} color={colors.gold} />
              </View>
              <Text style={[s.uploadTitle, { color: c.foreground, fontFamily: 'Cairo_600SemiBold' }]}>
                {t('uploader.tapToUpload')}
              </Text>
              <Text style={[s.uploadHint, { color: c.mutedForeground, fontFamily: 'Cairo_400Regular' }]}>
                {allowPdf ? t('uploader.hintPdf') : t('uploader.hint')}
              </Text>
            </View>
          )}
        </Pressable>
      )}
    </View>
  );
}

const THUMB_H = 170;

const s = StyleSheet.create({
  wrap:         { gap: 8 },
  labelRow:     { flexDirection: 'row-reverse', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 },
  labelLeft:    { flex: 1, alignItems: 'flex-end' },
  label:        { fontSize: 14, textAlign: 'right' },
  sublabel:     { fontSize: 11.5, marginTop: 1, textAlign: 'right' },
  doneBadge:    { flexDirection: 'row-reverse', alignItems: 'center', gap: 4, borderWidth: 1, borderRadius: 20, paddingHorizontal: 8, paddingVertical: 3 },
  doneBadgeText:{ fontSize: 11 },
  area:         { borderRadius: 16, borderWidth: 1.5, overflow: 'hidden', minHeight: THUMB_H },
  loadingInner: { height: THUMB_H, alignItems: 'center', justifyContent: 'center', gap: 10 },
  uploadingText:{ fontSize: 13 },
  thumbWrap:    { height: THUMB_H, position: 'relative' },
  thumb:        { width: '100%', height: THUMB_H },
  thumbOverlay: { ...StyleSheet.absoluteFillObject, justifyContent: 'flex-end', padding: 10 },
  thumbActions: { flexDirection: 'row-reverse', justifyContent: 'center', gap: 10 },
  thumbBtn:     { flexDirection: 'row-reverse', alignItems: 'center', gap: 5, borderRadius: 20, paddingHorizontal: 14, paddingVertical: 7 },
  thumbBtnText: { color: '#FFFFFF', fontSize: 13 },
  emptyInner:   { height: THUMB_H, alignItems: 'center', justifyContent: 'center', gap: 8 },
  iconCircle:   { width: 54, height: 54, borderRadius: 27, alignItems: 'center', justifyContent: 'center' },
  uploadTitle:  { fontSize: 14 },
  uploadHint:   { fontSize: 12 },
  pdfCard:      { flexDirection: 'row-reverse', alignItems: 'center', gap: 12, borderWidth: 1.5, borderRadius: 16, padding: 14 },
  pdfIcon:      { width: 46, height: 46, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  pdfInfo:      { flex: 1, alignItems: 'flex-end', gap: 2 },
  pdfName:      { fontSize: 14, textAlign: 'right' },
  pdfType:      { fontSize: 12, textAlign: 'right' },
  pdfActions:   { flexDirection: 'row-reverse', gap: 8 },
  pdfBtn:       { width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
});
