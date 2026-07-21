/**
 * Verifica un token de reCAPTCHA v3 contra la API de Google.
 * Se activa solo si UTILIZAR_CAPTCHA=true.
 *
 * Env:
 *  - UTILIZAR_CAPTCHA=true|false
 *  - CAPTCHA_SECRET_KEY=...
 *  - CAPTCHA_SCORE_MINIMO=0.5
 *
 * @param {string} token - Token generado en el frontend con grecaptcha.execute
 * @param {string} [expectedAction] - Nombre de acción esperado (ej: 'login')
 * @returns {Promise<{success: boolean, score?: number, action?: string, skipped?: boolean}>}
 */
async function verifyRecaptcha(token, expectedAction) {
    if (process.env.UTILIZAR_CAPTCHA !== 'true') {
        return { success: true, skipped: true };
    }

    if (!token) {
        return { success: false, error: 'missing-token' };
    }

    if (!process.env.CAPTCHA_SECRET_KEY) {
        console.error('[reCAPTCHA] CAPTCHA_SECRET_KEY no configurada');
        return { success: false, error: 'misconfigured' };
    }

    const minScore = parseFloat(process.env.CAPTCHA_SCORE_MINIMO);

    const params = new URLSearchParams({
        secret: process.env.CAPTCHA_SECRET_KEY,
        response: token,
    });

    const result = await fetch('https://www.google.com/recaptcha/api/siteverify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: params.toString(),
    }).then((res) => res.json());

    if (!result.success) {
        return { success: false, ...result };
    }

    if (typeof result.score === 'number' && result.score < minScore) {
        return { success: false, ...result };
    }

    if (expectedAction && result.action && result.action !== expectedAction) {
        return { success: false, ...result, error: 'action-mismatch' };
    }

    return result;
}

module.exports = { verifyRecaptcha };
