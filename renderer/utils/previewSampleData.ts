/**
 * Sample conversation data for AI Staff Management Hub previews
 * Provides realistic scenarios for chat and voice simulations
 */

export interface SampleMessage {
  role: 'user' | 'agent';
  content: string;
  timestamp?: Date;
}

export interface SampleConversation {
  id: string;
  title: string;
  scenario: string;
  messages: SampleMessage[];
  category: 'menu_inquiry' | 'order_taking' | 'complaint' | 'hours_location' | 'recommendation' | 'dietary';
}

/**
 * Sample user questions that can be clicked to try
 */
export const SAMPLE_QUESTIONS = [
  "What's your most popular dish?",
  "Do you have vegetarian options?",
  "What are your opening hours?",
  "Can I make a reservation for tonight?",
  "Do you deliver to my area?",
  "What's in the butter chicken?",
  "I have a nut allergy, what can I order?",
  "How spicy is the vindaloo?",
  "Can I customize my order?",
  "What's the difference between tikka and tandoori?",
];

/**
 * Sample conversation flows for different scenarios
 */
export const SAMPLE_CONVERSATIONS: SampleConversation[] = [
  {
    id: 'menu_inquiry_1',
    title: 'Menu Inquiry',
    scenario: 'Customer asks about popular dishes',
    category: 'menu_inquiry',
    messages: [
      {
        role: 'user',
        content: "What's your most popular dish?"
      },
      {
        role: 'agent',
        content: "Great question! Our most popular dish is definitely the Butter Chicken - it's a customer favorite! We make it with tender chicken in a rich, creamy tomato sauce with aromatic spices. Our Lamb Rogan Josh and Chicken Tikka Masala are also incredibly popular. Would you like to know more about any of these?"
      },
      {
        role: 'user',
        content: "Tell me more about the Butter Chicken"
      },
      {
        role: 'agent',
        content: "Our Butter Chicken is absolutely delicious! We marinate the chicken overnight in yogurt and spices, then cook it in our traditional tandoor oven. It's finished in a velvety sauce made with tomatoes, cream, butter, and a blend of aromatic spices including fenugreek. It's mild to medium spice level, perfect for most palates. It comes with rice or naan bread. Would you like to add this to your order?"
      }
    ]
  },
  {
    id: 'dietary_1',
    title: 'Dietary Restrictions',
    scenario: 'Customer with nut allergy',
    category: 'dietary',
    messages: [
      {
        role: 'user',
        content: "I have a nut allergy. What can I safely order?"
      },
      {
        role: 'agent',
        content: "Thank you for letting me know about your allergy - your safety is our top priority! We have many nut-free options available. I'd recommend our Chicken Tikka, Tandoori Mixed Grill, Lamb Rogan Josh, or any of our vegetable curries. Please note that while these dishes don't contain nuts, our kitchen does handle nuts, so there's a small risk of cross-contamination. We always inform the kitchen staff about allergies to take extra precautions. Would you like me to suggest some specific dishes?"
      }
    ]
  },
  {
    id: 'hours_location_1',
    title: 'Hours & Location',
    scenario: 'Customer asks about opening hours',
    category: 'hours_location',
    messages: [
      {
        role: 'user',
        content: "What are your opening hours?"
      },
      {
        role: 'agent',
        content: "We're open every day! Monday to Thursday: 5:00 PM - 11:00 PM, Friday to Sunday: 5:00 PM - 11:30 PM. We're located on the High Street in the town center. Is there anything else you'd like to know?"
      }
    ]
  },
  {
    id: 'complaint_1',
    title: 'Complaint Handling',
    scenario: 'Customer received cold food',
    category: 'complaint',
    messages: [
      {
        role: 'user',
        content: "My food arrived cold and I'm really disappointed"
      },
      {
        role: 'agent',
        content: "I'm so sorry to hear that your food arrived cold - that's absolutely not the standard we set for ourselves. This must be really frustrating, especially when you were looking forward to a hot meal. Let me help make this right immediately. I can arrange for a fresh, hot replacement to be sent to you right away, or if you'd prefer, I can process a full refund. Which would you prefer? I'll also make sure our kitchen manager knows about this so we can prevent it happening again."
      },
      {
        role: 'user',
        content: "A replacement would be great, thank you"
      },
      {
        role: 'agent',
        content: "Absolutely! I'm arranging a fresh replacement order for you right now - it'll be prioritized and should be with you within 30 minutes. I've also added a complimentary side dish and dessert as an apology. You'll receive a confirmation shortly. Again, I sincerely apologize for the inconvenience. Is there anything else I can help you with?"
      }
    ]
  },
  {
    id: 'order_taking_1',
    title: 'Order Taking',
    scenario: 'Customer wants to place an order',
    category: 'order_taking',
    messages: [
      {
        role: 'user',
        content: "I'd like to order a Chicken Tikka Masala"
      },
      {
        role: 'agent',
        content: "Excellent choice! Our Chicken Tikka Masala is one of our signature dishes. Would you like that mild, medium, or hot? And would you like rice, naan bread, or both with that?"
      },
      {
        role: 'user',
        content: "Medium spice with pilau rice please"
      },
      {
        role: 'agent',
        content: "Perfect! I've added Chicken Tikka Masala (medium) with pilau rice to your order. That'll be £11.95. Would you like to add any starters, sides, or drinks? Our onion bhajis and samosas are very popular!"
      }
    ]
  },
  {
    id: 'recommendation_1',
    title: 'Personalized Recommendation',
    scenario: 'Customer wants suggestions',
    category: 'recommendation',
    messages: [
      {
        role: 'user',
        content: "I've never had Indian food before. What should I try?"
      },
      {
        role: 'agent',
        content: "How wonderful - you're in for a treat! For a first-time experience, I'd recommend starting with our Butter Chicken or Chicken Tikka Masala - both are mild to medium spice, creamy, and absolutely delicious. They're perfect introduction to Indian cuisine. For starters, try our Chicken Tikka or Vegetable Samosas. Would you prefer something mild, or are you adventurous with flavors?"
      },
      {
        role: 'user',
        content: "I like trying new things but nothing too spicy"
      },
      {
        role: 'agent',
        content: "Perfect! I'd suggest our Chicken Korma then - it's mild, creamy, and aromatic with coconut and almonds. Or our Chicken Tikka Masala which is medium but can be made milder. Both are crowd-pleasers and showcase the beautiful flavors of Indian cooking without overwhelming heat. Pair it with some garlic naan and pilau rice for the full experience. Sound good?"
      }
    ]
  },
  {
    id: 'vegetarian_1',
    title: 'Vegetarian Options',
    scenario: 'Customer asks about vegetarian menu',
    category: 'menu_inquiry',
    messages: [
      {
        role: 'user',
        content: "Do you have good vegetarian options?"
      },
      {
        role: 'agent',
        content: "We have an excellent vegetarian selection! Our most popular veggie dishes include Paneer Tikka Masala (Indian cottage cheese in creamy tomato sauce), Saag Paneer (spinach and cheese), Chana Masala (chickpea curry), Dal Makhani (creamy black lentils), and Vegetable Biryani. We also have Aloo Gobi (potato and cauliflower) and Baingan Bharta (smoky eggplant). All our vegetarian dishes are made with the same care and attention as our meat dishes. What type of flavors do you enjoy?"
      }
    ]
  }
];

