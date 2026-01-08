import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { MultiNationalityPassportCard } from 'components/MultiNationalityPassportCard';
import { AgentProfileOutput as AgentProfile } from 'types';
import { VoiceCallStatus } from 'utils/chat-store';
import { colors } from 'utils/designSystem';

interface HorizontalAgentCarouselProps {
  agents: AgentProfile[];
  selectedAgentId: string | null;
  onSelectAgent: (agentId: string) => void;
  aiVoiceAgentEnabled: boolean;
  isVoiceTesting: boolean;
  testingAgentId: string | null;
  voiceCallStatus: VoiceCallStatus;
  onTestVoice: (agentId: string, agentName: string) => void;
}

export const HorizontalAgentCarousel: React.FC<HorizontalAgentCarouselProps> = ({
  agents,
  selectedAgentId,
  onSelectAgent,
  aiVoiceAgentEnabled,
  isVoiceTesting,
  testingAgentId,
  voiceCallStatus,
  onTestVoice
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const cardsPerView = 3; // Show 3 cards at once
  const cardWidth = 380; // Passport card width
  const cardGap = 48; // Gap between cards (3rem)
  
  // Calculate the selected agent index and ensure it's visible
  useEffect(() => {
    if (selectedAgentId) {
      const selectedIndex = agents.findIndex(agent => agent.id === selectedAgentId);
      if (selectedIndex !== -1) {
        // Ensure selected card is visible (preferably in center)
        const targetIndex = Math.max(0, Math.min(
          selectedIndex - Math.floor(cardsPerView / 2),
          agents.length - cardsPerView
        ));
        setCurrentIndex(targetIndex);
      }
    }
  }, [selectedAgentId, agents.length]);

  const canGoLeft = currentIndex > 0;
  const canGoRight = currentIndex < agents.length - cardsPerView;

  const goLeft = () => {
    if (canGoLeft) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const goRight = () => {
    if (canGoRight) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const goToSlide = (index: number) => {
    const targetIndex = Math.max(0, Math.min(index, agents.length - cardsPerView));
    setCurrentIndex(targetIndex);
  };

  return (
    <div className="relative w-full">
      {/* Main Carousel Container */}
      <div className="relative overflow-hidden">
        {/* Cards Container */}
        <div 
          className="flex transition-transform duration-500 ease-out"
          style={{
            transform: `translateX(-${currentIndex * (cardWidth + cardGap)}px)`,
            gap: `${cardGap}px`
          }}
        >
          {agents.map((agent) => {
            const isSelected = selectedAgentId === agent.id;
            return (
              <div
                key={agent.id}
                className="flex-shrink-0 transition-all duration-500 ease-out cursor-pointer"
                style={{
                  width: `${cardWidth}px`,
                  transform: `scale(${isSelected ? 1.05 : 0.95})`,
                  opacity: isSelected ? 1 : 0.8
                }}
                onClick={() => onSelectAgent(agent.id)}
              >
                <MultiNationalityPassportCard
                  agent={agent}
                  isSelected={isSelected}
                  isActive={aiVoiceAgentEnabled && isSelected}
                  onTestVoice={(e) => {
                    e.stopPropagation();
                    onTestVoice(agent.id, agent.name);
                  }}
                  voiceTestState={{
                    isVoiceTesting: isVoiceTesting && testingAgentId === agent.id,
                    voiceCallStatus,
                    disabled: isVoiceTesting && testingAgentId !== agent.id
                  }}
                  className="transition-all duration-500 ease-out"
                  style={{
                    boxShadow: isSelected 
                      ? '0 0 0 3px rgba(124, 93, 250, 0.6), 0 0 20px rgba(124, 93, 250, 0.4), 0 12px 40px rgba(0, 0, 0, 0.4)'
                      : '0 8px 30px rgba(0, 0, 0, 0.3), 0 4px 15px rgba(0, 0, 0, 0.2)'
                  }}
                />
              </div>
            );
          })}
        </div>
      </div>

      {/* Navigation Arrows */}
      {agents.length > cardsPerView && (
        <>
          {/* Left Arrow */}
          <button
            onClick={goLeft}
            disabled={!canGoLeft}
            className={`absolute left-4 top-1/2 -translate-y-1/2 z-20 w-12 h-12 rounded-full transition-all duration-300 flex items-center justify-center ${
              canGoLeft 
                ? 'bg-black/70 hover:bg-black/90 text-white cursor-pointer' 
                : 'bg-gray-800/50 text-gray-500 cursor-not-allowed'
            }`}
            style={{
              backdropFilter: 'blur(8px)',
              border: canGoLeft ? `1px solid ${colors.brand.purpleLight}40` : '1px solid rgba(255,255,255,0.1)'
            }}
          >
            <ChevronLeft className="h-6 w-6" />
          </button>

          {/* Right Arrow */}
          <button
            onClick={goRight}
            disabled={!canGoRight}
            className={`absolute right-4 top-1/2 -translate-y-1/2 z-20 w-12 h-12 rounded-full transition-all duration-300 flex items-center justify-center ${
              canGoRight 
                ? 'bg-black/70 hover:bg-black/90 text-white cursor-pointer' 
                : 'bg-gray-800/50 text-gray-500 cursor-not-allowed'
            }`}
            style={{
              backdropFilter: 'blur(8px)',
              border: canGoRight ? `1px solid ${colors.brand.purpleLight}40` : '1px solid rgba(255,255,255,0.1)'
            }}
          >
            <ChevronRight className="h-6 w-6" />
          </button>
        </>
      )}

      {/* Navigation Dots */}
      <div className="flex justify-center mt-8 space-x-2">
        {agents.map((agent, index) => {
          const isSelected = selectedAgentId === agent.id;
          const isInView = index >= currentIndex && index < currentIndex + cardsPerView;
          
          return (
            <button
              key={agent.id}
              onClick={() => {
                onSelectAgent(agent.id);
                // Adjust carousel to show the selected card
                const targetIndex = Math.max(0, Math.min(
                  index - Math.floor(cardsPerView / 2),
                  agents.length - cardsPerView
                ));
                setCurrentIndex(targetIndex);
              }}
              className={`transition-all duration-300 rounded-full ${
                isSelected
                  ? 'w-8 h-3 bg-purple-400'
                  : isInView
                  ? 'w-3 h-3 bg-gray-400 hover:bg-gray-300'
                  : 'w-2 h-2 bg-gray-600 hover:bg-gray-500'
              }`}
              style={{
                backgroundColor: isSelected 
                  ? colors.brand.purpleLight 
                  : isInView 
                  ? '#9CA3AF' 
                  : '#4B5563'
              }}
            />
          );
        })}
      </div>

      {/* Agent Counter */}
      <div className="text-center mt-4">
        <span className="text-sm text-gray-400">
          {agents.length} Agent{agents.length !== 1 ? 's' : ''} Available
        </span>
      </div>
    </div>
  );
};

export default HorizontalAgentCarousel;
