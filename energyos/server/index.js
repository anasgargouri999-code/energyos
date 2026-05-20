const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const { requestLogger, logger } = require('./middleware/logger');
const authRoutes = require('./routes/auth');
const adminRoutes = require('./routes/admin');
const gtbRoutes = require('./routes/gtb');
const groqRoutes = require('./routes/groq');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());
app.use(requestLogger);

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/gtb', gtbRoutes);
app.use('/api/groq', groqRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Error handler middleware
app.use((err, req, res, next) => {
  logger.error('Unhandled Error:', { error: err.message, stack: err.stack });
  const status = err.status || 500;
  const message = err.message || 'Internal Server Error';
  res.status(status).json({ error: message });
});

// Process-wide error handling
process.on('uncaughtException', (err) => {
  logger.error('Uncaught Exception:', { error: err.message, stack: err.stack });
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection:', {
    reason: reason instanceof Error ? reason.message : String(reason),
    stack: reason instanceof Error ? reason.stack : null
  });
});

// Start server
const server = app.listen(PORT, () => {
  logger.info(`EnergyOS server running on port ${PORT}`);
});

server.on('error', (err) => {
  logger.error('Server failed to start or encountered an error:', { error: err.message, stack: err.stack });
});

