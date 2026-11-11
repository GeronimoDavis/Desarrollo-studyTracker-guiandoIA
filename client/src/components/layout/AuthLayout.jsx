import { Link } from 'react-router-dom';

export function AuthLayout({ title, subtitle, children, footer }) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-10">
      <div className="w-full max-w-md">
        <Link
          to="/"
          className="mx-auto mb-8 flex w-fit items-center gap-3 rounded-xl focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-emerald-600"
        >
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-600 text-sm font-bold text-white">
            SE
          </span>
          <span>
            <span className="block text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700">
              Tracker
            </span>
            <span className="block text-lg font-semibold text-slate-900">
              Seguimiento de Estudio
            </span>
          </span>
        </Link>

        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            {title}
          </h1>
          {subtitle ? (
            <p className="mt-2 text-sm leading-6 text-slate-600">{subtitle}</p>
          ) : null}
          <div className="mt-6">{children}</div>
        </section>

        {footer ? (
          <div className="mt-6 text-center text-sm text-slate-600">{footer}</div>
        ) : null}
      </div>
    </main>
  );
}
