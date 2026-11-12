import {
  buildHeatmapWeeks,
  getHeatmapMonthLabels
} from '../../lib/dashboard.js';
import { getHeatmapLevelClass } from '../../lib/heatmap.js';
import {
  formatDateKey,
  formatDuration
} from '../../utils/format.js';
import { Button } from '../ui/Button.jsx';
import { ErrorBanner } from '../ui/ErrorBanner.jsx';
import { Spinner } from '../ui/Spinner.jsx';
import { ChartDataTable } from './ChartDataTable.jsx';
import { HeatmapLegend } from './HeatmapLegend.jsx';

const WEEKDAY_LABELS = ['Lun', '', 'Mié', '', 'Vie', '', ''];
const CELL_SIZE = 12;
const CELL_GAP = 3;
const COLUMN_WIDTH = CELL_SIZE + CELL_GAP;

function formatMonthLabel(month, year) {
  return new Intl.DateTimeFormat('es-AR', {
    month: 'short',
    timeZone: 'UTC'
  }).format(new Date(Date.UTC(year, Number(month) - 1, 1)));
}

export function Heatmap({
  heatmap,
  loading,
  error,
  year,
  years,
  onYearChange,
  onRetry
}) {
  const selectedYear = year ?? heatmap?.year ?? years[0];
  const weeks = buildHeatmapWeeks(heatmap?.days ?? []);
  const monthLabels = getHeatmapMonthLabels(weeks);
  const activeDays = (heatmap?.days ?? []).filter(
    (day) => day.effectiveSeconds > 0
  );

  const tableRows = activeDays.map((day) => ({
    id: day.date,
    date: formatDateKey(day.date),
    time: formatDuration(day.effectiveSeconds),
    level: day.level
  }));

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold text-slate-900">
            Tu año de estudio
          </h3>
          <p className="mt-1 text-sm text-slate-600">
            Cada celda es un día. Los días futuros quedan sin color.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <HeatmapLegend />
          <div className="flex items-center gap-2">
            <label htmlFor="heatmap-year" className="sr-only">
              Año del heatmap
            </label>
            <select
              id="heatmap-year"
              value={selectedYear}
              onChange={(event) => onYearChange(Number(event.target.value))}
              className="rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-sm font-medium text-slate-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600"
            >
              {years.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {error ? (
        <div className="mt-5 space-y-3">
          <ErrorBanner message={error.message} />
          <Button variant="secondary" onClick={onRetry}>
            Reintentar
          </Button>
        </div>
      ) : null}

      {loading && !heatmap ? (
        <div className="mt-8 py-8">
          <Spinner label="Cargando heatmap…" />
        </div>
      ) : null}

      {!error && heatmap ? (
        <>
          <div className="mt-5 flex flex-wrap gap-x-6 gap-y-1 text-sm text-slate-600">
            <p>
              <span className="font-semibold text-slate-900">
                {formatDuration(heatmap.totalSeconds)}
              </span>{' '}
              en {heatmap.year}
            </p>
            <p>
              <span className="font-semibold text-slate-900">
                {heatmap.activeDays}
              </span>{' '}
              {heatmap.activeDays === 1 ? 'día activo' : 'días activos'}
            </p>
            {loading ? (
              <span className="text-xs text-slate-500">Actualizando…</span>
            ) : null}
          </div>

          <div className="mt-5 overflow-x-auto pb-2">
            <div className="min-w-max">
              <div
                className="relative ml-9 h-4"
                style={{ width: weeks.length * COLUMN_WIDTH }}
              >
                {monthLabels.map((label) => (
                  <span
                    key={`${label.month}-${label.weekIndex}`}
                    className="absolute text-[10px] font-medium capitalize text-slate-500"
                    style={{ left: label.weekIndex * COLUMN_WIDTH }}
                  >
                    {formatMonthLabel(label.month, heatmap.year)}
                  </span>
                ))}
              </div>

              <div className="flex gap-2">
                <div
                  className="flex w-7 shrink-0 flex-col text-[10px] leading-none text-slate-400"
                  style={{ gap: `${CELL_GAP}px` }}
                  aria-hidden="true"
                >
                  {WEEKDAY_LABELS.map((label, index) => (
                    <span
                      key={`${label}-${index}`}
                      className="flex items-center"
                      style={{ height: `${CELL_SIZE}px` }}
                    >
                      {label}
                    </span>
                  ))}
                </div>

                <div
                  className="flex"
                  style={{ gap: `${CELL_GAP}px` }}
                  role="group"
                  aria-label={`Heatmap de estudio de ${heatmap.year}`}
                >
                  {weeks.map((week, weekIndex) => (
                    <div
                      key={`week-${weekIndex}`}
                      className="flex flex-col"
                      style={{ gap: `${CELL_GAP}px` }}
                    >
                      {week.map((day, dayIndex) => {
                        if (!day) {
                          return (
                            <span
                              key={`empty-${weekIndex}-${dayIndex}`}
                              className="h-3 w-3"
                              aria-hidden="true"
                            />
                          );
                        }

                        const label = day.isFuture
                          ? `${formatDateKey(day.date)}: día futuro`
                          : `${formatDateKey(day.date)}: ${formatDuration(
                              day.effectiveSeconds
                            )}`;

                        return (
                          <span
                            key={day.date}
                            role="img"
                            aria-label={label}
                            title={label}
                            className={`h-3 w-3 rounded-[2px] ${getHeatmapLevelClass(
                              day
                            )}`}
                          />
                        );
                      })}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {activeDays.length > 0 ? (
            <ChartDataTable
              label="Ver días con actividad"
              caption={`Días con actividad en ${heatmap.year}`}
              columns={[
                { key: 'date', label: 'Día' },
                { key: 'time', label: 'Tiempo efectivo' },
                { key: 'level', label: 'Nivel' }
              ]}
              rows={tableRows}
            />
          ) : null}
        </>
      ) : null}
    </section>
  );
}
