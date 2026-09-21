import assert from "node:assert/strict";
import test from "node:test";

import {
  createHomeTile,
  defaultHomeTiles,
  readHomeTiles,
} from "../src/lib/homeTiles.ts";

test("provides four useful My Home starter tiles", () => {
  assert.deepEqual(
    defaultHomeTiles().map((tile) => tile.kind),
    ["costs", "devices", "energy", "monthly"],
  );
});

test("reads valid custom tiles and rejects broken storage", () => {
  const stored = JSON.stringify([
    { id: "insurance", kind: "costs", title: "Insurance" },
    { id: "broken", kind: "unknown", title: "Broken" },
  ]);

  assert.deepEqual(readHomeTiles(stored), [
    { id: "insurance", kind: "costs", title: "Insurance" },
  ]);
  assert.equal(readHomeTiles("not-json").length, 4);
  assert.deepEqual(readHomeTiles("[]"), []);
});

test("creates a named tile for a selected tool", () => {
  const tile = createHomeTile("monthly", "  Solar check  ");
  assert.equal(tile.kind, "monthly");
  assert.equal(tile.title, "Solar check");
  assert.ok(tile.id.length > 0);
});
