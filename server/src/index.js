import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';
import { fileURLToPath } from 'url';
import path from 'path';

import { setupSocketHandlers } from './socket/handler.js';
import authRoutes from './routes/auth.js';
import serviceRoutes from './routes/services.js';
import counterRoutes from './routes/counters.js';
import ticketRoutes from './routes/tickets.js';
import adRoutes from './routes/advertisements.js';
import orgRoutes from './routes/organizations.js';
import masterRoutes from './routes/master.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const prisma = new PrismaClient();

const app = express();
const httpServer = createServer(app);

const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';

const io = new Server(httpServer, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE'],
  },
});

// Make io available to routes
app.set('io', io);

// Middleware
app.use(cors({ origin: '*' }));
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/services', serviceRoutes);
app.use('/api/counters', counterRoutes);
app.use('/api/tickets', ticketRoutes);
app.use('/api/advertisements', adRoutes);
app.use('/api/organizations', orgRoutes);
app.use('/api/master', masterRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Static files
app.use(express.static(path.join(__dirname, '../public')));

// Socket.io
setupSocketHandlers(io);

// SPA catch-all route
app.get('*', (req, res, next) => {
  // If request contains /api/ or is for uploads, don't serve index.html
  if (req.url.startsWith('/api/') || req.url.startsWith('/uploads/')) {
    return next();
  }
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

const PORT = process.env.PORT || 3001;

httpServer.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 QueuePro Server running on port ${PORT}`);
  console.log(`📡 WebSocket server ready`);
  console.log(`🌐 Client URL: ${CLIENT_URL}`);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  await prisma.$disconnect();
  process.exit(0);
});
