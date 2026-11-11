import { useEffect, useState } from 'react';

import { getHealth } from '../api/health.js';
import { useAuth } from '../context/useAuth.js';

export function Dashboard() {
  const { user } = useAuth();
  const [health, setHealth] = useState({
    status: 'loading',
    message: 'Verificando conexión con la API…'
  });

  useEffect(() => {
    const controller = new AbortController();

    getHealth({ signal: controller.signal })
      .then(() => {
        setHealth({
          status: 'ok',
          message: 'API y base de datos conectadas correctamente.'
        });
      })
      .catch((error) => {
        if (error.name === 'AbortError') {
          return;
        }

        setHealth({
          status: 'error',
          message: error.message
        });
      });

    return () => controller.abort();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-medium text-emerald-700">Fase 1</p>
        <h2 className="mt-1 text-3xl font-bold tracking-tight text-slate-900">
          Hola, {user?.name}
        </h2>
        <p className="mt-2 max-w-2xl text-slate-600">
          Tu cuenta está activa. El dashboard de estudio, las materias y el
          temporizador se implementan en las fases siguientes.
        </p>
      </div>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-start gap-3">
          <span
            className={`mt-1 h-3 w-3 shrink-0 rounded-full ${
              health.status === 'ok'
                ? 'bg-emerald-500'
                : health.status === 'error'
                  ? 'bg-rose-500'
                  : 'animate-pulse bg-amber-400'
            }`}
            aria-hidden="true"
          />
          <div>
            <h3 className="font-semibold text-slate-900">
              Estado de la conexión
            </h3>
            <p
              className={`mt-1 text-sm ${
                health.status === 'error' ? 'text-rose-700' : 'text-slate-600'
              }`}
            >
              {health.message}
            </p>
          </div>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
            Cuenta
          </p>
          <p className="mt-2 text-lg font-semibold text-slate-900">
            {user?.name}
          </p>
          <p className="text-sm text-slate-600">{user?.email}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
            Zona horaria
          </p>
          <p className="mt-2 text-lg font-semibold text-slate-900">
            {user?.timezone}
          </p>
          <p className="text-sm text-slate-600">
            Se usa para calcular tus días, rachas y reportes.
          </p>
        </div>
      </section>
    </div>
  );
}
