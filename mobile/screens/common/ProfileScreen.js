import React, { useEffect, useState, useContext } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AuthContext } from '../../contexts/AuthContext';
import Screen from '../../components/Screen';
import AppHeader from '../../components/AppHeader';
import AppCard from '../../components/AppCard';
import AppButton from '../../components/AppButton';
import AppInput from '../../components/AppInput';
import Avatar from '../../components/Avatar';
import Banner from '../../components/Banner';
import Icon from '../../components/Icon';
import { colors, spacing, radii } from '../../ui/Theme';

function EditableRow({ icon, label, value, editing, onEdit, onSave, children, last }) {
  return (
    <View style={[styles.row, !last && styles.divider]}>
      <View style={styles.rowIcon}>
        <Icon name={icon} size={18} color={colors.primary} />
      </View>
      <View style={styles.rowBody}>
        <Text style={styles.rowLabel}>{label}</Text>
        {editing ? (
          <View style={styles.editWrap}>{children}</View>
        ) : (
          <Text style={styles.rowValue}>{value || 'Not added'}</Text>
        )}
      </View>
      <TouchableOpacity onPress={editing ? onSave : onEdit} style={styles.rowAction} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
        <Text style={styles.rowActionText}>{editing ? 'Save' : value ? 'Edit' : 'Add'}</Text>
      </TouchableOpacity>
    </View>
  );
}

export default function ProfileScreen({ navigation }) {
  const { signOut, user } = useContext(AuthContext);
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [editingField, setEditingField] = useState(null); // 'phone' | 'email' | null
  const [message, setMessage] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const p = await AsyncStorage.getItem('profile_phone');
        const e = await AsyncStorage.getItem('profile_email');
        const n = await AsyncStorage.getItem('profile_name');
        const userNameFallback = await AsyncStorage.getItem('remember_username');
        if (p) setPhone(p);
        if (e) setEmail(e);
        if (n) setDisplayName(n);
        else if (userNameFallback) setDisplayName(userNameFallback);
      } catch (e) {}
    })();
  }, []);

  const saveField = async (field) => {
    try {
      if (field === 'phone') {
        const onlyDigits = (phone || '').replace(/[^0-9]/g, '');
        if (onlyDigits.length !== 10) {
          setMessage('Phone number must be exactly 10 digits');
          return;
        }
        setMessage('');
        await AsyncStorage.setItem('profile_phone', phone || '');
      } else if (field === 'email') {
        await AsyncStorage.setItem('profile_email', email || '');
      }
    } catch (e) {}
    setEditingField(null);
  };

  const name = displayName || 'Your Profile';

  return (
    <Screen scroll padded={false} header={<AppHeader title="Profile" onBackPress={() => navigation?.goBack()} />}>
      <View style={styles.hero}>
        <View style={styles.avatarRing}>
          <Avatar name={name} size={84} tone="primary" />
        </View>
        <Text style={styles.name}>{name}</Text>
        <View style={styles.roleChip}>
          <Icon name="briefcase-outline" size={12} color={colors.primaryDark} />
          <Text style={styles.roleText}>
            {user?.role === 'admin' ? 'Admin' : user?.employeeKind === 'sales' ? 'Sales employee' : 'Employee'}
          </Text>
        </View>
      </View>

      <View style={styles.body}>
        <Banner tone="danger" message={message} style={styles.banner} />

        <AppCard style={styles.card} padded={false}>
          <EditableRow
            icon="call-outline"
            label="Phone"
            value={phone}
            editing={editingField === 'phone'}
            onEdit={() => setEditingField('phone')}
            onSave={() => saveField('phone')}
          >
            <AppInput
              keyboardType="phone-pad"
              value={phone}
              onChangeText={(v) => setPhone((v || '').replace(/[^0-9]/g, '').slice(0, 10))}
              placeholder="Enter phone"
              maxLength={10}
              autoFocus
            />
          </EditableRow>
          <EditableRow
            icon="mail-outline"
            label="Mail"
            value={email}
            editing={editingField === 'email'}
            onEdit={() => setEditingField('email')}
            onSave={() => saveField('email')}
            last
          >
            <AppInput
              keyboardType="email-address"
              autoCapitalize="none"
              value={email}
              onChangeText={setEmail}
              placeholder="Enter email"
              autoFocus
            />
          </EditableRow>
        </AppCard>

        <AppCard style={styles.card} padded={false}>
          <TouchableOpacity
            style={styles.menuRow}
            onPress={() => navigation.navigate(user?.employeeKind === 'sales' ? 'SalesSettings' : 'EmployeeSettings')}
            activeOpacity={0.8}
          >
            <View style={styles.rowIcon}>
              <Icon name="settings-outline" size={18} color={colors.primary} />
            </View>
            <View style={styles.rowBody}>
              <Text style={styles.menuTitle}>Settings</Text>
              <Text style={styles.menuHint}>Username and password</Text>
            </View>
            <Icon name="chevron-forward" size={18} color={colors.textMuted} />
          </TouchableOpacity>
        </AppCard>

        <AppButton title="Log out" variant="dangerSoft" icon="log-out-outline" onPress={signOut} style={styles.logout} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: { alignItems: 'center', paddingTop: spacing.xl, paddingBottom: spacing.lg },
  avatarRing: { padding: 4, borderRadius: 50, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  name: { fontSize: 22, fontWeight: '800', color: colors.text, marginTop: spacing.md },
  roleChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radii.round,
    backgroundColor: colors.primarySoft,
  },
  roleText: { fontSize: 12, fontWeight: '800', color: colors.primaryDark },
  body: { paddingHorizontal: spacing.lg },
  banner: { marginBottom: spacing.md },
  card: { marginBottom: spacing.md },
  row: { flexDirection: 'row', alignItems: 'center', padding: spacing.lg },
  divider: { borderBottomWidth: 1, borderBottomColor: colors.border },
  rowIcon: { width: 36, height: 36, borderRadius: 10, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center', marginRight: spacing.md },
  rowBody: { flex: 1 },
  rowLabel: { fontSize: 12, fontWeight: '700', color: colors.textMuted },
  rowValue: { fontSize: 15, fontWeight: '700', color: colors.text, marginTop: 2 },
  editWrap: { marginTop: 6 },
  rowAction: { paddingHorizontal: 8, paddingVertical: 6, marginLeft: spacing.sm },
  rowActionText: { color: colors.primary, fontWeight: '800', fontSize: 14 },
  menuRow: { flexDirection: 'row', alignItems: 'center', padding: spacing.lg },
  menuTitle: { fontSize: 15, fontWeight: '800', color: colors.text },
  menuHint: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  logout: { marginTop: spacing.sm, marginBottom: spacing.xl },
});
