import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './modules/auth/AuthContext';
import Login from './modules/auth/Login';
import Register from './modules/auth/Register';
import DashboardOverview from '@/modules/dashboard/DashboardOverview';

import CRMOverview from './modules/crm/CRMOverview';
import ProjectsOverview from './modules/pm/ProjectsOverview';
import HRMOverview from './modules/hrm/HRMOverview';
import FinanceOverview from './modules/finance/FinanceOverview';
import SupportOverview from './modules/support/SupportOverview';
import WikiOverview from './modules/wiki/WikiOverview';
import TasksOverview from './modules/tasks/TasksOverview';
import GamificationOverview from './modules/gamification/GamificationOverview';
import ProfileDetails from './modules/profile/ProfileDetails';
import SettingsPage from './modules/settings/SettingsPage';
import SecurityPage from './modules/security/SecurityPage';

const ProtectedRoute: React.FC<{ children: React.ReactNode; adminOnly?: boolean }> = ({
  children,
  adminOnly = false
}) => {
  const { user, profile, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" />;
  }

  if (adminOnly && profile?.role !== 'admin') {
    return <Navigate to="/" />;
  }

  return <>{children}</>;
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Protected Routes */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <DashboardOverview />
              </ProtectedRoute>
            }
          />
          <Route
            path="/crm"
            element={
              <ProtectedRoute adminOnly>
                <CRMOverview />
              </ProtectedRoute>
            }
          />
          <Route
            path="/projects"
            element={
              <ProtectedRoute>
                <ProjectsOverview />
              </ProtectedRoute>
            }
          />
          <Route
            path="/tasks"
            element={
              <ProtectedRoute>
                <TasksOverview />
              </ProtectedRoute>
            }
          />
          <Route
            path="/hrm"
            element={
              <ProtectedRoute adminOnly>
                <HRMOverview />
              </ProtectedRoute>
            }
          />
          <Route
            path="/finance"
            element={
              <ProtectedRoute adminOnly>
                <FinanceOverview />
              </ProtectedRoute>
            }
          />
          <Route
            path="/support"
            element={
              <ProtectedRoute>
                <SupportOverview />
              </ProtectedRoute>
            }
          />
          <Route
            path="/wiki"
            element={
              <ProtectedRoute>
                <WikiOverview />
              </ProtectedRoute>
            }
          />
          <Route
            path="/gamification"
            element={
              <ProtectedRoute>
                <GamificationOverview />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <ProfileDetails />
              </ProtectedRoute>
            }
          />
          <Route
            path="/settings"
            element={
              <ProtectedRoute>
                <SettingsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/security"
            element={
              <ProtectedRoute>
                <SecurityPage />
              </ProtectedRoute>
            }
          />

          {/* Redirect any other route to home */}
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
