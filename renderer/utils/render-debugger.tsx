/**
 * React render debugger to catch object-to-primitive conversion errors during rendering
 * DISABLED: For production restaurant environment to eliminate console noise
 */

import React from 'react';

// Check if we should enable debugging (only in local development)
const shouldEnableDebugging = false; // Always disabled for restaurant operations

if (!shouldEnableDebugging) {
  console.log('🔇 [RenderDebugger] Debugging disabled for restaurant operations');
} else {
  // Track problematic renders
  const renderIssues: Array<{
    component: string;
    error: string;
    timestamp: string;
    props?: any;
  }> = [];

  // Enhanced createElement to catch rendering issues
  const originalCreateElement = React.createElement;
  React.createElement = function(type, props, ...children) {
    try {
      // Check props for problematic objects
      if (props && typeof props === 'object') {
        Object.keys(props).forEach(key => {
          const value = props[key];
          if (value && typeof value === 'object' && !(value instanceof Date) && !(value instanceof Array)) {
            if (value.constructor === Object && Object.keys(value).length > 0) {
              console.warn('🔧 [RenderDebug] Plain object in props:', {
                component: typeof type === 'string' ? type : type?.name,
                prop: key,
                value
              });
            }
          }
        });
      }
      
      // Check children for problematic objects
      children.forEach((child, index) => {
        if (child && typeof child === 'object' && !(child instanceof Date) && !React.isValidElement(child)) {
          console.warn('🔧 [RenderDebug] Non-React object in children:', {
            component: typeof type === 'string' ? type : type?.name,
            childIndex: index,
            child
          });
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
      
      console.error('🚨 [RenderDebug] createElement error:', errorInfo);
      
      // Return a safe fallback
      return originalCreateElement('div', {
        style: { color: 'red', padding: '8px', border: '1px solid red' }
      }, `Render Error: ${componentName}`);
    }
  };

  // Track component updates
  const originalUseEffect = React.useEffect;
  React.useEffect = function(effect, deps) {
    const safeEffect = () => {
      try {
        return effect();
      } catch (error) {
        console.error('🚨 [RenderDebug] useEffect error:', {
          error: error instanceof Error ? error.message : String(error),
          deps,
          stack: error instanceof Error ? error.stack : undefined
        });
      }
    };
    
    return originalUseEffect(safeEffect, deps);
  };

  console.log('🔧 [RenderDebugger] Debug hooks installed');
}

// Export render issue tracker
export const getRenderIssues = () => [...renderIssues];

export const clearRenderIssues = () => {
  renderIssues.length = 0;
};

export const logRenderIssues = () => {
  if (renderIssues.length > 0) {
    console.group('🚨 [RenderDebug] Render Issues Summary');
    renderIssues.forEach((issue, index) => {
      console.error(`Issue ${index + 1}:`, issue);
    });
    console.groupEnd();
  } else {
    console.log('✅ [RenderDebug] No render issues detected');
  }
};

export default {
  getRenderIssues,
  clearRenderIssues,
  logRenderIssues
};
