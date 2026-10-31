import React, { useContext } from 'react';
import { StyleSheet } from 'react-native';
import { AuthContext } from '../../contexts/AuthContext';
import Screen from '../../components/Screen';
import AppHeader from '../../components/AppHeader';
import ActionCardButton from '../../components/ActionCardButton';
import SectionHeader from '../../components/SectionHeader';
import { spacing } from '../../ui/Theme';

export default function SalesDashboard({ navigation }) {
  const { user } = useContext(AuthContext);

  return (
    <Screen
      scroll
      header={
        <AppHeader
          showBrand
          brandName="Vyshnavi Computers"
          title={`Welcome back, ${user?.username || ''}`}
          rightAction={{ icon: 'person-circle-outline', onPress: () => navigation.navigate('SalesProfile'), label: 'Profile' }}
        />
      }
    >
      <SectionHeader title="Sales workspace" subtitle="Choose what you want to do" style={styles.section} />
      <ActionCardButton
        title="Orders"
        subtitle="Shop, place and notes"
        icon="bag-handle-outline"
        tone="primary"
        onPress={() => navigation.navigate('SalesOrders')}
      />
      <ActionCardButton
        title="Attendance"
        subtitle="Mark today"
        icon="calendar-outline"
        tone="success"
        onPress={() => navigation.navigate('Attendance')}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  section: { marginTop: 0, marginBottom: spacing.lg },
});
