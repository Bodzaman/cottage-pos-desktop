const SITE_URL = "https://www.cottagetandoori.com";

export const RESTAURANT_JSONLD = {
  "@context": "https://schema.org",
  "@type": ["Restaurant", "FoodEstablishment", "LocalBusiness"],
  name: "Cottage Tandoori",
  image: `${SITE_URL}/og-default.jpg`,
  url: SITE_URL,
  telephone: ["+441903743605", "+441903745974"],
  email: "info@cottagetandoori.com",
  address: {
    "@type": "PostalAddress",
    streetAddress: "25 West Street",
    addressLocality: "Storrington",
    addressRegion: "West Sussex",
    postalCode: "RH20 4DZ",
    addressCountry: "GB",
  },
  geo: {
    "@type": "GeoCoordinates",
    latitude: 50.91851,
    longitude: -0.45724,
  },
  servesCuisine: ["Indian", "Tandoori", "South Asian"],
  priceRange: "££",
  openingHoursSpecification: [
    {
      "@type": "OpeningHoursSpecification",
      dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday"],
      opens: "12:00",
      closes: "14:00",
    },
    {
      "@type": "OpeningHoursSpecification",
      dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday"],
      opens: "17:30",
      closes: "22:00",
    },
    {
      "@type": "OpeningHoursSpecification",
      dayOfWeek: ["Friday", "Saturday"],
      opens: "12:00",
      closes: "14:00",
    },
    {
      "@type": "OpeningHoursSpecification",
      dayOfWeek: ["Friday", "Saturday"],
      opens: "17:30",
      closes: "22:30",
    },
    {
      "@type": "OpeningHoursSpecification",
      dayOfWeek: "Sunday",
      opens: "12:00",
      closes: "14:00",
    },
    {
      "@type": "OpeningHoursSpecification",
      dayOfWeek: "Sunday",
      opens: "17:30",
      closes: "22:00",
    },
  ],
  hasMenu: `${SITE_URL}/online-orders`,
  acceptsReservations: "True",
  sameAs: [
    "https://www.facebook.com/cottagetandoori",
    "https://www.instagram.com/cottagetandoori",
    "https://www.tripadvisor.co.uk/Restaurant_Review-Cottage_Tandoori-Storrington",
  ],
};

export const BREADCRUMB_JSONLD = (
  items: { name: string; url: string }[]
) => ({
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: items.map((item, i) => ({
    "@type": "ListItem",
    position: i + 1,
    name: item.name,
    item: item.url,
  })),
});

export const PAGE_SEO = {
  home: {
    title: "Home",
    description:
      "Cottage Tandoori — Award-winning authentic Indian restaurant in Storrington, West Sussex. Tandoor-fired specialties, signature curries, and warm hospitality since 1980. Order online or dine in.",
  },
  about: {
    title: "Our Story",
    description:
      "Discover the heritage of Cottage Tandoori, serving authentic Indian cuisine in Storrington since 1980. Family traditions, locally sourced ingredients, and a passion for spice.",
  },
  contact: {
    title: "Contact & Opening Hours",
    description:
      "Visit Cottage Tandoori at 25 West Street, Storrington, RH20 4DZ. Call 01903 743605 to reserve. Open daily for lunch and dinner.",
  },
  gallery: {
    title: "Gallery",
    description:
      "Explore photos of Cottage Tandoori — our restaurant interior, signature dishes, and dining atmosphere in Storrington, West Sussex.",
  },
  onlineOrders: {
    title: "Online Menu & Ordering",
    description:
      "Browse our full Indian menu and order online for collection or delivery from Cottage Tandoori, Storrington. Tandoori, curries, biryanis, and more.",
  },
  faq: {
    title: "Frequently Asked Questions",
    description:
      "Find answers to common questions about Cottage Tandoori — ordering online, delivery, allergens, dietary needs, payments, and dining in.",
  },
  allergens: {
    title: "Allergen Information",
    description:
      "View allergen information for all dishes at Cottage Tandoori. 14 major UK allergens listed per item to help you dine safely.",
  },
  blog: {
    title: "Blog & News",
    description:
      "News, recipes, and stories from Cottage Tandoori — Storrington's favourite Indian restaurant since 1980.",
  },
};
