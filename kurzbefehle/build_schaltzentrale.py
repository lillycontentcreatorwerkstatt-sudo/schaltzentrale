#!/usr/bin/env python3
# Baut die zwei Kurzbefehle der Schaltzentrale (Neubau):
#
#   "Schaltzentrale aktualisieren" – holt Termine (heute + 7 Tage) und offene Erinnerungen,
#                                    gibt sie als Textzeilen an sammeln.js; das Skript holt
#                                    Notizen + Mail dazu und öffnet die Schaltzentrale.
#   "Schaltzentrale Aktion"        – bekommt von der Schaltzentrale eine Zeile (Art, Tab, Werte)
#                                    und führt sie per aktion.js aus; danach neu aktualisieren.
#
# Nutzung: python3 build_schaltzentrale.py
#   danach signieren: bauen.sh "<Ordner>" anyone "<Name>"

import os, sys

HIER = os.path.dirname(os.path.abspath(__file__))
WERKSTATT = os.path.expanduser("~/Library/Mobile Documents/iCloud~md~obsidian/Documents/"
                               "Lillys-KIPPL-System/Werkstatt/kurzbefehle")
sys.path.insert(0, WERKSTATT)
from lilly_lib import Builder, FFFC, NOW, REPEAT, SHORTCUT_INPUT, as_text, attach, out, tts, var  # noqa: E402

APP = os.environ.get("APP_URL", "https://lillycontentcreatorwerkstatt-sudo.github.io/schaltzentrale/")
ISO = "yyyy-MM-dd'T'HH:mm:ss"
ZIEL = os.path.join(HIER, os.environ.get("BAU_ORDNER", "bau"))


def skript(name):
    with open(os.path.join(HIER, name), encoding="utf-8") as f:
        return f.read().replace("__APP_URL__", APP)


def javascript(b, quelltext, eingabe):
    u = b.uid()
    b.add("is.workflow.actions.runjavascriptforautomation",
          {"UUID": u, "Script": tts(quelltext, []), "Input": attach(eingabe)})
    return out(u, "Ergebnis")


def eigenschaft(b, ident, tok, name, label):
    u = b.uid()
    b.add(ident, {"UUID": u, "WFInput": attach(tok), "WFContentItemPropertyName": name})
    return out(u, label)


# ---------- Schaltzentrale aktualisieren ----------
b = Builder("5C4A0001")
b.comment("Schaltzentrale: holt Termine und Erinnerungen, das Skript unten holt Notizen und Mail dazu "
          "und öffnet die Schaltzentrale. Einstellungen (Notiz-Ordner, Anzahl, Mail aus) stehen oben im Skript.")
b.setvar("Von", b.text(FFFC + " 00:00", [b.fmt_date(NOW, "yyyy-MM-dd")]))
b.setvar("Bis", b.adjust(var("Von"), 8, "days"))

t = b.uid()
b.add("is.workflow.actions.filter.calendarevents", {
    "UUID": t, "WFContentItemInputParameter": "Library",
    "WFContentItemSortProperty": "Start Date", "WFContentItemSortOrder": "Oldest First",
    "WFContentItemLimitEnabled": True, "WFContentItemLimitNumber": 80,
    "WFContentItemFilter": {"Value": {"WFActionParameterFilterPrefix": 1, "WFContentPredicateBoundedDate": False,
        "WFActionParameterFilterTemplates": [
            {"Property": "Start Date", "Operator": 1003, "Removable": False, "Bounded": True,
             "Values": {"Date": attach(var("Von")), "AnotherDate": attach(var("Bis")),
                        "Unit": 16, "Number": "7"}}]},
        "WFSerializationType": "WFContentPredicateTableTemplate"}})
with b.Repeat(out(t, "Kalenderereignisse")):
    ev = "is.workflow.actions.properties.calendarevents"
    name = eigenschaft(b, ev, REPEAT, "Name", "Name")
    start = b.fmt_date(eigenschaft(b, ev, REPEAT, "Start Date", "Startdatum"), ISO)
    ende = b.fmt_date(eigenschaft(b, ev, REPEAT, "End Date", "Enddatum"), ISO)
    kal = as_text(eigenschaft(b, ev, REPEAT, "Calendar", "Kalender"))
    ort = eigenschaft(b, ev, REPEAT, "Location", "Ort")
    ganz = eigenschaft(b, ev, REPEAT, "Is All Day", "Ganztägig")
    b.appendvar("Zeilen", b.text("T\t" + "\t".join([FFFC] * 6), [name, start, ende, kal, ort, ganz]))

r = b.uid()
b.add("is.workflow.actions.filter.reminders", {
    "UUID": r, "WFContentItemInputParameter": "Library",
    "WFContentItemSortProperty": "Due Date", "WFContentItemSortOrder": "Oldest First",
    "WFContentItemLimitEnabled": True, "WFContentItemLimitNumber": 150,
    "WFContentItemFilter": {"Value": {"WFActionParameterFilterPrefix": 1, "WFContentPredicateBoundedDate": False,
        "WFActionParameterFilterTemplates": [
            {"Operator": 4, "Property": "Is Completed", "Removable": True, "Values": {"Bool": False}}]},
        "WFSerializationType": "WFContentPredicateTableTemplate"}})
with b.Repeat(out(r, "Erinnerungen")):
    er = "is.workflow.actions.properties.reminders"
    name = eigenschaft(b, er, REPEAT, "Name", "Name")
    faellig = eigenschaft(b, er, REPEAT, "Due Date", "Fälligkeitsdatum")
    liste = as_text(eigenschaft(b, er, REPEAT, "List", "Liste"))
    with b.If(faellig, 100) as c:
        b.appendvar("Zeilen", b.text("E\t" + FFFC + "\t" + FFFC + "\t" + FFFC, [name, b.fmt_date(faellig, ISO), liste]))
        c.otherwise()
        b.appendvar("Zeilen", b.text("E\t" + FFFC + "\t\t" + FFFC, [name, liste]))

javascript(b, skript("sammeln.js"), b.combine(var("Zeilen")))
b.save(os.path.join(ZIEL, "Schaltzentrale aktualisieren"))

# ---------- Schaltzentrale Aktion ----------
b = Builder("5C4A0002")
b.comment("Schaltzentrale: führt aus, was du in der Schaltzentrale anklickst (abhaken, anlegen, Notiz öffnen). "
          "Wird von der Schaltzentrale gestartet, nicht direkt.")
ergebnis = javascript(b, skript("aktion.js"), SHORTCUT_INPUT)
ergebnis_text = b.text(FFFC, [ergebnis])
with b.If(ergebnis_text, 4, string="aktualisieren"):
    b.run_shortcut("Schaltzentrale aktualisieren")
b.save(os.path.join(ZIEL, "Schaltzentrale Aktion"))
