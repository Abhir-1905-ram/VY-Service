import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { colors, radii, shadows } from '../ui/Theme';
import Icon from './Icon';

const VARIANTS = {
  primary: { bg: colors.primary, fg: '#fff', border: colors.primary, shadow: shadows.button },
  dark: { bg: colors.primaryDeep, fg: '#fff', border: colors.primaryDeep },
  secondary: { bg: colors.primarySoft, fg: colors.primaryDark, border: colors.primarySoft },
  outline: { bg: colors.surface, fg: colors.primaryDark, border: colors.borderStrong },
  ghost: { bg: 'transparent', fg: colors.primary, border: 'transparent' },
  success: { bg: colors.success, fg: '#fff', border: colors.success },
  warning: { bg: colors.warning, fg: '#fff', border: colors.warning },
  danger: { bg: colors.danger, fg: '#fff', border: colors.danger },
  dangerSoft: { bg: colors.dangerSoft, fg: colors.danger, border: colors.dangerSoft },
  neutral: { bg: colors.neutral, fg: '#fff', border: colors.neutral },
  neutralSoft: { bg: colors.neutralSoft, fg: colors.textSecondary, border: colors.neutralSoft },
};

const SIZES = {
  sm: { paddingVertical: 8, paddingHorizontal: 12, fontSize: 13, icon: 16 },
  md: { paddingVertical: 13, paddingHorizontal: 18, fontSize: 15, icon: 18 },
  lg: { paddingVertical: 16, paddingHorizontal: 22, fontSize: 16, icon: 20 },
};

/**
 * Primary action button. `color` is accepted as a legacy alias of `variant`.
 */
export default function AppButton({
  title,
  onPress,
  variant,
  color,
  size = 'md',
  icon,
  iconRight,
  loading = false,
  disabled = false,
  fullWidth = true,
  style,
  textStyle,
}) {
  const v = VARIANTS[variant || color] || VARIANTS.primary;
  const s = SIZES[size] || SIZES.md;
  const isDisabled = disabled || loading;
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.85}
      style={[
        styles.btn,
        { backgroundColor: v.bg, borderColor: v.border, paddingVertical: s.paddingVertical, paddingHorizontal: s.paddingHorizontal },
        !isDisabled && v.shadow,
        !fullWidth && styles.inline,
        isDisabled && styles.disabled,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator size="small" color={v.fg} style={styles.iconLeft} />
      ) : icon ? (
        <Icon name={icon} size={s.icon} color={v.fg} style={styles.iconLeft} />
      ) : null}
      <Text style={[styles.text, { color: v.fg, fontSize: s.fontSize }, textStyle]} numberOfLines={1}>
        {title}
      </Text>
      {iconRight ? <Icon name={iconRight} size={s.icon} color={v.fg} style={styles.iconRight} /> : null}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radii.md,
    borderWidth: 1,
  },
  inline: { alignSelf: 'flex-start' },
  disabled: { opacity: 0.55 },
  text: { fontWeight: '700', letterSpacing: 0.2 },
  iconLeft: { marginRight: 8 },
  iconRight: { marginLeft: 8 },
});
