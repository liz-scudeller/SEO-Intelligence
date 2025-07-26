import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import HomeDashboard from './pages/HomeDashboard';
import GSCDashboard from './pages/GSCDashboard';
import SeoReportPage from './pages/SeoReportPage';
import SeoDetailPage from './pages/SeoDetailPage';
import BlogIdeasPage from './pages/BlogIdeasPage';
import SeoTasks from './features/seoTasks/SeoTasks';
import LoginPage from './auth/LoginPage';
import ProtectedRoute from './auth/ProtectedRoute';
import SettingsPage from './pages/SettingsPage';
import OverviewDashboard from './pages/OverviewDashboard';
import ImplementationReport from './pages/ImplementationReport';




export default function App() {
  return (
    <Router>
      <Toaster position="top-right" />
      <Routes>
  <Route path="/login" element={<LoginPage />} />

  <Route
    path="/"
    element={
      <ProtectedRoute>
        <HomeDashboard />
      </ProtectedRoute>
    }
  >
    <Route index element={<Navigate to="/search-console" replace />} />
    <Route path="overview" element={<OverviewDashboard />} />
    <Route path="search-console" element={<GSCDashboard />} />
    <Route path="seo-report" element={<SeoReportPage />} />
    <Route path="seo-report/:id" element={<SeoDetailPage />} />
    <Route path="blog-ideas" element={<BlogIdeasPage />} />
    <Route path="seo-tasks" element={<SeoTasks />} />
    <Route path="settings" element={<SettingsPage />} />
    <Route path="/implementation-report" element={<ImplementationReport />} />

  </Route>
</Routes>

    </Router>
  );
}
