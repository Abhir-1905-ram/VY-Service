import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView } from 'react-native';
import { updateRepair } from '../../services/api';
import AppHeader from '../../components/AppHeader';
import AppCard from '../../components/AppCard';
import { colors } from '../../ui/Theme';

export default function RepairStatusUpdateScreen({ route, navigation }) {
  const { repair } = route.params || {};
  const update = async (data) => {
    const res = await updateRepair(repair._id, data);
    if (res.success) navigation.goBack();
  };
  if (!repair) return <SafeAreaView style={styles.container}><Text style={{ padding: 20 }}>No repair</Text></SafeAreaView>;
  return (
    <SafeAreaView style={styles.container}>
      <View style={{ marginHorizontal: -20, marginTop: -20 }}>
        <AppHeader title="Update Status" showBrand={false} onBackPress={() => navigation.goBack()} />
      </View>
      <AppCard>
        <Text style={styles.title}>Update Status</Text>
        <Text style={styles.row}>Current: {repair.status}</Text>
        <View style={{ marginTop: 12 }}>
          <TouchableOpacity style={styles.btn} onPress={() => update({ status: 'Completed', deliveredAt: null })}>
            <Text style={styles.btnText}>Pending → Completed</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.btn} onPress={() => update({ deliveredAt: new Date().toISOString() })}>
            <Text style={styles.btnText}>Completed → Delivered</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.btn} onPress={() => update({ status: 'Completed', deliveredAt: null })}>
            <Text style={styles.btnText}>Delivered → Completed</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.btn} onPress={() => update({ status: 'Pending', deliveredAt: null })}>
            <Text style={styles.btnText}>Completed → Pending</Text>
          </TouchableOpacity>
        </View>
      </AppCard>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#F5F7FB' },
  title: { fontSize: 20, fontWeight: '800', marginBottom: 12, color: colors.text },
  row: { marginBottom: 12, color: '#37474F' },
  btn: { backgroundColor: '#1976D2', padding: 14, borderRadius: 10, alignItems: 'center', marginBottom: 10 },
  btnText: { color: '#fff', fontWeight: '700' },
});



