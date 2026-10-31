import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, Alert, RefreshControl } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { approveEmployee, getEmployees, deleteEmployee } from '../../services/api';
import Screen from '../../components/Screen';
import AppHeader from '../../components/AppHeader';
import AppCard from '../../components/AppCard';
import AppButton from '../../components/AppButton';
import Avatar from '../../components/Avatar';
import LoadingState from '../../components/LoadingState';
import EmptyState from '../../components/EmptyState';
import Icon from '../../components/Icon';
import { colors, spacing, tones, radii } from '../../ui/Theme';

<<<<<<< HEAD
function KindPill({ kind }) {
  const sales = kind === 'sales';
  const t = sales ? tones.info : tones.neutral;
  return (
    <View style={[styles.pill, { backgroundColor: t.soft }]}>
      <Icon name={sales ? 'briefcase-outline' : 'construct-outline'} size={13} color={t.main} />
      <Text style={[styles.pillText, { color: t.main }]}>{sales ? 'Sales' : 'Employee'}</Text>
    </View>
  );
}

=======
>>>>>>> 3e5d7325c20db157f7ce370f6bca04996d1fe0fc
function ApprovalPill({ approved }) {
  const t = approved ? tones.success : tones.warning;
  return (
    <View style={[styles.pill, { backgroundColor: t.soft }]}>
      <Icon name={approved ? 'checkmark-circle' : 'time'} size={13} color={t.main} />
      <Text style={[styles.pillText, { color: t.main }]}>{approved ? 'Approved' : 'Awaiting approval'}</Text>
    </View>
  );
}

export default function EmployeeListScreen({ navigation }) {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const res = await getEmployees();
    if (res.success) setEmployees(res.data);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  // Refresh when screen comes into focus (after returning from details)
  useFocusEffect(
    React.useCallback(() => {
      load();
    }, [])
  );

  const onApprove = async (id) => {
    const res = await approveEmployee(id);
    if (res.success) load();
  };

  const onDelete = (id) => {
    Alert.alert(
      'Delete Employee',
      'Are you sure you want to remove this employee?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            const res = await deleteEmployee(id);
            if (res.success) {
              load();
            } else {
              Alert.alert('Error', res.message || 'Failed to delete');
            }
          },
        },
      ]
    );
  };

  const pendingCount = employees.filter(e => !e.isApproved).length;

  const renderItem = ({ item }) => (
    <AppCard style={styles.card}>
      <View style={styles.top}>
        <Avatar name={item.username} size={46} />
        <View style={styles.identity}>
          <Text style={styles.name} numberOfLines={1}>{item.username}</Text>
<<<<<<< HEAD
          <View style={styles.pills}>
            <ApprovalPill approved={item.isApproved} />
            <KindPill kind={item.employeeKind} />
          </View>
=======
          <ApprovalPill approved={item.isApproved} />
>>>>>>> 3e5d7325c20db157f7ce370f6bca04996d1fe0fc
        </View>
      </View>
      <View style={styles.actions}>
        {!item.isApproved && (
          <AppButton title="Approve" icon="checkmark-outline" variant="success" size="sm" fullWidth={false} onPress={() => onApprove(item._id)} />
        )}
        <AppButton
          title="Details"
          icon="options-outline"
          variant="outline"
          size="sm"
          fullWidth={false}
          onPress={() => navigation.navigate('AdminEmployeeDetails', { employee: item })}
        />
        <AppButton title="Remove" icon="trash-outline" variant="dangerSoft" size="sm" fullWidth={false} onPress={() => onDelete(item._id)} />
      </View>
    </AppCard>
  );

  return (
    <Screen
      padded={false}
      header={
        <AppHeader
          large
          subtitle="Team"
          title="Employees"
          onBackPress={() => navigation.goBack()}
        >
          <Text style={styles.headerMeta}>
            {employees.length} employee{employees.length === 1 ? '' : 's'}
            {pendingCount > 0 ? ` · ${pendingCount} awaiting approval` : ''}
          </Text>
        </AppHeader>
      }
    >
      {loading ? (
        <LoadingState message="Loading employees..." />
      ) : (
        <FlatList
          data={employees}
          keyExtractor={(i) => i._id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={false} onRefresh={load} />}
          ListEmptyComponent={<EmptyState icon="people-outline" title="No employees yet" subtitle="New sign-ups will appear here for approval" />}
          showsVerticalScrollIndicator={false}
        />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  headerMeta: { color: colors.textOnDarkMuted, fontWeight: '600', fontSize: 13 },
  list: { padding: spacing.lg, paddingBottom: spacing.xxxl },
  card: { marginBottom: spacing.md },
  top: { flexDirection: 'row', alignItems: 'center' },
  identity: { flex: 1, marginLeft: spacing.md },
  name: { fontSize: 16, fontWeight: '800', color: colors.text, marginBottom: 4 },
<<<<<<< HEAD
  pills: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
=======
>>>>>>> 3e5d7325c20db157f7ce370f6bca04996d1fe0fc
  pill: { flexDirection: 'row', alignItems: 'center', gap: 4, alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 3, borderRadius: radii.round },
  pillText: { fontSize: 11, fontWeight: '800' },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: spacing.md },
  meta: { color: colors.textMuted, fontSize: 12, fontWeight: '600' },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: spacing.lg },
});
