import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import passport from './config/passport';
import { env } from './config/env';
import { CONSTANTS } from './config/constants';
import { errorHandler } from './middleware/error.middleware';
import v1Router from './routes/v1/index';

const app = express();

// ── Security ──
app.use(helmet());

// ── CORS ──
app.use(cors({
  origin:         env.FRONTEND_URL,
  credentials:    true,
  methods:        ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// ── Body parsing ──
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));

// ── Passport — must be after body parsing ──
app.use(passport.initialize());

// ── Health check ──
app.get('/health', (req, res) => {
  res.json({
    success:     true,
    message:     'Server is running',
    environment: env.NODE_ENV,
    timestamp:   new Date().toISOString(),
  });
});

// ── API v1 routes ──
app.use(CONSTANTS.API_PREFIX, v1Router);

// ── 404 handler ──
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.method} ${req.path} not found`,
  });
});

// ── Global error handler — must be last ──
app.use(errorHandler);

// ── Start server (Only if not running inside Vercel Serverless) ──
if (!process.env.VERCEL) {
  app.listen(env.PORT, () => {
    console.log('\n🚀 DocForge API is running');
    console.log(`   URL:         http://localhost:${env.PORT}`);
  });
}

export default app;