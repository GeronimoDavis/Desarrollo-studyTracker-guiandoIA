import { useCallback, useEffect, useState } from 'react';

import * as subjectsApi from '../api/subjects.js';

export function useSubjectSummary(id) {
  const [subject, setSubject] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(() => Boolean(id));
  const [error, setError] = useState(null);
  const [reloadKey, setReloadKey] = useState(0);

  const reload = useCallback(() => {
    setLoading(Boolean(id));
    setError(null);
    setReloadKey((current) => current + 1);
  }, [id]);

  useEffect(() => {
    if (!id) {
      return undefined;
    }

    let active = true;
    const controller = new AbortController();

    subjectsApi
      .getSubjectStats(id, { signal: controller.signal })
      .then((data) => {
        if (active) {
          setSubject(data.subject);
          setStats(data.stats);
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
  }, [id, reloadKey]);

  const invalidId = !id;

  return {
    subject: invalidId ? null : subject,
    stats: invalidId ? null : stats,
    loading: invalidId ? false : loading,
    error: invalidId ? new Error('Materia inválida.') : error,
    reload
  };
}
