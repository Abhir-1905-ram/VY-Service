import React, { useState } from 'react';
import { Text, StyleSheet, Alert } from 'react-native';
import * as Contacts from 'expo-contacts';
import Screen from '../../components/Screen';
import AppHeader from '../../components/AppHeader';
import AppInput from '../../components/AppInput';
import AppButton from '../../components/AppButton';
import FormSection from '../../components/FormSection';
import ChoiceChips from '../../components/ChoiceChips';
import PhoneNumbersField from '../../components/PhoneNumbersField';
import ContactPickerModal from '../../components/ContactPickerModal';
import EmptyState from '../../components/EmptyState';
import { colors, spacing, typography } from '../../ui/Theme';
import { updateRepair } from '../../services/api';

export default function RepairEditScreen({ route, navigation }) {
  const { repair } = route.params || {};

  // Parse phone numbers from comma-separated string
  const initialPhoneNumbers = repair?.phoneNumber
    ? repair.phoneNumber.split(',').map(p => p.trim()).filter(p => p.length > 0)
    : [''];

  const [form, setForm] = useState({
    customerName: repair?.customerName || '',
    phoneNumbers: initialPhoneNumbers.length > 0 ? initialPhoneNumbers : [''],
    type: repair?.type || '',
    brand: repair?.brand || '',
    problem: repair?.problem || '',
    adapterGiven: repair?.adapterGiven !== undefined ? repair.adapterGiven : null,
    expectedAmount: repair?.expectedAmount ? String(repair.expectedAmount) : '',
  });
  const [saving, setSaving] = useState(false);
  const [showContactsModal, setShowContactsModal] = useState(false);
  const [contacts, setContacts] = useState([]);
  const [loadingContacts, setLoadingContacts] = useState(false);

  const setField = (k, v) => setForm(prev => ({ ...prev, [k]: v }));

  // Add a new phone number input
  const addPhoneNumber = () => {
    setForm(prev => ({
      ...prev,
      phoneNumbers: [...prev.phoneNumbers, ''],
    }));
  };

  // Remove a phone number input by index
  const removePhoneNumber = (index) => {
    if (form.phoneNumbers.length <= 1) {
      Alert.alert('Error', 'At least one phone number is required');
      return;
    }
    setForm(prev => ({
      ...prev,
      phoneNumbers: prev.phoneNumbers.filter((_, i) => i !== index),
    }));
  };

  // Update a specific phone number by index
  const updatePhoneNumber = (index, value) => {
    const digitsOnly = value.replace(/[^0-9]/g, '').slice(0, 10);
    setForm(prev => {
      const newPhoneNumbers = [...prev.phoneNumbers];
      newPhoneNumbers[index] = digitsOnly;
      return { ...prev, phoneNumbers: newPhoneNumbers };
    });
  };

  // Request contacts permission and load contacts
  const loadContacts = async () => {
    try {
      setLoadingContacts(true);
      const { status } = await Contacts.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Contacts permission is required to select phone numbers from your contacts.');
        setLoadingContacts(false);
        return;
      }

      const { data } = await Contacts.getContactsAsync({
        fields: [Contacts.Fields.Name, Contacts.Fields.PhoneNumbers],
      });

      const contactsWithPhones = data
        .filter(contact => contact.phoneNumbers && contact.phoneNumbers.length > 0)
        .map(contact => ({
          id: contact.id || `contact_${contact.name}_${Math.random()}`,
          name: contact.name || 'Unknown',
          phoneNumbers: (contact.phoneNumbers || [])
            .filter(phone => phone && phone.number)
            .map(phone => ({
              number: (phone.number || '').replace(/[^0-9]/g, ''),
              label: phone.label || 'mobile',
            })),
        }))
        .filter(contact => contact.phoneNumbers.length > 0);

      setContacts(contactsWithPhones);
      setShowContactsModal(true);
    } catch (error) {
      console.error('Error loading contacts:', error);
      Alert.alert('Error', 'Failed to load contacts. Please try again.');
    } finally {
      setLoadingContacts(false);
    }
  };

  // Select a contact and fill phone number
  const selectContact = (contact, phoneNumber) => {
    const digitsOnly = (phoneNumber || '').replace(/[^0-9]/g, '');
    let phone = digitsOnly;
    if (phone.length > 10) {
      phone = phone.slice(-10);
    }

    setForm(prev => ({
      ...prev,
      phoneNumbers: [phone],
      customerName: prev.customerName || contact.name,
    }));
    setShowContactsModal(false);
  };

  const onSave = async () => {
    if (!repair?._id) {
      Alert.alert('Error', 'Missing repair id');
      return;
    }

    // Validation
    if (!form.customerName.trim()) {
      Alert.alert('Error', 'Customer name is required');
      return;
    }

    const validPhoneNumbers = form.phoneNumbers.filter(phone => phone.trim().length > 0);
    if (validPhoneNumbers.length === 0) {
      Alert.alert('Error', 'Please enter at least one phone number');
      return;
    }

    const phoneRegex = /^\d{10}$/;
    for (let phone of validPhoneNumbers) {
      if (!phoneRegex.test(phone.trim())) {
        Alert.alert('Error', 'All phone numbers must be exactly 10 digits');
        return;
      }
    }

    if (!form.type.trim()) {
      Alert.alert('Error', 'Device type is required');
      return;
    }

    if (!form.brand.trim()) {
      Alert.alert('Error', 'Brand name is required');
      return;
    }

    if (form.adapterGiven === null) {
      Alert.alert('Error', 'Please select adapter status');
      return;
    }

    if (!form.problem.trim()) {
      Alert.alert('Error', 'Problem description is required');
      return;
    }

    // Parse expected amount
    let expectedAmountValue = null;
    const trimmedExpectedAmount = String(form.expectedAmount || '').trim();
    if (trimmedExpectedAmount) {
      const parsed = parseFloat(trimmedExpectedAmount);
      if (!isNaN(parsed) && parsed > 0) {
        expectedAmountValue = parsed;
      }
    }

    setSaving(true);
    try {
      const phoneNumberString = validPhoneNumbers.join(',');
      const updatePayload = {
        customerName: form.customerName.trim(),
        phoneNumber: phoneNumberString,
        type: form.type.trim(),
        brand: form.brand.trim(),
        problem: form.problem.trim(),
        adapterGiven: form.adapterGiven,
        expectedAmount: expectedAmountValue,
      };

      const res = await updateRepair(repair._id, updatePayload);

      if (res.success && res.data) {
        Alert.alert('Saved', 'Repair updated successfully', [
          {
            text: 'OK',
            onPress: () => {
              // Navigate back - useFocusEffect will refresh the list
              navigation.goBack();
            }
          }
        ]);
      } else {
        console.error('Update failed:', res.message);
        Alert.alert('Error', res.message || 'Failed to update repair');
      }
    } catch (e) {
      console.error('Update error:', e);
      Alert.alert('Error', e.message || 'Failed to update repair');
    } finally {
      setSaving(false);
    }
  };

  if (!repair) {
    return (
      <Screen header={<AppHeader title="Edit Repair" onBackPress={() => navigation.goBack()} />}>
        <EmptyState icon="construct-outline" tone="neutral" title="No repair" subtitle="This repair could not be found." />
      </Screen>
    );
  }

  return (
    <Screen
      scroll
      keyboard
      header={
        <AppHeader
          large
          subtitle={`Repair ID ${repair?.uniqueId || ''}`}
          title="Edit Repair"
          onBackPress={() => navigation.goBack()}
        />
      }
    >
      <FormSection icon="person-outline" title="Customer">
        <AppInput
          label="Customer Name"
          required
          icon="person-outline"
          value={form.customerName}
          onChangeText={t => setField('customerName', t)}
          placeholder="Enter customer name"
          style={styles.field}
        />
        <PhoneNumbersField
          phoneNumbers={form.phoneNumbers}
          onChangeNumber={updatePhoneNumber}
          onAdd={addPhoneNumber}
          onRemove={removePhoneNumber}
          onPickContact={loadContacts}
          loadingContacts={loadingContacts}
        />
      </FormSection>

      <FormSection icon="laptop-outline" title="Device">
        <AppInput
          label="Device Type"
          required
          icon="hardware-chip-outline"
          value={form.type}
          onChangeText={t => setField('type', t)}
          placeholder="Enter device type"
          style={styles.field}
        />
        <AppInput
          label="Brand Name"
          required
          icon="pricetags-outline"
          value={form.brand}
          onChangeText={t => setField('brand', t)}
          placeholder="Enter brand name"
          style={styles.field}
        />
        <Text style={styles.label}>
          Adapter<Text style={styles.required}> *</Text>
        </Text>
        <ChoiceChips
          value={form.adapterGiven}
          onChange={(v) => setField('adapterGiven', v)}
          options={[
            { value: true, label: 'Given', icon: 'flash-outline' },
            { value: false, label: 'Not Given', icon: 'flash-off-outline' },
          ]}
        />
      </FormSection>

      <FormSection icon="build-outline" title="Problem">
        <AppInput
          label="Problem Description"
          required
          value={form.problem}
          onChangeText={t => setField('problem', t)}
          multiline
          numberOfLines={4}
          placeholder="Describe the problem in detail"
          style={styles.field}
        />
        <AppInput
          label="Expected Amount"
          helper="Optional"
          icon="cash-outline"
          value={form.expectedAmount}
          onChangeText={(value) => {
            const numericValue = value.replace(/[^0-9.]/g, '');
            setField('expectedAmount', numericValue);
          }}
          placeholder="e.g. 500"
          keyboardType="numeric"
        />
      </FormSection>

      <AppButton title="Save Changes" icon="save-outline" size="lg" onPress={onSave} loading={saving} style={styles.save} />

      {/* Contacts Modal */}
      <ContactPickerModal
        visible={showContactsModal}
        onClose={() => setShowContactsModal(false)}
        contacts={contacts}
        loading={loadingContacts}
        onSelect={selectContact}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  field: { marginBottom: spacing.lg },
  label: { ...typography.label, marginBottom: 8 },
  required: { color: colors.danger },
  save: { marginTop: spacing.sm, marginBottom: spacing.lg },
});
