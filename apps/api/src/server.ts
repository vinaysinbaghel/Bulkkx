import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import { authMiddleware } from './middleware/auth';
import { authRouter } from './routes/auth';
import { categoriesRouter } from './routes/categories';
import { listingsRouter } from './routes/listings';
import { requirementsRouter } from './routes/requirements';
import { dealsRouter } from './routes/deals';
import { webhooksRouter } from './routes/webhooks';
import { adminRouter } from './routes/admin';

export function createApp(): Express {
  const app = express();

  // Standard middleware
  app.use(cors());
  app.use(express.json());

  // Global logging & audit context
  app.use((req: Request, res: Response, next: NextFunction) => {
    const start = Date.now();
    res.on('finish', () => {
      const duration = Date.now() - start;
      // Minimal dev logging
      if (process.env.NODE_ENV !== 'test') {
        console.log(`[${req.method}] ${req.originalUrl} - ${res.statusCode} (${duration}ms)`);
      }
    });
    next();
  });

  // Health check
  app.get('/health', (req: Request, res: Response) => {
    res.json({
      status: 'healthy',
      system: 'BulkkX Modular Monolith API',
      version: '1.0.0-poc',
      timestamp: new Date().toISOString(),
    });
  });

  // Public webhook routes (Webhook signature validated internally)
  app.use('/api/v1/webhooks', webhooksRouter);

  // Authenticated routes
  app.use('/api/v1/auth', authRouter);
  app.use('/api/v1/categories', authMiddleware, categoriesRouter);
  app.use('/api/v1/listings', authMiddleware, listingsRouter);
  app.use('/api/v1/requirements', authMiddleware, requirementsRouter);
  app.use('/api/v1/deals', authMiddleware, dealsRouter);
  app.use('/api/v1/admin', authMiddleware, adminRouter);

  // Global Error Handler
  app.use((err: any, req: Request, res: Response, next: NextFunction) => {
    console.error('Unhandled API Error:', err);
    res.status(500).json({
      error: 'InternalServerError',
      message: err.message || 'An unexpected server error occurred',
    });
  });

  return app;
}

const PORT = process.env.PORT || 4000;

if (process.env.NODE_ENV !== 'test') {
  const app = createApp();
  app.listen(PORT, () => {
    console.log(`🚀 BulkkX Modular Monolith API running on http://localhost:${PORT}`);
    console.log(`👉 Health check: http://localhost:${PORT}/health`);
  });
}
