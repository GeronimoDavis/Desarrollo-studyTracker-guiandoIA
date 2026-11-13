export const HEATMAP_LEVEL_CLASSES = [
  'bg-slate-100 dark:bg-slate-800',
  'bg-emerald-100 dark:bg-emerald-900',
  'bg-emerald-300 dark:bg-emerald-700',
  'bg-emerald-500 dark:bg-emerald-500',
  'bg-emerald-700 dark:bg-emerald-300'
];

export const HEATMAP_LEVELS = [0, 1, 2, 3, 4];

export function getHeatmapLevelClass(day) {
  if (day?.isFuture) {
    return 'border border-dashed border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900';
  }

  const level = Math.min(Math.max(Number(day?.level ?? 0), 0), 4);
  return HEATMAP_LEVEL_CLASSES[level];
}
