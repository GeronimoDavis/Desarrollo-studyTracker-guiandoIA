import {
  HEATMAP_LEVEL_CLASSES,
  HEATMAP_LEVELS
} from '../../lib/heatmap.js';

export function HeatmapLegend() {
  return (
    <div
      className="flex items-center gap-1.5 text-xs text-slate-500"
      aria-label="Escala del heatmap: menos a más estudio"
    >
      <span>Menos</span>
      {HEATMAP_LEVELS.map((level) => (
        <span
          key={level}
          className={`h-3 w-3 rounded-[2px] ${HEATMAP_LEVEL_CLASSES[level]}`}
          aria-hidden="true"
        />
      ))}
      <span>Más</span>
    </div>
  );
}
