import { Button } from '../ui/Button.jsx';
import { ErrorBanner } from '../ui/ErrorBanner.jsx';
import { useTimer } from '../../context/useTimer.js';
import { formatLocalDateTime } from '../../lib/dates.js';
import { formatDuration } from '../../utils/format.js';

const STATUS_LABELS = {
  completed: 'Completada',
  abandoned: 'Abandonada'
};

export function SessionSummaryDialog({ subject }) {
  const {
    timer,
    metrics,
    finished,
    saving,
    saveError,
    savedSession,
    saveCurrent,
    retrySave,
    discard
  } = useTimer();

  if (!finished || !timer || !metrics) {
    return null;
  }

  const tooShort = metrics.effectiveSeconds < 60;
  const saved = Boolean(savedSession);
  const errorHint =
    saveError?.code === 'SESSION_OVERLAP'
      ? ' Ese horario se superpone con otra sesión guardada.'
      : saveError?.code === 'SUBJECT_ARCHIVED'
        ? ' La materia está archivada; restaurala y volvé a intentar.'
        : '';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/45 p-4"
      role="presentation"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="session-summary-title"
        className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6 shadow-xl"
      >
        <h2
          id="session-summary-title"
          className="text-xl font-semibold text-slate-900"
        >
          {saved ? 'Sesión guardada' : 'Resumen de la sesión'}
        </h2>

        <div className="mt-4 flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
          <span
            className="h-4 w-4 rounded-full"
            style={{ backgroundColor: subject?.color ?? '#64748B' }}
            aria-hidden="true"
          />
          <div>
            <p className="text-sm font-semibold text-slate-900">
              {subject?.name ?? 'Materia'}
            </p>
            <p className="text-xs text-slate-500">
              {timer.mode === 'fixed' ? 'Modo fijo' : 'Modo libre'}
            </p>
          </div>
        </div>

        <dl className="mt-4 grid grid-cols-2 gap-4 text-sm">
          <div>
            <dt className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
              Estado
            </dt>
            <dd className="mt-1 font-semibold text-slate-900">
              {STATUS_LABELS[timer.finalStatus] ?? '—'}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
              Tiempo efectivo
            </dt>
            <dd className="mt-1 font-semibold text-slate-900">
              {formatDuration(metrics.effectiveSeconds)}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
              Inicio
            </dt>
            <dd className="mt-1 font-semibold text-slate-900">
              {formatLocalDateTime(timer.startedAt)}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
              Fin
            </dt>
            <dd className="mt-1 font-semibold text-slate-900">
              {formatLocalDateTime(timer.endedAt)}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
              Tiempo de reloj
            </dt>
            <dd className="mt-1 font-semibold text-slate-900">
              {formatDuration(metrics.wallSeconds)}
            </dd>
          </div>
          {timer.mode === 'fixed' && timer.plan ? (
            <div>
              <dt className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                Plan
              </dt>
              <dd className="mt-1 font-semibold text-slate-900">
                {timer.plan.targetMinutes} min + {timer.plan.breakCount} ×{' '}
                {timer.plan.breakMinutes} min
              </dd>
            </div>
          ) : null}
        </dl>

        {tooShort ? (
          <div className="mt-4">
            <ErrorBanner message="La sesión tiene menos de 60 segundos efectivos, así que no se puede guardar." />
          </div>
        ) : null}

        {saveError ? (
          <div className="mt-4">
            <ErrorBanner message={`${saveError.message}${errorHint}`} />
          </div>
        ) : null}

        {saved ? (
          <p className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
            La sesión quedó registrada con {formatDuration(metrics.effectiveSeconds)} efectivos.
          </p>
        ) : null}

        <div className="mt-6 flex flex-wrap justify-end gap-3">
          {saved ? (
            <Button onClick={discard}>Nueva sesión</Button>
          ) : (
            <>
              <Button variant="secondary" onClick={discard} disabled={saving}>
                {tooShort ? 'Descartar sesión' : 'Descartar'}
              </Button>
              {!tooShort ? (
                <Button
                  onClick={saveError ? retrySave : saveCurrent}
                  loading={saving}
                >
                  {saveError ? 'Reintentar guardado' : 'Guardar sesión'}
                </Button>
              ) : null}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
