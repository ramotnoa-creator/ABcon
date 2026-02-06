/**
 * Comprehensive Seed Data for Testing
 * Includes edge cases and realistic scenarios
 */

import type {
  Project,
  Professional,
  Budget,
  BudgetCategory,
  BudgetChapter,
  BudgetItem,
  BudgetPayment,
  ProjectUnit,
  ProjectMilestone,
  GanttTask,
  Tender,
  TenderParticipant,
  Task,
  File,
  SpecialIssue,
  PlanningChange,
  ProjectProfessional,
  CostItem,
  PaymentSchedule,
  ScheduleItem,
} from '../types';

// Import services for Neon seeding
import { createProject } from '../services/projectsService';
import { createProfessional } from '../services/professionalsService';
import { createProjectProfessional } from '../services/projectProfessionalsService';
import { createBudget } from '../services/budgetService';
import { createBudgetCategory } from '../services/budgetCategoriesService';
import { createBudgetChapter } from '../services/budgetChaptersService';
import { createBudgetItem } from '../services/budgetItemsService';
import { createBudgetPayment } from '../services/budgetPaymentsService';
import { createUnit } from '../services/unitsService';
import { createMilestone } from '../services/milestonesService';
import { createGanttTask } from '../services/ganttTasksService';
import { createTender } from '../services/tendersService';
import { createTenderParticipant } from '../services/tenderParticipantsService';
import { createTask } from '../services/tasksService';
import { createFile } from '../services/filesService';
import { createSpecialIssue } from '../services/specialIssuesService';
import { createPlanningChange } from '../services/planningChangesService';

// ============================================================
// HELPER: Date generators
// ============================================================

const today = new Date();
const formatDate = (date: Date) => date.toISOString().split('T')[0];

const daysAgo = (days: number) => {
  const date = new Date(today);
  date.setDate(date.getDate() - days);
  return formatDate(date);
};

const daysFromNow = (days: number) => {
  const date = new Date(today);
  date.setDate(date.getDate() + days);
  return formatDate(date);
};

// ============================================================
// PROJECTS - Various lifecycle stages
// ============================================================

export const seedProjects: Project[] = [
  {
    id: 'proj-1',
    project_name: 'בניין מגורים רחוב הרצל 25',
    client_name: 'יוסי כהן',
    address: 'רחוב הרצל 25, תל אביב',
    status: 'ביצוע',
    permit_start_date: daysAgo(180),
    permit_duration_months: 24,
    permit_target_date: daysFromNow(540),
    permit_approval_date: daysAgo(150),
    created_at: daysAgo(200),
    updated_at_text: 'לפני חודשיים',
    notes: 'פרויקט גדול עם 4 קומות + מרתף חניה',
    current_vat_rate: 17,
  },
  {
    id: 'proj-2',
    project_name: 'וילה פרטית - רמת אביב',
    client_name: 'משפחת לוי',
    address: 'רמת אביב ג׳, תל אביב',
    status: 'תכנון',
    permit_start_date: daysFromNow(30),
    permit_duration_months: 18,
    permit_target_date: daysFromNow(570),
    created_at: daysAgo(90),
    updated_at_text: 'לפני שבוע',
    notes: 'וילה יוקרתית 500 מ"ר',
    current_vat_rate: 17,
  },
  {
    id: 'proj-3',
    project_name: 'שיפוץ משרדים - מגדל המוזיאון',
    client_name: 'חברת טק בע"מ',
    address: 'רחוב שאול המלך, תל אביב',
    status: 'מכרזים',
    created_at: daysAgo(60),
    updated_at_text: 'אתמול',
    notes: 'שיפוץ 3 קומות משרדים',
    current_vat_rate: 17,
  },
  {
    id: 'proj-4',
    project_name: 'בניין מגורים - עיר ימים [איחור]',
    client_name: 'קבוצת רכישה',
    address: 'נתניה',
    status: 'ביצוע',
    permit_start_date: daysAgo(400),
    permit_duration_months: 18,
    permit_target_date: daysAgo(40), // OVERDUE!
    permit_approval_date: daysAgo(380),
    created_at: daysAgo(450),
    updated_at_text: 'לפני 3 חודשים',
    notes: 'פרויקט באיחור - בעיות תקציב',
    current_vat_rate: 18,
  },
  {
    id: 'proj-5',
    project_name: 'פרויקט ריק - בלי נתונים',
    client_name: 'לקוח חדש',
    status: 'היתרים',
    created_at: daysAgo(5),
    updated_at_text: 'היום',
    notes: 'פרויקט חדש לבדיקת edge cases',
    current_vat_rate: 17,
  },
];

// ============================================================
// PROFESSIONALS - Various types and statuses
// ============================================================

export const seedProfessionals: Professional[] = [
  {
    id: 'prof-1',
    professional_name: 'אדר׳ יעל שפירא',
    field: 'architect',
    company_name: 'שפירא אדריכלים',
    phone: '050-1234567',
    email: 'yael@shapira-arch.co.il',
    is_active: true,
  },
  {
    id: 'prof-2',
    professional_name: 'מהנדס אבי מזרחי',
    field: 'engineer',
    company_name: 'מזרחי הנדסה',
    phone: '052-9876543',
    email: 'avi@mizrahi-eng.co.il',
    is_active: true,
  },
  {
    id: 'prof-3',
    professional_name: 'קבלן משה דוד',
    field: 'contractor',
    company_name: 'דוד בניין ופיתוח בע"מ',
    phone: '054-1122334',
    email: 'moshe@david-building.co.il',
    is_active: true,
  },
  {
    id: 'prof-4',
    professional_name: 'חשמלאי רוני זוהר',
    field: 'electrician',
    company_name: 'זוהר חשמל',
    phone: '053-5544332',
    email: 'roni@zohar-electric.co.il',
    is_active: true,
  },
  {
    id: 'prof-5',
    professional_name: 'אינסטלטור דני כהן',
    field: 'plumber',
    company_name: 'כהן אינסטלציה',
    phone: '050-9988776',
    is_active: true,
  },
  {
    id: 'prof-6',
    professional_name: 'מעצב פנים שי לביא [לא פעיל]',
    field: 'interior_designer',
    company_name: 'לביא עיצוב',
    phone: '052-1231231',
    is_active: false, // INACTIVE edge case
  },
  {
    id: 'prof-7',
    professional_name: 'קבלן דן בנימין - ללא פרטי יצירה',
    field: 'contractor',
    company_name: 'בנימין קבלנות',
    phone: '054-7778889',
    is_active: true,
    // Missing email - edge case
  },
];

// ============================================================
// PROJECT PROFESSIONALS - Assignments
// ============================================================

export const seedProjectProfessionals: ProjectProfessional[] = [
  // Project 1 - Full team
  {
    id: 'pp-1',
    project_id: 'proj-1',
    professional_id: 'prof-1',
    project_role: 'אדריכל ראשי',
    source: 'Manual',
    is_active: true,
  },
  {
    id: 'pp-2',
    project_id: 'proj-1',
    professional_id: 'prof-2',
    project_role: 'מהנדס ראשי',
    source: 'Tender',
    is_active: true,
  },
  {
    id: 'pp-3',
    project_id: 'proj-1',
    professional_id: 'prof-3',
    project_role: 'קבלן ראשי',
    source: 'Tender',
    is_active: true,
  },
  // Project 2 - Partial team
  {
    id: 'pp-4',
    project_id: 'proj-2',
    professional_id: 'prof-1',
    project_role: 'אדריכל',
    source: 'Manual',
    is_active: true,
  },
  // Project 3 - Single professional
  {
    id: 'pp-5',
    project_id: 'proj-3',
    professional_id: 'prof-2',
    project_role: 'מהנדס',
    source: 'Manual',
    is_active: true,
  },
  // Project 4 - Team including inactive professional (edge case)
  {
    id: 'pp-6',
    project_id: 'proj-4',
    professional_id: 'prof-3',
    project_role: 'קבלן',
    source: 'Tender',
    is_active: true,
  },
  {
    id: 'pp-7',
    project_id: 'proj-4',
    professional_id: 'prof-6',
    project_role: 'מעצב פנים',
    source: 'Manual',
    is_active: true,
  },
  // Project 5 - No assignments (edge case)
];

