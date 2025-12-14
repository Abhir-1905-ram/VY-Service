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

const Stack = createNativeStackNavigator();

export default function AdminNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: true, headerTitle: '' }}>
      <Stack.Screen name="AdminDashboard" component={AdminDashboard} options={{ headerShown: false }} />
      <Stack.Screen name="AdminEmployees" component={AdminEmployeeList} options={{ headerShown: false }} />
      <Stack.Screen name="AdminAttendanceList" component={AdminAttendanceListScreen} options={{ headerShown: false }} />
      <Stack.Screen name="AdminAttendanceEdit" component={AdminAttendanceEditScreen} options={{ headerShown: false }} />
      <Stack.Screen name="AdminEmployeeDetails" component={EmployeeDetailsScreen} options={{ headerShown: false }} />
      <Stack.Screen name="AdminRepairs" component={RepairListScreen} options={{ headerShown: false }} />
      <Stack.Screen name="AdminRepairStatus" component={RepairStatusUpdateScreen} options={{ headerShown: false }} />
      <Stack.Screen name="AdminRepairAndService" component={RepairAndService} options={{ headerShown: false }} />
      <Stack.Screen name="AdminRepairEdit" component={RepairEditScreen} options={{ headerShown: false }} />
    </Stack.Navigator>
  );
}



