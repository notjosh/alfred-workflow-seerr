import type {
  SeerrSearchResponse,
  SeerrMovieDetails,
  SeerrTvDetails,
  SeerrServiceConfig,
  SeerrQualityProfile,
  SeerrServiceServer,
} from "./types.ts";

type FetchFn = typeof globalThis.fetch;

export interface SeerrClient {
  search(query: string): Promise<SeerrSearchResponse>;
  getMovie(tmdbId: number): Promise<SeerrMovieDetails>;
  getTv(tmdbId: number): Promise<SeerrTvDetails>;
  getRadarrServers(): Promise<SeerrServiceConfig[]>;
  getSonarrServers(): Promise<SeerrServiceConfig[]>;
  createRequest(body: Record<string, unknown>): Promise<unknown>;
  modifyRequest(
    requestId: number,
    body: Record<string, unknown>,
  ): Promise<unknown>;
}

export function createClient(
  serverUrl: string,
  apiKey: string,
  fetchFn: FetchFn = globalThis.fetch,
): SeerrClient {
  async function api<T>(path: string, options: RequestInit = {}): Promise<T> {
    const url = `${serverUrl}/api/v1${path}`;
    const response = await fetchFn(url, {
      ...options,
      headers: {
        "X-Api-Key": apiKey,
        "Content-Type": "application/json",
        ...options.headers,
      },
    });

    if (!response.ok) {
      throw new Error(
        `Seerr API error: ${response.status} ${response.statusText} (${path})`,
      );
    }

    return response.json() as Promise<T>;
  }

  return {
    search(query: string) {
      return api<SeerrSearchResponse>(
        `/search?query=${encodeURIComponent(query)}`,
      );
    },

    getMovie(tmdbId: number) {
      return api<SeerrMovieDetails>(`/movie/${tmdbId}`);
    },

    getTv(tmdbId: number) {
      return api<SeerrTvDetails>(`/tv/${tmdbId}`);
    },

    async getRadarrServers() {
      const servers = await api<SeerrServiceServer[]>("/settings/radarr");
      return Promise.all(
        servers.map(async (server) => {
          const profiles = await api<SeerrQualityProfile[]>(
            `/settings/radarr/${server.id}/profiles`,
          );
          return { server, profiles } satisfies SeerrServiceConfig;
        }),
      );
    },

    async getSonarrServers() {
      const servers = await api<SeerrServiceServer[]>("/settings/sonarr");
      return Promise.all(
        servers.map(async (server) => {
          let profiles: SeerrQualityProfile[];
          try {
            profiles = await api<SeerrQualityProfile[]>(
              `/settings/sonarr/${server.id}/profiles`,
            );
          } catch {
            profiles = [
              { id: server.activeProfileId, name: server.activeProfileName },
            ];
          }
          return { server, profiles } satisfies SeerrServiceConfig;
        }),
      );
    },

    createRequest(body: Record<string, unknown>) {
      return api("/request", {
        method: "POST",
        body: JSON.stringify(body),
      });
    },

    modifyRequest(requestId: number, body: Record<string, unknown>) {
      return api(`/request/${requestId}`, {
        method: "PUT",
        body: JSON.stringify(body),
      });
    },
  };
}
