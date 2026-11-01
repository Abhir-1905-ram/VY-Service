import React, { useContext, useEffect, useRef, useState } from 'react';
import { Dimensions, Keyboard, Platform, StyleSheet, Text, View } from 'react-native';
import { AuthContext } from '../../contexts/AuthContext';
import { saveOrder } from '../../services/api';
import { notifyNewOrder } from '../../services/pushNotifications';
import Screen from '../../components/Screen';
import AppHeader from '../../components/AppHeader';
import AppCard from '../../components/AppCard';
import AppInput from '../../components/AppInput';
import AppButton from '../../components/AppButton';
import Banner from '../../components/Banner';
import StatusBadge from '../../components/StatusBadge';
import { colors, radii, spacing } from '../../ui/Theme';

export default function OrderFormScreen({ navigation, route }) {
  const { user } = useContext(AuthContext);
  const existing = route.params?.order || null;
  const readOnly = route.params?.readOnly || (existing && existing.status !== 'Pending');
  const [shopName, setShopName] = useState(existing?.shopName || '');
  const [place, setPlace] = useState(existing?.place || '');
  const [notes, setNotes] = useState(existing?.notes || '');
  const [totalAmount, setTotalAmount] = useState(
    existing?.totalAmount === null || existing?.totalAmount === undefined ? '' : String(existing.totalAmount)
  );
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef(null);
  const scrollY = useRef(0);
  const ordersRef = useRef(null);
  const amountRef = useRef(null);
  const activeField = useRef(null);
  const keyboardHeightRef = useRef(0);

  const ensureVisible = () => {
    const node = activeField.current;
    const scroller = scrollRef.current;
    if (!node?.measureInWindow || !scroller?.scrollTo) return;
    const keyboardHeight = Keyboard.metrics?.()?.height || keyboardHeightRef.current;
    if (!keyboardHeight) return;
    node.measureInWindow((x, y, width, height) => {
      if (!height) return;
      const visibleBottom = Dimensions.get('window').height - keyboardHeight - spacing.md;
      const overlap = y + height - visibleBottom;
      if (overlap > 8) {
        scroller.scrollTo({ y: scrollY.current + overlap, animated: true });
      }
    });
  };

  useEffect(() => {
    const showSub = Keyboard.addListener(Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow', (event) => {
      keyboardHeightRef.current = event?.endCoordinates?.height || Keyboard.metrics?.()?.height || 0;
      ensureVisible();
      setTimeout(ensureVisible, 220);
    });
    const hideSub = Keyboard.addListener(Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide', () => {
      keyboardHeightRef.current = 0;
    });
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  const focusField = (fieldRef) => {
    activeField.current = fieldRef.current;
    [40, 180, 420].forEach((delay) => setTimeout(ensureVisible, delay));
  };

  const onSave = async () => {
    setMessage('');
    setLoading(true);
    const res = await saveOrder({
      id: existing?.id,
      shopName,
      place,
      notes,
      totalAmount,
      createdBy: user?.id,
      createdByName: user?.username,
    });
    setLoading(false);
    if (res.success) {
      if (!existing && user?.employeeKind === 'sales') {
        await notifyNewOrder(res.data);
      }
      navigation.goBack();
      return;
    }
    setMessage(res.message || 'Could not save the order');
  };

  return (
    <Screen
      scroll
      keyboard
      scrollRef={scrollRef}
      keyboardDismissMode="none"
      onScroll={(event) => {
        scrollY.current = event.nativeEvent.contentOffset.y;
      }}
      header={
        <AppHeader
          title={readOnly ? 'Order' : existing ? 'Edit order' : 'New order'}
          onBackPress={() => navigation.goBack()}
        />
      }
      contentStyle={styles.content}
    >
      {existing?.status ? <StatusBadge status={existing.status} style={styles.badge} /> : null}
      {readOnly && existing?.createdByName ? (
        <View style={styles.fromChip}>
          <Text style={styles.from}>{existing.createdByName}</Text>
        </View>
      ) : null}
      {existing?.viewedByName ? (
        <View style={styles.viewedChip}>
          <Text style={styles.viewedBy}>Viewed by {existing.viewedByName}</Text>
        </View>
      ) : null}
      <AppCard style={styles.card}>
        <Banner tone="danger" message={message} style={styles.banner} />
        <AppInput
          label="Shop name"
          required
          icon="business-outline"
          placeholder="Shop name"
          value={shopName}
          onChangeText={setShopName}
          editable={!readOnly}
          style={styles.field}
        />
        <AppInput
          label="Place"
          required
          icon="location-outline"
          placeholder="Place"
          value={place}
          onChangeText={setPlace}
          editable={!readOnly}
          style={styles.field}
        />
        <View ref={ordersRef} collapsable={false}>
          <AppInput
            label="Orders"
            required
            icon="create-outline"
            placeholder={'Write the order like notes\nMouse x2\nKeyboard x1'}
            value={notes}
            onChangeText={setNotes}
            editable={!readOnly}
            multiline
            onFocus={() => focusField(ordersRef)}
            inputStyle={styles.notes}
            style={styles.field}
          />
        </View>
        <View ref={amountRef} collapsable={false}>
          <AppInput
            label="Total amount"
            icon="cash-outline"
            placeholder="Optional"
            value={totalAmount}
            onChangeText={setTotalAmount}
            editable={!readOnly}
            keyboardType="decimal-pad"
            onFocus={() => focusField(amountRef)}
            style={styles.field}
          />
        </View>
        {readOnly ? null : (
          <AppButton
            title={existing ? 'Save changes' : 'Save'}
            icon="save-outline"
            size="lg"
            loading={loading}
            onPress={onSave}
          />
        )}
      </AppCard>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { paddingTop: spacing.lg },
  badge: { marginBottom: spacing.md },
  fromChip: {
    alignSelf: 'flex-start',
    marginBottom: spacing.md,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: radii.round,
    backgroundColor: colors.primarySoft,
  },
  from: { fontSize: 15, fontWeight: '800', color: colors.primaryDark },
  viewedChip: {
    alignSelf: 'flex-start',
    marginBottom: spacing.md,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: radii.round,
    backgroundColor: colors.infoSoft,
  },
  viewedBy: { fontSize: 15, fontWeight: '800', color: colors.info },
  card: { padding: spacing.xl },
  banner: { marginBottom: spacing.lg },
  field: { marginBottom: spacing.lg },
  notes: { minHeight: 160 },
});
