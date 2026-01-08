

import React from 'react';
import { format, isToday, parseISO, startOfToday, endOfToday, startOfTomorrow, endOfTomorrow, addDays, isSameDay, isWithinInterval, startOfWeek, endOfWeek, eachDayOfInterval, startOfMonth, endOfMonth, getHours, getMinutes, addWeeks, addMonths, getDay, formatISO } from 'date-fns';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Users, MapPin, Clock } from 'lucide-react';
// TEMPORARILY COMMENTED OUT TO FIX COLORS ERROR
// import { colors, cardStyle } from '../utils/designSystem';

// Interface for reservation types
interface Reservation {
  id: string;
  user_id: string | null;
  first_name: string;
  last_name: string;
  email: string;
  phone: string | null;
  party_size: number;
  reservation_date: string; // ISO date format
  reservation_time: string; // HH:MM format
  special_requests: string | null;
  table_id: string | null;
  status_id: number;
  created_at: string; // ISO datetime format
  updated_at: string; // ISO datetime format
  status?: {
    id: number;
    name: string;
    description: string;
    color: string;
  } | null;
}

interface Table {
  id: string;
  table_number: string;
  capacity: number;
  x: number;
  y: number;
  width: number;
  height: number;
  shape: string;
  section: string;
}

interface DayViewProps {
  date: Date;
  reservations: Reservation[];
  tables: Table[];
  onReservationClick: (reservation: Reservation) => void;
}

