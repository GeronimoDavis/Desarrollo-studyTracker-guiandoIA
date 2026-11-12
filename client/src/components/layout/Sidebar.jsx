import { NavLink } from 'react-router-dom';

import { NavIcon } from './NavIcon.jsx';
import { NAV_ITEMS } from './navItems.js';

function linkClass({ isActive }) {
  return `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition ${
    isActive
      ? 'bg-emerald-50 text-emerald-800'
      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
  }`;
}

export function Sidebar({ timerActive }) {
  return (
    <aside className="hidden w-64 shrink-0 border-r border-slate-200 bg-white lg:flex lg:min-h-screen lg:flex-col">
      <div className="flex items-center gap-3 px-5 py-5">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-600 text-sm font-bold text-white">
          SE
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700">
            Tracker
          </p>
          <p className="text-base font-semibold leading-tight text-slate-900">
            Seguimiento de Estudio
          </p>
        </div>
      </div>

      <nav className="flex flex-col gap-1 px-3" aria-label="Navegación principal">
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={linkClass}
          >
            <NavIcon name={item.icon} />
            <span>{item.label}</span>
            {item.to === '/timer' && timerActive ? (
              <span
                className="ml-auto h-2.5 w-2.5 rounded-full bg-emerald-500"
                aria-label="Sesión activa"
              />
            ) : null}
          </NavLink>
        ))}
      </nav>

      <p className="mt-auto px-5 py-6 text-xs leading-5 text-slate-500">
        Registrá tu tiempo, mantené la racha y mirá tu progreso.
      </p>
    </aside>
  );
}
