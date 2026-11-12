import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { PasswordForm } from '../components/settings/PasswordForm.jsx';
import { ProfileForm } from '../components/settings/ProfileForm.jsx';
import { ThresholdEditor } from '../components/settings/ThresholdEditor.jsx';
import { Button } from '../components/ui/Button.jsx';
import { ErrorBanner } from '../components/ui/ErrorBanner.jsx';
import { Spinner } from '../components/ui/Spinner.jsx';
import { useAuth } from '../context/useAuth.js';
import { useToast } from '../context/useToast.js';
import { useSettings } from '../hooks/useSettings.js';

function Section({ title, description, children }) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
      {description ? (
        <p className="mt-1 text-sm text-slate-600">{description}</p>
      ) : null}
      <div className="mt-5">{children}</div>
    </section>
  );
}

export function Settings() {
  const { user, updateProfile, changePassword, logout } = useAuth();
  const { thresholds, loading, error: settingsError, saving, save, reload } =
    useSettings();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [profileError, setProfileError] = useState(null);
  const [profileSaving, setProfileSaving] = useState(false);
  const [passwordError, setPasswordError] = useState(null);
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  async function handleProfileSave(values) {
    setProfileSaving(true);
    setProfileError(null);

    try {
      await updateProfile(values);
      showToast({ message: 'Perfil actualizado.', type: 'success' });
    } catch (requestError) {
      setProfileError(requestError);
      showToast({ message: requestError.message, type: 'error' });
    } finally {
      setProfileSaving(false);
    }
  }

  async function handleThresholdSave(values) {
    try {
      await save(values);
      showToast({
        message: 'Umbrales actualizados. El heatmap se actualizó.',
        type: 'success'
      });
    } catch (requestError) {
      showToast({ message: requestError.message, type: 'error' });
    }
  }

  async function handlePasswordSubmit(values) {
    setPasswordSaving(true);
    setPasswordError(null);

    try {
      await changePassword(values);
      showToast({
        message: 'Contraseña actualizada. Volvé a iniciar sesión.',
        type: 'success'
      });
      navigate('/login', { replace: true });
    } catch (requestError) {
      setPasswordError(requestError);
    } finally {
      setPasswordSaving(false);
    }
  }

  async function handleLogout() {
    setLoggingOut(true);

    try {
      await logout();
      navigate('/login', { replace: true });
    } finally {
      setLoggingOut(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-medium text-emerald-700">Ajustes</p>
        <h2 className="mt-1 text-3xl font-bold tracking-tight text-slate-900">
          Tu cuenta
        </h2>
        <p className="mt-2 max-w-2xl text-slate-600">
          Actualizá tu perfil, ajustá los colores del heatmap y cambiá tu
          contraseña.
        </p>
      </div>

      <Section
        title="Perfil"
        description="Tu nombre y tu zona horaria se usan en toda la app."
      >
        <ErrorBanner message={profileError?.message} />
        <div className="mt-4">
          <ProfileForm
            user={user}
            onSave={handleProfileSave}
            saving={profileSaving}
          />
        </div>
      </Section>

      <Section
        title="Heatmap"
        description="Elegí los umbrales en minutos que definen el color de cada día."
      >
        {settingsError ? (
          <div className="space-y-3">
            <ErrorBanner message={settingsError.message} />
            <Button variant="secondary" onClick={reload}>
              Reintentar
            </Button>
          </div>
        ) : loading ? (
          <Spinner label="Cargando ajustes…" />
        ) : thresholds ? (
          <ThresholdEditor
            thresholds={thresholds}
            onSave={handleThresholdSave}
            saving={saving}
            error={settingsError}
          />
        ) : null}
      </Section>

      <Section
        title="Seguridad"
        description="Cambiar la contraseña cierra todas las sesiones abiertas."
      >
        <PasswordForm
          onSubmit={handlePasswordSubmit}
          submitting={passwordSaving}
          error={passwordError}
        />
      </Section>

      <Section
        title="Sesión"
        description="Cerrá sesión en este dispositivo."
      >
        <Button
          variant="danger"
          loading={loggingOut}
          onClick={handleLogout}
        >
          Cerrar sesión
        </Button>
      </Section>
    </div>
  );
}
