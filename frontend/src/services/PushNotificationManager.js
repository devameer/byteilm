/**
 * Push Notification Manager
 * يدير إشعارات المتصفح (Push Notifications)
 */

import axios from 'axios';

class PushNotificationManager {
  constructor() {
    this.registration = null;
    this.subscription = null;
    this.vapidPublicKey = null;
  }

  /**
   * Initialize - تهيئة النظام
   */
  async initialize(vapidPublicKey) {
    this.vapidPublicKey = vapidPublicKey;

    if (!this.isSupported()) {
      console.warn('Push notifications are not supported in this browser');
      return false;
    }

    try {
      // تسجيل Service Worker
      await this.registerServiceWorker();

      // محاولة الحصول على subscription موجود
      await this.getSubscription();

      return true;
    } catch (error) {
      console.error('Failed to initialize push notifications:', error);
      return false;
    }
  }

  /**
   * التحقق من الدعم
   */
  isSupported() {
    return (
      'serviceWorker' in navigator &&
      'PushManager' in window &&
      'Notification' in window
    );
  }

  /**
   * تسجيل Service Worker
   */
  async registerServiceWorker() {
    if (!('serviceWorker' in navigator)) {
      throw new Error('Service Worker not supported');
    }

    try {
      this.registration = await navigator.serviceWorker.register('/service-worker.js', {
        scope: '/'
      });

      console.log('Service Worker registered:', this.registration);

      // انتظر حتى يصبح active
      if (this.registration.installing) {
        await new Promise((resolve) => {
          this.registration.installing.addEventListener('statechange', (e) => {
            if (e.target.state === 'activated') {
              resolve();
            }
          });
        });
      }

      return this.registration;
    } catch (error) {
      console.error('Service Worker registration failed:', error);
      throw error;
    }
  }

  /**
   * الحصول على حالة الإذن
   */
  getPermissionStatus() {
    if (!('Notification' in window)) {
      return 'unsupported';
    }

    return Notification.permission;
  }

  /**
   * طلب إذن الإشعارات
   */
  async requestPermission() {
    if (!('Notification' in window)) {
      throw new Error('Notifications not supported');
    }

    if (Notification.permission === 'denied') {
      throw new Error('Notification permission was denied');
    }

    if (Notification.permission === 'granted') {
      return 'granted';
    }

    const permission = await Notification.requestPermission();

    if (permission !== 'granted') {
      throw new Error('Notification permission was not granted');
    }

    return permission;
  }

  /**
   * الاشتراك في Push Notifications
   */
  async subscribe() {
    try {
      // تأكد من تسجيل Service Worker
      if (!this.registration) {
        await this.registerServiceWorker();
      }

      // طلب الإذن
      await this.requestPermission();

      // التحقق إذا كان هناك subscription موجود
      const existingSubscription = await this.registration.pushManager.getSubscription();

      if (existingSubscription) {
        console.log('Using existing subscription');
        this.subscription = existingSubscription;
      } else {
        // إنشاء subscription جديد
        this.subscription = await this.registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: this.urlBase64ToUint8Array(this.vapidPublicKey)
        });

        console.log('Created new push subscription:', this.subscription);
      }

      // إرسال الاشتراك إلى الخادم
      await this.sendSubscriptionToServer(this.subscription);

      return this.subscription;
    } catch (error) {
      console.error('Push subscription failed:', error);
      throw error;
    }
  }

  /**
   * إلغاء الاشتراك
   */
  async unsubscribe() {
    if (!this.subscription) {
      const existingSubscription = await this.getSubscription();
      if (!existingSubscription) {
        return true;
      }
    }

    try {
      // إزالة من الخادم أولاً
      await this.removeSubscriptionFromServer(this.subscription);

      // ثم إلغاء الاشتراك محلياً
      await this.subscription.unsubscribe();

      this.subscription = null;

      console.log('Successfully unsubscribed from push notifications');

      return true;
    } catch (error) {
      console.error('Unsubscribe failed:', error);
      throw error;
    }
  }

  /**
   * الحصول على الاشتراك الحالي
   */
  async getSubscription() {
    if (!this.registration) {
      await this.registerServiceWorker();
    }

    this.subscription = await this.registration.pushManager.getSubscription();
    return this.subscription;
  }

  /**
   * التحقق إذا كان المستخدم مشترك
   */
  async isSubscribed() {
    const subscription = await this.getSubscription();
    return subscription !== null;
  }

  /**
   * إرسال الاشتراك إلى الخادم
   */
  async sendSubscriptionToServer(subscription) {
    try {
      const response = await axios.post('/api/notifications/push/subscribe', {
        subscription: subscription.toJSON()
      });

      console.log('Subscription sent to server:', response.data);

      return response.data;
    } catch (error) {
      console.error('Failed to send subscription to server:', error);
      throw error;
    }
  }

  /**
   * إزالة الاشتراك من الخادم
   */
  async removeSubscriptionFromServer(subscription) {
    try {
      const response = await axios.post('/api/notifications/push/unsubscribe', {
        endpoint: subscription.endpoint
      });

      console.log('Subscription removed from server:', response.data);

      return response.data;
    } catch (error) {
      console.error('Failed to remove subscription from server:', error);
      throw error;
    }
  }

  /**
   * إرسال إشعار اختباري
   */
  async sendTestNotification() {
    if (!await this.isSubscribed()) {
      throw new Error('Not subscribed to push notifications');
    }

    try {
      const response = await axios.post('/api/notifications/push/test');

      console.log('Test notification sent:', response.data);

      return response.data;
    } catch (error) {
      console.error('Failed to send test notification:', error);
      throw error;
    }
  }

  /**
   * عرض إشعار محلي (بدون server)
   */
  async showLocalNotification(title, options = {}) {
    if (!await this.requestPermission()) {
      throw new Error('Notification permission not granted');
    }

    if (!this.registration) {
      await this.registerServiceWorker();
    }

    const defaultOptions = {
      body: '',
      icon: '/logo192.png',
      badge: '/badge.png',
      vibrate: [200, 100, 200],
      dir: 'rtl',
      lang: 'ar',
      requireInteraction: false,
      ...options
    };

    return this.registration.showNotification(title, defaultOptions);
  }

  /**
   * تحويل VAPID key من Base64
   */
  urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding)
      .replace(/\-/g, '+')
      .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }

    return outputArray;
  }

  /**
   * الحصول على معلومات الاشتراك
   */
  getSubscriptionInfo() {
    if (!this.subscription) {
      return null;
    }

    return {
      endpoint: this.subscription.endpoint,
      expirationTime: this.subscription.expirationTime,
      keys: this.subscription.toJSON().keys
    };
  }

  /**
   * تحديث Subscription (إذا انتهت صلاحيته)
   */
  async refreshSubscription() {
    try {
      const subscription = await this.getSubscription();

      if (subscription && subscription.expirationTime) {
        const now = Date.now();
        const expirationTime = subscription.expirationTime;

        // إذا بقي أقل من يوم على انتهاء الصلاحية
        if (expirationTime - now < 24 * 60 * 60 * 1000) {
          console.log('Subscription expiring soon, refreshing...');

          await subscription.unsubscribe();
          await this.subscribe();

          console.log('Subscription refreshed successfully');
        }
      }
    } catch (error) {
      console.error('Failed to refresh subscription:', error);
    }
  }
}

// Export singleton instance
const pushNotificationManager = new PushNotificationManager();

export default pushNotificationManager;
