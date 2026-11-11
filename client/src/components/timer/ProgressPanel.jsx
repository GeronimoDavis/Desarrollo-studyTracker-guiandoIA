import { formatDuration } from '../../utils/format.js';
import { formatLocalTime } from '../../lib/dates.js';

export function ProgressPanel({ timer, metrics }) {
  const startedTime = formatLocalTime(timer.startedAt);

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="text-sm font-semibold uppercase tracking-[0.14em] text-slate-500">
        Resumen de la sesión
      </h2>

      <dl className="mt-4 grid gap-4 sm:grid-cols-2">
        <div>
          <dt className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
            Inicio
          </dt>
          <dd className="mt-1 text-sm font-semibold text-slate-900">
            {startedTime}
          </dd>
        </div>
        <div>
          <dt className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
            Modo
          </dt>
          <dd className="mt-1 text-sm font-semibold text-slate-900">
            {timer.mode === 'fixed' ? 'Fijo con descansos' : 'Libre'}
          </dd>
        </div>

        {timer.mode === 'fixed' && timer.plan ? (
          <>
            <div>
              <dt className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                Bloques
              </dt>
              <dd className="mt-1 text-sm font-semibold text-slate-900">
                {metrics.blockNumber} de {metrics.totalBlocks}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                Plan
              </dt>
              <dd className="mt-1 text-sm font-semibold text-slate-900">
                {timer.plan.targetMinutes} min + {timer.plan.breakCount} ×{' '}
                {timer.plan.breakMinutes} min
              </dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                Tiempo de reloj previsto
              </dt>
              <dd className="mt-1 text-sm font-semibold text-slate-900">
                {formatDuration(timer.plan.totalWallSeconds)}
              </dd>
            </div>
          </>
        ) : null}

        <div>
          <dt className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
            Tiempo efectivo
          </dt>
          <dd className="mt-1 text-sm font-semibold text-slate-900">
            {formatDuration(metrics.effectiveSeconds)}
          </dd>
        </div>
      </dl>
    </section>
  );
}
