
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MapPin, Search, Clock, Sparkles } from "lucide-react";
import { toast } from "sonner";

interface Address {
  line1: string;
  line2?: string;
  city: string;
  county?: string;
  postcode: string;
  place_id?: string;
  latitude?: number;
  longitude?: number;
}

interface Props {
  onAddressSelect: (address: Address) => void;
  accentColor?: string;
}

export const POSAddressLookup: React.FC<Props> = ({ onAddressSelect, accentColor = '#7C5DFA' }) => {
  const [postcode, setPostcode] = useState("");
  
  // Regex for UK postcode validation
  const postcodeRegex = /^[A-Z]{1,2}[0-9][A-Z0-9]? ?[0-9][A-Z]{2}$/i;

  const handlePostcodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPostcode(e.target.value);
  };

  const handleComingSoonClick = () => {
    toast.info("Google Places API postcode lookup coming soon! 🚀");
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && postcode.trim()) {
      handleComingSoonClick();
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="postcode-lookup" className="text-white mb-2 block transition-all duration-300 hover:text-[#E5E5E5]">
          Find Address by Postcode
        </Label>
        <div className="text-xs text-[#BBC3E1] mb-2">
          Enhanced address lookup with Google Places API - Coming Soon!
        </div>

        <div className="flex space-x-2">
          <div className="relative flex-grow group">
            <Input
              id="postcode-lookup"
              value={postcode}
              onChange={handlePostcodeChange}
              onKeyPress={handleKeyPress}
              placeholder="e.g. SW1A 1AA"
              className={`
                transition-all duration-300
                bg-[rgba(21,25,42,0.5)] backdrop-blur-sm 
                border-[rgba(255,255,255,0.07)] 
                hover:border-[rgba(255,255,255,0.12)]
                text-white 
                focus-visible:ring-[${accentColor}] 
                focus-visible:border-[${accentColor}] 
                focus-visible:bg-[rgba(21,25,42,0.7)]
                shadow-sm 
                group-hover:shadow-md
              `}
              style={{
                transition: 'all 0.3s ease-in-out'
              }}
            />
          </div>
          <Button
            type="button"
            onClick={handleComingSoonClick}
            disabled={!postcode.trim()}
            className="min-w-[120px] transition-all duration-300 hover:scale-105 shadow-md"
            style={{
              background: `linear-gradient(145deg, rgba(21, 25, 42, 0.7), rgba(21, 25, 42, 0.9))`,
              backdropFilter: 'blur(4px)',
              border: `1px solid ${accentColor}40`,
              boxShadow: `0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)`
            }}
          >
            <Search className="h-4 w-4 mr-1" style={{ filter: `drop-shadow(0 0 2px ${accentColor}80)` }} />
            <span style={{
              background: `linear-gradient(to right, white, ${accentColor})`,
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              filter: 'drop-shadow(0 0 1px rgba(255, 255, 255, 0.5))'
            }}>Coming Soon</span>
          </Button>
        </div>

        {/* Coming Soon Notice */}
        <div className="mt-4 p-4 rounded-lg animate-in fade-in slide-in-from-top-5 duration-300"
          style={{
            background: 'rgba(21, 25, 42, 0.6)',
            backdropFilter: 'blur(8px)',
            border: `1px solid ${accentColor}30`,
            boxShadow: `0 8px 25px -5px rgba(0,0,0,0.3), 0 0 15px ${accentColor}15`
          }}>
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0">
              <Sparkles className="h-5 w-5 text-yellow-400 animate-pulse" 
                style={{ filter: 'drop-shadow(0 0 4px rgba(251, 191, 36, 0.6))' }} />
            </div>
            <div className="flex-1">
              <h4 className="text-sm font-medium text-white mb-1 flex items-center">
                <Clock className="h-4 w-4 mr-1" style={{ filter: `drop-shadow(0 0 2px ${accentColor}80)` }} />
                Enhanced Address Lookup Coming Soon
              </h4>
              <p className="text-xs text-[#BBC3E1] leading-relaxed">
                We're implementing Google Places API for more accurate and comprehensive address lookup. 
                This will provide better address suggestions, validation, and autocomplete functionality.
              </p>
              <div className="mt-2 flex items-center text-xs">
                <MapPin className="h-3 w-3 mr-1 text-green-400" />
                <span className="text-green-400">More accurate results</span>
                <span className="mx-2 text-[#BBC3E1]">•</span>
                <Sparkles className="h-3 w-3 mr-1 text-yellow-400" />
                <span className="text-yellow-400">Smart autocomplete</span>
              </div>
            </div>
          </div>
        </div>

        {/* Manual Address Entry Suggestion */}
        <div className="mt-3 text-xs text-[#BBC3E1]">
          <span>For now, please enter delivery addresses manually in the customer details form.</span>
        </div>
      </div>
    </div>
  );
};
