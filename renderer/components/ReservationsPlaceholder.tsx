import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, Users, ArrowLeft } from 'lucide-react';
import { colors as designColors } from '../utils/designSystem';

interface Props {
  onBack?: () => void;
}

/**
 * Simple reservations placeholder component
 * Prevents app crashes while reservations system is being developed
 */
export function ReservationsPlaceholder({ onBack }: Props) {
  return (
    <div className="h-full p-6 overflow-auto" style={{ backgroundColor: designColors.background.primary }}>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Calendar className="h-8 w-8" style={{ color: designColors.brand.purple }} />
            <h1 className="text-2xl font-bold" style={{ color: designColors.text.primary }}>
              Reservations Management
            </h1>
          </div>
          {onBack && (
            <Button 
              variant="outline" 
              onClick={onBack}
              className="flex items-center space-x-2"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Back to POS</span>
            </Button>
          )}
        </div>

        {/* Coming Soon Card */}
        <Card className="border-0 shadow-lg" style={{ backgroundColor: designColors.background.secondary }}>
          <CardHeader>
            <CardTitle className="flex items-center space-x-3" style={{ color: designColors.text.primary }}>
              <Users className="h-6 w-6" style={{ color: designColors.brand.purple }} />
              <span>Reservations System</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p style={{ color: designColors.text.secondary }}>
              The full reservations management system is coming soon! This will include:
            </p>
            
            <ul className="space-y-2" style={{ color: designColors.text.secondary }}>
              <li className="flex items-center space-x-2">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: designColors.brand.purple }} />
                <span>Table booking and management</span>
              </li>
              <li className="flex items-center space-x-2">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: designColors.brand.purple }} />
                <span>Customer reservation history</span>
              </li>
              <li className="flex items-center space-x-2">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: designColors.brand.purple }} />
                <span>AI voice booking integration</span>
              </li>
              <li className="flex items-center space-x-2">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: designColors.brand.purple }} />
                <span>Real-time availability checking</span>
              </li>
            </ul>
            
            <div className="mt-6 p-4 rounded-lg" style={{ backgroundColor: designColors.background.tertiary }}>
              <p className="text-sm" style={{ color: designColors.text.secondary }}>
                💡 <strong>Meanwhile:</strong> Reservations can be taken by phone at 01903 743605 or through the AI voice agent.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default ReservationsPlaceholder;