// ============================================================
// BUDGETS - Various scenarios
// ============================================================

export const seedBudgets: Budget[] = [
  {
    id: 'budget-1',
    project_id: 'proj-1',
    planned_budget: 5000000,
    actual_budget: 5200000,
    variance: 4.0, // Over budget
    status: 'Deviation',
    notes: 'עלייה במחירי חומרים',
    created_at: daysAgo(180),
    updated_at: daysAgo(5),
  },
  {
    id: 'budget-2',
    project_id: 'proj-2',
    planned_budget: 2500000,
    actual_budget: 150000,
    variance: -94.0, // Way under (just started)
    status: 'On Track',
    created_at: daysAgo(80),
    updated_at: daysAgo(2),
  },
  {
    id: 'budget-3',
    project_id: 'proj-4',
    planned_budget: 3000000,
    actual_budget: 3450000,
    variance: 15.0, // Significantly over budget
    status: 'At Risk',
    notes: 'פרויקט באיחור - עלויות נוספות',
    created_at: daysAgo(400),
    updated_at: daysAgo(1),
  },
  // Project 3 and 5 - No budget (edge case)
];

// ============================================================
// BUDGET CATEGORIES
// ============================================================

export const seedBudgetCategories: BudgetCategory[] = [
  // Project 1
  {
    id: 'cat-1-1',
    project_id: 'proj-1',
    name: 'יועצים',
    type: 'consultants',
    icon: 'engineering',
    color: '#3B82F6',
    order: 1,
    created_at: daysAgo(180),
    updated_at: daysAgo(180),
  },
  {
    id: 'cat-1-2',
    project_id: 'proj-1',
    name: 'קבלנים',
    type: 'contractors',
    icon: 'construction',
    color: '#F59E0B',
    order: 2,
    created_at: daysAgo(180),
    updated_at: daysAgo(180),
  },
  {
    id: 'cat-1-3',
    project_id: 'proj-1',
    name: 'ספקים',
    type: 'suppliers',
    icon: 'store',
    color: '#10B981',
    order: 3,
    created_at: daysAgo(180),
    updated_at: daysAgo(180),
  },
  // Project 2
  {
    id: 'cat-2-1',
    project_id: 'proj-2',
    name: 'יועצים',
    type: 'consultants',
    icon: 'engineering',
    color: '#3B82F6',
    order: 1,
    created_at: daysAgo(80),
    updated_at: daysAgo(80),
  },
];

// ============================================================
// BUDGET CHAPTERS - Various scenarios
// ============================================================

export const seedBudgetChapters: BudgetChapter[] = [
  // Project 1 - Full budget breakdown
  {
    id: 'ch-1-1',
    project_id: 'proj-1',
    category_id: 'cat-1-1',
    code: '01',
    name: 'אדריכלות',
    budget_amount: 200000,
    contract_amount: 195000,
    order: 1,
    created_at: daysAgo(180),
    updated_at: daysAgo(100),
  },
  {
    id: 'ch-1-2',
    project_id: 'proj-1',
    category_id: 'cat-1-1',
    code: '02',
    name: 'הנדסה',
    budget_amount: 150000,
    contract_amount: 160000, // Over budget
    order: 2,
    created_at: daysAgo(180),
    updated_at: daysAgo(90),
  },
  {
    id: 'ch-1-3',
    project_id: 'proj-1',
    category_id: 'cat-1-2',
    code: '03',
    name: 'קבלן ראשי',
    budget_amount: 3500000,
    contract_amount: 3600000, // Over budget
    order: 3,
    created_at: daysAgo(180),
    updated_at: daysAgo(80),
  },
  {
    id: 'ch-1-4',
    project_id: 'proj-1',
    category_id: 'cat-1-2',
    code: '04',
    name: 'חשמל',
    budget_amount: 450000,
    contract_amount: 440000,
    order: 4,
    created_at: daysAgo(180),
    updated_at: daysAgo(70),
  },
  {
    id: 'ch-1-5',
    project_id: 'proj-1',
    category_id: 'cat-1-2',
    code: '05',
    name: 'אינסטלציה',
    budget_amount: 380000,
    order: 5,
    created_at: daysAgo(180),
    updated_at: daysAgo(180), // No contract yet - edge case
  },
  {
    id: 'ch-1-6',
    project_id: 'proj-1',
    category_id: 'cat-1-3',
    code: '06',
    name: 'חומרי גמר',
    budget_amount: 320000,
    contract_amount: 365000, // Significantly over
    order: 6,
    created_at: daysAgo(180),
    updated_at: daysAgo(30),
  },
  // Project 2 - Minimal data (early stage)
  {
    id: 'ch-2-1',
    project_id: 'proj-2',
    category_id: 'cat-2-1',
    code: '01',
    name: 'אדריכלות',
    budget_amount: 180000,
    contract_amount: 175000,
    order: 1,
    created_at: daysAgo(80),
    updated_at: daysAgo(75),
  },
];

// ============================================================
// BUDGET ITEMS - Comprehensive edge cases
// ============================================================

