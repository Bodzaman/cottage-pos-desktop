/**
 * Empty State Guidance Components
 * 
 * Shows contextual guidance when different parts of the menu setup are empty,
 * guiding users toward the next logical step in their setup process.
 */

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  BookmarkPlus,
  Utensils,
  PlusCircle,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Info,
  Sparkles
} from 'lucide-react';
import { MenuSetupStatus } from '../utils/menuSetupAnalysis';

interface EmptyStateGuidanceProps {
  setupStatus: MenuSetupStatus;
  currentSection: 'categories' | 'proteins';
  onCreateNew: () => void;
  onSwitchSection: (section: 'categories' | 'proteins') => void;
  onOpenWizard: () => void;
}

/**
 * Main empty state guidance component that shows contextual guidance
 * based on current menu setup state and active section
 */
export function EmptyStateGuidance({ 
  setupStatus, 
  currentSection, 
  onCreateNew, 
  onSwitchSection, 
  onOpenWizard 
}: EmptyStateGuidanceProps) {
  
  // Determine what to show based on setup status and current section
  if (currentSection === 'categories' && !setupStatus.hasMainCategories) {
    return <CreateFirstCategoryGuidance onCreateNew={onCreateNew} onOpenWizard={onOpenWizard} />;
  }
  
  if (currentSection === 'proteins' && !setupStatus.hasProteins) {
    if (!setupStatus.hasMainCategories) {
      return (
        <CreateCategoriesFirstGuidance 
          onSwitchToCategories={() => onSwitchSection('categories')} 
          onOpenWizard={onOpenWizard}
        />
      );
    }
    return <CreateFirstProteinGuidance onCreateNew={onCreateNew} onOpenWizard={onOpenWizard} />;
  }
  
  // If we have everything but user is in empty search results
  if (setupStatus.setupPhase === 'complete') {
    return <SetupCompleteGuidance currentSection={currentSection} />;
  }
  
  return null;
}

/**
 * Guidance for creating the first main category
 */