export const DayCalendarView = ({ date, reservations, tables, onReservationClick }: DayViewProps) => {
  // Business hours (10AM to 11PM)
  const timeSlots = Array.from({ length: 14 }, (_, i) => i + 10);
  
  // Get all reservations for the selected date
  const dayReservations = reservations.filter(r => {
    const reservationDate = parseISO(r.reservation_date);
    return isSameDay(reservationDate, date);
  });
  
  // Group reservations by hour
  const reservationsByHour: Record<number, Reservation[]> = {};
  dayReservations.forEach(reservation => {
    const [hours] = reservation.reservation_time.split(':').map(Number);
    if (!reservationsByHour[hours]) {
      reservationsByHour[hours] = [];
    }
    reservationsByHour[hours].push(reservation);
  });
  
  return (
    <div className="p-4">
      <div className="text-center py-2 mb-4" style={{ color: '#FFFFFF' }}>
        <h3 className="text-lg font-medium">{format(date, 'EEEE, MMMM d, yyyy')}</h3>
      </div>
      
      <div className="space-y-1">
        {timeSlots.map(hour => {
          const reservationsAtHour = reservationsByHour[hour] || [];
          const displayHour = hour > 12 ? hour - 12 : hour;
          const amPm = hour >= 12 ? 'PM' : 'AM';
          
          return (
            <div key={hour} className="flex">
              <div 
                className="w-[80px] py-2 px-3 text-right flex-shrink-0" 
                style={{ color: '#BBC3E1' }}
              >
                {`${displayHour}:00 ${amPm}`}
              </div>
              
              <div 
                className="flex-1 border-l min-h-[60px] py-1 px-2"
                style={{ borderColor: 'rgba(255, 255, 255, 0.07)' }}
              >
                {reservationsAtHour.length > 0 ? (
                  <div className="space-y-1">
                    {reservationsAtHour.map(reservation => {
                      const statusColor = reservation.status?.color || '#7C5DFA';
                      
                      return (
                        <div 
                          key={reservation.id}
                          className="rounded-md p-2 cursor-pointer transition-colors"
                          style={{ 
                            backgroundColor: 'rgba(30, 30, 45, 0.5)',
                            borderLeft: `3px solid ${statusColor}`
                          }}
                          onClick={() => onReservationClick(reservation)}
                        >
                          <div className="flex justify-between items-start">
                            <div>
                              <div className="font-medium text-sm" style={{ color: '#FFFFFF' }}>
                                {reservation.first_name} {reservation.last_name}
                              </div>
                              <div className="text-xs flex items-center space-x-3" style={{ color: '#BBC3E1' }}>
                                <span>
                                  <Users className="inline h-3 w-3 mr-1" />
                                  {reservation.party_size}
                                </span>
                                <span>
                                  {reservation.table_id ? (
                                    <span>
                                      <MapPin className="inline h-3 w-3 mr-1" />
                                      Table {tables.find(t => t.id === reservation.table_id)?.table_number || 'Unknown'}
                                    </span>
                                  ) : 'No table'}
                                </span>
                              </div>
                            </div>
                            <Badge variant="outline" style={{ 
                              backgroundColor: `${statusColor}30`, 
                              color: statusColor,
                              borderColor: statusColor
                            }}>
                              {reservation.status?.name || 'Unknown'}
                            </Badge>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div 
                    className="h-full w-full rounded-md flex items-center justify-center text-xs"
                    style={{ color: '#BBC3E1' }}
                  >
                    No reservations
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export const WeekCalendarView = ({ date, reservations, tables, onReservationClick }: DayViewProps) => {
  // Get start and end of week (Monday to Sunday)
  const weekStart = startOfWeek(date, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(date, { weekStartsOn: 1 });
  
  // Generate array of days for the week
  const days = eachDayOfInterval({ start: weekStart, end: weekEnd });
  
  // Business hours (10AM - 11PM)
  const hours = Array.from({ length: 14 }, (_, i) => i + 10);
  
  return (
    <div className="p-2 overflow-x-auto" style={{ minWidth: '750px' }}>
      <div className="grid grid-cols-8 gap-1">
        {/* Time column */}
        <div className="sticky left-0 z-10" style={{ backgroundColor: '#1C1C24' }}>
          <div className="h-12"></div> {/* Empty corner cell */}
          {hours.map(hour => {
            const displayHour = hour > 12 ? hour - 12 : hour;
            const amPm = hour >= 12 ? 'PM' : 'AM';
            
            return (
              <div 
                key={hour} 
                className="h-20 flex items-start justify-end pr-2 pt-1"
                style={{ color: '#BBC3E1' }}
              >
                <span className="text-xs">{`${displayHour} ${amPm}`}</span>
              </div>
            );
          })}
        </div>
        
        {/* Day columns */}
        {days.map((day, dayIndex) => {
          // Get all reservations for this day
          const dayReservations = reservations.filter(r => {
            const reservationDate = parseISO(r.reservation_date);
            return isSameDay(reservationDate, day);
          });
          
          return (
            <div key={dayIndex} className="flex flex-col">
              {/* Day header */}
              <div 
                className={`h-12 flex flex-col items-center justify-center text-center ${isToday(day) ? 'rounded-md' : ''}`}
                style={{ 
                  backgroundColor: isToday(day) ? '#7C5DFA' : 'transparent',
                  color: isToday(day) ? 'white' : '#FFFFFF',
                }}
              >
                <div className="text-xs font-medium">{format(day, 'EEE')}</div>
                <div className="text-lg">{format(day, 'd')}</div>
              </div>
              
              {/* Hour cells */}
              {hours.map(hour => {
                // Get reservations for this specific hour
                const hourReservations = dayReservations.filter(r => {
                  const [hours] = r.reservation_time.split(':').map(Number);
                  return hours === hour;
                });
                
                return (
                  <div 
                    key={hour} 
                    className="h-20 border border-gray-800 p-1 relative"
                    style={{ borderColor: 'rgba(255, 255, 255, 0.07)' }}
                  >
                    {hourReservations.length > 0 ? (
                      <div className="absolute inset-1 overflow-y-auto">
                        <div className="space-y-1">
                          {hourReservations.map((reservation) => {
                            const statusColor = reservation.status?.color || '#7C5DFA';
                            const [hours, minutes] = reservation.reservation_time.split(':');
                            const time = `${parseInt(hours) > 12 ? parseInt(hours) - 12 : hours}:${minutes} ${parseInt(hours) >= 12 ? 'PM' : 'AM'}`;
                            
                            return (
                              <div
                                key={reservation.id}
                                onClick={() => onReservationClick(reservation)}
                                className="text-xs p-1 rounded cursor-pointer"
                                style={{ 
                                  backgroundColor: 'rgba(30, 30, 45, 0.7)', 
                                  borderLeft: `2px solid ${statusColor}`
                                }}
                              >
                                <div className="font-medium truncate" style={{ color: '#FFFFFF' }}>
                                  {time} - {reservation.first_name} {reservation.last_name.charAt(0)}.
                                </div>
                                <div className="flex items-center space-x-1" style={{ color: '#BBC3E1' }}>
                                  <span><Users className="inline h-2 w-2 mr-1" />{reservation.party_size}</span>
                                  {reservation.table_id && (
                                    <span><MapPin className="inline h-2 w-2 mr-1" />T{tables.find(t => t.id === reservation.table_id)?.table_number || '?'}</span>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export const MonthCalendarView = ({ date, reservations, tables, onReservationClick }: DayViewProps) => {
  // Get start and end of month
  const monthStart = startOfMonth(date);
  const monthEnd = endOfMonth(date);
  
  // Include days from previous and next months to fill the calendar grid
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
  
  // Generate array of days
  const calendarDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd });
  
  // Group days into weeks
  const weeks: Date[][] = [];
  let currentWeek: Date[] = [];
  
  calendarDays.forEach((day) => {
    currentWeek.push(day);
    if (currentWeek.length === 7) {
      weeks.push(currentWeek);
      currentWeek = [];
    }
  });
  
  // Group reservations by date
  const reservationsByDate: Record<string, Reservation[]> = {};
  
  reservations.forEach((reservation) => {
    const dateKey = reservation.reservation_date;
    if (!reservationsByDate[dateKey]) {
      reservationsByDate[dateKey] = [];
    }
    reservationsByDate[dateKey].push(reservation);
  });
  
  return (
    <div className="p-4">
      <div className="text-center py-2 mb-4" style={{ color: '#FFFFFF' }}>
        <h3 className="text-lg font-medium">{format(date, 'MMMM yyyy')}</h3>
      </div>
      
      <div className="grid grid-cols-7 gap-1">
        {/* Weekday headers */}
        {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, index) => (
          <div 
            key={index} 
            className="text-center py-2 text-sm font-medium" 
            style={{ color: '#BBC3E1' }}
          >
            {day}
          </div>
        ))}
        
        {/* Calendar days */}
        {weeks.flatMap((week, weekIndex) => 
          week.map((day, dayIndex) => {
            const dateKey = formatISO(day, { representation: 'date' });
            const dayReservations = reservationsByDate[dateKey] || [];
            const isCurrentMonth = day.getMonth() === date.getMonth();
            
            return (
              <div 
                key={`${weekIndex}-${dayIndex}`} 
                className={`min-h-[100px] border p-1 ${isToday(day) ? 'rounded' : ''}`}
                style={{ 
                  backgroundColor: isToday(day) ? 'rgba(124, 93, 250, 0.1)' : 'transparent',
                  borderColor: isToday(day) ? '#7C5DFA' : 'rgba(255, 255, 255, 0.07)',
                  opacity: isCurrentMonth ? 1 : 0.5
                }}
              >
                <div className="flex justify-between items-center mb-1">
                  <span 
                    className={`text-sm font-medium ${isToday(day) ? 'bg-brand-purple text-white rounded-full w-6 h-6 flex items-center justify-center' : ''}`}
                    style={{ color: isToday(day) ? 'white' : '#FFFFFF' }}
                  >
                    {format(day, 'd')}
                  </span>
                  {dayReservations.length > 0 && (
                    <Badge 
                      variant="outline" 
                      className="text-xs"
                      style={{ backgroundColor: '#7C5DFA', color: 'white' }}
                    >
                      {dayReservations.length}
                    </Badge>
                  )}
                </div>
                
                <div className="space-y-1 overflow-y-auto" style={{ maxHeight: '70px' }}>
                  {dayReservations.slice(0, 3).map((reservation) => {
                    const statusColor = reservation.status?.color || '#7C5DFA';
                    const [hours, minutes] = reservation.reservation_time.split(':');
                    const time = `${parseInt(hours) > 12 ? parseInt(hours) - 12 : hours}:${minutes}`;
                    
                    return (
                      <div 
                        key={reservation.id}
                        onClick={() => onReservationClick(reservation)}
                        className="text-xs p-1 rounded cursor-pointer truncate"
                        style={{ 
                          backgroundColor: 'rgba(30, 30, 45, 0.7)',
                          borderLeft: `2px solid ${statusColor}`
                        }}
                      >
                        <div style={{ color: '#FFFFFF' }}>
                          {time} - {reservation.party_size}p
                        </div>
                      </div>
                    );
                  })}
                  
                  {dayReservations.length > 3 && (
                    <div 
                      className="text-xs text-center py-1"
                      style={{ color: '#BBC3E1' }}
                    >
                      +{dayReservations.length - 3} more
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
