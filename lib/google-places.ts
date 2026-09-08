import type { Coordinates, LivePlace, PlaceDetails, PlacePhoto, PlaceReview } from '@/lib/place-types';

const GOOGLE_PLACES_ORIGIN = 'https://places.googleapis.com/v1';
const SEARCH_FIELDS = [
  'places.id',
  'places.displayName',
  'places.primaryTypeDisplayName',
  'places.formattedAddress',
  'places.location',
  'places.rating',
  'places.userRatingCount',
  'places.currentOpeningHours',
  'places.googleMapsUri',
  'places.photos',
].join(',');
const DETAILS_FIELDS = [
  'id',
  'displayName',
  'primaryTypeDisplayName',
  'formattedAddress',
  'location',
  'rating',
  'userRatingCount',
  'currentOpeningHours',
  'regularOpeningHours',
  'googleMapsUri',
  'websiteUri',
  'internationalPhoneNumber',
  'nationalPhoneNumber',
  'photos',
  'editorialSummary',
  'reviews',
  'priceLevel',
  'priceRange',
  'types',
  'accessibilityOptions',
  'paymentOptions',
  'takeout',
  'delivery',
  'dineIn',
  'reservable',
  'outdoorSeating',
  'goodForChildren',
  'parkingOptions',
].join(',');

type GooglePlace = Record<string, unknown>;

function getApiKey() {
  return process.env.GOOGLE_PLACES_API_KEY;
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' ? value as Record<string, unknown> : {};
}

function asString(value: unknown) {
  return typeof value === 'string' ? value : undefined;
}

function asNumber(value: unknown) {
  return typeof value === 'number' ? value : undefined;
}

function normalizePhotos(value: unknown): PlacePhoto[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((photo) => {
    const source = asRecord(photo);
    const name = asString(source.name);
    if (!name) return [];
    const attributions = Array.isArray(source.authorAttributions)
      ? source.authorAttributions.flatMap((item) => {
        const attribution = asRecord(item);
        return asString(attribution.displayName) ?? [];
      })
      : [];
    return [{
      name,
      width: asNumber(source.widthPx) ?? 0,
      height: asNumber(source.heightPx) ?? 0,
      authorAttributions: attributions,
    }];
  });
}

function openingNow(value: unknown) {
  const hours = asRecord(value);
  return typeof hours.openNow === 'boolean' ? hours.openNow : undefined;
}

function normalizePlace(raw: GooglePlace): LivePlace | null {
  const displayName = asRecord(raw.displayName);
  const location = asRecord(raw.location);
  const id = asString(raw.id);
  const name = asString(displayName.text);
  const lat = asNumber(location.latitude);
  const lng = asNumber(location.longitude);
  if (!id || !name || lat === undefined || lng === undefined) return null;
  const category = asString(asRecord(raw.primaryTypeDisplayName).text) ?? 'Local business';
  return {
    id,
    source: 'google',
    name,
    category,
    address: asString(raw.formattedAddress) ?? 'Address not provided',
    coordinates: { lat, lng },
    rating: asNumber(raw.rating),
    userRatingCount: asNumber(raw.userRatingCount),
    openNow: openingNow(raw.currentOpeningHours),
    googleMapsUri: asString(raw.googleMapsUri),
    photos: normalizePhotos(raw.photos),
  };
}