export const seedBudgetItems: BudgetItem[] = [
  // Project 1 - Architecture chapter - Normal items
  {
    id: 'item-1-1',
    project_id: 'proj-1',
    chapter_id: 'ch-1-1',
    code: '01.01',
    description: 'תכניות אדריכליות - היתר',
    unit: 'קומפלט',
    quantity: 1,
    unit_price: 80000,
    total_price: 80000,
    vat_rate: 0.17,
    vat_amount: 13600,
    total_with_vat: 93600,
    status: 'completed',
    supplier_id: 'prof-1',
    supplier_name: 'אדר׳ יעל שפירא',
    paid_amount: 93600,
    order: 1,
    created_at: daysAgo(180),
    updated_at: daysAgo(120),
  },
  {
    id: 'item-1-2',
    project_id: 'proj-1',
    chapter_id: 'ch-1-1',
    code: '01.02',
    description: 'תכניות אדריכליות - ביצוע',
    unit: 'קומפלט',
    quantity: 1,
    unit_price: 115000,
    total_price: 115000,
    vat_rate: 0.17,
    vat_amount: 19550,
    total_with_vat: 134550,
    status: 'in-progress',
    supplier_id: 'prof-1',
    supplier_name: 'אדר׳ יעל שפירא',
    paid_amount: 67275, // 50% paid
    expected_payment_date: daysFromNow(15),
    order: 2,
    created_at: daysAgo(180),
    updated_at: daysAgo(10),
  },
  // Engineering - Over budget item
  {
    id: 'item-1-3',
    project_id: 'proj-1',
    chapter_id: 'ch-1-2',
    code: '02.01',
    description: 'תכנון קונסטרוקציה',
    unit: 'קומפלט',
    quantity: 1,
    unit_price: 160000,
    total_price: 160000,
    vat_rate: 0.17,
    vat_amount: 27200,
    total_with_vat: 187200,
    status: 'contracted',
    supplier_id: 'prof-2',
    supplier_name: 'מהנדס אבי מזרחי',
    paid_amount: 0,
    expected_payment_date: daysFromNow(30),
    order: 1,
    notes: 'עלה במחיר בגלל דרישות נוספות',
    created_at: daysAgo(170),
    updated_at: daysAgo(90),
  },
  // Main contractor - Multiple line items with different statuses
  {
    id: 'item-1-4',
    project_id: 'proj-1',
    chapter_id: 'ch-1-3',
    code: '03.01',
    description: 'עבודות עפר וחפירה',
    unit: 'מ"ק',
    quantity: 500,
    unit_price: 80,
    total_price: 40000,
    vat_rate: 0.17,
    vat_amount: 6800,
    total_with_vat: 46800,
    status: 'completed',
    supplier_id: 'prof-3',
    supplier_name: 'קבלן משה דוד',
    paid_amount: 46800,
    order: 1,
    created_at: daysAgo(150),
    updated_at: daysAgo(140),
  },
  {
    id: 'item-1-5',
    project_id: 'proj-1',
    chapter_id: 'ch-1-3',
    code: '03.02',
    description: 'יציקות בטון',
    unit: 'מ"ק',
    quantity: 800,
    unit_price: 450,
    total_price: 360000,
    vat_rate: 0.17,
    vat_amount: 61200,
    total_with_vat: 421200,
    status: 'in-progress',
    supplier_id: 'prof-3',
    supplier_name: 'קבלן משה דוד',
    paid_amount: 210600, // 50% paid
    expected_payment_date: daysFromNow(20),
    order: 2,
    created_at: daysAgo(145),
    updated_at: daysAgo(50),
  },
  {
    id: 'item-1-6',
    project_id: 'proj-1',
    chapter_id: 'ch-1-3',
    code: '03.03',
    description: 'קירות גבס - דירות',
    unit: 'מ"ר',
    quantity: 1200,
    unit_price: 85,
    total_price: 102000,
    vat_rate: 0.17,
    vat_amount: 17340,
    total_with_vat: 119340,
    status: 'pending',
    supplier_id: 'prof-3',
    supplier_name: 'קבלן משה דוד',
    paid_amount: 0,
    expected_payment_date: daysFromNow(60),
    order: 3,
    created_at: daysAgo(140),
    updated_at: daysAgo(140),
  },
  // EDGE CASE: Zero quantity item
  {
    id: 'item-1-7',
    project_id: 'proj-1',
    chapter_id: 'ch-1-3',
    code: '03.04',
    description: 'פריט מבוטל - לא בוצע',
    unit: 'קומפלט',
    quantity: 0, // EDGE CASE
    unit_price: 50000,
    total_price: 0,
    vat_rate: 0.17,
    vat_amount: 0,
    total_with_vat: 0,
    status: 'completed',
    supplier_id: 'prof-3',
    supplier_name: 'קבלן משה דוד',
    paid_amount: 0,
    order: 4,
    notes: 'בוטל לפי החלטת הלקוח',
    created_at: daysAgo(130),
    updated_at: daysAgo(100),
  },
  // Electrical work - On schedule
  {
    id: 'item-1-8',
    project_id: 'proj-1',
    chapter_id: 'ch-1-4',
    code: '04.01',
    description: 'מערכת חשמל מלאה - 4 קומות',
    unit: 'קומפלט',
    quantity: 1,
    unit_price: 440000,
    total_price: 440000,
    vat_rate: 0.17,
    vat_amount: 74800,
    total_with_vat: 514800,
    status: 'contracted',
    supplier_id: 'prof-4',
    supplier_name: 'חשמלאי רוני זוהר',
    paid_amount: 0,
    expected_payment_date: daysFromNow(45),
    order: 1,
    created_at: daysAgo(120),
    updated_at: daysAgo(70),
  },
  // Plumbing - No contract yet (edge case)
  {
    id: 'item-1-9',
    project_id: 'proj-1',
    chapter_id: 'ch-1-5',
    code: '05.01',
    description: 'מערכת אינסטלציה מלאה',
    unit: 'קומפלט',
    quantity: 1,
    unit_price: 380000,
    total_price: 380000,
    vat_rate: 0.17,
    vat_amount: 64600,
    total_with_vat: 444600,
    status: 'tender', // Still in tender
    paid_amount: 0,
    order: 1,
    notes: 'ממתינים לתוצאות מכרז',
    created_at: daysAgo(180),
    updated_at: daysAgo(15),
  },
  // Finishes - Very large item with overrun
  {
    id: 'item-1-10',
    project_id: 'proj-1',
    chapter_id: 'ch-1-6',
    code: '06.01',
    description: 'ריצוף וחיפוי - כל הבניין',
    unit: 'מ"ר',
    quantity: 2500,
    unit_price: 120,
    total_price: 300000,
    vat_rate: 0.17,
    vat_amount: 51000,
    total_with_vat: 351000,
    status: 'in-progress',
    paid_amount: 87750, // 25% paid
    expected_payment_date: daysFromNow(10),
    order: 1,
    created_at: daysAgo(100),
    updated_at: daysAgo(5),
  },
  // EDGE CASE: Very expensive single item (>1M)
  {
    id: 'item-1-11',
    project_id: 'proj-1',
    chapter_id: 'ch-1-3',
    code: '03.05',
    description: 'מערכת חניון רובוטי - פריט יקר',
    unit: 'קומפלט',
    quantity: 1,
    unit_price: 2800000, // VERY LARGE AMOUNT
    total_price: 2800000,
    vat_rate: 0.17,
    vat_amount: 476000,
    total_with_vat: 3276000,
    status: 'contracted',
    paid_amount: 0,
    expected_payment_date: daysFromNow(180),
    order: 5,
    notes: 'פריט יקר במיוחד - חניון אוטומטי',
    created_at: daysAgo(90),
    updated_at: daysAgo(85),
  },
  // EDGE CASE: Past due payment
  {
    id: 'item-1-12',
    project_id: 'proj-1',
    chapter_id: 'ch-1-3',
    code: '03.06',
    description: 'איטום גג ומרפסות',
    unit: 'מ"ר',
    quantity: 400,
    unit_price: 150,
    total_price: 60000,
    vat_rate: 0.17,
    vat_amount: 10200,
    total_with_vat: 70200,
    status: 'completed',
    supplier_id: 'prof-3',
    supplier_name: 'קבלן משה דוד',
    paid_amount: 0, // NOT PAID even though completed
    expected_payment_date: daysAgo(10), // OVERDUE!
    order: 6,
    notes: 'תשלום באיחור',
    created_at: daysAgo(60),
    updated_at: daysAgo(30),
  },
  // Project 2 - Minimal items (early stage)
  {
    id: 'item-2-1',
    project_id: 'proj-2',
    chapter_id: 'ch-2-1',
    code: '01.01',
    description: 'תכניות אדריכליות ראשוניות',
    unit: 'קומפלט',
    quantity: 1,
    unit_price: 175000,
    total_price: 175000,
    vat_rate: 0.17,
    vat_amount: 29750,
    total_with_vat: 204750,
    status: 'in-progress',
    supplier_id: 'prof-1',
    supplier_name: 'אדר׳ יעל שפירא',
    paid_amount: 102375, // 50% paid
    expected_payment_date: daysFromNow(90),
    order: 1,
    created_at: daysAgo(75),
    updated_at: daysAgo(40),
  },
];

// ============================================================
// BUDGET PAYMENTS - Various payment scenarios
// ============================================================

