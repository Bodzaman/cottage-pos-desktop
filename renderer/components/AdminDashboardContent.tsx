import { LayoutDashboard, ChefHat, ImageIcon, Bot, Cog, ArrowRight, Keyboard } from 'lucide-react';
import { colors } from 'utils/designSystem';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface AdminDashboardContentProps {
  /** Callback to switch to a specific tab */
  onTabChange?: (tab: string) => void;
}

export default function AdminDashboardContent({ onTabChange }: AdminDashboardContentProps) {
  
  // Quick access card data
  const quickAccessCards = [
    {
      icon: ChefHat,
      title: 'Menu Management',
      description: 'Manage categories, items, modifiers, pricing and availability',
      action: 'Manage',
      tab: 'menu',
      gradient: 'from-purple-600/20 to-purple-400/10',
      borderColor: 'border-purple-500/30',
      iconColor: 'text-purple-400',
    },
    {
      icon: ImageIcon,
      title: 'Media Library',
      description: 'Upload, organize and manage menu item photos and videos',
      action: 'Browse',
      tab: 'media',
      gradient: 'from-blue-600/20 to-blue-400/10',
      borderColor: 'border-blue-500/30',
      iconColor: 'text-blue-400',
    },
    {
      icon: Bot,
      title: 'AI Staff Management',
      description: 'Configure AI agents, voice assistants and chatbot settings',
      action: 'Configure',
      tab: 'ai-management',
      gradient: 'from-turquoise-600/20 to-turquoise-400/10',
      borderColor: 'border-turquoise-500/30',
      iconColor: 'text-turquoise-400',
    },
    {
      icon: Cog,
      title: 'Restaurant Settings',
      description: 'Update business info, hours, delivery zones and system settings',
      action: 'Open',
      tab: 'settings',
      gradient: 'from-purple-500/20 to-pink-500/10',
      borderColor: 'border-purple-400/30',
      iconColor: 'text-purple-300',
    },
  ];

  const keyboardShortcuts = [
    { key: 'Alt + 1', action: 'Dashboard' },
    { key: 'Alt + 2', action: 'Menu Management' },
    { key: 'Alt + 3', action: 'Media Library' },
    { key: 'Alt + 4', action: 'AI Staff Management' },
    { key: 'Alt + 5', action: 'Restaurant Settings' },
    { key: 'Esc', action: 'Close Admin Panel' },
  ];

  return (
    <div className="min-h-full" style={{ backgroundColor: colors.background.primary }}>
      {/* Hero/Welcome Section with geometric pattern background */}
      <div 
        className="relative overflow-hidden rounded-xl mb-8 p-8 border"
        style={{
          background: `linear-gradient(135deg, ${colors.brand.purpleDark}22 0%, ${colors.brand.purple}11 50%, transparent 100%)`,
          borderColor: colors.border.purple,
        }}
      >
        {/* Geometric pattern overlay */}
        <div 
          className="absolute inset-0 opacity-5"
          style={{
            backgroundImage: `
              repeating-linear-gradient(45deg, transparent, transparent 10px, ${colors.brand.purple} 10px, ${colors.brand.purple} 11px),
              repeating-linear-gradient(-45deg, transparent, transparent 10px, ${colors.brand.purple} 10px, ${colors.brand.purple} 11px)
            `,
          }}
        />
        
        {/* Content */}
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-4">
            <div 
              className="p-3 rounded-lg"
              style={{ 
                background: `linear-gradient(135deg, ${colors.brand.purple} 0%, ${colors.brand.purpleLight} 100%)`,
              }}
            >
              <LayoutDashboard className="h-8 w-8 text-white" />
            </div>
            <h1 
              className="text-4xl font-bold"
              style={{ color: colors.text.primary }}
            >
              Welcome to Admin Control Panel
            </h1>
          </div>
          <p 
            className="text-lg max-w-3xl"
            style={{ color: colors.text.secondary }}
          >
            Your central hub for managing all aspects of Cottage Tandoori Restaurant. 
            Configure menus, organize media, manage AI assistants, and adjust system settings — all from one powerful interface.
          </p>
        </div>
      </div>

      {/* Quick Access Cards Grid */}
      <div className="mb-8">
        <h2 
          className="text-2xl font-semibold mb-6 flex items-center gap-2"
          style={{ color: colors.text.primary }}
        >
          Quick Access
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {quickAccessCards.map((card) => {
            const IconComponent = card.icon;
            return (
              <Card
                key={card.tab}
                className={`group cursor-pointer transition-all duration-300 hover:scale-[1.02] border ${card.borderColor} bg-gradient-to-br ${card.gradient}`}
                style={{
                  backgroundColor: 'rgba(26, 26, 26, 0.6)',
                  backdropFilter: 'blur(12px)',
                }}
                onClick={() => onTabChange?.(card.tab)}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className={`p-3 rounded-lg transition-all duration-300 group-hover:scale-110`}
                      style={{
                        backgroundColor: 'rgba(0, 0, 0, 0.2)',
                      }}
                    >
                      <IconComponent className={`h-6 w-6 ${card.iconColor}`} />
                    </div>
                    <ArrowRight 
                      className="h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                      style={{ color: colors.text.tertiary }}
                    />
                  </div>
                  <CardTitle 
                    className="text-xl font-semibold mt-4"
                    style={{ color: colors.text.primary }}
                  >
                    {card.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription 
                    className="text-sm mb-4"
                    style={{ color: colors.text.secondary }}
                  >
                    {card.description}
                  </CardDescription>
                  <Button
                    variant="outline"
                    size="sm"
                    className={`w-full group-hover:${card.borderColor.replace('border-', 'bg-')} transition-all duration-300`}
                    style={{
                      borderColor: colors.border.purple,
                      color: colors.text.primary,
                    }}
                  >
                    {card.action}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Keyboard Shortcuts Reference */}
      <Card
        className="border"
        style={{
          backgroundColor: 'rgba(26, 26, 26, 0.6)',
          backdropFilter: 'blur(12px)',
          borderColor: colors.border.medium,
        }}
      >
        <CardHeader>
          <CardTitle 
            className="text-xl font-semibold flex items-center gap-2"
            style={{ color: colors.text.primary }}
          >
            <Keyboard className="h-5 w-5" style={{ color: colors.brand.purple }} />
            Keyboard Shortcuts
          </CardTitle>
          <CardDescription style={{ color: colors.text.secondary }}>
            Navigate faster with these keyboard shortcuts
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {keyboardShortcuts.map((shortcut) => (
              <div
                key={shortcut.key}
                className="flex items-center justify-between p-3 rounded-lg border"
                style={{
                  backgroundColor: 'rgba(0, 0, 0, 0.2)',
                  borderColor: colors.border.light,
                }}
              >
                <span 
                  className="text-sm font-medium"
                  style={{ color: colors.text.secondary }}
                >
                  {shortcut.action}
                </span>
                <kbd
                  className="px-2 py-1 text-xs font-semibold rounded"
                  style={{
                    backgroundColor: colors.brand.purple,
                    color: colors.text.primary,
                  }}
                >
                  {shortcut.key}
                </kbd>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
