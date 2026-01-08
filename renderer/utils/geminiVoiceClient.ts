import { apiClient } from 'app';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { createMicPipeline } from 'utils/audioPipeline';
import { isFlagEnabled } from 'utils/featureFlags';

/**
 * ✅ OFFICIAL GOOGLE GEMINI LIVE API CLIENT
 * 
 * ARCHITECTURE: Direct Frontend → Google Connection (HTTP Token-Based)
 * ================================================================
 * 
 * This is the CORRECT and ONLY Voice AI implementation.
 * 
 * Flow:
 *   1. Frontend calls: POST /gemini-voice/create-session
 *   2. Backend returns: JWT token (contains temporary Google API key)
 *   3. Frontend uses: @google/generative-ai SDK to connect DIRECTLY to Google's servers
 *   4. NO backend WebSocket proxy involved
 * 
 * System Prompts & Function Declarations:
 *   • Configured HERE in the frontend (not backend)
 *   • Allows real-time customization without backend changes
 *   • Frontend has full control over conversation flow
 * 
 * Why This Architecture?
 *   ✅ Lower latency (no proxy hop through our backend)
 *   ✅ More secure (ephemeral tokens, permanent key never exposed)
 *   ✅ Simpler (frontend owns voice configuration)
 *   ✅ Official Google SDK pattern
 *   ✅ Better scalability (Google handles WebSocket load)
 * 
 * 🚫 REMOVED: Backend WebSocket Proxy (gemini_live_voice)
 * ========================================================
 * 
 * The WebSocket proxy approach was incorrectly introduced in task MYA-1569.
 * It has been REMOVED in task MYA-1576 because:
 *   ❌ Added unnecessary backend complexity
 *   ❌ Increased latency (extra network hop)
 *   ❌ Split configuration between frontend/backend (confusing)
 *   ❌ NOT the official Google SDK pattern
 * 
 * ⚠️ FUTURE DEVELOPERS:
 * ====================
 * 
 * DO NOT recreate backend WebSocket proxies for Voice AI.
 * This token-based + direct Google connection is the correct pattern.
 * 
 * Backend API: src/app/apis/gemini_voice_session/__init__.py
 * Frontend Client: ui/src/utils/geminiVoiceClient.ts (THIS FILE)
 * 
 * Last Updated: December 2024 (MYA-1576 - WebSocket cleanup)
 */

export type GeminiVoiceState =
  | "idle"
  | "requesting-token"
  | "connecting"
  | "connected"
  | "listening"
  | "stopping"
  | "closed"
  | "error";

export interface GeminiVoiceClientOptions {
  voiceName?: string; // Gemini prebuilt voice name, e.g. "Puck"
  systemPrompt?: string; // Override system prompt for testing
  firstResponse?: string; // Override first response greeting
  onStateChange?: (s: GeminiVoiceState) => void;
  onServerText?: (text: string) => void;
  onError?: (err: string) => void;
  onCartUpdate?: (action: 'add' | 'remove', item: any) => void;
  onFunctionCall?: (name: string, args: any) => void;
  
  // Cart operation callbacks (user-aware)
  cartOperations?: {
    addItem?: (itemName: string, quantity: number, notes?: string) => Promise<{success: boolean; message: string}>;
    removeItem?: (itemName: string) => Promise<{success: boolean; message: string}>;
    updateQuantity?: (cartItemId: string, quantity: number) => Promise<{success: boolean; message?: string}>;
    updateCustomizations?: (cartItemId: string, customizations: any) => Promise<{success: boolean; message?: string}>;
    getCart?: () => Promise<{success: boolean; items: any[]}>;
    clearCart?: () => Promise<{success: boolean; message?: string}>;
  };
}

export class GeminiVoiceClient {
  private session: any = null; // Live session from SDK
  // Unified mic pipeline controller (replaces manual AudioContext/script node wiring)
  private mic: ReturnType<typeof createMicPipeline> | null = null;
  // Legacy fields retained for compatibility (unused externally)
  private audioContext: AudioContext | null = null;
  private mediaStream: MediaStream | null = null;
  private scriptNode: ScriptProcessorNode | null = null;
  private sourceNode: MediaStreamAudioSourceNode | null = null;
  private state: GeminiVoiceState = "idle";
  private options: GeminiVoiceClientOptions;
  private menuContext: string = "";
  private apiKey: string = "";

  // Flag to track if we should send audio (pause when Gemini is responding)
  private shouldSendAudio: boolean = true;

  // Phase 2.1: Retry state for exponential backoff
  private retryCount: number = 0;
  private readonly maxRetries: number = 5;
  private readonly baseDelay: number = 1000; // 1 second
  private readonly maxDelay: number = 60000; // 60 seconds
  private readonly jitter: number = 500; // ±500ms random jitter
  private reconnectTimeout: number | null = null;

  // Streaming audio playback state (ring buffer pattern)
  private outputSampleRate = 24000; // Gemini native audio output rate
  private outputAudioContext: AudioContext | null = null;
  private nextPlaybackTime: number = 0; // Scheduled playback time for next chunk
  private isPlayingAudio: boolean = false; // Track if we're actively playing

  constructor(options: GeminiVoiceClientOptions = {}) {
    this.options = options;
  }

  private setState(newState: GeminiVoiceState): void {
    this.state = newState;
    this.options.onStateChange?.(newState);
  }

  get currentState() {
    return this.state;
  }

