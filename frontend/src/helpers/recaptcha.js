import Config from '../config.js';

const SCRIPT_ID = 'recaptcha-v3-script';

/**
 * Carga el script de reCAPTCHA v3 una sola vez.
 * @param {string} siteKey
 * @returns {Promise<void>}
 */
function loadRecaptchaScript(siteKey) {
    if (typeof window === 'undefined') {
        return Promise.reject(new Error('reCAPTCHA solo disponible en el navegador'));
    }

    if (window.grecaptcha?.execute) {
        return Promise.resolve();
    }

    const existing = document.getElementById(SCRIPT_ID);
    if (existing) {
        return new Promise((resolve, reject) => {
            existing.addEventListener('load', () => resolve());
            existing.addEventListener('error', () => reject(new Error('No se pudo cargar reCAPTCHA')));
        });
    }

    return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.id = SCRIPT_ID;
        script.src = `https://www.google.com/recaptcha/api.js?render=${siteKey}`;
        script.async = true;
        script.onload = () => resolve();
        script.onerror = () => reject(new Error('No se pudo cargar reCAPTCHA'));
        document.head.appendChild(script);
    });
}

/**
 * Obtiene un token de reCAPTCHA v3 para la acción indicada.
 * Si no hay site key configurada, retorna null (el backend puede tener captcha desactivado).
 *
 * @param {string} action - Solo alfanuméricos, barras y guiones bajos (ej: 'login')
 * @returns {Promise<string|null>}
 */
export async function getRecaptchaToken(action = 'submit') {
    const siteKey = Config.reCaptchaKey;

    if (!siteKey) {
        return null;
    }

    await loadRecaptchaScript(siteKey);

    return new Promise((resolve, reject) => {
        window.grecaptcha.ready(() => {
            window.grecaptcha
                .execute(siteKey, { action })
                .then(resolve)
                .catch(reject);
        });
    });
}
