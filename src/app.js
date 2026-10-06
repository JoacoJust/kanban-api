const express = require('express');
const cors = require('cors');
const boardRoutes = require('./routes/boardRoutes');
const columnRoutes = require('./routes/columnRoutes');
const ticketRoutes = require('./routes/ticketRoutes');
const { errorHandler, notFound } = require('./middlewares/errorHandler');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString()
  });
});

// API info
app.get('/api', (req, res) => {
  res.json({
    message: 'Kanban API',
    version: '1.0.0'
  });
});

// Rutas anidadas
app.use('/api/boards', boardRoutes);
app.use('/api/boards/:boardId/columns', columnRoutes);
app.use('/api/boards/:boardId/columns/:columnId/tickets', ticketRoutes);

// Manejo de errores
app.use(notFound);
app.use(errorHandler);

module.exports = app;
