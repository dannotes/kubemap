import { create } from 'zustand';
import type { PersonCore, PersonDetail, KCDEvent, Stats, ViewMode, TierFilter, Theme } from '../lib/types';

interface AppState {
  // Data
  people: PersonCore[];
  details: Record<string, PersonDetail> | null;
  events: KCDEvent[];
  stats: Stats | null;
  loading: boolean;
  loadingMsg: string;

  // View
  view: ViewMode;
  theme: Theme;
  filter: TierFilter;
  showEvents: boolean;

  // Selections
  selectedCountry: string | null;
  selectedCompany: string | null;
  profileId: string | null;
  eventId: string | null;

  // Actions
  setPeople: (people: PersonCore[]) => void;
  setDetails: (details: Record<string, PersonDetail>) => void;
  setEvents: (events: KCDEvent[]) => void;
  setStats: (stats: Stats) => void;
  setLoading: (loading: boolean, msg?: string) => void;
  setView: (view: ViewMode) => void;
  setTheme: (theme: Theme) => void;
  setFilter: (filter: TierFilter) => void;
  setShowEvents: (show: boolean) => void;
  setSelectedCountry: (country: string | null) => void;
  setSelectedCompany: (company: string | null) => void;
  openProfile: (id: string | null) => void;
  openEvent: (id: string | null) => void;

  // Derived
  filteredPeople: () => PersonCore[];
}

export const useStore = create<AppState>((set, get) => ({
  people: [],
  details: null,
  events: [],
  stats: null,
  loading: true,
  loadingMsg: 'starting up',

  view: 'map',
  theme: (['dark', 'light'].includes(localStorage.getItem('kubemap-theme') || '') ? localStorage.getItem('kubemap-theme') as Theme : 'dark'),
  filter: 'all',
  showEvents: true,

  selectedCountry: null,
  selectedCompany: null,
  profileId: null,
  eventId: null,

  setPeople: (people) => set({ people }),
  setDetails: (details) => set({ details }),
  setEvents: (events) => set({ events }),
  setStats: (stats) => set({ stats }),
  setLoading: (loading, msg) => set({ loading, loadingMsg: msg || '' }),
  setView: (view) => set({ view, profileId: null }),
  setTheme: (theme) => {
    document.body.setAttribute('data-theme', theme);
    localStorage.setItem('kubemap-theme', theme);
    set({ theme });
  },
  setFilter: (filter) => set({ filter }),
  setShowEvents: (show) => set({ showEvents: show }),
  setSelectedCountry: (country) => set({ selectedCountry: country }),
  setSelectedCompany: (company) => set({ selectedCompany: company }),
  openProfile: (id) => set({ profileId: id, eventId: null }),
  openEvent: (id) => set({ eventId: id, profileId: null }),

  // Map/Globe refs for flyTo from search/sidebar
  mapRef: null as L.Map | null,
  globeRef: null as any,
  setMapRef: (map: L.Map | null) => set({ mapRef: map } as any),
  setGlobeRef: (globe: any) => set({ globeRef: globe } as any),
  flyTo: (lat: number, lon: number, zoom = 5) => {
    const { view } = get() as any;
    const switchedView = view !== 'map' && view !== 'globe';
    // Only switch to map if on a non-spatial view (not globe)
    if (switchedView) set({ view: 'map' } as any);

    if (view === 'globe') {
      // Fly globe to the location
      const globe = (get() as any).globeRef;
      if (globe) {
        globe.pointOfView({ lat, lng: lon, altitude: 1.2 }, 800);
      }
    } else {
      // Fly map to the location
      requestAnimationFrame(() => {
        const m = (get() as any).mapRef;
        if (m) {
          // Only invalidateSize when switching views (container was hidden)
          if (switchedView) m.invalidateSize();
          m.setView([lat, lon], zoom, { animate: false });
        }
      });
    }
  },

  filteredPeople: () => {
    const { people, filter, selectedCountry, selectedCompany } = get();
    return people.filter(p => {
      if (selectedCountry && p.country !== selectedCountry) return false;
      if (selectedCompany && p.company !== selectedCompany) return false;
      if (filter === 'all') return true;
      if (filter === 'golden') return p.tier === 'golden';
      if (filter === 'regular') return p.tier === 'regular';
      if (filter === 'ambassador') return p.isAmbassador && p.tier !== 'golden';
      return true;
    });
  },
}));
