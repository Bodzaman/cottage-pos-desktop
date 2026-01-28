/**
 * i18n - Basic multi-language support (Issue 17)
 *
 * Provides translations for key UI strings in English and Hindi.
 * Detects browser language and exposes a hook for consuming translations.
 */

export type SupportedLanguage = 'en' | 'hi';

const translations: Record<SupportedLanguage, Record<string, string>> = {
  en: {
    // Chat UI
    'chat.placeholder': 'Ask about our menu, dietary options, or place an order...',
    'chat.send': 'Send message',
    'chat.voiceCallInProgress': 'Voice call in progress...',
    'chat.quickQuestions': 'Quick questions:',
    'chat.tryAsking': 'Try asking:',

    // Welcome
    'welcome.greeting': "Hi! I'm {agentName}",
    'welcome.subtitle': 'Your AI waiter — ask me anything about our menu',

    // Voice
    'voice.callAgent': 'CALL {agentName}',
    'voice.connecting': 'Connecting to {agentName}...',
    'voice.connected': 'Connected — Start speaking',
    'voice.reconnecting': 'Reconnecting...',
    'voice.speaking': '{agentName} is speaking...',
    'voice.hangUp': 'Hang Up',
    'voice.demoTitle': 'Voice Ordering Demo',
    'voice.demoSubtitle': 'See how easy it is to order with {agentName}',
    'voice.signUpFree': 'Sign Up Free to Try It',
    'voice.maybeLater': 'Maybe Later',
    'voice.readyTitle': 'Voice Ordering Ready',
    'voice.readySubtitle': 'Your AI waiter is ready to take your order',
    'voice.termsDisclaimer': 'By calling, you accept the Voice Ordering Terms and consent to recording for quality and training. Audio may vary; orders are confirmed before processing.',

    // Cart
    'cart.title': 'Your Order',
    'cart.copyOrder': 'Copy order summary',
    'cart.copiedSuccess': 'Order copied to clipboard',
    'cart.empty': 'Your cart is empty',
    'cart.added': 'Added',
    'cart.removed': 'Removed',

    // Errors
    'error.connectionLost': 'Connection lost. Please check your internet and try again.',
    'error.aiBusy': 'Our AI is busy right now. Please wait a moment and try again.',
    'error.timeout': 'The request took too long. Please try again.',
    'error.serverError': 'Something went wrong on our end. Please try again in a moment.',
    'error.generic': 'Sorry, something went wrong. Please try again.',

    // Status
    'status.sending': 'Sending',
    'status.sent': 'Sent',
    'status.delivered': 'Delivered',
    'status.failed': 'Failed',

    // Session
    'session.extended': 'Session extended',
    'session.ended': 'Voice session ended due to time limit',
    'session.continue': 'Continue Session',
  },

  hi: {
    // Chat UI
    'chat.placeholder': 'मेन्यू, डाइटरी विकल्प या ऑर्डर के बारे में पूछें...',
    'chat.send': 'संदेश भेजें',
    'chat.voiceCallInProgress': 'वॉइस कॉल चल रही है...',
    'chat.quickQuestions': 'त्वरित प्रश्न:',
    'chat.tryAsking': 'पूछकर देखें:',

    // Welcome
    'welcome.greeting': 'नमस्ते! मैं {agentName} हूँ',
    'welcome.subtitle': 'आपका AI वेटर — मेन्यू के बारे में कुछ भी पूछें',

    // Voice
    'voice.callAgent': '{agentName} को कॉल करें',
    'voice.connecting': '{agentName} से कनेक्ट हो रहा है...',
    'voice.connected': 'कनेक्टेड — बोलना शुरू करें',
    'voice.reconnecting': 'पुनः कनेक्ट हो रहा है...',
    'voice.speaking': '{agentName} बोल रहे हैं...',
    'voice.hangUp': 'कॉल काटें',
    'voice.demoTitle': 'वॉइस ऑर्डरिंग डेमो',
    'voice.demoSubtitle': 'देखें {agentName} से ऑर्डर करना कितना आसान है',
    'voice.signUpFree': 'मुफ्त में साइन अप करें',
    'voice.maybeLater': 'बाद में',
    'voice.readyTitle': 'वॉइस ऑर्डरिंग तैयार',
    'voice.readySubtitle': 'आपका AI वेटर ऑर्डर लेने के लिए तैयार है',
    'voice.termsDisclaimer': 'कॉल करके, आप वॉइस ऑर्डरिंग शर्तें स्वीकार करते हैं और गुणवत्ता व प्रशिक्षण के लिए रिकॉर्डिंग की सहमति देते हैं।',

    // Cart
    'cart.title': 'आपका ऑर्डर',
    'cart.copyOrder': 'ऑर्डर कॉपी करें',
    'cart.copiedSuccess': 'ऑर्डर क्लिपबोर्ड पर कॉपी हो गया',
    'cart.empty': 'आपकी कार्ट खाली है',
    'cart.added': 'जोड़ा गया',
    'cart.removed': 'हटाया गया',

    // Errors
    'error.connectionLost': 'कनेक्शन टूट गया। कृपया अपना इंटरनेट जांचें और पुनः प्रयास करें।',
    'error.aiBusy': 'हमारा AI अभी व्यस्त है। कृपया एक पल प्रतीक्षा करें।',
    'error.timeout': 'अनुरोध में बहुत समय लगा। कृपया पुनः प्रयास करें।',
    'error.serverError': 'हमारी तरफ से कुछ गड़बड़ हो गई। कृपया एक पल बाद पुनः प्रयास करें।',
    'error.generic': 'क्षमा करें, कुछ गड़बड़ हो गई। कृपया पुनः प्रयास करें।',

    // Status
    'status.sending': 'भेज रहे हैं',
    'status.sent': 'भेजा गया',
    'status.delivered': 'डिलीवर हो गया',
    'status.failed': 'विफल',

    // Session
    'session.extended': 'सत्र बढ़ाया गया',
    'session.ended': 'समय सीमा के कारण वॉइस सत्र समाप्त हो गया',
    'session.continue': 'सत्र जारी रखें',
  },
};

/**
 * Detect the browser's preferred language.
 */
function detectLanguage(): SupportedLanguage {
  const browserLang = navigator.language?.toLowerCase() || 'en';
  if (browserLang.startsWith('hi')) return 'hi';
  return 'en';
}

// Current language (can be overridden via setLanguage)
let currentLanguage: SupportedLanguage = detectLanguage();

/**
 * Get a translated string, with optional interpolation.
 *
 * @example
 * t('welcome.greeting', { agentName: 'Uncle Raj' })
 * // => "Hi! I'm Uncle Raj"
 */
export function t(key: string, params?: Record<string, string>): string {
  const str = translations[currentLanguage]?.[key] || translations.en[key] || key;
  if (!params) return str;
  return Object.entries(params).reduce(
    (result, [param, value]) => result.replace(new RegExp(`\\{${param}\\}`, 'g'), value),
    str,
  );
}

/**
 * Get the current language.
 */
export function getLanguage(): SupportedLanguage {
  return currentLanguage;
}

/**
 * Set the current language.
 */
export function setLanguage(lang: SupportedLanguage) {
  currentLanguage = lang;
  // Persist preference
  try {
    localStorage.setItem('cottage_language', lang);
  } catch {
    // Ignore storage errors
  }
}

// Restore persisted language preference
try {
  const saved = localStorage.getItem('cottage_language') as SupportedLanguage | null;
  if (saved && translations[saved]) {
    currentLanguage = saved;
  }
} catch {
  // Ignore
}
