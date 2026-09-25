import { supabase, SUPABASE_URL } from './supabaseClient';

export const API_BASE_URL = SUPABASE_URL;

const OFFICE_WIFI_IP = '';
const OFFICE_WIFI_CIDR = '192.168.0.0/24';
const OFFICE_LAT = 16.51269865608437;
const OFFICE_LNG = 80.62553365804501;
const OFFICE_RADIUS_M = 80;

function mapEmployee(row) {
  if (!row) return row;
  return {
    id: row.id,
    _id: row.id,
    username: row.username,
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

function toYyyyMmDd(date = new Date()) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function ipToInt(ip) {
  try {
    return ip.split('.').reduce((acc, oct) => (acc << 8) + parseInt(oct, 10), 0) >>> 0;
  } catch {
    return 0;
  }
}

function cidrContains(cidr, ip) {
  if (!cidr) return false;
  const [base, maskBitsStr] = cidr.split('/');
  const maskBits = parseInt(maskBitsStr || '0', 10);
  if (!base || !Number.isFinite(maskBits)) return false;
  const ipInt = ipToInt(ip);
  const baseInt = ipToInt(base);
  const mask = maskBits === 0 ? 0 : (~0 << (32 - maskBits)) >>> 0;
  return (ipInt & mask) === (baseInt & mask);
}

function isIpAllowed(ip) {
  const trimmed = String(ip || '').trim();
  if (!trimmed) return false;
  const entries = []
    .concat(String(OFFICE_WIFI_CIDR || '').split(','))
    .concat(String(OFFICE_WIFI_IP || '').split(','))
    .map(s => String(s || '').trim())
    .filter(Boolean);
  for (const entry of entries) {
    if (entry.includes('/')) {
      if (cidrContains(entry, trimmed)) return true;
    } else if (trimmed === entry) {
      return true;
    }
  }
  return false;
}

function haversineMeters(lat1, lon1, lat2, lon2) {
  const toRad = (x) => (x * Math.PI) / 180;
  const R = 6371000;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function isLocationAllowed(lat, lng) {
  if (typeof OFFICE_LAT !== 'number' || typeof OFFICE_LNG !== 'number') return true;
  if (typeof lat !== 'number' || typeof lng !== 'number' || Number.isNaN(lat) || Number.isNaN(lng)) return false;
  const dist = haversineMeters(lat, lng, OFFICE_LAT, OFFICE_LNG);
  return dist <= (Number.isFinite(OFFICE_RADIUS_M) ? OFFICE_RADIUS_M : 150);
}

const EMPLOYEE_PUBLIC_COLUMNS =
  'id, username, is_approved, allowed_cards, can_remove_repairs, created_at, updated_at';

function uniqueViolation(error) {
  return error?.code === '23505';
}

export const saveRepair = async (repairData) => {
  try {
    let expectedAmountValue = null;
    if (repairData.expectedAmount !== undefined && repairData.expectedAmount !== null && repairData.expectedAmount !== '') {
      const parsed = parseFloat(repairData.expectedAmount);
      if (!isNaN(parsed) && parsed > 0) expectedAmountValue = parsed;
    }

    const row = {
      unique_id: repairData.uniqueId,
      customer_name: repairData.customerName,
      phone_number: repairData.phoneNumber,
      type: repairData.type,
      brand: repairData.brand || '',
      adapter_given: repairData.adapterGiven,
      problem: repairData.problem,
      created_at: repairData.createdAt ? new Date(repairData.createdAt).toISOString() : new Date().toISOString(),
      status: repairData.status || 'Pending',
      created_by: repairData.createdBy || '',
      expected_amount: expectedAmountValue,
    };

    const { data, error } = await supabase.from('repairs').insert(row).select().single();
    if (error) return { success: false, message: error.message };
    return { success: true, data: { data: mapRepair(data) } };
  } catch (error) {
    return { success: false, message: error.message || 'Network error' };
  }
};

export const getRepairs = async () => {
  try {
    const { data, error } = await supabase.from('repairs').select('*').order('created_at', { ascending: false });
    if (error) return { success: false, message: error.message };
    return { success: true, data: (data || []).map(mapRepair) };
  } catch (error) {
    return { success: false, message: error.message || 'Network error' };
  }
};

export const getRepairById = async (uniqueId) => {
  try {
    const { data, error } = await supabase
      .from('repairs')
      .select('*')
      .eq('unique_id', uniqueId)
      .order('created_at', { ascending: false });
    if (error) return { success: false, message: error.message };
    if (!data || data.length === 0) return { success: false, message: 'Repair not found' };
    const mapped = data.map(mapRepair);
    return { success: true, data: mapped[0], history: mapped, totalEntries: mapped.length };
  } catch (error) {
    return { success: false, message: error.message || 'Network error' };
  }
};

export const updateRepair = async (id, updateData) => {
  try {
    const row = {};
    if (updateData.customerName !== undefined) row.customer_name = String(updateData.customerName).trim();
    if (updateData.phoneNumber !== undefined) row.phone_number = updateData.phoneNumber;
    if (updateData.type !== undefined) row.type = String(updateData.type).trim();
    if (updateData.brand !== undefined) row.brand = String(updateData.brand).trim();
    if (updateData.problem !== undefined) row.problem = String(updateData.problem).trim();
    if (updateData.adapterGiven !== undefined) row.adapter_given = updateData.adapterGiven;
    if (updateData.expectedAmount !== undefined) {
      if (updateData.expectedAmount === null || updateData.expectedAmount === '' || updateData.expectedAmount === 0) {
        row.expected_amount = null;
      } else {
        const val = parseFloat(updateData.expectedAmount);
        row.expected_amount = isNaN(val) ? null : val;
      }
    }
    if (updateData.deliveredAt !== undefined) {
      row.delivered_at =
        updateData.deliveredAt === null || updateData.deliveredAt === ''
          ? null
          : new Date(updateData.deliveredAt).toISOString();
    }
    if (updateData.status) row.status = updateData.status;
    if (updateData.remark !== undefined) row.remark = updateData.remark;
    if (updateData.amount !== undefined) {
      if (updateData.amount === null || updateData.amount === '' || updateData.amount === 0) {
        row.amount = null;
      } else {
        const val = parseFloat(updateData.amount);
        row.amount = isNaN(val) ? null : val;
      }
    }

    const { data, error } = await supabase.from('repairs').update(row).eq('id', id).select().single();
    if (error) return { success: false, message: error.message };
    return { success: true, data: mapRepair(data) };
  } catch (error) {
    return { success: false, message: error.message || 'Network error' };
  }
};

export const deleteRepair = async (id) => {
  try {
    const { data: repair, error: fetchError } = await supabase.from('repairs').select('*').eq('id', id).single();
    if (fetchError || !repair) return { success: false, message: 'Repair entry not found' };
    if (repair.status !== 'Pending') return { success: false, message: 'Only pending repairs can be removed' };
    const { error } = await supabase.from('repairs').delete().eq('id', id);
    if (error) return { success: false, message: error.message };
    return { success: true, data: { id } };
  } catch (error) {
    return { success: false, message: error.message || 'Network error' };
  }
};

export const login = async (username, password) => {
  try {
    if (username === 'admin' && password === 'admin@1152') {
      return { success: true, data: { role: 'admin', user: { username: 'admin' } } };
    }
    const { data, error } = await supabase.rpc('login_employee', {
      p_username: username,
      p_password: password,
    });
    if (error) {
      if (error.message && error.message.includes('schema cache')) {
        return { success: false, message: 'Database tables are not set up. Run schema.sql in Supabase SQL Editor.' };
      }
      return { success: false, message: error.message || 'Login failed' };
    }
    if (!data?.ok) {
      return { success: false, message: data?.message || 'Invalid credentials' };
    }
    const cards = Array.isArray(data.allowed_cards) ? data.allowed_cards : [];
    return {
      success: true,
      data: {
        role: 'employee',
        user: {
          id: data.id,
          username: data.username,
          allowedCards: cards.length ? cards : ['repair-service', 'repair-list', 'attendance'],
          canRemoveRepairs: !!data.can_remove_repairs,
        },
      },
    };
  } catch (error) {
    return { success: false, message: error.message || 'Network error' };
  }
};

export const signup = async (username, password) => {
  try {
    const { data, error } = await supabase.rpc('signup_employee', {
      p_username: username,
      p_password: password,
    });
    if (error) {
      if (error.message && error.message.includes('schema cache')) {
        return { success: false, message: 'Database is not set up. Run grants.sql in Supabase SQL Editor.' };
      }
      return { success: false, message: error.message || 'Signup failed' };
    }
    if (!data?.ok) {
      return { success: false, message: data?.message || 'Signup failed' };
    }
    return {
      success: true,
      data: { id: data.id, username: data.username, isApproved: !!data.is_approved },
    };
  } catch (error) {
    return { success: false, message: error.message || 'Network error' };
  }
};

export const getEmployees = async () => {
  try {
    const { data, error } = await supabase.from('employees').select(EMPLOYEE_PUBLIC_COLUMNS).order('created_at', { ascending: false });
    if (error) return { success: false, message: error.message };
    return { success: true, data: (data || []).map(mapEmployee) };
  } catch (error) {
    return { success: false, message: error.message || 'Network error' };
  }
};

export const approveEmployee = async (id) => {
  try {
    const { data, error } = await supabase.from('employees').update({ is_approved: true }).eq('id', id).select(EMPLOYEE_PUBLIC_COLUMNS).single();
    if (error) return { success: false, message: error.message };
    return { success: true, data: mapEmployee(data) };
  } catch (error) {
    return { success: false, message: error.message || 'Network error' };
  }
};

export const updateEmployee = async (id, payload) => {
  try {
    const update = {};
    if (payload.username) {
      const { data: existing } = await supabase.from('employees').select('id').eq('username', payload.username).maybeSingle();
      if (existing && existing.id !== id) return { success: false, message: 'Username already exists' };
      update.username = payload.username;
    }
    if (payload.password) update.password = payload.password;
    if (payload.allowedCards !== undefined) {
      const validCards = ['repair-service', 'repair-list', 'attendance'];
      update.allowed_cards = Array.isArray(payload.allowedCards)
        ? payload.allowedCards.filter((card) => validCards.includes(card))
        : [];
    }
    if (payload.canRemoveRepairs !== undefined) update.can_remove_repairs = Boolean(payload.canRemoveRepairs);

    const { data, error } = await supabase.from('employees').update(update).eq('id', id).select(EMPLOYEE_PUBLIC_COLUMNS).single();
    if (error) return { success: false, message: error.message };
    const mapped = mapEmployee(data);
    return {
      success: true,
      data: {
        id: mapped.id,
        username: mapped.username,
        isApproved: mapped.isApproved,
        allowedCards: mapped.allowedCards,
        canRemoveRepairs: mapped.canRemoveRepairs,
      },
    };
  } catch (error) {
    return { success: false, message: error.message || 'Network error' };
  }
};

export const deleteEmployee = async (id) => {
  try {
    const { data, error } = await supabase.from('employees').delete().eq('id', id).select('id').single();
    if (error) return { success: false, message: error.message };
    return { success: true, data: { id: data.id } };
  } catch (error) {
    return { success: false, message: error.message || 'Network error' };
  }
};

export const getEmployeeCards = async (employeeId) => {
  try {
    const { data: emp, error } = await supabase.from('employees').select(EMPLOYEE_PUBLIC_COLUMNS).eq('id', employeeId).single();
    if (error || !emp) return { success: false, message: 'Employee not found' };
    let cards = [];
    if (emp.allowed_cards === undefined || emp.allowed_cards === null) {
      cards = ['repair-service', 'repair-list', 'attendance'];
    } else if (Array.isArray(emp.allowed_cards)) {
      cards = emp.allowed_cards;
    }
    return { success: true, data: { allowedCards: cards, canRemoveRepairs: emp.can_remove_repairs || false } };
  } catch (error) {
    return { success: false, message: error.message || 'Network error' };
  }
};

export const updateEmployeeCards = async (employeeId, allowedCards, canRemoveRepairs) => {
  return updateEmployee(employeeId, { allowedCards, canRemoveRepairs });
};

export const markAttendance = async (employeeId, currentIp, date, lat, lng, accuracy, employeeName) => {
  try {
    if (!employeeId || !currentIp) {
      return { success: false, message: 'employeeId and currentIp are required' };
    }
    const clientIp = String(currentIp).trim();
    const parsedLat = typeof lat === 'string' ? parseFloat(lat) : lat;
    const parsedLng = typeof lng === 'string' ? parseFloat(lng) : lng;
    const ipMatch = isIpAllowed(clientIp);
    const locMatch = isLocationAllowed(parsedLat, parsedLng);
    if (!ipMatch || !locMatch) {
      return {
        success: false,
        message: !ipMatch
          ? 'Please connect to office WiFi to mark attendance.'
          : 'Please be at office location to mark attendance.',
      };
    }
    const today = toYyyyMmDd();
    const { data, error } = await supabase
      .from('attendance')
      .insert({
        employee_id: employeeId,
        employee_name: employeeName || null,
        date: today,
        ip_address: clientIp,
        lat: parsedLat,
        lng: parsedLng,
        accuracy: typeof accuracy === 'string' ? parseFloat(accuracy) : accuracy,
        timestamp: new Date().toISOString(),
      })
      .select()
      .single();
    if (error) {
      if (uniqueViolation(error)) {
        return { success: true, data: { alreadyMarked: true, message: 'Attendance already marked for today' } };
      }
      return { success: false, message: error.message };
    }
    return { success: true, data };
  } catch (e) {
    return { success: false, message: e.message || 'Network error' };
  }
};

export const checkAttendanceIp = async (ip, lat, lng) => {
  try {
    const clientIp = String(ip || '').trim();
    if (!clientIp) return { success: false, message: 'ip is required' };
    const parsedLat = lat != null ? parseFloat(lat) : undefined;
    const parsedLng = lng != null ? parseFloat(lng) : undefined;
    const ipMatch = isIpAllowed(clientIp);
    const locationMatch = isLocationAllowed(parsedLat, parsedLng);
    return {
      success: true,
      data: {
        match: ipMatch && locationMatch,
        ipMatch,
        locationMatch,
        officeCidr: OFFICE_WIFI_CIDR,
        officeLat: OFFICE_LAT,
        officeLng: OFFICE_LNG,
        radiusM: OFFICE_RADIUS_M,
        ip: clientIp,
      },
    };
  } catch (e) {
    return { success: false, message: e.message || 'Network error' };
  }
};

export const getAttendanceByMonth = async (employeeId, yyyyMm) => {
  try {
    let start;
    if (yyyyMm && /^\d{4}-\d{2}$/.test(yyyyMm)) {
      const [y, m] = yyyyMm.split('-').map((n) => parseInt(n, 10));
      start = new Date(y, m - 1, 1);
    } else {
      const now = new Date();
      start = new Date(now.getFullYear(), now.getMonth(), 1);
    }
    const monthPrefix = `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, '0')}`;
    const { data, error } = await supabase
      .from('attendance')
      .select('date')
      .eq('employee_id', employeeId)
      .like('date', `${monthPrefix}-%`);
    if (error) return { success: false, message: error.message };
    return { success: true, data: (data || []).map((d) => d.date) };
  } catch (e) {
    return { success: false, message: e.message || 'Network error' };
  }
};

export const adminSetAttendance = async (employeeId, date, present, employeeName) => {
  try {
    if (!employeeId || !date || typeof present === 'undefined') {
      return { success: false, message: 'employeeId, date and present are required' };
    }
    const dateKey = String(date).slice(0, 10);
    if (present) {
      const { data, error } = await supabase
        .from('attendance')
        .upsert(
          {
            employee_id: employeeId,
            employee_name: employeeName || null,
            date: dateKey,
            ip_address: 'admin',
            timestamp: new Date().toISOString(),
          },
          { onConflict: 'employee_id,date' }
        )
        .select()
        .single();
      if (error) return { success: false, message: error.message };
      return { success: true, data };
    }
    const { error } = await supabase.from('attendance').delete().eq('employee_id', employeeId).eq('date', dateKey);
    if (error) return { success: false, message: error.message };
    return { success: true, data: { removed: true } };
  } catch (e) {
    return { success: false, message: e.message || 'Network error' };
  }
};

export const getTodayPresentCount = async () => {
  try {
    const today = toYyyyMmDd();
    const { data, error } = await supabase.from('attendance').select('employee_id').eq('date', today);
    if (error) return { success: false, message: error.message };
    const ids = [...new Set((data || []).map((r) => r.employee_id))];
    return { success: true, data: { count: ids.length, employeeIds: ids } };
  } catch (e) {
    return { success: false, message: e.message || 'Network error' };
  }
};
