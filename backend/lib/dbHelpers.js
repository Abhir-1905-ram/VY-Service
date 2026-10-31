const EMPLOYEE_PUBLIC_COLUMNS =
<<<<<<< HEAD
  'id, username, is_approved, allowed_cards, can_remove_repairs, employee_kind, created_at, updated_at';
=======
  'id, username, is_approved, allowed_cards, can_remove_repairs, created_at, updated_at';
>>>>>>> 3e5d7325c20db157f7ce370f6bca04996d1fe0fc

function mapEmployee(row) {
  if (!row) return row;
  return {
    id: row.id,
    _id: row.id,
    username: row.username,
    password: row.password,
    isApproved: row.is_approved,
    allowedCards: row.allowed_cards || [],
    canRemoveRepairs: row.can_remove_repairs || false,
<<<<<<< HEAD
    employeeKind: row.employee_kind === 'sales' ? 'sales' : 'employee',
=======
>>>>>>> 3e5d7325c20db157f7ce370f6bca04996d1fe0fc
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapRepair(row) {
  if (!row) return row;
  return {
    id: row.id,
    _id: row.id,
    uniqueId: row.unique_id,
    customerName: row.customer_name,
    phoneNumber: row.phone_number,
    type: row.type,
    brand: row.brand || '',
    adapterGiven: row.adapter_given,
    problem: row.problem,
    createdAt: row.created_at,
    deliveredAt: row.delivered_at,
    status: row.status,
    remark: row.remark || '',
    createdBy: row.created_by || '',
    amount: row.amount,
    expectedAmount: row.expected_amount,
    updatedAt: row.updated_at,
  };
}

function mapAttendance(row) {
  if (!row) return row;
  return {
    id: row.id,
    _id: row.id,
    employeeId: row.employee_id,
    employeeName: row.employee_name,
    date: row.date,
    ipAddress: row.ip_address,
    lat: row.lat,
    lng: row.lng,
    accuracy: row.accuracy,
    timestamp: row.timestamp,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function isUniqueViolation(error) {
  return error?.code === '23505';
}

module.exports = {
  EMPLOYEE_PUBLIC_COLUMNS,
  mapEmployee,
  mapRepair,
  mapAttendance,
  isUniqueViolation,
};
