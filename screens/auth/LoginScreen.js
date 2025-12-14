import React, { useContext, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, Switch, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AuthContext } from '../../contexts/AuthContext';
import AppCard from '../../components/AppCard';
import AppInput from '../../components/AppInput';
import AppButton from '../../components/AppButton';
import Icon from '../../components/Icon';
import { colors } from '../../ui/Theme';
import AppHeader from '../../components/AppHeader';

export default function LoginScreen({ navigation }) {
  const { signIn } = useContext(AuthContext);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(true);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPwd, setShowPwd] = useState(false);
  const STORAGE_USERNAME = 'remember_username';
  const STORAGE_PASSWORD = 'remember_password';

  // Load saved credentials on first mount
  const loadCredentials = async () => {
    try {
      const [u, p] = await Promise.all([
        AsyncStorage.getItem(STORAGE_USERNAME),
        AsyncStorage.getItem(STORAGE_PASSWORD),
      ]);
      if (u || p) {
        setUsername(u || '');
        setPassword(p || '');
        setRemember(true);
      } else {
        setRemember(false);
      }
    } catch (e) {
      // ignore read errors
    }
  };

  // Persist current credentials
  const saveCredentials = async () => {
    try {
      await Promise.all([
        AsyncStorage.setItem(STORAGE_USERNAME, username || ''),
        AsyncStorage.setItem(STORAGE_PASSWORD, password || ''),
      ]);
    } catch (e) {
      // ignore write errors
    }
  };

  // Clear saved credentials
  const clearCredentials = async () => {
    try {
      await Promise.all([
        AsyncStorage.removeItem(STORAGE_USERNAME),
        AsyncStorage.removeItem(STORAGE_PASSWORD),
      ]);
    } catch (e) {
      // ignore clear errors
    }
  };

  React.useEffect(() => {
    loadCredentials();
  }, []);

  // When switch toggles
  React.useEffect(() => {
    (async () => {
      if (remember) {
        await saveCredentials();
      } else {
        await clearCredentials();
      }
    })();
  }, [remember]);

  // When fields change and remember is on, keep them in sync
  React.useEffect(() => {
    if (remember) {
      saveCredentials();
    }
  }, [username, password]); 

  const onLogin = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await signIn(username.trim(), password, remember);
      if (!res.success) {
        setError(res.message || 'Login failed');
      }
    } catch (e) {
      setError(e.message || 'Login error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={{ flex: 1 }}>
        <View style={{ marginHorizontal: -20, marginTop: -20 }}>
          <AppHeader title="Vyshnavi Computers" />
        </View>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 0}
        >
          <ScrollView
            contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', paddingBottom: 150 }}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            overScrollMode="never"
            bounces={false}
          >
            <Text style={styles.title}>Login</Text>
            {!!error && <Text style={styles.error}>{error}</Text>}
            <AppCard style={{ padding: 20 }}>
              <AppInput
                label="Username"
                icon="person-circle-outline"
                placeholder="Enter username"
                value={username}
                onChangeText={setUsername}
                autoCapitalize="none"
                style={{ marginBottom: 14 }}
              />
              <AppInput
                label="Password"
                icon="lock-closed-outline"
                placeholder="Enter password"
                secureTextEntry={!showPwd}
                value={password}
                onChangeText={setPassword}
                autoCapitalize="none"
                right={
                  <TouchableOpacity onPress={() => setShowPwd(v => !v)}>
                    <Icon name={showPwd ? 'eye-off-outline' : 'eye-outline'} color={colors.textMuted} />
                  </TouchableOpacity>
                }
                style={{ marginBottom: 12 }}
              />
              <View style={styles.row}>
                <Switch value={remember} onValueChange={setRemember} />
                <Text style={styles.label}>Remember me</Text>
              </View>
              <AppButton title={loading ? 'Signing in...' : 'Login'} onPress={onLogin} icon="log-in-outline" />
            </AppCard>
            <TouchableOpacity onPress={() => navigation.navigate('Signup')} style={{ marginTop: 16, alignSelf: 'center' }}>
              <Text style={styles.link}>New Employee? Sign Up</Text>
            </TouchableOpacity>
          </ScrollView>
        </KeyboardAvoidingView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, justifyContent: 'center', backgroundColor: '#F5F7FB' },
  center: { flex: 1, justifyContent: 'center' },
  title: { fontSize: 28, fontWeight: '800', marginBottom: 16, color: colors.text, alignSelf: 'center' },
  row: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  label: { marginLeft: 8 },
  link: { color: '#1E3A8A', marginTop: 8, fontWeight: '700' },
  error: { color: '#D32F2F', marginBottom: 8, alignSelf: 'center' },
});


