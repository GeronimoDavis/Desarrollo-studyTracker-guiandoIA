import { useState } from 'react';

import { Button } from '../ui/Button.jsx';
import { FormField } from '../ui/FormField.jsx';

export function PasswordForm({ onSubmit, submitting, error }) {
  const [form, setForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [errors, setErrors] = useState({});

  function handleChange(event) {
    const { name, value } = event.target;

    setForm((current) => ({ ...current, [name]: value }));
    setErrors((current) => ({ ...current, [name]: undefined }));
  }

  function handleSubmit(event) {
    event.preventDefault();

    const nextErrors = {};

    if (!form.currentPassword) {
      nextErrors.currentPassword = 'Ingresá tu contraseña actual.';
    }

    if (form.newPassword.length < 8) {
      nextErrors.newPassword = 'La contraseña debe tener al menos 8 caracteres.';
    } else if (form.newPassword.length > 72) {
      nextErrors.newPassword = 'La contraseña no puede superar los 72 caracteres.';
    } else if (form.newPassword === form.currentPassword) {
      nextErrors.newPassword = 'La contraseña nueva debe ser distinta de la actual.';
    }

    if (form.confirmPassword !== form.newPassword) {
      nextErrors.confirmPassword = 'Las contraseñas no coinciden.';
    }

    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    onSubmit({
      currentPassword: form.currentPassword,
      newPassword: form.newPassword
    });
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmit} noValidate>
      {error ? (
        <p
          className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800"
          role="alert"
        >
          {error.message}
        </p>
      ) : null}

      <FormField
        id="current-password"
        name="currentPassword"
        label="Contraseña actual"
        type="password"
        autoComplete="current-password"
        value={form.currentPassword}
        onChange={handleChange}
        error={errors.currentPassword}
      />

      <FormField
        id="new-password"
        name="newPassword"
        label="Contraseña nueva"
        type="password"
        autoComplete="new-password"
        value={form.newPassword}
        onChange={handleChange}
        error={errors.newPassword}
        hint="Entre 8 y 72 caracteres."
      />

      <FormField
        id="confirm-password"
        name="confirmPassword"
        label="Confirmar contraseña nueva"
        type="password"
        autoComplete="new-password"
        value={form.confirmPassword}
        onChange={handleChange}
        error={errors.confirmPassword}
      />

      <p className="text-xs text-slate-500">
        Al cambiar la contraseña se cierran todas las sesiones abiertas.
      </p>

      <Button type="submit" loading={submitting} variant="secondary">
        Cambiar contraseña
      </Button>
    </form>
  );
}
