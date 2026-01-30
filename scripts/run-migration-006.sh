#!/bin/bash
# Run Migration 006: Complete Project Items Structure
# This script applies the production-ready schema to Neon database

set -e  # Exit on error

echo "🚀 Starting Migration 006: Complete Project Items Structure"
echo "============================================================"

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if migration file exists
MIGRATION_FILE="migrations/006-complete-project-items-structure.sql"
if [ ! -f "$MIGRATION_FILE" ]; then
  echo -e "${RED}❌ Migration file not found: $MIGRATION_FILE${NC}"
  exit 1
fi

echo -e "${BLUE}📄 Found migration file: $MIGRATION_FILE${NC}"
echo ""

# Get Neon connection string
# You'll need to set this environment variable or pass it as argument
if [ -z "$DATABASE_URL" ]; then
  echo -e "${RED}❌ DATABASE_URL environment variable not set${NC}"
  echo "Set it with: export DATABASE_URL='postgresql://...'"
  exit 1
fi

echo -e "${GREEN}✓ Database URL configured${NC}"
echo ""

# Run migration
echo -e "${BLUE}🔄 Running migration...${NC}"
psql "$DATABASE_URL" -f "$MIGRATION_FILE"

if [ $? -eq 0 ]; then
  echo ""
  echo -e "${GREEN}✅ Migration completed successfully!${NC}"
  echo ""
  echo "📊 Created tables:"
  echo "  - project_items (core identity)"
  echo "  - project_item_estimates (versioned estimates)"
  echo "  - project_item_status_history (audit trail)"
  echo "  - project_item_change_orders (contract amendments)"
  echo ""
  echo "🔧 Updated tables:"
  echo "  - tenders (added project_item_id, retry tracking)"
  echo "  - tender_participants (enhanced quote tracking)"
  echo "  - budget_items (added project_item_id, change order support)"
  echo ""
  echo "🎯 Created views:"
  echo "  - vw_project_items_with_current_estimate"
  echo "  - vw_project_item_lifecycle"
  echo "  - vw_item_change_order_summary"
  echo ""
  echo "⚡ Created functions:"
  echo "  - update_updated_at_column()"
  echo "  - log_status_change()"
  echo "  - increment_version()"
  echo "  - prevent_delete_if_referenced()"
  echo "  - get_item_full_history()"
  echo ""
else
  echo ""
  echo -e "${RED}❌ Migration failed!${NC}"
  exit 1
fi
