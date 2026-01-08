import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { DeliveryMethod } from '../pages/Checkout';
import { format, addDays, isBefore, isAfter, isSameDay, setHours, setMinutes, parse } from 'date-fns';
import { Calendar as CalendarIcon, Clock, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface Props {
  selectedTimeSlot: {
    date: string;
    time: string;
  };
  deliveryMethod: DeliveryMethod;
  onChange: (timeSlot: { date: string; time: string }) => void;
}

// Generate available time slots based on the current time and delivery method
const generateTimeSlots = (selectedDate: Date, deliveryMethod: DeliveryMethod): string[] => {
  const now = new Date();
  const isToday = isSameDay(selectedDate, now);
  
  // Restaurant opening hours
  const openingHour = 11; // 11:00 AM
  const closingHour = 22; // 10:00 PM
  
  // For delivery or pickup, we need at least 45 mins preparation time
  const preparationTimeMinutes = deliveryMethod === 'delivery' ? 45 : 30;
  
  // Start from opening hour
  let startHour = openingHour;
  let startMinute = 0;
  
  // If it's today and we're within opening hours, adjust the start time
  if (isToday) {
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    
    // If we're already past opening time
    if (currentHour >= openingHour) {
      // Calculate the next available slot based on preparation time
      const totalCurrentMinutes = (currentHour * 60) + currentMinute;
      const nextAvailableMinutes = totalCurrentMinutes + preparationTimeMinutes;
      
      // Round up to the next 15-minute slot
      const roundedMinutes = Math.ceil(nextAvailableMinutes / 15) * 15;
      
      startHour = Math.floor(roundedMinutes / 60);
      startMinute = roundedMinutes % 60;
      
      // If we're past closing time, there are no time slots available today
      if (startHour >= closingHour) {
        return [];
      }
    }
  }
  
  // Generate time slots every 15 minutes
  const timeSlots: string[] = [];
  for (let hour = startHour; hour < closingHour; hour++) {
    for (let minute = (hour === startHour ? startMinute : 0); minute < 60; minute += 15) {
      // Skip if we're already past this time today
      if (isToday && hour === startHour && minute < startMinute) {
        continue;
      }
      
      // Format the time string
      const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
      timeSlots.push(timeString);
    }
  }
  
  return timeSlots;
};

export function TimeSlotSelection({ selectedTimeSlot, deliveryMethod, onChange }: Props) {
  const [date, setDate] = useState<Date | undefined>(
    selectedTimeSlot.date ? new Date(selectedTimeSlot.date) : new Date()
  );
  const [availableTimeSlots, setAvailableTimeSlots] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  
  // Update available time slots when date or delivery method changes
  useEffect(() => {
    if (date) {
      const slots = generateTimeSlots(date, deliveryMethod);
      setAvailableTimeSlots(slots);
      
      // If the currently selected time is no longer available, clear it
      if (selectedTimeSlot.time && !slots.includes(selectedTimeSlot.time)) {
        onChange({
          date: format(date, 'yyyy-MM-dd'),
          time: ''
        });
      }
      
      // Check if there are any available slots
      if (slots.length === 0) {
        setError('No time slots available for this date. Please select a different date.');
      } else {
        setError(null);
      }
    }
  }, [date, deliveryMethod, selectedTimeSlot.time, onChange]);
  
  // When date changes, update the parent component
  const handleDateChange = (newDate: Date | undefined) => {
    if (newDate) {
      setDate(newDate);
      onChange({
        date: format(newDate, 'yyyy-MM-dd'),
        time: selectedTimeSlot.time
      });
    }
  };
  
  // When time slot changes, update the parent component
  const handleTimeChange = (time: string) => {
    if (date) {
      onChange({
        date: format(date, 'yyyy-MM-dd'),
        time
      });
    }
  };
  
  // Format date for display
  const formattedDate = date ? format(date, 'EEEE, do MMMM yyyy') : '';
  
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-serif font-medium text-tandoor-platinum">
        {deliveryMethod === 'delivery' ? 'Delivery Time' : 'Pickup Time'}
      </h2>
      
      {!selectedTimeSlot.time && (
        <Alert className="bg-gray-800/40 border-tandoor-orange/30 mb-4">
          <Clock className="h-4 w-4 text-tandoor-orange" />
          <AlertDescription className="text-sm text-tandoor-offwhite">
            {deliveryMethod === 'delivery' 
              ? 'Please select when you would like your order to be delivered.'
              : 'Please select when you would like to pick up your order.'}
          </AlertDescription>
        </Alert>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Calendar for date selection */}
        <div>
          <h3 className="text-lg font-medium text-tandoor-platinum mb-4">Select Date</h3>
          <div className="bg-gray-800/40 rounded-lg border border-tandoor-platinum/20 p-4">
            <div className="flex items-center mb-4">
              <CalendarIcon className="mr-2 h-4 w-4 text-tandoor-orange" />
              <p className="text-sm text-tandoor-offwhite">
                {deliveryMethod === 'delivery'
                  ? 'We deliver every day from 11:00 AM to 10:00 PM'
                  : 'You can pick up every day from 11:00 AM to 10:00 PM'}
              </p>
            </div>
            <Calendar
              mode="single"
              selected={date}
              onSelect={handleDateChange}
              disabled={(date) => {
                // Disable dates in the past
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                // Allow booking up to 2 weeks in advance
                const maxDate = addDays(today, 14);
                return isBefore(date, today) || isAfter(date, maxDate);
              }}
              className="text-tandoor-platinum"
            />
          </div>
        </div>
        
        {/* Time slots */}
        <div>
          <h3 className="text-lg font-medium text-tandoor-platinum mb-4">Select Time - {formattedDate}</h3>
          {error ? (
            <div className="bg-gray-800/40 rounded-lg border border-red-500/30 p-6 text-center">
              <AlertCircle className="h-5 w-5 text-red-400 mx-auto mb-2" />
              <p className="text-tandoor-offwhite">{error}</p>
              <p className="text-sm text-tandoor-offwhite mt-2">Please select a different date.</p>
            </div>
          ) : availableTimeSlots.length > 0 ? (
            <div className="bg-gray-800/40 rounded-lg border border-tandoor-platinum/20 p-4">
              <RadioGroup 
                value={selectedTimeSlot.time} 
                onValueChange={handleTimeChange}
                className="grid grid-cols-3 sm:grid-cols-4 gap-2"
              >
                {availableTimeSlots.map((time) => {
                  const displayTime = format(
                    parse(time, 'HH:mm', new Date()),
                    'h:mm a'
                  );
                  
                  return (
                    <div key={time} className="relative">
                      <RadioGroupItem 
                        value={time} 
                        id={`time-${time}`} 
                        className="sr-only"
                      />
                      <Label 
                        htmlFor={`time-${time}`}
                        className={`flex items-center justify-center p-2 text-sm rounded-md border cursor-pointer text-center transition-colors
                          ${selectedTimeSlot.time === time 
                            ? 'bg-gray-800 border-tandoor-orange text-tandoor-orange shadow-sm' 
                            : 'bg-gray-800/30 border-tandoor-platinum/20 text-tandoor-offwhite hover:bg-gray-800/60 hover:border-tandoor-platinum/40'}`}
                      >
                        {displayTime}
                      </Label>
                    </div>
                  );
                })}
              </RadioGroup>
              
              {!selectedTimeSlot.time && (
                <p className="text-xs text-red-400 mt-4 text-center">Please select a time slot</p>
              )}
            </div>
          ) : (
            <div className="bg-gray-800/40 rounded-lg border border-tandoor-platinum/20 p-6 text-center">
              <p className="text-tandoor-offwhite">
                No time slots available for this date. Please select a different date.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
