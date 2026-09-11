import React from 'react';
import { Ionicons } from '@expo/vector-icons';

export default function Icon({ name, size = 20, color = '#64748B', style }) {
  return <Ionicons name={name} size={size} color={color} style={style} />;
}


