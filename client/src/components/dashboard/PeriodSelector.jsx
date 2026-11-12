import { formatDateKey } from '../../utils/format.js';

const PERIODS = [
  { value: 'week', label: 'Semana' },
  { value: 'month', label: 'Mes' }
];

export function PeriodSelector({
  period,
  onPeriodChange,
  report,
  today,
  onNavigate
}) {
  const nextDisabled = !report || report.endDate >= today;
  const rangeLabel = report
    ? `${formatDateKey(report.startDate)} – ${formatDateKey(report.endDate)}`
    : 'Cargando período…';

  return (
    <section className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
      <div className="inline-flex rounded-xl bg-slate-100 p-1" role="group" aria-label="Tipo de período">
        {PERIODS.map((item) => (
          <button
            key={item.value}
            type="button"
            aria-pressed={period === item.value}
            onClick={() => onPeriodChange(item.value)}
            className={`rounded-lg px-3 py-1.5 text-sm font-semibold transition ${
              period === item.value
                ? 'bg-white text-emerald-800 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      <div className="flex min-w-0 flex-1 items-center justify-end gap-2">
        <button
          type="button"
          onClick={() => onNavigate(-1)}
          className="rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-500"
          aria-label="Período anterior"
        >
          ←
        </button>
        <p
          className="min-w-0 truncate px-1 text-center text-sm font-semibold text-slate-800"
          aria-live="polite"
        >
          {rangeLabel}
        </p>
        <button
          type="button"
          onClick={() => onNavigate(1)}
          disabled={nextDisabled}
          className="rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-500 disabled:cursor-not-allowed disabled:opacity-40"
          aria-label="Período siguiente"
        >
          →
        </button>
      </div>
    </section>
  );
}
