import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { getConfig } from "./config.ts";

describe("getConfig", () => {
  it("returns config from env vars", () => {
    const config = getConfig({
      seerr_url: "http://localhost:5055",
      seerr_api_key: "test-key-123",
    });
    assert.equal(config.serverUrl, "http://localhost:5055");
    assert.equal(config.apiKey, "test-key-123");
  });

  it("strips trailing slashes from serverUrl", () => {
    const config = getConfig({
      seerr_url: "http://localhost:5055///",
      seerr_api_key: "key",
    });
    assert.equal(config.serverUrl, "http://localhost:5055");
  });

  it("throws when seerr_url is missing", () => {
    assert.throws(() => getConfig({ seerr_api_key: "key" }), /seerr_url/);
  });

  it("throws when seerr_api_key is missing", () => {
    assert.throws(
      () => getConfig({ seerr_url: "http://localhost:5055" }),
      /seerr_api_key/,
    );
  });

  it("throws when both are missing", () => {
    assert.throws(() => getConfig({}), /seerr_url/);
  });
});
