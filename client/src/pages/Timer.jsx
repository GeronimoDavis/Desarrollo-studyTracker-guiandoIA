import { useEffect } from 'react';
import { Link } from 'react-router-dom';

import { BreakPlanPicker } from '../components/timer/BreakPlanPicker.jsx';
import { DurationPicker } from '../components/timer/DurationPicker.jsx';
import { ModeTabs } from '../components/timer/ModeTabs.jsx';
import { ProgressPanel } from '../components/timer/ProgressPanel.jsx';
import { SessionSummaryDialog } from '../components/timer/SessionSummaryDialog.jsx';
import { SubjectSelector } from '../components/timer/SubjectSelector.jsx';
import { TimerControls } from '../components/timer/TimerControls.jsx';
import { TimerDisplay } from '../components/timer/TimerDisplay.jsx';
import { Button } from '../components/ui/Button.jsx';
import { ErrorBanner } from '../components/ui/ErrorBanner.jsx';
import { Spinner } from '../components/ui/Spinner.jsx';
import { useTimer } from '../context/useTimer.js';
import { formatClockLong } from '../lib/timeFormat.js';
import { useSubjects } from '../hooks/useSubjects.js';

export function Timer() {
  const { subjects, loading, error, reload } = useSubjects();
  const {
    timer,
    config,
    updateConfig,
    metrics,
    active,
    finished,
    notice,
    clearNotice,
    externalActive,
    notificationPermission,
    requestNotifications,
    start,
    pause,
    resume,
    finish,
    skip,
    abandon
  } = useTimer();

  const subject = subjects.find((item) => item.id === timer?.subjectId);
  const noSubjects = !loading && !error && subjects.length === 0;

  useEffect(() => {
    if (!active || !timer || !metrics) {
      document.title = 'Study Tracker';
      return undefined;
    }

    const seconds =
      timer.mode === 'fixed' &&
      (timer.status === 'study' || timer.status === 'break')
        ? metrics.phaseRemainingSeconds
        : metrics.effectiveSeconds;
    const phase =
      timer.status === 'break'
        ? 'Descanso'
        : timer.status === 'paused'
          ? 'Pausa'
          : 'Estudio';

    document.title = `${formatClockLong(seconds)} · ${phase} · Study Tracker`;

    return () => {
      document.title = 'Study Tracker';
    };
  }, [active, metrics, timer]);

  if (loading && subjects.length === 0) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white px-4 py-10">
        <Spinner label="Cargando materias…" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-medium text-emerald-700">Temporizador</p>
        <h2 className="mt-1 text-3xl font-bold tracking-tight text-slate-900">
          {active ? 'Sesión en curso' : finished ? 'Sesión finalizada' : 'Empezá a estudiar'}
        </h2>
        <p className="mt-2 max-w-2xl text-slate-600">
          Elegí una materia y el modo de estudio. El tiempo efectivo es el que
          cuenta para tus rachas y reportes.
        </p>
      </div>

      {notice ? (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="min-w-0 flex-1">
            <ErrorBanner message={notice} />
          </div>
          <Button variant="secondary" onClick={clearNotice}>
            Cerrar aviso
          </Button>
        </div>
      ) : null}

      {externalActive && !timer ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Hay una sesión activa en otra pestaña. No podés iniciar otra desde
          acá.
        </div>
      ) : null}

      {error ? (
        <div className="space-y-3">
          <ErrorBanner message={error.message} />
          <Button variant="secondary" onClick={reload}>
            Reintentar
          </Button>
        </div>
      ) : null}

      {noSubjects ? (
        <section className="rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-sm">
          <h3 className="text-lg font-semibold text-slate-900">
            Necesitás una materia activa
          </h3>
          <p className="mt-2 text-sm text-slate-600">
            Creá o restaurá una materia para poder iniciar el temporizador.
          </p>
          <Link
            to="/subjects"
            className="mt-4 inline-flex rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700"
          >
            Ir a materias
          </Link>
        </section>
      ) : null}

      {!error && !noSubjects && !timer ? (
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-slate-900">
            Configuración
          </h3>

          <div className="mt-5 space-y-5">
            <SubjectSelector
              subjects={subjects}
              value={config.subjectId}
              onChange={(value) =>
                updateConfig({ subjectId: value ? Number(value) : '' })
              }
            />

            <ModeTabs
              value={config.mode}
              onChange={(mode) => updateConfig({ mode })}
            />

            {config.mode === 'fixed' ? (
              <div className="space-y-4">
                <DurationPicker
                  value={config.targetMinutes}
                  onChange={(targetMinutes) => updateConfig({ targetMinutes })}
                />
                <BreakPlanPicker
                  targetMinutes={config.targetMinutes}
                  breakMinutes={config.breakMinutes}
                  onChange={(breakMinutes) => updateConfig({ breakMinutes })}
                />
              </div>
            ) : (
              <p className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                El cronómetro libre cuenta hacia arriba. Podés pausar y
                reanudar cuando quieras.
              </p>
            )}

            <div className="flex flex-wrap items-center gap-3">
              <Button
                onClick={start}
                disabled={!config.subjectId || externalActive}
              >
                Iniciar sesión
              </Button>
              <p className="text-xs text-slate-500">
                {config.subjectId
                  ? 'La materia no se puede cambiar con la sesión iniciada.'
                  : 'Elegí una materia para continuar.'}
              </p>
            </div>
          </div>
        </section>
      ) : null}

      {timer ? (
        <>
          <TimerDisplay timer={timer} metrics={metrics} subject={subject} />

          {active ? (
            <>
              <TimerControls
                timer={timer}
                onPause={pause}
                onResume={resume}
                onFinish={finish}
                onSkipBreak={skip}
                onAbandon={abandon}
              />

              {notificationPermission === 'default' ? (
                <div className="flex flex-wrap items-center gap-3">
                  <Button
                    variant="secondary"
                    onClick={requestNotifications}
                  >
                    Activar avisos del navegador
                  </Button>
                  <span className="text-xs text-slate-500">
                    Te avisamos cuando termine un bloque o un descanso.
                  </span>
                </div>
              ) : null}

              <ProgressPanel timer={timer} metrics={metrics} />
            </>
          ) : null}
        </>
      ) : null}

      <SessionSummaryDialog subject={subject} />
    </div>
  );
}
