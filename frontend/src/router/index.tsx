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
        <Route path="/login" element={<LoginPage />} />

        {/* Protected routes */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/dashboard" />} />
          <Route path="dashboard" element={<div className="text-[#1a4a8a] text-2xl font-bold">Dashboard coming soon...</div>} />
          <Route path="cities" element={<CityProfilesPage />} />
          <Route path="projects" element={<ProjectsPage />} />
          <Route path="projects/:id" element={<ProjectDetailPage />} />
          <Route path="documents" element={<DocumentsPage />} />
          <Route path="messages" element={<MessagesPage />} />
          <Route path="events" element={<EventsPage />} />
          <Route path="budget" element={<BudgetPage />} />
          <Route path="news" element={<NewsPage />} />
          <Route path="notifications" element={<NotificationsPage />} />
          <Route path="reports" element={<div className="text-[#1a4a8a] text-2xl font-bold">Reports coming soon...</div>} />
          <Route path="admin" element={<div className="text-[#1a4a8a] text-2xl font-bold">Administration coming soon...</div>} />
          <Route path="settings" element={<div className="text-[#1a4a8a] text-2xl font-bold">Settings coming soon...</div>} />
          <Route path="search" element={<SearchPage />} />
        </Route>
        {/* Fallback */}
        <Route path="*" element={<Navigate to="/login" />} />
      </Routes>
    </BrowserRouter>
  );
}