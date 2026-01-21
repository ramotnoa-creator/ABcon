/**
 * Migration Service - Merge Seed Data to Neon
 * Handles the migration of seed data from localStorage format to Neon database
 * with proper ID mapping for foreign key relationships
 */

import {
  seedProjects,
  seedProfessionals,
  seedProjectProfessionals,
  seedBudgets,
  seedBudgetCategories,
  seedBudgetChapters,
  seedBudgetItems,
  seedBudgetPayments,
  seedProjectUnits,
  seedProjectMilestones,
  seedGanttTasks,
  seedTenders,
  seedTenderParticipants,
  seedTasks,
  seedFiles,
  seedSpecialIssues,
  seedPlanningChanges,
} from '../data/seedData';

import { createProject } from './projectsService';
import { createProfessional } from './professionalsService';
import { createProjectProfessional } from './projectProfessionalsService';
import { createBudget } from './budgetService';
import { createBudgetCategory } from './budgetCategoriesService';
import { createBudgetChapter } from './budgetChaptersService';
import { createBudgetItem } from './budgetItemsService';
import { createBudgetPayment } from './budgetPaymentsService';
import { createUnit } from './unitsService';
import { createMilestone } from './milestonesService';
import { createGanttTask } from './ganttTasksService';
import { createTender } from './tendersService';
import { createTenderParticipant } from './tenderParticipantsService';
import { createTask } from './tasksService';
import { createFile } from './filesService';
import { createSpecialIssue } from './specialIssuesService';
import { createPlanningChange } from './planningChangesService';

// ID mappings for foreign key resolution
interface IdMappings {
  projects: Record<string, string>;
  professionals: Record<string, string>;
  categories: Record<string, string>;
  chapters: Record<string, string>;
  units: Record<string, string>;
  milestones: Record<string, string>;
  tenders: Record<string, string>;
  budgetItems: Record<string, string>;
}

export interface MigrationResult {
  success: boolean;
  created: Record<string, number>;
  errors: string[];
  mappings?: IdMappings;
}

/**
 * Merge seed data to Neon database
 * This is an ADDITIVE operation - it does not delete existing data
 */