  async start(): Promise<void> {
    if (this.state !== "idle" && this.state !== "closed") return;

    try {
      this.setState("requesting-token");

      // 1) Fetch menu context
      await this.fetchMenuContext();

      // 2) Get ephemeral token from backend (Phase 2.2)
      const resp = await apiClient.create_gemini_voice_session({});
      const data = await resp.json();
      if (!data?.success || !data?.token) {
        throw new Error("Failed to get Gemini ephemeral token");
      }
      
      // Decode JWT to extract API key (token format: header.payload.signature)
      // We trust our backend signature, just need to extract the payload
      const tokenParts = data.token.split('.');
      if (tokenParts.length !== 3) {
        throw new Error("Invalid token format");
      }
      
      // Decode base64 payload (part 1)
      const payloadBase64 = tokenParts[1];
      const payloadJson = atob(payloadBase64);
      const payload = JSON.parse(payloadJson);
      
      // Extract API key from signed payload
      this.apiKey = payload.api_key;
      
      // Optional: Store expiry for future token refresh logic
      const expiresAt = new Date(data.expires_at);

      // 3) Initialize Google GenAI SDK with v1alpha for proactive audio support
      const ai = new GoogleGenerativeAI({ 
        apiKey: this.apiKey,
        httpOptions: { apiVersion: "v1alpha" } // ✅ Required for proactive audio
      });

      // 4) Prepare function declarations
      const tools = [{
        functionDeclarations: [
          {
            name: "add_to_cart",
            description: "Add a menu item to the customer's cart",
            parameters: {
              type: "object",
              properties: {
                item_name: {
                  type: "string",
                  description: "Name of the menu item to add"
                },
                quantity: {
                  type: "number",
                  description: "Quantity to add (default 1)"
                },
                notes: {
                  type: "string",
                  description: "Special instructions or notes (optional)"
                }
              },
              required: ["item_name"]
            }
          },
          {
            name: "remove_from_cart",
            description: "Remove a menu item from the cart",
            parameters: {
              type: "object",
              properties: {
                item_name: {
                  type: "string",
                  description: "Name of the menu item to remove"
                }
              },
              required: ["item_name"]
            }
          },
          {
            name: "check_allergens",
            description: "Check allergen information for a menu item",
            parameters: {
              type: "object",
              properties: {
                item_name: {
                  type: "string",
                  description: "Name of the menu item to check"
                }
              },
              required: ["item_name"]
            }
          },
          {
            name: "search_menu",
            description: "Search the menu for items by name, category, or dietary preferences. Use this when customers ask about available dishes, specific categories, or dietary options.",
            parameters: {
              type: "object",
              properties: {
                query: {
                  type: "string",
                  description: "Search term (dish name, ingredient, or description keyword)"
                },
                category: {
                  type: "string",
                  description: "Filter by category (e.g., 'Starters', 'Chicken Dishes', 'Vegetarian')"
                }
              },
              required: []
            }
          },
          {
            name: "search_and_add_to_cart",
            description: "ATOMIC operation - Search menu and add item to cart in one function call. This is the RECOMMENDED way to add items to cart.",
            parameters: {
              type: "object",
              properties: {
                search_query: {
                  type: "string",
                  description: "Item name to search for (e.g., 'chicken tikka', 'naan', 'korma')"
                },
                quantity: {
                  type: "number",
                  description: "Number of items to add (default 1)"
                },
                category: {
                  type: "string",
                  description: "Optional category filter (e.g., 'STARTERS', 'MAIN COURSE')"
                },
                order_mode: {
                  type: "string",
                  description: "Order type: 'delivery' or 'collection' (default 'collection')"
                },
                special_instructions: {
                  type: "string",
                  description: "Optional customer notes for this item"
                },
                customizations: {
                  type: "array",
                  description: "Optional list of add-ons/modifications with name and price",
                  items: {
                    type: "object",
                    properties: {
                      name: { type: "string" },
                      price: { type: "number" }
                    }
                  }
                }
              },
              required: ["search_query"]
            }
          },
          {
            name: "get_cart",
            description: "Get the current contents of the customer's cart with items, quantities, and total.",
            parameters: {
              type: "object",
              properties: {},
              required: []
            }
          },
          {
            name: "get_menu_items_with_variants",
            description: "RECOMMENDED - Get menu items including variants (comprehensive search). Finds both standalone items and variant items like 'CHICKEN TIKKA (starter)', 'LAMB BIRYANI'.",
            parameters: {
              type: "object",
              properties: {
                category: {
                  type: "string",
                  description: "Filter by menu section (e.g., 'STARTERS', 'MAIN COURSE', 'DESSERTS')"
                },
                dietary_filter: {
                  type: "string",
                  description: "Filter by dietary requirement ('vegetarian', 'vegan', 'gluten-free')"
                },
                search_query: {
                  type: "string",
                  description: "Free-text search in name/variant_name/description (e.g., 'chicken tikka', 'lamb')"
                },
                order_mode: {
                  type: "string",
                  description: "Pricing mode - 'delivery', 'collection', or 'dine_in' (default 'collection')"
                }
              },
              required: []
            }
          },
          {
            name: "get_item_customizations",
            description: "Get all available customizations (add-ons, spice levels, dietary options) for a specific menu item. Use this BEFORE adding items when customer mentions customizations.",
            parameters: {
              type: "object",
              properties: {
                menu_item_id: {
                  type: "string",
                  description: "The menu item ID (UUID) to get customizations for"
                }
              },
              required: ["menu_item_id"]
            }
          },
          {
            name: "get_restaurant_info",
            description: "Get restaurant information including opening hours, contact details, delivery policy, and location.",
            parameters: {
              type: "object",
              properties: {},
              required: []
            }
          },
          {
            name: "check_delivery_zone",
            description: "Check if delivery is available for a specific UK postcode. Returns delivery availability, fee, minimum order, and estimated time.",
            parameters: {
              type: "object",
              properties: {
                postcode: {
                  type: "string",
                  description: "UK postcode to check (e.g., 'RH20 3AA', 'BN44 3AA')"
                }
              },
              required: ["postcode"]
            }
          },
          {
            name: "create_order",
            description: "Create a new order with specified items, order type, and customer information. Returns order confirmation with order ID and estimated time.",
            parameters: {
              type: "object",
              properties: {
                items: {
                  type: "array",
                  description: "List of items with item_name, quantity, and optional special_instructions",
                  items: {
                    type: "object",
                    properties: {
                      item_name: { type: "string" },
                      quantity: { type: "number" },
                      special_instructions: { type: "string" }
                    }
                  }
                },
                order_type: {
                  type: "string",
                  description: "Type of order: 'dine-in', 'collection', or 'delivery'"
                },
                customer_info: {
                  type: "object",
                  description: "Customer details with name, phone, and email",
                  properties: {
                    name: { type: "string" },
                    phone: { type: "string" },
                    email: { type: "string" }
                  }
                },
                delivery_info: {
                  type: "object",
                  description: "Required for delivery orders - postcode, address, and phone",
                  properties: {
                    postcode: { type: "string" },
                    address: { type: "string" },
                    phone: { type: "string" }
                  }
                }
              },
              required: ["items", "order_type", "customer_info"]
            }
          },
          {
            name: "get_item_variants",
            description: "Get variant details for a specific menu item (e.g., different sizes, protein options).",
            parameters: {
              type: "object",
              properties: {
                item_id: {
                  type: "string",
                  description: "Menu item ID to get variants for"
                }
              },
              required: ["item_id"]
            }
          }
        ]
      }];

      // 5) Connect to Live API with CORRECT config structure (official SDK pattern)
      this.setState("connecting");
      const model = "models/gemini-2.5-flash-native-audio-preview-09-2025";
      
      this.session = await ai.live.connect({
        model: model,
        config: {
          responseModalities: ["AUDIO"],
          contextWindowCompression: {
            slidingWindow: {} // ✅ Enable unlimited session length for continuous conversation
          },
          proactivity: { 
            proactiveAudio: true // ✅ Official solution: AI speaks first without user input
          },
          realtimeInputConfig: {
            automaticActivityDetection: {
              disabled: false,
              prefixPaddingMs: 100,
              silenceDurationMs: 200,
            },
          },
          systemInstruction: {
            parts: [{
              text: (this.options.systemPrompt || `You are the AI voice assistant for Cottage Tandoori restaurant. Be friendly, concise, and help customers order food.

IMPORTANT GUIDELINES:
- Always confirm items, quantities, and any special requests
- Check for allergens when requested
- Use the add_to_cart function when customer orders items
- Use check_allergens function when asked about allergens
- Keep responses brief and natural
- If unsure about an item, check the menu

MENU:
${this.menuContext}

You have access to these functions:
- add_to_cart(item_name, quantity, notes) - Add items to cart
- remove_from_cart(item_name) - Remove items
- check_allergens(item_name) - Check allergen information

Always use functions to perform cart operations.`) +
              (this.options.firstResponse ? `\n\nIMPORTANT: When the session starts, immediately greet the user by saying: "${this.options.firstResponse}"` : '')
            }]
          },
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: {
                voiceName: this.options.voiceName || "Puck"
              }
            }
          },
          tools: tools
        },
        callbacks: {
          onopen: () => {
            this.setState("connected");
          },
          onmessage: (message: any) => {
            // Handle setupComplete
            if (message.setupComplete) {
              return;
            }

            // ✅ FIX: Handle goAway gracefully with exponential backoff
            if (message.goAway) {
              const timeLeft = message.goAway.timeLeft || '0s';
              this.handleReconnect('goAway');
              return;
            }

            // ✅ FIX: Pause mic when Gemini starts responding
            if (message.serverContent?.modelTurn) {
              this.shouldSendAudio = false; // Stop sending audio while Gemini speaks
            }

            // Handle function calls
            if (message.toolCall) {
              const functionCall = message.toolCall.functionCalls?.[0];
              if (functionCall) {
                // ✅ NEW: Trigger monitoring callback for Function Call Log
                this.options.onFunctionCall?.(functionCall.name, functionCall.args || {});
                
                if (functionCall.name === 'add_to_cart') {
                  this.handleAddToCart(functionCall);
                } else if (functionCall.name === 'remove_from_cart') {
                  this.handleRemoveFromCart(functionCall);
                } else if (functionCall.name === 'check_allergens') {
                  this.handleCheckAllergens(functionCall);
                } else if (functionCall.name === 'search_menu') {
                  this.handleSearchMenu(functionCall);
                } else if (functionCall.name === 'search_and_add_to_cart') {
                  this.handleSearchAndAddToCart(functionCall);
                } else if (functionCall.name === 'get_cart') {
                  this.handleGetCart(functionCall);
                } else if (functionCall.name === 'get_menu_items_with_variants') {
                  this.handleGetMenuItemsWithVariants(functionCall);
                } else if (functionCall.name === 'get_item_customizations') {
                  this.handleGetItemCustomizations(functionCall);
                } else if (functionCall.name === 'get_restaurant_info') {
                  this.handleGetRestaurantInfo(functionCall);
                } else if (functionCall.name === 'check_delivery_zone') {
                  this.handleCheckDeliveryZone(functionCall);
                } else if (functionCall.name === 'create_order') {
                  this.handleCreateOrder(functionCall);
                } else if (functionCall.name === 'get_item_variants') {
                  this.handleGetItemVariants(functionCall);
                } else if (functionCall.name === 'update_cart_quantity') {
                  this.handleUpdateCartQuantity(functionCall);
                } else if (functionCall.name === 'update_cart_customizations') {
                  this.handleUpdateCartCustomizations(functionCall);
                } else if (functionCall.name === 'clear_cart') {
                  this.handleClearCart(functionCall);
                }
              }
            }

            // Handle server content (text, audio, etc.)
            if (message.serverContent?.modelTurn) {
              const parts = message.serverContent.modelTurn.parts || [];
              
              for (const part of parts) {
                // Handle text responses
                if (part.text) {
                  this.options.onServerText?.(part.text);
                }

                // Handle audio responses
                if (part.inlineData?.data) {
                  const pcm = this.base64ToPCM16(part.inlineData.data);
                  // 🔥 CRITICAL FIX: Start playback immediately on first chunk
                  this.streamAudioChunk(pcm);
                }
              }

              // ✅ Turn complete signals end of turn - resume mic only
              if (message.serverContent.turnComplete) {
                // Resume mic after Gemini finishes speaking
                this.shouldSendAudio = true;
                // Reset playback state for next turn
                this.isPlayingAudio = false;
              }
            } else {
              // Message without modelTurn - this is normal for many Gemini message types
            }

            // ✅ Also handle generationComplete (Gemini sends this instead of turnComplete)
            if (message.serverContent?.generationComplete) {
              this.shouldSendAudio = true;
              this.isPlayingAudio = false;
            }
          },
          onerror: (error: any) => {
            console.error('❌ Gemini session error:', error);
            this.options.onError?.(String(error?.message || error));
            this.setState("error");
          },
          onclose: () => {
            if (this.state !== "stopping" && this.state !== "closed") {
              this.setState("error");
            }
          }
        }
      });

