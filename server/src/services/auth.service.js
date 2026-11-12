import { pool } from '../config/db.js';
import {
  createRefreshToken,
  findByToken as findRefreshTokenByToken,
  revokeAllForUser,
  revokeById
} from '../repositories/refreshTokens.repository.js';
import { createDefaults as createDefaultSettings } from '../repositories/userSettings.repository.js';
import {
  createUser,
  findByEmail,
  findById,
  updatePassword,
  updateProfile as updateUserProfile
} from '../repositories/users.repository.js';
import {
  hashPassword,
  verifyDummyPassword,
  verifyPassword
} from './password.service.js';
import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken
} from './token.service.js';
import { HttpError } from '../utils/httpError.js';
import { toPublicUser } from '../utils/publicUser.js';
import { withTransaction } from '../utils/transaction.js';

function invalidCredentials() {
  return new HttpError(
    401,
    'INVALID_CREDENTIALS',
    'El email o la contraseña son incorrectos.'
  );
}

function invalidRefresh() {
  return new HttpError(
    401,
    'UNAUTHENTICATED',
    'Tu sesión expiró. Iniciá sesión nuevamente.'
  );
}

async function issueAndStoreTokens(userId, connection = pool) {
  const accessToken = signAccessToken(userId);
  const refresh = signRefreshToken(userId);

  await createRefreshToken(
    {
      userId,
      token: refresh.token,
      expiresAt: refresh.expiresAt
    },
    connection
  );

  return {
    accessToken,
    refreshToken: refresh.token
  };
}

export async function register({ name, email, password, timezone }) {
  const normalizedEmail = email.toLowerCase();
  const existingUser = await findByEmail(normalizedEmail);

  if (existingUser) {
    throw new HttpError(
      409,
      'EMAIL_IN_USE',
      'Ya existe una cuenta con ese email.'
    );
  }

  const passwordHash = await hashPassword(password);

  try {
    const result = await withTransaction(async (connection) => {
      const user = await createUser(
        {
          name,
          email: normalizedEmail,
          passwordHash,
          timezone
        },
        connection
      );

      await createDefaultSettings(user.id, connection);
      const tokens = await issueAndStoreTokens(user.id, connection);

      return { user, tokens };
    });

    return {
      user: toPublicUser(result.user),
      tokens: result.tokens
    };
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      throw new HttpError(
        409,
        'EMAIL_IN_USE',
        'Ya existe una cuenta con ese email.'
      );
    }

    throw error;
  }
}

export async function login({ email, password }) {
  const user = await findByEmail(email.toLowerCase());

  if (!user) {
    await verifyDummyPassword(password);
    throw invalidCredentials();
  }

  const passwordMatches = await verifyPassword(password, user.password_hash);

  if (!passwordMatches) {
    throw invalidCredentials();
  }

  const tokens = await issueAndStoreTokens(user.id);

  return {
    user: toPublicUser(user),
    tokens
  };
}

export async function refresh(refreshToken) {
  let payload;

  try {
    payload = verifyRefreshToken(refreshToken);
  } catch {
    throw invalidRefresh();
  }

  const userId = Number(payload.sub);

  if (!Number.isSafeInteger(userId) || userId <= 0) {
    throw invalidRefresh();
  }

  const connection = await pool.getConnection();
  let committed = false;

  try {
    await connection.beginTransaction();

    const storedToken = await findRefreshTokenByToken(refreshToken, connection, {
      forUpdate: true
    });

    if (!storedToken) {
      await revokeAllForUser(userId, connection);
      await connection.commit();
      committed = true;
      throw invalidRefresh();
    }

    if (storedToken.revoked_at) {
      await revokeAllForUser(storedToken.user_id, connection);
      await connection.commit();
      committed = true;
      throw invalidRefresh();
    }

    if (new Date(storedToken.expires_at).getTime() <= Date.now()) {
      await revokeById(storedToken.id, connection);
      await connection.commit();
      committed = true;
      throw invalidRefresh();
    }

    const user = await findById(storedToken.user_id, connection);

    if (!user) {
      await revokeAllForUser(storedToken.user_id, connection);
      await connection.commit();
      committed = true;
      throw invalidRefresh();
    }

    await revokeById(storedToken.id, connection);
    const tokens = await issueAndStoreTokens(user.id, connection);

    await connection.commit();
    committed = true;

    return {
      user: toPublicUser(user),
      tokens
    };
  } catch (error) {
    if (!committed) {
      try {
        await connection.rollback();
      } catch {
        // El error original es más útil que un fallo de rollback.
      }
    }

    throw error;
  } finally {
    connection.release();
  }
}

export async function logout(refreshToken) {
  if (!refreshToken) {
    return;
  }

  const storedToken = await findRefreshTokenByToken(refreshToken);

  if (storedToken && !storedToken.revoked_at) {
    await revokeById(storedToken.id);
  }
}

export async function getMe(userId) {
  const user = await findById(userId);

  if (!user) {
    throw new HttpError(401, 'UNAUTHENTICATED', 'La sesión no es válida.');
  }

  return toPublicUser(user);
}

export async function updateProfile(userId, input) {
  const user = await updateUserProfile(userId, input);

  if (!user) {
    throw new HttpError(401, 'UNAUTHENTICATED', 'La sesión no es válida.');
  }

  return toPublicUser(user);
}

export async function changePassword(
  userId,
  { currentPassword, newPassword }
) {
  const user = await findById(userId);

  if (!user) {
    throw new HttpError(401, 'UNAUTHENTICATED', 'La sesión no es válida.');
  }

  const passwordMatches = await verifyPassword(
    currentPassword,
    user.password_hash
  );

  if (!passwordMatches) {
    throw new HttpError(
      422,
      'INVALID_CURRENT_PASSWORD',
      'La contraseña actual no es correcta.'
    );
  }

  const passwordHash = await hashPassword(newPassword);

  await withTransaction(async (connection) => {
    await updatePassword(userId, passwordHash, connection);
    await revokeAllForUser(userId, connection);
  });
}
