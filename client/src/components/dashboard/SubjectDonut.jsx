import { getDonutSegments } from '../../lib/dashboard.js';
import { formatDuration } from '../../utils/format.js';
import { EmptyState } from '../ui/EmptyState.jsx';
import { ChartDataTable } from './ChartDataTable.jsx';

export function SubjectDonut({ report }) {
  if (!report) {
    return null;
  }

  const segments = getDonutSegments(report.subjects);
  const hasActivity = report.totalSeconds > 0;

  const tableRows = segments.map((segment) => ({
    id: segment.subjectId,
    subject: segment.name,
    time: formatDuration(segment.effectiveSeconds),
    percent: `${Math.round(segment.percent)}%`
  }));

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <h3 className="text-lg font-semibold text-slate-900">Por materia</h3>
      <p className="mt-1 text-sm text-slate-600">
        Distribución del tiempo efectivo en el período.
      </p>

      {!hasActivity ? (
        <div className="mt-5">
          <EmptyState title="Sin materias para mostrar">
            Registrá sesiones para ver cómo se reparte tu tiempo.
          </EmptyState>
        </div>
      ) : (
        <>
          <div className="mt-5 flex flex-col items-center gap-5 sm:flex-row">
            <div className="relative shrink-0">
              <svg
                viewBox="0 0 120 120"
                className="h-44 w-44 -rotate-90"
                role="img"
                aria-label={`Distribución por materia. Total: ${formatDuration(
                  report.totalSeconds
                )}.`}
              >
                <circle
                  cx="60"
                  cy="60"
                  r="44"
                  fill="none"
                  stroke="#E2E8F0"
                  strokeWidth="16"
                />
                {segments.map((segment) => (
                  <circle
                    key={segment.subjectId}
                    cx="60"
                    cy="60"
                    r="44"
                    fill="none"
                    stroke={segment.color}
                    strokeWidth="16"
                    pathLength="100"
                    strokeDasharray={`${segment.percent} ${
                      100 - segment.percent
                    }`}
                    strokeDashoffset={-segment.offset}
                  />
                ))}
              </svg>
              <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
                <p className="text-xl font-bold text-slate-900">
                  {formatDuration(report.totalSeconds)}
                </p>
                <p className="text-xs text-slate-500">total</p>
              </div>
            </div>

            <ul className="min-w-0 flex-1 space-y-2">
              {segments.map((segment) => (
                <li
                  key={segment.subjectId}
                  className="flex items-center gap-2 text-sm"
                >
                  <span
                    className="h-2.5 w-2.5 shrink-0 rounded-full"
                    style={{ backgroundColor: segment.color }}
                    aria-hidden="true"
                  />
                  <span className="min-w-0 flex-1 truncate text-slate-700">
                    {segment.name}
                  </span>
                  <span className="font-semibold text-slate-900">
                    {Math.round(segment.percent)}%
                  </span>
                  <span className="w-20 text-right text-xs text-slate-500">
                    {formatDuration(segment.effectiveSeconds)}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          <ChartDataTable
            label="Ver datos por materia"
            caption="Desglose del tiempo efectivo por materia"
            columns={[
              { key: 'subject', label: 'Materia' },
              { key: 'time', label: 'Tiempo' },
              { key: 'percent', label: 'Porcentaje' }
            ]}
            rows={tableRows}
          />
        </>
      )}
    </section>
  );
}
