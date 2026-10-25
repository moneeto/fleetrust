function envList(value) {
    return String(value || '').split(',').map((item) => item.trim()).filter(Boolean);
}

const googleAudiences = () => envList(process.env.GOOGLE_CLIENT_ID);
const webauthnOrigins = () => envList(process.env.WEBAUTHN_ORIGINS);

module.exports = { envList, googleAudiences, webauthnOrigins };
