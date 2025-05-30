import admin from "../config/firebaseConfig";

interface NotificationPayload {
  title: string;
  body: string;
  data?: Record<string, string>;
}

export const sendPushNotification = async (
  token: string,
  notification: NotificationPayload
): Promise<void> => {
  try {
    const message: admin.messaging.TokenMessage = {
      token,
      notification: {
        title: notification.title,
        body: notification.body,
      },
      data: notification.data,
      android: {
        priority: "high",
        notification: {
          channelId: "ride_requests",
          sound: "default",
        },
      },
      apns: {
        headers: {
          "apns-priority": "10", // Immediate delivery
          "apns-push-type": "alert",
        },
        payload: {
          aps: {
            alert: {
              title: notification.title,
              body: notification.body,
            },
            sound: "default",
            badge: 1,
            contentAvailable: true, // Enable background processing
            mutableContent: true, // Allow notification modification
            category: "RIDE_REQUEST", // For custom actions if needed
          },
        },
      },
    };

    await admin.messaging().send(message);
  } catch (error) {
    console.error("Error sending push notification:", error);
    throw error;
  }
};
