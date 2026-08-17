/**
 * Toast — lightweight in-app notification system for ABSHER TRAVEL.
 *
 * Usage:
 *   import { useToast } from '@/components/ui/Toast';
 *   const { showToast } = useToast();
 *   showToast({ type: 'success', message: 'تم الحفظ بنجاح' });
 *
 * Provider is mounted at root layout level (already done via ToastProvider).
 */
import React, {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
} from 'react';
import {
  Animated,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '@/hooks/useColors';

// ─── Types ────────────────────────────────────────────────────────────────────

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface ToastOptions {
  type?: ToastType;
  message: string;
  duration?: number; // ms, default 3000
}

interface ToastItem extends ToastOptions {
  id: string;
}

// ─── Context ─────────────────────────────────────────────────────────────────

interface ToastContextValue {
  showToast: (opts: ToastOptions) => void;
}

const ToastContext = createContext<ToastContextValue>({
  showToast: () => {},
});

export function useToast() {
  return useContext(ToastContext);
}

// ─── Single Toast item ────────────────────────────────────────────────────────

function ToastItem({
  item,
  onDismiss,
}: {
  item: ToastItem;
  onDismiss: (id: string) => void;
}) {
  const c = useColors();
  const translateY = useRef(new Animated.Value(-80)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  const config: Record<ToastType, { icon: any; bg: string; border: string; text: string }> = {
    success: {
      icon: 'checkmark-circle',
      bg: c.success + '18',
      border: c.success,
      text: c.success,
    },
    error: {
      icon: 'close-circle',
      bg: c.error + '18',
      border: c.error,
      text: c.error,
    },
    warning: {
      icon: 'warning',
      bg: c.warning + '18',
      border: c.warning,
      text: c.warning,
    },
    info: {
      icon: 'information-circle',
      bg: c.skyBlue + '18',
      border: c.skyBlue,
      text: c.skyBlue,
    },
  };

  const { icon, bg, border, text } = config[item.type ?? 'info'];

  React.useEffect(() => {
    const duration = item.duration ?? 3000;

    // slide in + fade in
    Animated.parallel([
      Animated.spring(translateY, {
        toValue: 0,
        useNativeDriver: true,
        damping: 18,
        stiffness: 200,
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();

    // auto-dismiss
    const timer = setTimeout(() => dismiss(), duration);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const dismiss = useCallback(() => {
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: -80,
        duration: 220,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 220,
        useNativeDriver: true,
      }),
    ]).start(() => onDismiss(item.id));
  }, [item.id, onDismiss, opacity, translateY]);

  return (
    <Animated.View
      style={[
        styles.toast,
        {
          backgroundColor: c.card,
          borderColor: border,
          transform: [{ translateY }],
          opacity,
        },
      ]}
    >
      <View style={[styles.toastInner]}>
        <Ionicons name={icon} size={22} color={text} />
        <Text
          style={[
            styles.toastMessage,
            { color: c.text, fontFamily: 'Cairo_600SemiBold' },
          ]}
          numberOfLines={3}
        >
          {item.message}
        </Text>
        <Pressable onPress={dismiss} hitSlop={8}>
          <Ionicons name="close" size={18} color={c.textSecondary} />
        </Pressable>
      </View>
    </Animated.View>
  );
}

// ─── Provider ─────────────────────────────────────────────────────────────────

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const insets = useSafeAreaInsets();
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const counter = useRef(0);

  const showToast = useCallback((opts: ToastOptions) => {
    const id = `toast_${Date.now()}_${counter.current++}`;
    setToasts((prev) => [...prev.slice(-2), { ...opts, id }]); // max 3 visible
  }, []);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const topOffset = Platform.OS === 'web' ? 67 : insets.top + 8;

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {/* Toast container — absolute above everything */}
      <View
        style={[styles.container, { top: topOffset }]}
        pointerEvents="box-none"
      >
        {toasts.map((t) => (
          <ToastItem key={t.id} item={t} onDismiss={dismiss} />
        ))}
      </View>
    </ToastContext.Provider>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 16,
    right: 16,
    zIndex: 9999,
    gap: 8,
  },
  toast: {
    borderRadius: 16,
    borderWidth: 1.5,
    paddingVertical: 12,
    paddingHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 8,
  },
  toastInner: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 10,
  },
  toastMessage: {
    flex: 1,
    fontSize: 14,
    textAlign: 'right',
    lineHeight: 20,
  },
});
