import React, { useCallback, useState } from 'react';
import { View, ScrollView, StyleSheet, KeyboardAvoidingView, Platform, Keyboard } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
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
  keyboardDismissMode = 'on-drag',
  onScroll,
  scrollRef,
}) {
  const insets = useSafeAreaInsets();
  const paddingTop = header ? 0 : insets.top;
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  useFocusEffect(
    useCallback(() => {
      if (!keyboard) return undefined;
      const readHeight = (event) => event?.endCoordinates?.height || Keyboard.metrics?.()?.height || 0;
      setKeyboardHeight(readHeight());
      const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
      const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';
      const showSub = Keyboard.addListener(showEvent, (event) => setKeyboardHeight(readHeight(event)));
      const hideSub = Keyboard.addListener(hideEvent, () => setKeyboardHeight(0));
      return () => {
        showSub.remove();
        hideSub.remove();
        setKeyboardHeight(0);
      };
    }, [keyboard])
  );

  let body;
  if (scroll) {
    body = (
      <ScrollView
        ref={scrollRef}
        style={styles.flex}
        contentContainerStyle={[
          padded && styles.padded,
          styles.scrollContent,
          Platform.OS === 'android' && keyboard && keyboardHeight > 0 && { paddingBottom: keyboardHeight + spacing.lg },
          contentStyle,
        ]}
        keyboardShouldPersistTaps={keyboardShouldPersistTaps}
        keyboardDismissMode={keyboardDismissMode}
        automaticallyAdjustKeyboardInsets={Platform.OS === 'ios' && keyboard}
        nestedScrollEnabled
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={16}
        onScroll={onScroll}
        refreshControl={refreshControl}
      >
        {children}
      </ScrollView>
    );
  } else {
    body = <View style={[styles.flex, padded && styles.padded, contentStyle]}>{children}</View>;
  }

  if (keyboard) {
    body = (
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={insets.top}
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
