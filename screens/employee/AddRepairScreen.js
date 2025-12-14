import React, { useContext } from 'react';
import RepairAndService from '../RepairAndService';
import { AuthContext } from '../../contexts/AuthContext';

export default function AddRepairScreen(props) {
  // Wrap existing screen; createdBy will be included in save handler from user context
  // We rely on RepairAndService using services/api.saveRepair; it should pass createdBy; we can patch that screen if needed.
  const { user } = useContext(AuthContext);
  return <RepairAndService {...props} createdBy={user?.username || 'employee'} />;
}



