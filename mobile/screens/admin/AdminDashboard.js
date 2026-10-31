import React, { useContext, useEffect, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { View, StyleSheet, RefreshControl } from 'react-native';
import { AuthContext } from '../../contexts/AuthContext';
import { getRepairs } from '../../services/api';
import Screen from '../../components/Screen';
import AppHeader from '../../components/AppHeader';
import StatCard from '../../components/StatCard';
import SectionHeader from '../../components/SectionHeader';
import ActionCardButton from '../../components/ActionCardButton';
import LoadingState from '../../components/LoadingState';
import { spacing } from '../../ui/Theme';

export default function AdminDashboard({ navigation }) {
  const { signOut } = useContext(AuthContext);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ pending: 0, completed: 0, delivered: 0 });

  const load = async () => {
    setLoading(true);
    try {
      const res = await getRepairs();
      const repairs = res.success ? res.data : [];
      setStats({
        pending: repairs.filter(r => r.status === 'Pending').length,
        completed: repairs.filter(r => r.status === 'Completed' && !r.deliveredAt).length,
        delivered: repairs.filter(r => !!r.deliveredAt).length,
      });
    } catch {
      setStats({ pending: 0, completed: 0, delivered: 0 });
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);
  useFocusEffect(React.useCallback(() => { load(); }, []));

  return (
    <Screen
      scroll
      header={
        <AppHeader
          showBrand
          title="Admin Dashboard"
          rightAction={{ icon: 'log-out-outline', onPress: signOut, label: 'Log out' }}
        />
      }
      refreshControl={<RefreshControl refreshing={false} onRefresh={load} />}
    >
      <SectionHeader title="Overview" subtitle="Workload at a glance" style={styles.firstSection} />
      {loading ? (
        <LoadingState message="Loading overview..." style={styles.loading} />
      ) : (
        <View style={styles.row}>
          <StatCard compact label="Pending" value={stats.pending} icon="time-outline" tone="warning" />
          <StatCard compact label="Completed" value={stats.completed} icon="checkmark-done-outline" tone="success" />
          <StatCard compact label="Delivered" value={stats.delivered} icon="cube-outline" tone="info" />
        </View>
      )}

      <SectionHeader title="Manage" subtitle="Jump to a workspace" style={styles.section} />
      <ActionCardButton
        title="Repair & Service"
        subtitle="Create new entries"
        icon="construct-outline"
        tone="primary"
        onPress={() => navigation.navigate('AdminRepairAndService')}
      />
      <ActionCardButton
        title="Repair List"
        subtitle="View and update status"
        icon="clipboard-outline"
        tone="info"
        onPress={() => navigation.navigate('AdminRepairs')}
      />
      <ActionCardButton
        title="Employees"
        subtitle="Approve and manage"
        icon="people-outline"
        tone="success"
        onPress={() => navigation.navigate('AdminEmployees')}
      />
      <ActionCardButton
        title="Orders"
        subtitle="Create, approve and deliver"
        icon="bag-handle-outline"
        tone="primary"
        onPress={() => navigation.navigate('AdminOrders')}
      />
      <ActionCardButton
        title="Attendance"
        subtitle="View & edit"
        icon="calendar-outline"
        tone="warning"
        onPress={() => navigation.navigate('AdminAttendanceList')}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  firstSection: { marginTop: 0 },
  section: { marginTop: spacing.lg },
  row: { flexDirection: 'row', gap: spacing.md, marginBottom: spacing.md },
  loading: { paddingVertical: spacing.xl },
});
