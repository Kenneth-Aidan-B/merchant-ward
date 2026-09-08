export type Coordinates = {
  lat: number;
  lng: number;
};

export type PlacePhoto = {
  name: string;
  width: number;
  height: number;
  authorAttributions: string[];
};

export type LivePlace = {
  id: string;
  source: 'google' | 'openstreetmap';
  name: string;
  category: string;
  address: string;
  coordinates: Coordinates;
  rating?: number;
  userRatingCount?: number;
  openNow?: boolean;
  googleMapsUri?: string;
  photos: PlacePhoto[];
  phone?: string;
  websiteUri?: string;
  openingHours?: string[];
  description?: string;
};

export type PlaceReview = {
  text?: string;
  rating?: number;
  publishTime?: string;
  relativePublishTimeDescription?: string;
  authorName?: string;
  authorPhotoUri?: string;
};

export type PlaceDetails = LivePlace & {
  phone?: string;
  websiteUri?: string;
  mapsUri?: string;
  priceLevel?: string;
  priceRange?: string;
  openingHours: string[];
  editorialSummary?: string;
  types: string[];
  reviews: PlaceReview[];
  accessibility?: string[];
  amenities: string[];
};

export type PlacesApiError = {
  error: string;
  code?: string;
};
