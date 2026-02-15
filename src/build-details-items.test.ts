import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { buildDetailsItems, decodeArg } from "./build-details-items.ts";
import type {
  SeerrMovieDetails,
  SeerrTvDetails,
  SeerrServiceConfig,
} from "./types.ts";

const SERVER_URL = "http://localhost:5055";

const RADARR_SERVICE: SeerrServiceConfig = {
  server: {
    id: 1,
    name: "Radarr",
    is4k: false,
    isDefault: true,
    activeProfileId: 6,
    activeDirectory: "/movies",
    activeProfileName: "HD-1080p",
    externalUrl: "https://radarr.example.com",
  },
  profiles: [
    { id: 6, name: "HD-1080p" },
    { id: 7, name: "Ultra-HD" },
  ],
};

const SONARR_SERVICE: SeerrServiceConfig = {
  server: {
    id: 1,
    name: "Sonarr",
    is4k: false,
    isDefault: true,
    activeProfileId: 6,
    activeDirectory: "/tv",
    activeProfileName: "HD-1080p",
    externalUrl: "https://sonarr.example.com",
  },
  profiles: [
    { id: 6, name: "HD-1080p" },
    { id: 7, name: "Ultra-HD" },
  ],
};

describe("buildDetailsItems", () => {
  describe("new movie", () => {
    it("shows one request item per quality profile", () => {
      const movie: SeerrMovieDetails = {
        id: 550,
        title: "Fight Club",
        mediaInfo: null,
      };

      const items = buildDetailsItems({
        mediaType: "movie",
        details: movie,
        services: [RADARR_SERVICE],
        serverUrl: SERVER_URL,
      });

      // 2 request items + Open in Seerr
      assert.equal(items.length, 3);
      assert.equal(items[0].title, "Request Fight Club");
      assert.equal(items[0].subtitle, "HD-1080p (default)");
      assert.equal(items[1].subtitle, "Ultra-HD");

      const action = decodeArg(items[0].arg!);
      assert.equal(action.action, "request");
      assert.equal(action.mediaType, "movie");
      assert.equal(action.mediaId, 550);
      assert.equal(action.profileId, 6);

      // Open item at the end
      assert.equal(items[2].title, "Open in Seerr");
      const openAction = decodeArg(items[2].arg!);
      assert.equal(openAction.action, "open");
      if (openAction.action === "open") {
        assert.equal(openAction.url, "http://localhost:5055/movie/550");
      }
    });
  });

  describe("existing movie", () => {
    it("shows status info and quality change options", () => {
      const movie: SeerrMovieDetails = {
        id: 550,
        title: "Fight Club",
        mediaInfo: {
          id: 1,
          tmdbId: 550,
          status: 5,
          requests: [
            {
              id: 42,
              status: 2,
              media: { id: 1, tmdbId: 550, mediaType: "movie", status: 5 },
            },
          ],
        },
      };

      const items = buildDetailsItems({
        mediaType: "movie",
        details: movie,
        services: [RADARR_SERVICE],
        serverUrl: SERVER_URL,
      });

      // First item: status info (non-actionable)
      assert.equal(items[0].title, "Fight Club");
      assert.equal(items[0].valid, false);
      assert.match(items[0].subtitle!, /Available/);

      // Quality change items
      assert.equal(items[1].title, "Change quality to HD-1080p");
      assert.equal(items[2].title, "Change quality to Ultra-HD");

      const action = decodeArg(items[1].arg!);
      assert.equal(action.action, "modify");
      assert.equal(action.requestId, 42);
    });
  });

  describe("new TV show", () => {
    it("shows request all seasons and individual season options", () => {
      const tv: SeerrTvDetails = {
        id: 1396,
        name: "Breaking Bad",
        numberOfSeasons: 5,
        seasons: [
          { id: 0, seasonNumber: 0, name: "Specials", episodeCount: 10 },
          { id: 1, seasonNumber: 1, name: "Season 1", episodeCount: 7 },
          { id: 2, seasonNumber: 2, name: "Season 2", episodeCount: 13 },
          { id: 3, seasonNumber: 3, name: "Season 3", episodeCount: 13 },
        ],
        mediaInfo: null,
      };

      const items = buildDetailsItems({
        mediaType: "tv",
        details: tv,
        services: [SONARR_SERVICE],
        serverUrl: SERVER_URL,
      });

      // "Request all 3 unrequested seasons" + 3 individual + Open in Seerr
      assert.equal(items.length, 5);
      assert.match(items[0].title, /Request all 3 unrequested seasons/);
      assert.equal(items[1].title, "Request Season 1");
      assert.equal(items[2].title, "Request Season 2");
      assert.equal(items[3].title, "Request Season 3");
      assert.equal(items[4].title, "Open in Seerr");

      // Verify action payloads
      const allAction = decodeArg(items[0].arg!);
      assert.equal(allAction.action, "request");
      if (allAction.action === "request") {
        assert.deepEqual(allAction.seasons, [1, 2, 3]);
      }
    });
  });

  describe("partially requested TV show", () => {
    it("shows unrequested seasons and quality change for existing", () => {
      const tv: SeerrTvDetails = {
        id: 1396,
        name: "Breaking Bad",
        numberOfSeasons: 3,
        seasons: [
          { id: 1, seasonNumber: 1, name: "Season 1", episodeCount: 7 },
          { id: 2, seasonNumber: 2, name: "Season 2", episodeCount: 13 },
          { id: 3, seasonNumber: 3, name: "Season 3", episodeCount: 13 },
        ],
        mediaInfo: {
          id: 1,
          tmdbId: 1396,
          status: 4,
          requests: [
            {
              id: 10,
              status: 2,
              media: { id: 1, tmdbId: 1396, mediaType: "tv", status: 4 },
              seasons: [{ id: 1, seasonNumber: 1, status: 2 }],
            },
          ],
        },
      };

      const items = buildDetailsItems({
        mediaType: "tv",
        details: tv,
        services: [SONARR_SERVICE],
        serverUrl: SERVER_URL,
      });

      // "Request all 2 unrequested seasons" + 2 individual + status + 2 quality change
      assert.equal(items[0].title, "Request all 2 unrequested seasons");
      assert.equal(items[1].title, "Request Season 2");
      assert.equal(items[2].title, "Request Season 3");
      // Status divider
      assert.equal(items[3].valid, false);
      // Quality changes
      assert.equal(items[4].title, "Change quality to HD-1080p");
      assert.equal(items[5].title, "Change quality to Ultra-HD");
    });
  });

  describe("fully available TV show", () => {
    it("shows nothing to request message", () => {
      const tv: SeerrTvDetails = {
        id: 1396,
        name: "Breaking Bad",
        numberOfSeasons: 1,
        seasons: [
          { id: 1, seasonNumber: 1, name: "Season 1", episodeCount: 7 },
        ],
        mediaInfo: {
          id: 1,
          tmdbId: 1396,
          status: 5,
          requests: [
            {
              id: 10,
              status: 2,
              media: { id: 1, tmdbId: 1396, mediaType: "tv", status: 5 },
              seasons: [{ id: 1, seasonNumber: 1, status: 5 }],
            },
          ],
        },
      };

      const items = buildDetailsItems({
        mediaType: "tv",
        details: tv,
        services: [SONARR_SERVICE],
        serverUrl: SERVER_URL,
      });

      assert.equal(items.length, 2);
      assert.match(items[0].subtitle!, /nothing to request/);
      assert.equal(items[0].valid, false);
      assert.equal(items[1].title, "Open in Seerr");
    });
  });

  describe("no servers configured", () => {
    it("shows error for movie with no Radarr servers", () => {
      const items = buildDetailsItems({
        mediaType: "movie",
        details: { id: 1, title: "Test", mediaInfo: null },
        services: [],
        serverUrl: SERVER_URL,
      });

      assert.equal(items.length, 1);
      assert.equal(items[0].title, "Error");
      assert.match(items[0].subtitle!, /No Radarr/);
    });

    it("shows error for TV with no Sonarr servers", () => {
      const items = buildDetailsItems({
        mediaType: "tv",
        details: {
          id: 1,
          name: "Test",
          numberOfSeasons: 1,
          seasons: [],
          mediaInfo: null,
        },
        services: [],
        serverUrl: SERVER_URL,
      });

      assert.equal(items.length, 1);
      assert.match(items[0].subtitle!, /No Sonarr/);
    });
  });
});
