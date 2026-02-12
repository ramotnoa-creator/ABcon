/**
 * Seed Data — Two realistic Israeli construction projects
 * Villa (Herzliya) + 4-Building Complex (Netanya)
 */

import type {
  Project, Professional, Budget, BudgetCategory, BudgetChapter, BudgetItem,
  BudgetPayment, ProjectUnit, ProjectMilestone, GanttTask, Tender,
  TenderParticipant, Task, File, SpecialIssue, PlanningChange,
  ProjectProfessional, CostItem, PaymentSchedule, ScheduleItem,
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
// PROJECTS
// ============================================================

export const seedProjects: Project[] = [
  {
    id: 'proj-villa',
    project_name: 'וילה פרטית - הרצליה פיטוח',
    client_name: 'דוד ומיכל אברהם',
    address: 'רחוב האלון 12, הרצליה פיטוח',
    status: 'ביצוע',
    permit_start_date: daysAgo(240),
    permit_duration_months: 24,
    permit_target_date: daysFromNow(490),
    permit_approval_date: daysAgo(210),
    created_at: daysAgo(300),
    updated_at_text: 'לפני שבוע',
    notes: 'וילה 350 מ"ר, 2 קומות + מרתף, בריכה, גינה',
    general_estimate: 4000000,
    built_sqm: 350,
    current_vat_rate: 17,
  },
  {
    id: 'proj-bldg',
    project_name: 'מתחם מגורים - פארק הים, נתניה',
    client_name: 'קבוצת אלון נדל"ן בע"מ',
    address: 'שדרות נחום סוקולוב 40, נתניה',
    status: 'ביצוע',
    permit_start_date: daysAgo(360),
    permit_duration_months: 36,
    permit_target_date: daysFromNow(720),
    permit_approval_date: daysAgo(330),
    created_at: daysAgo(400),
    updated_at_text: 'אתמול',
    notes: '4 בניינים × 5 קומות, סה"כ 4,800 מ"ר, 80 יחידות דיור',
    general_estimate: 20000000,
    built_sqm: 4800,
    current_vat_rate: 17,
  },
];

// ============================================================
// PROFESSIONALS (~40)
// ============================================================

export const seedProfessionals: Professional[] = [
  // אדריכלים
  { id: 'prof-arch-1', professional_name: "אדר' יעל שפירא", company_name: 'שפירא אדריכלים', field: 'אדריכל', phone: '054-7891234', email: 'yael@shapira-arch.co.il', rating: 4.8, is_active: true },
  { id: 'prof-arch-2', professional_name: "אדר' רון מזרחי", company_name: 'סטודיו מזרחי', field: 'אדריכל', phone: '052-3456789', email: 'ron@mizrachi-studio.co.il', rating: 4.5, is_active: true },
  { id: 'prof-arch-3', professional_name: "אדר' נועה כהן", company_name: 'כהן אדריכלות', field: 'אדריכל', phone: '050-9876543', email: 'noa@cohen-arch.co.il', rating: 4.2, is_active: true },
  // אדריכלי נוף
  { id: 'prof-land-1', professional_name: "אדר' נוף מיכל לוי", company_name: 'לוי נוף', field: 'אדריכל נוף', phone: '054-1112233', email: 'michal@levi-landscape.co.il', rating: 4.6, is_active: true },
  { id: 'prof-land-2', professional_name: "אדר' נוף עמית ברק", company_name: 'ברק גנים', field: 'אדריכל נוף', phone: '052-4445566', email: 'amit@barak-gardens.co.il', rating: 4.3, is_active: true },
  { id: 'prof-land-3', professional_name: "אדר' נוף דנה שלום", company_name: 'שלום נוף', field: 'אדריכל נוף', phone: '050-7778899', email: 'dana@shalom-nof.co.il', rating: 3.9, is_active: true },
  // מהנדסי קונסטרוקציה
  { id: 'prof-struct-1', professional_name: 'מהנדס אבי גולדשטיין', company_name: 'גולדשטיין הנדסה', field: 'מהנדס קונסטרוקציה', phone: '054-2223344', email: 'avi@goldstein-eng.co.il', rating: 4.7, is_active: true },
  { id: 'prof-struct-2', professional_name: 'מהנדס יוסי חדד', company_name: 'חדד מבנים', field: 'מהנדס קונסטרוקציה', phone: '052-5556677', email: 'yossi@hadad-structures.co.il', rating: 4.4, is_active: true },
  { id: 'prof-struct-3', professional_name: 'מהנדסת שירה פרידמן', company_name: 'פרידמן קונסטרוקציה', field: 'מהנדס קונסטרוקציה', phone: '050-8889900', email: 'shira@friedman-const.co.il', rating: 4.1, is_active: true },
  // מהנדסי חשמל
  { id: 'prof-ee-1', professional_name: 'מהנדס חשמל דני רוזן', company_name: 'רוזן חשמל', field: 'מהנדס חשמל', phone: '054-3334455', email: 'dani@rozen-elec.co.il', rating: 4.5, is_active: true },
  { id: 'prof-ee-2', professional_name: 'מהנדס חשמל טל אופיר', company_name: 'אופיר מערכות', field: 'מהנדס חשמל', phone: '052-6667788', email: 'tal@ofir-systems.co.il', rating: 4.0, is_active: true },
  { id: 'prof-ee-3', professional_name: 'מהנדסת חשמל לימור בן-דוד', company_name: 'בן-דוד הנדסת חשמל', field: 'מהנדס חשמל', phone: '050-1234567', email: 'limor@bendavid-elec.co.il', rating: 4.3, is_active: true },
  // קבלני שלד
  { id: 'prof-main-1', professional_name: 'משה דוד', company_name: 'דוד בנייה בע"מ', field: 'קבלן שלד', phone: '054-5551234', email: 'moshe@david-build.co.il', rating: 4.6, is_active: true },
  { id: 'prof-main-2', professional_name: 'אחמד חסן', company_name: 'חסן קבלנות', field: 'קבלן שלד', phone: '052-5555678', email: 'ahmad@hassan-const.co.il', rating: 4.3, is_active: true },
  { id: 'prof-main-3', professional_name: 'יגאל פרץ', company_name: 'פרץ שלד בע"מ', field: 'קבלן שלד', phone: '050-5559012', email: 'yigal@peretz-skeleton.co.il', rating: 4.0, is_active: true },
  // קבלני חשמל
  { id: 'prof-elec-1', professional_name: 'רוני זוהר', company_name: 'זוהר חשמל', field: 'קבלן חשמל', phone: '054-6661234', email: 'roni@zohar-elec.co.il', rating: 4.4, is_active: true },
  { id: 'prof-elec-2', professional_name: 'סלים נאסר', company_name: 'נאסר מערכות חשמל', field: 'קבלן חשמל', phone: '052-6665678', email: 'salim@naser-elec.co.il', rating: 4.1, is_active: true },
  { id: 'prof-elec-3', professional_name: 'גיא שטרן', company_name: 'שטרן חשמל בע"מ', field: 'קבלן חשמל', phone: '050-6669012', email: 'guy@stern-electric.co.il', rating: 3.8, is_active: true },
  // קבלני אינסטלציה
  { id: 'prof-plumb-1', professional_name: 'דני כהן', company_name: 'כהן אינסטלציה', field: 'קבלן אינסטלציה', phone: '054-7771234', email: 'dani@cohen-plumb.co.il', rating: 4.5, is_active: true },
  { id: 'prof-plumb-2', professional_name: 'עלי מוחמד', company_name: 'מוחמד צנרת', field: 'קבלן אינסטלציה', phone: '052-7775678', email: 'ali@muhammad-pipes.co.il', rating: 4.2, is_active: true },
  { id: 'prof-plumb-3', professional_name: 'בועז לרנר', company_name: 'לרנר אינסטלציה בע"מ', field: 'קבלן אינסטלציה', phone: '050-7779012', email: 'boaz@lerner-plumb.co.il', rating: 3.9, is_active: true },
  // קבלני ריצוף
  { id: 'prof-tile-1', professional_name: 'חסן אבו-ריש', company_name: 'אבו-ריש ריצוף', field: 'קבלן ריצוף', phone: '054-8881234', email: 'hassan@aburish-tiles.co.il', rating: 4.7, is_active: true },
  { id: 'prof-tile-2', professional_name: 'אלי בן-חיים', company_name: 'בן-חיים ריצוף', field: 'קבלן ריצוף', phone: '052-8885678', email: 'eli@benhaim-tiles.co.il', rating: 4.3, is_active: true },
  { id: 'prof-tile-3', professional_name: 'ויקטור גרינברג', company_name: 'גרינברג ריצוף בע"מ', field: 'קבלן ריצוף', phone: '050-8889012', email: 'victor@greenberg-tiles.co.il', rating: 4.0, is_active: true },
  // קבלני אלומיניום
  { id: 'prof-alum-1', professional_name: 'מוטי שגב', company_name: 'שגב אלומיניום', field: 'קבלן אלומיניום', phone: '054-9991234', email: 'moti@segev-alum.co.il', rating: 4.4, is_active: true },
  { id: 'prof-alum-2', professional_name: 'ואליד חוסיין', company_name: 'חוסיין אלומיניום', field: 'קבלן אלומיניום', phone: '052-9995678', email: 'walid@hussein-alum.co.il', rating: 4.1, is_active: true },
  { id: 'prof-alum-3', professional_name: 'שמעון דהן', company_name: 'דהן חלונות ודלתות', field: 'קבלן אלומיניום', phone: '050-9999012', email: 'shimon@dahan-windows.co.il', rating: 3.7, is_active: true },
  // קבלני גבס
  { id: 'prof-dry-1', professional_name: 'ארתור קוזלוב', company_name: 'קוזלוב גבס', field: 'קבלן גבס', phone: '054-1011234', email: 'artur@kozlov-drywall.co.il', rating: 4.3, is_active: true },
  { id: 'prof-dry-2', professional_name: 'עמוס חזן', company_name: 'חזן גבס ותקרות', field: 'קבלן גבס', phone: '052-1015678', email: 'amos@hazan-drywall.co.il', rating: 4.0, is_active: true },
  { id: 'prof-dry-3', professional_name: 'פבל סורוקין', company_name: 'סורוקין גמר בע"מ', field: 'קבלן גבס', phone: '050-1019012', email: 'pavel@sorokin-finish.co.il', rating: 3.8, is_active: true },
  // קבלני צבע
  { id: 'prof-paint-1', professional_name: 'יוסי מלכה', company_name: 'מלכה צבעים', field: 'קבלן צבע', phone: '054-1021234', email: 'yossi@malka-paint.co.il', rating: 4.2, is_active: true },
  { id: 'prof-paint-2', professional_name: 'סרגיי ברקוב', company_name: 'ברקוב צביעה', field: 'קבלן צבע', phone: '052-1025678', email: 'sergey@barkov-paint.co.il', rating: 3.9, is_active: true },
  { id: 'prof-paint-3', professional_name: 'מאיר אסולין', company_name: 'אסולין צבע ושפכטל', field: 'קבלן צבע', phone: '050-1029012', email: 'meir@asoulin-paint.co.il', rating: 4.5, is_active: true },
  // קבלני איטום
  { id: 'prof-seal-1', professional_name: 'ניר אלבז', company_name: 'אלבז איטום', field: 'קבלן איטום', phone: '054-1031234', email: 'nir@elbaz-seal.co.il', rating: 4.6, is_active: true },
  { id: 'prof-seal-2', professional_name: 'רמי טביב', company_name: 'טביב איטום ובידוד', field: 'קבלן איטום', phone: '052-1035678', email: 'rami@taviv-seal.co.il', rating: 4.0, is_active: true },
  { id: 'prof-seal-3', professional_name: 'זאב קפלן', company_name: 'קפלן איטום בע"מ', field: 'קבלן איטום', phone: '050-1039012', email: 'zeev@kaplan-seal.co.il', rating: 3.8, is_active: true },
  // יועצים
  { id: 'prof-soil-1', professional_name: 'ד"ר אורי נחמיאס', company_name: 'נחמיאס גאוטכניקה', field: 'יועץ קרקע', phone: '054-1041234', email: 'uri@nahmias-geo.co.il', rating: 4.5, is_active: true },
  { id: 'prof-safety-1', professional_name: 'רונן שפר', company_name: 'שפר בטיחות', field: 'יועץ בטיחות', phone: '052-1045678', email: 'ronen@shefer-safety.co.il', rating: 4.3, is_active: true },
  { id: 'prof-survey-1', professional_name: 'משה אטיאס', company_name: 'אטיאס מדידות', field: 'מודד', phone: '050-1049012', email: 'moshe@atias-survey.co.il', rating: 4.1, is_active: true },
  // קבלן מעלית
  { id: 'prof-elev-1', professional_name: 'אורי גלעד', company_name: 'גלעד מעליות', field: 'קבלן מעלית', phone: '054-1051234', email: 'uri@gilad-elevators.co.il', rating: 4.4, is_active: true },
  // ספקים
  { id: 'prof-kitchen-1', professional_name: 'רונית שמעוני', company_name: 'שמעוני מטבחים', field: 'ספק מטבח', phone: '054-1061234', email: 'ronit@shemoni-kitchens.co.il', rating: 4.5, is_active: true },
  { id: 'prof-supply-1', professional_name: 'חיים ברגר', company_name: 'ברגר חומרי בניין', field: 'ספק חומרי בניין', phone: '052-1065678', email: 'haim@berger-supply.co.il', rating: 4.2, is_active: true },
  { id: 'prof-sanitary-1', professional_name: 'אמיר פרנקל', company_name: 'פרנקל סנטריה', field: 'ספק סנטריה', phone: '050-1069012', email: 'amir@frenkel-sanitary.co.il', rating: 4.0, is_active: true },
  { id: 'prof-doors-1', professional_name: 'יצחק לוין', company_name: 'לוין דלתות', field: 'ספק דלתות', phone: '054-1071234', email: 'yitzhak@levin-doors.co.il', rating: 4.1, is_active: true },
];

// ============================================================
// PROJECT-PROFESSIONAL ASSIGNMENTS
// ============================================================

export const seedProjectProfessionals: ProjectProfessional[] = [
  // Villa assignments
  { id: 'pp-v-1', project_id: 'proj-villa', professional_id: 'prof-arch-1', project_role: 'אדריכל ראשי', source: 'Manual', is_active: true, start_date: daysAgo(300) },
  { id: 'pp-v-2', project_id: 'proj-villa', professional_id: 'prof-land-1', project_role: 'אדריכל נוף', source: 'Manual', is_active: true, start_date: daysAgo(280) },
  { id: 'pp-v-3', project_id: 'proj-villa', professional_id: 'prof-struct-1', project_role: 'מהנדס קונסטרוקציה', source: 'Manual', is_active: true, start_date: daysAgo(290) },
  { id: 'pp-v-4', project_id: 'proj-villa', professional_id: 'prof-soil-1', project_role: 'יועץ קרקע', source: 'Manual', is_active: true, start_date: daysAgo(295) },
  { id: 'pp-v-5', project_id: 'proj-villa', professional_id: 'prof-safety-1', project_role: 'יועץ בטיחות', source: 'Manual', is_active: true, start_date: daysAgo(250) },
  { id: 'pp-v-6', project_id: 'proj-villa', professional_id: 'prof-main-1', project_role: 'קבלן שלד', source: 'Tender', related_tender_id: 'tender-v-1', related_tender_name: 'מכרז שלד', is_active: true, start_date: daysAgo(200) },
  { id: 'pp-v-7', project_id: 'proj-villa', professional_id: 'prof-elec-1', project_role: 'קבלן חשמל', source: 'Tender', related_tender_id: 'tender-v-2', related_tender_name: 'מכרז חשמל', is_active: true, start_date: daysAgo(160) },
  { id: 'pp-v-8', project_id: 'proj-villa', professional_id: 'prof-plumb-1', project_role: 'קבלן אינסטלציה', source: 'Tender', related_tender_id: 'tender-v-3', related_tender_name: 'מכרז אינסטלציה', is_active: true, start_date: daysAgo(155) },
  { id: 'pp-v-9', project_id: 'proj-villa', professional_id: 'prof-tile-1', project_role: 'קבלן ריצוף', source: 'Tender', related_tender_id: 'tender-v-4', related_tender_name: 'מכרז ריצוף', is_active: true, start_date: daysAgo(100) },
  { id: 'pp-v-10', project_id: 'proj-villa', professional_id: 'prof-alum-1', project_role: 'קבלן אלומיניום', source: 'Tender', related_tender_id: 'tender-v-5', related_tender_name: 'מכרז אלומיניום', is_active: true, start_date: daysAgo(95) },
  // Buildings assignments
  { id: 'pp-b-1', project_id: 'proj-bldg', professional_id: 'prof-arch-2', project_role: 'אדריכל ראשי', source: 'Manual', is_active: true, start_date: daysAgo(400) },
  { id: 'pp-b-2', project_id: 'proj-bldg', professional_id: 'prof-land-2', project_role: 'אדריכל נוף', source: 'Manual', is_active: true, start_date: daysAgo(380) },
  { id: 'pp-b-3', project_id: 'proj-bldg', professional_id: 'prof-struct-2', project_role: 'מהנדס קונסטרוקציה', source: 'Manual', is_active: true, start_date: daysAgo(390) },
  { id: 'pp-b-4', project_id: 'proj-bldg', professional_id: 'prof-ee-1', project_role: 'מהנדס חשמל', source: 'Manual', is_active: true, start_date: daysAgo(385) },
  { id: 'pp-b-5', project_id: 'proj-bldg', professional_id: 'prof-soil-1', project_role: 'יועץ קרקע', source: 'Tender', related_tender_id: 'tender-b-7', related_tender_name: 'מכרז יועץ קרקע', is_active: true, start_date: daysAgo(395) },
  { id: 'pp-b-6', project_id: 'proj-bldg', professional_id: 'prof-safety-1', project_role: 'יועץ בטיחות', source: 'Manual', is_active: true, start_date: daysAgo(370) },
  { id: 'pp-b-7', project_id: 'proj-bldg', professional_id: 'prof-survey-1', project_role: 'מודד', source: 'Manual', is_active: true, start_date: daysAgo(398) },
  { id: 'pp-b-8', project_id: 'proj-bldg', professional_id: 'prof-main-2', project_role: 'קבלן שלד', source: 'Tender', related_tender_id: 'tender-b-1', related_tender_name: 'מכרז שלד', is_active: true, start_date: daysAgo(320) },
  { id: 'pp-b-9', project_id: 'proj-bldg', professional_id: 'prof-elec-2', project_role: 'קבלן חשמל', source: 'Tender', related_tender_id: 'tender-b-2', related_tender_name: 'מכרז חשמל', is_active: true, start_date: daysAgo(250) },
  { id: 'pp-b-10', project_id: 'proj-bldg', professional_id: 'prof-plumb-2', project_role: 'קבלן אינסטלציה', source: 'Tender', related_tender_id: 'tender-b-3', related_tender_name: 'מכרז אינסטלציה', is_active: true, start_date: daysAgo(245) },
  { id: 'pp-b-11', project_id: 'proj-bldg', professional_id: 'prof-tile-2', project_role: 'קבלן ריצוף', source: 'Tender', related_tender_id: 'tender-b-4', related_tender_name: 'מכרז ריצוף', is_active: true, start_date: daysAgo(180) },
  { id: 'pp-b-12', project_id: 'proj-bldg', professional_id: 'prof-alum-2', project_role: 'קבלן אלומיניום', source: 'Tender', related_tender_id: 'tender-b-5', related_tender_name: 'מכרז אלומיניום', is_active: true, start_date: daysAgo(175) },
  { id: 'pp-b-13', project_id: 'proj-bldg', professional_id: 'prof-elev-1', project_role: 'קבלן מעלית', source: 'Tender', related_tender_id: 'tender-b-6', related_tender_name: 'מכרז מעליות', is_active: true, start_date: daysAgo(200) },
];

// ============================================================
// COST ITEMS
// ============================================================

export const seedCostItems: CostItem[] = [
  // Villa — 5 draft, 5 tender_winner, 2 tender_open, 1 tender_draft = 13
  { id: 'cost-v-1', project_id: 'proj-villa', name: 'אדריכל', category: 'consultant', estimated_amount: 280000, vat_included: false, vat_rate: 17, status: 'draft', created_at: daysAgo(300), updated_at: daysAgo(300) },
  { id: 'cost-v-2', project_id: 'proj-villa', name: 'אדריכל נוף', category: 'consultant', estimated_amount: 80000, vat_included: false, vat_rate: 17, status: 'draft', created_at: daysAgo(300), updated_at: daysAgo(300) },
  { id: 'cost-v-3', project_id: 'proj-villa', name: 'מהנדס קונסטרוקציה', category: 'consultant', estimated_amount: 120000, vat_included: false, vat_rate: 17, status: 'draft', created_at: daysAgo(290), updated_at: daysAgo(290) },
  { id: 'cost-v-4', project_id: 'proj-villa', name: 'יועץ קרקע', category: 'consultant', estimated_amount: 45000, vat_included: false, vat_rate: 17, status: 'draft', created_at: daysAgo(295), updated_at: daysAgo(295) },
  { id: 'cost-v-5', project_id: 'proj-villa', name: 'יועץ בטיחות', category: 'consultant', estimated_amount: 35000, vat_included: false, vat_rate: 17, status: 'draft', created_at: daysAgo(250), updated_at: daysAgo(250) },
  { id: 'cost-v-6', project_id: 'proj-villa', name: 'קבלן שלד', category: 'contractor', estimated_amount: 1400000, actual_amount: 1350000, vat_included: false, vat_rate: 17, status: 'tender_winner', tender_id: 'tender-v-1', created_at: daysAgo(220), updated_at: daysAgo(200) },
  { id: 'cost-v-7', project_id: 'proj-villa', name: 'קבלן חשמל', category: 'contractor', estimated_amount: 320000, actual_amount: 310000, vat_included: false, vat_rate: 17, status: 'tender_winner', tender_id: 'tender-v-2', created_at: daysAgo(180), updated_at: daysAgo(160) },
  { id: 'cost-v-8', project_id: 'proj-villa', name: 'קבלן אינסטלציה', category: 'contractor', estimated_amount: 280000, actual_amount: 275000, vat_included: false, vat_rate: 17, status: 'tender_winner', tender_id: 'tender-v-3', created_at: daysAgo(175), updated_at: daysAgo(155) },
  { id: 'cost-v-9', project_id: 'proj-villa', name: 'קבלן ריצוף', category: 'contractor', estimated_amount: 250000, actual_amount: 242000, vat_included: false, vat_rate: 17, status: 'tender_winner', tender_id: 'tender-v-4', created_at: daysAgo(120), updated_at: daysAgo(100) },
  { id: 'cost-v-10', project_id: 'proj-villa', name: 'קבלן אלומיניום', category: 'contractor', estimated_amount: 220000, actual_amount: 215000, vat_included: false, vat_rate: 17, status: 'tender_winner', tender_id: 'tender-v-5', created_at: daysAgo(115), updated_at: daysAgo(95) },
  { id: 'cost-v-11', project_id: 'proj-villa', name: 'קבלן גבס', category: 'contractor', estimated_amount: 180000, vat_included: false, vat_rate: 17, status: 'tender_open', tender_id: 'tender-v-6', created_at: daysAgo(60), updated_at: daysAgo(30) },
  { id: 'cost-v-12', project_id: 'proj-villa', name: 'קבלן צבע', category: 'contractor', estimated_amount: 140000, vat_included: false, vat_rate: 17, status: 'tender_open', tender_id: 'tender-v-7', created_at: daysAgo(55), updated_at: daysAgo(25) },
  { id: 'cost-v-13', project_id: 'proj-villa', name: 'קבלן איטום', category: 'contractor', estimated_amount: 110000, vat_included: false, vat_rate: 17, status: 'tender_draft', tender_id: 'tender-v-8', created_at: daysAgo(40), updated_at: daysAgo(40) },
  // Villa — agra (municipal fees)
  { id: 'cost-v-14', project_id: 'proj-villa', name: 'אגרות בנייה', category: 'agra', estimated_amount: 85000, actual_amount: 85000, vat_included: true, vat_rate: 17, status: 'draft', created_at: daysAgo(310), updated_at: daysAgo(310) },
  { id: 'cost-v-15', project_id: 'proj-villa', name: 'היטל השבחה', category: 'agra', estimated_amount: 120000, actual_amount: 115000, vat_included: true, vat_rate: 17, status: 'draft', created_at: daysAgo(305), updated_at: daysAgo(280) },
  // Buildings — 7 draft, 7 tender_winner, 2 tender_open, 2 tender_draft = 18
  { id: 'cost-b-1', project_id: 'proj-bldg', name: 'אדריכל', category: 'consultant', estimated_amount: 900000, vat_included: false, vat_rate: 17, status: 'draft', created_at: daysAgo(400), updated_at: daysAgo(400) },
  { id: 'cost-b-2', project_id: 'proj-bldg', name: 'אדריכל נוף', category: 'consultant', estimated_amount: 250000, vat_included: false, vat_rate: 17, status: 'draft', created_at: daysAgo(400), updated_at: daysAgo(400) },
  { id: 'cost-b-3', project_id: 'proj-bldg', name: 'מהנדס קונסטרוקציה', category: 'consultant', estimated_amount: 500000, vat_included: false, vat_rate: 17, status: 'draft', created_at: daysAgo(390), updated_at: daysAgo(390) },
  { id: 'cost-b-4', project_id: 'proj-bldg', name: 'מהנדס חשמל', category: 'consultant', estimated_amount: 200000, vat_included: false, vat_rate: 17, status: 'draft', created_at: daysAgo(385), updated_at: daysAgo(385) },
  { id: 'cost-b-5', project_id: 'proj-bldg', name: 'יועץ קרקע', category: 'consultant', estimated_amount: 150000, actual_amount: 145000, vat_included: false, vat_rate: 17, status: 'tender_winner', tender_id: 'tender-b-7', created_at: daysAgo(395), updated_at: daysAgo(350) },
  { id: 'cost-b-6', project_id: 'proj-bldg', name: 'יועץ בטיחות', category: 'consultant', estimated_amount: 120000, vat_included: false, vat_rate: 17, status: 'draft', created_at: daysAgo(370), updated_at: daysAgo(370) },
  { id: 'cost-b-7', project_id: 'proj-bldg', name: 'מודד', category: 'consultant', estimated_amount: 80000, vat_included: false, vat_rate: 17, status: 'draft', created_at: daysAgo(398), updated_at: daysAgo(398) },
  { id: 'cost-b-8', project_id: 'proj-bldg', name: 'קבלן שלד', category: 'contractor', estimated_amount: 7500000, actual_amount: 7200000, vat_included: false, vat_rate: 17, status: 'tender_winner', tender_id: 'tender-b-1', created_at: daysAgo(350), updated_at: daysAgo(320) },
  { id: 'cost-b-9', project_id: 'proj-bldg', name: 'קבלן חשמל', category: 'contractor', estimated_amount: 1800000, actual_amount: 1750000, vat_included: false, vat_rate: 17, status: 'tender_winner', tender_id: 'tender-b-2', created_at: daysAgo(280), updated_at: daysAgo(250) },
  { id: 'cost-b-10', project_id: 'proj-bldg', name: 'קבלן אינסטלציה', category: 'contractor', estimated_amount: 1500000, actual_amount: 1480000, vat_included: false, vat_rate: 17, status: 'tender_winner', tender_id: 'tender-b-3', created_at: daysAgo(275), updated_at: daysAgo(245) },
  { id: 'cost-b-11', project_id: 'proj-bldg', name: 'קבלן ריצוף', category: 'contractor', estimated_amount: 1200000, actual_amount: 1150000, vat_included: false, vat_rate: 17, status: 'tender_winner', tender_id: 'tender-b-4', created_at: daysAgo(210), updated_at: daysAgo(180) },
  { id: 'cost-b-12', project_id: 'proj-bldg', name: 'קבלן אלומיניום', category: 'contractor', estimated_amount: 1100000, actual_amount: 1060000, vat_included: false, vat_rate: 17, status: 'tender_winner', tender_id: 'tender-b-5', created_at: daysAgo(205), updated_at: daysAgo(175) },
  { id: 'cost-b-13', project_id: 'proj-bldg', name: 'קבלן מעלית', category: 'contractor', estimated_amount: 800000, actual_amount: 780000, vat_included: false, vat_rate: 17, status: 'tender_winner', tender_id: 'tender-b-6', created_at: daysAgo(230), updated_at: daysAgo(200) },
  { id: 'cost-b-14', project_id: 'proj-bldg', name: 'קבלן גבס', category: 'contractor', estimated_amount: 900000, vat_included: false, vat_rate: 17, status: 'tender_open', tender_id: 'tender-b-8', created_at: daysAgo(80), updated_at: daysAgo(40) },
  { id: 'cost-b-15', project_id: 'proj-bldg', name: 'קבלן צבע', category: 'contractor', estimated_amount: 700000, vat_included: false, vat_rate: 17, status: 'tender_open', tender_id: 'tender-b-9', created_at: daysAgo(75), updated_at: daysAgo(35) },
  { id: 'cost-b-16', project_id: 'proj-bldg', name: 'קבלן איטום', category: 'contractor', estimated_amount: 550000, vat_included: false, vat_rate: 17, status: 'draft', created_at: daysAgo(100), updated_at: daysAgo(100) },
  { id: 'cost-b-17', project_id: 'proj-bldg', name: 'ספק חומרי בניין', category: 'supplier', estimated_amount: 1000000, vat_included: false, vat_rate: 17, status: 'draft', created_at: daysAgo(350), updated_at: daysAgo(350) },
  { id: 'cost-b-18', project_id: 'proj-bldg', name: 'ספק מטבחים', category: 'supplier', estimated_amount: 400000, vat_included: false, vat_rate: 17, status: 'draft', created_at: daysAgo(200), updated_at: daysAgo(200) },
  { id: 'cost-b-19', project_id: 'proj-bldg', name: 'ספק סנטריה', category: 'supplier', estimated_amount: 200000, vat_included: false, vat_rate: 17, status: 'draft', created_at: daysAgo(200), updated_at: daysAgo(200) },
  { id: 'cost-b-20', project_id: 'proj-bldg', name: 'ספק דלתות', category: 'supplier', estimated_amount: 150000, vat_included: false, vat_rate: 17, status: 'tender_draft', tender_id: 'tender-b-10', created_at: daysAgo(60), updated_at: daysAgo(60) },
  // Buildings — agra (municipal fees)
  { id: 'cost-b-21', project_id: 'proj-bldg', name: 'אגרות בנייה', category: 'agra', estimated_amount: 450000, actual_amount: 450000, vat_included: true, vat_rate: 17, status: 'draft', created_at: daysAgo(410), updated_at: daysAgo(410) },
  { id: 'cost-b-22', project_id: 'proj-bldg', name: 'היטל השבחה', category: 'agra', estimated_amount: 800000, actual_amount: 780000, vat_included: true, vat_rate: 17, status: 'draft', created_at: daysAgo(405), updated_at: daysAgo(380) },
  { id: 'cost-b-23', project_id: 'proj-bldg', name: 'היטל פיתוח', category: 'agra', estimated_amount: 350000, vat_included: true, vat_rate: 17, status: 'draft', created_at: daysAgo(400), updated_at: daysAgo(400) },
];

// ============================================================
// TENDERS
// ============================================================

export const seedTenders: Tender[] = [
  // Villa — 5 WinnerSelected, 2 Open, 1 Draft
  { id: 'tender-v-1', project_id: 'proj-villa', tender_name: 'מכרז שלד', tender_type: 'contractor', status: 'WinnerSelected', publish_date: daysAgo(220), due_date: daysAgo(205), bom_sent_date: daysAgo(220), winner_selected_date: daysAgo(200), candidate_professional_ids: ['prof-main-1', 'prof-main-2', 'prof-main-3'], winner_professional_id: 'prof-main-1', winner_professional_name: 'משה דוד', estimated_budget: 1400000, contract_amount: 1350000, cost_item_id: 'cost-v-6', created_at: daysAgo(220), updated_at: daysAgo(200) },
  { id: 'tender-v-2', project_id: 'proj-villa', tender_name: 'מכרז חשמל', tender_type: 'electrician', status: 'WinnerSelected', publish_date: daysAgo(180), due_date: daysAgo(165), bom_sent_date: daysAgo(180), winner_selected_date: daysAgo(160), candidate_professional_ids: ['prof-elec-1', 'prof-elec-2', 'prof-elec-3'], winner_professional_id: 'prof-elec-1', winner_professional_name: 'רוני זוהר', estimated_budget: 320000, contract_amount: 310000, cost_item_id: 'cost-v-7', created_at: daysAgo(180), updated_at: daysAgo(160) },
  { id: 'tender-v-3', project_id: 'proj-villa', tender_name: 'מכרז אינסטלציה', tender_type: 'plumber', status: 'WinnerSelected', publish_date: daysAgo(175), due_date: daysAgo(160), bom_sent_date: daysAgo(175), winner_selected_date: daysAgo(155), candidate_professional_ids: ['prof-plumb-1', 'prof-plumb-2', 'prof-plumb-3'], winner_professional_id: 'prof-plumb-1', winner_professional_name: 'דני כהן', estimated_budget: 280000, contract_amount: 275000, cost_item_id: 'cost-v-8', created_at: daysAgo(175), updated_at: daysAgo(155) },
  { id: 'tender-v-4', project_id: 'proj-villa', tender_name: 'מכרז ריצוף', tender_type: 'contractor', status: 'WinnerSelected', publish_date: daysAgo(120), due_date: daysAgo(105), bom_sent_date: daysAgo(120), winner_selected_date: daysAgo(100), candidate_professional_ids: ['prof-tile-1', 'prof-tile-2', 'prof-tile-3'], winner_professional_id: 'prof-tile-1', winner_professional_name: 'חסן אבו-ריש', estimated_budget: 250000, contract_amount: 242000, cost_item_id: 'cost-v-9', created_at: daysAgo(120), updated_at: daysAgo(100) },
  { id: 'tender-v-5', project_id: 'proj-villa', tender_name: 'מכרז אלומיניום', tender_type: 'contractor', status: 'WinnerSelected', publish_date: daysAgo(115), due_date: daysAgo(100), bom_sent_date: daysAgo(115), winner_selected_date: daysAgo(95), candidate_professional_ids: ['prof-alum-1', 'prof-alum-2', 'prof-alum-3'], winner_professional_id: 'prof-alum-1', winner_professional_name: 'מוטי שגב', estimated_budget: 220000, contract_amount: 215000, cost_item_id: 'cost-v-10', created_at: daysAgo(115), updated_at: daysAgo(95) },
  { id: 'tender-v-6', project_id: 'proj-villa', tender_name: 'מכרז גבס', tender_type: 'contractor', status: 'Open', publish_date: daysAgo(30), due_date: daysFromNow(15), bom_sent_date: daysAgo(30), candidate_professional_ids: ['prof-dry-1', 'prof-dry-2', 'prof-dry-3'], estimated_budget: 180000, cost_item_id: 'cost-v-11', created_at: daysAgo(60), updated_at: daysAgo(30) },
  { id: 'tender-v-7', project_id: 'proj-villa', tender_name: 'מכרז צבע', tender_type: 'contractor', status: 'Open', publish_date: daysAgo(25), due_date: daysFromNow(20), bom_sent_date: daysAgo(25), candidate_professional_ids: ['prof-paint-1', 'prof-paint-2'], estimated_budget: 140000, cost_item_id: 'cost-v-12', created_at: daysAgo(55), updated_at: daysAgo(25) },
  { id: 'tender-v-8', project_id: 'proj-villa', tender_name: 'מכרז איטום', tender_type: 'contractor', status: 'Draft', candidate_professional_ids: ['prof-seal-1', 'prof-seal-2'], estimated_budget: 110000, cost_item_id: 'cost-v-13', created_at: daysAgo(40), updated_at: daysAgo(40) },
  // Buildings — 7 WinnerSelected, 2 Open, 1 Draft
  { id: 'tender-b-1', project_id: 'proj-bldg', tender_name: 'מכרז שלד ראשי', tender_type: 'contractor', status: 'WinnerSelected', publish_date: daysAgo(350), due_date: daysAgo(330), bom_sent_date: daysAgo(350), winner_selected_date: daysAgo(320), candidate_professional_ids: ['prof-main-1', 'prof-main-2', 'prof-main-3'], winner_professional_id: 'prof-main-2', winner_professional_name: 'אחמד חסן', estimated_budget: 7500000, contract_amount: 7200000, cost_item_id: 'cost-b-8', created_at: daysAgo(350), updated_at: daysAgo(320) },
  { id: 'tender-b-2', project_id: 'proj-bldg', tender_name: 'מכרז חשמל', tender_type: 'electrician', status: 'WinnerSelected', publish_date: daysAgo(280), due_date: daysAgo(260), bom_sent_date: daysAgo(280), winner_selected_date: daysAgo(250), candidate_professional_ids: ['prof-elec-1', 'prof-elec-2', 'prof-elec-3'], winner_professional_id: 'prof-elec-2', winner_professional_name: 'סלים נאסר', estimated_budget: 1800000, contract_amount: 1750000, cost_item_id: 'cost-b-9', created_at: daysAgo(280), updated_at: daysAgo(250) },
  { id: 'tender-b-3', project_id: 'proj-bldg', tender_name: 'מכרז אינסטלציה', tender_type: 'plumber', status: 'WinnerSelected', publish_date: daysAgo(275), due_date: daysAgo(255), bom_sent_date: daysAgo(275), winner_selected_date: daysAgo(245), candidate_professional_ids: ['prof-plumb-1', 'prof-plumb-2', 'prof-plumb-3'], winner_professional_id: 'prof-plumb-2', winner_professional_name: 'עלי מוחמד', estimated_budget: 1500000, contract_amount: 1480000, cost_item_id: 'cost-b-10', created_at: daysAgo(275), updated_at: daysAgo(245) },
  { id: 'tender-b-4', project_id: 'proj-bldg', tender_name: 'מכרז ריצוף', tender_type: 'contractor', status: 'WinnerSelected', publish_date: daysAgo(210), due_date: daysAgo(190), bom_sent_date: daysAgo(210), winner_selected_date: daysAgo(180), candidate_professional_ids: ['prof-tile-1', 'prof-tile-2', 'prof-tile-3'], winner_professional_id: 'prof-tile-2', winner_professional_name: 'אלי בן-חיים', estimated_budget: 1200000, contract_amount: 1150000, cost_item_id: 'cost-b-11', created_at: daysAgo(210), updated_at: daysAgo(180) },
  { id: 'tender-b-5', project_id: 'proj-bldg', tender_name: 'מכרז אלומיניום', tender_type: 'contractor', status: 'WinnerSelected', publish_date: daysAgo(205), due_date: daysAgo(185), bom_sent_date: daysAgo(205), winner_selected_date: daysAgo(175), candidate_professional_ids: ['prof-alum-1', 'prof-alum-2', 'prof-alum-3'], winner_professional_id: 'prof-alum-2', winner_professional_name: 'ואליד חוסיין', estimated_budget: 1100000, contract_amount: 1060000, cost_item_id: 'cost-b-12', created_at: daysAgo(205), updated_at: daysAgo(175) },
  { id: 'tender-b-6', project_id: 'proj-bldg', tender_name: 'מכרז מעליות', tender_type: 'contractor', status: 'WinnerSelected', publish_date: daysAgo(230), due_date: daysAgo(210), bom_sent_date: daysAgo(230), winner_selected_date: daysAgo(200), candidate_professional_ids: ['prof-elev-1'], winner_professional_id: 'prof-elev-1', winner_professional_name: 'אורי גלעד', estimated_budget: 800000, contract_amount: 780000, cost_item_id: 'cost-b-13', created_at: daysAgo(230), updated_at: daysAgo(200) },
  { id: 'tender-b-7', project_id: 'proj-bldg', tender_name: 'מכרז יועץ קרקע', tender_type: 'engineer', status: 'WinnerSelected', publish_date: daysAgo(395), due_date: daysAgo(375), bom_sent_date: daysAgo(395), winner_selected_date: daysAgo(370), candidate_professional_ids: ['prof-soil-1'], winner_professional_id: 'prof-soil-1', winner_professional_name: 'ד"ר אורי נחמיאס', estimated_budget: 150000, contract_amount: 145000, cost_item_id: 'cost-b-5', created_at: daysAgo(395), updated_at: daysAgo(370) },
  { id: 'tender-b-8', project_id: 'proj-bldg', tender_name: 'מכרז גבס', tender_type: 'contractor', status: 'Open', publish_date: daysAgo(40), due_date: daysFromNow(20), bom_sent_date: daysAgo(40), candidate_professional_ids: ['prof-dry-1', 'prof-dry-2', 'prof-dry-3'], estimated_budget: 900000, cost_item_id: 'cost-b-14', created_at: daysAgo(80), updated_at: daysAgo(40) },
  { id: 'tender-b-9', project_id: 'proj-bldg', tender_name: 'מכרז צבע', tender_type: 'contractor', status: 'Open', publish_date: daysAgo(35), due_date: daysFromNow(25), bom_sent_date: daysAgo(35), candidate_professional_ids: ['prof-paint-1', 'prof-paint-2', 'prof-paint-3'], estimated_budget: 700000, cost_item_id: 'cost-b-15', created_at: daysAgo(75), updated_at: daysAgo(35) },
  { id: 'tender-b-10', project_id: 'proj-bldg', tender_name: 'מכרז ספק דלתות', tender_type: 'other', status: 'Draft', candidate_professional_ids: ['prof-doors-1'], estimated_budget: 150000, cost_item_id: 'cost-b-20', created_at: daysAgo(60), updated_at: daysAgo(60) },
];

// ============================================================
// TENDER PARTICIPANTS
// ============================================================

export const seedTenderParticipants: TenderParticipant[] = [
  // Villa tenders
  // tender-v-1 skeleton (WinnerSelected)
  { id: 'tp-v-1-1', tender_id: 'tender-v-1', professional_id: 'prof-main-1', total_amount: 1350000, is_winner: true, bom_sent_date: daysAgo(220), bom_sent_status: 'sent', created_at: daysAgo(220) },
  { id: 'tp-v-1-2', tender_id: 'tender-v-1', professional_id: 'prof-main-2', total_amount: 1420000, is_winner: false, bom_sent_date: daysAgo(220), bom_sent_status: 'sent', created_at: daysAgo(220) },
  { id: 'tp-v-1-3', tender_id: 'tender-v-1', professional_id: 'prof-main-3', total_amount: 1480000, is_winner: false, bom_sent_date: daysAgo(220), bom_sent_status: 'sent', created_at: daysAgo(220) },
  // tender-v-2 electrical (WinnerSelected)
  { id: 'tp-v-2-1', tender_id: 'tender-v-2', professional_id: 'prof-elec-1', total_amount: 310000, is_winner: true, bom_sent_date: daysAgo(180), bom_sent_status: 'sent', created_at: daysAgo(180) },
  { id: 'tp-v-2-2', tender_id: 'tender-v-2', professional_id: 'prof-elec-2', total_amount: 325000, is_winner: false, bom_sent_date: daysAgo(180), bom_sent_status: 'sent', created_at: daysAgo(180) },
  { id: 'tp-v-2-3', tender_id: 'tender-v-2', professional_id: 'prof-elec-3', total_amount: 345000, is_winner: false, bom_sent_date: daysAgo(180), bom_sent_status: 'sent', created_at: daysAgo(180) },
  // tender-v-3 plumbing (WinnerSelected)
  { id: 'tp-v-3-1', tender_id: 'tender-v-3', professional_id: 'prof-plumb-1', total_amount: 275000, is_winner: true, bom_sent_date: daysAgo(175), bom_sent_status: 'sent', created_at: daysAgo(175) },
  { id: 'tp-v-3-2', tender_id: 'tender-v-3', professional_id: 'prof-plumb-2', total_amount: 290000, is_winner: false, bom_sent_date: daysAgo(175), bom_sent_status: 'sent', created_at: daysAgo(175) },
  { id: 'tp-v-3-3', tender_id: 'tender-v-3', professional_id: 'prof-plumb-3', total_amount: 305000, is_winner: false, bom_sent_date: daysAgo(175), bom_sent_status: 'sent', created_at: daysAgo(175) },
  // tender-v-4 tiling (WinnerSelected)
  { id: 'tp-v-4-1', tender_id: 'tender-v-4', professional_id: 'prof-tile-1', total_amount: 242000, is_winner: true, bom_sent_date: daysAgo(120), bom_sent_status: 'sent', created_at: daysAgo(120) },
  { id: 'tp-v-4-2', tender_id: 'tender-v-4', professional_id: 'prof-tile-2', total_amount: 260000, is_winner: false, bom_sent_date: daysAgo(120), bom_sent_status: 'sent', created_at: daysAgo(120) },
  { id: 'tp-v-4-3', tender_id: 'tender-v-4', professional_id: 'prof-tile-3', total_amount: 275000, is_winner: false, bom_sent_date: daysAgo(120), bom_sent_status: 'sent', created_at: daysAgo(120) },
  // tender-v-5 aluminum (WinnerSelected)
  { id: 'tp-v-5-1', tender_id: 'tender-v-5', professional_id: 'prof-alum-1', total_amount: 215000, is_winner: true, bom_sent_date: daysAgo(115), bom_sent_status: 'sent', created_at: daysAgo(115) },
  { id: 'tp-v-5-2', tender_id: 'tender-v-5', professional_id: 'prof-alum-2', total_amount: 228000, is_winner: false, bom_sent_date: daysAgo(115), bom_sent_status: 'sent', created_at: daysAgo(115) },
  { id: 'tp-v-5-3', tender_id: 'tender-v-5', professional_id: 'prof-alum-3', total_amount: 240000, is_winner: false, bom_sent_date: daysAgo(115), bom_sent_status: 'sent', created_at: daysAgo(115) },
  // tender-v-6 drywall (Open)
  { id: 'tp-v-6-1', tender_id: 'tender-v-6', professional_id: 'prof-dry-1', total_amount: 175000, is_winner: false, bom_sent_date: daysAgo(30), bom_sent_status: 'sent', created_at: daysAgo(30) },
  { id: 'tp-v-6-2', tender_id: 'tender-v-6', professional_id: 'prof-dry-2', total_amount: 185000, is_winner: false, bom_sent_date: daysAgo(30), bom_sent_status: 'sent', created_at: daysAgo(30) },
  { id: 'tp-v-6-3', tender_id: 'tender-v-6', professional_id: 'prof-dry-3', total_amount: 195000, is_winner: false, bom_sent_date: daysAgo(30), bom_sent_status: 'sent', created_at: daysAgo(30) },
  // tender-v-7 painting (Open)
  { id: 'tp-v-7-1', tender_id: 'tender-v-7', professional_id: 'prof-paint-1', total_amount: 135000, is_winner: false, bom_sent_date: daysAgo(25), bom_sent_status: 'sent', created_at: daysAgo(25) },
  { id: 'tp-v-7-2', tender_id: 'tender-v-7', professional_id: 'prof-paint-2', total_amount: 148000, is_winner: false, bom_sent_date: daysAgo(25), bom_sent_status: 'sent', created_at: daysAgo(25) },
  // tender-v-8 waterproofing (Draft)
  { id: 'tp-v-8-1', tender_id: 'tender-v-8', professional_id: 'prof-seal-1', is_winner: false, bom_sent_status: 'not_sent', created_at: daysAgo(40) },
  { id: 'tp-v-8-2', tender_id: 'tender-v-8', professional_id: 'prof-seal-2', is_winner: false, bom_sent_status: 'not_sent', created_at: daysAgo(40) },
  // Buildings tenders
  // tender-b-1 skeleton (WinnerSelected)
  { id: 'tp-b-1-1', tender_id: 'tender-b-1', professional_id: 'prof-main-1', total_amount: 7500000, is_winner: false, bom_sent_date: daysAgo(350), bom_sent_status: 'sent', created_at: daysAgo(350) },
  { id: 'tp-b-1-2', tender_id: 'tender-b-1', professional_id: 'prof-main-2', total_amount: 7200000, is_winner: true, bom_sent_date: daysAgo(350), bom_sent_status: 'sent', created_at: daysAgo(350) },
  { id: 'tp-b-1-3', tender_id: 'tender-b-1', professional_id: 'prof-main-3', total_amount: 7800000, is_winner: false, bom_sent_date: daysAgo(350), bom_sent_status: 'sent', created_at: daysAgo(350) },
  // tender-b-2 electrical (WinnerSelected)
  { id: 'tp-b-2-1', tender_id: 'tender-b-2', professional_id: 'prof-elec-1', total_amount: 1820000, is_winner: false, bom_sent_date: daysAgo(280), bom_sent_status: 'sent', created_at: daysAgo(280) },
  { id: 'tp-b-2-2', tender_id: 'tender-b-2', professional_id: 'prof-elec-2', total_amount: 1750000, is_winner: true, bom_sent_date: daysAgo(280), bom_sent_status: 'sent', created_at: daysAgo(280) },
  { id: 'tp-b-2-3', tender_id: 'tender-b-2', professional_id: 'prof-elec-3', total_amount: 1900000, is_winner: false, bom_sent_date: daysAgo(280), bom_sent_status: 'sent', created_at: daysAgo(280) },
  // tender-b-3 plumbing (WinnerSelected)
  { id: 'tp-b-3-1', tender_id: 'tender-b-3', professional_id: 'prof-plumb-1', total_amount: 1520000, is_winner: false, bom_sent_date: daysAgo(275), bom_sent_status: 'sent', created_at: daysAgo(275) },
  { id: 'tp-b-3-2', tender_id: 'tender-b-3', professional_id: 'prof-plumb-2', total_amount: 1480000, is_winner: true, bom_sent_date: daysAgo(275), bom_sent_status: 'sent', created_at: daysAgo(275) },
  { id: 'tp-b-3-3', tender_id: 'tender-b-3', professional_id: 'prof-plumb-3', total_amount: 1550000, is_winner: false, bom_sent_date: daysAgo(275), bom_sent_status: 'sent', created_at: daysAgo(275) },
  // tender-b-4 tiling (WinnerSelected)
  { id: 'tp-b-4-1', tender_id: 'tender-b-4', professional_id: 'prof-tile-1', total_amount: 1220000, is_winner: false, bom_sent_date: daysAgo(210), bom_sent_status: 'sent', created_at: daysAgo(210) },
  { id: 'tp-b-4-2', tender_id: 'tender-b-4', professional_id: 'prof-tile-2', total_amount: 1150000, is_winner: true, bom_sent_date: daysAgo(210), bom_sent_status: 'sent', created_at: daysAgo(210) },
  { id: 'tp-b-4-3', tender_id: 'tender-b-4', professional_id: 'prof-tile-3', total_amount: 1280000, is_winner: false, bom_sent_date: daysAgo(210), bom_sent_status: 'sent', created_at: daysAgo(210) },
  // tender-b-5 aluminum (WinnerSelected)
  { id: 'tp-b-5-1', tender_id: 'tender-b-5', professional_id: 'prof-alum-1', total_amount: 1120000, is_winner: false, bom_sent_date: daysAgo(205), bom_sent_status: 'sent', created_at: daysAgo(205) },
  { id: 'tp-b-5-2', tender_id: 'tender-b-5', professional_id: 'prof-alum-2', total_amount: 1060000, is_winner: true, bom_sent_date: daysAgo(205), bom_sent_status: 'sent', created_at: daysAgo(205) },
  { id: 'tp-b-5-3', tender_id: 'tender-b-5', professional_id: 'prof-alum-3', total_amount: 1180000, is_winner: false, bom_sent_date: daysAgo(205), bom_sent_status: 'sent', created_at: daysAgo(205) },
  // tender-b-6 elevator (WinnerSelected)
  { id: 'tp-b-6-1', tender_id: 'tender-b-6', professional_id: 'prof-elev-1', total_amount: 780000, is_winner: true, bom_sent_date: daysAgo(230), bom_sent_status: 'sent', created_at: daysAgo(230) },
  // tender-b-7 soil (WinnerSelected)
  { id: 'tp-b-7-1', tender_id: 'tender-b-7', professional_id: 'prof-soil-1', total_amount: 145000, is_winner: true, bom_sent_date: daysAgo(395), bom_sent_status: 'sent', created_at: daysAgo(395) },
  // tender-b-8 drywall (Open)
  { id: 'tp-b-8-1', tender_id: 'tender-b-8', professional_id: 'prof-dry-1', total_amount: 880000, is_winner: false, bom_sent_date: daysAgo(40), bom_sent_status: 'sent', created_at: daysAgo(40) },
  { id: 'tp-b-8-2', tender_id: 'tender-b-8', professional_id: 'prof-dry-2', total_amount: 920000, is_winner: false, bom_sent_date: daysAgo(40), bom_sent_status: 'sent', created_at: daysAgo(40) },
  { id: 'tp-b-8-3', tender_id: 'tender-b-8', professional_id: 'prof-dry-3', total_amount: 950000, is_winner: false, bom_sent_date: daysAgo(40), bom_sent_status: 'sent', created_at: daysAgo(40) },
  // tender-b-9 painting (Open)
  { id: 'tp-b-9-1', tender_id: 'tender-b-9', professional_id: 'prof-paint-1', total_amount: 680000, is_winner: false, bom_sent_date: daysAgo(35), bom_sent_status: 'sent', created_at: daysAgo(35) },
  { id: 'tp-b-9-2', tender_id: 'tender-b-9', professional_id: 'prof-paint-2', total_amount: 710000, is_winner: false, bom_sent_date: daysAgo(35), bom_sent_status: 'sent', created_at: daysAgo(35) },
  { id: 'tp-b-9-3', tender_id: 'tender-b-9', professional_id: 'prof-paint-3', total_amount: 740000, is_winner: false, bom_sent_date: daysAgo(35), bom_sent_status: 'sent', created_at: daysAgo(35) },
  // tender-b-10 doors (Draft)
  { id: 'tp-b-10-1', tender_id: 'tender-b-10', professional_id: 'prof-doors-1', is_winner: false, bom_sent_status: 'not_sent', created_at: daysAgo(60) },
];

// ============================================================
// BUDGETS
// ============================================================

export const seedBudgets: Budget[] = [
  { id: 'budget-v', project_id: 'proj-villa', planned_budget: 4000000, actual_budget: 2392000, status: 'On Track', created_at: daysAgo(300), updated_at: daysAgo(30) },
  { id: 'budget-b', project_id: 'proj-bldg', planned_budget: 20000000, actual_budget: 13565000, status: 'On Track', created_at: daysAgo(400), updated_at: daysAgo(30) },
];

// ============================================================
// BUDGET CATEGORIES
// ============================================================

export const seedBudgetCategories: BudgetCategory[] = [
  { id: 'cat-v-1', project_id: 'proj-villa', name: 'יועצים', type: 'consultants', icon: 'School', color: 'blue', order: 1, created_at: daysAgo(300), updated_at: daysAgo(300) },
  { id: 'cat-v-2', project_id: 'proj-villa', name: 'קבלנים', type: 'contractors', icon: 'Engineering', color: 'orange', order: 2, created_at: daysAgo(300), updated_at: daysAgo(300) },
  { id: 'cat-v-3', project_id: 'proj-villa', name: 'ספקים', type: 'suppliers', icon: 'LocalShipping', color: 'green', order: 3, created_at: daysAgo(300), updated_at: daysAgo(300) },
  { id: 'cat-b-1', project_id: 'proj-bldg', name: 'יועצים', type: 'consultants', icon: 'School', color: 'blue', order: 1, created_at: daysAgo(400), updated_at: daysAgo(400) },
  { id: 'cat-b-2', project_id: 'proj-bldg', name: 'קבלנים', type: 'contractors', icon: 'Engineering', color: 'orange', order: 2, created_at: daysAgo(400), updated_at: daysAgo(400) },
  { id: 'cat-b-3', project_id: 'proj-bldg', name: 'ספקים', type: 'suppliers', icon: 'LocalShipping', color: 'green', order: 3, created_at: daysAgo(400), updated_at: daysAgo(400) },
];

// ============================================================
// BUDGET CHAPTERS
// ============================================================

export const seedBudgetChapters: BudgetChapter[] = [
  // Villa
  { id: 'ch-v-1', project_id: 'proj-villa', category_id: 'cat-v-1', code: '01', name: 'אדריכלות', budget_amount: 360000, order: 1, created_at: daysAgo(300), updated_at: daysAgo(300) },
  { id: 'ch-v-2', project_id: 'proj-villa', category_id: 'cat-v-1', code: '02', name: 'הנדסה ויועצים', budget_amount: 200000, order: 2, created_at: daysAgo(300), updated_at: daysAgo(300) },
  { id: 'ch-v-3', project_id: 'proj-villa', category_id: 'cat-v-2', code: '03', name: 'עבודות שלד ומבנה', budget_amount: 1510000, contract_amount: 1350000, order: 3, created_at: daysAgo(300), updated_at: daysAgo(200) },
  { id: 'ch-v-4', project_id: 'proj-villa', category_id: 'cat-v-2', code: '04', name: 'מערכות חשמל ואינסטלציה', budget_amount: 600000, contract_amount: 585000, order: 4, created_at: daysAgo(300), updated_at: daysAgo(155) },
  { id: 'ch-v-5', project_id: 'proj-villa', category_id: 'cat-v-2', code: '05', name: 'גמרים', budget_amount: 870000, contract_amount: 457000, order: 5, created_at: daysAgo(300), updated_at: daysAgo(95) },
  { id: 'ch-v-6', project_id: 'proj-villa', category_id: 'cat-v-3', code: '06', name: 'ספקים', budget_amount: 460000, order: 6, created_at: daysAgo(300), updated_at: daysAgo(300) },
  // Buildings
  { id: 'ch-b-1', project_id: 'proj-bldg', category_id: 'cat-b-1', code: '01', name: 'אדריכלות', budget_amount: 1150000, order: 1, created_at: daysAgo(400), updated_at: daysAgo(400) },
  { id: 'ch-b-2', project_id: 'proj-bldg', category_id: 'cat-b-1', code: '02', name: 'הנדסה', budget_amount: 700000, order: 2, created_at: daysAgo(400), updated_at: daysAgo(400) },
  { id: 'ch-b-3', project_id: 'proj-bldg', category_id: 'cat-b-1', code: '03', name: 'יועצים', budget_amount: 350000, contract_amount: 145000, order: 3, created_at: daysAgo(400), updated_at: daysAgo(370) },
  { id: 'ch-b-4', project_id: 'proj-bldg', category_id: 'cat-b-2', code: '04', name: 'עבודות שלד', budget_amount: 7500000, contract_amount: 7200000, order: 4, created_at: daysAgo(400), updated_at: daysAgo(320) },
  { id: 'ch-b-5', project_id: 'proj-bldg', category_id: 'cat-b-2', code: '05', name: 'מערכות', budget_amount: 3300000, contract_amount: 3230000, order: 5, created_at: daysAgo(400), updated_at: daysAgo(245) },
  { id: 'ch-b-6', project_id: 'proj-bldg', category_id: 'cat-b-2', code: '06', name: 'חיפויים וגמרים', budget_amount: 3900000, contract_amount: 2210000, order: 6, created_at: daysAgo(400), updated_at: daysAgo(175) },
  { id: 'ch-b-7', project_id: 'proj-bldg', category_id: 'cat-b-2', code: '07', name: 'עבודות מיוחדות', budget_amount: 1350000, contract_amount: 780000, order: 7, created_at: daysAgo(400), updated_at: daysAgo(200) },
  { id: 'ch-b-8', project_id: 'proj-bldg', category_id: 'cat-b-3', code: '08', name: 'ספקים', budget_amount: 1750000, order: 8, created_at: daysAgo(400), updated_at: daysAgo(400) },
];

// ============================================================
// BUDGET ITEMS
// ============================================================

export const seedBudgetItems: BudgetItem[] = [
  // Villa (8 items)
  { id: 'bi-v-1', project_id: 'proj-villa', chapter_id: 'ch-v-3', code: '3.1', description: 'עבודות שלד בטון', unit: 'קומפלט', quantity: 1, unit_price: 800000, total_price: 800000, vat_rate: 0.17, vat_amount: 136000, total_with_vat: 936000, status: 'contracted', supplier_id: 'prof-main-1', supplier_name: 'משה דוד', tender_id: 'tender-v-1', paid_amount: 800000, order: 1, created_at: daysAgo(200), updated_at: daysAgo(60) },
  { id: 'bi-v-2', project_id: 'proj-villa', chapter_id: 'ch-v-3', code: '3.2', description: 'עבודות טפסנות', unit: 'קומפלט', quantity: 1, unit_price: 550000, total_price: 550000, vat_rate: 0.17, vat_amount: 93500, total_with_vat: 643500, status: 'contracted', supplier_id: 'prof-main-1', supplier_name: 'משה דוד', tender_id: 'tender-v-1', paid_amount: 550000, order: 2, created_at: daysAgo(200), updated_at: daysAgo(60) },
  { id: 'bi-v-3', project_id: 'proj-villa', chapter_id: 'ch-v-4', code: '4.1', description: 'חשמל כללי', unit: 'קומפלט', quantity: 1, unit_price: 310000, total_price: 310000, vat_rate: 0.17, vat_amount: 52700, total_with_vat: 362700, status: 'in-progress', supplier_id: 'prof-elec-1', supplier_name: 'רוני זוהר', tender_id: 'tender-v-2', paid_amount: 200000, order: 3, created_at: daysAgo(160), updated_at: daysAgo(30) },
  { id: 'bi-v-4', project_id: 'proj-villa', chapter_id: 'ch-v-4', code: '4.2', description: 'אינסטלציה כללי', unit: 'קומפלט', quantity: 1, unit_price: 275000, total_price: 275000, vat_rate: 0.17, vat_amount: 46750, total_with_vat: 321750, status: 'in-progress', supplier_id: 'prof-plumb-1', supplier_name: 'דני כהן', tender_id: 'tender-v-3', paid_amount: 80000, order: 4, created_at: daysAgo(155), updated_at: daysAgo(30) },
  { id: 'bi-v-5', project_id: 'proj-villa', chapter_id: 'ch-v-5', code: '5.1', description: 'ריצוף אריחים', unit: 'מ"ר', quantity: 350, unit_price: 691, total_price: 242000, vat_rate: 0.17, vat_amount: 41140, total_with_vat: 283140, status: 'tender', supplier_id: 'prof-tile-1', supplier_name: 'חסן אבו-ריש', tender_id: 'tender-v-4', paid_amount: 0, order: 5, created_at: daysAgo(100), updated_at: daysAgo(100) },
  { id: 'bi-v-6', project_id: 'proj-villa', chapter_id: 'ch-v-5', code: '5.2', description: 'אלומיניום חלונות ודלתות', unit: 'קומפלט', quantity: 1, unit_price: 215000, total_price: 215000, vat_rate: 0.17, vat_amount: 36550, total_with_vat: 251550, status: 'tender', supplier_id: 'prof-alum-1', supplier_name: 'מוטי שגב', tender_id: 'tender-v-5', paid_amount: 0, order: 6, created_at: daysAgo(95), updated_at: daysAgo(95) },
  { id: 'bi-v-7', project_id: 'proj-villa', chapter_id: 'ch-v-6', code: '6.1', description: 'מטבח', unit: 'קומפלט', quantity: 1, unit_price: 180000, total_price: 180000, vat_rate: 0.17, vat_amount: 30600, total_with_vat: 210600, status: 'pending', paid_amount: 0, order: 7, created_at: daysAgo(300), updated_at: daysAgo(300) },
  { id: 'bi-v-8', project_id: 'proj-villa', chapter_id: 'ch-v-6', code: '6.2', description: 'חומרי בניין', unit: 'קומפלט', quantity: 1, unit_price: 200000, total_price: 200000, vat_rate: 0.17, vat_amount: 34000, total_with_vat: 234000, status: 'pending', paid_amount: 0, order: 8, created_at: daysAgo(300), updated_at: daysAgo(300) },
  // Buildings (12 items)
  { id: 'bi-b-1', project_id: 'proj-bldg', chapter_id: 'ch-b-4', code: '4.1', description: 'שלד בניינים 1-2', unit: 'קומפלט', quantity: 1, unit_price: 3600000, total_price: 3600000, vat_rate: 0.17, vat_amount: 612000, total_with_vat: 4212000, status: 'completed', supplier_id: 'prof-main-2', supplier_name: 'אחמד חסן', tender_id: 'tender-b-1', paid_amount: 3600000, order: 1, created_at: daysAgo(320), updated_at: daysAgo(120) },
  { id: 'bi-b-2', project_id: 'proj-bldg', chapter_id: 'ch-b-4', code: '4.2', description: 'שלד בניינים 3-4', unit: 'קומפלט', quantity: 1, unit_price: 3600000, total_price: 3600000, vat_rate: 0.17, vat_amount: 612000, total_with_vat: 4212000, status: 'in-progress', supplier_id: 'prof-main-2', supplier_name: 'אחמד חסן', tender_id: 'tender-b-1', paid_amount: 2000000, order: 2, created_at: daysAgo(320), updated_at: daysAgo(30) },
  { id: 'bi-b-3', project_id: 'proj-bldg', chapter_id: 'ch-b-5', code: '5.1', description: 'חשמל בניינים 1-2', unit: 'קומפלט', quantity: 1, unit_price: 900000, total_price: 900000, vat_rate: 0.17, vat_amount: 153000, total_with_vat: 1053000, status: 'in-progress', supplier_id: 'prof-elec-2', supplier_name: 'סלים נאסר', tender_id: 'tender-b-2', paid_amount: 600000, order: 3, created_at: daysAgo(250), updated_at: daysAgo(30) },
  { id: 'bi-b-4', project_id: 'proj-bldg', chapter_id: 'ch-b-5', code: '5.2', description: 'חשמל בניינים 3-4', unit: 'קומפלט', quantity: 1, unit_price: 850000, total_price: 850000, vat_rate: 0.17, vat_amount: 144500, total_with_vat: 994500, status: 'tender', supplier_id: 'prof-elec-2', supplier_name: 'סלים נאסר', tender_id: 'tender-b-2', paid_amount: 0, order: 4, created_at: daysAgo(250), updated_at: daysAgo(250) },
  { id: 'bi-b-5', project_id: 'proj-bldg', chapter_id: 'ch-b-5', code: '5.3', description: 'אינסטלציה כללי', unit: 'קומפלט', quantity: 1, unit_price: 1480000, total_price: 1480000, vat_rate: 0.17, vat_amount: 251600, total_with_vat: 1731600, status: 'in-progress', supplier_id: 'prof-plumb-2', supplier_name: 'עלי מוחמד', tender_id: 'tender-b-3', paid_amount: 500000, order: 5, created_at: daysAgo(245), updated_at: daysAgo(30) },
  { id: 'bi-b-6', project_id: 'proj-bldg', chapter_id: 'ch-b-6', code: '6.1', description: 'ריצוף בניינים 1-2', unit: 'מ"ר', quantity: 2400, unit_price: 250, total_price: 600000, vat_rate: 0.17, vat_amount: 102000, total_with_vat: 702000, status: 'in-progress', supplier_id: 'prof-tile-2', supplier_name: 'אלי בן-חיים', tender_id: 'tender-b-4', paid_amount: 200000, order: 6, created_at: daysAgo(180), updated_at: daysAgo(30) },
  { id: 'bi-b-7', project_id: 'proj-bldg', chapter_id: 'ch-b-6', code: '6.2', description: 'ריצוף בניינים 3-4', unit: 'מ"ר', quantity: 2400, unit_price: 229, total_price: 550000, vat_rate: 0.17, vat_amount: 93500, total_with_vat: 643500, status: 'pending', supplier_id: 'prof-tile-2', supplier_name: 'אלי בן-חיים', tender_id: 'tender-b-4', paid_amount: 0, order: 7, created_at: daysAgo(180), updated_at: daysAgo(180) },
  { id: 'bi-b-8', project_id: 'proj-bldg', chapter_id: 'ch-b-6', code: '6.3', description: 'אלומיניום', unit: 'קומפלט', quantity: 1, unit_price: 1060000, total_price: 1060000, vat_rate: 0.17, vat_amount: 180200, total_with_vat: 1240200, status: 'tender', supplier_id: 'prof-alum-2', supplier_name: 'ואליד חוסיין', tender_id: 'tender-b-5', paid_amount: 0, order: 8, created_at: daysAgo(175), updated_at: daysAgo(175) },
  { id: 'bi-b-9', project_id: 'proj-bldg', chapter_id: 'ch-b-7', code: '7.1', description: 'מעליות', unit: 'יחידות', quantity: 4, unit_price: 195000, total_price: 780000, vat_rate: 0.17, vat_amount: 132600, total_with_vat: 912600, status: 'in-progress', supplier_id: 'prof-elev-1', supplier_name: 'אורי גלעד', tender_id: 'tender-b-6', paid_amount: 200000, order: 9, created_at: daysAgo(200), updated_at: daysAgo(30) },
  { id: 'bi-b-10', project_id: 'proj-bldg', chapter_id: 'ch-b-7', code: '7.2', description: 'איטום', unit: 'קומפלט', quantity: 1, unit_price: 550000, total_price: 550000, vat_rate: 0.17, vat_amount: 93500, total_with_vat: 643500, status: 'pending', paid_amount: 0, order: 10, created_at: daysAgo(400), updated_at: daysAgo(400) },
  { id: 'bi-b-11', project_id: 'proj-bldg', chapter_id: 'ch-b-8', code: '8.1', description: 'חומרי בניין', unit: 'קומפלט', quantity: 1, unit_price: 1000000, total_price: 1000000, vat_rate: 0.17, vat_amount: 170000, total_with_vat: 1170000, status: 'pending', paid_amount: 0, order: 11, created_at: daysAgo(400), updated_at: daysAgo(400) },
  { id: 'bi-b-12', project_id: 'proj-bldg', chapter_id: 'ch-b-8', code: '8.2', description: 'מטבחים', unit: 'יחידות', quantity: 80, unit_price: 5000, total_price: 400000, vat_rate: 0.17, vat_amount: 68000, total_with_vat: 468000, status: 'pending', paid_amount: 0, order: 12, created_at: daysAgo(400), updated_at: daysAgo(400) },
];

// ============================================================
// BUDGET PAYMENTS
// ============================================================

export const seedBudgetPayments: BudgetPayment[] = [
  // Villa (6)
  { id: 'bp-v-1', budget_item_id: 'bi-v-1', invoice_number: 'חשבון חלקי 1 - שלד', invoice_date: daysAgo(140), amount: 400000, vat_amount: 68000, total_amount: 468000, status: 'paid', payment_date: daysAgo(130), created_at: daysAgo(140), updated_at: daysAgo(130) },
  { id: 'bp-v-2', budget_item_id: 'bi-v-1', invoice_number: 'חשבון חלקי 2 - שלד', invoice_date: daysAgo(80), amount: 400000, vat_amount: 68000, total_amount: 468000, status: 'paid', payment_date: daysAgo(70), created_at: daysAgo(80), updated_at: daysAgo(70) },
  { id: 'bp-v-3', budget_item_id: 'bi-v-3', invoice_number: 'חשבון חלקי 1 - חשמל', invoice_date: daysAgo(60), amount: 100000, vat_amount: 17000, total_amount: 117000, status: 'paid', payment_date: daysAgo(50), created_at: daysAgo(60), updated_at: daysAgo(50) },
  { id: 'bp-v-4', budget_item_id: 'bi-v-3', invoice_number: 'חשבון חלקי 2 - חשמל', invoice_date: daysAgo(20), amount: 100000, vat_amount: 17000, total_amount: 117000, status: 'approved', created_at: daysAgo(20), updated_at: daysAgo(10) },
  { id: 'bp-v-5', budget_item_id: 'bi-v-4', invoice_number: 'חשבון חלקי 1 - אינסטלציה', invoice_date: daysAgo(45), amount: 80000, vat_amount: 13600, total_amount: 93600, status: 'paid', payment_date: daysAgo(35), created_at: daysAgo(45), updated_at: daysAgo(35) },
  { id: 'bp-v-6', budget_item_id: 'bi-v-5', invoice_number: 'מקדמה - ריצוף', invoice_date: daysAgo(10), amount: 50000, vat_amount: 8500, total_amount: 58500, status: 'pending', created_at: daysAgo(10), updated_at: daysAgo(10) },
  // Buildings (10)
  { id: 'bp-b-1', budget_item_id: 'bi-b-1', invoice_number: 'חשבון 1 - שלד 1-2', invoice_date: daysAgo(280), amount: 1200000, vat_amount: 204000, total_amount: 1404000, status: 'paid', payment_date: daysAgo(270), created_at: daysAgo(280), updated_at: daysAgo(270) },
  { id: 'bp-b-2', budget_item_id: 'bi-b-1', invoice_number: 'חשבון 2 - שלד 1-2', invoice_date: daysAgo(220), amount: 1200000, vat_amount: 204000, total_amount: 1404000, status: 'paid', payment_date: daysAgo(210), created_at: daysAgo(220), updated_at: daysAgo(210) },
  { id: 'bp-b-3', budget_item_id: 'bi-b-1', invoice_number: 'חשבון 3 - שלד 1-2', invoice_date: daysAgo(150), amount: 1200000, vat_amount: 204000, total_amount: 1404000, status: 'paid', payment_date: daysAgo(140), created_at: daysAgo(150), updated_at: daysAgo(140) },
  { id: 'bp-b-4', budget_item_id: 'bi-b-2', invoice_number: 'חשבון 1 - שלד 3-4', invoice_date: daysAgo(100), amount: 1000000, vat_amount: 170000, total_amount: 1170000, status: 'paid', payment_date: daysAgo(90), created_at: daysAgo(100), updated_at: daysAgo(90) },
  { id: 'bp-b-5', budget_item_id: 'bi-b-2', invoice_number: 'חשבון 2 - שלד 3-4', invoice_date: daysAgo(40), amount: 1000000, vat_amount: 170000, total_amount: 1170000, status: 'approved', created_at: daysAgo(40), updated_at: daysAgo(20) },
  { id: 'bp-b-6', budget_item_id: 'bi-b-3', invoice_number: 'חשבון 1 - חשמל', invoice_date: daysAgo(120), amount: 300000, vat_amount: 51000, total_amount: 351000, status: 'paid', payment_date: daysAgo(110), created_at: daysAgo(120), updated_at: daysAgo(110) },
  { id: 'bp-b-7', budget_item_id: 'bi-b-3', invoice_number: 'חשבון 2 - חשמל', invoice_date: daysAgo(50), amount: 300000, vat_amount: 51000, total_amount: 351000, status: 'approved', created_at: daysAgo(50), updated_at: daysAgo(30) },
  { id: 'bp-b-8', budget_item_id: 'bi-b-5', invoice_number: 'חשבון 1 - אינסטלציה', invoice_date: daysAgo(100), amount: 500000, vat_amount: 85000, total_amount: 585000, status: 'paid', payment_date: daysAgo(90), created_at: daysAgo(100), updated_at: daysAgo(90) },
  { id: 'bp-b-9', budget_item_id: 'bi-b-6', invoice_number: 'חשבון 1 - ריצוף', invoice_date: daysAgo(60), amount: 200000, vat_amount: 34000, total_amount: 234000, status: 'paid', payment_date: daysAgo(50), created_at: daysAgo(60), updated_at: daysAgo(50) },
  { id: 'bp-b-10', budget_item_id: 'bi-b-9', invoice_number: 'מקדמה - מעלית', invoice_date: daysAgo(30), amount: 200000, vat_amount: 34000, total_amount: 234000, status: 'pending', created_at: daysAgo(30), updated_at: daysAgo(30) },
];

// ============================================================
// PROJECT UNITS
// ============================================================

export const seedProjectUnits: ProjectUnit[] = [
  // Villa
  { id: 'unit-v-1', project_id: 'proj-villa', name: 'קומה א + מרתף', type: 'apartment', color: 'blue', icon: 'Home', order: 1, created_at: daysAgo(300), updated_at: daysAgo(300) },
  { id: 'unit-v-2', project_id: 'proj-villa', name: 'קומה ב + גג + חצר', type: 'apartment', color: 'green', icon: 'Roofing', order: 2, created_at: daysAgo(300), updated_at: daysAgo(300) },
  // Buildings
  { id: 'unit-b-1', project_id: 'proj-bldg', name: 'בניין 1', type: 'building', color: 'blue', icon: 'Apartment', order: 1, created_at: daysAgo(400), updated_at: daysAgo(400) },
  { id: 'unit-b-2', project_id: 'proj-bldg', name: 'בניין 2', type: 'building', color: 'green', icon: 'Apartment', order: 2, created_at: daysAgo(400), updated_at: daysAgo(400) },
  { id: 'unit-b-3', project_id: 'proj-bldg', name: 'בניין 3', type: 'building', color: 'purple', icon: 'Apartment', order: 3, created_at: daysAgo(400), updated_at: daysAgo(400) },
  { id: 'unit-b-4', project_id: 'proj-bldg', name: 'בניין 4', type: 'building', color: 'amber', icon: 'Apartment', order: 4, created_at: daysAgo(400), updated_at: daysAgo(400) },
  { id: 'unit-b-5', project_id: 'proj-bldg', name: 'חניון', type: 'common', color: 'blue', icon: 'LocalParking', order: 5, created_at: daysAgo(400), updated_at: daysAgo(400) },
  { id: 'unit-b-6', project_id: 'proj-bldg', name: 'שטחים משותפים', type: 'common', color: 'green', icon: 'Park', order: 6, created_at: daysAgo(400), updated_at: daysAgo(400) },
];

// ============================================================
// PROJECT MILESTONES
// ============================================================

export const seedProjectMilestones: ProjectMilestone[] = [
  // Villa (6)
  { id: 'ms-v-1', project_id: 'proj-villa', unit_id: 'unit-v-1', name: 'יציקת יסודות', date: daysAgo(150), status: 'completed', phase: 'שלד', order: 1, created_at: daysAgo(300), updated_at: daysAgo(150) },
  { id: 'ms-v-2', project_id: 'proj-villa', unit_id: 'unit-v-1', name: 'סיום שלד', date: daysAgo(60), status: 'completed', phase: 'שלד', order: 2, created_at: daysAgo(300), updated_at: daysAgo(60) },
  { id: 'ms-v-3', project_id: 'proj-villa', unit_id: 'unit-v-1', name: 'עבודות חשמל ואינסטלציה', date: daysAgo(20), status: 'in-progress', phase: 'חשמל', order: 3, created_at: daysAgo(300), updated_at: daysAgo(20) },
  { id: 'ms-v-4', project_id: 'proj-villa', unit_id: 'unit-v-2', name: 'ריצוף וחיפוי', date: daysFromNow(30), status: 'in-progress', phase: 'ריצוף', order: 4, created_at: daysAgo(300), updated_at: daysAgo(10) },
  { id: 'ms-v-5', project_id: 'proj-villa', unit_id: 'unit-v-2', name: 'גמרים', date: daysFromNow(120), status: 'pending', phase: 'גמר', order: 5, created_at: daysAgo(300), updated_at: daysAgo(300) },
  { id: 'ms-v-6', project_id: 'proj-villa', unit_id: 'unit-v-2', name: 'מסירה', date: daysFromNow(240), status: 'pending', phase: 'גמר', order: 6, created_at: daysAgo(300), updated_at: daysAgo(300) },
  // Buildings (8)
  { id: 'ms-b-1', project_id: 'proj-bldg', unit_id: 'unit-b-1', name: 'חפירה ויסודות', date: daysAgo(250), status: 'completed', phase: 'שלד', order: 1, created_at: daysAgo(400), updated_at: daysAgo(250) },
  { id: 'ms-b-2', project_id: 'proj-bldg', unit_id: 'unit-b-1', name: 'שלד בניינים 1-2', date: daysAgo(120), status: 'completed', phase: 'שלד', order: 2, created_at: daysAgo(400), updated_at: daysAgo(120) },
  { id: 'ms-b-3', project_id: 'proj-bldg', unit_id: 'unit-b-5', name: 'תשתיות חשמל ומים', date: daysAgo(90), status: 'completed', phase: 'חשמל', order: 3, created_at: daysAgo(400), updated_at: daysAgo(90) },
  { id: 'ms-b-4', project_id: 'proj-bldg', unit_id: 'unit-b-3', name: 'שלד בניינים 3-4', date: daysAgo(30), status: 'in-progress', phase: 'שלד', order: 4, created_at: daysAgo(400), updated_at: daysAgo(30) },
  { id: 'ms-b-5', project_id: 'proj-bldg', unit_id: 'unit-b-1', name: 'טיח וריצוף בניינים 1-2', date: daysFromNow(30), status: 'in-progress', phase: 'ריצוף', order: 5, created_at: daysAgo(400), updated_at: daysAgo(10) },
  { id: 'ms-b-6', project_id: 'proj-bldg', unit_id: 'unit-b-1', name: 'מעליות', date: daysFromNow(60), status: 'in-progress', phase: 'מעלית', order: 6, created_at: daysAgo(400), updated_at: daysAgo(10) },
  { id: 'ms-b-7', project_id: 'proj-bldg', unit_id: 'unit-b-1', name: 'גמרים', date: daysFromNow(180), status: 'pending', phase: 'גמר', order: 7, created_at: daysAgo(400), updated_at: daysAgo(400) },
  { id: 'ms-b-8', project_id: 'proj-bldg', unit_id: 'unit-b-1', name: 'מסירה לדיירים', date: daysFromNow(360), status: 'pending', phase: 'גמר', order: 8, created_at: daysAgo(400), updated_at: daysAgo(400) },
];

// ============================================================
// GANTT TASKS
// ============================================================

export const seedGanttTasks: GanttTask[] = [
  // Villa (4)
  { id: 'gantt-v-1', project_id: 'proj-villa', milestone_id: 'ms-v-1', name: 'טפסנות וזיון יסודות', start_date: daysAgo(180), end_date: daysAgo(155), duration: '25 ימים', status: 'completed', priority: 'high', progress: 100, assigned_to_id: 'prof-main-1', resource_name: 'משה דוד', type: 'other', order: 1, created_at: daysAgo(300), updated_at: daysAgo(155) },
  { id: 'gantt-v-2', project_id: 'proj-villa', milestone_id: 'ms-v-2', name: 'יציקת שלד', start_date: daysAgo(150), end_date: daysAgo(65), duration: '85 ימים', status: 'completed', priority: 'high', progress: 100, assigned_to_id: 'prof-main-1', resource_name: 'משה דוד', type: 'other', predecessors: ['gantt-v-1'], order: 2, created_at: daysAgo(300), updated_at: daysAgo(65) },
  { id: 'gantt-v-3', project_id: 'proj-villa', milestone_id: 'ms-v-3', name: 'חיווט חשמל', start_date: daysAgo(55), end_date: daysFromNow(10), duration: '65 ימים', status: 'in-progress', priority: 'high', progress: 60, assigned_to_id: 'prof-elec-1', resource_name: 'רוני זוהר', type: 'חשמל', predecessors: ['gantt-v-2'], order: 3, created_at: daysAgo(300), updated_at: daysAgo(5) },
  { id: 'gantt-v-4', project_id: 'proj-villa', milestone_id: 'ms-v-3', name: 'צנרת אינסטלציה', start_date: daysAgo(50), end_date: daysFromNow(15), duration: '65 ימים', status: 'in-progress', priority: 'high', progress: 55, assigned_to_id: 'prof-plumb-1', resource_name: 'דני כהן', type: 'אינסטלציה', predecessors: ['gantt-v-2'], order: 4, created_at: daysAgo(300), updated_at: daysAgo(5) },
  // Buildings (6)
  { id: 'gantt-b-1', project_id: 'proj-bldg', milestone_id: 'ms-b-1', name: 'חפירת יסודות', start_date: daysAgo(340), end_date: daysAgo(260), duration: '80 ימים', status: 'completed', priority: 'high', progress: 100, assigned_to_id: 'prof-main-2', resource_name: 'אחמד חסן', type: 'other', order: 1, created_at: daysAgo(400), updated_at: daysAgo(260) },
  { id: 'gantt-b-2', project_id: 'proj-bldg', milestone_id: 'ms-b-2', name: 'שלד בניין 1', start_date: daysAgo(250), end_date: daysAgo(150), duration: '100 ימים', status: 'completed', priority: 'high', progress: 100, assigned_to_id: 'prof-main-2', resource_name: 'אחמד חסן', type: 'other', predecessors: ['gantt-b-1'], order: 2, created_at: daysAgo(400), updated_at: daysAgo(150) },
  { id: 'gantt-b-3', project_id: 'proj-bldg', milestone_id: 'ms-b-2', name: 'שלד בניין 2', start_date: daysAgo(230), end_date: daysAgo(130), duration: '100 ימים', status: 'completed', priority: 'high', progress: 100, assigned_to_id: 'prof-main-2', resource_name: 'אחמד חסן', type: 'other', predecessors: ['gantt-b-1'], order: 3, created_at: daysAgo(400), updated_at: daysAgo(130) },
  { id: 'gantt-b-4', project_id: 'proj-bldg', milestone_id: 'ms-b-4', name: 'שלד בניין 3', start_date: daysAgo(120), end_date: daysFromNow(10), duration: '130 ימים', status: 'in-progress', priority: 'high', progress: 70, assigned_to_id: 'prof-main-2', resource_name: 'אחמד חסן', type: 'other', order: 4, created_at: daysAgo(400), updated_at: daysAgo(5) },
  { id: 'gantt-b-5', project_id: 'proj-bldg', milestone_id: 'ms-b-4', name: 'שלד בניין 4', start_date: daysAgo(60), end_date: daysFromNow(70), duration: '130 ימים', status: 'in-progress', priority: 'high', progress: 30, assigned_to_id: 'prof-main-2', resource_name: 'אחמד חסן', type: 'other', order: 5, created_at: daysAgo(400), updated_at: daysAgo(5) },
  { id: 'gantt-b-6', project_id: 'proj-bldg', milestone_id: 'ms-b-6', name: 'התקנת מעלית בניין 1', start_date: daysAgo(30), end_date: daysFromNow(60), duration: '90 ימים', status: 'in-progress', priority: 'medium', progress: 20, assigned_to_id: 'prof-elev-1', resource_name: 'אורי גלעד', type: 'מעלית', order: 6, created_at: daysAgo(400), updated_at: daysAgo(5) },
];

// ============================================================
// TASKS
// ============================================================

export const seedTasks: Task[] = [
  // Villa (4)
  { id: 'task-v-1', project_id: 'proj-villa', title: 'בדיקת איטום גג', status: 'Done', priority: 'High', assignee_name: 'ניר אלבז', due_date: daysAgo(30), completed_at: daysAgo(28), percent_complete: 100, created_at: daysAgo(60), updated_at: daysAgo(28) },
  { id: 'task-v-2', project_id: 'proj-villa', title: 'הזמנת אריחים מרצפות', status: 'In Progress', priority: 'High', assignee_name: 'חסן אבו-ריש', due_date: daysFromNow(14), percent_complete: 40, created_at: daysAgo(20), updated_at: daysAgo(3) },
  { id: 'task-v-3', project_id: 'proj-villa', title: 'אישור תוכניות חשמל', status: 'In Progress', priority: 'Medium', assignee_name: 'רוני זוהר', due_date: daysFromNow(7), percent_complete: 70, created_at: daysAgo(30), updated_at: daysAgo(5) },
  { id: 'task-v-4', project_id: 'proj-villa', title: 'תיאום מטבח מול ספק', status: 'Ready', priority: 'Medium', assignee_name: 'רונית שמעוני', due_date: daysFromNow(45), percent_complete: 0, created_at: daysAgo(10), updated_at: daysAgo(10) },
  // Buildings (6)
  { id: 'task-b-1', project_id: 'proj-bldg', title: 'אישור תוכניות שלד בניין 3', status: 'Done', priority: 'High', assignee_name: 'יוסי חדד', due_date: daysAgo(45), completed_at: daysAgo(42), percent_complete: 100, created_at: daysAgo(90), updated_at: daysAgo(42) },
  { id: 'task-b-2', project_id: 'proj-bldg', title: 'הזמנת ברזל לבניין 4', status: 'In Progress', priority: 'High', assignee_name: 'אחמד חסן', due_date: daysFromNow(10), percent_complete: 60, created_at: daysAgo(30), updated_at: daysAgo(3) },
  { id: 'task-b-3', project_id: 'proj-bldg', title: 'תיאום חיבור חשמל ארעי', status: 'In Progress', priority: 'Medium', assignee_name: 'סלים נאסר', due_date: daysFromNow(21), percent_complete: 30, created_at: daysAgo(15), updated_at: daysAgo(5) },
  { id: 'task-b-4', project_id: 'proj-bldg', title: 'בדיקת לחץ מים', status: 'Ready', priority: 'High', assignee_name: 'עלי מוחמד', due_date: daysFromNow(14), percent_complete: 0, created_at: daysAgo(10), updated_at: daysAgo(10) },
  { id: 'task-b-5', project_id: 'proj-bldg', title: 'הגשת בקשה לטופס 4', status: 'Backlog', priority: 'Medium', due_date: daysFromNow(300), percent_complete: 0, created_at: daysAgo(30), updated_at: daysAgo(30) },
  { id: 'task-b-6', project_id: 'proj-bldg', title: 'סקר בטיחות חניון', status: 'In Progress', priority: 'High', assignee_name: 'רונן שפר', due_date: daysFromNow(7), percent_complete: 50, created_at: daysAgo(20), updated_at: daysAgo(3) },
];

// ============================================================
// PAYMENT SCHEDULES
// ============================================================

export const seedPaymentSchedules: PaymentSchedule[] = [
  // Villa (4)
  { id: 'ps-v-1', cost_item_id: 'cost-v-6', project_id: 'proj-villa', total_amount: 1350000, status: 'active', created_at: daysAgo(200), updated_at: daysAgo(200) },
  { id: 'ps-v-2', cost_item_id: 'cost-v-7', project_id: 'proj-villa', total_amount: 310000, status: 'active', created_at: daysAgo(160), updated_at: daysAgo(160) },
  { id: 'ps-v-3', cost_item_id: 'cost-v-8', project_id: 'proj-villa', total_amount: 275000, status: 'active', created_at: daysAgo(155), updated_at: daysAgo(155) },
  { id: 'ps-v-4', cost_item_id: 'cost-v-9', project_id: 'proj-villa', total_amount: 242000, status: 'active', created_at: daysAgo(100), updated_at: daysAgo(100) },
  // Buildings (5)
  { id: 'ps-b-1', cost_item_id: 'cost-b-8', project_id: 'proj-bldg', total_amount: 7200000, status: 'active', created_at: daysAgo(320), updated_at: daysAgo(320) },
  { id: 'ps-b-2', cost_item_id: 'cost-b-9', project_id: 'proj-bldg', total_amount: 1750000, status: 'active', created_at: daysAgo(250), updated_at: daysAgo(250) },
  { id: 'ps-b-3', cost_item_id: 'cost-b-10', project_id: 'proj-bldg', total_amount: 1480000, status: 'active', created_at: daysAgo(245), updated_at: daysAgo(245) },
  { id: 'ps-b-4', cost_item_id: 'cost-b-11', project_id: 'proj-bldg', total_amount: 1150000, status: 'active', created_at: daysAgo(180), updated_at: daysAgo(180) },
  { id: 'ps-b-5', cost_item_id: 'cost-b-13', project_id: 'proj-bldg', total_amount: 780000, status: 'active', created_at: daysAgo(200), updated_at: daysAgo(200) },
];

// ============================================================
// SCHEDULE ITEMS
// ============================================================

export const seedScheduleItems: ScheduleItem[] = [
  // Villa ps-v-1 (skeleton 1,350,000)
  { id: 'si-v-1', schedule_id: 'ps-v-1', cost_item_id: 'cost-v-6', project_id: 'proj-villa', description: 'מקדמה 30%', amount: 405000, percentage: 30, milestone_id: 'ms-v-1', milestone_name: 'יציקת יסודות', target_date: daysAgo(190), order: 1, status: 'paid', paid_date: daysAgo(185), paid_amount: 405000, created_at: daysAgo(200), updated_at: daysAgo(185) },
  { id: 'si-v-2', schedule_id: 'ps-v-1', cost_item_id: 'cost-v-6', project_id: 'proj-villa', description: 'סיום שלד 50%', amount: 675000, percentage: 50, milestone_id: 'ms-v-2', milestone_name: 'סיום שלד', target_date: daysAgo(65), order: 2, status: 'paid', paid_date: daysAgo(58), paid_amount: 675000, created_at: daysAgo(200), updated_at: daysAgo(58) },
  { id: 'si-v-3', schedule_id: 'ps-v-1', cost_item_id: 'cost-v-6', project_id: 'proj-villa', description: 'גמר 20%', amount: 270000, percentage: 20, target_date: daysFromNow(120), order: 3, status: 'pending', created_at: daysAgo(200), updated_at: daysAgo(200) },
  // Villa ps-v-2 (electrical 310,000)
  { id: 'si-v-4', schedule_id: 'ps-v-2', cost_item_id: 'cost-v-7', project_id: 'proj-villa', description: 'מקדמה 20%', amount: 62000, percentage: 20, target_date: daysAgo(150), order: 1, status: 'paid', paid_date: daysAgo(148), paid_amount: 62000, created_at: daysAgo(160), updated_at: daysAgo(148) },
  { id: 'si-v-5', schedule_id: 'ps-v-2', cost_item_id: 'cost-v-7', project_id: 'proj-villa', description: 'שלב א 40%', amount: 124000, percentage: 40, milestone_id: 'ms-v-3', milestone_name: 'עבודות חשמל', target_date: daysAgo(10), order: 2, status: 'milestone_confirmed', confirmed_by: 'מנהל פרויקט', confirmed_at: daysAgo(8), created_at: daysAgo(160), updated_at: daysAgo(8) },
  { id: 'si-v-6', schedule_id: 'ps-v-2', cost_item_id: 'cost-v-7', project_id: 'proj-villa', description: 'סיום 40%', amount: 124000, percentage: 40, target_date: daysFromNow(30), order: 3, status: 'pending', created_at: daysAgo(160), updated_at: daysAgo(160) },
  // Villa ps-v-3 (plumbing 275,000)
  { id: 'si-v-7', schedule_id: 'ps-v-3', cost_item_id: 'cost-v-8', project_id: 'proj-villa', description: 'מקדמה 20%', amount: 55000, percentage: 20, target_date: daysAgo(145), order: 1, status: 'paid', paid_date: daysAgo(142), paid_amount: 55000, created_at: daysAgo(155), updated_at: daysAgo(142) },
  { id: 'si-v-8', schedule_id: 'ps-v-3', cost_item_id: 'cost-v-8', project_id: 'proj-villa', description: 'שלב א 50%', amount: 137500, percentage: 50, target_date: daysAgo(5), order: 2, status: 'invoice_received', created_at: daysAgo(155), updated_at: daysAgo(5) },
  { id: 'si-v-9', schedule_id: 'ps-v-3', cost_item_id: 'cost-v-8', project_id: 'proj-villa', description: 'גמר 30%', amount: 82500, percentage: 30, target_date: daysFromNow(45), order: 3, status: 'pending', created_at: daysAgo(155), updated_at: daysAgo(155) },
  // Villa ps-v-4 (tiling 242,000)
  { id: 'si-v-10', schedule_id: 'ps-v-4', cost_item_id: 'cost-v-9', project_id: 'proj-villa', description: 'מקדמה 30%', amount: 72600, percentage: 30, target_date: daysAgo(90), order: 1, status: 'approved', approved_by: 'מנהל', approved_at: daysAgo(88), created_at: daysAgo(100), updated_at: daysAgo(88) },
  { id: 'si-v-11', schedule_id: 'ps-v-4', cost_item_id: 'cost-v-9', project_id: 'proj-villa', description: 'חומרים 40%', amount: 96800, percentage: 40, target_date: daysFromNow(20), order: 2, status: 'pending', created_at: daysAgo(100), updated_at: daysAgo(100) },
  { id: 'si-v-12', schedule_id: 'ps-v-4', cost_item_id: 'cost-v-9', project_id: 'proj-villa', description: 'סיום 30%', amount: 72600, percentage: 30, target_date: daysFromNow(60), order: 3, status: 'pending', created_at: daysAgo(100), updated_at: daysAgo(100) },
  // Buildings ps-b-1 (skeleton 7,200,000)
  { id: 'si-b-1', schedule_id: 'ps-b-1', cost_item_id: 'cost-b-8', project_id: 'proj-bldg', description: 'מקדמה 10%', amount: 720000, percentage: 10, target_date: daysAgo(310), order: 1, status: 'paid', paid_date: daysAgo(305), paid_amount: 720000, created_at: daysAgo(320), updated_at: daysAgo(305) },
  { id: 'si-b-2', schedule_id: 'ps-b-1', cost_item_id: 'cost-b-8', project_id: 'proj-bldg', description: 'שלד בניינים 1-2 40%', amount: 2880000, percentage: 40, milestone_id: 'ms-b-2', milestone_name: 'שלד בניינים 1-2', target_date: daysAgo(125), order: 2, status: 'paid', paid_date: daysAgo(118), paid_amount: 2880000, created_at: daysAgo(320), updated_at: daysAgo(118) },
  { id: 'si-b-3', schedule_id: 'ps-b-1', cost_item_id: 'cost-b-8', project_id: 'proj-bldg', description: 'שלד בניינים 3-4 30%', amount: 2160000, percentage: 30, milestone_id: 'ms-b-4', milestone_name: 'שלד בניינים 3-4', target_date: daysFromNow(30), order: 3, status: 'milestone_confirmed', confirmed_by: 'מפקח', confirmed_at: daysAgo(5), created_at: daysAgo(320), updated_at: daysAgo(5) },
  { id: 'si-b-4', schedule_id: 'ps-b-1', cost_item_id: 'cost-b-8', project_id: 'proj-bldg', description: 'סיום שלד 20%', amount: 1440000, percentage: 20, target_date: daysFromNow(90), order: 4, status: 'pending', created_at: daysAgo(320), updated_at: daysAgo(320) },
  // Buildings ps-b-2 (electrical 1,750,000)
  { id: 'si-b-5', schedule_id: 'ps-b-2', cost_item_id: 'cost-b-9', project_id: 'proj-bldg', description: 'מקדמה 15%', amount: 262500, percentage: 15, target_date: daysAgo(240), order: 1, status: 'paid', paid_date: daysAgo(235), paid_amount: 262500, created_at: daysAgo(250), updated_at: daysAgo(235) },
  { id: 'si-b-6', schedule_id: 'ps-b-2', cost_item_id: 'cost-b-9', project_id: 'proj-bldg', description: 'שלב א - בניינים 1-2 30%', amount: 525000, percentage: 30, target_date: daysAgo(20), order: 2, status: 'invoice_received', created_at: daysAgo(250), updated_at: daysAgo(20) },
  { id: 'si-b-7', schedule_id: 'ps-b-2', cost_item_id: 'cost-b-9', project_id: 'proj-bldg', description: 'שלב ב 30%', amount: 525000, percentage: 30, target_date: daysFromNow(60), order: 3, status: 'pending', created_at: daysAgo(250), updated_at: daysAgo(250) },
  { id: 'si-b-8', schedule_id: 'ps-b-2', cost_item_id: 'cost-b-9', project_id: 'proj-bldg', description: 'סיום 25%', amount: 437500, percentage: 25, target_date: daysFromNow(150), order: 4, status: 'pending', created_at: daysAgo(250), updated_at: daysAgo(250) },
  // Buildings ps-b-3 (plumbing 1,480,000)
  { id: 'si-b-9', schedule_id: 'ps-b-3', cost_item_id: 'cost-b-10', project_id: 'proj-bldg', description: 'מקדמה 15%', amount: 222000, percentage: 15, target_date: daysAgo(235), order: 1, status: 'paid', paid_date: daysAgo(230), paid_amount: 222000, created_at: daysAgo(245), updated_at: daysAgo(230) },
  { id: 'si-b-10', schedule_id: 'ps-b-3', cost_item_id: 'cost-b-10', project_id: 'proj-bldg', description: 'שלב א 35%', amount: 518000, percentage: 35, target_date: daysAgo(30), order: 2, status: 'approved', approved_by: 'מנהל פרויקט', approved_at: daysAgo(25), created_at: daysAgo(245), updated_at: daysAgo(25) },
  { id: 'si-b-11', schedule_id: 'ps-b-3', cost_item_id: 'cost-b-10', project_id: 'proj-bldg', description: 'שלב ב 30%', amount: 444000, percentage: 30, target_date: daysFromNow(60), order: 3, status: 'pending', created_at: daysAgo(245), updated_at: daysAgo(245) },
  { id: 'si-b-12', schedule_id: 'ps-b-3', cost_item_id: 'cost-b-10', project_id: 'proj-bldg', description: 'סיום 20%', amount: 296000, percentage: 20, target_date: daysFromNow(150), order: 4, status: 'pending', created_at: daysAgo(245), updated_at: daysAgo(245) },
  // Buildings ps-b-4 (tiling 1,150,000)
  { id: 'si-b-13', schedule_id: 'ps-b-4', cost_item_id: 'cost-b-11', project_id: 'proj-bldg', description: 'מקדמה 20%', amount: 230000, percentage: 20, target_date: daysAgo(170), order: 1, status: 'paid', paid_date: daysAgo(165), paid_amount: 230000, created_at: daysAgo(180), updated_at: daysAgo(165) },
  { id: 'si-b-14', schedule_id: 'ps-b-4', cost_item_id: 'cost-b-11', project_id: 'proj-bldg', description: 'חומרים 40%', amount: 460000, percentage: 40, target_date: daysFromNow(20), order: 2, status: 'pending', created_at: daysAgo(180), updated_at: daysAgo(180) },
  { id: 'si-b-15', schedule_id: 'ps-b-4', cost_item_id: 'cost-b-11', project_id: 'proj-bldg', description: 'סיום 40%', amount: 460000, percentage: 40, target_date: daysFromNow(90), order: 3, status: 'pending', created_at: daysAgo(180), updated_at: daysAgo(180) },
  // Buildings ps-b-5 (elevator 780,000)
  { id: 'si-b-16', schedule_id: 'ps-b-5', cost_item_id: 'cost-b-13', project_id: 'proj-bldg', description: 'הזמנה 50%', amount: 390000, percentage: 50, target_date: daysAgo(190), order: 1, status: 'paid', paid_date: daysAgo(185), paid_amount: 390000, created_at: daysAgo(200), updated_at: daysAgo(185) },
];

// ============================================================
// SPECIAL ISSUES
// ============================================================

export const seedSpecialIssues: SpecialIssue[] = [
  // Villa (2)
  { id: 'issue-v-1', project_id: 'proj-villa', date: daysAgo(45), description: 'סדק בקיר מרתף - נדרשת בדיקת מהנדס', status: 'resolved', priority: 'high', category: 'safety', responsible: 'אבי גולדשטיין', resolution: 'נבדק ע"י מהנדס קונסטרוקציה, תוקן באמצעות הזרקת אפוקסי', created_at: daysAgo(45), updated_at: daysAgo(30) },
  { id: 'issue-v-2', project_id: 'proj-villa', date: daysAgo(10), description: 'עיכוב באספקת אלומיניום - הספק מאחר 3 שבועות', status: 'open', priority: 'medium', category: 'schedule', responsible: 'מוטי שגב', created_at: daysAgo(10), updated_at: daysAgo(10) },
  // Buildings (3)
  { id: 'issue-b-1', project_id: 'proj-bldg', date: daysAgo(25), description: 'בעיית ניקוז בחניון תת-קרקעי', status: 'in_progress', priority: 'high', category: 'quality', responsible: 'עלי מוחמד', created_at: daysAgo(25), updated_at: daysAgo(5) },
  { id: 'issue-b-2', project_id: 'proj-bldg', date: daysAgo(60), description: 'חריגה תקציבית של 8% בעבודות ברזל', status: 'resolved', priority: 'medium', category: 'budget', responsible: 'אחמד חסן', resolution: 'הוסכם על קיזוז מחשבונות עתידיים', created_at: daysAgo(60), updated_at: daysAgo(40) },
  { id: 'issue-b-3', project_id: 'proj-bldg', date: daysAgo(15), description: 'רעש מנופים - תלונות מדיירי שכונה סמוכה', status: 'open', priority: 'low', category: 'other', responsible: 'רונן שפר', created_at: daysAgo(15), updated_at: daysAgo(15) },
];

// ============================================================
// PLANNING CHANGES
// ============================================================

export const seedPlanningChanges: PlanningChange[] = [
  // Villa (1)
  { id: 'pc-v-1', project_id: 'proj-villa', change_number: 1, description: 'שינוי מיקום מטבח לפי בקשת לקוח - העברה לצד מערבי', schedule_impact: 'עיכוב של שבוע בעבודות אינסטלציה', budget_impact: 15000, decision: 'approved', created_at: daysAgo(80), updated_at: daysAgo(75) },
  // Buildings (2)
  { id: 'pc-b-1', project_id: 'proj-bldg', change_number: 1, description: 'הוספת חדר אשפה לבניין 2', schedule_impact: 'ללא השפעה על לו"ז', budget_impact: 45000, decision: 'approved', created_at: daysAgo(100), updated_at: daysAgo(90) },
  { id: 'pc-b-2', project_id: 'proj-bldg', change_number: 2, description: 'שינוי חיפוי חזיתות בניין 1 מאבן לקומפוזיט', schedule_impact: 'עיכוב אפשרי של חודש', budget_impact: 120000, decision: 'pending', created_at: daysAgo(20), updated_at: daysAgo(20) },
];

// ============================================================
// FILES
// ============================================================

export const seedFiles: File[] = [
  // Villa (2)
  { id: 'file-v-1', file_name: 'תוכנית אדריכלית - וילה.pdf', file_url: '/files/villa-arch-plan.pdf', file_size: 5242880, file_size_display: '5 MB', file_type: 'application/pdf', description_short: 'תוכנית אדריכלית מלאה', related_entity_type: 'Project', related_entity_id: 'proj-villa', related_entity_name: 'וילה פרטית - הרצליה פיטוח', uploaded_at: daysAgo(280), uploaded_by: "אדר' יעל שפירא", created_at: daysAgo(280), updated_at: daysAgo(280) },
  { id: 'file-v-2', file_name: 'חוזה קבלן שלד.pdf', file_url: '/files/villa-skeleton-contract.pdf', file_size: 2097152, file_size_display: '2 MB', file_type: 'application/pdf', description_short: 'חוזה עם קבלן שלד', related_entity_type: 'Tender', related_entity_id: 'tender-v-1', related_entity_name: 'מכרז שלד', uploaded_at: daysAgo(198), uploaded_by: 'דוד אברהם', created_at: daysAgo(198), updated_at: daysAgo(198) },
  // Buildings (3)
  { id: 'file-b-1', file_name: 'תוכנית מתחם.pdf', file_url: '/files/bldg-complex-plan.pdf', file_size: 10485760, file_size_display: '10 MB', file_type: 'application/pdf', description_short: 'תוכנית מתחם מגורים מלאה', related_entity_type: 'Project', related_entity_id: 'proj-bldg', related_entity_name: 'מתחם מגורים - פארק הים', uploaded_at: daysAgo(380), uploaded_by: "אדר' רון מזרחי", created_at: daysAgo(380), updated_at: daysAgo(380) },
  { id: 'file-b-2', file_name: 'דו"ח קרקע.pdf', file_url: '/files/bldg-soil-report.pdf', file_size: 3145728, file_size_display: '3 MB', file_type: 'application/pdf', description_short: 'דו"ח בדיקת קרקע', related_entity_type: 'Project', related_entity_id: 'proj-bldg', related_entity_name: 'מתחם מגורים - פארק הים', uploaded_at: daysAgo(370), uploaded_by: 'ד"ר אורי נחמיאס', created_at: daysAgo(370), updated_at: daysAgo(370) },
  { id: 'file-b-3', file_name: 'הצעת מחיר שלד.pdf', file_url: '/files/bldg-skeleton-quote.pdf', file_size: 1048576, file_size_display: '1 MB', file_type: 'application/pdf', description_short: 'הצעת מחיר קבלן שלד', related_entity_type: 'Tender', related_entity_id: 'tender-b-1', related_entity_name: 'מכרז שלד ראשי', uploaded_at: daysAgo(335), uploaded_by: 'אחמד חסן', created_at: daysAgo(335), updated_at: daysAgo(335) },
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
      console.log('Creating projects...');
      for (const project of seedProjects) {
        await createProject(project);
      }

      // 2. Create Professionals
      console.log('Creating professionals...');
      for (const professional of seedProfessionals) {
        await createProfessional(professional);
      }

      // 3. Assign Professionals to Projects
      console.log('Assigning professionals to projects...');
      for (const assignment of seedProjectProfessionals) {
        await createProjectProfessional(assignment);
      }

      // 4. Create Budgets
      console.log('Creating budgets...');
      for (const budget of seedBudgets) {
        await createBudget(budget);
      }

      // 5. Create Budget Categories
      console.log('Creating budget categories...');
      for (const category of seedBudgetCategories) {
        await createBudgetCategory(category);
      }

      // 6. Create Budget Chapters
      console.log('Creating budget chapters...');
      for (const chapter of seedBudgetChapters) {
        await createBudgetChapter(chapter);
      }

      // 7. Create Project Units
      console.log('Creating project units...');
      for (const unit of seedProjectUnits) {
        await createUnit(unit);
      }

      // 8. Create Tenders
      console.log('Creating tenders...');
      for (const tender of seedTenders) {
        await createTender(tender);
      }

      // 9. Create Tender Participants
      console.log('Creating tender participants...');
      for (const participant of seedTenderParticipants) {
        await createTenderParticipant(participant);
      }

      // 10. Create Project Milestones
      console.log('Creating project milestones...');
      for (const milestone of seedProjectMilestones) {
        await createMilestone(milestone);
      }

      // 11. Create Budget Items
      console.log('Creating budget items...');
      for (const item of seedBudgetItems) {
        await createBudgetItem(item);
      }

      // 12. Create Budget Payments
      console.log('Creating budget payments...');
      for (const payment of seedBudgetPayments) {
        await createBudgetPayment(payment);
      }

      // 13. Create Gantt Tasks
      console.log('Creating gantt tasks...');
      for (const task of seedGanttTasks) {
        await createGanttTask(task);
      }

      // 14. Create Tasks
      console.log('Creating tasks...');
      for (const task of seedTasks) {
        await createTask(task);
      }

      // 15. Create Files
      console.log('Creating files...');
      for (const file of seedFiles) {
        await createFile(file);
      }

      // 16. Create Special Issues
      console.log('Creating special issues...');
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
      console.error('Error seeding Neon database:', error);
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
    console.log('Clearing Neon database...');

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

      console.log('Neon database cleared successfully!');
      return { clearedKeys: 19 }; // Number of tables cleared
    } catch (error) {
      console.error('Error clearing Neon database:', error);
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
