import React from 'react';
import { ChevronRight, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigation } from './NavigationProvider';
import { globalColors } from '../utils/QSAIDesign';

interface BreadcrumbsProps {
  className?: string;
  showHome?: boolean;
}

export function Breadcrumbs({ className = '', showHome = true }: BreadcrumbsProps) {
  const { breadcrumbs, navigateWithHistory, currentPage } = useNavigation();

  if (breadcrumbs.length === 0 && currentPage?.path === '/') {
    return null; // Don't show breadcrumbs on home page
  }

  return (
    <nav className={`flex items-center space-x-1 text-sm ${className}`} aria-label="Breadcrumb">
      {showHome && currentPage?.path !== '/' && (
        <>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 px-2 text-xs hover:bg-white/10"
            onClick={() => navigateWithHistory('/')}
            style={{ color: globalColors.text.secondary }}
          >
            <Home className="h-3 w-3 mr-1" />
            Home
          </Button>
          <ChevronRight className="h-3 w-3" style={{ color: globalColors.text.tertiary }} />
        </>
      )}
      
      {breadcrumbs.map((crumb, index) => {
        const isLast = index === breadcrumbs.length - 1;
        const isCurrent = crumb.path === currentPage?.path;
        
        return (
          <React.Fragment key={crumb.path}>
            {index > 0 && crumb.path !== '/' && (
              <ChevronRight className="h-3 w-3" style={{ color: globalColors.text.tertiary }} />
            )}
            
            {crumb.path !== '/' && (
              <Button
                variant="ghost"
                size="sm"
                className={`h-6 px-2 text-xs hover:bg-white/10 ${
                  isCurrent ? 'font-medium' : 'font-normal'
                }`}
                onClick={() => !isCurrent && navigateWithHistory(crumb.path)}
                disabled={isCurrent}
                style={{
                  color: isCurrent 
                    ? globalColors.text.primary 
                    : globalColors.text.secondary,
                  cursor: isCurrent ? 'default' : 'pointer'
                }}
              >
                {crumb.title}
              </Button>
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
}

export default Breadcrumbs;