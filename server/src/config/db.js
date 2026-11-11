import mysql from 'mysql2/promise';
import { env } from './env.js';

export const pool = mysql.createPool({
  host: env.DB_HOST,
  port: env.DB_PORT,
  user: env.DB_USER,
  password: env.DB_PASSWORD,
  database: env.DB_NAME,
  waitForConnections: true,
  connectionLimit: env.DB_CONNECTION_LIMIT,
  queueLimit: 0,
  charset: 'utf8mb4',
  timezone: 'Z',
  dateStrings: ['DATE'],
  enableKeepAlive: true,
  keepAliveInitialDelay: 0
});

// Todas las conexiones del pool trabajan en UTC. La fecha local de la sesión
// se calcula en la capa de servicios con la zona IANA del usuario.
pool.on('connection', (connection) => {
  connection.query("SET time_zone = '+00:00'");
});

export async function checkDatabase() {
  const [rows] = await pool.query('SELECT 1 AS ok');
  return rows[0]?.ok === 1;
}

export async function closeDatabase() {
  await pool.end();
}
