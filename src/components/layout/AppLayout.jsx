import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import HeaderNavbar from './Navbar';
import Sidebar from './Sidebar';
import { ToastProvider } from '../../context/ToastContext';

export default function AppLayout() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  return (
    <ToastProvider>
      <div className="app-shell">
        <HeaderNavbar
          isMobileMenuOpen={isMobileMenuOpen}
          onToggleMobileMenu={() => setIsMobileMenuOpen((prev) => !prev)}
        />
        <div className="app-body">
          <Sidebar
            isMobileOpen={isMobileMenuOpen}
            onCloseMobile={() => setIsMobileMenuOpen(false)}
            isCollapsed={isSidebarCollapsed}
            onToggleCollapse={() => setIsSidebarCollapsed((prev) => !prev)}
          />
          <main
            className={`app-main-content ${
              isSidebarCollapsed ? 'sidebar-collapsed' : ''
            }`}
          >
            <div className="app-content-container">
              <Outlet />
            </div>
          </main>
        </div>
      </div>
    </ToastProvider>
  );
}
