import React from 'react';
import { View, ScrollView, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, spacing } from '../ui/Theme';

/**
 * Page scaffold: paints the app background, mounts an optional header and
 * renders children either in a plain view or a keyboard-aware ScrollView.
 */
export default function Screen({
  header,
  children,
  scroll = false,
  padded = true,
  keyboard = false,
  refreshControl,
  contentStyle,
  style,
  keyboardShouldPersistTaps = 'always',
}) {
  const insets = useSafeAreaInsets();
  const paddingTop = header ? 0 : insets.top;

  let body;
  if (scroll) {
    body = (
      <ScrollView
        style={styles.flex}
        contentContainerStyle={[padded && styles.padded, styles.scrollContent, contentStyle]}
        keyboardShouldPersistTaps={keyboardShouldPersistTaps}
        keyboardDismissMode="on-drag"
        nestedScrollEnabled
        showsVerticalScrollIndicator={false}
        refreshControl={refreshControl}
      >
        {children}
      </ScrollView>
    );
  } else {
    body = <View style={[styles.flex, padded && styles.padded, contentStyle]}>{children}</View>;
  }

  if (keyboard && Platform.OS === 'ios') {
    body = (
      <KeyboardAvoidingView
        style={styles.flex}
        behavior="padding"
        keyboardVerticalOffset={80}
      >
        {body}
      </KeyboardAvoidingView>
    );
  }

  return (
    <View style={[styles.root, { paddingTop }, style]}>
      {header}
      {body}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  flex: { flex: 1 },
  padded: { paddingHorizontal: spacing.lg, paddingTop: spacing.lg },
  scrollContent: { paddingBottom: spacing.xxxl },
});
