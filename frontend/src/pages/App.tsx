import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Utensils, ArrowRight, Clock, MapPin, Phone, Mail, Users, ChefHat, Star, Heart, Calendar } from "lucide-react";
import { FaFacebook, FaInstagram, FaTwitter, FaMapMarkerAlt, FaPhone, FaEnvelope, FaClock } from "react-icons/fa";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { UniversalHeader } from "../components/UniversalHeader";
import { Footer } from "../components/Footer";
import SignatureDishSection from "../components/SignatureDishSection";
import { SetMealsSection } from "../components/SetMealsSection";
import { HeroCarousel } from "../components/HeroCarousel";
import { AnimatedSection } from "../components/AnimatedSection";
import { useSimpleAuth } from "../utils/simple-auth-context";
import { PremiumTheme } from "../utils/premiumTheme";
import { useChatIsOpen } from "../utils/chat-store";
import { useWebsiteData } from "../utils/useWebsiteData";
import { loadFont, getFontFamily, DEFAULT_TITLE_FONT, DEFAULT_BODY_FONT } from "../utils/cmsFonts";
import brain from "brain";
import { SEO } from "components/SEO";
import { RESTAURANT_JSONLD, PAGE_SEO } from "utils/seoData";
import { RestaurantStatusBadge } from "components/status";

// Restaurant images for the hero carousel
// TODO: Migrate to Supabase storage via Website CMS image upload
const heroImages = [
  "https://static.databutton.com/public/6d13cbb4-0d00-46ec-8ef0-98e0a8405532/MAIN%20RESTAURANT%20EXTERIOR%20.jpg",
  "https://static.databutton.com/public/6d13cbb4-0d00-46ec-8ef0-98e0a8405532/BAR%202.jpg",
  "https://static.databutton.com/public/6d13cbb4-0d00-46ec-8ef0-98e0a8405532/BETWEEN%20TABLE%2012%20BACK%20OF%20RESTAURANT%20.jpg",
  "https://static.databutton.com/public/6d13cbb4-0d00-46ec-8ef0-98e0a8405532/VIEW%20FROM%20TABLE%2011.jpg",
];

// Remove hardcoded signature dishes - now using dynamic AdminMenu data
// SignatureDishSection component handles fetching from database

// Testimonials data
const testimonials = [
  {
    id: 1,
    text: "From the moment we walked in, we were transported by the aromas and warm hospitality. Their lamb biryani is an absolute masterpiece—layers of fragrant rice with tender meat and that perfect balance of spices. It's evident that every dish is prepared with tradition and passion. We've found our new favorite place for special family dinners.",
    author: "Sarah L.",
    location: "Petworth",
    initials: "SL",
    bgColor: "bg-rose-100/10",
    textColor: "text-rose-50"
  },
  {
    id: 2,
    text: "After trying nearly every Indian restaurant in West Sussex, I can confidently say Cottage Tandoori stands head and shoulders above the rest. The chef's special Naga curry had the perfect level of heat without overwhelming the complex flavors. The naan was pillowy soft with that characteristic char. The staff remembered my preferences from a previous visit—that attention to detail is increasingly rare.",
    author: "Mark S.",
    location: "Chiddingfold",
    initials: "MS",
    bgColor: "bg-rose-100/10",
    textColor: "text-rose-50"
  },
  {
    id: 3,
    text: "As a vegetarian, I'm often limited at restaurants, but Cottage Tandoori's plant-based menu is exceptional. The paneer makhani was creamy and indulgent, and the vegetable samosas were crisp perfection. The staff was knowledgeable about ingredients and took my dietary preferences seriously. The ambiance strikes that perfect balance between elegance and comfort—ideal for both casual lunches and celebration dinners.",
    author: "Emma J.",
    location: "Arundel",
    initials: "EJ",
    bgColor: "bg-rose-100/10",
    textColor: "text-rose-50"
  }
];

// Opening hours
const openingHours = [
  { day: "Monday - Thursday", lunch: "12 noon - 2:00pm", dinner: "5:30pm - 10:00pm", hours: "12pm-2pm & 5:30pm-10pm" },
  { day: "Friday - Saturday", lunch: "12 noon - 2:00pm", dinner: "5:30pm - 10:30pm", hours: "12pm-2pm & 5:30pm-10:30pm" },
  { day: "Sunday", lunch: "12 noon - 2:00pm", dinner: "5:30pm - 10:00pm", hours: "12pm-2pm & 5:30pm-10pm" }
];

