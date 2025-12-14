import React from 'react';
import { TouchableOpacity, View, Text, StyleSheet } from 'react-native';
import { colors, radii, shadows } from '../ui/Theme';
import Icon from './Icon';

export default function ActionCardButton({
  title,
  subtitle,
  icon = 'construct-outline',
  accentColor,
  onPress,
  style,
}) {
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.85} style={[styles.wrapper, style]}>
      <View style={[
        styles.accent,
        accentColor ? { backgroundColor: accentColor, width: 6 } : { width: 0, backgroundColor: 'transparent' }
      ]} />
      <View style={styles.content}>
        <View style={[styles.iconWrap, { backgroundColor: '#EEF2FF' }]}>
          <Icon name={icon} size={24} color={colors.textMuted} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>{title}</Text>
          {!!subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    backgroundColor: colors.cardBg,
    borderRadius: 20,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.card,
  },
  accent: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 6,
    borderTopLeftRadius: 20,
    borderBottomLeftRadius: 20,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 6,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.text,
  },
  subtitle: {
    marginTop: 2,
    color: colors.textMuted,
    fontWeight: '600',
  },
});


