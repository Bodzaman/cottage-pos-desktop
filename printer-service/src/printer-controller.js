/**
 * ESC/POS printer controller using node-thermal-printer
 */

const ThermalPrinter = require('node-thermal-printer').printer;
const PrinterTypes = require('node-thermal-printer').types;
const logger = require('./logger');
const config = require('./config');
const { loadTemplate } = require('./template-loader');

/**
 * Print kitchen ticket
 * @param {Object} orderData - Order data from POS
 * @returns {Promise<Object>} Print result
 */
async function printKitchenTicket(orderData) {
  const {
    order_id,
    order_type,
    table_number,
    items,
    template_id = config.templates.defaultKitchen,
    printer_name = config.printers.kitchen.name
  } = orderData;

  logger.info('Printing kitchen ticket', { order_id, order_type, printer_name });

  try {
    // Load template
    const template = loadTemplate(template_id, 'kitchen');

    // Initialize printer
    const printer = new ThermalPrinter({
      type: PrinterTypes.EPSON,
      interface: config.printers.kitchen.interface,
      characterSet: config.printers.kitchen.characterSet,
      removeSpecialCharacters: false,
      lineCharacter: template.items.separator || '=',
      width: config.printers.kitchen.width
    });

    // Header
    if (template.header) {
      printer.alignCenter();
      if (template.header.bold) printer.bold(true);
      if (template.header.font_size) {
        printer.setTextSize(template.header.font_size, template.header.font_size);
      }
      printer.println(template.header.restaurant_name);
      printer.println(template.header.title);
      printer.bold(false);
      printer.setTextNormal();
      printer.newLine();
    }

    // Order information
    printer.alignLeft();
    if (template.order_info.show_order_id) {
      printer.println(`Order: ${order_id}`);
    }
    if (template.order_info.show_order_type) {
      printer.println(`Type: ${order_type}`);
    }
    if (template.order_info.show_table_number && table_number) {
      printer.println(`Table: ${table_number}`);
    }
    if (template.order_info.show_timestamp) {
      printer.println(`Time: ${new Date().toLocaleString()}`);
    }
    printer.drawLine();

    // Items
    items.forEach((item, index) => {
      if (template.items.quantity_bold) printer.bold(true);
      
      const itemLine = template.items.show_quantity
        ? `${item.quantity}x ${item.name}`
        : item.name;
      
      printer.println(itemLine);
      printer.bold(false);

      // Modifiers
      if (template.items.show_modifiers && item.modifiers && item.modifiers.length > 0) {
        item.modifiers.forEach(mod => {
          printer.println(`  - ${mod}`);
        });
      }

      // Special instructions
      if (template.items.show_special_instructions && item.special_instructions) {
        printer.println(`  * ${item.special_instructions}`);
      }

      if (index < items.length - 1) {
        printer.newLine();
      }
    });

    printer.drawLine();

    // Footer
    if (template.footer) {
      printer.alignCenter();
      if (template.footer.show_timestamp) {
        printer.println(new Date().toLocaleString());
      }
      if (template.footer.message) {
        printer.println(template.footer.message);
      }
    }

    printer.newLine();
    printer.cut();

    // Execute print
    await printer.execute();

    logger.info('Kitchen ticket printed successfully', { order_id });
    return { success: true, message: 'Kitchen ticket printed successfully' };

  } catch (error) {
    logger.error('Kitchen ticket print failed', {
      order_id,
      error: error.message,
      stack: error.stack
    });
    throw error;
  }
}

/**
 * Print customer receipt
 * @param {Object} orderData - Order data from POS
 * @returns {Promise<Object>} Print result
 */
