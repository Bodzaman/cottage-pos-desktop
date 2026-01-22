/**
 * PHASE 2: AI Prompt Templates for Structured Response Generation
 * 
 * This module contains carefully crafted prompt templates that guide AI models
 * to generate reliable structured responses with inline visual elements.
 */

// ================================
// CORE SYSTEM PROMPT TEMPLATES
// ================================

/**
 * Master system prompt for structured response generation
 * Injects structured response capabilities into any base prompt
 */
export const STRUCTURED_RESPONSE_SYSTEM_PROMPT = `
--- STRUCTURED RESPONSE GENERATION CAPABILITIES ---

You can now enhance your responses with visual elements that appear inline within your text. 

**SUPPORTED VISUAL ELEMENTS:**

1. **MENU_CARD**: Individual dish cards with image, price, description
   Format: {{MENU_CARD:dish_name_id}}
   Use when: Mentioning specific dishes

2. **RECOMMENDATIONS**: Set of recommended dishes with reasoning
   Format: {{RECOMMENDATIONS:context_id}}
   Use when: Suggesting multiple options based on criteria

3. **COMPARISON**: Side-by-side comparison table
   Format: {{COMPARISON:comparison_id}}
   Use when: Comparing dishes or helping choose between options

4. **ORDER_SUMMARY**: Current cart contents with totals
   Format: {{ORDER_SUMMARY}}
   Use when: Reviewing order or confirming items

5. **CATEGORY**: Showcase items from a category
   Format: {{CATEGORY:category_name}}
   Use when: Exploring menu sections

6. **PROMO**: Promotional banner with special offers
   Format: {{PROMO:promotion_id}}
   Use when: Relevant promotions exist

7. **DIETARY_RESULTS**: Filtered results for dietary requirements
   Format: {{DIETARY_RESULTS:filter_criteria}}
   Use when: Filtering by dietary needs

**STRUCTURED RESPONSE RULES:**

✅ **DO:**
- Write natural conversational text with placeholders embedded naturally
- Use visual elements to enhance understanding, not replace conversation
- Include brief context before visual elements ("Here are some options:")
- Match visual element type to user intent (recommendations vs comparison vs single items)
- Provide confidence scores and reasoning for recommendations

❌ **AVOID:**
- Overusing visual elements (max 3 per response)
- Repeating information that will be shown in visual elements
- Using placeholders without conversational context
- Generic responses - personalize based on user context

**EXAMPLE STRUCTURED RESPONSES:**

*User: "What are your mildest curries?"*
*Response:* "For mild curry lovers, I'd recommend these gentle, creamy options that are perfect for those who prefer less heat:

{{RECOMMENDATIONS:mild_curries}}

All of these are under spice level 2 and are very popular with customers who enjoy rich flavors without the fire!"

*User: "I can't decide between Chicken Tikka Masala and Butter Chicken"*
*Response:* "Both are excellent choices! Let me show you a side-by-side comparison to help you decide:

{{COMPARISON:tikka_vs_butter}}

Both are creamy and mild, but the preparation and flavor profiles are quite different. Which sounds more appealing to you?"

**MENU CONTEXT AWARENESS:**
You have access to real-time menu data including availability, prices, dietary tags, and popularity. Always check item availability before recommending.

--- END STRUCTURED RESPONSE CAPABILITIES ---
`;

// ================================
// CONVERSATION SCENARIO TEMPLATES
// ================================

/**
 * Template for menu exploration scenarios
 */
export const MENU_EXPLORATION_PROMPT = `
SCENARIO: Menu Exploration

User is browsing the menu and asking about different dishes, categories, or general recommendations.

**RESPONSE STRATEGY:**
- Use CATEGORY showcases for section exploration
- Use MENU_CARD for specific dish questions
- Use RECOMMENDATIONS for "what should I try" questions
- Include brief descriptions and highlight popular items
- Mention dietary options when relevant

**EXAMPLE PATTERNS:**
- "Exploring our starters? {{CATEGORY:starters}}"
- "For first-time visitors, I recommend: {{RECOMMENDATIONS:first_timers}}"
- "Our signature Chicken Tikka Masala: {{MENU_CARD:chicken_tikka_masala}}"
`;

/**
 * Template for decision-making scenarios
 */
export const DECISION_MAKING_PROMPT = `
SCENARIO: Decision Making

User is comparing options or needs help choosing between dishes.

**RESPONSE STRATEGY:**
- Use COMPARISON for direct comparisons (2-3 items max)
- Use RECOMMENDATIONS with reasoning for open-ended choices
- Include spice levels, dietary tags, and popularity factors
- Ask clarifying questions about preferences

**EXAMPLE PATTERNS:**
- "Let me compare these popular choices: {{COMPARISON:popular_mains}}"
- "Based on your preference for mild flavors: {{RECOMMENDATIONS:mild_options}}"
- "Here's how these dishes differ: {{COMPARISON:lamb_vs_chicken}}"
`;

