import { useCallback, useRef, useState } from 'react';

import { createSession } from '../api/sessions.js';

export const SESSION_SAVED_EVENT = 'study-tracker:session-saved';

export function useSessionSave() {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [savedSession, setSavedSession] = useState(null);
  const lastPayloadRef = useRef(null);

  const send = useCallback(async (payload) => {
    setSaving(true);
    setError(null);

    try {
      const data = await createSession(payload);
      setSavedSession(data.session);

      if (typeof window !== 'undefined') {
        window.dispatchEvent(
          new CustomEvent(SESSION_SAVED_EVENT, {
            detail: { session: data.session }
          })
        );
      }

      return data.session;
    } catch (requestError) {
      setError(requestError);
      throw requestError;
    } finally {
      setSaving(false);
    }
  }, []);

  const save = useCallback(
    (payload) => {
      lastPayloadRef.current = payload;
      return send(payload);
    },
    [send]
  );

  const retry = useCallback(() => {
    if (!lastPayloadRef.current) {
      return Promise.resolve(null);
    }

    return send(lastPayloadRef.current);
  }, [send]);

  const reset = useCallback(() => {
    lastPayloadRef.current = null;
    setSaving(false);
    setError(null);
    setSavedSession(null);
  }, []);

  return {
    save,
    retry,
    reset,
    saving,
    error,
    savedSession
  };
}
