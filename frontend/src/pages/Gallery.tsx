import { useState, useEffect } from "react";
import { FaChevronLeft, FaChevronRight, FaTimes, FaExpand, FaCompress, FaCamera, FaUtensils, FaBuilding } from "react-icons/fa";
import { AnimatePresence } from "framer-motion";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UniversalHeader } from "components/UniversalHeader";
import { Footer } from "components/Footer";
import { GalleryItem } from "components/GalleryItem";
import { Lightbox } from "components/Lightbox";
import { AnimatedSection } from "components/AnimatedSection";
import { PremiumTheme } from "utils/premiumTheme";
import { galleryImages, GalleryImage } from "utils/galleryData";
import brain from "brain";
import { useNavigate } from "react-router-dom"; // FIXED: Add useNavigate import

export default function Gallery() {
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [scrollPosition, setScrollPosition] = useState(0);
  const [allGalleryImages, setAllGalleryImages] = useState<GalleryImage[]>(galleryImages);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch real menu data and combine with venue images
  useEffect(() => {
    const fetchMenuData = async () => {
      try {
        setIsLoading(true);
        const response = await brain.get_real_menu_data();
        const menuData = await response.json();
        
        if (menuData && menuData.items) {
          // Convert menu items to gallery images - ONLY items with real image URLs
          const menuGalleryItems: GalleryImage[] = [];
          
          menuData.items.forEach((item: any, index: number) => {
            // Only include items that have a real image_url from database
            if (item.image_url && item.image_url.trim() !== '') {
              menuGalleryItems.push({
                id: 1000 + index, // Start from 1000 to avoid conflicts with venue images
                url: item.image_url,
                alt: item.name || 'Menu item',
                category: 'food',
                title: item.name
              });
            }
          });
          
          // Filter out mock food items (IDs 1-6) and keep venue images (IDs 7+)
          const venueImages = galleryImages.filter(img => img.category === 'venue');
          
          // Combine ONLY real menu items with venue images
          setAllGalleryImages([...menuGalleryItems, ...venueImages]);
          
        } else {
        }
      } catch (error) {
        console.error('Error fetching menu data:', error);
        // Keep default gallery on error
      } finally {
        setIsLoading(false);
      }
    };

    fetchMenuData();
  }, []);

  // Filter images by selected category
  const filteredImages = selectedCategory === "all" 
    ? allGalleryImages 
    : allGalleryImages.filter(img => img.category === selectedCategory);
  
  // Open lightbox with selected image
  const openLightbox = (imageId: number) => {
    const index = filteredImages.findIndex(img => img.id === imageId);
    setLightboxIndex(index);
    // Save current scroll position
    setScrollPosition(window.scrollY);
    // Prevent background scrolling
    document.body.style.overflow = "hidden";
  };
  
  // Close lightbox
  const closeLightbox = () => {
    setLightboxIndex(null);
    // Restore scrolling
    document.body.style.overflow = "";
    // Restore scroll position
    window.scrollTo(0, scrollPosition);
  };
  
  // Navigate lightbox
  const navigateLightbox = (direction: 'prev' | 'next') => {
    if (lightboxIndex === null) return;
    
    if (direction === 'prev') {
      setLightboxIndex(prev => 
        prev === 0 ? filteredImages.length - 1 : prev - 1
      );
    } else {
      setLightboxIndex(prev => 
        prev === filteredImages.length - 1 ? 0 : prev + 1
      );
    }
  };

  // Track scroll position for parallax effect
  const [offset, setOffset] = useState(0);
  useEffect(() => {
    const handleScroll = () => {
      setOffset(window.scrollY);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div 
      className="min-h-screen"
      style={{ background: PremiumTheme.colors.background.primary }}
    >
      {/* Universal Header */}
      <UniversalHeader context="PUBLIC_NAV" />
      
      {/* Hero header with parallax effect */}
      <div 
        className="h-[50dvh] md:h-[60dvh] relative flex items-center justify-center overflow-hidden pt-20"
        style={{
          backgroundImage: `linear-gradient(to bottom, rgba(0,0,0,0.6), rgba(0,0,0,0.6)), url("https://static.databutton.com/public/6d13cbb4-0d00-46ec-8ef0-98e0a8405532/BAR%202.jpg")`,
          backgroundPosition: `center ${50 + offset * 0.1}%`,
          backgroundSize: "cover",
        }}
      >
        <div className="absolute inset-0 bg-black/40"></div>
        <div className="container mx-auto px-4 relative z-10 text-center">
          <AnimatedSection threshold={0.2}>
            <h1 
              className="text-5xl md:text-6xl mb-4"
              style={{ 
                fontFamily: PremiumTheme.typography.fontFamily.serif,
                color: PremiumTheme.colors.text.primary 
              }}
            >
              Gallery
            </h1>
            <p 
              className="text-xl max-w-2xl mx-auto"
              style={{ color: PremiumTheme.colors.text.secondary }}
            >
              Experience the ambiance, flavors, and memorable moments at Cottage Tandoori through our visual journey.
            </p>
          </AnimatedSection>
        </div>
      </div>
      
      {/* Gallery section */}
      <section className="py-20 px-4">
        <div className="container mx-auto">
          {/* Category filters using Tabs */}
          <div className="mb-12">
            <Tabs 
              defaultValue="all" 
              value={selectedCategory}
              onValueChange={setSelectedCategory}
              className="w-full max-w-3xl mx-auto"
            >
              <TabsList 
                className="grid grid-cols-3 p-1 border mb-6 rounded-xl overflow-hidden"
                style={{
                  background: 'rgba(255, 255, 255, 0.05)',
                  backdropFilter: 'blur(10px)',
                  borderColor: PremiumTheme.colors.border.light
                }}
              >
                <TabsTrigger 
                  value="all" 
                  className="flex items-center justify-center gap-2 transition-all duration-300 data-[state=active]:bg-[rgb(139,21,56)] data-[state=active]:text-white"
                  style={{
                    color: PremiumTheme.colors.text.secondary,
                    fontFamily: PremiumTheme.typography.fontFamily.sans
                  }}
                >
                  <FaCamera className="hidden sm:inline" />
                  <span>All</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="food" 
                  className="flex items-center justify-center gap-2 transition-all duration-300 data-[state=active]:bg-[rgb(139,21,56)] data-[state=active]:text-white"
                  style={{
                    color: PremiumTheme.colors.text.secondary,
                    fontFamily: PremiumTheme.typography.fontFamily.sans
                  }}
                >
                  <FaUtensils className="hidden sm:inline" />
                  <span>Food</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="venue" 
                  className="flex items-center justify-center gap-2 transition-all duration-300 data-[state=active]:bg-[rgb(139,21,56)] data-[state=active]:text-white"
                  style={{
                    color: PremiumTheme.colors.text.secondary,
                    fontFamily: PremiumTheme.typography.fontFamily.sans
                  }}
                >
                  <FaBuilding className="hidden sm:inline" />
                  <span>Venue</span>
                </TabsTrigger>
              </TabsList>
              
              <div className="text-center mb-8">
                <p style={{ color: PremiumTheme.colors.text.muted }}>
                  Explore our {selectedCategory === "all" ? "complete collection" : selectedCategory} gallery featuring {filteredImages.length} stunning {selectedCategory === "all" ? "photos" : `${selectedCategory} photos`}.
                </p>
              </div>
            </Tabs>
          </div>
          
          {/* Gallery grid with masonry layout */}
          <AnimatedSection threshold={0.1}>
            {isLoading ? (
              <div className="text-center py-20">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[rgb(139,21,56)] mx-auto mb-4"></div>
                <p style={{ color: PremiumTheme.colors.text.muted }}>Loading gallery...</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                <AnimatePresence>
                  {filteredImages.map(image => (
                    <GalleryItem 
                      key={image.id} 
                      image={image} 
                      onClick={openLightbox} 
                    />
                  ))}
                </AnimatePresence>
              </div>
            )}
          </AnimatedSection>
          
          {/* If no images match the filter */}
          {filteredImages.length === 0 && (
            <div className="text-center py-20">
              <p 
                className="text-xl"
                style={{ color: PremiumTheme.colors.text.muted }}
              >
                No images found in this category.
              </p>
            </div>
          )}
        </div>
      </section>
      
      {/* Lightbox dialog */}
      {lightboxIndex !== null && (
        <Lightbox 
          images={filteredImages}
          currentIndex={lightboxIndex}
          onClose={closeLightbox}
          onNavigate={navigateLightbox}
        />
      )}
      
      <Footer />
    </div>
  );
}
