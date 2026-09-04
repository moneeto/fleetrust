function parseInstagramPermalink(raw) {
    if (!raw || typeof raw !== 'string') {
        throw 'Instagram URL is required';
    }

    let url;
    try {
        url = new URL(raw.trim());
    } catch {
        throw 'Invalid Instagram URL';
    }

    const host = url.hostname.replace(/^www\./, '');
    if (host !== 'instagram.com' && host !== 'instagr.am') {
        throw 'URL must be an Instagram post or reel';
    }

    const parts = url.pathname.split('/').filter(Boolean);
    let mediaKind = 'p';
    let shortcode = '';

    if (parts[0] === 'p' || parts[0] === 'reel' || parts[0] === 'reels' || parts[0] === 'tv') {
        mediaKind = parts[0] === 'p' ? 'p' : 'reel';
        shortcode = parts[1] || '';
    } else if (parts[1] === 'p' || parts[1] === 'reel' || parts[1] === 'reels' || parts[1] === 'tv') {
        mediaKind = parts[1] === 'p' ? 'p' : 'reel';
        shortcode = parts[2] || '';
    }

    if (!shortcode || !/^[A-Za-z0-9_-]+$/.test(shortcode)) {
        throw 'Could not read the Instagram post id from that URL';
    }

    const pathKind = mediaKind === 'p' ? 'p' : 'reel';
    const permalink = `https://www.instagram.com/${pathKind}/${shortcode}/`;

    return { permalink, shortcode, mediaKind: pathKind };
}

function embedUrl({ mediaKind, shortcode }) {
    const kind = mediaKind === 'p' ? 'p' : 'reel';
    return `https://www.instagram.com/${kind}/${shortcode}/embed/`;
}

module.exports = {
    parseInstagramPermalink,
    embedUrl,
};
