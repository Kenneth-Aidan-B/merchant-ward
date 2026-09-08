'use client';

import { ArrowUpRight, Clock3, ExternalLink, Globe2, LocateFixed, MapPin, Navigation, Phone, Search, SlidersHorizontal, Sparkles, Star, Store, X } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { MerchantGoogleMap } from '@/components/merchant-google-map';
import type { Coordinates, LivePlace, PlaceDetails, PlacesApiError } from '@/lib/place-types';

const defaultCenter: Coordinates = { lat: 20.5937, lng: 78.9629 };
const radiusOptions = [
  { label: '1 km', meters: 1000 }, { label: '3 km', meters: 3000 }, { label: '5 km', meters: 5000 }, { label: '10 km', meters: 10000 },
];

function photoUrl(name: string) {
  return `/api/places/photo?name=${encodeURIComponent(name)}`;
}

function mapsDirectionsUrl(place: LivePlace | PlaceDetails) {
  return `https://www.google.com/maps/dir/?api=1&destination=${place.coordinates.lat},${place.coordinates.lng}&destination_place_id=${encodeURIComponent(place.id)}`;
}

function formatCount(count?: number) {
  if (!count) return 'No ratings yet';
  return `${count.toLocaleString()} Google rating${count === 1 ? '' : 's'}`;
}

function errorMessage(error: unknown) {
  return error && typeof error === 'object' && 'error' in error && typeof (error as PlacesApiError).error === 'string'
    ? (error as PlacesApiError).error
    : 'We could not load local businesses right now.';
}

function openStreetMapDetails(place: LivePlace): PlaceDetails {
  return {
    ...place,
    phone: place.phone,
    websiteUri: place.websiteUri,
    mapsUri: undefined,
    priceLevel: undefined,
    priceRange: undefined,
    openingHours: place.openingHours ?? [],
    editorialSummary: place.description ?? 'Community-mapped local business listing.',
    types: [place.category],
    reviews: [],
    accessibility: [],
    amenities: [],
  };
}

