import { GooglePlacesError, searchByText } from '@/lib/google-places';
import { searchOpenStreetMapArea } from '@/lib/openstreetmap';

export async function GET(request: Request) {
  const query = new URL(request.url).searchParams.get('q')?.trim();
  if (!query || query.length < 2 || query.length > 160) {
    return Response.json({ error: 'Enter a neighbourhood, city, or area to search.', code: 'INVALID_QUERY' }, { status: 400 });
  }
  try {
    return Response.json({ places: await searchByText(query), provider: 'google' });
  } catch (error) {
    if (error instanceof GooglePlacesError && error.code === 'PLACES_NOT_CONFIGURED') {
      try {
        return Response.json({ places: await searchOpenStreetMapArea(query), provider: 'openstreetmap' });
      } catch (fallbackError) {
        return Response.json({ error: fallbackError instanceof Error ? fallbackError.message : 'Unable to load local businesses.', code: 'FALLBACK_UNAVAILABLE' }, { status: 502 });
      }
    }
    const known = error instanceof GooglePlacesError ? error : new GooglePlacesError('Unable to reach Google Places.', 502, 'UPSTREAM_ERROR');
    return Response.json({ error: known.message, code: known.code }, { status: known.status });
  }
}
