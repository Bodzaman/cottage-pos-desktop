import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, RefreshCw, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { apiClient } from 'app';
import { SetMeal } from '../utils/menuTypes';
import { styles, globalColors } from '../utils/QSAIDesign';
import SetMealForm from './SetMealForm';
import SetMealCard from './SetMealCard';

interface SetMealsManagementProps {
  onMenuChange?: () => void;
}

const SetMealsManagement: React.FC<SetMealsManagementProps> = ({ onMenuChange }) => {
  const [setMeals, setSetMeals] = useState<SetMeal[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingSetMeal, setEditingSetMeal] = useState<SetMeal | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  // Load set meals from API
  const loadSetMeals = async () => {
    try {
      setLoading(true);
      const response = await apiClient.list_set_meals({ active_only: false });
      
      if (response.ok) {
        const data = await response.json();
        setSetMeals(data || []);
      } else {
        toast.error('Failed to load set meals');
      }
    } catch (error) {
      console.error('Error loading set meals:', error);
      toast.error('Failed to load set meals');
    } finally {
      setLoading(false);
    }
  };

  // Refresh set meals
  const handleRefresh = async () => {
    setRefreshing(true);
    await loadSetMeals();
    setRefreshing(false);
  };

  // Handle creating new set meal
  const handleCreateNew = () => {
    setEditingSetMeal(null);
    setShowForm(true);
  };

  // Handle editing existing set meal
  const handleEdit = (setMeal: SetMeal) => {
    setEditingSetMeal(setMeal);
    setShowForm(true);
  };

  // Handle deleting set meal
  const handleDelete = async (setMealId: string) => {
    if (!confirm('Are you sure you want to delete this set meal?')) return;
    
    try {
      const response = await apiClient.delete_set_meal({ setMealId: setMealId });
      
      if (response.ok) {
        toast.success('Set meal deleted successfully!');
        await loadSetMeals();
        onMenuChange?.();
      } else {
        toast.error('Failed to delete set meal');
      }
    } catch (error) {
      console.error('Error deleting set meal:', error);
      toast.error('Failed to delete set meal');
    }
  };

  // Handle form close
  const handleFormClose = () => {
    setShowForm(false);
    setEditingSetMeal(null);
  };

  // Handle form save success
  const handleFormSave = async () => {
    setShowForm(false);
    setEditingSetMeal(null);
    await loadSetMeals();
    onMenuChange?.();
  };

  // Load set meals on component mount
  useEffect(() => {
    loadSetMeals();
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-white">Set Meals</h2>
        <div className="flex items-center gap-3">
          <Button
            onClick={handleRefresh}
            disabled={refreshing}
            variant="outline"
            size="sm"
            className="bg-[#2A2A2A] border-[#444] text-gray-200 hover:bg-[#333] hover:text-white"
          >
            {refreshing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
          </Button>
          <Button
            onClick={handleCreateNew}
            className="bg-[#7C5DFA] hover:bg-[#6B4DEA] text-white border border-[#7C5DFA]/30 hover:border-[#7C5DFA]/50"
          >
            <Plus className="h-4 w-4 mr-2" />
            Create Set Meal
          </Button>
        </div>
      </div>

      {/* Loading State */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="bg-[#1A1A1A] border border-[rgba(124,93,250,0.2)] rounded-lg p-6 animate-pulse"
            >
              <div className="aspect-[4/3] bg-gray-700 rounded-lg mb-4" />
              <div className="space-y-3">
                <div className="h-5 bg-gray-700 rounded w-3/4" />
                <div className="h-4 bg-gray-700 rounded w-1/2" />
                <div className="h-4 bg-gray-700 rounded w-full" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <>
          {/* Set Meals Grid */}
          {setMeals.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {setMeals.map((setMeal) => (
                <SetMealCard
                  key={setMeal.id}
                  setMeal={setMeal}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          ) : (
            <Card className="bg-[#1A1A1A] border-[rgba(124,93,250,0.2)]">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <div className="text-4xl mb-4">🍽️</div>
                <h3 className="text-xl font-semibold text-white mb-2">No Set Meals Yet</h3>
                <p className="text-gray-400 text-center mb-6 max-w-md">
                  Create your first set meal to offer customers complete dining experiences
                  with bundled items at special prices.
                </p>
                <Button
                  onClick={handleCreateNew}
                  className="bg-[#7C5DFA] hover:bg-[#6B4DEA] text-white border border-[#7C5DFA]/30 hover:border-[#7C5DFA]/50"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create Your First Set Meal
                </Button>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {/* Set Meal Form Modal */}
      {showForm && (
        <SetMealForm
          isOpen={showForm}
          onClose={handleFormClose}
          onSave={handleFormSave}
          editingSetMeal={editingSetMeal}
        />
      )}
    </div>
  );
};

export default SetMealsManagement;
