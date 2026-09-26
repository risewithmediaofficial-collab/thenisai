import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import { sandboxMiddleware } from './middleware/sandbox.js';
import apiRouter from './routes/index.js';

const app = express();

app.use(cors());
app.use(express.json());

// Never cache API responses
app.use('/api', (req, res, next) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  next();
});

// Tester Sandbox Safety Interceptor
app.use(sandboxMiddleware);

// Mount all /api routes
app.use('/api', apiRouter);

// Verification route
app.get('/google9b5b47e16db557a3.html', (req, res) => {
  res.type('text/html').send('google-site-verification: google9b5b47e16db557a3.html');
});

// Root route
app.get('/', (req, res) => {
  res.json({
    status: 'online',
    service: 'Thenisai Sweets Backend Engine',
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    endpoints: {
      health: '/api/health',
      auth: '/api/auth/login',
      inventory: '/api/inventory',
      orders: '/api/orders',
      bills: '/api/bills',
    },
  });
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'Thenisai Sweets Backend Engine',
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    port: process.env.PORT || 5003,
    timestamp: new Date().toISOString(),
  });
});

export default app;
