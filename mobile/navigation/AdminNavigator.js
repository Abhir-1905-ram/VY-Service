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
<<<<<<< HEAD
import OrderListScreen from '../screens/orders/OrderListScreen';
import OrderFormScreen from '../screens/orders/OrderFormScreen';
=======
>>>>>>> 3e5d7325c20db157f7ce370f6bca04996d1fe0fc
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
<<<<<<< HEAD
      <Stack.Screen name="AdminOrders" component={OrderListScreen} initialParams={{ mode: 'admin' }} />
      <Stack.Screen name="AdminOrderForm" component={OrderFormScreen} />
=======
>>>>>>> 3e5d7325c20db157f7ce370f6bca04996d1fe0fc
    </Stack.Navigator>
  );
}