export const seedBudgetPayments: BudgetPayment[] = [
  // Item 1-1 - Single full payment (completed)
  {
    id: 'pay-1-1',
    budget_item_id: 'item-1-1',
    invoice_number: 'חשבון סופי',
    invoice_date: daysAgo(120),
    amount: 80000,
    vat_amount: 13600,
    total_amount: 93600,
    status: 'paid',
    payment_date: daysAgo(110),
    created_at: daysAgo(120),
    updated_at: daysAgo(110),
  },
  // Item 1-2 - Partial payment (in progress)
  {
    id: 'pay-1-2',
    budget_item_id: 'item-1-2',
    invoice_number: 'חשבון חלקי 1',
    invoice_date: daysAgo(30),
    amount: 57500,
    vat_amount: 9775,
    total_amount: 67275,
    status: 'paid',
    payment_date: daysAgo(25),
    created_at: daysAgo(30),
    updated_at: daysAgo(25),
  },
  {
    id: 'pay-1-3',
    budget_item_id: 'item-1-2',
    invoice_number: 'חשבון חלקי 2',
    invoice_date: daysFromNow(10),
    amount: 57500,
    vat_amount: 9775,
    total_amount: 67275,
    status: 'approved',
    notes: 'מתוכנן לתשלום בעוד 10 ימים',
    created_at: daysAgo(5),
    updated_at: daysAgo(3),
  },
  // Item 1-4 - Completed and paid
  {
    id: 'pay-1-4',
    budget_item_id: 'item-1-4',
    invoice_number: 'חשבון 001',
    invoice_date: daysAgo(145),
    amount: 40000,
    vat_amount: 6800,
    total_amount: 46800,
    status: 'paid',
    payment_date: daysAgo(135),
    created_at: daysAgo(145),
    updated_at: daysAgo(135),
  },
  // Item 1-5 - Multiple partial payments
  {
    id: 'pay-1-5',
    budget_item_id: 'item-1-5',
    invoice_number: 'חשבון חלקי 1 - יציקות',
    invoice_date: daysAgo(80),
    amount: 90000,
    vat_amount: 15300,
    total_amount: 105300,
    status: 'paid',
    payment_date: daysAgo(75),
    created_at: daysAgo(80),
    updated_at: daysAgo(75),
  },
  {
    id: 'pay-1-6',
    budget_item_id: 'item-1-5',
    invoice_number: 'חשבון חלקי 2 - יציקות',
    invoice_date: daysAgo(50),
    amount: 90000,
    vat_amount: 15300,
    total_amount: 105300,
    status: 'paid',
    payment_date: daysAgo(45),
    created_at: daysAgo(50),
    updated_at: daysAgo(45),
  },
  {
    id: 'pay-1-7',
    budget_item_id: 'item-1-5',
    invoice_number: 'חשבון חלקי 3 - יציקות',
    invoice_date: daysFromNow(15),
    amount: 90000,
    vat_amount: 15300,
    total_amount: 105300,
    status: 'pending',
    notes: 'תשלום מתוכנן לעוד שבועיים',
    created_at: daysAgo(10),
    updated_at: daysAgo(10),
  },
  {
    id: 'pay-1-8',
    budget_item_id: 'item-1-5',
    invoice_number: 'חשבון חלקי 4 - יציקות',
    invoice_date: daysFromNow(60),
    amount: 90000,
    vat_amount: 15300,
    total_amount: 105300,
    status: 'pending',
    notes: 'תשלום סופי',
    created_at: daysAgo(10),
    updated_at: daysAgo(10),
  },
  // Item 1-10 - First payment for tiles
  {
    id: 'pay-1-9',
    budget_item_id: 'item-1-10',
    invoice_number: 'חשבון התחלתי ריצוף',
    invoice_date: daysAgo(20),
    amount: 75000,
    vat_amount: 12750,
    total_amount: 87750,
    status: 'paid',
    payment_date: daysAgo(15),
    created_at: daysAgo(20),
    updated_at: daysAgo(15),
  },
  // EDGE CASE: Approved but no payment date
  {
    id: 'pay-1-10',
    budget_item_id: 'item-1-10',
    invoice_number: 'חשבון ביניים ריצוף',
    invoice_date: daysAgo(5),
    amount: 75000,
    vat_amount: 12750,
    total_amount: 87750,
    status: 'approved', // Approved but payment_date is null
    notes: 'אושר לתשלום - ממתינים לתאריך',
    created_at: daysAgo(5),
    updated_at: daysAgo(2),
  },
  // EDGE CASE: Very old invoice (>6 months)
  {
    id: 'pay-1-11',
    budget_item_id: 'item-1-4',
    invoice_number: 'חשבון ישן מאוד',
    invoice_date: daysAgo(200), // VERY OLD
    amount: 5000,
    vat_amount: 850,
    total_amount: 5850,
    status: 'paid',
    payment_date: daysAgo(195),
    notes: 'חשבון עבודות נוספות מהשלב הראשון',
    created_at: daysAgo(200),
    updated_at: daysAgo(195),
  },
  // Project 2 - Single payment
  {
    id: 'pay-2-1',
    budget_item_id: 'item-2-1',
    invoice_number: 'חשבון מקדמה',
    invoice_date: daysAgo(40),
    amount: 87500,
    vat_amount: 14875,
    total_amount: 102375,
    status: 'paid',
    payment_date: daysAgo(35),
    milestone_id: undefined, // No milestone linked
    created_at: daysAgo(40),
    updated_at: daysAgo(35),
  },
];

// ============================================================
// PROJECT UNITS - Work packages
// ============================================================

export const seedProjectUnits: ProjectUnit[] = [
  // Project 1 - Full building structure
  {
    id: 'unit-1-1',
    project_id: 'proj-1',
    name: 'קומה 1 - דירות 1-4',
    type: 'apartment',
    color: '#3B82F6',
    icon: 'home',
    order: 1,
    created_at: daysAgo(150),
    updated_at: daysAgo(150),
  },
  {
    id: 'unit-1-2',
    project_id: 'proj-1',
    name: 'קומה 2 - דירות 5-8',
    type: 'apartment',
    color: '#10B981',
    icon: 'home',
    order: 2,
    created_at: daysAgo(150),
    updated_at: daysAgo(150),
  },
  {
    id: 'unit-1-3',
    project_id: 'proj-1',
    name: 'מרתף חניה',
    type: 'common',
    color: '#F59E0B',
    icon: 'local_parking',
    order: 3,
    created_at: daysAgo(150),
    updated_at: daysAgo(150),
  },
  {
    id: 'unit-1-4',
    project_id: 'proj-1',
    name: 'גג + מערכות',
    type: 'building',
    color: '#8B5CF6',
    icon: 'roofing',
    order: 4,
    created_at: daysAgo(150),
    updated_at: daysAgo(150),
  },
];

// ============================================================
// MILESTONES - Various stages
// ============================================================

export const seedProjectMilestones: ProjectMilestone[] = [
  {
    id: 'ms-1-1',
    project_id: 'proj-1',
    unit_id: 'unit-1-1',
    name: 'יציקת תקרה',
    date: daysAgo(120),
    status: 'completed',
    phase: 'שלד',
    order: 1,
    created_at: daysAgo(145),
    updated_at: daysAgo(120),
  },
  {
    id: 'ms-1-2',
    project_id: 'proj-1',
    unit_id: 'unit-1-1',
    name: 'גבס ותשתיות',
    date: daysAgo(60),
    status: 'completed',
    phase: 'גמר',
    order: 2,
    created_at: daysAgo(100),
    updated_at: daysAgo(60),
  },
  {
    id: 'ms-1-3',
    project_id: 'proj-1',
    unit_id: 'unit-1-1',
    name: 'ריצוף וחיפוי',
    date: daysFromNow(10),
    status: 'in-progress',
    phase: 'גמר',
    order: 3,
    created_at: daysAgo(80),
    updated_at: daysAgo(5),
  },
  // EDGE CASE: Overdue milestone
  {
    id: 'ms-1-4',
    project_id: 'proj-4',
    unit_id: 'unit-1-1',
    name: 'אבן דרך באיחור',
    date: daysAgo(30), // Past but not completed
    status: 'pending',
    phase: 'ביצוע',
    order: 1,
    notes: 'באיחור של חודש',
    created_at: daysAgo(120),
    updated_at: daysAgo(30),
  },
];

// ============================================================
// GANTT TASKS
// ============================================================

export const seedGanttTasks: GanttTask[] = [
  {
    id: 'task-1-1',
    project_id: 'proj-1',
    milestone_id: 'ms-1-3',
    name: 'ריצוף סלון',
    description: 'ריצוף סלון בגרניט פורצלן',
    start_date: daysAgo(5),
    end_date: daysFromNow(5),
    duration: '10 ימים',
    status: 'in-progress',
    priority: 'high',
    progress: 40,
    type: 'ריצוף',
    order: 1,
    created_at: daysAgo(10),
    updated_at: daysAgo(1),
  },
  {
    id: 'task-1-2',
    project_id: 'proj-1',
    milestone_id: 'ms-1-3',
    name: 'חיפוי קירות מטבח',
    start_date: daysFromNow(6),
    end_date: daysFromNow(15),
    duration: '9 ימים',
    status: 'pending',
    priority: 'medium',
    progress: 0,
    type: 'ריצוף',
    predecessors: ['task-1-1'],
    order: 2,
    created_at: daysAgo(10),
    updated_at: daysAgo(10),
  },
];

