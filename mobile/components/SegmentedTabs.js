import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { colors, radii } from '../ui/Theme';

/**
 * Pill-style segmented control.
 * tabs: [{ key, label, count?, tone? }]
 */
export default function SegmentedTabs({ tabs, value, onChange, style }) {
  return (
    <View style={[styles.track, style]}>
      {tabs.map((tab) => {
        const active = tab.key === value;
        return (
          <TouchableOpacity
            key={tab.key}
            onPress={() => onChange(tab.key)}
            activeOpacity={0.85}
            style={[styles.tab, active && styles.tabActive]}
          >
            <Text numberOfLines={1} style={[styles.label, active && styles.labelActive]}>
              {tab.label}
            </Text>
            {tab.count !== undefined ? (
              <View style={[styles.count, active && styles.countActive]}>
                <Text style={[styles.countText, active && styles.countTextActive]}>{tab.count}</Text>
              </View>
            ) : null}
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    flexDirection: 'row',
    backgroundColor: colors.neutralSoft,
    borderRadius: radii.md,
    padding: 4,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 9,
    paddingHorizontal: 6,
    borderRadius: radii.sm,
    gap: 6,
  },
  tabActive: {
    backgroundColor: colors.surface,
    shadowColor: '#0B1F4B',
    shadowOpacity: 0.08,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  label: { fontSize: 13, fontWeight: '700', color: colors.textMuted, flexShrink: 1 },
  labelActive: { color: colors.text },
  count: {
    minWidth: 20,
    height: 20,
    paddingHorizontal: 6,
    borderRadius: 10,
    backgroundColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  countActive: { backgroundColor: colors.primary },
  countText: { fontSize: 11, fontWeight: '800', color: colors.textSecondary },
  countTextActive: { color: '#fff' },
});
