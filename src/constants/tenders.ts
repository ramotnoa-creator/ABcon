import type { TenderStatus, TenderType } from '../types';

export const TENDER_STATUS_LABELS: Record<TenderStatus, string> = {
  Draft: 'טיוטה',
  Open: 'פתוח',
  WinnerSelected: 'זוכה נבחר',
  Canceled: 'בוטל',
};

export const TENDER_STATUS_COLORS: Record<TenderStatus, string> = {
  Draft: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-200',
  Open: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200',
  WinnerSelected: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200',
  Canceled: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200',
};

export const TENDER_TYPE_LABELS: Record<TenderType, string> = {
  architect: 'אדריכל',
  engineer: 'מהנדס',
  contractor: 'קבלן',
  electrician: 'חשמלאי',
  plumber: 'אינסטלטור',
  interior_designer: 'מעצב פנים',
  other: 'אחר',
};
