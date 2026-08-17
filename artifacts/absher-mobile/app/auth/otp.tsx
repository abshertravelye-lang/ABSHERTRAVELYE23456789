import React, { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { KeyboardAwareForm } from '@/components/KeyboardAwareForm';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { useColors } from '@/hooks/useColors';
import { useLanguage } from '@/context/LanguageContext';

export default function OtpScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { t } = useLanguage();
  const { phone, email } = useLocalSearchParams<{ phone?: string; email?: string }>();
  
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [timer, setTimer] = useState(60);
  const [isVerifying, setIsVerifying] = useState(false);
  const inputRefs = useRef<Array<TextInput | null>>([]);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | undefined;
    if (timer > 0) {
      interval = setInterval(() => setTimer((t) => t - 1), 1000);
    }
    return () => clearInterval(interval);
  }, [timer]);

  const handleChange = (text: string, index: number) => {
    if (text.length > 1) {
      // Handle paste
      const chars = text.slice(0, 6).split('');
      const newOtp = [...otp];
      chars.forEach((c, i) => {
        if (index + i < 6) newOtp[index + i] = c;
      });
      setOtp(newOtp);
      const nextEmpty = newOtp.findIndex((v) => v === '');
      if (nextEmpty !== -1) {
        inputRefs.current[nextEmpty]?.focus();
      } else {
        inputRefs.current[5]?.focus();
      }
      return;
    }

    const newOtp = [...otp];
    newOtp[index] = text;
    setOtp(newOtp);

    if (text !== '' && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === 'Backspace' && otp[index] === '' && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerify = () => {
    const code = otp.join('');
    if (code.length < 6) return;
    
    setIsVerifying(true);
    // Simulate verification delay
    setTimeout(() => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setIsVerifying(false);
      router.replace('/(tabs)');
    }, 1500);
  };

  const handleResend = () => {
    if (timer > 0) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setTimer(60);
    setOtp(['', '', '', '', '', '']);
    inputRefs.current[0]?.focus();
  };

  const recipient = phone || email || '';

  return (
    <KeyboardAwareForm style={[styles.container, { backgroundColor: colors.background }]} contentContainerStyle={{ flexGrow: 1 }}>
        {/* Header */}
        <LinearGradient colors={['#071525', '#052B5B', '#1E3A5F']} style={[styles.header, { paddingTop: insets.top + 16 }]}>
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-forward" size={24} color="#FFFFFF" />
          </Pressable>
          <View style={styles.headerContent}>
            <View style={[styles.iconCircle, { backgroundColor: '#D4AF37' }]}>
              <Ionicons name="chatbubble-ellipses" size={32} color="#052B5B" />
            </View>
            <Text style={[styles.title, { fontFamily: 'Cairo_700Bold' }]}>{t('otp.title')}</Text>
            <Text style={[styles.subtitle, { fontFamily: 'Cairo_400Regular' }]}>
              {t('otp.subtitle')}{recipient ? '\n' : ''}
              {recipient ? <Text style={{ fontFamily: 'Cairo_700Bold', color: '#D4AF37' }}>{recipient}</Text> : null}
            </Text>
          </View>
        </LinearGradient>

        <View style={styles.form}>
          <View style={styles.otpContainer}>
            {otp.map((digit, index) => (
              <TextInput
                key={index}
                ref={(ref) => { inputRefs.current[index] = ref; }}
                style={[
                  styles.otpInput,
                  { 
                    backgroundColor: colors.muted,
                    borderColor: digit ? '#D4AF37' : colors.border,
                    color: colors.foreground,
                    fontFamily: 'Cairo_700Bold'
                  }
                ]}
                value={digit}
                onChangeText={(text) => handleChange(text, index)}
                onKeyPress={(e) => handleKeyPress(e, index)}
                keyboardType="number-pad"
                maxLength={6}
                selectTextOnFocus
              />
            ))}
          </View>

          <Pressable
            style={({ pressed }) => [
              styles.verifyBtn,
              { backgroundColor: '#D4AF37', opacity: pressed || isVerifying || otp.join('').length < 6 ? 0.8 : 1 }
            ]}
            onPress={handleVerify}
            disabled={isVerifying || otp.join('').length < 6}
          >
            <Text style={[styles.verifyBtnText, { fontFamily: 'Cairo_700Bold' }]}>
              {isVerifying ? t('otp.verifying') : t('otp.verify')}
            </Text>
          </Pressable>

          <View style={styles.resendContainer}>
            <Text style={[styles.resendText, { color: colors.mutedForeground, fontFamily: 'Cairo_400Regular' }]}>
              {t('otp.noCode')}
            </Text>
            <Pressable onPress={handleResend} disabled={timer > 0}>
              <Text style={[
                styles.resendBtn,
                { color: timer > 0 ? colors.mutedForeground : colors.secondary, fontFamily: 'Cairo_600SemiBold' }
              ]}>
                {timer > 0 ? `${t('otp.resendIn')} (${timer})` : t('otp.resendNow')}
              </Text>
            </Pressable>
          </View>
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
  form: { padding: 24, gap: 32, flex: 1, paddingTop: 40 },
  otpContainer: { flexDirection: 'row', justifyContent: 'space-between', writingDirection: 'ltr' },
  otpInput: {
    width: 50,
    height: 60,
    borderWidth: 2,
    borderRadius: 12,
    fontSize: 24,
    textAlign: 'center',
  },
  verifyBtn: { borderRadius: 16, paddingVertical: 17, alignItems: 'center', shadowColor: '#D4AF37', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 4 },
  verifyBtnText: { color: '#052B5B', fontSize: 17 },
  resendContainer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 6 },
  resendText: { fontSize: 14 },
  resendBtn: { fontSize: 14 },
});