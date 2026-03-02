/**
 * seed-neon.mjs — Seed all data into Neon PostgreSQL database using raw SQL
 *
 * Usage: node scripts/seed-neon.mjs
 *
 * This script replicates the seed data from src/data/seedData.ts,
 * translating the dynamic daysAgo/daysFromNow date helpers into
 * SQL CURRENT_DATE - INTERVAL expressions.
 *
 * The DB schema uses UUID primary keys but seed data uses
 * human-readable string IDs. We generate deterministic UUIDs
 * from each string ID so that foreign key relationships are
 * consistent across runs.
 */

import { neon } from '@neondatabase/serverless';
import crypto from 'crypto';

// ============================================================
// DATABASE CONNECTION
// ============================================================

const DATABASE_URL =
  'postgresql://neondb_owner:npg_gsWCQ0jzf1rw@ep-wild-snow-ae1icyze-pooler.c-2.us-east-2.aws.neon.tech/neondb?sslmode=require';

const sql = neon(DATABASE_URL);

// ============================================================
// HELPER: Deterministic UUID from string ID (UUID v5 style)
// ============================================================

const NAMESPACE = '6ba7b810-9dad-11d1-80b4-00c04fd430c8';

function toUUID(seedId) {
  if (!seedId) return null;
  if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(seedId)) {
    return seedId;
  }
  const hash = crypto.createHash('sha1').update(NAMESPACE + seedId).digest('hex');
  return [
    hash.substring(0, 8),
    hash.substring(8, 12),
    '5' + hash.substring(13, 16),
    ((parseInt(hash.substring(16, 18), 16) & 0x3f) | 0x80).toString(16).padStart(2, '0') + hash.substring(18, 20),
    hash.substring(20, 32),
  ].join('-');
}

const uuidCache = new Map();
function U(seedId) {
  if (seedId === null || seedId === undefined) return null;
  if (!uuidCache.has(seedId)) uuidCache.set(seedId, toUUID(seedId));
  return uuidCache.get(seedId);
}

// ============================================================
// HELPER: Date SQL expressions
// ============================================================

const daysAgo = (d) => `(CURRENT_DATE - INTERVAL '${d} days')`;
const daysFromNow = (d) => `(CURRENT_DATE + INTERVAL '${d} days')`;

// ============================================================
// SQL formatting helpers
// ============================================================

async function exec(query) {
  try {
    await sql.query(query);
  } catch (err) {
    if (err.message && err.message.includes('duplicate key')) return;
    throw err;
  }
}

/** Escape text for SQL */
function esc(val) {
  if (val === null || val === undefined) return 'NULL';
  return `'${String(val).replace(/'/g, "''")}'`;
}

/** UUID id for SQL — converts seed ID to UUID */
function uid(seedId) {
  if (seedId === null || seedId === undefined) return 'NULL';
  return `'${U(seedId)}'`;
}

/** Number for SQL */
function num(val) {
  if (val === null || val === undefined) return 'NULL';
  return String(val);
}

/** Boolean for SQL */
function bool(val) {
  return val ? 'TRUE' : 'FALSE';
}

/** UUID[] PostgreSQL array literal */
function uuidArray(arr) {
  if (!arr || arr.length === 0) return "'{}'";
  return `'{${arr.map((s) => `"${U(s)}"`).join(',')}}'`;
}

// ============================================================
// SEED FUNCTIONS
// ============================================================

async function seedProjects() {
  console.log('  [1/21] Seeding projects (2 records)...');
  await exec(`
    INSERT INTO projects (id, project_name, client_name, address, status,
      permit_start_date, permit_duration_months, permit_target_date,
      permit_approval_date, notes, created_at, updated_at,
      general_estimate, built_sqm, current_vat_rate)
    VALUES
      (${uid('proj-villa')}, ${esc('וילה פרטית - הרצליה פיטוח')}, ${esc('דוד ומיכל אברהם')}, ${esc('רחוב האלון 12, הרצליה פיטוח')}, ${esc('ביצוע')},
        ${daysAgo(240)}, 24, ${daysFromNow(490)}, ${daysAgo(210)},
        ${esc('וילה 350 מ"ר, 2 קומות + מרתף, בריכה, גינה')},
        ${daysAgo(300)}, ${daysAgo(7)},
        4000000, 350, 17),
      (${uid('proj-bldg')}, ${esc('מתחם מגורים - פארק הים, נתניה')}, ${esc('קבוצת אלון נדל"ן בע"מ')}, ${esc('שדרות נחום סוקולוב 40, נתניה')}, ${esc('ביצוע')},
        ${daysAgo(360)}, 36, ${daysFromNow(720)}, ${daysAgo(330)},
        ${esc('4 בניינים × 5 קומות, סה"כ 4,800 מ"ר, 80 יחידות דיור')},
        ${daysAgo(400)}, ${daysAgo(1)},
        20000000, 4800, 17)
    ON CONFLICT (id) DO NOTHING;
  `);
}

async function seedProfessionals() {
  console.log('  [2/21] Seeding professionals (40 records)...');

  const profs = [
    ['prof-arch-1', "אדר' יעל שפירא", 'שפירא אדריכלים', 'אדריכל', '054-7891234', 'yael@shapira-arch.co.il', 5],
    ['prof-arch-2', "אדר' רון מזרחי", 'סטודיו מזרחי', 'אדריכל', '052-3456789', 'ron@mizrachi-studio.co.il', 5],
    ['prof-arch-3', "אדר' נועה כהן", 'כהן אדריכלות', 'אדריכל', '050-9876543', 'noa@cohen-arch.co.il', 4],
    ['prof-land-1', "אדר' נוף מיכל לוי", 'לוי נוף', 'אדריכל נוף', '054-1112233', 'michal@levi-landscape.co.il', 5],
    ['prof-land-2', "אדר' נוף עמית ברק", 'ברק גנים', 'אדריכל נוף', '052-4445566', 'amit@barak-gardens.co.il', 4],
    ['prof-land-3', "אדר' נוף דנה שלום", 'שלום נוף', 'אדריכל נוף', '050-7778899', 'dana@shalom-nof.co.il', 4],
    ['prof-struct-1', 'מהנדס אבי גולדשטיין', 'גולדשטיין הנדסה', 'מהנדס קונסטרוקציה', '054-2223344', 'avi@goldstein-eng.co.il', 5],
    ['prof-struct-2', 'מהנדס יוסי חדד', 'חדד מבנים', 'מהנדס קונסטרוקציה', '052-5556677', 'yossi@hadad-structures.co.il', 4],
    ['prof-struct-3', 'מהנדסת שירה פרידמן', 'פרידמן קונסטרוקציה', 'מהנדס קונסטרוקציה', '050-8889900', 'shira@friedman-const.co.il', 4],
    ['prof-ee-1', 'מהנדס חשמל דני רוזן', 'רוזן חשמל', 'מהנדס חשמל', '054-3334455', 'dani@rozen-elec.co.il', 5],
    ['prof-ee-2', 'מהנדס חשמל טל אופיר', 'אופיר מערכות', 'מהנדס חשמל', '052-6667788', 'tal@ofir-systems.co.il', 4],
    ['prof-ee-3', 'מהנדסת חשמל לימור בן-דוד', 'בן-דוד הנדסת חשמל', 'מהנדס חשמל', '050-1234567', 'limor@bendavid-elec.co.il', 4],
    ['prof-main-1', 'משה דוד', 'דוד בנייה בע"מ', 'קבלן שלד', '054-5551234', 'moshe@david-build.co.il', 5],
    ['prof-main-2', 'אחמד חסן', 'חסן קבלנות', 'קבלן שלד', '052-5555678', 'ahmad@hassan-const.co.il', 4],
    ['prof-main-3', 'יגאל פרץ', 'פרץ שלד בע"מ', 'קבלן שלד', '050-5559012', 'yigal@peretz-skeleton.co.il', 4],
    ['prof-elec-1', 'רוני זוהר', 'זוהר חשמל', 'קבלן חשמל', '054-6661234', 'roni@zohar-elec.co.il', 4],
    ['prof-elec-2', 'סלים נאסר', 'נאסר מערכות חשמל', 'קבלן חשמל', '052-6665678', 'salim@naser-elec.co.il', 4],
    ['prof-elec-3', 'גיא שטרן', 'שטרן חשמל בע"מ', 'קבלן חשמל', '050-6669012', 'guy@stern-electric.co.il', 4],
    ['prof-plumb-1', 'דני כהן', 'כהן אינסטלציה', 'קבלן אינסטלציה', '054-7771234', 'dani@cohen-plumb.co.il', 5],
    ['prof-plumb-2', 'עלי מוחמד', 'מוחמד צנרת', 'קבלן אינסטלציה', '052-7775678', 'ali@muhammad-pipes.co.il', 4],
    ['prof-plumb-3', 'בועז לרנר', 'לרנר אינסטלציה בע"מ', 'קבלן אינסטלציה', '050-7779012', 'boaz@lerner-plumb.co.il', 4],
    ['prof-tile-1', 'חסן אבו-ריש', 'אבו-ריש ריצוף', 'קבלן ריצוף', '054-8881234', 'hassan@aburish-tiles.co.il', 5],
    ['prof-tile-2', 'אלי בן-חיים', 'בן-חיים ריצוף', 'קבלן ריצוף', '052-8885678', 'eli@benhaim-tiles.co.il', 4],
    ['prof-tile-3', 'ויקטור גרינברג', 'גרינברג ריצוף בע"מ', 'קבלן ריצוף', '050-8889012', 'victor@greenberg-tiles.co.il', 4],
    ['prof-alum-1', 'מוטי שגב', 'שגב אלומיניום', 'קבלן אלומיניום', '054-9991234', 'moti@segev-alum.co.il', 4],
    ['prof-alum-2', 'ואליד חוסיין', 'חוסיין אלומיניום', 'קבלן אלומיניום', '052-9995678', 'walid@hussein-alum.co.il', 4],
    ['prof-alum-3', 'שמעון דהן', 'דהן חלונות ודלתות', 'קבלן אלומיניום', '050-9999012', 'shimon@dahan-windows.co.il', 4],
    ['prof-dry-1', 'ארתור קוזלוב', 'קוזלוב גבס', 'קבלן גבס', '054-1011234', 'artur@kozlov-drywall.co.il', 4],
    ['prof-dry-2', 'עמוס חזן', 'חזן גבס ותקרות', 'קבלן גבס', '052-1015678', 'amos@hazan-drywall.co.il', 4],
    ['prof-dry-3', 'פבל סורוקין', 'סורוקין גמר בע"מ', 'קבלן גבס', '050-1019012', 'pavel@sorokin-finish.co.il', 4],
    ['prof-paint-1', 'יוסי מלכה', 'מלכה צבעים', 'קבלן צבע', '054-1021234', 'yossi@malka-paint.co.il', 4],
    ['prof-paint-2', 'סרגיי ברקוב', 'ברקוב צביעה', 'קבלן צבע', '052-1025678', 'sergey@barkov-paint.co.il', 4],
    ['prof-paint-3', 'מאיר אסולין', 'אסולין צבע ושפכטל', 'קבלן צבע', '050-1029012', 'meir@asoulin-paint.co.il', 5],
    ['prof-seal-1', 'ניר אלבז', 'אלבז איטום', 'קבלן איטום', '054-1031234', 'nir@elbaz-seal.co.il', 5],
    ['prof-seal-2', 'רמי טביב', 'טביב איטום ובידוד', 'קבלן איטום', '052-1035678', 'rami@taviv-seal.co.il', 4],
    ['prof-seal-3', 'זאב קפלן', 'קפלן איטום בע"מ', 'קבלן איטום', '050-1039012', 'zeev@kaplan-seal.co.il', 4],
    ['prof-soil-1', 'ד"ר אורי נחמיאס', 'נחמיאס גאוטכניקה', 'יועץ קרקע', '054-1041234', 'uri@nahmias-geo.co.il', 5],
    ['prof-safety-1', 'רונן שפר', 'שפר בטיחות', 'יועץ בטיחות', '052-1045678', 'ronen@shefer-safety.co.il', 4],
    ['prof-survey-1', 'משה אטיאס', 'אטיאס מדידות', 'מודד', '050-1049012', 'moshe@atias-survey.co.il', 4],
    ['prof-elev-1', 'אורי גלעד', 'גלעד מעליות', 'קבלן מעלית', '054-1051234', 'uri@gilad-elevators.co.il', 4],
    ['prof-kitchen-1', 'רונית שמעוני', 'שמעוני מטבחים', 'ספק מטבח', '054-1061234', 'ronit@shemoni-kitchens.co.il', 5],
    ['prof-supply-1', 'חיים ברגר', 'ברגר חומרי בניין', 'ספק חומרי בניין', '052-1065678', 'haim@berger-supply.co.il', 4],
    ['prof-sanitary-1', 'אמיר פרנקל', 'פרנקל סנטריה', 'ספק סנטריה', '050-1069012', 'amir@frenkel-sanitary.co.il', 4],
    ['prof-doors-1', 'יצחק לוין', 'לוין דלתות', 'ספק דלתות', '054-1071234', 'yitzhak@levin-doors.co.il', 4],
  ];

  const values = profs
    .map(([id, name, company, field, phone, email, rating]) =>
      `(${uid(id)}, ${esc(name)}, ${esc(company)}, ${esc(field)}, ${esc(phone)}, ${esc(email)}, ${num(rating)}, TRUE)`
    ).join(',\n      ');

  await exec(`
    INSERT INTO professionals (id, professional_name, company_name, field, phone, email, rating, is_active)
    VALUES ${values}
    ON CONFLICT (id) DO NOTHING;
  `);
}

