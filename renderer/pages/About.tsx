import { useState, useEffect } from "react";
import { FaUtensils, FaTrophy, FaHeart, FaClock, FaMapMarkerAlt, FaPhone, FaEnvelope, FaAward, FaStar, FaSearch } from "react-icons/fa";
import { motion } from "framer-motion";
import { UniversalHeader } from "components/UniversalHeader";
import { Footer } from "components/Footer";
import { PremiumTheme } from "utils/premiumTheme";
import { Input } from "@/components/ui/input";
import { Link, useNavigate } from "react-router-dom";
import { useSimpleAuth } from "utils/simple-auth-context";
import { apiClient } from 'app';
import PreviewBanner from "components/PreviewBanner";
import { isPreviewMode, getPreviewMode, usePreviewMode } from "utils/previewMode";

export default function About() {
  const { isAdmin } = useSimpleAuth();
  const navigate = useNavigate();
  const [selectedArticle, setSelectedArticle] = useState<number | null>(null);
  const [zoomLevel, setZoomLevel] = useState<number>(100);

  // Content state
  const [contentLoading, setContentLoading] = useState(true);
  const [heroTitle, setHeroTitle] = useState("Our Story");
  const [heroSubtitle, setHeroSubtitle] = useState("Discover the heritage, passion, and people behind Cottage Tandoori's four decades of authentic Indian cuisine.");
  const [heroImage, setHeroImage] = useState<string>("https://static.riff.new/public/88a315b0-faa2-491d-9215-cf1e283cdee2/MAIN RESTAURANT EXTERIOR .jpg");

  // Load content based on preview mode
  useEffect(() => {
    const loadContent = async () => {
      try {
        setContentLoading(true);
        const mode = getPreviewMode();
        
        // Determine which endpoint to call based on mode
        const response = mode === 'draft'
          ? await apiClient.get_all_draft_content({ page: 'about' })
          : await apiClient.get_published_content({ page: 'about' });
        
        const data = await response.json();
        
        if (data.success && data.items) {
          // Update hero image
          const heroItem = data.items.find((item: any) => item.section === 'hero' && item.type === 'image');
          if (heroItem?.draft_media_url) {
            setHeroImage(heroItem.draft_media_url); // ✅ Decode URL
          }
          
          // Update heritage grid
          const heritageItems = data.items
            .filter((item: any) => item.section === 'heritage_grid' && item.type === 'image')
            .sort((a: any, b: any) => a.display_order - b.display_order)
            .slice(0, 4);
          if (heritageItems.length > 0) {
            const heritageUrls = heritageItems
              .map((item: any) => item.draft_media_url)
              .filter(Boolean)
              .map((url: any) => url); // ✅ Decode URLs
            if (heritageUrls.length > 0) {
              setHeritageImages(heritageUrls);
            }
          }
          
          // Update timeline background
          const timelineBgItem = data.items.find((item: any) => item.section === 'timeline_background' && item.type === 'image');
          if (timelineBgItem?.draft_media_url) {
            setTimelineBackground(timelineBgItem.draft_media_url); // ✅ Decode URL
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

  useEffect(() => {
    // Scroll to top when component mounts
    window.scrollTo(0, 0);
  }, []);

  // Handler for zooming newspaper articles
  const handleZoom = (direction: 'in' | 'out') => {
    if (direction === 'in' && zoomLevel < 150) {
      setZoomLevel(prev => prev + 10);
    } else if (direction === 'out' && zoomLevel > 100) {
      setZoomLevel(prev => prev - 10);
    }
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: PremiumTheme.colors.background.primary, color: PremiumTheme.colors.text.primary }}>
      {/* Navbar */}
      <div className="Navbar">
        <UniversalHeader 
          context="PUBLIC_NAV"
          transparent={false}
          showAuthButtons={true}
          showCart={true}
          showThemeToggle={true}
        />
      </div>
      {/* Hero Section */}
      <section className="relative h-[40vh] md:h-[60vh] flex items-center">
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 z-10" style={{ backgroundColor: 'rgba(0, 0, 0, 0.6)' }}></div>
          <img 
            src={heroImage}
            alt="Cottage Tandoori Restaurant" 
            className="w-full h-full object-cover"
          />
        </div>
        <div className="container mx-auto px-4 relative z-20">
          <h1 className="text-4xl md:text-6xl font-serif mb-6" style={{ color: PremiumTheme.colors.text.primary }}>
            {heroTitle}
          </h1>
          <p className="text-xl max-w-xl" style={{ color: PremiumTheme.colors.text.secondary }}>
            {heroSubtitle}
          </p>
        </div>
      </section>

      {/* Restaurant Story Section */}
      <section className="py-16 px-4" style={{ backgroundColor: PremiumTheme.colors.background.primary }}>
        <div className="container mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div className="order-2 md:order-1">
              <h2 className="text-3xl font-serif mb-4" style={{ color: PremiumTheme.colors.text.primary }}>Our Heritage</h2>
              <div className="w-20 h-1 mb-6" style={{ backgroundColor: PremiumTheme.colors.burgundy[500] }}></div>
              <p className="mb-6" style={{ color: PremiumTheme.colors.text.secondary }}>
                Nestled in the charming village of Storrington West Sussex, we at The Cottage Tandoori have been proudly serving authentic Indian cuisine since 1980.
              </p>
              <p className="mb-6" style={{ color: PremiumTheme.colors.text.secondary }}>
                As a family-owned and operated restaurant, our goal has always been to bring the vibrant flavours of the Indian subcontinent to our community, all from our charming period flint cottage.
              </p>
              <p className="mb-6" style={{ color: PremiumTheme.colors.text.secondary }}>
                As one of the first Indian restaurants in the area, we take pride in being pioneers, introducing our guests to diverse Indian flavours and traditional cooking methods.
              </p>
              <p style={{ color: PremiumTheme.colors.text.secondary }}>
                Over the past four decades, we have been honoured with numerous accolades, a testament to both the quality of our menu and our commitment to excellent service. Today, we continue to be a cherished part of Storrington's dining scene, welcoming guests to experience the authentic tastes of India in a warm and inviting atmosphere.
              </p>
            </div>
            <div className="order-1 md:order-2 grid grid-cols-2 gap-4">
              <img 
                src="https://static.riff.new/public/88a315b0-faa2-491d-9215-cf1e283cdee2/INSIDE RESTAURANT IMAGE 1.png" 
                alt="Cottage Tandoori in the 1980s" 
                className="rounded-lg shadow-2xl w-full h-auto"
              />
              <img 
                src="https://static.riff.new/public/88a315b0-faa2-491d-9215-cf1e283cdee2/THALI OF SPICES.png" 
                alt="Traditional spices" 
                className="rounded-lg shadow-2xl w-full h-auto mt-12"
              />
              <img 
                src="https://static.riff.new/public/88a315b0-faa2-491d-9215-cf1e283cdee2/VERANDA VIEW.jpg" 
                alt="Restaurant view" 
                className="rounded-lg shadow-2xl w-full h-auto"
              />
              <img 
                src="https://static.riff.new/public/88a315b0-faa2-491d-9215-cf1e283cdee2/TABLE 6 STRIGHT VIEW.jpg" 
                alt="Cottage Tandoori today" 
                className="rounded-lg shadow-2xl w-full h-auto mt-12"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Core Values Section */}
      <section className="py-16 px-4" style={{ backgroundColor: PremiumTheme.colors.background.primary }}>
        <div className="container mx-auto">
          <h2 className="text-3xl font-serif text-center mb-4" style={{ color: PremiumTheme.colors.text.primary }}>Our Core Values</h2>
          <div className="w-20 h-1 mx-auto mb-16" style={{ backgroundColor: PremiumTheme.colors.burgundy[500] }}></div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div 
              className="p-8 rounded-lg border text-center transition-all duration-300 hover:scale-105 backdrop-blur-md"
              style={{ 
                backgroundColor: PremiumTheme.colors.background.secondary,
                borderColor: PremiumTheme.colors.border.light,
                boxShadow: PremiumTheme.shadows.elevation.lg
              }}
            >
              <div className="flex justify-center">
                <FaUtensils className="w-8 h-8 mb-4" style={{ color: PremiumTheme.colors.burgundy[500] }} />
              </div>
              <h3 className="text-2xl font-serif mb-4" style={{ color: PremiumTheme.colors.text.primary }}>Authenticity</h3>
              <p style={{ color: PremiumTheme.colors.text.secondary }}>We remain true to traditional recipes and cooking techniques passed down through generations.</p>
            </div>
            
            <div 
              className="p-8 rounded-lg border text-center transition-all duration-300 hover:scale-105 backdrop-blur-md"
              style={{ 
                backgroundColor: PremiumTheme.colors.background.secondary,
                borderColor: PremiumTheme.colors.border.light,
                boxShadow: PremiumTheme.shadows.elevation.lg
              }}
            >
              <div className="flex justify-center">
                <FaTrophy className="w-8 h-8 mb-4" style={{ color: PremiumTheme.colors.burgundy[500] }} />
              </div>
              <h3 className="text-2xl font-serif mb-4" style={{ color: PremiumTheme.colors.text.primary }}>Excellence</h3>
              <p style={{ color: PremiumTheme.colors.text.secondary }}>We strive for excellence in every dish we prepare and every service we provide.</p>
            </div>
            
            <div 
              className="p-8 rounded-lg border text-center transition-all duration-300 hover:scale-105 backdrop-blur-md"
              style={{ 
                backgroundColor: PremiumTheme.colors.background.secondary,
                borderColor: PremiumTheme.colors.border.light,
                boxShadow: PremiumTheme.shadows.elevation.lg
              }}
            >
              <div className="flex justify-center">
                <FaHeart className="w-8 h-8 mb-4" style={{ color: PremiumTheme.colors.burgundy[500] }} />
              </div>
              <h3 className="text-2xl font-serif mb-4" style={{ color: PremiumTheme.colors.text.primary }}>Community</h3>
              <p style={{ color: PremiumTheme.colors.text.secondary }}>We're proud to be part of the Storrington community and source ingredients locally whenever possible.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Timeline Section */}
      <section className="py-16 px-4 relative overflow-hidden" style={{ backgroundColor: PremiumTheme.colors.background.primary }}>
        <div className="absolute inset-0 opacity-10 bg-[url('https://static.riff.new/public/88a315b0-faa2-491d-9215-cf1e283cdee2/OLD NEWSPAPER ARTICLES COLLAGE.png')] bg-repeat"></div>
        
        <div className="container mx-auto relative z-10">
          <h2 className="text-3xl font-serif text-center mb-4" style={{ color: PremiumTheme.colors.text.primary }}>A Storied Legacy</h2>
          <div className="w-20 h-1 mx-auto mb-6" style={{ backgroundColor: PremiumTheme.colors.burgundy[500] }}></div>
          <p className="text-center text-xl max-w-3xl mx-auto mb-12" style={{ color: PremiumTheme.colors.text.secondary }}>Celebrating Decades of Culinary Excellence - Serving Great-Tasting Indian Food Since 1980</p>
          
          {/* Timeline */}
          <div className="relative">
            {/* Vertical line */}
            <div className="absolute left-1/2 transform -translate-x-1/2 h-full w-1" style={{ backgroundColor: PremiumTheme.colors.border.medium }}></div>
            
            {/* Articles Gallery */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                {
                  title: "A Taste of Tradition: The Art of Clay Oven Cooking",
                  year: "1982",
                  content: "This article showcased the authentic clay oven techniques that give the restaurant's dishes their unique flavour.",
                  image: "https://static.riff.new/public/88a315b0-faa2-491d-9215-cf1e283cdee2/OLD NEWSPAPER ARTICLES 1.png"
                },
                {
                  title: "The Legacy of Tandoori Cuisine at Cottage Tandoori",
                  year: "1985",
                  content: "This feature reflected on the family's dedication to preserving rich culinary traditions, emphasising the cultural depth and legacy behind each meal.",
                  image: "https://static.riff.new/public/88a315b0-faa2-491d-9215-cf1e283cdee2/OLD NEWSPAPER ARTICLES 2.png"
                },
                {
                  title: "Cottage Tandoori Earns Acclaim in Egon Ronay Guide",
                  year: "1987",
                  content: "This article marked a significant milestone with the restaurant's inclusion in the prestigious Egon Ronay Good Food Guide.",
                  image: "https://static.riff.new/public/88a315b0-faa2-491d-9215-cf1e283cdee2/OLD NEWSPAPER ARTICLES 3.png"
                },
                {
                  title: "The Refined Art of Tandoori Cuisine",
                  year: "1991",
                  content: "This article delved into the skills and techniques behind the restaurant's signature tandoori offerings, further affirming its commitment to excellence and authentic flavours.",
                  image: "https://static.riff.new/public/88a315b0-faa2-491d-9215-cf1e283cdee2/OLD NEWSPAPER ARTICLES 4.png"
                },
                {
                  title: "A Decade of Culinary Excellence",
                  year: "1990",
                  content: "This anniversary feature celebrated ten years of Cottage Tandoori's contribution to the local dining scene and its evolution over the years.",
                  image: "https://static.riff.new/public/88a315b0-faa2-491d-9215-cf1e283cdee2/OLD NEWSPAPER ARTICLES 5.png"
                },
                {
                  title: "Local Favorite Introduces New Menu",
                  year: "1989",
                  content: "This article announced the expansion of Cottage Tandoori's menu, introducing new regional specialties while maintaining their signature classics.",
                  image: "https://static.riff.new/public/88a315b0-faa2-491d-9215-cf1e283cdee2/OLD NEWSPAPER ARTICLES 6.png"
                },
                {
                  title: "The Spice Route: Exploring Indian Cuisine",
                  year: "1986",
                  content: "A feature that highlighted how Cottage Tandoori educated local diners about the diverse regional cuisines of India through their authentic menu offerings.",
                  image: "https://static.riff.new/public/88a315b0-faa2-491d-9215-cf1e283cdee2/OLD NEWSPAPER ARTICLES 7.png"
                }
              ].map((article, index) => (
                <div 
                  key={index} 
                  className="relative overflow-hidden rounded-lg cursor-pointer transition-all duration-300 hover:scale-105 group"
                  style={{ height: '450px', boxShadow: PremiumTheme.shadows.elevation.lg }}
                  onClick={() => setSelectedArticle(index)}
                >
                  {/* Newspaper as full background */}
                  <div className="absolute inset-0 bg-[#e8e6d9]">
                    <img 
                      src={article.image}
                      alt={article.title}
                      className="w-full h-full object-cover"
                    />
                    
                    {/* Vintage paper texture overlay */}
                    <div className="absolute inset-0 bg-[url('https://static.riff.new/public/88a315b0-faa2-491d-9215-cf1e283cdee2/paper-texture.jpg')] opacity-15 mix-blend-overlay pointer-events-none"></div>
                  </div>
                  
                  {/* Content overlay at bottom */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/60 to-transparent flex flex-col justify-end p-5 opacity-95 group-hover:opacity-100 transition-opacity">
                    <div className="backdrop-blur-sm p-3 rounded-lg" style={{ backgroundColor: 'rgba(0, 0, 0, 0.25)' }}>
                      <div className="text-sm font-serif mb-1" style={{ color: PremiumTheme.colors.burgundy[500] }}>{article.year}</div>
                      <h3 className="text-xl font-serif mb-2" style={{ color: PremiumTheme.colors.text.primary }}>{article.title}</h3>
                      <p className="text-sm line-clamp-2" style={{ color: PremiumTheme.colors.text.secondary }}>{article.content}</p>
                      <div className="mt-3 flex justify-end items-center">
                        <span className="text-sm mr-2" style={{ color: PremiumTheme.colors.text.muted }}>Click to view</span>
                        <FaSearch style={{ color: PremiumTheme.colors.text.muted }} />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
      
      {/* Modal for viewing newspaper articles */}
      {selectedArticle !== null && (
        <div className="fixed inset-0 z-50 backdrop-blur-xl flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0, 0, 0, 0.85)' }}>
          <div className="rounded-lg w-full max-w-4xl max-h-[90vh] overflow-hidden relative" style={{
            backgroundColor: PremiumTheme.colors.background.secondary,
            backdropFilter: 'blur(12px)',
            border: `1px solid ${PremiumTheme.colors.border.light}`,
            boxShadow: PremiumTheme.shadows.elevation.xl
          }}>
            <div className="p-4 border-b flex justify-between items-center" style={{
              borderColor: PremiumTheme.colors.border.light,
              backgroundColor: PremiumTheme.colors.background.tertiary,
              backdropFilter: 'blur(8px)'
            }}>
              <h3 className="text-xl font-serif truncate" style={{ color: PremiumTheme.colors.text.primary }}>
                {selectedArticle !== null && [
                  {
                    title: "A Taste of Tradition: The Art of Clay Oven Cooking",
                    year: "1982",
                    image: "https://static.riff.new/public/88a315b0-faa2-491d-9215-cf1e283cdee2/OLD NEWSPAPER ARTICLES 1.png"
                  },
                  {
                    title: "The Legacy of Tandoori Cuisine at Cottage Tandoori",
                    year: "1985",
                    image: "https://static.riff.new/public/88a315b0-faa2-491d-9215-cf1e283cdee2/OLD NEWSPAPER ARTICLES 2.png"
                  },
                  {
                    title: "Cottage Tandoori Earns Acclaim in Egon Ronay Guide",
                    year: "1987",
                    image: "https://static.riff.new/public/88a315b0-faa2-491d-9215-cf1e283cdee2/OLD NEWSPAPER ARTICLES 3.png"
                  },
                  {
                    title: "The Refined Art of Tandoori Cuisine",
                    year: "1991",
                    image: "https://static.riff.new/public/88a315b0-faa2-491d-9215-cf1e283cdee2/OLD NEWSPAPER ARTICLES 4.png"
                  },
                  {
                    title: "A Decade of Culinary Excellence",
                    year: "1990",
                    image: "https://static.riff.new/public/88a315b0-faa2-491d-9215-cf1e283cdee2/OLD NEWSPAPER ARTICLES 5.png"
                  },
                  {
                    title: "Local Favorite Introduces New Menu",
                    year: "1989",
                    image: "https://static.riff.new/public/88a315b0-faa2-491d-9215-cf1e283cdee2/OLD NEWSPAPER ARTICLES 6.png"
                  },
                  {
                    title: "The Spice Route: Exploring Indian Cuisine",
                    year: "1986",
                    image: "https://static.riff.new/public/88a315b0-faa2-491d-9215-cf1e283cdee2/OLD NEWSPAPER ARTICLES 7.png"
                  }
                ][selectedArticle].title}
              </h3>
              <button 
                onClick={() => setSelectedArticle(null)}
                className="text-2xl font-bold transition-colors"
                style={{ color: PremiumTheme.colors.text.muted }}
                onMouseEnter={(e) => e.currentTarget.style.color = PremiumTheme.colors.text.primary}
                onMouseLeave={(e) => e.currentTarget.style.color = PremiumTheme.colors.text.muted}
              >
                &times;
              </button>
            </div>
            
            <div className="p-6 overflow-auto max-h-[calc(90vh-4rem)]" style={{
              backgroundColor: PremiumTheme.colors.background.tertiary,
              backdropFilter: 'blur(8px)'
            }}>
              <div className="relative rounded-lg p-4" style={{
                backgroundColor: PremiumTheme.colors.background.secondary,
                backdropFilter: 'blur(6px)',
                border: `1px solid ${PremiumTheme.colors.border.light}`
              }}>
                {/* Zoom controls */}
                <div className="flex space-x-2 mb-4 items-center">
                  <div className="flex items-center space-x-2">
                    <button 
                      onClick={() => handleZoom('out')}
                      className="p-2 rounded-full disabled:opacity-50 transition-colors"
                      style={{
                        backgroundColor: PremiumTheme.colors.background.tertiary,
                        color: PremiumTheme.colors.text.primary,
                        border: `1px solid ${PremiumTheme.colors.border.light}`
                      }}
                      disabled={zoomLevel <= 100}
                    >
                      -
                    </button>
                    <span style={{ color: PremiumTheme.colors.text.primary }}>{zoomLevel}%</span>
                    <button 
                      onClick={() => handleZoom('in')}
                      className="p-2 rounded-full disabled:opacity-50 transition-colors"
                      style={{
                        backgroundColor: PremiumTheme.colors.background.tertiary,
                        color: PremiumTheme.colors.text.primary,
                        border: `1px solid ${PremiumTheme.colors.border.light}`
                      }}
                      disabled={zoomLevel >= 150}
                    >
                      +
                    </button>
                  </div>
                </div>
                
                {/* Newspaper article */}
                <div 
                  className="rounded-lg p-6 shadow-lg overflow-hidden" style={{
                    backgroundColor: PremiumTheme.colors.background.tertiary,
                    backdropFilter: 'blur(4px)',
                    border: `1px solid ${PremiumTheme.colors.border.light}`,
                    transform: `scale(${zoomLevel/100})`,
                    transformOrigin: 'top center'
                  }}
                >
                  <img 
                    src={selectedArticle !== null ? [
                      {
                        title: "A Taste of Tradition: The Art of Clay Oven Cooking",
                        image: "https://static.riff.new/public/88a315b0-faa2-491d-9215-cf1e283cdee2/OLD NEWSPAPER ARTICLES 1.png"
                      },
                      {
                        title: "The Legacy of Tandoori Cuisine at Cottage Tandoori",
                        image: "https://static.riff.new/public/88a315b0-faa2-491d-9215-cf1e283cdee2/OLD NEWSPAPER ARTICLES 2.png"
                      },
                      {
                        title: "Cottage Tandoori Earns Acclaim in Egon Ronay Guide",
                        image: "https://static.riff.new/public/88a315b0-faa2-491d-9215-cf1e283cdee2/OLD NEWSPAPER ARTICLES 3.png"
                      },
                      {
                        title: "The Refined Art of Tandoori Cuisine",
                        image: "https://static.riff.new/public/88a315b0-faa2-491d-9215-cf1e283cdee2/OLD NEWSPAPER ARTICLES 4.png"
                      },
                      {
                        title: "A Decade of Culinary Excellence",
                        image: "https://static.riff.new/public/88a315b0-faa2-491d-9215-cf1e283cdee2/OLD NEWSPAPER ARTICLES 5.png"
                      },
                      {
                        title: "Local Favorite Introduces New Menu",
                        image: "https://static.riff.new/public/88a315b0-faa2-491d-9215-cf1e283cdee2/OLD NEWSPAPER ARTICLES 6.png"
                      },
                      {
                        title: "The Spice Route: Exploring Indian Cuisine",
                        image: "https://static.riff.new/public/88a315b0-faa2-491d-9215-cf1e283cdee2/OLD NEWSPAPER ARTICLES 7.png"
                      }
                    ][selectedArticle].image : ''}
                    alt="Newspaper article"
                    className="w-full rounded-lg shadow-lg"
                  />
                  {/* Vintage paper texture overlay - made more subtle for dark theme */}
                  <div className="absolute inset-0 bg-[url('https://static.riff.new/public/88a315b0-faa2-491d-9215-cf1e283cdee2/paper-texture.jpg')] opacity-5 mix-blend-overlay pointer-events-none"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Our Team Section */}
      <section className="py-16 px-4" style={{ backgroundColor: PremiumTheme.colors.background.primary }}>
        <div className="container mx-auto">
          <h2 className="text-3xl font-serif text-center mb-4" style={{ color: PremiumTheme.colors.text.primary }}>Leadership & Culinary Excellence</h2>
          <div className="w-20 h-1 mx-auto mb-16" style={{ backgroundColor: PremiumTheme.colors.burgundy[500] }}></div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {[
              {
                id: 1,
                name: "Raj",
                role: "Manager",
                initials: "RM",
                image: "https://static.databutton.com/public/6d13cbb4-0d00-46ec-8ef0-98e0a8405532/ChatBot Avatar Image.jpg",
                description: "For over four decades, Raj has been the unwavering backbone of Cottage Tandoori. As both a manager and mentor, he has poured heart and soul into every corner of the restaurant — from welcoming generations of guests to nurturing a team that shares his passion for authentic Indian hospitality. Raj's deep commitment, warm presence, and tireless leadership have helped transform Cottage Tandoori from a humble local gem into a cherished dining institution."
              },
              {
                id: 2,
                name: "Foyzal",
                role: "Head Chef",
                initials: "FC",
                image: "https://static.databutton.com/public/6d13cbb4-0d00-46ec-8ef0-98e0a8405532/indian_chef_1.jpg",
                description: "Foyzal is Cottage Tandoori's very first chef and a master of Indian cuisine. For over 45 years, he has brought the rich, traditional flavours of the subcontinent to life with passion and precision. His expert hands and culinary wisdom are the foundation of the menu that has delighted guests for decades."
              }
            ].map((member) => (
              <div 
                key={member.id} 
                className="rounded-lg overflow-hidden transition-all duration-300 hover:-translate-y-2 backdrop-blur-md"
                style={{
                  backgroundColor: PremiumTheme.colors.background.secondary,
                  border: `1px solid ${PremiumTheme.colors.border.light}`,
                  boxShadow: PremiumTheme.shadows.elevation.lg
                }}
              >
                <div className="p-8">
                  <div className="flex flex-col md:flex-row items-center md:items-start mb-6">
                    <div 
                      className="w-28 h-28 mb-4 md:mb-0 rounded-full overflow-hidden border-2 shadow-md flex items-center justify-center bg-gradient-to-br"
                      style={{
                        borderColor: PremiumTheme.colors.border.medium,
                        background: `linear-gradient(135deg, ${PremiumTheme.colors.burgundy[800]} 0%, ${PremiumTheme.colors.burgundy[900]} 100%)`
                      }}
                    >
                      {member.image ? (
                        <img 
                          src={member.image} 
                          alt={member.name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            // Fallback to initials if image fails to load
                            e.currentTarget.style.display = 'none';
                            e.currentTarget.parentElement.innerHTML = member.initials;
                          }}
                        />
                      ) : (
                        <span className="text-white text-2xl font-medium">{member.initials}</span>
                      )}
                    </div>
                    <div className="md:ml-5 text-center md:text-left">
                      <h3 className="text-2xl font-serif" style={{ color: PremiumTheme.colors.text.primary }}>{member.name}</h3>
                      <p className="font-medium text-lg" style={{ color: PremiumTheme.colors.burgundy[500] }}>{member.role}</p>
                    </div>
                  </div>
                  <p className="font-sans leading-relaxed" style={{ color: PremiumTheme.colors.text.secondary }}>{member.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Awards & Recognition Section */}
      <section className="py-16 px-4" style={{ 
        background: `linear-gradient(to bottom, ${PremiumTheme.colors.background.primary}, ${PremiumTheme.colors.background.secondary})` 
      }}>
        <div className="container mx-auto">
          <h2 className="text-3xl font-serif text-center mb-4" style={{ color: PremiumTheme.colors.text.primary }}>Awards & Recognition</h2>
          <div className="w-20 h-1 mx-auto mb-6" style={{ backgroundColor: PremiumTheme.colors.burgundy[500] }}></div>
          <p className="text-center text-xl max-w-3xl mx-auto mb-12" style={{ color: PremiumTheme.colors.text.secondary }}>Over our 45-year journey, we've been honored to receive recognition for our commitment to culinary excellence.</p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            {/* Left column - Award description */}
            <div className="space-y-6">
              <div className="flex items-center mb-6">
                <FaAward className="w-8 h-8 mr-4" style={{ color: PremiumTheme.colors.burgundy[500] }} />
                <h3 className="text-2xl font-serif" style={{ color: PremiumTheme.colors.text.primary }}>Egon Ronay Good Food Guide (1987–1993)</h3>
              </div>
              
              <div className="p-8 rounded-lg border transition-all duration-300 hover:scale-105" style={{ 
                background: `linear-gradient(135deg, ${PremiumTheme.colors.background.secondary}, ${PremiumTheme.colors.background.tertiary})`,
                borderColor: PremiumTheme.colors.border.light,
                boxShadow: PremiumTheme.shadows.elevation.lg
              }}>
                <p className="text-lg font-sans leading-relaxed mb-6" style={{ color: PremiumTheme.colors.text.secondary }}>
                  For six consecutive years, Cottage Tandoori was recognized in the prestigious Egon Ronay Good Food Guide, a testament to our unwavering commitment to authentic Indian cuisine and exceptional dining experiences.
                </p>
                <p className="text-lg font-sans leading-relaxed" style={{ color: PremiumTheme.colors.text.secondary }}>
                  This honor placed us among the finest dining establishments in the UK, highlighting our dedication to preserving traditional cooking methods while delivering consistently outstanding flavors and service.
                </p>
                
                <div className="mt-8 flex flex-col md:flex-row justify-between items-center gap-4">
                  <div className="flex items-center space-x-2 group">
                    <div className="h-3 w-3 rounded-full group-hover:shadow-[0_0_10px_2px] transition-shadow duration-300" style={{ 
                      backgroundColor: PremiumTheme.colors.burgundy[500],
                      boxShadow: `0 0 10px 2px ${PremiumTheme.colors.burgundy[500]}40`
                    }}></div>
                    <span className="font-sans" style={{ color: PremiumTheme.colors.text.secondary }}>Culinary Excellence</span>
                  </div>
                  
                  <div className="flex items-center space-x-2 group">
                    <div className="h-3 w-3 rounded-full group-hover:shadow-[0_0_10px_2px] transition-shadow duration-300" style={{ 
                      backgroundColor: PremiumTheme.colors.burgundy[600],
                      boxShadow: `0 0 10px 2px ${PremiumTheme.colors.burgundy[600]}40`
                    }}></div>
                    <span className="font-sans" style={{ color: PremiumTheme.colors.text.secondary }}>Authentic Flavors</span>
                  </div>
                  
                  <div className="flex items-center space-x-2 group">
                    <div className="h-3 w-3 rounded-full group-hover:shadow-[0_0_10px_2px] transition-shadow duration-300" style={{ 
                      backgroundColor: PremiumTheme.colors.burgundy[500],
                      boxShadow: `0 0 10px 2px ${PremiumTheme.colors.burgundy[500]}40`
                    }}></div>
                    <span className="font-sans" style={{ color: PremiumTheme.colors.text.secondary }}>Exceptional Service</span>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Right column - Award image */}
            <div className="relative">
              <div className="aspect-w-4 aspect-h-3 rounded-lg overflow-hidden border" style={{
                boxShadow: PremiumTheme.shadows.elevation.xl,
                borderColor: PremiumTheme.colors.border.light
              }}>
                <img 
                  src="https://static.databutton.com/public/6d13cbb4-0d00-46ec-8ef0-98e0a8405532/egon-ronay-award.jpg" 
                  alt="Egon Ronay Good Food Guide Award" 
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                    e.currentTarget.parentElement!.style.background = `linear-gradient(135deg, ${PremiumTheme.colors.background.secondary}, ${PremiumTheme.colors.background.tertiary})`;
                  }}
                />
              </div>
              
              <div className="absolute -top-5 -right-5 w-24 h-24 rounded-full flex items-center justify-center transform rotate-12 shadow-lg border transition-transform hover:scale-105 duration-300" style={{
                backgroundColor: PremiumTheme.colors.background.tertiary,
                borderColor: PremiumTheme.colors.border.medium
              }}>
                <div className="transform -rotate-12 text-center">
                  <div className="text-xs font-bold" style={{ color: PremiumTheme.colors.text.primary }}>AWARDED</div>
                  <div className="text-xl font-serif font-bold" style={{ color: PremiumTheme.colors.burgundy[500] }}>6</div>
                  <div className="text-xs font-bold" style={{ color: PremiumTheme.colors.text.primary }}>YEARS</div>
                </div>
              </div>
              
              <div className="absolute -bottom-4 -left-4 p-3 backdrop-blur-sm rounded-lg border shadow-lg" style={{
                backgroundColor: 'rgba(0, 0, 0, 0.8)',
                borderColor: PremiumTheme.colors.border.light
              }}>
                <p className="font-serif italic text-sm" style={{ color: PremiumTheme.colors.text.secondary }}>
                  "One of the finest examples of authentic Indian cuisine in the region."
                </p>
                <p className="text-right text-xs mt-1" style={{ color: PremiumTheme.colors.text.muted }}>— Egon Ronay Guide, 1990</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Visit Us Section */}
      <section className="py-16 px-4" style={{ backgroundColor: PremiumTheme.colors.background.primary }}>
        <div className="container mx-auto">
          <h2 className="text-3xl font-serif text-center mb-4" style={{ color: PremiumTheme.colors.text.primary }}>Visit Us</h2>
          <div className="w-20 h-1 mx-auto mb-16" style={{ backgroundColor: PremiumTheme.colors.burgundy[500] }}></div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
            {/* Left Column: Hours & Location */}
            <div className="space-y-8">
              {/* Opening Hours Card */}
              <div className="rounded-xl p-6 border" style={{
                backgroundColor: PremiumTheme.colors.background.secondary,
                borderColor: PremiumTheme.colors.border.light,
                boxShadow: PremiumTheme.shadows.elevation.lg
              }}>
                <div className="flex items-center mb-6">
                  <FaClock className="w-6 h-6" style={{ color: PremiumTheme.colors.burgundy[500] }} />
                  <h3 className="ml-3 text-xl font-serif" style={{ color: PremiumTheme.colors.text.primary }}>Opening Hours</h3>
                </div>
                <div className="space-y-4">
                  {[
                    { day: "Monday", lunch: "12:00 PM - 2:00 PM", dinner: "5:00 PM - 10:00 PM" },
                    { day: "Tuesday", lunch: "12:00 PM - 2:00 PM", dinner: "5:00 PM - 10:00 PM" },
                    { day: "Wednesday", lunch: "12:00 PM - 2:00 PM", dinner: "5:00 PM - 10:00 PM" },
                    { day: "Thursday", lunch: "12:00 PM - 2:00 PM", dinner: "5:00 PM - 10:00 PM" },
                    { day: "Friday", lunch: "12:00 PM - 2:00 PM", dinner: "5:00 PM - 10:30 PM" },
                    { day: "Saturday", lunch: "12:00 PM - 2:00 PM", dinner: "5:00 PM - 10:30 PM" },
                    { day: "Sunday", lunch: "12:00 PM - 3:00 PM", dinner: "5:00 PM - 10:00 PM" }
                  ].map((item, index, array) => (
                    <div key={index} className={index !== array.length - 1 ? "pb-3 border-b" : ""} style={{
                      borderColor: PremiumTheme.colors.border.light
                    }}>
                      <div className="flex justify-between">
                        <span className="font-medium" style={{ color: PremiumTheme.colors.text.primary }}>{item.day}</span>
                      </div>
                      <div className="text-sm mt-2 grid grid-cols-2 gap-2" style={{ color: PremiumTheme.colors.text.muted }}>
                        <div>
                          <span className="block">Lunch</span>
                          <span className="block" style={{ color: PremiumTheme.colors.text.secondary }}>{item.lunch}</span>
                        </div>
                        <div>
                          <span className="block">Dinner</span>
                          <span className="block" style={{ color: PremiumTheme.colors.text.secondary }}>{item.dinner}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Location Card */}
              <div className="rounded-xl p-6 border" style={{
                backgroundColor: PremiumTheme.colors.background.secondary,
                borderColor: PremiumTheme.colors.border.light,
                boxShadow: PremiumTheme.shadows.elevation.lg
              }}>
                <div className="flex items-center mb-6">
                  <FaMapMarkerAlt className="w-6 h-6" style={{ color: PremiumTheme.colors.burgundy[500] }} />
                  <h3 className="ml-3 text-xl font-serif" style={{ color: PremiumTheme.colors.text.primary }}>Our Location</h3>
                </div>
                <p className="mb-4" style={{ color: PremiumTheme.colors.text.secondary }}>25 West Street<br />Storrington<br />Pulborough<br />West Sussex<br />RH20 4DZ</p>
                <p className="text-sm mb-6" style={{ color: PremiumTheme.colors.text.muted }}>We're located in the heart of Storrington village, with convenient parking available nearby.</p>
                
                <button 
                  onClick={() => window.open('https://maps.google.com/?q=25+West+St,+Storrington,+Pulborough+RH20+4DZ', '_blank')}
                  className="w-full py-2.5 px-4 rounded-lg transition-all duration-300 font-medium"
                  style={{
                    backgroundColor: PremiumTheme.colors.burgundy[600],
                    color: PremiumTheme.colors.text.primary,
                    border: `1px solid ${PremiumTheme.colors.burgundy[500]}`
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = PremiumTheme.colors.burgundy[500];
                    e.currentTarget.style.boxShadow = PremiumTheme.shadows.elevation.lg;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = PremiumTheme.colors.burgundy[600];
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  Get Directions
                </button>
              </div>
            </div>
            
            {/* Right Column: Contact & Map */}
            <div className="space-y-8">
              {/* Contact Card */}
              <div className="rounded-xl p-6 border" style={{
                backgroundColor: PremiumTheme.colors.background.secondary,
                borderColor: PremiumTheme.colors.border.light,
                boxShadow: PremiumTheme.shadows.elevation.lg
              }}>
                <div className="flex items-center mb-6">
                  <FaPhone className="w-6 h-6" style={{ color: PremiumTheme.colors.burgundy[500] }} />
                  <h3 className="ml-3 text-xl font-serif" style={{ color: PremiumTheme.colors.text.primary }}>Contact Us</h3>
                </div>
                <div className="space-y-6">
                  <div>
                    <div className="flex items-start mb-3">
                      <FaPhone className="w-5 h-5 mt-0.5" style={{ color: PremiumTheme.colors.burgundy[500] }} />
                      <div className="ml-3">
                        <p style={{ color: PremiumTheme.colors.text.secondary }}>01903 743605</p>
                        <p style={{ color: PremiumTheme.colors.text.secondary }}>01903 745974</p>
                      </div>
                    </div>
                    <button 
                      onClick={() => window.open('tel:01903743605', '_blank')}
                      className="w-full py-2 px-4 rounded-lg flex items-center justify-center transition-all duration-300"
                      style={{
                        backgroundColor: PremiumTheme.colors.burgundy[600],
                        color: PremiumTheme.colors.text.primary,
                        border: `1px solid ${PremiumTheme.colors.burgundy[500]}`
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = PremiumTheme.colors.burgundy[500];
                        e.currentTarget.style.boxShadow = PremiumTheme.shadows.elevation.lg;
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = PremiumTheme.colors.burgundy[600];
                        e.currentTarget.style.boxShadow = 'none';
                      }}
                    >
                      <FaPhone className="mr-2" />
                      <span>Call Now</span>
                    </button>
                  </div>
                  
                  <div>
                    <div className="flex items-start mb-3">
                      <FaEnvelope className="w-5 h-5 mt-0.5" style={{ color: PremiumTheme.colors.burgundy[500] }} />
                      <div className="ml-3">
                        <p style={{ color: PremiumTheme.colors.text.secondary }}>info@cottagetandoori.com</p>
                      </div>
                    </div>
                    <button 
                      onClick={() => window.open('mailto:info@cottagetandoori.com', '_blank')}
                      className="w-full py-2 px-4 rounded-lg flex items-center justify-center transition-all duration-300"
                      style={{
                        backgroundColor: PremiumTheme.colors.burgundy[600],
                        color: PremiumTheme.colors.text.primary,
                        border: `1px solid ${PremiumTheme.colors.burgundy[500]}`
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = PremiumTheme.colors.burgundy[500];
                        e.currentTarget.style.boxShadow = PremiumTheme.shadows.elevation.lg;
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = PremiumTheme.colors.burgundy[600];
                        e.currentTarget.style.boxShadow = 'none';
                      }}
                    >
                      <FaEnvelope className="mr-2" />
                      <span>Email Us</span>
                    </button>
                  </div>
                </div>
              </div>
              
              {/* Map Card */}
              <div className="rounded-xl overflow-hidden border" style={{
                backgroundColor: PremiumTheme.colors.background.secondary,
                borderColor: PremiumTheme.colors.border.light,
                boxShadow: PremiumTheme.shadows.elevation.lg
              }}>
                <div className="h-80">
                  <iframe 
                    src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2511.771893966142!2d-0.4572387236394928!3d50.91851135465146!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x4875a48c0cb3d01f%3A0xb9f6ef6c45ab9899!2s25%20West%20St%2C%20Storrington%2C%20Pulborough%20RH20%204DZ!5e0!3m2!1sen!2suk!4v1710700856412!5m2!1sen!2suk" 
                    width="100%" 
                    height="100%" 
                    style={{ border: 0 }} 
                    allowFullScreen 
                    loading="lazy" 
                    referrerPolicy="no-referrer-when-downgrade">
                  </iframe>
                </div>
                <div className="p-4 border-t" style={{ borderColor: PremiumTheme.colors.border.light }}>
                  <p className="text-sm" style={{ color: PremiumTheme.colors.text.secondary }}>Cottage Tandoori, 25 West St, Storrington</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <Footer />
    </div>
  );
}
