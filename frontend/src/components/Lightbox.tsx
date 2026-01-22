import { motion, AnimatePresence } from "framer-motion";
import { FaChevronLeft, FaChevronRight, FaTimes } from "react-icons/fa";
import { PremiumTheme } from "utils/premiumTheme";
import type { GalleryImage } from "utils/galleryData";
import { useEffect } from "react";

interface Props {
  images: GalleryImage[];
  currentIndex: number;
  onClose: () => void;
  onNavigate: (direction: 'prev' | 'next') => void;
}

export function Lightbox({ images, currentIndex, onClose, onNavigate }: Props) {
  const currentImage = images[currentIndex];

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'Escape':
          onClose();
          break;
        case 'ArrowLeft':
          onNavigate('prev');
          break;
        case 'ArrowRight':
          onNavigate('next');
          break;
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [onClose, onNavigate]);

  if (!currentImage) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center"
        style={{ background: 'rgba(0, 0, 0, 0.95)' }}
        onClick={onClose}
      >
        {/* Close button */}
        <button
          className="absolute top-6 right-6 z-10 w-12 h-12 rounded-full flex items-center justify-center transition-colors"
          style={{
            background: 'rgba(255, 255, 255, 0.1)',
            backdropFilter: 'blur(10px)',
            color: PremiumTheme.colors.text.primary
          }}
          onClick={onClose}
        >
          <FaTimes className="text-xl" />
        </button>

        {/* Navigation buttons */}
        {images.length > 1 && (
          <>
            <button
              className="absolute left-6 top-1/2 transform -translate-y-1/2 z-10 w-12 h-12 rounded-full flex items-center justify-center transition-colors"
              style={{
                background: 'rgba(255, 255, 255, 0.1)',
                backdropFilter: 'blur(10px)',
                color: PremiumTheme.colors.text.primary
              }}
              onClick={(e) => {
                e.stopPropagation();
                onNavigate('prev');
              }}
            >
              <FaChevronLeft className="text-xl" />
            </button>

            <button
              className="absolute right-6 top-1/2 transform -translate-y-1/2 z-10 w-12 h-12 rounded-full flex items-center justify-center transition-colors"
              style={{
                background: 'rgba(255, 255, 255, 0.1)',
                backdropFilter: 'blur(10px)',
                color: PremiumTheme.colors.text.primary
              }}
              onClick={(e) => {
                e.stopPropagation();
                onNavigate('next');
              }}
            >
              <FaChevronRight className="text-xl" />
            </button>
          </>
        )}

        {/* Image container */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.8, opacity: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="relative max-w-7xl max-h-[90vh] mx-4"
          onClick={(e) => e.stopPropagation()}
        >
          <img
            src={currentImage.src}
            alt={currentImage.alt}
            className="max-w-full max-h-full object-contain rounded-lg"
          />
          
          {/* Image info */}
          <div 
            className="absolute bottom-0 left-0 right-0 p-6 rounded-b-lg"
            style={{
              background: 'linear-gradient(to top, rgba(0,0,0,0.8), transparent)',
            }}
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 
                  className="text-xl font-semibold mb-1"
                  style={{ 
                    color: PremiumTheme.colors.text.primary,
                    fontFamily: PremiumTheme.typography.fontFamily.sans
                  }}
                >
                  {currentImage.title}
                </h3>
                
                {currentImage.description && (
                  <p 
                    className="text-sm"
                    style={{ color: PremiumTheme.colors.text.secondary }}
                  >
                    {currentImage.description}
                  </p>
                )}
              </div>
              
              <div className="flex items-center gap-3">
                <span 
                  className="px-3 py-1 rounded-full text-xs font-medium capitalize"
                  style={{
                    background: currentImage.category === 'food' 
                      ? 'rgba(139, 21, 56, 0.9)' 
                      : 'rgba(78, 75, 102, 0.9)',
                    color: PremiumTheme.colors.text.primary
                  }}
                >
                  {currentImage.category}
                </span>
                
                <span 
                  className="text-sm"
                  style={{ color: PremiumTheme.colors.text.muted }}
                >
                  {currentIndex + 1} / {images.length}
                </span>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
