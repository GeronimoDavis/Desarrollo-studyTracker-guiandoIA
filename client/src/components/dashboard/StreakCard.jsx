import { Link } from 'react-router-dom';

import { addDaysToDateKey } from '../../lib/dates.js';
import { formatDateKey } from '../../utils/format.js';

export function StreakCard({ streak }) {
  if (!streak) {
    return null;
  }

  const studiedToday = streak.lastCompletedDate === streak.today;
  const yesterday = addDaysToDateKey(streak.today, -1);
  const streakAlive = !studiedToday && streak.lastCompletedDate === yesterday;

  let message = 'Empezá una sesión para iniciar tu racha.';
  let messageClass = 'text-slate-600';

  if (studiedToday) {
    message = 'Estudiaste hoy. ¡Mantené la racha!';
    messageClass = 'text-emerald-700';
  } else if (streakAlive) {
    message = 'Tu racha sigue viva. Todavía podés estudiar hoy.';
    messageClass = 'text-amber-700';
  }

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
            Racha
          </p>
          <p className="mt-2 text-4xl font-bold text-slate-900">
            {streak.current}
          </p>
          <p className="text-sm text-slate-500">
            {streak.current === 1 ? 'día consecutivo' : 'días consecutivos'}
          </p>
        </div>
        <div className="rounded-xl bg-slate-50 px-3 py-2 text-right">
          <p className="text-xs font-medium text-slate-500">Mejor racha</p>
          <p className="text-lg font-bold text-slate-900">{streak.best}</p>
        </div>
      </div>

      <p className={`mt-4 text-sm font-medium ${messageClass}`}>{message}</p>
      <p className="mt-2 text-xs text-slate-500">
        {streak.lastCompletedDate
          ? `Último día completado: ${formatDateKey(streak.lastCompletedDate)}`
          : 'Todavía no completaste ningún día.'}
      </p>

      {!studiedToday ? (
        <Link
          to="/timer"
          className="mt-4 inline-flex text-sm font-semibold text-emerald-700 hover:text-emerald-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600"
        >
          Estudiar ahora →
        </Link>
      ) : null}
    </section>
  );
}
