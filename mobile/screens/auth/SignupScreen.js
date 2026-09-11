import React, { useContext, useState } from 'react';
import { Text, TouchableOpacity, StyleSheet } from 'react-native';
import { AuthContext } from '../../contexts/AuthContext';
import Screen from '../../components/Screen';
import AppHeader from '../../components/AppHeader';
import AppCard from '../../components/AppCard';
import AppInput from '../../components/AppInput';
import AppButton from '../../components/AppButton';
import Banner from '../../components/Banner';
import Icon from '../../components/Icon';
import { colors, spacing, typography } from '../../ui/Theme';

export default function SignupScreen({ navigation }) {
  const { signUp } = useContext(AuthContext);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPwd, setShowPwd] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const onSignup = async () => {
    setMessage('');
    if (password !== confirm) {
      setMessage('Passwords do not match');
      return;
    }
    setLoading(true);
    const res = await signUp(username.trim(), password);
    if (res.success) {
      setMessage('Signup successful. Wait for admin approval.');
    } else {
      setMessage(res.message || 'Signup failed');
    }
    setLoading(false);
  };

  const isSuccess = message.startsWith('Signup successful');

  return (
    <Screen
      scroll
      keyboard
      header={<AppHeader large showBrand subtitle="Vyshnavi Computers" title="Employee sign up" onBackPress={() => navigation.goBack()} />}
      contentStyle={styles.content}
    >
      <Text style={styles.lead}>Create your account. An admin will approve it before you can log in.</Text>

      <AppCard style={styles.card}>
        <Banner tone={isSuccess ? 'success' : 'danger'} message={message} style={styles.banner} />
        <AppInput
          label="Username"
          icon="person-add-outline"
          placeholder="Choose a username"
          value={username}
          onChangeText={setUsername}
          autoCapitalize="none"
          autoCorrect={false}
          style={styles.field}
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
            <TouchableOpacity onPress={() => setShowPwd(v => !v)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Icon name={showPwd ? 'eye-off-outline' : 'eye-outline'} size={20} color={colors.textMuted} />
            </TouchableOpacity>
          }
          style={styles.field}
        />
        <AppInput
          label="Confirm password"
          icon="shield-checkmark-outline"
          placeholder="Re-enter password"
          secureTextEntry={!showConfirm}
          value={confirm}
          onChangeText={setConfirm}
          autoCapitalize="none"
          error={confirm.length > 0 && confirm !== password ? 'Passwords do not match' : undefined}
          right={
            <TouchableOpacity onPress={() => setShowConfirm(v => !v)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Icon name={showConfirm ? 'eye-off-outline' : 'eye-outline'} size={20} color={colors.textMuted} />
            </TouchableOpacity>
          }
          style={styles.field}
        />
        <AppButton title="Sign Up" onPress={onSignup} icon="checkmark-circle-outline" loading={loading} size="lg" />
      </AppCard>

      <TouchableOpacity onPress={() => navigation.goBack()} style={styles.linkRow}>
        <Text style={styles.linkMuted}>Already have an account? </Text>
        <Text style={styles.link}>Back to login</Text>
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
  linkRow: { flexDirection: 'row', justifyContent: 'center', marginTop: spacing.xl, paddingVertical: spacing.sm },
  linkMuted: { color: colors.textMuted, fontWeight: '600' },
  link: { color: colors.primary, fontWeight: '800' },
});
