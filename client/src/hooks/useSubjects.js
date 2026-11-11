import { useCallback, useEffect, useState } from 'react';

import * as subjectsApi from '../api/subjects.js';

export function useSubjects({ includeArchived = false } = {}) {
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [reloadKey, setReloadKey] = useState(0);

  const reload = useCallback(() => {
    setLoading(true);
    setError(null);
    setReloadKey((current) => current + 1);
  }, []);

  useEffect(() => {
    let active = true;
    const controller = new AbortController();

    subjectsApi
      .listSubjects({ includeArchived, signal: controller.signal })
      .then((data) => {
        if (active) {
          setSubjects(data.subjects);
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
  }, [includeArchived, reloadKey]);

  const create = useCallback(
    async (payload) => {
      const data = await subjectsApi.createSubject(payload);
      reload();
      return data.subject;
    },
    [reload]
  );

  const update = useCallback(
    async (id, payload) => {
      const data = await subjectsApi.updateSubject(id, payload);
      reload();
      return data.subject;
    },
    [reload]
  );

  const remove = useCallback(
    async (id) => {
      const data = await subjectsApi.deleteSubject(id);
      reload();
      return data;
    },
    [reload]
  );

  const restore = useCallback(
    async (id) => {
      const data = await subjectsApi.restoreSubject(id);
      reload();
      return data.subject;
    },
    [reload]
  );

  return {
    subjects,
    loading,
    error,
    reload,
    create,
    update,
    remove,
    restore
  };
}
