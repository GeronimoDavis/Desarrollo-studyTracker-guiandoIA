import { freezeTimer, resumeFrozenTimer } from './engine.js';

const SNAPSHOT_PREFIX = 'study-tracker:timer:';
const LOCK_KEY = 'study-tracker:timer-lock';
const SNAPSHOT_VERSION = 1;
const LOCK_TTL_MS = 20_000;

function getStorage() {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

function isFiniteNumber(value) {
  return typeof value === 'number' && Number.isFinite(value);
}

function isValidPlan(plan) {
  return Boolean(
    plan &&
      Number.isInteger(plan.targetMinutes) &&
      Number.isInteger(plan.breakMinutes) &&
      Number.isInteger(plan.breakCount) &&
      Array.isArray(plan.blocks) &&
      plan.blocks.length === plan.breakCount + 1 &&
      plan.blocks.every(
        (block) =>
          Number.isInteger(block.studySeconds) &&
          block.studySeconds > 0 &&
          Number.isInteger(block.breakSeconds) &&
          block.breakSeconds >= 0
      ) &&
      isFiniteNumber(plan.totalStudySeconds) &&
      isFiniteNumber(plan.totalWallSeconds)
  );
}

function isValidTimerState(state) {
  if (!state || typeof state !== 'object') {
    return false;
  }

  if (
    !['study', 'paused', 'break', 'finished'].includes(state.status) ||
    !['free', 'fixed'].includes(state.mode) ||
    typeof state.clientId !== 'string' ||
    state.clientId.length === 0 ||
    !Number.isInteger(state.subjectId) ||
    state.subjectId <= 0 ||
    !isFiniteNumber(state.startedAt) ||
    !isFiniteNumber(state.accumulatedStudyMs) ||
    !isFiniteNumber(state.phaseElapsedMs) ||
    (state.gapMs !== undefined && !isFiniteNumber(state.gapMs))
  ) {
    return false;
  }

  if (state.status === 'paused' && state.mode !== 'free') {
    return false;
  }

  if (state.status === 'break' && state.mode !== 'fixed') {
    return false;
  }

  if (state.status === 'finished') {
    if (
      !['completed', 'abandoned'].includes(state.finalStatus) ||
      !isFiniteNumber(state.endedAt)
    ) {
      return false;
    }
  }

  if (state.mode === 'fixed') {
    if (!isValidPlan(state.plan)) {
      return false;
    }

    if (
      !Number.isInteger(state.blockIndex) ||
      state.blockIndex < 0 ||
      state.blockIndex >= state.plan.blocks.length
    ) {
      return false;
    }
  } else if (state.plan !== null && state.plan !== undefined) {
    return false;
  }

  return true;
}

export function getSnapshotKey(userId) {
  return `${SNAPSHOT_PREFIX}${userId}`;
}

export function writeSnapshot(userId, state, now = Date.now()) {
  const storage = getStorage();

  if (!storage) {
    return null;
  }

  const frozen = freezeTimer(state, now);
  const payload = {
    version: SNAPSHOT_VERSION,
    userId,
    savedAt: now,
    state: frozen
  };

  try {
    storage.setItem(getSnapshotKey(userId), JSON.stringify(payload));
    return payload;
  } catch {
    return null;
  }
}

export function readSnapshot(userId) {
  const storage = getStorage();

  if (!storage) {
    return null;
  }

  let parsed;

  try {
    parsed = JSON.parse(storage.getItem(getSnapshotKey(userId)));
  } catch {
    clearSnapshot(userId);
    return null;
  }

  if (
    !parsed ||
    parsed.version !== SNAPSHOT_VERSION ||
    parsed.userId !== userId ||
    !isFiniteNumber(parsed.savedAt) ||
    !isValidTimerState(parsed.state)
  ) {
    clearSnapshot(userId);
    return null;
  }

  return parsed;
}

export function clearSnapshot(userId) {
  try {
    getStorage()?.removeItem(getSnapshotKey(userId));
  } catch {
    // Storage can be unavailable in private mode; the in-memory timer still works.
  }
}

export function restoreSnapshot(snapshot, now = Date.now()) {
  if (!snapshot || !isValidTimerState(snapshot.state)) {
    return null;
  }

  const gap =
    snapshot.state.status === 'finished'
      ? 0
      : Math.max(0, now - snapshot.savedAt);

  return resumeFrozenTimer(
    {
      ...snapshot.state,
      gapMs: (snapshot.state.gapMs ?? 0) + gap
    },
    now
  );
}

export function readTabLock() {
  const storage = getStorage();

  if (!storage) {
    return null;
  }

  try {
    return JSON.parse(storage.getItem(LOCK_KEY));
  } catch {
    storage.removeItem(LOCK_KEY);
    return null;
  }
}

export function isTabLockFresh(lock, now = Date.now()) {
  return Boolean(
    lock &&
      typeof lock.tabId === 'string' &&
      isFiniteNumber(lock.updatedAt) &&
      now - lock.updatedAt < LOCK_TTL_MS
  );
}

export function tryAcquireTabLock({
  userId,
  tabId,
  clientId,
  now = Date.now()
}) {
  const storage = getStorage();

  if (!storage) {
    return { acquired: true, lock: null };
  }

  const current = readTabLock();

  if (
    current &&
    current.tabId !== tabId &&
    isTabLockFresh(current, now)
  ) {
    return { acquired: false, lock: current };
  }

  const lock = {
    userId,
    tabId,
    clientId,
    updatedAt: now
  };

  try {
    storage.setItem(LOCK_KEY, JSON.stringify(lock));
    return { acquired: true, lock };
  } catch {
    return { acquired: true, lock: null };
  }
}

export function refreshTabLock({
  userId,
  tabId,
  clientId,
  now = Date.now()
}) {
  const storage = getStorage();

  if (!storage) {
    return;
  }

  const current = readTabLock();

  if (current && current.tabId !== tabId) {
    return;
  }

  try {
    storage.setItem(
      LOCK_KEY,
      JSON.stringify({ userId, tabId, clientId, updatedAt: now })
    );
  } catch {
    // A full storage quota must not interrupt the active timer.
  }
}

export function releaseTabLock(tabId) {
  const storage = getStorage();

  if (!storage) {
    return;
  }

  const current = readTabLock();

  if (!current || current.tabId === tabId) {
    try {
      storage.removeItem(LOCK_KEY);
    } catch {
      // Ignore storage failures when closing the tab.
    }
  }
}

export function getTabLockKey() {
  return LOCK_KEY;
}
