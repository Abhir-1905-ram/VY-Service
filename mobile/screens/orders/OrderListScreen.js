import React, { useCallback, useContext, useMemo, useState } from 'react';
import { View, Text, FlatList, StyleSheet, Alert, RefreshControl, TouchableOpacity } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { AuthContext } from '../../contexts/AuthContext';
import { deleteOrder, getOrders, updateOrderStatus } from '../../services/api';
import { formatDate } from '../../utils/dateTime';
import Screen from '../../components/Screen';
import AppHeader from '../../components/AppHeader';
import AppCard from '../../components/AppCard';
import AppButton from '../../components/AppButton';
import StatusBadge from '../../components/StatusBadge';
import LoadingState from '../../components/LoadingState';
import EmptyState from '../../components/EmptyState';
import Banner from '../../components/Banner';
import SearchBar from '../../components/SearchBar';
import SegmentedTabs from '../../components/SegmentedTabs';
import Icon from '../../components/Icon';
import { colors, radii, spacing } from '../../ui/Theme';

function isToday(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return false;
  const now = new Date();
  return date.getFullYear() === now.getFullYear()
    && date.getMonth() === now.getMonth()
    && date.getDate() === now.getDate();
}

const STEPS = ['Pending', 'Viewed', 'Delivered'];

function StatusTrack({ status }) {
  const current = Math.max(0, STEPS.indexOf(status));
  return (
    <View style={styles.track}>
      {STEPS.map((step, index) => {
        const done = index <= current;
        return (
          <View key={step} style={styles.step}>
            <View style={[styles.dot, done && styles.dotDone]} />
            <Text style={[styles.stepLabel, done && styles.stepLabelDone]}>{step}</Text>
            {index < STEPS.length - 1 ? <View style={[styles.line, index < current && styles.lineDone]} /> : null}
          </View>
        );
      })}
    </View>
  );
}

