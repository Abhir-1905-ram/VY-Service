import React, { useContext, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  StatusBar,
  Platform,
} from 'react-native';
import { KeyboardAvoidingView } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import AuthNavigator from './navigation/AuthNavigator';
import AdminNavigator from './navigation/AdminNavigator';
import EmployeeNavigator from './navigation/EmployeeNavigator';
import { AuthProvider, AuthContext } from './contexts/AuthContext';
import { colors, spacing, shadows } from './utils/theme';
import SplashScreen from './screens/SplashScreen';

const Stack = createNativeStackNavigator();

function RootNavigator() {
  const { user, loading } = useContext(AuthContext);
  if (loading) {
    return (
      <SafeAreaView style={[styles.safeArea, { alignItems: 'center', justifyContent: 'center' }]}>
        <StatusBar barStyle="light-content" backgroundColor={colors.primary} />
        <Text style={{ color: '#fff', fontWeight: '700' }}>Loading...</Text>
      </SafeAreaView>
    );
  }
  return (
    <NavigationContainer>
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
    <SafeAreaView style={styles.safeArea} edges={[]}>
      <StatusBar barStyle="light-content" backgroundColor={colors.primary} />
      <View style={styles.contentWrapper}>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={0}
        >
          <RootNavigator />
        </KeyboardAvoidingView>
      </View>
      <View style={styles.footerContainer}>
        <Text style={styles.footerLine1}>@2025 Vyshnavi Computers Services</Text>
        <Text style={styles.footerLine2}>Developer S.Abhiram</Text>
      </View>
    </SafeAreaView>
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
  safeArea: {
    flex: 1,
    backgroundColor: colors.primary, // Blue background for SafeAreaView
  },
  contentWrapper: {
    flex: 1,
    backgroundColor: '#F5F7FB', // White/light background for content area
  },
  container: {
    flex: 1,
  },
  footerContainer: {
    backgroundColor: '#0D47A1',
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 10,
    paddingBottom: 8,
    minHeight: 60,
  },
  footerLine1: {
    color: '#E3F2FD',
    fontWeight: '800',
    fontSize: 12,
    marginBottom: 2,
  },
  footerLine2: {
    color: '#E3F2FD',
    opacity: 0.9,
    fontWeight: '700',
    fontSize: 11,
  },
  navbar: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    ...shadows.header,
  },
  navbarContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  logoContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primaryDark,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  navbarTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: 0.5,
  },
  homeContent: {
    flex: 1,
    padding: spacing.xl,
  },
  serviceName: {
    fontSize: 34,
    fontWeight: 'bold',
    color: colors.primary,
    textAlign: 'center',
    marginVertical: spacing.xxl,
  },
  buttonsContainer: {
    flexDirection: 'column',
    marginTop: spacing.xxl,
  },
  serviceCard: {
    backgroundColor: colors.cardBg,
    borderRadius: 20,
    padding: spacing.lg,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.borderPrimarySoft,
    ...shadows.card,
  },
  cardPrimary: {
    borderLeftWidth: 6,
    borderLeftColor: colors.secondary,
  },
  cardSecondary: {
    borderLeftWidth: 6,
    borderLeftColor: colors.info,
  },
  cardTertiary: {
    borderLeftWidth: 6,
    borderLeftColor: colors.accentOrange,
  },
  cardIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  iconPrimary: { backgroundColor: '#E3F2FD' },
  iconSecondary: { backgroundColor: '#E8F5E9' },
  iconTertiary: { backgroundColor: '#FFF3E0' },
  cardIcon: { fontSize: 28 },
  cardContent: { flex: 1 },
  cardTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#263238',
  },
  cardDescription: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  cardArrow: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#ECEFF1',
    justifyContent: 'center',
    alignItems: 'center',
  },
  arrowText: {
    fontSize: 18,
    color: '#546E7A',
    fontWeight: 'bold',
  },
  footer: {
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  footerText: {
    fontSize: 12,
    color: '#B0BEC5',
  },
});
