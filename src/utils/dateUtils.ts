/**
 * Calculate target permit date based on start date and duration in months
 */
export function calculateTargetDate(startDate: string, durationMonths: number): string | null {
  if (!startDate || !durationMonths) return null;
  
  try {
    const start = new Date(startDate);
    const target = new Date(start);
    target.setMonth(target.getMonth() + durationMonths);
    return target.toISOString().split('T')[0];
  } catch {
    return null;
  }
}

/**
 * Format date to Hebrew locale display format (DD/MM/YYYY)
 */
export function formatDateForDisplay(dateString: string | null | undefined): string {
  if (!dateString) return '--/--/----';
  
  try {
    const date = new Date(dateString);
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  } catch {
    return '--/--/----';
  }
}

/**
 * Get current date formatted for display
 */
export function getCurrentDateFormatted(): string {
  return formatDateForDisplay(new Date().toISOString());
}

/**
 * Format date to Hebrew text format (like "24 באוקטובר 2023")
 */
export function formatDateHebrew(dateString: string | null | undefined): string {
  if (!dateString) return '';
  
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('he-IL', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  } catch {
    return '';
  }
}