export default function OrderListScreen({ navigation, route }) {
  const mode = route.params?.mode === 'admin' ? 'admin' : route.params?.mode === 'employee' ? 'employee' : 'sales';
  const formRoute = mode === 'admin' ? 'AdminOrderForm' : mode === 'employee' ? 'EmployeeOrderForm' : 'SalesOrderForm';
  const { user } = useContext(AuthContext);
  const [orders, setOrders] = useState([]);
  const [tab, setTab] = useState('today');
  const [openItems, setOpenItems] = useState({});
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const todayOrders = useMemo(() => orders.filter((order) => isToday(order.createdAt)), [orders]);
  const pastOrders = useMemo(() => orders.filter((order) => !isToday(order.createdAt)), [orders]);
  const filteredPastOrders = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return pastOrders;
    return pastOrders.filter((order) => {
      const shop = String(order.shopName || '').toLowerCase();
      const place = String(order.place || '').toLowerCase();
      return shop.includes(query) || place.includes(query);
    });
  }, [pastOrders, search]);
  const visibleOrders = tab === 'today' ? todayOrders : filteredPastOrders;

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    const res = await getOrders(mode === 'sales' ? user?.id : null);
    if (res.success) setOrders(res.data || []);
    else setError(res.message || 'Could not load orders');
    setLoading(false);
  }, [mode, user?.id]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const onDelete = (order) => {
    Alert.alert('Delete order', `Remove the order for ${order.shopName}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          const res = await deleteOrder(order.id, user?.id);
          if (res.success) load();
          else Alert.alert('Could not delete', res.message || 'Try again');
        },
      },
    ]);
  };

  const onStatus = async (order, status) => {
    const viewerName = user?.role === 'admin' ? 'Admin' : (user?.username || '');
    const res = await updateOrderStatus(order.id, status, viewerName);
    if (res.success) load();
    else Alert.alert('Could not update', res.message || 'Try again');
  };

  const openOrder = (order) => {
    const readOnly = mode === 'employee' || order.status !== 'Pending';
    navigation.navigate(formRoute, { order, readOnly });
  };

  const toggleItems = (id) => {
    setOpenItems((current) => ({ ...current, [id]: !current[id] }));
  };

  const renderItem = ({ item }) => {
    const pending = item.status === 'Pending';
    const viewed = item.status === 'Viewed';
    const itemsOpen = !!openItems[item.id];
    const hasAmount = item.totalAmount !== null && item.totalAmount !== undefined && item.totalAmount !== '';
    return (
      <AppCard style={styles.card}>
        <View style={styles.top}>
          <View style={styles.identity}>
            <Text style={styles.shop} numberOfLines={1}>{item.shopName}</Text>
            <Text style={styles.place} numberOfLines={1}>
              {item.place}{hasAmount ? ` · ₹${Number(item.totalAmount).toLocaleString('en-IN')}` : ''}
            </Text>
            {mode !== 'sales' ? (
              <View style={styles.fromChip}>
                <Icon name="person" size={12} color={colors.primaryDark} />
                <Text style={styles.from} numberOfLines={1}>{item.createdByName || 'Unknown'}</Text>
              </View>
            ) : null}
            {mode === 'sales' && item.viewedByName ? (
              <View style={styles.viewedChip}>
                <Icon name="eye" size={12} color={colors.info} />
                <Text style={styles.viewedBy} numberOfLines={1}>Viewed by {item.viewedByName}</Text>
              </View>
            ) : null}
          </View>
          <View style={styles.side}>
            <StatusBadge status={item.status} size="sm" />
            <TouchableOpacity onPress={() => toggleItems(item.id)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }} style={styles.arrow}>
              <Icon name={itemsOpen ? 'chevron-up' : 'chevron-down'} size={20} color={colors.primaryDark} />
            </TouchableOpacity>
          </View>
        </View>
        {itemsOpen ? (
          <View style={styles.details}>
            <Text style={styles.notes}>{item.notes || 'No items written'}</Text>
            {item.createdAt ? <Text style={styles.meta}>{formatDate(item.createdAt)}</Text> : null}
            <StatusTrack status={item.status} />
          </View>
        ) : null}
        <View style={styles.actions}>
          <AppButton title="View" icon="eye-outline" variant="outline" size="sm" fullWidth={false} onPress={() => openOrder(item)} />
          {(mode === 'sales' || mode === 'admin') && pending ? (
            <AppButton title="Edit" icon="create-outline" variant="outline" size="sm" fullWidth={false} onPress={() => navigation.navigate(formRoute, { order: item })} />
          ) : null}
          {(mode === 'sales' || mode === 'admin') && pending ? (
            <AppButton title="Delete" icon="trash-outline" variant="dangerSoft" size="sm" fullWidth={false} onPress={() => onDelete(item)} />
          ) : null}
          {(mode === 'employee' || mode === 'admin') && pending ? (
            <AppButton title="Viewed" icon="eye-outline" variant="success" size="sm" fullWidth={false} onPress={() => onStatus(item, 'Viewed')} />
          ) : null}
          {(mode === 'employee' || mode === 'admin') && viewed ? (
            <AppButton title="Unviewed" icon="eye-off-outline" variant="outline" size="sm" fullWidth={false} onPress={() => onStatus(item, 'Unviewed')} />
          ) : null}
          {(mode === 'employee' || mode === 'admin') && viewed ? (
            <AppButton title="Delivered" icon="cube-outline" variant="primary" size="sm" fullWidth={false} onPress={() => onStatus(item, 'Delivered')} />
          ) : null}
        </View>
      </AppCard>
    );
  };

  return (
    <Screen
      padded={false}
      header={
        <AppHeader
          large
          subtitle={mode === 'sales' ? 'Your orders' : 'All orders'}
          title="Orders"
          onBackPress={() => navigation.goBack()}
          rightAction={mode === 'employee' ? undefined : { icon: 'add', label: 'New order', onPress: () => navigation.navigate(formRoute) }}
        />
      }
    >
      <View style={styles.tabs}>
        <SegmentedTabs
          value={tab}
          onChange={setTab}
          tabs={[
            { key: 'today', label: 'Today', count: todayOrders.length },
            { key: 'past', label: 'Past', count: pastOrders.length },
          ]}
        />
      </View>
      {tab === 'past' ? (
        <SearchBar
          value={search}
          onChangeText={setSearch}
          placeholder="Search shop name or place"
          style={styles.search}
        />
      ) : null}
      <Banner tone="danger" message={error} style={styles.error} />
      {loading ? (
        <LoadingState message="Loading orders..." />
      ) : (
        <FlatList
          data={visibleOrders}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={false} onRefresh={load} />}
          ListEmptyComponent={
            <EmptyState
              icon="bag-handle-outline"
              title={tab === 'today' ? 'No orders today' : search.trim() ? 'No matching orders' : 'No past orders'}
              subtitle={
                tab === 'today'
                  ? 'Only orders saved today are shown here'
                  : search.trim()
                    ? 'Try another shop name or place'
                    : 'Orders from earlier days are shown here'
              }
            />
          }
          showsVerticalScrollIndicator={false}
        />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  tabs: { paddingHorizontal: spacing.lg, paddingTop: spacing.lg },
  search: { marginHorizontal: spacing.lg, marginTop: spacing.md },
  error: { marginHorizontal: spacing.lg, marginTop: spacing.md },
  list: { padding: spacing.lg, paddingBottom: spacing.xxxl },
  card: { marginBottom: spacing.sm, paddingVertical: spacing.md, paddingHorizontal: spacing.md },
  top: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: spacing.sm },
  identity: { flex: 1 },
  side: { alignItems: 'flex-end', gap: 2 },
  arrow: { marginTop: 2 },
  shop: { fontSize: 15, fontWeight: '800', color: colors.text },
  place: { fontSize: 12, fontWeight: '600', color: colors.textMuted, marginTop: 2 },
  fromChip: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 4,
    marginTop: 4,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: radii.round,
    backgroundColor: colors.primarySoft,
  },
  from: { fontSize: 12, fontWeight: '800', color: colors.primaryDark },
  viewedChip: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 4,
    marginTop: 4,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: radii.round,
    backgroundColor: colors.infoSoft,
  },
  viewedBy: { fontSize: 12, fontWeight: '800', color: colors.info },
  details: { marginTop: spacing.sm, paddingTop: spacing.sm, borderTopWidth: 1, borderTopColor: colors.border },
  notes: { fontSize: 13, lineHeight: 18, color: colors.textSecondary },
  meta: { marginTop: spacing.xs, fontSize: 12, fontWeight: '600', color: colors.textMuted },
  track: { flexDirection: 'row', alignItems: 'center', marginTop: spacing.sm },
  step: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.borderStrong, marginRight: 4 },
  dotDone: { backgroundColor: colors.primary },
  stepLabel: { fontSize: 11, fontWeight: '700', color: colors.textMuted },
  stepLabelDone: { color: colors.primaryDark },
  line: { flex: 1, height: 2, backgroundColor: colors.border, marginHorizontal: 6 },
  lineDone: { backgroundColor: colors.primary },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: spacing.sm },
});
