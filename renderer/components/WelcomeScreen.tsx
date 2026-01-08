import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useAgentConfig } from 'utils/useAgentConfig';
import { MessageCircle, Mic } from 'lucide-react';
import { PremiumTheme } from 'utils/premiumTheme';
import { useChatActions } from 'utils/chat-store';

// Storage key for tracking if user has seen the welcome screen
const STORAGE_KEY = 'cottage_welcome_shown';

interface WelcomeScreenProps {
  isOpen: boolean;
  onClose: () => void;
}

/**
 * First-time welcome modal
 * Shows warm intro to chat and voice features
 * Displays once per browser using localStorage
 */
export function WelcomeScreen({ isOpen, onClose }: WelcomeScreenProps) {
  console.log('🎉 WelcomeScreen: COMPONENT MOUNTED - isOpen=', isOpen);
  const { agentName, agentAvatar } = useAgentConfig();
  const navigate = useNavigate();
  const { sendMessage } = useChatActions();

  const handleGetStarted = () => {
    // Mark welcome as seen in session storage
    sessionStorage.setItem(STORAGE_KEY, 'true');
    
    // ✅ NEW: Dispatch custom event to notify hook
    window.dispatchEvent(new Event('welcomeScreenDismissed'));
    
    onClose();
  };

  // ✅ NEW: Handle signup link click from voice option
  const handleSignUpClick = () => {
    // Close modal cleanly
    onClose();
    
    // Navigate to signup (after signup, user will auto-return to chat)
    navigate('/sign-up');
  };

  // ✅ NEW: Handle quick question clicks
  const handleQuickQuestion = async (question: string) => {
    try {
      // Send the message
      await sendMessage(question);
      
      // Dismiss the welcome screen
      handleGetStarted();
    } catch (error) {
      console.error('Error sending quick question:', error);
      // Still dismiss even if send fails
      handleGetStarted();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleGetStarted()}>
      <DialogContent className="sm:max-w-md bg-gradient-to-br from-burgundy-950 to-burgundy-900 border-burgundy-700 text-white">
        <DialogHeader>
          <DialogTitle className="sr-only">Welcome to Cottage Tandoori</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col items-center text-center space-y-6 py-4">
          {/* Agent Avatar */}
          <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-saffron-500 shadow-lg">
            <img
              src={agentAvatar}
              alt={agentName}
              className="w-full h-full object-cover"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
                target.parentElement!.innerHTML = `
                  <div class="w-full h-full bg-gradient-to-br from-burgundy-700 to-burgundy-900 flex items-center justify-center">
                    <span class="text-4xl font-bold text-white">${agentName.charAt(0)}</span>
                  </div>
                `;
              }}
            />
          </div>

          {/* Welcome Message */}
          <div className="space-y-3">
            <h2 className="text-2xl font-bold text-saffron-400">
              Welcome to Cottage Tandoori! 👋
            </h2>
            <p className="text-lg text-platinum-200">
              I'm <span className="font-semibold text-white">{agentName}</span>, your AI waiter.
            </p>
            <p className="text-platinum-300">
              Let me help you explore our menu and place your order.
            </p>
          </div>

          {/* Feature Cards */}
          <div className="w-full space-y-3">
            {/* Chat Option */}
            <div className="flex items-start gap-3 p-4 rounded-lg bg-burgundy-800/50 border border-burgundy-700">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-saffron-500/20 flex items-center justify-center">
                <MessageCircle className="w-5 h-5 text-saffron-400" />
              </div>
              <div className="text-left">
                <h3 className="font-semibold text-white mb-1">💬 Chat with me</h3>
                <p className="text-sm text-platinum-300">
                  Type your questions, browse the menu, and build your order
                </p>
              </div>
            </div>

            {/* Voice Option */}
            <div className="flex items-start gap-3 p-4 rounded-lg bg-burgundy-800/50 border border-burgundy-700">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-saffron-500/20 flex items-center justify-center">
                <Mic className="w-5 h-5 text-saffron-400" />
              </div>
              <div className="text-left">
                <h3 className="font-semibold text-white mb-1">🎙️ Speak with me</h3>
                <p className="text-sm text-platinum-300 mb-1">
                  Have a natural conversation and order by voice
                </p>
                <p className="text-sm">
                  <button 
                    onClick={handleSignUpClick}
                    className="text-saffron-400 hover:text-saffron-300 underline font-medium transition-colors"
                    type="button"
                  >
                    Sign up free
                  </button>
                  <span className="text-platinum-400"> to unlock voice ordering • T&C apply</span>
                </p>
              </div>
            </div>
          </div>

          {/* Quick Questions Section */}
          <div className="w-full space-y-2">
            <p className="text-sm text-platinum-300 font-medium">Quick Questions:</p>
            <div className="flex flex-wrap gap-2 justify-center">
              <button
                onClick={() => handleQuickQuestion("What's popular on your menu?")}
                className="px-3 py-1.5 text-sm rounded-full bg-burgundy-800/50 border border-burgundy-600 text-platinum-200 hover:bg-burgundy-700/50 hover:border-saffron-500/30 transition-all duration-200"
              >
                What's popular?
              </button>
              <button
                onClick={() => handleQuickQuestion("Do you have any vegan options?")}
                className="px-3 py-1.5 text-sm rounded-full bg-burgundy-800/50 border border-burgundy-600 text-platinum-200 hover:bg-burgundy-700/50 hover:border-saffron-500/30 transition-all duration-200"
              >
                Vegan options?
              </button>
              <button
                onClick={() => handleQuickQuestion("What are your opening hours?")}
                className="px-3 py-1.5 text-sm rounded-full bg-burgundy-800/50 border border-burgundy-600 text-platinum-200 hover:bg-burgundy-700/50 hover:border-saffron-500/30 transition-all duration-200"
              >
                Opening hours?
              </button>
              <button
                onClick={() => handleQuickQuestion("Tell me about your spice levels")}
                className="px-3 py-1.5 text-sm rounded-full bg-burgundy-800/50 border border-burgundy-600 text-platinum-200 hover:bg-burgundy-700/50 hover:border-saffron-500/30 transition-all duration-200"
              >
                Spice levels?
              </button>
            </div>
          </div>

          {/* CTA Button */}
          <Button
            onClick={handleGetStarted}
            className="w-full font-semibold py-6 text-lg"
            style={{
              background: PremiumTheme.colors.burgundy[500],
              color: PremiumTheme.colors.text.primary,
              border: `2px solid ${PremiumTheme.colors.burgundy[400]}`,
              boxShadow: `0 10px 30px rgba(139, 21, 56, 0.4), inset 0 1px 0 ${PremiumTheme.colors.platinum[400]}20`
            }}
          >
            Get Started →
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/**
 * Hook to manage welcome screen display logic
 * Uses sessionStorage to show welcome screen once per browser session
 * Returning customers will see it on each new visit (not just once ever)
 */
export function useWelcomeScreen() {
  const [shouldShow] = useState(() => {
    const hasSeenWelcome = sessionStorage.getItem(STORAGE_KEY);
    return !hasSeenWelcome;
  });

  console.log('🔍 useWelcomeScreen: shouldShow=', shouldShow, 'sessionStorage=', sessionStorage.getItem(STORAGE_KEY));
  return shouldShow;
}