export default function Home() {
  const [places, setPlaces] = useState<LivePlace[]>([]);
  const [center, setCenter] = useState<Coordinates>(defaultCenter);
  const [areaQuery, setAreaQuery] = useState('');
  const [category, setCategory] = useState('All');
  const [radius, setRadius] = useState(radiusOptions[1]);
  const [status, setStatus] = useState<'idle' | 'loading' | 'ready' | 'error'>('idle');
  const [provider, setProvider] = useState<'google' | 'openstreetmap' | undefined>();
  const [error, setError] = useState('');
  const [selectedId, setSelectedId] = useState<string>();
  const [details, setDetails] = useState<PlaceDetails>();
  const [detailsStatus, setDetailsStatus] = useState<'idle' | 'loading' | 'error'>('idle');

  const categories = useMemo(() => ['All', ...Array.from(new Set(places.map((place) => place.category))).sort()], [places]);
  const visiblePlaces = useMemo(() => category === 'All' ? places : places.filter((place) => place.category === category), [category, places]);
  const selectedPlace = places.find((place) => place.id === selectedId);

  const loadNearby = useCallback(async (coordinates: Coordinates, activeRadius = radius.meters) => {
    setStatus('loading');
    setError('');
    try {
      const response = await fetch(`/api/places/nearby?lat=${coordinates.lat}&lng=${coordinates.lng}&radius=${activeRadius}`);
      const data = await response.json() as { places?: LivePlace[]; provider?: 'google' | 'openstreetmap' } & PlacesApiError;
      if (!response.ok) throw data;
      setCenter(coordinates);
      setPlaces(data.places ?? []);
      setProvider(data.provider);
      setCategory('All');
      setStatus('ready');
    } catch (cause) {
      setPlaces([]);
      setStatus('error');
      setError(errorMessage(cause));
    }
  }, [radius.meters]);

  const locateUser = useCallback(() => {
    if (!navigator.geolocation) {
      setStatus('error');
      setError('This browser cannot share location. Search for an area instead.');
      return;
    }
    setStatus('loading');
    setError('');
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => void loadNearby({ lat: coords.latitude, lng: coords.longitude }),
      () => { setStatus('error'); setError('Location permission was unavailable. Search for a neighbourhood or city instead.'); },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 300000 },
    );
  }, [loadNearby]);

  async function searchArea(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const query = areaQuery.trim();
    if (!query) return locateUser();
    setStatus('loading');
    setError('');
    try {
      const response = await fetch(`/api/places/search?q=${encodeURIComponent(query)}`);
      const data = await response.json() as { places?: LivePlace[]; provider?: 'google' | 'openstreetmap' } & PlacesApiError;
      if (!response.ok) throw data;
      const found = data.places ?? [];
      setPlaces(found);
      setProvider(data.provider);
      setCategory('All');
      if (found[0]) setCenter(found[0].coordinates);
      setStatus('ready');
    } catch (cause) {
      setPlaces([]);
      setStatus('error');
      setError(errorMessage(cause));
    }
  }

  useEffect(() => { locateUser(); }, [locateUser]);

  useEffect(() => {
    if (!selectedId) { setDetails(undefined); setDetailsStatus('idle'); return; }
    if (selectedPlace?.source === 'openstreetmap') {
      setDetails(openStreetMapDetails(selectedPlace));
      setDetailsStatus('idle');
      return;
    }
    let active = true;
    setDetailsStatus('loading');
    setDetails(undefined);
    fetch(`/api/places/${encodeURIComponent(selectedId)}`).then(async (response) => {
      const data = await response.json() as { place?: PlaceDetails } & PlacesApiError;
      if (!response.ok) throw data;
      return data.place;
    }).then((place) => {
      if (active) { setDetails(place); setDetailsStatus('idle'); }
    }).catch((cause) => {
      if (active) { setDetailsStatus('error'); setError(errorMessage(cause)); }
    });
    return () => { active = false; };
  }, [selectedId, selectedPlace]);

  function selectPlace(placeId: string) {
    setSelectedId(placeId);
  }

  return (
    <main className="ward-app">
      <header className="ward-header">
        <div className="brand-lockup"><span className="brand-mark" aria-hidden="true"><span /><span /></span><div><strong>Merchant Ward</strong><small>Live nearby business finder</small></div></div>
        <button className="location-action" type="button" onClick={locateUser}><LocateFixed size={16} />Use my location</button>
      </header>

      <section className="ward-intro">
        <div><p className="eyebrow">Local discovery, live from Google Places</p><h1>Find the small businesses around you.</h1><p>Search an area or share your location. Every result is fetched live, so no sample merchants are mixed into your map.</p></div>
        <form className="area-search" onSubmit={searchArea}><Search size={18} /><input value={areaQuery} onChange={(event) => setAreaQuery(event.target.value)} placeholder="Neighbourhood, city, or landmark" aria-label="Search an area for local shops" /><button type="submit">Search</button></form>
      </section>

      <section className="discovery-surface" aria-label="Nearby small businesses">
        <aside className="places-column">
          <div className="list-heading"><div><p className="eyebrow">Nearby businesses</p><h2>{status === 'loading' ? 'Finding local shops…' : `${visiblePlaces.length} places found`}</h2></div><SlidersHorizontal size={18} /></div>
          <div className="filter-row"><select aria-label="Search radius" value={radius.meters} onChange={(event) => { const next = radiusOptions.find((option) => option.meters === Number(event.target.value)) ?? radiusOptions[1]; setRadius(next); if (places.length) void loadNearby(center, next.meters); }}>{radiusOptions.map((option) => <option key={option.meters} value={option.meters}>Within {option.label}</option>)}</select><div className="category-scroll">{categories.map((item) => <button key={item} type="button" className={category === item ? 'filter-chip active' : 'filter-chip'} onClick={() => setCategory(item)}>{item}</button>)}</div></div>

          <div className="place-list">
            {status === 'loading' ? <div className="list-message"><span className="loading-orb" />Looking for independent shops, cafés, studios, and services nearby…</div> : null}
            {status === 'error' ? <div className="list-message error-message"><strong>Live results are unavailable.</strong><span>{error}</span><button type="button" onClick={locateUser}>Try my location</button></div> : null}
            {status === 'ready' && !visiblePlaces.length ? <div className="list-message"><Store size={20} /><strong>No businesses matched this filter.</strong><span>Try a wider radius, another category, or a different area.</span></div> : null}
            {visiblePlaces.map((place) => <button key={place.id} type="button" className={selectedId === place.id ? 'place-row selected' : 'place-row'} onClick={() => selectPlace(place.id)}><span className="place-row-image">{place.photos[0] ? <img src={photoUrl(place.photos[0].name)} alt="" /> : <Store size={19} />}</span><span className="place-row-main"><strong>{place.name}</strong><span>{place.category}</span><small><MapPin size={12} />{place.address}</small></span><span className="place-row-meta">{place.rating ? <span><Star size={12} fill="currentColor" />{place.rating.toFixed(1)}</span> : null}<small className={place.openNow === false ? 'closed' : 'open'}>{place.openNow === false ? 'Closed' : place.openNow === true ? 'Open now' : ''}</small></span></button>)}
          </div>
        </aside>

        <section className="map-column" aria-label="Map location"><div className="map-toolbar"><div><p className="eyebrow">Map location</p><strong>{areaQuery || 'Your nearby area'}</strong></div><span><MapPin size={15} />{visiblePlaces.length} visible</span></div><MerchantGoogleMap places={visiblePlaces} selectedPlaceId={selectedId} center={center} onSelectPlace={selectPlace} /><div className="map-caption"><Sparkles size={15} />{provider === 'openstreetmap' ? 'Live community-map businesses are shown while Google Places is not connected.' : 'Select a business from the left list or a map marker to open its full Google listing.'}</div></section>
      </section>

      <Dialog open={Boolean(selectedId)} onOpenChange={(open) => { if (!open) setSelectedId(undefined); }}>
        <DialogContent className="place-dialog" showCloseButton={false}>
          <button className="dialog-close" type="button" onClick={() => setSelectedId(undefined)} aria-label="Close business details"><X size={20} /></button>
          {detailsStatus === 'loading' || !selectedPlace ? <div className="dialog-loading"><span className="loading-orb" />Retrieving the live Google listing…</div> : null}
          {detailsStatus === 'error' ? <div className="dialog-loading">We could not retrieve this business’s Google listing. Please try another result.</div> : null}
          {details ? <>
            <DialogHeader><p className="eyebrow">{details.source === 'google' ? 'Google business listing' : 'OpenStreetMap business listing'}</p><DialogTitle className="place-dialog-title">{details.name}</DialogTitle><DialogDescription className="place-dialog-description">{details.editorialSummary ?? details.category}</DialogDescription></DialogHeader>
            <div className="dialog-score"><span><Star size={15} fill="currentColor" />{details.rating?.toFixed(1) ?? '—'}</span><small>{formatCount(details.userRatingCount)}</small><span className={details.openNow === false ? 'status closed' : 'status open'}>{details.openNow === false ? 'Closed now' : details.openNow === true ? 'Open now' : 'Hours not listed'}</span></div>
            {details.photos.length ? <div className="photo-grid">{details.photos.slice(0, 4).map((photo, index) => <figure key={photo.name} className={index === 0 ? 'primary-photo' : ''}><img src={photoUrl(photo.name)} alt={`${details.name} from Google`} /><figcaption>{photo.authorAttributions.map((author) => `Photo by ${author}`).join(', ')}</figcaption></figure>)}</div> : null}
            <div className="detail-layout"><div className="detail-section"><h3>Contact & location</h3><p><MapPin size={16} />{details.address}</p>{details.phone ? <a href={`tel:${details.phone.replace(/\s/g, '')}`}><Phone size={16} />{details.phone}</a> : null}{details.websiteUri ? <a href={details.websiteUri} target="_blank" rel="noreferrer"><Globe2 size={16} />Visit website <ExternalLink size={13} /></a> : null}</div><div className="detail-section"><h3>Hours</h3>{details.openingHours.length ? details.openingHours.map((hours) => <p key={hours}><Clock3 size={15} />{hours}</p>) : <p>Hours are not published on Google.</p>}</div></div>
            {(details.amenities.length || details.accessibility.length || details.priceLevel) ? <div className="detail-tags">{details.priceLevel ? <span>{details.priceLevel.replaceAll('_', ' ')}</span> : null}{details.amenities.map((item) => <span key={item}>{item}</span>)}{details.accessibility.map((item) => <span key={item}>{item}</span>)}</div> : null}
            {details.reviews.length ? <section className="reviews-section"><h3>Recent Google reviews</h3>{details.reviews.slice(0, 3).map((review, index) => <article key={`${review.authorName}-${index}`}><div><strong>{review.authorName ?? 'Google user'}</strong>{review.rating ? <span><Star size={12} fill="currentColor" />{review.rating}</span> : null}<small>{review.relativePublishTimeDescription}</small></div>{review.text ? <p>{review.text}</p> : null}</article>)}</section> : null}
            <div className="route-row"><a className="route-button" href={mapsDirectionsUrl(details)} target="_blank" rel="noreferrer"><Navigation size={17} />Show route in Google Maps</a>{details.mapsUri ? <a className="listing-link" href={details.mapsUri} target="_blank" rel="noreferrer">Open Google listing <ArrowUpRight size={15} /></a> : null}</div>
          </> : null}
        </DialogContent>
      </Dialog>
    </main>
  );
}
