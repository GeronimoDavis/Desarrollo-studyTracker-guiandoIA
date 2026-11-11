export function FormField({
  label,
  id,
  error,
  hint,
  className = '',
  ...inputProps
}) {
  const descriptionId = error || hint ? `${id}-description` : undefined;

  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="block text-sm font-medium text-slate-700">
        {label}
      </label>
      <input
        id={id}
        aria-invalid={error ? 'true' : 'false'}
        aria-describedby={descriptionId}
        className={`w-full rounded-xl border bg-white px-3.5 py-2.5 text-sm text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 ${
          error ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-100' : 'border-slate-300'
        } ${className}`}
        {...inputProps}
      />
      {error ? (
        <p id={descriptionId} className="text-sm text-rose-700">
          {error}
        </p>
      ) : hint ? (
        <p id={descriptionId} className="text-sm text-slate-500">
          {hint}
        </p>
      ) : null}
    </div>
  );
}
