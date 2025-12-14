import React, { useContext } from 'react';
import { View, Text, StyleSheet, SafeAreaView } from 'react-native';
import { AuthContext } from '../../contexts/AuthContext';
import AppButton from '../../components/AppButton';
import { colors } from '../../ui/Theme';
import ActionCardButton from '../../components/ActionCardButton';
import AppHeader from '../../components/AppHeader';

export default function EmployeeDashboard({ navigation }) {
  const { signOut, user } = useContext(AuthContext);
  return (
    <SafeAreaView style={styles.container}>
      <View style={{ marginHorizontal: -20, marginTop: -20 }}>
        <AppHeader title="Employee" onProfilePress={() => navigation.navigate('EmployeeProfile')} />
      </View>
      <Text style={styles.title}>Welcome, {user?.username}</Text>
      <View style={{ marginTop: 16 }}>
        <ActionCardButton
          title="Repair & Service"
          subtitle="Add new request"
          icon="construct-outline"
          // no accent strip
          onPress={() => navigation.navigate('AddRepair')}
        />
        <ActionCardButton
          title="My Repair List"
          subtitle="Track your items"
          icon="clipboard-outline"
          // no accent strip
          onPress={() => navigation.navigate('MyRepairs')}
        />
        <ActionCardButton
          title="Attendance"
          subtitle="Mark today"
          icon="calendar-outline"
          onPress={() => navigation.navigate('Attendance')}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#F5F7FB' },
  title: { fontSize: 20, fontWeight: '800', marginTop: 25, marginBottom: 16, color: colors.text },
  // removed top stat boxes per request
});



