import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';

interface PortalTooltipProps {
  children: React.ReactNode;
  content: React.ReactNode;
  className?: string;
}

export function PortalTooltip({ children, content, className = '' }: PortalTooltipProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const triggerRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  const updatePosition = () => {
    if (!triggerRef.current) return;
    
    const rect = triggerRef.current.getBoundingClientRect();
    const tooltipWidth = 300; // max-w-[300px]
    const tooltipHeight = 120; // estimated height
    
    let x = rect.left - tooltipWidth - 10; // Position to the left with offset
    let y = rect.top + (rect.height / 2) - (tooltipHeight / 2); // Center vertically
    
    // Ensure tooltip doesn't go off-screen
    if (x < 10) {
      x = rect.right + 10; // Position to the right if no space on left
    }
    
    if (y < 10) {
      y = 10; // Ensure it doesn't go above viewport
    }
    
    if (y + tooltipHeight > window.innerHeight - 10) {
      y = window.innerHeight - tooltipHeight - 10; // Ensure it doesn't go below viewport
    }
    
    setPosition({ x, y });
  };

  const handleMouseEnter = () => {
    setIsVisible(true);
    updatePosition();
  };

  const handleMouseLeave = () => {
    setIsVisible(false);
  };

  useEffect(() => {
    const handleScroll = () => {
      if (isVisible) {
        updatePosition();
      }
    };

    const handleResize = () => {
      if (isVisible) {
        updatePosition();
      }
    };

    window.addEventListener('scroll', handleScroll, true);
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('scroll', handleScroll, true);
      window.removeEventListener('resize', handleResize);
    };
  }, [isVisible]);

  return (
    <>
      <div
        ref={triggerRef}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        className="inline-block"
      >
        {children}
      </div>
      
      {isVisible && createPortal(
        <div
          ref={tooltipRef}
          className={`fixed pointer-events-none z-[10000] bg-[#2A2A2A] border border-[#3A3A3A] text-white max-w-[300px] p-3 rounded-md shadow-xl transition-opacity duration-200 ${className}`}
          style={{
            left: `${position.x}px`,
            top: `${position.y}px`,
          }}
          onMouseEnter={handleMouseLeave} // Hide if somehow mouse enters tooltip
        >
          {content}
        </div>,
        document.body
      )}
    </>
  );
}
