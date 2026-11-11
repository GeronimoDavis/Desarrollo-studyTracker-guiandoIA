import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import mysql from 'mysql2/promise';

import { env } from '../config/env.js';

const currentDir = path.dirname(fileURLToPath(import.meta.url));
const migrationsDir = path.join(currentDir, 'migrations');
const migrationFile = '001_init.sql';
const migrationPath = path.join(migrationsDir, migrationFile);

const coreTables = [
  'users',
  'subjects',
  'study_sessions',
  'user_settings',
  'refresh_tokens'
];

async function tableExists(connection, tableName) {
  const [rows] = await connection.query(
    `SELECT 1
       FROM information_schema.tables
      WHERE table_schema = ?
        AND table_name = ?
      LIMIT 1`,
    [env.DB_NAME, tableName]
  );

  return rows.length > 0;
}

async function ensureMigrationsTable(connection) {
  await connection.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      filename   VARCHAR(255) NOT NULL,
      applied_at DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
      PRIMARY KEY (filename)
    ) ENGINE=InnoDB
      DEFAULT CHARSET=utf8mb4
      COLLATE=utf8mb4_0900_ai_ci
  `);
}

async function migrationApplied(connection, filename) {
  const [rows] = await connection.query(
    'SELECT 1 FROM schema_migrations WHERE filename = ? LIMIT 1',
    [filename]
  );

  return rows.length > 0;
}

async function markApplied(connection, filename) {
  await connection.query(
    'INSERT INTO schema_migrations (filename) VALUES (?)',
    [filename]
  );
}

async function main() {
  const connection = await mysql.createConnection({
    host: env.DB_HOST,
    port: env.DB_PORT,
    user: env.DB_USER,
    password: env.DB_PASSWORD,
    database: env.DB_NAME,
    charset: 'utf8mb4',
    timezone: 'Z',
    multipleStatements: true
  });

  try {
    await ensureMigrationsTable(connection);

    if (await migrationApplied(connection, migrationFile)) {
      console.log(`[db:migrate] ${migrationFile} ya estaba aplicada.`);
      return;
    }

    const existingCoreTables = await Promise.all(
      coreTables.map((table) => tableExists(connection, table))
    );

    if (existingCoreTables.every(Boolean)) {
      await markApplied(connection, migrationFile);
      console.log(
        `[db:migrate] Base existente detectada. Baseline registrado para ${migrationFile}.`
      );
      return;
    }

    const sql = await readFile(migrationPath, 'utf8');
    await connection.query(sql);
    await markApplied(connection, migrationFile);
    console.log(`[db:migrate] ${migrationFile} aplicada correctamente.`);
  } finally {
    await connection.end();
  }
}

main().catch((error) => {
  console.error('[db:migrate] Error:', error.message);
  process.exitCode = 1;
});
