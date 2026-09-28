import assert from "node:assert/strict";
import test from "node:test";

import { createHouseholdCost } from "../packages/core/src/householdCosts.ts";
import { costsForTile, destinationTileId } from "../apps/mobile/src/costTiles.ts";

test("the Costs tab finds entries from custom tiles without moving them on edit", () => {
  const rent = createHouseholdCost({ name: "Miete", amount: 800, category: "housing", frequency: "monthly" });
  const insurance = createHouseholdCost({ name: "Versicherung", amount: 120, category: "insurance", frequency: "yearly", tileId: "insurance-tile" });
  assert.ok(rent && insurance);
  const costs = [rent, insurance];

  assert.deepEqual(costsForTile(costs, "default-costs"), costs);
  assert.deepEqual(costsForTile(costs, "insurance-tile"), [insurance]);
  assert.equal(destinationTileId(costs, insurance.id, "default-costs"), "insurance-tile");
  assert.equal(destinationTileId(costs, rent.id, "default-costs"), "default-costs");
  assert.equal(destinationTileId(costs, null, "insurance-tile"), "insurance-tile");
});
