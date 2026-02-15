import type { SeerrSearchResult, AlfredItem } from "./types.ts";
import { mediaStatusLabel } from "./media-status.ts";

export type PosterResolver = (
  posterPath: string | null | undefined,
) => string | undefined;

export function buildSearchItems(
  results: SeerrSearchResult[],
  resolvePoster?: PosterResolver,
): AlfredItem[] {
  return results
    .filter(
      (r): r is SeerrSearchResult & { mediaType: "movie" | "tv" } =>
        r.mediaType === "movie" || r.mediaType === "tv",
    )
    .map((result) => {
      const title =
        result.mediaType === "movie"
          ? (result.title ?? result.originalTitle ?? "Unknown")
          : (result.name ?? result.originalName ?? "Unknown");

      const year = extractYear(
        result.mediaType === "movie" ? result.releaseDate : result.firstAirDate,
      );

      const status = result.mediaInfo?.status;
      const statusText = status ? ` — ${mediaStatusLabel(status)}` : "";
      const typeLabel = result.mediaType === "movie" ? "Movie" : "TV";
      const subtitle = `${typeLabel} · ${year || "Unknown year"}${statusText}`;

      const posterIcon = resolvePoster?.(result.posterPath);
      const fallbackIcon =
        result.mediaType === "movie" ? "icons/movie.png" : "icons/tv.png";
      const icon = { path: posterIcon ?? fallbackIcon };

      return {
        title,
        subtitle,
        arg: title,
        icon,
        variables: { mediaRef: `${result.mediaType}/${result.id}` },
      };
    });
}

function extractYear(dateStr: string | undefined): string | null {
  if (!dateStr) return null;
  const match = dateStr.match(/^(\d{4})/);
  return match ? match[1] : null;
}
