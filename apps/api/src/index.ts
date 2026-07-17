import { env } from './config/env';
import { connectDB, disconnectDB } from './config/db';
import { logger } from './utils/logger';
import app from './app';

// ─── Boot sequence ────────────────────────────────────────────────────────────
const start = async (): Promise<void> => {
  try {
    // 1. Connect to MongoDB Atlas
    await connectDB();

    // 2. Start HTTP server
    const server = app.listen(env.PORT, () => {
      logger.info(`
╔══════════════════════════════════════════════╗
║          🛍️  StyleHub API Server              ║
╠══════════════════════════════════════════════╣
║  Environment : ${env.NODE_ENV.padEnd(28)}║
║  Port        : ${String(env.PORT).padEnd(28)}║
║  API Base    : http://localhost:${env.PORT}/api      ║
║  Health      : http://localhost:${env.PORT}/api/health║
╚══════════════════════════════════════════════╝
      `);
    });

    // ─── Graceful Shutdown ────────────────────────────────────────────────────
    const shutdown = async (signal: string): Promise<void> => {
      logger.info(`\n${signal} received — shutting down gracefully…`);

      server.close(async () => {
        logger.info('HTTP server closed');
        await disconnectDB();
        logger.info('Goodbye 👋');
        process.exit(0);
      });

      // Force exit after 10s if graceful shutdown hangs
      setTimeout(() => {
        logger.error('Graceful shutdown timed out — forcing exit');
        process.exit(1);
      }, 10_000);
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

// ─── Handle uncaught errors ───────────────────────────────────────────────────
process.on('uncaughtException', (err) => {
  logger.error('Uncaught Exception:', err);
  process.exit(1);
});

process.on('unhandledRejection', (reason) => {
  logger.error('Unhandled Rejection:', reason);
  process.exit(1);
});

start();
