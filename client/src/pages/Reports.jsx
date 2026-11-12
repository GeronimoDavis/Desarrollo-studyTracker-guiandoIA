import { useState } from 'react';
import { Link } from 'react-router-dom';

import { PeriodSelector } from '../components/dashboard/PeriodSelector.jsx';
import { Button } from '../components/ui/Button.jsx';
import { EmptyState } from '../components/ui/EmptyState.jsx';
import { ErrorBanner } from '../components/ui/ErrorBanner.jsx';
import { Spinner } from '../components/ui/Spinner.jsx';
import { useDashboard } from '../hooks/useDashboard.js';
import { addDaysToDateKey, toLocalDateKey } from '../lib/dates.js';
import { buildSessionMatrix, getActiveDaysCount } from '../lib/dashboard.js';
import { formatDateKey, formatDuration } from '../utils/format.js';

export function Reports() {
  const [period, setPeriod] = useState('week');
  const [date, setDate] = useState(null);
  const [subjectFilter, setSubjectFilter] = useState('');
  const { today, report, sessions, loading, error, reload } = useDashboard({
    period,
    date
  });

  const todayKey = today?.date ?? toLocalDateKey();

  function handlePeriodChange(nextPeriod) {
    setPeriod(nextPeriod);
    setDate(null);
    setSubjectFilter('');
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
      setSubjectFilter('');
    }
  }

  const subjects = subjectFilter
    ? (report?.subjects ?? []).filter(
        (subject) => String(subject.subjectId) === subjectFilter
      )
    : (report?.subjects ?? []);
  const filteredSessions = subjectFilter
    ? sessions.filter(
        (session) => String(session.subjectId) === subjectFilter
      )
    : sessions;
  const matrix = buildSessionMatrix({
    days: report?.days ?? [],
    subjects,
    sessions: filteredSessions
  });
  const filteredTotalSeconds = matrix.rows.reduce(
    (total, row) => total + row.totalFromSessions,
    0
  );
  const filteredActiveDays = getActiveDaysCount(
    matrix.rows.map((row) => ({
      date: row.date,
      effectiveSeconds: row.totalFromSessions
    }))
  );
  const noSessions = filteredSessions.length === 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-emerald-700">Reportes</p>
          <h2 className="mt-1 text-3xl font-bold tracking-tight text-slate-900">
            Tu estudio en detalle
          </h2>
          <p className="mt-2 max-w-2xl text-slate-600">
            Revisá cuánto estudiaste cada día y cómo se reparte el tiempo entre
            tus materias.
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

      {loading && !report ? (
        <div className="rounded-2xl border border-slate-200 bg-white px-4 py-10">
          <Spinner label="Cargando reportes…" />
        </div>
      ) : null}

      {report ? (
        <>
          <section className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                Tiempo efectivo
              </p>
              <p className="mt-2 text-2xl font-bold text-slate-900">
                {formatDuration(filteredTotalSeconds)}
              </p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                Sesiones
              </p>
              <p className="mt-2 text-2xl font-bold text-slate-900">
                {filteredSessions.length}
              </p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                Días activos
              </p>
              <p className="mt-2 text-2xl font-bold text-slate-900">
                {filteredActiveDays}
              </p>
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="text-lg font-semibold text-slate-900">
                  Detalle diario
                </h3>
                <p className="mt-1 text-sm text-slate-600">
                  Tiempo efectivo por día y materia.
                </p>
              </div>
              <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
                <span>Materia</span>
                <select
                  value={subjectFilter}
                  onChange={(event) => setSubjectFilter(event.target.value)}
                  className="rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-sm font-medium text-slate-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600"
                >
                  <option value="">Todas</option>
                  {(report.subjects ?? []).map((subject) => (
                    <option key={subject.subjectId} value={subject.subjectId}>
                      {subject.name}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            {noSessions ? (
              <div className="mt-5">
                <EmptyState
                  title={
                    subjectFilter
                      ? 'Sin sesiones de esta materia'
                      : 'Sin sesiones en este período'
                  }
                  action={
                    subjectFilter ? (
                      <Button
                        variant="secondary"
                        onClick={() => setSubjectFilter('')}
                      >
                        Ver todas las materias
                      </Button>
                    ) : (
                      <Link
                        to="/timer"
                        className="inline-flex rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600"
                      >
                        Iniciar una sesión
                      </Link>
                    )
                  }
                >
                  {subjectFilter
                    ? 'Probá con otra materia o cambiá el período.'
                    : 'Cuando registres una sesión, vas a ver el detalle acá.'}
                </EmptyState>
              </div>
            ) : (
              <div className="mt-5 overflow-x-auto">
                <table className="w-full min-w-max border-collapse text-left text-sm">
                  <caption className="sr-only">
                    Tiempo efectivo por día y materia del período
                  </caption>
                  <thead>
                    <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500">
                      <th scope="col" className="whitespace-nowrap px-3 py-3">
                        Día
                      </th>
                      {matrix.subjects.map((subject) => (
                        <th
                          key={subject.subjectId}
                          scope="col"
                          className="whitespace-nowrap px-3 py-3"
                        >
                          <span className="inline-flex items-center gap-2">
                            <span
                              className="h-2 w-2 rounded-full"
                              style={{ backgroundColor: subject.color }}
                              aria-hidden="true"
                            />
                            {subject.name}
                          </span>
                        </th>
                      ))}
                      <th scope="col" className="whitespace-nowrap px-3 py-3">
                        Total
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {matrix.rows.map((row) => (
                      <tr
                        key={row.date}
                        className="border-b border-slate-100 text-slate-700"
                      >
                        <th
                          scope="row"
                          className="whitespace-nowrap px-3 py-2.5 font-medium text-slate-900"
                        >
                          {formatDateKey(row.date)}
                        </th>
                        {matrix.subjects.map((subject) => (
                          <td
                            key={subject.subjectId}
                            className="whitespace-nowrap px-3 py-2.5"
                          >
                            {formatDuration(
                              row.subjects[subject.subjectId]?.seconds ?? 0
                            )}
                          </td>
                        ))}
                        <td className="whitespace-nowrap px-3 py-2.5 font-semibold text-slate-900">
                          {formatDuration(row.totalFromSessions)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="border-t-2 border-slate-200 text-slate-900">
                      <th scope="row" className="px-3 py-3 text-left font-semibold">
                        Total
                      </th>
                      {matrix.subjects.map((subject) => (
                        <td
                          key={subject.subjectId}
                          className="whitespace-nowrap px-3 py-3 font-semibold"
                        >
                          {formatDuration(
                            matrix.totalsBySubject[subject.subjectId]?.seconds ??
                              0
                          )}
                        </td>
                      ))}
                      <td className="whitespace-nowrap px-3 py-3 font-bold">
                        {formatDuration(filteredTotalSeconds)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}

            {loading && report ? (
              <p className="mt-3 text-xs text-slate-500">Actualizando…</p>
            ) : null}
          </section>
        </>
      ) : null}
    </div>
  );
}
