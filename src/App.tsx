import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/Auth/ProtectedRoute';
import LoginPage from './pages/Auth/LoginPage';
import ForgotPasswordPage from './pages/Auth/ForgotPasswordPage';
import ResetPasswordPage from './pages/Auth/ResetPasswordPage';
import Header from './components/Layout/Header';
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
import GlobalTendersPage from './pages/Tenders/GlobalTendersPage';
import UsersPage from './pages/Admin/UsersPage';
import DevToolsPanel from './components/DevTools/DevToolsPanel';

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
    <AuthProvider>
      <Router>
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
      </Router>
    </AuthProvider>
  );
}

export default App;
