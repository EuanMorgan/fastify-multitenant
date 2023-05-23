import {env} from './config/env';
import {db} from './db';
import {logger} from './utils/logger';
import {buildServer} from './utils/server';
import {migrate} from 'drizzle-orm/node-postgres/migrator';

async function gracefulShutdown({
  app,
}: {
  app: Awaited<ReturnType<typeof buildServer>>;
}) {
  await app.close();
  logger.info('Server closed');
  process.exit(0);
}

async function main() {
  const app = await buildServer();

  await app.listen({
    port: env.PORT,
    host: env.HOST,
  });

  await migrate(db, {
    migrationsFolder: './migrations',
  });

  logger.debug(env, 'Using env');

  //   Sigint = signal interrupt, sent when user presses ctrl+c
  //   Sigterm = signal terminate, sent when process manager requests termination
  const signals = ['SIGINT', 'SIGTERM', 'SIGQUIT'] as const;

  for (const signal of signals) {
    process.on(signal, () => {
      logger.info(`Received signal: ${signal}`);
      gracefulShutdown({app});
    });
  }
}

main();
