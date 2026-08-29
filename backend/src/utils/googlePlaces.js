async function fetchPlaceDetails(placeId) {
    const key = process.env.GOOGLE_PLACES_API_KEY;
    if (!key) {
        throw 'GOOGLE_PLACES_API_KEY is not configured';
    }
    if (!placeId) {
        throw 'Google Place ID is not configured for this brand';
    }

    const url = new URL('https://maps.googleapis.com/maps/api/place/details/json');
    url.searchParams.set('place_id', placeId);
    url.searchParams.set('fields', 'name,rating,user_ratings_total,reviews');
    url.searchParams.set('reviews_sort', 'newest');
    url.searchParams.set('key', key);

    const res = await fetch(url);
    if (!res.ok) {
        throw `Google Places request failed (${res.status})`;
    }

    const data = await res.json();
    if (data.status && data.status !== 'OK') {
        throw data.error_message || `Google Places error: ${data.status}`;
    }

    const result = data.result || {};
    return {
        rating: result.rating ?? null,
        userRatingsTotal: result.user_ratings_total ?? 0,
        reviews: Array.isArray(result.reviews) ? result.reviews : [],
    };
}

function mapGoogleReview(review) {
    const time = review.time != null ? Number(review.time) : 0;
    const author = review.author_name || 'Google user';

    return {
        googleReviewId: `${time}:${author}`.slice(0, 191),
        authorName: author,
        authorPhoto: review.profile_photo_url || null,
        rating: review.rating != null ? Number(review.rating) : null,
        reviewText: review.text || '',
        relativeTime: review.relative_time_description || null,
        reviewTime: time || null,
        ownerResponseText: review.owner_response?.text || null,
        ownerResponseTime: review.owner_response?.time || null,
    };
}

module.exports = {
    fetchPlaceDetails,
    mapGoogleReview,
};
