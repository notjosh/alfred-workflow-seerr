import type {
  SeerrMovieDetails,
  SeerrTvDetails,
  SeerrServiceConfig,
  AlfredItem,
  ActionPayload,
  RequestAction,
  ModifyAction,
  OpenAction,
} from "./types.ts";
import { MediaStatus, mediaStatusLabel } from "./media-status.ts";

interface MovieDetailsInput {
  mediaType: "movie";
  details: SeerrMovieDetails;
  services: SeerrServiceConfig[];
  serverUrl: string;
}

interface TvDetailsInput {
  mediaType: "tv";
  details: SeerrTvDetails;
  services: SeerrServiceConfig[];
  serverUrl: string;
}

export type DetailsInput = MovieDetailsInput | TvDetailsInput;

export function buildDetailsItems(input: DetailsInput): AlfredItem[] {
  if (input.mediaType === "movie") {
    return buildMovieItems(input.details, input.services, input.serverUrl);
  }
  return buildTvItems(input.details, input.services, input.serverUrl);
}

function buildMovieItems(
  movie: SeerrMovieDetails,
  services: SeerrServiceConfig[],
  serverUrl: string,
): AlfredItem[] {
  const status = movie.mediaInfo?.status;
  const requests = movie.mediaInfo?.requests ?? [];
  const seerrUrl = `${serverUrl}/movie/${movie.id}`;

  // Find the default server or first available
  const defaultService = findDefaultService(services);
  if (!defaultService) {
    return [errorItem("No Radarr servers configured")];
  }

  const items: AlfredItem[] = [];

  // New movie: no existing media info or unknown status
  if (!status || status === MediaStatus.UNKNOWN) {
    for (const profile of defaultService.profiles) {
      const action: RequestAction = {
        action: "request",
        mediaType: "movie",
        mediaId: movie.id,
        profileId: profile.id,
        rootFolder: defaultService.server.activeDirectory,
        serverId: defaultService.server.id,
      };

      const isDefault = profile.id === defaultService.server.activeProfileId;

      items.push({
        title: `Request ${movie.title}`,
        subtitle: `${profile.name}${isDefault ? " (default)" : ""}`,
        arg: encodeArg(action),
        icon: { path: "icons/request.png" },
        quicklookurl: seerrUrl,
      });
    }
  } else {
    // Existing movie with request(s)
    items.push({
      title: movie.title,
      subtitle: `Status: ${mediaStatusLabel(status)}`,
      valid: false,
      icon: { path: "icons/movie.png" },
      quicklookurl: seerrUrl,
    });

    // Offer quality change on existing requests
    if (requests.length > 0) {
      for (const profile of defaultService.profiles) {
        const action: ModifyAction = {
          action: "modify",
          requestId: requests[0].id,
          mediaType: "movie",
          profileId: profile.id,
        };

        items.push({
          title: `Change quality to ${profile.name}`,
          subtitle: `Request #${requests[0].id}`,
          arg: encodeArg(action),
          icon: { path: "icons/quality.png" },
          quicklookurl: seerrUrl,
        });
      }
    }
  }

  items.push(buildOpenItem(seerrUrl));

  return items;
}