/**
 * Voice-specific sample scripts
 */
export const VOICE_SAMPLE_SCRIPTS = [
  {
    scenario: 'First Contact',
    script: [
      { speaker: 'Agent', text: '[FIRST RESPONSE]' },
      { speaker: 'Customer', text: "Hi, I'd like to make a reservation" },
      { speaker: 'Agent', text: "I'd be happy to help you with a reservation! What date and time were you thinking, and how many people will be dining?" }
    ]
  },
  {
    scenario: 'Menu Question',
    script: [
      { speaker: 'Customer', text: "What's your chef's special today?" },
      { speaker: 'Agent', text: "Today's chef special is our Lamb Shank Nihari - slow-cooked lamb in aromatic spices, absolutely melt-in-your-mouth tender. It's served with naan bread and is £16.95. Would you like to order that?" }
    ]
  },
  {
    scenario: 'Order Confirmation',
    script: [
      { speaker: 'Customer', text: "Yes, I'll take the Butter Chicken" },
      { speaker: 'Agent', text: "Great choice! I've added Butter Chicken to your order. Would you like that mild, medium, or hot? And what would you like with it - rice, naan, or both?" },
      { speaker: 'Customer', text: "Medium with pilau rice please" },
      { speaker: 'Agent', text: "Perfect! Butter Chicken medium spice with pilau rice. Your total is £11.95. Can I help you with anything else today?" }
    ]
  }
];

/**
 * Personality-based response templates
 * Used to generate dynamic responses based on agent tone
 */
export const PERSONALITY_TEMPLATES = {
  friendly: {
    greeting: "Hi there! 👋",
    thanks: "Thank you so much!",
    goodbye: "Have a wonderful day!",
    emoji: true
  },
  professional: {
    greeting: "Good day,",
    thanks: "Thank you for your inquiry.",
    goodbye: "We look forward to serving you.",
    emoji: false
  },
  enthusiastic: {
    greeting: "Hello! Welcome! 🎉",
    thanks: "Amazing, thank you!",
    goodbye: "Can't wait to serve you!",
    emoji: true
  },
  warm: {
    greeting: "Hello, welcome!",
    thanks: "Thank you kindly!",
    goodbye: "Take care!",
    emoji: false
  }
};

/**
 * Get a random sample conversation by category
 */
export function getSampleByCategory(category: SampleConversation['category']): SampleConversation | undefined {
  const filtered = SAMPLE_CONVERSATIONS.filter(c => c.category === category);
  return filtered[Math.floor(Math.random() * filtered.length)];
}

/**
 * Get random sample questions
 */
export function getRandomQuestions(count: number = 3): string[] {
  const shuffled = [...SAMPLE_QUESTIONS].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}
