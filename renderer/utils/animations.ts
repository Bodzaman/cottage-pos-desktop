/**
 * Global Animation Utilities for AI Staff Management Hub
 * 
 * Animation Principles:
 * - Purpose-driven: Every animation serves a UX purpose
 * - Performant: Use CSS transforms and opacity (GPU-accelerated)
 * - Subtle: Animations enhance, not distract (200-400ms duration)
 * - Consistent: Same easing curves across app
 * - Accessible: Respect prefers-reduced-motion
 */

export const globalAnimationStyles = `
/* ===============================================
   KEYFRAME ANIMATIONS
   =============================================== */

/* Fade Animations */
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes fadeOut {
  from { opacity: 1; }
  to { opacity: 0; }
}

/* Slide Animations */
@keyframes slideInFromRight {
  from {
    opacity: 0;
    transform: translateX(100%);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

@keyframes slideInFromLeft {
  from {
    opacity: 0;
    transform: translateX(-20px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes fadeOutLeft {
  from {
    opacity: 1;
    transform: translateX(0);
  }
  to {
    opacity: 0;
    transform: translateX(-20px);
  }
}

@keyframes fadeOutRight {
  from {
    opacity: 1;
    transform: translateX(0);
  }
  to {
    opacity: 0;
    transform: translateX(20px);
  }
}

@keyframes fadeInSlideUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Scale Animations */
@keyframes scaleIn {
  from {
    opacity: 0;
    transform: scale(0.95);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

@keyframes scaleOut {
  from {
    opacity: 1;
    transform: scale(1);
  }
  to {
    opacity: 0;
    transform: scale(0.95);
  }
}

@keyframes scaleInBounce {
  0% {
    opacity: 0;
    transform: scale(0);
  }
  50% {
    transform: scale(1.1);
  }
  100% {
    opacity: 1;
    transform: scale(1);
  }
}

/* Modal/Dialog Animations */
@keyframes backdropFadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes backdropFadeOut {
  from {
    opacity: 1;
  }
  to {
    opacity: 0;
  }
}

@keyframes modalScaleIn {
  from {
    opacity: 0;
    transform: scale(0.95);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

@keyframes modalScaleOut {
  from {
    opacity: 1;
    transform: scale(1);
  }
  to {
    opacity: 0;
    transform: scale(0.95);
  }
}

/* Toast Notification Animations */
@keyframes slideOutToRight {
  from {
    opacity: 1;
    transform: translateX(0);
  }
  to {
    opacity: 0;
    transform: translateX(100%);
  }
}

/* Shake Animation (for errors) */
@keyframes shake {
  0%, 100% { transform: translateX(0); }
  10%, 30%, 50%, 70%, 90% { transform: translateX(-4px); }
  20%, 40%, 60%, 80% { transform: translateX(4px); }
}

/* Pulse Animations */
@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.7; }
}

@keyframes pulseGlow {
  0%, 100% { box-shadow: 0 0 0 0 rgba(124, 93, 250, 0.4); }
  50% { box-shadow: 0 0 20px 5px rgba(124, 93, 250, 0.2); }
}

@keyframes pulseBorder {
  0%, 100% { border-color: rgba(124, 93, 250, 0.3); }
  50% { border-color: rgba(124, 93, 250, 0.7); }
}

/* Shimmer Animation (for loading states) */
@keyframes shimmer {
  0% { background-position: -1000px 0; }
  100% { background-position: 1000px 0; }
}

/* Spin Animation (for loaders) */
@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

@keyframes bounce {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.05); }
}

@keyframes glow {
  0%, 100% { box-shadow: 0 0 5px rgba(124, 93, 250, 0.2); }
  50% { box-shadow: 0 0 20px rgba(124, 93, 250, 0.4); }
}

/* ===============================================
   REUSABLE ANIMATION CLASSES
   =============================================== */

/* Button Animations */
.btn-animated {
  transition: all 200ms cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
}

.btn-animated:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.btn-animated:active:not(:disabled) {
  transform: translateY(0) scale(0.98);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.btn-animated:disabled {
  cursor: not-allowed;
  opacity: 0.5;
}

/* Button Loading State */
.btn-loading {
  pointer-events: none;
  position: relative;
}

.btn-loading::after {
  content: '';
  position: absolute;
  inset: 0;
  background: inherit;
  animation: pulse 1.5s ease-in-out infinite;
}

/* Input/Textarea Focus Animations */
.input-animated {
  transition: all 200ms cubic-bezier(0.4, 0, 0.2, 1);
}

.input-animated:focus {
  transform: scale(1.01);
  box-shadow: 0 0 0 3px rgba(124, 93, 250, 0.1);
}

.input-animated:hover:not(:focus):not(:disabled) {
  border-color: rgba(124, 93, 250, 0.4);
}

/* Input Validation States */
.input-valid {
  border-color: #0EBAB1 !important;
  animation: none;
}

.input-invalid {
  border-color: #EF4444 !important;
  animation: shake 400ms cubic-bezier(0.36, 0.07, 0.19, 0.97);
}

/* Card Hover Effects */
.card-hover {
  transition: all 250ms cubic-bezier(0.4, 0, 0.2, 1);
}

.card-hover:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
}

/* Stage Transition Animations */
.stage-exit {
  animation: fadeOut 200ms cubic-bezier(0.4, 0, 1, 1) forwards;
}

.stage-enter-forward {
  animation: slideInFromRight 300ms cubic-bezier(0, 0, 0.2, 1) forwards;
}

.stage-enter-backward {
  animation: slideInFromLeft 300ms cubic-bezier(0, 0, 0.2, 1) forwards;
}

/* Modal/Dialog Animations */
.modal-backdrop {
  animation: fadeIn 200ms cubic-bezier(0.4, 0, 0.2, 1);
}

.modal-content {
  animation: scaleIn 300ms cubic-bezier(0, 0, 0.2, 1);
}

/* Icon Animations */
.icon-spin {
  animation: spin 1s linear infinite;
}

.icon-bounce {
  animation: bounce 600ms cubic-bezier(0.4, 0, 0.2, 1);
}

/* Badge/Pill Animations */
.badge-appear {
  animation: scaleIn 200ms cubic-bezier(0, 0, 0.2, 1);
}

/* Success Checkmark Animation */
.checkmark-appear {
  animation: scaleInBounce 300ms cubic-bezier(0.34, 1.56, 0.64, 1);
}

/* Stagger Animations (for lists) */
.stagger-item {
  animation: slideUp 300ms cubic-bezier(0, 0, 0.2, 1) both;
}

.stagger-item:nth-child(1) { animation-delay: 0ms; }
.stagger-item:nth-child(2) { animation-delay: 100ms; }
.stagger-item:nth-child(3) { animation-delay: 200ms; }
.stagger-item:nth-child(4) { animation-delay: 300ms; }
.stagger-item:nth-child(5) { animation-delay: 400ms; }

/* Skeleton/Loading Shimmer */
.skeleton-shimmer {
  background: linear-gradient(
    90deg,
    rgba(255, 255, 255, 0.05) 0%,
    rgba(255, 255, 255, 0.1) 50%,
    rgba(255, 255, 255, 0.05) 100%
  );
  background-size: 200% 100%;
  animation: shimmer 1.5s ease-in-out infinite;
}

/* ===============================================
   ACCESSIBILITY: Reduced Motion
   =============================================== */

@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}

/* Modal Animation Classes */
.modal-backdrop {
  animation: backdropFadeIn 200ms ease-out;
}

.modal-backdrop-exit {
  animation: backdropFadeOut 200ms ease-in;
}

.modal-content {
  animation: modalScaleIn 300ms cubic-bezier(0.4, 0, 0.2, 1);
}

.modal-content-exit {
  animation: modalScaleOut 200ms cubic-bezier(0.4, 0, 1, 1);
}

/* Card Stagger Animations */
.card-stagger {
  animation: fadeInSlideUp 400ms ease-out;
  animation-fill-mode: backwards;
}

.card-stagger-1 { animation-delay: 0ms; }
.card-stagger-2 { animation-delay: 100ms; }
.card-stagger-3 { animation-delay: 200ms; }
.card-stagger-4 { animation-delay: 300ms; }
.card-stagger-5 { animation-delay: 400ms; }

/* Icon Micro-interactions */
.icon-bounce {
  animation: scaleInBounce 400ms cubic-bezier(0.34, 1.56, 0.64, 1);
}

.icon-rotate-hover {
  transition: transform 200ms ease-out;
}

.icon-rotate-hover:hover {
  transform: rotate(15deg);
}

/* Badge Animations */
.badge-pulse {
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

.badge-scale-in {
  animation: scaleIn 200ms ease-out;
}
`;

