import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import EmployeeDashboard from '../screens/employee/EmployeeDashboard';
import AddRepairScreen from '../screens/employee/AddRepairScreen';
import EmployeeRepairListScreen from '../screens/employee/EmployeeRepairListScreen';
import ProfileScreen from '../screens/common/ProfileScreen';
import SettingsScreen from '../screens/common/SettingsScreen';
import AttendanceScreen from '../screens/employee/AttendanceScreen';
import OrderListScreen from '../screens/orders/OrderListScreen';
import OrderFormScreen from '../screens/orders/OrderFormScreen';
import RepairEditScreen from '../screens/admin/RepairEditScreen';
import { colors } from '../ui/Theme';

const Stack = createNativeStackNavigator();

const screenOptions = {
  headerShown: false,
  animation: 'slide_from_right',
  contentStyle: { backgroundColor: colors.bg },
};

export default function EmployeeNavigator() {
  return (
    <Stack.Navigator screenOptions={screenOptions}>
      <Stack.Screen name="EmployeeDashboard" component={EmployeeDashboard} />
      <Stack.Screen name="AddRepair" component={AddRepairScreen} />
      <Stack.Screen name="MyRepairs" component={EmployeeRepairListScreen} />
      <Stack.Screen name="EmployeeRepairEdit" component={RepairEditScreen} />
      <Stack.Screen name="EmployeeProfile" component={ProfileScreen} />
      <Stack.Screen name="EmployeeSettings" component={SettingsScreen} />
      <Stack.Screen name="Attendance" component={AttendanceScreen} />
      <Stack.Screen name="EmployeeOrders" component={OrderListScreen} initialParams={{ mode: 'employee' }} />
      <Stack.Screen name="EmployeeOrderForm" component={OrderFormScreen} />
    </Stack.Navigator>
  );
}
