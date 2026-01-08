import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  Database, 
  RefreshCw, 
  CheckCircle, 
  AlertCircle, 
  Loader2,
  Menu,
  HelpCircle,
  Calendar,
  Settings,
  Trash2,
  Eye
} from 'lucide-react';
import { toast } from 'sonner';
import { apiClient } from 'app';
import { colors, cardStyle } from '../utils/designSystem';
import { globalColors } from '../utils/QSAIDesign';

// Types for corpus tools
interface CorpusTool {
  id: string;
  name: string;
  type: 'menu' | 'restaurant' | 'faq' | 'promo' | 'custom';
  description: string;
  status: 'active' | 'inactive' | 'syncing' | 'error';
  lastSynced?: string;
  version?: string;
  entryCount?: number;
  isConfigured: boolean;
  isUltravoxManaged?: boolean;
}

interface CorpusManagementPanelProps {
  onRefresh?: () => void;
}

const CORPUS_TYPES = {
  menu: {
    icon: Menu,
    title: 'Menu Corpus',
    description: 'Restaurant menu items, categories, prices, and descriptions for voice ordering'
  },
  restaurant: {
    icon: Settings,
    title: 'Restaurant Details',
    description: 'Operating hours, location, contact information, and general restaurant policies'
  },
  faq: {
    icon: HelpCircle,
    title: 'FAQ Corpus',
    description: 'Frequently asked questions about the restaurant, policies, and services'
  },
  promo: {
    icon: Calendar,
    title: 'Promotions Corpus', 
    description: 'Current promotions, special deals, and seasonal offers'
  },
  custom: {
    icon: Database,
    title: 'Custom Corpus',
    description: 'Custom knowledge base for specific business needs'
  }
};

