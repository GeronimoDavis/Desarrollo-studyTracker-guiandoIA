import { useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';

import { RecoveryDialog } from '../timer/RecoveryDialog.jsx';
import { TimerNavigationGuard } from '../timer/TimerNavigationGuard.jsx';
import { useAuth } from '../../context/useAuth.js';
import { useTimer } from '../../context/useTimer.js';
import { BottomNav } from './BottomNav.jsx';
import { Sidebar } from './Sidebar.jsx';

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
    <div className="min-h-screen bg-slate-50 lg:flex">
      <TimerNavigationGuard />
      <RecoveryDialog />
      <Sidebar timerActive={timerActive} />

      <div className="flex min-h-screen w-full flex-col lg:min-w-0 lg:flex-1">
        <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/90 backdrop-blur">
          <div className="flex items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-8">
            <div className="flex items-center gap-3 lg:hidden">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-600 text-xs font-bold text-white">
                SE
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700">
                  Tracker
                </p>
                <p className="text-sm font-semibold leading-tight text-slate-900">
                  Seguimiento de Estudio
                </p>
              </div>
            </div>

            <div className="hidden lg:block">
              <p className="text-sm font-medium text-slate-500">
                Tu espacio de estudio
              </p>
            </div>

            <div className="flex items-center gap-2 sm:gap-3">
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

        <main className="mx-auto w-full max-w-7xl flex-1 px-4 pb-24 pt-6 sm:px-6 lg:px-8 lg:pb-8 lg:pt-8">
          <Outlet />
        </main>

        <footer className="hidden border-t border-slate-200 bg-white px-6 py-4 text-sm text-slate-500 lg:block lg:px-8">
          {user ? `Sesión de ${user.name}` : 'Seguimiento de Estudio'}
        </footer>
      </div>

      <BottomNav timerActive={timerActive} />
    </div>
  );
}
