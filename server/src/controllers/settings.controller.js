import * as settingsService from '../services/settings.service.js';

export async function getSettings(req, res) {
  const settings = await settingsService.getSettings(req.user.id);

  res.json({ data: { settings } });
}

export async function updateSettings(req, res) {
  const settings = await settingsService.updateSettings(req.user.id, req.body);

  res.json({ data: { settings } });
}
