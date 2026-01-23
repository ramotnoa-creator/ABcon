import { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ToastProvider } from './contexts/ToastContext';
import ProtectedRoute from './components/Auth/ProtectedRoute';
import Header from './components/Layout/Header';
import DevToolsPanel from './components/DevTools/DevToolsPanel';

// Lazy load all page components for code splitting
const LoginPage = lazy(() => import('./pages/Auth/LoginPage'));
const ForgotPasswordPage = lazy(() => import('./pages/Auth/ForgotPasswordPage'));
const ResetPasswordPage = lazy(() => import('./pages/Auth/ResetPasswordPage'));
const DashboardPage = lazy(() => import('./pages/Dashboard/DashboardPage'));
const ProjectsPage = lazy(() => import('./pages/Projects/ProjectsPage'));
const CreateProjectPage = lazy(() => import('./pages/Projects/CreateProjectPage'));
const EditProjectPage = lazy(() => import('./pages/Projects/EditProjectPage'));
const ProjectDetailPage = lazy(() => import('./pages/Projects/ProjectDetailPage'));
const ProfessionalsListPage = lazy(() => import('./pages/Professionals/ProfessionalsListPage'));
const ProfessionalDetailPage = lazy(() => import('./pages/Professionals/ProfessionalDetailPage'));
const CreateProfessionalPage = lazy(() => import('./pages/Professionals/CreateProfessionalPage'));
const GlobalFilesPage = lazy(() => import('./pages/Files/GlobalFilesPage'));
const GlobalBudgetPage = lazy(() => import('./pages/Budget/GlobalBudgetPage'));
const GlobalTendersPage = lazy(() => import('./pages/Tenders/GlobalTendersPage'));
const UsersPage = lazy(() => import('./pages/Admin/UsersPage'));

// Loading fallback component
function PageLoader() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="flex flex-col items-center gap-4">
        <div className="size-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        <p className="text-text-secondary-light dark:text-text-secondary-dark text-sm">טוען...</p>
      </div>
    </div>
  );
}

// Layout wrapper for authenticated pages
function AppLayout() {
  return (
    <div className="relative flex min-h-screen flex-col overflow-x-hidden bg-background-light dark:bg-background-dark">
      <Header />
      <main className="flex-1">
        <Outlet />
      </main>
      <DevToolsPanel />
    </div>
  );
}

function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <Router>
          <Suspense fallback={<PageLoader />}>
            <Routes>
              {/* Public routes */}
              <Route path="/login" element={<LoginPage />} />
              <Route path="/forgot-password" element={<ForgotPasswordPage />} />
              <Route path="/reset-password" element={<ResetPasswordPage />} />

              {/* Protected routes - require authentication */}
              <Route element={<ProtectedRoute />}>
                <Route element={<AppLayout />}>
                  <Route path="/" element={<Navigate to="/dashboard" replace />} />
                  <Route path="/dashboard" element={<DashboardPage />} />
                  <Route path="/projects" element={<ProjectsPage />} />
                  <Route path="/projects/new" element={<CreateProjectPage />} />
                  <Route path="/projects/:id" element={<ProjectDetailPage />} />
                  <Route path="/projects/:id/edit" element={<EditProjectPage />} />
                  <Route path="/tenders" element={<GlobalTendersPage />} />
                  <Route path="/professionals" element={<ProfessionalsListPage />} />
                  <Route path="/professionals/:id" element={<ProfessionalDetailPage />} />
                  <Route path="/professionals/new" element={<CreateProfessionalPage />} />
                  <Route path="/files" element={<GlobalFilesPage />} />
                  <Route path="/budget" element={<GlobalBudgetPage />} />
                  <Route path="/admin/users" element={<UsersPage />} />
                </Route>
              </Route>
            </Routes>
          </Suspense>
        </Router>
      </AuthProvider>
    </ToastProvider>
  );
}

export default App;
