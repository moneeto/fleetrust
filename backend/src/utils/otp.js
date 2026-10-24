const crypto = require('crypto');

const OTP_MINUTES = 30;

function newOtpCode() {
    return String(crypto.randomInt(0, 1000000)).padStart(6, '0');
}

function otpExpiresAt(now = new Date()) {
    const t = new Date(now.getTime() + OTP_MINUTES * 60 * 1000);
    const pad = (n) => String(n).padStart(2, '0');
    return `${t.getFullYear()}-${pad(t.getMonth() + 1)}-${pad(t.getDate())} ${pad(t.getHours())}:${pad(t.getMinutes())}:${pad(t.getSeconds())}`;
}

function otpAccepts(row, purpose, now) {
    if (!row || row.purpose !== purpose || Number(row.active) !== 1) return false;
    const expiresAt = new Date(String(row.expiresAt).replace(' ', 'T'));
    return expiresAt.getTime() > now.getTime();
}

// Mirrors UPDATE otp_codes SET active = 0 WHERE email = ? AND purpose = ? AND active = 1
function stillActiveAfterIssue(rows, email, purpose) {
    return rows.filter((row) => !(row.email === email && row.purpose === purpose && Number(row.active) === 1));
}

module.exports = {
    OTP_MINUTES,
    newOtpCode,
    otpExpiresAt,
    otpAccepts,
    stillActiveAfterIssue
};