// ============================================================
// TENDERS
// ============================================================

export const seedTenders: Tender[] = [
  {
    id: 'tender-1',
    project_id: 'proj-1',
    tender_name: 'מכרז אינסטלציה',
    tender_type: 'plumber',
    status: 'Open',
    publish_date: daysAgo(20),
    due_date: daysFromNow(10),
    candidate_professional_ids: ['prof-5'],
    estimated_budget: 380000,
    notes: 'מכרז פתוח - ממתינים להצעות',
    created_at: daysAgo(20),
    updated_at: daysAgo(15),
  },
  {
    id: 'tender-2',
    project_id: 'proj-1',
    tender_name: 'מכרז חשמל',
    tender_type: 'electrician',
    status: 'WinnerSelected',
    publish_date: daysAgo(90),
    due_date: daysAgo(70),
    candidate_professional_ids: ['prof-4'],
    estimated_budget: 450000,
    contract_amount: 440000,
    winner_professional_id: 'prof-4',
    winner_professional_name: 'חשמלאי רוני זוהר',
    notes: 'זוכה נבחר - בחסכון',
    created_at: daysAgo(90),
    updated_at: daysAgo(70),
  },
];

// ============================================================
// TENDER PARTICIPANTS
// ============================================================

export const seedTenderParticipants: TenderParticipant[] = [
  {
    id: 'tp-1',
    tender_id: 'tender-1',
    professional_id: 'prof-5',
    total_amount: 395000,
    notes: 'הצעה תחרותית',
    is_winner: false,
    created_at: daysAgo(15),
  },
  {
    id: 'tp-2',
    tender_id: 'tender-2',
    professional_id: 'prof-4',
    total_amount: 440000,
    is_winner: true,
    created_at: daysAgo(72),
  },
];

// ============================================================
// TASKS
// ============================================================

export const seedTasks: Task[] = [
  {
    id: 'task-gen-1',
    project_id: 'proj-1',
    title: 'בדיקת היתר בניה',
    description: 'לוודא שהיתר הבניה בתוקף',
    status: 'Done',
    priority: 'High',
    due_date: daysAgo(160),
    completed_at: daysAgo(155),
    created_at: daysAgo(165),
    updated_at: daysAgo(155),
  },
  {
    id: 'task-gen-2',
    project_id: 'proj-1',
    title: 'הזמנת חומרים לקומה 2',
    status: 'In Progress',
    priority: 'High',
    due_date: daysFromNow(5),
    created_at: daysAgo(10),
    updated_at: daysAgo(2),
  },
  // EDGE CASE: Overdue task
  {
    id: 'task-gen-3',
    project_id: 'proj-4',
    title: 'משימה באיחור',
    status: 'Backlog',
    priority: 'High',
    due_date: daysAgo(20), // OVERDUE
    notes: 'דחוף! באיחור',
    created_at: daysAgo(60),
    updated_at: daysAgo(20),
  },
];

// ============================================================
// FILES
// ============================================================

export const seedFiles: File[] = [
  {
    id: 'file-1',
    file_name: 'היתר בניה - עדכני.pdf',
    file_url: 'https://example.com/permits/hertzel-25.pdf',
    file_size: 2048000,
    file_size_display: '2 MB',
    file_type: 'PDF',
    description_short: 'היתר בניה מעודכן',
    related_entity_type: 'Project',
    related_entity_id: 'proj-1',
    related_entity_name: 'בניין מגורים רחוב הרצל 25',
    uploaded_at: daysAgo(180),
    uploaded_by: 'yossi@example.com',
    created_at: daysAgo(180),
    updated_at: daysAgo(180),
  },
  {
    id: 'file-2',
    file_name: 'תכניות אדריכליות.dwg',
    file_url: 'https://example.com/plans/arch-plans-v3.dwg',
    file_size: 15360000,
    file_size_display: '15 MB',
    file_type: 'DWG',
    related_entity_type: 'Project',
    related_entity_id: 'proj-1',
    related_entity_name: 'בניין מגורים רחוב הרצל 25',
    uploaded_at: daysAgo(170),
    uploaded_by: 'architect@example.com',
    created_at: daysAgo(170),
    updated_at: daysAgo(170),
  },
  // EDGE CASE: File with no related entity (orphaned)
  {
    id: 'file-3',
    file_name: 'קובץ יתום - ללא קישור.jpg',
    file_url: 'https://example.com/orphan.jpg',
    file_size: 512000,
    file_size_display: '512 KB',
    file_type: 'Image',
    uploaded_at: daysAgo(100),
    uploaded_by: 'unknown',
    notes: 'קובץ ללא קישור לישות',
    created_at: daysAgo(100),
    updated_at: daysAgo(100),
  },
];

// ============================================================
// SPECIAL ISSUES
// ============================================================

export const seedSpecialIssues: SpecialIssue[] = [
  {
    id: 'issue-1',
    project_id: 'proj-1',
    date: daysAgo(30),
    description: 'סדק בקיר חיצוני - דרוש טיפול',
    status: 'open',
    priority: 'high',
    category: 'quality',
    responsible: 'קבלן משה דוד',
    created_at: daysAgo(30),
    updated_at: daysAgo(25),
  },
  {
    id: 'issue-2',
    project_id: 'proj-1',
    date: daysAgo(60),
    description: 'איטום לקוי במרפסת',
    status: 'resolved',
    priority: 'medium',
    category: 'quality',
    responsible: 'קבלן משה דוד',
    resolution: 'בוצע איטום מחדש ונבדק',
    created_at: daysAgo(60),
    updated_at: daysAgo(50),
  },
  // EDGE CASE: Very old open issue (>90 days)
  {
    id: 'issue-3',
    project_id: 'proj-4',
    date: daysAgo(120),
    description: 'בעיה פתוחה ארוכה - לא טופלה - דחוף! פתוח כבר 4 חודשים',
    status: 'open',
    priority: 'critical',
    category: 'safety',
    created_at: daysAgo(120),
    updated_at: daysAgo(120),
  },
];

// ============================================================
// PLANNING CHANGES
// ============================================================

export const seedPlanningChanges: PlanningChange[] = [
  {
    id: 'change-1',
    project_id: 'proj-1',
    change_number: 1,
    description: 'שינוי בחלוקת דירה 3 - הוספת חדר',
    schedule_impact: 'עיכוב של שבועיים',
    budget_impact: 45000,
    decision: 'approved',
    created_at: daysAgo(100),
    updated_at: daysAgo(95),
  },
  {
    id: 'change-2',
    project_id: 'proj-1',
    change_number: 2,
    description: 'החלפת חומר ריצוף לשיש - ממתינים לאישור לקוח',
    budget_impact: 85000,
    decision: 'pending',
    created_at: daysAgo(15),
    updated_at: daysAgo(10),
  },
];

// ============================================================
// COST ITEMS - Various statuses for testing
// ============================================================

