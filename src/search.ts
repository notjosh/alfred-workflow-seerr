import { getConfig } from "./config.ts";
import { createClient } from "./seerr-client.ts";
import { buildSearchItems } from "./build-search-items.ts";
import { downloadPosters } from "./poster-cache.ts";
import type { AlfredOutput } from "./types.ts";

const query = process.argv[2] ?? "";

if (!query.trim()) {
  const output: AlfredOutput = {
    items: [
      {
        title: "Search Seerr…",
        subtitle: "Type a movie or TV show name",
        valid: false,
      },
    ],
  };
  console.log(JSON.stringify(output));
  process.exit(0);
}

try {
  const config = getConfig(process.env);
  const client = createClient(config.serverUrl, config.apiKey);
  const response = await client.search(query);

  const cacheDir = process.env.alfred_workflow_cache;
  let resolvePoster:
    | ((p: string | null | undefined) => string | undefined)
    | undefined;

  if (cacheDir) {
    const posterPaths = response.results.map((r) => r.posterPath);
    const cache = await downloadPosters(cacheDir, posterPaths);
    resolvePoster = (p) => cache.resolve(p);
  }

  const items = buildSearchItems(response.results, resolvePoster);

  const output: AlfredOutput = {
    items:
      items.length > 0
        ? items
        : [
            {
              title: "No results",
              subtitle: `No movies or TV shows found for "${query}"`,
              valid: false,
            },
          ],
  };

  console.log(JSON.stringify(output));
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
