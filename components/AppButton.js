import React from 'react';
import { TouchableOpacity, Text, StyleSheet, View } from 'react-native';
import { colors, radii } from '../ui/Theme';
import Icon from './Icon';

export default function AppButton({ title, onPress, color = 'primary', icon, disabled, style, textStyle }) {
  const bg = color === 'primary' ? colors.primary
    : color === 'secondary' ? colors.secondary
    : color === 'danger' ? colors.danger
    : color === 'warning' ? colors.warning
    : colors.primary;
  return (
    <TouchableOpacity onPress={onPress} disabled={disabled} style={[styles.btn, { backgroundColor: bg, opacity: disabled ? 0.6 : 1 }, style]}>
      {icon ? <View style={{ marginRight: 8 }}><Icon name={icon} size={18} color="#fff" /></View> : null}
      <Text style={[styles.text, textStyle]}>{title}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: radii.md,
  },
  text: { color: '#fff', fontWeight: '700' },
});


