/**
 * Linked Table Color Utility
 * 
 * Provides consistent color assignment for linked table groups.
 * Tables with the same linked_table_group_id will have matching glow borders.
 * 
 * Design: Clean, minimal approach with matching border glows (no connector lines)
 */

/**
 * Color palette for linked table groups
 * Each group gets a distinct color for instant visual recognition
 */
export const LINKED_TABLE_COLORS = [
  {
    name: 'Purple',
    primary: '#8B5CF6',
    glow: 'rgba(139, 92, 246, 0.4)',
    background: 'rgba(139, 92, 246, 0.08)',
    border: 'rgba(139, 92, 246, 0.5)'
  },
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
    name: 'Emerald',
    primary: '#10B981',
    glow: 'rgba(16, 185, 129, 0.4)',
    background: 'rgba(16, 185, 129, 0.08)',
    border: 'rgba(16, 185, 129, 0.5)'
  }
];

/**
 * Hash function to convert UUID to color index
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
 * Get color scheme for a linked table group
 * Returns consistent color based on group_id hash
 */
export function getLinkedTableColor(groupId: string | null | undefined) {
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
