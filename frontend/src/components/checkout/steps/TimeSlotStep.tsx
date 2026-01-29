/**
 * TimeSlotStep - Time selection for delivery/collection
 *
 * Features:
 * - ASAP option with estimated time
 * - Schedule for later with date/time picker
 * - Available time slots based on restaurant hours
 * - Visual time slot cards
 */

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, Zap, Calendar, ChevronLeft, ChevronRight, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCheckout } from '../CheckoutProvider';
import { cn } from 'utils/cn';

interface TimeSlotStepProps {
  className?: string;
}

const fieldVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.3 },
  }),
};

// Generate time slots for a day
const generateTimeSlots = (date: Date): string[] => {
  const slots: string[] = [];
  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();

  // Restaurant hours (simplified)
  const openHour = 17; // 5 PM
  const closeHour = 23; // 11 PM

  // Start from next available slot
  let startHour = openHour;
  if (isToday) {
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    // Add 45 min minimum prep time
    const minTime = currentHour + (currentMinute > 15 ? 1 : 0);
    startHour = Math.max(openHour, minTime);
  }

  // Generate 30-minute slots
  for (let hour = startHour; hour < closeHour; hour++) {
    slots.push(`${hour.toString().padStart(2, '0')}:00`);
    if (hour < closeHour - 1) {
      slots.push(`${hour.toString().padStart(2, '0')}:30`);
    }
  }

  return slots;
};

// Generate next 7 days
const generateDates = (): Date[] => {
  const dates: Date[] = [];
  const today = new Date();

  for (let i = 0; i < 7; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() + i);
    dates.push(date);
  }

  return dates;
};

// Format date for display
const formatDateLabel = (date: Date): string => {
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);

  if (date.toDateString() === today.toDateString()) {
    return 'Today';
  }
  if (date.toDateString() === tomorrow.toDateString()) {
    return 'Tomorrow';
  }

  return date.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });
};

