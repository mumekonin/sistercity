import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from '../store/auth.store';
import Layout from '../components/layout/Layout';
import LoginPage from '../pages/auth/LoginPage';
import CityProfilesPage from '../pages/cities/CityProfilesPage';
import ProjectsPage from '../pages/projects/projects.page';
import ProjectDetailPage from '../pages/projects/ProjectDetailPage';

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
          <Route path="documents" element={<div className="text-[#1a4a8a] text-2xl font-bold">Documents coming soon...</div>} />
          <Route path="messages" element={<div className="text-[#1a4a8a] text-2xl font-bold">Communication coming soon...</div>} />
          <Route path="events" element={<div className="text-[#1a4a8a] text-2xl font-bold">Events coming soon...</div>} />
          <Route path="budget" element={<div className="text-[#1a4a8a] text-2xl font-bold">Budget coming soon...</div>} />
          <Route path="news" element={<div className="text-[#1a4a8a] text-2xl font-bold">News coming soon...</div>} />
          <Route path="notifications" element={<div className="text-[#1a4a8a] text-2xl font-bold">Notifications coming soon...</div>} />
          <Route path="reports" element={<div className="text-[#1a4a8a] text-2xl font-bold">Reports coming soon...</div>} />
          <Route path="admin" element={<div className="text-[#1a4a8a] text-2xl font-bold">Administration coming soon...</div>} />
          <Route path="settings" element={<div className="text-[#1a4a8a] text-2xl font-bold">Settings coming soon...</div>} />
          <Route path="search" element={<div className="text-[#1a4a8a] text-2xl font-bold">Search coming soon...</div>} />
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/login" />} />
      </Routes>
    </BrowserRouter>
  );
}