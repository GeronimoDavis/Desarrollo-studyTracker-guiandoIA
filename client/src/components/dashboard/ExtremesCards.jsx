import { formatDateKey, formatDuration } from '../../utils/format.js';

function ExtremeCard({ title, day, tone }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
        {title}
      </p>
      {day ? (
        <>
          <p className="mt-2 text-2xl font-bold text-slate-900">
            {formatDuration(day.effectiveSeconds)}
          </p>
          <p className="mt-1 text-sm text-slate-600">
            {formatDateKey(day.date)}
          </p>
        </>
      ) : (
        <p className={`mt-2 text-sm font-medium ${tone}`}>
          Sin datos suficientes en el período.
        </p>
      )}
    </div>
  );
}

export function ExtremesCards({ extremes }) {
  return (
    <section className="grid gap-4 sm:grid-cols-2">
      <ExtremeCard
        title="Día con más estudio"
        day={extremes?.most}
        tone="text-emerald-700"
      />
      <ExtremeCard
        title="Día con menos estudio"
        day={extremes?.least}
        tone="text-amber-700"
      />
    </section>
  );
}
