import type { HouseholdCost } from "@eavesence/core/householdCosts";

export function costsForTile(costs: HouseholdCost[], tileId: string): HouseholdCost[] {
  return tileId === "default-costs" ? costs : costs.filter((cost) => cost.tileId === tileId);
}

export function destinationTileId(costs: HouseholdCost[], editingId: string | null, selectedTileId: string): string {
  return editingId ? costs.find((cost) => cost.id === editingId)?.tileId ?? "default-costs" : selectedTileId;
}
