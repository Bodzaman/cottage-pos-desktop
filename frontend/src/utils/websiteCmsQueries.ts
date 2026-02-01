/**
 * React Query hooks for the Website CMS system.
 *
 * - Admin operations (mutations) go through the backend API at /routes/website-cms/*
 * - Public reads can use direct Supabase queries (RLS allows public SELECT)
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from './supabaseClient';
import { toast } from 'sonner';
import type {
  WebsiteConfigSection,
  WebsiteThemeVariable,
  WebsiteLayoutItem,
  PublishResponse,
  UnpublishedChangesResponse,
  ImageUploadResponse,
} from './websiteCmsTypes';

// ============================================================================
// QUERY KEY FACTORY
// ============================================================================

export const websiteKeys = {
  all: ['website'] as const,
  configs: () => [...websiteKeys.all, 'configs'] as const,
  config: (section: string) => [...websiteKeys.configs(), section] as const,
  theme: () => [...websiteKeys.all, 'theme'] as const,
  layout: (page: string) => [...websiteKeys.all, 'layout', page] as const,
  unpublishedChanges: () => [...websiteKeys.all, 'unpublished'] as const,
} as const;

// ============================================================================
// BACKEND API HELPER + ELECTRON DIRECT SUPABASE FALLBACK
// ============================================================================

const BACKEND_URL = import.meta.env.VITE_RIFF_BACKEND_URL || '';
const API_BASE = BACKEND_URL
  ? `${BACKEND_URL}/routes/website-cms`
  : '/routes/website-cms';

// Detect if we're in Electron mode (no backend available)
const isElectronMode = typeof window !== 'undefined' &&
  'electronAPI' in window &&
  !BACKEND_URL;

/**
 * Direct Supabase implementation for Electron mode.
 * Handles all CMS operations when backend is not available.
 */
