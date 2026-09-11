import React from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity, KeyboardAvoidingView, Platform, TouchableWithoutFeedback } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, radii, spacing, typography, hitSlop } from '../ui/Theme';
import Icon from './Icon';

/**
 * Dialog wrapper. `variant="center"` renders a centered card,
 * `variant="sheet"` renders a bottom sheet. `footer` sits below the body.
 */
export default function AppModal({
  visible,
  onClose,
  title,
  subtitle,
  children,
  footer,
  variant = 'center',
  dismissable = true,
  bodyStyle,
  sheetHeight,
}) {
  const insets = useSafeAreaInsets();
  const isSheet = variant === 'sheet';
  return (
    <Modal visible={visible} transparent animationType={isSheet ? 'slide' : 'fade'} onRequestClose={dismissable ? onClose : undefined}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={[styles.backdrop, isSheet ? styles.backdropSheet : styles.backdropCenter]}>
          <TouchableWithoutFeedback onPress={dismissable ? onClose : undefined}>
            <View style={StyleSheet.absoluteFill} />
          </TouchableWithoutFeedback>
          <View
            style={[
              styles.card,
              isSheet ? [styles.sheet, { paddingBottom: Math.max(insets.bottom, spacing.lg) }, sheetHeight && { height: sheetHeight }] : styles.center,
            ]}
          >
            {isSheet ? <View style={styles.grabber} /> : null}
            {(title || onClose) && (
              <View style={styles.header}>
                <View style={styles.headerText}>
                  {!!title && <Text style={styles.title}>{title}</Text>}
                  {!!subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
                </View>
                {onClose && dismissable ? (
                  <TouchableOpacity onPress={onClose} style={styles.closeBtn} hitSlop={hitSlop} accessibilityLabel="Close">
                    <Icon name="close" size={18} color={colors.textSecondary} />
                  </TouchableOpacity>
                ) : null}
              </View>
            )}
            <View style={[styles.body, isSheet && sheetHeight && styles.flex, bodyStyle]}>{children}</View>
            {footer ? <View style={styles.footer}>{footer}</View> : null}
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  backdrop: { flex: 1, backgroundColor: colors.overlay },
  backdropCenter: { justifyContent: 'center', padding: spacing.xl },
  backdropSheet: { justifyContent: 'flex-end' },
  card: { backgroundColor: colors.surface },
  center: { borderRadius: radii.xl, padding: spacing.xl },
  sheet: {
    borderTopLeftRadius: radii.xl,
    borderTopRightRadius: radii.xl,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.sm,
    maxHeight: '90%',
  },
  grabber: { alignSelf: 'center', width: 40, height: 4, borderRadius: 2, backgroundColor: colors.border, marginBottom: spacing.md },
  header: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: spacing.md },
  headerText: { flex: 1, paddingRight: spacing.md },
  title: { ...typography.h2 },
  subtitle: { ...typography.small, marginTop: 4 },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.neutralSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: {},
  footer: { flexDirection: 'row', justifyContent: 'flex-end', gap: spacing.sm, marginTop: spacing.lg },
});
