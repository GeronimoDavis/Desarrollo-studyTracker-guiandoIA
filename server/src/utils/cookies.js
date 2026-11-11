import { env } from '../config/env.js';
import {
  ACCESS_TOKEN_TTL_MS,
  REFRESH_TOKEN_TTL_MS
} from '../services/token.service.js';

export const ACCESS_COOKIE = 'st_access';
export const REFRESH_COOKIE = 'st_refresh';

const baseOptions = {
  httpOnly: true,
  sameSite: 'lax',
  secure: env.COOKIE_SECURE
};

export function setAuthCookies(res, { accessToken, refreshToken }) {
  res.cookie(ACCESS_COOKIE, accessToken, {
    ...baseOptions,
    path: '/api',
    maxAge: ACCESS_TOKEN_TTL_MS
  });

  res.cookie(REFRESH_COOKIE, refreshToken, {
    ...baseOptions,
    path: '/api/auth',
    maxAge: REFRESH_TOKEN_TTL_MS
  });
}

export function clearAuthCookies(res) {
  res.clearCookie(ACCESS_COOKIE, {
    ...baseOptions,
    path: '/api'
  });

  res.clearCookie(REFRESH_COOKIE, {
    ...baseOptions,
    path: '/api/auth'
  });
}

export function getRefreshToken(req) {
  return req.cookies?.[REFRESH_COOKIE] ?? null;
}
