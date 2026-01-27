import React from 'react';
import { useAuth } from '../context/AuthContext';
import NotificationBell from './NotificationBell';
import '../styles/Layout.css';

export const Layout = ({ children }) => {
  const { user, logout } = useAuth();

  return (
    <div className="layout">
      <nav className="navbar">
        <div className="navbar-container">
          <h1 className="navbar-brand">
            <a href="/">📚 Study Together</a>
          </h1>
          
          <div className="navbar-menu">
            {user ? (
              <>
                <NotificationBell />
                <span className="navbar-user">👤 {user.username}</span>
                <button onClick={logout} className="btn btn-logout">
                  Logout
                </button>
              </>
            ) : (
              <>
                <a href="/login" className="navbar-link">Login</a>
                <a href="/register" className="navbar-link">Register</a>
              </>
            )}
          </div>
        </div>
      </nav>

      <main className="main-content">
        {children}
      </main>

      <footer className="footer">
        <p>&copy; 2026 Study Together. All rights reserved.</p>
      </footer>
    </div>
  );
};
