import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, Switch, ScrollView, Alert } from 'react-native';
import AppHeader from '../../components/AppHeader';
import AppCard from '../../components/AppCard';
import { colors } from '../../ui/Theme';
import { getEmployeeCards, updateEmployeeCards } from '../../services/api';
import AppButton from '../../components/AppButton';

const CARD_OPTIONS = [
  { id: 'repair-service', label: 'Repair & Service', description: 'Allow employee to add new repair requests' },
  { id: 'repair-list', label: 'My Repair List', description: 'Allow employee to view their repair list' },
  { id: 'attendance', label: 'Attendance', description: 'Allow employee to mark attendance' },
];

export default function EmployeeDetailsScreen({ route, navigation }) {
  const { employee } = route.params || {};
  const [allowedCards, setAllowedCards] = useState(['repair-service', 'repair-list', 'attendance']);
  const [canRemoveRepairs, setCanRemoveRepairs] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadCards();
  }, [employee?._id]);

  const loadCards = async () => {
    if (!employee?._id) return;
    setLoading(true);
    try {
      const res = await getEmployeeCards(employee._id);
      console.log('Loading cards for employee:', employee._id, 'Response:', res);
      if (res.success && res.data?.allowedCards !== undefined) {
        console.log('Loaded allowed cards:', res.data.allowedCards);
        console.log('Cards array type:', Array.isArray(res.data.allowedCards));
        console.log('Cards array length:', res.data.allowedCards.length);
        setAllowedCards(res.data.allowedCards);
        // Load canRemoveRepairs permission
        if (res.data.canRemoveRepairs !== undefined) {
          setCanRemoveRepairs(res.data.canRemoveRepairs);
        } else if (employee.canRemoveRepairs !== undefined) {
          setCanRemoveRepairs(employee.canRemoveRepairs);
        }
      } else {
        // If API fails, try employee object, otherwise use defaults
        if (employee.allowedCards !== undefined) {
          console.log('Using employee.allowedCards from route params:', employee.allowedCards);
          setAllowedCards(employee.allowedCards);
        } else {
          console.log('No cards found, using defaults');
          setAllowedCards(['repair-service', 'repair-list', 'attendance']);
        }
        if (employee.canRemoveRepairs !== undefined) {
          setCanRemoveRepairs(employee.canRemoveRepairs);
        }
      }
    } catch (error) {
      console.error('Error loading cards:', error);
      if (employee.allowedCards !== undefined) {
        setAllowedCards(employee.allowedCards);
      } else {
        setAllowedCards(['repair-service', 'repair-list', 'attendance']);
      }
      if (employee.canRemoveRepairs !== undefined) {
        setCanRemoveRepairs(employee.canRemoveRepairs);
      }
    } finally {
      setLoading(false);
    }
  };

  const toggleCard = (cardId) => {
    setAllowedCards(prev => {
      // Ensure prev is always an array
      const currentCards = Array.isArray(prev) ? [...prev] : [];
      
      if (cardId === 'repair-service') {
        // If disabling Repair & Service, also disable Repair List
        if (currentCards.includes(cardId)) {
          // Remove repair-service and repair-list, keep others
          const newCards = currentCards.filter(id => id !== cardId && id !== 'repair-list');
          return newCards;
        } else {
          // Add repair-service, keep others
          return [...currentCards, cardId];
        }
      } else if (cardId === 'repair-list') {
        // If enabling Repair List, ensure Repair & Service is also enabled
        if (currentCards.includes(cardId)) {
          // Remove repair-list only, keep others
          return currentCards.filter(id => id !== cardId);
        } else {
          // Add repair-list, and repair-service if not already there
          const newCards = [...currentCards];
          if (!newCards.includes('repair-service')) {
            newCards.push('repair-service');
          }
          if (!newCards.includes(cardId)) {
            newCards.push(cardId);
          }
          return newCards;
        }
      } else {
        // For attendance, simple toggle - keep all other cards
        if (currentCards.includes(cardId)) {
          return currentCards.filter(id => id !== cardId);
        } else {
          return [...currentCards, cardId];
        }
      }
    });
  };

  const handleSave = async () => {
    if (!employee?._id) return;
    setSaving(true);
    try {
      // Ensure we're sending an array, even if empty
      const cardsToSave = Array.isArray(allowedCards) ? allowedCards : [];
      
      const res = await updateEmployeeCards(employee._id, cardsToSave, canRemoveRepairs);
      
      if (res.success) {
        // Get the saved cards from response
        let savedCards = res.data?.allowedCards;
        let savedCanRemove = res.data?.canRemoveRepairs;
        
        // If not in response or not an array, reload from API to verify
        if (!savedCards || !Array.isArray(savedCards)) {
          const verifyRes = await getEmployeeCards(employee._id);
          if (verifyRes.success && Array.isArray(verifyRes.data?.allowedCards)) {
            savedCards = verifyRes.data.allowedCards;
          } else {
            // Fallback to what we sent (shouldn't happen, but safety)
            savedCards = cardsToSave;
          }
        }
        if (savedCanRemove === undefined) {
          const verifyRes = await getEmployeeCards(employee._id);
          if (verifyRes.success && verifyRes.data?.canRemoveRepairs !== undefined) {
            savedCanRemove = verifyRes.data.canRemoveRepairs;
          } else {
            savedCanRemove = canRemoveRepairs;
          }
        }
        
        // Update local state with the confirmed saved values
        setAllowedCards(savedCards);
        setCanRemoveRepairs(savedCanRemove);
        
        Alert.alert('Success', `Permissions updated successfully!\n\nAllowed cards: ${savedCards.length}\nCan remove repairs: ${savedCanRemove ? 'Yes' : 'No'}`, [
          { text: 'OK', onPress: () => navigation.goBack() }
        ]);
      } else {
        Alert.alert('Error', res.message || 'Failed to update permissions');
      }
    } catch (error) {
      console.error('Save error:', error);
      Alert.alert('Error', error.message || 'Failed to update permissions');
    } finally {
      setSaving(false);
    }
  };

  if (!employee) return <SafeAreaView><Text style={{ padding: 20 }}>No employee</Text></SafeAreaView>;
  
  return (
    <SafeAreaView style={styles.container}>
      <View style={{ marginHorizontal: -20, marginTop: -20 }}>
        <AppHeader title="Employee Details" showBrand={false} onBackPress={() => navigation.goBack()} />
      </View>
      <ScrollView showsVerticalScrollIndicator={false}>
        <AppCard>
          <Text style={styles.title}>Employee Information</Text>
          <Text style={styles.row}>Username: {employee.username}</Text>
          <Text style={styles.row}>Password: {employee.password}</Text>
          <Text style={styles.row}>Approved: {employee.isApproved ? 'Yes' : 'No'}</Text>
        </AppCard>

        <AppCard style={{ marginTop: 16 }}>
          <Text style={styles.title}>Allowed Action Cards</Text>
          <Text style={styles.subtitle}>Select which action cards this employee can access</Text>
          
          {CARD_OPTIONS.map((card) => {
            const isEnabled = allowedCards.includes(card.id);
            const isDisabled = card.id === 'repair-list' && !allowedCards.includes('repair-service');
            
            return (
            <View key={card.id} style={styles.cardOption}>
              <View style={styles.cardOptionContent}>
                <Text style={styles.cardLabel}>{card.label}</Text>
                  <Text style={styles.cardDescription}>
                    {card.description}
                    {card.id === 'repair-list' && (
                      <Text style={styles.requirementText}>
                        {'\n'}Requires: Repair & Service
                      </Text>
                    )}
                  </Text>
              </View>
              <Switch
                  value={isEnabled && !isDisabled}
                onValueChange={() => toggleCard(card.id)}
                  disabled={isDisabled}
                trackColor={{ false: '#E0E0E0', true: colors.secondary }}
                  thumbColor={isEnabled && !isDisabled ? '#fff' : '#f4f3f4'}
              />
            </View>
            );
          })}
        </AppCard>

        <AppCard style={{ marginTop: 16 }}>
          <Text style={styles.title}>Repair List Permissions</Text>
          <Text style={styles.subtitle}>Control special permissions for repair management</Text>
          
          <View style={styles.cardOption}>
            <View style={styles.cardOptionContent}>
              <Text style={styles.cardLabel}>Remove Pending Repairs</Text>
              <Text style={styles.cardDescription}>
                Allow employee to remove repair items from the Pending list
              </Text>
            </View>
            <Switch
              value={canRemoveRepairs}
              onValueChange={setCanRemoveRepairs}
              trackColor={{ false: '#E0E0E0', true: colors.secondary }}
              thumbColor={canRemoveRepairs ? '#fff' : '#f4f3f4'}
            />
          </View>
        </AppCard>

        <AppButton
          title={saving ? 'Saving...' : 'Save Changes'}
          onPress={handleSave}
          style={{ marginTop: 20, marginBottom: 20 }}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#F5F7FB' },
  title: { fontSize: 20, fontWeight: '800', marginBottom: 12, color: colors.text },
  subtitle: { fontSize: 14, color: colors.textMuted, marginBottom: 16 },
  row: { fontSize: 14, marginBottom: 8, color: '#37474F' },
  cardOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  cardOptionContent: {
    flex: 1,
    marginRight: 16,
  },
  cardLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 4,
  },
  cardDescription: {
    fontSize: 12,
    color: colors.textMuted,
  },
  requirementText: {
    fontSize: 11,
    color: colors.warning,
    fontStyle: 'italic',
  },
});



