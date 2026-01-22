import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChefHat, Printer, Menu, BarChart3, DollarSign, Shield, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { globalColors } from '../utils/QSAIDesign';
import { colors as designColors } from '../utils/designSystem';
import { useNavigate } from 'react-router-dom';
import { APP_BASE_PATH } from '../constants';

interface QuickToolsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ToolItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  action: () => void;
  description: string;
}

const QuickToolsModal: React.FC<QuickToolsModalProps> = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const [isClosing, setIsClosing] = useState(false);

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      setIsClosing(false);
      onClose();
    }, 200);
  };

  const tools: ToolItem[] = [
    {
      id: 'kitchen-display',
      label: '🍳 Kitchen Display',
      icon: <ChefHat className="h-6 w-6" />,
      action: () => {
        window.open(
          `${window.location.origin}${APP_BASE_PATH}/kds-v2?fullscreen=true`,
          'kitchen-display',
          'width=1920,height=1080'
        );
        handleClose();
      },
      description: 'View and manage kitchen orders in dedicated window'
    },
    {
      id: 'printer-management',
      label: '🖨️ Printer Management',
      icon: <Printer className="h-6 w-6" />,
      action: () => {
        navigate('/printer-management');
        handleClose();
      },
      description: 'Configure receipt and kitchen printers'
    },
    {
      id: 'view-all-orders',
      label: '📊 View All Orders',
      icon: <BarChart3 className="h-6 w-6" />,
      action: () => {
        // This will trigger the existing modal from ManagementHeader
        document.dispatchEvent(new CustomEvent('open-all-orders'));
        handleClose();
      },
      description: 'View comprehensive order history and analytics'
    },
    {
      id: 'reconciliation',
      label: '💰 Reconciliation',
      icon: <DollarSign className="h-6 w-6" />,
      action: () => {
        navigate('/reconciliation');
        handleClose();
      },
      description: 'Daily sales reports and financial reconciliation'
    }
  ];

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="fixed inset-0 z-[9999] flex items-center justify-center"
        style={{
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          backdropFilter: 'blur(4px)'
        }}
        onClick={handleClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: isClosing ? 0.9 : 1, opacity: isClosing ? 0 : 1 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          className="relative w-full max-w-4xl mx-4"
          onClick={(e) => e.stopPropagation()}
        >
          <Card 
            className="border-0 shadow-2xl"
            style={{
              backgroundColor: designColors.background.primary,
              border: `1px solid ${globalColors.border.light}`
            }}
          >
            <CardContent className="p-8">
              {/* Header */}
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center space-x-3">
                  <div 
                    className="p-2 rounded-lg"
                    style={{
                      background: 'rgba(124, 93, 250, 0.1)',
                      border: '1px solid rgba(124, 93, 250, 0.2)'
                    }}
                  >
                    <Zap className="h-6 w-6" style={{ color: '#7C5DFA' }} />
                  </div>
                  <div>
                    <h2 
                      className="text-2xl font-bold"
                      style={{ color: globalColors.text.primary }}
                    >
                      Quick Tools
                    </h2>
                    <p 
                      className="text-sm"
                      style={{ color: globalColors.text.secondary }}
                    >
                      Access essential staff tools and management features
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleClose}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>

              {/* Tools Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {tools.map((tool) => (
                  <motion.button
                    key={tool.id}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="p-4 rounded-lg text-left transition-all duration-200 group"
                    style={{
                      backgroundColor: 'rgba(255, 255, 255, 0.02)',
                      border: '1px solid rgba(255, 255, 255, 0.06)',
                      ':hover': {
                        backgroundColor: 'rgba(124, 93, 250, 0.1)',
                        borderColor: 'rgba(124, 93, 250, 0.3)'
                      }
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = 'rgba(124, 93, 250, 0.1)';
                      e.currentTarget.style.borderColor = 'rgba(124, 93, 250, 0.3)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.02)';
                      e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.06)';
                    }}
                    onClick={tool.action}
                  >
                    <div className="flex items-start space-x-3">
                      <div 
                        className="p-2 rounded-md group-hover:scale-110 transition-transform duration-200"
                        style={{
                          backgroundColor: 'rgba(124, 93, 250, 0.1)',
                          color: '#7C5DFA'
                        }}
                      >
                        {tool.icon}
                      </div>
                      <div className="flex-1">
                        <h3 
                          className="font-semibold text-sm mb-1 group-hover:text-white transition-colors"
                          style={{ color: globalColors.text.primary }}
                        >
                          {tool.label}
                        </h3>
                        <p 
                          className="text-xs leading-relaxed"
                          style={{ color: globalColors.text.secondary }}
                        >
                          {tool.description}
                        </p>
                      </div>
                    </div>
                  </motion.button>
                ))}
              </div>

              {/* Footer */}
              <div className="mt-8 pt-6 border-t" style={{ borderColor: globalColors.border.light }}>
                <p 
                  className="text-xs text-center"
                  style={{ color: globalColors.text.secondary }}
                >
                  Use these tools to manage your restaurant operations efficiently. Click anywhere outside to close.
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default QuickToolsModal;
