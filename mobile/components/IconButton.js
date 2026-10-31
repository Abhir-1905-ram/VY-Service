import React from 'react';
import { TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { colors, tones, hitSlop } from '../ui/Theme';
import Icon from './Icon';

/**
 * Circular icon-only button. `tone` picks the tinted background/icon color.
 */
export default function IconButton({
  icon,
  onPress,
  tone = 'primary',
  size = 44,
  iconSize,
  loading = false,
  disabled = false,
  outlined = false,
  style,
  accessibilityLabel,
}) {
  const t = tones[tone] || tones.primary;
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      hitSlop={hitSlop}
      activeOpacity={0.8}
      accessibilityLabel={accessibilityLabel}
      style={[
        styles.btn,
        { width: size, height: size, borderRadius: size / 2, backgroundColor: t.soft },
        outlined && { borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface },
        (disabled || loading) && styles.disabled,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator size="small" color={t.main} />
      ) : (
        <Icon name={icon} size={iconSize || Math.round(size * 0.5)} color={t.main} />
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  btn: { alignItems: 'center', justifyContent: 'center' },
  disabled: { opacity: 0.5 },
});
