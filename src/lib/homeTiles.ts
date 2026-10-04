import { tileIconMetadata, type TileSymbol } from '@eavesence/core/tileSymbols';
export const HOME_TILES_STORAGE_KEY = "eavesence-home-tiles-v1";

export type HomeTileKind = "costs" | "energy";

export type HomeTile = {
  id: string;
  kind: HomeTileKind;
  title: string | null;
  icon?: TileSymbol | null;
};

const tileKinds: HomeTileKind[] = ["energy", "costs"];

export function defaultHomeTiles(): HomeTile[] {
  return (["costs"] as HomeTileKind[]).map((kind) => ({
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
      const tile = item as { id?: unknown; kind?: string; title?: unknown; icon?: unknown };
      const valid =
        typeof tile.id === "string" &&
        tile.id.length > 0 &&
        (tile.title === null || typeof tile.title === "string");
      if (!valid || tile.kind === "monthly") return [];
      const {icon,...rest}=tile;
      const clean={...rest,...tileIconMetadata(icon)};
      if (tile.kind === "devices") {
        return [{ ...clean, kind: "energy" } as HomeTile];
      }
      return tileKinds.includes(tile.kind as HomeTileKind)
        ? [clean as HomeTile]
        : [];
    });

    if (candidate.length === 0) return defaultHomeTiles();
    if (tiles.length === 0) return defaultHomeTiles();

    const uniqueTiles = tiles.filter(
      (tile, index) =>
        tile.kind !== "energy" ||
        index === tiles.findIndex((item) => item.kind === "energy"),
    );
    return uniqueTiles;
  } catch {
    return defaultHomeTiles();
  }
}

export function createHomeTile(kind: HomeTileKind, title: string, icon?: TileSymbol|null): HomeTile {
  const id =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(16).slice(2)}`;

  return {
    id,
    kind,
    title: title.trim() || null,
    ...tileIconMetadata(icon),
  };
}

export function reorderHomeTiles(
  tiles: HomeTile[],
  sourceId: string,
  targetId: string,
) {
  if (sourceId === targetId) return tiles;
  const sourceIndex = tiles.findIndex((tile) => tile.id === sourceId);
  const targetIndex = tiles.findIndex((tile) => tile.id === targetId);
  if (sourceIndex < 0 || targetIndex < 0) return tiles;
  const next = [...tiles];
  const [moved] = next.splice(sourceIndex, 1);
  next.splice(targetIndex, 0, moved);
  return next;
}
