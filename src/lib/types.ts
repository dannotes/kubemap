export interface Socials {
  github: string | null;
  linkedin: string | null;
  twitter: string | null;
  bluesky: string | null;
  website: string | null;
  youtube: string | null;
}

/** Core fields loaded immediately — used by map, wall, graph, leaderboard */
export interface PersonCore {
  id: string;
  name: string;
  company: string;
  location: string;
  country: string;
  flag: string;
  lat: number;
  lon: number;
  tier: 'golden' | 'regular' | 'ambassador';
  image: string | null;
  isAmbassador: boolean;
  projects: string[];
}

/** Detail fields loaded lazily — used by profile panel/page only */
export interface PersonDetail {
  bio: string;
  pronouns: string;
  socials: Socials;
  languages: string[];
}

/** Full person record (core + detail merged) */
export type Person = PersonCore & PersonDetail;

export interface CountryStat {
  name: string;
  count: number;
  golden: number;
  flag: string;
}

export interface CompanyStat {
  name: string;
  count: number;
  golden: number;
}

export interface CityStat {
  name: string;
  count: number;
  golden: number;
  country: string;
  flag: string;
}

export interface Stats {
  total: number;
  golden: number;
  regular: number;
  ambassadors: number;
  countryCount: number;
  topCountries: CountryStat[];
  topCompanies: CompanyStat[];
  topCities: CityStat[];
  generatedAt: string;
}

export interface KCDEvent {
  id: string;
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  city: string;
  country: string;
  flag: string;
  lat: number;
  lon: number;
  url: string;
  logo: string | null;
}

export type ViewMode = 'map' | 'globe' | 'wall' | 'graph' | 'leaderboard' | 'certs';
export type TierFilter = 'all' | 'golden' | 'regular' | 'ambassador';
export type Theme = 'dark' | 'light';
