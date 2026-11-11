import { Router } from 'express';

import {
  getSettings,
  updateSettings
} from '../controllers/settings.controller.js';
import { requireAuth } from '../middlewares/auth.middleware.js';
import { validate } from '../middlewares/validate.middleware.js';
import { updateSettingsSchema } from '../schemas/settings.schema.js';

export const settingsRouter = Router();

settingsRouter.use(requireAuth);

settingsRouter.get('/', getSettings);
settingsRouter.put('/', validate(updateSettingsSchema), updateSettings);
