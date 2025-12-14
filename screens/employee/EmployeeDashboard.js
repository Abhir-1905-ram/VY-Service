import React, { useContext, useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, Alert } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { AuthContext } from '../../contexts/AuthContext';
import AppButton from '../../components/AppButton';
import { colors } from '../../ui/Theme';
import ActionCardButton from '../../components/ActionCardButton';
import AppHeader from '../../components/AppHeader';
import { getEmployeeCards } from '../../services/api';

const CARD_CONFIG = {
  'repair-service': {
    title: 'Repair & Service',
    subtitle: 'Add new request',
    icon: 'construct-outline',
    navigateTo: 'AddRepair',
  },
  'repair-list': {
    title: 'My Repair List',
    subtitle: 'Track your items',
    icon: 'clipboard-outline',
    navigateTo: 'MyRepairs',
  },
  'attendance': {
    title: 'Attendance',
    subtitle: 'Mark today',
    icon: 'calendar-outline',
    navigateTo: 'Attendance',
  },
};

export default function EmployeeDashboard({ navigation }) {
  const { signOut, user } = useContext(AuthContext);
  const [allowedCards, setAllowedCards] = useState(['repair-service', 'repair-list', 'attendance']);

  const loadAllowedCards = async () => {
    if (!user?.id) {
      // Fallback to default if no user ID
      setAllowedCards(['repair-service', 'repair-list', 'attendance']);
      return;
    }
    try {
      const res = await getEmployeeCards(user.id);
      console.log('Employee cards response:', res);
      if (res.success && res.data?.allowedCards) {
        console.log('Setting allowed cards:', res.data.allowedCards);
        setAllowedCards(res.data.allowedCards);
      } else {
        console.log('API failed, using defaults');
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
        onPress={() => handleCardPress(cardId)}
      />
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={{ marginHorizontal: -20, marginTop: -20 }}>
        <AppHeader title="Employee" onProfilePress={() => navigation.navigate('EmployeeProfile')} />
      </View>
      <Text style={styles.title}>Welcome, {user?.username}</Text>
      <ScrollView style={{ marginTop: 16 }} showsVerticalScrollIndicator={false}>
        {allowedCards.length > 0 ? (
          allowedCards.map(cardId => renderCard(cardId))
        ) : (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No action cards available</Text>
            <Text style={styles.emptySubtext}>Contact admin to enable access</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#F5F7FB' },
  title: { fontSize: 20, fontWeight: '800', marginTop: 25, marginBottom: 16, color: colors.text },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textMuted,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: colors.textMuted,
  },
});



