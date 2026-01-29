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
];

files.forEach(filePath => {
  const fullPath = path.join(__dirname, filePath);
  if (!fs.existsSync(fullPath)) {
    console.log(`File not found: ${filePath}`);
    return;
  }

  let content = fs.readFileSync(fullPath, 'utf8');

  // Replace all transform function parameters from any to Record<string, unknown>
  content = content.replace(
    /function transform(\w+)FromDB\((\w+): any\)/g,
    'function transform$1FromDB($2: Record<string, unknown>)'
  );

  fs.writeFileSync(fullPath, content, 'utf8');
  console.log(`Fixed transform functions in: ${filePath}`);
});

console.log('Done!');
