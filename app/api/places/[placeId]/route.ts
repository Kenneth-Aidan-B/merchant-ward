import { GooglePlacesError, getPlaceDetails } from '@/lib/google-places';

export async function GET(_: Request, context: { params: Promise<{ placeId: string }> }) {
  const { placeId } = await context.params;
  if (!placeId || placeId.length > 200) return Response.json({ error: 'Invalid place.', code: 'INVALID_PLACE' }, { status: 400 });
  try {
    return Response.json({ place: await getPlaceDetails(placeId) });
  } catch (error) {
    const known = error instanceof GooglePlacesError ? error : new GooglePlacesError('Unable to reach Google Places.', 502, 'UPSTREAM_ERROR');
    return Response.json({ error: known.message, code: known.code }, { status: known.status });
  }
}
