# Holz-Volumen Rechner (statische Website)

Diese kleine Website bildet die Excel-Logik aus deiner Datei nach:

- Radius (m) = Umfang(cm) / 100 / 2 / π
- Volumen (m³) = π × Radius² × Länge(cm)/100
- Summe = Summe aller Volumen

## Dateien
- index.html
- style.css
- app.js

## Hosting (Beispiel)
Lege die drei Dateien in ein Verzeichnis, das dein Webserver ausliefert, z.B.:

/var/www/holz-rechner/

Dann ist es direkt unter deiner URL erreichbar.

## Hinweis
Das ist ein reiner Frontend-Rechner (keine Datenbank). Wenn du Speichern/Export (CSV/PDF) willst, sag Bescheid.

## Persistenz
Die Eingaben werden automatisch im Browser gespeichert (localStorage). Über den Button **„Gespeicherte Werte löschen“** kannst du die gespeicherten Werte entfernen.
