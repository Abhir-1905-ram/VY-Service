import React from 'react';
import { View, TextInput, StyleSheet, TouchableOpacity } from 'react-native';
import { colors, radii, spacing, hitSlop } from '../ui/Theme';
import Icon from './Icon';

/** Rounded search field with leading icon and clear button. */
export default function SearchBar({ value, onChangeText, placeholder = 'Search', style, ...props }) {
  return (
    <View style={[styles.wrap, style]}>
      <Icon name="search-outline" size={18} color={colors.textMuted} />
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.textMuted}
        returnKeyType="search"
        autoCorrect={false}
        {...props}
      />
      {value?.length > 0 ? (
        <TouchableOpacity onPress={() => onChangeText('')} hitSlop={hitSlop} accessibilityLabel="Clear search">
          <Icon name="close-circle" size={18} color={colors.textMuted} />
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    height: 46,
    gap: spacing.sm,
  },
  input: { flex: 1, fontSize: 15, color: colors.text, paddingVertical: 0 },
});
