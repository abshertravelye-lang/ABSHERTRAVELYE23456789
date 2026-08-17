import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { KeyboardAwareForm } from '@/components/KeyboardAwareForm';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { useColors } from '@/hooks/useColors';
import { useLanguage } from '@/context/LanguageContext';

export default function ForgotPasswordScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { t, writingDirection } = useLanguage();

  const [step, setStep] = useState<1 | 2>(1);
  const [contact, setContact] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSendLink = () => {
    if (!contact) return;
    setIsLoading(true);
    // Simulate API call
    setTimeout(() => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setIsLoading(false);
      setStep(2);
    }, 1200);
  };

  return (
    <KeyboardAwareForm style={[styles.container, { backgroundColor: colors.background }]} contentContainerStyle={{ flexGrow: 1 }}>
        {/* Header */}
        <LinearGradient colors={['#071525', '#052B5B', '#1E3A5F']} style={[styles.header, { paddingTop: insets.top + 16 }]}>
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-forward" size={24} color="#FFFFFF" />
          </Pressable>
          <View style={styles.headerContent}>
            <View style={[styles.iconCircle, { backgroundColor: '#D4AF37' }]}>
              <Ionicons name={step === 1 ? 'key' : 'mail-unread'} size={32} color="#052B5B" />
            </View>
            <Text style={[styles.title, { fontFamily: 'Cairo_700Bold' }]}>
              {step === 1 ? t('forgot.title1') : t('forgot.title2')}
            </Text>
            <Text style={[styles.subtitle, { fontFamily: 'Cairo_400Regular', writingDirection }]}>
              {step === 1 ? t('forgot.subtitle1') : t('forgot.subtitle2')}
            </Text>
          </View>
        </LinearGradient>

        <View style={styles.form}>
          {step === 1 ? (
            <>
              <View style={styles.field}>
                <Text style={[styles.label, { color: colors.foreground, fontFamily: 'Cairo_600SemiBold', writingDirection }]}>
                  {t('forgot.field')}
                </Text>
                <View style={[styles.inputRow, { backgroundColor: colors.muted, borderColor: colors.border }]}>
                  <TextInput
                    value={contact}
                    onChangeText={setContact}
                    placeholder="example@email.com"
                    placeholderTextColor={colors.mutedForeground}
                    autoCapitalize="none"
                    keyboardType="email-address"
                    returnKeyType="send"
                    onSubmitEditing={handleSendLink}
                    style={[styles.input, { color: colors.foreground, fontFamily: 'Cairo_400Regular', writingDirection }]}
                  />
                  <Ionicons name="person-circle-outline" size={20} color={colors.mutedForeground} />
                </View>
              </View>

              <Pressable
                style={({ pressed }) => [
                  styles.submitBtn,
                  { backgroundColor: '#D4AF37', opacity: pressed || isLoading || !contact ? 0.8 : 1 }
                ]}
                onPress={handleSendLink}
                disabled={isLoading || !contact}
              >
                <Text style={[styles.submitBtnText, { fontFamily: 'Cairo_700Bold' }]}>
                  {isLoading ? t('forgot.submitting') : t('forgot.submit')}
                </Text>
              </Pressable>
            </>
          ) : (
            <>
              <Pressable
                style={({ pressed }) => [
                  styles.submitBtn,
                  { backgroundColor: '#D4AF37', opacity: pressed ? 0.8 : 1 }
                ]}
                onPress={() => router.replace('/auth/login')}
              >
                <Text style={[styles.submitBtnText, { fontFamily: 'Cairo_700Bold' }]}>
                  {t('forgot.backToLogin')}
                </Text>
              </Pressable>
              
              <View style={styles.resendContainer}>
                <Text style={[styles.resendText, { color: colors.mutedForeground, fontFamily: 'Cairo_400Regular' }]}>
                  {t('forgot.noLink')}
                </Text>
                <Pressable onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setStep(1);
                }}>
                  <Text style={[styles.resendBtn, { color: colors.secondary, fontFamily: 'Cairo_600SemiBold' }]}>
                    {t('forgot.retry')}
                  </Text>
                </Pressable>
              </View>
            </>
          )}
        </View>
    </KeyboardAwareForm>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 20, paddingBottom: 32 },
  backBtn: { alignSelf: 'flex-start', marginBottom: 20 },
  headerContent: { alignItems: 'center', gap: 12 },
  iconCircle: { width: 72, height: 72, borderRadius: 36, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  title: { fontSize: 24, color: '#FFFFFF' },
  subtitle: { fontSize: 14, color: 'rgba(255,255,255,0.8)', textAlign: 'center', lineHeight: 24 },
  form: { padding: 24, gap: 24, flex: 1, paddingTop: 32 },
  field: { gap: 8 },
  label: { fontSize: 14, textAlign: 'right' },
  inputRow: { flexDirection: 'row', alignItems: 'center', borderRadius: 12, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 14, gap: 10 },
  input: { flex: 1, fontSize: 15, textAlign: 'right' },
  submitBtn: { borderRadius: 16, paddingVertical: 17, alignItems: 'center', marginTop: 8, shadowColor: '#D4AF37', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 4 },
  submitBtnText: { color: '#052B5B', fontSize: 17 },
  resendContainer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 6, marginTop: 16 },
  resendText: { fontSize: 14 },
  resendBtn: { fontSize: 14 },
});