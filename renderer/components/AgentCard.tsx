import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Check, VolumeIcon } from 'lucide-react';
import { AgentProfileOutput } from 'types';

interface Props {
  agent: AgentProfileOutput;
  isSelected: boolean;
  onSelect: (agent: AgentProfileOutput) => void;
}

const AgentCard: React.FC<Props> = ({ agent, isSelected, onSelect }) => {
  // Helper functions for UI
  const getPersonalityLabel = (type: string) => {
    switch (type) {
      case 'friendly': return 'Friendly & Warm';
      case 'professional': return 'Professional & Efficient';
      case 'enthusiastic': return 'Enthusiastic & Energetic';
      case 'formal': return 'Formal & Polite';
      default: return type.charAt(0).toUpperCase() + type.slice(1);
    }
  };

  const getVoiceTypeLabel = (type: string) => {
    switch (type) {
      case 'female_british': return 'Female (British)';
      case 'male_british': return 'Male (British)';
      case 'female_indian': return 'Female (Indian)';
      case 'male_indian': return 'Male (Indian)';
      default: return type.replace('_', ' ');
    }
  };

  const getPersonalityColor = (type: string) => {
    switch (type) {
      case 'friendly': return 'bg-blue-500/20 text-blue-300';
      case 'professional': return 'bg-slate-500/20 text-slate-300';
      case 'enthusiastic': return 'bg-amber-500/20 text-amber-300';
      case 'formal': return 'bg-purple-500/20 text-purple-300';
      default: return 'bg-gray-500/20 text-gray-300';
    }
  };

  // Generate placeholder image URL if no image exists
  const getImageUrl = () => {
    if (agent.image_id) {
      return `/routes/agents/${agent.id}/image`;
    }
    // Generate a placeholder with the first letter of the name
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(agent.name)}&background=7c5dfa&color=fff&size=200`;
  };

  return (
    <Card 
      className={`relative overflow-hidden cursor-pointer transition-all hover:border-purple-500/70 ${isSelected ? 'border-purple-500 shadow-[0_0_15px_rgba(124,93,250,0.4)]' : 'border-gray-800'}`}
      onClick={() => onSelect(agent)}
    >
      {isSelected && (
        <div className="absolute top-2 right-2 z-10 bg-purple-500 rounded-full p-1 shadow-lg">
          <Check className="h-3 w-3 text-white" />
        </div>
      )}
      <div className="h-40 overflow-hidden relative">
        <img 
          src={getImageUrl()} 
          alt={agent.name} 
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-gray-900 to-transparent opacity-80"></div>
      </div>
      <CardContent className="p-4">
        <div className="flex items-center mb-2 space-x-2">
          <h3 className="text-lg font-semibold text-white truncate">{agent.name}</h3>
          <VolumeIcon className="h-4 w-4 text-gray-400" />
        </div>
        
        <p className="text-gray-400 text-sm line-clamp-2 mb-3 h-10">
          {agent.description || `A ${agent.personality} AI voice agent with a ${agent.voice_type.replace('_', ' ')} voice.`}
        </p>
        
        <div className="flex flex-wrap gap-2">
          <Badge variant="outline" className="bg-gray-800/50">
            {getVoiceTypeLabel(agent.voice_type)}
          </Badge>
          <Badge variant="outline" className={getPersonalityColor(agent.personality)}>
            {getPersonalityLabel(agent.personality)}
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
};

export default AgentCard;
