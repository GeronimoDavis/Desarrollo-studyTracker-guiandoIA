import { useCallback, useEffect, useState } from 'react';

import { getHeatmap } from '../api/dashboard.js';
import { SESSION_SAVED_EVENT, SETTINGS_UPDATED_EVENT } from '../lib/events.js';

export function useHeatmap(year) {
  const [heatmap, setHeatmap] = useState(null);
  const [loadedKey, setLoadedKey] = useState(null);
  const [error, setError] = useState(null);
  const [reloadKey, setReloadKey] = useState(0);
  const requestKey = `${year ?? 'current'}|${reloadKey}`;

  const reload = useCallback(() => {
    setError(null);
    setReloadKey((current) => current + 1);
  }, []);

  useEffect(() => {
    const handleSessionSaved = () => reload();
    const handleSettingsUpdated = () => reload();

    window.addEventListener(SESSION_SAVED_EVENT, handleSessionSaved);
    window.addEventListener(SETTINGS_UPDATED_EVENT, handleSettingsUpdated);

    return () => {
      window.removeEventListener(SESSION_SAVED_EVENT, handleSessionSaved);
      window.removeEventListener(SETTINGS_UPDATED_EVENT, handleSettingsUpdated);
    };
  }, [reload]);

  useEffect(() => {
    let active = true;
    const controller = new AbortController();

    getHeatmap({ year, signal: controller.signal })
      .then((data) => {
        if (active) {
          setHeatmap(data);
          setError(null);
        }
      })
      .catch((requestError) => {
        if (requestError.name === 'AbortError') {
          return;
        }

        if (active) {
          setError(requestError);
        }
      })
      .finally(() => {
        if (active) {
          setLoadedKey(requestKey);
        }
      });

    return () => {
      active = false;
      controller.abort();
    };
  }, [reloadKey, requestKey, year]);

  return {
    heatmap,
    loading: loadedKey !== requestKey,
    error: loadedKey === requestKey ? error : null,
    reload
  };
}
