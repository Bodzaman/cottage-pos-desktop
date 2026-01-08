

import React from "react";
import { Link } from "react-router-dom";
import { FaMapMarkerAlt, FaPhone, FaEnvelope, FaFacebook, FaInstagram, FaTwitter } from "react-icons/fa";
import { useSimpleAuth } from "../utils/simple-auth-context";
import { PremiumTheme } from "../utils/premiumTheme";

// Opening hours data
const openingHours = [
  { day: "Monday - Thursday", lunch: "12 noon - 2:00pm", dinner: "5:30pm - 10:00pm" },
  { day: "Friday - Saturday", lunch: "12 noon - 2:00pm", dinner: "5:30pm - 10:30pm" },
  { day: "Sunday", lunch: "12 noon - 2:00pm", dinner: "5:30pm - 10:00pm" }
];

interface FooterProps {
  variant?: 'full' | 'minimal' | 'customer';
}

export function Footer({ variant = 'full' }: FooterProps) {
  const { isAdmin } = useSimpleAuth();
  
  // Minimal footer for auth pages
  if (variant === 'minimal') {
    return (
      <footer 
        className="border-t py-8"
        style={{
          background: PremiumTheme.colors.background.primary,
          borderColor: PremiumTheme.colors.border.medium
        }}
      >
        <div className="container mx-auto px-4">
          <div className="text-center">
            <h3 
              className="text-xl font-serif mb-4"
              style={{ color: PremiumTheme.colors.text.primary }}
            >Cottage Tandoori</h3>
            <p 
              className="mb-6"
              style={{ color: PremiumTheme.colors.text.muted }}
            >Authentic Indian cuisine since 1982</p>
          </div>
          
          <div 
            className="pt-6 border-t text-center text-sm"
            style={{
              borderColor: PremiumTheme.colors.border.medium,
              color: PremiumTheme.colors.text.muted
            }}
          >
            <p>&copy; {new Date().getFullYear()} Cottage Tandoori. All rights reserved.</p>
            <div className="mt-2 space-x-4">
              <a 
                href="#" 
                className="transition-colors"
                style={{ color: PremiumTheme.colors.text.muted }}
                onMouseEnter={(e) => e.target.style.color = PremiumTheme.colors.burgundy[500]}
                onMouseLeave={(e) => e.target.style.color = PremiumTheme.colors.text.muted}
              >Privacy Policy</a>
              <a 
                href="#" 
                className="transition-colors"
                style={{ color: PremiumTheme.colors.text.muted }}
                onMouseEnter={(e) => e.target.style.color = PremiumTheme.colors.burgundy[500]}
                onMouseLeave={(e) => e.target.style.color = PremiumTheme.colors.text.muted}
              >Terms of Service</a>
              {isAdmin && (
                <Link 
                  to="/admin-portal" 
                  className="transition-colors"
                  style={{ color: PremiumTheme.colors.text.muted }}
                  onMouseEnter={(e) => e.target.style.color = PremiumTheme.colors.burgundy[500]}
                  onMouseLeave={(e) => e.target.style.color = PremiumTheme.colors.text.muted}
                >Admin</Link>
              )}
            </div>
          </div>
        </div>
      </footer>
    );
  }
  
  // Customer footer with customer-specific links
  const quickLinks = variant === 'customer' ? [
    { to: "/", label: "Home" },
    { to: "/online-orders", label: "Order Online" },
    { to: "/customer-portal", label: "My Account" },
    { to: "/contact", label: "Contact" }
  ] : [
    { to: "/", label: "Home" },
    { to: "/Menu", label: "Menu" },
    { to: "/Gallery", label: "Gallery" },
    { to: "/About", label: "About Us" }
  ];
  
  return (
    <footer 
      className="border-t"
      style={{
        background: PremiumTheme.colors.background.primary,
        borderColor: PremiumTheme.colors.border.medium
      }}
    >
      <div className="container mx-auto px-4 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
          <div>
            <h3 
              className="text-xl font-serif mb-6"
              style={{ color: PremiumTheme.colors.text.primary }}
            >Cottage Tandoori</h3>
            <p 
              className="mb-6"
              style={{ color: PremiumTheme.colors.text.muted }}
            >Authentic Indian cuisine in the heart of Storrington since 1982.</p>
            <div className="flex space-x-4">
              <a 
                href="#" 
                className="transition-colors"
                style={{ 
                  color: PremiumTheme.colors.text.muted
                }}
                onMouseEnter={(e) => e.target.style.color = PremiumTheme.colors.burgundy[500]}
                onMouseLeave={(e) => e.target.style.color = PremiumTheme.colors.text.muted}
              >
                <FaFacebook className="w-5 h-5" />
              </a>
              <a 
                href="#" 
                className="transition-colors"
                style={{ 
                  color: PremiumTheme.colors.text.muted
                }}
                onMouseEnter={(e) => e.target.style.color = PremiumTheme.colors.burgundy[500]}
                onMouseLeave={(e) => e.target.style.color = PremiumTheme.colors.text.muted}
              >
                <FaInstagram className="w-5 h-5" />
              </a>
              <a 
                href="#" 
                className="transition-colors"
                style={{ 
                  color: PremiumTheme.colors.text.muted
                }}
                onMouseEnter={(e) => e.target.style.color = PremiumTheme.colors.burgundy[500]}
                onMouseLeave={(e) => e.target.style.color = PremiumTheme.colors.text.muted}
              >
                <FaTwitter className="w-5 h-5" />
              </a>
            </div>
          </div>
          
          <div>
            <h3 
              className="text-lg font-medium mb-4"
              style={{ color: PremiumTheme.colors.text.primary }}
            >Quick Links</h3>
            <ul className="space-y-2">
              {quickLinks.map((link, index) => (
                <li key={index}><Link 
                  to={link.to} 
                  className="transition-colors"
                  style={{ color: PremiumTheme.colors.text.muted }}
                  onMouseEnter={(e) => e.target.style.color = PremiumTheme.colors.burgundy[500]}
                  onMouseLeave={(e) => e.target.style.color = PremiumTheme.colors.text.muted}
                >{link.label}</Link></li>
              ))}
            </ul>
          </div>
          
          <div>
            <h3 
              className="text-lg font-medium mb-4"
              style={{ color: PremiumTheme.colors.text.primary }}
            >Opening Hours</h3>
            <ul className="space-y-3">
              {openingHours.map((item, index) => (
                <li key={index} style={{ color: PremiumTheme.colors.text.muted }}>
                  <div 
                    className="font-medium"
                    style={{ color: PremiumTheme.colors.text.secondary }}
                  >{item.day}</div>
                  <div className="text-sm">Lunch: {item.lunch}</div>
                  <div className="text-sm">Dinner: {item.dinner}</div>
                </li>
              ))}
            </ul>
          </div>
          
          <div>
            <h3 
              className="text-lg font-medium mb-4"
              style={{ color: PremiumTheme.colors.text.primary }}
            >Contact Us</h3>
            <ul className="space-y-3">
              <li className="flex items-start">
                <FaMapMarkerAlt 
                  className="w-5 h-5 mt-1 mr-3" 
                  style={{ color: PremiumTheme.colors.burgundy[500] }}
                />
                <span style={{ color: PremiumTheme.colors.text.muted }}>25 West Street, Storrington, West Sussex, RH20 4DZ</span>
              </li>
              <li className="flex items-center">
                <FaPhone 
                  className="w-5 h-5 mr-3" 
                  style={{ color: PremiumTheme.colors.burgundy[500] }}
                />
                <span style={{ color: PremiumTheme.colors.text.muted }}>01903 743605</span>
              </li>
              <li className="flex items-center">
                <FaEnvelope 
                  className="w-5 h-5 mr-3" 
                  style={{ color: PremiumTheme.colors.burgundy[500] }}
                />
                <span style={{ color: PremiumTheme.colors.text.muted }}>info@cottagetandoori.com</span>
              </li>
            </ul>
          </div>
        </div>
        
        <div 
          className="mt-12 pt-8 border-t text-center text-sm"
          style={{
            borderColor: PremiumTheme.colors.border.medium,
            color: PremiumTheme.colors.text.muted
          }}
        >
          <p>&copy; {new Date().getFullYear()} Cottage Tandoori. All rights reserved.</p>
          <div className="mt-2 space-x-4">
            <a 
              href="#" 
              className="transition-colors"
              style={{ color: PremiumTheme.colors.text.muted }}
              onMouseEnter={(e) => e.target.style.color = PremiumTheme.colors.burgundy[500]}
              onMouseLeave={(e) => e.target.style.color = PremiumTheme.colors.text.muted}
            >Privacy Policy</a>
            <a 
              href="#" 
              className="transition-colors"
              style={{ color: PremiumTheme.colors.text.muted }}
              onMouseEnter={(e) => e.target.style.color = PremiumTheme.colors.burgundy[500]}
              onMouseLeave={(e) => e.target.style.color = PremiumTheme.colors.text.muted}
            >Terms of Service</a>
            {isAdmin && (
              <Link 
                to="/admin-portal" 
                className="transition-colors"
                style={{ color: PremiumTheme.colors.text.muted }}
                onMouseEnter={(e) => e.target.style.color = PremiumTheme.colors.burgundy[500]}
                onMouseLeave={(e) => e.target.style.color = PremiumTheme.colors.text.muted}
              >Admin</Link>
            )}
          </div>
        </div>
      </div>
    </footer>
  );
}