export const seedCostItems: CostItem[] = [
  // Project 1 — Draft: no tender yet
  {
    id: 'cost-1-1',
    project_id: 'proj-1',
    name: 'עבודות גינון',
    description: 'פיתוח גינה ושטחים ירוקים',
    category: 'contractor',
    estimated_amount: 120000,
    vat_included: false,
    vat_rate: 17,
    status: 'draft',
    created_at: daysAgo(90),
    updated_at: daysAgo(90),
  },
  // Project 1 — Draft #2
  {
    id: 'cost-1-2',
    project_id: 'proj-1',
    name: 'מערכת מיזוג אוויר',
    description: 'מיזוג VRF לכל הבניין',
    category: 'supplier',
    estimated_amount: 280000,
    vat_included: false,
    vat_rate: 17,
    status: 'draft',
    created_at: daysAgo(85),
    updated_at: daysAgo(85),
  },
  // Project 1 — Tender Draft: exported to tender (draft)
  {
    id: 'cost-1-3',
    project_id: 'proj-1',
    name: 'אלומיניום וחלונות',
    description: 'חלונות אלומיניום לכל הדירות',
    category: 'supplier',
    estimated_amount: 350000,
    vat_included: false,
    vat_rate: 17,
    status: 'tender_draft',
    tender_id: 'tender-alum-1',
    created_at: daysAgo(70),
    updated_at: daysAgo(60),
  },
  // Project 1 — Tender Open: tender published
  {
    id: 'cost-1-4',
    project_id: 'proj-1',
    name: 'עבודות אינסטלציה',
    description: 'מערכת אינסטלציה מלאה כולל קולטים',
    category: 'contractor',
    estimated_amount: 380000,
    vat_included: false,
    vat_rate: 17,
    status: 'tender_open',
    tender_id: 'tender-1',
    created_at: daysAgo(60),
    updated_at: daysAgo(20),
  },
  // Project 1 — Tender Winner: fully paid (should be excluded from VAT cascade)
  {
    id: 'cost-1-5',
    project_id: 'proj-1',
    name: 'עבודות שלד וחפירה',
    description: 'חפירה, יציקות, שלד בטון',
    category: 'contractor',
    estimated_amount: 950000,
    actual_amount: 920000,
    vat_included: false,
    vat_rate: 17,
    status: 'tender_winner',
    notes: 'הושלם ושולם במלואו',
    created_at: daysAgo(150),
    updated_at: daysAgo(30),
  },
  // Project 1 — Tender Winner: partially paid (should be included in VAT cascade)
  {
    id: 'cost-1-6',
    project_id: 'proj-1',
    name: 'עבודות חשמל',
    description: 'מערכת חשמל מלאה 4 קומות',
    category: 'contractor',
    estimated_amount: 450000,
    actual_amount: 440000,
    vat_included: false,
    vat_rate: 17,
    status: 'tender_winner',
    tender_id: 'tender-2',
    notes: 'שולם חלקית - 2 מתוך 4 תשלומים',
    created_at: daysAgo(120),
    updated_at: daysAgo(10),
  },
  // Project 1 — Tender Winner: not paid at all
  {
    id: 'cost-1-7',
    project_id: 'proj-1',
    name: 'ריצוף וחיפוי',
    description: 'ריצוף פורצלן + חיפוי אמבטיות',
    category: 'supplier',
    estimated_amount: 320000,
    actual_amount: 310000,
    vat_included: false,
    vat_rate: 17,
    status: 'tender_winner',
    notes: 'נבחר זוכה - ממתין לתחילת עבודה',
    created_at: daysAgo(45),
    updated_at: daysAgo(15),
  },
  // Project 1 — Consultant (draft, small amount)
  {
    id: 'cost-1-8',
    project_id: 'proj-1',
    name: 'יועץ קרקע',
    category: 'consultant',
    estimated_amount: 25000,
    vat_included: false,
    vat_rate: 17,
    status: 'draft',
    created_at: daysAgo(100),
    updated_at: daysAgo(100),
  },
  // Project 2 — Single draft item (early stage project)
  {
    id: 'cost-2-1',
    project_id: 'proj-2',
    name: 'תכניות אדריכליות',
    description: 'אדריכלות שלב ראשוני',
    category: 'consultant',
    estimated_amount: 175000,
    vat_included: false,
    vat_rate: 17,
    status: 'draft',
    created_at: daysAgo(80),
    updated_at: daysAgo(80),
  },
  // Project 4 — Overdue project items
  {
    id: 'cost-4-1',
    project_id: 'proj-4',
    name: 'קבלן ראשי - ביצוע',
    category: 'contractor',
    estimated_amount: 2200000,
    actual_amount: 2350000,
    vat_included: false,
    vat_rate: 17,
    status: 'tender_winner',
    notes: 'חריגה תקציבית',
    created_at: daysAgo(380),
    updated_at: daysAgo(60),
  },
];

// ============================================================
// PAYMENT SCHEDULES - One per cost item that has a schedule
// ============================================================

export const seedPaymentSchedules: PaymentSchedule[] = [
  // cost-1-5: Fully paid (4/4 paid)
  {
    id: 'ps-1',
    cost_item_id: 'cost-1-5',
    project_id: 'proj-1',
    total_amount: 920000,
    status: 'active',
    created_at: daysAgo(140),
    updated_at: daysAgo(30),
  },
  // cost-1-6: Partially paid (2/4 paid)
  {
    id: 'ps-2',
    cost_item_id: 'cost-1-6',
    project_id: 'proj-1',
    total_amount: 440000,
    status: 'active',
    created_at: daysAgo(110),
    updated_at: daysAgo(10),
  },
  // cost-1-7: Not paid at all (0/3 paid)
  {
    id: 'ps-3',
    cost_item_id: 'cost-1-7',
    project_id: 'proj-1',
    total_amount: 310000,
    status: 'active',
    created_at: daysAgo(40),
    updated_at: daysAgo(15),
  },
  // cost-4-1: Overdue project schedule
  {
    id: 'ps-4',
    cost_item_id: 'cost-4-1',
    project_id: 'proj-4',
    total_amount: 2350000,
    status: 'active',
    created_at: daysAgo(370),
    updated_at: daysAgo(60),
  },
];

// ============================================================
// SCHEDULE ITEMS - Installments with various statuses
// ============================================================

