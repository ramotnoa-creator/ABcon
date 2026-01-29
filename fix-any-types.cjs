const fs = require('fs');
const path = require('path');

const files = [
  'src/services/budgetChaptersService.ts',
  'src/services/budgetItemsService.ts',
  'src/services/budgetPaymentsService.ts',
  'src/services/planningChangesService.ts',
  'src/services/professionalsService.ts',
  'src/services/projectProfessionalsService.ts',
  'src/services/projectsService.ts',
  'src/services/specialIssuesService.ts',
  'src/services/tasksService.ts',
  'src/services/tenderParticipantsService.ts',
  'src/services/tendersService.ts',
  'src/services/unitsService.ts',
  'src/components/Budget/AddBudgetItemForm.tsx',
  'src/pages/Projects/tabs/TendersTab.tsx',
];

const replacements = [
  // Replace executeQuery<any> with Record<string, unknown>
  {
    from: /executeQuery<any>/g,
    to: 'executeQuery<Record<string, unknown>>',
  },
  // Replace executeQuerySingle<any> with Record<string, unknown>
  {
    from: /executeQuerySingle<any>/g,
    to: 'executeQuerySingle<Record<string, unknown>>',
  },
  // Replace catch (error) with catch (error: unknown)
  {
    from: /catch \(error\)/g,
    to: 'catch (error: unknown)',
  },
  // Replace catch (err) with catch (err: unknown)
  {
    from: /catch \(err\)/g,
    to: 'catch (err: unknown)',
  },
  // Replace const values: any[] with const values: unknown[]
  {
    from: /const values: any\[\]/g,
    to: 'const values: unknown[]',
  },
  // Replace const setClauses: string[] = []; const values: any[] with const setClauses: string[] = []; const values: unknown[]
  {
    from: /const values: unknown\[\] = \[\];/g,
    to: 'const values: unknown[] = [];',
  },
];

files.forEach(filePath => {
  const fullPath = path.join(__dirname, filePath);
  if (!fs.existsSync(fullPath)) {
    console.log(`File not found: ${filePath}`);
    return;
  }

  let content = fs.readFileSync(fullPath, 'utf8');
  let changed = false;

  replacements.forEach(({ from, to }) => {
    if (content.match(from)) {
      content = content.replace(from, to);
      changed = true;
    }
  });

  if (changed) {
    fs.writeFileSync(fullPath, content, 'utf8');
    console.log(`Fixed: ${filePath}`);
  } else {
    console.log(`No changes: ${filePath}`);
  }
});

console.log('Done!');
