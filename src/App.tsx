import * as React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './hooks/useAuth';
import { Navbar } from './components/layout/Navbar';
import { Footer } from './components/layout/Footer';
import { MarketplaceView } from '@/components/views/MarketplaceView';
import { BountiesView } from '@/components/views/BountiesView';
import { Toaster } from 'sonner';
import { ErrorBoundary } from './components/ErrorBoundary';

const DashboardView = React.lazy(() => import('@/components/views/DashboardView').then(m => ({ default: m.DashboardView })));
const ProfileView = React.lazy(() => import('@/components/views/ProfileView').then(m => ({ default: m.ProfileView })));
const TermsView = React.lazy(() => import('@/components/views/TermsView').then(m => ({ default: m.TermsView })));
const PrivacyView = React.lazy(() => import('@/components/views/PrivacyView').then(m => ({ default: m.PrivacyView })));
const ContactView = React.lazy(() => import('@/components/views/ContactView').then(m => ({ default: m.ContactView })));

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="h-screen flex items-center justify-center">Loading...</div>;
  if (!user) return <Navigate to="/" />;
  return <>{children}</>;
}

function AppContent() {
  return (
    <div className="flex flex-col min-h-screen font-sans antialiased">
      <Navbar />
      
      <main className="flex-1">
        <React.Suspense fallback={<div className="flex h-full min-h-[50vh] items-center justify-center">Loading...</div>}>
          <Routes>
            <Route path="/" element={<MarketplaceView />} />
            <Route path="/bounties" element={<BountiesView />} />
            <Route path="/terms" element={<TermsView />} />
            <Route path="/privacy" element={<PrivacyView />} />
            <Route path="/contact" element={<ContactView />} />
            <Route 
              path="/dashboard" 
              element={
                <ProtectedRoute>
                  <DashboardView />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/profile" 
              element={
                <ProtectedRoute>
                  <ProfileView />
                </ProtectedRoute>
              } 
            />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </React.Suspense>
      </main>

      <Footer />
      <Toaster position="top-right" richColors />
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <Router>
        <AuthProvider>
          <AppContent />
        </AuthProvider>
      </Router>
    </ErrorBoundary>
  );
}
