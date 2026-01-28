import ReactGA from "react-ga4";

const GA_MEASUREMENT_ID = import.meta.env.VITE_GA4_MEASUREMENT_ID || "";

let initialized = false;

export function initAnalytics() {
  if (!GA_MEASUREMENT_ID || initialized) return;

  ReactGA.initialize(GA_MEASUREMENT_ID, {
    gaOptions: {
      anonymize_ip: true,
    },
  });
  initialized = true;
}

export function isAnalyticsInitialized() {
  return initialized;
}

export function trackPageView(path: string, title?: string) {
  if (!initialized) return;
  ReactGA.send({ hitType: "pageview", page: path, title });
}

export function trackEvent(
  action: string,
  category: string,
  label?: string,
  value?: number
) {
  if (!initialized) return;
  ReactGA.event({ action, category, label, value });
}

export const AnalyticsEvents = {
  menuItemView: (itemName: string, category: string) =>
    trackEvent("view_item", "Menu", `${category} - ${itemName}`),

  addToCart: (itemName: string, price: number) =>
    trackEvent("add_to_cart", "Ecommerce", itemName, Math.round(price * 100)),

  removeFromCart: (itemName: string) =>
    trackEvent("remove_from_cart", "Ecommerce", itemName),

  beginCheckout: (cartTotal: number) =>
    trackEvent(
      "begin_checkout",
      "Ecommerce",
      undefined,
      Math.round(cartTotal * 100)
    ),

  purchase: (orderId: string, total: number) => {
    if (!initialized) return;
    ReactGA.event("purchase", {
      transaction_id: orderId,
      value: total,
      currency: "GBP",
    });
  },

  phoneCall: (number: string) =>
    trackEvent("phone_call", "Contact", number),

  galleryView: (imageCategory: string) =>
    trackEvent("gallery_view", "Engagement", imageCategory),

  signUp: () => trackEvent("sign_up", "Auth"),

  login: () => trackEvent("login", "Auth"),
};
