import React, { useEffect, useState, useContext } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TextInput, TouchableOpacity } from 'react-native';
import { colors } from '../../ui/Theme';
import AppButton from '../../components/AppButton';
import AppHeader from '../../components/AppHeader';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AuthContext } from '../../contexts/AuthContext';
import Icon from '../../components/Icon';

export default function ProfileScreen({ navigation }) {
  const { signOut } = useContext(AuthContext);
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [newPassword, setNewPassword] = useState('');
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

  return (
    <SafeAreaView style={styles.container}>
      <View style={{ marginHorizontal: -13, marginTop: -5 }}>
        <AppHeader title="Profile" showBrand={false} onBackPress={() => navigation?.goBack()} />
      </View>
      <View style={styles.cover} />
      <View style={styles.card}>
        <View style={styles.logoBadge}>
          <Text style={styles.logoText}>VY</Text>
        </View>
        <View style={styles.avatar}>
          <Icon name="person-outline" size={38} color={colors.textMuted} />
        </View>
        <Text style={styles.name}>{displayName || 'Your Profile'}</Text>
        <View style={styles.row}>
          <Text style={styles.label}>Phone</Text>
          {editingField === 'phone' ? (
            <View style={styles.editRow}>
              <TextInput
                style={styles.input}
                keyboardType="phone-pad"
                value={phone}
                onChangeText={(v) => setPhone((v || '').replace(/[^0-9]/g, '').slice(0, 10))}
                placeholder="Enter phone"
                placeholderTextColor={colors.textMuted}
              />
              <TouchableOpacity onPress={() => saveField('phone')} style={styles.linkBtn}>
                <Text style={styles.linkText}>Save</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.valueWrap}>
              <Text style={styles.value}>{phone || '—'}</Text>
              <TouchableOpacity onPress={() => setEditingField('phone')} style={styles.linkBtn}>
                <Text style={styles.linkText}>{phone ? 'Edit' : '+ Add'}</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Mail</Text>
          {editingField === 'email' ? (
            <View style={styles.editRow}>
              <TextInput
                style={styles.input}
                keyboardType="email-address"
                autoCapitalize="none"
                value={email}
                onChangeText={setEmail}
                placeholder="Enter email"
                placeholderTextColor={colors.textMuted}
              />
              <TouchableOpacity onPress={() => saveField('email')} style={styles.linkBtn}>
                <Text style={styles.linkText}>Save</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.valueWrap}>
              <Text style={styles.value}>{email || '—'}</Text>
              <TouchableOpacity onPress={() => setEditingField('email')} style={styles.linkBtn}>
                <Text style={styles.linkText}>{email ? 'Edit' : '+ Add'}</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
        {!!message && <Text style={{ color: '#DC2626', marginTop: 6, alignSelf: 'center' }}>{message}</Text>}
        <View style={{ height: 16 }} />
        <TouchableOpacity style={styles.settingsRow} onPress={() => navigation.navigate('EmployeeSettings')}>
          <Icon name="settings-outline" size={20} color={colors.text} style={{ marginRight: 10 }} />
          <Text style={styles.settingsText}>Settings</Text>
          <Icon name="chevron-forward-outline" size={18} color={colors.textMuted} style={{ marginLeft: 'auto' }} />
        </TouchableOpacity>
        <View style={{ height: 16 }} />
        <AppButton title="Log out" color="danger" icon="log-out-outline" onPress={signOut} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  cover: { height: 140, backgroundColor: '#C7C9FF' },
  card: { marginTop: -40, marginHorizontal: 16, backgroundColor: '#fff', borderRadius: 16, padding: 16, elevation: 4 },
  avatar: { width: 90, height: 90, borderRadius: 45, backgroundColor: '#EEF2FF', alignSelf: 'center', marginTop: -45, borderWidth: 4, borderColor: '#fff', alignItems: 'center', justifyContent: 'center' },
  name: { fontSize: 20, fontWeight: '800', alignSelf: 'center', marginVertical: 8, color: colors.text },
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10, alignItems: 'center' },
  label: { color: colors.textMuted, fontWeight: '600' },
  value: { color: colors.text, fontWeight: '700' },
  valueWrap: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  linkBtn: { paddingHorizontal: 8, paddingVertical: 6 },
  linkText: { color: colors.primary, fontWeight: '700' },
  editRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  input: { borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 10, paddingHorizontal: 10, paddingVertical: 8, minWidth: 180, color: colors.text },
  sectionTitle: { fontSize: 16, fontWeight: '800', color: colors.text, alignSelf: 'flex-start', marginBottom: 8 },
  settings: {},
  logoBadge: {
    position: 'absolute',
    top: -12,
    alignSelf: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  logoText: { color: '#fff', fontWeight: '800' },
  settingsRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, alignSelf: 'stretch' },
  settingsText: { fontWeight: '700', color: colors.text },
});


