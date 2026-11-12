import { Link } from 'react-router-dom';

import { EmptyState } from '../ui/EmptyState.jsx';
import {
  formatDateKey,
  formatDuration,
  formatTimeInZone
} from '../../utils/format.js';

const MODE_LABELS = {
  free: 'Libre',
  fixed: 'Fijo'
};

const STATUS_LABELS = {
  completed: 'Completada',
  abandoned: 'Abandonada'
};

export function TodayReport({ today, sessions, timezone }) {
  if (!today) {
    return null;
  }

  const hasActivity = today.totalSeconds > 0;

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
            Hoy
          </p>
          <h3 className="mt-1 text-xl font-semibold text-slate-900">
            {formatDateKey(today.date)}
          </h3>
        </div>
        <div className="rounded-xl bg-emerald-50 px-4 py-3 text-right">
          <p className="text-2xl font-bold text-emerald-800">
            {formatDuration(today.totalSeconds)}
          </p>
          <p className="text-xs font-medium text-emerald-700">
            {today.sessions} {today.sessions === 1 ? 'sesión' : 'sesiones'}
          </p>
        </div>
      </div>

      {!hasActivity ? (
        <div className="mt-5">
          <EmptyState
            title="Todavía no estudiaste hoy"
            action={
              <div className="flex flex-wrap justify-center gap-2">
                <Link
                  to="/timer"
                  className="inline-flex rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600"
                >
                  Iniciar temporizador
                </Link>
                <Link
                  to="/subjects"
                  className="inline-flex rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-500"
                >
                  Ver materias
                </Link>
              </div>
            }
          >
            Cuando termines una sesión de al menos un minuto, va a aparecer acá.
          </EmptyState>
        </div>
      ) : (
        <>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {today.subjects.map((subject) => (
              <div
                key={subject.subjectId}
                className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3"
              >
                <div className="flex items-center gap-2">
                  <span
                    className="h-2.5 w-2.5 rounded-full"
                    style={{ backgroundColor: subject.color }}
                    aria-hidden="true"
                  />
                  <p className="truncate text-sm font-semibold text-slate-900">
                    {subject.name}
                  </p>
                </div>
                <p className="mt-2 text-lg font-bold text-slate-900">
                  {formatDuration(subject.effectiveSeconds)}
                </p>
                <p className="text-xs text-slate-500">
                  {subject.sessions}{' '}
                  {subject.sessions === 1 ? 'sesión' : 'sesiones'}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-6">
            <h4 className="text-sm font-semibold text-slate-900">
              Detalle de sesiones
            </h4>
            {sessions.length === 0 ? (
              <p className="mt-2 text-sm text-slate-600">
                No hay sesiones registradas para hoy.
              </p>
            ) : (
              <ul className="mt-3 divide-y divide-slate-100">
                {sessions.map((session) => (
                  <li
                    key={session.id}
                    className="flex flex-wrap items-center gap-x-3 gap-y-1 py-3"
                  >
                    <span
                      className="h-2.5 w-2.5 shrink-0 rounded-full"
                      style={{
                        backgroundColor: session.subject?.color ?? '#64748B'
                      }}
                      aria-hidden="true"
                    />
                    <span className="min-w-0 flex-1 truncate text-sm font-medium text-slate-900">
                      {session.subject?.name ?? 'Materia'}
                    </span>
                    <span className="text-sm font-semibold text-slate-800">
                      {formatDuration(session.effectiveSeconds)}
                    </span>
                    <span className="w-14 text-right text-xs text-slate-500">
                      {formatTimeInZone(session.startedAt, timezone)}
                    </span>
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600">
                      {MODE_LABELS[session.mode] ?? session.mode}
                    </span>
                    <span
                      className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${
                        session.status === 'abandoned'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-emerald-100 text-emerald-800'
                      }`}
                    >
                      {STATUS_LABELS[session.status] ?? session.status}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </>
      )}
    </section>
  );
}
