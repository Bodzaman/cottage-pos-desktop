/**
 * CallerIdPanel Component
 * Displays incoming call information in the POS header
 * Replaces the search bar when an active call is detected
 */

import React from 'react';
import { motion } from 'framer-motion';
import { Phone, PhoneOff, User, UserPlus, X, ShoppingCart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  CallerIdEvent,
  formatPhoneDisplay,
  getCallerDisplayName
} from 'utils/callerIdStore';
import { globalColors } from 'utils/QSAIDesign';

// ============================================================================
// TYPES
// ============================================================================

interface CallerIdPanelProps {
  event: CallerIdEvent;
  onStartOrder: () => void;
  onDismiss: () => void;
}

// ============================================================================
// HELPERS
// ============================================================================

type CallerType = 'known' | 'unknown' | 'blocked';

function getCallerType(event: CallerIdEvent): CallerType {
  if (!event.phone_raw || event.phone_raw.toLowerCase() === 'withheld') {
    return 'blocked';
  }
  if (event.customer_id) {
    return 'known';
  }
  return 'unknown';
}

function getAccentColor(callerType: CallerType): string {
  switch (callerType) {
    case 'known':
      return '#10B981'; // Green for known customers
    case 'unknown':
      return '#F59E0B'; // Amber for unknown callers
    case 'blocked':
      return '#EF4444'; // Red for blocked/withheld
  }
}

function getStatusBadge(callerType: CallerType): { text: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' } {
  switch (callerType) {
    case 'known':
      return { text: 'Returning Customer', variant: 'default' };
    case 'unknown':
      return { text: 'New Caller', variant: 'secondary' };
    case 'blocked':
      return { text: 'Number Withheld', variant: 'destructive' };
  }
}

// ============================================================================
// COMPONENT
// ============================================================================

export function CallerIdPanel({ event, onStartOrder, onDismiss }: CallerIdPanelProps) {
  const callerType = getCallerType(event);
  const accentColor = getAccentColor(callerType);
  const statusBadge = getStatusBadge(callerType);
  const displayName = getCallerDisplayName(event);
  const phoneDisplay = formatPhoneDisplay(event);

  const isBlocked = callerType === 'blocked';

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95, y: -10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95, y: -10 }}
      transition={{ type: 'spring', damping: 25, stiffness: 300 }}
      className="flex-1 max-w-2xl mx-4 sm:mx-8"
    >
      <div
        className="relative rounded-xl overflow-hidden"
        style={{
          background: 'rgba(15, 15, 15, 0.95)',
          border: `2px solid ${accentColor}`,
          boxShadow: `0 0 20px ${accentColor}40, 0 4px 20px rgba(0, 0, 0, 0.5)`
        }}
      >
        {/* Pulse animation for incoming calls */}
        <motion.div
          className="absolute inset-0 rounded-xl pointer-events-none"
          animate={{
            boxShadow: [
              `inset 0 0 0 0 ${accentColor}00`,
              `inset 0 0 30px 0 ${accentColor}20`,
              `inset 0 0 0 0 ${accentColor}00`
            ]
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: 'easeInOut'
          }}
        />

        <div className="relative flex items-center gap-4 px-4 py-3">
          {/* Phone Icon with Accent */}
          <div
            className="flex-shrink-0 p-3 rounded-lg"
            style={{
              background: `${accentColor}20`,
              border: `1px solid ${accentColor}40`
            }}
          >
            <motion.div
              animate={event.call_status === 'incoming' ? {
                rotate: [0, -10, 10, -10, 10, 0],
              } : {}}
              transition={{
                duration: 0.5,
                repeat: event.call_status === 'incoming' ? Infinity : 0,
                repeatDelay: 1
              }}
            >
              <Phone
                className="h-6 w-6"
                style={{ color: accentColor }}
              />
            </motion.div>
          </div>

          {/* Caller Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span
                className="font-semibold text-lg truncate"
                style={{ color: globalColors.text.primary }}
              >
                {displayName}
              </span>
              {event.customer_reference && (
                <Badge
                  variant="outline"
                  className="text-xs flex-shrink-0"
                  style={{
                    borderColor: accentColor,
                    color: accentColor
                  }}
                >
                  {event.customer_reference}
                </Badge>
              )}
            </div>

            <div className="flex items-center gap-3">
              <span
                className="font-mono text-base"
                style={{ color: globalColors.text.secondary }}
              >
                {phoneDisplay}
              </span>
              <Badge
                variant={statusBadge.variant}
                className="text-xs"
              >
                {statusBadge.text}
              </Badge>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {/* Start Order Button */}
            {!isBlocked && (
              <Button
                onClick={onStartOrder}
                className="gap-2"
                style={{
                  background: accentColor,
                  color: '#FFFFFF'
                }}
              >
                {callerType === 'known' ? (
                  <>
                    <ShoppingCart className="h-4 w-4" />
                    <span className="hidden sm:inline">Start Order</span>
                  </>
                ) : (
                  <>
                    <UserPlus className="h-4 w-4" />
                    <span className="hidden sm:inline">New Customer</span>
                  </>
                )}
              </Button>
            )}

            {/* Dismiss Button */}
            <Button
              variant="ghost"
              size="icon"
              onClick={onDismiss}
              className="hover:bg-white/10"
              style={{ color: globalColors.text.tertiary }}
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Accent border glow */}
        <div
          className="absolute bottom-0 left-0 right-0 h-[2px]"
          style={{
            background: `linear-gradient(90deg, transparent, ${accentColor}, transparent)`
          }}
        />
      </div>
    </motion.div>
  );
}

// ============================================================================
// MISSED CALLS INDICATOR (optional badge for header)
// ============================================================================

interface MissedCallsBadgeProps {
  count: number;
  onClick?: () => void;
}

export function MissedCallsBadge({ count, onClick }: MissedCallsBadgeProps) {
  if (count === 0) return null;

  return (
    <motion.button
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      exit={{ scale: 0 }}
      onClick={onClick}
      className="relative p-2 rounded-lg hover:bg-white/10 transition-colors"
      style={{
        background: 'rgba(239, 68, 68, 0.1)',
        border: '1px solid rgba(239, 68, 68, 0.3)'
      }}
    >
      <PhoneOff className="h-5 w-5 text-red-400" />
      <span
        className="absolute -top-1 -right-1 min-w-[18px] h-[18px] flex items-center justify-center text-xs font-bold rounded-full"
        style={{
          background: '#EF4444',
          color: '#FFFFFF'
        }}
      >
        {count > 9 ? '9+' : count}
      </span>
    </motion.button>
  );
}
