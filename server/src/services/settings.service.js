import {
  DEFAULT_HEATMAP_THRESHOLDS,
  findByUserId,
  upsert
} from '../repositories/userSettings.repository.js';

function parseThresholds(value) {
  try {
    const parsed = typeof value === 'string' ? JSON.parse(value) : value;

    if (!Array.isArray(parsed) || parsed.length !== 4) {
      return [...DEFAULT_HEATMAP_THRESHOLDS];
    }

    const thresholds = parsed.map(Number);

    if (!thresholds.every((threshold) => Number.isInteger(threshold))) {
      return [...DEFAULT_HEATMAP_THRESHOLDS];
    }

    return thresholds;
  } catch {
    return [...DEFAULT_HEATMAP_THRESHOLDS];
  }
}

export async function getSettings(userId) {
  const row = await findByUserId(userId);

  return {
    heatmapThresholds: row
      ? parseThresholds(row.heatmap_thresholds)
      : [...DEFAULT_HEATMAP_THRESHOLDS]
  };
}

export async function updateSettings(userId, { heatmapThresholds }) {
  const row = await upsert(userId, heatmapThresholds);

  return {
    heatmapThresholds: parseThresholds(row.heatmap_thresholds)
  };
}
