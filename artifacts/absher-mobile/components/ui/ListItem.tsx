import React from 'react';
import { StyleSheet, Text, View, Pressable, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '@/hooks/useColors';
import { useLanguage } from '@/context/LanguageContext';

export interface ListItemProps {
  title: string;
  subtitle?: string;
  leftIcon?: keyof typeof Ionicons.glyphMap;
  rightIcon?: keyof typeof Ionicons.glyphMap;
  onPress?: () => void;
  style?: ViewStyle;
  iconColor?: string;
}

export function ListItem({
  title,
  subtitle,
  leftIcon,
  rightIcon = 'chevron-forward',
  onPress,
  style,
  iconColor,
}: ListItemProps) {
  const c = useColors();
  const { isRTL, writingDirection } = useLanguage();

  const handlePress = () => {
    if (onPress) onPress();
  };

  const actualRightIcon = rightIcon === 'chevron-forward' && isRTL ? 'chevron-back' : rightIcon;

  return (
    <Pressable
      onPress={onPress ? handlePress : undefined}
      style={({ pressed }) => [
        styles.container,
        {
          backgroundColor: c.card,
          borderColor: c.border,
          flexDirection: isRTL ? 'row-reverse' : 'row',
          opacity: pressed && onPress ? 0.7 : 1,
        },
        style,
      ]}
    >
      {leftIcon && (
        <View style={[styles.iconContainer, { backgroundColor: c.background }]}>
          <Ionicons name={leftIcon} size={22} color={iconColor || c.primary} />
        </View>
      )}
      
      <View style={[styles.content, { alignItems: isRTL ? 'flex-end' : 'flex-start' }]}>
        <Text style={[styles.title, { color: c.foreground, writingDirection }]}>{title}</Text>
        {subtitle && (
          <Text style={[styles.subtitle, { color: c.mutedForeground, writingDirection }]}>{subtitle}</Text>
        )}
      </View>

      {onPress && (
        <View style={styles.rightIconContainer}>
          <Ionicons name={actualRightIcon} size={20} color={c.mutedForeground} />
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 12,
    alignItems: 'center',
    minHeight: 72,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 12,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
  },
  title: {
    fontFamily: 'Cairo_600SemiBold',
    fontSize: 16,
    marginBottom: 2,
  },
  subtitle: {
    fontFamily: 'Cairo_400Regular',
    fontSize: 13,
  },
  rightIconContainer: {
    paddingHorizontal: 8,
  },
});