export const seedScheduleItems: ScheduleItem[] = [
  // ---- ps-1: cost-1-5 (Fully paid: 4 installments, all paid) ----
  {
    id: 'si-1-1',
    schedule_id: 'ps-1',
    cost_item_id: 'cost-1-5',
    project_id: 'proj-1',
    description: 'מקדמה - עבודות שלד',
    amount: 230000,
    percentage: 25,
    milestone_id: 'ms-1-1',
    milestone_name: 'יציקת תקרה',
    target_date: daysAgo(130),
    order: 1,
    status: 'paid',
    paid_date: daysAgo(128),
    paid_amount: 230000,
    created_at: daysAgo(140),
    updated_at: daysAgo(128),
  },
  {
    id: 'si-1-2',
    schedule_id: 'ps-1',
    cost_item_id: 'cost-1-5',
    project_id: 'proj-1',
    description: 'תשלום שני - חפירות',
    amount: 230000,
    percentage: 25,
    target_date: daysAgo(100),
    order: 2,
    status: 'paid',
    paid_date: daysAgo(98),
    paid_amount: 230000,
    created_at: daysAgo(140),
    updated_at: daysAgo(98),
  },
  {
    id: 'si-1-3',
    schedule_id: 'ps-1',
    cost_item_id: 'cost-1-5',
    project_id: 'proj-1',
    description: 'תשלום שלישי - יציקות',
    amount: 230000,
    percentage: 25,
    target_date: daysAgo(70),
    order: 3,
    status: 'paid',
    paid_date: daysAgo(68),
    paid_amount: 230000,
    created_at: daysAgo(140),
    updated_at: daysAgo(68),
  },
  {
    id: 'si-1-4',
    schedule_id: 'ps-1',
    cost_item_id: 'cost-1-5',
    project_id: 'proj-1',
    description: 'תשלום סופי - שלד',
    amount: 230000,
    percentage: 25,
    target_date: daysAgo(40),
    order: 4,
    status: 'paid',
    paid_date: daysAgo(38),
    paid_amount: 230000,
    created_at: daysAgo(140),
    updated_at: daysAgo(38),
  },

  // ---- ps-2: cost-1-6 (Partially paid: 2 paid, 1 approved, 1 pending) ----
  {
    id: 'si-2-1',
    schedule_id: 'ps-2',
    cost_item_id: 'cost-1-6',
    project_id: 'proj-1',
    description: 'מקדמה - חשמל',
    amount: 110000,
    percentage: 25,
    target_date: daysAgo(90),
    order: 1,
    status: 'paid',
    paid_date: daysAgo(88),
    paid_amount: 110000,
    created_at: daysAgo(110),
    updated_at: daysAgo(88),
  },
  {
    id: 'si-2-2',
    schedule_id: 'ps-2',
    cost_item_id: 'cost-1-6',
    project_id: 'proj-1',
    description: 'תשלום שני - חשמל קומה 1-2',
    amount: 110000,
    percentage: 25,
    target_date: daysAgo(50),
    order: 2,
    status: 'paid',
    paid_date: daysAgo(48),
    paid_amount: 110000,
    created_at: daysAgo(110),
    updated_at: daysAgo(48),
  },
  {
    id: 'si-2-3',
    schedule_id: 'ps-2',
    cost_item_id: 'cost-1-6',
    project_id: 'proj-1',
    description: 'תשלום שלישי - חשמל קומה 3-4',
    amount: 110000,
    percentage: 25,
    target_date: daysAgo(3), // recently due — overdue color (red)
    order: 3,
    status: 'approved',
    approved_by: 'מנהל פרויקט',
    approved_at: daysAgo(5),
    created_at: daysAgo(110),
    updated_at: daysAgo(5),
  },
  {
    id: 'si-2-4',
    schedule_id: 'ps-2',
    cost_item_id: 'cost-1-6',
    project_id: 'proj-1',
    description: 'תשלום סופי - חשמל',
    amount: 110000,
    percentage: 25,
    milestone_id: 'ms-1-3',
    milestone_name: 'ריצוף וחיפוי',
    target_date: daysFromNow(30),
    order: 4,
    status: 'pending',
    created_at: daysAgo(110),
    updated_at: daysAgo(110),
  },

  // ---- ps-3: cost-1-7 (Not paid: 1 milestone_confirmed, 1 invoice_received, 1 pending) ----
  {
    id: 'si-3-1',
    schedule_id: 'ps-3',
    cost_item_id: 'cost-1-7',
    project_id: 'proj-1',
    description: 'מקדמה - ריצוף',
    amount: 103333,
    percentage: 33,
    milestone_id: 'ms-1-2',
    milestone_name: 'גבס ותשתיות',
    target_date: daysAgo(5), // overdue (red)
    order: 1,
    status: 'milestone_confirmed',
    confirmed_by: 'מפקח אתר',
    confirmed_at: daysAgo(7),
    confirmed_note: 'אבן דרך הושלמה - גבס בוצע',
    created_at: daysAgo(40),
    updated_at: daysAgo(7),
  },
  {
    id: 'si-3-2',
    schedule_id: 'ps-3',
    cost_item_id: 'cost-1-7',
    project_id: 'proj-1',
    description: 'תשלום ביניים - ריצוף',
    amount: 103333,
    percentage: 33,
    target_date: daysFromNow(5), // upcoming (amber)
    order: 2,
    status: 'invoice_received',
    created_at: daysAgo(40),
    updated_at: daysAgo(2),
  },
  {
    id: 'si-3-3',
    schedule_id: 'ps-3',
    cost_item_id: 'cost-1-7',
    project_id: 'proj-1',
    description: 'תשלום סופי - ריצוף',
    amount: 103334,
    percentage: 34,
    milestone_id: 'ms-1-3',
    milestone_name: 'ריצוף וחיפוי',
    target_date: daysFromNow(45),
    order: 3,
    status: 'pending',
    created_at: daysAgo(40),
    updated_at: daysAgo(40),
  },

  // ---- ps-4: cost-4-1 (Overdue project: 2 paid, 1 overdue pending) ----
  {
    id: 'si-4-1',
    schedule_id: 'ps-4',
    cost_item_id: 'cost-4-1',
    project_id: 'proj-4',
    description: 'מקדמה - קבלן ראשי',
    amount: 783333,
    percentage: 33,
    target_date: daysAgo(300),
    order: 1,
    status: 'paid',
    paid_date: daysAgo(298),
    paid_amount: 783333,
    created_at: daysAgo(370),
    updated_at: daysAgo(298),
  },
  {
    id: 'si-4-2',
    schedule_id: 'ps-4',
    cost_item_id: 'cost-4-1',
    project_id: 'proj-4',
    description: 'תשלום ביניים - קבלן ראשי',
    amount: 783333,
    percentage: 33,
    target_date: daysAgo(150),
    order: 2,
    status: 'paid',
    paid_date: daysAgo(148),
    paid_amount: 783333,
    created_at: daysAgo(370),
    updated_at: daysAgo(148),
  },
  {
    id: 'si-4-3',
    schedule_id: 'ps-4',
    cost_item_id: 'cost-4-1',
    project_id: 'proj-4',
    description: 'תשלום סופי - קבלן ראשי (באיחור!)',
    amount: 783334,
    percentage: 34,
    target_date: daysAgo(30), // OVERDUE!
    order: 3,
    status: 'approved',
    approved_by: 'מנהל',
    approved_at: daysAgo(35),
    created_at: daysAgo(370),
    updated_at: daysAgo(35),
  },
];

// ============================================================
// SEED FUNCTION - Populate localStorage or Neon
// ============================================================

