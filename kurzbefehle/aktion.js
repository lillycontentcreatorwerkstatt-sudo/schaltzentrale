// Schaltzentrale · Aktion
// Läuft im Kurzbefehl „Schaltzentrale Aktion“ (Aktion „JavaScript für Automation ausführen“).
// Die Schaltzentrale schickt eine Zeile: Art, Tab, Werte …
//   erledigt   <Titel>                 → Erinnerung abhaken
//   erinnerung <Titel> <Datum|leer>    → neue Erinnerung in der Standardliste
//   termin     <Titel> <Start> <Ende>  → neuer Termin (Start/Ende: "2026-11-26 10:00")
//   notiz      <ID> <Titel>            → Notiz in der Notizen-App öffnen
// Rückgabe „aktualisieren“ = danach Daten neu holen.

function run(input, parameters) {
  // ---- Einstellungen ----
  const KALENDER = "";   // leer = erster beschreibbarer Kalender, sonst z. B. "Privat"
  // -----------------------

  const text = (Array.isArray(input) ? input.map(String).join("\n") : String(input || "")).trim();
  const [art, a = "", b = "", c = ""] = text.split("\t");
  // Datum aus Zahlen bauen: Innerhalb von Kurzbefehle liest new Date("2026-11-27 09:00") keinen Text.
  const datum = (s) => {
    const m = String(s).match(/(\d{4})-(\d{2})-(\d{2})(?:[ T](\d{2}):(\d{2}))?/);
    return m ? new Date(+m[1], +m[2] - 1, +m[3], +(m[4] || 0), +(m[5] || 0)) : null;
  };

  if (art === "erledigt") {
    const Rem = Application("Reminders");
    const treffer = Rem.reminders.whose({ name: a, completed: false });
    if (treffer.length) treffer[0].completed = true;
    return "aktualisieren";
  }

  if (art === "erinnerung") {
    const Rem = Application("Reminders");
    const props = { name: a };
    const faellig = b ? datum(b + " 09:00") : null;
    if (faellig) props.dueDate = faellig;
    Rem.defaultList().reminders.push(Rem.Reminder(props));
    return "aktualisieren";
  }

  if (art === "termin") {
    const Cal = Application("Calendar");
    let ziel = null;
    if (KALENDER) ziel = Cal.calendars.byName(KALENDER);
    else {
      const schreibbar = Cal.calendars.whose({ writable: true });
      ziel = schreibbar.length ? schreibbar[0] : Cal.calendars[0];
    }
    ziel.events.push(Cal.Event({ summary: a, startDate: datum(b), endDate: datum(c) }));
    return "aktualisieren";
  }

  if (art === "notiz") {
    const Notes = Application("Notes");
    let notiz = null;
    try { notiz = Notes.notes.byId(a); notiz.name(); } catch (e) { notiz = null; }
    if (!notiz && b) {
      const t = Notes.notes.whose({ name: b });
      notiz = t.length ? t[0] : null;
    }
    if (notiz) { notiz.show(); Notes.activate(); }
    return "fertig";
  }

  return "fertig";
}
