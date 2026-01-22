/**
 * Theme Context - Theme-aware components
 * ===========================================
 * Provides React context for theme switching between:
 * - Internal (Staff/Admin): Purple theme
 * - Customer (Public): Burgundy theme
 *
 * Usage:
 * ```tsx
 * // Wrap a page or section with a theme
 * <ThemeProvider theme="internal">
 *   <POSDesktop />
 * </ThemeProvider>
 *
 * // Or use the HOC
 * export default withTheme('customer')(LoginPage);
 *
 * // Access current theme in components
 * const { theme, themeClass } = useTheme();
 * ```
 */

import { createContext, useContext, ReactNode } from 'react';

// Theme types
export type ThemeType = 'internal' | 'customer';

interface ThemeContextValue {
  /** Current theme: 'internal' (purple) or 'customer' (burgundy) */
  theme: ThemeType;
  /** CSS class to apply: 'theme-internal' or 'theme-customer' */
  themeClass: string;
  /** Whether this is the internal/staff theme */
  isInternal: boolean;
  /** Whether this is the customer/public theme */
  isCustomer: boolean;
}

// Default to customer theme (public-facing)
const defaultValue: ThemeContextValue = {
  theme: 'customer',
  themeClass: 'theme-customer',
  isInternal: false,
  isCustomer: true,
};

const ThemeContext = createContext<ThemeContextValue>(defaultValue);

/**
 * Theme Provider Component
 *
 * Wraps children with the appropriate theme class and context.
 *
 * @example
 * ```tsx
 * // For internal/staff pages
 * <ThemeProvider theme="internal">
 *   <AdminDashboard />
 * </ThemeProvider>
 *
 * // For customer/public pages
 * <ThemeProvider theme="customer">
 *   <LoginPage />
 * </ThemeProvider>
 * ```
 */
export function ThemeProvider({
  theme,
  children,
  className = '',
}: {
  theme: ThemeType;
  children: ReactNode;
  /** Additional classes to apply to the wrapper */
  className?: string;
}) {
  const themeClass = `theme-${theme}`;
  const isInternal = theme === 'internal';
  const isCustomer = theme === 'customer';

  return (
    <ThemeContext.Provider value={{ theme, themeClass, isInternal, isCustomer }}>
      <div className={`${themeClass} ${className}`.trim()}>
        {children}
      </div>
    </ThemeContext.Provider>
  );
}

/**
 * Hook to access current theme context
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { theme, isInternal } = useTheme();
 *
 *   return (
 *     <button className={isInternal ? 'bg-internal-primary' : 'bg-customer-primary'}>
 *       Click me
 *     </button>
 *   );
 * }
 * ```
 */
export function useTheme(): ThemeContextValue {
  return useContext(ThemeContext);
}

/**
 * Higher-Order Component for wrapping pages with a theme
 *
 * @example
 * ```tsx
 * // Wrap a page component
 * function POSDesktop() {
 *   return <div>POS Content</div>;
 * }
 *
 * export default withTheme('internal')(POSDesktop);
 * ```
 */
export function withTheme(theme: ThemeType) {
  return function <P extends object>(Component: React.ComponentType<P>) {
    return function ThemedComponent(props: P) {
      return (
        <ThemeProvider theme={theme}>
          <Component {...props} />
        </ThemeProvider>
      );
    };
  };
}

/**
 * Utility to get theme-aware class names
 *
 * @example
 * ```tsx
 * const { theme } = useTheme();
 * const buttonClass = getThemeClass(theme, {
 *   internal: 'bg-purple-600 hover:bg-purple-700',
 *   customer: 'bg-burgundy-600 hover:bg-burgundy-700',
 * });
 * ```
 */
export function getThemeClass(
  theme: ThemeType,
  classes: { internal: string; customer: string }
): string {
  return theme === 'internal' ? classes.internal : classes.customer;
}

export default ThemeContext;