async function electronCmsApi<T = any>(path: string, options: RequestInit = {}): Promise<T> {
  const method = options.method || 'GET';
  const body = options.body ? JSON.parse(options.body as string) : null;

  // Parse path and query params
  const [pathPart, queryString] = path.split('?');
  const params = new URLSearchParams(queryString || '');
  const state = params.get('state') || 'draft';
  const pathSegments = pathPart.split('/').filter(Boolean);

  // Route to appropriate handler
  if (pathSegments[0] === 'config') {
    if (method === 'GET') {
      if (pathSegments.length === 1) {
        // GET /config - fetch all sections
        const { data, error } = await supabase
          .from('website_config')
          .select('*')
          .order('section');
        if (error) throw new Error(error.message);
        return { success: true, sections: data || [] } as T;
      } else {
        // GET /config/{section}
        const section = pathSegments[1];
        const { data, error } = await supabase
          .from('website_config')
          .select('*')
          .eq('section', section)
          .single();
        if (error) throw new Error(error.message);
        return data as T;
      }
    } else if (method === 'PUT' && pathSegments.length === 2) {
      // PUT /config/{section}
      const section = pathSegments[1];
      const { error } = await supabase
        .from('website_config')
        .update({ draft_content: body.draft_content, updated_at: new Date().toISOString() })
        .eq('section', section);
      if (error) throw new Error(error.message);
      return { success: true } as T;
    }
  }

  if (pathSegments[0] === 'theme') {
    if (method === 'GET') {
      // GET /theme
      const { data, error } = await supabase
        .from('website_theme')
        .select('*')
        .order('theme_key');
      if (error) throw new Error(error.message);
      return { success: true, variables: data || [] } as T;
    } else if (method === 'PUT' && pathSegments.length === 2) {
      // PUT /theme/{theme_key}
      const themeKey = pathSegments[1];
      const { error } = await supabase
        .from('website_theme')
        .update({ draft_value: body.draft_value, updated_at: new Date().toISOString() })
        .eq('theme_key', themeKey);
      if (error) throw new Error(error.message);
      return { success: true } as T;
    }
  }

  if (pathSegments[0] === 'layout') {
    if (method === 'GET' && pathSegments.length === 2) {
      // GET /layout/{page}
      const page = pathSegments[1];
      const { data, error } = await supabase
        .from('website_layout')
        .select('*')
        .eq('page', page)
        .order('layout_key');
      if (error) throw new Error(error.message);
      return { success: true, layouts: data || [] } as T;
    } else if (method === 'PUT' && pathSegments.length === 3) {
      // PUT /layout/{page}/{layout_key}
      const page = pathSegments[1];
      const layoutKey = pathSegments[2];
      const { error } = await supabase
        .from('website_layout')
        .update({ draft_config: body.draft_config, updated_at: new Date().toISOString() })
        .eq('page', page)
        .eq('layout_key', layoutKey);
      if (error) throw new Error(error.message);
      return { success: true } as T;
    }
  }

  if (pathSegments[0] === 'publish' && method === 'POST') {
    // Publish: copy draft to live for all tables
    // Fetch all records and update live_* from draft_*
    const [configRes, themeRes, layoutRes] = await Promise.all([
      supabase.from('website_config').select('*'),
      supabase.from('website_theme').select('*'),
      supabase.from('website_layout').select('*'),
    ]);

    if (configRes.error || themeRes.error || layoutRes.error) {
      throw new Error('Failed to fetch data for publish');
    }

    // Update configs: copy draft_content to live_content
    const configUpdates = (configRes.data || []).map(row =>
      supabase.from('website_config')
        .update({ live_content: row.draft_content, updated_at: new Date().toISOString() })
        .eq('section', row.section)
    );

    // Update theme: copy draft_value to live_value
    const themeUpdates = (themeRes.data || []).map(row =>
      supabase.from('website_theme')
        .update({ live_value: row.draft_value, updated_at: new Date().toISOString() })
        .eq('theme_key', row.theme_key)
    );

    // Update layout: copy draft_config to live_config
    const layoutUpdates = (layoutRes.data || []).map(row =>
      supabase.from('website_layout')
        .update({ live_config: row.draft_config, updated_at: new Date().toISOString() })
        .eq('id', row.id)
    );

    await Promise.all([...configUpdates, ...themeUpdates, ...layoutUpdates]);
    return { success: true, message: 'All changes published successfully' } as T;
  }

  if (pathSegments[0] === 'discard' && method === 'POST') {
    // Discard: copy live back to draft for all tables
    const [configRes, themeRes, layoutRes] = await Promise.all([
      supabase.from('website_config').select('*'),
      supabase.from('website_theme').select('*'),
      supabase.from('website_layout').select('*'),
    ]);

    if (configRes.error || themeRes.error || layoutRes.error) {
      throw new Error('Failed to fetch data for discard');
    }

    // Update configs: copy live_content back to draft_content
    const configUpdates = (configRes.data || []).map(row =>
      supabase.from('website_config')
        .update({ draft_content: row.live_content, updated_at: new Date().toISOString() })
        .eq('section', row.section)
    );

    // Update theme: copy live_value back to draft_value
    const themeUpdates = (themeRes.data || []).map(row =>
      supabase.from('website_theme')
        .update({ draft_value: row.live_value, updated_at: new Date().toISOString() })
        .eq('theme_key', row.theme_key)
    );

    // Update layout: copy live_config back to draft_config
    const layoutUpdates = (layoutRes.data || []).map(row =>
      supabase.from('website_layout')
        .update({ draft_config: row.live_config, updated_at: new Date().toISOString() })
        .eq('id', row.id)
    );

    await Promise.all([...configUpdates, ...themeUpdates, ...layoutUpdates]);
    return { success: true, message: 'All changes discarded' } as T;
  }

  if (pathSegments[0] === 'unpublished-changes' && method === 'GET') {
    // Count unpublished changes by comparing draft vs live
    const [configRes, themeRes, layoutRes] = await Promise.all([
      supabase.from('website_config').select('section, draft_content, live_content'),
      supabase.from('website_theme').select('theme_key, draft_value, live_value'),
      supabase.from('website_layout').select('id, draft_config, live_config'),
    ]);

    let configChanges = 0, themeChanges = 0, layoutChanges = 0;

    // Count config changes (where draft != live)
    (configRes.data || []).forEach(row => {
      if (JSON.stringify(row.draft_content) !== JSON.stringify(row.live_content)) {
        configChanges++;
      }
    });

    // Count theme changes
    (themeRes.data || []).forEach(row => {
      if (row.draft_value !== row.live_value) {
        themeChanges++;
      }
    });

    // Count layout changes
    (layoutRes.data || []).forEach(row => {
      if (JSON.stringify(row.draft_config) !== JSON.stringify(row.live_config)) {
        layoutChanges++;
      }
    });

    const totalChanges = configChanges + themeChanges + layoutChanges;
    return {
      success: true,
      total_changes: totalChanges,
      by_type: { config: configChanges, theme: themeChanges, layout: layoutChanges }
    } as T;
  }

  throw new Error(`Unsupported CMS operation: ${method} ${path}`);
}

