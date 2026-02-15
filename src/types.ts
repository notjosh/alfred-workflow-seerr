// ── Seerr API response types ──

export interface SeerrSearchResponse {
  page: number;
  totalPages: number;
  totalResults: number;
  results: SeerrSearchResult[];
}

export interface SeerrSearchResult {
  id: number;
  mediaType: "movie" | "tv" | "person";
  title?: string; // movie
  name?: string; // tv
  originalTitle?: string;
  originalName?: string;
  overview?: string;
  posterPath?: string | null;
  releaseDate?: string; // movie
  firstAirDate?: string; // tv
  mediaInfo?: SeerrMediaInfo | null;
}

export interface SeerrMediaInfo {
  id: number;
  tmdbId: number;
  status: number;
  requests?: SeerrRequest[];
}

export interface SeerrRequest {
  id: number;
  status: number;
  media: {
    id: number;
    tmdbId: number;
    mediaType: "movie" | "tv";
    status: number;
  };
  seasons?: SeerrSeasonRequest[];
  profileId?: number;
  rootFolder?: string;
  serverId?: number;
}

export interface SeerrSeasonRequest {
  id: number;
  seasonNumber: number;
  status: number;
}

export interface SeerrMovieDetails {
  id: number;
  title: string;
  overview?: string;
  releaseDate?: string;
  posterPath?: string | null;
  mediaInfo?: SeerrMediaInfo | null;
}

export interface SeerrTvDetails {
  id: number;
  name: string;
  overview?: string;
  firstAirDate?: string;
  posterPath?: string | null;
  numberOfSeasons: number;
  seasons: SeerrSeason[];
  mediaInfo?: SeerrMediaInfo | null;
}

export interface SeerrSeason {
  id: number;
  seasonNumber: number;
  name: string;
  episodeCount: number;
}

export interface SeerrServiceServer {
  id: number;
  name: string;
  is4k: boolean;
  isDefault: boolean;
  activeProfileId: number;
  activeDirectory: string;
  activeProfileName: string;
  externalUrl?: string;
}

export interface SeerrQualityProfile {
  id: number;
  name: string;
}

export interface SeerrServiceConfig {
  server: SeerrServiceServer;
  profiles: SeerrQualityProfile[];
}

// ── Action payload types (passed between workflow stages) ──

export interface SearchSelection {
  tmdbId: number;
  mediaType: "movie" | "tv";
}

export interface RequestAction {
  action: "request";
  mediaType: "movie" | "tv";
  mediaId: number;
  seasons?: number[];
  profileId: number;
  rootFolder: string;
  serverId: number;
}

export interface ModifyAction {
  action: "modify";
  requestId: number;
  mediaType: "movie" | "tv";
  profileId: number;
}

export interface OpenAction {
  action: "open";
  url: string;
}

export type ActionPayload = RequestAction | ModifyAction | OpenAction;

// ── Alfred item types ──

export interface AlfredItem {
  title: string;
  subtitle?: string;
  arg?: string;
  valid?: boolean;
  icon?: { path: string };
  quicklookurl?: string;
  variables?: Record<string, string>;
}

export interface AlfredOutput {
  items: AlfredItem[];
}
