/**
 * Template loader for thermal receipt templates
 * Integrates with ThermalReceiptDesignerV2 template system
 */

const logger = require('./logger');
const config = require('./config');

/**
 * Default kitchen ticket template
 */
const defaultKitchenTemplate = {
  template_id: 'kitchen_ticket_default',
  header: {
    restaurant_name: 'COTTAGE TANDOORI',
    title: 'KITCHEN TICKET',
    font_size: 1,
    bold: true,
    align: 'center'
  },
  order_info: {
    show_order_id: true,
    show_order_type: true,
    show_table_number: true,
    show_timestamp: true
  },
  items: {
    show_modifiers: true,
    show_quantity: true,
    show_special_instructions: true,
    separator: '=',
    quantity_bold: true
  },
  footer: {
    show_timestamp: true,
    show_order_number: true,
    message: null
  }
};

/**
 * Default customer receipt template
 */
const defaultCustomerTemplate = {
  template_id: 'customer_receipt_default',
  header: {
    restaurant_name: 'COTTAGE TANDOORI',
    title: 'RECEIPT',
    address: '123 Main Street, London',
    phone: '020 1234 5678',
    font_size: 1,
    bold: true,
    align: 'center'
  },
  order_info: {
    show_order_id: true,
    show_order_type: true,
    show_customer_name: true,
    show_timestamp: true
  },
  items: {
    show_modifiers: true,
    show_quantity: true,
    show_price: true,
    separator: '-'
  },
  totals: {
    show_subtotal: true,
    show_tax: true,
    show_total: true,
    currency_symbol: '£'
  },
  footer: {
    show_payment_method: true,
    message: 'Thank you for your order!',
    show_timestamp: true
  }
};

/**
 * Template cache (in production, this would load from backend/database)
 */
const templateCache = new Map([
  ['kitchen_ticket_default', defaultKitchenTemplate],
  ['customer_receipt_default', defaultCustomerTemplate]
]);

/**
 * Load template by ID
 * @param {string} templateId - Template identifier
 * @param {string} type - Template type ('kitchen' or 'customer')
 * @returns {Object} Template configuration
 */
function loadTemplate(templateId, type = 'kitchen') {
  logger.debug('Loading template', { templateId, type });
  
  // Try to load from cache
  if (templateCache.has(templateId)) {
    logger.info('Template loaded from cache', { templateId });
    return templateCache.get(templateId);
  }
  
  // Fallback to default
  logger.warn('Template not found, using default', { templateId, type });
  const defaultTemplate = type === 'kitchen' 
    ? defaultKitchenTemplate 
    : defaultCustomerTemplate;
  
  return defaultTemplate;
}

/**
 * Register a new template (for future backend integration)
 * @param {string} templateId - Template identifier
 * @param {Object} template - Template configuration
 */
function registerTemplate(templateId, template) {
  logger.info('Registering template', { templateId });
  templateCache.set(templateId, template);
}

module.exports = {
  loadTemplate,
  registerTemplate,
  defaultKitchenTemplate,
  defaultCustomerTemplate
};
