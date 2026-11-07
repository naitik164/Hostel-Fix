import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { AuthProvider, useAuth } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import PremiumPageLoader from './components/common/PremiumPageLoader';
import TopNavigationLoader from './components/common/TopNavigationLoader';

// Layouts
import StudentLayout from './layouts/StudentLayout';
import AdminLayout from './layouts/AdminLayout';
import StaffLayout from './layouts/StaffLayout';

// Public Auth Pages
import LandingPage from './pages/auth/LandingPage';
import StudentLogin from './pages/auth/StudentLogin';
import StaffLogin from './pages/auth/StaffLogin';
import AdminLogin from './pages/auth/AdminLogin';

// Student Pages
import StudentOnboarding from './pages/student/StudentOnboarding';
import StudentDashboard from './pages/student/StudentDashboard';
import StudentComplaints from './pages/student/StudentComplaints';
import NewComplaint from './pages/student/NewComplaint';
import StudentComplaintDetail from './pages/student/StudentComplaintDetail';
import StudentNotifications from './pages/student/StudentNotifications';
import StudentProfile from './pages/student/StudentProfile';

// Staff Pages
import StaffDashboard from './pages/staff/StaffDashboard';
import StaffTasks from './pages/staff/StaffTasks';
import StaffTaskDetail from './pages/staff/StaffTaskDetail';
import StaffHistory from './pages/staff/StaffHistory';
import StaffNotifications from './pages/staff/StaffNotifications';
import StaffProfile from './pages/staff/StaffProfile';

// Admin / Warden Pages
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminComplaints from './pages/admin/AdminComplaints';
import AdminComplaintDetail from './pages/admin/AdminComplaintDetail';
import AdminVerifications from './pages/admin/AdminVerifications';
import AdminStaff from './pages/admin/AdminStaff';
import AdminBlocks from './pages/admin/AdminBlocks';
import AdminStudents from './pages/admin/AdminStudents';
import AdminAnalytics from './pages/admin/AdminAnalytics';
import AdminNotifications from './pages/admin/AdminNotifications';
import AdminSettings from './pages/admin/AdminSettings';

function AppContent() {
  const { loading } = useAuth();
  const [initialLoadingComplete, setInitialLoadingComplete] = useState(false);

  return (
    <>
      {/* Premium Cinematic Initial Page Loader */}
      {!initialLoadingComplete && (
        <PremiumPageLoader
          isReady={!loading}
          onComplete={() => setInitialLoadingComplete(true)}
        />
      )}

      {/* Top Progress Bar on Route Navigation */}
      <TopNavigationLoader />

      <div className={`flex-1 flex flex-col min-h-0 w-full ${initialLoadingComplete ? 'animate-page-reveal' : ''}`}>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/student/login" element={<StudentLogin />} />
          <Route path="/staff/login" element={<StaffLogin />} />
          <Route path="/admin/login" element={<AdminLogin />} />

          {/* Mandatory Student Onboarding Route */}
          <Route
            path="/student/onboarding"
            element={
              <ProtectedRoute requiredRole="student">
                <StudentOnboarding />
              </ProtectedRoute>
            }
          />

          {/* Protected Student Routes */}
          <Route
            path="/student"
            element={
              <ProtectedRoute requiredRole="student">
                <StudentLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="/student/dashboard" replace />} />
            <Route path="dashboard" element={<StudentDashboard />} />
            <Route path="complaints" element={<StudentComplaints />} />
            <Route path="complaints/new" element={<NewComplaint />} />
            <Route path="complaints/:id" element={<StudentComplaintDetail />} />
            <Route path="notifications" element={<StudentNotifications />} />
            <Route path="profile" element={<StudentProfile />} />
          </Route>

          {/* Protected Staff Routes */}
          <Route
            path="/staff"
            element={
              <ProtectedRoute requiredRole="staff">
                <StaffLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="/staff/dashboard" replace />} />
            <Route path="dashboard" element={<StaffDashboard />} />
            <Route path="tasks" element={<StaffTasks />} />
            <Route path="tasks/:id" element={<StaffTaskDetail />} />
            <Route path="history" element={<StaffHistory />} />
            <Route path="notifications" element={<StaffNotifications />} />
            <Route path="profile" element={<StaffProfile />} />
          </Route>

          {/* Protected Warden / Admin Routes */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute requiredRole="admin">
                <AdminLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="/admin/dashboard" replace />} />
            <Route path="dashboard" element={<AdminDashboard />} />
            <Route path="complaints" element={<AdminComplaints />} />
            <Route path="complaints/:id" element={<AdminComplaintDetail />} />
            <Route path="verifications" element={<AdminVerifications />} />
            <Route path="staff" element={<AdminStaff />} />
            <Route path="blocks" element={<AdminBlocks />} />
            <Route path="students" element={<AdminStudents />} />
            <Route path="analytics" element={<AdminAnalytics />} />
            <Route path="notifications" element={<AdminNotifications />} />
            <Route path="settings" element={<AdminSettings />} />
          </Route>

          {/* Catch-all redirect to Home */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </>
  );
}

function App() {
  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';

  return (
    <GoogleOAuthProvider clientId={googleClientId}>
      <AuthProvider>
        <BrowserRouter>
          <AppContent />
        </BrowserRouter>
      </AuthProvider>
    </GoogleOAuthProvider>
  );
}

export default App;
