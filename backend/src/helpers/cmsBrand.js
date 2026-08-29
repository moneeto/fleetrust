const BRANDS = new Set(['tours', 'aviation']);

function parseBrand(value) {
    const brand = String(value || '').trim().toLowerCase();
    if (!BRANDS.has(brand)) {
        throw 'Invalid brand. Use tours or aviation.';
    }
    return brand;
}

function placeIdForBrand(brand) {
    if (brand === 'tours') {
        return process.env.GOOGLE_PLACE_ID_TOURS;
    }
    return process.env.GOOGLE_PLACE_ID_AVIATION;
}

module.exports = {
    parseBrand,
    placeIdForBrand,
};
