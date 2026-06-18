import { mkdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import Database from 'better-sqlite3';

import { seedDemoProperties } from './seed.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(__dirname, '..', '..');
const DEFAULT_DB_PATH = path.join(PROJECT_ROOT, 'data', 'dwello.sqlite');
const SCHEMA_PATH = path.join(__dirname, 'schema.sql');

let db;

export function getDatabase() {
  if (db) return db;

  const dbPath = process.env.DB_PATH || DEFAULT_DB_PATH;
  mkdirSync(path.dirname(dbPath), { recursive: true });

  db = new Database(dbPath);
  db.pragma('foreign_keys = ON');
  db.exec(readFileSync(SCHEMA_PATH, 'utf8'));
  seedDemoProperties(db);
  return db;
}

export function closeDatabase() {
  if (!db) return;
  db.close();
  db = undefined;
}
