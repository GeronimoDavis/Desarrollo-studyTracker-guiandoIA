import * as subjectsService from '../services/subjects.service.js';

export async function listSubjects(req, res) {
  const includeArchived = req.validatedQuery?.includeArchived === '1';
  const subjects = await subjectsService.listSubjects(req.user.id, {
    includeArchived
  });

  res.json({ data: { subjects } });
}

export async function getSubject(req, res) {
  const subject = await subjectsService.getSubject(
    req.user.id,
    req.validatedParams.id
  );

  res.json({ data: { subject } });
}

export async function createSubject(req, res) {
  const subject = await subjectsService.createSubject(req.user.id, req.body);

  res.status(201).json({ data: { subject } });
}

export async function updateSubject(req, res) {
  const subject = await subjectsService.updateSubject(
    req.user.id,
    req.validatedParams.id,
    req.body
  );

  res.json({ data: { subject } });
}

export async function deleteSubject(req, res) {
  const result = await subjectsService.deleteSubject(
    req.user.id,
    req.validatedParams.id
  );

  if (result.deleted) {
    res.status(204).send();
    return;
  }

  res.json({
    data: {
      subject: result.subject,
      deleted: false
    }
  });
}

export async function restoreSubject(req, res) {
  const subject = await subjectsService.restoreSubject(
    req.user.id,
    req.validatedParams.id
  );

  res.json({ data: { subject } });
}

export async function getSubjectStats(req, res) {
  const result = await subjectsService.getSubjectStats(
    req.user.id,
    req.validatedParams.id
  );

  res.json({ data: result });
}
