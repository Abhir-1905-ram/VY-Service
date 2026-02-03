import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TextInput, TouchableOpacity, Switch, Alert, ScrollView, ActivityIndicator, Modal, FlatList } from 'react-native';
import AppHeader from '../../components/AppHeader';
import Icon from '../../components/Icon';
import { colors, spacing } from '../../utils/theme';
import { updateRepair } from '../../services/api';
import * as Contacts from 'expo-contacts';

// Text color constants (matching RepairAndService)
const textPrimary = '#2C3E50';
const textSecondary = colors.textSecondary || '#7F8C8D';

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
  const [contactsSearchQuery, setContactsSearchQuery] = useState('');

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
      
      console.log('📤 Sending update request for repair:', repair._id);
      console.log('📤 Update payload:', JSON.stringify(updatePayload, null, 2));
      
      const res = await updateRepair(repair._id, updatePayload);
      
      console.log('📥 Update response:', JSON.stringify(res, null, 2));
      
      if (res.success && res.data) {
        console.log('✅ Update successful, updated data:', JSON.stringify(res.data, null, 2));
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
        console.error('❌ Update failed:', res.message);
        Alert.alert('Error', res.message || 'Failed to update repair');
      }
    } catch (e) {
      console.error('❌ Update error:', e);
      Alert.alert('Error', e.message || 'Failed to update repair');
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={{ marginHorizontal: -20, marginTop: -20 }}>
        <AppHeader title={`Edit Repair: ${repair?.uniqueId || ''}`} showBrand={false} onBackPress={() => navigation.goBack()} />
      </View>
      <ScrollView 
        contentContainerStyle={{ paddingVertical: 10 }}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.formGroup}>
          <Text style={styles.label}>Customer Name *</Text>
          <TextInput 
            style={styles.input} 
            value={form.customerName} 
            onChangeText={t => setField('customerName', t)} 
            placeholder="Enter customer name" 
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Phone Number(s) *</Text>
          {form.phoneNumbers.map((phone, index) => (
            <View key={index} style={styles.phoneInputWrapper}>
              <View style={styles.phoneInputContainer}>
                <TextInput
                  style={[styles.input, styles.phoneInput]}
                  value={phone}
                  onChangeText={(value) => updatePhoneNumber(index, value)}
                  placeholder="Enter 10 digit phone number"
                  keyboardType="phone-pad"
                  maxLength={10}
                />
                {index === 0 && (
                  <TouchableOpacity
                    style={styles.contactButton}
                    onPress={loadContacts}
                    disabled={loadingContacts}
                  >
                    {loadingContacts ? (
                      <ActivityIndicator size="small" color={colors.primary} />
                    ) : (
                      <Icon name="person-outline" size={24} color={colors.primary} />
                    )}
                  </TouchableOpacity>
                )}
                {form.phoneNumbers.length > 1 && (
                  <TouchableOpacity
                    style={styles.removePhoneButton}
                    onPress={() => removePhoneNumber(index)}
                  >
                    <Icon name="close-circle" size={24} color="#E74C3C" />
                  </TouchableOpacity>
                )}
              </View>
              {phone.length > 0 && phone.length !== 10 && (
                <Text style={styles.errorText}>Phone number must be exactly 10 digits</Text>
              )}
            </View>
          ))}
          <TouchableOpacity
            style={styles.addPhoneButton}
            onPress={addPhoneNumber}
          >
            <Icon name="add-circle-outline" size={24} color={colors.primary} />
            <Text style={styles.addPhoneButtonText}>Add Another Phone Number</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Device Type *</Text>
          <TextInput 
            style={styles.input} 
            value={form.type} 
            onChangeText={t => setField('type', t)} 
            placeholder="Enter device type" 
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Brand Name *</Text>
          <TextInput 
            style={styles.input} 
            value={form.brand} 
            onChangeText={t => setField('brand', t)} 
            placeholder="Enter brand name" 
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Adapter *</Text>
          <View style={styles.adapterGroup}>
            <TouchableOpacity
              style={[
                styles.adapterOption,
                form.adapterGiven === true && styles.adapterOptionSelected
              ]}
              onPress={() => setField('adapterGiven', true)}
            >
              <Text
                style={[
                  styles.adapterOptionText,
                  form.adapterGiven === true && styles.adapterOptionTextSelected
                ]}
              >
                Given
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.adapterOption,
                form.adapterGiven === false && styles.adapterOptionSelected
              ]}
              onPress={() => setField('adapterGiven', false)}
            >
              <Text
                style={[
                  styles.adapterOptionText,
                  form.adapterGiven === false && styles.adapterOptionTextSelected
                ]}
              >
                Not Given
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Problem Description *</Text>
          <TextInput 
            style={[styles.input, styles.textArea]} 
            value={form.problem} 
            onChangeText={t => setField('problem', t)} 
            multiline 
            numberOfLines={4}
            textAlignVertical="top"
            placeholder="Describe the problem in detail" 
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Expected Amount (Optional)</Text>
          <TextInput 
            style={styles.input} 
            value={form.expectedAmount} 
            onChangeText={(value) => {
              const numericValue = value.replace(/[^0-9.]/g, '');
              setField('expectedAmount', numericValue);
            }}
            placeholder="Enter expected amount (e.g., 500)"
            keyboardType="numeric"
          />
        </View>

        <TouchableOpacity disabled={saving} style={[styles.saveBtn, saving && { opacity: 0.7 }]} onPress={onSave}>
          <Text style={styles.saveTxt}>{saving ? 'Saving...' : 'Save Changes'}</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Contacts Modal */}
      <Modal
        visible={showContactsModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowContactsModal(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.contactsModalContent}>
            <View style={styles.contactsModalHeader}>
              <Text style={styles.contactsModalTitle}>Select Contact</Text>
              <TouchableOpacity
                onPress={() => {
                  setShowContactsModal(false);
                  setContactsSearchQuery('');
                }}
                style={styles.closeButton}
              >
                <Icon name="close-outline" size={28} color={textPrimary} />
              </TouchableOpacity>
            </View>
            
            {/* Search Bar */}
            <View style={styles.searchBarContainer}>
              <Icon name="search-outline" size={20} color={textSecondary} style={styles.searchIcon} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search contacts by name or number..."
                placeholderTextColor={textSecondary}
                value={contactsSearchQuery}
                onChangeText={setContactsSearchQuery}
                autoCapitalize="none"
                autoCorrect={false}
              />
              {contactsSearchQuery.length > 0 && (
                <TouchableOpacity
                  onPress={() => setContactsSearchQuery('')}
                  style={styles.clearSearchButton}
                >
                  <Icon name="close-circle" size={20} color={textSecondary} />
                </TouchableOpacity>
              )}
            </View>

            {loadingContacts ? (
              <View style={styles.emptyContactsContainer}>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={styles.emptyContactsText}>Loading contacts...</Text>
              </View>
            ) : (() => {
              const filteredContacts = contacts.filter(contact => {
                if (!contactsSearchQuery.trim()) return true;
                const query = contactsSearchQuery.toLowerCase().trim();
                const nameMatch = contact.name.toLowerCase().includes(query);
                const phoneMatch = contact.phoneNumbers && contact.phoneNumbers.some(phone => 
                  phone.number && phone.number.includes(query)
                );
                return nameMatch || phoneMatch;
              });

              if (filteredContacts.length === 0 && contacts.length > 0) {
                return (
                  <View style={styles.emptyContactsContainer}>
                    <Icon name="search-outline" size={48} color={textSecondary} />
                    <Text style={styles.emptyContactsText}>No contacts found</Text>
                    <Text style={styles.emptyContactsSubtext}>
                      Try a different search term
                    </Text>
                  </View>
                );
              }

              if (contacts.length === 0) {
                return (
                  <View style={styles.emptyContactsContainer}>
                    <Icon name="person-outline" size={48} color={textSecondary} />
                    <Text style={styles.emptyContactsText}>No contacts found</Text>
                    <Text style={styles.emptyContactsSubtext}>
                      Make sure you have contacts with phone numbers on your device
                    </Text>
                  </View>
                );
              }

              return (
                <FlatList
                  data={filteredContacts}
                  keyExtractor={(item) => item.id || `contact_${item.name}_${Math.random()}`}
                  renderItem={({ item }) => (
                    <View style={styles.contactItem}>
                      <View style={styles.contactInfo}>
                        <Text style={styles.contactName}>{item.name}</Text>
                        {item.phoneNumbers && item.phoneNumbers.length > 0 ? (
                          item.phoneNumbers.map((phone, index) => (
                            <TouchableOpacity
                              key={index}
                              style={styles.phoneNumberItem}
                              onPress={() => selectContact(item, phone.number)}
                            >
                              <Icon name="call-outline" size={18} color={colors.primary} />
                              <Text style={styles.phoneNumberText}>
                                {phone.label}: {phone.number.length > 10 ? phone.number.slice(-10) : phone.number}
                              </Text>
                            </TouchableOpacity>
                          ))
                        ) : (
                          <Text style={styles.noPhoneText}>No phone numbers</Text>
                        )}
                      </View>
                    </View>
                  )}
                  style={styles.contactsList}
                  contentContainerStyle={styles.contactsListContent}
                />
              );
            })()}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#F5F7FB' },
  formGroup: {
    marginBottom: 20,
  },
  label: { 
    marginBottom: 8, 
    fontWeight: '800', 
    fontSize: 15,
    color: '#37474F' 
  },
  input: {
    backgroundColor: '#fff',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    color: '#263238',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  adapterGroup: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  adapterOption: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#E0E0E0',
    backgroundColor: '#fff',
    alignItems: 'center',
  },
  adapterOptionSelected: {
    backgroundColor: colors.secondary,
    borderColor: colors.secondary,
  },
  adapterOptionText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#37474F',
  },
  adapterOptionTextSelected: {
    color: '#fff',
  },
  saveBtn: { 
    marginTop: 18, 
    backgroundColor: colors.secondary, 
    paddingVertical: 16, 
    borderRadius: 12, 
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  saveTxt: { 
    color: '#fff', 
    fontWeight: '800',
    fontSize: 16,
  },
  errorText: {
    color: '#E74C3C',
    fontSize: 12,
    marginTop: 6,
    fontWeight: '500',
  },
  phoneInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  phoneInput: {
    flex: 1,
    marginRight: 8,
  },
  phoneInputWrapper: {
    marginBottom: 12,
  },
  removePhoneButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FFEBEE',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  addPhoneButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#E3F2FD',
    borderRadius: 8,
    marginTop: 8,
    borderWidth: 1,
    borderColor: colors.primary,
    borderStyle: 'dashed',
  },
  addPhoneButtonText: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
  },
  contactButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#E3F2FD',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.primary,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  contactsModalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    height: '85%',
    paddingBottom: 20,
  },
  contactsModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  contactsModalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: textPrimary,
  },
  closeButton: {
    padding: 4,
  },
  searchBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 10,
    marginHorizontal: 20,
    marginVertical: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: textPrimary,
    padding: 0,
  },
  clearSearchButton: {
    marginLeft: 8,
    padding: 4,
  },
  emptyContactsContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyContactsText: {
    fontSize: 16,
    color: textSecondary,
    marginTop: 12,
    textAlign: 'center',
  },
  emptyContactsSubtext: {
    fontSize: 14,
    color: textSecondary,
    marginTop: 8,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  noPhoneText: {
    fontSize: 14,
    color: textSecondary,
    fontStyle: 'italic',
    marginTop: 4,
  },
  contactsList: {
    flex: 1,
  },
  contactsListContent: {
    paddingBottom: 20,
  },
  contactItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  contactInfo: {
    flex: 1,
  },
  contactName: {
    fontSize: 16,
    fontWeight: '600',
    color: textPrimary,
    marginBottom: 8,
  },
  phoneNumberItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    marginTop: 4,
  },
  phoneNumberText: {
    fontSize: 14,
    color: textPrimary,
    marginLeft: 8,
    flex: 1,
  },
});


