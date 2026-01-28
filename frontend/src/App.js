import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { NotificationProvider } from './context/NotificationContext';
import ErrorBoundary from './components/ErrorBoundary';
import { Layout } from './components/Layout';
import { MainPage } from './pages/MainPage';
import { LoginPage, RegisterPage } from './pages/AuthPages';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import PostsPage from './pages/PostsPage';
import PostDetailPage from './pages/PostDetailPage';
import CreatePostPage from './pages/CreatePostPage';
import StudyDetailPage from './pages/StudyDetailPage';
import CreateIssuePage from './pages/CreateIssuePage';
import IssueDetailPage from './pages/IssueDetailPage';
import ProfilePage from './pages/ProfilePage';
import './App.css';

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? children : <Navigate to="/login" />;
};

function AppContent() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route 
            path="/" 
            element={<MainPage />} 
          />
          <Route 
            path="/study/:studyId/posts" 
            element={<PostsPage />} 
          />
          <Route 
            path="/study/:studyId/posts/create" 
            element={<CreatePostPage />} 
          />
          <Route 
            path="/study/:studyId/posts/:postId" 
            element={<PostDetailPage />} 
          />
          <Route 
            path="/study/:studyId/posts/:postId/edit" 
            element={<CreatePostPage />} 
          />
          <Route
            path="/study/:studyId"
            element={<StudyDetailPage />}
          />
          <Route
            path="/study/:studyId/issues/create"
            element={<CreateIssuePage />}
          />
          <Route
            path="/study/:studyId/issues/:issueId"
            element={<IssueDetailPage />}
          />
          <Route
            path="/study/:studyId/issues/:issueId/edit"
            element={<CreateIssuePage />}
          />
          <Route
            path="/profile"
            element={<ProfilePage />}
          />
        </Routes>
      </Layout>
    </Router>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ToastProvider>
        <AuthProvider>
          <NotificationProvider>
            <AppContent />
          </NotificationProvider>
        </AuthProvider>
      </ToastProvider>
    </ErrorBoundary>
  );
}

export default App;
