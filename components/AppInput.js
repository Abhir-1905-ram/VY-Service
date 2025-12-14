import React from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';
import { colors, radii } from '../ui/Theme';
import Icon from './Icon';

export default function AppInput({ label, icon, right, style, ...props }) {
  return (
    <View style={style}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <View style={styles.row}>
        {icon ? <Icon name={icon} style={{ marginRight: 8 }} color={colors.textMuted} /> : null}
        <TextInput style={styles.input} placeholderTextColor={colors.textMuted} {...props} />
        {right}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  label: { marginBottom: 6, color: colors.textMuted, fontWeight: '600' },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    paddingHorizontal: 12,
  },
  input: {
    flex: 1,
    paddingVertical: 12,
    color: colors.text,
  },
});


