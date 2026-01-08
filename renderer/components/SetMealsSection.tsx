import React, { useState, useEffect, memo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Users, ChefHat, Heart, ArrowRight, X } from 'lucide-react';
import { toast } from 'sonner';
import { apiClient } from 'app';
import { SetMeal } from '../utils/menuTypes';
import { AnimatedSection } from '../components/AnimatedSection';
import { PremiumTheme } from '../utils/premiumTheme';

interface SetMealWithItems extends SetMeal {
  items: Array<{
    id: string;
    name: string;
    description?: string;
    image_url?: string;
    quantity: number;
  }>;
  total_individual_price: number;
}

interface SetMealsSectionProps {
  userRole?: string;
}

const SetMealsSectionComponent: React.FC<SetMealsSectionProps> = ({ userRole = 'viewer' }) => {
  const [setMeals, setSetMeals] = useState<SetMeal[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSetMeal, setSelectedSetMeal] = useState<SetMealWithItems | null>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  // Load set meals on component mount
  useEffect(() => {
    loadSetMeals();
  }, []);

  const loadSetMeals = async () => {
    try {
      setLoading(true);
      const response = await apiClient.list_set_meals({ active_only: true });
      
      if (response.ok) {
        const data = await response.json();
        setSetMeals(data || []);
      }
    } catch (error) {
      console.error('Error loading set meals:', error);
      toast.error('Failed to load set meals');
    } finally {
      setLoading(false);
    }
  };

  const loadSetMealDetails = async (setMealId: string) => {
    try {
      setLoadingDetails(true);
      const response = await apiClient.get_set_meal({ setMealId });
      
      if (response.ok) {
        const data = await response.json();
        setSelectedSetMeal(data.set_meal);
        setShowDetails(true);
      }
    } catch (error) {
      console.error('Error loading set meal details:', error);
      toast.error('Failed to load set meal details');
    } finally {
      setLoadingDetails(false);
    }
  };

  const handleAddToCart = (setMeal: SetMealWithItems) => {
    // TODO: Implement cart integration
    toast.success(`${setMeal.name} added to cart!`);
    setShowDetails(false);
  };

  // Don't render if no set meals
  if (!loading && setMeals.length === 0) {
    return null;
  }

  return (
    <>
      <section 
        className="py-24 px-4"
        style={{
          background: PremiumTheme.colors.background.secondary,
          backgroundImage: `url('data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23${PremiumTheme.colors.silver[500].replace('#', '')}\' fill-opacity=\'0.1\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')`
        }}
      >
        <div className="container mx-auto">
          <AnimatedSection className="text-center mb-16" threshold={0.25}>
            <h2 
              className="text-4xl font-serif mb-3 text-center bg-gradient-to-r bg-clip-text text-transparent"
              style={{
                backgroundImage: `linear-gradient(to right, ${PremiumTheme.colors.text.primary}, ${PremiumTheme.colors.silver[400]})`
              }}
            >
              Set Meals
            </h2>
            <p 
              className="text-center mb-8 max-w-2xl mx-auto"
              style={{ color: PremiumTheme.colors.text.muted }}
            >
              Perfect for sharing and special occasions. Our carefully curated set meals offer the best of Cottage Tandoori at exceptional value.
            </p>
          </AnimatedSection>

          {loading ? (
            <div className="flex justify-center items-center py-12">
              <div 
                className="animate-spin rounded-full h-12 w-12 border-b-2"
                style={{ borderColor: PremiumTheme.colors.burgundy[500] }}
              ></div>
            </div>
          ) : (
            <AnimatedSection className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8" delay={0.2}>
              {setMeals.map((setMeal, index) => (
                <Card 
                  key={setMeal.id}
                  className="group border transition-all duration-300 overflow-hidden backdrop-blur-sm"
                  style={{
                    background: PremiumTheme.colors.background.card,
                    borderColor: PremiumTheme.colors.border.light
                  }}
                  data-aos="fade-up"
                  data-aos-delay={index * 100}
                >
                  {/* Hero Image */}
                  {setMeal.hero_image_url && (
                    <div className="relative h-48 overflow-hidden">
                      <img 
                        src={setMeal.hero_image_url} 
                        alt={setMeal.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                      
                      {/* Price Badge */}
                      <div className="absolute top-4 right-4">
                        <Badge 
                          className="border-0 px-3 py-1 text-sm font-semibold"
                          style={{
                            background: PremiumTheme.colors.burgundy[500],
                            color: PremiumTheme.colors.text.primary
                          }}
                        >
                          £{setMeal.set_price.toFixed(2)}
                        </Badge>
                      </div>
                    </div>
                  )}

                  <CardContent className="p-6">
                    <div className="space-y-4">
                      {/* Set Meal Name */}
                      <div>
                        <h3 
                          className="text-xl font-serif mb-2 group-hover:opacity-80 transition-colors"
                          style={{ color: PremiumTheme.colors.text.primary }}
                        >
                          {setMeal.name}
                        </h3>
                        {setMeal.description && (
                          <p 
                            className="text-sm line-clamp-2"
                            style={{ color: PremiumTheme.colors.text.muted }}
                          >
                            {setMeal.description}
                          </p>
                        )}
                      </div>

                      {/* Features */}
                      <div 
                        className="flex items-center gap-4 text-sm"
                        style={{ color: PremiumTheme.colors.text.secondary }}
                      >
                        <div className="flex items-center gap-1">
                          <Users className="w-4 h-4" style={{ color: PremiumTheme.colors.burgundy[500] }} />
                          <span>Perfect for sharing</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <ChefHat className="w-4 h-4" style={{ color: PremiumTheme.colors.burgundy[500] }} />
                          <span>Chef's selection</span>
                        </div>
                      </div>

                      {/* CTA Button */}
                      <Button
                        onClick={() => loadSetMealDetails(setMeal.id)}
                        disabled={loadingDetails}
                        className="w-full border-0 transition-all duration-300 group"
                        style={{
                          background: `linear-gradient(to right, ${PremiumTheme.colors.burgundy[500]}, ${PremiumTheme.colors.burgundy[400]})`,
                          color: PremiumTheme.colors.text.primary
                        }}
                      >
                        <span className="flex items-center justify-center gap-2">
                          {loadingDetails ? (
                            <div 
                              className="animate-spin rounded-full h-4 w-4 border-b-2"
                              style={{ borderColor: PremiumTheme.colors.text.primary }}
                            />
                          ) : (
                            <>
                              <span>View Details</span>
                              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                            </>
                          )}
                        </span>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </AnimatedSection>
          )}
        </div>
      </section>

      {/* Set Meal Details Dialog */}
      <Dialog open={showDetails} onOpenChange={setShowDetails}>
        <DialogContent 
          className="max-w-4xl max-h-[90vh] overflow-y-auto border"
          style={{
            background: PremiumTheme.colors.background.primary,
            borderColor: PremiumTheme.colors.border.medium,
            color: PremiumTheme.colors.text.primary
          }}
        >
          {selectedSetMeal && (
            <>
              <DialogHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <DialogTitle 
                      className="text-2xl font-serif mb-2"
                      style={{ color: PremiumTheme.colors.text.primary }}
                    >
                      {selectedSetMeal.name}
                    </DialogTitle>
                    {selectedSetMeal.description && (
                      <DialogDescription 
                        className="text-base"
                        style={{ color: PremiumTheme.colors.text.secondary }}
                      >
                        {selectedSetMeal.description}
                      </DialogDescription>
                    )}
                  </div>
                  <Badge 
                    className="border-0 px-4 py-2 text-lg font-bold ml-4"
                    style={{
                      background: PremiumTheme.colors.burgundy[500],
                      color: PremiumTheme.colors.text.primary
                    }}
                  >
                    £{selectedSetMeal.set_price.toFixed(2)}
                  </Badge>
                </div>
              </DialogHeader>

              <div className="space-y-6">
                {/* Hero Image */}
                {selectedSetMeal.hero_image_url && (
                  <div className="relative h-64 rounded-lg overflow-hidden">
                    <img 
                      src={selectedSetMeal.hero_image_url} 
                      alt={selectedSetMeal.name}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                  </div>
                )}

                {/* Included Items */}
                <div>
                  <h3 
                    className="text-xl font-semibold mb-4 flex items-center gap-2"
                    style={{ color: PremiumTheme.colors.text.primary }}
                  >
                    <Heart className="w-5 h-5" style={{ color: PremiumTheme.colors.burgundy[500] }} />
                    What's Included
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {selectedSetMeal.items?.map((item, index) => (
                      <div 
                        key={`${item.id}-${index}`} 
                        className="flex items-start gap-3 p-3 rounded-lg border"
                        style={{
                          background: `${PremiumTheme.colors.background.secondary}80`,
                          borderColor: PremiumTheme.colors.border.light
                        }}
                      >
                        {item.image_url && (
                          <img 
                            src={item.image_url} 
                            alt={item.name}
                            className="w-12 h-12 object-cover rounded-lg flex-shrink-0"
                          />
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <h4 
                              className="font-medium text-sm truncate"
                              style={{ color: PremiumTheme.colors.text.primary }}
                            >{item.name}</h4>
                            {item.quantity > 1 && (
                              <Badge 
                                variant="outline" 
                                className="text-xs px-2 py-0.5"
                                style={{
                                  borderColor: PremiumTheme.colors.border.medium,
                                  color: PremiumTheme.colors.text.secondary
                                }}
                              >
                                {item.quantity}x
                              </Badge>
                            )}
                          </div>
                          {item.description && (
                            <p 
                              className="text-xs mt-1 line-clamp-2"
                              style={{ color: PremiumTheme.colors.text.muted }}
                            >
                              {item.description}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Pricing Information */}
                {selectedSetMeal.total_individual_price && selectedSetMeal.total_individual_price > selectedSetMeal.set_price && (
                  <div 
                    className="rounded-lg p-4 border"
                    style={{
                      background: `${PremiumTheme.colors.burgundy[500]}20`,
                      borderColor: `${PremiumTheme.colors.burgundy[400]}30`
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p style={{ color: PremiumTheme.colors.text.secondary }} className="text-sm">Individual items total:</p>
                        <p 
                          style={{ color: PremiumTheme.colors.text.muted }} 
                          className="line-through"
                        >£{selectedSetMeal.total_individual_price.toFixed(2)}</p>
                      </div>
                      <div className="text-right">
                        <p 
                          style={{ color: PremiumTheme.colors.burgundy[400] }} 
                          className="text-sm font-medium"
                        >
                          You save £{(selectedSetMeal.total_individual_price - selectedSetMeal.set_price).toFixed(2)}
                        </p>
                        <p 
                          style={{ color: PremiumTheme.colors.text.primary }} 
                          className="text-lg font-bold"
                        >£{selectedSetMeal.set_price.toFixed(2)}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Add to Cart Button */}
                <div className="flex gap-3 pt-4">
                  <Button
                    onClick={() => setShowDetails(false)}
                    variant="outline"
                    className="flex-1"
                    style={{
                      borderColor: PremiumTheme.colors.border.medium,
                      color: PremiumTheme.colors.text.secondary,
                      backgroundColor: 'transparent'
                    }}
                  >
                    Close
                  </Button>
                  <Button
                    onClick={() => handleAddToCart(selectedSetMeal)}
                    className="flex-2 border-0"
                    style={{
                      background: `linear-gradient(to right, ${PremiumTheme.colors.burgundy[500]}, ${PremiumTheme.colors.burgundy[400]})`,
                      color: PremiumTheme.colors.text.primary
                    }}
                  >
                    Add to Cart - £{selectedSetMeal.set_price.toFixed(2)}
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

// Memoization with custom comparison function
const arePropsEqual = (prevProps: SetMealsSectionProps, nextProps: SetMealsSectionProps) => {
  return prevProps.userRole === nextProps.userRole;
};

export const SetMealsSection = memo(SetMealsSectionComponent, arePropsEqual);
export default SetMealsSection;
