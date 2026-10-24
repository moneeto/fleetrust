import Config from '../config.js';
import { ApiComunicator } from './ApiComunicator';

const SCRIPT_ID = 'google-identity-script';

function loadGoogleScript() {
    if (window.google?.accounts?.id) {
        return Promise.resolve();
    }

    return new Promise((resolve, reject) => {
        const script = document.getElementById(SCRIPT_ID) || document.createElement('script');
        script.addEventListener('load', () => resolve());
        script.addEventListener('error', () => reject(new Error('Google sign-in could not be loaded')));
        if (!script.id) {
            script.id = SCRIPT_ID;
            script.src = 'https://accounts.google.com/gsi/client';
            script.async = true;
            document.head.appendChild(script);
        }
    });
}

export async function renderGoogleButton(container, onToken) {
    await loadGoogleScript();
    window.google.accounts.id.initialize({
        client_id: Config.googleClientId,
        callback: (response) => onToken(response.credential)
    });
    window.google.accounts.id.renderButton(container, {
        theme: 'outline',
        size: 'large',
        text: 'continue_with',
        width: Math.min(container.offsetWidth, 400)
    });
}

export const loginWithGoogle = (idToken) => ApiComunicator('/auth/googleLogin', 'POST', { idToken });
