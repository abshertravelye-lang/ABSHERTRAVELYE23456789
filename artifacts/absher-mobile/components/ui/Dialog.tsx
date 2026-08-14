/**
 * Dialog — a premium, brand-consistent confirmation dialog for
 * ABSHER TRAVEL. Refactored to support the new theme system.
 */
import React from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '@/hooks/useColors';

export interface DialogProps {
  visible: boolean;
  title: string;
  message: string;
  cancelLabel: string;
  confirmLabel: string;
  onCancel: () => void;
  onConfirm: () => void;
  icon?: keyof typeof Ionicons.glyphMap;
  confirmStyle?: 'brand' | 'destructive' | 'gold';
}

export function Dialog({
  visible,
  title,
  message,
  cancelLabel,
  confirmLabel,
  onCancel,
  onConfirm,
  icon = 'alert-circle-outline',
  confirmStyle = 'brand',
}: DialogProps) {
  const c = useColors();
  
  const getConfirmColors = () => {
    switch (confirmStyle) {
      case 'destructive': return { bg: c.error, fg: '#FFFFFF', iconAccent: c.error };
      case 'gold': return { bg: c.accent, fg: '#FFFFFF', iconAccent: c.accent };
      case 'brand':
      default: return { bg: c.primary, fg: c.accent, iconAccent: c.accent };
    }
  };

  const confirmColors = getConfirmColors();

  return (
    <Modal visible={visible} transparent animationType="fade" statusBarTranslucent onRequestClose={onCancel}>
      <Pressable style={styles.backdrop} onPress={onCancel}>
        <Pressable style={[styles.card, { backgroundColor: c.card, borderColor: c.border }]} onPress={() => {}}>
          <View style={[styles.iconCircle, { backgroundColor: confirmColors.iconAccent + '15', borderColor: confirmColors.iconAccent + '40' }]}>
            <Ionicons name={icon} size={34} color={confirmColors.iconAccent} />
          </View>

          <Text style={[styles.title, { color: c.foreground, fontFamily: 'Cairo_700Bold' }]}>{title}</Text>
          <Text style={[styles.message, { color: c.mutedForeground, fontFamily: 'Cairo_400Regular' }]}>{message}</Text>

          <View style={styles.actions}>
            <Pressable
              style={({ pressed }) => [styles.btn, styles.cancelBtn, { borderColor: c.border, backgroundColor: c.background, opacity: pressed ? 0.8 : 1 }]}
              onPress={onCancel}
            >
              <Text style={[styles.cancelText, { color: c.foreground, fontFamily: 'Cairo_600SemiBold' }]}>{cancelLabel}</Text>
            </Pressable>
            <Pressable
              style={({ pressed }) => [styles.btn, { backgroundColor: confirmColors.bg, opacity: pressed ? 0.8 : 1 }]}
              onPress={onConfirm}
            >
              <Text style={[styles.confirmText, { color: confirmColors.fg, fontFamily: 'Cairo_700Bold' }]}>{confirmLabel}</Text>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(3, 27, 58, 0.6)', // Deep navy transparent
    alignItems: 'center',
    justifyContent: 'center',
    padding: 28,
  },
  card: {
    width: '100%',
    maxWidth: 360,
    borderRadius: 24,
    borderWidth: 1,
    paddingHorizontal: 22,
    paddingTop: 26,
    paddingBottom: 18,
    alignItems: 'center',
    boxShadow: '0px 8px 24px rgba(0,0,0,0.15)',
    elevation: 12,
  },
  iconCircle: {
    width: 70,
    height: 70,
    borderRadius: 35,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  title: { fontSize: 19, textAlign: 'center', marginBottom: 8 },
  message: { fontSize: 14.5, textAlign: 'center', lineHeight: 22, marginBottom: 24 },
  actions: { flexDirection: 'row-reverse', gap: 12, width: '100%' },
  btn: {
    flex: 1,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  cancelBtn: { borderWidth: 1.5 },
  cancelText: { fontSize: 15 },
  confirmText: { fontSize: 15 },
});
