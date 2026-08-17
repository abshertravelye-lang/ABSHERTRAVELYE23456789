import React, { forwardRef, useState } from 'react';
import { StyleSheet, TextInput, TextInputProps, View, Text } from 'react-native';
import { useColors } from '@/hooks/useColors';
import { useLanguage } from '@/context/LanguageContext';

export interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

/**
 * Shared text-input with focus-border, label, error, icon slots.
 * Uses forwardRef so callers can chain focus between fields with refs.
 */
export const Input = forwardRef<TextInput, InputProps>(function Input(
  { label, error, leftIcon, rightIcon, style, ...props },
  ref,
) {
  const c = useColors();
  const { isRTL, writingDirection } = useLanguage();
  const [focused, setFocused] = useState(false);

  return (
    <View style={styles.container}>
      {label && (
        <Text style={[styles.label, { color: c.foreground, writingDirection }]}>
          {label}
        </Text>
      )}
      <View
        style={[
          styles.inputContainer,
          {
            backgroundColor: c.background,
            borderColor: error ? c.error : focused ? c.accent : c.border,
            flexDirection: isRTL ? 'row-reverse' : 'row',
          },
        ]}
      >
        {leftIcon && <View style={styles.icon}>{leftIcon}</View>}
        <TextInput
          ref={ref}
          style={[
            styles.input,
            { color: c.foreground, textAlign: isRTL ? 'right' : 'left', writingDirection },
            style,
          ]}
          placeholderTextColor={c.mutedForeground}
          onFocus={(e) => {
            setFocused(true);
            props.onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            props.onBlur?.(e);
          }}
          {...props}
        />
        {rightIcon && <View style={styles.icon}>{rightIcon}</View>}
      </View>
      {error && (
        <Text style={[styles.error, { color: c.error, writingDirection }]}>{error}</Text>
      )}
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    fontFamily: 'Cairo_600SemiBold',
    fontSize: 14,
    marginBottom: 8,
  },
  inputContainer: {
    borderWidth: 1.5,
    borderRadius: 14,
    minHeight: 52,
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  input: {
    flex: 1,
    fontFamily: 'Cairo_400Regular',
    fontSize: 15,
    minHeight: 52,
  },
  icon: {
    paddingHorizontal: 8,
  },
  error: {
    fontFamily: 'Cairo_400Regular',
    fontSize: 12,
    marginTop: 6,
  },
});
