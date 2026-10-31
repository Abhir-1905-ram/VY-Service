import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import Screen from '../../components/Screen';
import AppHeader from '../../components/AppHeader';
import AppCard from '../../components/AppCard';
import AppButton from '../../components/AppButton';
import Avatar from '../../components/Avatar';
import InfoRow from '../../components/InfoRow';
import ToggleRow from '../../components/ToggleRow';
import SectionHeader from '../../components/SectionHeader';
import LoadingState from '../../components/LoadingState';
import EmptyState from '../../components/EmptyState';
import { colors, spacing, tones, radii } from '../../ui/Theme';
<<<<<<< HEAD
import ChoiceChips from '../../components/ChoiceChips';
import { getEmployeeCards, updateEmployee } from '../../services/api';

const KIND_OPTIONS = [
  { value: 'employee', label: 'Employee', icon: 'construct-outline' },
  { value: 'sales', label: 'Sales', icon: 'briefcase-outline' },
];
=======
import { getEmployeeCards, updateEmployeeCards } from '../../services/api';
>>>>>>> 3e5d7325c20db157f7ce370f6bca04996d1fe0fc

const CARD_OPTIONS = [
  { id: 'repair-service', label: 'Repair & Service', description: 'Allow employee to add new repair requests', icon: 'construct-outline' },
  { id: 'repair-list', label: 'My Repair List', description: 'Allow employee to view their repair list', icon: 'clipboard-outline' },
  { id: 'attendance', label: 'Attendance', description: 'Allow employee to mark attendance', icon: 'calendar-outline' },
];

