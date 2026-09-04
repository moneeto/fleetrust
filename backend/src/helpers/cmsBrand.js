const DESTINOS = new Set(['TOURS', 'MAINTENANCE']);
const BRANDS = new Set(['tours', 'aviation']);

function parseBrand(value) {
    const brand = String(value || '').trim().toLowerCase();
    if (!BRANDS.has(brand)) {
        throw 'Invalid brand. Use tours or aviation.';
    }
    return brand;
}

function parseTarget(value) {
    const raw = String(value || '').trim().toUpperCase();
    if (raw === 'TOURS' || raw === 'MAINTENANCE') {
        return raw;
    }
    const brand = String(value || '').trim().toLowerCase();
    if (brand === 'tours') return 'TOURS';
    if (brand === 'aviation' || brand === 'maintenance') return 'MAINTENANCE';
    throw 'Invalid target. Use TOURS or MAINTENANCE.';
}

module.exports = {
    parseBrand,
    parseTarget,
    DESTINOS,
};
