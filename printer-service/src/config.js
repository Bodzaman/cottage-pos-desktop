/**
 * Configuration for Cottage Tandoori Printer Service
 */

module.exports = {
  // Server configuration
  server: {
    port: 3000,
    host: '127.0.0.1', // localhost only - security
    corsOrigins: ['http://localhost:*', 'file://*'] // Allow Electron apps
  },

  // Printer configuration
  printers: {
    kitchen: {
      name: 'TM-T20II',
      type: 'epson',
      interface: 'usb',
      characterSet: 'PC437_USA',
      width: 42 // characters per line
    },
    customer: {
      name: 'TM-T88V',
      type: 'epson',
      interface: 'network',
      characterSet: 'PC437_USA',
      width: 48,
      ip: '192.168.1.100', // Update this to match your printer IP
      port: 9100
    }
  },

  // Logging configuration
  logging: {
    directory: 'C:\\ProgramData\\CottageTandoori\\Logs',
    filename: 'printer-service.log',
    maxSize: 10485760, // 10MB
    maxFiles: 5,
    level: 'info'
  },

  // Template configuration
  templates: {
    directory: './templates',
    defaultKitchen: 'kitchen_ticket_default',
    defaultCustomer: 'customer_receipt_default'
  },

  // Print job configuration
  printJob: {
    timeoutMs: 30000, // 30 seconds
    retryAttempts: 3,
    retryDelayMs: 2000
  }
};
