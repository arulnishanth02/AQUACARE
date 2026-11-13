import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { aiConfig, validateEnvironment } from './ai/aiConfig.js';
import aiRoutes from './routes/aiRoutes.js';
import { ProviderHealthCheck } from './ai/providerHealthCheck.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = aiConfig.port;

// Middlewares
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Request logging
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    if (req.path.startsWith('/api')) {
      console.log(`[AquaCare API] ${req.method} ${req.path} -> ${res.statusCode} (${duration}ms)`);
    }
  });
  next();
});

// AI Routes
app.use('/api/ai', aiRoutes);

// Direct top-level chat aliases for messages, history, and deletion
app.use('/api/chat', (req, res, next) => {
  req.url = `/chat${req.url === '/' ? '' : req.url}`;
  aiRoutes(req, res, next);
});

// Direct pond and knowledge aliases
app.use('/api/pond', (req, res, next) => {
  req.url = `/pond${req.url}`;
  aiRoutes(req, res, next);
});

app.use('/api/knowledge', (req, res, next) => {
  req.url = `/knowledge${req.url}`;
  aiRoutes(req, res, next);
});

// Root API Health
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    service: 'AquaCare Intelligent Aquaculture Engine',
    timestamp: new Date().toISOString()
  });
});

// Serve frontend build if present
const clientDist = path.resolve(__dirname, '../client/dist');
app.use(express.static(clientDist));
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api')) return next();
  res.sendFile(path.join(clientDist, 'index.html'), err => {
    if (err) next();
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('[Unhandled Error]', err);
  res.status(500).json({
    success: false,
    error: err.message || 'Internal Server Error'
  });
});

// Startup validation and listener
const envCheck = validateEnvironment();
if (!envCheck.isValid) {
  console.warn('[AquaCare Warning] Environment notice:', envCheck.issues.join('; '));
}

app.listen(PORT, async () => {
  console.log('====================================================');
  console.log(` AquaCare Backend Server running on port ${PORT}`);
  console.log(` Mode: ${aiConfig.defaultProvider.toUpperCase()}`);
  console.log(` Ollama Host: ${aiConfig.ollama.baseUrl}`);
  console.log('====================================================');

  // Initial provider check
  try {
    const health = await ProviderHealthCheck.checkAll();
    console.log(`[Health] Gemini: ${health.gemini.status} (${health.gemini.message})`);
    console.log(`[Health] Ollama: ${health.ollama.status} (${health.ollama.message})`);
  } catch (err) {
    console.warn('[Health] Initial check failed:', err.message);
  }
});

