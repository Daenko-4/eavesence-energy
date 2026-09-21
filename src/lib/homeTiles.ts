export const HOME_TILES_STORAGE_KEY = "eavesence-home-tiles-v1";

export type HomeTileKind = "costs" | "devices" | "energy" | "monthly";

export type HomeTile = {
  id: string;
  kind: HomeTileKind;
  title: string | null;
};

const tileKinds: HomeTileKind[] = ["costs", "devices", "energy", "monthly"];

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

    const tiles = candidate.filter((item): item is HomeTile => {
      if (!item || typeof item !== "object") return false;
      const tile = item as Partial<HomeTile>;
      return (
        typeof tile.id === "string" &&
        tile.id.length > 0 &&
        tileKinds.includes(tile.kind as HomeTileKind) &&
        (tile.title === null || typeof tile.title === "string")
      );
    });

    if (candidate.length === 0) return [];
    return tiles.length > 0 ? tiles : defaultHomeTiles();
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
