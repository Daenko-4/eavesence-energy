import { useRef, useState } from "react";
import {
  Alert,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { WebView } from "react-native-webview";
import {
  readHouseholdCosts,
  type HouseholdCost,
} from "@eavesence/core/householdCosts";
export function CostImportScreen({
  costs,
  currency,
  locale,
  onSave,
}: {
  costs: HouseholdCost[];
  currency: string;
  locale: "de" | "en";
  onSave: (costs: HouseholdCost[]) => Promise<void>;
}) {
  const web = useRef<WebView>(null);
  const [open, setOpen] = useState(false),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  const de = locale === "de";
  const base = (
    process.env.EXPO_PUBLIC_WEB_URL ?? "https://eavesence.com"
  ).replace(/\/$/, "");
  const url = `${base}/import`;
  return (
    <View style={styles.card}>
      <Pressable
        accessibilityRole="button"
        disabled={Platform.OS === "web"}
        onPress={() => {
          setError("");
          setOpen(true);
        }}
        style={styles.button}
      >
        <Text style={styles.buttonText}>
          {de
            ? "Kosten aus Foto / Datei übernehmen"
            : "Import costs from photo / file"}
        </Text>
      </Pressable>
      <Text style={styles.note}>
        {de
          ? "Prüfe erkannte Angaben vor dem Speichern. Der Dokumentleser benötigt eine Internetverbindung; die Verarbeitung erfolgt auf dem Gerät."
          : "Review recognized entries before saving. The document reader needs an internet connection; processing happens on your device."}
      </Text>
      <Modal
        visible={open}
        animationType="slide"
        onRequestClose={() => setOpen(false)}
        presentationStyle="pageSheet"
      >
        <View style={styles.modal}>
          <View style={styles.header}>
            <Text style={styles.title}>
              {de ? "Kosten übernehmen" : "Import costs"}
            </Text>
            <Pressable
              accessibilityRole="button"
              disabled={busy}
              style={styles.button}
              onPress={() => setOpen(false)}
            >
              <Text style={styles.buttonText}>
                {de ? "Schließen" : "Close"}
              </Text>
            </Pressable>
          </View>
          {!!error && (
            <Text accessibilityRole="alert" style={styles.error}>
              {error}
            </Text>
          )}
          {open && (
            <WebView
              ref={web}
              source={{ uri: url }}
              style={{ flex: 1 }}
              originWhitelist={[base]}
              onShouldStartLoadWithRequest={(r) =>
                !r.isTopFrame || r.url === url || r.url === "about:blank"
              }
              onError={() =>
                setError(
                  de
                    ? "Dokumentleser nicht erreichbar. Bitte Verbindung prüfen oder Kosten manuell anlegen."
                    : "Document reader unavailable. Check your connection or add costs manually.",
                )
              }
              onHttpError={() =>
                setError(
                  de
                    ? "Dokumentleser ist noch nicht verfügbar. Bitte Website-Update abwarten."
                    : "Document reader is not available yet. Wait for the website update.",
                )
              }
              onMessage={async (e) => {
                if (e.nativeEvent.url.split("?")[0] !== url || busy) return;
                try {
                  const payload = JSON.parse(e.nativeEvent.data);
                  if (payload.type === "ready") {
                    web.current?.injectJavaScript(
                      `window.dispatchEvent(new CustomEvent('eavesence-import-context',{detail:${JSON.stringify({ costs, currency, locale })}}));true;`,
                    );
                    return;
                  }
                  if (
                    payload.type !== "costs" ||
                    !Array.isArray(payload.costs) ||
                    payload.costs.length > costs.length + 100
                  )
                    return;
                  const next = readHouseholdCosts(
                    JSON.stringify(payload.costs),
                  );
                  if (
                    next.length !== payload.costs.length ||
                    costs.some((c) => !next.some((n) => n.id === c.id))
                  )
                    throw new Error("INVALID_IMPORT");
                  const added = next.filter(
                    (c) => !costs.some((old) => old.id === c.id),
                  ).length;
                  const changed = next.filter((c) =>
                    costs.some(
                      (old) =>
                        old.id === c.id &&
                        JSON.stringify(old) !== JSON.stringify(c),
                    ),
                  ).length;
                  Alert.alert(
                    de
                      ? "Geprüfte Kosten übernehmen?"
                      : "Import reviewed costs?",
                    de
                      ? `${added} neue Kosten, ${changed} Aktualisierungen.`
                      : `${added} new costs, ${changed} updates.`,
                    [
                      { text: de ? "Abbrechen" : "Cancel", style: "cancel" },
                      {
                        text: de ? "Übernehmen" : "Import",
                        onPress: () => {
                          setBusy(true);
                          void onSave(next)
                            .then(() => setOpen(false))
                            .catch(() =>
                              setError(
                                de
                                  ? "Speichern fehlgeschlagen. Bitte erneut versuchen."
                                  : "Could not save. Please try again.",
                              ),
                            )
                            .finally(() => setBusy(false));
                        },
                      },
                    ],
                  );
                } catch {
                  setError(
                    de
                      ? "Importdaten ungültig. Bitte erneut öffnen."
                      : "Invalid import data. Reopen the importer.",
                  );
                }
              }}
            />
          )}
        </View>
      </Modal>
    </View>
  );
}
const styles = StyleSheet.create({
  card: {
    marginVertical: 10,
    gap: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: "#dfe5dd",
    borderRadius: 14,
    backgroundColor: "#fff",
  },
  button: {
    minHeight: 40,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 22,
    backgroundColor: "#24272c",
    alignSelf: "flex-start",
  },
  buttonText: { fontSize: 12, fontWeight: "800", color: "#fff" },
  note: { fontSize: 12, lineHeight: 18, color: "#52605b" },
  modal: { flex: 1, paddingTop: 18, backgroundColor: "#f4f6f2" },
  header: {
    padding: 14,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  title: { fontSize: 16, fontWeight: "800" },
  error: { fontSize: 13, lineHeight: 19, color: "#b91c1c", padding: 12 },
});
