import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import * as Network from 'expo-network';
import { markAttendance, getAttendanceByMonth } from '../services/api';

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
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
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
        <TouchableOpacity onPress={onPrev} style={styles.navBtn}><Text style={styles.navTxt}>{'<'}</Text></TouchableOpacity>
        <Text style={styles.monthTitle}>{MONTHS[month]} {year}</Text>
        <TouchableOpacity onPress={onNext} style={styles.navBtn}><Text style={styles.navTxt}>{'>'}</Text></TouchableOpacity>
      </View>
      <View style={styles.weekRow}>
        {WEEKDAYS.map((d, idx) => (
          <Text key={`${d}-${idx}`} style={styles.weekday}>{d}</Text>
        ))}
      </View>
      {matrix.map((row, i) => (
        <View key={i} style={styles.weekRow}>
          {row.map(({ inCurrentMonth, date }, j) => {
            const key = toYyyyMmDd(date);
            const isToday = key === todayKey;
            const isGiven = attendanceSet.has(key);
            // Gray future dates
            const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
            const cellStart = new Date(date.getFullYear(), date.getMonth(), date.getDate());
            const isFuture = cellStart.getTime() > todayStart.getTime();
            const bg = !inCurrentMonth
              ? '#ECEFF1'
              : isFuture
                ? '#B0BEC5'
                : (isGiven ? '#4CAF50' : '#E53935');
            const styleBox = [
              styles.dayBox,
              { backgroundColor: bg, opacity: inCurrentMonth ? 1 : 0.35 },
              isToday && styles.todayBorder,
            ];
            return (
              <TouchableOpacity key={`${i}-${key}`} style={styleBox} onPress={() => handlePressDate(date)} activeOpacity={0.8}>
                <Text style={styles.dayText}>{date.getDate()}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      ))}
      <View style={styles.legendRow}>
        <View style={[styles.legendSwatch,{backgroundColor:'#4CAF50'}]} />
        <Text style={styles.legendText}>Present</Text>
        <View style={[styles.legendSwatch,{backgroundColor:'#E53935', marginLeft:14}]} />
        <Text style={styles.legendText}>Absent</Text>
        <View style={[styles.legendSwatch,{backgroundColor:'#B0BEC5', marginLeft:14}]} />
        <Text style={styles.legendText}>Upcoming</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { backgroundColor: '#fff', borderRadius: 12, padding: 12 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  monthTitle: { fontSize: 16, fontWeight: '800', color: '#263238' },
  navBtn: { padding: 6, borderRadius: 8, backgroundColor: '#ECEFF1' },
  navTxt: { fontWeight: '800', color: '#37474F' },
  weekRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  weekday: { width: 40, textAlign: 'center', color: '#607D8B', fontWeight: '700' },
  dayBox: {
    width: 40,
    height: 40,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayText: { color: '#fff', fontWeight: '800' },
  todayBorder: { borderWidth: 2, borderColor: '#1E88E5' },
  legendRow: { flexDirection: 'row', alignItems: 'center', marginTop: 8 },
  legendSwatch: { width: 14, height: 14, borderRadius: 3 },
  legendText: { marginLeft: 6, color: '#607D8B', fontWeight: '700' },
  hint: { marginTop: 6, color: '#90A4AE', fontSize: 12 },
});


