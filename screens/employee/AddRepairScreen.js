import React, { useContext, useEffect, useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, Alert } from 'react-native';
import RepairAndService from '../RepairAndService';
import { AuthContext } from '../../contexts/AuthContext';
import { getEmployeeCards } from '../../services/api';
import AppHeader from '../../components/AppHeader';

export default function AddRepairScreen(props) {
  const { user, navigation } = useContext(AuthContext);
  const [hasPermission, setHasPermission] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkPermission();
  }, [user?.id]);

  const checkPermission = async () => {
    if (!user?.id) {
      setHasPermission(false);
      setLoading(false);
      return;
    }
    
    try {
      const res = await getEmployeeCards(user.id);
      if (res.success && res.data?.allowedCards) {
        const allowed = res.data.allowedCards.includes('repair-service');
        setHasPermission(allowed);
        if (!allowed) {
          Alert.alert(
            'Access Denied',
            'You do not have permission to access Repair & Service. Contact admin.',
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
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={{ marginHorizontal: -20, marginTop: -20 }}>
          <AppHeader title="Repair & Service" showBrand={false} onBackPress={() => navigation.goBack()} />
        </View>
        <View style={styles.center}>
          <Text>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!hasPermission) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={{ marginHorizontal: -20, marginTop: -20 }}>
          <AppHeader title="Repair & Service" showBrand={false} onBackPress={() => navigation.goBack()} />
        </View>
        <View style={styles.center}>
          <Text style={styles.errorText}>Access Denied</Text>
          <Text style={styles.errorSubtext}>You do not have permission to access this feature.</Text>
        </View>
      </SafeAreaView>
    );
  }

  return <RepairAndService {...props} createdBy={user?.username || 'employee'} />;
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#F5F7FB' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  errorText: { fontSize: 18, fontWeight: '700', color: '#D32F2F', marginBottom: 8 },
  errorSubtext: { fontSize: 14, color: '#666', textAlign: 'center' },
});



