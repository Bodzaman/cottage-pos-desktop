import React, { useEffect, useState, memo, useRef } from "react";
import { apiClient } from "app";
import { SignatureDish, VariantInfo } from "utils/menuTypes";
import { PremiumTheme } from "../utils/premiumTheme";
import DishDetailsModal from "components/DishDetailsModal";

interface Tag {
  name: string;
  color: string;
  icon: string;
}

const sizing = {
  containerClass: "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6",
  cardClass: "w-full",
  imageHeight: "h-48",
  titleSize: "text-2xl",
  descriptionSize: "text-sm",
  padding: "p-6"
};

const SignatureDishSectionComponent: React.FC = () => {
  const [dishes, setDishes] = useState<SignatureDish[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentVariantIndex, setCurrentVariantIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [expandedDishes, setExpandedDishes] = useState<Set<string>>(new Set());
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const [selectedDish, setSelectedDish] = useState<SignatureDish | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    const fetchDishes = async () => {
      try {
        setLoading(true);
        const response = await apiClient.view_menu_items_with_variants();
        const data = await response.json();

        if (data.success && data.menu_items) {
          // NEW LOGIC: Build flattened list of featured variants
          const featuredVariants: SignatureDish[] = [];
          
          for (const item of data.menu_items) {
            const baseFeatured = item.featured === true;
            const hasVariants = item.variants && item.variants.length > 0;
            
            if (!hasVariants) {
              // Single item (no variants) - use base featured flag
              if (baseFeatured) {
                const prices = [item.price].filter(p => p != null);
                const minPrice = prices.length > 0 ? prices[0] : 0;
                
                featuredVariants.push({
                  id: item.id,
                  title: item.name,
                  description: item.description || 'Delicious dish prepared with traditional spices and cooking methods.',
                  main_image: item.image_url || 'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
                  spice_level: 0,
                  tags: ['signature'],
                  category: 'house-special',
                  price: { 'Standard': `£${minPrice.toFixed(2)}` },
                  has_variants: false,
                  variants: []
                } as SignatureDish);
              }
            } else {
              // Item with variants - apply combined logic
              const variants = item.variants;
              const featuredVariantsList = variants.filter(v => v.featured === true);
              
              if (baseFeatured && featuredVariantsList.length === 0) {
                // Base featured ON + No variant featured → Show all variants
                for (const variant of variants) {
                  featuredVariants.push({
                    id: `${item.id}-${variant.id}`,
                    title: `${item.name} (${variant.name || variant.variant_name})`,
                    description: variant.description || item.description || 'Delicious dish prepared with traditional spices and cooking methods.',
                    main_image: variant.image_url || item.image_url || 'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
                    spice_level: 0,
                    tags: ['signature'],
                    category: 'house-special',
                    price: { 'Standard': `£${(variant.price || 0).toFixed(2)}` },
                    has_variants: false,
                    variants: []
                  } as SignatureDish);
                }
              } else if (featuredVariantsList.length > 0) {
                // Variant featured ON → Show only featured variants (base flag doesn't matter)
                for (const variant of featuredVariantsList) {
                  featuredVariants.push({
                    id: `${item.id}-${variant.id}`,
                    title: `${item.name} (${variant.name || variant.variant_name})`,
                    description: variant.description || item.description || 'Delicious dish prepared with traditional spices and cooking methods.',
                    main_image: variant.image_url || item.image_url || 'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
                    spice_level: 0,
                    tags: ['signature'],
                    category: 'house-special',
                    price: { 'Standard': `£${(variant.price || 0).toFixed(2)}` },
                    has_variants: false,
                    variants: []
                  } as SignatureDish);
                }
              }
              // Both OFF → Item not featured (skip)
            }
          }
          
          setDishes(featuredVariants);
          setError(null);
        } else {
          setDishes([]);
          setError(null);
        }
      } catch (err) {
        console.error("Error fetching featured menu items:", err);
        setError("Failed to load signature dishes");
        setDishes([]);
      } finally {
        setLoading(false);
      }
    };

    fetchDishes();
  }, []);

  // Autoplay functionality
  useEffect(() => {
    if (!isPaused && dishes.length > 0) {
      const interval = setInterval(() => {
        setCurrentVariantIndex((prev) => (prev + 1) % dishes.length);
      }, 3500); // 3.5 second intervals

      return () => clearInterval(interval);
    }
  }, [dishes, isPaused]);

  // Price formatting logic
  const getPriceDisplay = (dish: SignatureDish) => {
    if (!dish.variants || dish.variants.length === 0) {
      const priceValue = parseFloat(Object.values(dish.price)[0]?.replace('£', ''));
      return priceValue > 0 ? `£${priceValue.toFixed(2)}` : null;
    }
    
    const prices = dish.variants.map(v => v.price).filter(p => p != null && p > 0);
    if (prices.length === 0) return null;
    
    const minPrice = Math.min(...prices);

    if (prices.length > 1) {
      return `from £${minPrice.toFixed(2)}`;
    }
    return `£${minPrice.toFixed(2)}`;
  };

  // Get current image for cycling
  const getCurrentImage = (dish: SignatureDish, variantIndex: number) => {
    if (!dish.has_variants || dish.variants.length === 0) {
      return dish.main_image;
    }

    const variant = dish.variants[variantIndex % dish.variants.length];
    return variant?.image_url || dish.main_image;
  };

  // Get spice level display as visual chili peppers
  const getSpiceLevelDisplay = (level: number) => {
    if (level === 0 || level === undefined || level === null) {
      return null; // No display for mild/no spice
    }

    const peppers = '🌶️'.repeat(Math.min(level, 4)); // Max 4 peppers
    return peppers;
  };
  const getProgressIndicators = (dish: SignatureDish) => {
    if (!dish.has_variants || dish.variants.length <= 1) return null;

    return (
      <div className="absolute bottom-3 left-1/2 transform -translate-x-1/2 flex space-x-1.5">
        {dish.variants.map((_, index) => (
          <div 
            key={index}
            className={`w-2 h-2 rounded-full transition-all duration-300 ${
              index === (currentVariantIndex % dish.variants.length)
                ? 'bg-white shadow-lg scale-110' 
                : 'bg-white/40'
            }`}
          />
        ))}
      </div>
    );
  };

  const handleOpenModal = (dish: SignatureDish) => {
    setSelectedDish(dish);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedDish(null);
  };

  // Enhanced card with synchronized animations
  const DishCard = ({ dish, index }: { dish: SignatureDish; index: number }) => {
    const [isHovered, setIsHovered] = useState(false);
    const descriptionRef = useRef<HTMLParagraphElement>(null);
    const [canExpand, setCanExpand] = useState(false);
    const descriptionId = `description-${dish.id}`;
    const isExpanded = expandedDishes.has(dish.id);

    useEffect(() => {
      const checkOverflow = () => {
        const el = descriptionRef.current;
        if (el) {
          // Temporarily collapse to measure natural height
          const wasExpanded = isExpanded;
          if (wasExpanded) {
            el.style.webkitLineClamp = '3';
            el.style.maxHeight = 'calc(1.5em * 3)';
          }
          
          const isOverflowing = el.scrollHeight > el.clientHeight;
          setCanExpand(isOverflowing);
          
          // Restore expanded state if it was expanded
          if (wasExpanded) {
            el.style.webkitLineClamp = 'unset';
            el.style.maxHeight = '1000px';
          }
        }
      };

      checkOverflow();
      
      // Check on window resize
      window.addEventListener('resize', checkOverflow);
      return () => window.removeEventListener('resize', checkOverflow);
    }, [dish.description, isExpanded]);

    const toggleExpanded = () => {
      setExpandedDishes(prev => {
        const newSet = new Set(prev);
        if (newSet.has(dish.id)) {
          newSet.delete(dish.id);
        } else {
          newSet.add(dish.id);
        }
        return newSet;
      });
    };

    const priceDisplay = getPriceDisplay(dish);

    return (
      <div 
        className={`rounded-2xl overflow-hidden backdrop-blur-md border
                  hover:shadow-xl transition-all duration-300 ease-in-out 
                  hover:scale-105 h-full flex flex-col ${sizing.cardClass}`}
        style={{ 
          background: PremiumTheme.colors.background.card,
          borderColor: PremiumTheme.colors.border.light,
          animationDelay: `${index * 100}ms`,
        }}
        data-aos="fade-up"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Synchronized Image with Crossfade */}
        <div 
          className={`relative ${sizing.imageHeight} overflow-hidden`}>
          <div className="relative w-full h-full">
            <img 
              src={getCurrentImage(dish, currentVariantIndex)} 
              alt={dish.title}
              className="absolute inset-0 w-full h-full object-cover transition-all duration-700 ease-in-out"
              style={{
                opacity: 1,
                transform: isHovered ? 'scale(1.1)' : 'scale(1)'
              }}
            />

            {/* Smooth crossfade overlay for image transitions */}
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/20" />
          </div>

          {/* Progress Indicators */}
          {getProgressIndicators(dish)}

          {/* Category Badge */}
          <div className="absolute top-3 right-3">
            <span 
              className="backdrop-blur-sm text-xs px-3 py-1.5 rounded-full font-medium border"
              style={{
                background: `${PremiumTheme.colors.background.primary}B8`,
                color: PremiumTheme.colors.text.primary,
                borderColor: PremiumTheme.colors.border.light
              }}
            >
              {dish.category}
            </span>
          </div>

          {/* Current Variant Display */}
          {dish.has_variants && dish.variants.length > 0 && (
            <div className="absolute top-3 left-3">
              <span 
                className="backdrop-blur-sm text-xs px-3 py-1.5 rounded-full font-medium border"
                style={{
                  background: `${PremiumTheme.colors.burgundy[500]}CC`,
                  color: PremiumTheme.colors.text.primary,
                  borderColor: `${PremiumTheme.colors.burgundy[400]}4D`
                }}
              >
                {dish.variants[currentVariantIndex % dish.variants.length]?.variant_name || 'Featured'}
              </span>
            </div>
          )}

          {/* Spice Level Display */}
          {dish.spice_level && dish.spice_level > 0 && (
            <div className="absolute bottom-12 left-3">
              <span 
                className="backdrop-blur-sm text-sm px-3 py-1.5 rounded-full font-medium border flex items-center gap-1"
                style={{
                  background: `${PremiumTheme.colors.background.primary}B8`,
                  color: PremiumTheme.colors.text.primary,
                  borderColor: '#ef444480'
                }}
              >
                <span>{getSpiceLevelDisplay(dish.spice_level)}</span>
              </span>
            </div>
          )}

          {/* View Details Button (on hover) */}
          <div className={`absolute inset-0 backdrop-blur-sm transition-all duration-300 flex items-center justify-center ${isHovered ? "opacity-100 z-10" : "opacity-0 -z-10"}`}
          style={{ background: `${PremiumTheme.colors.background.primary}66` }}
          >
            <button
              onClick={() => handleOpenModal(dish)}
              className="backdrop-blur-sm text-white px-6 py-3 rounded-full font-medium transition-all duration-200 transform hover:scale-105"
              style={{
                background: `${PremiumTheme.colors.background.primary}33`,
                border: `1px solid ${PremiumTheme.colors.border.light}`
              }}
            >
              View Details
            </button>
          </div>

        </div>

        {/* Text content below image */}
        <div className={`${sizing.padding} pt-5`}>
          <div className="flex justify-between items-start mb-2">
            <h3 
              className={`${sizing.titleSize} font-playfair font-semibold leading-tight flex-1`}
              style={{ color: PremiumTheme.colors.text.primary }}
            >
              {dish.title}
            </h3>
            {priceDisplay && (
              <span 
                className="text-lg font-semibold whitespace-nowrap ml-4"
                style={{ color: PremiumTheme.colors.burgundy[400] }}
              >
                {priceDisplay}
              </span>
            )}
          </div>
          <div className="flex-1 relative">
            <p 
              ref={descriptionRef}
              id={descriptionId}
              className={`${sizing.descriptionSize} font-lora leading-relaxed transition-all duration-300 ease-in-out`}
              style={{ 
                color: PremiumTheme.colors.text.secondary,
                maxHeight: isExpanded ? '1000px' : 'calc(1.5em * 3)', // 3 lines desktop
                overflow: 'hidden',
                WebkitLineClamp: isExpanded ? 'unset' : window.innerWidth < 640 ? 2 : 3, // 2 lines mobile, 3 desktop
                display: '-webkit-box',
                WebkitBoxOrient: 'vertical',
              }}
            >
              {dish.description}
            </p>
            {canExpand && (
              <button
                onClick={toggleExpanded}
                className="text-sm font-medium mt-2 hover:underline focus:outline-none focus:ring-2 focus:ring-offset-2 relative z-20"
                style={{ 
                  color: PremiumTheme.colors.burgundy[400],
                  focusRingColor: PremiumTheme.colors.burgundy[400]
                }}
                aria-expanded={isExpanded}
                aria-controls={descriptionId}
              >
                {isExpanded ? "Show less" : "Read more"}
              </button>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="py-16 md:py-24 relative" style={{ background: PremiumTheme.colors.background.primary }}>
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div 
          className="text-center mb-12"
          style={{ color: PremiumTheme.colors.text.primary }}
        >
          <h2 
            className="text-4xl font-serif uppercase tracking-[1.5px] inline-block"
            style={{ color: PremiumTheme.colors.text.primary }}
          >
            Signature Dishes
          </h2>
          <div 
            className="w-24 h-[1px] mx-auto mt-4"
            style={{ background: PremiumTheme.colors.border.medium }}
          ></div>
          <p 
            className="mt-4 max-w-2xl mx-auto"
            style={{ color: PremiumTheme.colors.text.muted }}
          >
            Experience our chef's masterful creations that blend traditional Indian flavors with modern culinary techniques.
          </p>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div 
              className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 mb-4"
              style={{ borderColor: PremiumTheme.colors.silver[500] }}
            ></div>
            <p style={{ color: PremiumTheme.colors.text.muted }} className="text-sm">Loading signature dishes...</p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="text-4xl mb-4">⚠️</div>
            <h3 
              className="text-lg font-serif mb-2"
              style={{ color: PremiumTheme.colors.text.primary }}
            >Unable to Load Signature Dishes</h3>
            <p 
              className="max-w-md"
              style={{ color: PremiumTheme.colors.text.muted }}
            >{error}</p>
          </div>
        ) : dishes.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="text-5xl mb-4 animate-pulse">🍽️</div>
            <h3 
              className="text-xl font-serif mb-2"
              style={{ color: PremiumTheme.colors.text.primary }}
            >No Signature Dishes Available</h3>
            <p 
              className="max-w-md"
              style={{ color: PremiumTheme.colors.text.muted }}
            >Our chef is preparing something special. Please check back later or explore our full menu.</p>
          </div>
        ) : (
          <div className={sizing.containerClass}>
            {dishes.map((dish, index) => (
              <DishCard key={dish.title} dish={dish} index={index} />
            ))}
          </div>
        )}
      </div>
      <DishDetailsModal 
        dish={selectedDish}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
      />
    </div>
  );
};

export default memo(SignatureDishSectionComponent);
