'use client';

import {
  ArrowUpRight,
  Check,
  ChevronDown,
  Clock3,
  Compass,
  LocateFixed,
  MapPin,
  Menu,
  Navigation,
  Phone,
  Plus,
  Search,
  SlidersHorizontal,
  Sparkles,
  Star,
  Store,
  Tag,
  X,
} from 'lucide-react';
import { useEffect, useMemo, useState, type ChangeEvent, type FormEvent } from 'react';

type Category = 'All trades' | 'Food & drink' | 'Craft & goods' | 'Services';

type Shop = {
  id: number;
  name: string;
  category: Exclude<Category, 'All trades'>;
  description: string;
  neighborhood: string;
  address: string;
  phone: string;
  hours: string;
  status: 'Open now' | 'Closes soon' | 'Closed';
  distance: number;
  rating: number;
  reviews: number;
  accent: string;
  marker: { top: string; left: string };
  tags: string[];
};

type FormState = {
  name: string;
  category: Exclude<Category, 'All trades'>;
  description: string;
  neighborhood: string;
  address: string;
  phone: string;
  hours: string;
};

const initialShops: Shop[] = [
  {
    id: 1,
    name: 'Cedar & Coil',
    category: 'Craft & goods',
    description: 'Hand-turned kitchen tools and small-batch woodwork made in the North Quarter.',
    neighborhood: 'North Quarter',
    address: '14 Lantern Row',
    phone: '+91 98765 42108',
    hours: 'Today, 9:00 AM – 7:00 PM',
    status: 'Open now',
    distance: 0.4,
    rating: 4.9,
    reviews: 38,
    accent: 'amber',
    marker: { top: '28%', left: '62%' },
    tags: ['Woodwork', 'Kitchen', 'Gifts'],
  },
  {
    id: 2,
    name: 'Morrow Tea House',
    category: 'Food & drink',
    description: 'Loose-leaf blends, steeped to order, with a shaded courtyard behind the old gate.',
    neighborhood: 'Old Harbor',
    address: '7 Salt Market Lane',
    phone: '+91 98765 42162',
    hours: 'Today, 8:00 AM – 9:00 PM',
    status: 'Open now',
    distance: 0.8,
    rating: 4.8,
    reviews: 54,
    accent: 'teal',
    marker: { top: '58%', left: '37%' },
    tags: ['Tea', 'Breakfast', 'Courtyard'],
  },
  {
    id: 3,
    name: 'Marrow & Mint',
    category: 'Services',
    description: 'A quiet apothecary for herbal remedies, custom tinctures, and careful advice.',
    neighborhood: 'Canal Walk',
    address: '2 Juniper Steps',
    phone: '+91 98765 42944',
    hours: 'Today, 10:00 AM – 6:00 PM',
    status: 'Closes soon',
    distance: 1.2,
    rating: 4.7,
    reviews: 21,
    accent: 'plum',
    marker: { top: '38%', left: '22%' },
    tags: ['Herbal', 'Wellness', 'Custom'],
  },
  {
    id: 4,
    name: 'Nila Ceramics',
    category: 'Craft & goods',
    description: 'Everyday stoneware with a soft blue glaze, made one piece at a time.',
    neighborhood: 'Glassworks',
    address: '31 Foundry Street',
    phone: '+91 98765 42177',
    hours: 'Today, 11:00 AM – 8:00 PM',
    status: 'Open now',
    distance: 1.7,
    rating: 4.6,
    reviews: 17,
    accent: 'blue',
    marker: { top: '72%', left: '68%' },
    tags: ['Ceramics', 'Tableware', 'Studio'],
  },
  {
    id: 5,
    name: 'Rook Bicycle Repair',
    category: 'Services',
    description: 'Fast repairs, honest estimates, and a wall of refurbished city bikes.',
    neighborhood: 'South Gate',
    address: '48 Copper Road',
    phone: '+91 98765 42301',
    hours: 'Today, 9:30 AM – 5:30 PM',
    status: 'Closed',
    distance: 2.4,
    rating: 4.9,
    reviews: 42,
    accent: 'orange',
    marker: { top: '77%', left: '30%' },
    tags: ['Bikes', 'Repairs', 'Refurbished'],
  },
];

