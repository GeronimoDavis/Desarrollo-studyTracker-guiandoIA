function pad(value) {
  return String(value).padStart(2, '0');
}

export function formatClock(totalSeconds) {
  const safeSeconds = Math.max(0, Math.floor(Number(totalSeconds) || 0));
  const hours = Math.floor(safeSeconds / 3600);
  const minutes = Math.floor((safeSeconds % 3600) / 60);
  const seconds = safeSeconds % 60;

  if (hours > 0) {
    return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
  }

  return `${pad(minutes)}:${pad(seconds)}`;
}

export function formatMinutes(totalSeconds) {
  const minutes = Math.round((Number(totalSeconds) || 0) / 60);
  return `${minutes} min`;
}
