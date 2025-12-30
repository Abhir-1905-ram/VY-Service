import React, { useEffect, useState, useContext } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TextInput, TouchableOpacity } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import AppCard from '../../components/AppCard';
import AppButton from '../../components/AppButton';
import AppHeader from '../../components/AppHeader';
import { colors } from '../../ui/Theme';
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

  return (
    <SafeAreaView style={styles.container}>
      <View style={{ marginHorizontal: -20, marginTop: -375 }}>
        <AppHeader title="Settings" showBrand={false} onBackPress={() => navigation?.goBack()} />
      </View>
      <AppCard style={{ padding: 20, marginTop: 20 }}>
        <Text style={styles.title}>Settings</Text>

        {/* Username row */}
        {!editingUsername ? (
          <View style={styles.rowBetween}>
            <View>
              <Text style={styles.label}>Username</Text>
              <Text style={styles.valueText}>{displayName || '—'}</Text>
            </View>
            <TouchableOpacity onPress={() => setEditingUsername(true)}>
              <Text style={styles.actionLink}>Edit</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={{ marginBottom: 12 }}>
            <Text style={styles.label}>Username</Text>
            <TextInput
              style={styles.input}
              autoCapitalize="none"
              value={displayName}
              onChangeText={setDisplayName}
              placeholder="Enter username"
              placeholderTextColor={colors.textMuted}
            />
          </View>
        )}

        {/* Password row */}
        {!editingPassword ? (
          <View style={styles.rowBetween}>
            <View>
              <Text style={styles.label}>Password</Text>
              <Text style={styles.valueText}>••••••••</Text>
            </View>
            <TouchableOpacity onPress={() => setEditingPassword(true)}>
              <Text style={styles.actionLink}>Edit</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={{ marginBottom: 12 }}>
            <Text style={styles.label}>New Password</Text>
            <TextInput
              style={styles.input}
              autoCapitalize="none"
              secureTextEntry
              value={newPassword}
              onChangeText={setNewPassword}
              placeholder="Enter new password"
              placeholderTextColor={colors.textMuted}
            />
            <Text style={[styles.label, { marginTop: 10 }]}>Confirm Password</Text>
            <TextInput
              style={styles.input}
              autoCapitalize="none"
              secureTextEntry
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              placeholder="Confirm new password"
              placeholderTextColor={colors.textMuted}
            />
          </View>
        )}

        <View style={{ height: 12 }} />
        {(editingUsername || editingPassword) && (
          <AppButton title="Save" icon="save-outline" onPress={onSave} />
        )}
        {!!message && <Text style={styles.message}>{message}</Text>}
      </AppCard>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#F5F7FB', justifyContent: 'center', paddingTop: 0 },
  title: { fontSize: 18, fontWeight: '800', marginBottom: 10, color: colors.text },
  label: { color: colors.textMuted, fontWeight: '600', marginTop: 6, marginBottom: 6 },
  input: { borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 10, paddingHorizontal: 10, paddingVertical: 8, color: colors.text },
  message: { marginTop: 10, alignSelf: 'center', color: colors.textMuted, fontWeight: '700' },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  valueText: { color: colors.text, fontWeight: '700' },
  actionLink: { color: colors.primary, fontWeight: '800' },
});


