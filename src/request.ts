import { execSync } from "node:child_process";
import { getConfig } from "./config.ts";
import { createClient } from "./seerr-client.ts";
import { decodeArg } from "./build-details-items.ts";

const input = process.argv[2] ?? "";

try {
  const payload = decodeArg(input);

  if (payload.action === "open") {
    execSync(`open ${JSON.stringify(payload.url)}`);
    console.log("Opened in browser");
  } else {
    const config = getConfig(process.env);
    const client = createClient(config.serverUrl, config.apiKey);

    if (payload.action === "request") {
      const body: Record<string, unknown> = {
        mediaType: payload.mediaType,
        mediaId: payload.mediaId,
        serverId: payload.serverId,
        profileId: payload.profileId,
        rootFolder: payload.rootFolder,
      };

      if (payload.mediaType === "tv" && payload.seasons) {
        body.seasons = payload.seasons;
      }

      await client.createRequest(body);

      const seasonText =
        payload.mediaType === "tv" && payload.seasons
          ? ` (${payload.seasons.length === 1 ? `Season ${payload.seasons[0]}` : `${payload.seasons.length} seasons`})`
          : "";

      console.log(`Requested successfully${seasonText}`);
    } else if (payload.action === "modify") {
      await client.modifyRequest(payload.requestId, {
        profileId: payload.profileId,
      });

      console.log("Quality profile updated successfully");
    }
  }
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  console.log(`Error: ${message}`);
}
