export function Button({
  children,
  variant = 'primary',
  loading = false,
  disabled = false,
  type = 'button',
  className = '',
  ...props
}) {
  const variants = {
    primary:
      'bg-emerald-600 text-white hover:bg-emerald-700 focus-visible:outline-emerald-600',
    secondary:
      'border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 focus-visible:outline-slate-500',
    danger:
      'bg-rose-600 text-white hover:bg-rose-700 focus-visible:outline-rose-600'
  };

  return (
    <button
      type={type}
      disabled={disabled || loading}
      className={`inline-flex items-center justify-center rounded-xl px-4 py-2.5 text-sm font-semibold transition focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-60 ${variants[variant]} ${className}`}
      {...props}
    >
      {loading ? 'Procesando…' : children}
    </button>
  );
}
