import { App } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';
import { PushNotifications } from '@capacitor/push-notifications';

const isNative = Capacitor.isNativePlatform();

async function setupNativePush() {
  if (!isNative) return;
  await PushNotifications.removeAllListeners();
  await PushNotifications.addListener('registration', token => {
    localStorage.setItem('hichki.nativePushToken', token.value);
    window.dispatchEvent(new CustomEvent('hichki:native-push-token', { detail: token.value }));
  });
  await PushNotifications.addListener('registrationError', error => console.warn('Hichki push registration failed:', error));
  await PushNotifications.addListener('pushNotificationReceived', notification => {
    window.dispatchEvent(new CustomEvent('hichki:native-notification', { detail: notification }));
  });
  await PushNotifications.addListener('pushNotificationActionPerformed', event => {
    window.dispatchEvent(new CustomEvent('hichki:native-notification-action', { detail: event }));
  });
  const permission = await PushNotifications.checkPermissions();
  if (permission.receive === 'prompt' || permission.receive === 'prompt-with-rationale') await PushNotifications.requestPermissions();
  const finalPermission = await PushNotifications.checkPermissions();
  if (finalPermission.receive !== 'granted') return;
  await PushNotifications.createChannel({ id: 'hichki_messages', name: 'Hichki messages', description: 'New Hichki chat messages', importance: 4, visibility: 1, vibration: true }).catch(() => {});
  await PushNotifications.register();
}

setupNativePush().catch(err => console.warn('Hichki native setup:', err));

App.addListener('backButton', ({ canGoBack }) => {
  if (typeof window.goBack === 'function') window.goBack();
  else if (canGoBack) window.history.back();
});
