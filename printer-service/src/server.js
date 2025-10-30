/**
 * Cottage Tandoori Printer Service - Express HTTP Server
 * Handles thermal printer communication for Electron POS
 */

const express = require('express');
const cors = require('cors');
const logger = require('./logger');
const config = require('./config');
const {
  printKitchenTicket,
  printCustomerReceipt,
  checkPrinterHealth
} = require('./printer-controller');

const app = express();
const startTime = new Date();

// Middleware
app.use(cors({ origin: config.server.corsOrigins }));
app.use(express.json({ limit: '10mb' }));

// Request logging middleware
app.use((req, res, next) => {
  logger.info('HTTP Request', {
    method: req.method,
    path: req.path,
    ip: req.ip
  });
  next();
});

// ============================================================
// ENDPOINT 1: POST /print/kitchen
// ============================================================
app.post('/print/kitchen', async (req, res) => {
  const { order_id } = req.body;
  
  logger.info('Kitchen print request received', { order_id });

  try {
    // Validate request
    if (!order_id || !req.body.items) {
      return res.status(400).json({
        success: false,
        error: 'Invalid request format',
        error_code: 'INVALID_PAYLOAD',
        timestamp: new Date().toISOString()
      });
    }

    // Print kitchen ticket
    const result = await printKitchenTicket(req.body);

    res.status(200).json({
      success: true,
      message: 'Kitchen ticket printed successfully',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    logger.error('Kitchen print failed', {
      order_id,
      error: error.message,
      stack: error.stack
    });

    // Determine error type
    let errorCode = 'PRINT_ERROR';
    let statusCode = 503;

    if (error.message.includes('not found') || error.message.includes('ENOENT')) {
      errorCode = 'PRINTER_NOT_FOUND';
    } else if (error.message.includes('offline') || error.message.includes('ECONNREFUSED')) {
      errorCode = 'PRINTER_OFFLINE';
    } else if (error.message.includes('paper')) {
      errorCode = 'OUT_OF_PAPER';
    } else if (error.message.includes('timeout')) {
      errorCode = 'TIMEOUT';
      statusCode = 504;
    }

    res.status(statusCode).json({
      success: false,
      error: error.message,
      error_code: errorCode,
      timestamp: new Date().toISOString()
    });
  }
});

// ============================================================
// ENDPOINT 2: POST /print/customer
// ============================================================
app.post('/print/customer', async (req, res) => {
  const { order_id } = req.body;
  
  logger.info('Customer receipt print request received', { order_id });

  try {
    // Validate request
    if (!order_id || !req.body.items || !req.body.total) {
      return res.status(400).json({
        success: false,
        error: 'Invalid request format',
        error_code: 'INVALID_PAYLOAD',
        timestamp: new Date().toISOString()
      });
    }

    // Print customer receipt
    const result = await printCustomerReceipt(req.body);

    res.status(200).json({
      success: true,
      message: 'Customer receipt printed successfully',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    logger.error('Customer receipt print failed', {
      order_id,
      error: error.message,
      stack: error.stack
    });

    // Determine error type
    let errorCode = 'PRINT_ERROR';
    let statusCode = 503;

    if (error.message.includes('not found') || error.message.includes('ENOENT')) {
      errorCode = 'PRINTER_NOT_FOUND';
    } else if (error.message.includes('offline') || error.message.includes('ECONNREFUSED')) {
      errorCode = 'PRINTER_OFFLINE';
    } else if (error.message.includes('paper')) {
      errorCode = 'OUT_OF_PAPER';
    } else if (error.message.includes('timeout')) {
      errorCode = 'TIMEOUT';
      statusCode = 504;
    }

    res.status(statusCode).json({
      success: false,
      error: error.message,
      error_code: errorCode,
      timestamp: new Date().toISOString()
    });
  }
});

// ============================================================
// ENDPOINT 3: GET /health
// ============================================================
app.get('/health', async (req, res) => {
  logger.debug('Health check request received');

  try {
    const health = await checkPrinterHealth();
    const uptime = Math.floor((new Date() - startTime) / 1000);

    res.status(200).json({
      ...health,
      uptime_seconds: uptime
    });

  } catch (error) {
    logger.error('Health check failed', {
      error: error.message,
      stack: error.stack
    });

    res.status(503).json({
      status: 'unhealthy',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    service: 'Cottage Tandoori Printer Service',
    version: '1.0.0',
    status: 'running',
    endpoints: [
      'POST /print/kitchen',
      'POST /print/customer',
      'GET /health'
    ]
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  logger.error('Unhandled error', {
    error: err.message,
    stack: err.stack,
    path: req.path
  });

  res.status(500).json({
    success: false,
    error: 'Internal server error',
    error_code: 'INTERNAL_ERROR',
    timestamp: new Date().toISOString()
  });
});

// Start server
const PORT = config.server.port;
const HOST = config.server.host;

app.listen(PORT, HOST, () => {
  logger.info('Printer service started', {
    host: HOST,
    port: PORT,
    version: '1.0.0'
  });
  console.log(`🖨️  Cottage Tandoori Printer Service v1.0.0`);
  console.log(`🚀 Server running at http://${HOST}:${PORT}`);
  console.log(`📋 Health check: http://${HOST}:${PORT}/health`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully');
  process.exit(0);
});
