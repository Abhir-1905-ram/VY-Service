import React, { useRef, useState, useCallback } from 'react';
import { View, Text, TextInput, StyleSheet, Platform } from 'react-native';
import { colors, radii, typography, spacing } from '../ui/Theme';
import Icon from './Icon';

/**
 * Labelled text field with optional leading icon, trailing adornment,
 * helper and error text. Focus state highlights the border.
 */
const AppInput = React.forwardRef(function AppInput(
  {
    label,
    required = false,
    icon,
    right,
    error,
    helper,
    style,
    inputStyle,
    multiline = false,
    editable = true,
    onFocus,
    onBlur,
    ...props
  },
  ref
) {
  const innerRef = useRef(null);
  const [focused, setFocused] = useState(false);
  const borderColor = error ? colors.danger : focused ? colors.primary : colors.border;

  const setRefs = useCallback(
    node => {
      innerRef.current = node;
      if (typeof ref === 'function') ref(node);
      else if (ref) ref.current = node;
    },
    [ref]
  );

  const focusInput = useCallback(() => {
    if (editable) innerRef.current?.focus();
  }, [editable]);

  return (
    <View style={style}>
      {label ? (
        <Text style={styles.label}>
          {label}
          {required ? <Text style={styles.required}> *</Text> : null}
        </Text>
      ) : null}
      <View
        collapsable={false}
        onTouchEnd={focusInput}
        style={[
          styles.field,
          { borderColor },
          focused && styles.fieldFocused,
          !editable && styles.fieldDisabled,
          multiline && styles.fieldMultiline,
        ]}
      >
        {icon ? (
          <View pointerEvents="none" style={styles.icon}>
            <Icon name={icon} size={18} color={focused ? colors.primary : colors.textMuted} />
          </View>
        ) : null}
        <TextInput
          {...props}
          ref={setRefs}
          style={[styles.input, multiline && styles.inputMultiline, !editable && styles.inputDisabled, inputStyle]}
          placeholderTextColor={colors.textMuted}
          onFocus={e => {
            setFocused(true);
            onFocus?.(e);
          }}
          onBlur={e => {
            setFocused(false);
            onBlur?.(e);
          }}
          multiline={multiline}
          editable={editable}
          textAlignVertical={multiline ? 'top' : 'center'}
          underlineColorAndroid="transparent"
          showSoftInputOnFocus
        />
        {right ? <View style={styles.right}>{right}</View> : null}
      </View>
      {error ? (
        <View style={styles.msgRow}>
          <Icon name="alert-circle" size={14} color={colors.danger} />
          <Text style={styles.error}>{error}</Text>
        </View>
      ) : helper ? (
        <Text style={styles.helper}>{helper}</Text>
      ) : null}
    </View>
  );
});

export default AppInput;

const styles = StyleSheet.create({
  label: { ...typography.label, marginBottom: 6 },
  required: { color: colors.danger },
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    height: 50,
  },
  fieldFocused: { shadowColor: colors.primary, shadowOpacity: 0.12, shadowRadius: 8, shadowOffset: { width: 0, height: 2 } },
  fieldDisabled: { backgroundColor: colors.surfaceMuted },
  fieldMultiline: { height: undefined, minHeight: 110, alignItems: 'flex-start', paddingVertical: spacing.sm },
  icon: { marginRight: spacing.sm },
  input: {
    flex: 1,
    minWidth: 0,
    height: Platform.OS === 'android' ? 48 : 50,
    paddingVertical: 0,
    margin: 0,
    fontSize: 15,
    color: colors.text,
    ...(Platform.OS === 'android' ? { textAlignVertical: 'center' } : null),
  },
  inputMultiline: { height: undefined, minHeight: 110, paddingTop: 4, textAlignVertical: 'top' },
  inputDisabled: { color: colors.textSecondary },
  right: { marginLeft: spacing.sm },
  msgRow: { flexDirection: 'row', alignItems: 'center', marginTop: 6, gap: 4 },
  error: { color: colors.danger, fontSize: 12, fontWeight: '600' },
  helper: { color: colors.textMuted, fontSize: 12, marginTop: 6 },
});
