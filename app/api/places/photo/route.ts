import { GooglePlacesError, getPhotoUri } from '@/lib/google-places';

export async function GET(request: Request) {
  const name = new URL(request.url).searchParams.get('name');
  if (!name) return Response.json({ error: 'Photo reference is required.', code: 'INVALID_PHOTO' }, { status: 400 });
  try {
    return Response.redirect(await getPhotoUri(name), 302);
  } catch (error) {
    const known = error instanceof GooglePlacesError ? error : new GooglePlacesError('Unable to retrieve the photo.', 502, 'UPSTREAM_ERROR');
    return Response.json({ error: known.message, code: known.code }, { status: known.status });
  }
}
