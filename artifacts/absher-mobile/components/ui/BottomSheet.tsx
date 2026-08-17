import React, { useEffect, useRef } from 'react';
import {
  Animated,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  View,
  Dimensions,
  PanResponder,
} from 'react-native';
import { useColors } from '@/hooks/useColors';
import { haptics } from '@/lib/haptics';
import { KeyboardAwareForm } from '@/components/KeyboardAwareForm';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

export interface BottomSheetProps {
  visible: boolean;
  onClose: () => void;
  children: React.ReactNode;
  /** Pass true when the sheet contains text inputs so it avoids the keyboard. */
  hasInputs?: boolean;
}

export function BottomSheet({ visible, onClose, children, hasInputs = false }: BottomSheetProps) {
  const c = useColors();
  const panY = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.spring(panY, {
          toValue: 0,
          bounciness: 6,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(panY, {
          toValue: SCREEN_HEIGHT,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible, panY, fadeAnim]);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderMove: (e, gestureState) => {
        if (gestureState.dy > 0) {
          panY.setValue(gestureState.dy);
        }
      },
      onPanResponderRelease: (e, gestureState) => {
        if (gestureState.dy > 100 || gestureState.vy > 1.5) {
          haptics.light();
          onClose();
        } else {
          Animated.spring(panY, {
            toValue: 0,
            bounciness: 6,
            useNativeDriver: true,
          }).start();
        }
      },
    })
  ).current;

  if (!visible) return null;

  return (
    <Modal visible transparent animationType="none" onRequestClose={onClose} statusBarTranslucent>
      <Animated.View style={[styles.backdrop, { opacity: fadeAnim }]}>
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={() => {
            haptics.light();
            onClose();
          }}
        />
      </Animated.View>

      <Animated.View
        style={[
          styles.sheet,
          {
            backgroundColor: c.card,
            transform: [{ translateY: panY }],
          },
        ]}
        {...panResponder.panHandlers}
      >
        <View style={styles.handleContainer}>
          <View style={[styles.handle, { backgroundColor: c.border }]} />
        </View>

        {hasInputs ? (
          /* When the sheet contains inputs, use KeyboardAwareForm so the
             active field scrolls above the keyboard automatically. */
          <KeyboardAwareForm
            bottomPadding={40}
            bottomOffset={16}
            contentContainerStyle={styles.content}
          >
            {children}
          </KeyboardAwareForm>
        ) : (
          <View style={[styles.content, styles.staticPadding]}>{children}</View>
        )}
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(3, 27, 58, 0.4)',
  },
  sheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    boxShadow: '0px -4px 12px rgba(0,0,0,0.1)',
    elevation: 20,
    maxHeight: SCREEN_HEIGHT * 0.85,
  },
  handleContainer: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  handle: {
    width: 40,
    height: 5,
    borderRadius: 3,
  },
  content: {
    paddingHorizontal: 20,
  },
  staticPadding: {
    paddingBottom: 40,
  },
});
