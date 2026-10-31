import React, { useState, useEffect, useContext } from 'react';
import {
  StyleSheet,
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Alert,
  RefreshControl,
  Linking,
  Platform,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import DateTimePicker from '@react-native-community/datetimepicker';
import Screen from '../components/Screen';
import AppHeader from '../components/AppHeader';
import AppCard from '../components/AppCard';
import AppButton from '../components/AppButton';
import AppInput from '../components/AppInput';
import AppModal from '../components/AppModal';
import StatusBadge from '../components/StatusBadge';
import SearchBar from '../components/SearchBar';
import SegmentedTabs from '../components/SegmentedTabs';
import InfoRow from '../components/InfoRow';
import EmptyState from '../components/EmptyState';
import LoadingState from '../components/LoadingState';
import Icon from '../components/Icon';
import { getRepairs, updateRepair, deleteRepair } from '../services/api';
import { colors, spacing, radii } from '../ui/Theme';
import { formatDate, formatTime } from '../utils/dateTime';
import { AuthContext } from '../contexts/AuthContext';

const TAB_EMPTY = {
  Pending: { icon: 'time-outline', title: 'No pending repairs', tone: 'warning' },
  Completed: { icon: 'checkmark-done-outline', title: 'No completed repairs', tone: 'success' },
  Delivered: { icon: 'cube-outline', title: 'No delivered repairs', tone: 'info' },
};

export default function RepairList({ navigation, isAdmin = false }) {
  const { user } = useContext(AuthContext);
  // Check if user has permission to remove repairs (admins always have this, employees need explicit permission)
  const canRemoveRepairs = isAdmin || (user?.canRemoveRepairs === true);
  const [repairs, setRepairs] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [activeTab, setActiveTab] = useState('Pending'); // 'Pending', 'Completed', 'Delivered'
  const [expanded, setExpanded] = useState({}); // id -> boolean
  const [searchId, setSearchId] = useState('');
  const [remarkModalVisible, setRemarkModalVisible] = useState(false);
  const [remarkText, setRemarkText] = useState('');
  const [remarkAmount, setRemarkAmount] = useState(''); // Amount for completed/not completed
  const [remarkTarget, setRemarkTarget] = useState(null); // repair object
  const [remarkStatus, setRemarkStatus] = useState(null); // 'Completed' | 'Not Completed'
  const [amountModalVisible, setAmountModalVisible] = useState(false);
  const [amountText, setAmountText] = useState('');
  const [deliveryDate, setDeliveryDate] = useState(() => new Date()); // calendar-selected date
  const [showDeliveryDatePicker, setShowDeliveryDatePicker] = useState(false);
  const [amountTarget, setAmountTarget] = useState(null); // repair object
  const [savingDelivered, setSavingDelivered] = useState(false);
  const [phoneModalVisible, setPhoneModalVisible] = useState(false);
  const [phoneNumbers, setPhoneNumbers] = useState([]);
  const [removing, setRemoving] = useState({}); // Track which repair is being removed

  useEffect(() => {
    loadRepairs();
  }, []);

  // Refresh when screen comes into focus (after returning from edit screen)
  useFocusEffect(
    React.useCallback(() => {
      // Add a small delay to ensure navigation is complete
      const timer = setTimeout(() => {
        loadRepairs();
      }, 100);
      return () => clearTimeout(timer);
    }, [])
  );

  // Also listen for navigation focus events as a backup
  useEffect(() => {
    const unsubscribe = navigation?.addListener?.('focus', () => {
      loadRepairs();
    });
    return unsubscribe;
  }, [navigation]);

  const loadRepairs = async () => {
    try {
      setLoading(true);
      const response = await getRepairs();

      if (response.success) {
        setErrorMessage('');
        const repairsData = response.data || [];
        setRepairs(repairsData);
      } else {
        console.error('Failed to load repairs:', response.message);
        setErrorMessage(response.message || 'Failed to load repairs');
        setRepairs([]);
      }
    } catch (error) {
      console.error('Load repairs error:', error);
      setErrorMessage(error.message || 'Failed to load repairs. Make sure backend server is running.');
      setRepairs([]);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadRepairs();
    setRefreshing(false);
  };

  const openRemarkModal = (repair, status) => {
    setRemarkTarget(repair);
    setRemarkStatus(status);
    setRemarkText('');
    // Pre-fill amount with existing expectedAmount if available
    const prefillAmount = repair?.expectedAmount ? String(repair.expectedAmount) : '';
    setRemarkAmount(prefillAmount);
    setRemarkModalVisible(true);
  };

  const closeRemarkModal = () => {
    setRemarkModalVisible(false);
    setRemarkText('');
    setRemarkAmount('');
  };

  const saveRemarkAndUpdate = async () => {
    if (!remarkTarget || !remarkStatus) {
      setRemarkModalVisible(false);
      return;
    }
    const trimmed = String(remarkText || '').trim();
    if (!trimmed) {
      Alert.alert('Description required', 'Please enter a description.');
      return;
    }

    // Parse amount (optional) - this will update expectedAmount
    let expectedAmountValue = null;
    const trimmedAmount = String(remarkAmount || '').trim();
    if (trimmedAmount) {
      const parsed = parseFloat(trimmedAmount);
      if (!isNaN(parsed) && parsed > 0) {
        expectedAmountValue = parsed;
      }
    }

    try {
      const updateData = {
        status: remarkStatus,
        remark: trimmed,
      };

      // Update expectedAmount if provided
      if (expectedAmountValue !== null) {
        updateData.expectedAmount = expectedAmountValue;
      }

      const response = await updateRepair(remarkTarget._id, updateData);
      if (response.success) {
        setRemarkModalVisible(false);
        setRemarkText('');
        setRemarkAmount('');
        setRemarkTarget(null);
        setRemarkStatus(null);
        loadRepairs();
      } else {
        Alert.alert('Error', response.message || 'Failed to update repair');
      }
    } catch (error) {
      Alert.alert('Error', error.message || 'Failed to update repair');
    }
  };

  const handleMarkAsNotCompleted = async (repair) => {
    openRemarkModal(repair, 'Not Completed');
  };

  const handleMarkAsCompleted = async (repair) => {
    openRemarkModal(repair, 'Completed');
  };

  const handleRemove = async (repair) => {
    // Only allow removing pending repairs
    if (repair.status !== 'Pending') {
      Alert.alert('Error', 'Only pending repairs can be removed');
      return;
    }

    // Confirm deletion
    Alert.alert(
      'Remove Repair',
      'Are you sure you want to remove this repair item? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            setRemoving(prev => ({ ...prev, [repair._id]: true }));
            try {
              const response = await deleteRepair(repair._id);
              if (response.success) {
                // Optimistically update UI - remove from list
                setRepairs(prev => prev.filter(r => r._id !== repair._id));
                Alert.alert('Success', 'Repair item removed successfully');
              } else {
                Alert.alert('Error', response.message || 'Failed to remove repair item');
              }
            } catch (error) {
              console.error('Remove repair error:', error);
              Alert.alert('Error', error.message || 'Failed to remove repair item');
            } finally {
              setRemoving(prev => {
                const updated = { ...prev };
                delete updated[repair._id];
                return updated;
              });
            }
          },
        },
      ]
    );
  };

  const handleMarkAsDelivered = async (repair) => {
    // Open modal; pre-fill delivery date (today) and amount
    const prefillAmount = repair.expectedAmount ? String(repair.expectedAmount) : '';
    setAmountTarget(repair);
    setAmountText(prefillAmount);
    setDeliveryDate(new Date());
    setShowDeliveryDatePicker(false);
    setAmountModalVisible(true);
  };

  const closeAmountModal = () => {
    if (!savingDelivered) {
      setAmountModalVisible(false);
      setAmountText('');
      setShowDeliveryDatePicker(false);
      setAmountTarget(null);
      setSavingDelivered(false);
    }
  };

  const saveAmountAndMarkAsDelivered = async () => {
    if (!amountTarget) {
      setAmountModalVisible(false);
      return;
    }

    if (savingDelivered) {
      return; // Prevent multiple clicks
    }

    setSavingDelivered(true);

    try {
      // Use calendar-selected delivery date (date only). Noon UTC so date displays correctly in any timezone.
      const d = deliveryDate || new Date();
      const deliveredAt = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate(), 12, 0, 0, 0));

      // Parse amount: if empty or invalid, set to null (optional)
      let amountValue = null;
      const trimmedAmount = String(amountText || '').trim();
      if (trimmedAmount) {
        const parsed = parseFloat(trimmedAmount);
        if (!isNaN(parsed) && parsed > 0) {
          amountValue = parsed;
        }
      }

      const updateData = {
        deliveredAt: deliveredAt.toISOString(),
        amount: amountValue, // null if not provided or invalid
        // keep existing remark (do not overwrite)
      };

      const response = await updateRepair(amountTarget._id, updateData);

      // Close modal first to prevent UI blocking
      setAmountModalVisible(false);
      setAmountText('');
      setShowDeliveryDatePicker(false);
      setAmountTarget(null);
      setSavingDelivered(false);

      if (response.success) {
        Alert.alert('Success', 'Repair marked as delivered successfully!');
        await loadRepairs();
      } else {
        Alert.alert('Error', response.message || 'Failed to update repair');
      }
    } catch (error) {
      console.error('Error marking as delivered:', error);
      setAmountModalVisible(false);
      setAmountText('');
      setShowDeliveryDatePicker(false);
      setAmountTarget(null);
      setSavingDelivered(false);
      Alert.alert('Error', error.message || 'Failed to update repair. Please try again.');
    }
  };

  const handleMarkAsPending = async (repair) => {
    // Only allow admin users to perform this action
    if (!isAdmin) {
      Alert.alert('Error', 'Only admin users can perform this action');
      return;
    }

    // Optimistic update: immediately update local state to move item from Delivered to Pending
    setRepairs(prevRepairs =>
      prevRepairs.map(r =>
        r._id === repair._id
          ? { ...r, status: 'Pending', deliveredAt: null }
          : r
      )
    );

    try {
      const response = await updateRepair(repair._id, { status: 'Pending', deliveredAt: null });
      if (response.success) {
        // Refresh to ensure data consistency with backend
        await loadRepairs();
        // If we're on Delivered tab, switch to Pending tab to show the moved item
        if (activeTab === 'Delivered') {
          setActiveTab('Pending');
        }
      } else {
        // Revert optimistic update on error
        await loadRepairs();
        Alert.alert('Error', response.message || 'Failed to update repair');
      }
    } catch (error) {
      // Revert optimistic update on error
      await loadRepairs();
      Alert.alert('Error', error.message || 'Failed to update repair');
    }
  };

  const handleCall = (phoneNumber) => {
    if (!phoneNumber) {
      Alert.alert('Error', 'Phone number not available');
      return;
    }

    // Check if phone number contains multiple numbers (comma-separated)
    const numbers = phoneNumber.split(',').map(p => p.trim()).filter(p => p.length > 0);

    if (numbers.length > 1) {
      // Multiple phone numbers - show custom modal
      setPhoneNumbers(numbers);
      setPhoneModalVisible(true);
    } else {
      // Single phone number - call directly
      makeCall(numbers[0] || phoneNumber);
    }
  };

  const handlePhoneSelect = (selectedPhone) => {
    setPhoneModalVisible(false);
    makeCall(selectedPhone);
  };

  const makeCall = async (phoneNumber) => {
    if (!phoneNumber) {
      Alert.alert('Error', 'Phone number not available');
      return;
    }

    // Clean phone number: remove spaces, dashes, and other characters except digits and +
    const cleanNumber = phoneNumber.trim().replace(/[^\d+]/g, '');

    if (!cleanNumber || cleanNumber.length === 0) {
      Alert.alert('Error', 'Invalid phone number');
      return;
    }

    const phoneUrl = `tel:${cleanNumber}`;

    try {
      // Try to open the phone URL directly
      // This will work on real devices with calling capability
      await Linking.openURL(phoneUrl);
    } catch (error) {
      console.error('Call error:', error);
      // Check if error is because device doesn't support calls (simulator/emulator)
      Alert.alert(
        'Cannot Make Call',
        Platform.OS === 'android'
          ? 'Phone calls are not supported on Android emulators. Please test on a real device. The phone number is: ' + cleanNumber
          : 'Phone calls are not supported on iOS simulators. Please test on a real device. The phone number is: ' + cleanNumber
      );
    }
  };

  // Filter repairs based on active tab
  const getFilteredRepairs = () => {
    switch (activeTab) {
      case 'Pending':
        return repairs.filter(repair => repair.status === 'Pending');
      case 'Completed':
        // Completed or Not Completed, but not yet delivered
        return repairs.filter(repair => (repair.status === 'Completed' || repair.status === 'Not Completed') && !repair.deliveredAt);
      case 'Delivered':
        // Any repair that has a deliveredAt timestamp
        return repairs.filter(repair => !!repair.deliveredAt);
      default:
        return repairs;
    }
  };

  const normalizedSearch = searchId.trim();
  const tabList = getFilteredRepairs(); // restrict to current tab
  const filteredRepairs = normalizedSearch
    ? tabList.filter(r => String(r.uniqueId ?? '').trim() === normalizedSearch)
    : tabList;
  const pendingCount = repairs.filter(r => r.status === 'Pending').length;
  const completedCount = repairs.filter(r => (r.status === 'Completed' || r.status === 'Not Completed') && !r.deliveredAt).length;
  const deliveredCount = repairs.filter(r => !!r.deliveredAt).length;

  const renderRepairItem = ({ item }) => {
    const idKey = item._id || item.uniqueId;
    const isExpanded = !!expanded[idKey];
    const createdDate = item.createdAt ? formatDate(item.createdAt) : 'N/A';
    const createdTime = item.createdAt ? formatTime(item.createdAt) : 'N/A';
    const deliveredDate = item.deliveredAt ? formatDate(item.deliveredAt) : null;

    const isDelivered = !!item.deliveredAt;
    const badgeText = isDelivered ? `${item.status} - Delivered` : item.status;
    const deviceLine = [item.type, item.brand].filter(Boolean).join(' · ');

    return (
      <AppCard style={styles.repairCard}>
        <TouchableOpacity
          style={styles.cardHeader}
          activeOpacity={0.8}
          onPress={() => setExpanded(prev => ({ ...prev, [idKey]: !isExpanded }))}
          accessibilityLabel={isExpanded ? 'Collapse details' : 'Expand details'}
        >
          <View style={styles.idChip}>
            <Text style={styles.idChipText}>#{item.uniqueId}</Text>
          </View>
          <View style={styles.headerText}>
            <Text style={styles.customerName} numberOfLines={1}>{item.customerName}</Text>
            <Text style={styles.metaLine} numberOfLines={1}>
              {deviceLine || 'Device'}  ·  {createdDate}
            </Text>
          </View>
          <View style={styles.headerRight}>
            <StatusBadge status={badgeText} size="sm" />
            <Icon name={isExpanded ? 'chevron-up' : 'chevron-down'} size={18} color={colors.textMuted} style={styles.chevron} />
          </View>
        </TouchableOpacity>

        {isExpanded && (
          <View style={styles.details}>
            <InfoRow icon="hardware-chip-outline" label="Type" value={item.type} />
            {item.brand ? <InfoRow icon="pricetags-outline" label="Brand" value={item.brand} /> : null}
            {item.adapterGiven !== undefined && item.adapterGiven !== null && (
              <InfoRow
                icon="flash-outline"
                label="Adapter"
                value={item.adapterGiven ? 'Given' : 'Not Given'}
                valueColor={item.adapterGiven ? colors.success : colors.neutral}
              />
            )}
            <InfoRow icon="build-outline" label="Problem" value={item.problem} />
            {item.expectedAmount ? (
              <InfoRow icon="cash-outline" label="Expected Amount" value={`₹${item.expectedAmount.toFixed(2)}`} valueColor={colors.warning} />
            ) : null}
            {!!item.remark && <InfoRow icon="checkmark-done-outline" label="Have Done" value={item.remark} />}
            <InfoRow
              icon="calendar-outline"
              label="Given Date"
              value={`${createdDate} ${createdTime}`}
              last={!(isDelivered && deliveredDate) && !(isDelivered && item.amount)}
            />
            {isDelivered && deliveredDate && (
              <InfoRow icon="cube-outline" label="Delivered Date" value={deliveredDate} last={!(isDelivered && item.amount)} />
            )}
            {isDelivered && item.amount ? (
              <InfoRow icon="wallet-outline" label="Amount" value={`₹${item.amount.toFixed(2)}`} valueColor={colors.success} last />
            ) : null}

            <View style={styles.secondaryActions}>
              <AppButton
                title="Edit"
                icon="create-outline"
                variant="outline"
                size="sm"
                style={styles.flexBtn}
                onPress={() => {
                  if (navigation && navigation.navigate) {
                    // Use the correct screen name based on user role
                    const screenName = isAdmin ? 'AdminRepairEdit' : 'EmployeeRepairEdit';
                    navigation.navigate(screenName, { repair: item });
                  }
                }}
              />
              {item.status === 'Pending' && canRemoveRepairs && (
                <AppButton
                  title="Remove"
                  icon="trash-outline"
                  variant="dangerSoft"
                  size="sm"
                  style={styles.flexBtn}
                  onPress={() => handleRemove(item)}
                  loading={!!removing[item._id]}
                  disabled={!!removing[item._id]}
                />
              )}
            </View>
          </View>
        )}

        {item.status === 'Pending' && (
          <View style={styles.actionRow}>
            <AppButton title="Call" icon="call-outline" variant="secondary" size="sm" style={styles.flexBtn} onPress={() => handleCall(item.phoneNumber)} />
            <AppButton title="Completed" icon="checkmark-outline" variant="success" size="sm" style={styles.flexBtn} onPress={() => handleMarkAsCompleted(item)} />
            <AppButton title="Not Completed" variant="neutralSoft" size="sm" style={styles.flexBtn} onPress={() => handleMarkAsNotCompleted(item)} />
          </View>
        )}
        {(item.status === 'Completed' || item.status === 'Not Completed') && !item.deliveredAt && (
          <View style={styles.actionRow}>
            <AppButton title="Call" icon="call-outline" variant="secondary" size="sm" style={styles.flexBtn} onPress={() => handleCall(item.phoneNumber)} />
            <AppButton title="Delivered" icon="cube-outline" variant="primary" size="sm" style={styles.flexBtn} onPress={() => handleMarkAsDelivered(item)} />
            {isAdmin && (
              <AppButton title="Pending" icon="time-outline" variant="warning" size="sm" style={styles.flexBtn} onPress={() => handleMarkAsPending(item)} />
            )}
          </View>
        )}
        {isAdmin && activeTab === 'Delivered' && !!item.deliveredAt && (
          <View style={styles.actionRow}>
            <AppButton title="Move to Pending" icon="time-outline" variant="warning" size="sm" style={styles.flexBtn} onPress={() => handleMarkAsPending(item)} />
          </View>
        )}
      </AppCard>
    );
  };

  const emptyMeta = TAB_EMPTY[activeTab] || TAB_EMPTY.Pending;

  return (
    <Screen
      padded={false}
      header={
        <AppHeader
          large
          subtitle="Repairs"
          title="Repair List"
          onBackPress={() => navigation?.goBack()}
          rightAction={{ icon: 'refresh-outline', onPress: onRefresh, label: 'Refresh' }}
        >
          <SearchBar
            value={searchId}
            onChangeText={setSearchId}
            placeholder="Search by ID"
            keyboardType="numeric"
          />
        </AppHeader>
      }
    >
      <View style={styles.tabsWrap}>
        <SegmentedTabs
          value={activeTab}
          onChange={setActiveTab}
          tabs={[
            { key: 'Pending', label: 'Pending', count: pendingCount },
            { key: 'Completed', label: 'Completed', count: completedCount },
            { key: 'Delivered', label: 'Delivered', count: deliveredCount },
          ]}
        />
      </View>

      {loading ? (
        <LoadingState message="Loading repairs..." />
      ) : (
        <FlatList
          data={filteredRepairs}
          renderItem={renderRepairItem}
          keyExtractor={(item) => item._id || item.uniqueId}
          contentContainerStyle={[styles.listContent, filteredRepairs.length === 0 && styles.emptyListContent]}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          ListEmptyComponent={
            <EmptyState
              icon={emptyMeta.icon}
              tone={errorMessage ? 'danger' : emptyMeta.tone}
              title={normalizedSearch ? `No results for #${normalizedSearch}` : emptyMeta.title}
              subtitle={errorMessage || 'Pull down to refresh'}
              action={errorMessage ? <AppButton title="Retry" icon="refresh-outline" fullWidth={false} onPress={onRefresh} /> : null}
            />
          }
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* Remark Modal */}
      <AppModal
        visible={remarkModalVisible}
        onClose={closeRemarkModal}
        title={remarkStatus === 'Completed' ? 'Mark as Completed' : 'Mark as Not Completed'}
        subtitle={remarkTarget ? `#${remarkTarget.uniqueId} · ${remarkTarget.customerName}` : undefined}
        footer={
          <>
            <AppButton title="Cancel" variant="neutralSoft" fullWidth={false} onPress={closeRemarkModal} />
            <AppButton title="Save" icon="checkmark-outline" variant={remarkStatus === 'Completed' ? 'success' : 'primary'} fullWidth={false} onPress={saveRemarkAndUpdate} />
          </>
        }
      >
        <AppInput
          label="Have Done"
          required
          value={remarkText}
          onChangeText={setRemarkText}
          placeholder="Describe the work done / reason"
          multiline
          style={styles.modalField}
        />
        <AppInput
          label="Amount"
          helper="Optional"
          icon="cash-outline"
          value={remarkAmount}
          onChangeText={(value) => {
            // Allow only numbers and decimal point
            const numericValue = value.replace(/[^0-9.]/g, '');
            setRemarkAmount(numericValue);
          }}
          placeholder="e.g. 500"
          keyboardType="numeric"
        />
      </AppModal>

      {/* Amount Modal for Delivered Items */}
      <AppModal
        visible={amountModalVisible}
        onClose={closeAmountModal}
        dismissable={!savingDelivered}
        title="Mark as Delivered"
        subtitle={amountTarget ? `#${amountTarget.uniqueId} · ${amountTarget.customerName}` : undefined}
        footer={
          <>
            <AppButton title="Cancel" variant="neutralSoft" fullWidth={false} onPress={closeAmountModal} disabled={savingDelivered} />
            <AppButton
              title="Mark Delivered"
              icon="cube-outline"
              fullWidth={false}
              onPress={saveAmountAndMarkAsDelivered}
              loading={savingDelivered}
              disabled={savingDelivered}
            />
          </>
        }
      >
        <Text style={styles.modalLabel}>Delivery date</Text>
        <TouchableOpacity style={styles.dateField} onPress={() => setShowDeliveryDatePicker(true)} activeOpacity={0.7}>
          <Icon name="calendar-outline" size={18} color={colors.primary} />
          <Text style={styles.dateFieldText}>{formatDate(deliveryDate)}</Text>
          <Icon name="create-outline" size={16} color={colors.textMuted} />
        </TouchableOpacity>
        {showDeliveryDatePicker && (
          <>
            <DateTimePicker
              value={deliveryDate || new Date()}
              mode="date"
              display={Platform.OS === 'ios' ? 'inline' : 'default'}
              onChange={(e, selectedDate) => {
                if (Platform.OS === 'android') setShowDeliveryDatePicker(false);
                if (selectedDate) setDeliveryDate(selectedDate);
              }}
            />
            {Platform.OS === 'ios' && (
              <AppButton title="Done" size="sm" variant="secondary" fullWidth={false} onPress={() => setShowDeliveryDatePicker(false)} style={styles.doneBtn} />
            )}
          </>
        )}
        <AppInput
          label="Amount"
          helper="Optional"
          icon="cash-outline"
          value={amountText}
          onChangeText={setAmountText}
          placeholder="e.g. 500"
          keyboardType="numeric"
          style={styles.modalFieldTop}
        />
      </AppModal>

      {/* Phone Number Selection Modal */}
      <AppModal visible={phoneModalVisible} onClose={() => setPhoneModalVisible(false)} variant="sheet" title="Select phone number" subtitle="This customer has more than one number">
        {phoneNumbers.map((phone, index) => (
          <TouchableOpacity key={index} style={styles.phoneOption} onPress={() => handlePhoneSelect(phone)} activeOpacity={0.8}>
            <View style={styles.phoneIcon}>
              <Icon name="call" size={18} color={colors.primary} />
            </View>
            <Text style={styles.phoneText}>{phone}</Text>
            <Icon name="chevron-forward" size={18} color={colors.textMuted} />
          </TouchableOpacity>
        ))}
        <AppButton title="Cancel" variant="neutralSoft" onPress={() => setPhoneModalVisible(false)} style={styles.phoneCancel} />
      </AppModal>
    </Screen>
  );
}

