import { PushNotifications } from '@capacitor/push-notifications';
import { toast } from '@/hooks/use-toast';

export const initializePushNotifications = async () => {
  // Check if running on mobile
  if (!('PushNotifications' in window)) {
    console.log('Push notifications not available on this platform');
    return;
  }

  try {
    // Request permission
    let permStatus = await PushNotifications.checkPermissions();

    if (permStatus.receive === 'prompt') {
      permStatus = await PushNotifications.requestPermissions();
    }

    if (permStatus.receive !== 'granted') {
      toast({
        title: 'Permission denied',
        description: 'Push notification permission was not granted',
        variant: 'destructive',
      });
      return;
    }

    // Register with Apple / Google to receive push via APNS/FCM
    await PushNotifications.register();

    // Show us the notification payload if the app is open on our device
    await PushNotifications.addListener('pushNotificationReceived', (notification) => {
      toast({
        title: notification.title || 'New Notification',
        description: notification.body || '',
      });
    });

    // Method called when tapping on a notification
    await PushNotifications.addListener('pushNotificationActionPerformed', (notification) => {
      console.log('Push notification action performed', notification.actionId, notification.inputValue);
    });

    // On success, we should be able to receive notifications
    await PushNotifications.addListener('registration', (token) => {
      console.log('Push registration success, token: ' + token.value);
      // Here you would typically send the token to your backend
      // to store it and use it for sending push notifications
    });

    // Some issue with our setup and push will not work
    await PushNotifications.addListener('registrationError', (error: any) => {
      console.error('Error on registration: ' + JSON.stringify(error));
    });

    console.log('Push notifications initialized successfully');
  } catch (error) {
    console.error('Error initializing push notifications:', error);
  }
};

export const sendLocalNotification = async (title: string, body: string) => {
  try {
    await PushNotifications.createChannel({
      id: 'sanskrithi-notifications',
      name: 'Sanskrithi Notifications',
      description: 'Payment and account notifications',
      importance: 5,
      visibility: 1,
    });

    // Note: Local notifications require additional setup
    console.log('Local notification would be sent:', { title, body });
  } catch (error) {
    console.error('Error sending local notification:', error);
  }
};
