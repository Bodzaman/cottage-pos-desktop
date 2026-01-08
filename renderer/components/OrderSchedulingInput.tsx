



import React, { useState, useEffect } from 'react';
import { Calendar as CalendarIcon, Clock } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { QSAITheme, styles, globalColors } from '../utils/QSAIDesign';

export interface OrderSchedulingInputProps {
  orderType: "DINE-IN" | "COLLECTION" | "DELIVERY" | "WAITING";
  onSchedulingChange: (data: SchedulingData) => void;
  className?: string;
}

export interface SchedulingData {
  // Collection orders
  pickup_time?: string;
  pickup_date?: string;
  
  // Delivery orders
  delivery_time?: string;
  delivery_date?: string;
}

// Generate time options in 15-minute intervals (restaurant hours)
const generateTimeOptions = () => {
  const times: string[] = [];
  // Restaurant hours: 11:00 AM to 11:00 PM
  for (let hour = 11; hour <= 23; hour++) {
    for (let minute = 0; minute < 60; minute += 15) {
      const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
      times.push(timeString);
    }
  }
  return times;
};

const timeOptions = generateTimeOptions();

// Utility functions
const getTodayDate = () => {
  const today = new Date();
  return today.toISOString().split('T')[0];
};

const getCurrentTime = () => {
  const now = new Date();
  const hours = now.getHours();
  const minutes = Math.ceil(now.getMinutes() / 15) * 15; // Round up to next 15-minute interval
  
  // Handle minute overflow
  if (minutes >= 60) {
    return `${(hours + 1).toString().padStart(2, '0')}:00`;
  }
  
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
};

// Helper function to format date for display
const formatDateForDisplay = (dateString: string | undefined) => {
  if (!dateString) return "Select date";
  try {
    const date = new Date(dateString);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    
    // Check if it's today or tomorrow for friendly display
    const dateStr = date.toISOString().split('T')[0];
    const todayStr = today.toISOString().split('T')[0];
    const tomorrowStr = tomorrow.toISOString().split('T')[0];
    
    if (dateStr === todayStr) return "Today";
    if (dateStr === tomorrowStr) return "Tomorrow";
    
    return format(date, 'MMM dd, yyyy');
  } catch {
    return "Select date";
  }
};

// Fallback colors for defensive programming
const fallbackColors = {
  background: {
    primary: '#121212',
    secondary: '#1A1A1A'
  },
  text: {
    primary: '#FFFFFF',
    secondary: '#F0F0F5'
  },
  border: {
    primary: 'rgba(255, 255, 255, 0.12)'
  },
  purple: {
    primary: '#5B21B6',
    light: '#7C3AED'
  },
  success: {
    primary: '#10B981'
  }
};

// Safe color access with fallbacks
const safeColors = globalColors || fallbackColors;

