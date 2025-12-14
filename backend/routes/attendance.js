const express = require('express');
const router = express.Router();
const Attendance = require('../models/Attendance');

const OFFICE_WIFI_IP = process.env.OFFICE_WIFI_IP || '';
const OFFICE_WIFI_CIDR = process.env.OFFICE_WIFI_CIDR || ''; // e.g., 192.168.200.0/24
const OFFICE_LAT = process.env.OFFICE_LAT ? parseFloat(process.env.OFFICE_LAT) : null;
const OFFICE_LNG = process.env.OFFICE_LNG ? parseFloat(process.env.OFFICE_LNG) : null;
const OFFICE_RADIUS_M = process.env.OFFICE_RADIUS_M ? parseFloat(process.env.OFFICE_RADIUS_M) : 150; // meters

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
  const toRad = (x) => x * Math.PI / 180;
  const R = 6371000; // meters
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
            Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

function isLocationAllowed(lat, lng) {
  if (typeof OFFICE_LAT !== 'number' || typeof OFFICE_LNG !== 'number') return true; // if not configured, skip check
  if (typeof lat !== 'number' || typeof lng !== 'number') return false;
  const dist = haversineMeters(lat, lng, OFFICE_LAT, OFFICE_LNG);
  return dist <= (Number.isFinite(OFFICE_RADIUS_M) ? OFFICE_RADIUS_M : 150);
}

// POST /api/attendance/mark
// body: { employeeId, currentIp, date?, lat?, lng?, accuracy?, employeeName? }
router.post('/mark', async (req, res) => {
  try {
    const { employeeId, currentIp, date: requestedDate, lat, lng, accuracy, employeeName } = req.body || {};
    if (!employeeId || !currentIp) {
      return res.status(400).json({ success: false, message: 'employeeId and currentIp are required' });
    }
    const clientIp = String(currentIp).trim();
    const ipMatch = isIpAllowed(clientIp);
    const locMatch = isLocationAllowed(
      typeof lat === 'string' ? parseFloat(lat) : lat,
      typeof lng === 'string' ? parseFloat(lng) : lng
    );
    if (!ipMatch || !locMatch) {
      return res.status(403).json({
        success: false,
        message: !ipMatch ? 'Please connect to office WiFi to mark attendance.' : 'Please be at office location to mark attendance.',
        officeIp: OFFICE_WIFI_IP || undefined,
        officeCidr: OFFICE_WIFI_CIDR || undefined,
        officeLat: OFFICE_LAT || undefined,
        officeLng: OFFICE_LNG || undefined,
        radiusM: OFFICE_RADIUS_M || undefined,
        ip: clientIp,
      });
    }
    // Only allow marking for today (even if date is passed)
    const today = toYyyyMmDd();
    const date = requestedDate && String(requestedDate).slice(0, 10) === today ? today : today;
    try {
      const record = await Attendance.create({
        employeeId,
        employeeName: employeeName || undefined,
        date,
        ipAddress: clientIp,
        lat: typeof lat === 'string' ? parseFloat(lat) : lat,
        lng: typeof lng === 'string' ? parseFloat(lng) : lng,
        accuracy: typeof accuracy === 'string' ? parseFloat(accuracy) : accuracy,
        timestamp: new Date(),
      });
      return res.status(201).json({ success: true, data: record });
    } catch (e) {
      // Duplicate -> already marked
      if (e && e.code === 11000) {
        return res.status(200).json({ success: true, alreadyMarked: true, message: 'Attendance already marked for today' });
      }
      throw e;
    }
  } catch (e) {
    res.status(500).json({ success: false, message: 'Failed to mark attendance', error: e.message });
  }
});

