import { Link } from 'react-router-dom';

const actionClass =
  'rounded-lg px-2.5 py-1.5 text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-500';

export function SubjectCard({
  subject,
  onEdit,
  onArchive,
  onRestore,
  onDelete
}) {
  return (
    <article
      className={`rounded-2xl border border-slate-200 bg-white p-5 shadow-sm ${
        subject.isArchived ? 'opacity-80' : ''
      }`}
    >
      <div className="flex items-start gap-3">
        <span
          className="mt-1 h-3.5 w-3.5 shrink-0 rounded-full"
          style={{ backgroundColor: subject.color }}
          aria-hidden="true"
        />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <Link
              to={`/subjects/${subject.id}`}
              className="text-lg font-semibold text-slate-900 hover:text-emerald-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600"
            >
              {subject.name}
            </Link>
            {subject.isArchived ? (
              <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-800">
                Archivada
              </span>
            ) : null}
          </div>
          <p className="mt-1 text-sm leading-6 text-slate-600">
            {subject.description || 'Sin descripción.'}
          </p>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-1">
        {subject.isArchived ? (
          <>
            <button
              type="button"
              className={actionClass}
              onClick={() => onRestore(subject)}
            >
              Restaurar
            </button>
            <button
              type="button"
              className={`${actionClass} text-rose-700 hover:bg-rose-50 hover:text-rose-800`}
              onClick={() => onDelete(subject)}
            >
              Eliminar
            </button>
          </>
        ) : (
          <>
            <button
              type="button"
              className={actionClass}
              onClick={() => onEdit(subject)}
            >
              Editar
            </button>
            <button
              type="button"
              className={actionClass}
              onClick={() => onArchive(subject)}
            >
              Archivar
            </button>
          </>
        )}
      </div>
    </article>
  );
}
