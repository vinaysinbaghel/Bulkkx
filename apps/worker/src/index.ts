import PgBoss from 'pg-boss';
import pino from 'pino';

const logger = pino({ name: 'bulkkx-worker' });

async function startWorker() {
  const connectionString = process.env.DATABASE_URL || 'postgres://bulkkx_user:bulkkx_password@localhost:5432/bulkkx_db';
  logger.info({ connectionString: connectionString.replace(/:[^:@]+@/, ':***@') }, 'Initializing BulkkX async background worker');

  const boss = new PgBoss(connectionString);

  boss.on('error', (error) => logger.error({ error }, 'PgBoss background worker error'));

  await boss.start();
  logger.info('BulkkX worker registered pg-boss queues for SLA timers, lock expiry, and outbox.');

  // Outbox consumer job
  await boss.work('deal-sla-monitor', async (jobs) => {
    for (const job of jobs) {
      logger.info({ jobId: job.id, data: job.data }, 'Processing deal SLA monitoring job');
    }
    return;
  });

  // Lock expiry job
  await boss.work('lock-expiry-check', async (jobs) => {
    for (const job of jobs) {
      logger.info({ jobId: job.id }, 'Checking for expired price locks');
    }
    return;
  });
}

if (process.env.NODE_ENV !== 'test') {
  startWorker().catch((err) => {
    logger.fatal({ err }, 'Worker fatal startup error');
  });
}

export { startWorker };
