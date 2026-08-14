/**
 * Umrah Visa — a fully SEPARATE application service (NOT part of the normal
 * visa form). Dedicated single-page wizard driven by the Umrah backend:
 *   GET  /umrah/config?nationality=<x>   → declaration text + fee per nationality
 *   POST /umrah-applications              → creates the application
 *   POST /umrah-applications/:id/pay      → confirms payment (verified server-side)
 *
 * Spec (attached_assets/Pasted-IMPORTANT-UMRAH-VISA...):
 *   1) Host question (نعم/لا). "لا" → professional block modal → home only.
 *   2) نعم → upload host residency image → host phone (+966 prefix, 9 digits, 5x).
 *   3) Applicant (المعتمر): passport image → OCR autofill (name/passport/
 *      nationality/dob/gender/issue/expiry), personal photo, phone, contact
 *      email (optional), emergency phone. NO profile display/reuse.
 *   4) Declaration: fetch config by nationality → show declaration + required
 *      checkbox.
 *   5) Payment: show fee → POST create → payment screen → "ادفع الآن" → pay.
 *   6) Success: tracking, name, type, payment status, order status, date. ONLY
 *      "العودة للرئيسية"; all back navigation blocked after submission.
 */
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  BackHandler,
  Easing,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { router, useNavigation, useFocusEffect } from 'expo-router';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import colors from '@/constants/colors';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import { getImageSource } from '@/hooks/useImageUrl';
import { uploadFile } from '@/lib/uploadFile';
import WizardStepper from '@/components/wizard/WizardStepper';
import {
  ApiError,
  useOcrPassport,
  useGetUmrahConfig,
  getGetUmrahConfigQueryKey,
  useCreateUmrahApplication,
  usePayUmrahApplication,
} from '@workspace/api-client-react';
import type {
  UmrahConfig,
  UmrahApplicationCreated,
  UmrahApplicationCreateGender,
} from '@workspace/api-client-react';

// ─── Constants ────────────────────────────────────────────────────────────────
type Lang = 'ar' | 'en';
const tr = (lang: Lang, ar: string, en: string) => (lang === 'en' ? en : ar);

interface DocPicked {
  uri: string;
  name: string;
  mimeType: string;
  isPdf: boolean;
}

async function pickImageAsset(lang: Lang): Promise<DocPicked | null> {
  const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!perm.granted) {
    Alert.alert(tr(lang, 'الصلاحية مطلوبة', 'Permission required'), tr(lang, 'يرجى السماح بالوصول إلى الصور', 'Please allow access to photos'));
    return null;
  }
  const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.85 });
  if (result.canceled || !result.assets?.[0]) return null;
  const a = result.assets[0];
  return { uri: a.uri, name: a.fileName ?? `photo_${Date.now()}.jpg`, mimeType: a.mimeType ?? 'image/jpeg', isPdf: false };
}

async function captureImageAsset(lang: Lang): Promise<DocPicked | null> {
  const perm = await ImagePicker.requestCameraPermissionsAsync();
  if (!perm.granted) {
    Alert.alert(tr(lang, 'الصلاحية مطلوبة', 'Permission required'), tr(lang, 'يرجى السماح بالوصول إلى الكاميرا', 'Please allow camera access'));
    return null;
  }
  const result = await ImagePicker.launchCameraAsync({ quality: 0.85 });
  if (result.canceled || !result.assets?.[0]) return null;
  const a = result.assets[0];
  return { uri: a.uri, name: a.fileName ?? `photo_${Date.now()}.jpg`, mimeType: a.mimeType ?? 'image/jpeg', isPdf: false };
}

async function pickPdfAsset(): Promise<DocPicked | null> {
  const result = await DocumentPicker.getDocumentAsync({ type: 'application/pdf', copyToCacheDirectory: true });
  if (result.canceled || !result.assets?.[0]) return null;
  const a = result.assets[0];
  return { uri: a.uri, name: a.name ?? `document_${Date.now()}.pdf`, mimeType: a.mimeType ?? 'application/pdf', isPdf: true };
}

// ─── Reusable field ─────────────────────────────────────────────────────────
function Field({
  label, value, onChangeText, placeholder, keyboardType, required, ltr, autoCapitalize,
}: {
  label: string; value: string; onChangeText: (v: string) => void;
  placeholder?: string; keyboardType?: 'default' | 'phone-pad' | 'email-address' | 'number-pad';
  required?: boolean; ltr?: boolean; autoCapitalize?: 'none' | 'characters' | 'sentences';
}) {
  const c = useColors();
  return (
    <View style={f.wrap}>
      <Text style={[f.label, { color: c.foreground, fontFamily: 'Cairo_600SemiBold' }]}>
        {label}{required && <Text style={{ color: c.destructive }}> *</Text>}
      </Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder ?? label}
        placeholderTextColor={c.mutedForeground}
        keyboardType={keyboardType ?? 'default'}
        autoCapitalize={autoCapitalize ?? 'sentences'}
        style={[f.input, { backgroundColor: c.muted, borderColor: c.border, color: c.foreground, fontFamily: 'Cairo_400Regular', textAlign: ltr ? 'left' : 'right' }]}
      />
    </View>
  );
}
const f = StyleSheet.create({
  wrap: { gap: 6 },
  label: { fontSize: 14, textAlign: 'right' },
  input: { borderRadius: 12, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 13, fontSize: 15 },
});