function CreateFirstCategoryGuidance({ onCreateNew, onOpenWizard }: { onCreateNew: () => void; onOpenWizard: () => void }) {
  return (
    <Card className="border-2 border-dashed border-purple-300 bg-purple-50/50">
      <CardContent className="pt-8 pb-8">
        <div className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center">
            <BookmarkPlus className="h-8 w-8 text-purple-600" />
          </div>
          
          <div className="space-y-2">
            <h3 className="text-lg font-semibold text-gray-900">
              Create Your First Main Category
            </h3>
            <p className="text-sm text-gray-600 max-w-md mx-auto">
              Start organizing your menu by creating main categories like "Appetizers", "Main Courses", or "Desserts".
              Categories help customers navigate your menu easily.
            </p>
          </div>
          
          <div className="space-y-3">
            <div className="flex flex-wrap gap-2 justify-center">
              <Badge variant="outline" className="text-xs">
                Appetizers
              </Badge>
              <Badge variant="outline" className="text-xs">
                Main Courses
              </Badge>
              <Badge variant="outline" className="text-xs">
                Tandoori Specialties
              </Badge>
              <Badge variant="outline" className="text-xs">
                Desserts
              </Badge>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button 
                onClick={onCreateNew} 
                className="bg-purple-600 hover:bg-purple-700"
              >
                <PlusCircle className="h-4 w-4 mr-2" />
                Create First Category
              </Button>
              
              <Button 
                onClick={onOpenWizard} 
                variant="outline"
                className="border-purple-300 text-purple-600 hover:bg-purple-50"
              >
                <Sparkles className="h-4 w-4 mr-2" />
                Open Setup Guide
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Guidance for creating the first protein option
 */
function CreateFirstProteinGuidance({ onCreateNew, onOpenWizard }: { onCreateNew: () => void; onOpenWizard: () => void }) {
  return (
    <Card className="border-2 border-dashed border-green-300 bg-green-50/50">
      <CardContent className="pt-8 pb-8">
        <div className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
            <Utensils className="h-8 w-8 text-green-600" />
          </div>
          
          <div className="space-y-2">
            <h3 className="text-lg font-semibold text-gray-900">
              Add Protein Options
            </h3>
            <p className="text-sm text-gray-600 max-w-md mx-auto">
              Great! Now add protein variations that can be applied to your dishes.
              This helps create menu item variants quickly.
            </p>
          </div>
          
          <div className="space-y-3">
            <div className="flex flex-wrap gap-2 justify-center">
              <Badge variant="outline" className="text-xs">
                Chicken
              </Badge>
              <Badge variant="outline" className="text-xs">
                Lamb
              </Badge>
              <Badge variant="outline" className="text-xs">
                Prawn
              </Badge>
              <Badge variant="outline" className="text-xs">
                Vegetarian
              </Badge>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button 
                onClick={onCreateNew} 
                className="bg-green-600 hover:bg-green-700"
              >
                <PlusCircle className="h-4 w-4 mr-2" />
                Add First Protein
              </Button>
              
              <Button 
                onClick={onOpenWizard} 
                variant="outline"
                className="border-green-300 text-green-600 hover:bg-green-50"
              >
                <Sparkles className="h-4 w-4 mr-2" />
                Setup Guide
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Guidance when user is in proteins section but needs to create categories first
 */
function CreateCategoriesFirstGuidance({ 
  onSwitchToCategories, 
  onOpenWizard 
}: { 
  onSwitchToCategories: () => void; 
  onOpenWizard: () => void; 
}) {
  return (
    <Card className="border-2 border-dashed border-orange-300 bg-orange-50/50">
      <CardContent className="pt-8 pb-8">
        <div className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center">
            <AlertCircle className="h-8 w-8 text-orange-600" />
          </div>
          
          <div className="space-y-2">
            <h3 className="text-lg font-semibold text-gray-900">
              Create Main Categories First
            </h3>
            <p className="text-sm text-gray-600 max-w-md mx-auto">
              Before adding protein options, you need to create main categories to organize your menu.
              This provides the foundation for your menu structure.
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button 
              onClick={onSwitchToCategories} 
              className="bg-orange-600 hover:bg-orange-700"
            >
              <BookmarkPlus className="h-4 w-4 mr-2" />
              Go to Categories
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
            
            <Button 
              onClick={onOpenWizard} 
              variant="outline"
              className="border-orange-300 text-orange-600 hover:bg-orange-50"
            >
              <Sparkles className="h-4 w-4 mr-2" />
              Setup Guide
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Guidance when setup is complete
 */
function SetupCompleteGuidance({ currentSection }: { currentSection: 'categories' | 'proteins' }) {
  return (
    <Card className="border-2 border-dashed border-blue-300 bg-blue-50/50">
      <CardContent className="pt-6 pb-6">
        <div className="text-center space-y-3">
          <div className="mx-auto w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
            <CheckCircle2 className="h-6 w-6 text-blue-600" />
          </div>
          
          <div className="space-y-1">
            <h4 className="font-medium text-gray-900">
              {currentSection === 'categories' ? 'Categories Ready!' : 'Proteins Ready!'}
            </h4>
            <p className="text-sm text-gray-600">
              {currentSection === 'categories' 
                ? 'Your menu categories are set up. Ready to create menu items!'
                : 'Your protein options are configured. Ready to create menu items!'}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Setup progress overview panel that can be shown in the header area
 */
export function SetupProgressOverview({ setupStatus, onOpenWizard }: { 
  setupStatus: MenuSetupStatus; 
  onOpenWizard: () => void; 
}) {
  // Don't show if setup is complete
  if (setupStatus.setupPhase === 'complete') {
    return null;
  }
  
  return (
    <Card className="bg-gradient-to-r from-purple-500/10 to-blue-500/10 border-purple-200">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
              <Info className="h-4 w-4 text-purple-600" />
            </div>
            <div>
              <CardTitle className="text-sm font-medium">Menu Setup Progress</CardTitle>
              <p className="text-xs text-gray-600">{setupStatus.progressPercentage}% Complete</p>
            </div>
          </div>
          
          <Button 
            onClick={onOpenWizard} 
            variant="outline" 
            size="sm"
            className="border-purple-300 text-purple-600 hover:bg-purple-50"
          >
            <Sparkles className="h-3 w-3 mr-1" />
            Guide
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center gap-2">
            {setupStatus.hasMainCategories ? (
              <CheckCircle2 className="h-4 w-4 text-green-500" />
            ) : (
              <div className="h-4 w-4 rounded-full border-2 border-gray-300" />
            )}
            <span className="text-xs text-gray-600">
              Categories: {setupStatus.mainCategoriesCount}
            </span>
          </div>
          
          <div className="flex items-center gap-2">
            {setupStatus.hasProteins ? (
              <CheckCircle2 className="h-4 w-4 text-green-500" />
            ) : (
              <div className="h-4 w-4 rounded-full border-2 border-gray-300" />
            )}
            <span className="text-xs text-gray-600">
              Proteins: {setupStatus.proteinsCount}
            </span>
          </div>
        </div>
        
        {setupStatus.suggestions.length > 0 && (
          <div className="mt-3 p-3 bg-gradient-to-r from-purple-500/10 to-amber-500/10 border border-purple-500/20 backdrop-blur-sm rounded-lg text-xs">
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 bg-gradient-to-r from-purple-400 to-amber-400 rounded-full"></div>
              <span className="font-semibold text-purple-300">Next Step:</span>
              <span className="text-gray-200">{setupStatus.suggestions[0]}</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
