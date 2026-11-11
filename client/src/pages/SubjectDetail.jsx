import { Link, useParams } from 'react-router-dom';

import { Button } from '../components/ui/Button.jsx';
import { ErrorBanner } from '../components/ui/ErrorBanner.jsx';
import { Spinner } from '../components/ui/Spinner.jsx';
import { useSubjectSummary } from '../hooks/useSubjectSummary.js';
import {
  formatDateKey,
  formatDateTime,
  formatDuration
} from '../utils/format.js';

const MODE_LABELS = {
  free: 'Libre',
  fixed: 'Fijo'
};

const STATUS_LABELS = {
  completed: 'Completada',
  abandoned: 'Abandonada'
};

function PeriodCard({ title, period }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
        {title}
      </p>
      <p className="mt-2 text-2xl font-bold text-slate-900">
        {formatDuration(period.effectiveSeconds)}
      </p>
      <p className="mt-1 text-sm text-slate-600">
        {period.sessions} {period.sessions === 1 ? 'sesión' : 'sesiones'}
      </p>
      <p className="mt-3 text-xs text-slate-500">
        {formatDateKey(period.start)} – {formatDateKey(period.end)}
      </p>
    </div>
  );
}

export function SubjectDetail() {
  const { id } = useParams();
  const { subject, stats, loading, error, reload } = useSubjectSummary(id);

  return (
    <div className="space-y-6">
      <Link
        to="/subjects"
        className="inline-flex text-sm font-semibold text-emerald-700 hover:text-emerald-800"
      >
        ← Volver a materias
      </Link>

      {error ? (
        <div className="space-y-3">
          <ErrorBanner message={error.message} />
          <Button variant="secondary" onClick={reload}>
            Reintentar
          </Button>
        </div>
      ) : null}

      {loading ? (
        <div className="rounded-2xl border border-slate-200 bg-white px-4 py-10">
          <Spinner label="Cargando el detalle de la materia…" />
        </div>
      ) : null}

      {!loading && subject ? (
        <>
          <header className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex flex-wrap items-start gap-4">
              <span
                className="mt-2 h-5 w-5 shrink-0 rounded-full"
                style={{ backgroundColor: subject.color }}
                aria-hidden="true"
              />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-3xl font-bold tracking-tight text-slate-900">
                    {subject.name}
                  </h2>
                  {subject.isArchived ? (
                    <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-800">
                      Archivada
                    </span>
                  ) : null}
                </div>
                <p className="mt-2 max-w-2xl text-slate-600">
                  {subject.description || 'Sin descripción.'}
                </p>
                {subject.isArchived ? (
                  <p className="mt-3 text-sm text-amber-800">
                    Esta materia está archivada. Restaurala desde la lista de
                    materias para volver a usarla.
                  </p>
                ) : null}
              </div>
            </div>
          </header>

          {stats ? (
            <>
              <section className="grid gap-4 sm:grid-cols-3">
                <PeriodCard title="Esta semana" period={stats.week} />
                <PeriodCard title="Este mes" period={stats.month} />
                <PeriodCard title="Este año" period={stats.year} />
              </section>

              <section className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                    Último día de estudio
                  </p>
                  <p className="mt-2 text-2xl font-bold text-slate-900">
                    {stats.lastStudyDate
                      ? formatDateKey(stats.lastStudyDate)
                      : 'Sin sesiones'}
                  </p>
                  <p className="mt-1 text-sm text-slate-600">
                    Hoy es {formatDateKey(stats.today)}.
                  </p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                    Sesiones totales
                  </p>
                  <p className="mt-2 text-2xl font-bold text-slate-900">
                    {stats.totalSessions}
                  </p>
                  <p className="mt-1 text-sm text-slate-600">
                    Incluye sesiones completadas y abandonadas.
                  </p>
                </div>
              </section>

              <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900">
                      Últimas sesiones
                    </h3>
                    <p className="mt-1 text-sm text-slate-600">
                      Las cinco sesiones más recientes de esta materia.
                    </p>
                  </div>
                  <Link
                    to="/reports"
                    className="text-sm font-semibold text-emerald-700 hover:text-emerald-800"
                  >
                    Ver reportes
                  </Link>
                </div>

                {stats.recentSessions.length === 0 ? (
                  <p className="mt-5 rounded-xl bg-slate-50 px-4 py-6 text-center text-sm text-slate-600">
                    Todavía no hay sesiones registradas para esta materia.
                  </p>
                ) : (
                  <ul className="mt-4 divide-y divide-slate-100">
                    {stats.recentSessions.map((session) => (
                      <li
                        key={session.id}
                        className="flex flex-wrap items-center justify-between gap-3 py-3"
                      >
                        <div>
                          <p className="text-sm font-medium text-slate-900">
                            {formatDateKey(session.sessionDate)}
                          </p>
                          <p className="text-xs text-slate-500">
                            {formatDateTime(session.startedAt)} ·{' '}
                            {MODE_LABELS[session.mode] ?? session.mode}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-semibold text-slate-900">
                            {formatDuration(session.effectiveSeconds)}
                          </p>
                          <p
                            className={`text-xs ${
                              session.status === 'completed'
                                ? 'text-emerald-700'
                                : 'text-amber-700'
                            }`}
                          >
                            {STATUS_LABELS[session.status] ?? session.status}
                          </p>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            </>
          ) : null}
        </>
      ) : null}
    </div>
  );
}