async function seedProjectProfessionals() {
  console.log('  [3/21] Seeding project_professionals (23 records)...');

  const rows = [
    ['pp-v-1','proj-villa','prof-arch-1','אדריכל ראשי','Manual',null,null,true,300],
    ['pp-v-2','proj-villa','prof-land-1','אדריכל נוף','Manual',null,null,true,280],
    ['pp-v-3','proj-villa','prof-struct-1','מהנדס קונסטרוקציה','Manual',null,null,true,290],
    ['pp-v-4','proj-villa','prof-soil-1','יועץ קרקע','Manual',null,null,true,295],
    ['pp-v-5','proj-villa','prof-safety-1','יועץ בטיחות','Manual',null,null,true,250],
    ['pp-v-6','proj-villa','prof-main-1','קבלן שלד','Tender','tender-v-1','מכרז שלד',true,200],
    ['pp-v-7','proj-villa','prof-elec-1','קבלן חשמל','Tender','tender-v-2','מכרז חשמל',true,160],
    ['pp-v-8','proj-villa','prof-plumb-1','קבלן אינסטלציה','Tender','tender-v-3','מכרז אינסטלציה',true,155],
    ['pp-v-9','proj-villa','prof-tile-1','קבלן ריצוף','Tender','tender-v-4','מכרז ריצוף',true,100],
    ['pp-v-10','proj-villa','prof-alum-1','קבלן אלומיניום','Tender','tender-v-5','מכרז אלומיניום',true,95],
    ['pp-b-1','proj-bldg','prof-arch-2','אדריכל ראשי','Manual',null,null,true,400],
    ['pp-b-2','proj-bldg','prof-land-2','אדריכל נוף','Manual',null,null,true,380],
    ['pp-b-3','proj-bldg','prof-struct-2','מהנדס קונסטרוקציה','Manual',null,null,true,390],
    ['pp-b-4','proj-bldg','prof-ee-1','מהנדס חשמל','Manual',null,null,true,385],
    ['pp-b-5','proj-bldg','prof-soil-1','יועץ קרקע','Tender','tender-b-7','מכרז יועץ קרקע',true,395],
    ['pp-b-6','proj-bldg','prof-safety-1','יועץ בטיחות','Manual',null,null,true,370],
    ['pp-b-7','proj-bldg','prof-survey-1','מודד','Manual',null,null,true,398],
    ['pp-b-8','proj-bldg','prof-main-2','קבלן שלד','Tender','tender-b-1','מכרז שלד',true,320],
    ['pp-b-9','proj-bldg','prof-elec-2','קבלן חשמל','Tender','tender-b-2','מכרז חשמל',true,250],
    ['pp-b-10','proj-bldg','prof-plumb-2','קבלן אינסטלציה','Tender','tender-b-3','מכרז אינסטלציה',true,245],
    ['pp-b-11','proj-bldg','prof-tile-2','קבלן ריצוף','Tender','tender-b-4','מכרז ריצוף',true,180],
    ['pp-b-12','proj-bldg','prof-alum-2','קבלן אלומיניום','Tender','tender-b-5','מכרז אלומיניום',true,175],
    ['pp-b-13','proj-bldg','prof-elev-1','קבלן מעלית','Tender','tender-b-6','מכרז מעליות',true,200],
  ];

  const values = rows
    .map(([id,proj,prof,role,source,tenderId,tenderName,active,startAgo]) =>
      `(${uid(id)}, ${uid(proj)}, ${uid(prof)}, ${esc(role)}, ${esc(source)}, ${uid(tenderId)}, ${tenderName ? esc(tenderName) : 'NULL'}, ${bool(active)}, ${daysAgo(startAgo)})`
    ).join(',\n      ');

  await exec(`
    INSERT INTO project_professionals (id, project_id, professional_id, project_role, source, related_tender_id, related_tender_name, is_active, start_date)
    VALUES ${values}
    ON CONFLICT (id) DO NOTHING;
  `);
}

