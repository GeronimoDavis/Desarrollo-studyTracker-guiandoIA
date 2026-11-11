import { verifyAccessToken } from '../services/token.service.js';
import { ACCESS_COOKIE } from '../utils/cookies.js';
import { HttpError } from '../utils/httpError.js';

export function requireAuth(req, res, next) {
  const token = req.cookies?.[ACCESS_COOKIE];

  if (!token) {
    return next(
      new HttpError(
        401,
        'UNAUTHENTICATED',
        'Iniciá sesión para acceder a este recurso.'
      )
    );
  }

  try {
    const payload = verifyAccessToken(token);
    const userId = Number(payload.sub);

    if (!Number.isSafeInteger(userId) || userId <= 0) {
      throw new Error('Token sin usuario válido.');
    }

    req.user = { id: userId };
    return next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return next(
        new HttpError(401, 'TOKEN_EXPIRED', 'La sesión expiró.')
      );
    }

    return next(
      new HttpError(401, 'UNAUTHENTICATED', 'La sesión no es válida.')
    );
  }
}
