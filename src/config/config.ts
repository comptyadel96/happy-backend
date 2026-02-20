import 'dotenv/config';

export default {
  nodeEnv: process.env.NODE_ENV,
  jwtSecret: process.env.JWT_SECRET,
  jwtExpiration: process.env.JWT_EXPIRATION,
  port: parseInt(process.env.PORT || '3000'),
  wsPort: parseInt(process.env.WS_PORT || '3001'),
  corsOrigin: process.env.CORS_ORIGIN,
  argon2: {
    memory: parseInt(process.env.ARGON2_MEMORY || '65540'),
    time: parseInt(process.env.ARGON2_TIME || '3'),
    parallelism: parseInt(process.env.ARGON2_PARALLELISM || '4'),
  },
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'),
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'),
  },
};