async function seedCostItems() {
  console.log('  [4/21] Seeding cost_items (33 records)...');

  // [id, project_id, name, category, estimated, actual, vatInc, vatRate, status, tenderId, createdAgo, updatedAgo]
  const items = [
    ['cost-v-1','proj-villa','אדריכל','consultant',280000,null,false,17,'draft',null,300,300],
    ['cost-v-2','proj-villa','אדריכל נוף','consultant',80000,null,false,17,'draft',null,300,300],
    ['cost-v-3','proj-villa','מהנדס קונסטרוקציה','consultant',120000,null,false,17,'draft',null,290,290],
    ['cost-v-4','proj-villa','יועץ קרקע','consultant',45000,null,false,17,'draft',null,295,295],
    ['cost-v-5','proj-villa','יועץ בטיחות','consultant',35000,null,false,17,'draft',null,250,250],
    ['cost-v-6','proj-villa','קבלן שלד','contractor',1400000,1350000,false,17,'tender_winner','tender-v-1',220,200],
    ['cost-v-7','proj-villa','קבלן חשמל','contractor',320000,310000,false,17,'tender_winner','tender-v-2',180,160],
    ['cost-v-8','proj-villa','קבלן אינסטלציה','contractor',280000,275000,false,17,'tender_winner','tender-v-3',175,155],
    ['cost-v-9','proj-villa','קבלן ריצוף','contractor',250000,242000,false,17,'tender_winner','tender-v-4',120,100],
    ['cost-v-10','proj-villa','קבלן אלומיניום','contractor',220000,215000,false,17,'tender_winner','tender-v-5',115,95],
    ['cost-v-11','proj-villa','קבלן גבס','contractor',180000,null,false,17,'tender_open','tender-v-6',60,30],
    ['cost-v-12','proj-villa','קבלן צבע','contractor',140000,null,false,17,'tender_open','tender-v-7',55,25],
    ['cost-v-13','proj-villa','קבלן איטום','contractor',110000,null,false,17,'tender_draft','tender-v-8',40,40],
    ['cost-b-1','proj-bldg','אדריכל','consultant',900000,null,false,17,'draft',null,400,400],
    ['cost-b-2','proj-bldg','אדריכל נוף','consultant',250000,null,false,17,'draft',null,400,400],
    ['cost-b-3','proj-bldg','מהנדס קונסטרוקציה','consultant',500000,null,false,17,'draft',null,390,390],
    ['cost-b-4','proj-bldg','מהנדס חשמל','consultant',200000,null,false,17,'draft',null,385,385],
    ['cost-b-5','proj-bldg','יועץ קרקע','consultant',150000,145000,false,17,'tender_winner','tender-b-7',395,350],
    ['cost-b-6','proj-bldg','יועץ בטיחות','consultant',120000,null,false,17,'draft',null,370,370],
    ['cost-b-7','proj-bldg','מודד','consultant',80000,null,false,17,'draft',null,398,398],
    ['cost-b-8','proj-bldg','קבלן שלד','contractor',7500000,7200000,false,17,'tender_winner','tender-b-1',350,320],
    ['cost-b-9','proj-bldg','קבלן חשמל','contractor',1800000,1750000,false,17,'tender_winner','tender-b-2',280,250],
    ['cost-b-10','proj-bldg','קבלן אינסטלציה','contractor',1500000,1480000,false,17,'tender_winner','tender-b-3',275,245],
    ['cost-b-11','proj-bldg','קבלן ריצוף','contractor',1200000,1150000,false,17,'tender_winner','tender-b-4',210,180],
    ['cost-b-12','proj-bldg','קבלן אלומיניום','contractor',1100000,1060000,false,17,'tender_winner','tender-b-5',205,175],
    ['cost-b-13','proj-bldg','קבלן מעלית','contractor',800000,780000,false,17,'tender_winner','tender-b-6',230,200],
    ['cost-b-14','proj-bldg','קבלן גבס','contractor',900000,null,false,17,'tender_open','tender-b-8',80,40],
    ['cost-b-15','proj-bldg','קבלן צבע','contractor',700000,null,false,17,'tender_open','tender-b-9',75,35],
    ['cost-b-16','proj-bldg','קבלן איטום','contractor',550000,null,false,17,'draft',null,100,100],
    ['cost-b-17','proj-bldg','ספק חומרי בניין','supplier',1000000,null,false,17,'draft',null,350,350],
    ['cost-b-18','proj-bldg','ספק מטבחים','supplier',400000,null,false,17,'draft',null,200,200],
    ['cost-b-19','proj-bldg','ספק סנטריה','supplier',200000,null,false,17,'draft',null,200,200],
    ['cost-b-20','proj-bldg','ספק דלתות','supplier',150000,null,false,17,'tender_draft','tender-b-10',60,60],
  ];

  // Phase 1: Insert cost_items WITHOUT tender_id (to avoid circular FK with tenders table)
  const values = items
    .map(([id,proj,name,cat,est,act,vatInc,vatRate,status,_tender,cAgo,uAgo]) => {
      const t = cat === 'consultant' ? 'planning' : 'execution';
      return `(${uid(id)}, ${uid(proj)}, ${esc(name)}, ${esc(t)}, ${esc(cat)}, ${num(est)}, ${act !== null ? num(act) : 'NULL'}, ${bool(vatInc)}, ${num(vatRate)}, ${esc(status)}, NULL, ${daysAgo(cAgo)}, ${daysAgo(uAgo)})`;
    }).join(',\n      ');

  await exec(`
    INSERT INTO cost_items (id, project_id, name, type, category, estimated_amount, actual_amount, vat_included, vat_rate, status, tender_id, created_at, updated_at)
    VALUES ${values}
    ON CONFLICT (id) DO NOTHING;
  `);

  // Phase 2: We'll update tender_id on cost_items AFTER tenders are seeded (see seedCostItemTenderLinks)
}

async function seedCostItemTenderLinks() {
  console.log('  [5b/21] Linking cost_items -> tenders...');
  const links = [
    ['cost-v-6','tender-v-1'],['cost-v-7','tender-v-2'],['cost-v-8','tender-v-3'],
    ['cost-v-9','tender-v-4'],['cost-v-10','tender-v-5'],['cost-v-11','tender-v-6'],
    ['cost-v-12','tender-v-7'],['cost-v-13','tender-v-8'],
    ['cost-b-5','tender-b-7'],['cost-b-8','tender-b-1'],['cost-b-9','tender-b-2'],
    ['cost-b-10','tender-b-3'],['cost-b-11','tender-b-4'],['cost-b-12','tender-b-5'],
    ['cost-b-13','tender-b-6'],['cost-b-14','tender-b-8'],['cost-b-15','tender-b-9'],
    ['cost-b-20','tender-b-10'],
  ];
  for (const [costId, tenderId] of links) {
    await exec(`UPDATE cost_items SET tender_id = ${uid(tenderId)} WHERE id = ${uid(costId)};`);
  }
}

async function seedTenders() {
  console.log('  [5/21] Seeding tenders (18 records)...');

  const T = [
    {id:'tender-v-1',proj:'proj-villa',nm:'מכרז שלד',tp:'contractor',st:'WinnerSelected',pub:220,due:205,bom:220,wd:200,cands:['prof-main-1','prof-main-2','prof-main-3'],wid:'prof-main-1',wn:'משה דוד',eb:1400000,ca:1350000,ci:'cost-v-6',cr:220,up:200},
    {id:'tender-v-2',proj:'proj-villa',nm:'מכרז חשמל',tp:'electrician',st:'WinnerSelected',pub:180,due:165,bom:180,wd:160,cands:['prof-elec-1','prof-elec-2','prof-elec-3'],wid:'prof-elec-1',wn:'רוני זוהר',eb:320000,ca:310000,ci:'cost-v-7',cr:180,up:160},
    {id:'tender-v-3',proj:'proj-villa',nm:'מכרז אינסטלציה',tp:'plumber',st:'WinnerSelected',pub:175,due:160,bom:175,wd:155,cands:['prof-plumb-1','prof-plumb-2','prof-plumb-3'],wid:'prof-plumb-1',wn:'דני כהן',eb:280000,ca:275000,ci:'cost-v-8',cr:175,up:155},
    {id:'tender-v-4',proj:'proj-villa',nm:'מכרז ריצוף',tp:'contractor',st:'WinnerSelected',pub:120,due:105,bom:120,wd:100,cands:['prof-tile-1','prof-tile-2','prof-tile-3'],wid:'prof-tile-1',wn:'חסן אבו-ריש',eb:250000,ca:242000,ci:'cost-v-9',cr:120,up:100},
    {id:'tender-v-5',proj:'proj-villa',nm:'מכרז אלומיניום',tp:'contractor',st:'WinnerSelected',pub:115,due:100,bom:115,wd:95,cands:['prof-alum-1','prof-alum-2','prof-alum-3'],wid:'prof-alum-1',wn:'מוטי שגב',eb:220000,ca:215000,ci:'cost-v-10',cr:115,up:95},
    {id:'tender-v-6',proj:'proj-villa',nm:'מכרז גבס',tp:'contractor',st:'Open',pub:30,due:-15,bom:30,wd:null,cands:['prof-dry-1','prof-dry-2','prof-dry-3'],wid:null,wn:null,eb:180000,ca:null,ci:'cost-v-11',cr:60,up:30},
    {id:'tender-v-7',proj:'proj-villa',nm:'מכרז צבע',tp:'contractor',st:'Open',pub:25,due:-20,bom:25,wd:null,cands:['prof-paint-1','prof-paint-2'],wid:null,wn:null,eb:140000,ca:null,ci:'cost-v-12',cr:55,up:25},
    {id:'tender-v-8',proj:'proj-villa',nm:'מכרז איטום',tp:'contractor',st:'Draft',pub:null,due:null,bom:null,wd:null,cands:['prof-seal-1','prof-seal-2'],wid:null,wn:null,eb:110000,ca:null,ci:'cost-v-13',cr:40,up:40},
    {id:'tender-b-1',proj:'proj-bldg',nm:'מכרז שלד ראשי',tp:'contractor',st:'WinnerSelected',pub:350,due:330,bom:350,wd:320,cands:['prof-main-1','prof-main-2','prof-main-3'],wid:'prof-main-2',wn:'אחמד חסן',eb:7500000,ca:7200000,ci:'cost-b-8',cr:350,up:320},
    {id:'tender-b-2',proj:'proj-bldg',nm:'מכרז חשמל',tp:'electrician',st:'WinnerSelected',pub:280,due:260,bom:280,wd:250,cands:['prof-elec-1','prof-elec-2','prof-elec-3'],wid:'prof-elec-2',wn:'סלים נאסר',eb:1800000,ca:1750000,ci:'cost-b-9',cr:280,up:250},
    {id:'tender-b-3',proj:'proj-bldg',nm:'מכרז אינסטלציה',tp:'plumber',st:'WinnerSelected',pub:275,due:255,bom:275,wd:245,cands:['prof-plumb-1','prof-plumb-2','prof-plumb-3'],wid:'prof-plumb-2',wn:'עלי מוחמד',eb:1500000,ca:1480000,ci:'cost-b-10',cr:275,up:245},
    {id:'tender-b-4',proj:'proj-bldg',nm:'מכרז ריצוף',tp:'contractor',st:'WinnerSelected',pub:210,due:190,bom:210,wd:180,cands:['prof-tile-1','prof-tile-2','prof-tile-3'],wid:'prof-tile-2',wn:'אלי בן-חיים',eb:1200000,ca:1150000,ci:'cost-b-11',cr:210,up:180},
    {id:'tender-b-5',proj:'proj-bldg',nm:'מכרז אלומיניום',tp:'contractor',st:'WinnerSelected',pub:205,due:185,bom:205,wd:175,cands:['prof-alum-1','prof-alum-2','prof-alum-3'],wid:'prof-alum-2',wn:'ואליד חוסיין',eb:1100000,ca:1060000,ci:'cost-b-12',cr:205,up:175},
    {id:'tender-b-6',proj:'proj-bldg',nm:'מכרז מעליות',tp:'contractor',st:'WinnerSelected',pub:230,due:210,bom:230,wd:200,cands:['prof-elev-1'],wid:'prof-elev-1',wn:'אורי גלעד',eb:800000,ca:780000,ci:'cost-b-13',cr:230,up:200},
    {id:'tender-b-7',proj:'proj-bldg',nm:'מכרז יועץ קרקע',tp:'engineer',st:'WinnerSelected',pub:395,due:375,bom:395,wd:370,cands:['prof-soil-1'],wid:'prof-soil-1',wn:'ד"ר אורי נחמיאס',eb:150000,ca:145000,ci:'cost-b-5',cr:395,up:370},
    {id:'tender-b-8',proj:'proj-bldg',nm:'מכרז גבס',tp:'contractor',st:'Open',pub:40,due:-20,bom:40,wd:null,cands:['prof-dry-1','prof-dry-2','prof-dry-3'],wid:null,wn:null,eb:900000,ca:null,ci:'cost-b-14',cr:80,up:40},
    {id:'tender-b-9',proj:'proj-bldg',nm:'מכרז צבע',tp:'contractor',st:'Open',pub:35,due:-25,bom:35,wd:null,cands:['prof-paint-1','prof-paint-2','prof-paint-3'],wid:null,wn:null,eb:700000,ca:null,ci:'cost-b-15',cr:75,up:35},
    {id:'tender-b-10',proj:'proj-bldg',nm:'מכרז ספק דלתות',tp:'other',st:'Draft',pub:null,due:null,bom:null,wd:null,cands:['prof-doors-1'],wid:null,wn:null,eb:150000,ca:null,ci:'cost-b-20',cr:60,up:60},
  ];

  const values = T.map((t) => {
    const pubD = t.pub !== null ? daysAgo(t.pub) : 'NULL';
    const dueD = t.due !== null ? (t.due < 0 ? daysFromNow(Math.abs(t.due)) : daysAgo(t.due)) : 'NULL';
    const bomD = t.bom !== null ? daysAgo(t.bom) : 'NULL';
    const wdD = t.wd !== null ? daysAgo(t.wd) : 'NULL';
    return `(${uid(t.id)}, ${uid(t.proj)}, ${esc(t.nm)}, ${esc(t.tp)}, ${esc(t.st)},
      ${pubD}, ${dueD}, ${bomD}, ${wdD},
      ${uuidArray(t.cands)}, ${uid(t.wid)}, ${t.wn ? esc(t.wn) : 'NULL'},
      ${num(t.eb)}, ${t.ca !== null ? num(t.ca) : 'NULL'}, ${uid(t.ci)},
      ${daysAgo(t.cr)}, ${daysAgo(t.up)})`;
  }).join(',\n      ');

  await exec(`
    INSERT INTO tenders (id, project_id, tender_name, tender_type, status,
      publish_date, due_date, bom_sent_date, winner_selected_date,
      candidate_professional_ids, winner_professional_id, winner_professional_name,
      estimated_budget, contract_amount, cost_item_id,
      created_at, updated_at)
    VALUES ${values}
    ON CONFLICT (id) DO NOTHING;
  `);
}

