import bcrypt from 'bcryptjs';

export const BCRYPT_COST = 12;

// Hash fijo de una contraseña aleatoria. Se usa para que un email inexistente
// tarde un tiempo similar al de una contraseña incorrecta.
const DUMMY_PASSWORD_HASH =
  '$2b$12$9Ua4eR4Uw/4Nm/vVSWU0g.HPEGsv6BnwmEAw69GTZ8oMeOCLFAe5a';

export function hashPassword(password) {
  return bcrypt.hash(password, BCRYPT_COST);
}

export function verifyPassword(password, passwordHash) {
  return bcrypt.compare(password, passwordHash);
}

export function verifyDummyPassword(password) {
  return bcrypt.compare(password, DUMMY_PASSWORD_HASH);
}
