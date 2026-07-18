import { useState, useEffect, useRef } from 'react';
import { registerForPushNotificationsAsync } from '../services/notifications';

let Notifications: any = null;
try {
  Notifications = require('expo-notifications');
} catch (e) {
  // Ignora se estiver no Expo Go
}

export const usePushNotifications = () => {
  const [expoPushToken, setExpoPushToken] = useState<string | undefined>('');
  const [notification, setNotification] = useState<any | false>(false);
  
  const notificationListener = useRef<any>();
  const responseListener = useRef<any>();

  useEffect(() => {
    registerForPushNotificationsAsync().then(token => setExpoPushToken(token));

    if (Notifications) {
      notificationListener.current = Notifications.addNotificationReceivedListener((notif: any) => {
        setNotification(notif);
      });

      responseListener.current = Notifications.addNotificationResponseReceivedListener((response: any) => {
        console.log(response);
      });
    }

    return () => {
      if (Notifications) {
        if (notificationListener.current) {
          Notifications.removeNotificationSubscription(notificationListener.current);
        }
        if (responseListener.current) {
          Notifications.removeNotificationSubscription(responseListener.current);
        }
      }
    };
  }, []);

  return { expoPushToken, notification };
};
