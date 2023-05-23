import fastify from 'fastify';
import {logger} from './logger';
import {applicationRoutes} from '../modules/applications/application.routes';
export async function buildServer() {
  const app = fastify({
    logger,
  });

  // Register plugins

  // Register routes

  app.register(applicationRoutes, {
    prefix: '/api/applications',
  });
  return app;
}
