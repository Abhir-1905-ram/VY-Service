import React, { useContext, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { AuthContext } from '../../contexts/AuthContext';
import AppCard from '../../components/AppCard';
import AppInput from '../../components/AppInput';
import AppButton from '../../components/AppButton';
import Icon from '../../components/Icon';
import { colors } from '../../ui/Theme';
import AppHeader from '../../components/AppHeader';

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

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={{ flex: 1, backgroundColor: '#F5F7FB' }}>
        <View style={{ marginHorizontal: -20, marginTop: -20 }}>
          <AppHeader title="Vyshnavi Computers" />
        </View>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 0}
        >
          <ScrollView
            contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', paddingBottom: 100 }}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            overScrollMode="never"
            bounces={false}
            style={{ backgroundColor: '#F5F7FB' }}
          >
            <Text style={styles.title}>Employee Sign Up</Text>
            {!!message && <Text style={styles.info}>{message}</Text>}
            <AppCard style={{ padding: 20 }}>
        <AppInput
          label="Username"
          icon="person-add-outline"
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
        <AppInput
          label="Confirm Password"
          icon="lock-closed-outline"
          placeholder="Confirm password"
          secureTextEntry={!showConfirm}
          value={confirm}
          onChangeText={setConfirm}
          autoCapitalize="none"
          right={
            <TouchableOpacity onPress={() => setShowConfirm(v => !v)}>
              <Icon name={showConfirm ? 'eye-off-outline' : 'eye-outline'} color={colors.textMuted} />
            </TouchableOpacity>
          }
          style={{ marginBottom: 12 }}
        />
            <AppButton title={loading ? 'Signing up...' : 'Sign Up'} onPress={onSignup} icon="checkmark-circle-outline" color="secondary" />
          </AppCard>
          <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginTop: 16, alignSelf: 'center' }}>
            <Text style={styles.link}>Back to Login</Text>
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
  title: { fontSize: 26, fontWeight: '800', marginBottom: 16, color: colors.text, alignSelf: 'center' },
  link: { color: '#1E3A8A', marginTop: 16, fontWeight: '700' },
  info: { color: '#2E7D32', marginBottom: 8, alignSelf: 'center', fontWeight: '700' },
});


