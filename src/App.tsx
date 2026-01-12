import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/Auth/ProtectedRoute';
import LoginPage from './pages/Auth/LoginPage';
import Header from './components/Layout/Header';
import Breadcrumbs from './components/Layout/Breadcrumbs';
import DashboardPage from './pages/Dashboard/DashboardPage';
import ProjectsPage from './pages/Projects/ProjectsPage';
import CreateProjectPage from './pages/Projects/CreateProjectPage';
import EditProjectPage from './pages/Projects/EditProjectPage';
import ProjectDetailPage from './pages/Projects/ProjectDetailPage';
import ProfessionalsListPage from './pages/Professionals/ProfessionalsListPage';
import ProfessionalDetailPage from './pages/Professionals/ProfessionalDetailPage';
import CreateProfessionalPage from './pages/Professionals/CreateProfessionalPage';
import GlobalFilesPage from './pages/Files/GlobalFilesPage';
import GlobalBudgetPage from './pages/Budget/GlobalBudgetPage';

// Layout wrapper for authenticated pages
function AppLayout() {
  return (
    <div className="relative flex min-h-screen flex-col overflow-x-hidden bg-background-light dark:bg-background-dark">
      <Header />
      <main className="flex-1">
        <Outlet />
      </main>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<LoginPage />} />

          {/* Protected routes - require authentication */}
          <Route element={<ProtectedRoute />}>
            <Route element={<AppLayout />}>
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
                path="/projects/:id/edit"
                element={
                  <>
                    <Breadcrumbs items={[{ label: 'פרויקטים', href: '/projects' }, { label: 'עריכת פרויקט' }]} />
                    <EditProjectPage />
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
              <Route
                path="/budget"
                element={
                  <>
                    <Breadcrumbs items={[{ label: 'תקציב' }]} />
                    <GlobalBudgetPage />
                  </>
                }
              />
            </Route>
          </Route>
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
