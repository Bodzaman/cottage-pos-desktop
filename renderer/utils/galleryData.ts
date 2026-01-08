/**
 * Gallery images data for Cottage Tandoori Restaurant
 * Categories: food, venue
 */

export interface GalleryImage {
  id: number;
  src: string;
  alt: string;
  category: 'food' | 'venue';
  title: string;
  description?: string;
}

export const galleryImages: GalleryImage[] = [
  // Food Images
  {
    id: 1,
    src: "https://static.databutton.com/public/6d13cbb4-0d00-46ec-8ef0-98e0a8405532/chicken%20tikka%20masala.jpg",
    alt: "Chicken Tikka Masala - signature dish",
    category: "food",
    title: "Chicken Tikka Masala",
    description: "Our signature creamy tomato-based curry with tender chicken tikka"
  },
  {
    id: 2,
    src: "https://static.databutton.com/public/6d13cbb4-0d00-46ec-8ef0-98e0a8405532/lamb%20biryani.jpg",
    alt: "Lamb Biryani - aromatic rice dish",
    category: "food",
    title: "Lamb Biryani",
    description: "Fragrant basmati rice with succulent lamb and traditional spices"
  },
  {
    id: 3,
    src: "https://static.databutton.com/public/6d13cbb4-0d00-46ec-8ef0-98e0a8405532/tandoori%20mixed%20grill.jpg",
    alt: "Tandoori Mixed Grill - variety platter",
    category: "food",
    title: "Tandoori Mixed Grill",
    description: "A selection of our finest tandoori specialties"
  },
  {
    id: 4,
    src: "https://static.databutton.com/public/6d13cbb4-0d00-46ec-8ef0-98e0a8405532/naan%20bread.jpg",
    alt: "Freshly baked naan bread",
    category: "food",
    title: "Naan Selection",
    description: "Freshly baked breads from our traditional tandoor oven"
  },
  {
    id: 5,
    src: "https://static.databutton.com/public/6d13cbb4-0d00-46ec-8ef0-98e0a8405532/samosas.jpg",
    alt: "Golden crispy samosas",
    category: "food",
    title: "Vegetable Samosas",
    description: "Crispy pastries filled with spiced vegetables"
  },
  {
    id: 6,
    src: "https://static.databutton.com/public/6d13cbb4-0d00-46ec-8ef0-98e0a8405532/dal%20tadka.jpg",
    alt: "Dal Tadka - lentil curry",
    category: "food",
    title: "Dal Tadka",
    description: "Traditional yellow lentils with aromatic tempering"
  },
  
  // Venue Images
  {
    id: 7,
    src: "https://static.databutton.com/public/6d13cbb4-0d00-46ec-8ef0-98e0a8405532/restaurant%20exterior.jpg",
    alt: "Cottage Tandoori Restaurant exterior",
    category: "venue",
    title: "Restaurant Exterior",
    description: "Welcome to Cottage Tandoori - your authentic Indian dining destination"
  },
  {
    id: 8,
    src: "https://static.databutton.com/public/6d13cbb4-0d00-46ec-8ef0-98e0a8405532/dining%20room.jpg",
    alt: "Main dining room ambiance",
    category: "venue",
    title: "Main Dining Room",
    description: "Elegant dining space with traditional Indian decor"
  },
  {
    id: 9,
    src: "https://static.databutton.com/public/6d13cbb4-0d00-46ec-8ef0-98e0a8405532/BAR%202.jpg",
    alt: "Restaurant bar area",
    category: "venue",
    title: "Bar Area",
    description: "Sophisticated bar featuring premium spirits and cocktails"
  },
  {
    id: 10,
    src: "https://static.databutton.com/public/6d13cbb4-0d00-46ec-8ef0-98e0a8405532/tandoor%20oven.jpg",
    alt: "Traditional tandoor oven in action",
    category: "venue",
    title: "Tandoor Kitchen",
    description: "Our authentic clay tandoor oven where the magic happens"
  },
  {
    id: 11,
    src: "https://static.databutton.com/public/6d13cbb4-0d00-46ec-8ef0-98e0a8405532/private%20dining.jpg",
    alt: "Private dining area",
    category: "venue",
    title: "Private Dining",
    description: "Intimate space perfect for special occasions and group events"
  },
  {
    id: 12,
    src: "https://static.databutton.com/public/6d13cbb4-0d00-46ec-8ef0-98e0a8405532/chef%20preparation.jpg",
    alt: "Chef preparing fresh dishes",
    category: "venue",
    title: "Open Kitchen",
    description: "Watch our skilled chefs craft authentic Indian cuisine"
  }
];

// Helper function to get images by category
export const getImagesByCategory = (category: 'all' | 'food' | 'venue'): GalleryImage[] => {
  if (category === 'all') {
    return galleryImages;
  }
  return galleryImages.filter(img => img.category === category);
};

// Get total count by category
export const getImageCount = (category: 'all' | 'food' | 'venue'): number => {
  return getImagesByCategory(category).length;
};