async function cmsApi<T = any>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  // Use direct Supabase in Electron mode
  if (isElectronMode) {
    return electronCmsApi<T>(path, options);
  }

  // Standard backend API call
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...options.headers as Record<string, string> },
    ...options,
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(error.detail || `API error: ${res.status}`);
  }

  return res.json();
}

// ============================================================================
// CONFIG QUERIES & MUTATIONS
// ============================================================================

export function useAllWebsiteConfigs(state: 'draft' | 'published' = 'draft') {
  return useQuery<{ success: boolean; sections: WebsiteConfigSection[] }>({
    queryKey: [...websiteKeys.configs(), state],
    queryFn: () => cmsApi(`/config?state=${state}`),
    staleTime: 30_000,
  });
}

export function useWebsiteConfig(section: string, state: 'draft' | 'published' = 'draft') {
  return useQuery<WebsiteConfigSection>({
    queryKey: [...websiteKeys.config(section), state],
    queryFn: () => cmsApi(`/config/${section}?state=${state}`),
    staleTime: 30_000,
    enabled: !!section,
  });
}

export function useUpdateConfig() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ section, draft_content }: { section: string; draft_content: Record<string, any> }) =>
      cmsApi(`/config/${section}`, {
        method: 'PUT',
        body: JSON.stringify({ draft_content }),
      }),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: websiteKeys.configs() });
      queryClient.invalidateQueries({ queryKey: websiteKeys.unpublishedChanges() });
      toast.success(`${variables.section} draft updated`);
    },
    onError: (error: Error) => {
      toast.error(`Failed to update: ${error.message}`);
    },
  });
}

// ============================================================================
// THEME QUERIES & MUTATIONS
// ============================================================================

export function useWebsiteTheme(state: 'draft' | 'published' = 'draft') {
  return useQuery<{ success: boolean; variables: WebsiteThemeVariable[] }>({
    queryKey: [...websiteKeys.theme(), state],
    queryFn: () => cmsApi(`/theme?state=${state}`),
    staleTime: 30_000,
  });
}

export function useUpdateTheme() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ theme_key, draft_value }: { theme_key: string; draft_value: string }) =>
      cmsApi(`/theme/${theme_key}`, {
        method: 'PUT',
        body: JSON.stringify({ draft_value }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: websiteKeys.theme() });
      queryClient.invalidateQueries({ queryKey: websiteKeys.unpublishedChanges() });
    },
    onError: (error: Error) => {
      toast.error(`Failed to update theme: ${error.message}`);
    },
  });
}

// ============================================================================
// LAYOUT QUERIES & MUTATIONS
// ============================================================================

export function useWebsiteLayout(page: string, state: 'draft' | 'published' = 'draft') {
  return useQuery<{ success: boolean; layouts: WebsiteLayoutItem[] }>({
    queryKey: [...websiteKeys.layout(page), state],
    queryFn: () => cmsApi(`/layout/${page}?state=${state}`),
    staleTime: 30_000,
    enabled: !!page,
  });
}

