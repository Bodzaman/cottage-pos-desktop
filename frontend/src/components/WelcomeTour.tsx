import { useEffect, useRef } from 'react';
import Shepherd from 'shepherd.js';
import 'shepherd.js/dist/css/shepherd.css';
import '../styles/shepherd-theme.css';
import { useOnboardingStore } from 'utils/onboardingStore';

interface Props {
  onComplete?: () => void;
}

export function WelcomeTour({ onComplete }: Props) {
  const { shouldShowTour, status, markTourComplete, dismissTour } = useOnboardingStore();
  const tourRef = useRef<Shepherd.Tour | null>(null);

  useEffect(() => {
    const shouldShow = shouldShowTour();
    if (!shouldShow || !status?.customer_id) return;

    // Create tour instance
    const tour = new Shepherd.Tour({
      useModalOverlay: true,
      defaultStepOptions: {
        classes: 'shadow-md bg-purple-dark',
        scrollTo: true,
      },
    });

    // Step 1: Welcome
    tour.addStep({
      id: 'welcome',
      title: '👋 Welcome to Your Customer Portal!',
      text: `
        <p class="text-base leading-relaxed">
          We're excited to have you here! Let's take a quick tour to show you around.
          <br/><br/>
          This portal is your hub for managing orders, saving favorites, and personalizing your experience.
        </p>
      `,
      buttons: [
        {
          text: 'Skip Tour',
          action: tour.cancel,
          secondary: true,
        },
        {
          text: 'Next',
          action: tour.next,
        },
      ],
    });

    // Step 2: Profile Tab
    tour.addStep({
      id: 'profile',
      title: '📋 Complete Your Profile',
      text: `
        <p class="text-base leading-relaxed">
          Keep your contact information up to date here.
          <br/><br/>
          Add your phone number to receive real-time order updates!
        </p>
      `,
      buttons: [
        {
          text: 'Back',
          action: tour.back,
          secondary: true,
        },
        {
          text: 'Next',
          action: tour.next,
        },
      ],
    });

    // Step 3: Addresses Tab
    tour.addStep({
      id: 'addresses',
      title: '📍 Add Delivery Addresses',
      text: `
        <p class="text-base leading-relaxed">
          Save your delivery addresses for faster checkout.
          <br/><br/>
          You can add multiple addresses (home, work, etc.)
        </p>
      `,
      buttons: [
        {
          text: 'Back',
          action: tour.back,
          secondary: true,
        },
        {
          text: 'Next',
          action: tour.next,
        },
      ],
    });

    // Step 4: Order History Tab (moved before Favorites to match tab order)
    tour.addStep({
      id: 'orders',
      title: '📦 View Order History',
      text: `
        <p class="text-base leading-relaxed">
          Track your current orders and view past order history here.
          <br/><br/>
          You can reorder from previous orders with one click!
        </p>
      `,
      buttons: [
        {
          text: 'Back',
          action: tour.back,
          secondary: true,
        },
        {
          text: 'Next',
          action: tour.next,
        },
      ],
    });

    // Step 5: Favorites Tab
    tour.addStep({
      id: 'favorites',
      title: '❤️ Save Your Favorites',
      text: `
        <p class="text-base leading-relaxed">
          Browse our menu and save your favorite dishes here.
          <br/><br/>
          Reorder with just one click - perfect for your go-to meals!
        </p>
      `,
      buttons: [
        {
          text: 'Back',
          action: tour.back,
          secondary: true,
        },
        {
          text: 'Next',
          action: tour.next,
        },
      ],
    });

    // Step 6: Ready to Order
    tour.addStep({
      id: 'ready',
      title: '🍽️ Ready to Order?',
      text: `
        <p class="text-base leading-relaxed">
          You're all set! Browse our delicious menu and place your first order.
          <br/><br/>
          <strong>🎁 Pro tip:</strong> Complete your profile setup to unlock a special welcome discount!
        </p>
      `,
      buttons: [
        {
          text: 'Back',
          action: tour.back,
          secondary: true,
        },
        {
          text: 'Finish',
          action: tour.complete,
        },
      ],
    });

    // Handle tour events
    tour.on('cancel', () => {
      dismissTour();
    });

    tour.on('complete', () => {
      dismissTour();
    });

    tourRef.current = tour;

    // Start tour with a small delay to ensure DOM is ready
    setTimeout(() => {
      tour.start();
    }, 500);

    return () => {
      if (tourRef.current) {
        tourRef.current.cancel();
      }
    };
  }, [shouldShowTour, status, markTourComplete, dismissTour, onComplete]);

  return null; // Tour is rendered by Shepherd.js
}
