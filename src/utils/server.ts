import fastify from 'fastify';
import {logger} from './logger';
export async function buildServer() {
  const app = fastify({
    logger,
  });

  // Register plugins

  // Register routes

  return app;
}
