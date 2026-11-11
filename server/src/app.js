import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';

import { env } from './config/env.js';
import { apiRouter } from './routes/index.js';
import {
  errorHandler,
  notFoundHandler
} from './middlewares/error.middleware.js';
import { originCheck } from './middlewares/origin.middleware.js';
import { apiLimiter } from './middlewares/rateLimit.middleware.js';

export function createApp() {
  const app = express();

  app.disable('x-powered-by');

  app.use(helmet());
  app.use(
    cors({
      origin: env.CLIENT_ORIGIN,
      credentials: true
    })
  );
  app.use(express.json({ limit: '100kb' }));
  app.use(cookieParser());

  if (env.NODE_ENV !== 'test') {
    app.use(morgan('dev'));
  }

  app.use('/api', originCheck);
  app.use('/api', apiLimiter);
  app.use('/api', apiRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
