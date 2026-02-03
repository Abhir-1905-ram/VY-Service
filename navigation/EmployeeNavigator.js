import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import EmployeeDashboard from '../screens/employee/EmployeeDashboard';
import AddRepairScreen from '../screens/employee/AddRepairScreen';
import EmployeeRepairListScreen from '../screens/employee/EmployeeRepairListScreen';
import ProfileScreen from '../screens/common/ProfileScreen';
import SettingsScreen from '../screens/common/SettingsScreen';
import AttendanceScreen from '../screens/employee/AttendanceScreen';
import RepairEditScreen from '../screens/admin/RepairEditScreen';

const Stack = createNativeStackNavigator();

export default function EmployeeNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: true, headerTitle: 'VY Computer' }}>
      <Stack.Screen name="EmployeeDashboard" component={EmployeeDashboard} options={{ headerShown: false }} />
      <Stack.Screen name="AddRepair" component={AddRepairScreen} options={{ headerShown: false }} />
      <Stack.Screen name="MyRepairs" component={EmployeeRepairListScreen} options={{ headerShown: false }} />
      <Stack.Screen name="EmployeeRepairEdit" component={RepairEditScreen} options={{ headerShown: false }} />
      <Stack.Screen name="EmployeeProfile" component={ProfileScreen} options={{ headerShown: false }} />
      <Stack.Screen name="EmployeeSettings" component={SettingsScreen} options={{ headerShown: false }} />
      <Stack.Screen name="Attendance" component={AttendanceScreen} options={{ headerShown: false }} />
    </Stack.Navigator>
  );
}



