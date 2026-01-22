// Re-export app-compat as default (brain) for Electron builds
// This allows frontend code that imports 'brain' to work in Electron
// without needing a backend server - using Supabase direct queries instead

import { apiClient } from './app-compat';

export default apiClient;
export { apiClient };
