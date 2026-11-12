import { Link } from 'react-router-dom';

import { buildSessionMatrix } from '../../lib/dashboard.js';
import {
  formatDateKey,
  formatDayTick,
  formatDuration
} from '../../utils/format.js';
import { EmptyState } from '../ui/EmptyState.jsx';
import { ChartDataTable } from './ChartDataTable.jsx';

const CHART_HEIGHT = 220;

export function PeriodBarChart({ report, sessions }) {
  if (!report) {
    return null;
  }

  const matrix = buildSessionMatrix({
    days: report.days,
    subjects: report.subjects,
    sessions
  });
  const maxSeconds = Math.max(
    ...matrix.rows.map((row) => row.totalSeconds),
    1
  );
  const hasActivity = report.totalSeconds > 0;
  const chartWidth = Math.max(matrix.rows.length * 36, 300);

  const tableRows = matrix.rows.map((row) => {
    const values = {
      id: row.date,
      date: formatDateKey(row.date),
      total: formatDuration(row.totalSeconds)
    };

    for (const subject of matrix.subjects) {
      values[`subject-${subject.subjectId}`] = formatDuration(
        row.subjects[subject.subjectId]?.seconds ?? 0
      );
    }

    return values;
  });

  const tableColumns = [
    { key: 'date', label: 'Fecha' },
    { key: 'total', label: 'Total' },
    ...matrix.subjects.map((subject) => ({
      key: `subject-${subject.subjectId}`,
      label: subject.name
    }))
  ];

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold text-slate-900">
            Estudio por día
          </h3>
          <p className="mt-1 text-sm text-slate-600">
            Tiempo efectivo del período, separado por materia.
          </p>
        </div>
        <p className="text-sm font-semibold text-slate-700">
          {formatDuration(report.totalSeconds)}
        </p>
      </div>

      {!hasActivity ? (
        <div className="mt-5">
          <EmptyState
            title="Sin sesiones en este período"
            action={
              <Link
                to="/timer"
                className="inline-flex rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600"
              >
                Iniciar una sesión
              </Link>
            }
          >
            Probá con otro período o registrá tu próximo bloque de estudio.
          </EmptyState>
        </div>
      ) : (
        <>
          <div className="mt-5 overflow-x-auto pb-2">
            <div style={{ minWidth: `${chartWidth}px` }}>
              <div
                className="flex items-end gap-1.5"
                style={{ height: `${CHART_HEIGHT}px` }}
                role="img"
                aria-label={`Gráfico de estudio por día. Total del período: ${formatDuration(
                  report.totalSeconds
                )}.`}
              >
                {matrix.rows.map((row) => {
                  const barPercent =
                    row.totalSeconds > 0
                      ? Math.max(
                          (row.totalSeconds / maxSeconds) * 100,
                          2
                        )
                      : 0;
                  const dayTitle = `${formatDateKey(row.date)}: ${formatDuration(
                    row.totalSeconds
                  )}`;

                  return (
                    <div
                      key={row.date}
                      className="flex h-full flex-1 flex-col justify-end"
                    >
                      <div
                        className="relative w-full"
                        style={{ height: `${CHART_HEIGHT}px` }}
                      >
                        {row.totalSeconds > 0 ? (
                          <div
                            className="absolute inset-x-0 bottom-0 flex flex-col-reverse overflow-hidden rounded-t-md"
                            style={{ height: `${barPercent}%` }}
                            title={dayTitle}
                          >
                            {matrix.subjects.map((subject) => {
                              const cell = row.subjects[subject.subjectId];

                              if (!cell?.seconds) {
                                return null;
                              }

                              const segmentPercent =
                                (cell.seconds / row.totalSeconds) * 100;

                              return (
                                <div
                                  key={subject.subjectId}
                                  style={{
                                    height: `${segmentPercent}%`,
                                    backgroundColor: subject.color
                                  }}
                                  title={`${subject.name}: ${formatDuration(
                                    cell.seconds
                                  )}`}
                                />
                              );
                            })}
                          </div>
                        ) : null}
                      </div>
                      <p className="mt-2 truncate text-center text-[10px] text-slate-500">
                        {formatDayTick(row.date, report.period)}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2">
            {matrix.subjects.map((subject) => (
              <span
                key={subject.subjectId}
                className="inline-flex items-center gap-2 text-xs text-slate-600"
              >
                <span
                  className="h-2.5 w-2.5 rounded-full"
                  style={{ backgroundColor: subject.color }}
                  aria-hidden="true"
                />
                {subject.name}
              </span>
            ))}
          </div>

          <ChartDataTable
            label="Ver datos del gráfico"
            caption="Tiempo efectivo por día y materia"
            columns={tableColumns}
            rows={tableRows}
          />
        </>
      )}
    </section>
  );
}
