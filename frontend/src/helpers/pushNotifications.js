import { Capacitor } from "@capacitor/core";
import { PushNotifications } from "@capacitor/push-notifications";
import { ApiComunicator } from "@/helpers/ApiComunicator";

// Push notifications only exist inside the Android app, not in the browser.
const DEVICE_TOKEN_KEY = "pushDeviceToken";

async function saveDeviceToken(token) {
    localStorage.setItem(DEVICE_TOKEN_KEY, token);
    await ApiComunicator("/notifications/registerDevice", "POST", { token, platform: Capacitor.getPlatform() });
}

// Call it when the user logs out, so this phone stops receiving their notifications.
export async function removeDeviceToken() {
    const token = localStorage.getItem(DEVICE_TOKEN_KEY);
    if (!token) return;
    localStorage.removeItem(DEVICE_TOKEN_KEY);
    await ApiComunicator("/notifications/removeDevice", "POST", { token }).catch(() => {});
}

// Asks for permission, registers this phone and starts listening.
//   onReceive(notification): a notification arrived while the app is open
//   onOpen(url): the user tapped a notification; url is the page to open
// Returns a function that stops listening.
export async function startPushNotifications({ onReceive, onOpen }) {
    if (!Capacitor.isNativePlatform()) return () => {};

    const permission = await PushNotifications.requestPermissions();
    if (permission.receive !== "granted") return () => {};

    const listeners = await Promise.all([
        PushNotifications.addListener("registration", (result) => saveDeviceToken(result.value)),
        PushNotifications.addListener("registrationError", (error) => console.error("Push registration failed", error)),
        PushNotifications.addListener("pushNotificationReceived", onReceive),
        PushNotifications.addListener("pushNotificationActionPerformed", (action) => onOpen(action.notification.data?.url)),
    ]);
    await PushNotifications.register();

    return () => listeners.forEach((listener) => listener.remove());
}
