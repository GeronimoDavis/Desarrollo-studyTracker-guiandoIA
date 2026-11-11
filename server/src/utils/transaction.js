import { pool } from '../config/db.js';

export async function withTransaction(callback) {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();
    const result = await callback(connection);
    await connection.commit();
    return result;
  } catch (error) {
    try {
      await connection.rollback();
    } catch {
      // El error original es más útil que un fallo de rollback.
    }

    throw error;
  } finally {
    connection.release();
  }
}
