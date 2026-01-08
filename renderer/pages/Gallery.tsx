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
import { apiClient } from 'app';
import { useNavigate } from "react-router-dom"; // FIXED: Add useNavigate import
import PreviewBanner from "components/PreviewBanner";
import { isPreviewMode, getPreviewMode } from "utils/previewMode";
import { motion } from "framer-motion";

export default function Gallery() {
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [scrollPosition, setScrollPosition] = useState(0);
  const [allGalleryImages, setAllGalleryImages] = useState<GalleryImage[]>(galleryImages);
  const [isLoading, setIsLoading] = useState(true);

  // Content state
  const [contentLoading, setContentLoading] = useState(true);
  const [heroTitle, setHeroTitle] = useState("Gallery");
  const [heroSubtitle, setHeroSubtitle] = useState("Explore our culinary artistry and elegant dining atmosphere");

  // Load hero content based on preview mode
  useEffect(() => {
    const loadContent = async () => {
      try {
        setContentLoading(true);
        const mode = getPreviewMode();
        
        // Determine which endpoint to call based on mode
        const response = mode === 'draft'
          ? await apiClient.get_all_draft_content({ page: 'gallery' })
          : await apiClient.get_published_content({ page: 'gallery' });
        
        const data = await response.json();
        
        if (data.success && data.items) {
          // Extract hero text content
          const heroTitleItem = data.items.find((item: any) => 
            item.section === 'hero' && item.label === 'title'
          );
          if (heroTitleItem) {
            const value = mode === 'draft' ? heroTitleItem.draft_value : heroTitleItem.published_value;
            if (value) setHeroTitle(value);
          }
          
          const heroSubtitleItem = data.items.find((item: any) => 
            item.section === 'hero' && item.label === 'subtitle'
          );
          if (heroSubtitleItem) {
            const value = mode === 'draft' ? heroSubtitleItem.draft_value : heroSubtitleItem.published_value;
            if (value) setHeroSubtitle(value);
          }
        }
      } catch (error) {
        console.error('Failed to load page content:', error);
        // Fall back to defaults on error
      } finally {
        setContentLoading(false);
      }
    };

    loadContent();
  }, []);

  // Fetch real menu data and combine with venue images
  useEffect(() => {
    const fetchMenuData = async () => {
      try {
        setIsLoading(true);
        const response = await apiClient.get_real_menu_data();
        const menuData = await response.json();
        
        if (menuData && menuData.items) {
          // Convert menu items to gallery images - ONLY items with real image URLs
          const menuGalleryItems: GalleryImage[] = [];
          
          menuData.items.forEach((item: any, index: number) => {
            // Only include items that have a real image_url from database
            if (item.image_url && item.image_url.trim() !== '') {
              menuGalleryItems.push({
                id: 1000 + index, // Start from 1000 to avoid conflicts with venue images
                src: item.image_url,
                alt: `${item.name} - authentic dish`,
                category: "food" as const,
                title: item.name,
                description: item.description || item.detailed_description || `Delicious ${item.name} prepared with authentic spices`
              });
            }
          });
          
          // Filter out mock food items (IDs 1-6) and keep venue images (IDs 7+)
          const venueImages = galleryImages.filter(img => img.category === 'venue');
          
          // Combine ONLY real menu items with venue images
          setAllGalleryImages([...menuGalleryItems, ...venueImages]);
          
          console.log(`Loaded ${menuGalleryItems.length} menu items with real images for gallery`);
        } else {
          console.warn('No menu data found, using default gallery');
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
      {/* Preview Mode Banner */}
      <PreviewBanner />
      
      {/* Universal Header */}
      <UniversalHeader context="PUBLIC_NAV" />
      
      {/* Hero header with parallax effect */}
      <div 
        className="h-[50vh] md:h-[60vh] relative flex items-center justify-center overflow-hidden pt-20"
        style={{
          backgroundImage: `linear-gradient(to bottom, rgba(0,0,0,0.6), rgba(0,0,0,0.6)), url("https://static.riff.new/public/88a315b0-faa2-491d-9215-cf1e283cdee2/BAR%202.jpg")`,
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
              {heroTitle}
            </h1>
            <p 
              className="text-xl max-w-2xl"
              style={{ color: PremiumTheme.colors.text.secondary }}
            >
              {heroSubtitle}
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
