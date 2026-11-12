import { NavLink } from 'react-router-dom';

import { NavIcon } from './NavIcon.jsx';
import { NAV_ITEMS } from './navItems.js';

function linkClass({ isActive }) {
  return `relative flex min-w-0 flex-1 flex-col items-center justify-center gap-0.5 rounded-lg px-1 py-2 text-[11px] font-semibold transition ${
    isActive
      ? 'bg-emerald-50 text-emerald-800'
      : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
  }`;
}

export function BottomNav({ timerActive }) {
  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-30 border-t border-slate-200 bg-white/95 px-1 pb-[env(safe-area-inset-bottom)] pt-1 backdrop-blur lg:hidden"
      aria-label="Navegación principal"
    >
      <div className="mx-auto flex max-w-lg items-stretch">
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={linkClass}
          >
            <span className="relative">
              <NavIcon name={item.icon} className="h-5 w-5" />
              {item.to === '/timer' && timerActive ? (
                <span
                  className="absolute -right-1 -top-0.5 h-2 w-2 rounded-full bg-emerald-500"
                  aria-label="Sesión activa"
                />
              ) : null}
            </span>
            <span className="truncate">{item.shortLabel ?? item.label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
