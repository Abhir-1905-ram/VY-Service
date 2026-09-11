import React, { useContext, useState, useEffect } from 'react';
import { View, Text, StyleSheet, Alert, RefreshControl } from 'react-native';
import * as Network from 'expo-network';
import * as Location from 'expo-location';
import { AuthContext } from '../../contexts/AuthContext';
import { markAttendance, checkAttendanceIp, getAttendanceByMonth, getEmployeeCards } from '../../services/api';
import AttendanceCalendar from '../../components/AttendanceCalendar';
import Screen from '../../components/Screen';
import AppHeader from '../../components/AppHeader';
import AppCard from '../../components/AppCard';
import AppButton from '../../components/AppButton';
import LoadingState from '../../components/LoadingState';
import EmptyState from '../../components/EmptyState';
import SectionHeader from '../../components/SectionHeader';
import Icon from '../../components/Icon';
import { colors, spacing, tones, radii } from '../../ui/Theme';

function showToast(message, title = 'Message') {
  Alert.alert(title, message);
}

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export default function AttendanceScreen({ navigation }) {
  const { user } = useContext(AuthContext);
  const [hasPermission, setHasPermission] = useState(false);
  const [checkingPermission, setCheckingPermission] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [checking, setChecking] = useState(false);
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

  useEffect(() => {
    checkPermission();
  }, [user?.id]);

  const checkPermission = async () => {
    if (!user?.id) {
      setHasPermission(false);
      setCheckingPermission(false);
      Alert.alert(
        'Access Denied',
        'Unable to verify permissions.',
        [{ text: 'OK', onPress: () => navigation?.goBack() }]
      );
      return;
    }

    try {
      const res = await getEmployeeCards(user.id);
      if (res.success && res.data?.allowedCards) {
        const allowed = res.data.allowedCards.includes('attendance');
        setHasPermission(allowed);
        if (!allowed) {
          Alert.alert(
            'Access Denied',
            'You do not have permission to access Attendance. Contact admin.',
            [{ text: 'OK', onPress: () => navigation?.goBack() }]
          );
        }
      } else {
        setHasPermission(false);
        Alert.alert(
          'Access Denied',
          'Unable to verify permissions. Contact admin.',
          [{ text: 'OK', onPress: () => navigation?.goBack() }]
        );
      }
    } catch (error) {
      setHasPermission(false);
      Alert.alert(
        'Error',
        'Failed to check permissions.',
        [{ text: 'OK', onPress: () => navigation?.goBack() }]
      );
    } finally {
      setCheckingPermission(false);
    }
  };

  React.useEffect(() => {
    if (hasPermission) {
      refreshMarkedToday();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, refreshToken, hasPermission]);

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
    setChecking(true);
    try {
      const ip = await Network.getIpAddressAsync();
      setLastIp(ip || '');
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        showToast('Location permission denied');
        setChecking(false);
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
    } finally {
      setChecking(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    setRefreshToken(Date.now());
    setTimeout(() => setRefreshing(false), 600);
  };

  if (checkingPermission) {
    return (
      <Screen header={<AppHeader title="Attendance" onBackPress={() => navigation?.goBack()} />}>
        <LoadingState message="Checking permissions..." />
      </Screen>
    );
  }

  if (!hasPermission) {
    return (
      <Screen header={<AppHeader title="Attendance" onBackPress={() => navigation?.goBack()} />}>
        <EmptyState
          icon="lock-closed-outline"
          tone="danger"
          title="Access Denied"
          subtitle="You do not have permission to access this feature."
        />
      </Screen>
    );
  }

  const now = new Date();
  const todayLabel = `${DAYS[now.getDay()]}, ${now.getDate()} ${MONTHS[now.getMonth()]} ${now.getFullYear()}`;
  const statusTone = markedToday ? tones.success : tones.warning;

  return (
    <Screen
      scroll
      header={<AppHeader large subtitle="Today" title="Attendance" onBackPress={() => navigation?.goBack()} />}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <AppCard style={styles.todayCard}>
        <View style={styles.todayRow}>
          <View style={[styles.statusIcon, { backgroundColor: statusTone.soft }]}>
            <Icon name={markedToday ? 'checkmark-circle' : 'time-outline'} size={26} color={statusTone.main} />
          </View>
          <View style={styles.todayText}>
            <Text style={styles.todayDate}>{todayLabel}</Text>
            <Text style={[styles.todayStatus, { color: statusTone.main }]}>
              {markedToday ? 'Attendance marked for today' : 'Not marked yet'}
            </Text>
          </View>
        </View>
        <Text style={styles.hint}>
          Attendance can only be marked while connected to the office WiFi and within the office location.
        </Text>
        <View style={styles.actions}>
          <AppButton
            title="Check WiFi & Location"
            icon="locate-outline"
            variant="outline"
            onPress={handleCheck}
            loading={checking}
            disabled={checking}
            style={[styles.actionBtn, markedToday && styles.dimmed]}
          />
          <AppButton
            title={submitting ? 'Marking...' : (markedToday ? 'Marked for Today' : 'Mark Attendance')}
            icon={markedToday ? 'checkmark-done-outline' : 'finger-print-outline'}
            variant={markedToday ? 'success' : 'primary'}
            size="lg"
            onPress={handleMark}
            loading={submitting}
            style={markedToday && styles.dimmed}
          />
        </View>
      </AppCard>

      <SectionHeader title="Monthly calendar" subtitle="Your attendance history" />
      <AttendanceCalendar attendanceGiven={[]} employeeId={user?.id} refreshToken={refreshToken} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  todayCard: { marginBottom: spacing.lg },
  todayRow: { flexDirection: 'row', alignItems: 'center' },
  statusIcon: { width: 52, height: 52, borderRadius: radii.md, alignItems: 'center', justifyContent: 'center', marginRight: spacing.md },
  todayText: { flex: 1 },
  todayDate: { fontSize: 15, fontWeight: '800', color: colors.text },
  todayStatus: { fontSize: 13, fontWeight: '700', marginTop: 2 },
  hint: { marginTop: spacing.md, fontSize: 12, color: colors.textMuted, lineHeight: 17 },
  actions: { marginTop: spacing.lg, gap: spacing.sm },
  actionBtn: {},
  dimmed: { opacity: 0.75 },
});
