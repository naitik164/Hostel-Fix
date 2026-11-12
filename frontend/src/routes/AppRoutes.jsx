import React, { useState, Suspense } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import ProtectedRoute from '../components/layout/ProtectedRoute';
import PremiumPageLoader from '../components/common/PremiumPageLoader';
import TopNavigationLoader from '../components/common/TopNavigationLoader';

// Lazy-loaded Public Pages
const LandingPage = React.lazy(() => import('../pages/landing/LandingPage'));
const StudentLogin = React.lazy(() => import('../pages/auth/StudentLogin'));
const StaffLogin = React.lazy(() => import('../pages/auth/StaffLogin'));
const AdminLogin = React.lazy(() => import('../pages/auth/AdminLogin'));

// Lazy-loaded Layouts
const StudentLayout = React.lazy(() => import('../layouts/StudentLayout'));
const StaffLayout = React.lazy(() => import('../layouts/StaffLayout'));
const AdminLayout = React.lazy(() => import('../layouts/AdminLayout'));

// Lazy-loaded Student Pages
const StudentOnboarding = React.lazy(() => import('../pages/student/StudentOnboarding'));
const StudentDashboard = React.lazy(() => import('../pages/student/StudentDashboard'));
const StudentComplaints = React.lazy(() => import('../pages/student/StudentComplaints'));
const NewComplaint = React.lazy(() => import('../pages/student/NewComplaint'));
const StudentComplaintDetail = React.lazy(() => import('../pages/student/StudentComplaintDetail'));
const StudentNotifications = React.lazy(() => import('../pages/student/StudentNotifications'));
const StudentProfile = React.lazy(() => import('../pages/student/StudentProfile'));

// Lazy-loaded Staff Pages
const StaffDashboard = React.lazy(() => import('../pages/staff/StaffDashboard'));
const StaffTasks = React.lazy(() => import('../pages/staff/StaffTasks'));
const StaffTaskDetail = React.lazy(() => import('../pages/staff/StaffTaskDetail'));
const StaffHistory = React.lazy(() => import('../pages/staff/StaffHistory'));
const StaffNotifications = React.lazy(() => import('../pages/staff/StaffNotifications'));
const StaffProfile = React.lazy(() => import('../pages/staff/StaffProfile'));

// Lazy-loaded Admin / Warden Pages
const AdminDashboard = React.lazy(() => import('../pages/admin/AdminDashboard'));
const AdminComplaints = React.lazy(() => import('../pages/admin/AdminComplaints'));
const AdminComplaintDetail = React.lazy(() => import('../pages/admin/AdminComplaintDetail'));
const AdminVerifications = React.lazy(() => import('../pages/admin/AdminVerifications'));
const AdminStaff = React.lazy(() => import('../pages/admin/AdminStaff'));
const AdminBlocks = React.lazy(() => import('../pages/admin/AdminBlocks'));
const AdminStudents = React.lazy(() => import('../pages/admin/AdminStudents'));
const AdminAnalytics = React.lazy(() => import('../pages/admin/AdminAnalytics'));
const AdminNotifications = React.lazy(() => import('../pages/admin/AdminNotifications'));
const AdminSettings = React.lazy(() => import('../pages/admin/AdminSettings'));

// Route transition suspense fallback
const RouteLoadingFallback = () => (
  <div className="flex-1 min-h-[50vh] flex items-center justify-center p-8">
    <div className="w-8 h-8 rounded-full border-2 border-electric border-t-transparent animate-spin" />
  </div>
);

export function AppRoutes() {
  const { loading } = useAuth();
  const location = useLocation();

  // Public routes that never require authentication to render
  const isPublicRoute =
    location.pathname === '/' ||
    location.pathname.startsWith('/student/login') ||
    location.pathname.startsWith('/staff/login') ||
    location.pathname.startsWith('/admin/login');

  // Avoid blocking the initial landing page or public auth screens
  const [initialLoadingComplete, setInitialLoadingComplete] = useState(() => isPublicRoute);

  // Decouple public landing page and login screens from background auth verification
  const isLoaderReady = isPublicRoute ? true : !loading;

  return (
    <>
      {/* Premium Cinematic Initial Page Loader */}
      {!initialLoadingComplete && !isPublicRoute && (
        <PremiumPageLoader
          isReady={isLoaderReady}
          minShowcaseMs={500}
          maxFallbackMs={2500}
          onComplete={() => setInitialLoadingComplete(true)}
        />
      )}

      {/* Top Progress Bar on Route Navigation */}
      <TopNavigationLoader />

      <div className={`flex-1 flex flex-col min-h-0 w-full ${initialLoadingComplete ? 'animate-page-reveal' : ''}`}>
        <Suspense fallback={<RouteLoadingFallback />}>
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
        </Suspense>
      </div>
    </>
  );
}

export default AppRoutes;

