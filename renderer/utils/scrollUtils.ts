// Initialize AOS animations on page load
export const initializeAnimations = () => {
  // Check if AOS is available (it will be added via CDN in index.html)
  if (typeof window !== 'undefined' && (window as any).AOS) {
    const AOS = (window as any).AOS;
    AOS.init({
      duration: 800,
      once: true,
      offset: 100,
      easing: 'ease-out',
    });
  }
};

// Hide scrollbar utility class
export const addScrollbarHideStyles = () => {
  // Create a new style element instead of accessing existing stylesheets
  // This avoids security errors when trying to access cssRules
  const style = document.createElement('style');
  document.head.appendChild(style);
  
  const hideScrollbarCSS = `
    .hide-scrollbar::-webkit-scrollbar { display: none; }
    .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
  `;
  
  // Set the CSS text directly
  style.textContent = hideScrollbarCSS;
};
