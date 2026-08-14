/**
 * WizardStepper — premium horizontal step indicator with gold accents.
 * RTL-aware (row-reverse). Rendered inside the navy gradient header.
 */
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import colors from '@/constants/colors';

interface Props {
  steps: string[];
  current: number; // 0-based index of the active step
}

export default function WizardStepper({ steps, current }: Props) {
  return (
    <View style={s.row}>
      {steps.map((label, i) => {
        const done = i < current;
        const active = i === current;
        return (
          <React.Fragment key={label}>
            <View style={s.item}>
              <View
                style={[
                  s.circle,
                  done && s.done,
                  active && s.active,
                ]}
              >
                {done ? (
                  <Ionicons name="checkmark" size={13} color={colors.navy} />
                ) : (
                  <Text style={[s.num, active && s.numActive]}>{i + 1}</Text>
                )}
              </View>
              <Text
                style={[s.label, (active || done) && s.labelActive]}
                numberOfLines={1}
              >
                {label}
              </Text>
            </View>
            {i < steps.length - 1 && (
              <View style={[s.line, done && s.lineDone]} />
            )}
          </React.Fragment>
        );
      })}
    </View>
  );
}

const s = StyleSheet.create({
  row: {
    flexDirection: 'row-reverse',
    alignItems: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 14,
  },
  item: { alignItems: 'center', width: 52 },
  circle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.28)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 5,
  },
  done: { backgroundColor: colors.gold, borderColor: colors.gold },
  active: { backgroundColor: 'transparent', borderColor: colors.gold },
  num: { fontSize: 12, color: 'rgba(255,255,255,0.65)', fontFamily: 'Cairo_700Bold' },
  numActive: { color: colors.gold },
  label: {
    fontSize: 9.5,
    color: 'rgba(255,255,255,0.55)',
    textAlign: 'center',
    fontFamily: 'Cairo_400Regular',
  },
  labelActive: { color: colors.gold, fontFamily: 'Cairo_600SemiBold' },
  line: {
    flex: 1,
    height: 2,
    backgroundColor: 'rgba(255,255,255,0.18)',
    marginTop: 14,
    borderRadius: 1,
  },
  lineDone: { backgroundColor: colors.gold },
});
