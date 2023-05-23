import {env} from './config/env';
import {logger} from './utils/logger';
import {buildServer} from './utils/server';

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
