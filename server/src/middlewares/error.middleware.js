export function notFoundHandler(req, res) {
  res.status(404).json({
    error: {
      code: 'NOT_FOUND',
      message: 'Recurso no encontrado.'
    }
  });
}

export function errorHandler(err, req, res, next) {
  if (res.headersSent) {
    return next(err);
  }

  const status = Number.isInteger(err.status) ? err.status : 500;
  const code = err.code ?? 'INTERNAL_ERROR';
  const message = err.expose ? err.message : 'Ocurrió un error interno.';

  if (status >= 500) {
    console.error('[error]', {
      method: req.method,
      path: req.originalUrl,
      message: err.message,
      stack: err.stack
    });
  }

  const error = {
    code,
    message
  };

  if (err.fields) {
    error.fields = err.fields;
  }

  res.status(status).json({ error });
}
