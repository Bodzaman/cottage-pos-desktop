/**
 * Centralized utility for auth pages background image
 * Used across SignUp, Login, and CustomerPortal pages
 */

export const AUTH_BACKGROUND_IMAGE_URL = 
  "https://static.databutton.com/public/88a315b0-faa2-491d-9215-cf1e283cdee2/Sketch_Logo_Cottage_16x9.png";

/**
 * Common background style for auth pages
 */
export const getAuthBackgroundStyle = () => ({
  backgroundImage: `url(${AUTH_BACKGROUND_IMAGE_URL})`,
  backgroundSize: 'cover',
  backgroundPosition: 'center center'
});