      // 6) Start microphone capture via unified pipeline (preserves previous behavior)
      await this.startMic();

      this.setState("listening");

      // Send greeting trigger after session is established
      if (this.session) {
        const triggerText = this.options.firstResponse 
          ? `Please greet the user by saying: "${this.options.firstResponse}"` 
          : "Please greet the user warmly";
        
        try {
          this.session.sendClientContent({
            turns: [{
              role: "user",
              parts: [{ text: triggerText }]
            }],
            turn_complete: true
          });
        } catch (error) {
          console.error('❌ Failed to send greeting trigger:', error);
        }
      }
    } catch (e: any) {
      console.error("GeminiVoiceClient.start error:", e);
      this.options.onError?.(String(e?.message || e));
      this.setState("error");
      await this.stop();
    }
  }

  async stop(): Promise<void> {
    try {
      if (this.state === "closed" || this.state === "idle") return;
      this.setState("stopping");

      // Clear any pending reconnect attempts
      if (this.reconnectTimeout) {
        clearTimeout(this.reconnectTimeout);
        this.reconnectTimeout = null;
      }

      // Stop audio capture FIRST (via unified pipeline)
      this.teardownAudio();

      // Close session and ensure cleanup
      if (this.session) {
        try {
          this.session.close(); // ✅ FIXED: Official SDK uses close() not disconnect()
        } catch (e) {
          console.warn('⚠️ Error during close:', e);
        }
        this.session = null; // Critical: ensure session is cleared
      }

      this.setState("closed");
    } catch (e) {
      console.warn("GeminiVoiceClient.stop warning:", e);
      this.setState("closed");
    }
  }

  private async fetchMenuContext(): Promise<void> {
    try {
      const resp = await apiClient.get_menu_context();
      const data = await resp.json();
      if (data?.success && data?.menu_text) {
        this.menuContext = data.menu_text;
      }
    } catch (e) {
      console.warn("Failed to fetch menu context:", e);
      this.menuContext = "Menu currently unavailable. Please ask for available items.";
    }
  }

  private async startMic() {
    try {
      // Use unified mic pipeline at 16kHz (Gemini-native)
      const useVAD = isFlagEnabled('voice_pipeline_v1');
      this.mic = createMicPipeline({
        sampleRate: 16000,
        bufferSize: 4096,
        channelCount: 1,
        enableVAD: useVAD,
        vad: {
          energyThreshold: 0.01,
          minSpeechMs: 120,
          minSilenceMs: 200,
        },
      });

      // Keep legacy fields populated for internal teardown compatibility
      // Note: mic init is async; wait until context is ready by polling
      const waitForContext = async () => {
        let tries = 0;
        while (tries < 50) { // ~5s max
          if (this.mic?.audioContext && this.mic?.mediaStream && this.mic?.scriptNode && this.mic?.sourceNode) break;
          await new Promise(r => setTimeout(r, 100));
          tries++;
        }
        this.audioContext = this.mic?.audioContext || null;
        this.mediaStream = this.mic?.mediaStream || null;
        this.scriptNode = this.mic?.scriptNode || null;
        this.sourceNode = this.mic?.sourceNode || null;
      };
      await waitForContext();

      let audioChunkCount = 0;
      let sendSuccessCount = 0;
      let sendErrorCount = 0;

      this.mic.onAudioFrame((input: Float32Array) => {
        const pcm16 = this.floatTo16BitPCM(input);
        if (pcm16.length > 0 && this.session && this.shouldSendAudio) {
          const b64 = this.pcm16ToBase64(pcm16);
          try {
            audioChunkCount++;
            this.session.sendRealtimeInput({
              audio: {
                data: b64,
                mimeType: "audio/pcm;rate=16000"
              }
            });
            sendSuccessCount++;
          } catch (e) {
            sendErrorCount++;
            console.error('❌ Failed to send audio chunk:', e);
          }
        }
      });

      if (useVAD) {
        this.mic.onSpeechEvent((ev) => {
          if (ev === 'speechStart') {
            // Optionally mark speech start; keep behavior unchanged (no gating here)
          } else if (ev === 'speechEnd') {
            // Optionally mark speech end
          }
        });
      }

    } catch (error: any) {
      console.error('❌ Failed to access microphone:', error);
      throw new Error(`Microphone access denied: ${error.message}`);
    }
  }

  private teardownAudio() {
    try {
      this.mic?.stop();
    } catch {}
    this.mic = null;
    this.scriptNode = null;
    this.sourceNode = null;
    this.mediaStream = null;
    this.audioContext = null;
  }

  /**
   * Stream audio chunk with immediate playback (ring buffer pattern)
   * Eliminates 30-50s latency by starting playback on FIRST chunk
   */
  private streamAudioChunk(pcm16: Int16Array) {
    // Initialize output context on first chunk
    if (!this.outputAudioContext) {
      this.outputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({
        sampleRate: this.outputSampleRate
      });
      this.nextPlaybackTime = this.outputAudioContext.currentTime;
    }

    // Convert Int16 -> Float32
    const float32 = new Float32Array(pcm16.length);
    for (let i = 0; i < pcm16.length; i++) {
      float32[i] = pcm16[i] / 32768;
    }

    // Create buffer and schedule playback
    const audioBuffer = this.outputAudioContext.createBuffer(1, float32.length, this.outputSampleRate);
    audioBuffer.copyToChannel(float32, 0);
    const source = this.outputAudioContext.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(this.outputAudioContext.destination);

    // Schedule this chunk to play at the next available time
    const now = this.outputAudioContext.currentTime;
    const startTime = Math.max(now, this.nextPlaybackTime);
    
    source.start(startTime);
    
    // Update next playback time (duration of this chunk)
    const chunkDuration = float32.length / this.outputSampleRate;
    this.nextPlaybackTime = startTime + chunkDuration;

    if (!this.isPlayingAudio) {
      this.isPlayingAudio = true;
    }

    // Cleanup when done
    source.onended = () => {
      // Check if this was the last scheduled chunk
      if (this.outputAudioContext && this.outputAudioContext.currentTime >= this.nextPlaybackTime - 0.01) {
        // Audio stream completed
      }
    };
  }

  // UPDATED: Use external cart operation callbacks (user-aware)
  private async handleAddToCart(functionCall: any): Promise<void> {
    try {
      const args = functionCall.args || {};
      
      // Use injected cart operation callback
      if (this.options.cartOperations?.addItem) {
        const result = await this.options.cartOperations.addItem(
          args.item_name,
          args.quantity || 1,
          args.notes
        );
        
        // Send response to Gemini
        await this.session.sendToolResponse({
          functionResponses: [{
            id: functionCall.id,
            name: 'add_to_cart',
            response: { 
              success: result.success,
              message: result.message
            }
          }]
        });
        
        console.log('✅ Item added to cart via voice:', result.message);
      } else {
        throw new Error('Cart operations not configured');
      }
    } catch (e: any) {
      console.error('❌ Error adding to cart:', e);
      
      // Send error response
      await this.session.sendToolResponse({
        functionResponses: [{
          id: functionCall.id,
          name: 'add_to_cart',
          response: { 
            success: false,
            error: `Failed to add item: ${e.message}` 
          }
        }]
      });
    }
  }

  // UPDATED: Use external cart operation callbacks (user-aware)
  private async handleRemoveFromCart(functionCall: any): Promise<void> {
    try {
      const args = functionCall.args || {};
      
      // Use injected cart operation callback
      if (this.options.cartOperations?.removeItem) {
        const result = await this.options.cartOperations.removeItem(args.item_name);
        
        await this.session.sendToolResponse({
          functionResponses: [{
            id: functionCall.id,
            name: 'remove_from_cart',
            response: { 
              success: result.success,
              message: result.message
            }
          }]
        });
        
        console.log('✅ Item removed from cart via voice:', result.message);
      } else {
        throw new Error('Cart operations not configured');
      }
    } catch (e: any) {
      console.error('❌ Error removing from cart:', e);
      
      await this.session.sendToolResponse({
        functionResponses: [{
          id: functionCall.id,
          name: 'remove_from_cart',
          response: { 
            success: false,
            error: e.message
          }
        }]
      });
    }
  }

  // NEW: Get cart summary for AI context
  private async handleGetCartSummary(functionCall: any): Promise<void> {
    try {
      const cartStore = useCartStore.getState();
      const summary = cartStore.getFormattedSummary();
      
      await this.session.sendToolResponse({
        functionResponses: [{
          id: functionCall.id,
          name: 'get_cart_summary',
          response: { 
            success: true,
            summary: summary,
            cart_count: cartStore.totalItems,
            cart_total: cartStore.totalAmount
          }
        }]
      });
      
      console.log('✅ Cart summary sent to Gemini');
    } catch (e: any) {
      console.error('❌ Error getting cart summary:', e);
      
      await this.session.sendToolResponse({
        functionResponses: [{
          id: functionCall.id,
          name: 'get_cart_summary',
          response: { 
            success: false,
            error: 'Failed to get cart summary'
          }
        }]
      });
    }
  }

  private async handleCheckAllergens(functionCall: any): Promise<void> {
    try {
      const args = functionCall.args || {};
      
      // Send response (placeholder - could integrate with menu data)
      await this.session.sendToolResponse({
        functionResponses: [{
          id: functionCall.id,
          name: 'check_allergens',
          response: {
            success: true,
            allergens: "Please check with staff for specific allergen information."
          }
        }]
      });
      
      console.log('✅ Allergen info sent to Gemini');
    } catch (e: any) {
      console.error('❌ Error checking allergens:', e);
      
      await this.session.sendToolResponse({
        functionResponses: [{
          id: functionCall.id,
          name: 'check_allergens',
          response: { 
            success: false,
            error: 'Failed to check allergens'
          }
        }]
      });
    }
  }

  private async handleSearchMenu(functionCall: any): Promise<void> {
    try {
      const args = functionCall.args || {};
      
      // Call backend to search menu
      const resp = await apiClient.search_menu({
        query: args.query || null,
        category: args.category || null
      });
      const data = await resp.json();
      
      if (data?.success && data?.items) {
        // Format results for Gemini
        let resultsText = `Found ${data.total_count} items:\n`;
        
        // Group by category
        const itemsByCategory: Record<string, any[]> = {};
        data.items.forEach((item: any) => {
          if (!itemsByCategory[item.category]) {
            itemsByCategory[item.category] = [];
          }
          itemsByCategory[item.category].push(item);
        });
        
        // Format each category
        for (const [category, items] of Object.entries(itemsByCategory)) {
          resultsText += `\n${category}:\n`;
          items.forEach((item: any) => {
            resultsText += `- ${item.name} (£${item.price.toFixed(2)})`;
            if (item.description) {
              resultsText += ` - ${item.description.substring(0, 60)}`;
            }
            if (item.is_vegetarian) resultsText += ' 🌱';
            if (item.is_vegan) resultsText += ' 🌿';
            resultsText += '\n';
          });
        }
        
        // Send function response back to Gemini
        await this.session.sendToolResponse({
          functionResponses: [{
            id: functionCall.id,
            name: 'search_menu',
            response: { result: resultsText }
          }]
        });
        
        console.log('✅ Menu search results sent to Gemini');
      } else {
        throw new Error('Failed to search menu');
      }
    } catch (e) {
      console.error('❌ Error searching menu:', e);
      
      // Send error response
      await this.session.sendToolResponse({
        functionResponses: [{
          id: functionCall.id,
          name: 'search_menu',
          response: { error: 'Failed to search menu. Please try again.' }
        }]
      });
    }
  }

  // ========================================================================
  // NEW: 8 MISSING FUNCTION HANDLERS (Phase 6)
  // ========================================================================

  /**
   * Handler 1: get_menu_items_with_variants
   * Main menu search function - finds both standalone items and variant items
   */
  private async handleGetMenuItemsWithVariants(functionCall: any): Promise<void> {
    try {
      const args = functionCall.args || {};
      
      // Call backend menu search
      const resp = await apiClient.get_menu_items_with_variants({
        search_query: args.search_query || null,
        category: args.category || null,
        dietary_filter: args.dietary_filter || null,
        order_mode: args.order_mode || null
      });
      const data = await resp.json();
      
      // Send response to Gemini
      await this.session.sendToolResponse({
        functionResponses: [{
          id: functionCall.id,
          name: 'get_menu_items_with_variants',
          response: data
        }]
      });
      
      console.log('✅ Menu items with variants sent to Gemini');
    } catch (e: any) {
      console.error('❌ get_menu_items_with_variants error:', e);
      await this.session.sendToolResponse({
        functionResponses: [{
          id: functionCall.id,
          name: 'get_menu_items_with_variants',
          response: { success: false, error: e.message }
        }]
      });
    }
  }

  /**
   * Handler 2: get_item_customizations
   * Get customization options for a specific menu item
   */
  private async handleGetItemCustomizations(functionCall: any): Promise<void> {
    try {
      const args = functionCall.args || {};
      
      // Call backend to get customizations
      const resp = await apiClient.get_item_customizations({
        item_id: args.item_id
      });
      const data = await resp.json();
      
      await this.session.sendToolResponse({
        functionResponses: [{
          id: functionCall.id,
          name: 'get_item_customizations',
          response: data
        }]
      });
      
      console.log('✅ Item customizations sent to Gemini');
    } catch (e: any) {
      console.error('❌ get_item_customizations error:', e);
      await this.session.sendToolResponse({
        functionResponses: [{
          id: functionCall.id,
          name: 'get_item_customizations',
          response: { success: false, error: e.message }
        }]
      });
    }
  }

  /**
   * Handler 3: search_and_add_to_cart
   * Atomic operation - searches menu AND adds to cart in one call
   */
  private async handleSearchAndAddToCart(functionCall: any): Promise<void> {
    try {
      const args = functionCall.args || {};
      
      // Use injected cart operation callback (if available)
      if (this.options.cartOperations?.addItem) {
        const result = await this.options.cartOperations.addItem(
          args.search_query,
          args.quantity || 1,
          args.notes
        );
        
        await this.session.sendToolResponse({
          functionResponses: [{
            id: functionCall.id,
            name: 'search_and_add_to_cart',
            response: result
          }]
        });
      } else {
        // Fallback: acknowledge without action
        await this.session.sendToolResponse({
          functionResponses: [{
            id: functionCall.id,
            name: 'search_and_add_to_cart',
            response: { 
              success: false, 
              error: 'Cart operations not configured'
            }
          }]
        });
      }
      
      console.log('✅ search_and_add_to_cart executed');
    } catch (e: any) {
      console.error('❌ search_and_add_to_cart error:', e);
      await this.session.sendToolResponse({
        functionResponses: [{
          id: functionCall.id,
          name: 'search_and_add_to_cart',
          response: { success: false, error: e.message }
        }]
      });
    }
  }

  /**
   * Handler 4: update_cart_quantity
   * Update quantity of an existing cart item
   */
  private async handleUpdateCartQuantity(functionCall: any): Promise<void> {
    try {
      const args = functionCall.args || {};
      
      // Use injected cart operation callback (if available)
      if (this.options.cartOperations?.updateQuantity) {
        const result = await this.options.cartOperations.updateQuantity(
          args.cart_item_id,
          args.quantity
        );
        
        await this.session.sendToolResponse({
          functionResponses: [{
            id: functionCall.id,
            name: 'update_cart_quantity',
            response: result
          }]
        });
      } else {
        await this.session.sendToolResponse({
          functionResponses: [{
            id: functionCall.id,
            name: 'update_cart_quantity',
            response: { 
              success: false, 
              error: 'Cart operations not configured'
            }
          }]
        });
      }
      
      console.log('✅ update_cart_quantity executed');
    } catch (e: any) {
      console.error('❌ update_cart_quantity error:', e);
      await this.session.sendToolResponse({
        functionResponses: [{
          id: functionCall.id,
          name: 'update_cart_quantity',
          response: { success: false, error: e.message }
        }]
      });
    }
  }

  /**
   * Handler 5: update_cart_customizations
   * Update customizations/modifiers for an existing cart item
   */
  private async handleUpdateCartCustomizations(functionCall: any): Promise<void> {
    try {
      const args = functionCall.args || {};
      
      // Use injected cart operation callback (if available)
      if (this.options.cartOperations?.updateCustomizations) {
        const result = await this.options.cartOperations.updateCustomizations(
          args.cart_item_id,
          args.customizations
        );
        
        await this.session.sendToolResponse({
          functionResponses: [{
            id: functionCall.id,
            name: 'update_cart_customizations',
            response: result
          }]
        });
      } else {
        await this.session.sendToolResponse({
          functionResponses: [{
            id: functionCall.id,
            name: 'update_cart_customizations',
            response: { 
              success: false, 
              error: 'Cart operations not configured'
            }
          }]
        });
      }
      
      console.log('✅ update_cart_customizations executed');
    } catch (e: any) {
      console.error('❌ update_cart_customizations error:', e);
      await this.session.sendToolResponse({
        functionResponses: [{
          id: functionCall.id,
          name: 'update_cart_customizations',
          response: { success: false, error: e.message }
        }]
      });
    }
  }

  /**
   * Handler 6: get_cart
   * Get current cart contents
   */
  private async handleGetCart(functionCall: any): Promise<void> {
    try {
      // Use injected cart operation callback (if available)
      if (this.options.cartOperations?.getCart) {
        const result = await this.options.cartOperations.getCart();
        
        await this.session.sendToolResponse({
          functionResponses: [{
            id: functionCall.id,
            name: 'get_cart',
            response: result
          }]
        });
      } else {
        await this.session.sendToolResponse({
          functionResponses: [{
            id: functionCall.id,
            name: 'get_cart',
            response: { 
              success: false, 
              error: 'Cart operations not configured'
            }
          }]
        });
      }
      
      console.log('✅ get_cart executed');
    } catch (e: any) {
      console.error('❌ get_cart error:', e);
      await this.session.sendToolResponse({
        functionResponses: [{
          id: functionCall.id,
          name: 'get_cart',
          response: { success: false, error: e.message }
        }]
      });
    }
  }

  /**
   * Handler 7: clear_cart
   * Remove all items from cart
   */
  private async handleClearCart(functionCall: any): Promise<void> {
    try {
      // Use injected cart operation callback (if available)
      if (this.options.cartOperations?.clearCart) {
        const result = await this.options.cartOperations.clearCart();
        
        await this.session.sendToolResponse({
          functionResponses: [{
            id: functionCall.id,
            name: 'clear_cart',
            response: result
          }]
        });
      } else {
        await this.session.sendToolResponse({
          functionResponses: [{
            id: functionCall.id,
            name: 'clear_cart',
            response: { 
              success: false, 
              error: 'Cart operations not configured'
            }
          }]
        });
      }
      
      console.log('✅ clear_cart executed');
    } catch (e: any) {
      console.error('❌ clear_cart error:', e);
      await this.session.sendToolResponse({
        functionResponses: [{
          id: functionCall.id,
          name: 'clear_cart',
          response: { success: false, error: e.message }
        }]
      });
    }
  }

  /**
   * Handler 8: get_restaurant_info
   * Get restaurant details (hours, phone, address, etc.)
   */
  private async handleGetRestaurantInfo(functionCall: any): Promise<void> {
    try {
      // Call backend to get restaurant info
      const resp = await apiClient.get_restaurant_info();
      const data = await resp.json();
      
      await this.session.sendToolResponse({
        functionResponses: [{
          id: functionCall.id,
          name: 'get_restaurant_info',
          response: data
        }]
      });
      
      console.log('✅ Restaurant info sent to Gemini');
    } catch (e: any) {
      console.error('❌ get_restaurant_info error:', e);
      await this.session.sendToolResponse({
        functionResponses: [{
          id: functionCall.id,
          name: 'get_restaurant_info',
          response: { success: false, error: e.message }
        }]
      });
    }
  }

  /**
   * Handler 9: check_delivery_zone
   * Check if delivery is available to a specific postcode
   */
  private async handleCheckDeliveryZone(functionCall: any): Promise<void> {
    try {
      const args = functionCall.args || {};
      
      // Call backend to check delivery zone
      const resp = await apiClient.check_delivery_zone({
        postcode: args.postcode
      });
      const data = await resp.json();
      
      await this.session.sendToolResponse({
        functionResponses: [{
          id: functionCall.id,
          name: 'check_delivery_zone',
          response: data
        }]
      });
      
      console.log('✅ Delivery zone check sent to Gemini');
    } catch (e: any) {
      console.error('❌ check_delivery_zone error:', e);
      await this.session.sendToolResponse({
        functionResponses: [{
          id: functionCall.id,
          name: 'check_delivery_zone',
          response: { success: false, error: e.message }
        }]
      });
    }
  }

  /**
   * Handler 10: create_order
   * Submit a complete order to the backend
   */
  private async handleCreateOrder(functionCall: any): Promise<void> {
    try {
      const args = functionCall.args || {};
      
      // Call backend to create order
      const resp = await apiClient.create_order({
        items: args.items || [],
        order_type: args.order_type || 'COLLECTION',
        customer_info: args.customer_info || {},
        delivery_info: args.delivery_info || null,
        notes: args.notes || null
      });
      const data = await resp.json();
      
      await this.session.sendToolResponse({
        functionResponses: [{
          id: functionCall.id,
          name: 'create_order',
          response: data
        }]
      });
      
      console.log('✅ Order creation sent to Gemini');
    } catch (e: any) {
      console.error('❌ create_order error:', e);
      await this.session.sendToolResponse({
        functionResponses: [{
          id: functionCall.id,
          name: 'create_order',
          response: { success: false, error: e.message }
        }]
      });
    }
  }

  /**
   * Handler 11: get_item_variants
   * Get variant options (sizes, protein choices) for a menu item
   */
  private async handleGetItemVariants(functionCall: any): Promise<void> {
    try {
      const args = functionCall.args || {};
      
      // Call backend to get item variants
      const resp = await apiClient.get_item_variants({
        item_id: args.item_id
      });
      const data = await resp.json();
      
      await this.session.sendToolResponse({
        functionResponses: [{
          id: functionCall.id,
          name: 'get_item_variants',
          response: data
        }]
      });
      
      console.log('✅ Item variants sent to Gemini');
    } catch (e: any) {
      console.error('❌ get_item_variants error:', e);
      await this.session.sendToolResponse({
        functionResponses: [{
          id: functionCall.id,
          name: 'get_item_variants',
          response: { success: false, error: e.message }
        }]
      });
    }
  }

  // ========================================================================
  // END OF 12 FUNCTION HANDLERS (Phase 6 Complete)
  // ========================================================================

  // Phase 2.1: Exponential backoff reconnect logic
  private handleReconnect(reason: string): void {
    // Don't reconnect if we've exceeded max retries
    if (this.retryCount >= this.maxRetries) {
      console.error(`❌ Max reconnect attempts (${this.maxRetries}) exceeded. Please refresh.`);
      this.setState('closed');
      return;
    }

    // Clear any existing reconnect timeout
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
    }

    // Calculate exponential backoff delay with jitter
    const exponentialDelay = Math.min(
      this.maxDelay,
      this.baseDelay * Math.pow(2, this.retryCount)
    );
    const jitterOffset = (Math.random() * this.jitter * 2) - this.jitter;
    const delay = Math.max(0, exponentialDelay + jitterOffset);

    this.retryCount++;
    console.log(`🔄 Reconnect attempt ${this.retryCount}/${this.maxRetries} in ${Math.round(delay)}ms (reason: ${reason})`);

    this.reconnectTimeout = window.setTimeout(async () => {
      if (this.state === 'listening' || this.state === 'connected') {
        console.log('🔌 Executing reconnect...');
        try {
          await this.stop();
          await this.start();
          // Reset retry count on successful reconnect
          this.retryCount = 0;
          console.log('✅ Reconnect successful');
        } catch (error) {
          console.error('❌ Reconnect failed:', error);
          // Retry again with next backoff
          this.handleReconnect('reconnect_failed');
        }
      }
    }, delay);
  }

  // Audio utilities
  private floatTo16BitPCM(input: Float32Array): Int16Array {
    const out = new Int16Array(input.length);
    for (let i = 0; i < input.length; i++) {
      const s = Math.max(-1, Math.min(1, input[i]));
      out[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
    }
    return out;
  }

  private pcm16ToBase64(pcm: Int16Array): string {
    const bytes = new Uint8Array(pcm.buffer);
    let binary = "";
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }

  private base64ToPCM16(b64: string): Int16Array {
    const binary = atob(b64);
    const len = binary.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) bytes[i] = binary.charCodeAt(i);
    return new Int16Array(bytes.buffer);
  }
}
