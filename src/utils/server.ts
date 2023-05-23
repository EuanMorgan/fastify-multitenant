import fastify from 'fastify';
import {logger} from './logger';
import {applicationRoutes} from '../modules/applications/application.routes';
import {usersRoutes} from '../modules/users/users.routes';
import {roleRoutes} from '../modules/roles/roles.routes';
import guard from 'fastify-guard';
import jwt from 'jsonwebtoken';

type User = {
  id: string;
  scopes: string[];
  applicationId: string;
};

declare module 'fastify' {
  interface FastifyRequest {
    user: User;
  }
}

export async function buildServer() {
  const app = fastify({
    logger,
  });

  app.decorateRequest('user', null);

  app.addHook('onRequest', async function (request, reply) {
    const authHeader = request.headers.authorization;

    if (!authHeader) {
      return;
    }

    try {
      const token = authHeader.replace('Bearer ', '');

      const decoded = jwt.verify(token, 'secret') as User;

      console.log('user', decoded);

      request.user = decoded;
    } catch (error) {}
  });

  // Register plugins

  app.register(guard, {
    requestProperty: 'user',
    scopeProperty: 'scopes',
    errorHandler: (result, request, reply) => {
      return reply.send("You can't do that cunt");
    },
  });

  await app.register(import('@fastify/rate-limit'), {
    max: 100,
    timeWindow: '1 minute',
  });
  // Register routes

  app.register(applicationRoutes, {
    prefix: '/api/applications',
  });

  app.register(usersRoutes, {
    prefix: '/api/users',
  });

  app.register(roleRoutes, {
    prefix: '/api/roles',
  });

  return app;
}
