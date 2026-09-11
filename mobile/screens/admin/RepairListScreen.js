import React from 'react';
import RepairList from '../RepairList';

export default function RepairListScreen(props) {
  // Reuse existing RepairList for admin
  return <RepairList {...props} isAdmin />;
}