export default function EmployeeDetailsScreen({ route, navigation }) {
  const { employee } = route.params || {};
  const [allowedCards, setAllowedCards] = useState(['repair-service', 'repair-list', 'attendance']);
  const [canRemoveRepairs, setCanRemoveRepairs] = useState(false);
<<<<<<< HEAD
  const [employeeKind, setEmployeeKind] = useState(employee?.employeeKind === 'sales' ? 'sales' : 'employee');
=======
>>>>>>> 3e5d7325c20db157f7ce370f6bca04996d1fe0fc
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
      if (res.success && res.data?.allowedCards !== undefined) {
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
          setAllowedCards(employee.allowedCards);
        } else {
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

<<<<<<< HEAD
      const res = await updateEmployee(employee._id, {
        allowedCards: cardsToSave,
        canRemoveRepairs,
        employeeKind,
      });
=======
      const res = await updateEmployeeCards(employee._id, cardsToSave, canRemoveRepairs);
>>>>>>> 3e5d7325c20db157f7ce370f6bca04996d1fe0fc

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

  if (!employee) {
    return (
      <Screen header={<AppHeader title="Employee Details" onBackPress={() => navigation.goBack()} />}>
        <EmptyState icon="person-outline" tone="neutral" title="No employee" subtitle="This employee could not be found." />
      </Screen>
    );
  }

  const approvedTone = employee.isApproved ? tones.success : tones.warning;

  return (
    <Screen scroll header={<AppHeader title="Employee Details" onBackPress={() => navigation.goBack()} />}>
      <AppCard style={styles.profileCard}>
        <View style={styles.profileRow}>
          <Avatar name={employee.username} size={56} />
          <View style={styles.profileText}>
            <Text style={styles.name}>{employee.username}</Text>
            <View style={[styles.pill, { backgroundColor: approvedTone.soft }]}>
              <Text style={[styles.pillText, { color: approvedTone.main }]}>{employee.isApproved ? 'Approved' : 'Awaiting approval'}</Text>
            </View>
          </View>
        </View>
        <View style={styles.infoBlock}>
          <InfoRow icon="person-outline" label="Username" value={employee.username} />
<<<<<<< HEAD
          <InfoRow icon="shield-checkmark-outline" label="Approved" value={employee.isApproved ? 'Yes' : 'No'} />
          <InfoRow icon="briefcase-outline" label="Login" value={employeeKind === 'sales' ? 'Sales' : 'Employee'} last />
=======
          <InfoRow icon="shield-checkmark-outline" label="Approved" value={employee.isApproved ? 'Yes' : 'No'} last />
>>>>>>> 3e5d7325c20db157f7ce370f6bca04996d1fe0fc
        </View>
      </AppCard>

      {loading ? (
        <LoadingState message="Loading permissions..." style={styles.loading} />
      ) : (
        <>
<<<<<<< HEAD
          <SectionHeader title="Login type" subtitle="Sales and employee accounts use different logins" />
          <AppCard style={styles.card}>
            <ChoiceChips
              options={KIND_OPTIONS}
              value={employeeKind}
              onChange={(kind) => {
                setEmployeeKind(kind);
                if (kind === 'sales') {
                  setAllowedCards((prev) => (Array.isArray(prev) ? prev.filter((id) => id === 'attendance') : ['attendance']));
                  setCanRemoveRepairs(false);
                }
              }}
              style={styles.kinds}
            />
          </AppCard>

          <SectionHeader
            title="Allowed action cards"
            subtitle={employeeKind === 'sales' ? 'Sales accounts do not get repair tools' : 'Select which action cards this employee can access'}
          />
          <AppCard style={styles.card}>
            {CARD_OPTIONS.filter((card) => employeeKind !== 'sales' || card.id === 'attendance').map((card, idx, list) => {
=======
          <SectionHeader title="Allowed action cards" subtitle="Select which action cards this employee can access" />
          <AppCard style={styles.card}>
            {CARD_OPTIONS.map((card, idx) => {
>>>>>>> 3e5d7325c20db157f7ce370f6bca04996d1fe0fc
              const isEnabled = allowedCards.includes(card.id);
              const isDisabled = card.id === 'repair-list' && !allowedCards.includes('repair-service');
              return (
                <ToggleRow
                  key={card.id}
                  icon={card.icon}
                  label={card.label}
                  description={card.description}
                  note={card.id === 'repair-list' ? 'Requires: Repair & Service' : undefined}
                  value={isEnabled && !isDisabled}
                  onValueChange={() => toggleCard(card.id)}
                  disabled={isDisabled}
<<<<<<< HEAD
                  last={idx === list.length - 1}
=======
                  last={idx === CARD_OPTIONS.length - 1}
>>>>>>> 3e5d7325c20db157f7ce370f6bca04996d1fe0fc
                />
              );
            })}
          </AppCard>

<<<<<<< HEAD
          {employeeKind !== 'sales' && (
            <>
              <SectionHeader title="Repair list permissions" subtitle="Control special permissions for repair management" />
              <AppCard style={styles.card}>
                <ToggleRow
                  icon="trash-outline"
                  label="Remove Pending Repairs"
                  description="Allow employee to remove repair items from the Pending list"
                  value={canRemoveRepairs}
                  onValueChange={setCanRemoveRepairs}
                  last
                />
              </AppCard>
            </>
          )}
=======
          <SectionHeader title="Repair list permissions" subtitle="Control special permissions for repair management" />
          <AppCard style={styles.card}>
            <ToggleRow
              icon="trash-outline"
              label="Remove Pending Repairs"
              description="Allow employee to remove repair items from the Pending list"
              value={canRemoveRepairs}
              onValueChange={setCanRemoveRepairs}
              last
            />
          </AppCard>
>>>>>>> 3e5d7325c20db157f7ce370f6bca04996d1fe0fc

          <AppButton
            title="Save Changes"
            icon="save-outline"
            size="lg"
            loading={saving}
            onPress={handleSave}
            style={styles.save}
          />
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  profileCard: { marginBottom: spacing.lg },
  profileRow: { flexDirection: 'row', alignItems: 'center' },
  profileText: { flex: 1, marginLeft: spacing.md },
  name: { fontSize: 18, fontWeight: '800', color: colors.text, marginBottom: 6 },
  pill: { alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 3, borderRadius: radii.round },
  pillText: { fontSize: 11, fontWeight: '800' },
  infoBlock: { marginTop: spacing.md, borderTopWidth: 1, borderTopColor: colors.border, paddingTop: spacing.xs },
  card: { paddingVertical: spacing.xs },
<<<<<<< HEAD
  kinds: { marginVertical: spacing.md, marginHorizontal: spacing.md },
=======
>>>>>>> 3e5d7325c20db157f7ce370f6bca04996d1fe0fc
  loading: { paddingVertical: spacing.xl },
  save: { marginTop: spacing.xl, marginBottom: spacing.lg },
});
