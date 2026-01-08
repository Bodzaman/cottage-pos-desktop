import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Menu, X, Settings } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface MobileNavProps {
  activeSection: string | null;
}

export default function MobileNav({ activeSection }: MobileNavProps) {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);

  // Close the mobile menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (isOpen && !target.closest('.mobile-nav-container')) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Navigation links
  const navLinks = [
    { name: 'Home', path: '/' },
    { name: 'Menu', path: '/Menu' },
    { name: 'Reservations', path: '/Reservations' },
    { name: 'Contact', path: '/Contact' },
    { name: 'About Us', path: '/About' },
    { name: 'Portal', path: '/admin' },
  ];

  // Staff navigation links
  const staffLinks = [
    { name: 'POS', path: '/pos-desktop' },
    { name: 'POS Settings', path: '/pos-settings', icon: Settings },
  ];

  // Handle navigation
  const handleNavigation = (path: string) => {
    setIsOpen(false);
    navigate(path);
  };

  // Determine if a link is active
  const isActive = (name: string) => {
    if (!activeSection) return false;
    return activeSection.toLowerCase() === name.toLowerCase();
  };

  return (
    <>
      {/* Mobile Navigation Button */}
      <div className="fixed top-4 right-4 z-50 lg:hidden">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="p-2 rounded-full bg-black/50 backdrop-blur-md border border-white/10 shadow-lg"
          aria-label="Toggle mobile menu"
        >
          {isOpen ? (
            <X className="h-6 w-6 text-white" />
          ) : (
            <Menu className="h-6 w-6 text-white" />
          )}
        </button>
      </div>

      {/* Mobile Navigation Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, x: 300 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 300 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="fixed top-0 right-0 z-40 h-screen w-[80%] max-w-sm bg-black/95 backdrop-blur-lg mobile-nav-container shadow-2xl"
          >
            <div className="p-6 h-full flex flex-col">
              <div className="flex justify-between items-center mb-8">
                <h2 className="text-xl text-white font-serif">Cottage Tandoori</h2>
                <button 
                  onClick={() => setIsOpen(false)}
                  className="p-2 rounded-full bg-gray-800/50"
                >
                  <X className="h-5 w-5 text-white" />
                </button>
              </div>
              
              <nav className="flex-grow">
                <ul className="space-y-4">
                  {navLinks.map((link) => (
                    <li key={link.name}>
                      <button
                        onClick={() => handleNavigation(link.path)}
                        className={`w-full text-left py-3 px-4 rounded-lg transition-all duration-300 ${isActive(link.name) 
                          ? 'bg-rose-900/30 text-white' 
                          : 'text-gray-300 hover:bg-gray-800/50 hover:text-white'}`}
                      >
                        {link.name}
                      </button>
                    </li>
                  ))}
                </ul>

                {/* Staff Links Section */}
                <div className="mt-6 pt-6 border-t border-gray-800">
                  <h3 className="text-gray-400 text-sm mb-3 px-4">Staff Management</h3>
                  <ul className="space-y-2">
                    {staffLinks.map((link) => (
                      <li key={link.name}>
                        <button
                          onClick={() => handleNavigation(link.path)}
                          className="w-full text-left py-2 px-4 rounded-lg transition-all duration-300 flex items-center text-gray-300 hover:bg-gray-800/50 hover:text-white"
                        >
                          {link.icon && <link.icon className="h-4 w-4 mr-2" />}
                          {link.name}
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              </nav>
              
              <div className="mt-auto pt-6 border-t border-gray-800">
                <div className="flex space-x-4 justify-center">
                  <a href="#" className="p-2 rounded-full bg-gray-800/50 text-gray-400 hover:text-white transition-colors">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" />
                    </svg>
                  </a>
                  <a href="#" className="p-2 rounded-full bg-gray-800/50 text-gray-400 hover:text-white transition-colors">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z" />
                    </svg>
                  </a>
                </div>
                <p className="text-gray-500 text-sm text-center mt-4">
                  © 2025 Cottage Tandoori
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
