import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, Alert, Modal, TouchableOpacity } from 'react-native';
import AppHeader from '../../components/AppHeader';
import AttendanceCalendar from '../../components/AttendanceCalendar';
import { adminSetAttendance } from '../../services/api';
import { colors } from '../../ui/Theme';

export default function AdminAttendanceEditScreen({ route, navigation }) {
  const { employeeId, username } = route.params || {};
  const [refreshToken, setRefreshToken] = useState(0);
  const [sheet, setSheet] = useState({ visible: false, key: null, present: false, isFuture: false });

  const applySet = async (key, present) => {
    try {
      const res = await adminSetAttendance(employeeId, key, present, username);
      if (res.success) {
        return true;
      }
      Alert.alert('Error', res.message || 'Failed to update attendance');
      return false;
    } catch (e) {
      Alert.alert('Error', e.message || 'Failed to update attendance');
      return false;
    } finally {
      setRefreshToken(Date.now());
    }
  };

  const onPressDay = ({ key, present, isFuture }) => {
    if (isFuture) return; // do nothing for future
    setSheet({ visible: true, key, present, isFuture });
  };

  const onChoose = async (present) => {
    const key = sheet.key;
    setSheet(s => ({ ...s, visible: false }));
    if (!key) return;
    const ok = await applySet(key, present);
    if (!ok) return;
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={{ marginHorizontal: -20, marginTop: -20 }}>
        <AppHeader title={`${username || ''}`} showBrand={false} onBackPress={() => navigation.goBack()} />
      </View>
      <Text style={styles.caption}>Tap a past date to toggle Present/Absent</Text>
      <AttendanceCalendar employeeId={employeeId} editable onPressDay={onPressDay} refreshToken={refreshToken} />

      <Modal visible={sheet.visible} transparent animationType="fade" onRequestClose={() => setSheet(s => ({ ...s, visible: false }))}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>{sheet.key}</Text>
            <Text style={styles.modalSub}>Current: {sheet.present ? 'Present' : 'Absent'}</Text>
            <View style={{ height: 10 }} />
            <TouchableOpacity style={[styles.modalBtn, { backgroundColor: '#2E7D32' }]} onPress={() => onChoose(true)}>
              <Text style={styles.modalBtnText}>Mark Present</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.modalBtn, { backgroundColor: '#C62828', marginTop: 8 }]} onPress={() => onChoose(false)}>
              <Text style={styles.modalBtnText}>Mark Absent</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.modalBtn, { backgroundColor: '#455A64', marginTop: 8 }]} onPress={() => setSheet(s => ({ ...s, visible: false }))}>
              <Text style={styles.modalBtnText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#F5F7FB' },
  caption: { color: colors.muted || '#607D8B', marginVertical: 10, fontWeight: '700' },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', alignItems: 'center', justifyContent: 'center' },
  modalCard: { width: '80%', backgroundColor: '#fff', borderRadius: 12, padding: 16 },
  modalTitle: { fontWeight: '800', fontSize: 16, color: '#263238' },
  modalSub: { marginTop: 4, color: '#607D8B', fontWeight: '700' },
  modalBtn: { paddingVertical: 12, borderRadius: 10, alignItems: 'center' },
  modalBtnText: { color: '#fff', fontWeight: '800' },
});


