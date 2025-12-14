import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TextInput, TouchableOpacity, Switch, Alert, ScrollView } from 'react-native';
import AppHeader from '../../components/AppHeader';
import { colors } from '../../ui/Theme';
import { updateRepair } from '../../services/api';

export default function RepairEditScreen({ route, navigation }) {
  const { repair } = route.params || {};
  const [form, setForm] = useState({
    customerName: repair?.customerName || '',
    phoneNumber: repair?.phoneNumber || '',
    type: repair?.type || '',
    brand: repair?.brand || '',
    problem: repair?.problem || '',
    adapterGiven: !!repair?.adapterGiven,
  });
  const [saving, setSaving] = useState(false);

  const setField = (k, v) => setForm(prev => ({ ...prev, [k]: v }));

  const onSave = async () => {
    if (!repair?._id) {
      Alert.alert('Error', 'Missing repair id');
      return;
    }
    if (!form.customerName.trim() || !form.phoneNumber.trim()) {
      Alert.alert('Error', 'Customer name and phone are required');
      return;
    }
    setSaving(true);
    try {
      const res = await updateRepair(repair._id, {
        customerName: form.customerName.trim(),
        phoneNumber: form.phoneNumber.trim(),
        type: form.type.trim(),
        brand: form.brand.trim(),
        problem: form.problem.trim(),
        adapterGiven: !!form.adapterGiven,
      });
      if (res.success) {
        Alert.alert('Saved', 'Repair updated successfully');
        navigation.goBack();
      } else {
        Alert.alert('Error', res.message || 'Failed to update repair');
      }
    } catch (e) {
      Alert.alert('Error', e.message || 'Failed to update repair');
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={{ marginHorizontal: -20, marginTop: -20 }}>
        <AppHeader title={`Edit Repair: ${repair?.uniqueId || ''}`} showBrand={false} onBackPress={() => navigation.goBack()} />
      </View>
      <ScrollView 
        contentContainerStyle={{ paddingVertical: 10 }}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.label}>Customer Name</Text>
        <TextInput style={styles.input} value={form.customerName} onChangeText={t => setField('customerName', t)} placeholder="Customer Name" />

        <Text style={styles.label}>Phone Number</Text>
        <TextInput style={styles.input} value={form.phoneNumber} onChangeText={t => setField('phoneNumber', t)} keyboardType="phone-pad" placeholder="10-digit phone" />

        <Text style={styles.label}>Type</Text>
        <TextInput style={styles.input} value={form.type} onChangeText={t => setField('type', t)} placeholder="Laptop / Desktop / Printer..." />

        <Text style={styles.label}>Brand</Text>
        <TextInput style={styles.input} value={form.brand} onChangeText={t => setField('brand', t)} placeholder="Dell / HP / Lenovo..." />

        <Text style={styles.label}>Problem</Text>
        <TextInput style={[styles.input, { height: 90 }]} value={form.problem} onChangeText={t => setField('problem', t)} multiline placeholder="Describe problem" />

        <View style={styles.switchRow}>
          <Text style={styles.label}>Adapter Given</Text>
          <Switch value={form.adapterGiven} onValueChange={v => setField('adapterGiven', v)} />
        </View>

        <TouchableOpacity disabled={saving} style={[styles.saveBtn, saving && { opacity: 0.7 }]} onPress={onSave}>
          <Text style={styles.saveTxt}>{saving ? 'Saving...' : 'Save Changes'}</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#F5F7FB' },
  label: { marginTop: 12, fontWeight: '800', color: '#37474F' },
  input: {
    marginTop: 6,
    backgroundColor: '#fff',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: '#263238',
  },
  switchRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 12, backgroundColor: '#fff', borderRadius: 10, borderWidth: 1, borderColor: '#E0E0E0', paddingHorizontal: 12, paddingVertical: 10 },
  saveBtn: { marginTop: 18, backgroundColor: colors.secondary, paddingVertical: 14, borderRadius: 10, alignItems: 'center' },
  saveTxt: { color: '#fff', fontWeight: '800' },
});


