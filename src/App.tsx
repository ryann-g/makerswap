import * as React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './hooks/useAuth';
import { Navbar } from './components/layout/Navbar';
import { Footer } from './components/layout/Footer';
import { MarketplaceView } from '@/components/views/MarketplaceView';
import { BountiesView } from '@/components/views/BountiesView';
import { DashboardView } from '@/components/views/DashboardView';
import { ProfileView } from '@/components/views/ProfileView';
import { TermsView } from '@/components/views/TermsView';
import { PrivacyView } from '@/components/views/PrivacyView';
import { ContactView } from '@/components/views/ContactView';
import { Toaster } from 'sonner';
import { ErrorBoundary } from './components/ErrorBoundary';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="h-screen flex items-center justify-center">Loading...</div>;
  if (!user) return <Navigate to="/" />;
  return <>{children}</>;
}

function AppContent() {
  const location = useLocation();
  const currentView = location.pathname === '/' ? 'marketplace' : location.pathname.slice(1);

  return (
    <div className="flex flex-col min-h-screen font-sans antialiased">
      <Navbar currentView={currentView} />
      
      <main className="flex-1">
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
