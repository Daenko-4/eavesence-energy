export type MobileTile = { id: string; kind: "energy" | "costs"; title: string };

export function defaultTiles(): MobileTile[] {
  return [
    { id: "default-energy", kind: "energy", title: "Strom & Geräte" },
    { id: "default-costs", kind: "costs", title: "Haushaltskosten" },
  ];
}

export function parseTiles(value: unknown): MobileTile[] | null {
  if (!Array.isArray(value) || value.length < 2 || value.length > 30) return null;
  const tiles = value as MobileTile[];
  if (tiles.some((tile) => !tile || typeof tile !== "object" || typeof tile.id !== "string" || !tile.id ||
    (tile.kind !== "energy" && tile.kind !== "costs") || typeof tile.title !== "string" || !tile.title.trim())) return null;
  if (new Set(tiles.map((tile) => tile.id)).size !== tiles.length) return null;
  if (tiles.filter((tile) => tile.kind === "energy").length !== 1 ||
    !tiles.some((tile) => tile.id === "default-energy" && tile.kind === "energy") ||
    !tiles.some((tile) => tile.id === "default-costs" && tile.kind === "costs")) return null;
  return tiles;
}

export function readTiles(value: unknown): MobileTile[] {
  return parseTiles(value) ?? defaultTiles();
}

export function moveTile(tiles: MobileTile[], id: string, direction: -1 | 1): MobileTile[] {
  const index = tiles.findIndex((tile) => tile.id === id);
  const target = index + direction;
  if (index < 0 || target < 0 || target >= tiles.length) return tiles;
  const next = [...tiles];
  [next[index], next[target]] = [next[target], next[index]];
  return next;
}

export function createCostTile(title: string): MobileTile {
  return { id: `tile-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`, kind: "costs", title: title.trim() };
}