/**
 * Inject animation styles into the document
 * Call this once on app initialization or wizard mount
 */
export function injectAnimationStyles(): void {
  if (typeof document === 'undefined') return;
  
  const styleId = 'global-animation-styles';
  
  // Check if already injected
  if (document.getElementById(styleId)) return;
  
  const styleElement = document.createElement('style');
  styleElement.id = styleId;
  styleElement.textContent = globalAnimationStyles;
  document.head.appendChild(styleElement);
}

/**
 * Animation utility classes for easy application
 */
export const animationClasses = {
  // Buttons
  button: 'btn-animated',
  buttonLoading: 'btn-loading',
  
  // Inputs
  input: 'input-animated',
  inputValid: 'input-valid',
  inputInvalid: 'input-invalid',
  
  // Cards
  cardHover: 'card-hover',
  
  // Stage transitions
  stageExit: 'stage-exit',
  stageEnterForward: 'stage-enter-forward',
  stageEnterBackward: 'stage-enter-backward',
  
  // Modals
  modalBackdrop: 'modal-backdrop',
  modalContent: 'modal-content',
  
  // Icons
  iconSpin: 'icon-spin',
  iconBounce: 'icon-bounce',
  
  // Badges
  badgeAppear: 'badge-appear',
  
  // Checkmarks
  checkmarkAppear: 'checkmark-appear',
  
  // Lists
  staggerItem: 'stagger-item',
  
  // Loading
  skeletonShimmer: 'skeleton-shimmer',
} as const;

/**
 * Get animation class based on validation state
 */
export function getInputAnimationClass(state: 'idle' | 'valid' | 'invalid'): string {
  const baseClass = animationClasses.input;
  if (state === 'valid') return `${baseClass} ${animationClasses.inputValid}`;
  if (state === 'invalid') return `${baseClass} ${animationClasses.inputInvalid}`;
  return baseClass;
}

/**
 * Get button animation classes
 */
export function getButtonAnimationClass(isLoading?: boolean): string {
  return isLoading 
    ? `${animationClasses.button} ${animationClasses.buttonLoading}`
    : animationClasses.button;
}
