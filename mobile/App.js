import React, { useContext, useState } from 'react';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { StyleSheet, View, StatusBar, ActivityIndicator } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AuthNavigator from './navigation/AuthNavigator';
import AdminNavigator from './navigation/AdminNavigator';
import EmployeeNavigator from './navigation/EmployeeNavigator';
import { AuthProvider, AuthContext } from './contexts/AuthContext';
import { colors } from './ui/Theme';
import SplashScreen from './screens/SplashScreen';
import AppFooter from './components/AppFooter';
import BrandMark from './components/BrandMark';

const navTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: colors.primary,
    background: colors.bg,
    card: colors.surface,
    text: colors.text,
    border: colors.border,
  },
};

function RootNavigator() {
  const { user, loading } = useContext(AuthContext);
  if (loading) {
    return (
      <View style={styles.loading}>
        <BrandMark size={56} />
        <ActivityIndicator size="small" color={colors.textOnDarkMuted} style={{ marginTop: 20 }} />
      </View>
    );
  }
  return (
    <NavigationContainer theme={navTheme}>
      {user?.role === 'admin' ? <AdminNavigator /> : user?.role === 'employee' ? <EmployeeNavigator /> : <AuthNavigator />}
    </NavigationContainer>
  );
}

function AppContent() {
  const [showSplash, setShowSplash] = useState(true);

  if (showSplash) {
    return <SplashScreen onFinish={() => setShowSplash(false)} />;
  }

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={colors.primaryDeep} translucent={false} />
      <View style={styles.content}>
        <RootNavigator />
      </View>
      <AppFooter />
    </View>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <SafeAreaProvider>
        <AppContent />
      </SafeAreaProvider>
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.primaryDeep },
  content: { flex: 1, backgroundColor: colors.bg },
  loading: { flex: 1, backgroundColor: colors.primaryDeep, alignItems: 'center', justifyContent: 'center' },
});
