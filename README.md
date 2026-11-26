# Schaltzentrale

Ein Dashboard für den Mac: heutige und kommende Termine, offene Erinnerungen, zuletzt bearbeitete Notizen und ungelesene oder markierte Mails auf einen Blick. Erinnerungen abhaken, neue Erinnerungen und Termine anlegen, Notizen und Mails mit einem Klick öffnen.

**Deine Daten bleiben auf deinem Mac.** Die Seite liest nichts selbst. Zwei Kurzbefehle holen die Daten und geben sie hinter dem `#` in der Adresse an die Seite weiter. Dieser Teil wird nie an einen Server geschickt, gespeichert wird nur lokal im Browser.

## Einrichten

1. Beide Kurzbefehle laden und in der Kurzbefehle-App hinzufügen:
   - `kurzbefehle/Schaltzentrale aktualisieren.shortcut`
   - `kurzbefehle/Schaltzentrale Aktion.shortcut`
2. Kurzbefehle-App → Einstellungen → Erweitert → **Skripte ausführen erlauben** einschalten.
3. Die Schaltzentrale in Safari öffnen und auf **Aktualisieren** klicken. Beim ersten Mal fragt der Mac nach Zugriff auf Kalender, Erinnerungen, Notizen und Mail.
4. In Safari **Ablage → Zum Dock hinzufügen**. Ab dann ist es eine eigene App.
5. Optional: In der Kurzbefehle-App eine Automation anlegen, die „Schaltzentrale aktualisieren“ zu festen Zeiten startet.

## Anpassen

Oben im Skript des Kurzbefehls „Schaltzentrale aktualisieren“:

- `NOTIZ_ORDNER`: nur einen bestimmten Notizen-Ordner zeigen
- `ANZAHL_NOTIZEN`, `ANZAHL_MAILS`: wie viele angezeigt werden
- `MAIL_LESEN = false`: Mail auslassen

Im Kurzbefehl „Schaltzentrale Aktion“: `KALENDER` legt fest, in welchem Kalender neue Termine landen.

## Gut zu wissen

- Die Anzeige ist so aktuell wie der letzte Lauf von „Schaltzentrale aktualisieren“.
- Abhaken findet die Erinnerung über ihren Titel. Bei zwei offenen Erinnerungen mit gleichem Titel wird die erste abgehakt.
- Nur für den Mac gedacht (Notizen und Mail werden per Skript gelesen).
