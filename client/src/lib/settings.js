export const DEFAULT_HEATMAP_THRESHOLDS = [60, 120, 240, 480];

export function validateThresholds(values) {
  const numbers = values.map((value) => Number(value));

  if (numbers.some((value) => !Number.isInteger(value))) {
    return {
      valid: false,
      message: 'Cada umbral debe ser un número entero de minutos.'
    };
  }

  if (numbers.some((value) => value < 1 || value > 1440)) {
    return {
      valid: false,
      message: 'Cada umbral debe estar entre 1 y 1440 minutos.'
    };
  }

  if (!numbers.every((value, index) => index === 0 || value > numbers[index - 1])) {
    return {
      valid: false,
      message: 'Los umbrales deben estar en orden ascendente.'
    };
  }

  return { valid: true, message: null, values: numbers };
}

// replica el cálculo de niveles del backend (/api/stats/heatmap)
export function getHeatmapLevel(minutes, thresholds = DEFAULT_HEATMAP_THRESHOLDS) {
  const value = Number(minutes) || 0;

  if (value <= 0) {
    return 0;
  }

  const [first, second, third] = thresholds;

  if (value < first) {
    return 1;
  }

  if (value < second) {
    return 2;
  }

  if (value < third) {
    return 3;
  }

  return 4;
}

export function getThresholdBands(thresholds = DEFAULT_HEATMAP_THRESHOLDS) {
  const [first, second, third] = thresholds;

  return [
    {
      level: 1,
      label: `Menos de ${first} min`,
      sample: Math.max(Math.floor(first / 2), 1)
    },
    {
      level: 2,
      label: `${first} – ${second - 1} min`,
      sample: first
    },
    {
      level: 3,
      label: `${second} – ${third - 1} min`,
      sample: second
    },
    {
      level: 4,
      label: `${third} min o más`,
      sample: third
    }
  ];
}
