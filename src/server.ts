import express from 'express';
import cors from 'cors';
import { connectDB, disconnectDB } from './config/database';
import { env } from './config/env';
import logger from './commonservice/logger';
import { errorHandler } from './middlewares/errorHandler';

import apiRoutes from './routes/index';
import authRoutes from './routes/auth';
import dashboardRoutes from './routes/dashboard';
import coursesRoutes from './routes/courses';
import profileRoutes from './routes/profile';
import financialAssistanceRoutes from './routes/financial_assistance';

const app = express();
const PORT = env.PORT;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const corsOrigins = env.CORS_ORIGINS.split(',').map((o: string) => o.trim());
app.use(
  cors({
    origin: corsOrigins.includes('*') ? true : corsOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

app.use('/api', apiRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/courses', coursesRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/financial-assistance', financialAssistanceRoutes);

app.use(errorHandler);

process.on('SIGTERM', async () => {
  logger.info('SIGTERM signal received: closing HTTP server');
  await disconnectDB();
  process.exit(0);
});

process.on('SIGINT', async () => {
  logger.info('SIGINT signal received: closing HTTP server');
  await disconnectDB();
  process.exit(0);
});

const startServer = async (): Promise<void> => {
  try {
    await connectDB();
    app.listen(PORT, () => {
      logger.info(`✓ Server running on port ${PORT}`);
      logger.info(`✓ Environment: ${env.NODE_ENV}`);
    });
  } catch (error) {
    logger.error('Failed to start server:', { error });
    process.exit(1);
  }
};

startServer();

export default app;
