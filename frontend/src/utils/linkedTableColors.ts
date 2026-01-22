/**
 * Linked Table Color Utility
 *
 * Provides consistent color assignment for linked table groups.
 * Tables with the same linked_table_group_id will have matching glow borders.
 *
 * Design: Clean, minimal approach with matching border glows (no connector lines)
 */

/**
 * Type for linked table color
 */
export interface LinkedTableColor {
  name: string;
  primary: string;
  glow: string;
  background: string;
  border: string;
}

/**
 * Expanded color palette for linked table groups (10 colors)
 * Each active linked group gets a unique color via dynamic assignment
 * Colors are recycled when groups are cleared
 */
export const LINKED_TABLE_COLORS: LinkedTableColor[] = [
  {
    name: 'Turquoise',
    primary: '#14B8A6',
    glow: 'rgba(20, 184, 166, 0.4)',
    background: 'rgba(20, 184, 166, 0.08)',
    border: 'rgba(20, 184, 166, 0.5)'
  },
  {
    name: 'Gold',
    primary: '#F59E0B',
    glow: 'rgba(245, 158, 11, 0.4)',
    background: 'rgba(245, 158, 11, 0.08)',
    border: 'rgba(245, 158, 11, 0.5)'
  },
  {
    name: 'Pink',
    primary: '#EC4899',
    glow: 'rgba(236, 72, 153, 0.4)',
    background: 'rgba(236, 72, 153, 0.08)',
    border: 'rgba(236, 72, 153, 0.5)'
  },
  {
    name: 'Blue',
    primary: '#3B82F6',
    glow: 'rgba(59, 130, 246, 0.4)',
    background: 'rgba(59, 130, 246, 0.08)',
    border: 'rgba(59, 130, 246, 0.5)'
  },
  {
    name: 'Violet',
    primary: '#8B5CF6',
    glow: 'rgba(139, 92, 246, 0.4)',
    background: 'rgba(139, 92, 246, 0.08)',
    border: 'rgba(139, 92, 246, 0.5)'
  },
  {
    name: 'Orange',
    primary: '#F97316',
    glow: 'rgba(249, 115, 22, 0.4)',
    background: 'rgba(249, 115, 22, 0.08)',
    border: 'rgba(249, 115, 22, 0.5)'
  },
  {
    name: 'Cyan',
    primary: '#06B6D4',
    glow: 'rgba(6, 182, 212, 0.4)',
    background: 'rgba(6, 182, 212, 0.08)',
    border: 'rgba(6, 182, 212, 0.5)'
  },
  {
    name: 'Lime',
    primary: '#84CC16',
    glow: 'rgba(132, 204, 22, 0.4)',
    background: 'rgba(132, 204, 22, 0.08)',
    border: 'rgba(132, 204, 22, 0.5)'
  },
  {
    name: 'Rose',
    primary: '#F43F5E',
    glow: 'rgba(244, 63, 94, 0.4)',
    background: 'rgba(244, 63, 94, 0.08)',
    border: 'rgba(244, 63, 94, 0.5)'
  },
  {
    name: 'Indigo',
    primary: '#6366F1',
    glow: 'rgba(99, 102, 241, 0.4)',
    background: 'rgba(99, 102, 241, 0.08)',
    border: 'rgba(99, 102, 241, 0.5)'
  }
];

/**
 * Build a color map for all active linked groups
 * Uses dynamic sequential assignment to ensure no two active groups share a color
 * Call this once at dashboard level, pass down to cards
 */
export function buildLinkedGroupColorMap(
  tables: Array<{ linked_table_group_id?: string | null }>
): Map<string, LinkedTableColor> {
  // Extract unique group IDs, filter nulls
  const groupIds = [...new Set(
    tables
      .map(t => t.linked_table_group_id)
      .filter((id): id is string => !!id)
  )];

  // Sort by timestamp embedded in group_id (format: "group_1234567890")
  groupIds.sort((a, b) => {
    const timestampA = parseInt(a.replace('group_', '')) || 0;
    const timestampB = parseInt(b.replace('group_', '')) || 0;
    return timestampA - timestampB;
  });

  // Assign colors sequentially
  const colorMap = new Map<string, LinkedTableColor>();
  groupIds.forEach((groupId, index) => {
    colorMap.set(groupId, LINKED_TABLE_COLORS[index % LINKED_TABLE_COLORS.length]);
  });

  return colorMap;
}

/**
 * Get color for a specific group from pre-built map
 */
export function getLinkedTableColorFromMap(
  groupId: string | null | undefined,
  colorMap: Map<string, LinkedTableColor>
): LinkedTableColor | null {
  if (!groupId) return null;
  return colorMap.get(groupId) || null;
}

/**
 * Hash function to convert UUID to color index (LEGACY - used for fallback)
 * Ensures same group_id always gets same color
 */
function hashStringToIndex(str: string, arrayLength: number): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash) % arrayLength;
}

/**
 * Get color scheme for a linked table group (LEGACY fallback)
 * Prefer using buildLinkedGroupColorMap + getLinkedTableColorFromMap for dynamic assignment
 */
export function getLinkedTableColor(groupId: string | null | undefined): LinkedTableColor | null {
  if (!groupId) {
    return null;
  }

  const colorIndex = hashStringToIndex(groupId, LINKED_TABLE_COLORS.length);
  return LINKED_TABLE_COLORS[colorIndex];
}

/**
 * Format linked table numbers for display
 * Used in badges: "PRIMARY (w/ T2, T3)" or "Linked to T1"
 */
export function formatLinkedTablesList(
  tableNumbers: number[] | null | undefined,
  currentTableNumber: number
): string {
  if (!tableNumbers || tableNumbers.length === 0) {
    return '';
  }

  // Remove current table from the list
  const otherTables = tableNumbers.filter(num => num !== currentTableNumber);

  if (otherTables.length === 0) {
    return '';
  }

  // Sort numerically
  const sortedTables = otherTables.sort((a, b) => a - b);

  // Format as "T2, T3, T4" or just "T2" for single table
  return sortedTables.map(num => `T${num}`).join(', ');
}

/**
 * Generate badge text for linked tables
 * Shows relationship clearly to staff
 */
export function getLinkedTableBadgeText(
  isPrimary: boolean,
  linkedTables: number[] | null | undefined,
  currentTableNumber: number
): string {
  const otherTablesText = formatLinkedTablesList(linkedTables, currentTableNumber);

  if (!otherTablesText) {
    return isPrimary ? 'PRIMARY' : 'LINKED';
  }

  if (isPrimary) {
    return `PRIMARY (w/ ${otherTablesText})`;
  } else {
    return `Linked to ${otherTablesText}`;
  }
}
