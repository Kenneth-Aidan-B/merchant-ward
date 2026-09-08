import type { Coordinates, LivePlace } from '@/lib/place-types';

const OVERPASS_URL = 'https://overpass-api.de/api/interpreter';
const NOMINATIM_URL = 'https://nominatim.openstreetmap.org/search';

type OsmElement = {
  type?: 'node' | 'way' | 'relation';
  id?: number;
  lat?: number;
  lon?: number;
  center?: { lat?: number; lon?: number };
  tags?: Record<string, string>;
};

function category(tags: Record<string, string>) {
  const value = tags.shop ?? tags.amenity ?? tags.craft ?? 'local business';
  return value.replaceAll('_', ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function address(tags: Record<string, string>) {
  const street = [tags['addr:housenumber'], tags['addr:street']].filter(Boolean).join(' ');
  const area = [tags['addr:suburb'], tags['addr:city'], tags['addr:postcode']].filter(Boolean).join(', ');
  return [street, area].filter(Boolean).join(', ') || tags['addr:full'] || 'Address available on map';
}

function toPlace(element: OsmElement): LivePlace | null {
  const tags = element.tags ?? {};
  const lat = element.lat ?? element.center?.lat;
  const lng = element.lon ?? element.center?.lon;
  const id = element.id;
  if (!tags.name || lat === undefined || lng === undefined || !id || !element.type) return null;
  return {
    id: `osm:${element.type}:${id}`,
    source: 'openstreetmap',
    name: tags.name,
    category: category(tags),
    address: address(tags),
    coordinates: { lat, lng },
    openNow: undefined,
    photos: [],
    phone: tags.phone ?? tags['contact:phone'],
    websiteUri: tags.website ?? tags['contact:website'],
    openingHours: tags.opening_hours ? [tags.opening_hours] : [],
    description: tags.description,
  };
}

async function overpass(query: string) {
  const response = await fetch(OVERPASS_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=UTF-8' },
    body: query,
  });
  if (!response.ok) throw new Error('The community map directory is temporarily unavailable.');
  const body = await response.json() as { elements?: OsmElement[] };
  return (body.elements ?? []).flatMap((element) => toPlace(element) ?? []);
}

export async function searchOpenStreetMapNearby(center: Coordinates, radiusMeters: number) {
  const radius = Math.min(Math.max(Math.round(radiusMeters), 250), 10000);
  const query = `[out:json][timeout:18];(nwr(around:${radius},${center.lat},${center.lng})[shop][name];nwr(around:${radius},${center.lat},${center.lng})[amenity~"cafe|restaurant|fast_food|ice_cream|hairdresser|bicycle_repair_shop"][name];nwr(around:${radius},${center.lat},${center.lng})[craft][name];);out center tags;`;
  const places = await overpass(query);
  return places.slice(0, 30);
}

export async function searchOpenStreetMapArea(query: string) {
  const response = await fetch(`${NOMINATIM_URL}?format=jsonv2&limit=1&q=${encodeURIComponent(query)}`, { headers: { Accept: 'application/json' } });
  if (!response.ok) throw new Error('The area could not be located on the community map.');
  const results = await response.json() as Array<{ lat?: string; lon?: string }>;
  const result = results[0];
  const lat = Number(result?.lat);
  const lng = Number(result?.lon);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) throw new Error('No mapped area matched that search.');
  return searchOpenStreetMapNearby({ lat, lng }, 5000);
}
