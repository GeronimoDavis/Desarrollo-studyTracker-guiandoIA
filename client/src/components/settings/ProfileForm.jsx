import { useMemo, useState } from 'react';

import { Button } from '../ui/Button.jsx';
import { FormField } from '../ui/FormField.jsx';
import { isValidTimezone, listTimezones } from '../../lib/timezones.js';

export function ProfileForm({ user, onSave, saving }) {
  const [name, setName] = useState(user?.name ?? '');
  const [timezone, setTimezone] = useState(user?.timezone ?? 'UTC');
  const [errors, setErrors] = useState({});

  const timezones = useMemo(
    () => listTimezones([user?.timezone].filter(Boolean)),
    [user?.timezone]
  );

  function handleSubmit(event) {
    event.preventDefault();

    const nextErrors = {};
    const trimmedName = name.trim();

    if (trimmedName.length < 2) {
      nextErrors.name = 'El nombre debe tener al menos 2 caracteres.';
    } else if (trimmedName.length > 80) {
      nextErrors.name = 'El nombre no puede superar los 80 caracteres.';
    }

    if (!isValidTimezone(timezone)) {
      nextErrors.timezone =
        'Ingresá una zona horaria IANA válida, por ejemplo America/Argentina/Buenos_Aires.';
    }

    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    onSave({ name: trimmedName, timezone });
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmit} noValidate>
      <FormField
        id="profile-name"
        label="Nombre"
        type="text"
        autoComplete="name"
        value={name}
        onChange={(event) => {
          setName(event.target.value);
          setErrors((current) => ({ ...current, name: undefined }));
        }}
        error={errors.name}
        hint="Se muestra en el encabezado de la app."
      />

      <FormField
        id="profile-email"
        label="Email"
        type="email"
        value={user?.email ?? ''}
        readOnly
        disabled
        hint="El email no se puede cambiar."
      />

      <FormField
        id="profile-timezone"
        label="Zona horaria"
        type="text"
        list="timezone-options"
        value={timezone}
        onChange={(event) => {
          setTimezone(event.target.value);
          setErrors((current) => ({ ...current, timezone: undefined }));
        }}
        error={errors.timezone}
        hint="Define el día local de cada sesión, la racha y el heatmap."
      />

      <datalist id="timezone-options">
        {timezones.map((zone) => (
          <option key={zone} value={zone} />
        ))}
      </datalist>

      <Button type="submit" loading={saving}>
        Guardar cambios
      </Button>
    </form>
  );
}
