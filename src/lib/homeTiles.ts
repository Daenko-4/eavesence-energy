export const HOME_TILES_STORAGE_KEY = "eavesence-home-tiles-v1";

export type HomeTileKind = "costs" | "energy";

export type HomeTile = {
  id: string;
  kind: HomeTileKind;
  title: string | null;
};

const tileKinds: HomeTileKind[] = ["energy", "costs"];

export function defaultHomeTiles(): HomeTile[] {
  return tileKinds.map((kind) => ({
    id: `default-${kind}`,
    kind,
    title: null,
  }));
}

export function readHomeTiles(value: string | null): HomeTile[] {
  if (!value) return defaultHomeTiles();

  try {
    const candidate = JSON.parse(value) as unknown;
    if (!Array.isArray(candidate)) return defaultHomeTiles();

    const tiles = candidate.flatMap((item): HomeTile[] => {
      if (!item || typeof item !== "object") return [];
      const tile = item as { id?: unknown; kind?: string; title?: unknown };
      const valid =
        typeof tile.id === "string" &&
        tile.id.length > 0 &&
        (tile.title === null || typeof tile.title === "string");
      if (!valid || tile.kind === "monthly") return [];
      if (tile.kind === "devices") {
        return [{ ...tile, kind: "energy" } as HomeTile];
      }
      return tileKinds.includes(tile.kind as HomeTileKind)
        ? [tile as HomeTile]
        : [];
    });

    if (candidate.length === 0) return defaultHomeTiles();
    if (tiles.length === 0) return defaultHomeTiles();

    const uniqueTiles = tiles.filter(
      (tile, index) =>
        tile.kind !== "energy" ||
        index === tiles.findIndex((item) => item.kind === "energy"),
    ).sort((a, b) => (a.kind === "energy" ? -1 : b.kind === "energy" ? 1 : 0));
    return uniqueTiles.some((tile) => tile.kind === "energy")
      ? uniqueTiles
      : [defaultHomeTiles()[0], ...uniqueTiles];
  } catch {
    return defaultHomeTiles();
  }
}

export function createHomeTile(kind: HomeTileKind, title: string): HomeTile {
  const id =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(16).slice(2)}`;

  return {
    id,
    kind,
    title: title.trim() || null,
  };
}
