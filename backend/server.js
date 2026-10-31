import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import { readFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import admin from 'firebase-admin';
import { authenticate } from './middleware/auth.js';
import usersRouter from './routes/users.js';
import issuesRouter from './routes/issues.js';
import notificationsRouter from './routes/notifications.js';
import analyticsRouter from './routes/analytics.js';
import uploadsRouter from './routes/uploads.js';

function redactSensitiveValue(value) {
  return String(value)
    .replace(/mongodb(?:\+srv)?:\/\/[^\s"'`]+/gi, 'mongodb://<redacted>')
    .replace(/-----BEGIN [^-]*PRIVATE KEY-----[\s\S]*?-----END [^-]*PRIVATE KEY-----/g, '<redacted private key>')
    .replace(/AIza[A-Za-z0-9_-]{20,}/g, '<redacted API key>')
    .replace(/((?:password|passwd|private_key|apiKey|api_key)\s*[:=]\s*)(?:"[^"]*"|'[^']*'|[^,\s}]+)/gi, '$1<redacted>');
}

function logProcessError(label, error) {
  const details = error instanceof Error
    ? `${error.name}: ${redactSensitiveValue(error.message)}${error.stack ? `\n${redactSensitiveValue(error.stack)}` : ''}`
    : redactSensitiveValue(error);
  console.error(label, details);
}

process.on('unhandledRejection', (reason) => {
  logProcessError('Unhandled promise rejection:', reason);
  process.exit(1);
});

process.on('uncaughtException', (error) => {
  logProcessError('Uncaught exception:', error);
  process.exit(1);
});

const backendDirectory = dirname(fileURLToPath(import.meta.url));
if (!process.env.MONGODB_URI) throw new Error('MONGODB_URI must be set in the environment.');

let serviceAccount;
if (process.env.FIREBASE_SERVICE_ACCOUNT) {
  try {
    serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
  } catch {
    throw new Error('FIREBASE_SERVICE_ACCOUNT must contain valid JSON.');
  }
} else {
  const credentialsPath = resolve(backendDirectory, 'serviceAccountKey.json');
  try {
    serviceAccount = JSON.parse(await readFile(credentialsPath, 'utf8'));
  } catch (error) {
    if (error.code === 'ENOENT') {
      throw new Error(
        'Firebase credentials are missing. Set FIREBASE_SERVICE_ACCOUNT or provide backend/serviceAccountKey.json for local development.'
      );
    }
    if (error instanceof SyntaxError) {
      throw new Error('backend/serviceAccountKey.json must contain valid JSON.');
    }
    throw error;
  }
}
if (
  !serviceAccount
  || typeof serviceAccount !== 'object'
  || Array.isArray(serviceAccount)
  || typeof serviceAccount.project_id !== 'string'
  || !serviceAccount.project_id
) {
  throw new Error('Firebase service account credentials must include a project_id.');
}
const adminProjectId = serviceAccount.project_id;
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId: adminProjectId,
});
console.log(`firebase-admin project_id: ${adminProjectId}`);

const app = express();
const port = Number(process.env.PORT) || 5000;
const allowedOrigins = (process.env.ALLOWED_ORIGINS
  || 'http://localhost:5173,http://localhost:5174')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(cors({
  origin: allowedOrigins,
}));
app.use(express.json({ limit: '12mb' }));
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected' });
});
app.use('/api', authenticate);
app.use('/api/users', usersRouter);
app.use('/api/issues', issuesRouter);
app.use('/api/notifications', notificationsRouter);
app.use('/api/analytics', analyticsRouter);
app.use('/api/uploads', uploadsRouter);

app.use((error, _req, res, _next) => {
  if (error.name === 'MulterError') {
    if (error.code === 'LIMIT_FILE_SIZE') return res.status(413).json({ error: 'Image must be 5 MB or smaller.' });
    return res.status(400).json({ error: 'Upload exactly one image file.' });
  }
  if (error.code === 'AZURE_STORAGE_NOT_CONFIGURED' || error.code === 'AZURE_STORAGE_CONFIGURATION_INVALID') {
    return res.status(503).json({ error: 'Image storage is not configured correctly on the server.' });
  }
  if (error.code === 'INVALID_BLOB_NAME') return res.status(400).json({ error: 'Invalid image reference.' });
  console.error('API request failed:', error);
  if (error.name === 'ValidationError') return res.status(400).json({ error: error.message });
  if (error.name === 'CastError') return res.status(400).json({ error: 'Invalid document ID.' });
  res.status(500).json({ error: 'An unexpected server error occurred.' });
});

await mongoose.connect(process.env.MONGODB_URI);
console.log('MongoDB connected');

const server = app.listen(port, '0.0.0.0', () => console.log(`CommuniLink API listening on port ${port}`));
server.on('error', (error) => {
  if (error.code === 'EADDRINUSE') {
    console.error(`Port ${port} is already in use. Stop the other backend instance before restarting.`);
  } else {
    logProcessError('Backend server failed to listen:', error);
  }
  process.exit(1);
});
