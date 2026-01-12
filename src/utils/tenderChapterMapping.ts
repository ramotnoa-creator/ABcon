import type { TenderType, BudgetCategoryType, BudgetCategory, BudgetChapter } from '../types';

/**
 * Map tender types to budget category types
 */
export const tenderToCategoryType: Record<TenderType, BudgetCategoryType> = {
  architect: 'consultants',
  engineer: 'consultants',
  interior_designer: 'consultants',
  contractor: 'contractors',
  electrician: 'contractors',
  plumber: 'contractors',
  other: 'contractors',
};

/**
 * Map tender types to suggested chapter names (Hebrew)
 */
export const tenderToChapterName: Record<TenderType, string> = {
  architect: 'אדריכלות',
  engineer: 'הנדסה',
  interior_designer: 'עיצוב פנים',
  contractor: 'עבודות קבלן',
  electrician: 'עבודות חשמל',
  plumber: 'אינסטלציה',
  other: 'אחר',
};

/**
 * Get the budget category type for a tender type
 */
export function getCategoryTypeForTender(tenderType: TenderType): BudgetCategoryType {
  return tenderToCategoryType[tenderType] || 'contractors';
}

/**
 * Find the most appropriate chapter for a tender based on its type
 * Returns the chapter ID or null if no matching chapter found
 */
export function findChapterForTender(
  tenderType: TenderType,
  chapters: BudgetChapter[],
  categories: BudgetCategory[]
): string | null {
  const targetCategoryType = getCategoryTypeForTender(tenderType);
  const suggestedChapterName = tenderToChapterName[tenderType];

  // Find category of the right type
  const matchingCategory = categories.find((c) => c.type === targetCategoryType);
  if (!matchingCategory) {
    // Fallback: return first chapter if available
    return chapters[0]?.id || null;
  }

  // Get chapters in this category
  const categoryChapters = chapters.filter((ch) => ch.category_id === matchingCategory.id);
  if (categoryChapters.length === 0) {
    // Fallback: return first chapter if available
    return chapters[0]?.id || null;
  }

  // Try to find a chapter matching the suggested name
  const exactMatch = categoryChapters.find((ch) =>
    ch.name.toLowerCase().includes(suggestedChapterName.toLowerCase())
  );
  if (exactMatch) {
    return exactMatch.id;
  }

  // Fallback: return first chapter in the matching category
  return categoryChapters[0].id;
}

/**
 * Get display label for a tender type in Hebrew
 */
export function getTenderTypeLabel(tenderType: TenderType): string {
  const labels: Record<TenderType, string> = {
    architect: 'אדריכל',
    engineer: 'מהנדס',
    interior_designer: 'מעצב פנים',
    contractor: 'קבלן',
    electrician: 'חשמלאי',
    plumber: 'אינסטלטור',
    other: 'אחר',
  };
  return labels[tenderType] || tenderType;
}

/**
 * Get display label for a budget category type in Hebrew
 */
export function getCategoryTypeLabel(categoryType: BudgetCategoryType): string {
  const labels: Record<BudgetCategoryType, string> = {
    consultants: 'יועצים',
    suppliers: 'ספקים',
    contractors: 'קבלנים',
  };
  return labels[categoryType] || categoryType;
}
