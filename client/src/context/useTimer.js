import { useContext } from 'react';

import { TimerContext } from './timerContext.js';

export function useTimer() {
  const context = useContext(TimerContext);

  if (!context) {
    throw new Error('useTimer debe usarse dentro de TimerProvider.');
  }

  return context;
}
