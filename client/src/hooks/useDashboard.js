import { useCallback, useEffect, useState } from 'react';

import { getDashboard, getPeriodReport } from '../api/dashboard.js';
import { listAllSessions } from '../api/sessions.js';
import { SESSION_SAVED_EVENT } from '../lib/events.js';

export function useDashboard({ period = 'week', date = null } = {}) {
  const [today, setToday] = useState(null);
  const [report, setReport] = useState(null);
  const [streak, setStreak] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [todaySessions, setTodaySessions] = useState([]);
  const [loadedKey, setLoadedKey] = useState(null);
  const [error, setError] = useState(null);
  const [reloadKey, setReloadKey] = useState(0);
  const requestKey = `${period}|${date ?? ''}|${reloadKey}`;

  const reload = useCallback(() => {
    setError(null);
    setReloadKey((current) => current + 1);
  }, []);

  useEffect(() => {
    const handleSessionSaved = () => reload();
    window.addEventListener(SESSION_SAVED_EVENT, handleSessionSaved);

    return () => {
      window.removeEventListener(SESSION_SAVED_EVENT, handleSessionSaved);
    };
  }, [reload]);

  useEffect(() => {
    let active = true;
    const controller = new AbortController();

    async function load() {
      try {
        const dashboard = await getDashboard({ signal: controller.signal });
        const periodReport =
          period === 'week' && !date
            ? dashboard.period
            : await getPeriodReport({
                period,
                date,
                signal: controller.signal
              });
        const [periodSessions, dailySessions] = await Promise.all([
          listAllSessions({
            from: periodReport.startDate,
            to: periodReport.endDate,
            signal: controller.signal
          }),
          listAllSessions({
            from: dashboard.today.date,
            to: dashboard.today.date,
            signal: controller.signal
          })
        ]);

        if (active) {
          setToday(dashboard.today);
          setStreak(dashboard.streak);
          setReport(periodReport);
          setSessions(periodSessions);
          setTodaySessions(dailySessions);
          setError(null);
        }
      } catch (requestError) {
        if (requestError.name === 'AbortError') {
          return;
        }

        if (active) {
          setError(requestError);
        }
      } finally {
        if (active) {
          setLoadedKey(requestKey);
        }
      }
    }

    load();

    return () => {
      active = false;
      controller.abort();
    };
  }, [date, period, reloadKey, requestKey]);

  return {
    today,
    report,
    streak,
    sessions,
    todaySessions,
    loading: loadedKey !== requestKey,
    error: loadedKey === requestKey ? error : null,
    reload
  };
}
