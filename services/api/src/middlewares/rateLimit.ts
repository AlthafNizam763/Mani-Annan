import rateLimit from 'express-rate-limit';

// Standard API rate limiter: 120 requests per minute
export const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 120,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'TooManyRequests',
    message: 'Rate limit exceeded. Please wait a moment before sending more requests.'
  }
});

// Stricter rate limiter for LLM generation: 20 calls per minute
export const generationLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'TooManyRequests',
    message: 'Reply generation rate limit exceeded. Please wait before generating more drafts.'
  }
});
