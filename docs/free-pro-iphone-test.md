# Gratisversion und Pro: Abnahme am iPhone

## Was zusammenpasst

Website und App verwenden dieselben Berechnungen für Einkommen, Sonderzahlungen, wiederkehrende Kosten, Monatscheckliste und Pro. Sonderzahlungen erhöhen die Jahresübersicht, nicht automatisch den heute verfügbaren Kontostand. Die App führt neue Nutzer einzeln durch Zuhause, Einkommen und erste Kosten. Beim späteren Bearbeiten bleibt der Import außerhalb des geöffneten Formulars. Nach dem Speichern einer Ausgabe führt ein eigener Button zurück zur Monatsübersicht.

Sicherungen erhalten Kosten, Bereiche, Monatsmarkierungen, Memos und Planung. Beim Import einer Website-Sicherung behält die App ihre gewählte Sprache. Ein dezenter Hinweis empfiehlt eine Sicherung in Dateien; das Öffnen des Teilen-Dialogs gilt nicht automatisch als erfolgreiche Sicherung. Erinnerungen benötigen am iPhone eine Berechtigung. Die Website bietet Kalenderdateien; sie hat keine identischen nativen Benachrichtigungen.

## Drei Pro-Antworten

1. **Bis zum Gehalt:** aktueller Kontostand minus offene Zahlungen, verbleibende Alltagsausgaben und geschützter Betrag. Frühere, noch nicht abgehakte Rechnungen des aktuellen Monats zählen ebenfalls. Zahlungen am nächsten Gehaltstag bleiben außerhalb des Zeitraums. Vorherige Monate werden nicht als Schulden rekonstruiert. Der Betrag pro Tag ist zusätzlicher Spielraum nach den eingetragenen Alltagsausgaben. Ein Minus wird als Fehlbetrag gezeigt. Veraltete Kontostände müssen erneut bestätigt werden.
2. **Realistisch sparen:** eine konkrete Änderung vormerken; dadurch werden gespeicherte Kosten noch nicht geändert. Vorgemerktes monatliches Potenzial ist keine erreichte Ersparnis. Erst nach tatsächlicher Umsetzung bestätigen; dann werden die Kosten aktualisiert.
3. **Tatsächlich eingespart:** bestätigte Änderungen mit bis heute eingetretenen Zahlungsterminen. Das ist eine Berechnung aus Nutzereingaben, kein Banknachweis. Änderungen ohne Termin erscheinen separat als Schätzung. Eine monatliche Entlastung wird getrennt von der bisher erreichten Summe angezeigt.

## Physischer iPhone-Test

Mit einer Sicherung der bestehenden Daten beginnen. Das Zurücksetzen löscht lokale Daten.

- In Deutsch und Englisch neu starten. Nur Zuhause einrichten, Einkommen speichern, erste Kosten speichern. Jeweils darf kein anderes Formular den Schritt überlagern.
- Einkommen 2.400 und Kosten 900 eingeben. Dezimal- und Tausendertrennzeichen in der gewählten Sprache ausprobieren. Datum über die angebotene Datumseingabe wählen.
- Untere Felder mit geöffneter Tastatur bearbeiten. Speichern muss erreichbar bleiben; eine erfolgreiche Speicherung schließt die Tastatur. Ungültige Eingaben müssen bearbeitbar bleiben. Mehrfaches Tippen darf nicht doppelt speichern.
- App vollständig schließen und neu starten: Einkommen, Kosten, Bereiche, Symbole und Sprache bleiben erhalten.
- Eine Zahlung in der Monatscheckliste abhaken. Sie bleibt nach Neustart bezahlt; im nächsten Monat entsteht eine neue offene Zahlung.
- Sicherung in Dateien speichern, anschließend wieder importieren. Kosten, Checkliste, Memos und Planung prüfen. Eine Website-Sicherung bei englischer App importieren: die App bleibt englisch.
- Memo mit Datum anlegen; Erinnerung erlauben bzw. ablehnen. Bearbeiten und Löschen prüfen. Die tatsächliche Zustellung separat am Gerät prüfen.
- Pro prüfen: am 4. Oktober Kontostand 1.400, Gehalt am 25. Oktober, geschützter Betrag 100, Alltagsausgaben bis dahin 200, offene Miete 900 vom 1. Oktober, Streaming 18 vom 4. Oktober. Ergebnis: 182. Miete abhaken und Kontostand erneut bestätigen: 1.082, sofern der eingegebene Kontostand unverändert ist. Eigene heutige Daten entsprechend übertragen.
- Streaming von 18 auf 0 vormerken: Kosten bleiben zunächst 18. Erst Umsetzung bestätigen: Kosten 0. Nach dem betreffenden Zahlungstermin erscheinen 18 erreichte Ersparnis. Eine Änderung ohne Zahlungstermin erscheint zusätzlich als Schätzung, nicht im Hauptbetrag.
- Jahreszahlung ändern: die erreichte Ersparnis steigt erst zum nächsten tatsächlichen Zahlungstermin, nicht sofort um den Jahresbetrag.

## Grenzen der automatisierten Prüfung

Unit-Tests prüfen gemeinsame Berechnungen, fehlerhafte Speicherung, doppelte Bestätigungen und Sicherungskonvertierung. Browser-Tests prüfen deutsche und englische Pro-Abläufe bei 390 und 1365 Pixeln sowie Speicherung über Reload. Der iOS-Export prüft die Bündelung. Tastatur, reale Geräteberechtigungen, Teilen nach Dateien und Benachrichtigungszustellung benötigen den obigen Test am echten iPhone. Diese Prüfung ersetzt noch keinen externen Beta-Test oder Store-Launch.
