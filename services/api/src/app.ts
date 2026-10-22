import express, { Express } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { apiLimiter } from './middlewares/rateLimit';
import { errorHandler } from './middlewares/error';
import { router as v1Router } from './routes';
import { config } from './config';

export const createApp = (): Express => {
  const app = express();

  // Basic security and parsing middlewares
  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: 'cross-origin' }
    })
  );

  // CORS configuration
  const allowedOrigins = config.cors.origin
    ? config.cors.origin.split(',').map(o => o.trim()).filter(Boolean)
    : [];

  const corsOptions: cors.CorsOptions = {
    origin: (origin, callback) => {
      // Allow requests with no origin (e.g. mobile apps, curl, server-to-server)
      if (!origin) return callback(null, true);
      // If specific origins configured, check match; otherwise permit origin
      if (allowedOrigins.length > 0) {
        if (allowedOrigins.includes(origin) || allowedOrigins.includes('*')) {
          return callback(null, true);
        }
        return callback(new Error(`CORS blocked for origin: ${origin}`));
      }
      return callback(null, true);
    },
    credentials: true,
    methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'X-Requested-With']
  };

  app.use(cors(corsOptions));
  app.options('*', cors(corsOptions));

  app.use(express.json({ limit: '10mb' })); // Support chat file uploads up to 10MB
  if (process.env.NODE_ENV !== 'test') {
    app.use(morgan('dev'));
  }

  // Global rate limiter
  app.use(apiLimiter);

  // Root status route
  app.get('/', (_req, res) => {
    res.json({
      service: 'mani-annan-api',
      status: 'online',
      version: '1.0.0',
      endpoints: {
        health: '/health',
        apiV1: '/api/v1'
      }
    });
  });

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
