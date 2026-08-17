/**
 * FeedbackBanner — inline success/error feedback block for forms.
 *
 * A non-modal, animated banner that appears inside the form flow (e.g. above
 * the submit button). Use for validation errors and light success confirmations
 * that don't warrant a full Toast.
 */
import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '@/hooks/useColors';

type BannerType = 'success' | 'error' | 'warning' | 'info';

interface FeedbackBannerProps {
  type: BannerType;
  message: string;
  visible: boolean;
}

export function FeedbackBanner({ type, message, visible }: FeedbackBannerProps) {
  const c = useColors();
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(-8)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(opacity, { toValue: 1, duration: 200, useNativeDriver: true }),
        Animated.spring(translateY, { toValue: 0, damping: 20, stiffness: 200, useNativeDriver: true }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(opacity, { toValue: 0, duration: 150, useNativeDriver: true }),
        Animated.timing(translateY, { toValue: -8, duration: 150, useNativeDriver: true }),
      ]).start();
    }
  }, [visible, opacity, translateY]);

  const config: Record<BannerType, { icon: any; border: string; bg: string; text: string }> = {
    success: { icon: 'checkmark-circle', border: c.success, bg: c.success + '14', text: c.success },
    error:   { icon: 'close-circle',     border: c.error,   bg: c.error   + '14', text: c.error   },
    warning: { icon: 'warning',           border: c.warning, bg: c.warning + '14', text: c.warning },
    info:    { icon: 'information-circle',border: c.skyBlue, bg: c.skyBlue + '14', text: c.skyBlue },
  };

  const { icon, border, bg, text } = config[type];

  if (!visible) return null;

  return (
    <Animated.View
      style={[
        styles.banner,
        { borderColor: border, backgroundColor: bg, opacity, transform: [{ translateY }] },
      ]}
    >
      <Ionicons name={icon} size={18} color={text} />
      <Text style={[styles.message, { color: text, fontFamily: 'Cairo_600SemiBold' }]}>{message}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  message: {
    flex: 1,
    fontSize: 13,
    textAlign: 'right',
    lineHeight: 20,
  },
});