async function seedTenderParticipants() {
  console.log('  [6/21] Seeding tender_participants (46 records)...');

  // [id, tender, prof, amount, winner, bomAgo, bomStatus, createdAgo]
  const P = [
    ['tp-v-1-1','tender-v-1','prof-main-1',1350000,true,220,'sent',220],
    ['tp-v-1-2','tender-v-1','prof-main-2',1420000,false,220,'sent',220],
    ['tp-v-1-3','tender-v-1','prof-main-3',1480000,false,220,'sent',220],
    ['tp-v-2-1','tender-v-2','prof-elec-1',310000,true,180,'sent',180],
    ['tp-v-2-2','tender-v-2','prof-elec-2',325000,false,180,'sent',180],
    ['tp-v-2-3','tender-v-2','prof-elec-3',345000,false,180,'sent',180],
    ['tp-v-3-1','tender-v-3','prof-plumb-1',275000,true,175,'sent',175],
    ['tp-v-3-2','tender-v-3','prof-plumb-2',290000,false,175,'sent',175],
    ['tp-v-3-3','tender-v-3','prof-plumb-3',305000,false,175,'sent',175],
    ['tp-v-4-1','tender-v-4','prof-tile-1',242000,true,120,'sent',120],
    ['tp-v-4-2','tender-v-4','prof-tile-2',260000,false,120,'sent',120],
    ['tp-v-4-3','tender-v-4','prof-tile-3',275000,false,120,'sent',120],
    ['tp-v-5-1','tender-v-5','prof-alum-1',215000,true,115,'sent',115],
    ['tp-v-5-2','tender-v-5','prof-alum-2',228000,false,115,'sent',115],
    ['tp-v-5-3','tender-v-5','prof-alum-3',240000,false,115,'sent',115],
    ['tp-v-6-1','tender-v-6','prof-dry-1',175000,false,30,'sent',30],
    ['tp-v-6-2','tender-v-6','prof-dry-2',185000,false,30,'sent',30],
    ['tp-v-6-3','tender-v-6','prof-dry-3',195000,false,30,'sent',30],
    ['tp-v-7-1','tender-v-7','prof-paint-1',135000,false,25,'sent',25],
    ['tp-v-7-2','tender-v-7','prof-paint-2',148000,false,25,'sent',25],
    ['tp-v-8-1','tender-v-8','prof-seal-1',null,false,null,'not_sent',40],
    ['tp-v-8-2','tender-v-8','prof-seal-2',null,false,null,'not_sent',40],
    ['tp-b-1-1','tender-b-1','prof-main-1',7500000,false,350,'sent',350],
    ['tp-b-1-2','tender-b-1','prof-main-2',7200000,true,350,'sent',350],
    ['tp-b-1-3','tender-b-1','prof-main-3',7800000,false,350,'sent',350],
    ['tp-b-2-1','tender-b-2','prof-elec-1',1820000,false,280,'sent',280],
    ['tp-b-2-2','tender-b-2','prof-elec-2',1750000,true,280,'sent',280],
    ['tp-b-2-3','tender-b-2','prof-elec-3',1900000,false,280,'sent',280],
    ['tp-b-3-1','tender-b-3','prof-plumb-1',1520000,false,275,'sent',275],
    ['tp-b-3-2','tender-b-3','prof-plumb-2',1480000,true,275,'sent',275],
    ['tp-b-3-3','tender-b-3','prof-plumb-3',1550000,false,275,'sent',275],
    ['tp-b-4-1','tender-b-4','prof-tile-1',1220000,false,210,'sent',210],
    ['tp-b-4-2','tender-b-4','prof-tile-2',1150000,true,210,'sent',210],
    ['tp-b-4-3','tender-b-4','prof-tile-3',1280000,false,210,'sent',210],
    ['tp-b-5-1','tender-b-5','prof-alum-1',1120000,false,205,'sent',205],
    ['tp-b-5-2','tender-b-5','prof-alum-2',1060000,true,205,'sent',205],
    ['tp-b-5-3','tender-b-5','prof-alum-3',1180000,false,205,'sent',205],
    ['tp-b-6-1','tender-b-6','prof-elev-1',780000,true,230,'sent',230],
    ['tp-b-7-1','tender-b-7','prof-soil-1',145000,true,395,'sent',395],
    ['tp-b-8-1','tender-b-8','prof-dry-1',880000,false,40,'sent',40],
    ['tp-b-8-2','tender-b-8','prof-dry-2',920000,false,40,'sent',40],
    ['tp-b-8-3','tender-b-8','prof-dry-3',950000,false,40,'sent',40],
    ['tp-b-9-1','tender-b-9','prof-paint-1',680000,false,35,'sent',35],
    ['tp-b-9-2','tender-b-9','prof-paint-2',710000,false,35,'sent',35],
    ['tp-b-9-3','tender-b-9','prof-paint-3',740000,false,35,'sent',35],
    ['tp-b-10-1','tender-b-10','prof-doors-1',null,false,null,'not_sent',60],
  ];

  const values = P
    .map(([id,tid,pid,amt,winner,bomAgo,bomSt,cAgo]) =>
      `(${uid(id)}, ${uid(tid)}, ${uid(pid)}, ${amt !== null ? num(amt) : 'NULL'}, ${bool(winner)}, ${bomAgo !== null ? daysAgo(bomAgo) : 'NULL'}, ${esc(bomSt)}, ${daysAgo(cAgo)})`
    ).join(',\n      ');

  await exec(`
    INSERT INTO tender_participants (id, tender_id, professional_id, total_amount, is_winner, bom_sent_date, bom_sent_status, created_at)
    VALUES ${values}
    ON CONFLICT (id) DO NOTHING;
  `);
}

async function seedBudgets() {
  console.log('  [7/21] Seeding budgets (2 records)...');
  await exec(`
    INSERT INTO budgets (id, project_id, planned_budget, actual_budget, status, created_at, updated_at)
    VALUES
      (${uid('budget-v')}, ${uid('proj-villa')}, 4000000, 2392000, 'On Track', ${daysAgo(300)}, ${daysAgo(30)}),
      (${uid('budget-b')}, ${uid('proj-bldg')}, 20000000, 13565000, 'On Track', ${daysAgo(400)}, ${daysAgo(30)})
    ON CONFLICT (id) DO NOTHING;
  `);
}

async function seedBudgetCategories() {
  console.log('  [8/21] Seeding budget_categories (6 records)...');
  const rows = [
    ['cat-v-1','proj-villa','יועצים','consultants','School','blue',1,300],
    ['cat-v-2','proj-villa','קבלנים','contractors','Engineering','orange',2,300],
    ['cat-v-3','proj-villa','ספקים','suppliers','LocalShipping','green',3,300],
    ['cat-b-1','proj-bldg','יועצים','consultants','School','blue',1,400],
    ['cat-b-2','proj-bldg','קבלנים','contractors','Engineering','orange',2,400],
    ['cat-b-3','proj-bldg','ספקים','suppliers','LocalShipping','green',3,400],
  ];
  const values = rows.map(([id,proj,name,type,icon,color,order,ago]) =>
    `(${uid(id)}, ${uid(proj)}, ${esc(name)}, ${esc(type)}, ${esc(icon)}, ${esc(color)}, ${num(order)}, ${daysAgo(ago)}, ${daysAgo(ago)})`
  ).join(',\n      ');
  await exec(`INSERT INTO budget_categories (id, project_id, name, type, icon, color, "order", created_at, updated_at) VALUES ${values} ON CONFLICT (id) DO NOTHING;`);
}

