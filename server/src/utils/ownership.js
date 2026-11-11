import { HttpError } from './httpError.js';

export function assertOwnedRow(row, message = 'Recurso no encontrado.') {
  if (!row) {
    throw new HttpError(404, 'NOT_FOUND', message);
  }

  return row;
}

export function assertSameUser(
  resourceUserId,
  authenticatedUserId,
  message = 'Recurso no encontrado.'
) {
  if (Number(resourceUserId) !== Number(authenticatedUserId)) {
    throw new HttpError(404, 'NOT_FOUND', message);
  }

  return true;
}