export function OrderSchedulingInput({ orderType, onSchedulingChange, className = "" }: OrderSchedulingInputProps) {
  const [schedulingData, setSchedulingData] = useState<SchedulingData>({
    // Initialize with sensible defaults
    pickup_date: getTodayDate(),
    pickup_time: getCurrentTime(),
    delivery_date: getTodayDate(),
    delivery_time: getCurrentTime()
  });
  
  // Update parent when data changes
  useEffect(() => {
    onSchedulingChange(schedulingData);
  }, [schedulingData, onSchedulingChange]);

  // Handle date change (generic for both collection and delivery)
  const handleDateChange = (date: Date, type: 'pickup' | 'delivery') => {
    const dateString = date.toISOString().split('T')[0];
    setSchedulingData(prev => ({
      ...prev,
      [`${type}_date`]: dateString
    }));
  };

  // Handle time change (generic for both collection and delivery)
  const handleTimeChange = (time: string, type: 'pickup' | 'delivery') => {
    setSchedulingData(prev => ({
      ...prev,
      [`${type}_time`]: time
    }));
  };

  // Don't render for DINE-IN or WAITING orders
  if (orderType === "DINE-IN" || orderType === "WAITING") {
    return null;
  }

  // Determine which data to use based on order type
  const isCollection = orderType === "COLLECTION";
  const currentDate = isCollection ? schedulingData.pickup_date : schedulingData.delivery_date;
  const currentTime = isCollection ? schedulingData.pickup_time : schedulingData.delivery_time;
  const type = isCollection ? 'pickup' : 'delivery';
  const label = isCollection ? 'Collection' : 'Delivery';

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Side-by-side layout on desktop, stacked on mobile */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {/* Date Picker - Left side on desktop */}
        <div className="space-y-2">
          <div className="text-sm font-medium mb-1" style={{
            color: safeColors.text?.secondary || '#F0F0F5'
          }}>
            {label} Date
          </div>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="w-full h-11 text-base font-medium justify-start text-left transition-all duration-200 border-b"
                style={{
                  fontSize: '0.95rem',
                  fontWeight: 500,
                  background: safeColors.background?.secondary || '#1A1A1A',
                  border: `1px solid ${safeColors.border?.primary || 'rgba(255, 255, 255, 0.12)'}`,
                  color: safeColors.text?.primary || '#FFFFFF',
                  borderBottomColor: `${safeColors.purple?.primary || '#5B21B6'}30`
                }}
              >
                <CalendarIcon className="mr-2 h-4 w-4" style={{
                  color: safeColors.purple?.primary || '#5B21B6'
                }} />
                <span style={{ color: safeColors.text?.primary || '#FFFFFF' }}>
                  {formatDateForDisplay(currentDate)}
                </span>
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start" style={{
              background: safeColors.background?.primary || '#121212',
              border: `1px solid ${safeColors.border?.primary || 'rgba(255, 255, 255, 0.12)'}`,
              borderRadius: '8px'
            }}>
              <CalendarComponent
                mode="single"
                selected={currentDate ? new Date(currentDate) : undefined}
                onSelect={(date) => {
                  if (date) {
                    handleDateChange(date, type);
                  }
                }}
                disabled={(date) => {
                  // Disable past dates
                  const today = new Date();
                  today.setHours(0, 0, 0, 0);
                  return date < today;
                }}
                initialFocus
                className="rounded-md"
                style={{
                  background: safeColors.background?.primary || '#121212',
                  color: safeColors.text?.primary || '#FFFFFF'
                }}
              />
            </PopoverContent>
          </Popover>
        </div>
        
        {/* Time Selector - Right side on desktop */}
        <div className="space-y-2">
          <div className="text-sm font-medium mb-1" style={{
            color: safeColors.text?.secondary || '#F0F0F5'
          }}>
            {label} Time
          </div>
          <Select
            value={currentTime || ""}
            onValueChange={(value) => handleTimeChange(value, type)}
          >
            <SelectTrigger 
              className="h-11 text-base font-medium transition-all duration-200"
              style={{ 
                ...styles,
                fontSize: '0.95rem',
                fontWeight: 500,
                background: safeColors.background?.secondary || '#1A1A1A',
                border: `1px solid ${safeColors.border?.primary || 'rgba(255, 255, 255, 0.12)'}`,
                color: safeColors.text?.primary || '#FFFFFF',
                borderBottom: `1px solid ${safeColors.purple?.primary || '#5B21B6'}30`
              }}
            >
              <div className="flex items-center">
                <Clock className="mr-2 h-4 w-4" style={{
                  color: safeColors.purple?.primary || '#5B21B6'
                }} />
                <SelectValue 
                  placeholder={`${label} Time`}
                >
                  {currentTime ? (
                    <span style={{ color: safeColors.text?.primary || '#FFFFFF' }}>{currentTime}</span>
                  ) : (
                    <span style={{ color: safeColors.text?.secondary || '#F0F0F5' }}>{label} Time</span>
                  )}
                </SelectValue>
              </div>
            </SelectTrigger>
            <SelectContent className="max-h-60" style={{
              background: safeColors.background?.primary || '#121212',
              border: `1px solid ${safeColors.border?.primary || 'rgba(255, 255, 255, 0.12)'}`
            }}>
              {timeOptions.map(time => (
                <SelectItem 
                  key={time} 
                  value={time} 
                  className="text-base py-2 transition-colors duration-200"
                  style={{
                    color: safeColors.text?.primary || '#FFFFFF',
                    backgroundColor: 'transparent'
                  }}
                >
                  {time}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      
      {/* Quick validation hint with QSAI styling */}
      {currentDate && currentTime && (
        <div className="px-3 py-2 rounded-lg" style={{
          background: `linear-gradient(135deg, ${safeColors.purple?.primary || '#5B21B6'}15 0%, ${safeColors.purple?.primary || '#5B21B6'}05 100%)`,
          border: `1px solid ${safeColors.purple?.primary || '#5B21B6'}30`,
          boxShadow: `0 2px 8px ${safeColors.purple?.primary || '#5B21B6'}20`
        }}>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full animate-pulse" style={{
              backgroundColor: safeColors.success?.primary || '#10B981'
            }}></div>
            <span className="text-xs font-medium" style={{
              color: safeColors.purple?.light || '#7C3AED'
            }}>
              {label} scheduled for {formatDateForDisplay(currentDate)} at {currentTime}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
