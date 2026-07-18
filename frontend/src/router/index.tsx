import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from '../store/auth.store';
import Layout from '../components/layout/Layout';
import LoginPage from '../pages/auth/LoginPage';
import CityProfilesPage from '../pages/cities/CityProfilesPage';
import ProjectsPage from '../pages/projects/projects.page';
import ProjectDetailPage from '../pages/projects/ProjectDetailPage';
import DocumentsPage from '../pages/documents/docuDocumentsPage';
import MessagesPage from '../pages/messages/MessagesPage';
import EventsPage from '../pages/events/EventsPage';
import BudgetPage from '../pages/budget/BudgetPage';
import NewsPage from '../pages/news/NewsPage';
import NotificationsPage from '../pages/notifications/NotificationsPage';
import SearchPage from '../pages/search/SearchPage';
import ReportsPage from '../pages/reports/ReportsPage';
import AdminPage from '../pages/admin/AdminPage';
import SettingsPage from '../pages/settings/SettingsPage';
import DashboardPage from '../pages/dashboard/DashboardPage';
import ForgotPasswordPage from '../pages/auth/ForgotPasswordPage';
import ResetPasswordPage from '../pages/auth/ResetPasswordPage';
import LandingPage from '../pages/landing/LandingPage';

// Protected route
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { token } = useAuthStore();
  if (!token) return <Navigate to="/login" />;
  return <>{children}</>;
}
export default function Router() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />

        {/* Protected routes */}
        <Route
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/cities" element={<CityProfilesPage />} />
          <Route path="/projects" element={<ProjectsPage />} />
          <Route path="/projects/:id" element={<ProjectDetailPage />} />
          <Route path="/documents" element={<DocumentsPage />} />
          <Route path="/messages" element={<MessagesPage />} />
          <Route path="/events" element={<EventsPage />} />
          <Route path="/budget" element={<BudgetPage />} />
          <Route path="/news" element={<NewsPage />} />
          <Route path="/notifications" element={<NotificationsPage />} />
          <Route path="/reports" element={<ReportsPage />} />
          <Route path="/admin" element={<AdminPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/search" element={<SearchPage />} />
        </Route>
        {/* Fallback */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="*" element={<Navigate to="/login" />} />
      </Routes>
    </BrowserRouter>
  );
}