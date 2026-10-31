import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  Alert,
  Platform,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as Contacts from 'expo-contacts';
import { saveRepair, getRepairs, getRepairById } from '../services/api';
import { getCurrentDateTime, parseDateTime, formatDate, formatTime } from '../utils/dateTime';
import { colors, spacing, radii, typography } from '../ui/Theme';
import Screen from '../components/Screen';
import AppHeader from '../components/AppHeader';
import AppInput from '../components/AppInput';
import AppButton from '../components/AppButton';
import AppModal from '../components/AppModal';
import FormSection from '../components/FormSection';
import ChoiceChips from '../components/ChoiceChips';
import PhoneNumbersField from '../components/PhoneNumbersField';
import ContactPickerModal from '../components/ContactPickerModal';
import StatusBadge from '../components/StatusBadge';
import EmptyState from '../components/EmptyState';
import Icon from '../components/Icon';

const EMPTY_FORM = {
  uniqueId: '',
  customerName: '',
  phoneNumbers: [''],
  type: '',
  brand: '',
  adapterGiven: null,
  problem: '',
  expectedAmount: '',
};

export default function RepairAndService({ navigation, createdBy }) {
  const [formData, setFormData] = useState({
    date: '',
    time: '',
    ...EMPTY_FORM,
  });
  const [searchId, setSearchId] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [repairHistory, setRepairHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const [localRepairs, setLocalRepairs] = useState([]); // temporary local storage for IDs
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showContactsModal, setShowContactsModal] = useState(false);
  const [contacts, setContacts] = useState([]);
  const [loadingContacts, setLoadingContacts] = useState(false);

  // Show previous problems for the current Unique ID (beside Check ID)
  const getDetailsForCurrentId = async () => {
    const id = String(formData.uniqueId || '').trim();
    if (!id) {
      Alert.alert('Error', 'Please enter an ID first');
      return;
    }
    try {
      setIsSearching(true);
      const response = await getRepairById(id);
      if (response.success && response.data) {
        const history = response.history || [response.data];
        const filteredHistory = (history || []).filter(h => String(h?.problem || '').trim().length > 0);
        setRepairHistory(filteredHistory);
        if (filteredHistory.length > 0) {
          setShowHistory(true);
        } else {
          Alert.alert('No Repair', 'No repair exists for this ID.');
        }
      } else {
        Alert.alert('No Repair', 'No repair exists for this ID.');
      }
    } catch (error) {
      console.error('Get details error:', error);
      Alert.alert('Error', error.message || 'Failed to fetch details');
    } finally {
      setIsSearching(false);
    }
  };

  useEffect(() => {
    // Auto-fill current date and time
    const { date, time } = getCurrentDateTime();
    setFormData(prev => ({
      ...prev,
      date,
      time,
    }));
    // Only generate new ID when component first loads (for new entry)
    generateNewId();
    // Initial data load
    loadData();
  }, []);

  // Load latest data and update local state used by this screen
  const loadData = async () => {
    if (refreshing) return; // Prevent multiple simultaneous refreshes
    try {
      setRefreshing(true);
      const response = await getRepairs();
      if (response.success) {
        const repairs = response.data || [];
        setLocalRepairs(repairs);
      } else {
        setLocalRepairs([]);
      }
    } catch (error) {
      console.error('Error loading data:', error);
      setLocalRepairs([]);
    } finally {
      setRefreshing(false);
    }
  };

  // Handle refresh action
  const handleRefresh = async () => {
    // Clear form fields
    const { date, time } = getCurrentDateTime();
    // Generate new ID after refresh
    try {
      const response = await getRepairs();
      if (response.success) {
        const repairs = response.data || [];
        const nextId = repairs.length > 0
          ? Math.max(...repairs.map(r => parseInt(r.uniqueId) || 0)) + 1
          : 1;
        setFormData({ date, time, ...EMPTY_FORM, uniqueId: String(nextId) });
      } else {
        setFormData({ date, time, ...EMPTY_FORM, uniqueId: '1' });
      }
    } catch (error) {
      setFormData({ date, time, ...EMPTY_FORM, uniqueId: '1' });
    }
    // Clear search ID
    setSearchId('');
    setRepairHistory([]);
    setShowHistory(false);
    // Load data
    await loadData();
  };

  // Generate new ID - ONLY call this for new entries
  const generateNewId = async () => {
    try {
      const response = await getRepairs();
      if (response.success) {
        const repairs = response.data || [];
        const nextId = repairs.length > 0
          ? Math.max(...repairs.map(r => parseInt(r.uniqueId) || 0)) + 1
          : 1;
        setFormData(prev => ({ ...prev, uniqueId: String(nextId) }));
      } else {
        // If backend not available, start with 1
        setFormData(prev => ({ ...prev, uniqueId: '1' }));
      }
    } catch (error) {
      // If backend not available, start with 1
      setFormData(prev => ({ ...prev, uniqueId: '1' }));
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Add a new phone number input
  const addPhoneNumber = () => {
    setFormData(prev => ({
      ...prev,
      phoneNumbers: [...prev.phoneNumbers, ''],
    }));
  };

  // Remove a phone number input by index
  const removePhoneNumber = (index) => {
    if (formData.phoneNumbers.length <= 1) {
      Alert.alert('Error', 'At least one phone number is required');
      return;
    }
    setFormData(prev => ({
      ...prev,
      phoneNumbers: prev.phoneNumbers.filter((_, i) => i !== index),
    }));
  };

  // Update a specific phone number by index
  const updatePhoneNumber = (index, value) => {
    const digitsOnly = value.replace(/[^0-9]/g, '').slice(0, 10);
    setFormData(prev => {
      const newPhoneNumbers = [...prev.phoneNumbers];
      newPhoneNumbers[index] = digitsOnly;
      return { ...prev, phoneNumbers: newPhoneNumbers };
    });
  };

  // Request contacts permission and load contacts
  const loadContacts = async () => {
    try {
      setLoadingContacts(true);

      // Check existing permissions first
      const existingPermission = await Contacts.getPermissionsAsync();

      // Request permissions if not granted
      let permissionStatus = existingPermission.status;
      if (existingPermission.status !== 'granted') {
        const permissionResult = await Contacts.requestPermissionsAsync();
        permissionStatus = permissionResult.status;
      }

      if (permissionStatus !== 'granted') {
        Alert.alert(
          'Permission Denied',
          'Contacts permission is required to select phone numbers from your contacts. Please grant permission in your device settings.',
          [{ text: 'OK' }]
        );
        setLoadingContacts(false);
        return;
      }

      const contactsResult = await Contacts.getContactsAsync({
        fields: [Contacts.Fields.Name, Contacts.Fields.PhoneNumbers],
      });

      const data = contactsResult.data || [];

      if (!data || data.length === 0) {
        setShowContactsModal(true); // Show modal with empty state
        setContacts([]);
        setLoadingContacts(false);
        return;
      }

      // Filter contacts that have phone numbers and format them
      const contactsWithPhones = data
        .filter(contact => contact.phoneNumbers && Array.isArray(contact.phoneNumbers) && contact.phoneNumbers.length > 0)
        .map(contact => {
          const phoneNumbers = (contact.phoneNumbers || [])
            .filter(phone => phone && phone.number && phone.number.trim().length > 0)
            .map(phone => ({
              number: (phone.number || '').replace(/[^0-9]/g, ''),
              label: phone.label || 'mobile',
            }));

          return {
            id: contact.id || `contact_${contact.name}_${Math.random()}`,
            name: contact.name || 'Unknown',
            phoneNumbers: phoneNumbers,
          };
        })
        .filter(contact => contact.phoneNumbers && contact.phoneNumbers.length > 0); // Only keep contacts with valid phone numbers

      setContacts(contactsWithPhones);
      setShowContactsModal(true);
    } catch (error) {
      console.error('Error loading contacts:', error);
      Alert.alert(
        'Error',
        `Failed to load contacts: ${error.message || 'Unknown error'}. Please check console for details.`,
        [{ text: 'OK' }]
      );
    } finally {
      setLoadingContacts(false);
    }
  };

  // Select a contact and fill phone number (and optionally name)
  const selectContact = (contact, phoneNumber) => {
    // Extract digits from phone number (remove spaces, dashes, etc.)
    const digitsOnly = (phoneNumber || '').replace(/[^0-9]/g, '');

    if (!digitsOnly || digitsOnly.length === 0) {
      Alert.alert('Invalid Number', 'This contact does not have a valid phone number.');
      return;
    }

    let phone = digitsOnly;

    // If number is longer than 10 digits, take last 10 (assuming country code)
    if (phone.length > 10) {
      phone = phone.slice(-10);
    }
    // Allow numbers less than 10 digits (will show validation error in form)

    setFormData(prev => ({
      ...prev,
      phoneNumbers: [phone],
      customerName: prev.customerName || contact.name, // Only fill name if empty
    }));
    setShowContactsModal(false);
  };

  // Check if ID exists; if yes, auto-fill customer name and phone
  const checkIdAvailability = async () => {
    const idValue = String(formData.uniqueId || '').trim();
    if (!idValue) {
      Alert.alert('Error', 'Please enter an ID to check');
      return;
    }
    // First check locally loaded repairs
    const localMatch = localRepairs.find(r => String(r.uniqueId) === idValue);
    if (localMatch) {
      setFormData(prev => ({
        ...prev,
        customerName: String(localMatch.customerName || ''),
        phoneNumbers: localMatch.phoneNumber ? localMatch.phoneNumber.split(',').map(p => p.trim()) : [''],
        type: String(localMatch.type || ''),
        brand: String(localMatch.brand || ''),
      }));
      Alert.alert('Already Exists', `This ID belongs to ${localMatch.customerName || 'Unknown'}.`);
      return;
    }
    // Fallback to backend lookup
    try {
      const response = await getRepairById(idValue);
      if (response.success && response.data) {
        const repair = response.data;
        setFormData(prev => ({
          ...prev,
          customerName: String(repair.customerName || ''),
          phoneNumbers: repair.phoneNumber ? repair.phoneNumber.split(',').map(p => p.trim()) : [''],
          type: String(repair.type || ''),
          brand: String(repair.brand || ''),
        }));
        Alert.alert('Already Exists', `This ID belongs to ${repair.customerName || 'Unknown'}.`);
      } else {
        // Clear previous customer details if ID is free
        setFormData(prev => ({
          ...prev,
          customerName: '',
          phoneNumbers: [''],
          type: '',
          brand: '',
        }));
        Alert.alert('ID is free', 'You can use this ID.');
      }
    } catch (error) {
      Alert.alert('Error', error.message || 'Failed to verify ID');
    }
  };

  const handleSave = async () => {
    // Validation
    if (!formData.customerName.trim()) {
      Alert.alert('Error', 'Please enter customer name');
      return;
    }
    // Validate phone numbers - at least one required
    const validPhoneNumbers = formData.phoneNumbers.filter(phone => phone.trim().length > 0);
    if (validPhoneNumbers.length === 0) {
      Alert.alert('Error', 'Please enter at least one phone number');
      return;
    }
    // Validate each phone number - exactly 10 digits
    const phoneRegex = /^\d{10}$/;
    for (let phone of validPhoneNumbers) {
      if (!phoneRegex.test(phone.trim())) {
        Alert.alert('Error', 'All phone numbers must be exactly 10 digits');
        return;
      }
    }
    if (!formData.type.trim()) {
      Alert.alert('Error', 'Please enter device type');
      return;
    }
    if (!formData.brand.trim()) {
      Alert.alert('Error', 'Please enter brand name');
      return;
    }
    if (formData.adapterGiven === null) {
      Alert.alert('Error', 'Please select adapter status');
      return;
    }
    if (!formData.problem.trim()) {
      Alert.alert('Error', 'Please enter problem description');
      return;
    }

    setSaving(true);
    try {
      // Parse date and time to create proper Date object
      const dateTimeString = `${formData.date} ${formData.time}`;
      const createdAt = parseDateTime(dateTimeString);

      // Parse expected amount (optional)
      let expectedAmountValue = null;
      const trimmedExpectedAmount = String(formData.expectedAmount || '').trim();
      if (trimmedExpectedAmount) {
        const parsed = parseFloat(trimmedExpectedAmount);
        if (!isNaN(parsed) && parsed > 0) {
          expectedAmountValue = parsed;
        }
      }

      // Join phone numbers with comma (backend stores as single string)
      const phoneNumberString = validPhoneNumbers.join(',');

      const repairData = {
        uniqueId: formData.uniqueId,
        customerName: formData.customerName.trim(),
        phoneNumber: phoneNumberString,
        type: formData.type.trim(),
        brand: formData.brand.trim(),
        adapterGiven: formData.adapterGiven,
        problem: formData.problem.trim(),
        createdAt: createdAt.toISOString(),
        status: 'Pending',
        createdBy: createdBy || '',
        expectedAmount: expectedAmountValue, // null if not provided or invalid
      };

      const response = await saveRepair(repairData);

      if (response.success) {
        // Reload latest data
        await loadData();
        // Clear form fields and prepare next suggested ID
        const { date, time } = getCurrentDateTime();
        const nextIdNumeric = parseInt(formData.uniqueId, 10);
        const nextId = Number.isFinite(nextIdNumeric) ? String(nextIdNumeric + 1) : '';
        setFormData({ date, time, ...EMPTY_FORM, uniqueId: nextId });
        setSearchId('');
        setRepairHistory([]);
        setShowHistory(false);

        // Refresh history after saving new entry
        if (formData.uniqueId) {
          try {
            const historyResponse = await getRepairById(formData.uniqueId);
            if (historyResponse.success) {
              const history = historyResponse.history || [];
              setRepairHistory(history);
            }
          } catch (error) {
            console.log('Could not refresh history:', error);
          }
        }
        // Save to temporary local storage and prepare next ID
        setLocalRepairs(prev => [
          ...prev,
          {
            uniqueId: formData.uniqueId,
            customerName: formData.customerName.trim(),
            phoneNumber: validPhoneNumbers.join(','),
            type: formData.type.trim(),
            brand: formData.brand.trim(),
            adapterGiven: formData.adapterGiven,
            problem: formData.problem.trim(),
            createdAt: createdAt.toISOString(),
            status: 'Pending',
          },
        ]);
        Alert.alert('Success', 'Repair entry saved successfully!');
      } else {
        // Show detailed error message
        const errorMessage = response.error && response.error.includes('unique index')
          ? `${response.message}\n\nThe unique index has been removed. Please try saving again.`
          : response.message || 'Failed to save repair entry';
        Alert.alert('Error', errorMessage);
      }
    } catch (error) {
      Alert.alert('Error', error.message || 'Failed to save repair entry');
    } finally {
      setSaving(false);
    }
  };

  const pickerValue = parseDateTime(`${formData.date} ${formData.time}`);

  return (
    <Screen
      scroll
      keyboard
      header={
        <AppHeader
          large
          subtitle="Repair & Service"
          title="New Repair Entry"
          onBackPress={() => navigation?.goBack()}
          rightAction={{ icon: 'refresh-outline', onPress: handleRefresh, label: 'Reset form' }}
        />
      }
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={handleRefresh}
          colors={[colors.primary]}
          tintColor={colors.primary}
        />
      }
    >
      {/* Unique ID */}
      <FormSection icon="pricetag-outline" title="Entry ID" subtitle="Auto-generated. Change it to reuse an existing customer ID.">
        <AppInput
          icon="barcode-outline"
          value={formData.uniqueId}
          onChangeText={(value) => handleInputChange('uniqueId', value.replace(/[^0-9]/g, ''))}
          placeholder="Enter ID"
          keyboardType="numeric"
          returnKeyType="done"
          style={styles.field}
        />
        <View style={styles.inlineRow}>
          <AppButton title="Check ID" icon="search-outline" variant="outline" size="sm" onPress={checkIdAvailability} style={styles.half} />
          <AppButton
            title={isSearching ? 'Getting...' : 'Get Details'}
            icon="time-outline"
            variant="secondary"
            size="sm"
            onPress={getDetailsForCurrentId}
            loading={isSearching}
            style={styles.half}
          />
        </View>
      </FormSection>

      {/* Date and Time (current by default, editable via pickers) */}
      <FormSection icon="calendar-outline" title="Date & time" subtitle="Defaults to now">
        <View style={styles.inlineRow}>
          <TouchableOpacity style={[styles.pickerField, styles.half]} onPress={() => setShowDatePicker(true)} activeOpacity={0.8}>
            <Icon name="calendar-clear-outline" size={18} color={colors.primary} />
            <View style={styles.pickerText}>
              <Text style={styles.pickerLabel}>Date</Text>
              <Text style={styles.pickerValue}>{formData.date || 'dd/mm/yy'}</Text>
            </View>
            <Icon name="create-outline" size={16} color={colors.textMuted} />
          </TouchableOpacity>
          <TouchableOpacity style={[styles.pickerField, styles.half]} onPress={() => setShowTimePicker(true)} activeOpacity={0.8}>
            <Icon name="time-outline" size={18} color={colors.primary} />
            <View style={styles.pickerText}>
              <Text style={styles.pickerLabel}>Time</Text>
              <Text style={styles.pickerValue}>{formData.time || 'HH:MM AM/PM'}</Text>
            </View>
            <Icon name="create-outline" size={16} color={colors.textMuted} />
          </TouchableOpacity>
        </View>
        {showDatePicker && (
          <DateTimePicker
            value={pickerValue}
            mode="date"
            display={Platform.OS === 'ios' ? 'inline' : 'default'}
            onChange={(e, d) => {
              if (Platform.OS === 'android') setShowDatePicker(false);
              if (!d) return;
              const prev = parseDateTime(`${formData.date} ${formData.time}`);
              const updated = new Date(d.getFullYear(), d.getMonth(), d.getDate(), prev.getHours(), prev.getMinutes());
              setFormData(p => ({ ...p, date: formatDate(updated), time: formatTime(updated) }));
            }}
          />
        )}
        {showTimePicker && (
          <DateTimePicker
            value={pickerValue}
            mode="time"
            is24Hour={false}
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={(e, t) => {
              if (Platform.OS === 'android') setShowTimePicker(false);
              if (!t) return;
              const prev = parseDateTime(`${formData.date} ${formData.time}`);
              const updated = new Date(prev.getFullYear(), prev.getMonth(), prev.getDate(), t.getHours(), t.getMinutes());
              setFormData(p => ({ ...p, date: formatDate(updated), time: formatTime(updated) }));
            }}
          />
        )}
        {Platform.OS === 'ios' && (showDatePicker || showTimePicker) ? (
          <AppButton
            title="Done"
            size="sm"
            variant="secondary"
            fullWidth={false}
            onPress={() => { setShowDatePicker(false); setShowTimePicker(false); }}
            style={styles.doneBtn}
          />
        ) : null}
      </FormSection>

      {/* Customer */}
      <FormSection icon="person-outline" title="Customer">
        <AppInput
          label="Customer Name"
          required
          icon="person-outline"
          value={formData.customerName}
          onChangeText={(value) => handleInputChange('customerName', value)}
          placeholder="Enter customer name"
          style={styles.field}
        />
        <PhoneNumbersField
          phoneNumbers={formData.phoneNumbers}
          onChangeNumber={updatePhoneNumber}
          onAdd={addPhoneNumber}
          onRemove={removePhoneNumber}
          onPickContact={loadContacts}
          loadingContacts={loadingContacts}
        />
      </FormSection>

      {/* Device */}
      <FormSection icon="laptop-outline" title="Device">
        <AppInput
          label="Device Type"
          required
          icon="hardware-chip-outline"
          value={formData.type}
          onChangeText={(value) => handleInputChange('type', value)}
          placeholder="e.g. Laptop, Desktop, Printer"
          style={styles.field}
        />
        <AppInput
          label="Brand Name"
          required
          icon="pricetags-outline"
          value={formData.brand}
          onChangeText={(value) => handleInputChange('brand', value)}
          placeholder="Enter brand name"
          style={styles.field}
        />
        <Text style={styles.label}>
          Adapter<Text style={styles.required}> *</Text>
        </Text>
        <ChoiceChips
          value={formData.adapterGiven}
          onChange={(v) => handleInputChange('adapterGiven', v)}
          options={[
            { value: true, label: 'Given', icon: 'flash-outline' },
            { value: false, label: 'Not Given', icon: 'flash-off-outline' },
          ]}
        />
      </FormSection>

      {/* Problem */}
      <FormSection icon="build-outline" title="Problem">
        <AppInput
          label="Problem Description"
          required
          value={formData.problem}
          onChangeText={(value) => handleInputChange('problem', value)}
          placeholder="Describe the problem in detail"
          multiline
          numberOfLines={4}
          style={styles.field}
        />
        <AppInput
          label="Expected Amount"
          helper="Optional"
          icon="cash-outline"
          value={formData.expectedAmount}
          onChangeText={(value) => {
            // Only allow numbers and decimal point
            const numericValue = value.replace(/[^0-9.]/g, '');
            handleInputChange('expectedAmount', numericValue);
          }}
          placeholder="e.g. 500"
          keyboardType="numeric"
        />
      </FormSection>

      <AppButton
        title="Save Entry"
        icon="save-outline"
        size="lg"
        onPress={handleSave}
        loading={saving}
        style={styles.save}
      />

      {/* History Modal */}
      <AppModal
        visible={showHistory}
        onClose={() => setShowHistory(false)}
        variant="sheet"
        sheetHeight="80%"
        title="Previous problems"
        subtitle={`ID ${formData.uniqueId}${formData.customerName ? ` · ${formData.customerName}` : ''}`}
      >
        <View style={styles.historyCount}>
          <Icon name="layers-outline" size={14} color={colors.primary} />
          <Text style={styles.historyCountText}>{repairHistory.length} record{repairHistory.length === 1 ? '' : 's'}</Text>
        </View>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.historyList}>
          {repairHistory.length === 0 ? (
            <EmptyState icon="document-text-outline" tone="neutral" title="No previous problems found" />
          ) : (
            repairHistory.map((repair, index) => (
              <View key={repair._id || index} style={styles.historyItem}>
                <View style={styles.historyHeader}>
                  <View style={styles.historyNumber}>
                    <Text style={styles.historyNumberText}>#{repairHistory.length - index}</Text>
                  </View>
                  <Text style={styles.historyDate}>
                    {formatDate(repair.createdAt)} · {formatTime(repair.createdAt)}
                  </Text>
                  <StatusBadge status={repair.status || 'Pending'} size="sm" />
                </View>
                <HistoryLine label="Type" value={repair.type || 'N/A'} />
                <HistoryLine label="Brand" value={repair.brand || 'N/A'} />
                <HistoryLine label="Problem" value={repair.problem || 'No problem description'} />
                <HistoryLine label="Have Done" value={repair.remark || 'No description'} muted />
                {repair.deliveredAt && (
                  <View style={styles.deliveredRow}>
                    <Icon name="checkmark-done-outline" size={14} color={colors.success} />
                    <Text style={styles.deliveredText}>
                      Delivered {formatDate(repair.deliveredAt)} {formatTime(repair.deliveredAt)}
                    </Text>
                  </View>
                )}
              </View>
            ))
          )}
        </ScrollView>
      </AppModal>

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

function HistoryLine({ label, value, muted }) {
  return (
    <View style={styles.historyLine}>
      <Text style={styles.historyLabel}>{label}</Text>
      <Text style={[styles.historyValue, muted && styles.historyValueMuted]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  field: { marginBottom: spacing.lg },
  inlineRow: { flexDirection: 'row', gap: spacing.sm },
  half: { flex: 1 },
  label: { ...typography.label, marginBottom: 8 },
  required: { color: colors.danger },
  pickerField: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
  },
  pickerText: { flex: 1 },
  pickerLabel: { fontSize: 11, fontWeight: '700', color: colors.textMuted },
  pickerValue: { fontSize: 15, fontWeight: '700', color: colors.text, marginTop: 1 },
  doneBtn: { alignSelf: 'flex-end', marginTop: spacing.sm },
  save: { marginTop: spacing.sm, marginBottom: spacing.lg },

  historyCount: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: spacing.md },
  historyCountText: { color: colors.primary, fontWeight: '800', fontSize: 12 },
  historyList: { paddingBottom: spacing.xl },
  historyItem: {
    backgroundColor: colors.surfaceMuted,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  historyHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.sm },
  historyNumber: { backgroundColor: colors.primarySoft, borderRadius: radii.xs, paddingHorizontal: 8, paddingVertical: 2 },
  historyNumberText: { color: colors.primaryDark, fontWeight: '800', fontSize: 12 },
  historyDate: { flex: 1, fontSize: 12, color: colors.textMuted, fontWeight: '600' },
  historyLine: { flexDirection: 'row', marginTop: 6 },
  historyLabel: { width: 84, fontSize: 13, fontWeight: '700', color: colors.textMuted },
  historyValue: { flex: 1, fontSize: 13, color: colors.text, fontWeight: '600', lineHeight: 19 },
  historyValueMuted: { color: colors.textSecondary, fontStyle: 'italic', fontWeight: '500' },
  deliveredRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: spacing.sm },
  deliveredText: { fontSize: 12, color: colors.success, fontWeight: '700' },
});