async function seedBudgetChapters() {
  console.log('  [9/21] Seeding budget_chapters (14 records)...');
  const rows = [
    ['ch-v-1','proj-villa','cat-v-1','01','אדריכלות',360000,null,1,300,300],
    ['ch-v-2','proj-villa','cat-v-1','02','הנדסה ויועצים',200000,null,2,300,300],
    ['ch-v-3','proj-villa','cat-v-2','03','עבודות שלד ומבנה',1510000,1350000,3,300,200],
    ['ch-v-4','proj-villa','cat-v-2','04','מערכות חשמל ואינסטלציה',600000,585000,4,300,155],
    ['ch-v-5','proj-villa','cat-v-2','05','גמרים',870000,457000,5,300,95],
    ['ch-v-6','proj-villa','cat-v-3','06','ספקים',460000,null,6,300,300],
    ['ch-b-1','proj-bldg','cat-b-1','01','אדריכלות',1150000,null,1,400,400],
    ['ch-b-2','proj-bldg','cat-b-1','02','הנדסה',700000,null,2,400,400],
    ['ch-b-3','proj-bldg','cat-b-1','03','יועצים',350000,145000,3,400,370],
    ['ch-b-4','proj-bldg','cat-b-2','04','עבודות שלד',7500000,7200000,4,400,320],
    ['ch-b-5','proj-bldg','cat-b-2','05','מערכות',3300000,3230000,5,400,245],
    ['ch-b-6','proj-bldg','cat-b-2','06','חיפויים וגמרים',3900000,2210000,6,400,175],
    ['ch-b-7','proj-bldg','cat-b-2','07','עבודות מיוחדות',1350000,780000,7,400,200],
    ['ch-b-8','proj-bldg','cat-b-3','08','ספקים',1750000,null,8,400,400],
  ];
  const values = rows.map(([id,proj,cat,code,name,budget,contract,order,cAgo,uAgo]) =>
    `(${uid(id)}, ${uid(proj)}, ${uid(cat)}, ${esc(code)}, ${esc(name)}, ${num(budget)}, ${contract !== null ? num(contract) : 'NULL'}, ${num(order)}, ${daysAgo(cAgo)}, ${daysAgo(uAgo)})`
  ).join(',\n      ');
  await exec(`INSERT INTO budget_chapters (id, project_id, category_id, code, name, budget_amount, contract_amount, "order", created_at, updated_at) VALUES ${values} ON CONFLICT (id) DO NOTHING;`);
}

async function seedBudgetItems() {
  console.log('  [10/21] Seeding budget_items (20 records)...');
  // [id,proj,ch,code,desc,unit,qty,uprice,total,vr,va,tvat,status,supp,suppNm,tender,paid,order,cAgo,uAgo]
  const rows = [
    ['bi-v-1','proj-villa','ch-v-3','3.1','עבודות שלד בטון','קומפלט',1,800000,800000,0.17,136000,936000,'contracted','prof-main-1','משה דוד','tender-v-1',800000,1,200,60],
    ['bi-v-2','proj-villa','ch-v-3','3.2','עבודות טפסנות','קומפלט',1,550000,550000,0.17,93500,643500,'contracted','prof-main-1','משה דוד','tender-v-1',550000,2,200,60],
    ['bi-v-3','proj-villa','ch-v-4','4.1','חשמל כללי','קומפלט',1,310000,310000,0.17,52700,362700,'in-progress','prof-elec-1','רוני זוהר','tender-v-2',200000,3,160,30],
    ['bi-v-4','proj-villa','ch-v-4','4.2','אינסטלציה כללי','קומפלט',1,275000,275000,0.17,46750,321750,'in-progress','prof-plumb-1','דני כהן','tender-v-3',80000,4,155,30],
    ['bi-v-5','proj-villa','ch-v-5','5.1','ריצוף אריחים','מ"ר',350,691,242000,0.17,41140,283140,'tender','prof-tile-1','חסן אבו-ריש','tender-v-4',0,5,100,100],
    ['bi-v-6','proj-villa','ch-v-5','5.2','אלומיניום חלונות ודלתות','קומפלט',1,215000,215000,0.17,36550,251550,'tender','prof-alum-1','מוטי שגב','tender-v-5',0,6,95,95],
    ['bi-v-7','proj-villa','ch-v-6','6.1','מטבח','קומפלט',1,180000,180000,0.17,30600,210600,'pending',null,null,null,0,7,300,300],
    ['bi-v-8','proj-villa','ch-v-6','6.2','חומרי בניין','קומפלט',1,200000,200000,0.17,34000,234000,'pending',null,null,null,0,8,300,300],
    ['bi-b-1','proj-bldg','ch-b-4','4.1','שלד בניינים 1-2','קומפלט',1,3600000,3600000,0.17,612000,4212000,'completed','prof-main-2','אחמד חסן','tender-b-1',3600000,1,320,120],
    ['bi-b-2','proj-bldg','ch-b-4','4.2','שלד בניינים 3-4','קומפלט',1,3600000,3600000,0.17,612000,4212000,'in-progress','prof-main-2','אחמד חסן','tender-b-1',2000000,2,320,30],
    ['bi-b-3','proj-bldg','ch-b-5','5.1','חשמל בניינים 1-2','קומפלט',1,900000,900000,0.17,153000,1053000,'in-progress','prof-elec-2','סלים נאסר','tender-b-2',600000,3,250,30],
    ['bi-b-4','proj-bldg','ch-b-5','5.2','חשמל בניינים 3-4','קומפלט',1,850000,850000,0.17,144500,994500,'tender','prof-elec-2','סלים נאסר','tender-b-2',0,4,250,250],
    ['bi-b-5','proj-bldg','ch-b-5','5.3','אינסטלציה כללי','קומפלט',1,1480000,1480000,0.17,251600,1731600,'in-progress','prof-plumb-2','עלי מוחמד','tender-b-3',500000,5,245,30],
    ['bi-b-6','proj-bldg','ch-b-6','6.1','ריצוף בניינים 1-2','מ"ר',2400,250,600000,0.17,102000,702000,'in-progress','prof-tile-2','אלי בן-חיים','tender-b-4',200000,6,180,30],
    ['bi-b-7','proj-bldg','ch-b-6','6.2','ריצוף בניינים 3-4','מ"ר',2400,229,550000,0.17,93500,643500,'pending','prof-tile-2','אלי בן-חיים','tender-b-4',0,7,180,180],
    ['bi-b-8','proj-bldg','ch-b-6','6.3','אלומיניום','קומפלט',1,1060000,1060000,0.17,180200,1240200,'tender','prof-alum-2','ואליד חוסיין','tender-b-5',0,8,175,175],
    ['bi-b-9','proj-bldg','ch-b-7','7.1','מעליות','יחידות',4,195000,780000,0.17,132600,912600,'in-progress','prof-elev-1','אורי גלעד','tender-b-6',200000,9,200,30],
    ['bi-b-10','proj-bldg','ch-b-7','7.2','איטום','קומפלט',1,550000,550000,0.17,93500,643500,'pending',null,null,null,0,10,400,400],
    ['bi-b-11','proj-bldg','ch-b-8','8.1','חומרי בניין','קומפלט',1,1000000,1000000,0.17,170000,1170000,'pending',null,null,null,0,11,400,400],
    ['bi-b-12','proj-bldg','ch-b-8','8.2','מטבחים','יחידות',80,5000,400000,0.17,68000,468000,'pending',null,null,null,0,12,400,400],
  ];
  const values = rows.map(([id,proj,ch,code,desc,unit,qty,up,tp,vr,va,tvat,st,supp,sn,tid,paid,ord,cA,uA]) =>
    `(${uid(id)},${uid(proj)},${uid(ch)},${esc(code)},${esc(desc)},${esc(unit)},${num(qty)},${num(up)},${num(tp)},${num(vr)},${num(va)},${num(tvat)},${esc(st)},${uid(supp)},${sn?esc(sn):'NULL'},${uid(tid)},${num(paid)},${num(ord)},${daysAgo(cA)},${daysAgo(uA)})`
  ).join(',\n      ');
  await exec(`INSERT INTO budget_items (id,project_id,chapter_id,code,description,unit,quantity,unit_price,total_price,vat_rate,vat_amount,total_with_vat,status,supplier_id,supplier_name,tender_id,paid_amount,"order",created_at,updated_at) VALUES ${values} ON CONFLICT (id) DO NOTHING;`);
}

async function seedBudgetPayments() {
  console.log('  [11/21] Seeding budget_payments (16 records)...');
  const rows = [
    ['bp-v-1','bi-v-1','חשבון חלקי 1 - שלד',140,400000,68000,468000,'paid',130,140,130],
    ['bp-v-2','bi-v-1','חשבון חלקי 2 - שלד',80,400000,68000,468000,'paid',70,80,70],
    ['bp-v-3','bi-v-3','חשבון חלקי 1 - חשמל',60,100000,17000,117000,'paid',50,60,50],
    ['bp-v-4','bi-v-3','חשבון חלקי 2 - חשמל',20,100000,17000,117000,'approved',null,20,10],
    ['bp-v-5','bi-v-4','חשבון חלקי 1 - אינסטלציה',45,80000,13600,93600,'paid',35,45,35],
    ['bp-v-6','bi-v-5','מקדמה - ריצוף',10,50000,8500,58500,'pending',null,10,10],
    ['bp-b-1','bi-b-1','חשבון 1 - שלד 1-2',280,1200000,204000,1404000,'paid',270,280,270],
    ['bp-b-2','bi-b-1','חשבון 2 - שלד 1-2',220,1200000,204000,1404000,'paid',210,220,210],
    ['bp-b-3','bi-b-1','חשבון 3 - שלד 1-2',150,1200000,204000,1404000,'paid',140,150,140],
    ['bp-b-4','bi-b-2','חשבון 1 - שלד 3-4',100,1000000,170000,1170000,'paid',90,100,90],
    ['bp-b-5','bi-b-2','חשבון 2 - שלד 3-4',40,1000000,170000,1170000,'approved',null,40,20],
    ['bp-b-6','bi-b-3','חשבון 1 - חשמל',120,300000,51000,351000,'paid',110,120,110],
    ['bp-b-7','bi-b-3','חשבון 2 - חשמל',50,300000,51000,351000,'approved',null,50,30],
    ['bp-b-8','bi-b-5','חשבון 1 - אינסטלציה',100,500000,85000,585000,'paid',90,100,90],
    ['bp-b-9','bi-b-6','חשבון 1 - ריצוף',60,200000,34000,234000,'paid',50,60,50],
    ['bp-b-10','bi-b-9','מקדמה - מעלית',30,200000,34000,234000,'pending',null,30,30],
  ];
  const values = rows.map(([id,item,inv,invAgo,amt,va,ta,st,payAgo,cAgo,uAgo]) =>
    `(${uid(id)},${uid(item)},${esc(inv)},${daysAgo(invAgo)},${num(amt)},${num(va)},${num(ta)},${esc(st)},${payAgo!==null?daysAgo(payAgo):'NULL'},${daysAgo(cAgo)},${daysAgo(uAgo)})`
  ).join(',\n      ');
  await exec(`INSERT INTO budget_payments (id,budget_item_id,invoice_number,invoice_date,amount,vat_amount,total_amount,status,payment_date,created_at,updated_at) VALUES ${values} ON CONFLICT (id) DO NOTHING;`);
}

