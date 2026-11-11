import { checkDatabase } from '../config/db.js';
import { HttpError } from '../utils/httpError.js';

export async function health(req, res, next) {
  try {
    await checkDatabase();

    res.json({
      data: {
        api: 'ok',
        db: 'ok',
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('[health] Database check failed:', error.message);

    next(
      new HttpError(
        503,
        'DATABASE_UNAVAILABLE',
        'No se pudo conectar con la base de datos.'
      )
    );
  }
}