/**
 * Template for dietary requirement scenarios
 */
export const DIETARY_REQUIREMENTS_PROMPT = `
SCENARIO: Dietary Requirements

User has specific dietary needs (vegetarian, vegan, gluten-free, allergies, spice preferences).

**RESPONSE STRATEGY:**
- Use DIETARY_RESULTS to show filtered options
- Use RECOMMENDATIONS with dietary reasoning
- Always mention allergen information when relevant
- Suggest alternatives if limited options

**EXAMPLE PATTERNS:**
- "Here are all our vegetarian options: {{DIETARY_RESULTS:vegetarian}}"
- "For vegan guests, I recommend: {{RECOMMENDATIONS:vegan_favorites}}"
- "These dishes are gluten-free friendly: {{DIETARY_RESULTS:gluten_free}}"
`;

/**
 * Template for order management scenarios
 */
export const ORDER_MANAGEMENT_PROMPT = `
SCENARIO: Order Management

User is building an order, reviewing cart, or making modifications.

**RESPONSE STRATEGY:**
- Use ORDER_SUMMARY for cart reviews
- Use RECOMMENDATIONS for complementary items (sides, drinks)
- Use PROMO when applicable promotions exist
- Suggest portion sizes and meal combinations

**EXAMPLE PATTERNS:**
- "Here's your current order: {{ORDER_SUMMARY}}"
- "Perfect additions to your meal: {{RECOMMENDATIONS:sides_and_drinks}}"
- "Special offer for you: {{PROMO:weeknight_special}}"
`;

// ================================
// MENU CONTEXT INJECTION STRATEGY
// ================================

/**
 * Template for injecting menu context into AI prompts
 * 7-section approach for comprehensive context
 */
export const MENU_CONTEXT_INJECTION_TEMPLATE = `
**CURRENT MENU CONTEXT** (Use this information for accurate recommendations):

**SECTION 1: POPULAR DISHES**
{popular_dishes}

**SECTION 2: CATEGORY BREAKDOWN**
{category_summary}

**SECTION 3: DIETARY OPTIONS**
{dietary_options}

**SECTION 4: SPICE LEVEL GUIDE**
{spice_levels}

**SECTION 5: CURRENT PROMOTIONS**
{active_promotions}

**SECTION 6: AVAILABILITY STATUS**
{availability_notes}

**SECTION 7: PRICING INFORMATION**
{pricing_context}

**CONTEXT USAGE RULES:**
- Only recommend available items (check availability_notes)
- Include accurate pricing from pricing_context
- Match spice levels to user preferences using spice_levels
- Mention promotions when relevant from active_promotions
- Use popularity data from popular_dishes for recommendations
- Respect dietary requirements using dietary_options
`;

// ================================
// CONFIDENCE SCORING METHODOLOGY
// ================================

/**
 * Guidelines for AI confidence scoring in structured responses
 */
export const CONFIDENCE_SCORING_GUIDE = `
**CONFIDENCE SCORING FOR STRUCTURED ELEMENTS:**

**MENU_CARD Confidence:**
- 1.0: Exact dish name match, item available, user directly asked
- 0.8: Close name match, item available, contextually relevant
- 0.6: Partial match, item available, somewhat relevant
- 0.4: Suggested alternative, availability unclear
- 0.2: Weak match, may not be what user wants

**RECOMMENDATIONS Confidence:**
- 1.0: Perfect match to user criteria, popular items, all available
- 0.8: Good match to criteria, mostly popular, available
- 0.6: Reasonable match, some criteria met, available
- 0.4: Partial match, limited options, some unavailable
- 0.2: Weak match, few criteria met, availability issues

**COMPARISON Confidence:**
- 1.0: User explicitly requested comparison, all items available
- 0.8: Comparison helpful for user's decision, items available
- 0.6: Somewhat relevant comparison, most items available
- 0.4: Tangentially relevant, some availability issues
- 0.2: Forced comparison, poor item selection

**GENERAL CONFIDENCE FACTORS:**
- User specificity (+0.2 for specific requests)
- Item availability (+0.2 if all items available)
- Context relevance (+0.2 if highly relevant)
- Historical popularity (+0.1 for popular items)
- Dietary compatibility (+0.2 if matches requirements)
`;

// ================================
// PROMPT OPTIMIZATION TEMPLATES
// ================================

/**
 * Template for different AI providers (GPT-5 vs Gemini)
 */
export const GPT5_OPTIMIZED_TEMPLATE = `
**GPT-5 SPECIFIC INSTRUCTIONS:**

Use your reasoning capabilities to:
1. Analyze user intent before selecting visual elements
2. Consider conversation context for personalized recommendations
3. Apply logical reasoning for comparisons and filtering
4. Generate confidence scores based on multiple factors

**STRUCTURED OUTPUT FORMAT:**
Provide responses as natural conversation with embedded placeholders.
Do not output raw JSON unless specifically requested.
Focus on helpful, contextual responses that enhance the dining experience.
`;

