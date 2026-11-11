import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';

import { AuthLayout } from '../components/layout/AuthLayout.jsx';
import { ErrorBanner } from '../components/ui/ErrorBanner.jsx';
import { FormField } from '../components/ui/FormField.jsx';
import { Button } from '../components/ui/Button.jsx';
import { useAuth } from '../context/useAuth.js';

function getRedirectPath(location) {
  const from = location.state?.from;

  if (!from) {
    return '/';
  }

  return `${from.pathname ?? '/'}${from.search ?? ''}${from.hash ?? ''}`;
}

export function Login() {
  const { login, bootstrapError } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ email: '', password: '' });
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

    if (!form.email.trim()) {
      nextErrors.email = 'Ingresá tu email.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      nextErrors.email = 'Ingresá un email válido.';
    }

    if (!form.password) {
      nextErrors.password = 'Ingresá tu contraseña.';
    }

    if (Object.keys(nextErrors).length > 0) {
      setFieldErrors(nextErrors);
      return;
    }

    setError(null);
    setSubmitting(true);

    try {
      await login({
        email: form.email.trim(),
        password: form.password
      });
      navigate(getRedirectPath(location), { replace: true });
    } catch (requestError) {
      if (requestError.fields) {
        setFieldErrors(requestError.fields);
      }

      setError(requestError.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthLayout
      title="Iniciar sesión"
      subtitle="Entrá para registrar tu estudio, ver tu racha y revisar tus reportes."
      footer={
        <p>
          ¿No tenés cuenta?{' '}
          <Link
            to="/register"
            className="font-semibold text-emerald-700 hover:text-emerald-800"
          >
            Crear una cuenta
          </Link>
        </p>
      }
    >
      <form className="space-y-4" onSubmit={handleSubmit} noValidate>
        {bootstrapError ? (
          <ErrorBanner message={bootstrapError.message} />
        ) : null}
        <ErrorBanner message={error} />

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
          autoComplete="current-password"
          placeholder="Tu contraseña"
          value={form.password}
          onChange={handleChange}
          error={fieldErrors.password}
        />

        <Button
          type="submit"
          loading={submitting}
          className="w-full"
        >
          Iniciar sesión
        </Button>
      </form>
    </AuthLayout>
  );
}
