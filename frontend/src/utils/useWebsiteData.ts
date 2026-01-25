/**
 * Hook for public pages to load website content from Supabase.
 *
 * Checks URL for ?preview=draft to determine which state to load:
 * - Default (no param): loads live_content (published state)
 * - ?preview=draft: loads draft_content (for CMS preview iframe)
 *
 * Falls back gracefully to null if DB fetch fails,
 * allowing callers to use hardcoded defaults.
 */

import { useQuery } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import { supabase } from './supabaseClient';

const WEBSITE_DATA_STALE_TIME = 5 * 60 * 1000; // 5 minutes for public pages

export function useWebsiteData<T = Record<string, any>>(section: string): T | null {
  const [searchParams] = useSearchParams();
  const isPreview = searchParams.get('preview') === 'draft';

  const { data } = useQuery<T | null>({
    queryKey: ['website-public', section, isPreview ? 'draft' : 'live'],
    queryFn: async () => {
      try {
        const client = supabase;
        if (!client) return null;

        const { data: rows, error } = await client
          .from('website_config')
          .select('draft_content, live_content')
          .eq('section', section)
          .limit(1);

        if (error || !rows || rows.length === 0) return null;

        const row = rows[0];
        const content = isPreview ? row.draft_content : row.live_content;
        return (content as T) || null;
      } catch {
        return null;
      }
    },
    staleTime: isPreview ? 5_000 : WEBSITE_DATA_STALE_TIME,
    retry: 1,
  });

  return data ?? null;
}

/**
 * Hook to check if the current page is in preview/draft mode.
 */
export function useIsPreviewMode(): boolean {
  const [searchParams] = useSearchParams();
  return searchParams.get('preview') === 'draft';
}
