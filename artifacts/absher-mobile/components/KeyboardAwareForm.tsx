/**
 * KeyboardAwareForm
 *
 * Drop-in wrapper for any form screen. Replaces the common
 * KeyboardAvoidingView + ScrollView pattern with the more robust
 * KeyboardAwareScrollView from react-native-keyboard-controller.
 *
 * Features:
 * - Active field scrolls into view automatically above the keyboard
 * - Scroll remains enabled while the keyboard is open
 * - keyboardShouldPersistTaps="handled" so taps on fields don't dismiss
 * - bottomOffset ensures the field isn't flush against the keyboard edge
 * - Falls back to a plain ScrollView on web
 */
import React from 'react';
import { Platform, ScrollView, ScrollViewProps, StyleSheet, View, ViewStyle, StyleProp } from 'react-native';
import {
  KeyboardAwareScrollView,
  KeyboardAwareScrollViewProps,
} from 'react-native-keyboard-controller';

type Props = Omit<KeyboardAwareScrollViewProps & ScrollViewProps, 'children'> & {
  children: React.ReactNode;
  /** Extra padding added at the bottom of the scroll content (default 80). */
  bottomPadding?: number;
  /** Space between active field bottom and keyboard top (default 24). */
  bottomOffset?: number;
  style?: StyleProp<ViewStyle>;
  contentContainerStyle?: StyleProp<ViewStyle>;
};

export function KeyboardAwareForm({
  children,
  bottomPadding = 80,
  bottomOffset = 24,
  style,
  contentContainerStyle,
  keyboardShouldPersistTaps = 'handled',
  ...rest
}: Props) {
  if (Platform.OS === 'web') {
    return (
      <ScrollView
        style={[styles.fill, style]}
        contentContainerStyle={[{ paddingBottom: bottomPadding }, contentContainerStyle]}
        keyboardShouldPersistTaps={keyboardShouldPersistTaps}
        showsVerticalScrollIndicator={false}
        {...rest}
      >
        {children}
      </ScrollView>
    );
  }

  return (
    <KeyboardAwareScrollView
      style={[styles.fill, style]}
      contentContainerStyle={[{ paddingBottom: bottomPadding }, contentContainerStyle]}
      keyboardShouldPersistTaps={keyboardShouldPersistTaps}
      bottomOffset={bottomOffset}
      showsVerticalScrollIndicator={false}
      {...rest}
    >
      {children}
    </KeyboardAwareScrollView>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
});
