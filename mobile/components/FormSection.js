import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, spacing, tones } from '../ui/Theme';
import AppCard from './AppCard';
import Icon from './Icon';

/** Card grouping related form fields under an icon + title. */
export default function FormSection({ icon, title, subtitle, tone = 'primary', children, style }) {
  const t = tones[tone] || tones.primary;
  return (
    <AppCard style={[styles.card, style]}>
      {(title || icon) && (
        <View style={styles.header}>
          {icon ? (
            <View style={[styles.iconWrap, { backgroundColor: t.soft }]}>
              <Icon name={icon} size={16} color={t.main} />
            </View>
          ) : null}
          <View style={styles.textWrap}>
            {!!title && <Text style={styles.title}>{title}</Text>}
            {!!subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
          </View>
        </View>
      )}
      {children}
    </AppCard>
  );
}

const styles = StyleSheet.create({
  card: { marginBottom: spacing.lg },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.lg },
  iconWrap: { width: 30, height: 30, borderRadius: 9, alignItems: 'center', justifyContent: 'center', marginRight: spacing.sm },
  textWrap: { flex: 1 },
  title: { fontSize: 15, fontWeight: '800', color: colors.text },
  subtitle: { fontSize: 12, color: colors.textMuted, marginTop: 1 },
});