export async function seedDatabase(target: 'localStorage' | 'neon' = 'localStorage') {
  if (target === 'localStorage') {
    // Save all entities to localStorage
    localStorage.setItem('anprojects:projects', JSON.stringify(seedProjects));
    localStorage.setItem('anprojects:professionals', JSON.stringify(seedProfessionals));
    localStorage.setItem('anprojects:project_professionals', JSON.stringify(seedProjectProfessionals));
    localStorage.setItem('anprojects:budgets', JSON.stringify(seedBudgets));
    localStorage.setItem('anprojects:budget_categories', JSON.stringify(seedBudgetCategories));
    localStorage.setItem('anprojects:budget_chapters', JSON.stringify(seedBudgetChapters));
    localStorage.setItem('anprojects:budget_items', JSON.stringify(seedBudgetItems));
    localStorage.setItem('anprojects:budget_payments', JSON.stringify(seedBudgetPayments));
    localStorage.setItem('anprojects:units', JSON.stringify(seedProjectUnits));
    localStorage.setItem('anprojects:milestones', JSON.stringify(seedProjectMilestones));
    localStorage.setItem('anprojects:gantt_tasks', JSON.stringify(seedGanttTasks));
    localStorage.setItem('anprojects:tenders', JSON.stringify(seedTenders));
    localStorage.setItem('anprojects:tender_participants', JSON.stringify(seedTenderParticipants));
    localStorage.setItem('anprojects:tasks', JSON.stringify(seedTasks));
    localStorage.setItem('anprojects:files', JSON.stringify(seedFiles));
    localStorage.setItem('anprojects:special_issues', JSON.stringify(seedSpecialIssues));
    localStorage.setItem('anprojects:planning_changes', JSON.stringify(seedPlanningChanges));

    // Cost items are stored per-project
    const costItemsByProject = new Map<string, CostItem[]>();
    for (const item of seedCostItems) {
      const list = costItemsByProject.get(item.project_id) || [];
      list.push(item);
      costItemsByProject.set(item.project_id, list);
    }
    for (const [projectId, items] of costItemsByProject) {
      localStorage.setItem(`cost_items_${projectId}`, JSON.stringify(items));
    }

    // Payment schedules and schedule items
    localStorage.setItem('anprojects:payment_schedules', JSON.stringify(seedPaymentSchedules));
    localStorage.setItem('anprojects:schedule_items', JSON.stringify(seedScheduleItems));

    console.log('Seed data loaded to localStorage');
    console.log(`Projects: ${seedProjects.length}`);
    console.log(`Professionals: ${seedProfessionals.length}`);
    console.log(`Budget Items: ${seedBudgetItems.length}`);
    console.log(`Payments: ${seedBudgetPayments.length}`);
    console.log(`Milestones: ${seedProjectMilestones.length}`);
    console.log(`Tasks: ${seedTasks.length}`);
    console.log(`Files: ${seedFiles.length}`);
    console.log(`Issues: ${seedSpecialIssues.length}`);
    console.log(`Cost Items: ${seedCostItems.length}`);
    console.log(`Payment Schedules: ${seedPaymentSchedules.length}`);
    console.log(`Schedule Items: ${seedScheduleItems.length}`);

    return {
      projects: seedProjects.length,
      professionals: seedProfessionals.length,
      budgetItems: seedBudgetItems.length,
      payments: seedBudgetPayments.length,
      costItems: seedCostItems.length,
      paymentSchedules: seedPaymentSchedules.length,
      scheduleItems: seedScheduleItems.length,
      totalRecords:
        seedProjects.length +
        seedProfessionals.length +
        seedProjectProfessionals.length +
        seedBudgets.length +
        seedBudgetCategories.length +
        seedBudgetChapters.length +
        seedBudgetItems.length +
        seedBudgetPayments.length +
        seedProjectUnits.length +
        seedProjectMilestones.length +
        seedGanttTasks.length +
        seedTenders.length +
        seedTenderParticipants.length +
        seedTasks.length +
        seedFiles.length +
        seedSpecialIssues.length +
        seedPlanningChanges.length +
        seedCostItems.length +
        seedPaymentSchedules.length +
        seedScheduleItems.length,
    };
  } else if (target === 'neon') {
    // Seed Neon database using services
    console.log('Starting Neon database seeding...');

    try {
      // 1. Create Projects
      console.log('📁 Creating projects...');
      for (const project of seedProjects) {
        await createProject(project);
      }

      // 2. Create Professionals
      console.log('👥 Creating professionals...');
      for (const professional of seedProfessionals) {
        await createProfessional(professional);
      }

      // 3. Assign Professionals to Projects
      console.log('🔗 Assigning professionals to projects...');
      for (const assignment of seedProjectProfessionals) {
        await createProjectProfessional(assignment);
      }

      // 4. Create Budgets
      console.log('💰 Creating budgets...');
      for (const budget of seedBudgets) {
        await createBudget(budget);
      }

      // 5. Create Budget Categories
      console.log('📊 Creating budget categories...');
      for (const category of seedBudgetCategories) {
        await createBudgetCategory(category);
      }

      // 6. Create Budget Chapters
      console.log('📚 Creating budget chapters...');
      for (const chapter of seedBudgetChapters) {
        await createBudgetChapter(chapter);
      }

      // 7. Create Project Units
      console.log('🏗️ Creating project units...');
      for (const unit of seedProjectUnits) {
        await createUnit(unit);
      }

      // 8. Create Tenders (before budget items and milestones)
      console.log('📋 Creating tenders...');
      for (const tender of seedTenders) {
        await createTender(tender);
      }

      // 9. Create Tender Participants
      console.log('👤 Creating tender participants...');
      for (const participant of seedTenderParticipants) {
        await createTenderParticipant(participant);
      }

      // 10. Create Project Milestones
      console.log('🎯 Creating project milestones...');
      for (const milestone of seedProjectMilestones) {
        await createMilestone(milestone);
      }

      // 11. Create Budget Items
      console.log('💵 Creating budget items...');
      for (const item of seedBudgetItems) {
        await createBudgetItem(item);
      }

      // 12. Create Budget Payments
      console.log('💳 Creating budget payments...');
      for (const payment of seedBudgetPayments) {
        await createBudgetPayment(payment);
      }

      // 13. Create Gantt Tasks
      console.log('📅 Creating gantt tasks...');
      for (const task of seedGanttTasks) {
        await createGanttTask(task);
      }

      // 14. Create Tasks
      console.log('✅ Creating tasks...');
      for (const task of seedTasks) {
        await createTask(task);
      }

      // 15. Create Files
      console.log('📁 Creating files...');
      for (const file of seedFiles) {
        await createFile(file);
      }

      // 16. Create Special Issues
      console.log('⚠️ Creating special issues...');
      for (const issue of seedSpecialIssues) {
        await createSpecialIssue(issue);
      }

      // 17. Create Planning Changes
      console.log('Creating planning changes...');
      for (const change of seedPlanningChanges) {
        await createPlanningChange(change);
      }

      // 18. Create Cost Items
      console.log('Creating cost items...');
      const { createCostItem } = await import('../services/costsService');
      for (const item of seedCostItems) {
        await createCostItem(item);
      }

      // 19. Create Payment Schedules + Schedule Items
      console.log('Creating payment schedules...');
      const { createSchedule, createScheduleItem } = await import('../services/paymentSchedulesService');
      for (const schedule of seedPaymentSchedules) {
        await createSchedule(schedule);
      }
      console.log('Creating schedule items...');
      for (const si of seedScheduleItems) {
        await createScheduleItem(si);
      }

      console.log('Neon database seeded successfully!');

      return {
        projects: seedProjects.length,
        professionals: seedProfessionals.length,
        budgetItems: seedBudgetItems.length,
        payments: seedBudgetPayments.length,
        costItems: seedCostItems.length,
        paymentSchedules: seedPaymentSchedules.length,
        scheduleItems: seedScheduleItems.length,
        totalRecords:
          seedProjects.length +
          seedProfessionals.length +
          seedProjectProfessionals.length +
          seedBudgets.length +
          seedBudgetCategories.length +
          seedBudgetChapters.length +
          seedBudgetItems.length +
          seedBudgetPayments.length +
          seedProjectUnits.length +
          seedProjectMilestones.length +
          seedGanttTasks.length +
          seedTenders.length +
          seedTenderParticipants.length +
          seedTasks.length +
          seedFiles.length +
          seedSpecialIssues.length +
          seedPlanningChanges.length +
          seedCostItems.length +
          seedPaymentSchedules.length +
          seedScheduleItems.length,
      };
    } catch (error) {
      console.error('❌ Error seeding Neon database:', error);
      throw error;
    }
  } else {
    throw new Error(`Unknown target: ${target}`);
  }
}

export async function clearDatabase(target: 'localStorage' | 'neon' = 'localStorage') {
  if (target === 'localStorage') {
    const keys = Object.keys(localStorage).filter(
      k => k.startsWith('anprojects:') || k.startsWith('cost_items_')
    );
    keys.forEach(k => localStorage.removeItem(k));
    console.log(`Cleared ${keys.length} localStorage keys`);
    return { clearedKeys: keys.length };
  } else if (target === 'neon') {
    // Clear Neon DB by truncating all tables with CASCADE
    console.log('🗑️ Clearing Neon database...');

    try {
      const { executeQuery } = await import('../lib/neon');

      // Truncate all tables in reverse dependency order
      // CASCADE will handle foreign key constraints
      await executeQuery(`
        TRUNCATE TABLE
          budget_payments,
          budget_items,
          budget_chapters,
          budget_categories,
          budgets,
          gantt_tasks,
          project_milestones,
          project_units,
          tender_participants,
          tenders,
          tasks,
          project_professionals,
          planning_changes,
          special_issues,
          files,
          professionals,
          project_assignments,
          projects,
          user_profiles
        CASCADE
      `);

      console.log('✅ Neon database cleared successfully!');
      return { clearedKeys: 19 }; // Number of tables cleared
    } catch (error) {
      console.error('❌ Error clearing Neon database:', error);
      throw error;
    }
  } else {
    throw new Error(`Unknown target: ${target}`);
  }
}

// ============================================================
// EXPORT SUMMARY
// ============================================================

export const seedDataSummary = {
  projects: seedProjects.length,
  professionals: seedProfessionals.length,
  projectProfessionals: seedProjectProfessionals.length,
  budgets: seedBudgets.length,
  budgetCategories: seedBudgetCategories.length,
  budgetChapters: seedBudgetChapters.length,
  budgetItems: seedBudgetItems.length,
  budgetPayments: seedBudgetPayments.length,
  projectUnits: seedProjectUnits.length,
  projectMilestones: seedProjectMilestones.length,
  ganttTasks: seedGanttTasks.length,
  tenders: seedTenders.length,
  tenderParticipants: seedTenderParticipants.length,
  tasks: seedTasks.length,
  files: seedFiles.length,
  specialIssues: seedSpecialIssues.length,
  planningChanges: seedPlanningChanges.length,
  costItems: seedCostItems.length,
  paymentSchedules: seedPaymentSchedules.length,
  scheduleItems: seedScheduleItems.length,
};

console.log('Seed Data Summary:', seedDataSummary);
