import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Header from './components/Layout/Header';
import Breadcrumbs from './components/Layout/Breadcrumbs';
import DashboardPage from './pages/Dashboard/DashboardPage';
import ProjectsPage from './pages/Projects/ProjectsPage';
import CreateProjectPage from './pages/Projects/CreateProjectPage';
import ProjectDetailPage from './pages/Projects/ProjectDetailPage';
import ProfessionalsListPage from './pages/Professionals/ProfessionalsListPage';
import ProfessionalDetailPage from './pages/Professionals/ProfessionalDetailPage';
import CreateProfessionalPage from './pages/Professionals/CreateProfessionalPage';
import GlobalBudgetPage from './pages/Budget/GlobalBudgetPage';
import GlobalFilesPage from './pages/Files/GlobalFilesPage';

function App() {
  return (
    <Router>
      <div className="relative flex min-h-screen flex-col overflow-x-hidden bg-background-light dark:bg-background-dark">
        <Header />
        <main className="flex-1">
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route
              path="/dashboard"
              element={
                <>
                  <Breadcrumbs items={[{ label: 'ראשי', href: '/' }, { label: 'לוח בקרה ניהולי' }]} />
                  <DashboardPage />
                </>
              }
            />
            <Route
              path="/projects"
              element={
                <>
                  <Breadcrumbs items={[{ label: 'פרויקטים' }]} />
                  <ProjectsPage />
                </>
              }
            />
            <Route
              path="/projects/new"
              element={
                <>
                  <Breadcrumbs items={[{ label: 'בית', href: '/dashboard' }, { label: 'פרויקטים', href: '/projects' }, { label: 'יצירת פרויקט חדש' }]} />
                  <CreateProjectPage />
                </>
              }
            />
            <Route
              path="/projects/:id"
              element={
                <>
                  <Breadcrumbs items={[{ label: 'פרויקטים', href: '/projects' }, { label: 'פרטי פרויקט' }]} />
                  <ProjectDetailPage />
                </>
              }
            />
            <Route
              path="/professionals"
              element={
                <>
                  <Breadcrumbs items={[{ label: 'אנשי מקצוע' }]} />
                  <ProfessionalsListPage />
                </>
              }
            />
            <Route
              path="/professionals/:id"
              element={
                <>
                  <Breadcrumbs items={[{ label: 'אנשי מקצוע', href: '/professionals' }, { label: 'כרטיס איש מקצוע' }]} />
                  <ProfessionalDetailPage />
                </>
              }
            />
            <Route
              path="/professionals/new"
              element={
                <>
                  <Breadcrumbs items={[{ label: 'אנשי מקצוע', href: '/professionals' }, { label: 'יצירת איש מקצוע חדש' }]} />
                  <CreateProfessionalPage />
                </>
              }
            />
            <Route
              path="/files"
              element={
                <>
                  <Breadcrumbs items={[{ label: 'קבצים' }]} />
                  <GlobalFilesPage />
                </>
              }
            />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
