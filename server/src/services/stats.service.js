import * as sessionsRepository from '../repositories/sessions.repository.js';
import { findById as findUserById } from '../repositories/users.repository.js';
import { addDays, getPeriodRanges, todayInZone } from '../utils/dates.js';
import { HttpError } from '../utils/httpError.js';
import { getSettings } from './settings.service.js';

function getAuthenticatedUser(userId) {
  return findUserById(userId).then((user) => {
    if (!user) {
      throw new HttpError(401, 'UNAUTHENTICATED', 'La sesión no es válida.');
    }

    return user;
  });
}

function toMinutes(seconds) {
  return Math.floor(seconds / 60);
}

function toSubjectRow(row) {
  const effectiveSeconds = Number(row.effective_seconds);

  return {
    subjectId: Number(row.subject_id),
    name: row.subject_name,
    color: row.subject_color,
    effectiveSeconds,
    effectiveMinutes: toMinutes(effectiveSeconds),
    sessions: Number(row.sessions)
  };
}

function buildDateSeries(startDate, endDate, rows) {
  const byDate = new Map(
    rows.map((row) => [row.session_date, Number(row.effective_seconds)])
  );
  const days = [];
  let current = startDate;

  while (current <= endDate) {
    const effectiveSeconds = byDate.get(current) ?? 0;

    days.push({
      date: current,
      effectiveSeconds,
      effectiveMinutes: toMinutes(effectiveSeconds)
    });

    current = addDays(current, 1);
  }

  return days;
}

function calculateExtremes(days) {
  let most = null;
  let least = null;

  for (const day of days) {
    if (day.effectiveSeconds < 60) {
      continue;
    }

    if (
      !most ||
      day.effectiveSeconds > most.effectiveSeconds ||
      (day.effectiveSeconds === most.effectiveSeconds && day.date > most.date)
    ) {
      most = day;
    }

    if (
      !least ||
      day.effectiveSeconds < least.effectiveSeconds ||
      (day.effectiveSeconds === least.effectiveSeconds && day.date > least.date)
    ) {
      least = day;
    }
  }

  return { most, least };
}

async function buildDailyReport(user, date) {
  const rows = await sessionsRepository.sumDaily(user.id, date);
  const subjects = rows.map(toSubjectRow);
  const totalSeconds = subjects.reduce(
    (total, subject) => total + subject.effectiveSeconds,
    0
  );
  const sessions = subjects.reduce(
    (total, subject) => total + subject.sessions,
    0
  );

  return {
    date,
    totalSeconds,
    totalMinutes: toMinutes(totalSeconds),
    sessions,
    subjects
  };
}

async function buildPeriodReport(user, { period = 'week', date } = {}) {
  const referenceDate = date ?? todayInZone(user.timezone);
  const range = getPeriodRanges(referenceDate)[period];

  const [dayRows, subjectRows] = await Promise.all([
    sessionsRepository.sumByDayRange(user.id, range.start, range.end),
    sessionsRepository.sumBySubjectRange(user.id, range.start, range.end)
  ]);

  const days = buildDateSeries(range.start, range.end, dayRows);
  const subjects = subjectRows.map(toSubjectRow);
  const totalSeconds = days.reduce(
    (total, day) => total + day.effectiveSeconds,
    0
  );
  const sessions = subjects.reduce(
    (total, subject) => total + subject.sessions,
    0
  );

  return {
    period,
    startDate: range.start,
    endDate: range.end,
    totalSeconds,
    totalMinutes: toMinutes(totalSeconds),
    sessions,
    days,
    subjects,
    extremes: calculateExtremes(days)
  };
}

function calculateCurrentStreak(completedDates, today) {
  if (completedDates.length === 0) {
    return 0;
  }

  const dateSet = new Set(completedDates);
  const yesterday = addDays(today, -1);
  const anchor = dateSet.has(today)
    ? today
    : dateSet.has(yesterday)
      ? yesterday
      : null;

  if (!anchor) {
    return 0;
  }

  let current = anchor;
  let count = 0;

  while (dateSet.has(current)) {
    count += 1;
    current = addDays(current, -1);
  }

  return count;
}