async function seedProjectUnits() {
  console.log('  [12/21] Seeding project_units (8 records)...');
  const rows = [
    ['unit-v-1','proj-villa','קומה א + מרתף','apartment','blue','Home',1,300],
    ['unit-v-2','proj-villa','קומה ב + גג + חצר','apartment','green','Roofing',2,300],
    ['unit-b-1','proj-bldg','בניין 1','building','blue','Apartment',1,400],
    ['unit-b-2','proj-bldg','בניין 2','building','green','Apartment',2,400],
    ['unit-b-3','proj-bldg','בניין 3','building','purple','Apartment',3,400],
    ['unit-b-4','proj-bldg','בניין 4','building','amber','Apartment',4,400],
    ['unit-b-5','proj-bldg','חניון','common','blue','LocalParking',5,400],
    ['unit-b-6','proj-bldg','שטחים משותפים','common','green','Park',6,400],
  ];
  const values = rows.map(([id,proj,name,type,color,icon,order,ago]) =>
    `(${uid(id)},${uid(proj)},${esc(name)},${esc(type)},${esc(color)},${esc(icon)},${num(order)},${daysAgo(ago)},${daysAgo(ago)})`
  ).join(',\n      ');
  await exec(`INSERT INTO project_units (id,project_id,name,type,color,icon,"order",created_at,updated_at) VALUES ${values} ON CONFLICT (id) DO NOTHING;`);
}

async function seedProjectMilestones() {
  console.log('  [13/21] Seeding project_milestones (14 records)...');
  // [id,proj,unit,name,dateAgoOrFrom,status,phase,order,cAgo,uAgo]
  const rows = [
    ['ms-v-1','proj-villa','unit-v-1','יציקת יסודות',150,null,'completed','שלד',1,300,150],
    ['ms-v-2','proj-villa','unit-v-1','סיום שלד',60,null,'completed','שלד',2,300,60],
    ['ms-v-3','proj-villa','unit-v-1','עבודות חשמל ואינסטלציה',20,null,'in-progress','חשמל',3,300,20],
    ['ms-v-4','proj-villa','unit-v-2','ריצוף וחיפוי',null,30,'in-progress','ריצוף',4,300,10],
    ['ms-v-5','proj-villa','unit-v-2','גמרים',null,120,'pending','גמר',5,300,300],
    ['ms-v-6','proj-villa','unit-v-2','מסירה',null,240,'pending','גמר',6,300,300],
    ['ms-b-1','proj-bldg','unit-b-1','חפירה ויסודות',250,null,'completed','שלד',1,400,250],
    ['ms-b-2','proj-bldg','unit-b-1','שלד בניינים 1-2',120,null,'completed','שלד',2,400,120],
    ['ms-b-3','proj-bldg','unit-b-5','תשתיות חשמל ומים',90,null,'completed','חשמל',3,400,90],
    ['ms-b-4','proj-bldg','unit-b-3','שלד בניינים 3-4',30,null,'in-progress','שלד',4,400,30],
    ['ms-b-5','proj-bldg','unit-b-1','טיח וריצוף בניינים 1-2',null,30,'in-progress','ריצוף',5,400,10],
    ['ms-b-6','proj-bldg','unit-b-1','מעליות',null,60,'in-progress','מעלית',6,400,10],
    ['ms-b-7','proj-bldg','unit-b-1','גמרים',null,180,'pending','גמר',7,400,400],
    ['ms-b-8','proj-bldg','unit-b-1','מסירה לדיירים',null,360,'pending','גמר',8,400,400],
  ];
  const values = rows.map(([id,proj,unit,name,ago,from,status,phase,order,cAgo,uAgo]) => {
    const dateExpr = ago !== null ? daysAgo(ago) : daysFromNow(from);
    return `(${uid(id)},${uid(proj)},${uid(unit)},${esc(name)},${dateExpr},${esc(status)},${esc(phase)},${num(order)},${daysAgo(cAgo)},${daysAgo(uAgo)})`;
  }).join(',\n      ');
  await exec(`INSERT INTO project_milestones (id,project_id,unit_id,name,date,status,phase,"order",created_at,updated_at) VALUES ${values} ON CONFLICT (id) DO NOTHING;`);
}

async function seedGanttTasks() {
  console.log('  [14/21] Seeding gantt_tasks (10 records)...');
  // [id,proj,ms,name,sAgo,sFrom,eAgo,eFrom,dur,status,pri,prog,assignId,resName,preds,type,order,cAgo,uAgo]
  const rows = [
    ['gantt-v-1','proj-villa','ms-v-1','טפסנות וזיון יסודות',180,null,155,null,'25 ימים','completed','high',100,'prof-main-1','משה דוד',null,'other',1,300,155],
    ['gantt-v-2','proj-villa','ms-v-2','יציקת שלד',150,null,65,null,'85 ימים','completed','high',100,'prof-main-1','משה דוד',['gantt-v-1'],'other',2,300,65],
    ['gantt-v-3','proj-villa','ms-v-3','חיווט חשמל',55,null,null,10,'65 ימים','in-progress','high',60,'prof-elec-1','רוני זוהר',['gantt-v-2'],'חשמל',3,300,5],
    ['gantt-v-4','proj-villa','ms-v-3','צנרת אינסטלציה',50,null,null,15,'65 ימים','in-progress','high',55,'prof-plumb-1','דני כהן',['gantt-v-2'],'אינסטלציה',4,300,5],
    ['gantt-b-1','proj-bldg','ms-b-1','חפירת יסודות',340,null,260,null,'80 ימים','completed','high',100,'prof-main-2','אחמד חסן',null,'other',1,400,260],
    ['gantt-b-2','proj-bldg','ms-b-2','שלד בניין 1',250,null,150,null,'100 ימים','completed','high',100,'prof-main-2','אחמד חסן',['gantt-b-1'],'other',2,400,150],
    ['gantt-b-3','proj-bldg','ms-b-2','שלד בניין 2',230,null,130,null,'100 ימים','completed','high',100,'prof-main-2','אחמד חסן',['gantt-b-1'],'other',3,400,130],
    ['gantt-b-4','proj-bldg','ms-b-4','שלד בניין 3',120,null,null,10,'130 ימים','in-progress','high',70,'prof-main-2','אחמד חסן',null,'other',4,400,5],
    ['gantt-b-5','proj-bldg','ms-b-4','שלד בניין 4',60,null,null,70,'130 ימים','in-progress','high',30,'prof-main-2','אחמד חסן',null,'other',5,400,5],
    ['gantt-b-6','proj-bldg','ms-b-6','התקנת מעלית בניין 1',30,null,null,60,'90 ימים','in-progress','medium',20,'prof-elev-1','אורי גלעד',null,'מעלית',6,400,5],
  ];
  const values = rows.map(([id,proj,ms,name,sAgo,sFrom,eAgo,eFrom,dur,st,pri,prog,aid,rn,preds,type,ord,cAgo,uAgo]) => {
    const s = sAgo !== null ? daysAgo(sAgo) : daysFromNow(sFrom);
    const e = eAgo !== null ? daysAgo(eAgo) : daysFromNow(eFrom);
    const p = preds ? uuidArray(preds) : 'NULL';
    return `(${uid(id)},${uid(proj)},${uid(ms)},${esc(name)},${s},${e},${esc(dur)},${esc(st)},${esc(pri)},${num(prog)},${uid(aid)},${esc(rn)},${p},${esc(type)},${num(ord)},${daysAgo(cAgo)},${daysAgo(uAgo)})`;
  }).join(',\n      ');
  await exec(`INSERT INTO gantt_tasks (id,project_id,milestone_id,name,start_date,end_date,duration,status,priority,progress,assigned_to_id,resource_name,predecessors,type,"order",created_at,updated_at) VALUES ${values} ON CONFLICT (id) DO NOTHING;`);
}

async function seedTasks() {
  console.log('  [15/21] Seeding tasks (10 records)...');
  // [id,proj,title,status,pri,assignee,dueAgo,dueFrom,compAgo,pct,cAgo,uAgo]
  const rows = [
    ['task-v-1','proj-villa','בדיקת איטום גג','Done','High','ניר אלבז',30,null,28,100,60,28],
    ['task-v-2','proj-villa','הזמנת אריחים מרצפות','In Progress','High','חסן אבו-ריש',null,14,null,40,20,3],
    ['task-v-3','proj-villa','אישור תוכניות חשמל','In Progress','Medium','רוני זוהר',null,7,null,70,30,5],
    ['task-v-4','proj-villa','תיאום מטבח מול ספק','Ready','Medium','רונית שמעוני',null,45,null,0,10,10],
    ['task-b-1','proj-bldg','אישור תוכניות שלד בניין 3','Done','High','יוסי חדד',45,null,42,100,90,42],
    ['task-b-2','proj-bldg','הזמנת ברזל לבניין 4','In Progress','High','אחמד חסן',null,10,null,60,30,3],
    ['task-b-3','proj-bldg','תיאום חיבור חשמל ארעי','In Progress','Medium','סלים נאסר',null,21,null,30,15,5],
    ['task-b-4','proj-bldg','בדיקת לחץ מים','Ready','High','עלי מוחמד',null,14,null,0,10,10],
    ['task-b-5','proj-bldg','הגשת בקשה לטופס 4','Backlog','Medium',null,null,300,null,0,30,30],
    ['task-b-6','proj-bldg','סקר בטיחות חניון','In Progress','High','רונן שפר',null,7,null,50,20,3],
  ];
  const values = rows.map(([id,proj,title,st,pri,asn,dAgo,dFrom,compAgo,pct,cAgo,uAgo]) => {
    const due = dAgo !== null ? daysAgo(dAgo) : daysFromNow(dFrom);
    const comp = compAgo !== null ? daysAgo(compAgo) : 'NULL';
    return `(${uid(id)},${uid(proj)},${esc(title)},${esc(st)},${esc(pri)},${asn?esc(asn):'NULL'},${due},${comp},${num(pct)},${daysAgo(cAgo)},${daysAgo(uAgo)})`;
  }).join(',\n      ');
  await exec(`INSERT INTO tasks (id,project_id,title,status,priority,assignee_name,due_date,completed_at,percent_complete,created_at,updated_at) VALUES ${values} ON CONFLICT (id) DO NOTHING;`);
}

