import React, { useState } from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import Screen from '../../components/Screen';
import AppHeader from '../../components/AppHeader';
import AttendanceCalendar from '../../components/AttendanceCalendar';
import AppModal from '../../components/AppModal';
import AppButton from '../../components/AppButton';
import Banner from '../../components/Banner';
import { adminSetAttendance } from '../../services/api';
import { colors, spacing, tones, radii } from '../../ui/Theme';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function prettyDate(key) {
  if (!key) return '';
  const [y, m, d] = String(key).split('-').map((n) => parseInt(n, 10));
  if (!y || !m || !d) return String(key);
  const date = new Date(y, m - 1, d);
  return `${DAYS[date.getDay()]}, ${d} ${MONTHS[m - 1]} ${y}`;
}

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

  const closeSheet = () => setSheet(s => ({ ...s, visible: false }));
  const currentTone = sheet.present ? tones.success : tones.danger;

  return (
    <Screen scroll header={<AppHeader large subtitle="Attendance" title={`${username || ''}`} onBackPress={() => navigation.goBack()} />}>
      <Banner tone="info" icon="hand-left-outline" message="Tap a past date to toggle Present / Absent" style={styles.banner} />
      <AttendanceCalendar employeeId={employeeId} editable onPressDay={onPressDay} refreshToken={refreshToken} />

      <AppModal visible={sheet.visible} onClose={closeSheet} variant="sheet" title={prettyDate(sheet.key)} subtitle={sheet.key}>
        <View style={styles.currentRow}>
          <Text style={styles.currentLabel}>Current status</Text>
          <View style={[styles.pill, { backgroundColor: currentTone.soft }]}>
            <Text style={[styles.pillText, { color: currentTone.main }]}>{sheet.present ? 'Present' : 'Absent'}</Text>
          </View>
        </View>
        <AppButton title="Mark Present" icon="checkmark-circle-outline" variant="success" onPress={() => onChoose(true)} style={styles.btn} />
        <AppButton title="Mark Absent" icon="close-circle-outline" variant="danger" onPress={() => onChoose(false)} style={styles.btn} />
        <AppButton title="Cancel" variant="neutralSoft" onPress={closeSheet} />
      </AppModal>
    </Screen>
  );
}

const styles = StyleSheet.create({
  banner: { marginBottom: spacing.lg },
  currentRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.lg },
  currentLabel: { color: colors.textMuted, fontWeight: '700' },
  pill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: radii.round },
  pillText: { fontWeight: '800', fontSize: 12 },
  btn: { marginBottom: spacing.sm },
});
