import React, { useContext, useEffect, useMemo, useState } from 'react';
import { SafeAreaView, Text, View, StyleSheet, Alert } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import RepairList from '../RepairList';
import { AuthContext } from '../../contexts/AuthContext';
import { getRepairs, getEmployeeCards } from '../../services/api';
import AppHeader from '../../components/AppHeader';

export default function EmployeeRepairListScreen({ navigation }) {
  const { user } = useContext(AuthContext);
  const [repairs, setRepairs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [hasPermission, setHasPermission] = useState(false);
  const [checkingPermission, setCheckingPermission] = useState(true);

  useEffect(() => {
    checkPermission();
  }, [user?.id]);

  const checkPermission = async () => {
    if (!user?.id) {
      setHasPermission(false);
      setCheckingPermission(false);
      Alert.alert(
        'Access Denied',
        'Unable to verify permissions.',
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
      return;
    }
    
    try {
      const res = await getEmployeeCards(user.id);
      if (res.success && res.data?.allowedCards) {
        // Check both repair-service and repair-list permissions
        const hasRepairService = res.data.allowedCards.includes('repair-service');
        const hasRepairList = res.data.allowedCards.includes('repair-list');
        // Repair List requires Repair & Service
        const allowed = hasRepairService && hasRepairList;
        setHasPermission(allowed);
        if (!allowed) {
          Alert.alert(
            'Access Denied',
            'You do not have permission to access Repair List. Contact admin.',
            [{ text: 'OK', onPress: () => navigation.goBack() }]
          );
        }
      } else {
        setHasPermission(false);
        Alert.alert(
          'Access Denied',
          'Unable to verify permissions. Contact admin.',
          [{ text: 'OK', onPress: () => navigation.goBack() }]
        );
      }
    } catch (error) {
      setHasPermission(false);
      Alert.alert(
        'Error',
        'Failed to check permissions.',
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } finally {
      setCheckingPermission(false);
    }
  };

  const load = async () => {
    setLoading(true);
    const res = await getRepairs();
    if (res.success) setRepairs(res.data || []);
    setLoading(false);
  };
  
  useEffect(() => {
    if (hasPermission) {
      load();
    }
  }, [hasPermission]);

  // Refresh when screen comes into focus (after returning from edit screen)
  useFocusEffect(
    React.useCallback(() => {
      if (hasPermission) {
        console.log('🔄 EmployeeRepairListScreen focused - refreshing data...');
        load();
      }
    }, [hasPermission])
  );

  const myRepairs = useMemo(() => repairs.filter(r => r.createdBy === user?.username), [repairs, user]);

  if (checkingPermission) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={{ marginHorizontal: -20, marginTop: -20 }}>
          <AppHeader title="My Repair List" showBrand={false} onBackPress={() => navigation.goBack()} />
        </View>
        <View style={styles.center}>
          <Text>Checking permissions...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!hasPermission) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={{ marginHorizontal: -20, marginTop: -20 }}>
          <AppHeader title="My Repair List" showBrand={false} onBackPress={() => navigation.goBack()} />
        </View>
        <View style={styles.center}>
          <Text style={styles.errorText}>Access Denied</Text>
          <Text style={styles.errorSubtext}>You do not have permission to access this feature.</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={{ marginHorizontal: -20, marginTop: -20 }}>
          <AppHeader title="My Repair List" showBrand={false} onBackPress={() => navigation.goBack()} />
        </View>
        <View style={styles.center}>
          <Text>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return <RepairList navigation={navigation} isAdmin={false} />;
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#F5F7FB' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  errorText: { fontSize: 18, fontWeight: '700', color: '#D32F2F', marginBottom: 8 },
  errorSubtext: { fontSize: 14, color: '#666', textAlign: 'center' },
});
