import { Link, isRouteErrorResponse, useRouteError } from 'react-router-dom';

export function RouteErrorElement() {
  const error = useRouteError();
  const status = isRouteErrorResponse(error) ? error.status : null;
  const title = status ? `Error ${status}` : 'Algo salió mal';
  const message = isRouteErrorResponse(error)
    ? error.statusText || 'No pudimos cargar esta sección.'
    : 'La aplicación encontró un error inesperado.';

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-10">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-sm">
        <p className="text-sm font-medium text-emerald-700">
          Sistema de Seguimiento de Estudio
        </p>
        <h1 className="mt-2 text-2xl font-bold text-slate-900">{title}</h1>
        <p className="mt-3 text-sm leading-6 text-slate-600">{message}</p>
        <div className="mt-5 flex flex-wrap justify-center gap-2">
          <Link
            to="/"
            className="inline-flex rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600"
          >
            Ir al inicio
          </Link>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="inline-flex rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-500"
          >
            Recargar la página
          </button>
        </div>
      </div>
    </div>
  );
}
