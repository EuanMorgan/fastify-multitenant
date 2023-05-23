import {FastifyInstance} from 'fastify';
import {
  createApplicationHandler,
  getApplicationsHandler,
} from './application.controllers';
import {createTableRelationsHelpers} from 'drizzle-orm';
import {createApplicationJsonSchema} from './applications.schemas';

export async function applicationRoutes(app: FastifyInstance) {
  app.post(
    '/',
    {
      schema: createApplicationJsonSchema,
    },
    createApplicationHandler
  );

  app.get('/', getApplicationsHandler);
}
