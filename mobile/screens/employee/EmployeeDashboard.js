import React, { useContext, useState, useEffect } from 'react';
import { StyleSheet, Alert } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { AuthContext } from '../../contexts/AuthContext';
import Screen from '../../components/Screen';
import AppHeader from '../../components/AppHeader';
import ActionCardButton from '../../components/ActionCardButton';
import SectionHeader from '../../components/SectionHeader';
import EmptyState from '../../components/EmptyState';
import { getEmployeeCards } from '../../services/api';
import { spacing } from '../../ui/Theme';

const CARD_CONFIG = {
  'repair-service': {
    title: 'Repair & Service',
    subtitle: 'Add new request',
    icon: 'construct-outline',
    tone: 'primary',
    navigateTo: 'AddRepair',
  },
  'repair-list': {
    title: 'My Repair List',
    subtitle: 'Track your items',
    icon: 'clipboard-outline',
    tone: 'info',
    navigateTo: 'MyRepairs',
  },
  'attendance': {
    title: 'Attendance',
    subtitle: 'Mark today',
    icon: 'calendar-outline',
    tone: 'success',
    navigateTo: 'Attendance',
  },
};

export default function EmployeeDashboard({ navigation }) {
  const { user } = useContext(AuthContext);
  const [allowedCards, setAllowedCards] = useState(['repair-service', 'repair-list', 'attendance']);

  const loadAllowedCards = async () => {
    if (!user?.id) {
      // Fallback to default if no user ID
      setAllowedCards(['repair-service', 'repair-list', 'attendance']);
      return;
    }
    try {
      const res = await getEmployeeCards(user.id);
      if (res.success && res.data?.allowedCards) {
        setAllowedCards(res.data.allowedCards);
      } else {
        // Fallback to default cards if API fails
        setAllowedCards(['repair-service', 'repair-list', 'attendance']);
      }
    } catch (error) {
      console.error('Error loading cards:', error);
      setAllowedCards(['repair-service', 'repair-list', 'attendance']);
    }
  };

  useEffect(() => {
    loadAllowedCards();
  }, [user?.id]);

  // Refresh cards when screen comes into focus (after admin changes)
  useFocusEffect(
    React.useCallback(() => {
      loadAllowedCards();
    }, [user?.id])
  );

  const handleCardPress = async (cardId) => {
    // Check permissions before navigation
    const hasPermission = allowedCards.includes(cardId);

    // Special check: Repair List requires Repair & Service
    if (cardId === 'repair-list' && !allowedCards.includes('repair-service')) {
      Alert.alert('Access Denied', 'You need permission for Repair & Service to access Repair List.');
      return;
    }

    if (!hasPermission) {
      Alert.alert('Access Denied', 'You do not have permission to access this feature. Contact admin.');
      return;
    }

    const config = CARD_CONFIG[cardId];
    if (config) {
      navigation.navigate(config.navigateTo);
    }
  };

  const renderCard = (cardId) => {
    const config = CARD_CONFIG[cardId];
    if (!config) return null;

    return (
      <ActionCardButton
        key={cardId}
        title={config.title}
        subtitle={config.subtitle}
        icon={config.icon}
        tone={config.tone}
        onPress={() => handleCardPress(cardId)}
      />
    );
  };

  return (
    <Screen
      scroll
      header={
        <AppHeader
          showBrand
          brandName="Vyshnavi Computers"
          title={`Welcome back, ${user?.username || ''}`}
          rightAction={{ icon: 'person-circle-outline', onPress: () => navigation.navigate('EmployeeProfile'), label: 'Profile' }}
        />
      }
    >
      <SectionHeader title="Your workspace" subtitle="Choose what you want to do" style={styles.section} />
      <ActionCardButton
        title="Orders"
        subtitle="Approve and mark delivered"
        icon="bag-handle-outline"
        tone="warning"
        onPress={() => navigation.navigate('EmployeeOrders')}
      />
      {allowedCards.length > 0 ? (
        allowedCards.map(cardId => renderCard(cardId))
      ) : (
        <EmptyState
          icon="lock-closed-outline"
          tone="neutral"
          title="No action cards available"
          subtitle="Contact admin to enable access"
        />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  section: { marginTop: 0, marginBottom: spacing.lg },
});
