import { env } from '../config/env.js';
import { HttpError } from '../utils/httpError.js';

const MUTATING_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

function normalizeOrigin(value) {
  return new URL(value).origin;
}

export function originCheck(req, res, next) {
  if (!MUTATING_METHODS.has(req.method)) {
    return next();
  }

  const origin = req.get('origin');

  if (!origin) {
    return next();
  }

  try {
    if (normalizeOrigin(origin) === normalizeOrigin(env.CLIENT_ORIGIN)) {
      return next();
    }
  } catch {
    // Un Origin malformado cae en el rechazo de abajo.
  }

  return next(
    new HttpError(403, 'ORIGIN_NOT_ALLOWED', 'El origen de la petición no está permitido.')
  );
}
