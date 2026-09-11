import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { colors, radii, spacing, typography } from '../ui/Theme';
import AppInput from './AppInput';
import IconButton from './IconButton';
import Icon from './Icon';

/**
 * Repeating 10-digit phone number inputs with "pick from contacts" on the
 * first row, remove buttons when there is more than one, and an add row.
 */
export default function PhoneNumbersField({
  label = 'Phone Number(s)',
  required = true,
  phoneNumbers,
  onChangeNumber,
  onAdd,
  onRemove,
  onPickContact,
  loadingContacts = false,
  style,
}) {
  return (
    <View style={style}>
      <Text style={styles.label}>
        {label}
        {required ? <Text style={styles.required}> *</Text> : null}
      </Text>
      {phoneNumbers.map((phone, index) => (
        <View key={index} style={styles.row}>
          <AppInput
            style={styles.input}
            icon="call-outline"
            value={phone}
            onChangeText={(value) => onChangeNumber(index, value)}
            placeholder="10 digit phone number"
            keyboardType="phone-pad"
            maxLength={10}
            error={phone.length > 0 && phone.length !== 10 ? 'Phone number must be exactly 10 digits' : undefined}
          />
          {index === 0 && onPickContact ? (
            <IconButton
              icon="people-outline"
              onPress={onPickContact}
              loading={loadingContacts}
              size={50}
              style={styles.sideBtn}
              accessibilityLabel="Pick from contacts"
            />
          ) : null}
          {phoneNumbers.length > 1 ? (
            <IconButton
              icon="trash-outline"
              tone="danger"
              onPress={() => onRemove(index)}
              size={50}
              style={styles.sideBtn}
              accessibilityLabel="Remove phone number"
            />
          ) : null}
        </View>
      ))}
      <TouchableOpacity style={styles.addRow} onPress={onAdd} activeOpacity={0.8}>
        <Icon name="add-circle-outline" size={20} color={colors.primary} />
        <Text style={styles.addText}>Add another phone number</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  label: { ...typography.label, marginBottom: 6 },
  required: { color: colors.danger },
  row: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: spacing.sm, gap: spacing.sm },
  input: { flex: 1 },
  sideBtn: { marginTop: 0 },
  addRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: radii.md,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: colors.primaryBorder,
    backgroundColor: colors.primarySoft,
    marginTop: spacing.xs,
  },
  addText: { color: colors.primaryDark, fontWeight: '700', fontSize: 14 },
});
