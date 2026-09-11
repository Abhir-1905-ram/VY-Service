import React from 'react';
import { View, Text, Switch, StyleSheet } from 'react-native';
import { colors, spacing, tones } from '../ui/Theme';
import Icon from './Icon';

/** Settings-style row: icon, label, description and a switch. */
export default function ToggleRow({ icon, label, description, note, value, onValueChange, disabled = false, last = false }) {
  return (
    <View style={[styles.row, !last && styles.divider, disabled && styles.disabled]}>
      {icon ? (
        <View style={[styles.iconWrap, { backgroundColor: value ? tones.primary.soft : colors.neutralSoft }]}>
          <Icon name={icon} size={18} color={value ? colors.primary : colors.textMuted} />
        </View>
      ) : null}
      <View style={styles.textWrap}>
        <Text style={styles.label}>{label}</Text>
        {!!description && <Text style={styles.description}>{description}</Text>}
        {!!note && (
          <View style={styles.noteRow}>
            <Icon name="information-circle-outline" size={13} color={colors.warning} />
            <Text style={styles.note}>{note}</Text>
          </View>
        )}
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        disabled={disabled}
        trackColor={{ false: colors.borderStrong, true: colors.primary }}
        thumbColor="#fff"
        ios_backgroundColor={colors.borderStrong}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.md },
  divider: { borderBottomWidth: 1, borderBottomColor: colors.border },
  disabled: { opacity: 0.55 },
  iconWrap: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginRight: spacing.md },
  textWrap: { flex: 1, paddingRight: spacing.md },
  label: { fontSize: 15, fontWeight: '700', color: colors.text },
  description: { fontSize: 12, color: colors.textMuted, marginTop: 2, lineHeight: 17 },
  noteRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  note: { fontSize: 11, color: colors.warning, fontWeight: '600' },
});
