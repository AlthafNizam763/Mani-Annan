import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';

export const errorHandler = (
  err: any,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  if (err instanceof ZodError) {
    res.status(400).json({
      error: 'ValidationError',
      message: 'Invalid request payload',
      issues: err.errors.map(e => ({
        path: e.path.join('.'),
        message: e.message
      }))
    });
    return;
  }

  const statusCode = err.statusCode || 500;
  let message = err.message || 'Internal Server Error';

  // Provide explicit actionable diagnosis if Google/Firebase credentials are missing
  if (typeof message === 'string' && message.includes('Could not load the default credentials')) {
    message = 'Firebase Admin credentials missing. Please set FIREBASE_SERVICE_ACCOUNT_KEY or FIREBASE_CLIENT_EMAIL and FIREBASE_PRIVATE_KEY in your environment variables.';
  }

  const isDevOrTest = process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test';

  res.status(statusCode).json({
    error: err.name || 'InternalServerError',
    message,
    ...(isDevOrTest ? { stack: err.stack, details: err.message } : {})
  });
};