async function seedFiles() {
  console.log('  [16/21] Seeding files (5 records)...');
  const rows = [
    ['file-v-1','תוכנית אדריכלית - וילה.pdf','/files/villa-arch-plan.pdf',5242880,'5 MB','application/pdf','תוכנית אדריכלית מלאה','Project','proj-villa','וילה פרטית - הרצליה פיטוח',280,"אדר' יעל שפירא",280],
    ['file-v-2','חוזה קבלן שלד.pdf','/files/villa-skeleton-contract.pdf',2097152,'2 MB','application/pdf','חוזה עם קבלן שלד','Tender','tender-v-1','מכרז שלד',198,'דוד אברהם',198],
    ['file-b-1','תוכנית מתחם.pdf','/files/bldg-complex-plan.pdf',10485760,'10 MB','application/pdf','תוכנית מתחם מגורים מלאה','Project','proj-bldg','מתחם מגורים - פארק הים',380,"אדר' רון מזרחי",380],
    ['file-b-2','דו"ח קרקע.pdf','/files/bldg-soil-report.pdf',3145728,'3 MB','application/pdf','דו"ח בדיקת קרקע','Project','proj-bldg','מתחם מגורים - פארק הים',370,'ד"ר אורי נחמיאס',370],
    ['file-b-3','הצעת מחיר שלד.pdf','/files/bldg-skeleton-quote.pdf',1048576,'1 MB','application/pdf','הצעת מחיר קבלן שלד','Tender','tender-b-1','מכרז שלד ראשי',335,'אחמד חסן',335],
  ];
  const values = rows.map(([id,fn,url,sz,szd,ft,desc,ety,eid,enm,ago,by,cAgo]) =>
    `(${uid(id)},${esc(fn)},${esc(url)},${num(sz)},${esc(szd)},${esc(ft)},${esc(desc)},${esc(ety)},${uid(eid)},${esc(enm)},${daysAgo(ago)},${esc(by)},${daysAgo(cAgo)},${daysAgo(cAgo)})`
  ).join(',\n      ');
  await exec(`INSERT INTO files (id,file_name,file_url,file_size,file_size_display,file_type,description_short,related_entity_type,related_entity_id,related_entity_name,uploaded_at,uploaded_by,created_at,updated_at) VALUES ${values} ON CONFLICT (id) DO NOTHING;`);
}

async function seedSpecialIssues() {
  console.log('  [17/21] Seeding special_issues (5 records)...');
  const rows = [
    ['issue-v-1','proj-villa',45,'סדק בקיר מרתף - נדרשת בדיקת מהנדס','resolved','high','safety','אבי גולדשטיין','נבדק ע"י מהנדס קונסטרוקציה, תוקן באמצעות הזרקת אפוקסי',45,30],
    ['issue-v-2','proj-villa',10,'עיכוב באספקת אלומיניום - הספק מאחר 3 שבועות','open','medium','schedule','מוטי שגב',null,10,10],
    ['issue-b-1','proj-bldg',25,'בעיית ניקוז בחניון תת-קרקעי','in_progress','high','quality','עלי מוחמד',null,25,5],
    ['issue-b-2','proj-bldg',60,'חריגה תקציבית של 8% בעבודות ברזל','resolved','medium','budget','אחמד חסן','הוסכם על קיזוז מחשבונות עתידיים',60,40],
    ['issue-b-3','proj-bldg',15,'רעש מנופים - תלונות מדיירי שכונה סמוכה','open','low','other','רונן שפר',null,15,15],
  ];
  const values = rows.map(([id,proj,dAgo,desc,st,pri,cat,resp,res,cAgo,uAgo]) =>
    `(${uid(id)},${uid(proj)},${daysAgo(dAgo)},${esc(desc)},${esc(st)},${esc(pri)},${esc(cat)},${esc(resp)},${res?esc(res):'NULL'},${daysAgo(cAgo)},${daysAgo(uAgo)})`
  ).join(',\n      ');
  await exec(`INSERT INTO special_issues (id,project_id,date,description,status,priority,category,responsible,resolution,created_at,updated_at) VALUES ${values} ON CONFLICT (id) DO NOTHING;`);
}

async function seedPlanningChanges() {
  console.log('  [18/21] Seeding planning_changes (3 records)...');
  const rows = [
    ['pc-v-1','proj-villa',1,'שינוי מיקום מטבח לפי בקשת לקוח - העברה לצד מערבי','עיכוב של שבוע בעבודות אינסטלציה',15000,'approved',80,75],
    ['pc-b-1','proj-bldg',1,'הוספת חדר אשפה לבניין 2','ללא השפעה על לו"ז',45000,'approved',100,90],
    ['pc-b-2','proj-bldg',2,'שינוי חיפוי חזיתות בניין 1 מאבן לקומפוזיט','עיכוב אפשרי של חודש',120000,'pending',20,20],
  ];
  const values = rows.map(([id,proj,cn,desc,si,bi,dec,cAgo,uAgo]) =>
    `(${uid(id)},${uid(proj)},${num(cn)},${esc(desc)},${esc(si)},${num(bi)},${esc(dec)},${daysAgo(cAgo)},${daysAgo(uAgo)})`
  ).join(',\n      ');
  await exec(`INSERT INTO planning_changes (id,project_id,change_number,description,schedule_impact,budget_impact,decision,created_at,updated_at) VALUES ${values} ON CONFLICT (id) DO NOTHING;`);
}

async function seedPaymentSchedules() {
  console.log('  [19/21] Seeding payment_schedules (9 records)...');
  const rows = [
    ['ps-v-1','cost-v-6','proj-villa',1350000,'active',200],
    ['ps-v-2','cost-v-7','proj-villa',310000,'active',160],
    ['ps-v-3','cost-v-8','proj-villa',275000,'active',155],
    ['ps-v-4','cost-v-9','proj-villa',242000,'active',100],
    ['ps-b-1','cost-b-8','proj-bldg',7200000,'active',320],
    ['ps-b-2','cost-b-9','proj-bldg',1750000,'active',250],
    ['ps-b-3','cost-b-10','proj-bldg',1480000,'active',245],
    ['ps-b-4','cost-b-11','proj-bldg',1150000,'active',180],
    ['ps-b-5','cost-b-13','proj-bldg',780000,'active',200],
  ];
  const values = rows.map(([id,ci,proj,amt,st,ago]) =>
    `(${uid(id)},${uid(ci)},${uid(proj)},${num(amt)},${esc(st)},${daysAgo(ago)},${daysAgo(ago)})`
  ).join(',\n      ');
  await exec(`INSERT INTO payment_schedules (id,cost_item_id,project_id,total_amount,status,created_at,updated_at) VALUES ${values} ON CONFLICT (id) DO NOTHING;`);
}