async function printCustomerReceipt(orderData) {
  const {
    order_id,
    order_type,
    customer_name,
    items,
    subtotal,
    tax,
    total,
    payment_method,
    template_id = config.templates.defaultCustomer,
    printer_name = config.printers.customer.name,
    open_drawer = false
  } = orderData;

  logger.info('Printing customer receipt', { order_id, order_type, printer_name });

  try {
    // Load template
    const template = loadTemplate(template_id, 'customer');

    // Initialize printer
    const printerConfig = {
      type: PrinterTypes.EPSON,
      interface: config.printers.customer.interface,
      characterSet: config.printers.customer.characterSet,
      removeSpecialCharacters: false,
      lineCharacter: template.items.separator || '-',
      width: config.printers.customer.width
    };

    // Add network config if network printer
    if (config.printers.customer.interface === 'network') {
      printerConfig.options = {
        host: config.printers.customer.ip,
        port: config.printers.customer.port
      };
    }

    const printer = new ThermalPrinter(printerConfig);

    // Header
    if (template.header) {
      printer.alignCenter();
      if (template.header.bold) printer.bold(true);
      if (template.header.font_size) {
        printer.setTextSize(template.header.font_size, template.header.font_size);
      }
      printer.println(template.header.restaurant_name);
      printer.bold(false);
      printer.setTextNormal();
      
      if (template.header.address) {
        printer.println(template.header.address);
      }
      if (template.header.phone) {
        printer.println(template.header.phone);
      }
      printer.newLine();
      printer.bold(true);
      printer.println(template.header.title);
      printer.bold(false);
      printer.newLine();
    }

    // Order information
    printer.alignLeft();
    if (template.order_info.show_order_id) {
      printer.println(`Order: ${order_id}`);
    }
    if (template.order_info.show_order_type) {
      printer.println(`Type: ${order_type}`);
    }
    if (template.order_info.show_customer_name && customer_name) {
      printer.println(`Customer: ${customer_name}`);
    }
    if (template.order_info.show_timestamp) {
      printer.println(`Date: ${new Date().toLocaleString()}`);
    }
    printer.drawLine();

    // Items
    items.forEach(item => {
      const itemLine = template.items.show_quantity
        ? `${item.quantity}x ${item.name}`
        : item.name;
      
      if (template.items.show_price && item.price) {
        const price = (item.price * item.quantity).toFixed(2);
        const currency = template.totals.currency_symbol || '£';
        printer.tableCustom([
          { text: itemLine, align: 'LEFT', width: 0.7 },
          { text: `${currency}${price}`, align: 'RIGHT', width: 0.3 }
        ]);
      } else {
        printer.println(itemLine);
      }

      // Modifiers
      if (template.items.show_modifiers && item.modifiers && item.modifiers.length > 0) {
        item.modifiers.forEach(mod => {
          printer.println(`  - ${mod}`);
        });
      }
    });

    printer.drawLine();

    // Totals
    if (template.totals) {
      const currency = template.totals.currency_symbol || '£';
      
      if (template.totals.show_subtotal) {
        printer.tableCustom([
          { text: 'Subtotal:', align: 'LEFT', width: 0.7 },
          { text: `${currency}${subtotal.toFixed(2)}`, align: 'RIGHT', width: 0.3 }
        ]);
      }
      
      if (template.totals.show_tax) {
        printer.tableCustom([
          { text: 'Tax:', align: 'LEFT', width: 0.7 },
          { text: `${currency}${tax.toFixed(2)}`, align: 'RIGHT', width: 0.3 }
        ]);
      }
      
      if (template.totals.show_total) {
        printer.bold(true);
        printer.tableCustom([
          { text: 'TOTAL:', align: 'LEFT', width: 0.7 },
          { text: `${currency}${total.toFixed(2)}`, align: 'RIGHT', width: 0.3 }
        ]);
        printer.bold(false);
      }
    }

    printer.drawLine();

    // Payment method
    if (template.footer.show_payment_method) {
      printer.println(`Payment: ${payment_method}`);
      printer.newLine();
    }

    // Footer message
    if (template.footer.message) {
      printer.alignCenter();
      printer.println(template.footer.message);
    }

    printer.newLine();
    
    // Open cash drawer if requested
    if (open_drawer) {
      printer.openCashDrawer();
      logger.info('Cash drawer opened', { order_id });
    }
    
    printer.cut();

    // Execute print
    await printer.execute();

    logger.info('Customer receipt printed successfully', { order_id });
    return { success: true, message: 'Customer receipt printed successfully' };

  } catch (error) {
    logger.error('Customer receipt print failed', {
      order_id,
      error: error.message,
      stack: error.stack
    });
    throw error;
  }
}

/**
 * Check printer health/connectivity
 * @returns {Promise<Object>} Health status
 */
async function checkPrinterHealth() {
  logger.debug('Checking printer health');
  
  const health = {
    status: 'healthy',
    printers: {},
    timestamp: new Date().toISOString()
  };

  // Check kitchen printer
  try {
    const kitchenPrinter = new ThermalPrinter({
      type: PrinterTypes.EPSON,
      interface: config.printers.kitchen.interface,
      characterSet: config.printers.kitchen.characterSet
    });
    
    health.printers[config.printers.kitchen.name] = {
      status: 'online',
      interface: config.printers.kitchen.interface
    };
  } catch (error) {
    logger.warn('Kitchen printer check failed', { error: error.message });
    health.printers[config.printers.kitchen.name] = {
      status: 'offline',
      interface: config.printers.kitchen.interface,
      error: error.message
    };
    health.status = 'degraded';
  }

  // Check customer printer
  try {
    const customerPrinterConfig = {
      type: PrinterTypes.EPSON,
      interface: config.printers.customer.interface,
      characterSet: config.printers.customer.characterSet
    };

    if (config.printers.customer.interface === 'network') {
      customerPrinterConfig.options = {
        host: config.printers.customer.ip,
        port: config.printers.customer.port
      };
    }

    const customerPrinter = new ThermalPrinter(customerPrinterConfig);
    
    health.printers[config.printers.customer.name] = {
      status: 'online',
      interface: config.printers.customer.interface
    };
  } catch (error) {
    logger.warn('Customer printer check failed', { error: error.message });
    health.printers[config.printers.customer.name] = {
      status: 'offline',
      interface: config.printers.customer.interface,
      error: error.message
    };
    health.status = 'degraded';
  }

  return health;
}

module.exports = {
  printKitchenTicket,
  printCustomerReceipt,
  checkPrinterHealth
};
