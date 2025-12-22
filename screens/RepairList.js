import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  Alert,
  SafeAreaView,
  StatusBar,
  RefreshControl,
  Linking,
  Modal,
} from 'react-native';
import AppCard from '../components/AppCard';
import StatusBadge from '../components/StatusBadge';
import AppButton from '../components/AppButton';
import AppHeader from '../components/AppHeader';
import { getRepairs, updateRepair } from '../services/api';
import { colors, spacing, radii } from '../utils/theme';
import { formatDate, formatTime, getCurrentDateTime, parseDateTime } from '../utils/dateTime';

export default function RepairList({ navigation, isAdmin = false }) {
  const [repairs, setRepairs] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [activeTab, setActiveTab] = useState('Pending'); // 'Pending', 'Completed', 'Delivered'
  const [expanded, setExpanded] = useState({}); // id -> boolean
  const [searchId, setSearchId] = useState('');
  const [remarkModalVisible, setRemarkModalVisible] = useState(false);
  const [remarkText, setRemarkText] = useState('');
  const [remarkTarget, setRemarkTarget] = useState(null); // repair object
  const [remarkStatus, setRemarkStatus] = useState(null); // 'Completed' | 'Not Completed'
  const [amountModalVisible, setAmountModalVisible] = useState(false);
  const [amountText, setAmountText] = useState('');
  const [amountTarget, setAmountTarget] = useState(null); // repair object

  useEffect(() => {
    loadRepairs();
  }, []);

  const loadRepairs = async () => {
    try {
      setLoading(true);
      console.log('Loading repairs...');
      const response = await getRepairs();
      console.log('Load repairs response:', response);
      
      if (response.success) {
        setErrorMessage('');
        const repairsData = response.data || [];
        console.log('Setting repairs:', repairsData.length, 'items');
        setRepairs(repairsData);
        
        if (repairsData.length === 0) {
          console.log('No repairs found in database');
        }
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
    setRemarkModalVisible(true);
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
    try {
      const response = await updateRepair(remarkTarget._id, {
        status: remarkStatus,
        remark: trimmed,
      });
      if (response.success) {
        setRemarkModalVisible(false);
        setRemarkText('');
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

  const handleMarkAsDelivered = async (repair) => {
    // Open amount modal first (amount is optional)
    setAmountTarget(repair);
    setAmountText('');
    setAmountModalVisible(true);
  };

  const saveAmountAndMarkAsDelivered = async () => {
    if (!amountTarget) {
      setAmountModalVisible(false);
      return;
    }

    try {
      const { date, time } = getCurrentDateTime();
      const dateTimeString = `${date} ${time}`;
      const deliveredAt = parseDateTime(dateTimeString);

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
      
      if (response.success) {
        setAmountModalVisible(false);
        setAmountText('');
        setAmountTarget(null);
        Alert.alert('Success', 'Repair marked as delivered successfully!');
        loadRepairs();
      } else {
        Alert.alert('Error', response.message || 'Failed to update repair');
      }
    } catch (error) {
      Alert.alert('Error', error.message || 'Failed to update repair');
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

    const phoneUrl = `tel:${phoneNumber}`;
    Linking.canOpenURL(phoneUrl)
      .then((supported) => {
        if (supported) {
          return Linking.openURL(phoneUrl);
        } else {
          Alert.alert('Error', 'Phone calls are not supported on this device');
        }
      })
      .catch((error) => {
        Alert.alert('Error', 'Failed to make phone call');
        console.error('Call error:', error);
      });
  };

  // No previous problems section on list view per request

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
    const deliveredTime = item.deliveredAt ? formatTime(item.deliveredAt) : null;
    
    const isDelivered = !!item.deliveredAt;
    const badgeStyle = isDelivered
      ? (item.status === 'Not Completed' ? styles.statusNotCompleted : styles.statusDelivered)
      : (item.status === 'Completed'
          ? styles.statusCompleted
          : item.status === 'Not Completed'
            ? styles.statusNotCompleted
            : styles.statusPending);
    const badgeText = isDelivered ? `${item.status} - Delivered` : item.status;
    return (
      <AppCard style={styles.repairCard}>
        <View style={styles.cardHeader}>
          <View style={styles.headerLeft}>
            <Text style={styles.customerName}>{item.customerName}</Text>
            <Text style={styles.repairId}>ID: {item.uniqueId}</Text>
          </View>
          <View style={styles.headerRight}>
            <TouchableOpacity
              onPress={() => {
                const next = !isExpanded;
                setExpanded(prev => ({ ...prev, [idKey]: next }));
              }}
              style={styles.expandButton}
              accessibilityLabel={isExpanded ? 'Collapse details' : 'Expand details'}
            >
              <Text style={styles.expandIcon}>{isExpanded ? '▲' : '▼'}</Text>
            </TouchableOpacity>
            <StatusBadge status={badgeText} />
          </View>
        </View>
        
        {isExpanded && (
          <View style={styles.repairDetails}>
            <View style={styles.detailRow}>
              <Text style={styles.detailText}>
                <Text style={styles.detailLabel}>Type: </Text>
                {item.type}
              </Text>
            </View>
            {item.brand && (
              <View style={styles.detailRow}>
                <Text style={styles.detailText}>
                  <Text style={styles.detailLabel}>Brand: </Text>
                  {item.brand}
                </Text>
              </View>
            )}
            <View style={styles.detailRow}>
              <Text style={styles.detailText}>
                <Text style={styles.detailLabel}>Problem: </Text>
                {item.problem}
              </Text>
            </View>
            {!!item.remark && (
              <View style={styles.detailRow}>
                <Text style={styles.detailText}>
                  <Text style={styles.detailLabel}>Have Done: </Text>
                  {item.remark}
                </Text>
              </View>
            )}
            <View style={styles.detailRow}>
              <Text style={styles.detailText}>
                <Text style={styles.detailLabel}>Given Date: </Text>
                {createdDate} {createdTime}
              </Text>
            </View>
            {isDelivered && deliveredDate && (
              <View style={styles.detailRow}>
                <Text style={styles.detailText}>
                  <Text style={styles.detailLabel}>Delivered Date: </Text>
                  {deliveredDate} {deliveredTime}
                </Text>
              </View>
            )}
            {isDelivered && item.amount && (
              <View style={styles.detailRow}>
                <Text style={styles.detailText}>
                  <Text style={styles.detailLabel}>Amount: </Text>
                  ₹{item.amount.toFixed(2)}
                </Text>
              </View>
            )}
            {/* Previous problems removed as requested */}
            {isAdmin && (
              <View style={{ marginTop: 8, flexDirection: 'row' }}>
                <TouchableOpacity
                  style={[styles.actionButton, { backgroundColor: '#455A64' }]}
                  onPress={() => navigation && navigation.navigate && navigation.navigate('AdminRepairEdit', { repair: item })}
                >
                  <Text style={styles.deliveredButtonText}>Edit</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}

        {item.status === 'Pending' && (
          <View style={styles.actionButtonsContainer}>
            <TouchableOpacity
              style={[styles.actionButton, styles.callButton]}
              onPress={() => handleMarkAsCompleted(item)}
            >
              <Text style={styles.callButtonText}>Completed</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionButton, styles.notCompletedButton]}
              onPress={() => handleMarkAsNotCompleted(item)}
            >
              <Text style={styles.deliveredButtonText}>Not Completed</Text>
            </TouchableOpacity>
          </View>
        )}
        {(item.status === 'Completed' || item.status === 'Not Completed') && !item.deliveredAt && (
          <View style={styles.actionButtonsContainer}>
            <TouchableOpacity
              style={[styles.actionButton, styles.callButton]}
              onPress={() => handleCall(item.phoneNumber)}
            >
              <Text style={styles.callButtonText}>Call</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionButton, styles.deliveredButton]}
              onPress={() => handleMarkAsDelivered(item)}
            >
              <Text style={styles.deliveredButtonText}>Delivered</Text>
            </TouchableOpacity>
            {isAdmin && (
              <TouchableOpacity
                style={[styles.actionButton, styles.pendingButton]}
                onPress={() => handleMarkAsPending(item)}
              >
                <Text style={styles.deliveredButtonText}>Pending</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
        {isAdmin && activeTab === 'Delivered' && !!item.deliveredAt && (
          <View style={styles.actionButtonsContainer}>
            <TouchableOpacity
              style={[styles.actionButton, styles.pendingButton]}
              onPress={() => handleMarkAsPending(item)}
            >
              <Text style={styles.deliveredButtonText}>Pending</Text>
            </TouchableOpacity>
      </View>
        )}
      </AppCard>
    );
  };

  return (
    <SafeAreaView style={isAdmin ? styles.containerAdmin : (navigation ? styles.containerAdmin : styles.container)}>
      <StatusBar barStyle="light-content" backgroundColor={colors.primary} translucent={false} />
      {(isAdmin || navigation) ? (
        <>
          <View style={{ marginHorizontal: -20, marginTop: -5 }}>
            <AppHeader title="Repair List" showBrand={false} onBackPress={() => navigation?.goBack()} />
          </View>
          <View style={{ height: 10 }} />
        </>
      ) : (
        <View style={styles.header}>
          <Text style={styles.title}>Repair List</Text>
          <TouchableOpacity onPress={onRefresh} style={styles.refreshButton}>
            <Text style={styles.refreshIcon}>🔄</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Search by ID */}
      <View style={styles.searchBar}>
        <TextInput
          style={styles.searchInput}
          value={searchId}
          onChangeText={setSearchId}
          placeholder="Search by ID"
          placeholderTextColor="#95A5A6"
          keyboardType="numeric"
          returnKeyType="search"
        />
        {searchId.length > 0 && (
          <TouchableOpacity onPress={() => setSearchId('')} style={styles.clearButton}>
            <Text style={styles.clearButtonText}>✕</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Tabs */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'Pending' && styles.activeTab]}
          onPress={() => setActiveTab('Pending')}
        >
          <Text numberOfLines={1} style={[styles.tabText, activeTab === 'Pending' && styles.activeTabText]}>
            Pending ({pendingCount})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'Completed' && styles.activeTab]}
          onPress={() => setActiveTab('Completed')}
        >
          <Text numberOfLines={1} style={[styles.tabText, activeTab === 'Completed' && styles.activeTabText]}>
            Completed ({completedCount})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'Delivered' && styles.activeTab]}
          onPress={() => setActiveTab('Delivered')}
        >
          <Text numberOfLines={1} style={[styles.tabText, activeTab === 'Delivered' && styles.activeTabText]}>
            Delivered ({deliveredCount})
          </Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading repairs...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredRepairs}
          renderItem={renderRepairItem}
          keyExtractor={(item) => item._id || item.uniqueId}
          contentContainerStyle={[
            (isAdmin || navigation) ? { paddingVertical: 12, paddingBottom: 90 } : styles.listContent,
            filteredRepairs.length === 0 && styles.emptyListContent
          ]}
          ItemSeparatorComponent={(isAdmin || navigation) ? () => <View style={{ height: 6 }} /> : null}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>
                {activeTab === 'Pending'
                  ? 'No pending repairs'
                  : activeTab === 'Completed'
                    ? 'No completed repairs'
                    : 'No delivered repairs'}
              </Text>
              <Text style={styles.emptySubtext}>
                Pull down to refresh
              </Text>
              {!!errorMessage && (
                <View style={{ marginTop: 12, alignItems: 'center' }}>
                  <Text style={{ color: '#DC2626', marginBottom: 8 }}>{errorMessage}</Text>
                  <AppButton title="Retry" icon="refresh-outline" onPress={onRefresh} />
                </View>
              )}
            </View>
          }
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* Remark Modal */}
      <Modal
        visible={remarkModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setRemarkModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>{remarkStatus === 'Completed' ? 'Completed - Have Done' : 'Not Completed - Have Done'}</Text>
            <TextInput
              style={styles.modalInput}
              value={remarkText}
              onChangeText={setRemarkText}
              placeholder="Describe the work done / reason"
              placeholderTextColor="#95A5A6"
              multiline
            />
            <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginTop: 10 }}>
              <TouchableOpacity style={[styles.modalBtn, { backgroundColor: '#9E9E9E' }]} onPress={() => setRemarkModalVisible(false)}>
                <Text style={styles.modalBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalBtn, { backgroundColor: colors.secondary, marginLeft: 8 }]} onPress={saveRemarkAndUpdate}>
                <Text style={styles.modalBtnText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Amount Modal for Delivered Items */}
      <Modal
        visible={amountModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setAmountModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Mark as Delivered</Text>
            <Text style={styles.modalSubtitle}>Enter amount (optional)</Text>
            <TextInput
              style={[styles.modalInput, { minHeight: 50, textAlignVertical: 'center' }]}
              value={amountText}
              onChangeText={setAmountText}
              placeholder="Enter amount (e.g., 500)"
              placeholderTextColor="#95A5A6"
              keyboardType="numeric"
            />
            <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginTop: 10 }}>
              <TouchableOpacity style={[styles.modalBtn, { backgroundColor: '#9E9E9E' }]} onPress={() => {
                setAmountModalVisible(false);
                setAmountText('');
                setAmountTarget(null);
              }}>
                <Text style={styles.modalBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalBtn, { backgroundColor: colors.secondary, marginLeft: 8 }]} onPress={saveAmountAndMarkAsDelivered}>
                <Text style={styles.modalBtnText}>Mark Delivered</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  containerAdmin: {
    flex: 1,
    padding: 5,
    backgroundColor: '#F5F7FB',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.md,
    backgroundColor: colors.primary,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  title: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#fff',
  },
  refreshButton: {
    padding: spacing.xs + 2,
  },
  refreshIcon: {
    fontSize: 17,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  searchInput: {
    flex: 1,
    borderWidth: 2,
    borderColor: colors.secondary,
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#fff',
    color: '#2C3E50',
    fontSize: 14,
  },
  clearButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ECEFF1',
  },
  clearButtonText: {
    fontSize: 16,
    color: '#546E7A',
    fontWeight: '700',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    paddingHorizontal: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 4,
    alignItems: 'center',
    borderBottomWidth: 3,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: colors.secondary,
  },
  tabText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#7F8C8D',
  },
  activeTabText: {
    color: colors.secondary,
    fontWeight: '700',
  },
  listContent: {
    padding: 12,
    paddingBottom: 90,
    flexGrow: 1,
  },
  emptyListContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingBottom: 90,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  loadingText: {
    fontSize: 16,
    color: '#7F8C8D',
    fontWeight: '500',
  },
  repairCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    marginBottom: 6,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    borderLeftWidth: 4,
    borderLeftColor: colors.secondary,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  expandButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ECEFF1',
  },
  expandIcon: {
    fontSize: 16,
    color: '#2C3E50',
    fontWeight: '700',
  },
  headerLeft: {
    flex: 1,
  },
  customerName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2C3E50',
    marginBottom: 4,
  },
  repairId: {
    fontSize: 13,
    color: '#7F8C8D',
    fontWeight: '500',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 16,
  },
  statusCompleted: {
    backgroundColor: colors.success,
  },
  statusDelivered: {
    backgroundColor: colors.success,
  },
  statusNotCompleted: {
    backgroundColor: '#9E9E9E',
  },
  statusPending: {
    backgroundColor: colors.warning,
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  repairDetails: {
    marginBottom: 14,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  detailText: {
    fontSize: 14,
    color: '#34495E',
    flex: 1,
  },
  detailLabel: {
    fontWeight: '600',
    color: '#2C3E50',
  },
  actionButtonsContainer: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 6,
  },
  actionButton: {
    flex: 1,
    padding: 12,
    borderRadius: 10,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  callButton: {
    backgroundColor: colors.secondary,
  },
  callButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
  notCompletedButton: {
    backgroundColor: '#9E9E9E',
  },
  deliveredButton: {
    backgroundColor: colors.success,
  },
  deliveredButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  pendingButton: {
    backgroundColor: colors.warning,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    padding: 20,
  },
  modalCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#2C3E50',
    marginBottom: 8,
  },
  modalSubtitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#7F8C8D',
    marginBottom: 12,
  },
  modalInput: {
    minHeight: 90,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    color: '#2C3E50',
    textAlignVertical: 'top',
  },
  modalBtn: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  modalBtnText: {
    color: '#fff',
    fontWeight: '800',
  },
  emptyContainer: {
    padding: 60,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 18,
    color: '#7F8C8D',
    fontWeight: '600',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#95A5A6',
  },
});