function calculateBestStreak(completedDates) {
  const sorted = [...new Set(completedDates)].sort();
  let best = 0;
  let run = 0;
  let previous = null;

  for (const date of sorted) {
    run = previous && date === addDays(previous, 1) ? run + 1 : 1;

    if (run > best) {
      best = run;
    }

    previous = date;
  }

  return best;
}

async function buildStreak(user, { date } = {}) {
  const today = date ?? todayInZone(user.timezone);
  const rows = await sessionsRepository.listCompletedDates(user.id);
  const completedDates = rows.map((row) => row.session_date);

  return {
    current: calculateCurrentStreak(completedDates, today),
    best: calculateBestStreak(completedDates),
    today,
    lastCompletedDate: completedDates[0] ?? null
  };
}

function getHeatmapLevel(effectiveSeconds, thresholds) {
  if (effectiveSeconds <= 0) {
    return 0;
  }

  const minutes = effectiveSeconds / 60;

  if (minutes < thresholds[0]) {
    return 1;
  }

  if (minutes < thresholds[1]) {
    return 2;
  }

  if (minutes < thresholds[2]) {
    return 3;
  }

  return 4;
}

async function buildHeatmap(user, { year } = {}) {
  const today = todayInZone(user.timezone);
  const targetYear = year ?? Number(today.slice(0, 4));
  const startDate = `${targetYear}-01-01`;
  const endDate = `${targetYear}-12-31`;

  const [rows, settings] = await Promise.all([
    sessionsRepository.sumByDayRange(user.id, startDate, endDate),
    getSettings(user.id)
  ]);

  const byDate = new Map(
    rows.map((row) => [row.session_date, Number(row.effective_seconds)])
  );
  const days = [];
  let current = startDate;

  while (current <= endDate) {
    const effectiveSeconds = byDate.get(current) ?? 0;
    const isFuture = current > today;

    days.push({
      date: current,
      effectiveSeconds,
      effectiveMinutes: toMinutes(effectiveSeconds),
      level: isFuture
        ? null
        : getHeatmapLevel(effectiveSeconds, settings.heatmapThresholds),
      isFuture
    });

    current = addDays(current, 1);
  }

  const totalSeconds = days.reduce(
    (total, day) => total + day.effectiveSeconds,
    0
  );

  return {
    year: targetYear,
    startDate,
    endDate,
    thresholds: settings.heatmapThresholds,
    totalSeconds,
    totalMinutes: toMinutes(totalSeconds),
    activeDays: days.filter(
      (day) => !day.isFuture && day.effectiveSeconds > 0
    ).length,
    days
  };
}

export async function getDailyReport(userId, { date } = {}) {
  const user = await getAuthenticatedUser(userId);
  const referenceDate = date ?? todayInZone(user.timezone);

  return buildDailyReport(user, referenceDate);
}

export async function getPeriodReport(userId, options = {}) {
  const user = await getAuthenticatedUser(userId);

  return buildPeriodReport(user, options);
}

export async function getStreak(userId, options = {}) {
  const user = await getAuthenticatedUser(userId);

  return buildStreak(user, options);
}

export async function getHeatmap(userId, options = {}) {
  const user = await getAuthenticatedUser(userId);

  return buildHeatmap(user, options);
}

export async function getDashboard(userId) {
  const user = await getAuthenticatedUser(userId);
  const today = todayInZone(user.timezone);

  const [daily, period, streak] = await Promise.all([
    buildDailyReport(user, today),
    buildPeriodReport(user, { period: 'week', date: today }),
    buildStreak(user, { date: today })
  ]);

  return {
    today: daily,
    period,
    streak
  };
}
