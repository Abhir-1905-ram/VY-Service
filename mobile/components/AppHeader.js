import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, spacing, radii, shadows, hitSlop } from '../ui/Theme';
import Icon from './Icon';
import BrandMark from './BrandMark';

/**
 * Navy app bar with rounded bottom edge.
 * - `onBackPress` shows a back button.
 * - `showBrand` shows the VY mark before the title.
 * - `onProfilePress` + `rightIconName` render a right-side icon button (legacy API).
 * - `rightAction={{ icon, onPress, label }}` is the preferred right-side action.
 * - `large` renders a taller bar with a display title and optional `subtitle`.
 */
export default function AppHeader({
  title = '',
  subtitle,
  onBackPress,
  showBrand = false,
  onProfilePress,
  rightIconName = 'person-circle-outline',
  rightAction,
  large = false,
  children,
}) {
  const insets = useSafeAreaInsets();
  const action = rightAction || (onProfilePress ? { icon: rightIconName, onPress: onProfilePress } : null);

  return (
    <View style={[styles.bar, { paddingTop: insets.top + spacing.sm }]}>
      <View pointerEvents="none" style={styles.glowLarge} />
      <View pointerEvents="none" style={styles.glowSmall} />

      <View style={styles.row}>
        <View style={styles.left}>
          {onBackPress ? (
            <TouchableOpacity onPress={onBackPress} style={styles.circleBtn} hitSlop={hitSlop} accessibilityLabel="Go back">
              <Icon name="chevron-back" size={22} color={colors.textOnDark} />
            </TouchableOpacity>
          ) : null}
          {showBrand ? <BrandMark size={26} style={styles.brand} /> : null}
          {!large && !!title ? (
            <Text style={styles.title} numberOfLines={1}>
              {title}
            </Text>
          ) : null}
        </View>
        {action ? (
          <TouchableOpacity onPress={action.onPress} style={styles.circleBtn} hitSlop={hitSlop} accessibilityLabel={action.label || 'Action'}>
            <Icon name={action.icon} size={22} color={colors.textOnDark} />
          </TouchableOpacity>
        ) : null}
      </View>

      {large ? (
        <View style={styles.largeBlock}>
          {!!subtitle && <Text style={styles.eyebrow}>{subtitle}</Text>}
          {!!title && <Text style={styles.largeTitle}>{title}</Text>}
        </View>
      ) : null}

      {children ? <View style={styles.children}>{children}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    backgroundColor: colors.primaryDeep,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
    borderBottomLeftRadius: radii.xl,
    borderBottomRightRadius: radii.xl,
    overflow: 'hidden',
    ...(Platform.OS === 'ios' ? shadows.header : { elevation: 0 }),
  },
  glowLarge: {
    position: 'absolute',
    right: -70,
    top: -90,
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: colors.primary,
    opacity: 0.22,
  },
  glowSmall: {
    position: 'absolute',
    left: -50,
    bottom: -70,
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: colors.primary,
    opacity: 0.12,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 44,
  },
  left: { flexDirection: 'row', alignItems: 'center', flex: 1, flexShrink: 1 },
  circleBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  brand: { marginLeft: spacing.xs, marginRight: spacing.sm },
  title: {
    color: colors.textOnDark,
    fontWeight: '800',
    fontSize: 18,
    marginLeft: spacing.sm,
    flexShrink: 1,
    letterSpacing: 0.2,
  },
  largeBlock: { marginTop: spacing.md },
  eyebrow: {
    color: colors.textOnDarkMuted,
    fontWeight: '700',
    fontSize: 12,
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  largeTitle: { color: colors.textOnDark, fontWeight: '800', fontSize: 26, letterSpacing: -0.3 },
  children: { marginTop: spacing.md },
});
