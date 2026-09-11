import React, { useMemo, useState } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity } from 'react-native';
import { colors, radii, spacing } from '../ui/Theme';
import AppModal from './AppModal';
import SearchBar from './SearchBar';
import LoadingState from './LoadingState';
import EmptyState from './EmptyState';
import Avatar from './Avatar';
import Icon from './Icon';

/**
 * Bottom sheet listing device contacts. Each phone number is tappable.
 * contacts: [{ id, name, phoneNumbers: [{ number, label }] }]
 */
export default function ContactPickerModal({ visible, onClose, contacts, loading, onSelect }) {
  const [query, setQuery] = useState('');

  const close = () => {
    setQuery('');
    onClose && onClose();
  };

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim();
    if (!q) return contacts;
    return contacts.filter((contact) => {
      const nameMatch = String(contact.name || '').toLowerCase().includes(q);
      const phoneMatch = (contact.phoneNumbers || []).some((phone) => phone.number && phone.number.includes(q));
      return nameMatch || phoneMatch;
    });
  }, [contacts, query]);

  let body;
  if (loading) {
    body = <LoadingState message="Loading contacts..." />;
  } else if (contacts.length === 0) {
    body = (
      <EmptyState
        icon="people-outline"
        title="No contacts found"
        subtitle="Make sure you have contacts with phone numbers on your device"
      />
    );
  } else if (filtered.length === 0) {
    body = <EmptyState icon="search-outline" title="No contacts found" subtitle="Try a different search term" tone="neutral" />;
  } else {
    body = (
      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id || `contact_${item.name}_${Math.random()}`}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <View style={styles.contact}>
            <View style={styles.contactHeader}>
              <Avatar name={item.name} size={36} />
              <Text style={styles.contactName} numberOfLines={1}>
                {item.name}
              </Text>
            </View>
            {item.phoneNumbers && item.phoneNumbers.length > 0 ? (
              item.phoneNumbers.map((phone, index) => (
                <TouchableOpacity key={index} style={styles.phoneRow} onPress={() => onSelect(item, phone.number)} activeOpacity={0.8}>
                  <Icon name="call-outline" size={16} color={colors.primary} />
                  <Text style={styles.phoneLabel}>{phone.label}</Text>
                  <Text style={styles.phoneNumber}>{phone.number.length > 10 ? phone.number.slice(-10) : phone.number}</Text>
                  <Icon name="chevron-forward" size={16} color={colors.textMuted} />
                </TouchableOpacity>
              ))
            ) : (
              <Text style={styles.noPhone}>No phone numbers</Text>
            )}
          </View>
        )}
      />
    );
  }

  return (
    <AppModal visible={visible} onClose={close} variant="sheet" sheetHeight="85%" title="Select contact">
      <SearchBar
        value={query}
        onChangeText={setQuery}
        placeholder="Search by name or number"
        autoCapitalize="none"
        style={styles.search}
      />
      <View style={styles.body}>{body}</View>
    </AppModal>
  );
}

const styles = StyleSheet.create({
  search: { marginBottom: spacing.md },
  body: { flex: 1 },
  listContent: { paddingBottom: spacing.xl },
  contact: { paddingVertical: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.border },
  contactHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginBottom: spacing.sm },
  contactName: { flex: 1, fontSize: 15, fontWeight: '700', color: colors.text },
  phoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: 10,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.surfaceMuted,
    borderRadius: radii.sm,
    marginTop: 6,
  },
  phoneLabel: { fontSize: 12, fontWeight: '600', color: colors.textMuted, textTransform: 'capitalize' },
  phoneNumber: { flex: 1, fontSize: 14, fontWeight: '700', color: colors.text },
  noPhone: { fontSize: 13, color: colors.textMuted, fontStyle: 'italic' },
});
