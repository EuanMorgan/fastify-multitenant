import fastify from 'fastify';
import {logger} from './logger';
import {applicationRoutes} from '../modules/applications/application.routes';
export async function buildServer() {
  const app = fastify({
    logger,
  });

  // Register plugins

  await app.register(import('@fastify/rate-limit'), {
    max: 100,
    timeWindow: '1 minute',
  });
  // Register routes

  app.register(applicationRoutes, {
    prefix: '/api/applications',
  });
  return app;
}
