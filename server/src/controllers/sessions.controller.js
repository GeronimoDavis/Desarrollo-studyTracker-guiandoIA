import * as sessionsService from '../services/sessions.service.js';

export async function createSession(req, res) {
  const { session, created } = await sessionsService.createSession(
    req.user.id,
    req.body
  );

  res.status(created ? 201 : 200).json({
    data: {
      session,
      created
    }
  });
}

export async function listSessions(req, res) {
  const result = await sessionsService.listSessions(
    req.user.id,
    req.validatedQuery
  );

  res.json({ data: result });
}
