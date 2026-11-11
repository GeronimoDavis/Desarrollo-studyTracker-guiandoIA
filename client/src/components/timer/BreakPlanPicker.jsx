import { FIXED_BREAK_MINUTES, buildBreakPlan } from '../../lib/timer/breakPlan.js';
import { formatDuration } from '../../utils/format.js';

export function BreakPlanPicker({
  targetMinutes,
  breakMinutes,
  onChange,
  disabled
}) {
  const plan = buildBreakPlan(targetMinutes, breakMinutes);

  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-medium text-slate-700">Descanso entre bloques</p>
        <div className="flex gap-2">
          {FIXED_BREAK_MINUTES.map((minutes) => {
            const selected = breakMinutes === minutes;

            return (
              <button
                key={minutes}
                type="button"
                onClick={() => onChange(minutes)}
                disabled={disabled}
                aria-pressed={selected}
                className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600 disabled:cursor-not-allowed disabled:opacity-60 ${
                  selected
                    ? 'border-emerald-500 bg-white text-emerald-800'
                    : 'border-slate-300 bg-white text-slate-600 hover:bg-slate-100'
                }`}
              >
                {minutes} min
              </button>
            );
          })}
        </div>
      </div>

      <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-3">
        <div>
          <dt className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
            Bloques
          </dt>
          <dd className="mt-1 font-semibold text-slate-900">
            {plan.blocks.length} de estudio
          </dd>
        </div>
        <div>
          <dt className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
            Descansos
          </dt>
          <dd className="mt-1 font-semibold text-slate-900">
            {plan.breakCount} × {breakMinutes} min
          </dd>
        </div>
        <div>
          <dt className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
            Tiempo de reloj
          </dt>
          <dd className="mt-1 font-semibold text-slate-900">
            {formatDuration(plan.totalWallSeconds)}
          </dd>
        </div>
      </dl>

      <p className="mt-3 text-xs text-slate-500">
        Los descansos no suman tiempo efectivo. El último bloque absorbe los
        segundos que sobren.
      </p>
    </div>
  );
}
