import React from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { Sparkles, ArrowRight } from 'lucide-react';
import { PremiumTheme } from '../utils/premiumTheme';
import { useNavigate } from 'react-router-dom';
import { useAgentConfig } from '../utils/useAgentConfig';

export interface VoiceMaintenanceModalProps {
  isOpen: boolean;
  onClose: () => void;
}

/**
 * VoiceMaintenanceModal - Shown when AI Voice is under maintenance
 * 
 * Displays professional, empathetic messaging to customers when voice
 * ordering feature is temporarily unavailable during development.
 * 
 * Design: Burgundy/platinum theme with smooth animations
 * Tone: Professional, helpful, transparent
 */
export function VoiceMaintenanceModal({ isOpen, onClose }: VoiceMaintenanceModalProps) {
  const navigate = useNavigate();
  const { agentAvatar } = useAgentConfig();

  const handleViewMenu = () => {
    onClose();
    navigate('/online-orders');
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        className="sm:max-w-lg p-0 overflow-hidden border border-burgundy-800 bg-[#0f0b10]"
        style={{
          background: "linear-gradient(135deg, rgba(15,11,16,0.95), rgba(38,23,34,0.98))",
          borderColor: `${PremiumTheme.colors.burgundy[500]}40`,
          boxShadow: "0 25px 60px rgba(0, 0, 0, 0.65)",
        }}
      >
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
          className="p-8 text-center"
        >
          {/* Icon - Dynamic AI Avatar */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.5, ease: 'easeOut' }}
            className="flex justify-center mb-6"
          >
            <div
              className="w-20 h-20 rounded-full flex items-center justify-center overflow-hidden"
              style={{
                background: `linear-gradient(135deg, ${PremiumTheme.colors.burgundy[600]}, ${PremiumTheme.colors.burgundy[400]})`,
                boxShadow: `0 8px 24px ${PremiumTheme.colors.burgundy[500]}40`,
              }}
            >
              {agentAvatar ? (
                <img 
                  src={agentAvatar} 
                  alt="AI Assistant"
                  className="w-full h-full object-cover"
                />
              ) : (
                <Sparkles size={40} style={{ color: PremiumTheme.colors.silver[100] }} />
              )}
            </div>
          </motion.div>

          {/* Title */}
          <motion.h2
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.4 }}
            className="text-2xl font-bold mb-4"
            style={{
              background: `linear-gradient(135deg, ${PremiumTheme.colors.silver[100]}, ${PremiumTheme.colors.silver[300]})`,
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            I'm Here to Help You Order!
          </motion.h2>

          {/* Description */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.4 }}
            className="text-base mb-8 leading-relaxed"
            style={{ color: PremiumTheme.colors.text.muted }}
          >
            My voice line is under maintenance, but I'm still here via chat! Let's explore the menu and build your perfect meal together.
          </motion.p>

          {/* Single Action Button */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.4 }}
            className="flex justify-center"
          >
            <Button
              onClick={onClose}
              className="px-8 py-3 rounded-lg font-semibold transition-all duration-300 hover:scale-105"
              style={{
                background: `linear-gradient(135deg, ${PremiumTheme.colors.burgundy[600]}, ${PremiumTheme.colors.burgundy[500]})`,
                color: PremiumTheme.colors.text.primary,
                boxShadow: `0 4px 16px ${PremiumTheme.colors.burgundy[500]}40`,
              }}
            >
              Let's Chat
            </Button>
          </motion.div>
        </motion.div>
      </DialogContent>
    </Dialog>
  );
}
