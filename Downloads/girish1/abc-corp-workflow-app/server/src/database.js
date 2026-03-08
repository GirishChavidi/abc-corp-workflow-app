import initSqlJs from 'sql.js';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_PATH = path.join(__dirname, '..', 'data', 'abc_corp.db');

// Ensure data directory exists
const dataDir = path.join(__dirname, '..', 'data');
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

// ─── Compatibility wrapper: makes sql.js feel like better-sqlite3 ───────────
class Statement {
  constructor(db, sql, saveFn) {
    this._db = db;
    this._sql = sql;
    this._save = saveFn;
  }

  run(...params) {
    this._db.run(this._sql, params);
    const lastId = this._db.exec('SELECT last_insert_rowid() as id')[0]?.values[0][0] ?? 0;
    const changes = this._db.getRowsModified();
    this._save();
    return { lastInsertRowid: lastId, changes };
  }

  get(...params) {
    let stmt;
    try {
      stmt = this._db.prepare(this._sql);
      if (params.length) stmt.bind(params);
      if (stmt.step()) {
        return stmt.getAsObject();
      }
      return undefined;
    } finally {
      if (stmt) stmt.free();
    }
  }

  all(...params) {
    let stmt;
    try {
      stmt = this._db.prepare(this._sql);
      if (params.length) stmt.bind(params);
      const rows = [];
      while (stmt.step()) {
        rows.push(stmt.getAsObject());
      }
      return rows;
    } finally {
      if (stmt) stmt.free();
    }
  }
}

class DatabaseWrapper {
  constructor(sqlDb, dbPath) {
    this._db = sqlDb;
    this._dbPath = dbPath;
  }

  prepare(sql) {
    return new Statement(this._db, sql, () => this._persist());
  }

  exec(sql) {
    this._db.run(sql);
    this._persist();
  }

  pragma(_s) {
    // no-op for sql.js compatibility
  }

  _persist() {
    try {
      const data = this._db.export();
      fs.writeFileSync(this._dbPath, Buffer.from(data));
    } catch (_e) {
      // ignore persist errors
    }
  }
}

// ─── Initialize database (async, but exported as a ready promise) ───────────
let dbInstance = null;

async function initDatabase() {
  if (dbInstance) return dbInstance;

  const SQL = await initSqlJs();

  let sqlDb;
  if (fs.existsSync(DB_PATH)) {
    const buffer = fs.readFileSync(DB_PATH);
    sqlDb = new SQL.Database(buffer);
  } else {
    sqlDb = new SQL.Database();
  }

  dbInstance = new DatabaseWrapper(sqlDb, DB_PATH);

  // ─── Schema Creation ──────────────────────────────────────────────────
  dbInstance.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      name TEXT NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('account_manager', 'client')),
      client_id INTEGER REFERENCES clients(id),
      designation TEXT,
      phone TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS clients (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      industry TEXT,
      status TEXT DEFAULT 'active' CHECK(status IN ('active', 'inactive')),
      onboarded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS vendors (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      specializations TEXT DEFAULT '[]',
      contact_email TEXT,
      contact_phone TEXT,
      status TEXT DEFAULT 'active' CHECK(status IN ('active', 'inactive')),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS projects (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      client_id INTEGER NOT NULL REFERENCES clients(id),
      account_manager_id INTEGER REFERENCES users(id),
      name TEXT NOT NULL,
      description TEXT,
      type TEXT NOT NULL CHECK(type IN ('on-site', 'off-site')),
      status TEXT DEFAULT 'draft' CHECK(status IN ('draft', 'active', 'training', 'interviewing', 'completed', 'cancelled')),
      workflow_data TEXT DEFAULT '{}',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS trainings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      project_id INTEGER NOT NULL REFERENCES projects(id),
      type TEXT NOT NULL CHECK(type IN ('computer_skills', 'business_skills', 'logic_skills')),
      vendor_id INTEGER REFERENCES vendors(id),
      paid_by TEXT NOT NULL CHECK(paid_by IN ('abc_corp', 'client', 'trainee')),
      certification_required INTEGER DEFAULT 0,
      status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'in_progress', 'completed')),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS trainees (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT UNIQUE,
      phone TEXT,
      skills TEXT DEFAULT '[]',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS project_trainees (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      project_id INTEGER NOT NULL REFERENCES projects(id),
      trainee_id INTEGER NOT NULL REFERENCES trainees(id),
      status TEXT DEFAULT 'sourced' CHECK(status IN (
        'sourced', 'training', 'certified', 'interview_scheduled',
        'interviewed', 'shortlisted', 'offer_given', 'hired', 'rejected'
      )),
      interview_date DATETIME,
      interview_notes TEXT,
      offer_date DATETIME,
      hire_date DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(project_id, trainee_id)
    );

    CREATE TABLE IF NOT EXISTS certifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      project_trainee_id INTEGER NOT NULL REFERENCES project_trainees(id),
      training_id INTEGER NOT NULL REFERENCES trainings(id),
      certified INTEGER DEFAULT 0,
      certified_date DATETIME,
      certificate_number TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS workflow_templates (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT,
      workflow_data TEXT NOT NULL,
      created_by INTEGER REFERENCES users(id),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  return dbInstance;
}

// Export the ready promise — all route files will await this
export const dbReady = initDatabase();
export default dbReady;
