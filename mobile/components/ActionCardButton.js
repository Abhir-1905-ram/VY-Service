import React from 'react';
import { TouchableOpacity, View, Text, StyleSheet } from 'react-native';
import { colors, radii, shadows, tones, spacing } from '../ui/Theme';
import Icon from './Icon';

/**
 * Dashboard navigation tile: tinted icon, title, subtitle and a chevron.
 */
export default function ActionCardButton({
  title,
  subtitle,
  icon = 'construct-outline',
  tone = 'primary',
  accentColor,
  onPress,
  style,
}) {
  const t = tones[tone] || tones.primary;
  const iconColor = accentColor || t.main;
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.85} style={[styles.wrapper, style]}>
      <View style={[styles.iconWrap, { backgroundColor: t.soft }]}>
        <Icon name={icon} size={24} color={iconColor} />
      </View>
      <View style={styles.textWrap}>
        <Text style={styles.title} numberOfLines={1}>
          {title}
        </Text>
        {!!subtitle && (
          <Text style={styles.subtitle} numberOfLines={1}>
            {subtitle}
          </Text>
        )}
      </View>
      <View style={styles.chevron}>
        <Icon name="chevron-forward" size={18} color={colors.textMuted} />
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.card,
  },
  iconWrap: {
    width: 52,
    height: 52,
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.lg,
  },
  textWrap: { flex: 1 },
  title: { fontSize: 16, fontWeight: '800', color: colors.text },
  subtitle: { marginTop: 2, color: colors.textMuted, fontWeight: '600', fontSize: 13 },
  chevron: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: colors.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
