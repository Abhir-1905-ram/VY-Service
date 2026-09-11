import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { updateRepair } from '../../services/api';
import Screen from '../../components/Screen';
import AppHeader from '../../components/AppHeader';
import AppCard from '../../components/AppCard';
import StatusBadge from '../../components/StatusBadge';
import EmptyState from '../../components/EmptyState';
import Icon from '../../components/Icon';
import { colors, spacing, tones } from '../../ui/Theme';

const TRANSITIONS = [
  { label: 'Pending → Completed', icon: 'checkmark-done-outline', tone: 'success', data: { status: 'Completed', deliveredAt: null } },
  { label: 'Completed → Delivered', icon: 'cube-outline', tone: 'info', data: () => ({ deliveredAt: new Date().toISOString() }) },
  { label: 'Delivered → Completed', icon: 'return-down-back-outline', tone: 'warning', data: { status: 'Completed', deliveredAt: null } },
  { label: 'Completed → Pending', icon: 'time-outline', tone: 'neutral', data: { status: 'Pending', deliveredAt: null } },
];

export default function RepairStatusUpdateScreen({ route, navigation }) {
  const { repair } = route.params || {};
  const update = async (data) => {
    const res = await updateRepair(repair._id, data);
    if (res.success) navigation.goBack();
  };

  if (!repair) {
    return (
      <Screen header={<AppHeader title="Update Status" onBackPress={() => navigation.goBack()} />}>
        <EmptyState icon="construct-outline" tone="neutral" title="No repair" subtitle="This repair could not be found." />
      </Screen>
    );
  }

  return (
    <Screen scroll header={<AppHeader title="Update Status" onBackPress={() => navigation.goBack()} />}>
      <AppCard style={styles.card}>
        <Text style={styles.name}>{repair.customerName}</Text>
        <Text style={styles.id}>ID {repair.uniqueId}</Text>
        <View style={styles.currentRow}>
          <Text style={styles.currentLabel}>Current status</Text>
          <StatusBadge status={repair.status} />
        </View>
      </AppCard>

      <AppCard style={styles.list} padded={false}>
        {TRANSITIONS.map((t, idx) => {
          const tone = tones[t.tone];
          return (
            <TouchableOpacity
              key={t.label}
              style={[styles.row, idx < TRANSITIONS.length - 1 && styles.divider]}
              activeOpacity={0.8}
              onPress={() => update(typeof t.data === 'function' ? t.data() : t.data)}
            >
              <View style={[styles.iconWrap, { backgroundColor: tone.soft }]}>
                <Icon name={t.icon} size={18} color={tone.main} />
              </View>
              <Text style={styles.rowText}>{t.label}</Text>
              <Icon name="chevron-forward" size={18} color={colors.textMuted} />
            </TouchableOpacity>
          );
        })}
      </AppCard>
    </Screen>
  );
}

const styles = StyleSheet.create({
  card: { marginBottom: spacing.lg },
  name: { fontSize: 18, fontWeight: '800', color: colors.text },
  id: { fontSize: 13, color: colors.textMuted, fontWeight: '600', marginTop: 2 },
  currentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  currentLabel: { color: colors.textMuted, fontWeight: '700' },
  list: {},
  row: { flexDirection: 'row', alignItems: 'center', padding: spacing.lg },
  divider: { borderBottomWidth: 1, borderBottomColor: colors.border },
  iconWrap: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginRight: spacing.md },
  rowText: { flex: 1, fontSize: 15, fontWeight: '700', color: colors.text },
});
