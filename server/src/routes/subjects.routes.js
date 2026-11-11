import { Router } from 'express';

import {
  createSubject,
  deleteSubject,
  getSubject,
  getSubjectStats,
  listSubjects,
  restoreSubject,
  updateSubject
} from '../controllers/subjects.controller.js';
import { requireAuth } from '../middlewares/auth.middleware.js';
import { validate } from '../middlewares/validate.middleware.js';
import {
  createSubjectSchema,
  listSubjectsQuerySchema,
  subjectIdSchema,
  updateSubjectSchema
} from '../schemas/subject.schema.js';

export const subjectsRouter = Router();

subjectsRouter.use(requireAuth);

subjectsRouter.get(
  '/',
  validate(listSubjectsQuerySchema, 'query'),
  listSubjects
);
subjectsRouter.post('/', validate(createSubjectSchema), createSubject);
subjectsRouter.get('/:id/stats', validate(subjectIdSchema, 'params'), getSubjectStats);
subjectsRouter.get('/:id', validate(subjectIdSchema, 'params'), getSubject);
subjectsRouter.put(
  '/:id',
  validate(subjectIdSchema, 'params'),
  validate(updateSubjectSchema),
  updateSubject
);
subjectsRouter.delete(
  '/:id',
  validate(subjectIdSchema, 'params'),
  deleteSubject
);
subjectsRouter.post(
  '/:id/restore',
  validate(subjectIdSchema, 'params'),
  restoreSubject
);
