import { GooglePlacesError, searchNearby } from '@/lib/google-places';
import { searchOpenStreetMapNearby } from '@/lib/openstreetmap';

function numberParam(value: string | null, fallback: number) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const lat = numberParam(searchParams.get('lat'), Number.NaN);
  const lng = numberParam(searchParams.get('lng'), Number.NaN);
  const radius = Math.min(Math.max(numberParam(searchParams.get('radius'), 3000), 250), 50000);
  if (!Number.isFinite(lat) || !Number.isFinite(lng) || Math.abs(lat) > 90 || Math.abs(lng) > 180) {
    return Response.json({ error: 'A valid map location is required.', code: 'INVALID_LOCATION' }, { status: 400 });
  }
  try {
    return Response.json({ places: await searchNearby({ lat, lng }, radius), provider: 'google' });
  } catch (error) {
    if (error instanceof GooglePlacesError && error.code === 'PLACES_NOT_CONFIGURED') {
      try {
        return Response.json({ places: await searchOpenStreetMapNearby({ lat, lng }, radius), provider: 'openstreetmap' });
      } catch (fallbackError) {
        return Response.json({ error: fallbackError instanceof Error ? fallbackError.message : 'Unable to load nearby businesses.', code: 'FALLBACK_UNAVAILABLE' }, { status: 502 });
      }
    }
    const known = error instanceof GooglePlacesError ? error : new GooglePlacesError('Unable to reach Google Places.', 502, 'UPSTREAM_ERROR');
    return Response.json({ error: known.message, code: known.code }, { status: known.status });
  }
}
