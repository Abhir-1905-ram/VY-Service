import React from 'react';
import { View, Text, StyleSheet, SafeAreaView } from 'react-native';
import AppHeader from '../../components/AppHeader';
import AppCard from '../../components/AppCard';
import { colors } from '../../ui/Theme';

export default function EmployeeDetailsScreen({ route, navigation }) {
  const { employee } = route.params || {};
  if (!employee) return <SafeAreaView><Text style={{ padding: 20 }}>No employee</Text></SafeAreaView>;
  return (
    <SafeAreaView style={styles.container}>
      <View style={{ marginHorizontal: -20, marginTop: -20 }}>
        <AppHeader title="Employee Details" showBrand={false} onBackPress={() => navigation.goBack()} />
      </View>
      <AppCard>
        <Text style={styles.title}>Employee Details</Text>
        <Text style={styles.row}>Username: {employee.username}</Text>
        <Text style={styles.row}>Password: {employee.password}</Text>
        <Text style={styles.row}>Approved: {employee.isApproved ? 'Yes' : 'No'}</Text>
        <Text style={styles.row}>ID: {employee._id}</Text>
      </AppCard>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#F5F7FB' },
  title: { fontSize: 20, fontWeight: '800', marginBottom: 12, color: colors.text },
  row: { fontSize: 14, marginBottom: 8, color: '#37474F' },
});



