import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import SalesDashboard from '../screens/sales/SalesDashboard';
import OrderListScreen from '../screens/orders/OrderListScreen';
import OrderFormScreen from '../screens/orders/OrderFormScreen';
import AttendanceScreen from '../screens/employee/AttendanceScreen';
import ProfileScreen from '../screens/common/ProfileScreen';
import SettingsScreen from '../screens/common/SettingsScreen';
import { colors } from '../ui/Theme';

const Stack = createNativeStackNavigator();

const screenOptions = {
  headerShown: false,
  animation: 'slide_from_right',
  contentStyle: { backgroundColor: colors.bg },
};

export default function SalesNavigator() {
  return (
    <Stack.Navigator screenOptions={screenOptions}>
      <Stack.Screen name="SalesDashboard" component={SalesDashboard} />
      <Stack.Screen name="SalesOrders" component={OrderListScreen} initialParams={{ mode: 'sales' }} />
      <Stack.Screen name="SalesOrderForm" component={OrderFormScreen} />
      <Stack.Screen name="Attendance" component={AttendanceScreen} />
      <Stack.Screen name="SalesProfile" component={ProfileScreen} />
      <Stack.Screen name="SalesSettings" component={SettingsScreen} />
    </Stack.Navigator>
  );
}
