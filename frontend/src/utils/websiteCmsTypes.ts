/**
 * TypeScript types for the Website CMS system.
 * Maps to the backend Pydantic models and Supabase table schemas.
 */

// ============================================================================
// WEBSITE CONFIG (website_config table - JSONB sections)
// ============================================================================

export interface WebsiteConfigSection {
  id: string;
  section: string;
  content: Record<string, any> | null;
  draft_content: Record<string, any> | null;
  live_content: Record<string, any> | null;
  last_published: string | null;
  has_unpublished_changes: boolean;
}

export interface HeroContent {
  title: string;
  subtitle: string;
  images: string[];
  title_font?: string;
  body_font?: string;
}

export interface StoryContent {
  title: string;
  paragraphs: string[];
  background_image: string;
  cta_text: string;
}

export interface TestimonialItem {
  id: number;
  text: string;
  author: string;
  location: string;
  rating: number;
  initials: string;
  bgColor: string;
  textColor: string;
}

export interface TestimonialsContent {
  title: string;
  subtitle: string;
  reviews: TestimonialItem[];
}

export interface OpeningHoursEntry {
  day: string;
  hours: string;
  lunch: string;
  dinner: string;
}

export interface ContactContent {
  address: string;
  phones: string[];
  emails: string[];
  opening_hours: OpeningHoursEntry[];
}

export interface FooterContent {
  company_description: string;
  copyright_text: string;
  newsletter_text: string;
  social_links: Record<string, string>;
}

export interface AboutHeritageContent {
  title: string;
  paragraphs: string[];
  images: string[];
}

export interface CoreValueItem {
  icon: string;
  title: string;
  description: string;
}

export interface AboutValuesContent {
  title: string;
  subtitle: string;
  values: CoreValueItem[];
}

export interface TimelineArticle {
  id: number;
  year: string;
  title: string;
  description: string;
  image: string;
}

export interface AboutTimelineContent {
  title: string;
  articles: TimelineArticle[];
}

export interface TeamMember {
  id: number;
  name: string;
  role: string;
  description: string;
  image: string;
  years: string;
}

export interface AboutTeamContent {
  title: string;
  subtitle: string;
  members: TeamMember[];
}

export interface AboutAwardsContent {
  title: string;
  subtitle: string;
  award_name: string;
  years: string;
  description: string;
  image: string;
}

// ============================================================================
// WEBSITE THEME (website_theme table)
// ============================================================================

export interface WebsiteThemeVariable {
  id: string;
  theme_key: string;
  category: string | null;
  subcategory: string | null;
  label: string | null;
  description: string | null;
  value: string | null;
  draft_value: string | null;
  published_value: string | null;
  has_unpublished_changes: boolean;
}

// ============================================================================
// WEBSITE LAYOUT (website_layout table)
// ============================================================================

export interface WebsiteLayoutItem {
  id: string;
  layout_key: string;
  page: string | null;
  component: string | null;
  layout_type: string | null;
  label: string | null;
  config: Record<string, any> | null;
  draft_config: Record<string, any> | null;
  published_config: Record<string, any> | null;
  has_unpublished_changes: boolean;
}

// ============================================================================
// API RESPONSES
// ============================================================================

export interface PublishResponse {
  success: boolean;
  tables_updated: number;
  items_published: number;
  message: string;
}

export interface UnpublishedChangesResponse {
  has_changes: boolean;
  total_count: number;
  config_changes: number;
  theme_changes: number;
  layout_changes: number;
}

export interface ImageUploadResponse {
  success: boolean;
  asset_id: string | null;
  urls: Record<string, string> | null;
  error: string | null;
}

// ============================================================================
// CMS UI STATE
// ============================================================================

export type CMSPage = 'home' | 'about' | 'contact' | 'gallery';

export type CMSSubTab = 'content' | 'theme' | 'layout';

export interface CMSEditorState {
  activePage: CMSPage;
  activeSubTab: CMSSubTab;
  previewPage: CMSPage;
  isDirty: boolean;
}