async function seedScheduleItems() {
  console.log('  [20/21] Seeding schedule_items (27 records)...');
  const items = [
    {id:'si-v-1',sch:'ps-v-1',ci:'cost-v-6',pj:'proj-villa',d:'מקדמה 30%',a:405000,p:30,ms:'ms-v-1',mn:'יציקת יסודות',tAgo:190,o:1,s:'paid',pd:185,pa:405000,cA:200,uA:185},
    {id:'si-v-2',sch:'ps-v-1',ci:'cost-v-6',pj:'proj-villa',d:'סיום שלד 50%',a:675000,p:50,ms:'ms-v-2',mn:'סיום שלד',tAgo:65,o:2,s:'paid',pd:58,pa:675000,cA:200,uA:58},
    {id:'si-v-3',sch:'ps-v-1',ci:'cost-v-6',pj:'proj-villa',d:'גמר 20%',a:270000,p:20,ms:null,mn:null,tFrom:120,o:3,s:'pending',cA:200,uA:200},
    {id:'si-v-4',sch:'ps-v-2',ci:'cost-v-7',pj:'proj-villa',d:'מקדמה 20%',a:62000,p:20,ms:null,mn:null,tAgo:150,o:1,s:'paid',pd:148,pa:62000,cA:160,uA:148},
    {id:'si-v-5',sch:'ps-v-2',ci:'cost-v-7',pj:'proj-villa',d:'שלב א 40%',a:124000,p:40,ms:'ms-v-3',mn:'עבודות חשמל',tAgo:10,o:2,s:'milestone_confirmed',cb:'מנהל פרויקט',ca:8,cA:160,uA:8},
    {id:'si-v-6',sch:'ps-v-2',ci:'cost-v-7',pj:'proj-villa',d:'סיום 40%',a:124000,p:40,ms:null,mn:null,tFrom:30,o:3,s:'pending',cA:160,uA:160},
    {id:'si-v-7',sch:'ps-v-3',ci:'cost-v-8',pj:'proj-villa',d:'מקדמה 20%',a:55000,p:20,ms:null,mn:null,tAgo:145,o:1,s:'paid',pd:142,pa:55000,cA:155,uA:142},
    {id:'si-v-8',sch:'ps-v-3',ci:'cost-v-8',pj:'proj-villa',d:'שלב א 50%',a:137500,p:50,ms:null,mn:null,tAgo:5,o:2,s:'invoice_received',cA:155,uA:5},
    {id:'si-v-9',sch:'ps-v-3',ci:'cost-v-8',pj:'proj-villa',d:'גמר 30%',a:82500,p:30,ms:null,mn:null,tFrom:45,o:3,s:'pending',cA:155,uA:155},
    {id:'si-v-10',sch:'ps-v-4',ci:'cost-v-9',pj:'proj-villa',d:'מקדמה 30%',a:72600,p:30,ms:null,mn:null,tAgo:90,o:1,s:'approved',ab:'מנהל',aa:88,cA:100,uA:88},
    {id:'si-v-11',sch:'ps-v-4',ci:'cost-v-9',pj:'proj-villa',d:'חומרים 40%',a:96800,p:40,ms:null,mn:null,tFrom:20,o:2,s:'pending',cA:100,uA:100},
    {id:'si-v-12',sch:'ps-v-4',ci:'cost-v-9',pj:'proj-villa',d:'סיום 30%',a:72600,p:30,ms:null,mn:null,tFrom:60,o:3,s:'pending',cA:100,uA:100},
    {id:'si-b-1',sch:'ps-b-1',ci:'cost-b-8',pj:'proj-bldg',d:'מקדמה 10%',a:720000,p:10,ms:null,mn:null,tAgo:310,o:1,s:'paid',pd:305,pa:720000,cA:320,uA:305},
    {id:'si-b-2',sch:'ps-b-1',ci:'cost-b-8',pj:'proj-bldg',d:'שלד בניינים 1-2 40%',a:2880000,p:40,ms:'ms-b-2',mn:'שלד בניינים 1-2',tAgo:125,o:2,s:'paid',pd:118,pa:2880000,cA:320,uA:118},
    {id:'si-b-3',sch:'ps-b-1',ci:'cost-b-8',pj:'proj-bldg',d:'שלד בניינים 3-4 30%',a:2160000,p:30,ms:'ms-b-4',mn:'שלד בניינים 3-4',tFrom:30,o:3,s:'milestone_confirmed',cb:'מפקח',ca:5,cA:320,uA:5},
    {id:'si-b-4',sch:'ps-b-1',ci:'cost-b-8',pj:'proj-bldg',d:'סיום שלד 20%',a:1440000,p:20,ms:null,mn:null,tFrom:90,o:4,s:'pending',cA:320,uA:320},
    {id:'si-b-5',sch:'ps-b-2',ci:'cost-b-9',pj:'proj-bldg',d:'מקדמה 15%',a:262500,p:15,ms:null,mn:null,tAgo:240,o:1,s:'paid',pd:235,pa:262500,cA:250,uA:235},
    {id:'si-b-6',sch:'ps-b-2',ci:'cost-b-9',pj:'proj-bldg',d:'שלב א - בניינים 1-2 30%',a:525000,p:30,ms:null,mn:null,tAgo:20,o:2,s:'invoice_received',cA:250,uA:20},
    {id:'si-b-7',sch:'ps-b-2',ci:'cost-b-9',pj:'proj-bldg',d:'שלב ב 30%',a:525000,p:30,ms:null,mn:null,tFrom:60,o:3,s:'pending',cA:250,uA:250},
    {id:'si-b-8',sch:'ps-b-2',ci:'cost-b-9',pj:'proj-bldg',d:'סיום 25%',a:437500,p:25,ms:null,mn:null,tFrom:150,o:4,s:'pending',cA:250,uA:250},
    {id:'si-b-9',sch:'ps-b-3',ci:'cost-b-10',pj:'proj-bldg',d:'מקדמה 15%',a:222000,p:15,ms:null,mn:null,tAgo:235,o:1,s:'paid',pd:230,pa:222000,cA:245,uA:230},
    {id:'si-b-10',sch:'ps-b-3',ci:'cost-b-10',pj:'proj-bldg',d:'שלב א 35%',a:518000,p:35,ms:null,mn:null,tAgo:30,o:2,s:'approved',ab:'מנהל פרויקט',aa:25,cA:245,uA:25},
    {id:'si-b-11',sch:'ps-b-3',ci:'cost-b-10',pj:'proj-bldg',d:'שלב ב 30%',a:444000,p:30,ms:null,mn:null,tFrom:60,o:3,s:'pending',cA:245,uA:245},
    {id:'si-b-12',sch:'ps-b-3',ci:'cost-b-10',pj:'proj-bldg',d:'סיום 20%',a:296000,p:20,ms:null,mn:null,tFrom:150,o:4,s:'pending',cA:245,uA:245},
    {id:'si-b-13',sch:'ps-b-4',ci:'cost-b-11',pj:'proj-bldg',d:'מקדמה 20%',a:230000,p:20,ms:null,mn:null,tAgo:170,o:1,s:'paid',pd:165,pa:230000,cA:180,uA:165},
    {id:'si-b-14',sch:'ps-b-4',ci:'cost-b-11',pj:'proj-bldg',d:'חומרים 40%',a:460000,p:40,ms:null,mn:null,tFrom:20,o:2,s:'pending',cA:180,uA:180},
    {id:'si-b-15',sch:'ps-b-4',ci:'cost-b-11',pj:'proj-bldg',d:'סיום 40%',a:460000,p:40,ms:null,mn:null,tFrom:90,o:3,s:'pending',cA:180,uA:180},
    {id:'si-b-16',sch:'ps-b-5',ci:'cost-b-13',pj:'proj-bldg',d:'הזמנה 50%',a:390000,p:50,ms:null,mn:null,tAgo:190,o:1,s:'paid',pd:185,pa:390000,cA:200,uA:185},
  ];

  for (const i of items) {
    const tgt = i.tAgo !== undefined ? daysAgo(i.tAgo) : daysFromNow(i.tFrom);
    await exec(`
      INSERT INTO schedule_items (id,schedule_id,cost_item_id,project_id,description,amount,percentage,
        milestone_id,milestone_name,target_date,"order",status,
        confirmed_by,confirmed_at,approved_by,approved_at,
        paid_date,paid_amount,created_at,updated_at)
      VALUES (${uid(i.id)},${uid(i.sch)},${uid(i.ci)},${uid(i.pj)},${esc(i.d)},
        ${num(i.a)},${num(i.p)},${uid(i.ms)},${i.mn?esc(i.mn):'NULL'},
        ${tgt},${num(i.o)},${esc(i.s)},
        ${i.cb?esc(i.cb):'NULL'},${i.ca?daysAgo(i.ca):'NULL'},${i.ab?esc(i.ab):'NULL'},${i.aa?daysAgo(i.aa):'NULL'},
        ${i.pd?daysAgo(i.pd):'NULL'},${i.pa?num(i.pa):'NULL'},
        ${daysAgo(i.cA)},${daysAgo(i.uA)})
      ON CONFLICT (id) DO NOTHING;
    `);
  }
}

async function seedProjectAssignments() {
  console.log('  [21/21] Seeding project_assignments (user -> both projects)...');
  const userId = 'ee16a975-5b7f-4516-88a8-1c10b27c28a2';
  await exec(`
    INSERT INTO project_assignments (user_id, project_id)
    VALUES
      ('${userId}', ${uid('proj-villa')}),
      ('${userId}', ${uid('proj-bldg')})
    ON CONFLICT (user_id, project_id) DO NOTHING;
  `);
}

// ============================================================
// MAIN
// ============================================================

async function main() {
  console.log('==============================================');
  console.log('  ANcon Neon Database Seeder');
  console.log('==============================================\n');

  const t0 = Date.now();

  try {
    console.log('Testing database connection...');
    const r = await sql`SELECT NOW() as now`;
    console.log(`  Connected! Server time: ${r[0].now}\n`);

    // Print UUID mapping for the two projects (for debugging)
    console.log('UUID mapping for projects:');
    console.log(`  proj-villa -> ${U('proj-villa')}`);
    console.log(`  proj-bldg  -> ${U('proj-bldg')}\n`);

    console.log('Ensuring extra columns exist...');
    await exec(`ALTER TABLE projects ADD COLUMN IF NOT EXISTS general_estimate NUMERIC(15,2);`);
    await exec(`ALTER TABLE projects ADD COLUMN IF NOT EXISTS built_sqm NUMERIC(10,2);`);
    await exec(`ALTER TABLE projects ADD COLUMN IF NOT EXISTS sales_sqm NUMERIC(10,2);`);
    await exec(`ALTER TABLE projects ADD COLUMN IF NOT EXISTS current_vat_rate NUMERIC(5,2);`);
    await exec(`ALTER TABLE tenders ADD COLUMN IF NOT EXISTS bom_sent_date DATE;`);
    await exec(`ALTER TABLE tenders ADD COLUMN IF NOT EXISTS winner_selected_date DATE;`);
    await exec(`ALTER TABLE tenders ADD COLUMN IF NOT EXISTS cost_item_id UUID;`);
    await exec(`ALTER TABLE tender_participants ADD COLUMN IF NOT EXISTS bom_sent_date DATE;`);
    await exec(`ALTER TABLE tender_participants ADD COLUMN IF NOT EXISTS bom_sent_status TEXT DEFAULT 'not_sent';`);
    console.log('  Done.\n');

    console.log('Seeding data...');
    await seedProjects();
    await seedProfessionals();
    await seedProjectProfessionals();
    await seedCostItems();
    await seedTenders();
    await seedCostItemTenderLinks();
    await seedTenderParticipants();
    await seedBudgets();
    await seedBudgetCategories();
    await seedBudgetChapters();
    await seedBudgetItems();
    await seedBudgetPayments();
    await seedProjectUnits();
    await seedProjectMilestones();
    await seedGanttTasks();
    await seedTasks();
    await seedFiles();
    await seedSpecialIssues();
    await seedPlanningChanges();
    await seedPaymentSchedules();
    await seedScheduleItems();
    await seedProjectAssignments();

    const elapsed = ((Date.now() - t0) / 1000).toFixed(1);
    console.log(`\n==============================================`);
    console.log(`  Seeding complete! (${elapsed}s)`);
    console.log(`==============================================\n`);

    console.log('Verification counts:');
    const tables = [
      'projects','professionals','project_professionals','cost_items',
      'tenders','tender_participants','budgets','budget_categories',
      'budget_chapters','budget_items','budget_payments','project_units',
      'project_milestones','gantt_tasks','tasks','files',
      'special_issues','planning_changes','payment_schedules','schedule_items',
      'project_assignments',
    ];
    for (const t of tables) {
      const cr = await sql.query(`SELECT COUNT(*) as count FROM ${t}`);
      console.log(`  ${t}: ${cr[0].count}`);
    }
  } catch (error) {
    console.error('\nSEED ERROR:', error.message);
    if (error.cause) console.error('Cause:', error.cause);
    process.exit(1);
  }
}

main();
