import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  Alert,
  SafeAreaView,
  StatusBar,
  Modal,
  Platform,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { saveRepair, getRepairs, getRepairById } from '../services/api';
import { getCurrentDateTime, parseDateTime, formatDate, formatTime } from '../utils/dateTime';
import { colors, spacing } from '../utils/theme';
import AppHeader from '../components/AppHeader';

export default function RepairAndService({ navigation, createdBy }) {
  const [formData, setFormData] = useState({
    date: '',
    time: '',
    uniqueId: '',
    customerName: '',
    phoneNumber: '',
    type: '',
    brand: '',
    adapterGiven: null,
    problem: '',
  });
  const [searchId, setSearchId] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [repairHistory, setRepairHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const [localRepairs, setLocalRepairs] = useState([]); // temporary local storage for IDs
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  
  // Show previous problems for the current Unique ID (beside Check ID)
  const getDetailsForCurrentId = async () => {
    const id = String(formData.uniqueId || '').trim();
    if (!id) {
      Alert.alert('Error', 'Please enter an ID first');
      return;
    }
    try {
      setIsSearching(true);
      console.log('Get Details for ID:', id);
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
      setLocalRepairs([]);
    } finally {
      setRefreshing(false);
    }
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
        phoneNumber: String(localMatch.phoneNumber || ''),
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
          phoneNumber: String(repair.phoneNumber || ''),
          type: String(repair.type || ''),
          brand: String(repair.brand || ''),
        }));
        Alert.alert('Already Exists', `This ID belongs to ${repair.customerName || 'Unknown'}.`);
    } else {
        // Clear previous customer details if ID is free
        setFormData(prev => ({
          ...prev,
          customerName: '',
          phoneNumber: '',
          type: '',
          brand: '',
        }));
      Alert.alert('ID is free', 'You can use this ID.');
      }
    } catch (error) {
      Alert.alert('Error', error.message || 'Failed to verify ID');
    }
  };
  const handleSearch = async () => {
    if (!searchId.trim()) {
      Alert.alert('Error', 'Please enter a Customer/Device ID');
      return;
    }

    try {
      setIsSearching(true);
      console.log('Searching for ID:', searchId.trim());
      const response = await getRepairById(searchId.trim());
      console.log('Search response:', response);
      
      if (response.success && response.data) {
        const repair = response.data;
        const history = response.history || [repair]; // Get all previous problems
        // Show only entries with a non-empty problem
        const filteredHistory = (history || []).filter(h => String(h?.problem || '').trim().length > 0);
        const totalEntries = response.totalEntries || filteredHistory.length;
        
        console.log('Repair data found:', repair);
        console.log('Total previous entries:', totalEntries);
        console.log('History array length:', filteredHistory.length);
        console.log('History items:', filteredHistory.map(h => ({ 
          id: h._id, 
          problem: h.problem, 
          status: h.status,
          createdAt: h.createdAt 
        })));
        
        // Store history for display
        setRepairHistory(filteredHistory);
        
        // Do not populate form fields; only show previous problems
        // Open the previous problems modal only if there are previous problems
        if (filteredHistory.length > 0) {
          setShowHistory(true);
        } else {
          Alert.alert('No Repair', 'No repair exists for this ID.');
        }
      } else {
        Alert.alert('Not Found', response.message || 'No repair entry found with this ID. Please check the ID and try again.');
      }
    } catch (error) {
      console.error('Search error:', error);
      Alert.alert('Error', error.message || 'Failed to fetch customer details');
    } finally {
      setIsSearching(false);
    }
  };

  const handleSave = async () => {
    // Validation
    if (!formData.customerName.trim()) {
      Alert.alert('Error', 'Please enter customer name');
      return;
    }
    if (!formData.phoneNumber.trim()) {
      Alert.alert('Error', 'Please enter phone number');
      return;
    }
    // Phone number validation - exactly 10 digits
    const phoneRegex = /^\d{10}$/;
    if (!phoneRegex.test(formData.phoneNumber.trim())) {
      Alert.alert('Error', 'Phone number must be exactly 10 digits');
      return;
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

    try {
      // Parse date and time to create proper Date object
      const dateTimeString = `${formData.date} ${formData.time}`;
      const createdAt = parseDateTime(dateTimeString);

      const repairData = {
        uniqueId: formData.uniqueId,
        customerName: formData.customerName.trim(),
        phoneNumber: formData.phoneNumber.trim(),
        type: formData.type.trim(),
        brand: formData.brand.trim(),
        adapterGiven: formData.adapterGiven,
        problem: formData.problem.trim(),
        createdAt: createdAt.toISOString(),
        status: 'Pending',
        createdBy: createdBy || '',
      };

      const response = await saveRepair(repairData);
      
      if (response.success) {
        // Reload latest data
        await loadData();
        // Clear form fields and prepare next suggested ID
        const { date, time } = getCurrentDateTime();
        const nextIdNumeric = parseInt(formData.uniqueId, 10);
        const nextId = Number.isFinite(nextIdNumeric) ? String(nextIdNumeric + 1) : '';
        setFormData({
          date,
          time,
          uniqueId: nextId,
          customerName: '',
          phoneNumber: '',
          type: '',
          brand: '',
          adapterGiven: null,
          problem: '',
        });
        setSearchId('');
        setRepairHistory([]);
        setShowHistory(false);

        // Refresh history after saving new entry
        if (formData.uniqueId) {
          try {
            const historyResponse = await getRepairById(formData.uniqueId);
            if (historyResponse.success) {
              const history = historyResponse.history || [];
              console.log('Refreshed history after save:', history.length, 'entries');
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
            phoneNumber: formData.phoneNumber.trim(),
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
    }
  };

  return (
    <SafeAreaView style={navigation ? styles.containerAdmin : styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.primary} translucent={false} />
      {navigation && (
        <View style={{ marginHorizontal: -20, marginTop: -20 }}>
          <AppHeader title="Repair & Service" showBrand={false} onBackPress={() => navigation.goBack()} />
        </View>
      )}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={navigation ? styles.contentAdmin : styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={loadData} />
        }
      >
        <View style={styles.header}>
          <View style={styles.headerRow}>
          <Text style={styles.title}>New Repair Entry</Text>
          </View>
          <View style={styles.titleUnderline} />
        </View>

        

        {/* History Modal */}
        <Modal
          visible={showHistory}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setShowHistory(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.historyModalContent}>
              <View style={styles.historyModalHeader}>
                <Text style={styles.historyModalTitle}>Previous Problems History</Text>
                <Text style={styles.historyModalSubtitle}>
                  ID: {formData.uniqueId} | Customer: {formData.customerName}
                </Text>
                <Text style={styles.historyModalCount}>
                  Total Problems: {repairHistory.length}
                </Text>
                <TouchableOpacity
                  style={styles.closeButton}
                  onPress={() => setShowHistory(false)}
                >
                  <Text style={styles.closeButtonText}>✕ Close</Text>
                </TouchableOpacity>
              </View>
              <ScrollView style={styles.historyList}>
                {repairHistory.length === 0 ? (
                  <View style={styles.emptyHistoryContainer}>
                    <Text style={styles.emptyHistoryText}>No previous problems found</Text>
                  </View>
                ) : (
                  repairHistory.map((repair, index) => (
                  <View key={repair._id || index} style={styles.historyItem}>
                    <View style={styles.historyItemHeader}>
                      <Text style={styles.historyItemNumber}>#{repairHistory.length - index}</Text>
                      <Text style={styles.historyItemDate}>
                        {formatDate(repair.createdAt)} {formatTime(repair.createdAt)}
                      </Text>
                      <View style={[
                        styles.historyStatusBadge,
                        repair.status === 'Completed' ? styles.statusCompleted : 
                        repair.status === 'Not Completed' ? styles.statusNotCompleted : 
                        styles.statusPending
                      ]}>
                        <Text style={styles.historyStatusText}>{repair.status || 'Pending'}</Text>
                      </View>
                    </View>
                    <Text style={styles.historyItemProblem}>
                      <Text style={styles.historyLabel}>Type: </Text>
                      {repair.type || 'N/A'}
                    </Text>
                    <Text style={styles.historyItemProblem}>
                      <Text style={styles.historyLabel}>Brand: </Text>
                      {repair.brand || 'N/A'}
                    </Text>
                    <Text style={styles.historyItemProblem}>
                      <Text style={styles.historyLabel}>Problem: </Text>
                      {repair.problem || 'No problem description'}
                    </Text>
                      <Text style={styles.historyItemRemark}>
                      <Text style={styles.historyLabel}>Have Done: </Text>
                      {repair.remark || 'No description'}
                      </Text>
                    {repair.deliveredAt && (
                      <Text style={styles.historyItemDelivered}>
                        Delivered: {formatDate(repair.deliveredAt)} {formatTime(repair.deliveredAt)}
                      </Text>
                    )}
                  </View>
                  ))
                )}
              </ScrollView>
            </View>
          </View>
        </Modal>

        {/* Unique ID (place above Date/Time, below details box) */}
        <View style={styles.formGroup}>
          <Text style={styles.label}>Unique ID</Text>
          <View style={styles.inlineRow}>
            <TextInput
              style={[styles.input, { flex: 1 }]}
              value={formData.uniqueId}
              onChangeText={(value) => handleInputChange('uniqueId', value.replace(/[^0-9]/g, ''))}
              placeholder="Enter ID"
              keyboardType="numeric"
              returnKeyType="done"
            />
            <TouchableOpacity style={styles.searchButton} onPress={checkIdAvailability}>
              <Text style={styles.searchButtonText}>Check ID</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.searchButton, isSearching && styles.searchButtonDisabled]}
              onPress={getDetailsForCurrentId}
              disabled={isSearching}
            >
              <Text style={styles.searchButtonText}>
                {isSearching ? 'Getting...' : 'Get Details'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Date and Time (current by default, editable via pickers) */}
        <View style={styles.formGroup}>
          <Text style={styles.label}>Date</Text>
          <View style={styles.inlineRow}>
            <TextInput
              style={[styles.input, { flex: 1 }]}
              value={formData.date}
              editable={false}
              placeholder="dd/mm/yy"
            />
            <TouchableOpacity style={styles.smallButton} onPress={() => setShowDatePicker(true)}>
              <Text style={styles.searchButtonText}>Edit</Text>
            </TouchableOpacity>
          </View>
          {showDatePicker && (
            <DateTimePicker
              value={parseDateTime(`${formData.date} ${formData.time}`)}
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
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Time</Text>
          <View style={styles.inlineRow}>
            <TextInput
              style={[styles.input, { flex: 1 }]}
              value={formData.time}
              editable={false}
              placeholder="HH:MM AM/PM"
            />
            <TouchableOpacity style={styles.smallButton} onPress={() => setShowTimePicker(true)}>
              <Text style={styles.searchButtonText}>Edit</Text>
            </TouchableOpacity>
          </View>
          {showTimePicker && (
            <DateTimePicker
              value={parseDateTime(`${formData.date} ${formData.time}`)}
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
        </View>

        {/* Customer Name */}
        <View style={styles.formGroup}>
          <Text style={styles.label}>Customer Name *</Text>
          <TextInput
            style={styles.input}
            value={formData.customerName}
            onChangeText={(value) => handleInputChange('customerName', value)}
            placeholder="Enter customer name"
          />
        </View>

        {/* Phone Number */}
        <View style={styles.formGroup}>
          <Text style={styles.label}>Phone Number *</Text>
          <TextInput
            style={styles.input}
            value={formData.phoneNumber}
            onChangeText={(value) => {
              // Only allow digits and limit to 10 digits
              const digitsOnly = value.replace(/[^0-9]/g, '').slice(0, 10);
              handleInputChange('phoneNumber', digitsOnly);
            }}
            placeholder="Enter 10 digit phone number"
            keyboardType="phone-pad"
            maxLength={10}
          />
          {formData.phoneNumber.length > 0 && formData.phoneNumber.length !== 10 && (
            <Text style={styles.errorText}>Phone number must be exactly 10 digits</Text>
          )}
        </View>

        {/* Device Type - Text Input */}
        <View style={styles.formGroup}>
          <Text style={styles.label}>Device Type *</Text>
          <TextInput
            style={styles.input}
            value={formData.type}
            onChangeText={(value) => handleInputChange('type', value)}
            placeholder="Enter device type "
          />
        </View>

        {/* Brand Name */}
        <View style={styles.formGroup}>
          <Text style={styles.label}>Brand Name *</Text>
          <TextInput
            style={styles.input}
            value={formData.brand}
            onChangeText={(value) => handleInputChange('brand', value)}
            placeholder="Enter brand name"
          />
        </View>

        {/* Adapter selection - pill buttons */}
        <View style={styles.formGroup}>
          <Text style={styles.label}>Adapter *</Text>
          <View style={styles.adapterGroup}>
            <TouchableOpacity
              style={[
                styles.adapterOption,
                formData.adapterGiven === true && styles.adapterOptionSelected
              ]}
              onPress={() => handleInputChange('adapterGiven', true)}
            >
              <Text
                style={[
                  styles.adapterOptionText,
                  formData.adapterGiven === true && styles.adapterOptionTextSelected
                ]}
              >
                Given
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.adapterOption,
                formData.adapterGiven === false && styles.adapterOptionSelected
              ]}
              onPress={() => handleInputChange('adapterGiven', false)}
            >
              <Text
                style={[
                  styles.adapterOptionText,
                  formData.adapterGiven === false && styles.adapterOptionTextSelected
                ]}
              >
                Not Given
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Problem Description */}
        <View style={styles.formGroup}>
          <Text style={styles.label}>Problem Description *</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={formData.problem}
            onChangeText={(value) => handleInputChange('problem', value)}
            placeholder="Describe the problem in detail"
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
        </View>

        {/* Save Button */}
        <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
          <Text style={styles.saveButtonText}>Save Entry</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ECF0F1',
  },
  containerAdmin: {
    flex: 1,
    padding: 20,
    backgroundColor: '#F5F7FB',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
    paddingBottom: 90,
  },
  contentAdmin: {
    padding: 0,
    paddingBottom: 90,
  },
  header: {
    marginBottom: 30,
    alignItems: 'center',
  },
  headerRow: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  refreshButton: {
    backgroundColor: 'transparent',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 8,
    alignSelf: 'flex-end',
    marginTop: 6,
  },
  refreshIcon: {
    fontSize: 17,
  },
  refreshButtonDisabled: {
    opacity: 0.7,
  },
  refreshButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginBottom: 8,
  },
  titleUnderline: {
    width: 60,
    height: 4,
    backgroundColor: colors.secondary,
    borderRadius: 2,
  },
  searchSection: {
    backgroundColor: '#E3F2FD',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderWidth: 2,
    borderColor: '#2196F3',
  },
  searchTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1976D2',
    marginBottom: 12,
  },
  searchContainer: {
    flexDirection: 'row',
    gap: 10,
  },
  searchInput: {
    flex: 1,
    borderWidth: 2,
    borderColor: '#2196F3',
    borderRadius: 10,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#fff',
    color: '#2C3E50',
  },
  searchButton: {
    backgroundColor: '#2196F3',
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 95,
  },
  searchButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  searchButtonDisabled: {
    opacity: 0.6,
  },
  searchSubtitle: {
    fontSize: 13,
    color: '#666',
    marginBottom: 8,
  },
  newEntryButton: {
    backgroundColor: colors.success,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginTop: 10,
    alignItems: 'center',
  },
  newEntryButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
  historyButton: {
    backgroundColor: colors.accentOrange,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginTop: 10,
    alignItems: 'center',
  },
  historyButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  historyModalContent: {
    backgroundColor: '#fff',
    borderRadius: 20,
    width: '90%',
    maxHeight: '80%',
    padding: 20,
  },
  historyModalHeader: {
    marginBottom: 20,
    borderBottomWidth: 2,
    borderBottomColor: '#3498DB',
    paddingBottom: 15,
  },
  historyModalTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#2C3E50',
    marginBottom: 5,
  },
  historyModalSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  historyModalCount: {
    fontSize: 13,
    color: '#3498DB',
    fontWeight: '700',
    marginBottom: 10,
  },
  historyModalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  refreshHistoryButton: {
    backgroundColor: '#3498DB',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  refreshHistoryButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  closeButton: {
    alignSelf: 'flex-end',
    backgroundColor: '#E74C3C',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginTop: 10,
  },
  closeButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  historyList: {
    maxHeight: 400,
  },
  historyItem: {
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    borderLeftWidth: 4,
    borderLeftColor: '#3498DB',
  },
  historyItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  historyItemNumber: {
    fontSize: 16,
    fontWeight: '700',
    color: '#2C3E50',
  },
  historyItemDate: {
    fontSize: 12,
    color: '#666',
    flex: 1,
    marginLeft: 10,
  },
  historyStatusBadge: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 12,
  },
  statusPending: {
    backgroundColor: '#FFC107',
  },
  statusCompleted: {
    backgroundColor: '#4CAF50',
  },
  statusNotCompleted: {
    backgroundColor: '#F44336',
  },
  historyStatusText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
  },
  historyItemProblem: {
    fontSize: 14,
    color: '#2C3E50',
    marginTop: 8,
    lineHeight: 20,
  },
  historyItemRemark: {
    fontSize: 13,
    color: '#666',
    marginTop: 8,
    fontStyle: 'italic',
  },
  historyItemDelivered: {
    fontSize: 12,
    color: '#4CAF50',
    marginTop: 8,
    fontWeight: '600',
  },
  historyLabel: {
    fontWeight: '700',
    color: '#2C3E50',
  },
  emptyHistoryContainer: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyHistoryText: {
    fontSize: 16,
    color: '#999',
    fontStyle: 'italic',
  },
  formGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '700',
    color: '#2C3E50',
    marginBottom: 10,
  },
  input: {
    borderWidth: 2,
    borderColor: '#BDC3C7',
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    backgroundColor: '#fff',
    color: '#2C3E50',
  },
  inlineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  smallButton: {
    backgroundColor: colors.secondary,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  disabledInput: {
    backgroundColor: '#E8E8E8',
    color: '#7F8C8D',
    borderColor: '#BDC3C7',
  },
  textArea: {
    height: 160,
    paddingTop: 14,
  },
  adapterGroup: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 10,
  },
  adapterOption: {
    flex: 1,
    borderWidth: 2,
    borderColor: colors.secondary,
    backgroundColor: '#fff',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  adapterOptionSelected: {
    backgroundColor: '#E3F2FD',
  },
  adapterOptionText: {
    color: '#2C3E50',
    fontSize: 16,
    fontWeight: '600',
  },
  adapterOptionTextSelected: {
    color: colors.secondary,
    fontWeight: '700',
  },
  saveButton: {
    backgroundColor: colors.success,
    padding: 18,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 30,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  errorText: {
    color: '#E74C3C',
    fontSize: 12,
    marginTop: 6,
    fontWeight: '500',
  },
});
