import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { tones } from '../ui/Theme';

const TONE_KEYS = ['primary', 'success', 'info', 'warning', 'neutral'];

function pickTone(name) {
  const s = String(name || '');
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return TONE_KEYS[h % TONE_KEYS.length];
}

/** Initials avatar whose tint is derived from the name. */
export default function Avatar({ name, size = 44, tone, style }) {
  const t = tones[tone || pickTone(name)];
  const initials = String(name || '?')
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() || '')
    .join('') || '?';
  return (
    <View style={[styles.wrap, { width: size, height: size, borderRadius: size / 2, backgroundColor: t.soft }, style]}>
      <Text style={[styles.text, { color: t.main, fontSize: Math.round(size * 0.38) }]}>{initials}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', justifyContent: 'center' },
  text: { fontWeight: '800' },
});
