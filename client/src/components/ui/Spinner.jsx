export function Spinner({ label = 'Cargando…' }) {
  return (
    <div className="flex items-center justify-center gap-3 text-sm text-slate-600">
      <span
        className="h-5 w-5 animate-spin rounded-full border-2 border-slate-300 border-t-emerald-600"
        aria-hidden="true"
      />
      <span>{label}</span>
    </div>
  );
}
