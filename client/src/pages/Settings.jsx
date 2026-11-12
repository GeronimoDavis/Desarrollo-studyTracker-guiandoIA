import { Link } from 'react-router-dom';

export function Settings() {
  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-medium text-emerald-700">Ajustes</p>
        <h2 className="mt-1 text-3xl font-bold tracking-tight text-slate-900">
          Tu cuenta
        </h2>
        <p className="mt-2 max-w-2xl text-slate-600">
          El perfil, la zona horaria y los umbrales del heatmap se van a poder
          editar en la próxima fase.
        </p>
      </div>

      <section className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-10 text-center">
        <h3 className="text-lg font-semibold text-slate-900">
          Ajustes en preparación
        </h3>
        <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-600">
          Mientras tanto, podés seguir usando el dashboard, las materias, el
          temporizador y los reportes.
        </p>
        <Link
          to="/"
          className="mt-5 inline-flex rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600"
        >
          Volver al dashboard
        </Link>
      </section>
    </div>
  );
}
