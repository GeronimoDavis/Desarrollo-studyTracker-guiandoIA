import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import { AuthLayout } from '../components/layout/AuthLayout.jsx';
import { ErrorBanner } from '../components/ui/ErrorBanner.jsx';
import { FormField } from '../components/ui/FormField.jsx';
import { Button } from '../components/ui/Button.jsx';
import { useAuth } from '../context/useAuth.js';

function detectTimezone() {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
  } catch {
    return 'UTC';
  }
}

export function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [timezone] = useState(detectTimezone);
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
    const nextErrors = {};
    const name = form.name.trim();
    const email = form.email.trim();

    if (name.length < 2) {
      nextErrors.name = 'El nombre debe tener al menos 2 caracteres.';
    } else if (name.length > 80) {
      nextErrors.name = 'El nombre no puede superar los 80 caracteres.';
    }

    if (!email) {
      nextErrors.email = 'Ingresá tu email.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      nextErrors.email = 'Ingresá un email válido.';
    }

    if (form.password.length < 8) {
      nextErrors.password = 'La contraseña debe tener al menos 8 caracteres.';
    } else if (form.password.length > 72) {
      nextErrors.password = 'La contraseña no puede superar los 72 caracteres.';
    }

    if (form.confirmPassword !== form.password) {
      nextErrors.confirmPassword = 'Las contraseñas no coinciden.';
    }

    if (Object.keys(nextErrors).length > 0) {
      setFieldErrors(nextErrors);
      return;
    }

    setError(null);
    setSubmitting(true);

    try {
      await register({
        name,
        email,
        password: form.password,
        timezone
      });
      navigate('/', { replace: true });
    } catch (requestError) {
      if (requestError.fields) {
        setFieldErrors(requestError.fields);
      }

      if (requestError.code === 'EMAIL_IN_USE') {
        setFieldErrors((current) => ({
          ...current,
          email: requestError.message
        }));
      }

      setError(requestError.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthLayout
      title="Crear cuenta"
      subtitle="Tu progreso, rachas y materias quedan separados del resto de las personas."
      footer={
        <p>
          ¿Ya tenés cuenta?{' '}
          <Link
            to="/login"
            className="font-semibold text-emerald-700 hover:text-emerald-800"
          >
            Iniciar sesión
          </Link>
        </p>
      }
    >
      <form className="space-y-4" onSubmit={handleSubmit} noValidate>
        <ErrorBanner message={error} />

        <FormField
          id="name"
          name="name"
          label="Nombre"
          type="text"
          autoComplete="name"
          placeholder="Tu nombre"
          value={form.name}
          onChange={handleChange}
          error={fieldErrors.name}
        />

        <FormField
          id="email"
          name="email"
          label="Email"
          type="email"
          autoComplete="email"
          placeholder="vos@ejemplo.com"
          value={form.email}
          onChange={handleChange}
          error={fieldErrors.email}
        />

        <FormField
          id="password"
          name="password"
          label="Contraseña"
          type="password"
          autoComplete="new-password"
          placeholder="Al menos 8 caracteres"
          value={form.password}
          onChange={handleChange}
          error={fieldErrors.password}
          hint="Entre 8 y 72 caracteres."
        />

        <FormField
          id="confirmPassword"
          name="confirmPassword"
          label="Confirmar contraseña"
          type="password"
          autoComplete="new-password"
          placeholder="Repetí tu contraseña"
          value={form.confirmPassword}
          onChange={handleChange}
          error={fieldErrors.confirmPassword}
        />

        <p className="rounded-xl bg-slate-50 px-3 py-2 text-xs text-slate-500">
          Zona horaria detectada: <strong>{timezone}</strong>
        </p>

        <Button type="submit" loading={submitting} className="w-full">
          Crear cuenta
        </Button>
      </form>
    </AuthLayout>
  );
}
