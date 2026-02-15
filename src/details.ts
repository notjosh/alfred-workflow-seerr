import { getConfig } from "./config.ts";
import { createClient } from "./seerr-client.ts";
import { buildDetailsItems } from "./build-details-items.ts";
import type { AlfredOutput } from "./types.ts";

const input = process.env.mediaRef ?? process.argv[2] ?? "";

try {
  const [mediaType, tmdbIdStr] = input.split("/");
  const tmdbId = Number(tmdbIdStr);

  if (
    (mediaType !== "movie" && mediaType !== "tv") ||
    !Number.isFinite(tmdbId)
  ) {
    throw new Error(`Invalid selection: ${input}`);
  }

  const config = getConfig(process.env);
  const client = createClient(config.serverUrl, config.apiKey);

  if (mediaType === "movie") {
    const [details, services] = await Promise.all([
      client.getMovie(tmdbId),
      client.getRadarrServers(),
    ]);

    const items = buildDetailsItems({
      mediaType: "movie",
      details,
      services,
      serverUrl: config.serverUrl,
    });

    const output: AlfredOutput = { items };
    console.log(JSON.stringify(output));
  } else {
    const [details, services] = await Promise.all([
      client.getTv(tmdbId),
      client.getSonarrServers(),
    ]);

    const items = buildDetailsItems({
      mediaType: "tv",
      details,
      services,
      serverUrl: config.serverUrl,
    });

    const output: AlfredOutput = { items };
    console.log(JSON.stringify(output));
  }
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  const output: AlfredOutput = {
    items: [
      {
        title: "Error",
        subtitle: message,
        valid: false,
        icon: { path: "icons/error.png" },
      },
    ],
  };
  console.log(JSON.stringify(output));
}
