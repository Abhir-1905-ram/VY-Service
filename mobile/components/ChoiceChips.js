import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { colors, radii, spacing } from '../ui/Theme';
import Icon from './Icon';

/**
 * Single-select chip group.
 * options: [{ value, label, icon? }]
 */
export default function ChoiceChips({ options, value, onChange, style }) {
  return (
    <View style={[styles.row, style]}>
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <TouchableOpacity
            key={String(opt.value)}
            onPress={() => onChange(opt.value)}
            activeOpacity={0.85}
            style={[styles.chip, active && styles.chipActive]}
          >
            {opt.icon ? <Icon name={opt.icon} size={16} color={active ? colors.primary : colors.textMuted} style={styles.icon} /> : null}
            <Text style={[styles.label, active && styles.labelActive]}>{opt.label}</Text>
            {active ? <Icon name="checkmark-circle" size={16} color={colors.primary} style={styles.check} /> : null}
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: spacing.sm },
  chip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: spacing.md,
    borderRadius: radii.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  chipActive: { borderColor: colors.primary, backgroundColor: colors.primarySoft },
  icon: { marginRight: 6 },
  check: { marginLeft: 6 },
  label: { fontSize: 14, fontWeight: '700', color: colors.textSecondary },
  labelActive: { color: colors.primaryDark },
});
