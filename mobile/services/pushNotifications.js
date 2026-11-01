import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import { isRunningInExpoGo } from 'expo';
import { supabase } from './supabaseClient';

const TOKEN_KEY = 'pushToken';
const CHANNEL_ID = 'orders';

function isExpoGo() {
  return isRunningInExpoGo();
}

function loadNotifications() {
  const Notifications = require('expo-notifications');
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldPlaySound: true,
      shouldSetBadge: false,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
  return Notifications;
}

export function isPushRecipient(user) {
  if (!user) return false;
  if (user.role === 'admin') return true;
  return user.role === 'employee' && user.employeeKind !== 'sales';
}

async function ensureAndroidChannel(Notifications) {
  if (Platform.OS !== 'android') return;
  await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
    name: 'Orders',
    importance: Notifications.AndroidImportance.HIGH,
    sound: 'default',
    vibrationPattern: [0, 250, 250, 250],
    lightColor: '#081C45',
  });
}

export async function unregisterPushToken() {
  try {
    const token = await AsyncStorage.getItem(TOKEN_KEY);
    if (!token) return;
    await supabase.from('push_tokens').delete().eq('token', token);
    await AsyncStorage.removeItem(TOKEN_KEY);
  } catch (_error) {
    // A missing table or offline phone should not block logout.
  }
}

async function registerPushToken(user) {
  if (isExpoGo()) return;
  const Device = require('expo-device');
  if (!Device.isDevice) return;
  const Notifications = loadNotifications();
  await ensureAndroidChannel(Notifications);

  const current = await Notifications.getPermissionsAsync();
  let status = current.status;
  if (status !== 'granted') {
    const asked = await Notifications.requestPermissionsAsync();
    status = asked.status;
  }
  if (status !== 'granted') return;

  const projectId = Constants?.expoConfig?.extra?.eas?.projectId ?? Constants?.easConfig?.projectId;
  if (!projectId) return;

  const tokenResult = await Notifications.getExpoPushTokenAsync({ projectId });
  const token = tokenResult?.data;
  if (!token) return;

  await AsyncStorage.setItem(TOKEN_KEY, token);
  const { error } = await supabase.from('push_tokens').upsert({
    token,
    recipient_role: user.role === 'admin' ? 'admin' : 'employee',
    employee_id: user.role === 'admin' ? null : (user.id || null),
    username: user.username || '',
    updated_at: new Date().toISOString(),
  }, { onConflict: 'token' });
  if (error) {
    console.warn('Could not save push token:', error.message);
  }
}

export async function syncPushRegistration(user) {
  try {
    if (isExpoGo()) return;
    if (!isPushRecipient(user)) {
      await unregisterPushToken();
      return;
    }
    await registerPushToken(user);
  } catch (error) {
    console.warn('Push registration failed:', error?.message || error);
  }
}

function orderMessage(order) {
  const who = String(order?.createdByName || 'Sales').trim() || 'Sales';
  const shop = String(order?.shopName || 'a shop').trim() || 'a shop';
  const place = String(order?.place || '').trim();
  return place ? `${who} saved an order for ${shop}, ${place}` : `${who} saved an order for ${shop}`;
}

export async function notifyNewOrder(order) {
  try {
    const { data, error } = await supabase
      .from('push_tokens')
      .select('token, recipient_role')
      .in('recipient_role', ['admin', 'employee']);
    if (error || !data?.length) return;

    const messages = data
      .filter((row) => row?.token && (row.recipient_role === 'admin' || row.recipient_role === 'employee'))
      .map((row) => ({
        to: row.token,
        sound: 'default',
        title: 'New order',
        body: orderMessage(order),
        priority: 'high',
        channelId: CHANNEL_ID,
        data: { orderId: order?.id || '', type: 'new_order' },
      }));

    for (let index = 0; index < messages.length; index += 100) {
      const chunk = messages.slice(index, index + 100);
      const response = await fetch('https://exp.host/--/api/v2/push/send', {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Accept-encoding': 'gzip, deflate',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(chunk),
      });
      const payload = await response.json().catch(() => null);
      const tickets = Array.isArray(payload?.data) ? payload.data : [];
      const expired = tickets
        .map((ticket, ticketIndex) => (
          ticket?.status === 'error' && ticket?.details?.error === 'DeviceNotRegistered'
            ? chunk[ticketIndex]?.to
            : null
        ))
        .filter(Boolean);
      if (expired.length) {
        await supabase.from('push_tokens').delete().in('token', expired);
      }
    }
  } catch (error) {
    console.warn('Order notification failed:', error?.message || error);
  }
}
