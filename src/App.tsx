import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { Toaster } from '@/components/ui/sonner';

// Pages
import Login from '@/pages/Login';
import Dashboard from '@/pages/Dashboard';
import Leads from '@/pages/Leads';
import LeadDetail from '@/pages/LeadDetail';
import Contacts from '@/pages/Contacts';
import ContactDetail from '@/pages/ContactDetail';
import Employees from '@/pages/Employees';

// Components
import Layout from '@/components/Layout';

// Protected Route Component
const ProtectedRoute: React.FC<{ children: React.ReactNode; adminOnly?: boolean }> = ({ 
    children, 
    adminOnly = false 
}) => {
    const { isAuthenticated, isLoading, isAdmin } = useAuth();

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
        );
    }

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    if (adminOnly && !isAdmin()) {
        return <Navigate to="/dashboard" replace />;
    }

    return <Layout>{children}</Layout>;
};

// Public Route Component (redirects to dashboard if already logged in)
const PublicRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { isAuthenticated, isLoading } = useAuth();

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
        );
    }

    if (isAuthenticated) {
        return <Navigate to="/dashboard" replace />;
    }

    return <>{children}</>;
};

const AppRoutes: React.FC = () => {
    return (
        <Routes>
            <Route 
                path="/login" 
                element={
                    <PublicRoute>
                        <Login />
                    </PublicRoute>
                } 
            />
            <Route 
                path="/dashboard" 
                element={
                    <ProtectedRoute>
                        <Dashboard />
                    </ProtectedRoute>
                } 
            />
            <Route 
                path="/leads" 
                element={
                    <ProtectedRoute>
                        <Leads />
                    </ProtectedRoute>
                } 
            />
            <Route 
                path="/leads/:id" 
                element={
                    <ProtectedRoute>
                        <LeadDetail />
                    </ProtectedRoute>
                } 
            />
            <Route 
                path="/contacts" 
                element={
                    <ProtectedRoute adminOnly>
                        <Contacts />
                    </ProtectedRoute>
                } 
            />
            <Route 
                path="/contacts/:id" 
                element={
                    <ProtectedRoute adminOnly>
                        <ContactDetail />
                    </ProtectedRoute>
                } 
            />
            <Route 
                path="/employees" 
                element={
                    <ProtectedRoute adminOnly>
                        <Employees />
                    </ProtectedRoute>
                } 
            />
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
    );
};

const App: React.FC = () => {
    return (
        <AuthProvider>
            <Router>
                <AppRoutes />
            </Router>
            <Toaster position="top-right" />
        </AuthProvider>
    );
};

export default App;
