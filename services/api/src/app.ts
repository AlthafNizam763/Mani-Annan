import express, { Express } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { apiLimiter } from './middlewares/rateLimit';
import { errorHandler } from './middlewares/error';
import { router as v1Router } from './routes';

export const createApp = (): Express => {
  const app = express();

  // Basic security and parsing middlewares
  app.use(helmet());
  app.use(cors({ origin: true, credentials: true }));
  app.use(express.json({ limit: '10mb' })); // Support chat file uploads up to 10MB
  if (process.env.NODE_ENV !== 'test') {
    app.use(morgan('dev'));
  }

  // Global rate limiter
  app.use(apiLimiter);

  // Health check
  app.get('/health', (_req, res) => {
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      service: 'mani-annan-api'
    });
  });

  // API v1 router
  app.use('/api/v1', v1Router);

  // Centralized error handling
  app.use(errorHandler);

  return app;
};
