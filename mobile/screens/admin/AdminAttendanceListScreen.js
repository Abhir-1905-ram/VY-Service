import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { getEmployees } from '../../services/api';
import Screen from '../../components/Screen';
import AppHeader from '../../components/AppHeader';
import Avatar from '../../components/Avatar';
import EmptyState from '../../components/EmptyState';
import Icon from '../../components/Icon';
import { colors, spacing, radii, shadows } from '../../ui/Theme';

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
    <TouchableOpacity
      style={styles.row}
      activeOpacity={0.85}
      onPress={() => navigation.navigate('AdminAttendanceEdit', { employeeId: item._id || item.id, username: item.username })}
    >
      <Avatar name={item.username} size={44} />
      <View style={styles.textWrap}>
        <Text style={styles.name} numberOfLines={1}>{item.username}</Text>
        <Text style={styles.hint}>View & edit attendance</Text>
      </View>
      <View style={styles.chevron}>
        <Icon name="chevron-forward" size={18} color={colors.textMuted} />
      </View>
    </TouchableOpacity>
  );

  return (
    <Screen
      padded={false}
      header={
        <AppHeader large subtitle="Team" title="Attendance" onBackPress={() => navigation.goBack()}>
          <Text style={styles.headerMeta}>Select an employee to review their calendar</Text>
        </AppHeader>
      }
    >
      <FlatList
        data={employees}
        refreshing={loading}
        onRefresh={load}
        keyExtractor={(item) => (item._id || item.id)}
        contentContainerStyle={styles.list}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        renderItem={renderItem}
        ListEmptyComponent={!loading ? <EmptyState icon="people-outline" title="No employees" subtitle="Approved employees will be listed here" /> : null}
        showsVerticalScrollIndicator={false}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  headerMeta: { color: colors.textOnDarkMuted, fontWeight: '600', fontSize: 13 },
  list: { padding: spacing.lg, paddingBottom: spacing.xxxl },
  separator: { height: spacing.sm },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    ...shadows.card,
  },
  textWrap: { flex: 1, marginLeft: spacing.md },
  name: { fontSize: 15, fontWeight: '800', color: colors.text },
  hint: { fontSize: 12, color: colors.textMuted, marginTop: 2, fontWeight: '600' },
  chevron: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: colors.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
