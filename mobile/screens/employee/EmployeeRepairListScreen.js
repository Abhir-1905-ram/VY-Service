import React, { useContext, useEffect, useMemo, useState } from 'react';
import { Alert } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import RepairList from '../RepairList';
import { AuthContext } from '../../contexts/AuthContext';
import { getRepairs, getEmployeeCards } from '../../services/api';
import Screen from '../../components/Screen';
import AppHeader from '../../components/AppHeader';
import LoadingState from '../../components/LoadingState';
import EmptyState from '../../components/EmptyState';

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
        load();
      }
    }, [hasPermission])
  );

  const myRepairs = useMemo(() => repairs.filter(r => r.createdBy === user?.username), [repairs, user]);

  if (checkingPermission) {
    return (
      <Screen header={<AppHeader title="My Repair List" onBackPress={() => navigation.goBack()} />}>
        <LoadingState message="Checking permissions..." />
      </Screen>
    );
  }

  if (!hasPermission) {
    return (
      <Screen header={<AppHeader title="My Repair List" onBackPress={() => navigation.goBack()} />}>
        <EmptyState
          icon="lock-closed-outline"
          tone="danger"
          title="Access Denied"
          subtitle="You do not have permission to access this feature."
        />
      </Screen>
    );
  }

  if (loading) {
    return (
      <Screen header={<AppHeader title="My Repair List" onBackPress={() => navigation.goBack()} />}>
        <LoadingState message="Loading repairs..." />
      </Screen>
    );
  }

  return <RepairList navigation={navigation} isAdmin={false} />;
}
