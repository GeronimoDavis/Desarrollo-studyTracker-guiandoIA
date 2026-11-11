import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { useSessionSave } from '../hooks/useSessionSave.js';
import { createClientId } from '../lib/dates.js';
import { buildBreakPlan } from '../lib/timer/breakPlan.js';
import {
  abandonSession,
  advanceTimer,
  buildSessionPayload,
  computeTimerMetrics,
  finishFreeSession,
  isTimerActive,
  pauseTimer,
  resumeTimer,
  skipBreak,
  startFixedSession,
  startFreeSession
} from '../lib/timer/engine.js';
import {
  clearSnapshot,
  getTabLockKey,
  isTabLockFresh,
  readSnapshot,
  readTabLock,
  refreshTabLock,
  releaseTabLock,
  restoreSnapshot,
  tryAcquireTabLock,
  writeSnapshot
} from '../lib/timer/snapshot.js';
import { useAuth } from './useAuth.js';
import { TimerContext } from './timerContext.js';

const DEFAULT_CONFIG = {
  subjectId: '',
  mode: 'free',
  targetMinutes: 60,
  breakMinutes: 5
};

function createTabId() {
  try {
    return createClientId();
  } catch {
    return `tab-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  }
}

function playAlertTone() {
  if (typeof window === 'undefined') {
    return;
  }

  const AudioContextClass =
    window.AudioContext || window.webkitAudioContext;

  if (!AudioContextClass) {
    return;
  }

  try {
    const audioContext = new AudioContextClass();
    const oscillator = audioContext.createOscillator();
    const gain = audioContext.createGain();

    oscillator.type = 'sine';
    oscillator.frequency.value = 880;
    gain.gain.setValueAtTime(0.0001, audioContext.currentTime);
    gain.gain.exponentialRampToValueAtTime(
      0.16,
      audioContext.currentTime + 0.02
    );
    gain.gain.exponentialRampToValueAtTime(
      0.0001,
      audioContext.currentTime + 0.25
    );
    oscillator.connect(gain);
    gain.connect(audioContext.destination);
    oscillator.start();
    oscillator.stop(audioContext.currentTime + 0.28);
    window.setTimeout(() => audioContext.close?.(), 500);
  } catch {
    // Sound is optional; a blocked audio context must not break the timer.
  }
}

function showBrowserNotification(title, body) {
  if (
    typeof Notification === 'undefined' ||
    Notification.permission !== 'granted'
  ) {
    return;
  }

  try {
    new Notification(title, { body });
  } catch {
    // Some browsers require a service worker; the in-app alert still works.
  }
}

export function TimerProvider({ children }) {
  const { user } = useAuth();
  const userId = user?.id;
  const [timer, setTimer] = useState(null);
  const [now, setNow] = useState(() => Date.now());
  const [config, setConfig] = useState(DEFAULT_CONFIG);
  const [recovery, setRecovery] = useState(null);
  const [externalActive, setExternalActive] = useState(false);
  const [notice, setNotice] = useState(null);
  const [notificationPermission, setNotificationPermission] = useState(() =>
    typeof Notification === 'undefined' ? 'unsupported' : Notification.permission
  );
  const [tabId] = useState(createTabId);
  const timerRef = useRef(null);
  const previousTimerRef = useRef(null);
  const saveState = useSessionSave();
  const { reset: resetSave } = saveState;

  useEffect(() => {
    timerRef.current = timer;
  }, [timer]);

  useEffect(() => {
    if (!userId) {
      // oxlint-disable-next-line react/set-state-in-effect
      setTimer(null);
      setRecovery(null);
      setExternalActive(false);
      return;
    }

    const snapshot = readSnapshot(userId);
    const lock = readTabLock();

    setRecovery(snapshot);
    setExternalActive(
      Boolean(
        lock && lock.tabId !== tabId && isTabLockFresh(lock, Date.now())
      )
    );
  }, [tabId, userId]);

  useEffect(() => {
    if (!userId || !timer) {
      return;
    }

    writeSnapshot(userId, timer, Date.now());
  }, [timer, userId]);

  useEffect(() => {
    if (!userId || !timer || !isTimerActive(timer)) {
      return undefined;
    }

    const persist = () => {
      const current = timerRef.current;
      const at = Date.now();

      if (!current) {
        return;
      }

      writeSnapshot(userId, current, at);
      refreshTabLock({
        userId,
        tabId,
        clientId: current.clientId,
        now: at
      });
    };

    const handleVisibility = () => {
      if (document.visibilityState === 'hidden') {
        persist();
        return;
      }

      const at = Date.now();
      const current = timerRef.current;

      if (current) {
        const next = advanceTimer(current, at);
        timerRef.current = next;
        setTimer(next);
      }

      setNow(at);
    };

    const interval = window.setInterval(persist, 5000);
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      window.clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [tabId, timer, userId]);

  useEffect(() => {
    if (!userId) {
      return undefined;
    }

    const handleBeforeUnload = (event) => {
      const current = timerRef.current;

      if (current) {
        writeSnapshot(userId, current, Date.now());

        if (isTimerActive(current)) {
          event.preventDefault();
          event.returnValue = '';
        }
      }
    };

    const handlePageHide = () => {
      const current = timerRef.current;

      if (current) {
        writeSnapshot(userId, current, Date.now());
      }

      releaseTabLock(tabId);
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('pagehide', handlePageHide);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('pagehide', handlePageHide);
      releaseTabLock(tabId);
    };
  }, [tabId, userId]);

  useEffect(() => {
    if (!userId) {
      return undefined;
    }

    const handleStorage = (event) => {
      if (event.key !== getTabLockKey()) {
        return;
      }

      const lock = readTabLock();
      const otherTab =
        lock && lock.tabId !== tabId && isTabLockFresh(lock, Date.now());

      setExternalActive(Boolean(otherTab));

      if (otherTab && !timerRef.current) {
        setNotice('Ya hay una sesión activa en otra pestaña.');
      }
    };

    window.addEventListener('storage', handleStorage);

    return () => window.removeEventListener('storage', handleStorage);
  }, [tabId, userId]);

  useEffect(() => {
    if (!timer || !isTimerActive(timer)) {
      return undefined;
    }

    const interval = window.setInterval(() => {
      const at = Date.now();
      const current = timerRef.current;

      if (!current) {
        return;
      }

      const next = advanceTimer(current, at);

      if (next !== current) {
        timerRef.current = next;
        setTimer(next);
      }

      setNow(at);
    }, 1000);

    return () => window.clearInterval(interval);
  }, [timer]);

  useEffect(() => {
    const previous = previousTimerRef.current;
    previousTimerRef.current = timer;

    if (!timer || !previous) {
      return;
    }

    const enteredBreak =
      timer.status === 'break' && previous.status !== 'break';
    const enteredStudy =
      previous.status === 'break' && timer.status === 'study';
    const enteredFinished = timer.status === 'finished';
    const changedBlock =
      timer.mode === 'fixed' &&
      timer.status === 'study' &&
      previous.status === 'study' &&
      timer.blockIndex !== previous.blockIndex;

    if (!enteredBreak && !enteredStudy && !enteredFinished && !changedBlock) {
      return;
    }

    if (enteredFinished) {
      playAlertTone();
      showBrowserNotification(
        'Sesión finalizada',
        'Tu sesión de estudio está lista para guardar.'
      );
      return;
    }

    if (enteredBreak) {
      playAlertTone();
      showBrowserNotification(
        'Empieza el descanso',
        'Tomate unos minutos antes del próximo bloque.'
      );
      return;
    }

    if (enteredStudy || changedBlock) {
      playAlertTone();
      showBrowserNotification(
        'Volvé a estudiar',
        'Empezá el siguiente bloque cuando quieras.'
      );
    }
  }, [timer]);

  const updateTimer = useCallback((updater, at = Date.now()) => {
    const current = timerRef.current;

    if (!current) {
      return null;
    }

    const next = updater(current, at);

    if (next === current) {
      return current;
    }

    timerRef.current = next;
    setTimer(next);
    setNow(at);
    return next;
  }, []);

  const updateConfig = useCallback((patch) => {
    setConfig((current) => ({ ...current, ...patch }));
  }, []);

  const clearNotice = useCallback(() => setNotice(null), []);

  const start = useCallback(() => {
    if (!userId) {
      return false;
    }

    const subjectId = Number(config.subjectId);

    if (!Number.isInteger(subjectId) || subjectId <= 0) {
      setNotice('Elegí una materia antes de iniciar.');
      return false;
    }

    const startedAt = Date.now();
    let plan = null;

    try {
      if (config.mode === 'fixed') {
        plan = buildBreakPlan(
          Number(config.targetMinutes),
          Number(config.breakMinutes)
        );
      }
    } catch {
      setNotice('El plan de descanso no es válido.');
      return false;
    }

    let clientId;

    try {
      clientId = createClientId();
    } catch {
      setNotice('No se pudo generar el identificador de la sesión.');
      return false;
    }

    const lock = tryAcquireTabLock({
      userId,
      tabId,
      clientId,
      now: startedAt
    });

    if (!lock.acquired) {
      setExternalActive(true);
      setNotice('Ya hay una sesión activa en otra pestaña.');
      return false;
    }

    const next =
      config.mode === 'free'
        ? startFreeSession({ clientId, subjectId, startedAt })
        : startFixedSession({ clientId, subjectId, plan, startedAt });

    timerRef.current = next;
    setTimer(next);
    setNow(startedAt);
    setRecovery(null);
    setExternalActive(false);
    setNotice(null);
    resetSave();
    return true;
  }, [config, resetSave, tabId, userId]);

  const pause = useCallback(() => {
    updateTimer((current, at) => pauseTimer(current, at));
  }, [updateTimer]);

  const resume = useCallback(() => {
    updateTimer((current, at) => resumeTimer(current, at));
  }, [updateTimer]);

  const finish = useCallback(() => {
    updateTimer((current, at) => finishFreeSession(current, at));
  }, [updateTimer]);

  const skip = useCallback(() => {
    updateTimer((current, at) => skipBreak(current, at));
  }, [updateTimer]);

  const abandon = useCallback(() => {
    updateTimer((current, at) => abandonSession(current, at));
  }, [updateTimer]);

  const discard = useCallback(() => {
    releaseTabLock(tabId);
    resetSave();

    if (userId) {
      clearSnapshot(userId);
    }

    timerRef.current = null;
    setTimer(null);
    setNotice(null);
  }, [resetSave, tabId, userId]);

  const refreshCurrent = useCallback(() => {
    if (userId && timerRef.current) {
      writeSnapshot(userId, timerRef.current, Date.now());
    }
  }, [userId]);

  const saveCurrent = useCallback(async () => {
    const current = timerRef.current;

    if (!current) {
      return false;
    }

    const payload = buildSessionPayload(current);

    if (!payload) {
      return false;
    }

    if (payload.effectiveSeconds < 60) {
      setNotice('La sesión debe tener al menos 60 segundos efectivos.');
      return false;
    }

    try {
      await saveState.save(payload);
      if (userId) {
        clearSnapshot(userId);
      }
      releaseTabLock(tabId);
      return true;
    } catch {
      return false;
    }
  }, [saveState, tabId, userId]);

  const retrySave = useCallback(async () => {
    try {
      const session = await saveState.retry();

      if (session) {
        if (userId) {
          clearSnapshot(userId);
        }
        releaseTabLock(tabId);
        return true;
      }

      return false;
    } catch {
      return false;
    }
  }, [saveState, tabId, userId]);

  const resumeRecovery = useCallback(() => {
    if (!userId || !recovery) {
      return false;
    }

    const at = Date.now();
    const restored = restoreSnapshot(recovery, at);

    if (!restored) {
      clearSnapshot(userId);
      setRecovery(null);
      return false;
    }

    if (isTimerActive(restored)) {
      const lock = tryAcquireTabLock({
        userId,
        tabId,
        clientId: restored.clientId,
        now: at
      });

      if (!lock.acquired) {
        setExternalActive(true);
        setNotice('La sesión activa pertenece a otra pestaña.');
        return false;
      }
    }

    timerRef.current = restored;
    setTimer(restored);
    setNow(at);
    setRecovery(null);
    setExternalActive(false);
    setNotice(null);
    resetSave();
    return true;
  }, [recovery, resetSave, tabId, userId]);

  const discardRecovery = useCallback(() => {
    if (userId) {
      clearSnapshot(userId);
    }

    releaseTabLock(tabId);
    setRecovery(null);
  }, [tabId, userId]);

  const requestNotifications = useCallback(async () => {
    if (typeof Notification === 'undefined') {
      setNotice('Este navegador no admite notificaciones.');
      return 'unsupported';
    }

    try {
      const permission = await Notification.requestPermission();
      setNotificationPermission(permission);

      if (permission === 'granted') {
        setNotice('Avisos activados.');
      } else if (permission === 'denied') {
        setNotice('El navegador bloqueó los avisos. El temporizador sigue funcionando.');
      }

      return permission;
    } catch {
      setNotice('No se pudieron activar los avisos.');
      return 'denied';
    }
  }, []);

  const metrics = useMemo(() => computeTimerMetrics(timer, now), [timer, now]);
  const active = isTimerActive(timer);
  const finished = timer?.status === 'finished';

  const value = useMemo(
    () => ({
      timer,
      config,
      updateConfig,
      now,
      metrics,
      active,
      finished,
      recovery,
      externalActive,
      notice,
      clearNotice,
      notificationPermission,
      requestNotifications,
      start,
      pause,
      resume,
      finish,
      skip,
      abandon,
      discard,
      saveCurrent,
      retrySave,
      resumeRecovery,
      discardRecovery,
      refreshCurrent,
      saving: saveState.saving,
      saveError: saveState.error,
      savedSession: saveState.savedSession,
      resetSave
    }),
    [
      timer,
      config,
      updateConfig,
      now,
      metrics,
      active,
      finished,
      recovery,
      externalActive,
      notice,
      clearNotice,
      notificationPermission,
      requestNotifications,
      start,
      pause,
      resume,
      finish,
      skip,
      abandon,
      discard,
      saveCurrent,
      retrySave,
      resumeRecovery,
      discardRecovery,
      refreshCurrent,
      saveState.saving,
      saveState.error,
      saveState.savedSession,
      resetSave
    ]
  );

  return (
    <TimerContext.Provider value={value}>{children}</TimerContext.Provider>
  );
}
