import { ConfirmDialog } from '../subjects/ConfirmDialog.jsx';
import { useTimer } from '../../context/useTimer.js';
import { formatLocalDateTime } from '../../lib/dates.js';
import { computeTimerMetrics } from '../../lib/timer/engine.js';
import { formatDuration } from '../../utils/format.js';

export function RecoveryDialog() {
  const { recovery, resumeRecovery, discardRecovery, now } = useTimer();

  if (!recovery) {
    return null;
  }

  const state = recovery.state;
  const finished = state.status === 'finished';
  const metrics = computeTimerMetrics(state, recovery.savedAt);
  const startedAt = formatLocalDateTime(state.startedAt);
  const remainingWallMs =
    state.mode === 'fixed' && state.plan
      ? Math.max(0, state.plan.totalWallSeconds * 1000 - metrics.wallSeconds * 1000)
      : null;
  const fixedPlanWouldExpire =
    remainingWallMs !== null && now - recovery.savedAt >= remainingWallMs;

  const message = [
    finished
      ? 'Hay una sesión terminada que todavía no se guardó.'
      : 'Encontramos una sesión de estudio sin terminar.',
    `Inició el ${startedAt} y acumuló ${formatDuration(metrics.effectiveSeconds)} efectivos.`,
    fixedPlanWouldExpire
      ? 'El plan fijo habría terminado mientras la app estaba cerrada; ese tiempo no se acredita.'
      : 'El tiempo con la app cerrada no se cuenta.',
    finished
      ? 'Podés ver el resumen para guardarla o descartarla.'
      : 'Podés reanudarla desde el último estado guardado o descartarla.'
  ].join(' ');

  return (
    <ConfirmDialog
      open
      title={finished ? 'Sesión pendiente de guardar' : 'Recuperar sesión'}
      message={message}
      confirmLabel={finished ? 'Ver resumen' : 'Reanudar'}
      cancelLabel="Descartar"
      onConfirm={resumeRecovery}
      onCancel={discardRecovery}
    />
  );
}
