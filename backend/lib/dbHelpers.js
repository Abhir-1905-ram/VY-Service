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
  mapEmployee,
  mapRepair,
  mapAttendance,
  isUniqueViolation,
};
