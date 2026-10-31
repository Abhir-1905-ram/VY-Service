import React, { useContext, useEffect, useState } from 'react';
import { Alert } from 'react-native';
import RepairAndService from '../RepairAndService';
import { AuthContext } from '../../contexts/AuthContext';
import { getEmployeeCards } from '../../services/api';
import Screen from '../../components/Screen';
import AppHeader from '../../components/AppHeader';
import LoadingState from '../../components/LoadingState';
import EmptyState from '../../components/EmptyState';

export default function AddRepairScreen(props) {
  const { navigation } = props;
  const { user } = useContext(AuthContext);
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
      <Screen header={<AppHeader title="Repair & Service" onBackPress={() => navigation.goBack()} />}>
        <LoadingState message="Checking permissions..." />
      </Screen>
    );
  }

  if (!hasPermission) {
    return (
      <Screen header={<AppHeader title="Repair & Service" onBackPress={() => navigation.goBack()} />}>
        <EmptyState
          icon="lock-closed-outline"
          tone="danger"
          title="Access Denied"
          subtitle="You do not have permission to access this feature."
        />
      </Screen>
    );
  }

  return <RepairAndService {...props} createdBy={user?.username || 'employee'} />;
}