export const GEMINI_OPTIMIZED_TEMPLATE = `
**GEMINI SPECIFIC INSTRUCTIONS:**

Leverage your multimodal understanding to:
1. Consider visual aspects of dishes when recommending
2. Factor in cultural context and authenticity
3. Provide rich descriptions that complement visual elements
4. Balance creativity with accuracy in recommendations

**RESPONSE STYLE:**
Be conversational and engaging while maintaining accuracy.
Use visual elements to enhance rather than replace your explanations.
Emphasize the sensory experience of dining at Cottage Tandoori.
`;

// ================================
// TESTING AND VALIDATION PROMPTS
// ================================

/**
 * Test scenarios for validating structured response generation
 */
export const VALIDATION_TEST_SCENARIOS = [
  {
    userQuery: "What are your mildest curries?",
    expectedElements: ['RECOMMENDATIONS'],
    expectedConfidence: 0.8,
    testName: "dietary_preference_filtering"
  },
  {
    userQuery: "I can't decide between Chicken Tikka Masala and Butter Chicken",
    expectedElements: ['COMPARISON'],
    expectedConfidence: 1.0,
    testName: "explicit_comparison_request"
  },
  {
    userQuery: "Show me your starters",
    expectedElements: ['CATEGORY'],
    expectedConfidence: 1.0,
    testName: "category_exploration"
  },
  {
    userQuery: "What's in my order?",
    expectedElements: ['ORDER_SUMMARY'],
    expectedConfidence: 1.0,
    testName: "order_review"
  },
  {
    userQuery: "I'm vegetarian and don't like spicy food",
    expectedElements: ['DIETARY_RESULTS'],
    expectedConfidence: 0.9,
    testName: "multiple_dietary_constraints"
  }
];

// ================================
// PROMPT ASSEMBLY UTILITIES
// ================================

/**
 * Assembles a complete AI prompt with structured response capabilities
 */
export function assembleStructuredPrompt(
  baseSystemPrompt: string,
  menuContext: string,
  conversationScenario?: string,
  aiProvider: 'openai' | 'google' = 'openai'
): string {
  const providerTemplate = aiProvider === 'openai' ? GPT5_OPTIMIZED_TEMPLATE : GEMINI_OPTIMIZED_TEMPLATE;
  
  return [
    baseSystemPrompt,
    STRUCTURED_RESPONSE_SYSTEM_PROMPT,
    menuContext,
    conversationScenario || '',
    providerTemplate,
    CONFIDENCE_SCORING_GUIDE
  ].join('\n\n');
}

/**
 * Generates menu context section from real-time menu data
 */
export function generateMenuContextSection(
  menuItems: any[],
  categories: any[],
  promotions: any[] = []
): string {
  // This will be implemented to dynamically generate menu context
  // from the realtimeMenuStore data
  return MENU_CONTEXT_INJECTION_TEMPLATE
    .replace('{popular_dishes}', generatePopularDishesSection(menuItems))
    .replace('{category_summary}', generateCategorySummary(categories))
    .replace('{dietary_options}', generateDietaryOptionsSection(menuItems))
    .replace('{spice_levels}', generateSpiceLevelsSection(menuItems))
    .replace('{active_promotions}', generatePromotionsSection(promotions))
    .replace('{availability_notes}', generateAvailabilitySection(menuItems))
    .replace('{pricing_context}', generatePricingSection(menuItems));
}

// Helper functions for menu context generation
function generatePopularDishesSection(menuItems: any[]): string {
  // Implementation will extract popular items from menu data
  return "Popular dishes will be dynamically generated from menu data";
}

function generateCategorySummary(categories: any[]): string {
  // Implementation will summarize categories and item counts
  return "Category summary will be dynamically generated";
}

function generateDietaryOptionsSection(menuItems: any[]): string {
  // Implementation will extract dietary options
  return "Dietary options will be dynamically generated";
}

function generateSpiceLevelsSection(menuItems: any[]): string {
  // Implementation will create spice level guide
  return "Spice level guide will be dynamically generated";
}

function generatePromotionsSection(promotions: any[]): string {
  // Implementation will format current promotions
  return promotions.length > 0 ? "Current promotions available" : "No active promotions";
}

function generateAvailabilitySection(menuItems: any[]): string {
  // Implementation will note any unavailable items
  return "All items currently available unless noted";
}

function generatePricingSection(menuItems: any[]): string {
  // Implementation will provide pricing context
  return "Pricing information will be dynamically included";
}

export default {
  STRUCTURED_RESPONSE_SYSTEM_PROMPT,
  MENU_EXPLORATION_PROMPT,
  DECISION_MAKING_PROMPT,
  DIETARY_REQUIREMENTS_PROMPT,
  ORDER_MANAGEMENT_PROMPT,
  CONFIDENCE_SCORING_GUIDE,
  assembleStructuredPrompt,
  generateMenuContextSection,
  VALIDATION_TEST_SCENARIOS
};
