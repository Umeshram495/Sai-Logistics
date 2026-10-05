// Database layer: SQLite file (data/sai.db). Koi extra package jaruri nathi.
const { DatabaseSync } = require('node:sqlite');
const path = require('path');
const fs = require('fs');

const dataDir = path.join(__dirname, 'data');
fs.mkdirSync(dataDir, { recursive: true });
const db = new DatabaseSync(path.join(dataDir, 'sai.db'));

db.exec(`
  PRAGMA journal_mode = WAL;

  CREATE TABLE IF NOT EXISTS services (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    slug        TEXT UNIQUE NOT NULL,
    title       TEXT NOT NULL,
    description TEXT NOT NULL,
    icon        TEXT NOT NULL DEFAULT 'fa-truck',
    sort_order  INTEGER NOT NULL DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS inquiries (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    name       TEXT NOT NULL,
    email      TEXT NOT NULL,
    phone      TEXT NOT NULL,
    company    TEXT,
    service    TEXT,
    message    TEXT NOT NULL,
    status     TEXT NOT NULL DEFAULT 'new',   -- new | contacted | closed
    ip         TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
`);

// Pehli var j services nakhvi (website na homepage vala j 9 services)
const count = db.prepare('SELECT COUNT(*) AS c FROM services').get().c;
if (count === 0) {
  const seed = [
    ['container-transportation', 'Container Transportation', 'Efficient container movement between ports, factories, warehouses and destinations.', 'fa-truck'],
    ['import-export-movement', 'Import & Export Movement', 'Transportation support for import and export container movement and cargo requirements.', 'fa-ship'],
    ['port-to-door-transportation', 'Port-to-Door Transportation', 'Smooth cargo movement from port pickup to the required delivery destination.', 'fa-location-dot'],
    ['door-to-door-delivery', 'Door-to-Door Delivery', 'Complete transportation solutions from origin to the final delivery point.', 'fa-box-open'],
    ['factory-to-port-transportation', 'Factory-to-Port Transportation', 'Planned cargo movement from factories to port terminals with smooth coordination.', 'fa-industry'],
    ['port-to-warehouse', 'Port-to-Warehouse Transportation', 'Convenient transportation from port facilities to warehouses and storage locations.', 'fa-warehouse'],
    ['ftl-ptl-transportation', 'FTL & PTL Transportation', 'Flexible full truck load and part truck load transportation solutions for businesses.', 'fa-truck-ramp-box'],
    ['warehousing-distribution', 'Warehousing & Distribution', 'Supporting your cargo with practical warehousing and distribution solutions.', 'fa-boxes-stacked'],
    ['container-haulage', 'Container Haulage', 'Professional haulage support for efficient container movement, with coordinated handling and timely transportation solutions.', 'fa-boxes-stacked'],
  ];
  const ins = db.prepare('INSERT INTO services (slug, title, description, icon, sort_order) VALUES (?, ?, ?, ?, ?)');
  seed.forEach((r, i) => ins.run(r[0], r[1], r[2], r[3], i + 1));
}

module.exports = db;
