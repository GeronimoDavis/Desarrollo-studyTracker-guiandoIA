import { HttpError } from '../utils/httpError.js';

export function validate(schema, source = 'body') {
  return function validateRequest(req, res, next) {
    const result = schema.safeParse(req[source]);

    if (!result.success) {
      const fields = {};

      for (const issue of result.error.issues) {
        const field = issue.path.length > 0 ? issue.path.join('.') : '_form';

        if (!fields[field]) {
          fields[field] = issue.message;
        }
      }

      return next(
        new HttpError(
          422,
          'VALIDATION_ERROR',
          'Revisá los datos ingresados.',
          fields
        )
      );
    }

    if (source === 'body') {
      req.body = result.data;
    } else if (source === 'query') {
      req.validatedQuery = result.data;
    } else {
      req.validatedParams = result.data;
    }

    return next();
  };
}
