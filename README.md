# ABcon - Construction Project Management System

> **בקרת פרויקטי בנייה ונדל"ן** | Construction & Real Estate Project Management

A comprehensive project management system for Israeli construction companies, managing the complete lifecycle from planning through execution to completion.

---

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Set up environment (see .dev-credentials.md for database credentials)
# Copy connection string to src/config/database.ts

# 3. Run development server
npm run dev

# 4. Open browser
# Navigate to http://localhost:5173
```

---

## What is ABcon?

ABcon manages:
- 📊 **Projects** - Planning, execution, tracking
- 💰 **Financial Control** - Estimates, tenders, budget, payments
- 👥 **Professional Network** - Contractors, consultants, suppliers
- ✅ **Tasks & Milestones** - Timeline tracking
- 📁 **Documents** - File management

**Interface:** Hebrew RTL (right-to-left)
**Target Users:** Project managers, entrepreneurs, accountants, site supervisors

---

## Tech Stack

**Frontend:**
- React 19.2 + TypeScript 5.9
- Vite 6.0 (build tool)
- TailwindCSS 3.4
- React Router 7.10

**Database:**
- Neon PostgreSQL (serverless)

**Key Features:**
- Full TypeScript
- Service layer architecture
- Component-based UI
- Hebrew RTL support

---

## Project Structure

```
ABcon/
├── src/
│   ├── pages/          # Main application pages
│   ├── components/     # Reusable UI components
│   ├── services/       # Business logic & database queries
│   ├── config/         # Configuration (database, etc.)
│   └── types.ts        # TypeScript interfaces
├── migrations/         # Database migrations
├── docs/               # Documentation
└── PROJECT.md          # 📖 Full project context (START HERE)
```

---

## Documentation

**For Quick Context:**
- 📖 **[PROJECT.md](./PROJECT.md)** ⭐ **START HERE** - Complete project overview with architecture diagrams

**For Developers:**
- 📘 [Getting Started](./docs/GETTING_STARTED.md) - Detailed setup guide
- 🏗️ [Architecture](./docs/ARCHITECTURE.md) - System design & patterns
- 🗄️ [Database](./docs/DATABASE.md) - Schema, ERD, migrations
- 🧩 [Components](./docs/COMPONENTS.md) - UI component guide

**For Operations:**
- 🚀 [Deployment](./docs/DEPLOYMENT.md) - Production deployment
- 🧪 [Testing](./docs/TESTING.md) - Test strategy
- 🔧 [Troubleshooting](./docs/TROUBLESHOOTING.md) - Common issues

---

## Current Status

**Development Phase:** Phase 4/6 of Estimate Integration (67% complete)

**Recent Milestones:**
- ✅ Estimate locking & bidirectional tender linking (Migration 007)
- ✅ UI indicators for locked/exported estimates
- ✅ Auto-locking when tender winner selected
- ✅ Full CRUD for estimates, tenders, budget

**Next Up:**
- ⏳ Budget auto-creation from tender winners
- ⏳ Enhanced variance tracking
- ⏳ Production deployment

---

## Key Workflows

### Estimate → Tender → Budget

1. **Create Estimate** (planning or execution)
2. **Export to Tender** → invite professionals
3. **Collect Quotes** from multiple contractors
4. **Select Winner** → estimate automatically locks 🔒
5. **Budget Created** → track payments

**Result:** Full traceability from estimate → contract → payment

---

## Development Commands

```bash
# Development
npm run dev              # Start dev server (port 5173)
npm run build            # Build for production
npm run preview          # Preview production build

# Code Quality
npm run lint             # Run ESLint
npm run type-check       # TypeScript type checking

# Database
# See .dev-credentials.md for Neon connection string
# Run migrations manually in Neon console
```

---

## Environment Setup

**Prerequisites:**
- Node.js 18+ (LTS recommended)
- npm or yarn
- Neon PostgreSQL account

**Configuration:**
1. Database credentials in `.dev-credentials.md`
2. Update `src/config/database.ts` with connection string
3. Run migrations in order (`migrations/` folder)

---

## Contributing

**Before Making Changes:**
1. Read [PROJECT.md](./PROJECT.md) for full context
2. Review [Architecture](./docs/ARCHITECTURE.md) for patterns
3. Check [Components](./docs/COMPONENTS.md) for UI guidelines
4. Follow existing code patterns

**Commit Guidelines:**
- Write clear commit messages
- Include "Co-Authored-By: Claude" when applicable
- Test changes before committing
- Update documentation if needed

---

## Getting Help

**Documentation:**
- Full context → [PROJECT.md](./PROJECT.md)
- Troubleshooting → [docs/TROUBLESHOOTING.md](./docs/TROUBLESHOOTING.md)
- Architecture → [docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md)

**Common Issues:**
- Database connection → Check `.dev-credentials.md`
- TypeScript errors → Run `npm run type-check`
- Build issues → Clear `node_modules` and reinstall

---

## License

[License TBD]

---

**Last Updated:** 2026-01-31
**Project Status:** Active Development
**Contact:** [Primary developer]

---

**📖 For complete project context with architecture diagrams, database schema, and workflows:**
**→ Read [PROJECT.md](./PROJECT.md) first**
