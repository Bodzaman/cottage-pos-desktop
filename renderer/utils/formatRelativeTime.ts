/**
 * Formats a date into a relative time string (e.g., "2 hours ago", "3 days ago")
 */
export function formatRelativeTime(date: string | Date): string {
  const now = new Date();
  const pastDate = typeof date === 'string' ? new Date(date) : date;
  
  if (isNaN(pastDate.getTime())) {
    return 'Invalid date';
  }
  
  const seconds = Math.floor((now.getTime() - pastDate.getTime()) / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  const weeks = Math.floor(days / 7);
  const months = Math.floor(days / 30); // Approximate
  const years = Math.floor(days / 365); // Approximate
  
  if (seconds < 60) {
    return 'Just now';
  } else if (minutes < 60) {
    return `${minutes} ${minutes === 1 ? 'minute' : 'minutes'} ago`;
  } else if (hours < 24) {
    return `${hours} ${hours === 1 ? 'hour' : 'hours'} ago`;
  } else if (days < 7) {
    return `${days} ${days === 1 ? 'day' : 'days'} ago`;
  } else if (weeks < 4) {
    return `${weeks} ${weeks === 1 ? 'week' : 'weeks'} ago`;
  } else if (months < 12) {
    return `${months} ${months === 1 ? 'month' : 'months'} ago`;
  } else {
    return `${years} ${years === 1 ? 'year' : 'years'} ago`;
  }
}

/**
 * Formats a date into a short relative time string with optional full date tooltip
 */
export function formatRelativeTimeWithTooltip(date: string | Date): { text: string; tooltip: string } {
  const pastDate = typeof date === 'string' ? new Date(date) : date;
  
  if (isNaN(pastDate.getTime())) {
    return { text: 'Invalid date', tooltip: 'Invalid date' };
  }
  
  // Format full date for tooltip
  const fullDate = pastDate.toLocaleString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long', 
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric'
  });
  
  return {
    text: formatRelativeTime(pastDate),
    tooltip: fullDate
  };
}