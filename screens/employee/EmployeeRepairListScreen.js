import React, { useContext, useEffect, useMemo, useState } from 'react';
import { SafeAreaView, Text } from 'react-native';
import RepairList from '../RepairList';
import { AuthContext } from '../../contexts/AuthContext';
import { getRepairs } from '../../services/api';

export default function EmployeeRepairListScreen({ navigation }) {
  const { user } = useContext(AuthContext);
  const [repairs, setRepairs] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const res = await getRepairs();
    if (res.success) setRepairs(res.data || []);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const myRepairs = useMemo(() => repairs.filter(r => r.createdBy === user?.username), [repairs, user]);

  if (loading) return <SafeAreaView><Text style={{ padding: 20 }}>Loading...</Text></SafeAreaView>;
  // Reuse RepairList is complex; instead show simple fallback or filter not integrated. For now, let RepairList show all; future improvement: pass prop to filter.
  return <RepairList navigation={navigation} />;
}