// Parallax hook for Reserve by Phone section
function useParallax() {
  const [scrollY, setScrollY] = useState(0);
  const [shouldAnimate, setShouldAnimate] = useState(true);

  useEffect(() => {
    // Check user preferences and device capabilities
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const isMobile = window.innerWidth < 768;
    
    setShouldAnimate(!prefersReducedMotion && !isMobile);

    const handleScroll = () => {
      if (!prefersReducedMotion && !isMobile) {
        setScrollY(window.scrollY);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    
    // Listen for changes in motion preference
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const handleMotionChange = (e: MediaQueryListEvent) => {
      setShouldAnimate(!e.matches && window.innerWidth >= 768);
    };
    
    mediaQuery.addEventListener('change', handleMotionChange);

    return () => {
      window.removeEventListener('scroll', handleScroll);
      mediaQuery.removeEventListener('change', handleMotionChange);
    };
  }, []);

  return { scrollY, shouldAnimate };
}

// Ticker Banner Component
function TickerBanner() {
  const [shouldAnimate, setShouldAnimate] = useState(true);

  useEffect(() => {
    // Respect user's reduced motion preference
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    setShouldAnimate(!prefersReducedMotion);
  }, []);

  const tickerText = "Reserve now: 01903 743605 • 01903 745974 • Lunch 12–2 • Dinner 5:30–10 (Fri–Sat till 10:30) • Last seating 9 PM";

  return (
    <div 
      className="relative overflow-hidden py-3 border-b w-full"
      style={{
        background: '#8B1538',
        borderColor: '#4A4A4A',
        minHeight: '48px'
      }}
    >
      <div 
        className="whitespace-nowrap flex"
        style={{
          animation: shouldAnimate ? 'marquee 30s linear infinite' : 'none'
        }}
      >
        <span 
          className="inline-block px-4 text-sm font-medium tracking-wide"
          style={{ color: '#FFFFFF' }}
        >
          {tickerText} • {tickerText} • {tickerText}
        </span>
      </div>
    </div>
  );
}

// Mobile Sticky Call Bar Component
function MobileStickyCallBar() {
  const isChatOpen = useChatIsOpen();

  if (isChatOpen) return null;

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 safe-area-padding-bottom">
      <div 
        className="flex gap-2 p-3 border-t backdrop-blur-md"
        style={{
          background: 'rgba(0,0,0,0.9)',
          borderColor: PremiumTheme.colors.border.light
        }}
      >
        <a
          href="tel:01903743605"
          aria-label="Call primary phone number 01903 743605"
          className="flex-1 py-3 px-4 rounded-lg text-center font-medium transition-all duration-300 active:scale-95"
          style={{
            background: PremiumTheme.colors.burgundy[500],
            color: PremiumTheme.colors.text.primary
          }}
        >
          <Phone className="w-4 h-4 inline mr-2" aria-hidden="true" />
          Call 01903 743605
        </a>
        <a
          href="tel:01903745974"
          aria-label="Call secondary phone number 01903 745974"
          className="flex-1 py-3 px-4 rounded-lg text-center font-medium transition-all duration-300 active:scale-95"
          style={{
            background: PremiumTheme.colors.background.secondary,
            color: PremiumTheme.colors.text.primary,
            border: `1px solid ${PremiumTheme.colors.border.medium}`
          }}
        >
          <Phone className="w-4 h-4 inline mr-2" aria-hidden="true" />
          Call 01903 745974
        </a>
      </div>
    </div>
  );
}

export default function App() {
  const navigate = useNavigate();
  const { scrollY, shouldAnimate } = useParallax();
  const { user } = useSimpleAuth();

  // Load website content from DB (falls back to hardcoded constants above)
  const heroData = useWebsiteData<{ title?: string; subtitle?: string; images?: string[]; title_font?: string; body_font?: string }>('hero');
  const testimonialsData = useWebsiteData<{ reviews?: any[] }>('testimonials');
  const contactData = useWebsiteData<{ opening_hours?: any[]; phones?: string[]; emails?: string[]; address?: string }>('contact');
  const storyData = useWebsiteData<{ title?: string; paragraphs?: string[] }>('story');

  // Load CMS-selected fonts dynamically
  useEffect(() => {
    loadFont(heroData?.title_font || DEFAULT_TITLE_FONT);
    loadFont(heroData?.body_font || DEFAULT_BODY_FONT);
  }, [heroData?.title_font, heroData?.body_font]);

  // Use DB data with hardcoded fallbacks
  const activeHeroImages = heroData?.images || heroImages;
  const activeTestimonials = testimonialsData?.reviews || testimonials;
  const activeOpeningHours = contactData?.opening_hours || openingHours;

  const [activeSection, setActiveSection] = useState<string | null>("home");

  // Navigate to online ordering - auth is handled at checkout, not menu browsing
  const handleOrderNow = () => {
    navigate("/online-orders");
  };

  return (
    <div
      className="min-h-screen theme-customer"
      style={{
        background: PremiumTheme.colors.background.primary,
        color: PremiumTheme.colors.text.primary,
        fontFamily: getFontFamily(heroData?.body_font, DEFAULT_BODY_FONT),
      }}
    >
      <SEO title={PAGE_SEO.home.title} description={PAGE_SEO.home.description} path="/" jsonLd={RESTAURANT_JSONLD} />
      {/* Enhanced Universal Header with Glassmorphism */}
      <UniversalHeader 
        context="PUBLIC_NAV"
        transparent={true}
        showAuthButtons={true}
        showCart={true}
        showThemeToggle={true}
      />
      
      {/* Hero Section with Image Carousel and Frosted Glass Overlay */}
      <div className="relative h-dvh">
        <HeroCarousel images={activeHeroImages} />
        
        {/* Frosted Glass Welcome Overlay */}
        <div className="absolute inset-0 z-[5] flex items-center justify-center px-4">
          <div 
            className="backdrop-blur-md rounded-2xl border p-8 md:p-12 max-w-3xl mx-auto text-center transform transition-all duration-700"
            style={{
              background: 'rgba(0,0,0,0.4)',
              borderColor: PremiumTheme.colors.border.light,
              boxShadow: PremiumTheme.shadows.elevation.xl
            }}
          >
            {/* Welcome Headline */}
            <h1 
              className="text-4xl md:text-6xl font-serif mb-6 tracking-wide drop-shadow-2xl"
              style={{ color: PremiumTheme.colors.text.primary }}
            >
              <span
                style={{
                  // Toned-down (-20%) version of the wordmark's multi-layer text-shadow
                  // Original: '-0.5px -0.5px 0 rgba(255, 255, 255, 0.20), 0 1px 0 rgba(0, 0, 0, 0.44), 0 2px 6px rgba(0, 0, 0, 0.55)'
                  // Reduced alphas by ~20%: 0.20->0.16, 0.44->0.352, 0.55->0.44
                  textShadow:
                    "-0.5px -0.5px 0 rgba(255, 255, 255, 0.16), 0 1px 0 rgba(0, 0, 0, 0.352), 0 2px 6px rgba(0, 0, 0, 0.44)",
                }}
              >
                Welcome to
              </span>
              <span
                className="block mt-2 font-bold relative text-5xl md:text-7xl lg:text-8xl"
                style={{
                  fontFamily: getFontFamily(heroData?.title_font, DEFAULT_TITLE_FONT),
                  fontWeight: '800',
                  lineHeight: '1.1',
                  letterSpacing: '0.02em',
                  color: '#8B1538',
                  textShadow: '-0.5px -0.5px 0 rgba(255, 255, 255, 0.20), 0 1px 0 rgba(0, 0, 0, 0.44), 0 2px 6px rgba(0, 0, 0, 0.55)',
                  marginBottom: '0.25rem'
                }}
              >
                Cottage Tandoori
              </span>
              {/* Storrington subtitle under the wordmark */}
              <span
                className="block mt-2 font-serif font-light uppercase whitespace-nowrap text-lg md:text-xl tracking-[0.75em] sm:tracking-[0.80em] md:tracking-[0.85em] lg:tracking-[0.90em] text-center"
                style={{
                  color: PremiumTheme.colors.text.primary,
                  // Apply the same toned-down text-shadow as above for visual consistency, -20% intensity vs wordmark
                  textShadow:
                    "-0.5px -0.5px 0 rgba(255, 255, 255, 0.16), 0 1px 0 rgba(0, 0, 0, 0.352), 0 2px 6px rgba(0, 0, 0, 0.44)",
                }}
                aria-label="STORRINGTON subtitle"
              >
                STORRINGTON
              </span>
            </h1>
            
            {/* Descriptive Text */}
            <p
              className="text-lg md:text-xl mb-6 leading-relaxed font-light tracking-wide drop-shadow-lg"
              style={{ color: PremiumTheme.colors.text.secondary }}
            >
              Experience authentic Indian cuisine crafted with passion and tradition.
              From our tandoor-fired specialties to our signature curries, every dish tells a story of heritage and flavor.
            </p>

            {/* Restaurant Status Badge - Shows open/closed status */}
            <div className="flex justify-center mb-6">
              <RestaurantStatusBadge showHours />
            </div>

            {/* Conditional Content Based on Auth State */}
            {user ? (
              /* Authenticated User Experience */
              <div className="space-y-6">
                <p 
                  className="text-base md:text-lg font-medium"
                  style={{ color: PremiumTheme.colors.silver[500] }}
                >
                  Welcome back, {user.email?.split('@')[0] || 'Guest'}! 🌟
                </p>
                
                <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                  <Button
                    onClick={() => navigate("/online-orders")}
                    aria-label="Start ordering from menu"
                    className="px-8 py-4 text-lg font-medium rounded-full transition-all duration-300 transform hover:scale-105 border backdrop-blur-sm group"
                    style={{
                      background: PremiumTheme.colors.burgundy[500],
                      borderColor: PremiumTheme.colors.border.light,
                      color: PremiumTheme.colors.text.primary,
                      boxShadow: PremiumTheme.shadows.glow.burgundy
                    }}
                  >
                    <Utensils className="mr-2 h-5 w-5 group-hover:animate-pulse" aria-hidden="true" />
                    Start Ordering
                    <ArrowRight className="ml-2 h-5 w-5 transform group-hover:translate-x-1 transition-transform" aria-hidden="true" />
                  </Button>
                  
                  <Button
                    onClick={() => navigate("/customer-portal")}
                    variant="outline"
                    className="px-6 py-3 text-base font-medium rounded-full backdrop-blur-sm transition-all duration-300 transform hover:scale-105"
                    style={{
                      background: 'transparent',
                      borderColor: PremiumTheme.colors.border.medium,
                      color: PremiumTheme.colors.text.primary
                    }}
                  >
                    <Heart className="mr-2 h-4 w-4" />
                    My Account
                  </Button>
                </div>
              </div>
            ) : (
              /* Non-Authenticated User Experience */
              <div className="space-y-6">
                
                {/* Auth CTAs */}
                <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                  {/* Primary CTA - Sign Up */}
                  <Button
                    onClick={() => navigate("/sign-up")}
                    aria-label="Create a new account to start ordering"
                    className="px-8 py-4 text-lg font-medium rounded-full transition-all duration-300 transform hover:scale-105 border backdrop-blur-sm group"
                    style={{
                      background: PremiumTheme.colors.burgundy[500],
                      borderColor: PremiumTheme.colors.border.light,
                      color: PremiumTheme.colors.text.primary,
                      boxShadow: PremiumTheme.shadows.glow.burgundy
                    }}
                  >
                    <Users className="mr-2 h-5 w-5 group-hover:animate-pulse" aria-hidden="true" />
                    Create Account & Order
                    <ArrowRight className="ml-2 h-5 w-5 transform group-hover:translate-x-1 transition-transform" aria-hidden="true" />
                  </Button>
                  
                  {/* Secondary CTA - Sign In */}
                  <Button
                    onClick={() => navigate("/login")}
                    variant="outline"
                    className="px-6 py-3 text-base font-medium rounded-full backdrop-blur-sm transition-all duration-300 transform hover:scale-105"
                    style={{
                      background: 'transparent',
                      borderColor: PremiumTheme.colors.border.medium,
                      color: PremiumTheme.colors.text.primary
                    }}
                  >
                    Already have an account? Sign In
                  </Button>
                </div>
                
                {/* Alternative Browse Menu Option */}
                <div className="pt-4 border-t border-opacity-20" style={{ borderColor: PremiumTheme.colors.border.light }}>
                  <Button
                    onClick={() => navigate("/online-orders")}
                    variant="ghost"
                    className="px-6 py-3 text-base font-light rounded-full backdrop-blur-sm transition-all duration-300"
                    style={{
                      background: 'transparent',
                      color: PremiumTheme.colors.text.secondary
                    }}
                  >
                    <ChefHat className="mr-2 h-4 w-4" />
                    Browse Menu First
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Content Sections */}
      <div className="relative z-10">
        {/* Our Story Section */}
        <section 
          className="py-24 px-4 bg-cover bg-center" 
          style={{
            backgroundImage: `linear-gradient(to bottom, rgba(0,0,0,0.6), rgba(0,0,0,0.6)), url("https://static.databutton.com/public/6d13cbb4-0d00-46ec-8ef0-98e0a8405532/MAIN%20RESTAURANT%20EXTERIOR%20.jpg")`,
            backgroundAttachment: "fixed"
          }}
        >
          <div className="container mx-auto">
            {/* Single large glass backdrop panel */}
            <div 
              className="backdrop-blur-[12px] rounded-[1.5rem] border p-10 animate-fadeUp"
              style={{
                background: 'rgba(0,0,0,0.4)',
                borderColor: PremiumTheme.colors.border.light,
                boxShadow: PremiumTheme.shadows.elevation.lg
              }}
            >
              <div className="flex flex-col md:flex-row gap-12">
                {/* Left column - Story text */}
                <div className="md:w-3/5 space-y-6">
                  <div>
                    <h2
                      className="text-4xl font-serif uppercase tracking-[1.5px] text-shadow"
                      style={{ color: PremiumTheme.colors.text.secondary }}
                    >
                      {storyData?.title || 'Our Story'}
                    </h2>
                    <div 
                      className="w-24 h-[1px] mt-4 mb-6"
                      style={{ background: PremiumTheme.colors.silver[500] }}
                    ></div>
                  </div>
                  <div 
                    className="space-y-4 font-lora text-lg leading-[1.7] tracking-wide"
                    style={{ color: PremiumTheme.colors.text.secondary }}
                  >
                    {(storyData?.paragraphs || [
                      'Nestled in the heart of Storrington, Cottage Tandoori has been a beloved culinary destination since 1980.',
                      'Blending rich Indian heritage with modern presentation, our menu is a celebration of timeless recipes passed down through generations.',
                      'From our tandoor-fired breads to our signature curries, every dish is a tribute to tradition, craftsmanship, and locally sourced ingredients.',
                      'We invite you to taste the soul of Indian cuisine — refined for today\'s palate.',
                    ]).map((para, i) => (
                      <p key={i}>{para}</p>
                    ))}
                  </div>
                  <button 
                    className="mt-8 px-7 py-3 backdrop-blur-sm border rounded tracking-wider transition-all duration-300 text-base uppercase group flex items-center relative overflow-hidden before:absolute before:inset-0 before:opacity-0 hover:before:opacity-100 before:transition-opacity"
                    style={{
                      background: 'transparent',
                      borderColor: PremiumTheme.colors.text.secondary,
                      color: PremiumTheme.colors.text.secondary,
                      boxShadow: 'hover:' + PremiumTheme.shadows.glow.burgundy
                    }}
                  >
                    <span>Read Full Story</span> 
                    <span className="ml-2 transform transition-transform duration-300 group-hover:translate-x-1">→</span>
                  </button>
                </div>
                
                {/* Vertical divider for larger screens */}
                <div 
                  className="hidden md:block w-px self-stretch mx-2 opacity-70"
                  style={{ background: PremiumTheme.colors.border.medium }}
                ></div>
                
                {/* Right column - Opening hours card */}
                <div className="md:w-2/5 flex items-start justify-center animate-fadeUp" style={{ animationDelay: '300ms' }}>
                  <div className="w-full">
                    <h3 
                      className="text-2xl font-serif mb-6 text-shadow"
                      style={{ color: PremiumTheme.colors.text.primary }}
                    >Opening Hours</h3>
                    <div className="space-y-6">
                      {activeOpeningHours.map((item, index) => (
                        <div key={index} className="space-y-2">
                          <h4 
                            className="font-sans font-medium tracking-wide"
                            style={{ color: PremiumTheme.colors.text.primary }}
                          >{item.day}</h4>
                          <div 
                            className="space-y-1 pl-2 border-l-2"
                            style={{ borderColor: PremiumTheme.colors.burgundy[500] }}
                          >
                            <div className="flex justify-between items-center">
                              <span 
                                className="font-sans tracking-wide text-sm"
                                style={{ color: PremiumTheme.colors.text.muted }}
                              >Lunch</span>
                              <span 
                                className="font-sans tracking-wide"
                                style={{ color: PremiumTheme.colors.text.primary }}
                              >{item.lunch}</span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span 
                                className="font-sans tracking-wide text-sm"
                                style={{ color: PremiumTheme.colors.text.muted }}
                              >Dinner</span>
                              <span 
                                className="font-sans tracking-wide"
                                style={{ color: PremiumTheme.colors.text.primary }}
                              >{item.dinner}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
        
        {/* Dynamic Signature Dishes Section with API Integration */}
        <SignatureDishSection />
        
        {/* Set Meals Section */}
        <SetMealsSection userRole="viewer" />

        
        {/* Testimonials Section */}
        <section 
          className="py-24 px-4"
          style={{ background: PremiumTheme.colors.background.primary }}
        >
          <div className="container mx-auto">
            <h2 
              className="text-4xl font-serif mb-3 text-center bg-gradient-to-r bg-clip-text text-transparent"
              style={{ 
                backgroundImage: `linear-gradient(to right, ${PremiumTheme.colors.text.primary}, ${PremiumTheme.colors.text.secondary})` 
              }}
            >What Our Guests Say</h2>
            <p 
              className="text-center mb-16 max-w-2xl mx-auto"
              style={{ color: PremiumTheme.colors.text.muted }}
            >Read what our valued guests have to say about their dining experience at Cottage Tandoori.</p>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
              {activeTestimonials.map((testimonial, index) => (
                <div 
                  key={testimonial.id} 
                  className="p-8 rounded-lg border transition-all duration-300 flex flex-col h-full"
                  style={{
                    background: PremiumTheme.colors.background.secondary,
                    borderColor: PremiumTheme.colors.border.light,
                    boxShadow: PremiumTheme.shadows.elevation.md
                  }}
                  data-aos="fade-up"
                  data-aos-delay={index * 100}
                >
                  <div className="flex items-start mb-6 gap-4">
                    <div 
                      className="flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center"
                      style={{ background: `${PremiumTheme.colors.burgundy[500]}20` }}
                    >
                      <span 
                        className="font-medium"
                        style={{ color: PremiumTheme.colors.burgundy[500] }}
                      >{testimonial.initials}</span>
                    </div>
                    <div>
                      <p 
                        className="font-medium"
                        style={{ color: PremiumTheme.colors.text.primary }}
                      >{testimonial.author}</p>
                      <p 
                        className="text-sm"
                        style={{ color: PremiumTheme.colors.text.muted }}
                      >{testimonial.location}</p>
                      <div className="flex mt-1">
                        {[...Array(5)].map((_, i) => (
                          <svg 
                            key={i} 
                            className="w-4 h-4" 
                            fill="currentColor" 
                            viewBox="0 0 20 20" 
                            xmlns="http://www.w3.org/2000/svg"
                            style={{ color: PremiumTheme.colors.platinum[500] }}
                          >
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path>
                          </svg>
                        ))}
                      </div>
                    </div>
                  </div>
                  <p 
                    className="italic text-center mb-4 flex-grow font-light text-lg leading-relaxed"
                    style={{ color: PremiumTheme.colors.text.secondary }}
                  >"{testimonial.text}"</p>
                </div>
              ))}
            </div>
          </div>
        </section>
        
        {/* Reservations Section - Updated to Reserve by Phone */}
        <section 
          id="reserve-by-phone"
          className="relative py-24 px-4 overflow-hidden"
          style={{
            // Clean implementation: stable background without parallax
            backgroundImage: 'url("https://static.databutton.com/public/88a315b0-faa2-491d-9215-cf1e283cdee2/TABLE%206%20STRIGHT%20VIEW.jpg")',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
            backgroundAttachment: 'fixed',
            minHeight: '60vh'
          }}
        >
          {/* Dark gradient overlay for content legibility */}
          <div 
            className="absolute inset-0 z-[1]"
            style={{
              background: 'linear-gradient(135deg, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0.4) 50%, rgba(0,0,0,0.6) 100%)'
            }}
          />
          
          {/* Radial vignette overlay for enhanced edge contrast */}
          <div 
            className="absolute inset-0 z-[2]"
            style={{
              background: 'radial-gradient(ellipse at center, transparent 20%, rgba(0,0,0,0.3) 70%, rgba(0,0,0,0.5) 100%)'
            }}
          />
          
          {/* Content layer */}
          <div className="relative z-10 max-w-4xl mx-auto">
            {/* Enhanced header with text shadows */}
            <div className="text-center mb-10">
              <h2 
                className="text-4xl font-serif mb-3 text-center bg-gradient-to-r bg-clip-text text-transparent"
                style={{ 
                  backgroundImage: `linear-gradient(to right, ${PremiumTheme.colors.text.primary}, ${PremiumTheme.colors.text.secondary})`,
                  filter: 'drop-shadow(0 4px 8px rgba(0, 0, 0, 0.8))'
                }}
              >
                Reserve by Phone
              </h2>
              <p 
                className="text-xl text-gray-200 mb-12"
                style={{
                  textShadow: '1px 1px 4px rgba(0,0,0,0.8)'
                }}
              >
                Call to book; last seating 9:00 PM.
              </p>
            </div>
            
            {/* Glassmorphic card with all functionality */}
            <div 
              className="relative backdrop-blur-md rounded-2xl overflow-hidden border"
              style={{
                background: 'rgba(0,0,0,0.4)',
                borderColor: PremiumTheme.colors.border.light,
                boxShadow: PremiumTheme.shadows.elevation.xl
              }}
            >
              {/* Decorative elements */}
              <div 
                className="absolute top-0 left-0 h-[300px] w-[300px] rounded-full blur-3xl"
                style={{ background: `${PremiumTheme.colors.burgundy[500]}10` }}
              ></div>
              <div 
                className="absolute bottom-0 right-0 h-[250px] w-[250px] rounded-full blur-3xl"
                style={{ background: `${PremiumTheme.colors.silver[500]}10` }}
              ></div>
              
              {/* Content with glass effect */}
              <div className="relative z-10 p-8 md:p-12 backdrop-blur-sm">
                <div className="text-center space-y-6">
                  <div 
                    className="inline-flex items-center justify-center w-16 h-16 rounded-full mb-4"
                    style={{ background: `${PremiumTheme.colors.burgundy[500]}20` }}
                  >
                    <Phone 
                      className="w-8 h-8" 
                      style={{ color: PremiumTheme.colors.burgundy[500] }}
                    />
                  </div>
                  
                  {/* Call buttons */}
                  <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-6">
                    <a
                      href="tel:01903743605"
                      aria-label="Call primary reservation line 01903 743605"
                      className="inline-flex items-center px-8 py-4 rounded-lg transition-all duration-300 font-medium text-lg transform hover:scale-105"
                      style={{
                        background: PremiumTheme.colors.burgundy[500],
                        color: PremiumTheme.colors.text.primary,
                        boxShadow: PremiumTheme.shadows.glow.burgundy
                      }}
                    >
                      <Phone className="w-5 h-5 mr-2" aria-hidden="true" />
                      Call 01903 743605
                    </a>

                    <a
                      href="tel:01903745974"
                      aria-label="Call secondary reservation line 01903 745974"
                      className="inline-flex items-center px-6 py-3 rounded-lg transition-all duration-300 font-medium border transform hover:scale-105"
                      style={{
                        background: 'transparent',
                        borderColor: PremiumTheme.colors.border.medium,
                        color: PremiumTheme.colors.text.primary
                      }}
                    >
                      <Phone className="w-5 h-5 mr-2" aria-hidden="true" />
                      Call 01903 745974
                    </a>
                  </div>
                  
                  {/* Opening hours */}
                  <div className="pt-4 border-t border-opacity-20" style={{ borderColor: PremiumTheme.colors.border.light }}>
                    <div 
                      className="text-sm text-center leading-relaxed max-w-3xl mx-auto space-y-1"
                      style={{ color: PremiumTheme.colors.text.secondary }}
                    >
                      <div>Mon-Thu: 12-2pm, 5:30-10pm</div>
                      <div>Fri-Sat: 12-2pm, 5:30-10:30pm</div>
                      <div>Sunday: 12-2pm, 5:30-10pm</div>
                    </div>
                  </div>
                  
                  {/* Ticker Banner */}
                  <div className="mt-4 relative z-[20]">
                    <TickerBanner />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
        
        {/* Visit Us Section */}
        <section 
          className="py-24 px-4"
          style={{ background: PremiumTheme.colors.background.primary }}
        >
          <div className="container mx-auto">
            <h2 
              className="text-4xl font-serif mb-3 text-center bg-gradient-to-r bg-clip-text text-transparent"
              style={{ 
                backgroundImage: `linear-gradient(to right, ${PremiumTheme.colors.text.primary}, ${PremiumTheme.colors.text.secondary})` 
              }}
            >Visit Us</h2>
            <p 
              className="text-center mb-16 max-w-2xl mx-auto"
              style={{ color: PremiumTheme.colors.text.muted }}
            >Come experience the finest Indian cuisine in West Sussex.</p>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8 mb-16">
              {/* Location */}
              <div 
                className="rounded-lg p-8 border transition-all duration-300"
                style={{
                  background: PremiumTheme.colors.background.secondary,
                  borderColor: PremiumTheme.colors.border.light
                }}
              >
                <div className="flex items-center mb-6">
                  <FaMapMarkerAlt 
                    className="w-6 h-6"
                    style={{ color: PremiumTheme.colors.burgundy[500] }}
                  />
                  <h3 
                    className="ml-3 text-xl font-serif"
                    style={{ color: PremiumTheme.colors.text.primary }}
                  >Our Location</h3>
                </div>
                <p 
                  className="mb-4"
                  style={{ color: PremiumTheme.colors.text.secondary }}
                >25 West Street, Storrington, West Sussex, RH20 4DZ</p>
                <a 
                  href="https://maps.google.com/?q=25+West+Street,+Storrington,+West+Sussex,+RH20+4DZ" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="text-sm flex items-center transition-colors"
                  style={{ color: PremiumTheme.colors.burgundy[500] }}
                >
                  <span>Open in Google Maps</span>
                  <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </a>
              </div>
              
              {/* Hours */}
              <div 
                className="rounded-lg p-8 border transition-all duration-300"
                style={{
                  background: PremiumTheme.colors.background.secondary,
                  borderColor: PremiumTheme.colors.border.light
                }}
              >
                <div className="flex items-center mb-6">
                  <FaClock 
                    className="w-6 h-6"
                    style={{ color: PremiumTheme.colors.burgundy[500] }}
                  />
                  <h3 
                    className="ml-3 text-xl font-serif"
                    style={{ color: PremiumTheme.colors.text.primary }}
                  >Opening Hours</h3>
                </div>
                <ul className="space-y-2">
                  {activeOpeningHours.map((item, index) => (
                    <li key={index} className="flex justify-between">
                      <span 
                        style={{ color: PremiumTheme.colors.text.secondary }}
                      >{item.day}</span>
                      <span 
                        style={{ color: PremiumTheme.colors.burgundy[500] }}
                      >{item.hours}</span>
                    </li>
                  ))}
                </ul>
              </div>
              
              {/* Contact */}
              <div 
                className="rounded-lg p-8 border transition-all duration-300"
                style={{
                  background: PremiumTheme.colors.background.secondary,
                  borderColor: PremiumTheme.colors.border.light
                }}
              >
                <div className="flex items-center mb-6">
                  <FaPhone 
                    className="w-6 h-6"
                    style={{ color: PremiumTheme.colors.burgundy[500] }}
                  />
                  <h3 
                    className="ml-3 text-xl font-serif"
                    style={{ color: PremiumTheme.colors.text.primary }}
                  >Contact Details</h3>
                </div>
                <ul className="space-y-4">
                  <li className="flex items-start">
                    <FaPhone 
                      className="w-5 h-5 mt-0.5"
                      style={{ color: PremiumTheme.colors.burgundy[500] }}
                    />
                    <div className="ml-3">
                      <p style={{ color: PremiumTheme.colors.text.secondary }}>01903 743605</p>
                      <p style={{ color: PremiumTheme.colors.text.secondary }}>01903 745974</p>
                    </div>
                  </li>
                  <li className="flex items-start">
                    <FaEnvelope 
                      className="w-5 h-5 mt-0.5"
                      style={{ color: PremiumTheme.colors.burgundy[500] }}
                    />
                    <div className="ml-3">
                      <p style={{ color: PremiumTheme.colors.text.secondary }}>info@cottagetandoori.com</p>
                      <p style={{ color: PremiumTheme.colors.text.secondary }}>reservations@cottagetandoori.com</p>
                    </div>
                  </li>
                </ul>
              </div>
            </div>
            
            {/* Map */}
            <div 
              className="rounded-xl overflow-hidden h-96 border"
              style={{
                borderColor: PremiumTheme.colors.border.light,
                boxShadow: PremiumTheme.shadows.elevation.lg
              }}
            >
              <iframe
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2511.771893966142!2d-0.4572387236394928!3d50.91851135465146!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x4875a48c0cb3d01f%3A0xb9f6ef6c45ab9899!2s25%20West%20St%2C%20Storrington%2C%20Pulborough%20RH20%204DZ!5e0!3m2!1sen!2suk!4v1710700856412!5m2!1sen!2suk"
                title="Cottage Tandoori location map - 25 West Street, Storrington"
                width="100%"
                height="100%"
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade">
              </iframe>
            </div>
          </div>
        </section>
      </div>
      
      {/* Footer */}
      <Footer />
      
      {/* Mobile Sticky Call Bar */}
      <MobileStickyCallBar />
    </div>
  );
}
