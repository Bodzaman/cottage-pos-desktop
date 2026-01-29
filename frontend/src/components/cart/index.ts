/**
 * Cart Components - Barrel Exports
 *
 * Unified cart system with:
 * - Mobile bottom sheet (CartSheet)
 * - Desktop side panel (CartPanel)
 * - Header badge with animations (CartMini)
 * - Shared content components
 */

// Main orchestrator
export { UnifiedCart } from './UnifiedCart';

// Layout components
export { CartSheet } from './CartSheet';
export { CartPanel } from './CartPanel';
export { CartMini } from './CartMini';

// Shared components
export { CartHeader } from './CartHeader';
export { CartItemList } from './CartItemList';
export { CartFooter } from './CartFooter';
export { CartEmpty } from './CartEmpty';

// Animations
export { FlyToCart } from './animations/FlyToCart';
export { PricePulse } from './animations/PricePulse';
export { UndoToast } from './animations/UndoToast';
export { CartBadgeBounce } from './animations/CartBadgeBounce';
