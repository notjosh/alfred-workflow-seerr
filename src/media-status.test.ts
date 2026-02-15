import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { mediaStatusLabel, MediaStatus } from "./media-status.ts";

describe("mediaStatusLabel", () => {
  it("returns 'Unknown' for status 1", () => {
    assert.equal(mediaStatusLabel(MediaStatus.UNKNOWN), "Unknown");
  });

  it("returns 'Pending' for status 2", () => {
    assert.equal(mediaStatusLabel(MediaStatus.PENDING), "Pending");
  });

  it("returns 'Processing' for status 3", () => {
    assert.equal(mediaStatusLabel(MediaStatus.PROCESSING), "Processing");
  });

  it("returns 'Partially Available' for status 4", () => {
    assert.equal(
      mediaStatusLabel(MediaStatus.PARTIALLY_AVAILABLE),
      "Partially Available",
    );
  });

  it("returns 'Available' for status 5", () => {
    assert.equal(mediaStatusLabel(MediaStatus.AVAILABLE), "Available");
  });

  it("returns 'Unknown' for unexpected status codes", () => {
    assert.equal(mediaStatusLabel(99), "Unknown");
  });
});
