/**
 * Utility to load the Google Maps API only once
 */

type GoogleMapsCallback = () => void;

interface GoogleMapsLoaderOptions {
  apiKey: string;
  libraries?: string[];
}

class GoogleMapsLoader {
  private static instance: GoogleMapsLoader;
  private callbacks: GoogleMapsCallback[] = [];
  private isLoading = false;
  private isLoaded = false;
  private scriptId = 'google-maps-script';

  private constructor() {}

  public static getInstance(): GoogleMapsLoader {
    if (!GoogleMapsLoader.instance) {
      GoogleMapsLoader.instance = new GoogleMapsLoader();
    }
    return GoogleMapsLoader.instance;
  }

  /**
   * Load the Google Maps API if not already loaded
   */
  public load(options: GoogleMapsLoaderOptions, callback?: GoogleMapsCallback): void {
    // If callback is provided, add it to the queue
    if (callback) {
      this.callbacks.push(callback);
    }

    // If API is already loaded, execute callback immediately
    if (this.isLoaded && window.google && window.google.maps) {
      this.executeCallbacks();
      return;
    }

    // If already loading, just wait for it to complete
    if (this.isLoading) {
      return;
    }

    // Check if script is already in the DOM
    if (document.getElementById(this.scriptId)) {
      return;
    }

    this.isLoading = true;

    // Load the script
    const script = document.createElement('script');
    script.id = this.scriptId;
    script.type = 'text/javascript';
    script.src = `https://maps.googleapis.com/maps/api/js?key=${options.apiKey}&libraries=${options.libraries?.join(',') || 'places'}&loading=async`;
    script.async = true;
    script.defer = true;

    // Handle script load
    script.onload = () => {
      // It's possible the Maps API takes a moment to initialize after script loads
      const checkForMaps = () => {
        if (window.google && window.google.maps) {
          this.isLoaded = true;
          this.isLoading = false;
          this.executeCallbacks();
        } else {
          // If Maps isn't available yet, check again in 100ms
          setTimeout(checkForMaps, 100);
        }
      };
      checkForMaps();
    };

    // Handle script error
    script.onerror = (error) => {
      console.error('Error loading Google Maps API:', error);
      this.isLoading = false;
      this.callbacks = []; // Clear callbacks to prevent hanging
    };

    // Add script to DOM
    document.head.appendChild(script);
  }

  /**
   * Execute all callbacks
   */
  private executeCallbacks(): void {
    const callbacks = [...this.callbacks]; // Create a copy to avoid issues if callbacks register new callbacks
    this.callbacks = [];
    
    callbacks.forEach((callback) => {
      try {
        callback();
      } catch (error) {
        console.error('Error executing Google Maps callback:', error);
      }
    });
  }

  /**
   * Check if Google Maps API is loaded
   */
  public isApiLoaded(): boolean {
    return this.isLoaded && !!window.google && !!window.google.maps;
  }
}

// Export a singleton instance
export const googleMapsLoader = GoogleMapsLoader.getInstance();
