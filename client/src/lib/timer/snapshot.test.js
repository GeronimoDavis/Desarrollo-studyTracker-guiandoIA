import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import {
  clearSnapshot,
  getSnapshotKey,
  getTabLockKey,
  isTabLockFresh,
  readSnapshot,
  readTabLock,
  releaseTabLock,
  restoreSnapshot,
  tryAcquireTabLock,
  writeSnapshot
} from './snapshot.js';
import { startFreeSession } from './engine.js';

const BASE = 1_700_000_000_000;
const USER_ID = 1;
const CLIENT_ID = '6f0f1e6d-0f6c-4e9b-9d1c-2f0a7c4b8e11';

beforeEach(() => {
  window.localStorage.clear();
});

afterEach(() => {
  window.localStorage.clear();
});

describe('timer snapshot', () => {
  it('guarda y recupera sin contar el tiempo cerrado', () => {
    const state = startFreeSession({
      clientId: CLIENT_ID,
      subjectId: 1,
      startedAt: BASE
    });

    writeSnapshot(USER_ID, state, BASE + 30_000);
    const snapshot = readSnapshot(USER_ID);
    const restored = restoreSnapshot(snapshot, BASE + 120_000);

    expect(snapshot.savedAt).toBe(BASE + 30_000);
    expect(restored.phaseElapsedMs).toBe(30_000);
    expect(restored.gapMs).toBe(90_000);
    expect(restored.phaseStartedAt).toBe(BASE + 120_000);
  });

  it('descarta snapshots inválidos', () => {
    window.localStorage.setItem(getSnapshotKey(USER_ID), '{bad json');

    expect(readSnapshot(USER_ID)).toBeNull();
    expect(window.localStorage.getItem(getSnapshotKey(USER_ID))).toBeNull();
  });

  it('bloquea una segunda pestaña y libera el bloqueo propio', () => {
    const first = tryAcquireTabLock({
      userId: USER_ID,
      tabId: 'tab-a',
      clientId: CLIENT_ID,
      now: BASE
    });

    expect(first.acquired).toBe(true);
    expect(isTabLockFresh(readTabLock(), BASE + 1_000)).toBe(true);

    const second = tryAcquireTabLock({
      userId: USER_ID,
      tabId: 'tab-b',
      clientId: CLIENT_ID,
      now: BASE + 1_000
    });

    expect(second.acquired).toBe(false);

    releaseTabLock('tab-b');
    expect(readTabLock()?.tabId).toBe('tab-a');

    releaseTabLock('tab-a');
    expect(window.localStorage.getItem(getTabLockKey())).toBeNull();
  });

  it('ignora un bloqueo vencido', () => {
    tryAcquireTabLock({
      userId: USER_ID,
      tabId: 'tab-a',
      clientId: CLIENT_ID,
      now: BASE
    });

    const second = tryAcquireTabLock({
      userId: USER_ID,
      tabId: 'tab-b',
      clientId: CLIENT_ID,
      now: BASE + 60_000
    });

    expect(second.acquired).toBe(true);
  });

  it('limpia el snapshot del usuario', () => {
    const state = startFreeSession({
      clientId: CLIENT_ID,
      subjectId: 1,
      startedAt: BASE
    });

    writeSnapshot(USER_ID, state, BASE);
    clearSnapshot(USER_ID);

    expect(window.localStorage.getItem(getSnapshotKey(USER_ID))).toBeNull();
  });
});