// GET /api/attendance/check?ip=192.168.x.x
router.get('/check', async (req, res) => {
  try {
    const clientIp = String(req.query.ip || '').trim();
    if (!clientIp) {
      return res.status(400).json({ success: false, message: 'ip is required' });
    }
    const ipMatch = isIpAllowed(clientIp);
    const lat = req.query.lat ? parseFloat(req.query.lat) : undefined;
    const lng = req.query.lng ? parseFloat(req.query.lng) : undefined;
    const locationMatch = isLocationAllowed(lat, lng);
    const allowed = []
      .concat(String(OFFICE_WIFI_CIDR || '').split(','))
      .concat(String(OFFICE_WIFI_IP || '').split(','))
      .map(s => String(s || '').trim())
      .filter(Boolean);
    return res.json({
      success: true,
      match: ipMatch && locationMatch,
      ipMatch,
      locationMatch,
      officeIp: OFFICE_WIFI_IP || undefined,
      officeCidr: OFFICE_WIFI_CIDR || undefined,
      officeLat: OFFICE_LAT || undefined,
      officeLng: OFFICE_LNG || undefined,
      radiusM: OFFICE_RADIUS_M || undefined,
      allowed,
      ip: clientIp,
      message: ipMatch && locationMatch
        ? 'IP and Location match office constraints'
        : !ipMatch
          ? 'IP does not match office WiFi'
          : 'Location not within office radius',
    });
  } catch (e) {
    res.status(500).json({ success: false, message: 'Failed to check IP', error: e.message });
  }
});

// GET /api/attendance/by-employee/:id?month=YYYY-MM
router.get('/by-employee/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const monthParam = String(req.query.month || '').trim(); // YYYY-MM
    let start, end;
    if (monthParam && /^\d{4}-\d{2}$/.test(monthParam)) {
      const [y, m] = monthParam.split('-').map(n => parseInt(n, 10));
      start = new Date(y, m - 1, 1);
      end = new Date(y, m, 1);
    } else {
      // default: current month
      const now = new Date();
      start = new Date(now.getFullYear(), now.getMonth(), 1);
      end = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    }
    const yyyyMm = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const monthPrefix = yyyyMm(start);
    // Since we stored date as string YYYY-MM-DD, we can range by prefix
    const docs = await Attendance.find({
      employeeId: id,
      date: { $regex: `^${monthPrefix}-` },
    }).select('date -_id');
    const dates = docs.map(d => d.date);
    res.json({ success: true, data: dates });
  } catch (e) {
    res.status(500).json({ success: false, message: 'Failed to fetch attendance', error: e.message });
  }
});

// GET /api/attendance/today-count
// Returns number of employees who are present today and, optionally, the list
router.get('/today-count', async (req, res) => {
  try {
    const today = toYyyyMmDd();
    const ids = await Attendance.distinct('employeeId', { date: today });
    const count = Array.isArray(ids) ? ids.length : 0;
    res.json({ success: true, data: { count, employeeIds: ids || [] } });
  } catch (e) {
    res.status(500).json({ success: false, message: 'Failed to fetch today count', error: e.message });
  }
});

module.exports = router;

// Admin override: set/unset attendance for any date (no IP/location check)
// POST /api/attendance/admin/set  { employeeId, date: 'YYYY-MM-DD', present: true|false, employeeName? }
router.post('/admin/set', async (req, res) => {
  try {
    const { employeeId, date, present, employeeName } = req.body || {};
    if (!employeeId || !date || typeof present === 'undefined') {
      return res.status(400).json({ success: false, message: 'employeeId, date and present are required' });
    }
    const dateKey = String(date).slice(0, 10);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dateKey)) {
      return res.status(400).json({ success: false, message: 'date must be YYYY-MM-DD' });
    }
    if (present) {
      const doc = await Attendance.findOneAndUpdate(
        { employeeId, date: dateKey },
        {
          $set: {
            employeeId,
            employeeName: employeeName || undefined,
            date: dateKey,
            timestamp: new Date(),
          },
        },
        { upsert: true, new: true }
      );
      return res.json({ success: true, data: doc });
    } else {
      await Attendance.deleteOne({ employeeId, date: dateKey });
      return res.json({ success: true, removed: true });
    }
  } catch (e) {
    res.status(500).json({ success: false, message: 'Failed to set attendance', error: e.message });
  }
});
