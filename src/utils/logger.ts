import pino from 'pino';

export const logger = pino({
  level: 'debug',
  transport: {
    target: 'pino-pretty',
  },
  redact: ['DATABASE_URL'],
});
