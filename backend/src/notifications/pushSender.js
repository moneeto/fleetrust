// Sends one push message to one phone using Firebase Cloud Messaging (FCM HTTP v1).
// Uses google-auth-library, which is already installed, so no new dependency.
//
// Setup: put the Firebase service account json somewhere safe and set
//   FIREBASE_SERVICE_ACCOUNT_PATH=/path/to/firebase-service-account.json
// in backend/.env. Without it, pushes are skipped (handy for local development).

const { GoogleAuth } = require('google-auth-library');

let googleAuth = null;

function getGoogleAuth() {
    if (!googleAuth) {
        googleAuth = new GoogleAuth({
            keyFile: process.env.FIREBASE_SERVICE_ACCOUNT_PATH,
            scopes: ['https://www.googleapis.com/auth/firebase.messaging'],
        });
    }
    return googleAuth;
}

// FCM only accepts text values inside "data".
function getTextData(data) {
    return Object.fromEntries(Object.entries(data).map(([key, value]) => [key, String(value)]));
}

// Returns 'sent', 'skipped', 'invalid_token' (the phone is gone, delete its token) or 'failed'.
async function sendPushMessage(token, title, message, data = {}) {
    if (!process.env.FIREBASE_SERVICE_ACCOUNT_PATH) {
        console.log('[push] FIREBASE_SERVICE_ACCOUNT_PATH is not set. Push skipped:', title);
        return 'skipped';
    }

    try {
        const auth = getGoogleAuth();
        const projectId = await auth.getProjectId();
        const accessToken = await auth.getAccessToken();

        const response = await fetch(`https://fcm.googleapis.com/v1/projects/${projectId}/messages:send`, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                message: {
                    token,
                    notification: { title, body: message },
                    data: getTextData(data),
                    android: { priority: 'HIGH' },
                },
            }),
        });
        if (response.ok) return 'sent';

        const body = await response.text();
        console.log('[push] FCM rejected the message:', response.status, body);
        const tokenIsDead = response.status === 404 || (response.status === 400 && body.includes('registration token'));
        return tokenIsDead ? 'invalid_token' : 'failed';
    } catch (e) {
        console.log('[push] Could not send the message:', e);
        return 'failed';
    }
}

module.exports = { sendPushMessage };
