import React, { useEffect, useState, useContext } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Screen from '../../components/Screen';
import AppHeader from '../../components/AppHeader';
import AppCard from '../../components/AppCard';
import AppButton from '../../components/AppButton';
import AppInput from '../../components/AppInput';
import Banner from '../../components/Banner';
import SectionHeader from '../../components/SectionHeader';
import Icon from '../../components/Icon';
import { colors, spacing } from '../../ui/Theme';
import { AuthContext } from '../../contexts/AuthContext';
import { updateEmployee } from '../../services/api';

export default function SettingsScreen({ navigation }) {
  const { user } = useContext(AuthContext);
  const [displayName, setDisplayName] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [editingUsername, setEditingUsername] = useState(false);
  const [editingPassword, setEditingPassword] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const n = await AsyncStorage.getItem('profile_name');
        const fallback = await AsyncStorage.getItem('remember_username');
        setDisplayName(n || fallback || '');
      } catch {}
    })();
  }, []);

  const onSave = async () => {
    setMessage('');
    try {
      if (!user?.id) {
        setMessage('Cannot update: missing user id');
        return;
      }
      const payload = {};
      if (editingUsername && displayName) payload.username = displayName;
      if (editingPassword) {
        if (!newPassword || !confirmPassword) {
          setMessage('Enter and confirm new password');
          return;
        }
        if (newPassword !== confirmPassword) {
          setMessage('Passwords do not match');
          return;
        }
        payload.password = newPassword;
      }
      const res = await updateEmployee(user.id, payload);
      if (!res.success) {
        setMessage(res.message || 'Failed to update');
        return;
      }
      // Cache locally for profile display
      await AsyncStorage.setItem('profile_name', res.data.username || displayName || '');
      setMessage('Settings updated');
      setNewPassword('');
      setConfirmPassword('');
      setEditingUsername(false);
      setEditingPassword(false);
    } catch {
      setMessage('Could not save settings');
    }
  };

  const isSuccess = message === 'Settings updated';

  return (
    <Screen scroll keyboard header={<AppHeader title="Settings" onBackPress={() => navigation?.goBack()} />}>
      <SectionHeader title="Account" subtitle="Update how you sign in" style={styles.section} />
      <Banner tone={isSuccess ? 'success' : 'danger'} message={message} style={styles.banner} />

      <AppCard style={styles.card} padded={false}>
        {/* Username row */}
        <View style={[styles.row, styles.divider]}>
          <View style={styles.rowIcon}>
            <Icon name="person-outline" size={18} color={colors.primary} />
          </View>
          <View style={styles.rowBody}>
            <Text style={styles.rowLabel}>Username</Text>
            {!editingUsername ? (
              <Text style={styles.rowValue}>{displayName || '—'}</Text>
            ) : (
              <AppInput
                style={styles.editInput}
                autoCapitalize="none"
                value={displayName}
                onChangeText={setDisplayName}
                placeholder="Enter username"
                autoFocus
              />
            )}
          </View>
          {!editingUsername ? (
            <TouchableOpacity onPress={() => setEditingUsername(true)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Text style={styles.actionLink}>Edit</Text>
            </TouchableOpacity>
          ) : null}
        </View>

        {/* Password row */}
        <View style={styles.row}>
          <View style={styles.rowIcon}>
            <Icon name="lock-closed-outline" size={18} color={colors.primary} />
          </View>
          <View style={styles.rowBody}>
            <Text style={styles.rowLabel}>Password</Text>
            {!editingPassword ? (
              <Text style={styles.rowValue}>••••••••</Text>
            ) : (
              <View>
                <AppInput
                  style={styles.editInput}
                  autoCapitalize="none"
                  secureTextEntry
                  value={newPassword}
                  onChangeText={setNewPassword}
                  placeholder="Enter new password"
                  autoFocus
                />
                <AppInput
                  style={styles.editInput}
                  autoCapitalize="none"
                  secureTextEntry
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  placeholder="Confirm new password"
                  error={confirmPassword.length > 0 && confirmPassword !== newPassword ? 'Passwords do not match' : undefined}
                />
              </View>
            )}
          </View>
          {!editingPassword ? (
            <TouchableOpacity onPress={() => setEditingPassword(true)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Text style={styles.actionLink}>Edit</Text>
            </TouchableOpacity>
          ) : null}
        </View>
      </AppCard>

      {(editingUsername || editingPassword) && (
        <AppButton title="Save" icon="save-outline" size="lg" onPress={onSave} style={styles.save} />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  section: { marginTop: 0 },
  banner: { marginBottom: spacing.md },
  card: {},
  row: { flexDirection: 'row', alignItems: 'flex-start', padding: spacing.lg },
  divider: { borderBottomWidth: 1, borderBottomColor: colors.border },
  rowIcon: { width: 36, height: 36, borderRadius: 10, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center', marginRight: spacing.md },
  rowBody: { flex: 1 },
  rowLabel: { fontSize: 12, fontWeight: '700', color: colors.textMuted },
  rowValue: { fontSize: 15, fontWeight: '700', color: colors.text, marginTop: 4 },
  editInput: { marginTop: 8 },
  actionLink: { color: colors.primary, fontWeight: '800', paddingTop: 8, marginLeft: spacing.sm },
  save: { marginTop: spacing.lg },
});
