/**
 * Menu Section Mapping Utility
 * Maps menu categories to logical meal course sections for accordion organization
 */

export interface MenuSection {
  id: string;
  name: string;
  icon: string;
  expandedByDefault: boolean;
  order: number;
  subcategories: SubCategory[];
}

export interface SubCategory {
  id: string;
  name: string;
  type: 'vegetarian' | 'non-vegetarian' | 'mixed';
  items: any[];
}

// Define meal course sections
export const MEAL_SECTIONS: Omit<MenuSection, 'subcategories'>[] = [
  {
    id: 'starters',
    name: 'STARTERS',
    icon: '🍖',
    expandedByDefault: true,
    order: 1
  },
  {
    id: 'mains',
    name: 'MAINS',
    icon: '🍛',
    expandedByDefault: false,
    order: 2
  },
  {
    id: 'sides-rice',
    name: 'SIDES & RICE',
    icon: '🍚',
    expandedByDefault: false,
    order: 3
  },
  {
    id: 'breads',
    name: 'BREADS',
    icon: '🥖',
    expandedByDefault: false,
    order: 4
  },
  {
    id: 'desserts',
    name: 'DESSERTS',
    icon: '🍮',
    expandedByDefault: false,
    order: 5
  },
  {
    id: 'drinks',
    name: 'DRINKS & BEVERAGES',
    icon: '🥤',
    expandedByDefault: false,
    order: 6
  },
  {
    id: 'set-meals',
    name: 'SET MEALS',
    icon: '🍽️',
    expandedByDefault: false,
    order: 7
  }
];

// Category mapping keywords - prioritize specific terms over generic ones
const CATEGORY_KEYWORDS = {
  starters: {
    primary: ['pakora', 'tikka starter', 'bhaji', 'samosa', 'kebab', 'appetizer', 'starter'],
    secondary: ['appetizer', 'small plate']
  },
  mains: {
    chicken: ['chicken curry', 'chicken masala', 'chicken dish', 'chicken main'],
    lamb: ['lamb', 'mutton'],
    seafood: ['prawn', 'fish', 'seafood'],
    vegetarian: ['vegetable curry', 'paneer', 'dal'],
    rice: ['biryani', 'pulao'],
    curry: ['curry', 'masala', 'korma', 'madras', 'vindaloo', 'jalfrezi', 'bhuna']
  },
  sides: {
    rice: ['rice', 'pilau', 'steamed rice'],
    vegetables: ['vegetable side', 'aloo', 'saag']
  },
  breads: ['naan', 'bread', 'roti', 'chapati', 'paratha'],
  desserts: ['dessert', 'kulfi', 'kheer', 'gulab jamun', 'sweet'],
  drinks: ['drink', 'lassi', 'tea', 'coffee', 'water', 'juice', 'beer', 'wine']
};

/**
 * Categorize menu items into meal course sections
 */
export const categorizeMenuItems = (menuItems: any[], categories: any[]) => {
  const sections: MenuSection[] = MEAL_SECTIONS.map(section => ({
    ...section,
    subcategories: []
  }));

  // Create category lookup
  const categoryLookup = categories.reduce((acc, cat) => {
    acc[cat.id] = cat;
    return acc;
  }, {});

  // Categorize each item
  menuItems.forEach(item => {
    const category = categoryLookup[item.category_id];
    const categoryName = category?.name?.toLowerCase() || '';
    const itemName = item.name?.toLowerCase() || '';
    
    let assignedSection = null;
    
    // PRIORITY 1: Check for specific starter keywords first
    for (const keyword of CATEGORY_KEYWORDS.starters.primary) {
      if (itemName.includes(keyword) || categoryName.includes(keyword)) {
        assignedSection = sections.find(s => s.id === 'starters');
        break;
      }
    }
    
    // PRIORITY 2: If not a starter, check other categories
    if (!assignedSection) {
      // Check desserts
      if (CATEGORY_KEYWORDS.desserts.some(keyword => 
        itemName.includes(keyword) || categoryName.includes(keyword)
      )) {
        assignedSection = sections.find(s => s.id === 'desserts');
      }
      // Check drinks
      else if (CATEGORY_KEYWORDS.drinks.some(keyword => 
        itemName.includes(keyword) || categoryName.includes(keyword)
      )) {
        assignedSection = sections.find(s => s.id === 'drinks');
      }
      // Check breads
      else if (CATEGORY_KEYWORDS.breads.some(keyword => 
        itemName.includes(keyword) || categoryName.includes(keyword)
      )) {
        assignedSection = sections.find(s => s.id === 'breads');
      }
      // Check sides
      else if (CATEGORY_KEYWORDS.sides.rice.some(keyword => 
        itemName.includes(keyword) || categoryName.includes(keyword)
      ) || CATEGORY_KEYWORDS.sides.vegetables.some(keyword => 
        itemName.includes(keyword) || categoryName.includes(keyword)
      )) {
        assignedSection = sections.find(s => s.id === 'sides-rice');
      }
      // Default to mains
      else {
        assignedSection = sections.find(s => s.id === 'mains');
      }
    }
    
    if (assignedSection) {
      // Determine subcategory type
      const isVegetarian = item.dietary_tags?.includes('Vegetarian') || 
                          item.dietary_tags?.includes('Vegan') ||
                          itemName.includes('vegetable') ||
                          itemName.includes('paneer');
      
      const subcategoryType = isVegetarian ? 'vegetarian' : 'non-vegetarian';
      
      // Find or create subcategory
      let subcategory = assignedSection.subcategories.find(sub => sub.type === subcategoryType);
      if (!subcategory) {
        subcategory = {
          id: `${assignedSection.id}-${subcategoryType}`,
          name: subcategoryType === 'vegetarian' ? '🥗 Vegetarian' : '🍖 Non-Vegetarian',
          type: subcategoryType,
          items: []
        };
        assignedSection.subcategories.push(subcategory);
      }
      
      subcategory.items.push(item);
    }
  });
  
  // Sort items within each subcategory by display_order
  sections.forEach(section => {
    section.subcategories.forEach(subcategory => {
      subcategory.items.sort((a, b) => (a.display_order || 0) - (b.display_order || 0));
    });
  });
  
  return sections.filter(section => section.subcategories.length > 0);
};

/**
 * Get total item count for a section
 */
export const getSectionItemCount = (section: MenuSection): number => {
  return section.subcategories.reduce((total, sub) => total + sub.items.length, 0);
};

/**
 * Get total item count for a subcategory
 */
export const getSubcategoryItemCount = (subcategory: SubCategory): number => {
  return subcategory.items.length;
};
