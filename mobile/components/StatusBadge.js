import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { tones, radii } from '../ui/Theme';

/**
 * Maps a repair status string to a tone.
 * Delivered context: "Not Completed - Delivered" → neutral, any other "... - Delivered" → info.
 */
export function statusTone(status) {
  const text = String(status || '').trim().toLowerCase();
  if (text === 'approved' || text === 'viewed') return 'info';
  if (text === 'delivered') return 'success';
  if (text.includes('delivered')) return text.includes('not completed') ? 'neutral' : 'info';
  if (text === 'completed') return 'success';
  if (text === 'not completed') return 'neutral';
  if (text === 'pending') return 'warning';
  return 'warning';
}

export default function StatusBadge({ status, size = 'md', style }) {
  const text = String(status || '').trim();
  const t = tones[statusTone(text)];
  const small = size === 'sm';
  return (
    <View style={[styles.badge, { backgroundColor: t.soft }, small && styles.badgeSm, style]}>
      <View style={[styles.dot, { backgroundColor: t.main }]} />
      <Text style={[styles.text, { color: t.main }, small && styles.textSm]} numberOfLines={1}>
        {text}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radii.round,
    alignSelf: 'flex-start',
  },
  badgeSm: { paddingHorizontal: 8, paddingVertical: 3 },
  dot: { width: 6, height: 6, borderRadius: 3, marginRight: 6 },
  text: { fontSize: 12, fontWeight: '800', letterSpacing: 0.2 },
  textSm: { fontSize: 11 },
});
