import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, FlatList, TouchableOpacity } from 'react-native';
import { getEmployees } from '../../services/api';
import { colors } from '../../ui/Theme';
import AppHeader from '../../components/AppHeader';
import AppCard from '../../components/AppCard';

export default function AdminAttendanceListScreen({ navigation }) {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await getEmployees();
      if (res.success) setEmployees(res.data || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const renderItem = ({ item }) => (
    <AppCard>
      <View style={styles.row}>
        <Text style={styles.name}>{item.username}</Text>
        <TouchableOpacity style={styles.btn} onPress={() => navigation.navigate('AdminAttendanceEdit', { employeeId: item._id || item.id, username: item.username })}>
          <Text style={styles.btnText}>View Attendance</Text>
        </TouchableOpacity>
      </View>
    </AppCard>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={{ marginHorizontal: -20, marginTop: -20 }}>
        <AppHeader title="Attendance" showBrand={false} onBackPress={() => navigation.goBack()} />
      </View>
      <FlatList
        data={employees}
        refreshing={loading}
        onRefresh={load}
        keyExtractor={(item) => (item._id || item.id)}
        contentContainerStyle={{ paddingVertical: 12 }}
        ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
        renderItem={renderItem}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#F5F7FB' },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  name: { fontSize: 16, fontWeight: '800', color: colors.text },
  btn: { backgroundColor: colors.secondary, paddingVertical: 10, paddingHorizontal: 12, borderRadius: 10 },
  btnText: { color: '#fff', fontWeight: '800' },
});


