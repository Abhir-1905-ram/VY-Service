import React, { useContext, useState } from 'react';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { StyleSheet, View, StatusBar, ActivityIndicator } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
<<<<<<< HEAD
import { NavigationBar } from 'expo-navigation-bar';
import AuthNavigator from './navigation/AuthNavigator';
import AdminNavigator from './navigation/AdminNavigator';
import EmployeeNavigator from './navigation/EmployeeNavigator';
import SalesNavigator from './navigation/SalesNavigator';
=======
import AuthNavigator from './navigation/AuthNavigator';
import AdminNavigator from './navigation/AdminNavigator';
import EmployeeNavigator from './navigation/EmployeeNavigator';
>>>>>>> 3e5d7325c20db157f7ce370f6bca04996d1fe0fc
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
<<<<<<< HEAD
      {user?.role === 'admin'
        ? <AdminNavigator />
        : user?.role === 'employee' && user?.employeeKind === 'sales'
          ? <SalesNavigator />
          : user?.role === 'employee'
            ? <EmployeeNavigator />
            : <AuthNavigator />}
=======
      {user?.role === 'admin' ? <AdminNavigator /> : user?.role === 'employee' ? <EmployeeNavigator /> : <AuthNavigator />}
>>>>>>> 3e5d7325c20db157f7ce370f6bca04996d1fe0fc
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
<<<<<<< HEAD
      <StatusBar barStyle="light-content" />
      <NavigationBar style="light" hidden />
=======
      <StatusBar barStyle="light-content" backgroundColor={colors.primaryDeep} translucent={false} />
>>>>>>> 3e5d7325c20db157f7ce370f6bca04996d1fe0fc
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