export function useUpdateLayout() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ page, layout_key, draft_config }: { page: string; layout_key: string; draft_config: Record<string, any> }) =>
      cmsApi(`/layout/${page}/${layout_key}`, {
        method: 'PUT',
        body: JSON.stringify({ draft_config }),
      }),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: websiteKeys.layout(variables.page) });
      queryClient.invalidateQueries({ queryKey: websiteKeys.unpublishedChanges() });
    },
    onError: (error: Error) => {
      toast.error(`Failed to update layout: ${error.message}`);
    },
  });
}

// ============================================================================
// PUBLISH / DISCARD
// ============================================================================

export function usePublishAll() {
  const queryClient = useQueryClient();

  return useMutation<PublishResponse>({
    mutationFn: () => cmsApi('/publish', { method: 'POST' }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: websiteKeys.all });
      toast.success(data.message || 'All changes published');
    },
    onError: (error: Error) => {
      toast.error(`Publish failed: ${error.message}`);
    },
  });
}

export function useDiscardChanges() {
  const queryClient = useQueryClient();

  return useMutation<PublishResponse>({
    mutationFn: () => cmsApi('/discard', { method: 'POST' }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: websiteKeys.all });
      toast.success(data.message || 'All changes discarded');
    },
    onError: (error: Error) => {
      toast.error(`Discard failed: ${error.message}`);
    },
  });
}

// ============================================================================
// UNPUBLISHED CHANGES
// ============================================================================

export function useUnpublishedChanges() {
  return useQuery<UnpublishedChangesResponse>({
    queryKey: websiteKeys.unpublishedChanges(),
    queryFn: () => cmsApi('/unpublished-changes'),
    staleTime: 10_000,
    refetchInterval: 30_000,
  });
}

// ============================================================================
// IMAGE UPLOAD
// ============================================================================

export function useUploadWebsiteImage() {
  const queryClient = useQueryClient();

  return useMutation<ImageUploadResponse, Error, { file: File; section: string; alt_text?: string }>({
    mutationFn: async ({ file, section, alt_text }) => {
      // Electron mode: upload directly to Supabase Storage
      if (isElectronMode) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${section}/${Date.now()}-${Math.random().toString(36).substr(2, 9)}.${fileExt}`;

        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('website-assets')
          .upload(fileName, file, {
            cacheControl: '3600',
            upsert: false
          });

        if (uploadError) throw new Error(uploadError.message);

        // Get public URL
        const { data: urlData } = supabase.storage
          .from('website-assets')
          .getPublicUrl(fileName);

        return {
          success: true,
          url: urlData.publicUrl,
          asset_id: fileName,
          alt_text: alt_text || ''
        };
      }

      // Standard backend API call
      const formData = new FormData();
      formData.append('file', file);
      formData.append('section', section);
      if (alt_text) formData.append('alt_text', alt_text);

      const res = await fetch(`${API_BASE}/image/upload`, {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        throw new Error(`Upload failed: ${res.statusText}`);
      }

      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: websiteKeys.configs() });
    },
    onError: (error) => {
      toast.error(`Image upload failed: ${error.message}`);
    },
  });
}

export function useDeleteWebsiteImage() {
  const queryClient = useQueryClient();

  return useMutation<any, Error, { asset_id: string; section: string }>({
    mutationFn: async ({ asset_id, section }) => {
      // Electron mode: delete directly from Supabase Storage
      if (isElectronMode) {
        const { error } = await supabase.storage
          .from('website-assets')
          .remove([asset_id]);

        if (error) throw new Error(error.message);
        return { success: true };
      }

      // Standard backend API call
      return cmsApi(`/image/${asset_id}?section=${section}`, { method: 'DELETE' });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: websiteKeys.configs() });
    },
    onError: (error) => {
      toast.error(`Delete failed: ${error.message}`);
    },
  });
}
