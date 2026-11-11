import { formatClockLong } from '../../lib/timeFormat.js';
import { formatDuration } from '../../utils/format.js';

const PHASE_LABELS = {
  study: 'Estudio',
  paused: 'En pausa',
  break: 'Descanso',
  finished: 'Finalizada'
};

function getTitle(timer, metrics) {
  if (timer.status === 'finished') {
    return timer.finalStatus === 'abandoned'
      ? 'Sesión abandonada'
      : 'Sesión completada';
  }

  if (timer.mode === 'fixed' && timer.status === 'study') {
    return `Bloque ${metrics.blockNumber} de ${metrics.totalBlocks}`;
  }

  if (timer.mode === 'fixed' && timer.status === 'break') {
    return 'Descanso';
  }

  return PHASE_LABELS[timer.status] ?? 'Estudio';
}

function getMainSeconds(timer, metrics) {
  if (
    timer.mode === 'fixed' &&
    (timer.status === 'study' || timer.status === 'break')
  ) {
    return metrics.phaseRemainingSeconds ?? 0;
  }

  return metrics.effectiveSeconds;
}

export function TimerDisplay({ timer, metrics, subject }) {
  const title = getTitle(timer, metrics);
  const mainSeconds = getMainSeconds(timer, metrics);
  const phaseDescription =
    timer.mode === 'fixed' &&
    (timer.status === 'study' || timer.status === 'break')
      ? timer.status === 'study'
        ? 'Tiempo restante del bloque'
        : 'Tiempo restante del descanso'
      : 'Tiempo efectivo';

  return (
    <section
      className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
      aria-live="polite"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span
            className="h-4 w-4 rounded-full"
            style={{ backgroundColor: subject?.color ?? '#64748B' }}
            aria-hidden="true"
          />
          <div>
            <p className="text-sm font-semibold text-slate-900">
              {subject?.name ?? 'Materia'}
            </p>
            <p className="text-xs text-slate-500">{title}</p>
          </div>
        </div>
        <span
          className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
            timer.status === 'break'
              ? 'bg-amber-100 text-amber-800'
              : timer.status === 'paused'
                ? 'bg-slate-100 text-slate-700'
                : 'bg-emerald-100 text-emerald-800'
          }`}
        >
          {timer.mode === 'fixed' ? 'Fijo' : 'Libre'}
        </span>
      </div>

      <div className="py-8 text-center">
        <p className="text-sm font-medium text-slate-500">{phaseDescription}</p>
        <p className="mt-2 font-mono text-6xl font-bold tracking-tight text-slate-900 tabular-nums sm:text-7xl">
          {formatClockLong(mainSeconds)}
        </p>

        <div className="mt-4 flex flex-wrap items-center justify-center gap-x-5 gap-y-1 text-sm text-slate-600">
          <span>
            Efectivo: <strong>{formatDuration(metrics.effectiveSeconds)}</strong>
          </span>
          <span>
            Reloj: <strong>{formatDuration(metrics.wallSeconds)}</strong>
          </span>
        </div>
      </div>

      {timer.mode === 'fixed' ? (
        <div>
          <div className="flex items-center justify-between gap-3 text-xs font-semibold text-slate-500">
            <span>Progreso de la sesión</span>
            <span>{Math.round(metrics.progress * 100)}%</span>
          </div>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-emerald-500 transition-[width] duration-500"
              style={{ width: `${Math.round(metrics.progress * 100)}%` }}
            />
          </div>
        </div>
      ) : null}
    </section>
  );
}
