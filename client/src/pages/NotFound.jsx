import { Link } from 'react-router-dom';

export function NotFound() {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
      <p className="text-sm font-semibold uppercase tracking-[0.18em] text-emerald-700">
        404
      </p>
      <h2 className="mt-2 text-2xl font-bold text-slate-900">
        Página no encontrada
      </h2>
      <p className="mt-2 text-slate-600">
        La ruta que buscás no existe o fue movida.
      </p>
      <Link
        to="/"
        className="mt-6 inline-flex rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600"
      >
        Volver al inicio
      </Link>
    </section>
  );
}
