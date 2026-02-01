import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  FaMapMarkerAlt,
  FaPhone,
  FaEnvelope,
  FaClock,
  FaDirections,
  FaMapSigns,
  FaFacebook,
  FaInstagram,
  FaTripadvisor,
  FaUtensils,
} from "react-icons/fa";
import { UniversalHeader } from "components/UniversalHeader";
import { Footer } from "components/Footer";
import { PremiumTheme } from "utils/premiumTheme";
import { Card, CardContent } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { useWebsiteData } from "utils/useWebsiteData";
import { SEO } from "components/SEO";
import { PAGE_SEO } from "utils/seoData";

export default function Contact() {
  const contactData = useWebsiteData<{ opening_hours?: any[]; phones?: string[]; emails?: string[]; address?: string }>('contact');

  const activePhone = contactData?.phones?.[0] || '01903 743605';
  const activeEmail = contactData?.emails?.[0] || 'info@cottagetandoori.com';
  const activeAddress = contactData?.address || '25 West Street\nStorrington\nPulborough\nWest Sussex\nRH20 4DZ';

  const defaultWeekdayHours = [
    { day: "Monday", hours: "12:00 PM - 2:00 PM | 5:00 PM - 10:00 PM" },
    { day: "Tuesday", hours: "12:00 PM - 2:00 PM | 5:00 PM - 10:00 PM" },
    { day: "Wednesday", hours: "12:00 PM - 2:00 PM | 5:00 PM - 10:00 PM" },
    { day: "Thursday", hours: "12:00 PM - 2:00 PM | 5:00 PM - 10:00 PM" },
  ];
  const defaultWeekendHours = [
    { day: "Friday", hours: "12:00 PM - 2:00 PM | 5:00 PM - 10:30 PM" },
    { day: "Saturday", hours: "12:00 PM - 2:00 PM | 5:00 PM - 10:30 PM" },
    { day: "Sunday", hours: "12:00 PM - 3:00 PM | 5:00 PM - 10:00 PM" },
  ];

  // If CMS has detailed_hours (individual day entries), use those; otherwise use defaults
  const detailedHours = (contactData as any)?.detailed_hours as { day: string; hours: string }[] | undefined;
  const weekdayHours = detailedHours?.slice(0, 4) || defaultWeekdayHours;
  const weekendHours = detailedHours?.slice(4) || defaultWeekendHours;

  useEffect(() => {
    // Scroll to top when component mounts
    window.scrollTo(0, 0);
  }, []);

  return (
    <div
      className="min-h-screen"
      style={{
        background: PremiumTheme.colors.background.primary,
        color: PremiumTheme.colors.text.primary
      }}
    >
      <SEO title={PAGE_SEO.contact.title} description={PAGE_SEO.contact.description} path="/contact" />
      {/* Universal Header */}
      <UniversalHeader 
        context="PUBLIC_NAV"
        transparent={false}
        showAuthButtons={true}
        showCart={true}
        showThemeToggle={true}
      />
      
      {/* Hero Section */}
      {/* TODO: Static image below should be migrated to Supabase storage via Website CMS */}
      <section className="relative h-[40dvh] md:h-[60dvh] flex items-center pt-20">
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-black opacity-60 z-10"></div>
          <img
            src="https://static.databutton.com/public/6d13cbb4-0d00-46ec-8ef0-98e0a8405532/MAIN RESTAURANT EXTERIOR .jpg" 
            alt="Cottage Tandoori Restaurant" 
            className="w-full h-full object-cover"
          />
        </div>
        <div className="container mx-auto px-4 relative z-20">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h1 
              className="text-4xl md:text-6xl mb-6"
              style={{ 
                fontFamily: PremiumTheme.typography.fontFamily.serif,
                color: PremiumTheme.colors.text.primary 
              }}
            >
              Contact Us
            </h1>
            <p 
              className="text-xl max-w-xl"
              style={{ color: PremiumTheme.colors.text.secondary }}
            >
              Get in touch with us for reservations, inquiries, or just to say hello. We'd love to hear from you.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Glassmorphism Floating Contact Card */}
      <section className="relative -mt-16 px-4 z-10">
        <div className="container mx-auto">
          <motion.div
            className="max-w-4xl mx-auto"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
          >
            <Card 
              className="border"
              style={{
                background: 'rgba(255, 255, 255, 0.1)',
                backdropFilter: 'blur(20px)',
                borderColor: 'rgba(255, 255, 255, 0.2)',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)'
              }}
            >
              <CardContent className="p-8">
                <div className="flex flex-col md:flex-row items-center justify-center space-y-6 md:space-y-0 md:space-x-12 text-center">
                  {/* Phone Number Display */}
                  <div className="flex items-center space-x-4">
                    <div 
                      className="p-3 rounded-full"
                      style={{ backgroundColor: PremiumTheme.colors.burgundy[500] }}
                    >
                      <FaPhone className="text-white text-lg" />
                    </div>
                    <div className="text-left">
                      <p 
                        className="text-sm font-medium mb-1"
                        style={{ color: PremiumTheme.colors.text.secondary }}
                      >
                        Call us now
                      </p>
                      <a
                        href={`tel:${activePhone.replace(/\s/g, '')}`}
                        className="text-2xl font-bold transition-colors duration-300"
                        style={{
                          color: PremiumTheme.colors.text.primary,
                          fontFamily: PremiumTheme.typography.fontFamily.serif
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.color = PremiumTheme.colors.burgundy[400];
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.color = PremiumTheme.colors.text.primary;
                        }}
                      >
                        {activePhone}
                      </a>
                    </div>
                  </div>
                  
                  {/* Separator */}
                  <div 
                    className="hidden md:block w-px h-16"
                    style={{ backgroundColor: 'rgba(255, 255, 255, 0.2)' }}
                  ></div>
                  
                  {/* Action Buttons */}
                  <div className="flex items-center space-x-4">
                    <a
                      href={`tel:${activePhone.replace(/\s/g, '')}`}
                      aria-label={`Call Cottage Tandoori at ${activePhone}`}
                      className="px-6 py-3 rounded-lg font-semibold transition-all duration-300 flex items-center space-x-2 text-white"
                      style={{
                        backgroundColor: PremiumTheme.colors.burgundy[500]
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = PremiumTheme.colors.burgundy[600];
                        e.currentTarget.style.transform = 'translateY(-2px)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = PremiumTheme.colors.burgundy[500];
                        e.currentTarget.style.transform = 'translateY(0)';
                      }}
                    >
                      <FaPhone className="text-sm" aria-hidden="true" />
                      <span>Call Now</span>
                    </a>
                    <a
                      href="https://www.google.com/maps/dir//25+West+St,+Storrington,+Pulborough+RH20+4DZ"
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label="Get directions to Cottage Tandoori on Google Maps"
                      className="px-6 py-3 rounded-lg font-semibold transition-all duration-300 flex items-center space-x-2"
                      style={{
                        background: 'rgba(255, 255, 255, 0.1)',
                        backdropFilter: 'blur(10px)',
                        border: '1px solid rgba(255, 255, 255, 0.2)',
                        color: PremiumTheme.colors.text.primary
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)';
                        e.currentTarget.style.transform = 'translateY(-2px)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
                        e.currentTarget.style.transform = 'translateY(0)';
                      }}
                    >
                      <FaMapMarkerAlt className="text-sm" aria-hidden="true" />
                      <span>Get Directions</span>
                    </a>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </section>

      {/* Enhanced Contact Information Section */}
      <section className="py-16 px-4">
        <div className="container mx-auto">
          <motion.div
            className="text-center mb-12"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <h2 
              className="text-4xl mb-4"
              style={{ 
                fontFamily: PremiumTheme.typography.fontFamily.serif,
                color: PremiumTheme.colors.text.primary 
              }}
            >
              Get In Touch
            </h2>
            <div 
              className="w-20 h-1 mx-auto mb-6"
              style={{ backgroundColor: PremiumTheme.colors.burgundy[500] }}
            ></div>
            <p 
              className="text-lg max-w-3xl mx-auto"
              style={{ color: PremiumTheme.colors.text.secondary }}
            >
              Whether you're planning a special celebration, have dietary requirements, or simply want to make a reservation, 
              we're here to help make your dining experience perfect.
            </p>
          </motion.div>

          {/* Enhanced Contact Details Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8 max-w-6xl xl:max-w-7xl mx-auto mb-12">
            {/* Address */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
            >
              <Card 
                className="border h-full"
                style={{
                  background: 'rgba(255, 255, 255, 0.05)',
                  backdropFilter: 'blur(10px)',
                  borderColor: PremiumTheme.colors.border.light
                }}
              >
                <CardContent className="p-8 text-center">
                  <div 
                    className="p-4 rounded-full w-16 h-16 mx-auto mb-6 flex items-center justify-center"
                    style={{ backgroundColor: PremiumTheme.colors.burgundy[500] }}
                  >
                    <FaMapMarkerAlt className="text-white text-xl" />
                  </div>
                  <h3 
                    className="text-xl font-semibold mb-4"
                    style={{ 
                      color: PremiumTheme.colors.text.primary,
                      fontFamily: PremiumTheme.typography.fontFamily.serif 
                    }}
                  >
                    Visit Us
                  </h3>
                  <p
                    className="leading-relaxed"
                    style={{ color: PremiumTheme.colors.text.secondary }}
                  >
                    {activeAddress.split('\n').map((line, i, arr) => (
                      <React.Fragment key={i}>{line}{i < arr.length - 1 && <br />}</React.Fragment>
                    ))}
                  </p>
                  <a
                    href="https://www.google.com/maps/dir//25+West+St,+Storrington,+Pulborough+RH20+4DZ"
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Get directions to Cottage Tandoori on Google Maps"
                    className="mt-4 inline-block px-4 py-2 rounded-lg transition-all duration-300"
                    style={{
                      backgroundColor: PremiumTheme.colors.burgundy[500],
                      color: 'white'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = PremiumTheme.colors.burgundy[600];
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = PremiumTheme.colors.burgundy[500];
                    }}
                  >
                    Get Directions
                  </a>
                </CardContent>
              </Card>
            </motion.div>

            {/* Phone */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.1 }}
              viewport={{ once: true }}
            >
              <Card 
                className="border h-full"
                style={{
                  background: 'rgba(255, 255, 255, 0.05)',
                  backdropFilter: 'blur(10px)',
                  borderColor: PremiumTheme.colors.border.light
                }}
              >
                <CardContent className="p-8 text-center">
                  <div 
                    className="p-4 rounded-full w-16 h-16 mx-auto mb-6 flex items-center justify-center"
                    style={{ backgroundColor: PremiumTheme.colors.burgundy[500] }}
                  >
                    <FaPhone className="text-white text-xl" />
                  </div>
                  <h3 
                    className="text-xl font-semibold mb-4"
                    style={{ 
                      color: PremiumTheme.colors.text.primary,
                      fontFamily: PremiumTheme.typography.fontFamily.serif 
                    }}
                  >
                    Call Us
                  </h3>
                  <p 
                    className="text-2xl font-bold mb-2"
                    style={{ color: PremiumTheme.colors.text.primary }}
                  >
                    <a
                      href={`tel:${activePhone.replace(/\s/g, '')}`}
                      className="transition-colors"
                      style={{ color: PremiumTheme.colors.text.primary }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.color = PremiumTheme.colors.burgundy[400];
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.color = PremiumTheme.colors.text.primary;
                      }}
                    >
                      {activePhone}
                    </a>
                  </p>
                  <p
                    className="mb-4"
                    style={{ color: PremiumTheme.colors.text.muted }}
                  >
                    For reservations & takeaway orders
                  </p>
                  <a 
                    href={`tel:${activePhone.replace(/\s/g, '')}`}
                    className="inline-block px-6 py-2 rounded-lg transition-all duration-300"
                    style={{
                      backgroundColor: PremiumTheme.colors.burgundy[500],
                      color: 'white'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = PremiumTheme.colors.burgundy[600];
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = PremiumTheme.colors.burgundy[500];
                    }}
                  >
                    Call Now
                  </a>
                </CardContent>
              </Card>
            </motion.div>

            {/* Email */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              viewport={{ once: true }}
            >
              <Card 
                className="border h-full"
                style={{
                  background: 'rgba(255, 255, 255, 0.05)',
                  backdropFilter: 'blur(10px)',
                  borderColor: PremiumTheme.colors.border.light
                }}
              >
                <CardContent className="p-8 text-center">
                  <div 
                    className="p-4 rounded-full w-16 h-16 mx-auto mb-6 flex items-center justify-center"
                    style={{ backgroundColor: PremiumTheme.colors.burgundy[500] }}
                  >
                    <FaEnvelope className="text-white text-xl" />
                  </div>
                  <h3 
                    className="text-xl font-semibold mb-4"
                    style={{ 
                      color: PremiumTheme.colors.text.primary,
                      fontFamily: PremiumTheme.typography.fontFamily.serif 
                    }}
                  >
                    Email Us
                  </h3>
                  <p 
                    className="text-lg font-semibold mb-2"
                    style={{ color: PremiumTheme.colors.text.primary }}
                  >
                    <a 
                      href={`mailto:${activeEmail}`} 
                      className="transition-colors"
                      style={{ color: PremiumTheme.colors.text.primary }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.color = PremiumTheme.colors.burgundy[400];
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.color = PremiumTheme.colors.text.primary;
                      }}
                    >
                      {activeEmail}
                    </a>
                  </p>
                  <p 
                    className="mb-4"
                    style={{ color: PremiumTheme.colors.text.muted }}
                  >
                    General inquiries & feedback
                  </p>
                  <a 
                    href={`mailto:${activeEmail}`}
                    className="inline-block px-6 py-2 rounded-lg transition-all duration-300"
                    style={{
                      backgroundColor: PremiumTheme.colors.burgundy[500],
                      color: 'white'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = PremiumTheme.colors.burgundy[600];
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = PremiumTheme.colors.burgundy[500];
                    }}
                  >
                    Send Email
                  </a>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Social Media */}
          <motion.div
            className="text-center"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            viewport={{ once: true }}
          >
            <h3 
              className="text-2xl font-semibold mb-6"
              style={{ 
                color: PremiumTheme.colors.text.primary,
                fontFamily: PremiumTheme.typography.fontFamily.serif 
              }}
            >
              Follow Us
            </h3>
            <div className="flex justify-center space-x-4">
              {[
                { icon: FaFacebook, href: "#", label: "Facebook" },
                { icon: FaInstagram, href: "#", label: "Instagram" },
                { icon: FaTripadvisor, href: "#", label: "TripAdvisor" }
              ].map((social, index) => (
                <a 
                  key={index}
                  href={social.href} 
                  className="p-4 rounded-lg transition-all duration-300"
                  style={{
                    background: 'rgba(255, 255, 255, 0.05)',
                    backdropFilter: 'blur(10px)',
                    border: `1px solid ${PremiumTheme.colors.border.light}`
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = PremiumTheme.colors.burgundy[500];
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.05)';
                  }}
                  aria-label={social.label}
                >
                  <social.icon className="text-white text-xl" />
                </a>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Opening Hours Section */}
      <section 
        className="py-16 px-4"
        style={{ backgroundColor: PremiumTheme.colors.background.secondary }}
      >
        <div className="container mx-auto">
          <div className="max-w-4xl mx-auto">
            <motion.div
              className="text-center mb-12"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
            >
              <h2 
                className="text-3xl mb-4"
                style={{ 
                  fontFamily: PremiumTheme.typography.fontFamily.serif,
                  color: PremiumTheme.colors.text.primary 
                }}
              >
                Opening Hours
              </h2>
              <div 
                className="w-20 h-1 mx-auto mb-6"
                style={{ backgroundColor: PremiumTheme.colors.burgundy[500] }}
              ></div>
              <p style={{ color: PremiumTheme.colors.text.secondary }}>
                We're open throughout the week to serve you delicious Indian cuisine. 
                Please note that we may have special hours during holidays.
              </p>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              viewport={{ once: true }}
            >
              <Card 
                className="border"
                style={{
                  background: 'rgba(255, 255, 255, 0.05)',
                  backdropFilter: 'blur(10px)',
                  borderColor: PremiumTheme.colors.border.light
                }}
              >
                <CardContent className="p-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      {weekdayHours.map((item, index, array) => (
                        <div 
                          key={index}
                          className={`flex items-center justify-between py-3 ${index !== array.length - 1 ? 'border-b' : ''}`}
                          style={{ borderColor: PremiumTheme.colors.border.light }}
                        >
                          <span style={{ color: PremiumTheme.colors.text.secondary }}>{item.day}</span>
                          <span 
                            className="font-medium text-sm"
                            style={{ color: PremiumTheme.colors.text.primary }}
                          >
                            {item.hours}
                          </span>
                        </div>
                      ))}
                    </div>
                    
                    <div className="space-y-4">
                      {weekendHours.map((item, index, array) => (
                        <div 
                          key={index}
                          className={`flex items-center justify-between py-3 ${index !== array.length - 1 ? 'border-b' : ''}`}
                          style={{ borderColor: PremiumTheme.colors.border.light }}
                        >
                          <span style={{ color: PremiumTheme.colors.text.secondary }}>{item.day}</span>
                          <span 
                            className="font-medium text-sm"
                            style={{ color: PremiumTheme.colors.text.primary }}
                          >
                            {item.hours}
                          </span>
                        </div>
                      ))}
                      <div className="flex items-center justify-center py-3">
                        <div 
                          className="flex items-center space-x-2"
                          style={{ color: PremiumTheme.colors.burgundy[400] }}
                        >
                          <FaClock className="text-sm" />
                          <span className="text-sm">Last orders 30 minutes before closing</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Map Section */}
      <section className="py-16 px-4">
        <div className="container mx-auto">
          <motion.div
            className="text-center mb-12"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <h2 
              className="text-3xl mb-4"
              style={{ 
                fontFamily: PremiumTheme.typography.fontFamily.serif,
                color: PremiumTheme.colors.text.primary 
              }}
            >
              Find Us
            </h2>
            <div 
              className="w-20 h-1 mx-auto mb-6"
              style={{ backgroundColor: PremiumTheme.colors.burgundy[500] }}
            ></div>
            <p 
              className="max-w-2xl mx-auto"
              style={{ color: PremiumTheme.colors.text.secondary }}
            >
              Located in the heart of Storrington, West Sussex, in a beautiful period flint cottage. 
              We have parking available and are easily accessible by public transport.
            </p>
          </motion.div>
          
          <div className="max-w-6xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
            >
              <Card 
                className="border overflow-hidden"
                style={{
                  background: 'rgba(255, 255, 255, 0.05)',
                  backdropFilter: 'blur(10px)',
                  borderColor: PremiumTheme.colors.border.light
                }}
              >
                <CardContent className="p-0">
                  <div className="aspect-video w-full">
                    <iframe
                      src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2511.771893966142!2d-0.4572387236394928!3d50.91851135465146!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x4875a48c0cb3d01f%3A0xb9f6ef6c45ab9899!2s25%20West%20St%2C%20Storrington%2C%20Pulborough%20RH20%204DZ!5e0!3m2!1sen!2suk!4v1710700856412!5m2!1sen!2suk"
                      width="100%"
                      height="100%"
                      style={{ border: 0 }}
                      allowFullScreen
                      loading="lazy"
                      referrerPolicy="no-referrer-when-downgrade"
                      className="w-full h-full"
                    ></iframe>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
            
            <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                {
                  icon: FaMapMarkerAlt,
                  title: "Easy to Find",
                  description: "Located on West Street in the center of Storrington village"
                },
                {
                  icon: FaUtensils,
                  title: "Dine In & Takeaway",
                  description: "Enjoy our cozy restaurant or order for collection"
                },
                {
                  icon: FaPhone,
                  title: "Call Ahead",
                  description: "Reservations recommended, especially on weekends"
                }
              ].map((item, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: index * 0.1 }}
                  viewport={{ once: true }}
                >
                  <Card 
                    className="border"
                    style={{
                      background: 'rgba(255, 255, 255, 0.05)',
                      backdropFilter: 'blur(10px)',
                      borderColor: PremiumTheme.colors.border.light
                    }}
                  >
                    <CardContent className="p-6 text-center">
                      <div 
                        className="p-4 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center"
                        style={{ backgroundColor: PremiumTheme.colors.burgundy[500] }}
                      >
                        <item.icon className="text-white text-xl" />
                      </div>
                      <h3 
                        className="font-semibold mb-2"
                        style={{ 
                          color: PremiumTheme.colors.text.primary,
                          fontFamily: PremiumTheme.typography.fontFamily.serif 
                        }}
                      >
                        {item.title}
                      </h3>
                      <p 
                        className="text-sm"
                        style={{ color: PremiumTheme.colors.text.secondary }}
                      >
                        {item.description}
                      </p>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>
      
      <Footer />
    </div>
  );
}
