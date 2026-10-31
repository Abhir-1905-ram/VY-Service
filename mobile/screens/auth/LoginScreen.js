import React, { useContext, useState, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Switch } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AuthContext } from '../../contexts/AuthContext';
import Screen from '../../components/Screen';
import AppHeader from '../../components/AppHeader';
import AppCard from '../../components/AppCard';
import AppInput from '../../components/AppInput';
import AppButton from '../../components/AppButton';
import Banner from '../../components/Banner';
import Icon from '../../components/Icon';
import { colors, spacing, typography } from '../../ui/Theme';

export default function LoginScreen({ navigation }) {
  const { signIn } = useContext(AuthContext);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(true);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPwd, setShowPwd] = useState(false);
  const passwordRef = useRef(null);
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
    <Screen
      scroll
      keyboard
      header={<AppHeader large showBrand subtitle="Vyshnavi Computers" title="Welcome back" />}
      contentStyle={styles.content}
    >
      <Text style={styles.lead}>Sign in to manage repairs, services and attendance.</Text>

      <AppCard style={styles.card}>
        <Banner tone="danger" message={error} style={styles.banner} />
        <AppInput
          label="Username"
          icon="person-outline"
          placeholder="Enter username"
          value={username}
          onChangeText={setUsername}
          autoCapitalize="none"
          autoCorrect={false}
          returnKeyType="next"
          blurOnSubmit={false}
          onSubmitEditing={() => passwordRef.current?.focus()}
          style={styles.field}
        />
        <AppInput
          ref={passwordRef}
          label="Password"
          icon="lock-closed-outline"
          placeholder="Enter password"
          secureTextEntry={!showPwd}
          value={password}
          onChangeText={setPassword}
          autoCapitalize="none"
          returnKeyType="go"
          onSubmitEditing={onLogin}
          right={
            <TouchableOpacity onPress={() => setShowPwd(v => !v)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Icon name={showPwd ? 'eye-off-outline' : 'eye-outline'} size={20} color={colors.textMuted} />
            </TouchableOpacity>
          }
          style={styles.field}
        />
        <View style={styles.rememberRow}>
          <View style={styles.rememberText}>
            <Text style={styles.rememberLabel}>Remember me</Text>
            <Text style={styles.rememberHint}>Keep me signed in on this device</Text>
          </View>
          <Switch
            value={remember}
            onValueChange={setRemember}
            trackColor={{ false: colors.borderStrong, true: colors.primary }}
            thumbColor="#fff"
            ios_backgroundColor={colors.borderStrong}
          />
        </View>
        <AppButton title="Login" onPress={onLogin} icon="log-in-outline" loading={loading} size="lg" />
      </AppCard>

      <TouchableOpacity onPress={() => navigation.navigate('Signup')} style={styles.linkRow}>
        <Text style={styles.linkMuted}>New employee? </Text>
        <Text style={styles.link}>Create an account</Text>
      </TouchableOpacity>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { paddingTop: spacing.xl },
  lead: { ...typography.small, marginBottom: spacing.lg, paddingHorizontal: spacing.xs },
  card: { padding: spacing.xl },
  banner: { marginBottom: spacing.lg },
  field: { marginBottom: spacing.lg },
  rememberRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.xl },
  rememberText: { flex: 1, paddingRight: spacing.md },
  rememberLabel: { fontSize: 14, fontWeight: '700', color: colors.text },
  rememberHint: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  linkRow: { flexDirection: 'row', justifyContent: 'center', marginTop: spacing.xl, paddingVertical: spacing.sm },
  linkMuted: { color: colors.textMuted, fontWeight: '600' },
  link: { color: colors.primary, fontWeight: '800' },
});
