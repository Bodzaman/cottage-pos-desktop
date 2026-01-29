/**
 * Checkout Module - Barrel Exports
 *
 * Modern single-page accordion checkout experience
 * Inspired by Deliveroo, UberEats, and DoorDash
 */

// Main Components
export { CheckoutContainer } from './CheckoutContainer';
export { CheckoutProvider, useCheckout, CHECKOUT_STEPS } from './CheckoutProvider';
export type { CheckoutStep } from './CheckoutProvider';

// Step Components
export { ContactStep } from './steps/ContactStep';
export { DeliveryStep } from './steps/DeliveryStep';
export { CollectionStep } from './steps/CollectionStep';
export { TimeSlotStep } from './steps/TimeSlotStep';
export { PaymentStep } from './steps/PaymentStep';

// UI Components
export { CheckoutProgress } from './ui/CheckoutProgress';
export { OrderSummary } from './ui/OrderSummary';
export { DeliveryToggle } from './ui/DeliveryToggle';
export { PromoCodeInput } from './ui/PromoCodeInput';
export { TrustBadges } from './ui/TrustBadges';

// Mobile Components
export { MobileCheckoutSheet } from './mobile/MobileCheckoutSheet';
export { MobileStickyFooter } from './mobile/MobileStickyFooter';
