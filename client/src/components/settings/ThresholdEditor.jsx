import { useState } from 'react';

import { Button } from '../ui/Button.jsx';
import { ErrorBanner } from '../ui/ErrorBanner.jsx';
import { HEATMAP_LEVEL_CLASSES } from '../../lib/heatmap.js';
import {
  getThresholdBands,
  validateThresholds
} from '../../lib/settings.js';

export function ThresholdEditor({ thresholds, onSave, saving, error }) {
  const [values, setValues] = useState(() =>
    thresholds.map((value) => String(value))
  );
  const [validation, setValidation] = useState({ valid: true, message: null });

  const numericValues = values.map((value) => Number(value));
  const bands = getThresholdBands(
    numericValues.every((value) => Number.isFinite(value))
      ? numericValues
      : thresholds
  );

  function handleChange(index, rawValue) {
    setValues((current) => {
      const next = [...current];
      next[index] = rawValue;
      return next;
    });

    setValidation({ valid: true, message: null });
  }

  function handleSubmit(event) {
    event.preventDefault();

    const result = validateThresholds(values);
    setValidation(result);

    if (!result.valid) {
      return;
    }

    onSave(result.values);
  }

  return (
    <form className="space-y-5" onSubmit={handleSubmit} noValidate>
      <ErrorBanner message={error?.message} />

      <fieldset className="space-y-3">
        <legend className="text-sm font-medium text-slate-700">
          Umbrales en minutos
        </legend>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {values.map((value, index) => (
            <div key={index} className="space-y-1.5">
              <label
                htmlFor={`threshold-${index}`}
                className="block text-sm font-medium text-slate-700"
              >
                Umbral {index + 1}
              </label>
              <input
                id={`threshold-${index}`}
                type="number"
                inputMode="numeric"
                min={1}
                max={1440}
                value={value}
                onChange={(event) => handleChange(index, event.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 shadow-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
              />
            </div>
          ))}
        </div>

        <p className="text-sm text-slate-500">
          Deben estar en orden ascendente. El color más intenso se aplica desde
          el tercer umbral; el cuarto valor queda como límite máximo configurado.
        </p>

        {validation.message ? (
          <p className="text-sm text-rose-700" role="alert">
            {validation.message}
          </p>
        ) : null}
      </fieldset>

      <div>
        <p className="text-sm font-medium text-slate-700">Vista previa</p>
        <ul className="mt-2 grid gap-2 sm:grid-cols-2">
          {bands.map((band) => (
            <li
              key={band.level}
              className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2"
            >
              <span
                className={`h-6 w-6 shrink-0 rounded-md ${HEATMAP_LEVEL_CLASSES[band.level]}`}
                aria-hidden="true"
              />
              <span className="text-sm text-slate-700">
                <strong className="font-semibold text-slate-900">
                  Nivel {band.level}
                </strong>{' '}
                · {band.label}
              </span>
            </li>
          ))}
        </ul>
      </div>

      <Button type="submit" loading={saving}>
        Guardar umbrales
      </Button>
    </form>
  );
}