export function CorpusManagementPanel({ onRefresh }: CorpusManagementPanelProps) {
  const [corpusTools, setCorpusTools] = useState<CorpusTool[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncingTools, setSyncingTools] = useState<Set<string>>(new Set());
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingTool, setEditingTool] = useState<CorpusTool | null>(null);

  // Load corpus tools on mount
  useEffect(() => {
    loadCorpusTools();
  }, []);

  const loadCorpusTools = async () => {
    setLoading(true);
    try {
      // Load legacy corpus tools
      const legacyTools: CorpusTool[] = [
        {
          id: 'menu-corpus',
          name: 'Menu Corpus',
          type: 'menu',
          description: 'Restaurant menu items, categories, prices, and descriptions for voice ordering',
          status: 'active',
          isConfigured: true,
          lastSynced: new Date().toISOString(),
          version: '1.0.0',
          entryCount: 0,
          isUltravoxManaged: false
        },
        {
          id: 'restaurant-corpus',
          name: 'Restaurant Details',
          type: 'restaurant', 
          description: 'Operating hours, location, contact information, and general restaurant policies',
          status: 'active',
          isConfigured: true,
          lastSynced: new Date().toISOString(),
          version: '1.0.0',
          isUltravoxManaged: false
        }
      ];

      // Load Ultravox-managed corpora
      const ultravoxCorpora: CorpusTool[] = [];
      try {
        const corporaResponse = await apiClient.list_corpora();
        const corporaData = await corporaResponse.json();
        if (corporaData.success && corporaData.corpora) {
          for (const corpus of corporaData.corpora) {
            ultravoxCorpora.push({
              id: corpus.id,
              name: corpus.name,
              type: corpus.type || 'custom',
              description: corpus.description || 'Custom Ultravox corpus',
              status: 'active',
              isConfigured: true,
              lastSynced: corpus.updatedAt || corpus.createdAt,
              version: '1.0.0',
              entryCount: corpus.documentCount || 0,
              isUltravoxManaged: true
            });
          }
        }
      } catch (error) {
        console.warn('Could not load Ultravox corpora:', error);
      }

      const tools = [...legacyTools, ...ultravoxCorpora];

      // Check legacy menu corpus status
      try {
        const menuResponse = await apiClient.get_menu_corpus_redirect();
        const menuData = await menuResponse.json();
        const menuTool = tools.find(t => t.id === 'menu-corpus');
        if (menuTool && menuData.success) {
          menuTool.entryCount = menuData.corpus?.length || 0;
          menuTool.version = menuData.version || '1.0.0';
          menuTool.lastSynced = menuData.timestamp || new Date().toISOString();
        }
      } catch (error) {
        console.warn('Could not load menu corpus status:', error);
        const menuTool = tools.find(t => t.id === 'menu-corpus');
        if (menuTool) {
          menuTool.status = 'error';
        }
      }

      // Check legacy restaurant corpus status  
      try {
        const restaurantResponse = await apiClient.get_restaurant_details_wrapper();
        const restaurantData = await restaurantResponse.json();
        const restaurantTool = tools.find(t => t.id === 'restaurant-corpus');
        if (restaurantTool && restaurantData.success) {
          restaurantTool.version = restaurantData.version || '1.0.0';
          restaurantTool.lastSynced = restaurantData.timestamp || new Date().toISOString();
        }
      } catch (error) {
        console.warn('Could not load restaurant corpus status:', error);
        const restaurantTool = tools.find(t => t.id === 'restaurant-corpus');
        if (restaurantTool) {
          restaurantTool.status = 'error';
        }
      }

      setCorpusTools(tools);
    } catch (error) {
      console.error('Error loading corpus tools:', error);
      toast.error('Failed to load corpus tools');
    } finally {
      setLoading(false);
    }
  };

  const syncCorpusTool = async (tool: CorpusTool) => {
    setSyncingTools(prev => new Set(prev).add(tool.id));
    try {
      let response;
      let data;
      
      if (tool.isUltravoxManaged) {
        // For Ultravox-managed corpora, we might need different sync logic
        toast.info(`${tool.name} is managed by Ultravox - no sync needed`);
        return;
      } else if (tool.type === 'menu') {
        response = await apiClient.sync_menu_corpus_redirect({ force: true });
        data = await response.json();
      } else if (tool.type === 'restaurant') {
        response = await apiClient.sync_restaurant_details_wrapper({ force: true }, {
          headers: {
            'Authorization': 'Bearer qsai-voice-auth-2025'
          }
        });
        data = await response.json();
      } else {
        throw new Error(`Sync not implemented for ${tool.type} corpus`);
      }

      if (data.success) {
        toast.success(`${tool.name} synced successfully`);
        await loadCorpusTools(); // Reload to get updated status
        onRefresh?.();
      } else {
        throw new Error(data.message || 'Sync failed');
      }
    } catch (error) {
      console.error(`Error syncing ${tool.name}:`, error);
      toast.error(`Failed to sync ${tool.name}`);
    } finally {
      setSyncingTools(prev => {
        const newSet = new Set(prev);
        newSet.delete(tool.id);
        return newSet;
      });
    }
  };

  const deleteCorpusTool = async (tool: CorpusTool) => {
    if (!tool.isUltravoxManaged) {
      toast.error('Can only delete Ultravox-managed corpus tools');
      return;
    }

    if (!confirm(`Are you sure you want to delete "${tool.name}"? This action cannot be undone.`)) {
      return;
    }

    try {
      const response = await apiClient.delete_corpus({ corpusId: tool.id });
      const data = await response.json();
      if (data.success) {
        toast.success(`Corpus "${tool.name}" deleted successfully`);
        await loadCorpusTools();
      } else {
        throw new Error(data.message || 'Failed to delete corpus');
      }
    } catch (error) {
      console.error('Error deleting corpus:', error);
      toast.error(`Failed to delete corpus: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const getStatusIcon = (status: CorpusTool['status']) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="h-4 w-4" style={{ color: globalColors.status.success }} />;
      case 'error':
        return <AlertCircle className="h-4 w-4" style={{ color: globalColors.status.error }} />;
      case 'syncing':
        return <Loader2 className="h-4 w-4 animate-spin" style={{ color: colors.brand.purpleLight }} />;
      default:
        return <AlertCircle className="h-4 w-4" style={{ color: colors.text.secondary }} />;
    }
  };

  const getStatusColor = (status: CorpusTool['status']) => {
    switch (status) {
      case 'active':
        return globalColors.status.success;
      case 'error':
        return globalColors.status.error;
      case 'syncing':
        return colors.brand.purpleLight;
      default:
        return colors.text.secondary;
    }
  };

  const handleEditTool = (tool: CorpusTool) => {
    setEditingTool(tool);
    setIsEditDialogOpen(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin" style={{ color: colors.brand.purpleLight }} />
        <span className="ml-3 text-white">Loading corpus tools...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-semibold text-white mb-2">Manage Corpus Tools</h3>
          <p style={{ color: colors.text.secondary }}>
            Configure and manage knowledge corpus for your AI voice agent
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={loadCorpusTools}
            className="border-[rgba(124,93,250,0.3)] text-[#BBC3E1] hover:bg-[rgba(124,93,250,0.1)]"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Corpus Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {corpusTools.map((tool) => {
          const TypeIcon = CORPUS_TYPES[tool.type]?.icon || Database;
          const isSyncing = syncingTools.has(tool.id);
          
          return (
            <Card
              key={tool.id}
              style={{
                ...cardStyle,
                borderColor: `rgba(124, 93, 250, 0.2)`,
                background: `linear-gradient(135deg, rgba(30, 30, 30, 0.8) 0%, rgba(26, 26, 26, 0.9) 100%)`
              }}
            >
              <CardHeader className="pb-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{
                      backgroundColor: `rgba(124, 93, 250, 0.2)`
                    }}>
                      <TypeIcon className="h-5 w-5" style={{ color: colors.brand.purpleLight }} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <CardTitle className="text-white text-lg">{tool.name}</CardTitle>
                        {tool.isUltravoxManaged && (
                          <Badge 
                            variant="outline" 
                            className="text-xs"
                            style={{
                              borderColor: colors.brand.purpleLight,
                              color: colors.brand.purpleLight
                            }}
                          >
                            Ultravox
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        {getStatusIcon(isSyncing ? 'syncing' : tool.status)}
                        <Badge 
                          variant="outline" 
                          className="text-xs"
                          style={{
                            borderColor: getStatusColor(isSyncing ? 'syncing' : tool.status),
                            color: getStatusColor(isSyncing ? 'syncing' : tool.status)
                          }}
                        >
                          {isSyncing ? 'Syncing...' : tool.status}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEditTool(tool)}
                      className="text-[#BBC3E1] hover:bg-[rgba(124,93,250,0.1)]"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    {tool.isUltravoxManaged && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteCorpusTool(tool)}
                        className="text-red-400 hover:bg-red-400/10"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm" style={{ color: colors.text.secondary }}>
                  {tool.description}
                </p>
                
                <Separator style={{ backgroundColor: `rgba(124, 93, 250, 0.1)` }} />
                
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span style={{ color: colors.text.secondary }}>Version:</span>
                    <span className="text-white">{tool.version || 'N/A'}</span>
                  </div>
                  {tool.entryCount !== undefined && (
                    <div className="flex justify-between text-sm">
                      <span style={{ color: colors.text.secondary }}>Entries:</span>
                      <span className="text-white">{tool.entryCount}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm">
                    <span style={{ color: colors.text.secondary }}>Last Synced:</span>
                    <span className="text-white">
                      {tool.lastSynced ? new Date(tool.lastSynced).toLocaleDateString() : 'Never'}
                    </span>
                  </div>
                </div>
                
                <div className="flex gap-2 pt-2">
                  <Button
                    size="sm"
                    onClick={() => syncCorpusTool(tool)}
                    disabled={isSyncing || tool.isUltravoxManaged}
                    className="flex-1 bg-[rgba(124,93,250,0.8)] hover:bg-[rgba(124,93,250,1)] text-white disabled:opacity-50"
                  >
                    {isSyncing ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <RefreshCw className="h-4 w-4 mr-2" />
                    )}
                    {isSyncing ? 'Syncing...' : tool.isUltravoxManaged ? 'Ultravox Managed' : 'Sync to Ultravox'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Edit Tool Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="bg-[#1A1A1A] border-[rgba(124,93,250,0.3)] max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-white">View Corpus Tool</DialogTitle>
          </DialogHeader>
          {editingTool && (
            <div className="space-y-6 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-white">Tool Name</Label>
                  <Input
                    id="name"
                    value={editingTool.name}
                    readOnly
                    className="bg-[rgba(30,30,30,0.5)] border-[rgba(124,93,250,0.3)] text-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="type" className="text-white">Type</Label>
                  <Input
                    id="type"
                    value={editingTool.type}
                    readOnly
                    className="bg-[rgba(30,30,30,0.5)] border-[rgba(124,93,250,0.3)] text-white"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="description" className="text-white">Description</Label>
                <Textarea
                  id="description"
                  value={editingTool.description}
                  readOnly
                  rows={3}
                  className="bg-[rgba(30,30,30,0.5)] border-[rgba(124,93,250,0.3)] text-white"
                />
              </div>

              <div className="bg-[rgba(30,30,30,0.3)] rounded-lg p-4">
                <h4 className="text-white font-medium mb-3">Status Information</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span style={{ color: colors.text.secondary }}>Current Status:</span>
                    <div className="flex items-center gap-2 mt-1">
                      {getStatusIcon(editingTool.status)}
                      <span className="text-white">{editingTool.status}</span>
                    </div>
                  </div>
                  <div>
                    <span style={{ color: colors.text.secondary }}>Version:</span>
                    <div className="text-white mt-1">{editingTool.version || 'N/A'}</div>
                  </div>
                  <div>
                    <span style={{ color: colors.text.secondary }}>Managed By:</span>
                    <div className="text-white mt-1">{editingTool.isUltravoxManaged ? 'Ultravox' : 'Legacy System'}</div>
                  </div>
                  {editingTool.entryCount !== undefined && (
                    <div>
                      <span style={{ color: colors.text.secondary }}>Entry Count:</span>
                      <div className="text-white mt-1">{editingTool.entryCount}</div>
                    </div>
                  )}
                  <div>
                    <span style={{ color: colors.text.secondary }}>Last Synced:</span>
                    <div className="text-white mt-1">
                      {editingTool.lastSynced 
                        ? new Date(editingTool.lastSynced).toLocaleString() 
                        : 'Never'
                      }
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setIsEditDialogOpen(false)}
                  className="border-[rgba(124,93,250,0.3)] text-[#BBC3E1] hover:bg-[rgba(124,93,250,0.1)]"
                >
                  Close
                </Button>
                {!editingTool.isUltravoxManaged && (
                  <Button
                    onClick={() => syncCorpusTool(editingTool)}
                    className="bg-[rgba(124,93,250,0.8)] hover:bg-[rgba(124,93,250,1)] text-white"
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Sync Now
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