const styles = StyleSheet.create({
  tabsWrap: { paddingHorizontal: spacing.lg, paddingTop: spacing.lg, paddingBottom: spacing.sm },
  listContent: { padding: spacing.lg, paddingTop: spacing.sm, paddingBottom: spacing.xxxl },
  emptyListContent: { flexGrow: 1, justifyContent: 'center' },
  repairCard: { marginBottom: spacing.md, padding: spacing.md },
  cardHeader: { flexDirection: 'row', alignItems: 'center' },
  idChip: {
    backgroundColor: colors.primarySoft,
    borderRadius: radii.sm,
    paddingHorizontal: 8,
    paddingVertical: 6,
    marginRight: spacing.md,
    minWidth: 44,
    alignItems: 'center',
  },
  idChipText: { color: colors.primaryDark, fontWeight: '800', fontSize: 13 },
  headerText: { flex: 1, paddingRight: spacing.sm },
  customerName: { fontSize: 16, fontWeight: '800', color: colors.text },
  metaLine: { fontSize: 12, color: colors.textMuted, fontWeight: '600', marginTop: 2 },
  headerRight: { alignItems: 'flex-end', gap: 4 },
  chevron: { marginTop: 2 },
  details: { marginTop: spacing.md, paddingTop: spacing.xs, borderTopWidth: 1, borderTopColor: colors.border },
  secondaryActions: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md },
  actionRow: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md },
  flexBtn: { flex: 1, paddingHorizontal: 6 },

  modalField: { marginBottom: spacing.lg },
  modalFieldTop: { marginTop: spacing.lg },
  modalLabel: { fontSize: 13, fontWeight: '700', color: colors.textSecondary, marginBottom: 6 },
  dateField: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    minHeight: 50,
  },
  dateFieldText: { flex: 1, fontSize: 15, fontWeight: '700', color: colors.text },
  doneBtn: { alignSelf: 'flex-end', marginTop: spacing.sm },

  phoneOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: 12,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.surfaceMuted,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.sm,
  },
  phoneIcon: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' },
  phoneText: { flex: 1, fontSize: 16, fontWeight: '700', color: colors.text },
  phoneCancel: { marginTop: spacing.sm },
});