export function TimeSlotStep({ className }: TimeSlotStepProps) {
  const { selectedTime, selectedDate, setSelectedTime, orderMode } = useCheckout();

  const [scheduleMode, setScheduleMode] = useState<'asap' | 'scheduled'>(
    selectedTime === 'ASAP' ? 'asap' : 'scheduled'
  );
  const [selectedDateIndex, setSelectedDateIndex] = useState(0);

  const dates = useMemo(() => generateDates(), []);
  const timeSlots = useMemo(
    () => generateTimeSlots(dates[selectedDateIndex]),
    [selectedDateIndex, dates]
  );

  const estimatedTime = orderMode === 'delivery' ? '30-45 minutes' : '15-20 minutes';

  const handleASAP = () => {
    setScheduleMode('asap');
    setSelectedTime('ASAP');
  };

  const handleScheduled = () => {
    setScheduleMode('scheduled');
    if (timeSlots.length > 0) {
      const dateStr = dates[selectedDateIndex].toISOString().split('T')[0];
      setSelectedTime(timeSlots[0], dateStr);
    }
  };

  const handleTimeSelect = (time: string) => {
    const dateStr = dates[selectedDateIndex].toISOString().split('T')[0];
    setSelectedTime(time, dateStr);
  };

  const handleDateChange = (direction: 'prev' | 'next') => {
    const newIndex = direction === 'prev'
      ? Math.max(0, selectedDateIndex - 1)
      : Math.min(dates.length - 1, selectedDateIndex + 1);
    setSelectedDateIndex(newIndex);
  };

  return (
    <motion.div
      className={cn(
        'rounded-2xl p-5 md:p-6 backdrop-blur-xl border',
        className
      )}
      style={{
        background: 'rgba(23, 25, 29, 0.8)',
        borderColor: 'rgba(255, 255, 255, 0.1)',
      }}
      initial="hidden"
      animate="visible"
    >
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-[#8B1538]/20 flex items-center justify-center">
          <Clock className="w-5 h-5 text-[#8B1538]" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-[#EAECEF]">
            {orderMode === 'delivery' ? 'Delivery' : 'Collection'} Time
          </h2>
          <p className="text-sm text-[#B7BDC6]">When would you like your order?</p>
        </div>
      </div>

      {/* ASAP vs Scheduled toggle */}
      <motion.div custom={0} variants={fieldVariants} className="grid grid-cols-2 gap-3 mb-6">
        {/* ASAP option */}
        <button
          onClick={handleASAP}
          className={cn(
            'relative p-4 rounded-xl border transition-all duration-300',
            scheduleMode === 'asap'
              ? 'bg-[#8B1538]/20 border-[#8B1538]'
              : 'bg-white/5 border-white/10 hover:border-white/20'
          )}
        >
          {scheduleMode === 'asap' && (
            <motion.div
              layoutId="time-selection"
              className="absolute inset-0 rounded-xl bg-[#8B1538]/20 border border-[#8B1538]"
              transition={{ duration: 0.2 }}
            />
          )}
          <div className="relative flex flex-col items-center gap-2">
            <Zap
              className={cn(
                'w-6 h-6',
                scheduleMode === 'asap' ? 'text-[#8B1538]' : 'text-[#B7BDC6]'
              )}
            />
            <span
              className={cn(
                'text-sm font-semibold',
                scheduleMode === 'asap' ? 'text-[#EAECEF]' : 'text-[#B7BDC6]'
              )}
            >
              ASAP
            </span>
            <span
              className={cn(
                'text-xs',
                scheduleMode === 'asap' ? 'text-[#B7BDC6]' : 'text-[#B7BDC6]/70'
              )}
            >
              {estimatedTime}
            </span>
          </div>
          {scheduleMode === 'asap' && (
            <div className="absolute top-2 right-2">
              <Check className="w-4 h-4 text-[#8B1538]" />
            </div>
          )}
        </button>

        {/* Schedule option */}
        <button
          onClick={handleScheduled}
          className={cn(
            'relative p-4 rounded-xl border transition-all duration-300',
            scheduleMode === 'scheduled'
              ? 'bg-[#8B1538]/20 border-[#8B1538]'
              : 'bg-white/5 border-white/10 hover:border-white/20'
          )}
        >
          {scheduleMode === 'scheduled' && (
            <motion.div
              layoutId="time-selection"
              className="absolute inset-0 rounded-xl bg-[#8B1538]/20 border border-[#8B1538]"
              transition={{ duration: 0.2 }}
            />
          )}
          <div className="relative flex flex-col items-center gap-2">
            <Calendar
              className={cn(
                'w-6 h-6',
                scheduleMode === 'scheduled' ? 'text-[#8B1538]' : 'text-[#B7BDC6]'
              )}
            />
            <span
              className={cn(
                'text-sm font-semibold',
                scheduleMode === 'scheduled' ? 'text-[#EAECEF]' : 'text-[#B7BDC6]'
              )}
            >
              Schedule
            </span>
            <span
              className={cn(
                'text-xs',
                scheduleMode === 'scheduled' ? 'text-[#B7BDC6]' : 'text-[#B7BDC6]/70'
              )}
            >
              Pick a time
            </span>
          </div>
          {scheduleMode === 'scheduled' && (
            <div className="absolute top-2 right-2">
              <Check className="w-4 h-4 text-[#8B1538]" />
            </div>
          )}
        </button>
      </motion.div>

      {/* Scheduled time picker */}
      <AnimatePresence>
        {scheduleMode === 'scheduled' && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
          >
            {/* Date selector */}
            <motion.div custom={1} variants={fieldVariants} className="mb-4">
              <div className="flex items-center justify-between mb-3">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleDateChange('prev')}
                  disabled={selectedDateIndex === 0}
                  className="text-[#B7BDC6] hover:text-[#EAECEF] hover:bg-white/10 disabled:opacity-30"
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>

                <span className="text-sm font-medium text-[#EAECEF]">
                  {formatDateLabel(dates[selectedDateIndex])}
                </span>

                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleDateChange('next')}
                  disabled={selectedDateIndex === dates.length - 1}
                  className="text-[#B7BDC6] hover:text-[#EAECEF] hover:bg-white/10 disabled:opacity-30"
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>

              {/* Date pills */}
              <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                {dates.map((date, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedDateIndex(index)}
                    className={cn(
                      'flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200',
                      selectedDateIndex === index
                        ? 'bg-[#8B1538] text-white'
                        : 'bg-white/5 text-[#B7BDC6] hover:bg-white/10'
                    )}
                  >
                    {formatDateLabel(date)}
                  </button>
                ))}
              </div>
            </motion.div>

            {/* Time slots grid */}
            <motion.div custom={2} variants={fieldVariants}>
              <p className="text-sm text-[#B7BDC6] mb-3">Available times</p>

              {timeSlots.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-sm text-[#B7BDC6]">
                    No available slots for this date
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 max-h-48 overflow-y-auto custom-scrollbar">
                  {timeSlots.map((time) => {
                    const isSelected =
                      selectedTime === time &&
                      selectedDate === dates[selectedDateIndex].toISOString().split('T')[0];

                    return (
                      <button
                        key={time}
                        onClick={() => handleTimeSelect(time)}
                        className={cn(
                          'px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200',
                          isSelected
                            ? 'bg-[#8B1538] text-white'
                            : 'bg-white/5 text-[#EAECEF] hover:bg-white/10 border border-white/10'
                        )}
                      >
                        {time}
                      </button>
                    );
                  })}
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Selected time confirmation */}
      <motion.div
        custom={3}
        variants={fieldVariants}
        className="mt-4 p-3 rounded-xl bg-[#8B1538]/10 border border-[#8B1538]/30"
      >
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-[#8B1538]" />
          <p className="text-sm text-[#EAECEF]">
            {scheduleMode === 'asap' ? (
              <>
                Your order will be ready in <span className="font-semibold">{estimatedTime}</span>
              </>
            ) : (
              <>
                Scheduled for{' '}
                <span className="font-semibold">
                  {formatDateLabel(dates[selectedDateIndex])} at {selectedTime}
                </span>
              </>
            )}
          </p>
        </div>
      </motion.div>
    </motion.div>
  );
}

export default TimeSlotStep;
