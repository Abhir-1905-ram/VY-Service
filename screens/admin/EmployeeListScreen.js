import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, FlatList, SafeAreaView, StyleSheet, Alert } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { approveEmployee, getEmployees, deleteEmployee } from '../../services/api';
import AppHeader from '../../components/AppHeader';
import AppCard from '../../components/AppCard';
import { colors } from '../../ui/Theme';

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

  const renderItem = ({ item }) => (
    <AppCard>
      <Text style={styles.name}>{item.username}</Text>
      <Text style={styles.small}>password: {item.password}</Text>
      <Text style={styles.small}>approved: {item.isApproved ? 'yes' : 'no'}</Text>
      <View style={styles.actionsRow}>
        {!item.isApproved && (
          <TouchableOpacity style={styles.btn} onPress={() => onApprove(item._id)}>
            <Text style={styles.btnText}>Approve</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity
          style={[styles.btn, styles.secondary]}
          onPress={() => navigation.navigate('AdminEmployeeDetails', { employee: item })}
        >
          <Text style={styles.btnText}>Details</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.btn, styles.danger]} onPress={() => onDelete(item._id)}>
          <Text style={styles.btnText}>Remove</Text>
        </TouchableOpacity>
      </View>
    </AppCard>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={{ marginHorizontal: -20, marginTop: -20 }}>
        <AppHeader title="Employees" showBrand={false} onBackPress={() => navigation.goBack()} />
      </View>
      {loading ? (
        <Text style={{ padding: 20 }}>Loading...</Text>
      ) : (
        <FlatList
          data={employees}
          keyExtractor={(i) => i._id}
          renderItem={renderItem}
          contentContainerStyle={{ paddingVertical: 12 }}
          ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#F5F7FB' },
  name: { fontSize: 16, fontWeight: '800', color: colors.text, marginBottom: 4 },
  small: { color: '#607D8B', fontSize: 12, marginBottom: 2 },
  actionsRow: { flexDirection: 'row', alignItems: 'center', marginTop: 10 },
  btn: { backgroundColor: '#2E7D32', paddingVertical: 8, paddingHorizontal: 12, borderRadius: 8, marginLeft: 8 },
  secondary: { backgroundColor: '#1976D2' },
  danger: { backgroundColor: '#D32F2F' },
  btnText: { color: '#fff', fontWeight: '700' },
});



