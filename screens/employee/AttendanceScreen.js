import React, { useContext, useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, Platform, Alert, ScrollView, RefreshControl } from 'react-native';
import * as Network from 'expo-network';
import * as Location from 'expo-location';
import { AuthContext } from '../../contexts/AuthContext';
import { markAttendance, checkAttendanceIp, getAttendanceByMonth } from '../../services/api';
import AttendanceCalendar from '../../components/AttendanceCalendar';
import AppHeader from '../../components/AppHeader';
import { colors } from '../../ui/Theme';

function showToast(message, title = 'Message') {
  Alert.alert(title, message);
}

export default function AttendanceScreen({ navigation }) {
  const { user } = useContext(AuthContext);
  const [submitting, setSubmitting] = useState(false);
  const [lastIp, setLastIp] = useState('');
  const [lastLoc, setLastLoc] = useState(null);
  const [markedToday, setMarkedToday] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [refreshToken, setRefreshToken] = useState(0);

  const toYyyyMmDd = (date = new Date()) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  const refreshMarkedToday = async () => {
    if (!user?.id) return;
    const now = new Date();
    const yyyyMm = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const todayKey = toYyyyMmDd(now);
    try {
      const res = await getAttendanceByMonth(user.id, yyyyMm);
      if (res?.success && Array.isArray(res.data)) {
        setMarkedToday(res.data.includes(todayKey));
      }
    } catch {}
  };

  React.useEffect(() => {
    refreshMarkedToday();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, refreshToken]);

  const handleMark = async () => {
    if (markedToday) {
      showToast('Already you have given attendance');
      return;
    }
    if (!user?.id) {
      Alert.alert('Error', 'Missing employee id');
      return;
    }
    setSubmitting(true);
    try {
      const ip = await Network.getIpAddressAsync();
      setLastIp(ip || '');
      // Request location permission and fetch coords
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        showToast('Location permission denied');
        setSubmitting(false);
        return;
      }
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      setLastLoc(loc?.coords || null);
      const res = await markAttendance(
        user.id,
        ip || '',
        undefined,
        loc?.coords?.latitude,
        loc?.coords?.longitude,
        loc?.coords?.accuracy,
        user?.username
      );
      if (res.success) {
        if (res.data?.alreadyMarked) {
          showToast('Already you have given attendance');
        } else {
          showToast('Attendance marked successfully');
        }
        setMarkedToday(true);
        setRefreshToken(Date.now()); // refresh calendar
      } else {
        showToast(res.message || 'Could not mark attendance');
      }
    } catch (e) {
      showToast(e.message || 'Could not read network info');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCheck = async () => {
    if (markedToday) {
      showToast('Already you have given attendance');
      return;
    }
    try {
      const ip = await Network.getIpAddressAsync();
      setLastIp(ip || '');
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        showToast('Location permission denied');
        return;
      }
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      setLastLoc(loc?.coords || null);
      const res = await checkAttendanceIp(ip || '', loc?.coords?.latitude, loc?.coords?.longitude);
      if (res.success) {
        const officeHint = res.data?.officeCidr || res.data?.officeIp || 'office WiFi';
        const ipOk = !!res.data?.ipMatch;
        const locOk = !!res.data?.locationMatch;
        const ipLine = `WiFi: ${ipOk ? 'OK' : 'Not OK'} (${officeHint})`;
        const locLine = `Location: ${locOk ? 'OK' : 'Not OK'}${res.data?.radiusM ? ` (<= ${Math.round(res.data.radiusM)}m)` : ''}`;
        const msg = `IP: ${res.data?.ip || ip}\n${ipLine}\n${locLine}`;
        Alert.alert('Attendance Check', msg);
      } else {
        showToast(res.message || 'Check failed');
      }
    } catch (e) {
      showToast(e.message || 'Could not read network info');
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    setRefreshToken(Date.now());
    setTimeout(() => setRefreshing(false), 600);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={{ marginHorizontal: -20, marginTop: -5 }}>
        <AppHeader title="Attendance" showBrand={false} onBackPress={() => navigation?.goBack()} />
      </View>
      <ScrollView
        contentContainerStyle={{ paddingBottom: 90 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        showsVerticalScrollIndicator={false}
      >
        <View style={{ marginTop: 10 }} />
        <View style={styles.card}>
          <Text style={styles.title}>Attendance</Text>
          <TouchableOpacity style={[styles.button, styles.secondaryBtn, markedToday && styles.buttonDisabled]} onPress={handleCheck}>
            <Text style={styles.buttonText}>Check </Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.button, (submitting || markedToday) && styles.buttonDisabled]} onPress={handleMark}>
            <Text style={styles.buttonText}>{submitting ? 'Marking...' : (markedToday ? 'Marked for Today' : 'Mark Attendance')}</Text>
          </TouchableOpacity>
        </View>
        <View style={{ height: 12 }} />
        <AttendanceCalendar attendanceGiven={[]} employeeId={user?.id} refreshToken={refreshToken} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#F5F7FB', paddingTop: 0 },
  card: { backgroundColor: '#fff', padding: 20, borderRadius: 16, elevation: 2 },
  title: { fontSize: 20, fontWeight: '800', color: '#2C3E50', marginBottom: 8 },
  subtle: { color: '#607D8B', marginBottom: 12 },
  button: { backgroundColor: colors.secondary, paddingVertical: 14, borderRadius: 10, alignItems: 'center', marginTop: 6 },
  secondaryBtn: { backgroundColor: '#455A64' },
  buttonDisabled: { opacity: 0.7 },
  buttonText: { color: '#fff', fontWeight: '800' },
  note: { marginTop: 10, color: '#78909C' },
});


