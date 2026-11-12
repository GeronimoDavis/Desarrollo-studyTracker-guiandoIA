export const HEATMAP_LEVEL_CLASSES = [
  'bg-slate-100',
  'bg-emerald-100',
  'bg-emerald-300',
  'bg-emerald-500',
  'bg-emerald-700'
];

export const HEATMAP_LEVELS = [0, 1, 2, 3, 4];

export function getHeatmapLevelClass(day) {
  if (day?.isFuture) {
    return 'border border-dashed border-slate-200 bg-white';
  }

  const level = Math.min(Math.max(Number(day?.level ?? 0), 0), 4);
  return HEATMAP_LEVEL_CLASSES[level];
}