const categories: { label: Category; count?: number }[] = [
  { label: 'All trades', count: 24 },
  { label: 'Food & drink', count: 8 },
  { label: 'Craft & goods', count: 10 },
  { label: 'Services', count: 6 },
];

const emptyForm: FormState = {
  name: '',
  category: 'Craft & goods',
  description: '',
  neighborhood: '',
  address: '',
  phone: '',
  hours: 'Today, 9:00 AM – 6:00 PM',
};

function formatDistance(distance: number) {
  return distance < 1 ? `${Math.round(distance * 1000)} m` : `${distance.toFixed(1)} km`;
}

export default function Home() {
  const [shops, setShops] = useState<Shop[]>(initialShops);
  const [selectedId, setSelectedId] = useState(1);
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<Category>('All trades');
  const [radius, setRadius] = useState('4 km');
  const [openNow, setOpenNow] = useState(false);
  const [isRegisterOpen, setRegisterOpen] = useState(false);
  const [locationLabel, setLocationLabel] = useState('Old Harbor');
  const [form, setForm] = useState<FormState>(emptyForm);
  const [notice, setNotice] = useState('');

  const filteredShops = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    const maxDistance = Number(radius.replace(' km', ''));
    return shops
      .filter((shop) => category === 'All trades' || shop.category === category)
      .filter((shop) => !openNow || shop.status !== 'Closed')
      .filter((shop) => shop.distance <= maxDistance)
      .filter((shop) => {
        if (!normalizedQuery) return true;
        return [shop.name, shop.category, shop.neighborhood, ...shop.tags]
          .join(' ')
          .toLowerCase()
          .includes(normalizedQuery);
      })
      .sort((a, b) => a.distance - b.distance);
  }, [category, openNow, query, radius, shops]);

  const selectedShop = shops.find((shop) => shop.id === selectedId) ?? filteredShops[0] ?? shops[0];

  function publishShopListing(values: FormState) {
    const newShop: Shop = {
      id: Date.now(),
      name: values.name || 'New neighborhood shop',
      category: values.category,
      description: values.description || 'A new local business ready to be discovered nearby.',
      neighborhood: values.neighborhood || 'Old Harbor',
      address: values.address || 'Address to be confirmed',
      phone: values.phone || 'Contact to be confirmed',
      hours: values.hours,
      status: 'Open now',
      distance: 0.6,
      rating: 5,
      reviews: 0,
      accent: 'lime',
      marker: { top: '45%', left: '54%' },
      tags: ['New listing', values.category.split(' & ')[0]],
    };
    setShops((previous) => [newShop, ...previous]);
    setSelectedId(newShop.id);
    return newShop;
  }

  useEffect(() => {
    const context = (document as Document & {
      modelContext?: {
        registerTool: (tool: {
          name: string;
          title: string;
          description: string;
          inputSchema: Record<string, unknown>;
          annotations: { readOnlyHint: boolean; untrustedContentHint: boolean };
          execute: (input: unknown) => unknown;
        }, options?: { signal?: AbortSignal }) => void | Promise<void>;
      };
    }).modelContext;
    if (!context?.registerTool) return;
    const lifecycle = new AbortController();
    void Promise.resolve(context.registerTool({
      name: 'create_shop_listing',
      title: 'Create shop listing',
      description: 'Publish a nearby merchant listing with business details and a location-ready address.',
      inputSchema: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          category: { type: 'string', enum: ['Food & drink', 'Craft & goods', 'Services'] },
          description: { type: 'string' },
          neighborhood: { type: 'string' },
          address: { type: 'string' },
          phone: { type: 'string' },
          hours: { type: 'string' },
        },
        required: ['name', 'category', 'description', 'neighborhood', 'address', 'phone', 'hours'],
        additionalProperties: false,
      },
      annotations: { readOnlyHint: false, untrustedContentHint: false },
      execute(input) {
        if (!input || typeof input !== 'object') throw new Error('Listing details are required.');
        const candidate = input as Record<string, unknown>;
        const required = ['name', 'category', 'description', 'neighborhood', 'address', 'phone', 'hours'];
        if (required.some((field) => typeof candidate[field] !== 'string' || !candidate[field])) throw new Error('Complete all shop details before publishing.');
        const newShop = publishShopListing({
          name: candidate.name as string,
          category: candidate.category as FormState['category'],
          description: candidate.description as string,
          neighborhood: candidate.neighborhood as string,
          address: candidate.address as string,
          phone: candidate.phone as string,
          hours: candidate.hours as string,
        });
        setNotice('Your shop is now visible in the nearby registry.');
        return { id: newShop.id, status: 'published', name: newShop.name, distance: formatDistance(newShop.distance) };
      },
    }, { signal: lifecycle.signal })).catch(() => undefined);
    return () => lifecycle.abort();
  }, []);

  function handleFormChange(event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
    const field = event.currentTarget.name as keyof FormState;
    setForm((previous) => ({ ...previous, [field]: event.currentTarget.value }));
  }

  function handleRegister(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    publishShopListing(form);
    setRegisterOpen(false);
    setForm(emptyForm);
    setNotice('Your shop is now visible in the nearby registry.');
    window.setTimeout(() => setNotice(''), 3600);
  }

  function useMyLocation() {
    setLocationLabel('You are here');
    setNotice('Nearby results are centered on your current area.');
    window.setTimeout(() => setNotice(''), 3600);
  }

  return (
    <main className="min-h-screen bg-[#f4f1e9] text-[#1a2421]">
      <header className="sticky top-0 z-30 border-b border-[#d8d6cb] bg-[#f4f1e9]/95 backdrop-blur-xl">
        <div className="mx-auto flex max-w-[1500px] items-center justify-between gap-4 px-5 py-4 lg:px-8">
          <div className="flex items-center gap-3">
            <div className="brand-mark" aria-hidden="true"><span /><span /></div>
            <div>
              <div className="font-display text-lg font-semibold leading-none tracking-tight">Merchant Ward</div>
              <div className="mt-1 text-[10px] font-semibold uppercase tracking-[0.22em] text-[#718078]">Nearby trade registry</div>
            </div>
          </div>

          <div className="hidden items-center gap-3 md:flex">
            <button className="location-pill" onClick={useMyLocation} type="button">
              <MapPin size={15} /><span>{locationLabel}</span><ChevronDown size={14} className="text-[#84918a]" />
            </button>
            <button className="button button-dark" onClick={() => setRegisterOpen(true)} type="button"><Plus size={16} />List your shop</button>
          </div>
          <button className="icon-button md:hidden" type="button" aria-label="Open navigation"><Menu size={20} /></button>
        </div>
      </header>

      <div className="mx-auto grid max-w-[1500px] grid-cols-1 gap-5 px-5 py-5 lg:grid-cols-[350px_minmax(0,1fr)_340px] lg:px-8 lg:py-8">
        <section className="order-2 space-y-4 lg:order-1" aria-label="Nearby shops">
          <div className="flex items-end justify-between"><div><p className="eyebrow">Discovery board</p><h1 className="font-display mt-1 text-3xl font-semibold tracking-[-0.04em]">Trade nearby</h1></div><span className="count-label">{filteredShops.length} found</span></div>
          <div className="search-shell"><Search size={18} className="text-[#8b958f]" /><input aria-label="Search shops" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search shops, goods, or streets" /><button className="filter-button" type="button" aria-label="Open filters"><SlidersHorizontal size={16} /></button></div>
          <div className="chip-row" aria-label="Filter by category">
            {categories.map((item) => <button key={item.label} type="button" className={`chip ${category === item.label ? 'chip-active' : ''}`} onClick={() => setCategory(item.label)}>{item.label}{item.count ? <span className="chip-count">{item.count}</span> : null}</button>)}
          </div>
          <div className="filter-strip"><div className="flex items-center gap-2"><span className="filter-label">Within</span><select aria-label="Search radius" value={radius} onChange={(event) => setRadius(event.target.value)}><option>2 km</option><option>4 km</option><option>8 km</option><option>12 km</option></select></div><button className={`open-toggle ${openNow ? 'open-toggle-active' : ''}`} onClick={() => setOpenNow((value) => !value)} type="button"><span className="toggle-dot" />Open now</button></div>

          <div className="shop-list">
            {filteredShops.length ? filteredShops.map((shop) => <button key={shop.id} type="button" className={`shop-row ${selectedShop?.id === shop.id ? 'shop-row-selected' : ''}`} onClick={() => setSelectedId(shop.id)}>
              <span className={`shop-avatar avatar-${shop.accent}`}><Store size={18} /></span>
              <span className="min-w-0 flex-1 text-left"><span className="flex items-center justify-between gap-3"><span className="truncate font-display text-[15px] font-semibold">{shop.name}</span><span className="distance-label">{formatDistance(shop.distance)}</span></span><span className="mt-1 flex items-center gap-2 text-xs text-[#748179]"><span>{shop.category}</span><span className="h-1 w-1 rounded-full bg-[#b7beb8]" /><span className={shop.status === 'Closed' ? 'text-[#9a6a57]' : 'text-[#3c7e62]'}>{shop.status}</span></span><span className="mt-2 flex items-center gap-1 text-xs font-medium text-[#8b5d2a]"><Star size={12} fill="currentColor" />{shop.rating.toFixed(1)} <span className="font-normal text-[#9aa29d]">({shop.reviews})</span></span></span><ArrowUpRight size={16} className="row-arrow" />
            </button>) : <div className="empty-state"><Search size={20} /><p>No nearby shops match those filters.</p><button type="button" onClick={() => { setQuery(''); setCategory('All trades'); setOpenNow(false); }}>Clear filters</button></div>}
          </div>

          <button className="register-inline" onClick={() => setRegisterOpen(true)} type="button"><span className="register-icon"><Plus size={17} /></span><span><strong>Own a local shop?</strong><br /><small>Add it to the ward in two minutes.</small></span><ArrowUpRight size={17} className="ml-auto" /></button>
        </section>

        <section className="order-1 lg:order-2" aria-label="Map view">
          <div className="map-panel">
            <div className="map-topbar"><div><p className="eyebrow">Live area view</p><p className="mt-1 font-display text-lg font-semibold">Old Harbor ward</p></div><button type="button" className="map-control" onClick={useMyLocation}><LocateFixed size={16} />Recenter</button></div>
            <div className="map-canvas"><div className="map-wash map-wash-one" /><div className="map-wash map-wash-two" /><div className="road road-one" /><div className="road road-two" /><div className="road road-three" /><div className="road road-four" /><div className="water-line" /><div className="map-label label-one">Lantern Row</div><div className="map-label label-two">Salt Market</div><div className="map-label label-three">Canal Walk</div><div className="map-label label-four">South Gate</div>
              {shops.map((shop) => <button key={shop.id} type="button" aria-label={`Show ${shop.name}`} className={`map-marker marker-${shop.accent} ${selectedShop?.id === shop.id ? 'map-marker-selected' : ''}`} style={{ top: shop.marker.top, left: shop.marker.left }} onClick={() => setSelectedId(shop.id)}><MapPin size={18} fill="currentColor" />{selectedShop?.id === shop.id ? <span className="marker-caption">{shop.name}</span> : null}</button>)}
              <div className="you-are-here" aria-label="Your location"><span /><small>You are here</small></div><div className="map-legend"><span className="legend-dot" />Independent shops <span className="legend-you" />You</div>
            </div>
            <div className="map-footer"><div className="flex items-center gap-2 text-xs text-[#77837c]"><Compass size={15} />Sorted by walking distance from {locationLabel.toLowerCase()}.</div><button type="button" className="text-button" onClick={() => setNotice('Map view is ready for a Mapbox or Google Maps layer.')}>How it works<ArrowUpRight size={14} /></button></div>
          </div>
        </section>

        <aside className="order-3" aria-label="Selected shop details">
          <div className="detail-card"><div className={`detail-cover cover-${selectedShop.accent}`}><span className="cover-badge"><Sparkles size={13} />Ward pick</span><span className="cover-glyph"><Store size={42} strokeWidth={1.2} /></span><span className="cover-grid" /></div><div className="detail-body"><div className="flex items-start justify-between gap-4"><div><p className="eyebrow">{selectedShop.category}</p><h2 className="font-display mt-1 text-[27px] font-semibold leading-tight tracking-[-0.04em]">{selectedShop.name}</h2></div><span className="verified-mark" title="Verified listing"><Check size={15} /></span></div><div className="mt-3 flex items-center gap-2 text-sm"><Star size={14} fill="currentColor" className="text-[#b27837]" /><strong>{selectedShop.rating.toFixed(1)}</strong><span className="text-[#9ba39e]">from {selectedShop.reviews} locals</span></div><p className="mt-4 text-[15px] leading-6 text-[#637069]">{selectedShop.description}</p>
              <div className="detail-facts"><div><MapPin size={16} /><span>{selectedShop.address}<small>{selectedShop.neighborhood}</small></span></div><div><Clock3 size={16} /><span className={selectedShop.status === 'Closed' ? 'text-[#9a6a57]' : 'text-[#3c7e62]'}>{selectedShop.status}<small>{selectedShop.hours.replace('Today, ', '')}</small></span></div><div><Phone size={16} /><span>{selectedShop.phone}<small>Call the shop</small></span></div></div><div className="tag-row">{selectedShop.tags.map((tag) => <span key={tag} className="tag"><Tag size={12} />{tag}</span>)}</div><div className="detail-actions"><button type="button" className="button button-dark flex-1" onClick={() => setNotice(`Route to ${selectedShop.name} opened in your map app.`)}><Navigation size={16} />Route there</button><button type="button" className="button button-light px-4" onClick={() => setNotice(`${selectedShop.name} saved to your ward list.`)} aria-label="Save shop"><Star size={17} /></button></div><p className="detail-note"><span className="pulse-dot" />Listing checked by the Merchant Ward team</p>
            </div></div>
          <div className="ward-note"><span className="ward-note-icon"><Sparkles size={17} /></span><span><strong>Small shops shape the ward.</strong><br /><small>Every listing keeps trade close, visible, and human.</small></span></div>
        </aside>
      </div>

      <div className="mobile-register md:hidden"><button type="button" className="button button-dark w-full justify-center" onClick={() => setRegisterOpen(true)}><Plus size={16} />List your shop</button></div>
      {notice ? <div className="notice" role="status"><Check size={16} />{notice}</div> : null}

      {isRegisterOpen ? <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setRegisterOpen(false); }}><div className="register-modal" role="dialog" aria-modal="true" aria-labelledby="register-title"><div className="modal-head"><div><p className="eyebrow">Merchant registration</p><h2 id="register-title" className="font-display mt-1 text-2xl font-semibold tracking-[-0.04em]">Put your shop on the ward map</h2></div><button type="button" className="icon-button" onClick={() => setRegisterOpen(false)} aria-label="Close registration"><X size={18} /></button></div><p className="mt-3 max-w-[540px] text-sm leading-6 text-[#6d7a72]">Add the details a nearby traveler needs to choose you. You can update your listing any time.</p><form onSubmit={handleRegister} className="register-form"><label>Shop name<input name="name" value={form.name} onChange={handleFormChange} placeholder="e.g. Cedar & Coil" required /></label><label>Trade category<select name="category" value={form.category} onChange={handleFormChange}><option>Food & drink</option><option>Craft & goods</option><option>Services</option></select></label><label className="span-two">Short description<textarea name="description" value={form.description} onChange={handleFormChange} placeholder="What should a traveler know about your shop?" rows={3} required /></label><label>Neighborhood<input name="neighborhood" value={form.neighborhood} onChange={handleFormChange} placeholder="Old Harbor" required /></label><label>Street address<input name="address" value={form.address} onChange={handleFormChange} placeholder="14 Lantern Row" required /></label><label>Phone<input name="phone" value={form.phone} onChange={handleFormChange} placeholder="+91 98765 42108" required /></label><label>Hours<input name="hours" value={form.hours} onChange={handleFormChange} placeholder="Today, 9:00 AM – 6:00 PM" required /></label><div className="location-confirm span-two"><LocateFixed size={16} /><span><strong>Location pin ready</strong><small>We’ll place your listing near {locationLabel.toLowerCase()}.</small></span><button type="button" onClick={useMyLocation}>Use my location</button></div><button type="submit" className="button button-dark span-two justify-center"><Plus size={16} />Publish shop listing</button></form></div></div> : null}
    </main>
  );
}
