import { motion } from "framer-motion";
import { FaExpand } from "react-icons/fa";
import { PremiumTheme } from "utils/premiumTheme";
import type { GalleryImage } from "utils/galleryData";

interface Props {
  image: GalleryImage;
  onClick: (imageId: number) => void;
}

export function GalleryItem({ image, onClick }: Props) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration: 0.3 }}
      className="group relative overflow-hidden rounded-xl cursor-pointer"
      onClick={() => onClick(image.id)}
      style={{
        background: 'rgba(255, 255, 255, 0.05)',
        backdropFilter: 'blur(10px)',
        border: `1px solid ${PremiumTheme.colors.border.light}`
      }}
    >
      {/* Image */}
      <div className="relative aspect-[4/3] overflow-hidden">
        <img
          src={image.src}
          alt={image.alt}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          loading="lazy"
        />
        
        {/* Overlay */}
        <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        
        {/* Expand icon */}
        <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <div 
            className="w-10 h-10 rounded-full flex items-center justify-center"
            style={{
              background: 'rgba(255, 255, 255, 0.1)',
              backdropFilter: 'blur(10px)'
            }}
          >
            <FaExpand 
              className="text-white text-sm" 
            />
          </div>
        </div>
        
        {/* Category badge */}
        <div className="absolute top-4 left-4">
          <span 
            className="px-3 py-1 rounded-full text-xs font-medium capitalize"
            style={{
              background: image.category === 'food' 
                ? 'rgba(139, 21, 56, 0.9)' 
                : 'rgba(78, 75, 102, 0.9)',
              color: PremiumTheme.colors.text.primary,
              backdropFilter: 'blur(10px)'
            }}
          >
            {image.category}
          </span>
        </div>
      </div>
      
      {/* Content */}
      <div className="p-4">
        <h3 
          className="font-semibold mb-2 line-clamp-1"
          style={{ 
            color: PremiumTheme.colors.text.primary,
            fontFamily: PremiumTheme.typography.fontFamily.sans
          }}
        >
          {image.title}
        </h3>
        
        {image.description && (
          <p 
            className="text-sm line-clamp-2"
            style={{ color: PremiumTheme.colors.text.muted }}
          >
            {image.description}
          </p>
        )}
      </div>
    </motion.div>
  );
}
