import { useState } from 'react';

import { Button } from '../ui/Button.jsx';
import { ErrorBanner } from '../ui/ErrorBanner.jsx';
import { FormField } from '../ui/FormField.jsx';

const COLOR_PALETTE = [
  '#6366F1',
  '#10B981',
  '#F59E0B',
  '#EF4444',
  '#3B82F6',
  '#8B5CF6',
  '#EC4899',
  '#14B8A6'
];

const COLOR_PATTERN = /^#[0-9A-Fa-f]{6}$/;

function validateForm(form) {
  const errors = {};
  const name = form.name.trim();

  if (name.length < 2) {
    errors.name = 'El nombre debe tener al menos 2 caracteres.';
  } else if (name.length > 80) {
    errors.name = 'El nombre no puede superar los 80 caracteres.';
  }

  if (!COLOR_PATTERN.test(form.color)) {
    errors.color = 'Ingresá un color con formato #RRGGBB.';
  }

  if (form.description.trim().length > 500) {
    errors.description = 'La descripción no puede superar los 500 caracteres.';
  }

  return errors;
}

export function SubjectFormModal({ subject, onClose, onSubmit }) {
  const [form, setForm] = useState(() => ({
    name: subject?.name ?? '',
    color: subject?.color ?? COLOR_PALETTE[0],
    description: subject?.description ?? ''
  }));
  const [fieldErrors, setFieldErrors] = useState({});
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  function handleChange(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
    setFieldErrors((current) => ({ ...current, [name]: undefined }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    const nextErrors = validateForm(form);

    if (Object.keys(nextErrors).length > 0) {
      setFieldErrors(nextErrors);
      return;
    }

    setError(null);
    setSubmitting(true);

    try {
      await onSubmit({
        name: form.name.trim(),
        color: form.color.toUpperCase(),
        description: form.description.trim() || null
      });
      onClose();
    } catch (requestError) {
      if (requestError.fields) {
        setFieldErrors(requestError.fields);
      }

      if (requestError.code === 'DUPLICATE_NAME') {
        setFieldErrors((current) => ({
          ...current,
          name: requestError.message
        }));
      }

      setError(requestError.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/40 p-4 sm:items-center"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !submitting) {
          onClose();
        }
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="subject-form-title"
        className="max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6 shadow-xl"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2
              id="subject-form-title"
              className="text-lg font-semibold text-slate-900"
            >
              {subject ? 'Editar materia' : 'Nueva materia'}
            </h2>
            <p className="mt-1 text-sm text-slate-600">
              Usá un nombre y un color para reconocerla en el temporizador y los
              reportes.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="rounded-lg px-2 py-1 text-sm font-medium text-slate-500 hover:bg-slate-100 hover:text-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Cerrar
          </button>
        </div>

        <form className="mt-5 space-y-4" onSubmit={handleSubmit} noValidate>
          <ErrorBanner message={error} />

          <FormField
            id="subject-name"
            name="name"
            label="Nombre"
            type="text"
            placeholder="Ej. Matemática"
            value={form.name}
            onChange={handleChange}
            error={fieldErrors.name}
          />

          <div className="space-y-2">
            <p className="text-sm font-medium text-slate-700">Color</p>
            <div className="flex flex-wrap items-center gap-2">
              {COLOR_PALETTE.map((color) => {
                const selected = form.color.toUpperCase() === color;

                return (
                  <button
                    key={color}
                    type="button"
                    aria-label={`Color ${color}`}
                    aria-pressed={selected}
                    onClick={() => {
                      setForm((current) => ({ ...current, color }));
                      setFieldErrors((current) => ({
                        ...current,
                        color: undefined
                      }));
                    }}
                    className={`h-9 w-9 rounded-full border-2 transition ${
                      selected
                        ? 'border-slate-900 ring-2 ring-slate-300'
                        : 'border-white ring-1 ring-slate-200 hover:ring-slate-400'
                    }`}
                    style={{ backgroundColor: color }}
                  />
                );
              })}

              <label className="ml-1 flex cursor-pointer items-center gap-2 text-sm text-slate-600">
                <input
                  type="color"
                  aria-label="Color personalizado"
                  value={form.color}
                  onChange={handleChange}
                  name="color"
                  className="h-9 w-9 cursor-pointer rounded-lg border border-slate-300 bg-white p-1"
                />
                Personalizado
              </label>
            </div>
            {fieldErrors.color ? (
              <p className="text-sm text-rose-700">{fieldErrors.color}</p>
            ) : null}
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="subject-description"
              className="block text-sm font-medium text-slate-700"
            >
              Descripción (opcional)
            </label>
            <textarea
              id="subject-description"
              name="description"
              rows={3}
              maxLength={500}
              value={form.description}
              onChange={handleChange}
              placeholder="Temas, apuntes o lo que quieras recordar."
              className={`w-full rounded-xl border bg-white px-3.5 py-2.5 text-sm text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 ${
                fieldErrors.description
                  ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-100'
                  : 'border-slate-300'
              }`}
            />
            <div className="flex items-center justify-between gap-3 text-xs text-slate-500">
              <span>{fieldErrors.description}</span>
              <span>{form.description.length}/500</span>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="secondary"
              onClick={onClose}
              disabled={submitting}
            >
              Cancelar
            </Button>
            <Button type="submit" loading={submitting}>
              {subject ? 'Guardar cambios' : 'Crear materia'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
