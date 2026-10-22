const GENERIC = 'Something went wrong. Please try again.';

export function apiErrorText(body) {
    if (body && typeof body === 'object' && (body.sqlMessage || body.errno)) return GENERIC;
    const text = typeof body === 'string'
        ? body
        : body && (typeof body.message === 'string' ? body.message : body.mensaje);
    if (typeof text !== 'string' || !text.trim()) return GENERIC;
    if (/\b(ER_[A-Z0-9_]+|SQL syntax|Unknown column|Duplicate entry)\b/i.test(text)) return GENERIC;
    return text.trim();
}