export async function mergeSeedDataToNeon(
  onProgress?: (message: string) => void
): Promise<MigrationResult> {
  const log = (msg: string) => {
    console.log(`[Migration] ${msg}`);
    onProgress?.(msg);
  };

  const mappings: IdMappings = {
    projects: {},
    professionals: {},
    categories: {},
    chapters: {},
    units: {},
    milestones: {},
    tenders: {},
    budgetItems: {},
  };

  const created: Record<string, number> = {};
  const errors: string[] = [];

  try {
    // ============================================================
    // 1. PROJECTS (no dependencies)
    // ============================================================
    log('📁 Creating projects...');
    for (const project of seedProjects) {
      try {
        const { id, ...data } = project;
        const newProject = await createProject(data);
        mappings.projects[id] = newProject.id;
        created.projects = (created.projects || 0) + 1;
      } catch (err) {
        errors.push(`Project ${project.project_name}: ${err}`);
      }
    }
    log(`✅ Created ${created.projects || 0} projects`);

    // ============================================================
    // 2. PROFESSIONALS (no dependencies)
    // ============================================================
    log('👥 Creating professionals...');
    for (const prof of seedProfessionals) {
      try {
        const { id, ...data } = prof;
        const newProf = await createProfessional(data);
        mappings.professionals[id] = newProf.id;
        created.professionals = (created.professionals || 0) + 1;
      } catch (err) {
        errors.push(`Professional ${prof.professional_name}: ${err}`);
      }
    }
    log(`✅ Created ${created.professionals || 0} professionals`);

    // ============================================================
    // 3. BUDGETS (depends on projects)
    // ============================================================
    log('💰 Creating budgets...');
    for (const budget of seedBudgets) {
      try {
        const { id, project_id, ...data } = budget;
        const mappedProjectId = mappings.projects[project_id];
        if (!mappedProjectId) {
          errors.push(`Budget: Missing project mapping for ${project_id}`);
          continue;
        }
        await createBudget({ ...data, project_id: mappedProjectId });
        created.budgets = (created.budgets || 0) + 1;
      } catch (err) {
        errors.push(`Budget: ${err}`);
      }
    }
    log(`✅ Created ${created.budgets || 0} budgets`);

    // ============================================================
    // 4. BUDGET CATEGORIES (depends on projects)
    // ============================================================
    log('📊 Creating budget categories...');
    for (const cat of seedBudgetCategories) {
      try {
        const { id, project_id, ...data } = cat;
        const mappedProjectId = mappings.projects[project_id];
        if (!mappedProjectId) {
          errors.push(`Category ${cat.name}: Missing project mapping`);
          continue;
        }
        const newCat = await createBudgetCategory({ ...data, project_id: mappedProjectId });
        mappings.categories[id] = newCat.id;
        created.categories = (created.categories || 0) + 1;
      } catch (err) {
        errors.push(`Category ${cat.name}: ${err}`);
      }
    }
    log(`✅ Created ${created.categories || 0} budget categories`);

    // ============================================================
    // 5. BUDGET CHAPTERS (depends on categories)
    // ============================================================
    log('📚 Creating budget chapters...');
    for (const chapter of seedBudgetChapters) {
      try {
        const { id, project_id, category_id, ...data } = chapter;
        const mappedProjectId = mappings.projects[project_id];
        const mappedCategoryId = mappings.categories[category_id];
        if (!mappedProjectId || !mappedCategoryId) {
          errors.push(`Chapter ${chapter.name}: Missing project/category mapping`);
          continue;
        }
        const newChapter = await createBudgetChapter({
          ...data,
          project_id: mappedProjectId,
          category_id: mappedCategoryId,
        });
        mappings.chapters[id] = newChapter.id;
        created.chapters = (created.chapters || 0) + 1;
      } catch (err) {
        errors.push(`Chapter ${chapter.name}: ${err}`);
      }
    }
    log(`✅ Created ${created.chapters || 0} budget chapters`);

    // ============================================================
    // 6. PROJECT UNITS (depends on projects)
    // ============================================================
    log('🏗️ Creating project units...');
    for (const unit of seedProjectUnits) {
      try {
        const { id, project_id, ...data } = unit;
        const mappedProjectId = mappings.projects[project_id];
        if (!mappedProjectId) {
          errors.push(`Unit ${unit.name}: Missing project mapping`);
          continue;
        }
        const newUnit = await createUnit({ ...data, project_id: mappedProjectId });
        mappings.units[id] = newUnit.id;
        created.units = (created.units || 0) + 1;
      } catch (err) {
        errors.push(`Unit ${unit.name}: ${err}`);
      }
    }
    log(`✅ Created ${created.units || 0} project units`);

    // ============================================================
    // 7. TENDERS (depends on projects, professionals optional)
    // ============================================================
    log('📋 Creating tenders...');
    for (const tender of seedTenders) {
      try {
        const { id, project_id, winner_professional_id, candidate_professional_ids, ...data } = tender;
        const mappedProjectId = mappings.projects[project_id];
        if (!mappedProjectId) {
          errors.push(`Tender ${tender.tender_name}: Missing project mapping`);
          continue;
        }
        const mappedWinnerId = winner_professional_id
          ? mappings.professionals[winner_professional_id]
          : undefined;
        const mappedCandidates = candidate_professional_ids
          .map((cid) => mappings.professionals[cid])
          .filter(Boolean);

        const newTender = await createTender({
          ...data,
          project_id: mappedProjectId,
          winner_professional_id: mappedWinnerId,
          candidate_professional_ids: mappedCandidates,
        });
        mappings.tenders[id] = newTender.id;
        created.tenders = (created.tenders || 0) + 1;
      } catch (err) {
        errors.push(`Tender ${tender.tender_name}: ${err}`);
      }
    }
    log(`✅ Created ${created.tenders || 0} tenders`);

    // ============================================================
    // 8. TENDER PARTICIPANTS (depends on tenders, professionals)
    // ============================================================
    log('👤 Creating tender participants...');
    for (const participant of seedTenderParticipants) {
      try {
        const { id, tender_id, professional_id, ...data } = participant;
        const mappedTenderId = mappings.tenders[tender_id];
        const mappedProfId = mappings.professionals[professional_id];
        if (!mappedTenderId || !mappedProfId) {
          errors.push(`Participant: Missing tender/professional mapping`);
          continue;
        }
        await createTenderParticipant({
          ...data,
          tender_id: mappedTenderId,
          professional_id: mappedProfId,
        });
        created.participants = (created.participants || 0) + 1;
      } catch (err) {
        errors.push(`Tender participant: ${err}`);
      }
    }
    log(`✅ Created ${created.participants || 0} tender participants`);

    // ============================================================
    // 9. PROJECT MILESTONES (depends on projects, units)
    // ============================================================
    log('🎯 Creating milestones...');
    for (const milestone of seedProjectMilestones) {
      try {
        const { id, project_id, unit_id, budget_item_id, tender_id, ...data } = milestone;
        const mappedProjectId = mappings.projects[project_id];
        const mappedUnitId = mappings.units[unit_id];
        if (!mappedProjectId || !mappedUnitId) {
          errors.push(`Milestone ${milestone.name}: Missing project/unit mapping`);
          continue;
        }
        const newMilestone = await createMilestone({
          ...data,
          project_id: mappedProjectId,
          unit_id: mappedUnitId,
          budget_item_id: budget_item_id ? mappings.budgetItems[budget_item_id] : undefined,
          tender_id: tender_id ? mappings.tenders[tender_id] : undefined,
        });
        mappings.milestones[id] = newMilestone.id;
        created.milestones = (created.milestones || 0) + 1;
      } catch (err) {
        errors.push(`Milestone ${milestone.name}: ${err}`);
      }
    }
    log(`✅ Created ${created.milestones || 0} milestones`);

    // ============================================================
    // 10. BUDGET ITEMS (depends on chapters, tenders, professionals)
    // ============================================================
    log('💵 Creating budget items...');
    for (const item of seedBudgetItems) {
      try {
        const { id, project_id, chapter_id, supplier_id, tender_id, ...data } = item;
        const mappedProjectId = mappings.projects[project_id];
        const mappedChapterId = mappings.chapters[chapter_id];
        if (!mappedProjectId || !mappedChapterId) {
          errors.push(`Budget item ${item.description}: Missing project/chapter mapping`);
          continue;
        }
        const newItem = await createBudgetItem({
          ...data,
          project_id: mappedProjectId,
          chapter_id: mappedChapterId,
          supplier_id: supplier_id ? mappings.professionals[supplier_id] : undefined,
          tender_id: tender_id ? mappings.tenders[tender_id] : undefined,
        });
        mappings.budgetItems[id] = newItem.id;
        created.budgetItems = (created.budgetItems || 0) + 1;
      } catch (err) {
        errors.push(`Budget item ${item.description}: ${err}`);
      }
    }
    log(`✅ Created ${created.budgetItems || 0} budget items`);

    // ============================================================
    // 11. BUDGET PAYMENTS (depends on budget items, milestones)
    // ============================================================
    log('💳 Creating budget payments...');
    for (const payment of seedBudgetPayments) {
      try {
        const { id, budget_item_id, milestone_id, ...data } = payment;
        const mappedItemId = mappings.budgetItems[budget_item_id];
        if (!mappedItemId) {
          errors.push(`Payment ${payment.invoice_number}: Missing budget item mapping`);
          continue;
        }
        await createBudgetPayment({
          ...data,
          budget_item_id: mappedItemId,
          milestone_id: milestone_id ? mappings.milestones[milestone_id] : undefined,
        });
        created.payments = (created.payments || 0) + 1;
      } catch (err) {
        errors.push(`Payment ${payment.invoice_number}: ${err}`);
      }
    }
    log(`✅ Created ${created.payments || 0} budget payments`);

    // ============================================================
    // 12. GANTT TASKS (depends on projects, milestones)
    // ============================================================
    log('📅 Creating gantt tasks...');
    for (const task of seedGanttTasks) {
      try {
        const { id, project_id, milestone_id, assigned_to_id, predecessors, ...data } = task;
        const mappedProjectId = mappings.projects[project_id];
        const mappedMilestoneId = mappings.milestones[milestone_id];
        if (!mappedProjectId || !mappedMilestoneId) {
          errors.push(`Gantt task ${task.name}: Missing project/milestone mapping`);
          continue;
        }
        await createGanttTask({
          ...data,
          project_id: mappedProjectId,
          milestone_id: mappedMilestoneId,
          assigned_to_id: assigned_to_id ? mappings.professionals[assigned_to_id] : undefined,
          // Note: predecessors would need task ID mapping, skip for now
          predecessors: undefined,
        });
        created.ganttTasks = (created.ganttTasks || 0) + 1;
      } catch (err) {
        errors.push(`Gantt task ${task.name}: ${err}`);
      }
    }
    log(`✅ Created ${created.ganttTasks || 0} gantt tasks`);

    // ============================================================
    // 13. PROJECT PROFESSIONALS (depends on projects, professionals, tenders)
    // ============================================================
    log('🔗 Creating project-professional assignments...');
    for (const pp of seedProjectProfessionals) {
      try {
        const { id, project_id, professional_id, related_tender_id, ...data } = pp;
        const mappedProjectId = mappings.projects[project_id];
        const mappedProfId = mappings.professionals[professional_id];
        if (!mappedProjectId || !mappedProfId) {
          errors.push(`Project-Professional: Missing project/professional mapping`);
          continue;
        }
        await createProjectProfessional({
          ...data,
          project_id: mappedProjectId,
          professional_id: mappedProfId,
          related_tender_id: related_tender_id ? mappings.tenders[related_tender_id] : undefined,
        });
        created.projectProfessionals = (created.projectProfessionals || 0) + 1;
      } catch (err) {
        errors.push(`Project-Professional: ${err}`);
      }
    }
    log(`✅ Created ${created.projectProfessionals || 0} project-professional assignments`);

    // ============================================================
    // 14. TASKS (depends on projects, professionals optional)
    // ============================================================
    log('✅ Creating tasks...');
    for (const task of seedTasks) {
      try {
        const { id, project_id, assignee_professional_id, ...data } = task;
        const mappedProjectId = mappings.projects[project_id];
        if (!mappedProjectId) {
          errors.push(`Task ${task.title}: Missing project mapping`);
          continue;
        }
        await createTask({
          ...data,
          project_id: mappedProjectId,
          assignee_professional_id: assignee_professional_id
            ? mappings.professionals[assignee_professional_id]
            : undefined,
        });
        created.tasks = (created.tasks || 0) + 1;
      } catch (err) {
        errors.push(`Task ${task.title}: ${err}`);
      }
    }
    log(`✅ Created ${created.tasks || 0} tasks`);

    // ============================================================
    // 15. FILES (depends on various entities)
    // ============================================================
    log('📁 Creating files...');
    for (const file of seedFiles) {
      try {
        const { id, related_entity_id, related_entity_type, ...data } = file;
        let mappedEntityId = related_entity_id;
        if (related_entity_id && related_entity_type === 'Project') {
          mappedEntityId = mappings.projects[related_entity_id];
        }
        await createFile({
          ...data,
          related_entity_type,
          related_entity_id: mappedEntityId,
        });
        created.files = (created.files || 0) + 1;
      } catch (err) {
        errors.push(`File ${file.file_name}: ${err}`);
      }
    }
    log(`✅ Created ${created.files || 0} files`);

    // ============================================================
    // 16. SPECIAL ISSUES (depends on projects)
    // ============================================================
    log('⚠️ Creating special issues...');
    for (const issue of seedSpecialIssues) {
      try {
        const { id, project_id, ...data } = issue;
        const mappedProjectId = mappings.projects[project_id];
        if (!mappedProjectId) {
          errors.push(`Issue: Missing project mapping`);
          continue;
        }
        await createSpecialIssue({ ...data, project_id: mappedProjectId });
        created.issues = (created.issues || 0) + 1;
      } catch (err) {
        errors.push(`Special issue: ${err}`);
      }
    }
    log(`✅ Created ${created.issues || 0} special issues`);

    // ============================================================
    // 17. PLANNING CHANGES (depends on projects)
    // ============================================================
    log('🔄 Creating planning changes...');
    for (const change of seedPlanningChanges) {
      try {
        const { id, project_id, change_number, ...data } = change;
        const mappedProjectId = mappings.projects[project_id];
        if (!mappedProjectId) {
          errors.push(`Planning change: Missing project mapping`);
          continue;
        }
        await createPlanningChange({ ...data, project_id: mappedProjectId });
        created.planningChanges = (created.planningChanges || 0) + 1;
      } catch (err) {
        errors.push(`Planning change: ${err}`);
      }
    }
    log(`✅ Created ${created.planningChanges || 0} planning changes`);

    // ============================================================
    // SUMMARY
    // ============================================================
    const totalCreated = Object.values(created).reduce((a, b) => a + b, 0);
    log(`\n🎉 Migration complete! Created ${totalCreated} records total.`);

    if (errors.length > 0) {
      log(`⚠️ ${errors.length} errors occurred (see console)`);
      console.error('Migration errors:', errors);
    }

    return {
      success: errors.length === 0,
      created,
      errors,
      mappings,
    };
  } catch (error) {
    const errorMsg = `Migration failed: ${error}`;
    log(`❌ ${errorMsg}`);
    return {
      success: false,
      created,
      errors: [...errors, errorMsg],
    };
  }
}
