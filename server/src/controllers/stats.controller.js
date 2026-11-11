import * as statsService from '../services/stats.service.js';

export async function getDaily(req, res) {
  const report = await statsService.getDailyReport(
    req.user.id,
    req.validatedQuery
  );

  res.json({ data: report });
}

export async function getPeriod(req, res) {
  const report = await statsService.getPeriodReport(
    req.user.id,
    req.validatedQuery
  );

  res.json({ data: report });
}

export async function getStreak(req, res) {
  const streak = await statsService.getStreak(
    req.user.id,
    req.validatedQuery
  );

  res.json({ data: streak });
}

export async function getHeatmap(req, res) {
  const heatmap = await statsService.getHeatmap(
    req.user.id,
    req.validatedQuery
  );

  res.json({ data: heatmap });
}

export async function getDashboard(req, res) {
  const dashboard = await statsService.getDashboard(req.user.id);

  res.json({ data: dashboard });
}
