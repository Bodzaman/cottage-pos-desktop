/**
 * React render debugger to catch object-to-primitive conversion errors during rendering
 * DISABLED: For production restaurant environment to eliminate console noise
 */

import React from 'react';

// Check if we should enable debugging (only in local development)
const shouldEnableDebugging = false; // Always disabled for restaurant operations

// Track problematic renders
const renderIssues: Array<{
  component: string;
  error?: string;
  timestamp: string;
  props?: any;
  deps?: any;
}> = [];

if (shouldEnableDebugging) {
  // Store original createElement
  const originalCreateElement = React.createElement;

  // Override createElement to catch render errors
  React.createElement = function(type: any, props: any, ...children: any[]) {
    try {
      // Check props for problematic objects
      if (props && typeof props === 'object') {
        Object.entries(props).forEach(([key, value]) => {
          if (value && typeof value === 'object' && !(value instanceof Date) && !React.isValidElement(value)) {
            if (Array.isArray(value)) return; // Arrays are OK
            if (value === null) return;
            // Check if it has Symbol.toPrimitive or toString
            if (typeof (value as any)[Symbol.toPrimitive] !== 'function' &&
                typeof value.toString !== 'function') {
              renderIssues.push({
                component: typeof type === 'string' ? type : type?.name,
                error: `Prop "${key}" may cause render issues`,
                timestamp: new Date().toISOString()
              });
            }
          }
        });
      }

      // Check children for problematic objects
      children.forEach((child, index) => {
        if (child && typeof child === 'object' && !(child instanceof Date) && !React.isValidElement(child)) {
          if (!Array.isArray(child)) {
            renderIssues.push({
              component: typeof type === 'string' ? type : type?.name,
              error: `Child at index ${index} may cause render issues`,
              timestamp: new Date().toISOString()
            });
          }
        }
      });

      return originalCreateElement.apply(this, [type, props, ...children]);
    } catch (error) {
      const componentName = typeof type === 'string' ? type : type?.name || 'Unknown';
      const errorInfo = {
        component: componentName,
        error: error instanceof Error ? error.message : String(error),
        timestamp: new Date().toISOString(),
        props
      };

      renderIssues.push(errorInfo);

      // Return a safe fallback
      return originalCreateElement('div', {
        style: { color: 'red', padding: '8px', border: '1px solid red' }
      }, `Render Error: ${componentName}`);
    }
  };

  // Track component updates
  const originalUseEffect = React.useEffect;
  React.useEffect = function(effect: any, deps?: any) {
    const safeEffect = () => {
      try {
        return effect();
      } catch (error) {
        renderIssues.push({
          component: 'useEffect',
          error: error instanceof Error ? error.message : String(error),
          timestamp: new Date().toISOString(),
          deps
        });
      }
    };

    return originalUseEffect(safeEffect, deps);
  };
}

// Export render issue tracker
export const getRenderIssues = () => [...renderIssues];

export const clearRenderIssues = () => {
  renderIssues.length = 0;
};

export const logRenderIssues = () => {
  if (renderIssues.length > 0) {
    console.group('Render Issues Detected');
    renderIssues.forEach((issue, index) => {
      console.error(`Issue ${index + 1}:`, issue);
    });
    console.groupEnd();
  } else {
    console.log('No render issues detected');
  }
};

export default {
  getRenderIssues,
  clearRenderIssues,
  logRenderIssues
};
