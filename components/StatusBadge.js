import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, radii } from '../ui/Theme';

export default function StatusBadge({ status }) {
  const text = String(status || '').trim();
  const isDeliveredContext = text.toLowerCase().includes('delivered');
  const isNotCompleted = text.toLowerCase().includes('not completed');
  const base =
    isDeliveredContext
      ? (isNotCompleted ? '#9E9E9E' : colors.secondary) // Delivered column: Not Completed -> grey, others -> green
      : text === 'Completed'
        ? colors.secondary
        : text === 'Not Completed'
          ? '#9E9E9E'
          : text === 'Delivered'
            ? colors.secondary
            : colors.warning;
  return (
    <View style={[styles.badge, { backgroundColor: base }]}>
      <Text style={styles.text}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: radii.lg },
  text: { color: '#fff', fontSize: 12, fontWeight: '700' },
});


