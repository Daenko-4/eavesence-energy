import assert from "node:assert/strict";
import test from "node:test";

import {
  createHomeTile,
  defaultHomeTiles,
  readHomeTiles,
} from "../src/lib/homeTiles.ts";

test("provides a simple electricity and household-cost structure", () => {
  assert.deepEqual(
    defaultHomeTiles().map((tile) => tile.kind),
    ["energy", "costs"],
  );
});

test("reads valid custom tiles and rejects broken storage", () => {
  const stored = JSON.stringify([
    { id: "insurance", kind: "costs", title: "Insurance" },
    { id: "broken", kind: "unknown", title: "Broken" },
  ]);

  assert.deepEqual(readHomeTiles(stored), [
    { id: "default-energy", kind: "energy", title: null },
    { id: "insurance", kind: "costs", title: "Insurance" },
  ]);
  assert.equal(readHomeTiles("not-json").length, 2);
  assert.deepEqual(readHomeTiles("[]"), defaultHomeTiles());
});

test("migrates device tiles into electricity and removes the old monthly tile", () => {
  assert.deepEqual(
    readHomeTiles(JSON.stringify([
      { id: "devices", kind: "devices", title: null },
      { id: "energy", kind: "energy", title: null },
      { id: "monthly", kind: "monthly", title: null },
    ])),
    [{ id: "devices", kind: "energy", title: null }],
  );
});

test("creates a named tile for a selected tool", () => {
  const tile = createHomeTile("energy", "  Solar check  ");
  assert.equal(tile.kind, "energy");
  assert.equal(tile.title, "Solar check");
  assert.ok(tile.id.length > 0);
});