async function googleRequest(path: string, init: RequestInit, fieldMask: string) {
  const key = getApiKey();
  if (!key) {
    throw new GooglePlacesError('Google Places is not configured on the server.', 503, 'PLACES_NOT_CONFIGURED');
  }
  const response = await fetch(`${GOOGLE_PLACES_ORIGIN}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': key,
      'X-Goog-FieldMask': fieldMask,
      ...init.headers,
    },
  });
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    const message = asString(asRecord(body).error && asRecord(asRecord(body).error).message) ?? 'Google Places did not return results.';
    throw new GooglePlacesError(message, response.status, 'GOOGLE_PLACES_ERROR');
  }
  return response.json() as Promise<Record<string, unknown>>;
}

export class GooglePlacesError extends Error {
  constructor(message: string, public status: number, public code: string) {
    super(message);
  }
}

export async function searchNearby(center: Coordinates, radiusMeters: number) {
  const data = await googleRequest('/places:searchNearby', {
    method: 'POST',
    body: JSON.stringify({
      includedTypes: ['cafe', 'bakery', 'restaurant', 'book_store', 'bicycle_store', 'clothing_store', 'florist', 'gift_shop', 'hair_salon', 'jewelry_store', 'pet_store'],
      maxResultCount: 20,
      locationRestriction: { circle: { center: { latitude: center.lat, longitude: center.lng }, radius: radiusMeters } },
    }),
  }, SEARCH_FIELDS);
  return (Array.isArray(data.places) ? data.places : []).flatMap((place) => normalizePlace(asRecord(place)) ?? []);
}

export async function searchByText(query: string) {
  const data = await googleRequest('/places:searchText', {
    method: 'POST',
    body: JSON.stringify({ textQuery: `${query} local shops`, pageSize: 20 }),
  }, SEARCH_FIELDS);
  return (Array.isArray(data.places) ? data.places : []).flatMap((place) => normalizePlace(asRecord(place)) ?? []);
}

export async function getPlaceDetails(placeId: string): Promise<PlaceDetails> {
  const data = await googleRequest(`/places/${encodeURIComponent(placeId)}`, { method: 'GET' }, DETAILS_FIELDS);
  const base = normalizePlace(data);
  if (!base) throw new GooglePlacesError('This place could not be read from Google Places.', 404, 'PLACE_NOT_FOUND');
  const regularHours = asRecord(data.regularOpeningHours);
  const reviews: PlaceReview[] = Array.isArray(data.reviews) ? data.reviews.flatMap((review) => {
    const source = asRecord(review);
    const author = asRecord(source.authorAttribution);
    const text = asString(asRecord(source.text).text);
    return [{
      text,
      rating: asNumber(source.rating),
      publishTime: asString(source.publishTime),
      relativePublishTimeDescription: asString(source.relativePublishTimeDescription),
      authorName: asString(author.displayName),
      authorPhotoUri: asString(author.photoUri),
    }];
  }) : [];
  const accessibility = Object.entries(asRecord(data.accessibilityOptions))
    .filter(([, value]) => value === true)
    .map(([key]) => key.replace(/([A-Z])/g, ' $1').replace(/^./, (value) => value.toUpperCase()));
  const amenities = [
    ['Takeout', data.takeout], ['Delivery', data.delivery], ['Dine-in', data.dineIn], ['Reservations', data.reservable], ['Outdoor seating', data.outdoorSeating], ['Good for children', data.goodForChildren],
  ].filter(([, value]) => value === true).map(([label]) => label);
  return {
    ...base,
    phone: asString(data.internationalPhoneNumber) ?? asString(data.nationalPhoneNumber),
    websiteUri: asString(data.websiteUri),
    mapsUri: asString(data.googleMapsUri),
    priceLevel: asString(data.priceLevel),
    priceRange: asString(data.priceRange),
    openingHours: Array.isArray(regularHours.weekdayDescriptions) ? regularHours.weekdayDescriptions.filter((item): item is string => typeof item === 'string') : [],
    editorialSummary: asString(asRecord(data.editorialSummary).text),
    types: Array.isArray(data.types) ? data.types.filter((item): item is string => typeof item === 'string') : [],
    reviews,
    accessibility,
    amenities,
  };
}

export async function getPhotoUri(photoName: string) {
  const key = getApiKey();
  if (!key) throw new GooglePlacesError('Google Places is not configured on the server.', 503, 'PLACES_NOT_CONFIGURED');
  if (!/^places\/[^/]+\/photos\/[^/]+$/.test(photoName)) throw new GooglePlacesError('Invalid photo request.', 400, 'INVALID_PHOTO');
  const response = await fetch(`${GOOGLE_PLACES_ORIGIN}/${photoName}/media?maxWidthPx=1200&skipHttpRedirect=true&key=${encodeURIComponent(key)}`);
  if (!response.ok) throw new GooglePlacesError('The place photo is not currently available.', response.status, 'PHOTO_UNAVAILABLE');
  const data = asRecord(await response.json());
  const photoUri = asString(data.photoUri);
  if (!photoUri) throw new GooglePlacesError('The place photo is not currently available.', 404, 'PHOTO_UNAVAILABLE');
  return photoUri;
}
