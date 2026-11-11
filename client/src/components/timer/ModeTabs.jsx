const MODES = [
  { value: 'free', label: 'Libre', hint: 'Cuenta hacia arriba' },
  { value: 'fixed', label: 'Fijo', hint: 'Bloques con descansos' }
];

export function ModeTabs({ value, onChange, disabled }) {
  return (
    <div>
      <p className="text-sm font-medium text-slate-700">Modo</p>
      <div className="mt-2 grid gap-2 sm:grid-cols-2">
        {MODES.map((mode) => {
          const selected = value === mode.value;

          return (
            <button
              key={mode.value}
              type="button"
              onClick={() => onChange(mode.value)}
              disabled={disabled}
              aria-pressed={selected}
              className={`rounded-xl border px-4 py-3 text-left transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600 disabled:cursor-not-allowed disabled:opacity-60 ${
                selected
                  ? 'border-emerald-500 bg-emerald-50 text-emerald-900'
                  : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
              }`}
            >
              <span className="block text-sm font-semibold">{mode.label}</span>
              <span className="mt-0.5 block text-xs text-slate-500">
                {mode.hint}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
