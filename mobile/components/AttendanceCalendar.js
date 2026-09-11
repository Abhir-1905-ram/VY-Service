import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import * as Network from 'expo-network';
import { markAttendance, getAttendanceByMonth } from '../services/api';
import { colors, radii, spacing, shadows } from '../ui/Theme';
import Icon from './Icon';

function getDaysInMonth(year, month /* 0-based */) {
  return new Date(year, month + 1, 0).getDate();
}

function getMonthMatrix(year, month) {
  const firstDay = new Date(year, month, 1).getDay(); // 0 Sun - 6 Sat
  const days = getDaysInMonth(year, month);
  const weeks = [];
  let current = 1 - firstDay;
  for (let w = 0; w < 6; w++) {
    const row = [];
    for (let d = 0; d < 7; d++) {
      const date = new Date(year, month, current);
      row.push({
        inCurrentMonth: date.getMonth() === month,
        date,
      });
      current++;
    }
    weeks.push(row);
  }
  return weeks;
}

function toYyyyMmDd(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const WEEKDAYS = ['S','M','T','W','T','F','S'];

export default function AttendanceCalendar({
  attendanceGiven = [],
  employeeId,
  onChange, // optional callback when attendance marked today
  refreshToken = 0, // external trigger to refetch current month
  editable = false, // admin can toggle any past day
  onToggleDay, // async (key, nextPresent) => boolean
  onPressDay, // optional: intercept press; caller decides what to do
}) {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [attendanceSet, setAttendanceSet] = useState(new Set(attendanceGiven));

  // Auto-fetch from backend if employeeId provided
  useEffect(() => {
    let ignore = false;
    (async () => {
      if (!employeeId) return;
      const yyyyMm = `${year}-${String(month + 1).padStart(2,'0')}`;
      const res = await getAttendanceByMonth(employeeId, yyyyMm);
      if (!ignore && res.success) {
        setAttendanceSet(new Set(res.data || []));
      }
    })();
    return () => { ignore = true; };
  }, [employeeId, year, month, refreshToken]);

  // When prop attendanceGiven changes (external)
  useEffect(() => {
    if (!employeeId) {
      setAttendanceSet(new Set(attendanceGiven));
    }
  }, [attendanceGiven, employeeId]);

  const matrix = useMemo(() => getMonthMatrix(year, month), [year, month]);
  const todayKey = toYyyyMmDd(today);
  const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());

  // Present-day count for the visible month (display only)
  const presentThisMonth = useMemo(() => {
    const prefix = `${year}-${String(month + 1).padStart(2, '0')}-`;
    let n = 0;
    attendanceSet.forEach((k) => { if (String(k).startsWith(prefix)) n++; });
    return n;
  }, [attendanceSet, year, month]);

  const onPrev = () => {
    const d = new Date(year, month, 1);
    d.setMonth(d.getMonth() - 1);
    setYear(d.getFullYear());
    setMonth(d.getMonth());
  };
  const onNext = () => {
    const d = new Date(year, month, 1);
    d.setMonth(d.getMonth() + 1);
    setYear(d.getFullYear());
    setMonth(d.getMonth());
  };

  const handlePressDate = async (cellDate) => {
    const key = toYyyyMmDd(cellDate);
    const isPresent = attendanceSet.has(key);
    const cellStart = new Date(cellDate.getFullYear(), cellDate.getMonth(), cellDate.getDate());
    const isFuture = cellStart.getTime() > todayStart.getTime();
    // Admin editable mode: toggle presence on any non-future date
    if (editable) {
      if (typeof onPressDay === 'function') {
        // Let parent handle UI (confirmation/buttons)
        onPressDay({ key, date: cellDate, present: isPresent, isFuture });
        return;
      }
      if (typeof onToggleDay === 'function') {
        if (isFuture) return; // cannot edit future
        const nextPresent = !attendanceSet.has(key);
        const ok = await onToggleDay(key, nextPresent);
        if (ok) {
          setAttendanceSet(prev => {
            const next = new Set(prev);
            if (nextPresent) next.add(key); else next.delete(key);
            return next;
          });
        }
        return;
      }
    }
    // Employee flow: only allow marking today
    if (key !== todayKey) return;
    if (!employeeId) return;
    try {
      const ip = await Network.getIpAddressAsync();
      const res = await markAttendance(employeeId, ip || '', key);
      if (res.success) {
        setAttendanceSet(prev => new Set(prev).add(key));
        onChange && onChange(key);
      }
    } catch {
      // ignore
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onPrev} style={styles.navBtn} accessibilityLabel="Previous month">
          <Icon name="chevron-back" size={18} color={colors.textSecondary} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.monthTitle}>{MONTHS[month]} {year}</Text>
          <Text style={styles.monthMeta}>{presentThisMonth} day{presentThisMonth === 1 ? '' : 's'} present</Text>
        </View>
        <TouchableOpacity onPress={onNext} style={styles.navBtn} accessibilityLabel="Next month">
          <Icon name="chevron-forward" size={18} color={colors.textSecondary} />
        </TouchableOpacity>
      </View>

      <View style={styles.weekRow}>
        {WEEKDAYS.map((d, idx) => (
          <View key={`${d}-${idx}`} style={styles.cell}>
            <Text style={styles.weekday}>{d}</Text>
          </View>
        ))}
      </View>

      {matrix.map((row, i) => (
        <View key={i} style={styles.weekRow}>
          {row.map(({ inCurrentMonth, date }) => {
            const key = toYyyyMmDd(date);
            const isToday = key === todayKey;
            const isGiven = attendanceSet.has(key);
            const cellStart = new Date(date.getFullYear(), date.getMonth(), date.getDate());
            const isFuture = cellStart.getTime() > todayStart.getTime();

            let bg = 'transparent';
            let fg = colors.textMuted;
            if (inCurrentMonth && !isFuture) {
              bg = isGiven ? colors.success : colors.dangerSoft;
              fg = isGiven ? '#fff' : colors.danger;
            }
            return (
              <View key={key} style={styles.cell}>
                <TouchableOpacity
                  style={[
                    styles.day,
                    { backgroundColor: bg, opacity: inCurrentMonth ? 1 : 0.35 },
                    isToday && styles.todayRing,
                  ]}
                  onPress={() => handlePressDate(date)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.dayText, { color: fg }]}>{date.getDate()}</Text>
                </TouchableOpacity>
              </View>
            );
          })}
        </View>
      ))}

      <View style={styles.legendRow}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: colors.success }]} />
          <Text style={styles.legendText}>Present</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: colors.danger }]} />
          <Text style={styles.legendText}>Absent</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: colors.borderStrong }]} />
          <Text style={styles.legendText}>Upcoming</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, styles.legendRing]} />
          <Text style={styles.legendText}>Today</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    ...shadows.card,
  },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.md },
  headerCenter: { alignItems: 'center' },
  monthTitle: { fontSize: 16, fontWeight: '800', color: colors.text },
  monthMeta: { fontSize: 12, color: colors.textMuted, fontWeight: '600', marginTop: 2 },
  navBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.neutralSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  weekRow: { flexDirection: 'row', marginBottom: 4 },
  cell: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 2 },
  weekday: { fontSize: 12, color: colors.textMuted, fontWeight: '700' },
  day: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayText: { fontWeight: '700', fontSize: 14 },
  todayRing: { borderWidth: 2, borderColor: colors.primary },
  legendRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendDot: { width: 10, height: 10, borderRadius: 5 },
  legendRing: { backgroundColor: 'transparent', borderWidth: 2, borderColor: colors.primary },
  legendText: { color: colors.textMuted, fontWeight: '600', fontSize: 12 },
});
