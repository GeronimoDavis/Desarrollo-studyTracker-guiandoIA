import { FIXED_TARGETS } from '../../lib/timer/breakPlan.js';

function formatTarget(minutes) {
  if (minutes < 60) {
    return `${minutes} min`;
  }

  const hours = minutes / 60;
  return `${hours} h`;
}

export function DurationPicker({ value, onChange, disabled }) {
  return (
    <div>
      <p className="text-sm font-medium text-slate-700">Duración objetivo</p>
      <div className="mt-2 grid grid-cols-3 gap-2">
        {FIXED_TARGETS.map((minutes) => {
          const selected = value === minutes;

          return (
            <button
              key={minutes}
              type="button"
              onClick={() => onChange(minutes)}
              disabled={disabled}
              aria-pressed={selected}
              className={`rounded-xl border px-3 py-2 text-sm font-semibold transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600 disabled:cursor-not-allowed disabled:opacity-60 ${
                selected
                  ? 'border-emerald-500 bg-emerald-50 text-emerald-900'
                  : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
              }`}
            >
              {formatTarget(minutes)}
            </button>
          );
        })}
      </div>
    </div>
  );
}
