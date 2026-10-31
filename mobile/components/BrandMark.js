import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, fonts } from '../ui/Theme';

/**
 * Text-rendered VY wordmark: electric blue "V" and silver "Y" in a serif face,
 * echoing the company logo. `variant="dark"` is for light backgrounds.
 */
export default function BrandMark({ size = 28, variant = 'light', style }) {
  const yColor = variant === 'light' ? '#F8FAFC' : colors.textSecondary;
  return (
    <View style={[styles.row, style]} accessibilityLabel="VY">
      <Text style={[styles.letter, { fontSize: size, color: colors.primary }]}>V</Text>
      <Text style={[styles.letter, { fontSize: size, color: yColor, marginLeft: -size * 0.22 }]}>Y</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'flex-end' },
  letter: { fontFamily: fonts.brand, fontWeight: '700', includeFontPadding: false },
});
