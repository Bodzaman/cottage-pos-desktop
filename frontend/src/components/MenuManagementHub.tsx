import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Edit3, 
  CheckCircle,
  Globe,
  Monitor,
  Bot
} from 'lucide-react';
import { colors, cardStyle } from '../utils/designSystem';
import { styles } from '../utils/QSAIDesign';

// Menu Management Hub Component
interface MenuManagementHubProps {
  totalItems?: number;
}

const MenuManagementHub: React.FC<MenuManagementHubProps> = ({ 
  totalItems = 0
}) => {
  const navigate = useNavigate();
  
  const handleEditMenu = () => {
    navigate('/admin-menu');
  };

  return (
    <Card style={cardStyle}>
      <CardContent className="pt-6">
        <div className="text-center space-y-4">
          <div className="space-y-1">
            <h3 className="text-lg font-semibold" style={styles.purpleGradientText}>
              Menu Management Hub
            </h3>
            <p className="text-sm" style={{ color: colors.text.secondary }}>
              Changes will update all channels: Online Menu, POS System, and AI Voice Agent
            </p>
          </div>
          
          <div className="flex items-center justify-center gap-6 text-xs" style={{ color: colors.text.secondary }}>
            <div className="flex items-center gap-1">
              <CheckCircle className="h-3 w-3" style={{ color: colors.brand.purple }} />
              <span>{totalItems} active items</span>
            </div>
            <div className="flex items-center gap-1">
              <Globe className="h-3 w-3" />
              <span>Website sync</span>
            </div>
            <div className="flex items-center gap-1">
              <Monitor className="h-3 w-3" />
              <span>POS sync</span>
            </div>
            <div className="flex items-center gap-1 opacity-50">
              <Bot className="h-3 w-3" />
              <span>AI corpus</span>
            </div>
          </div>
          
          <Button 
            onClick={handleEditMenu}
            className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white px-8 py-2"
          >
            <Edit3 className="h-4 w-4 mr-2" />
            Edit Menu
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default MenuManagementHub;