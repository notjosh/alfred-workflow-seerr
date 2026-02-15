import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { buildSearchItems } from "./build-search-items.ts";
import type { SeerrSearchResult } from "./types.ts";

describe("buildSearchItems", () => {
  it("builds items for movies", () => {
    const results: SeerrSearchResult[] = [
      {
        id: 550,
        mediaType: "movie",
        title: "Fight Club",
        releaseDate: "1999-10-15",
        mediaInfo: null,
      },
    ];

    const items = buildSearchItems(results);

    assert.equal(items.length, 1);
    assert.equal(items[0].title, "Fight Club");
    assert.equal(items[0].subtitle, "Movie · 1999");
    assert.equal(items[0].arg, "Fight Club");
    assert.deepEqual(items[0].variables, { mediaRef: "movie/550" });
    assert.deepEqual(items[0].icon, { path: "icons/movie.png" });
  });

  it("builds items for TV shows", () => {
    const results: SeerrSearchResult[] = [
      {
        id: 1396,
        mediaType: "tv",
        name: "Breaking Bad",
        firstAirDate: "2008-01-20",
        mediaInfo: null,
      },
    ];

    const items = buildSearchItems(results);

    assert.equal(items.length, 1);
    assert.equal(items[0].title, "Breaking Bad");
    assert.equal(items[0].subtitle, "TV · 2008");
    assert.equal(items[0].arg, "Breaking Bad");
    assert.deepEqual(items[0].variables, { mediaRef: "tv/1396" });
    assert.deepEqual(items[0].icon, { path: "icons/tv.png" });
  });

  it("includes media status when present", () => {
    const results: SeerrSearchResult[] = [
      {
        id: 550,
        mediaType: "movie",
        title: "Fight Club",
        releaseDate: "1999-10-15",
        mediaInfo: { id: 1, tmdbId: 550, status: 5 },
      },
    ];

    const items = buildSearchItems(results);

    assert.equal(items[0].subtitle, "Movie · 1999 — Available");
  });

  it("filters out person results", () => {
    const results: SeerrSearchResult[] = [
      {
        id: 17419,
        mediaType: "person",
        name: "Bryan Cranston",
      },
      {
        id: 1396,
        mediaType: "tv",
        name: "Breaking Bad",
        firstAirDate: "2008-01-20",
        mediaInfo: null,
      },
    ];

    const items = buildSearchItems(results);

    assert.equal(items.length, 1);
    assert.equal(items[0].title, "Breaking Bad");
  });

  it("handles missing dates", () => {
    const results: SeerrSearchResult[] = [
      {
        id: 999,
        mediaType: "movie",
        title: "Upcoming Movie",
        mediaInfo: null,
      },
    ];

    const items = buildSearchItems(results);

    assert.equal(items[0].subtitle, "Movie · Unknown year");
  });

  it("returns empty array for empty results", () => {
    const items = buildSearchItems([]);
    assert.equal(items.length, 0);
  });
});
