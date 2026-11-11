import { useState } from 'react';

import { Button } from '../ui/Button.jsx';
import { ConfirmDialog } from '../subjects/ConfirmDialog.jsx';

const CONFIRM_CONTENT = {
  finish: {
    title: 'Finalizar sesión',
    message:
      'La sesión se guardará como completada con el tiempo efectivo acumulado.',
    confirmLabel: 'Finalizar y guardar',
    variant: 'primary'
  },
  abandon: {
    title: 'Abandonar sesión',
    message:
      'Se guardará el tiempo efectivo que ya estudiaste y la sesión quedará marcada como abandonada.',
    confirmLabel: 'Abandonar',
    variant: 'danger'
  }
};

export function TimerControls({
  timer,
  onPause,
  onResume,
  onFinish,
  onSkipBreak,
  onAbandon
}) {
  const [confirm, setConfirm] = useState(null);

  const confirmContent = confirm ? CONFIRM_CONTENT[confirm] : null;

  function handleConfirm() {
    if (confirm === 'finish') {
      onFinish();
    } else if (confirm === 'abandon') {
      onAbandon();
    }

    setConfirm(null);
  }

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap gap-3">
        {timer.mode === 'free' && timer.status === 'study' ? (
          <Button variant="secondary" onClick={onPause}>
            Pausar
          </Button>
        ) : null}

        {timer.mode === 'free' && timer.status === 'paused' ? (
          <Button onClick={onResume}>Reanudar</Button>
        ) : null}

        {timer.mode === 'free' &&
        (timer.status === 'study' || timer.status === 'paused') ? (
          <Button onClick={() => setConfirm('finish')}>Finalizar</Button>
        ) : null}

        {timer.mode === 'fixed' && timer.status === 'break' ? (
          <Button onClick={onSkipBreak}>Saltar descanso</Button>
        ) : null}

        {timer.mode === 'fixed' ? (
          <Button variant="danger" onClick={() => setConfirm('abandon')}>
            Abandonar
          </Button>
        ) : null}
      </div>

      <p className="mt-4 text-xs text-slate-500">
        {timer.mode === 'fixed'
          ? 'El modo fijo no se pausa: los descansos no suman tiempo efectivo.'
          : 'Las pausas no suman tiempo efectivo.'}
      </p>

      <ConfirmDialog
        open={Boolean(confirmContent)}
        title={confirmContent?.title}
        message={confirmContent?.message}
        confirmLabel={confirmContent?.confirmLabel}
        variant={confirmContent?.variant}
        onConfirm={handleConfirm}
        onCancel={() => setConfirm(null)}
      />
    </section>
  );
}
