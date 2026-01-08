import { POSSettings } from './posSettingsTypes';

declare global {
  interface Window {
    posSettings?: POSSettings;
  }
}
