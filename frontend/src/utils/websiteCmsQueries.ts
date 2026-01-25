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
// BACKEND API HELPER
// ============================================================================

const BACKEND_URL = import.meta.env.VITE_RIFF_BACKEND_URL || '';
const API_BASE = BACKEND_URL
  ? `${BACKEND_URL}/routes/website-cms`
  : '/routes/website-cms';

async function cmsApi<T = any>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
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
    mutationFn: ({ asset_id, section }) =>
      cmsApi(`/image/${asset_id}?section=${section}`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: websiteKeys.configs() });
    },
    onError: (error) => {
      toast.error(`Delete failed: ${error.message}`);
    },
  });
}
