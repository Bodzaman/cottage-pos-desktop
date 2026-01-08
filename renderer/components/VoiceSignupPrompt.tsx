import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Phone } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { PremiumTheme } from '../utils/premiumTheme';

interface VoiceSignupPromptProps {
  isOpen: boolean;
  onClose: () => void;
}

/**
 * Voice Signup Prompt Modal
 * 
 * Shown to guest users when they click the phone icon in chat
 * Encourages signup to unlock voice ordering feature
 * Matches WelcomeScreen design consistency
 */
export function VoiceSignupPrompt({ isOpen, onClose }: VoiceSignupPromptProps) {
  const navigate = useNavigate();

  const handleSignup = () => {
    onClose();
    navigate('/sign-up');
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md bg-charcoal-900 border-burgundy-800">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div 
              className="p-3 rounded-full"
              style={{ backgroundColor: `${PremiumTheme.colors.burgundy[500]}20` }}
            >
              <Phone className="w-6 h-6" style={{ color: PremiumTheme.colors.burgundy[500] }} />
            </div>
            <DialogTitle 
              className="text-xl font-semibold"
              style={{ color: PremiumTheme.colors.text.primary }}
            >
              Voice Calls Available
            </DialogTitle>
          </div>
        </DialogHeader>
        
        <div className="space-y-4">
          <p className="text-platinum-300">
            Sign up for free to unlock voice calls with Uncle Raj and place orders using natural conversation.
          </p>
          
          <Button
            onClick={handleSignup}
            className="w-full font-semibold py-6 text-lg"
            style={{
              backgroundColor: PremiumTheme.colors.burgundy[500],
              color: PremiumTheme.colors.text.primary
            }}
          >
            Sign Up for Free
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
