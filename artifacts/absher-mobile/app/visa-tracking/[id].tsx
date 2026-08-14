import React from 'react';
import { ActivityIndicator, Alert, Linking, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQueryClient } from '@tanstack/react-query';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { useColors } from '@/hooks/useColors';
import colors from '@/constants/colors';
import { useAuth } from '@/context/AuthContext';
import { getImageSource } from '@/hooks/useImageUrl';
import {
  useGetVisaApplication,
  getGetVisaApplicationQueryKey,
  useListApplicationDocuments,
  getListApplicationDocumentsQueryKey,
  useUploadApplicationDocument,
} from '@workspace/api-client-react';
import { customFetch } from '@workspace/api-client-react';
import type { ApplicationDocument, ApplicationDocumentStatus } from '@workspace/api-client-react';

/**
 * Storage object paths are served by the API at /api/storage/objects/*.
 * A stored issued-visa reference looks like "/objects/uploads/<uuid>" — rewrite
 * it to the absolute served URL. Absolute (http) values are returned as-is.
 */
function toIssuedVisaUrl(path: string): string {
  if (/^https?:\/\//.test(path)) return path;
  const origin = `https://${process.env.EXPO_PUBLIC_DOMAIN}`;
  if (path.startsWith('/objects/')) return `${origin}/api/storage${path}`;
  if (path.startsWith('/api/')) return `${origin}${path}`;
  return `${origin}${path.startsWith('/') ? '' : '/'}${path}`;
}

/** Ordered timeline steps with icons. */
const TIMELINE = [
  { key: 'submitted', label: 'تقديم الطلب', desc: 'تم استلام طلبك بنجاح', icon: 'document-text-outline' as const },
  { key: 'review', label: 'مراجعة المستندات', desc: 'يتم التحقق من المستندات المرفقة', icon: 'search-outline' as const },
  { key: 'processing', label: 'قيد المعالجة', desc: 'جارٍ معالجة طلبك لدى الجهات المختصة', icon: 'sync-outline' as const },
  { key: 'approved', label: 'الاعتماد', desc: 'تمت الموافقة على طلبك', icon: 'shield-checkmark-outline' as const },
  { key: 'completed', label: 'جاهزة للاستلام', desc: 'تأشيرتك جاهزة للتحميل', icon: 'ribbon-outline' as const },
];

/** Map API status → { index, rejected, arabic label, badge color }. */
function mapStatus(status: string) {
  switch (status) {
    case 'pending':
    case 'received':
      return { index: 0, rejected: false, label: 'قيد الاستلام', color: colors.gold };
    case 'reviewing':
    case 'review':
    case 'under_review':
    case 'awaiting_documents':
    case 'documents_uploaded':
      return { index: 1, rejected: false, label: 'مراجعة المستندات', color: colors.cyan };
    case 'processing':
    case 'sent_to_embassy':
      return { index: 2, rejected: false, label: 'قيد المعالجة', color: colors.cyan };
    case 'approved':
    case 'issued':
      return { index: 3, rejected: false, label: 'تم الاعتماد', color: '#16A34A' };
    case 'completed':
    case 'ready':
      return { index: 4, rejected: false, label: 'مكتملة', color: '#16A34A' };
    case 'rejected':
    case 'cancelled':
      return { index: -1, rejected: true, label: 'مرفوض', color: '#EF4444' };
    default:
      return { index: 0, rejected: false, label: 'قيد الاستلام', color: colors.gold };
  }
}

/** Map a document status → Arabic label + color + icon. */
function mapDocStatus(status: ApplicationDocumentStatus) {
  switch (status) {
    case 'required':
      return { label: 'مطلوب', color: colors.gold, icon: 'alert-circle-outline' as const };
    case 'waiting_customer':
      return { label: 'مطلوب منك رفعه', color: colors.gold, icon: 'cloud-upload-outline' as const };
    case 'uploaded':
    case 'under_review':
      return { label: 'بانتظار المراجعة', color: colors.cyan, icon: 'time-outline' as const };
    case 'approved':
      return { label: 'مقبول', color: '#16A34A', icon: 'checkmark-circle-outline' as const };
    case 'rejected':
    case 'reupload_required':
      return { label: 'مرفوض — أعد الرفع', color: '#EF4444', icon: 'close-circle-outline' as const };
    default:
      return { label: 'مطلوب', color: colors.gold, icon: 'document-outline' as const };
  }
}

/** True when the customer still needs to act on this document. */
function docNeedsCustomer(status: ApplicationDocumentStatus): boolean {
  return status === 'required' || status === 'waiting_customer' || status === 'reupload_required' || status === 'rejected';
}

const API_BASE = `https://${process.env.EXPO_PUBLIC_DOMAIN}`;

/** Upload a local file to secure storage; returns the stored object PATH. */
async function uploadToStorage(localUri: string, token: string | null, mimeType?: string, fileName?: string): Promise<string> {
  const formData = new FormData();
  const name = fileName ?? 'document.jpg';
  const type = mimeType ?? 'image/jpeg';
  if (Platform.OS === 'web') {
    const blob = await (await fetch(localUri)).blob();
    formData.append('file', new File([blob], name, { type: blob.type || type }));
  } else {
    formData.append('file', { uri: localUri, type, name } as any);
  }
  const res = await fetch(`${API_BASE}/api/storage/uploads`, {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    body: formData,
  });
  if (!res.ok) throw new Error(`Upload failed: ${res.status}`);
  const { objectPath } = await res.json();
  return objectPath as string;
}

const isPdfPath = (p: string | null | undefined) => !!p && /\.pdf(\?|$)/i.test(p);

/**
 * DocumentCard — one requested document with status badge, instructions,
 * rejection reason, current-version preview, and upload / re-upload action.
 */
function DocumentCard({
  doc,
  visaId,
  onUploaded,
}: {
  doc: ApplicationDocument;
  visaId: number;
  onUploaded: () => void;
}) {
  const c = useColors();
  const { accessToken } = useAuth();
  const [busy, setBusy] = React.useState(false);
  const uploadMut = useUploadApplicationDocument();

  const ds = mapDocStatus(doc.status);
  const allowsImage = doc.allowedFileType === 'image' || doc.allowedFileType === 'image_pdf';
  const allowsPdf = doc.allowedFileType === 'pdf' || doc.allowedFileType === 'image_pdf';
  const currentPath = doc.currentVersion?.storagePath ?? null;
  const currentIsPdf = isPdfPath(currentPath) || (doc.currentVersion?.mimeType ?? '').includes('pdf');
  const needsAction = docNeedsCustomer(doc.status);

  const submit = async (localUri: string, mimeType?: string, fileName?: string) => {
    if (busy || uploadMut.isPending) return;
    // Backend validates file type & max size against the document config.
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setBusy(true);
    try {
      const storagePath = await uploadToStorage(localUri, accessToken, mimeType, fileName);
      await uploadMut.mutateAsync({ id: doc.applicationId, docId: doc.id, data: { storagePath } });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('تم', 'تم رفع المستند بنجاح');
      onUploaded();
    } catch {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('خطأ في الرفع', 'تعذّر رفع المستند. يرجى التحقق من نوع الملف وحجمه والمحاولة مجدداً.');
    } finally {
      setBusy(false);
    }
  };

  const fromCamera = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('إذن مطلوب', 'يرجى السماح بالوصول إلى الكاميرا من إعدادات الجهاز.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({ quality: 0.9 });
    if (result.canceled || !result.assets?.[0]) return;
    const a = result.assets[0];
    submit(a.uri, a.mimeType ?? undefined, a.fileName ?? undefined);
  };

  const fromGallery = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('إذن مطلوب', 'يرجى السماح بالوصول إلى معرض الصور من إعدادات الجهاز.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.9 });
    if (result.canceled || !result.assets?.[0]) return;
    const a = result.assets[0];
    submit(a.uri, a.mimeType ?? undefined, a.fileName ?? undefined);
  };

  const fromPdf = async () => {
    const result = await DocumentPicker.getDocumentAsync({ type: 'application/pdf', copyToCacheDirectory: true });
    if (result.canceled || !result.assets?.[0]) return;
    const a = result.assets[0];
    submit(a.uri, a.mimeType ?? 'application/pdf', a.name ?? `document_${Date.now()}.pdf`);
  };

  const pick = () => {
    if (busy || uploadMut.isPending) return;
    const buttons: { text: string; onPress?: () => void; style?: 'cancel' }[] = [];
    if (allowsImage && Platform.OS !== 'web') buttons.push({ text: 'الكاميرا', onPress: fromCamera });
    if (allowsImage) buttons.push({ text: 'المعرض', onPress: fromGallery });
    if (allowsPdf) buttons.push({ text: 'ملف PDF', onPress: fromPdf });
    buttons.push({ text: 'إلغاء', style: 'cancel' });
    // If only one real source, invoke it directly.
    const real = buttons.filter((b) => b.style !== 'cancel');
    if (real.length === 1 && real[0].onPress) {
      real[0].onPress();
      return;
    }
    Alert.alert(doc.nameAr, 'اختر مصدر الملف', buttons);
  };

  const typeHint =
    doc.allowedFileType === 'image' ? 'صورة' : doc.allowedFileType === 'pdf' ? 'ملف PDF' : 'صورة أو PDF';
  const sizeHint = doc.maxFileSizeMb ? ` · حتى ${doc.maxFileSizeMb} ميجابايت` : '';
  const loading = busy || uploadMut.isPending;

  return (
    <View style={[styles.docCard, { borderColor: needsAction ? ds.color + '55' : c.border, backgroundColor: c.card }]}>
      <View style={styles.docCardHead}>
        <View style={[styles.docStatusBadge, { backgroundColor: ds.color + '1A' }]}>
          <Ionicons name={ds.icon} size={13} color={ds.color} />
          <Text style={[styles.docStatusText, { color: ds.color, fontFamily: 'Cairo_700Bold' }]}>{ds.label}</Text>
        </View>
        <View style={styles.docNameWrap}>
          <Text style={[styles.docCardName, { color: c.foreground, fontFamily: 'Cairo_700Bold' }]}>
            {doc.nameAr}
            {doc.required ? <Text style={{ color: c.destructive }}> *</Text> : null}
          </Text>
          <View style={[styles.docIconBox, { backgroundColor: c.goldTint }]}>
            <Ionicons name="document-attach-outline" size={18} color={colors.gold} />
          </View>
        </View>
      </View>

      {/* Instructions */}
      {(doc.requestDescription || doc.description) ? (
        <Text style={[styles.docDesc, { color: c.mutedForeground, fontFamily: 'Cairo_400Regular' }]}>
          {doc.requestDescription || doc.description}
        </Text>
      ) : null}

      {/* Rejection reason */}
      {(doc.status === 'rejected' || doc.status === 'reupload_required') && doc.rejectionReason ? (
        <View style={[styles.docReject, { backgroundColor: '#FEE2E2', borderColor: '#EF4444' }]}>
          <Ionicons name="warning-outline" size={16} color="#991B1B" />
          <Text style={[styles.docRejectText, { fontFamily: 'Cairo_600SemiBold' }]}>{doc.rejectionReason}</Text>
        </View>
      ) : null}

      {/* Current version preview */}
      {currentPath ? (
        currentIsPdf ? (
          <View style={[styles.docPdf, { backgroundColor: c.goldTint, borderColor: colors.gold }]}>
            <View style={[styles.docPdfIcon, { backgroundColor: colors.gold }]}>
              <Ionicons name="document-text" size={20} color={colors.navy} />
            </View>
            <Text style={[styles.docPdfName, { color: c.foreground, fontFamily: 'Cairo_600SemiBold' }]} numberOfLines={1}>
              {decodeURIComponent(doc.currentVersion?.originalFilename ?? currentPath.split('/').pop() ?? 'document.pdf')}
            </Text>
          </View>
        ) : (
          <Image source={getImageSource(currentPath)} style={styles.docThumb} contentFit="cover" />
        )
      ) : null}

      {/* Upload / re-upload action */}
      {needsAction ? (
        <Pressable
          onPress={pick}
          disabled={loading}
          style={({ pressed }) => [
            styles.docUploadBtn,
            { backgroundColor: loading ? c.muted : colors.gold, opacity: pressed ? 0.85 : 1 },
          ]}
        >
          {loading ? (
            <>
              <ActivityIndicator size="small" color={colors.navy} />
              <Text style={[styles.docUploadText, { color: colors.navy, fontFamily: 'Cairo_700Bold' }]}>جارٍ الرفع...</Text>
            </>
          ) : (
            <>
              <Ionicons name={currentPath ? 'refresh' : 'add-circle-outline'} size={18} color={colors.navy} />
              <Text style={[styles.docUploadText, { color: colors.navy, fontFamily: 'Cairo_700Bold' }]}>
                {currentPath ? 'إعادة رفع المستند' : 'إرفاق المستند'}
              </Text>
            </>
          )}
        </Pressable>
      ) : null}

      <Text style={[styles.docHint, { color: c.mutedForeground, fontFamily: 'Cairo_400Regular' }]}>
        {typeHint}{sizeHint}
      </Text>
    </View>
  );
}

export default function VisaTrackingScreen() {
  const c = useColors();
  const queryClient = useQueryClient();
  const insets = useSafeAreaInsets();
  const topInset = Platform.OS === 'web' ? 67 : insets.top;
  const bottomInset = Platform.OS === 'web' ? 34 : Math.max(insets.bottom, 20);

  const { id } = useLocalSearchParams<{ id: string }>();
  const visaId = Number(id);

  const { data: application, isLoading, error } = useGetVisaApplication(visaId, {
    query: { enabled: !!visaId, queryKey: getGetVisaApplicationQueryKey(visaId) },
  });

  const { data: documentsData, refetch: refetchDocs } = useListApplicationDocuments(visaId, {
    query: { enabled: !!visaId, queryKey: getListApplicationDocumentsQueryKey(visaId) },
  });
  const documents: ApplicationDocument[] = Array.isArray(documentsData) ? documentsData : [];
  const pendingDocsCount = documents.filter((d) => docNeedsCustomer(d.status)).length;

  const handleDocUploaded = React.useCallback(() => {
    queryClient.invalidateQueries({ queryKey: getListApplicationDocumentsQueryKey(visaId) });
    refetchDocs();
  }, [queryClient, refetchDocs, visaId]);

  const Header = ({ title }: { title: string }) => (
    <LinearGradient colors={['#071525', colors.navy]} style={[styles.header, { paddingTop: topInset + 12 }]}>
      <View style={styles.headerRow}>
        <Pressable onPress={() => router.back()} hitSlop={10} style={styles.backBtn}>
          <Ionicons name="arrow-forward" size={22} color="#FFFFFF" />
        </Pressable>
        <Text style={[styles.headerTitle, { fontFamily: 'Cairo_700Bold' }]}>{title}</Text>
        <View style={{ width: 40 }} />
      </View>
    </LinearGradient>
  );

  if (isLoading) {
    return (
      <View style={[styles.container, { backgroundColor: c.background }]}>
        <Header title="تتبع الطلب" />
        <View style={styles.centerFill}>
          <ActivityIndicator size="large" color={colors.gold} />
        </View>
      </View>
    );
  }

  if (error || !application) {
    return (
      <View style={[styles.container, { backgroundColor: c.background }]}>
        <Header title="تتبع الطلب" />
        <View style={styles.centerFill}>
          <Ionicons name="alert-circle-outline" size={64} color={c.destructive} />
          <Text style={[styles.errorText, { color: c.foreground, fontFamily: 'Cairo_600SemiBold' }]}>
            حدث خطأ أثناء تحميل الطلب
          </Text>
        </View>
      </View>
    );
  }

  const st = mapStatus(application.status || 'pending');
  const trackingRef = application.trackingNumber ?? `#${application.id}`;
  const isReady = st.index === 4 && !st.rejected;

  const adminNote = (application.adminNotes ?? '').trim();
  const issuedVisaUrl = (application.issuedVisaUrl ?? '').trim();
  const hasVisaFile = issuedVisaUrl.length > 0;

  const handleDownload = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (!hasVisaFile) {
      Alert.alert('التأشيرة غير متوفرة بعد', 'لم يتم إصدار ملف التأشيرة الخاص بك بعد. سنعلمك فور جاهزيته.');
      return;
    }
    let url = toIssuedVisaUrl(issuedVisaUrl);
    try {
      // Private objects need a short-lived signed URL (Linking/window.open
      // cannot attach the Authorization header).
      if (issuedVisaUrl.startsWith('/objects/')) {
        const signed = await customFetch<{ url: string }>(
          `/api/storage/sign?path=${encodeURIComponent(issuedVisaUrl)}&download=1`,
        );
        url = toIssuedVisaUrl(signed.url);
      }
    } catch {
      Alert.alert('تعذر فتح الملف', 'حدث خطأ أثناء تجهيز رابط التحميل. حاول مجدداً.');
      return;
    }
    try {
      if (Platform.OS === 'web') {
        window.open(url, '_blank');
      } else {
        const supported = await Linking.canOpenURL(url);
        if (supported) await Linking.openURL(url);
        else Alert.alert('تعذر فتح الملف', 'حدث خطأ أثناء محاولة فتح ملف التأشيرة.');
      }
    } catch {
      Alert.alert('تعذر فتح الملف', 'حدث خطأ أثناء محاولة فتح ملف التأشيرة.');
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: c.background }]}>
      <Header title="تتبع طلب التأشيرة" />

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: bottomInset + 100, gap: 16 }} showsVerticalScrollIndicator={false}>
        {/* Hero */}
        <View style={[styles.heroCard, { backgroundColor: c.card, borderColor: c.border }]}>
          <View style={[styles.heroIconWrap, { backgroundColor: c.goldTint }]}>
            <Ionicons name="document-text" size={34} color={colors.gold} />
          </View>
          <Text style={[styles.heroTitle, { color: c.foreground, fontFamily: 'Cairo_700Bold' }]}>
            طلب تأشيرة
          </Text>
          <View style={[styles.refPill, { backgroundColor: c.muted }]}>
            <Ionicons name="pricetag-outline" size={14} color={c.mutedForeground} />
            <Text style={[styles.refNumber, { color: c.foreground, fontFamily: 'Cairo_700Bold' }]}>{trackingRef}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: st.color + '1A', borderColor: st.color }]}>
            <View style={[styles.statusDot, { backgroundColor: st.color }]} />
            <Text style={[styles.statusText, { color: st.color, fontFamily: 'Cairo_700Bold' }]}>{st.label}</Text>
          </View>
          {pendingDocsCount > 0 && (
            <View style={[styles.docReqBadge, { backgroundColor: colors.gold }]}>
              <Ionicons name="alert-circle" size={14} color={colors.navy} />
              <Text style={[styles.docReqBadgeText, { color: colors.navy, fontFamily: 'Cairo_700Bold' }]}>
                {pendingDocsCount > 1 ? `${pendingDocsCount} مستندات مطلوبة` : 'مستند مطلوب'}
              </Text>
            </View>
          )}
        </View>

        {/* Rejected banner */}
        {st.rejected && (
          <View style={[styles.rejectBanner, { backgroundColor: '#FEE2E2', borderColor: '#EF4444' }]}>
            <Ionicons name="close-circle" size={22} color="#991B1B" />
            <View style={{ flex: 1 }}>
              <Text style={[styles.rejectTitle, { fontFamily: 'Cairo_700Bold' }]}>تم رفض الطلب</Text>
              {application.adminNotes ? (
                <Text style={[styles.rejectDesc, { fontFamily: 'Cairo_400Regular' }]}>{application.adminNotes}</Text>
              ) : (
                <Text style={[styles.rejectDesc, { fontFamily: 'Cairo_400Regular' }]}>
                  يرجى التواصل مع الدعم لمزيد من التفاصيل
                </Text>
              )}
            </View>
          </View>
        )}

        {/* Admin note — shown prominently when the team leaves a note */}
        {!st.rejected && adminNote.length > 0 && (
          <View style={styles.adminNoteCard}>
            <View style={styles.adminNoteHeader}>
              <View style={styles.adminNoteIconWrap}>
                <Ionicons name="chatbubble-ellipses" size={18} color="#0A2342" />
              </View>
              <Text style={[styles.adminNoteTitle, { fontFamily: 'Cairo_700Bold' }]}>ملاحظة من الإدارة</Text>
            </View>
            <Text style={[styles.adminNoteBody, { fontFamily: 'Cairo_600SemiBold' }]}>{adminNote}</Text>
          </View>
        )}

        {/* Issued visa file — available for download */}
        {hasVisaFile && (
          <View style={[styles.section, { backgroundColor: c.card, borderColor: '#16A34A' }]}>
            <View style={styles.docRow}>
              <View style={styles.docLeft}>
                <View style={[styles.docIcon, { backgroundColor: 'rgba(22, 163, 74, 0.12)' }]}>
                  <Ionicons name="document-attach" size={20} color="#16A34A" />
                </View>
                <View>
                  <Text style={[styles.docName, { color: c.foreground, fontFamily: 'Cairo_700Bold' }]}>ملف التأشيرة</Text>
                  <Text style={[styles.docHint, { color: c.mutedForeground, fontFamily: 'Cairo_400Regular' }]}>جاهز للتحميل</Text>
                </View>
              </View>
              <Ionicons name="checkmark-circle" size={24} color="#16A34A" />
            </View>
          </View>
        )}

        {/* Timeline */}
        <View style={[styles.section, { backgroundColor: c.card, borderColor: c.border }]}>
          <Text style={[styles.sectionTitle, { color: c.foreground, fontFamily: 'Cairo_700Bold' }]}>مراحل الطلب</Text>

          <View style={styles.timeline}>
            {TIMELINE.map((step, index) => {
              const isPast = !st.rejected && index < st.index;
              const isCurrent = !st.rejected && index === st.index;
              const isActive = isPast || isCurrent;
              const isLast = index === TIMELINE.length - 1;

              const dotBg = isPast ? colors.gold : isCurrent ? c.card : c.muted;
              const dotBorder = isActive ? colors.gold : c.border;
              const iconColor = isPast ? colors.navy : isCurrent ? colors.gold : c.mutedForeground;

              return (
                <View key={step.key} style={styles.timelineRow}>
                  <View style={styles.timelineIconCol}>
                    <View style={[styles.timelineDot, { backgroundColor: dotBg, borderColor: dotBorder }]}>
                      {isPast ? (
                        <Ionicons name="checkmark" size={16} color={colors.navy} />
                      ) : (
                        <Ionicons name={step.icon} size={15} color={iconColor} />
                      )}
                    </View>
                    {!isLast && (
                      <View style={[styles.timelineLine, { backgroundColor: isPast ? colors.gold : c.border }]} />
                    )}
                  </View>

                  <View style={styles.timelineContent}>
                    <Text
                      style={[
                        styles.timelineLabel,
                        {
                          color: isCurrent ? colors.gold : isActive ? c.foreground : c.mutedForeground,
                          fontFamily: isCurrent ? 'Cairo_700Bold' : 'Cairo_600SemiBold',
                        },
                      ]}
                    >
                      {step.label}
                    </Text>
                    {isActive && (
                      <Text style={[styles.timelineDesc, { color: c.mutedForeground, fontFamily: 'Cairo_400Regular' }]}>
                        {step.desc}
                      </Text>
                    )}
                    {isActive && index === 0 && application.createdAt && (
                      <Text style={[styles.timelineDate, { color: c.mutedForeground, fontFamily: 'Cairo_400Regular' }]}>
                        {new Date(application.createdAt).toLocaleDateString('ar-SA')}
                      </Text>
                    )}
                  </View>
                </View>
              );
            })}
          </View>
        </View>

        {/* Applicant summary */}
        <View style={[styles.section, { backgroundColor: c.card, borderColor: c.border }]}>
          <Text style={[styles.sectionTitle, { color: c.foreground, fontFamily: 'Cairo_700Bold' }]}>بيانات مقدم الطلب</Text>
          {([
            ['الاسم', application.fullName],
            ['الجنسية', application.nationality],
            ['رقم الجواز', application.passportNumber],
          ] as [string, string | undefined][]).map(([k, v]) =>
            v ? (
              <View key={k} style={[styles.infoRow, { borderBottomColor: c.border }]}>
                <Text style={[styles.infoVal, { color: c.foreground, fontFamily: 'Cairo_600SemiBold' }]}>{v}</Text>
                <Text style={[styles.infoKey, { color: c.mutedForeground, fontFamily: 'Cairo_400Regular' }]}>{k}</Text>
              </View>
            ) : null,
          )}
        </View>

        {/* Documents */}
        <View style={[styles.section, { backgroundColor: c.card, borderColor: c.border }]}>
          <Text style={[styles.sectionTitle, { color: c.foreground, fontFamily: 'Cairo_700Bold' }]}>المستندات المرفقة</Text>
          {([
            ['جواز السفر', !!application.passportImageUrl],
            ['الصورة الشخصية', !!application.personalPhotoUrl],
            ['صورة الإقامة', !!application.residencyImageUrl],
          ] as [string, boolean][]).map(([name, uploaded]) => (
            <View key={name} style={styles.docRow}>
              <View style={styles.docLeft}>
                <View style={[styles.docIcon, { backgroundColor: c.muted }]}>
                  <Ionicons name="document-outline" size={18} color={c.foreground} />
                </View>
                <Text style={[styles.docName, { color: c.foreground, fontFamily: 'Cairo_600SemiBold' }]}>{name}</Text>
              </View>
              <Ionicons
                name={uploaded ? 'checkmark-circle' : 'remove-circle-outline'}
                size={22}
                color={uploaded ? '#16A34A' : c.mutedForeground}
              />
            </View>
          ))}
        </View>

        {/* Required / requested documents */}
        {documents.length > 0 && (
          <View style={[styles.section, { backgroundColor: c.card, borderColor: c.border }]}>
            <View style={styles.docSectionHead}>
              {pendingDocsCount > 0 && (
                <View style={[styles.docCountPill, { backgroundColor: colors.gold + '22' }]}>
                  <Text style={[styles.docCountText, { color: colors.gold, fontFamily: 'Cairo_700Bold' }]}>
                    {pendingDocsCount}
                  </Text>
                </View>
              )}
              <Text style={[styles.sectionTitle, { color: c.foreground, fontFamily: 'Cairo_700Bold', marginBottom: 0 }]}>
                المستندات المطلوبة
              </Text>
            </View>
            <View style={{ gap: 12, marginTop: 4 }}>
              {documents.map((doc) => (
                <DocumentCard key={doc.id} doc={doc} visaId={visaId} onUploaded={handleDocUploaded} />
              ))}
            </View>
          </View>
        )}
      </ScrollView>

      {/* Footer */}
      <View style={[styles.footer, { paddingBottom: bottomInset + 10, backgroundColor: c.card, borderTopColor: c.border }]}>
        <Pressable
          style={({ pressed }) => [
            styles.downloadBtn,
            { backgroundColor: hasVisaFile ? colors.gold : c.muted, opacity: pressed ? 0.85 : 1 },
          ]}
          onPress={handleDownload}
          disabled={!hasVisaFile}
        >
          <Ionicons name="download-outline" size={20} color={hasVisaFile ? colors.navy : c.mutedForeground} />
          <Text style={[styles.downloadBtnText, { color: hasVisaFile ? colors.navy : c.mutedForeground, fontFamily: 'Cairo_700Bold' }]}>
            {hasVisaFile ? 'تحميل التأشيرة' : 'التأشيرة غير متوفرة بعد'}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 16, paddingBottom: 16 },
  headerRow: { flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between' },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { color: '#FFFFFF', fontSize: 18 },
  centerFill: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 16 },
  errorText: { fontSize: 16 },

  heroCard: { padding: 24, borderRadius: 18, borderWidth: 1, alignItems: 'center', gap: 10 },
  heroIconWrap: { width: 72, height: 72, borderRadius: 22, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  heroTitle: { fontSize: 20, textAlign: 'center' },
  refPill: { flexDirection: 'row-reverse', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  refNumber: { fontSize: 14, writingDirection: 'ltr' },
  statusBadge: { flexDirection: 'row-reverse', alignItems: 'center', gap: 8, marginTop: 2, paddingHorizontal: 16, paddingVertical: 7, borderRadius: 20, borderWidth: 1 },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  statusText: { fontSize: 14 },

  rejectBanner: { flexDirection: 'row-reverse', alignItems: 'flex-start', gap: 12, padding: 16, borderRadius: 16, borderWidth: 1 },
  rejectTitle: { fontSize: 15, color: '#991B1B', textAlign: 'right' },
  rejectDesc: { fontSize: 13, color: '#991B1B', textAlign: 'right', marginTop: 2, lineHeight: 20 },

  section: { padding: 18, borderRadius: 18, borderWidth: 1, gap: 8 },
  sectionTitle: { fontSize: 16, textAlign: 'right', marginBottom: 8 },

  adminNoteCard: {
    padding: 18, borderRadius: 16, borderWidth: 1, borderColor: 'rgba(212, 175, 55, 0.5)',
    backgroundColor: 'rgba(212, 175, 55, 0.10)', gap: 10,
  },
  adminNoteHeader: { flexDirection: 'row-reverse', alignItems: 'center', gap: 10 },
  adminNoteIconWrap: {
    width: 34, height: 34, borderRadius: 12, alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(212, 175, 55, 0.25)',
  },
  adminNoteTitle: { fontSize: 15, color: '#0A2342', textAlign: 'right' },
  adminNoteBody: { fontSize: 14, color: '#3F3F46', textAlign: 'right', lineHeight: 24 },

  timeline: { gap: 0 },
  timelineRow: { flexDirection: 'row-reverse', alignItems: 'flex-start' },
  timelineIconCol: { width: 36, alignItems: 'center' },
  timelineDot: { width: 36, height: 36, borderRadius: 18, borderWidth: 2, alignItems: 'center', justifyContent: 'center', zIndex: 2 },
  timelineLine: { width: 2.5, height: 40, marginTop: -1, zIndex: 1, borderRadius: 2 },
  timelineContent: { flex: 1, paddingRight: 14, paddingBottom: 26, paddingTop: 6 },
  timelineLabel: { fontSize: 15, textAlign: 'right' },
  timelineDesc: { fontSize: 12.5, textAlign: 'right', marginTop: 2, lineHeight: 18 },
  timelineDate: { fontSize: 12, textAlign: 'right', marginTop: 3 },

  infoRow: { flexDirection: 'row-reverse', justifyContent: 'space-between', paddingVertical: 11, borderBottomWidth: StyleSheet.hairlineWidth },
  infoKey: { fontSize: 13 },
  infoVal: { fontSize: 14 },

  docRow: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8 },
  docLeft: { flexDirection: 'row-reverse', alignItems: 'center', gap: 12 },
  docIcon: { width: 38, height: 38, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  docName: { fontSize: 14 },

  footer: { paddingHorizontal: 16, paddingTop: 14, borderTopWidth: 1 },
  downloadBtn: { flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 16, borderRadius: 14 },
  downloadBtnText: { fontSize: 16 },

  // ── Required documents ──
  docReqBadge: { flexDirection: 'row-reverse', alignItems: 'center', gap: 6, marginTop: 4, paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20 },
  docReqBadgeText: { fontSize: 13 },
  docSectionHead: { flexDirection: 'row-reverse', alignItems: 'center', gap: 8 },
  docCountPill: { minWidth: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 6 },
  docCountText: { fontSize: 13 },
  docCard: { borderRadius: 16, borderWidth: 1.5, padding: 14, gap: 10 },
  docCardHead: { flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  docNameWrap: { flexDirection: 'row-reverse', alignItems: 'center', gap: 10, flexShrink: 1 },
  docIconBox: { width: 36, height: 36, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  docCardName: { fontSize: 15, textAlign: 'right', flexShrink: 1 },
  docStatusBadge: { flexDirection: 'row-reverse', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 16 },
  docStatusText: { fontSize: 11.5 },
  docDesc: { fontSize: 13, textAlign: 'right', lineHeight: 20 },
  docReject: { flexDirection: 'row-reverse', alignItems: 'flex-start', gap: 8, padding: 10, borderRadius: 12, borderWidth: 1 },
  docRejectText: { flex: 1, fontSize: 12.5, color: '#991B1B', textAlign: 'right', lineHeight: 19 },
  docThumb: { width: '100%', height: 160, borderRadius: 12 },
  docPdf: { flexDirection: 'row-reverse', alignItems: 'center', gap: 10, padding: 12, borderRadius: 12, borderWidth: 1 },
  docPdfIcon: { width: 40, height: 40, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  docPdfName: { flex: 1, fontSize: 13, textAlign: 'right' },
  docUploadBtn: { flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 12, borderRadius: 12 },
  docUploadText: { fontSize: 14 },
  docHint: { fontSize: 11.5, textAlign: 'right' },
});
