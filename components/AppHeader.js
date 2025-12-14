import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../ui/Theme';
import Icon from './Icon';

export default function AppHeader({ title = '', onProfilePress, rightIconName = 'person-circle-outline', showBrand = true, onBackPress }) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.bar, { paddingTop: insets.top + 10 }]}>
      <View style={styles.left}>
        {onBackPress && (
          <TouchableOpacity onPress={onBackPress} style={styles.backButton}>
            <Icon name="arrow-back-outline" size={24} color="#fff" />
          </TouchableOpacity>
        )}
        {showBrand && (
          <View style={styles.brand}>
            <Text style={styles.brandText}>VY</Text>
          </View>
        )}
        {!!title && (
          <Text style={styles.title} numberOfLines={1} ellipsizeMode="tail">
            {title}
          </Text>
        )}
      </View>
      {onProfilePress && (
        <TouchableOpacity onPress={onProfilePress} style={styles.right}>
          <Icon name={rightIconName} size={28} color="#fff" />
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
    minHeight: 50,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
  },
  left: { 
    flexDirection: 'row', 
    alignItems: 'center',
    flex: 1,
    flexShrink: 1,
  },
  backButton: { marginRight: 8, padding: 4 },
  brand: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.primaryDark,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
    flexShrink: 0,
  },
  brandText: { color: '#fff', fontWeight: '800', fontSize: 14 },
  title: { 
    color: '#fff', 
    fontWeight: '800', 
    fontSize: 16,
    marginLeft: 4,
    flexShrink: 1,
  },
  right: { 
    marginLeft: 10,
    flexShrink: 0,
  },
});


