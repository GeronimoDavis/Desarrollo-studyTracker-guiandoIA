import { useCallback, useEffect, useState } from 'react';

import * as settingsApi from '../api/settings.js';
import { SETTINGS_UPDATED_EVENT } from '../lib/events.js';

export function useSettings() {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  const reload = useCallback(() => {
    setError(null);
    setReloadKey((current) => current + 1);
  }, []);

  useEffect(() => {
    let active = true;
    const controller = new AbortController();

    settingsApi
      .getSettings({ signal: controller.signal })
      .then((data) => {
        if (active) {
          setSettings(data.settings);
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
          setLoading(false);
        }
      });

    return () => {
      active = false;
      controller.abort();
    };
  }, [reloadKey]);

  const save = useCallback(async (thresholds) => {
    setSaving(true);
    setError(null);

    try {
      const data = await settingsApi.updateSettings({
        heatmapThresholds: thresholds
      });

      setSettings(data.settings);

      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent(SETTINGS_UPDATED_EVENT));
      }

      return data.settings;
    } catch (requestError) {
      setError(requestError);
      throw requestError;
    } finally {
      setSaving(false);
    }
  }, []);

  return {
    settings,
    thresholds: settings?.heatmapThresholds ?? null,
    loading,
    error,
    saving,
    save,
    reload
  };
}
