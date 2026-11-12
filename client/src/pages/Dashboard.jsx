import { useState } from 'react';
import { Link } from 'react-router-dom';

import { ExtremesCards } from '../components/dashboard/ExtremesCards.jsx';
import { Heatmap } from '../components/dashboard/Heatmap.jsx';
import { PeriodBarChart } from '../components/dashboard/PeriodBarChart.jsx';
import { PeriodSelector } from '../components/dashboard/PeriodSelector.jsx';
import { StreakCard } from '../components/dashboard/StreakCard.jsx';
import { SubjectDonut } from '../components/dashboard/SubjectDonut.jsx';
import { TodayReport } from '../components/dashboard/TodayReport.jsx';
import { Button } from '../components/ui/Button.jsx';
import { ErrorBanner } from '../components/ui/ErrorBanner.jsx';
import { Spinner } from '../components/ui/Spinner.jsx';
import { useAuth } from '../context/useAuth.js';
import { useDashboard } from '../hooks/useDashboard.js';
import { useHeatmap } from '../hooks/useHeatmap.js';
import {
  addDaysToDateKey,
  getDateKeyYear,
  toLocalDateKey
} from '../lib/dates.js';

export function Dashboard() {
  const { user } = useAuth();
  const [period, setPeriod] = useState('week');
  const [date, setDate] = useState(null);
  const [heatmapYear, setHeatmapYear] = useState(null);
  const {
    today,
    report,
    streak,
    sessions,
    todaySessions,
    loading,
    error,
    reload
  } = useDashboard({ period, date });
  const {
    heatmap,
    loading: heatmapLoading,
    error: heatmapError,
    reload: reloadHeatmap
  } = useHeatmap(heatmapYear);

  const todayKey = today?.date ?? toLocalDateKey();
  const currentYear = getDateKeyYear(todayKey) ?? 1970;
  const years = Array.from({ length: 6 }, (_, index) => currentYear - index);

  function handlePeriodChange(nextPeriod) {
    setPeriod(nextPeriod);
    setDate(null);
  }

  function handleNavigate(direction) {
    if (!report) {
      return;
    }

    const targetDate =
      direction < 0
        ? addDaysToDateKey(report.startDate, -1)
        : addDaysToDateKey(report.endDate, 1);

    if (targetDate) {
      setDate(targetDate);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-emerald-700">Dashboard</p>
          <h2 className="mt-1 text-3xl font-bold tracking-tight text-slate-900">
            Hola, {user?.name}
          </h2>
          <p className="mt-2 max-w-2xl text-slate-600">
            Este es tu resumen de estudio. Empezá un bloque, mantené la racha y
            mirá cómo avanza tu año.
          </p>
        </div>
        <Link
          to="/timer"
          className="inline-flex rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600"
        >
          Iniciar temporizador
        </Link>
      </div>

      {error ? (
        <div className="space-y-3">
          <ErrorBanner message={error.message} />
          <Button variant="secondary" onClick={reload}>
            Reintentar
          </Button>
        </div>
      ) : null}

      <PeriodSelector
        period={period}
        onPeriodChange={handlePeriodChange}
        report={report}
        today={todayKey}
        onNavigate={handleNavigate}
      />

      {loading && !today ? (
        <div className="rounded-2xl border border-slate-200 bg-white px-4 py-10">
          <Spinner label="Cargando tu dashboard…" />
        </div>
      ) : null}

      {today && report && streak ? (
        <>
          <section className="grid gap-4 xl:grid-cols-[minmax(0,2fr)_minmax(18rem,1fr)]">
            <TodayReport
              today={today}
              sessions={todaySessions}
              timezone={user?.timezone}
            />
            <StreakCard streak={streak} />
          </section>

          <section className="grid gap-4 xl:grid-cols-[minmax(0,2fr)_minmax(18rem,1fr)]">
            <PeriodBarChart report={report} sessions={sessions} />
            <SubjectDonut report={report} />
          </section>

          <ExtremesCards extremes={report.extremes} />

          <Heatmap
            heatmap={heatmap}
            loading={heatmapLoading}
            error={heatmapError}
            year={heatmapYear ?? heatmap?.year ?? currentYear}
            years={
              heatmap &&
              !years.includes(heatmap.year)
                ? [heatmap.year, ...years]
                : years
            }
            onYearChange={setHeatmapYear}
            onRetry={reloadHeatmap}
          />

          {loading ? (
            <p className="text-xs text-slate-500">Actualizando datos…</p>
          ) : null}
        </>
      ) : null}
    </div>
  );
}
