import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { createClient } from "./seerr-client.ts";

function mockFetch(status: number, body: unknown): typeof globalThis.fetch {
  return async (input: string | URL | Request, init?: RequestInit) => {
    const url = typeof input === "string" ? input : input.toString();
    return {
      ok: status >= 200 && status < 300,
      status,
      statusText: status === 200 ? "OK" : "Error",
      json: async () => body,
      url,
      _init: init,
    } as unknown as Response;
  };
}

function capturingFetch(
  status: number,
  body: unknown,
): {
  fetch: typeof globalThis.fetch;
  calls: Array<{ url: string; init?: RequestInit }>;
} {
  const calls: Array<{ url: string; init?: RequestInit }> = [];
  const fetch = async (input: string | URL | Request, init?: RequestInit) => {
    const url = typeof input === "string" ? input : input.toString();
    calls.push({ url, init });
    return {
      ok: status >= 200 && status < 300,
      status,
      statusText: "OK",
      json: async () => body,
    } as unknown as Response;
  };
  return { fetch, calls };
}

describe("createClient", () => {
  const SERVER = "http://localhost:5055";
  const KEY = "test-api-key";

  describe("search", () => {
    it("calls the search endpoint with encoded query", async () => {
      const result = { page: 1, totalPages: 1, totalResults: 1, results: [] };
      const { fetch, calls } = capturingFetch(200, result);
      const client = createClient(SERVER, KEY, fetch);

      const data = await client.search("breaking bad");

      assert.equal(calls.length, 1);
      assert.equal(
        calls[0].url,
        "http://localhost:5055/api/v1/search?query=breaking%20bad",
      );
      assert.deepEqual(data, result);
    });

    it("sends X-Api-Key header", async () => {
      const { fetch, calls } = capturingFetch(200, { results: [] });
      const client = createClient(SERVER, KEY, fetch);

      await client.search("test");

      const headers = calls[0].init?.headers as Record<string, string>;
      assert.equal(headers["X-Api-Key"], KEY);
    });
  });

  describe("getMovie", () => {
    it("calls the movie endpoint", async () => {
      const movie = { id: 123, title: "Test Movie" };
      const { fetch, calls } = capturingFetch(200, movie);
      const client = createClient(SERVER, KEY, fetch);

      const data = await client.getMovie(123);

      assert.equal(calls[0].url, "http://localhost:5055/api/v1/movie/123");
      assert.deepEqual(data, movie);
    });
  });

  describe("getTv", () => {
    it("calls the tv endpoint", async () => {
      const tv = { id: 456, name: "Test Show" };
      const { fetch, calls } = capturingFetch(200, tv);
      const client = createClient(SERVER, KEY, fetch);

      const data = await client.getTv(456);

      assert.equal(calls[0].url, "http://localhost:5055/api/v1/tv/456");
      assert.deepEqual(data, tv);
    });
  });

  describe("createRequest", () => {
    it("sends POST with JSON body", async () => {
      const { fetch, calls } = capturingFetch(200, { id: 1 });
      const client = createClient(SERVER, KEY, fetch);

      await client.createRequest({ mediaType: "movie", mediaId: 123 });

      assert.equal(calls[0].init?.method, "POST");
      assert.equal(
        calls[0].init?.body,
        JSON.stringify({ mediaType: "movie", mediaId: 123 }),
      );
    });
  });

  describe("modifyRequest", () => {
    it("sends PUT with JSON body", async () => {
      const { fetch, calls } = capturingFetch(200, { id: 42 });
      const client = createClient(SERVER, KEY, fetch);

      await client.modifyRequest(42, { profileId: 7 });

      assert.equal(calls[0].url, "http://localhost:5055/api/v1/request/42");
      assert.equal(calls[0].init?.method, "PUT");
    });
  });

  describe("error handling", () => {
    it("throws on non-OK response", async () => {
      const client = createClient(SERVER, KEY, mockFetch(404, {}));

      await assert.rejects(() => client.search("test"), /404/);
    });
  });
});
