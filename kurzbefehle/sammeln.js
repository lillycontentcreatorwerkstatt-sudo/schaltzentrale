// Schaltzentrale · Sammeln
// Läuft im Kurzbefehl „Schaltzentrale aktualisieren“ (Aktion „JavaScript für Automation ausführen“).
// Bekommt Termine und Erinnerungen als Textzeilen, holt Notizen und Mail dazu
// und öffnet die Schaltzentrale mit allen Daten. Nichts verlässt deinen Mac:
// Die Daten stehen hinter dem #, das schickt der Browser nicht an den Server.

function run(input, parameters) {
  // ---- Einstellungen ----
  const APP_URL = "__APP_URL__";
  const NOTIZ_ORDNER = "";      // leer = alle Ordner, sonst z. B. "Projekte"
  const ANZAHL_NOTIZEN = 12;
  const ANZAHL_MAILS = 25;
  const MAIL_LESEN = true;      // false = Mail auslassen
  // -----------------------

  const app = Application.currentApplication();
  app.includeStandardAdditions = true;

  const text = Array.isArray(input) ? input.map(String).join("\n") : String(input || "");
  const daten = { stand: new Date().toISOString(), termine: [], erinnerungen: [], notizen: [], mails: [], hinweise: [] };

  for (const zeile of text.split(/\r?\n/)) {
    const f = zeile.split("\t");
    if (f[0] === "T" && f[1] !== undefined) {
      daten.termine.push({ titel: f[1], start: f[2] || "", ende: f[3] || "", kalender: f[4] || "",
                           ort: f[5] || "", ganztag: /^(ja|yes|true|1)$/i.test((f[6] || "").trim()) });
    } else if (f[0] === "E" && f[1] !== undefined) {
      daten.erinnerungen.push({ titel: f[1], faellig: f[2] || null, liste: f[3] || "" });
    }
  }

  // ---- Notizen ----
  try {
    const Notes = Application("Notes");
    const quelle = NOTIZ_ORDNER ? Notes.folders.byName(NOTIZ_ORDNER).notes : Notes.notes;
    const ids = quelle.id(), namen = quelle.name(), geaendert = quelle.modificationDate();
    const liste = ids.map((id, i) => ({ id, titel: namen[i], geaendert: geaendert[i] }))
      .sort((a, b) => b.geaendert - a.geaendert);
    for (const n of liste) {
      if (daten.notizen.length >= ANZAHL_NOTIZEN) break;
      const notiz = Notes.notes.byId(n.id);
      let ordner = NOTIZ_ORDNER, auszug = "";
      try { ordner = ordner || notiz.container().name(); } catch (e) {}
      if (/^(Zuletzt gelöscht|Recently Deleted)$/i.test(ordner)) continue;
      try {
        auszug = notiz.plaintext().split(/\r?\n/).slice(1).join(" ").replace(/\s+/g, " ").trim().slice(0, 140);
      } catch (e) {}
      daten.notizen.push({ id: n.id, titel: n.titel, ordner, auszug, geaendert: n.geaendert.toISOString() });
    }
  } catch (e) {
    daten.hinweise.push("Notizen: " + e.message);
  }

  // ---- Mail ----
  if (MAIL_LESEN) {
    try {
      const Mail = Application("Mail");
      const gesehen = {};
      const holen = (sammlung, art) => {
        const betreff = sammlung.subject(), von = sammlung.sender(), datum = sammlung.dateReceived(), mid = sammlung.messageId();
        betreff.forEach((b, i) => {
          if (gesehen[mid[i]]) { gesehen[mid[i]][art] = true; return; }
          const m = { id: mid[i], betreff: b, von: String(von[i]).replace(/\s*<.*>$/, "").replace(/^"|"$/g, ""),
                      datum: datum[i].toISOString(), ungelesen: art === "ungelesen", markiert: art === "markiert" };
          gesehen[mid[i]] = m;
          daten.mails.push(m);
        });
      };
      holen(Mail.inbox.messages.whose({ readStatus: false }), "ungelesen");
      holen(Mail.inbox.messages.whose({ flaggedStatus: true }), "markiert");
      daten.mails.sort((a, b) => (b.datum > a.datum ? 1 : -1));
      daten.mails = daten.mails.slice(0, ANZAHL_MAILS);
    } catch (e) {
      daten.hinweise.push("Mail: " + e.message);
    }
  }

  app.openLocation(APP_URL + "#daten=" + encodeURIComponent(JSON.stringify(daten)));
  return "Termine: " + daten.termine.length + ", Erinnerungen: " + daten.erinnerungen.length +
         ", Notizen: " + daten.notizen.length + ", Mails: " + daten.mails.length;
}
