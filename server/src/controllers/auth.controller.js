import * as authService from '../services/auth.service.js';
import { HttpError } from '../utils/httpError.js';
import {
  clearAuthCookies,
  getRefreshToken,
  setAuthCookies
} from '../utils/cookies.js';

export async function register(req, res) {
  const result = await authService.register(req.body);
  setAuthCookies(res, result.tokens);

  res.status(201).json({
    data: {
      user: result.user
    }
  });
}

export async function login(req, res) {
  const result = await authService.login(req.body);
  setAuthCookies(res, result.tokens);

  res.json({
    data: {
      user: result.user
    }
  });
}

export async function refresh(req, res) {
  const refreshToken = getRefreshToken(req);

  if (!refreshToken) {
    clearAuthCookies(res);
    throw new HttpError(
      401,
      'UNAUTHENTICATED',
      'No hay una sesión activa para renovar.'
    );
  }

  try {
    const result = await authService.refresh(refreshToken);
    setAuthCookies(res, result.tokens);

    res.json({
      data: {
        user: result.user
      }
    });
  } catch (error) {
    clearAuthCookies(res);
    throw error;
  }
}

export async function logout(req, res) {
  try {
    await authService.logout(getRefreshToken(req));
  } finally {
    clearAuthCookies(res);
  }

  res.status(204).send();
}

export async function me(req, res) {
  const user = await authService.getMe(req.user.id);
  res.json({ data: { user } });
}

export async function updateMe(req, res) {
  const user = await authService.updateProfile(req.user.id, req.body);
  res.json({ data: { user } });
}

export async function changePassword(req, res) {
  await authService.changePassword(req.user.id, req.body);
  clearAuthCookies(res);
  res.status(204).send();
}
