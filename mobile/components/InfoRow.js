import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, spacing } from '../ui/Theme';
import Icon from './Icon';

/** Label / value pair used in detail views. `valueColor` tints the value. */
export default function InfoRow({ icon, label, value, valueColor, last = false, children }) {
  return (
    <View style={[styles.row, !last && styles.divider]}>
      {icon ? <Icon name={icon} size={16} color={colors.textMuted} style={styles.icon} /> : null}
      <Text style={styles.label}>{label}</Text>
      <View style={styles.valueWrap}>
        {children || (
          <Text style={[styles.value, valueColor && { color: valueColor }]}>{value}</Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'flex-start', paddingVertical: 9 },
  divider: { borderBottomWidth: 1, borderBottomColor: colors.border },
  icon: { marginRight: spacing.sm, marginTop: 2 },
  label: { width: 110, fontSize: 13, fontWeight: '600', color: colors.textMuted, paddingTop: 1 },
  valueWrap: { flex: 1, alignItems: 'flex-end' },
  value: { fontSize: 14, fontWeight: '700', color: colors.text, textAlign: 'right', lineHeight: 20 },
});