function buildTvItems(
  tv: SeerrTvDetails,
  services: SeerrServiceConfig[],
  serverUrl: string,
): AlfredItem[] {
  const status = tv.mediaInfo?.status;
  const requests = tv.mediaInfo?.requests ?? [];
  const seerrUrl = `${serverUrl}/tv/${tv.id}`;

  const defaultService = findDefaultService(services);
  if (!defaultService) {
    return [errorItem("No Sonarr servers configured")];
  }

  // Determine which seasons are already requested
  const requestedSeasons = new Set<number>();
  for (const req of requests) {
    if (req.seasons) {
      for (const s of req.seasons) {
        requestedSeasons.add(s.seasonNumber);
      }
    }
  }

  // Filter to real seasons (seasonNumber > 0)
  const realSeasons = tv.seasons.filter((s) => s.seasonNumber > 0);
  const unrequestedSeasons = realSeasons.filter(
    (s) => !requestedSeasons.has(s.seasonNumber),
  );

  // Fully available: nothing to request
  if (status === MediaStatus.AVAILABLE && unrequestedSeasons.length === 0) {
    return [
      {
        title: tv.name,
        subtitle: "All seasons available — nothing to request",
        valid: false,
        icon: { path: "icons/tv.png" },
        quicklookurl: seerrUrl,
      },
      buildOpenItem(seerrUrl),
    ];
  }

  const items: AlfredItem[] = [];

  // New or partially requested: offer season requests
  if (unrequestedSeasons.length > 0) {
    // "Request all unrequested seasons" option
    if (unrequestedSeasons.length > 1) {
      const action: RequestAction = {
        action: "request",
        mediaType: "tv",
        mediaId: tv.id,
        seasons: unrequestedSeasons.map((s) => s.seasonNumber),
        profileId: defaultService.server.activeProfileId,
        rootFolder: defaultService.server.activeDirectory,
        serverId: defaultService.server.id,
      };

      items.push({
        title: `Request all ${unrequestedSeasons.length} unrequested seasons`,
        subtitle: `${tv.name} — ${defaultService.profiles.find((p) => p.id === defaultService.server.activeProfileId)?.name ?? "Default"}`,
        arg: encodeArg(action),
        icon: { path: "icons/request.png" },
        quicklookurl: seerrUrl,
      });
    }

    // Individual season items
    for (const season of unrequestedSeasons) {
      const action: RequestAction = {
        action: "request",
        mediaType: "tv",
        mediaId: tv.id,
        seasons: [season.seasonNumber],
        profileId: defaultService.server.activeProfileId,
        rootFolder: defaultService.server.activeDirectory,
        serverId: defaultService.server.id,
      };

      items.push({
        title: `Request Season ${season.seasonNumber}`,
        subtitle: `${tv.name} — ${season.episodeCount} episodes`,
        arg: encodeArg(action),
        icon: { path: "icons/request.png" },
        quicklookurl: seerrUrl,
      });
    }
  }

  // Existing requests: offer quality change
  if (requests.length > 0) {
    if (items.length > 0) {
      items.push({
        title: tv.name,
        subtitle: `Status: ${mediaStatusLabel(status ?? MediaStatus.UNKNOWN)}`,
        valid: false,
        icon: { path: "icons/tv.png" },
        quicklookurl: seerrUrl,
      });
    }

    for (const profile of defaultService.profiles) {
      const action: ModifyAction = {
        action: "modify",
        requestId: requests[0].id,
        mediaType: "tv",
        profileId: profile.id,
      };

      items.push({
        title: `Change quality to ${profile.name}`,
        subtitle: `Request #${requests[0].id}`,
        arg: encodeArg(action),
        icon: { path: "icons/quality.png" },
        quicklookurl: seerrUrl,
      });
    }
  }

  // If no items, show status info
  if (items.length === 0) {
    items.push({
      title: tv.name,
      subtitle: `Status: ${mediaStatusLabel(status ?? MediaStatus.UNKNOWN)}`,
      valid: false,
      icon: { path: "icons/tv.png" },
      quicklookurl: seerrUrl,
    });
  }

  items.push(buildOpenItem(seerrUrl));

  return items;
}

function findDefaultService(
  services: SeerrServiceConfig[],
): SeerrServiceConfig | undefined {
  return services.find((s) => s.server.isDefault) ?? services[0];
}

function buildOpenItem(seerrUrl: string): AlfredItem {
  const action: OpenAction = { action: "open", url: seerrUrl };
  return {
    title: "Open in Seerr",
    subtitle: seerrUrl,
    arg: encodeArg(action),
    icon: { path: "icons/open.png" },
    quicklookurl: seerrUrl,
  };
}

function encodeArg(action: RequestAction | ModifyAction | OpenAction): string {
  return Buffer.from(JSON.stringify(action)).toString("base64");
}

export function decodeArg(encoded: string): ActionPayload {
  return JSON.parse(Buffer.from(encoded, "base64").toString());
}

function errorItem(message: string): AlfredItem {
  return {
    title: "Error",
    subtitle: message,
    valid: false,
    icon: { path: "icons/error.png" },
  };
}
