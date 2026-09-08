'use client';

import { LoaderCircle } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import type { Coordinates, LivePlace } from '@/lib/place-types';

type MerchantGoogleMapProps = {
  places: LivePlace[];
  selectedPlaceId?: string;
  center: Coordinates;
  onSelectPlace: (placeId: string) => void;
};

type GoogleMapInstance = { panTo: (position: Coordinates) => void; fitBounds: (bounds: GoogleBounds, padding?: number) => void };
type GoogleBounds = { extend: (position: Coordinates) => void };
type GoogleMarker = { setMap: (map: GoogleMapInstance | null) => void; addListener: (eventName: string, handler: () => void) => void };
type GoogleMapsWindow = Window & { google?: { maps?: {
  Map: new (element: HTMLElement, options: Record<string, unknown>) => GoogleMapInstance;
  Marker: new (options: Record<string, unknown>) => GoogleMarker;
  LatLngBounds: new () => GoogleBounds;
  SymbolPath: { CIRCLE: unknown };
} } };

const scriptId = 'merchant-ward-google-maps';
let loader: Promise<void> | undefined;

function loadGoogleMaps(apiKey: string) {
  const googleWindow = window as GoogleMapsWindow;
  if (googleWindow.google?.maps?.Map) return Promise.resolve();
  if (loader) return loader;
  loader = new Promise<void>((resolve, reject) => {
    const script = document.getElementById(scriptId) as HTMLScriptElement | null ?? document.createElement('script');
    if (!script.id) {
      script.id = scriptId;
      script.async = true;
      script.defer = true;
      script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(apiKey)}&v=weekly`;
      document.head.appendChild(script);
    }
    script.addEventListener('load', () => resolve(), { once: true });
    script.addEventListener('error', () => reject(new Error('Google Maps could not load.')), { once: true });
  });
  return loader;
}

export function MerchantGoogleMap({ places, selectedPlaceId, center, onSelectPlace }: MerchantGoogleMapProps) {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  const mapElement = useRef<HTMLDivElement | null>(null);
  const map = useRef<GoogleMapInstance | null>(null);
  const markers = useRef<GoogleMarker[]>([]);
  const [state, setState] = useState<'loading' | 'ready' | 'error'>('loading');
  const fallbackUrl = useMemo(() => `https://maps.google.com/maps?q=${center.lat},${center.lng}&z=14&output=embed`, [center.lat, center.lng]);

  useEffect(() => {
    if (!apiKey || !mapElement.current || map.current) return;
    let active = true;
    loadGoogleMaps(apiKey).then(() => {
      if (!active || !mapElement.current) return;
      const googleMaps = (window as GoogleMapsWindow).google?.maps;
      if (!googleMaps?.Map) throw new Error('Google Maps was unavailable after loading.');
      map.current = new googleMaps.Map(mapElement.current, {
        center, zoom: 14, clickableIcons: false, disableDefaultUI: true, fullscreenControl: true, mapTypeControl: false, streetViewControl: false, zoomControl: true,
      });
      setState('ready');
    }).catch(() => { if (active) setState('error'); });
    return () => { active = false; };
  }, [apiKey, center]);

  useEffect(() => {
    const googleMaps = (window as GoogleMapsWindow).google?.maps;
    if (!map.current || !googleMaps?.Marker || !googleMaps.SymbolPath) return;
    markers.current.forEach((marker) => marker.setMap(null));
    markers.current = places.map((place) => {
      const selected = place.id === selectedPlaceId;
      const marker = new googleMaps.Marker({
        map: map.current, position: place.coordinates, title: `${place.name} · ${place.category}`,
        icon: { path: googleMaps.SymbolPath.CIRCLE, fillColor: selected ? '#cf7b24' : '#254f49', fillOpacity: 1, scale: selected ? 11 : 7, strokeColor: '#ffffff', strokeOpacity: 1, strokeWeight: 2 },
      });
      marker.addListener('click', () => onSelectPlace(place.id));
      return marker;
    });
    if (places.length > 1 && googleMaps.LatLngBounds) {
      const bounds = new googleMaps.LatLngBounds();
      places.forEach((place) => bounds.extend(place.coordinates));
      map.current.fitBounds(bounds, 52);
    } else if (places[0]) {
      map.current.panTo(places[0].coordinates);
    }
    return () => { markers.current.forEach((marker) => marker.setMap(null)); markers.current = []; };
  }, [onSelectPlace, places, selectedPlaceId, state]);

  useEffect(() => {
    const selected = places.find((place) => place.id === selectedPlaceId);
    if (selected && map.current) map.current.panTo(selected.coordinates);
  }, [places, selectedPlaceId]);

  if (!apiKey) {
    return <div className="google-map-canvas google-map-fallback"><iframe title="Google Maps" src={fallbackUrl} loading="lazy" referrerPolicy="no-referrer-when-downgrade" /></div>;
  }

  return <div className="google-map-canvas"><div ref={mapElement} className="google-map-live" aria-label="Interactive Google Map with nearby business pins" />{state === 'loading' ? <div className="map-loading"><LoaderCircle size={20} className="animate-spin" />Loading live map</div> : null}{state === 'error' ? <div className="map-loading map-error">Google Maps could not load. Check the Maps JavaScript API configuration.</div> : null}</div>;
}
