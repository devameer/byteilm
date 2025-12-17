import React, { Suspense, useState, useEffect } from "react";
import { Routes, Route, Navigate, Outlet } from "react-router-dom";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { ThemeProvider } from "./contexts/ThemeContext";
import { NotificationProvider } from "./contexts/NotificationContext";
import { ToastProvider, useToast } from "./contexts/ToastContext";
import { QueryProvider } from "./providers/QueryProvider";
import Layout from "./components/Layout";
import { publicRoutes, privateRoutes } from "./routes";
import LimitReachedModal from "./components/feedback/LimitReachedModal";
import { setLimitReachedHandler, setToastHandler } from "./services/api";
import AppLoadingSkeleton from "./components/skeletons/AppLoadingSkeleton";
import ErrorBoundary from "./components/ErrorBoundary";
import ToastContainer from "./components/ToastContainer";
import { PWAInstallPrompt, PWAUpdatePrompt } from "./components/pwa";

function ProtectedRoute() {
  const { user, loading } = useAuth();

  if (loading) {
    return <AppLoadingSkeleton />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <NotificationProvider user={user}>
      <Outlet />
    </NotificationProvider>
  );
}

function PublicRoute() {
  const { user, loading } = useAuth();

  if (loading) {
    return <AppLoadingSkeleton />;
  }

  // Allow access to landing and features pages even if logged in
  // Only redirect from login/register if already authenticated
  return <Outlet />;
}

function AppContent() {
  const [limitError, setLimitError] = useState(null);
  const [showLimitModal, setShowLimitModal] = useState(false);
  const toast = useToast();

  useEffect(() => {
    // Register global handler for limit reached errors
    setLimitReachedHandler((error) => {
      setLimitError(error);
      setShowLimitModal(true);
    });

    // Register toast handler for API errors
    setToastHandler({
      success: toast.success,
      error: toast.error,
      warning: toast.warning,
      info: toast.info,
    });
  }, [toast]);

  const handleCloseLimitModal = () => {
    setShowLimitModal(false);
    setLimitError(null);
  };

  return (
    <>
      <Suspense fallback={<AppLoadingSkeleton />}>
        <Routes>
          {/* Public Routes */}
          <Route element={<PublicRoute />}>
            {publicRoutes.map((route) => (
              <Route
                key={route.path}
                path={route.path}
                element={route.element}
              />
            ))}
          </Route>

          {/* Protected Routes */}
          <Route element={<ProtectedRoute />}>
            <Route element={<Layout />}>
              {privateRoutes.map((route) => (
                <Route
                  key={route.path}
                  path={route.path}
                  element={route.element}
                />
              ))}
            </Route>
          </Route>

          {/* Catch-all route */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>

      {/* Global Toast Container */}
      <ToastContainer />

      {/* Global Limit Reached Modal */}
      <LimitReachedModal
        isOpen={showLimitModal}
        onClose={handleCloseLimitModal}
        error={limitError}
      />

      {/* PWA Components */}
      <PWAInstallPrompt />
      <PWAUpdatePrompt />
    </>
  );
}

function AppRoot() {
  return (
    <ErrorBoundary>
      <QueryProvider>
        <ThemeProvider>
          <AuthProvider>
            <ToastProvider>
              <AppContent />
            </ToastProvider>
          </AuthProvider>
        </ThemeProvider>
      </QueryProvider>
    </ErrorBoundary>
  );
}


export default AppRoot;