// ─── Document tile ─────────────────────────────────────────────────────────
function DocField({
  label, hint, icon, required, value, busy, onPick, onRemove, allowPdf = true, lang,
}: {
  label: string; hint?: string; icon: keyof typeof Ionicons.glyphMap;
  required?: boolean; value?: string | null; busy?: boolean;
  onPick: (a: DocPicked) => void; onRemove: () => void; allowPdf?: boolean; lang: Lang;
}) {
  const c = useColors();
  const imageSource = getImageSource(value);
  const isPdf = !!value && /\.pdf(\?|$)/i.test(value);

  const choose = async () => {
    if (busy) return;
    const handle = async (source: 'camera' | 'gallery' | 'pdf') => {
      const a = source === 'camera' ? await captureImageAsset(lang)
        : source === 'gallery' ? await pickImageAsset(lang)
        : await pickPdfAsset();
      if (a) onPick(a);
    };
    const buttons: { text: string; onPress?: () => void; style?: 'cancel' }[] = [];
    if (Platform.OS !== 'web') buttons.push({ text: tr(lang, 'الكاميرا', 'Camera'), onPress: () => handle('camera') });
    buttons.push({ text: tr(lang, 'المعرض', 'Gallery'), onPress: () => handle('gallery') });
    if (allowPdf) buttons.push({ text: tr(lang, 'ملف PDF', 'PDF file'), onPress: () => handle('pdf') });
    buttons.push({ text: tr(lang, 'إلغاء', 'Cancel'), style: 'cancel' });
    Alert.alert(label, tr(lang, 'اختر مصدر الملف', 'Choose source'), buttons);
  };

  return (
    <View style={{ gap: 8 }}>
      <View style={docS.labelRow}>
        <View style={{ flex: 1, alignItems: 'flex-end' }}>
          <Text style={[docS.label, { color: c.foreground, fontFamily: 'Cairo_600SemiBold' }]}>
            {label}{required && <Text style={{ color: c.destructive }}> *</Text>}
          </Text>
          {hint ? <Text style={[docS.hint, { color: c.mutedForeground, fontFamily: 'Cairo_400Regular' }]}>{hint}</Text> : null}
        </View>
        {!!value && (
          <View style={[docS.badge, { backgroundColor: c.success + '18', borderColor: c.success }]}>
            <Ionicons name="checkmark-circle" size={13} color={c.success} />
            <Text style={[docS.badgeText, { color: c.success, fontFamily: 'Cairo_600SemiBold' }]}>{tr(lang, 'تم الرفع', 'Uploaded')}</Text>
          </View>
        )}
      </View>

      {busy ? (
        <View style={[docS.area, { backgroundColor: c.muted, borderColor: c.border }]}>
          <ActivityIndicator color={colors.gold} />
          <Text style={[docS.uploadHint, { color: c.mutedForeground, fontFamily: 'Cairo_400Regular' }]}>{tr(lang, 'جارٍ الرفع...', 'Uploading...')}</Text>
        </View>
      ) : value && isPdf ? (
        <View style={[docS.pdfCard, { backgroundColor: c.goldTint, borderColor: colors.gold }]}>
          <View style={[docS.pdfIcon, { backgroundColor: colors.gold }]}>
            <Ionicons name="document-text" size={22} color={colors.umrahGreen} />
          </View>
          <View style={{ flex: 1, alignItems: 'flex-end' }}>
            <Text style={[docS.pdfName, { color: c.foreground, fontFamily: 'Cairo_600SemiBold' }]} numberOfLines={1}>
              {decodeURIComponent(value.split('/').pop() ?? 'document.pdf')}
            </Text>
            <Text style={[docS.hint, { color: c.mutedForeground, fontFamily: 'Cairo_400Regular' }]}>PDF</Text>
          </View>
          <Pressable onPress={choose} hitSlop={8} style={[docS.pdfBtn, { backgroundColor: colors.umrahGreen }]}>
            <Ionicons name="swap-horizontal" size={16} color="#FFFFFF" />
          </Pressable>
          <Pressable onPress={onRemove} hitSlop={8} style={[docS.pdfBtn, { backgroundColor: c.destructive }]}>
            <Ionicons name="trash" size={15} color="#FFFFFF" />
          </Pressable>
        </View>
      ) : imageSource ? (
        <View style={[docS.imgRow, { backgroundColor: c.muted, borderColor: c.border }]}>
          <Pressable onPress={onRemove} hitSlop={8}><Ionicons name="trash-outline" size={20} color={c.destructive} /></Pressable>
          <Pressable onPress={choose} style={docS.replaceBtn}>
            <Ionicons name="camera-outline" size={16} color={colors.umrahGreen} />
            <Text style={[docS.replaceText, { fontFamily: 'Cairo_600SemiBold' }]}>{tr(lang, 'تغيير', 'Change')}</Text>
          </Pressable>
          <View style={{ flex: 1 }} />
          <Image source={imageSource} style={docS.thumb} contentFit="cover" />
        </View>
      ) : (
        <Pressable onPress={choose} style={({ pressed }) => [docS.area, { backgroundColor: c.muted, borderColor: required ? c.destructive + '55' : c.border, opacity: pressed ? 0.85 : 1 }]}>
          <View style={[docS.iconCircle, { backgroundColor: c.goldTint }]}><Ionicons name={icon} size={24} color={colors.gold} /></View>
          <Text style={[docS.uploadTitle, { color: c.foreground, fontFamily: 'Cairo_600SemiBold' }]}>{tr(lang, 'اضغط لرفع الملف', 'Tap to upload')}</Text>
          <Text style={[docS.uploadHint, { color: c.mutedForeground, fontFamily: 'Cairo_400Regular' }]}>{allowPdf ? tr(lang, 'كاميرا · معرض · PDF', 'Camera · Gallery · PDF') : tr(lang, 'كاميرا · معرض', 'Camera · Gallery')}</Text>
        </Pressable>
      )}
    </View>
  );
}
const docS = StyleSheet.create({
  labelRow: { flexDirection: 'row-reverse', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 },
  label: { fontSize: 14, textAlign: 'right' },
  hint: { fontSize: 11.5, textAlign: 'right', marginTop: 1 },
  badge: { flexDirection: 'row-reverse', alignItems: 'center', gap: 4, borderWidth: 1, borderRadius: 20, paddingHorizontal: 8, paddingVertical: 3 },
  badgeText: { fontSize: 11 },
  area: { borderRadius: 16, borderWidth: 1.5, borderStyle: 'dashed', minHeight: 130, alignItems: 'center', justifyContent: 'center', gap: 8 },
  iconCircle: { width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center' },
  uploadTitle: { fontSize: 14 },
  uploadHint: { fontSize: 12 },
  pdfCard: { flexDirection: 'row-reverse', alignItems: 'center', gap: 10, borderWidth: 1.5, borderRadius: 16, padding: 14 },
  pdfIcon: { width: 46, height: 46, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  pdfName: { fontSize: 14, textAlign: 'right' },
  pdfBtn: { width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  imgRow: { flexDirection: 'row-reverse', alignItems: 'center', gap: 12, borderWidth: 1, borderRadius: 16, padding: 12 },
  replaceBtn: { flexDirection: 'row-reverse', alignItems: 'center', gap: 4 },
  replaceText: { fontSize: 13, color: colors.umrahGreen },
  thumb: { width: 60, height: 60, borderRadius: 10, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(212,175,55,0.15)' },
});

// ═══════════════════════════════════════════════════════════════════════════
//  Main screen
// ═══════════════════════════════════════════════════════════════════════════

// Wizard steps (single-page with a step progress header).
//   0) المستضيف   host question + residency + phone
//   1) المعتمر     applicant documents + contact
//   2) الإقرار     declaration
//   3) الدفع       payment
type Gender = UmrahApplicationCreateGender;

export default function UmrahVisaWizard() {
  const c = useColors();
  const { lang } = useLanguage();
  const insets = useSafeAreaInsets();
  const topInset = Platform.OS === 'web' ? 67 : insets.top;
  const bottomInset = Platform.OS === 'web' ? 34 : Math.max(insets.bottom, 16);
  const scroll = useRef<ScrollView>(null);

  const { user: authUser, accessToken } = useAuth();
  const navigation = useNavigation();

  const ocrMutation = useOcrPassport();
  const createMutation = useCreateUmrahApplication();
  const payMutation = usePayUmrahApplication();

  // ── Auth gate ─────────────────────────────────────────────────────────────
  const authCheckedRef = useRef(false);
  useEffect(() => {
    if (authCheckedRef.current) return;
    authCheckedRef.current = true;
    if (!authUser) {
      Alert.alert(
        tr(lang, 'تسجيل الدخول مطلوب', 'Login required'),
        tr(lang, 'يجب تسجيل الدخول للتقديم على تأشيرة العمرة', 'You must log in to apply for an Umrah visa'),
        [
          { text: tr(lang, 'إلغاء', 'Cancel'), style: 'cancel', onPress: () => router.replace('/(tabs)' as never) },
          { text: tr(lang, 'تسجيل الدخول', 'Log in'), onPress: () => router.replace('/auth/login' as never) },
        ],
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authUser]);

  // Reordered wizard per updated spec:
  //  0) host residency  1) host phone  2) declaration  3) passport + OCR
  //  4) personal photo  5) contact info (prefilled)  6) fee  7) payment
  const STEP_LABELS = [
    tr(lang, 'الإقامة', 'Residency'),
    tr(lang, 'الجوال', 'Phone'),
    tr(lang, 'الإقرار', 'Declaration'),
    tr(lang, 'الجواز', 'Passport'),
    tr(lang, 'الصورة', 'Photo'),
    tr(lang, 'التواصل', 'Contact'),
    tr(lang, 'الرسوم', 'Fee'),
    tr(lang, 'الدفع', 'Payment'),
  ];
  const LAST_STEP = STEP_LABELS.length - 1;

  const [step, setStep] = useState(0);

  // ── Step 0: host ────────────────────────────────────────────────────────
  const [hasHost, setHasHost] = useState<boolean | null>(null);
  const [noHostModal, setNoHostModal] = useState(false);
  const [sponsorResidencyImageUrl, setSponsorResidencyImageUrl] = useState('');
  const [hostPhoneDigits, setHostPhoneDigits] = useState(''); // 9 digits after +966

  // ── Step 1: applicant ─────────────────────────────────────────────────────
  const [passportImageUrl, setPassportImageUrl] = useState('');
  const [personalPhotoUrl, setPersonalPhotoUrl] = useState('');
  const [fullName, setFullName] = useState('');
  const [passportNumber, setPassportNumber] = useState('');
  const [nationality, setNationality] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [gender, setGender] = useState<Gender>('male');
  const [passportIssueDate, setPassportIssueDate] = useState('');
  const [passportExpiryDate, setPassportExpiryDate] = useState('');
  const [phone, setPhone] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [emergencyPhone, setEmergencyPhone] = useState('');

  const [busyDoc, setBusyDoc] = useState<string | null>(null);
  const [ocrRunning, setOcrRunning] = useState(false);
  const [ocrDone, setOcrDone] = useState(false);

  // Silently prefill contact info from the signed-in account so the pilgrim
  // never has to re-enter data we already have. Runs once, only fills empties.
  const prefilledRef = useRef(false);
  useEffect(() => {
    if (prefilledRef.current || !authUser) return;
    prefilledRef.current = true;
    if (authUser.phone) setPhone((p) => p || authUser.phone!.replace(/^\+966/, ''));
    if (authUser.email) setContactEmail((e) => e || authUser.email!);
    if (authUser.nationality) setNationality((n) => n || authUser.nationality!);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authUser]);

  // ── Step 2: declaration ────────────────────────────────────────────────────
  const [declared, setDeclared] = useState(false);

  // ── Step 3: payment / create ────────────────────────────────────────────────
  const [created, setCreated] = useState<UmrahApplicationCreated | null>(null);
  const [result, setResult] = useState<UmrahApplicationCreated | null>(null);

  // Umrah config keyed by extracted nationality (declaration + fee per nationality).
  const { data: umrahConfig, isLoading: configLoading } = useGetUmrahConfig(
    nationality ? { nationality } : undefined,
    { query: { enabled: !!authUser, queryKey: getGetUmrahConfigQueryKey(nationality ? { nationality } : undefined) } },
  );

  // ── Back-blocking after submission ──────────────────────────────────────────
  const resultRef = useRef(false);
  useEffect(() => { if (result) resultRef.current = true; }, [result]);

  const leaveToHome = useCallback(() => {
    resultRef.current = false; // allow the navigation to proceed
    router.replace('/(tabs)' as never);
  }, []);

  const goToStep = (s: number) => {
    scroll.current?.scrollTo({ y: 0, animated: false });
    setStep(s);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  // Header back / hardware back.
  const back = () => {
    if (resultRef.current) return; // fully blocked on success
    if (step > 0) { goToStep(step - 1); return; }
    if (router.canGoBack()) router.back();
    else router.replace('/(tabs)' as never);
  };

  // Block OS-level back on the success screen (swipe/browser).
  useEffect(() => {
    const unsub = navigation.addListener('beforeRemove', (e: { preventDefault: () => void }) => {
      if (resultRef.current) e.preventDefault();
    });
    return unsub;
  }, [navigation]);

  useFocusEffect(
    useCallback(() => {
      if (Platform.OS === 'web') return;
      const onBackPress = () => {
        if (resultRef.current) return true; // block on success
        if (step > 0) { goToStep(step - 1); return true; }
        return false;
      };
      const sub = BackHandler.addEventListener('hardwareBackPress', onBackPress);
      return () => sub.remove();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [step]),
  );

  // Web browser-back trap on success.
  useEffect(() => {
    if (Platform.OS !== 'web' || !result) return;
    if (typeof window === 'undefined' || !window.history) return;
    const onPopState = () => {
      if (resultRef.current) window.history.pushState(null, '', window.location.href);
    };
    window.history.pushState(null, '', window.location.href);
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, [result]);

  // Success animation.
  const successScale = useRef(new Animated.Value(0)).current;
  const successOpacity = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (result) {
      Animated.parallel([
        Animated.spring(successScale, { toValue: 1, friction: 5, tension: 60, useNativeDriver: true }),
        Animated.timing(successOpacity, { toValue: 1, duration: 400, easing: Easing.out(Easing.ease), useNativeDriver: true }),
      ]).start();
    }
  }, [result, successScale, successOpacity]);

  // ── OCR passport scan ─────────────────────────────────────────────────────
  const handlePassportScan = async (a: DocPicked) => {
    setBusyDoc('passport');
    setOcrDone(false);
    let objectPath: string;
    try {
      objectPath = await uploadFile({ uri: a.uri, token: accessToken, fileName: a.name, mimeType: a.mimeType });
    } catch {
      setBusyDoc(null);
      Alert.alert(tr(lang, 'خطأ في الرفع', 'Upload error'), tr(lang, 'تعذّر رفع صورة الجواز. تحقق من الملف وحاول مجدداً.', 'Could not upload the passport image. Check the file and try again.'));
      return;
    }
    setBusyDoc(null);
    setPassportImageUrl(objectPath);
    if (a.isPdf) return;
    setOcrRunning(true);
    try {
      const ocr = await ocrMutation.mutateAsync({ data: { imageUrl: objectPath } });
      if (ocr.success) {
        const name = (ocr.fullName || [ocr.firstName, ocr.lastName].filter(Boolean).join(' ')).trim();
        if (name) setFullName(name);
        if (ocr.passportNumber) setPassportNumber(ocr.passportNumber);
        if (ocr.nationality) setNationality(ocr.nationality);
        if (ocr.dateOfBirth) setDateOfBirth(ocr.dateOfBirth);
        if (ocr.issueDate) setPassportIssueDate(ocr.issueDate);
        if (ocr.expiryDate) setPassportExpiryDate(ocr.expiryDate);
        if (ocr.gender) setGender(ocr.gender === 'M' || ocr.gender.toLowerCase() === 'male' ? 'male' : 'female');
        setOcrDone(true);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } else {
        setOcrDone(true);
        Alert.alert(tr(lang, 'تنبيه', 'Notice'), tr(lang, 'لم نتمكن من قراءة الجواز بالكامل. يرجى مراجعة البيانات وإكمالها يدوياً.', 'Could not fully read the passport. Please review and complete the fields.'));
      }
    } catch {
      setOcrDone(true);
      Alert.alert(tr(lang, 'تعذر المسح', 'Scan failed'), tr(lang, 'يمكنك إدخال بيانات الجواز يدوياً.', 'You can enter the passport data manually.'));
    } finally {
      setOcrRunning(false);
    }
  };

  const uploadDoc = async (setter: (v: string) => void, key: string, a: DocPicked) => {
    setBusyDoc(key);
    try {
      const objectPath = await uploadFile({ uri: a.uri, token: accessToken, fileName: a.name, mimeType: a.mimeType });
      setter(objectPath);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {
      Alert.alert(tr(lang, 'خطأ في الرفع', 'Upload error'), tr(lang, 'تعذّر رفع الملف. تحقق من الملف وحاول مجدداً.', 'Could not upload the file. Check the file and try again.'));
    } finally {
      setBusyDoc(null);
    }
  };

  // ── Validation + step advance ─────────────────────────────────────────────
  const validate = (s: number): boolean => {
    // 0) host residency (gated by the host question)
    if (s === 0) {
      if (hasHost !== true) { setNoHostModal(true); return false; }
      if (!sponsorResidencyImageUrl) { Alert.alert(tr(lang, 'مستند مطلوب', 'Document required'), tr(lang, 'يرجى إرفاق صورة إقامة المستضيف.', 'Please upload the host residency image.')); return false; }
      return true;
    }
    // 1) host phone
    if (s === 1) {
      if (!/^5\d{8}$/.test(hostPhoneDigits)) { Alert.alert(tr(lang, 'رقم غير صحيح', 'Invalid number'), tr(lang, 'أدخل رقم جوال المستضيف: 9 أرقام تبدأ بـ 5.', 'Enter the host phone: 9 digits starting with 5.')); return false; }
      return true;
    }
    // 2) declaration
    if (s === 2) {
      if (!declared) { Alert.alert(tr(lang, 'الإقرار مطلوب', 'Declaration required'), tr(lang, 'يرجى قراءة الإقرار والموافقة عليه قبل المتابعة.', 'Please read and accept the declaration to continue.')); return false; }
      return true;
    }
    // 3) passport image + OCR-extracted fields
    if (s === 3) {
      if (!passportImageUrl) { Alert.alert(tr(lang, 'مستند مطلوب', 'Document required'), tr(lang, 'يرجى إرفاق صورة الجواز.', 'Please upload the passport image.')); return false; }
      if (!fullName.trim()) { Alert.alert(tr(lang, 'بيانات ناقصة', 'Missing data'), tr(lang, 'يرجى إدخال اسم المعتمر.', 'Please enter the pilgrim name.')); return false; }
      if (!nationality.trim()) { Alert.alert(tr(lang, 'بيانات ناقصة', 'Missing data'), tr(lang, 'يرجى إدخال الجنسية.', 'Please enter the nationality.')); return false; }
      return true;
    }
    // 4) personal photo
    if (s === 4) {
      if (!personalPhotoUrl) { Alert.alert(tr(lang, 'مستند مطلوب', 'Document required'), tr(lang, 'يرجى إرفاق الصورة الشخصية.', 'Please upload the personal photo.')); return false; }
      return true;
    }
    // 5) contact info
    if (s === 5) {
      if (!/^5\d{8}$/.test(phone) && phone.trim().length < 7) { Alert.alert(tr(lang, 'رقم غير صحيح', 'Invalid number'), tr(lang, 'يرجى إدخال رقم جوال المعتمر.', 'Please enter the pilgrim phone.')); return false; }
      if (!emergencyPhone.trim() || emergencyPhone.trim().length < 7) { Alert.alert(tr(lang, 'رقم غير صحيح', 'Invalid number'), tr(lang, 'يرجى إدخال رقم قريب أو صديق للطوارئ.', 'Please enter an emergency contact phone.')); return false; }
      return true;
    }
    // 6) fee display — nothing to validate before payment
    return true;
  };

  const handleNext = () => {
    if (!validate(step)) return;
    goToStep(step + 1);
  };

  // ── Create the application (spec §5) ──────────────────────────────────────
  const submitCreate = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    createMutation.mutate(
      {
        data: {
          sponsorAvailable: true,
          sponsorResidencyImageUrl,
          sponsorPhone: `+966${hostPhoneDigits}`,
          passportImageUrl,
          personalPhotoUrl,
          fullName: fullName.trim() || undefined,
          passportNumber: passportNumber.trim() || undefined,
          nationality: nationality.trim() || undefined,
          dateOfBirth: dateOfBirth || undefined,
          gender,
          passportIssueDate: passportIssueDate || undefined,
          passportExpiryDate: passportExpiryDate || undefined,
          phone: phone.trim(),
          contactEmail: contactEmail.trim() || undefined,
          emergencyPhone: emergencyPhone.trim(),
          declarationAccepted: declared,
        },
      },
      {
        onSuccess: (res) => {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          setCreated(res);
        },
        onError: (err) => {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
          let message = tr(lang, 'تعذّر تقديم الطلب. يرجى المحاولة لاحقاً.', 'Could not submit the application. Please try again later.');
          if (err instanceof ApiError) {
            const data = err.data as { error?: string } | null;
            if (data?.error) message = data.error; // bilingual error surfaced by server
          }
          Alert.alert(tr(lang, 'تعذّر التقديم', 'Submission failed'), message);
        },
      },
    );
  };

  // ── Pay (spec §5 → §8) ────────────────────────────────────────────────────
  const submitPay = () => {
    if (!created) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    payMutation.mutate(
      { id: created.id },
      {
        onSuccess: () => {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          resultRef.current = true;
          setResult(created);
        },
        onError: (err) => {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
          let message = tr(lang, 'تعذّر إتمام الدفع. يرجى المحاولة مجدداً.', 'Payment could not be completed. Please try again.');
          if (err instanceof ApiError) {
            const data = err.data as { error?: string } | null;
            if (data?.error) message = data.error;
          }
          Alert.alert(tr(lang, 'فشل الدفع', 'Payment failed'), message);
        },
      },
    );
  };

  // ── Shared small components ─────────────────────────────────────────────────
  const NextButton = ({ label, onPress, loading }: { label: string; onPress: () => void; loading?: boolean }) => (
    <Pressable style={({ pressed }) => [styles.nextBtn, { opacity: pressed || loading ? 0.85 : 1 }]} onPress={onPress} disabled={loading}>
      {loading ? <ActivityIndicator color={colors.umrahGreen} /> : (
        <>
          <Text style={[styles.nextBtnText, { fontFamily: 'Cairo_700Bold' }]}>{label}</Text>
          <Ionicons name="arrow-back" size={20} color={colors.umrahGreen} />
        </>
      )}
    </Pressable>
  );

  const StepHead = ({ icon, title, sub }: { icon: keyof typeof Ionicons.glyphMap; title: string; sub: string }) => (
    <View style={styles.stepHead}>
      <View style={[styles.stepHeadIcon, { backgroundColor: c.goldTint }]}><Ionicons name={icon} size={22} color={colors.gold} /></View>
      <View style={{ flex: 1, alignItems: 'flex-end' }}>
        <Text style={[styles.stepTitle, { color: c.foreground, fontFamily: 'Cairo_700Bold' }]}>{title}</Text>
        <Text style={[styles.stepSub, { color: c.mutedForeground, fontFamily: 'Cairo_400Regular' }]}>{sub}</Text>
      </View>
    </View>
  );

  // ═══ SUCCESS SCREEN (spec §6, §9) ══════════════════════════════════════════
  if (result) {
    const rows: [string, string][] = [
      [tr(lang, 'رقم الطلب', 'Tracking number'), result.trackingNumber],
      [tr(lang, 'اسم المعتمر', 'Pilgrim name'), fullName.trim() || '—'],
      [tr(lang, 'نوع الطلب', 'Application type'), tr(lang, 'تأشيرة العمرة', 'Umrah visa')],
      [tr(lang, 'حالة الدفع', 'Payment status'), tr(lang, 'مدفوع', 'Paid')],
      [tr(lang, 'حالة الطلب', 'Application status'), tr(lang, 'تم التقديم', 'Submitted')],
      [tr(lang, 'تاريخ التقديم', 'Submission date'), new Date().toLocaleDateString(lang === 'en' ? 'en-GB' : 'ar-SA')],
    ];
    return (
      <View style={[styles.container, { backgroundColor: c.background }]}>
        <LinearGradient colors={[colors.umrahGreen, '#0A3D28']} style={[styles.header, { paddingTop: topInset + 12 }]}>
          <Text style={[styles.headerTitle, { fontFamily: 'Cairo_700Bold' }]}>{tr(lang, 'تأشيرة العمرة', 'Umrah Visa')}</Text>
        </LinearGradient>
        <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: bottomInset + 40 }} showsVerticalScrollIndicator={false}>
          <Animated.View style={{ alignItems: 'center', transform: [{ scale: successScale }], opacity: successOpacity }}>
            <View style={[styles.successIcon, { backgroundColor: c.success + '18', borderColor: c.success }]}>
              <Ionicons name="checkmark-circle" size={64} color={c.success} />
            </View>
            <Text style={[styles.successTitle, { color: c.foreground, fontFamily: 'Cairo_700Bold' }]}>
              {tr(lang, 'تم تقديم طلب تأشيرة العمرة بنجاح', 'Your Umrah visa application was submitted successfully')}
            </Text>
          </Animated.View>

          <View style={[styles.card, { backgroundColor: c.card, borderColor: c.border, marginTop: 20 }]}>
            {rows.map(([k, v], i) => (
              <View key={k} style={[styles.reviewRow, { borderBottomColor: c.border, borderBottomWidth: i === rows.length - 1 ? 0 : StyleSheet.hairlineWidth }]}>
                <Text style={[styles.reviewVal, { color: c.foreground, fontFamily: 'Cairo_700Bold' }]}>{v}</Text>
                <Text style={[styles.reviewKey, { color: c.mutedForeground, fontFamily: 'Cairo_400Regular' }]}>{k}</Text>
              </View>
            ))}
          </View>

          <Pressable style={({ pressed }) => [styles.primaryBtn, { backgroundColor: colors.umrahGreen, opacity: pressed ? 0.9 : 1, marginTop: 24 }]} onPress={leaveToHome}>
            <Ionicons name="home-outline" size={20} color="#FFFFFF" />
            <Text style={[styles.primaryBtnText, { fontFamily: 'Cairo_700Bold' }]}>{tr(lang, 'العودة للرئيسية', 'Back to Home')}</Text>
          </Pressable>
        </ScrollView>
      </View>
    );
  }

  // ═══ WIZARD ════════════════════════════════════════════════════════════════
  const fee = umrahConfig?.feeForNationality ?? (created ? { amount: created.feeAmount ?? 0, currency: created.feeCurrency } : undefined);

  return (
    <View style={[styles.container, { backgroundColor: c.background }]}>
      <LinearGradient colors={[colors.umrahGreen, '#0A3D28']} style={[styles.header, { paddingTop: topInset + 12 }]}>
        <View style={styles.headerRow}>
          <Pressable onPress={back} hitSlop={10} style={styles.backBtn}>
            <Ionicons name="arrow-forward" size={22} color="#FFFFFF" />
          </Pressable>
          <Text style={[styles.headerTitle, { fontFamily: 'Cairo_700Bold' }]}>{tr(lang, 'تأشيرة العمرة', 'Umrah Visa')}</Text>
          <View style={{ width: 40 }} />
        </View>
        <WizardStepper steps={STEP_LABELS} current={step} />
      </LinearGradient>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView
          ref={scroll}
          contentContainerStyle={{ padding: 18, paddingBottom: bottomInset + 40, gap: 4 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* ── STEP 0: HOST QUESTION + RESIDENCY ────────────────────────── */}
          {step === 0 && (
            <View style={styles.stepWrap}>
              <StepHead icon="business-outline" title={tr(lang, 'المستضيف والإقامة', 'Host & residency')} sub={tr(lang, 'تأشيرة العمرة تتطلب مستضيفاً في المملكة العربية السعودية', 'Umrah visa requires a host in Saudi Arabia')} />

              <View style={[styles.card, { backgroundColor: c.card, borderColor: c.border }]}>
                <Text style={[styles.questionText, { color: c.foreground, fontFamily: 'Cairo_700Bold' }]}>
                  {tr(lang, 'هل لديك مستضيف في المملكة العربية السعودية؟', 'Do you have a host in Saudi Arabia?')}
                </Text>
                <View style={styles.choiceRow}>
                  <Pressable
                    onPress={() => { setHasHost(true); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
                    style={[styles.choiceBtn, { borderColor: hasHost === true ? colors.umrahGreen : c.border, backgroundColor: hasHost === true ? colors.umrahGreen + '12' : c.card }]}
                  >
                    <Ionicons name="checkmark-circle" size={20} color={hasHost === true ? colors.umrahGreen : c.mutedForeground} />
                    <Text style={[styles.choiceText, { color: hasHost === true ? colors.umrahGreen : c.foreground, fontFamily: 'Cairo_700Bold' }]}>{tr(lang, 'نعم', 'Yes')}</Text>
                  </Pressable>
                  <Pressable
                    onPress={() => { setHasHost(false); setNoHostModal(true); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); }}
                    style={[styles.choiceBtn, { borderColor: hasHost === false ? c.destructive : c.border, backgroundColor: hasHost === false ? c.destructive + '12' : c.card }]}
                  >
                    <Ionicons name="close-circle" size={20} color={hasHost === false ? c.destructive : c.mutedForeground} />
                    <Text style={[styles.choiceText, { color: hasHost === false ? c.destructive : c.foreground, fontFamily: 'Cairo_700Bold' }]}>{tr(lang, 'لا', 'No')}</Text>
                  </Pressable>
                </View>
              </View>

              {hasHost === true && (
                <View style={[styles.card, { backgroundColor: c.card, borderColor: c.border, gap: 16 }]}>
                  <DocField
                    lang={lang}
                    label={tr(lang, 'صورة إقامة المستضيف', 'Host residency image')}
                    hint={tr(lang, 'صورة أو ملف PDF واضح للإقامة', 'Clear image or PDF of the residency')}
                    icon="id-card-outline"
                    required
                    value={sponsorResidencyImageUrl}
                    busy={busyDoc === 'sponsorResidency'}
                    onPick={(a) => uploadDoc(setSponsorResidencyImageUrl, 'sponsorResidency', a)}
                    onRemove={() => setSponsorResidencyImageUrl('')}
                  />
                </View>
              )}

              <NextButton label={tr(lang, 'التالي', 'Next')} onPress={handleNext} />
            </View>
          )}

          {/* ── STEP 1: HOST PHONE ───────────────────────────────────────── */}
          {step === 1 && (
            <View style={styles.stepWrap}>
              <StepHead icon="call-outline" title={tr(lang, 'رقم جوال المستضيف', 'Host phone number')} sub={tr(lang, 'رقم الجوال المسجل في أبشر لدى المستضيف', 'The host phone registered in Absher')} />

              <View style={[styles.card, { backgroundColor: c.card, borderColor: c.border }]}>
                <View style={f.wrap}>
                  <Text style={[f.label, { color: c.foreground, fontFamily: 'Cairo_600SemiBold' }]}>
                    {tr(lang, 'رقم جوال المستضيف المسجل في أبشر', 'Host phone registered in Absher')}<Text style={{ color: c.destructive }}> *</Text>
                  </Text>
                  <View style={[styles.phoneRow, { backgroundColor: c.muted, borderColor: c.border }]}>
                    <TextInput
                      value={hostPhoneDigits}
                      onChangeText={(v) => setHostPhoneDigits(v.replace(/[^0-9]/g, '').slice(0, 9))}
                      placeholder="5XXXXXXXX"
                      placeholderTextColor={c.mutedForeground}
                      keyboardType="number-pad"
                      maxLength={9}
                      style={[styles.phoneInput, { color: c.foreground, fontFamily: 'Cairo_400Regular' }]}
                    />
                    <View style={[styles.phonePrefix, { borderColor: c.border }]}>
                      <Text style={[styles.phonePrefixText, { color: c.foreground, fontFamily: 'Cairo_700Bold' }]}>+966</Text>
                    </View>
                  </View>
                </View>
              </View>

              <NextButton label={tr(lang, 'التالي', 'Next')} onPress={handleNext} />
            </View>
          )}

          {/* ── STEP 2: DECLARATION ─────────────────────────────────────── */}
          {step === 2 && (
            <View style={styles.stepWrap}>
              <StepHead icon="document-text-outline" title={tr(lang, 'الإقرار والتعهد', 'Declaration & Undertaking')} sub={tr(lang, 'يرجى قراءة الإقرار بعناية قبل الموافقة', 'Please read the declaration carefully before accepting')} />

              <View style={[styles.card, { backgroundColor: c.card, borderColor: c.border }]}>
                {configLoading ? (
                  <ActivityIndicator color={colors.gold} style={{ marginVertical: 20 }} />
                ) : (
                  <ScrollView style={styles.declarationBox} nestedScrollEnabled showsVerticalScrollIndicator>
                    <Text style={[styles.declarationText, { color: c.foreground, fontFamily: 'Cairo_400Regular' }]}>
                      {(lang === 'en' ? umrahConfig?.declarationEn : umrahConfig?.declarationAr) ||
                        umrahConfig?.declarationAr ||
                        tr(lang, 'يقر المعتمر والمستضيف بالالتزام بأنظمة وتعليمات العمرة والأنظمة المعمول بها في المملكة العربية السعودية.', 'The pilgrim and host acknowledge compliance with Umrah regulations and applicable laws in Saudi Arabia.')}
                    </Text>
                  </ScrollView>
                )}
              </View>

              <Pressable
                onPress={() => setDeclared((v) => !v)}
                style={[styles.checkRow, { backgroundColor: c.card, borderColor: declared ? colors.umrahGreen : c.border }]}
              >
                <Ionicons name={declared ? 'checkbox' : 'square-outline'} size={24} color={declared ? colors.umrahGreen : c.mutedForeground} />
                <Text style={[styles.checkText, { color: c.foreground, fontFamily: 'Cairo_600SemiBold' }]}>
                  {tr(lang, 'أقر بأنني قرأت ووافقت على إقرار وتعهد تأشيرة العمرة.', 'I acknowledge that I have read and agreed to the Umrah visa declaration and undertaking.')}
                </Text>
              </Pressable>

              <NextButton label={tr(lang, 'التالي', 'Next')} onPress={handleNext} />
            </View>
          )}

          {/* ── STEP 3: PASSPORT + OCR ──────────────────────────────────── */}
          {step === 3 && (
            <View style={styles.stepWrap}>
              <StepHead icon="card-outline" title={tr(lang, 'صورة الجواز', 'Passport image')} sub={tr(lang, 'أرفق صورة الجواز لاستخراج البيانات تلقائياً', 'Upload the passport to auto-extract data')} />

              <View style={[styles.card, { backgroundColor: c.card, borderColor: c.border, gap: 16 }]}>
                <DocField
                  lang={lang}
                  label={tr(lang, 'صورة الجواز', 'Passport image')}
                  hint={tr(lang, 'الصفحة الأولى مع البيانات', 'The main data page')}
                  icon="card-outline"
                  required
                  value={passportImageUrl}
                  busy={busyDoc === 'passport'}
                  onPick={handlePassportScan}
                  onRemove={() => { setPassportImageUrl(''); setOcrDone(false); }}
                />
                {ocrRunning && (
                  <View style={styles.ocrRow}>
                    <ActivityIndicator color={colors.gold} />
                    <Text style={[styles.ocrText, { color: c.mutedForeground, fontFamily: 'Cairo_600SemiBold' }]}>{tr(lang, 'جارٍ استخراج بيانات الجواز...', 'Extracting passport data...')}</Text>
                  </View>
                )}
                {ocrDone && !ocrRunning && (
                  <View style={styles.ocrRow}>
                    <Ionicons name="sparkles" size={16} color={c.success} />
                    <Text style={[styles.ocrText, { color: c.success, fontFamily: 'Cairo_600SemiBold' }]}>{tr(lang, 'تم استخراج البيانات — راجعها وعدّلها إن لزم', 'Data extracted — review and edit if needed')}</Text>
                  </View>
                )}
              </View>

              <View style={[styles.card, { backgroundColor: c.card, borderColor: c.border, gap: 14 }]}>
                <Field label={tr(lang, 'الاسم الكامل', 'Full name')} value={fullName} onChangeText={setFullName} required />
                <Field label={tr(lang, 'رقم الجواز', 'Passport number')} value={passportNumber} onChangeText={setPassportNumber} ltr autoCapitalize="characters" />
                <Field label={tr(lang, 'الجنسية', 'Nationality')} value={nationality} onChangeText={setNationality} required />
                <View style={{ flexDirection: 'row-reverse', gap: 12 }}>
                  <View style={{ flex: 1 }}><Field label={tr(lang, 'تاريخ الميلاد', 'Date of birth')} value={dateOfBirth} onChangeText={setDateOfBirth} placeholder="YYYY-MM-DD" ltr /></View>
                </View>
                <View style={{ flexDirection: 'row-reverse', gap: 12 }}>
                  <View style={{ flex: 1 }}><Field label={tr(lang, 'تاريخ الإصدار', 'Issue date')} value={passportIssueDate} onChangeText={setPassportIssueDate} placeholder="YYYY-MM-DD" ltr /></View>
                  <View style={{ flex: 1 }}><Field label={tr(lang, 'تاريخ الانتهاء', 'Expiry date')} value={passportExpiryDate} onChangeText={setPassportExpiryDate} placeholder="YYYY-MM-DD" ltr /></View>
                </View>
                <View style={f.wrap}>
                  <Text style={[f.label, { color: c.foreground, fontFamily: 'Cairo_600SemiBold' }]}>{tr(lang, 'الجنس', 'Gender')}</Text>
                  <View style={{ flexDirection: 'row-reverse', gap: 10 }}>
                    {(['male', 'female'] as Gender[]).map((g) => (
                      <Pressable key={g} onPress={() => setGender(g)} style={[styles.genderBtn, { backgroundColor: gender === g ? colors.umrahGreen : c.muted, borderColor: c.border }]}>
                        <Text style={[styles.genderText, { color: gender === g ? '#FFFFFF' : c.foreground, fontFamily: 'Cairo_600SemiBold' }]}>
                          {g === 'male' ? tr(lang, 'ذكر', 'Male') : tr(lang, 'أنثى', 'Female')}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                </View>
              </View>

              <NextButton label={tr(lang, 'التالي', 'Next')} onPress={handleNext} />
            </View>
          )}

          {/* ── STEP 4: PERSONAL PHOTO ──────────────────────────────────── */}
          {step === 4 && (
            <View style={styles.stepWrap}>
              <StepHead icon="person-circle-outline" title={tr(lang, 'الصورة الشخصية', 'Personal photo')} sub={tr(lang, 'صورة حديثة واضحة بخلفية بيضاء', 'A recent, clear photo with a white background')} />

              <View style={[styles.card, { backgroundColor: c.card, borderColor: c.border, gap: 16 }]}>
                <DocField
                  lang={lang}
                  label={tr(lang, 'الصورة الشخصية', 'Personal photo')}
                  hint={tr(lang, 'صورة حديثة بخلفية بيضاء', 'Recent photo, white background')}
                  icon="person-circle-outline"
                  required
                  allowPdf={false}
                  value={personalPhotoUrl}
                  busy={busyDoc === 'personalPhoto'}
                  onPick={(a) => uploadDoc(setPersonalPhotoUrl, 'personalPhoto', a)}
                  onRemove={() => setPersonalPhotoUrl('')}
                />
              </View>

              <NextButton label={tr(lang, 'التالي', 'Next')} onPress={handleNext} />
            </View>
          )}

          {/* ── STEP 5: CONTACT INFO (prefilled) ────────────────────────── */}
          {step === 5 && (
            <View style={styles.stepWrap}>
              <StepHead icon="chatbubbles-outline" title={tr(lang, 'بيانات التواصل', 'Contact details')} sub={tr(lang, 'تم تعبئة بياناتك تلقائياً — عدّلها إن لزم', 'Your details were prefilled — edit if needed')} />

              <View style={[styles.card, { backgroundColor: c.card, borderColor: c.border, gap: 14 }]}>
                <Field label={tr(lang, 'رقم جوال المعتمر', 'Pilgrim phone')} value={phone} onChangeText={setPhone} keyboardType="phone-pad" ltr required placeholder="+966 5X XXX XXXX" />
                <Field label={tr(lang, 'بريد التواصل (اختياري)', 'Contact email (optional)')} value={contactEmail} onChangeText={setContactEmail} keyboardType="email-address" ltr autoCapitalize="none" placeholder="example@email.com" />
                <Field label={tr(lang, 'رقم جوال قريب أو صديق للطوارئ', 'Emergency contact phone (relative/friend)')} value={emergencyPhone} onChangeText={setEmergencyPhone} keyboardType="phone-pad" ltr required placeholder="+966 5X XXX XXXX" />
              </View>

              <NextButton label={tr(lang, 'التالي', 'Next')} onPress={handleNext} />
            </View>
          )}

          {/* ── STEP 6: FEE ─────────────────────────────────────────────── */}
          {step === 6 && (
            <View style={styles.stepWrap}>
              <StepHead icon="pricetag-outline" title={tr(lang, 'رسوم التأشيرة', 'Visa fee')} sub={tr(lang, 'الرسوم محددة حسب جنسية المعتمر', 'The fee is set according to the pilgrim nationality')} />

              <View style={[styles.card, { backgroundColor: c.goldTint, borderColor: colors.gold, alignItems: 'center', gap: 6 }]}>
                <Text style={[styles.feeLabel, { color: c.mutedForeground, fontFamily: 'Cairo_600SemiBold' }]}>{tr(lang, 'رسوم تأشيرة العمرة', 'Umrah visa fee')}</Text>
                {configLoading ? (
                  <ActivityIndicator color={colors.gold} style={{ marginVertical: 8 }} />
                ) : fee ? (
                  <Text style={[styles.feeAmount, { color: colors.umrahGreen, fontFamily: 'Cairo_700Bold' }]}>
                    {fee.amount} {fee.currency}
                  </Text>
                ) : (
                  <Text style={[styles.feeAmount, { color: colors.umrahGreen, fontFamily: 'Cairo_700Bold' }]}>—</Text>
                )}
                {!!nationality && (
                  <Text style={[styles.stepSub, { color: c.mutedForeground, fontFamily: 'Cairo_400Regular', textAlign: 'center' }]}>
                    {tr(lang, `الجنسية: ${nationality}`, `Nationality: ${nationality}`)}
                  </Text>
                )}
              </View>

              <NextButton label={tr(lang, 'المتابعة للسداد', 'Continue to payment')} onPress={handleNext} />
            </View>
          )}

          {/* ── STEP 7: PAYMENT ─────────────────────────────────────────── */}
          {step === 7 && (
            <View style={styles.stepWrap}>
              <StepHead icon="card-outline" title={tr(lang, 'الدفع', 'Payment')} sub={tr(lang, 'تأشيرة العمرة تتطلب الدفع مقدماً', 'The Umrah visa requires payment upfront')} />

              <View style={[styles.card, { backgroundColor: c.goldTint, borderColor: colors.gold, alignItems: 'center', gap: 6 }]}>
                <Text style={[styles.feeLabel, { color: c.mutedForeground, fontFamily: 'Cairo_600SemiBold' }]}>{tr(lang, 'رسوم تأشيرة العمرة', 'Umrah visa fee')}</Text>
                {fee ? (
                  <Text style={[styles.feeAmount, { color: colors.umrahGreen, fontFamily: 'Cairo_700Bold' }]}>
                    {fee.amount} {fee.currency}
                  </Text>
                ) : (
                  <Text style={[styles.feeAmount, { color: colors.umrahGreen, fontFamily: 'Cairo_700Bold' }]}>—</Text>
                )}
                <Text style={[styles.stepSub, { color: c.mutedForeground, fontFamily: 'Cairo_400Regular', textAlign: 'center' }]}>
                  {tr(lang, 'الرسوم محددة حسب جنسية المعتمر', 'The fee is set according to the pilgrim nationality')}
                </Text>
              </View>

              {!created ? (
                <Pressable
                  style={({ pressed }) => [styles.primaryBtn, { backgroundColor: colors.navy, opacity: pressed || createMutation.isPending ? 0.85 : 1 }]}
                  onPress={submitCreate}
                  disabled={createMutation.isPending}
                >
                  {createMutation.isPending ? <ActivityIndicator color="#FFFFFF" /> : (
                    <>
                      <Ionicons name="document-attach-outline" size={20} color="#FFFFFF" />
                      <Text style={[styles.primaryBtnText, { fontFamily: 'Cairo_700Bold' }]}>{tr(lang, 'إنشاء الطلب والمتابعة للدفع', 'Create application & continue to payment')}</Text>
                    </>
                  )}
                </Pressable>
              ) : (
                <>
                  <View style={[styles.card, { backgroundColor: c.card, borderColor: c.border }]}>
                    <View style={[styles.reviewRow, { borderBottomColor: c.border }]}>
                      <Text style={[styles.reviewVal, { color: c.foreground, fontFamily: 'Cairo_700Bold' }]}>{created.trackingNumber}</Text>
                      <Text style={[styles.reviewKey, { color: c.mutedForeground, fontFamily: 'Cairo_400Regular' }]}>{tr(lang, 'رقم الطلب', 'Tracking number')}</Text>
                    </View>
                    <View style={[styles.reviewRow, { borderBottomColor: c.border, borderBottomWidth: 0 }]}>
                      <Text style={[styles.reviewVal, { color: colors.umrahGreen, fontFamily: 'Cairo_700Bold' }]}>
                        {created.feeAmount ?? fee?.amount ?? '—'} {created.feeCurrency}
                      </Text>
                      <Text style={[styles.reviewKey, { color: c.mutedForeground, fontFamily: 'Cairo_400Regular' }]}>{tr(lang, 'المبلغ المستحق', 'Amount due')}</Text>
                    </View>
                  </View>
                  <Pressable
                    style={({ pressed }) => [styles.primaryBtn, { backgroundColor: colors.umrahGreen, opacity: pressed || payMutation.isPending ? 0.85 : 1 }]}
                    onPress={submitPay}
                    disabled={payMutation.isPending}
                  >
                    {payMutation.isPending ? <ActivityIndicator color="#FFFFFF" /> : (
                      <>
                        <Ionicons name="card" size={20} color="#FFFFFF" />
                        <Text style={[styles.primaryBtnText, { fontFamily: 'Cairo_700Bold' }]}>{tr(lang, 'ادفع الآن', 'Pay now')}</Text>
                      </>
                    )}
                  </Pressable>
                </>
              )}
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>

      {/* ── NO-HOST BLOCK MODAL (spec §3) ──────────────────────────────────── */}
      {noHostModal && (
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalCard, { backgroundColor: c.card, borderColor: c.border }]}>
            <View style={[styles.modalIcon, { backgroundColor: c.destructive + '15', borderColor: c.destructive + '40' }]}>
              <Ionicons name="alert-circle-outline" size={34} color={c.destructive} />
            </View>
            <Text style={[styles.modalTitle, { color: c.foreground, fontFamily: 'Cairo_700Bold' }]}>{tr(lang, 'عذراً', 'Sorry')}</Text>
            <Text style={[styles.modalMsg, { color: c.mutedForeground, fontFamily: 'Cairo_400Regular' }]}>
              {tr(lang,
                'لا يمكنك التقديم على تأشيرة العمرة لعدم وجود مستضيف في المملكة العربية السعودية.',
                'You cannot apply for an Umrah visa because you do not have a host in Saudi Arabia.')}
            </Text>
            <Pressable
              style={({ pressed }) => [styles.primaryBtn, { backgroundColor: colors.navy, opacity: pressed ? 0.9 : 1, width: '100%' }]}
              onPress={() => { setNoHostModal(false); router.replace('/(tabs)' as never); }}
            >
              <Ionicons name="home-outline" size={20} color="#FFFFFF" />
              <Text style={[styles.primaryBtnText, { fontFamily: 'Cairo_700Bold' }]}>{tr(lang, 'العودة للرئيسية', 'Back to Home')}</Text>
            </Pressable>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 16, paddingBottom: 4 },
  headerRow: { flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between' },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { color: '#FFFFFF', fontSize: 18, flex: 1, textAlign: 'center' },

  stepWrap: { gap: 16 },
  stepHead: { flexDirection: 'row-reverse', alignItems: 'center', gap: 12, marginTop: 4 },
  stepHeadIcon: { width: 46, height: 46, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  stepTitle: { fontSize: 18, textAlign: 'right' },
  stepSub: { fontSize: 13, textAlign: 'right', marginTop: 2, lineHeight: 19 },

  card: { borderRadius: 18, borderWidth: 1, padding: 18, gap: 12 },

  questionText: { fontSize: 16, textAlign: 'right', lineHeight: 24 },
  choiceRow: { flexDirection: 'row-reverse', gap: 12 },
  choiceBtn: { flex: 1, flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'center', gap: 8, borderWidth: 1.5, borderRadius: 14, paddingVertical: 16 },
  choiceText: { fontSize: 16 },

  phoneRow: { flexDirection: 'row-reverse', alignItems: 'center', borderWidth: 1, borderRadius: 12, overflow: 'hidden' },
  phoneInput: { flex: 1, paddingHorizontal: 14, paddingVertical: 13, fontSize: 16, textAlign: 'left', writingDirection: 'ltr' },
  phonePrefix: { paddingHorizontal: 14, paddingVertical: 13, borderRightWidth: 1 },
  phonePrefixText: { fontSize: 15 },

  ocrRow: { flexDirection: 'row-reverse', alignItems: 'center', gap: 8 },
  ocrText: { fontSize: 12.5, textAlign: 'right', flex: 1 },

  genderBtn: { flex: 1, borderWidth: 1, borderRadius: 12, paddingVertical: 13, alignItems: 'center' },
  genderText: { fontSize: 15 },

  declarationBox: { maxHeight: 320 },
  declarationText: { fontSize: 14, textAlign: 'right', lineHeight: 24 },

  checkRow: { flexDirection: 'row-reverse', alignItems: 'center', gap: 12, borderWidth: 1.5, borderRadius: 14, padding: 16 },
  checkText: { flex: 1, fontSize: 14, textAlign: 'right', lineHeight: 22 },

  feeLabel: { fontSize: 14 },
  feeAmount: { fontSize: 30, lineHeight: 38 },

  reviewRow: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderBottomWidth: StyleSheet.hairlineWidth },
  reviewKey: { fontSize: 13 },
  reviewVal: { fontSize: 15, writingDirection: 'ltr', textAlign: 'left' },

  nextBtn: { flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: colors.static.premiumGold, paddingVertical: 16, borderRadius: 14, marginTop: 4 },
  nextBtnText: { fontSize: 16, color: colors.umrahGreen },

  primaryBtn: { flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 16, borderRadius: 14 },
  primaryBtnText: { fontSize: 16, color: '#FFFFFF' },

  successIcon: { width: 96, height: 96, borderRadius: 30, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  successTitle: { fontSize: 20, textAlign: 'center', marginTop: 16, lineHeight: 30 },

  // No-host modal
  modalBackdrop: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(3,27,58,0.6)', alignItems: 'center', justifyContent: 'center', padding: 28 },
  modalCard: { width: '100%', maxWidth: 360, borderRadius: 24, borderWidth: 1, paddingHorizontal: 22, paddingTop: 26, paddingBottom: 20, alignItems: 'center', gap: 12, boxShadow: '0px 8px 24px rgba(0,0,0,0.15)', elevation: 12 },
  modalIcon: { width: 70, height: 70, borderRadius: 35, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  modalTitle: { fontSize: 19, textAlign: 'center' },
  modalMsg: { fontSize: 14.5, textAlign: 'center', lineHeight: 23, marginBottom: 8 },
});
