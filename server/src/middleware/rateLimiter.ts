import rateLimit from 'express-rate-limit';

export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5000,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
});
