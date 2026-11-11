import { useBlocker } from 'react-router-dom';

import { ConfirmDialog } from '../subjects/ConfirmDialog.jsx';
import { useTimer } from '../../context/useTimer.js';

export function TimerNavigationGuard() {
  const { active } = useTimer();
  const blocker = useBlocker(
    ({ nextLocation }) => active && nextLocation.pathname !== '/timer'
  );

  if (blocker.state !== 'blocked') {
    return null;
  }

  return (
    <ConfirmDialog
      open
      title="Temporizador activo"
      message="La sesión sigue corriendo. Si salís de esta pantalla, podés volver al temporizador cuando quieras."
      confirmLabel="Salir"
      cancelLabel="Quedarme"
      onConfirm={() => blocker.proceed()}
      onCancel={() => blocker.reset()}
    />
  );
}
