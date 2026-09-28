import * as DocumentPicker from "expo-document-picker";
import { File, Paths } from "expo-file-system";
import * as Sharing from "expo-sharing";

import type { MobileBackup } from "./backup";

export async function shareBackup(backup: MobileBackup) {
  if (!(await Sharing.isAvailableAsync())) throw new Error("Sharing unavailable");
  const file = new File(Paths.cache, `eavesence-home-${backup.exportedAt.slice(0, 10)}.json`);
  file.create({ overwrite: true });
  file.write(JSON.stringify(backup, null, 2));
  await Sharing.shareAsync(file.uri, { mimeType: "application/json", dialogTitle: "EAVESENCE-Sicherung speichern" });
}

export async function pickBackup(): Promise<string | null> {
  const result = await DocumentPicker.getDocumentAsync({ type: "application/json", copyToCacheDirectory: true });
  if (result.canceled) return null;
  const asset = result.assets[0];
  if (!asset || (asset.size !== undefined && asset.size > 2_000_000)) throw new Error("File too large");
  return new File(asset.uri).text();
}
