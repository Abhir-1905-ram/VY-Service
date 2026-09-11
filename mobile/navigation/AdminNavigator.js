import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import AdminDashboard from '../screens/admin/AdminDashboard';
import AdminEmployeeList from '../screens/admin/EmployeeListScreen';
import EmployeeDetailsScreen from '../screens/admin/EmployeeDetailsScreen';
import RepairListScreen from '../screens/admin/RepairListScreen';
import RepairStatusUpdateScreen from '../screens/admin/RepairStatusUpdateScreen';
import RepairAndService from '../screens/RepairAndService';
import AdminAttendanceListScreen from '../screens/admin/AdminAttendanceListScreen';
import AdminAttendanceEditScreen from '../screens/admin/AdminAttendanceEditScreen';
import RepairEditScreen from '../screens/admin/RepairEditScreen';
import { colors } from '../ui/Theme';

const Stack = createNativeStackNavigator();

const screenOptions = {
  headerShown: false,
  animation: 'slide_from_right',
  contentStyle: { backgroundColor: colors.bg },
};

export default function AdminNavigator() {
  return (
    <Stack.Navigator screenOptions={screenOptions}>
      <Stack.Screen name="AdminDashboard" component={AdminDashboard} />
      <Stack.Screen name="AdminEmployees" component={AdminEmployeeList} />
      <Stack.Screen name="AdminAttendanceList" component={AdminAttendanceListScreen} />
      <Stack.Screen name="AdminAttendanceEdit" component={AdminAttendanceEditScreen} />
      <Stack.Screen name="AdminEmployeeDetails" component={EmployeeDetailsScreen} />
      <Stack.Screen name="AdminRepairs" component={RepairListScreen} />
      <Stack.Screen name="AdminRepairStatus" component={RepairStatusUpdateScreen} />
      <Stack.Screen name="AdminRepairAndService" component={RepairAndService} />
      <Stack.Screen name="AdminRepairEdit" component={RepairEditScreen} />
    </Stack.Navigator>
  );
}
