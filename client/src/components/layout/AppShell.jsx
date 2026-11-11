import { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';

import { RecoveryDialog } from '../timer/RecoveryDialog.jsx';
import { TimerNavigationGuard } from '../timer/TimerNavigationGuard.jsx';
import { useAuth } from '../../context/useAuth.js';
import { useTimer } from '../../context/useTimer.js';

export function AppShell() {
  const { user, logout } = useAuth();
  const { active: timerActive } = useTimer();
  const navigate = useNavigate();
  const [loggingOut, setLoggingOut] = useState(false);

  async function handleLogout() {
    setLoggingOut(true);

    try {
      await logout();
      navigate('/login', { replace: true });
    } finally {
      setLoggingOut(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <TimerNavigationGuard />
      <RecoveryDialog />

      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex w-full max-w-5xl flex-wrap items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-600 text-sm font-bold text-white">
              SE
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700">
                Tracker
              </p>
              <h1 className="text-lg font-semibold text-slate-900">
                Seguimiento de Estudio
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden text-right sm:block">
              <p className="text-sm font-medium text-slate-900">{user?.name}</p>
              <p className="text-xs text-slate-500">{user?.email}</p>
            </div>
            <button
              type="button"
              onClick={handleLogout}
              disabled={loggingOut}
              className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-500 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loggingOut ? 'Saliendo…' : 'Cerrar sesión'}
            </button>
          </div>
        </div>
      </header>

      <nav className="border-t border-slate-100 bg-white">
        <div className="mx-auto flex w-full max-w-5xl gap-1 px-4 py-2 sm:px-6">
          <NavLink
            to="/"
            end
            className={({ isActive }) =>
              `rounded-lg px-3 py-2 text-sm font-semibold transition ${
                isActive
                  ? 'bg-emerald-50 text-emerald-800'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`
            }
          >
            Inicio
          </NavLink>
          <NavLink
            to="/subjects"
            className={({ isActive }) =>
              `rounded-lg px-3 py-2 text-sm font-semibold transition ${
                isActive
                  ? 'bg-emerald-50 text-emerald-800'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`
            }
          >
            Materias
          </NavLink>
          <NavLink
            to="/timer"
            className={({ isActive }) =>
              `rounded-lg px-3 py-2 text-sm font-semibold transition ${
                isActive
                  ? 'bg-emerald-50 text-emerald-800'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`
            }
          >
            Temporizador
            {timerActive ? (
              <span
                className="ml-2 inline-block h-2 w-2 rounded-full bg-emerald-500"
                aria-label="Sesión activa"
              />
            ) : null}
          </NavLink>
        </div>
      </nav>

      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8 sm:px-6">
        <Outlet />
      </main>

      <footer className="border-t border-slate-200 bg-white">
        <div className="mx-auto w-full max-w-5xl px-4 py-4 text-sm text-slate-500 sm:px-6">
          {user ? `Sesión de ${user.name}` : 'Seguimiento de Estudio'}
        </div>
      </footer>
    </div>
  );
}
