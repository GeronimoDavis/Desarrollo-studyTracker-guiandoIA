import { getMondayIndex } from './dates.js';

function toSeconds(value) {
  return Number(value) || 0;
}

export function buildSessionMatrix({ days = [], subjects = [], sessions = [] }) {
  const subjectMap = new Map();
  const orderedSubjects = [];

  for (const subject of subjects) {
    if (subjectMap.has(subject.subjectId)) {
      continue;
    }

    const normalized = {
      ...subject,
      effectiveSeconds: toSeconds(subject.effectiveSeconds),
      effectiveMinutes: toSeconds(subject.effectiveMinutes),
      sessions: toSeconds(subject.sessions)
    };

    subjectMap.set(subject.subjectId, normalized);
    orderedSubjects.push(normalized);
  }

  for (const session of sessions) {
    if (subjectMap.has(session.subjectId)) {
      continue;
    }

    const subject = session.subject ?? {};
    const normalized = {
      subjectId: session.subjectId,
      name: subject.name ?? 'Materia',
      color: subject.color ?? '#64748B',
      effectiveSeconds: 0,
      effectiveMinutes: 0,
      sessions: 0
    };

    subjectMap.set(session.subjectId, normalized);
    orderedSubjects.push(normalized);
  }

  const secondsByKey = new Map();
  const sessionsByKey = new Map();

  for (const session of sessions) {
    const key = `${session.sessionDate}|${session.subjectId}`;
    secondsByKey.set(key, (secondsByKey.get(key) ?? 0) + toSeconds(session.effectiveSeconds));
    sessionsByKey.set(key, (sessionsByKey.get(key) ?? 0) + 1);
  }

  const rows = days.map((day) => {
    const cells = {};
    let totalFromSessions = 0;

    for (const subject of orderedSubjects) {
      const key = `${day.date}|${subject.subjectId}`;
      const cell = {
        seconds: secondsByKey.get(key) ?? 0,
        sessions: sessionsByKey.get(key) ?? 0
      };

      totalFromSessions += cell.seconds;
      cells[subject.subjectId] = cell;
    }

    return {
      date: day.date,
      totalSeconds: toSeconds(day.effectiveSeconds),
      totalFromSessions,
      subjects: cells
    };
  });

  const totalsBySubject = {};

  for (const subject of orderedSubjects) {
    totalsBySubject[subject.subjectId] = { seconds: 0, sessions: 0 };
  }

  for (const session of sessions) {
    const total = totalsBySubject[session.subjectId];

    if (!total) {
      continue;
    }

    total.seconds += toSeconds(session.effectiveSeconds);
    total.sessions += 1;
  }

  return {
    subjects: orderedSubjects,
    rows,
    totalsBySubject
  };
}

export function getDonutSegments(subjects = []) {
  const total = subjects.reduce(
    (sum, subject) => sum + toSeconds(subject.effectiveSeconds),
    0
  );
  let offset = 0;

  return subjects.map((subject) => {
    const effectiveSeconds = toSeconds(subject.effectiveSeconds);
    const percent = total > 0 ? (effectiveSeconds / total) * 100 : 0;
    const segment = {
      ...subject,
      percent,
      offset
    };

    offset += percent;
    return segment;
  });
}

export function buildHeatmapWeeks(days = []) {
  if (days.length === 0) {
    return [];
  }

  const padded = [];
  const firstMondayIndex = getMondayIndex(days[0].date) ?? 0;

  for (let index = 0; index < firstMondayIndex; index += 1) {
    padded.push(null);
  }

  for (const day of days) {
    padded.push(day);
  }

  while (padded.length % 7 !== 0) {
    padded.push(null);
  }

  const weeks = [];

  for (let index = 0; index < padded.length; index += 7) {
    weeks.push(padded.slice(index, index + 7));
  }

  return weeks;
}

export function getHeatmapMonthLabels(weeks = []) {
  const labels = [];
  let lastMonth = null;

  weeks.forEach((week, weekIndex) => {
    const firstDay = week.find(Boolean);

    if (!firstDay) {
      return;
    }

    const month = firstDay.date.slice(5, 7);

    if (month !== lastMonth) {
      labels.push({ month, weekIndex });
      lastMonth = month;
    }
  });

  return labels;
}

export function getActiveDaysCount(days = []) {
  return days.filter((day) => toSeconds(day.effectiveSeconds) > 0).length;
}
