import React, { useContext, useEffect, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, ActivityIndicator } from 'react-native';
import { AuthContext } from '../../contexts/AuthContext';
import { getEmployees, getRepairs, getTodayPresentCount } from '../../services/api';
import AppCard from '../../components/AppCard';
import AppButton from '../../components/AppButton';
import Icon from '../../components/Icon';
import { colors } from '../../ui/Theme';
import ActionCardButton from '../../components/ActionCardButton';
import AppHeader from '../../components/AppHeader';

export default function AdminDashboard({ navigation }) {
  const { signOut } = useContext(AuthContext);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ employees: 0, pending: 0, completed: 0, delivered: 0, presentToday: 0 });

  const load = async () => {
    setLoading(true);
    const [empRes, repRes, presRes] = await Promise.allSettled([getEmployees(), getRepairs(), getTodayPresentCount()]);
    const employees = empRes.status === 'fulfilled' && empRes.value.success ? empRes.value.data.length : 0;
    const repairs = repRes.status === 'fulfilled' && repRes.value.success ? repRes.value.data : [];
    const presentToday = presRes.status === 'fulfilled' && presRes.value.success ? (presRes.value.data?.count || 0) : 0;
    setStats({
      employees,
      pending: repairs.filter(r => r.status === 'Pending').length,
      completed: repairs.filter(r => r.status === 'Completed' && !r.deliveredAt).length,
      delivered: repairs.filter(r => !!r.deliveredAt).length,
      presentToday,
    });
    setLoading(false);
  };

  useEffect(() => { load(); }, []);
  useFocusEffect(React.useCallback(() => { load(); }, []));

  return (
    <SafeAreaView style={styles.container}>
      <View style={{ marginHorizontal: -20, marginTop: -20 }}>
        <AppHeader title="Admin Dashboard" onProfilePress={signOut} rightIconName="log-out-outline" />
      </View>
      {loading ? (
        <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 20 }} />
      ) : (
        <View style={styles.grid}>
          <AppCard style={styles.cardSingle}>
            <Icon name="people-outline" size={26} color={colors.primary} />
            <Text style={styles.cardValue}>{stats.employees}</Text>
            <Text style={styles.cardLabel}>Employees</Text>
          </AppCard>
          <AppCard style={styles.cardSingle}>
            <Icon name="calendar-outline" size={26} color="#2E7D32" />
            <Text style={styles.cardValue}>{stats.presentToday}</Text>
            <Text style={styles.cardLabel}>Present Today</Text>
          </AppCard>
        </View>
      )}
      <View style={{ marginTop: 16 }}>
        <ActionCardButton
          title="Repair & Service"
          subtitle="Create new entries"
          icon="construct-outline"
          // no accent color strip as requested
          onPress={() => navigation.navigate('AdminRepairAndService')}
        />
        <ActionCardButton
          title="Repair List"
          subtitle="View and update status"
          icon="clipboard-outline"
          // no accent color strip as requested
          onPress={() => navigation.navigate('AdminRepairs')}
        />
        <ActionCardButton
          title="Employees"
          subtitle="Approve and manage"
          icon="people-outline"
          // no accent color strip as requested
          onPress={() => navigation.navigate('AdminEmployees')}
        />
        <ActionCardButton
          title="Attendance"
          subtitle="View & edit"
          icon="calendar-outline"
          onPress={() => navigation.navigate('AdminAttendanceList')}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#F5F7FB' },
  title: { fontSize: 24, fontWeight: '800', marginBottom: 12, color: colors.text },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 40 },
  cardSingle: { width: '48%', alignItems: 'center', paddingVertical: 16 },
  cardValue: { fontSize: 22, fontWeight: '800', marginTop: 8, color: colors.text },
  cardLabel: { color: colors.textMuted, fontWeight: '600' },
});



