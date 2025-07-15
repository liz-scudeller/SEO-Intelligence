import React, { useState } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import AccountInfo from '../features/account/AccountInfo';
import UserMenu from '../components/UserMenu';


import {
  LayoutDashboard,
  FileText,
  FilePenLine,
  ListChecks,
  Menu,
  X,
  Search,
} from 'lucide-react';

export default function HomeDashboard() {
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const navItems = [
    { label: 'Overview', path: '/overview', icon: <LayoutDashboard /> },
    { label: 'Search Console', path: '/search-console', icon: <Search /> },
    { label: 'SEO Report', path: '/seo-report', icon: <FileText /> },
    { label: 'Blog Ideas', path: '/blog-ideas', icon: <FilePenLine /> },
    { label: 'SEO Tasks', path: '/seo-tasks', icon: <ListChecks /> },
  ];

  const renderNav = () => (
    <nav className="space-y-1 text-sm">
      {navItems.map((item) => {
        const isActive = location.pathname.startsWith(item.path);
        return (
          <Link
            key={item.path}
            to={item.path}
            onClick={() => setMobileOpen(false)} // fecha no mobile ao clicar
            className={`flex items-center ${collapsed ? 'justify-center' : 'gap-3'} px-3 py-2 rounded-lg transition-all ${
              isActive
                ? 'bg-[#759b2c]/15 text-[#759b2c] font-semibold'
                : 'text-gray-700 hover:bg-[#2a2b2e]/5'
            }`}
          >
            <div className="w-5 h-5 flex items-center justify-center">
              {React.cloneElement(item.icon, {
                size: 20,
                color: isActive ? '#759b2c' : '#2a2b2e',
              })}
            </div>
            {!collapsed && <span>{item.label}</span>}
          </Link>
        );
      })}
    </nav>
  );

  return (
    <div className="flex min-h-screen font-sans text-gray-800">


      {/* MOBILE MENU BUTTON */}
      <button
        className="md:hidden fixed top-4 left-4 z-40 bg-white border border-gray-200 p-2 rounded shadow"
        onClick={() => setMobileOpen(true)}
      >
        <Menu size={20} />
      </button>

      {/* SIDEBAR - Desktop */}
      <aside
        className={`bg-white border-r shadow-sm hidden md:flex flex-col transition-all duration-300 ${
          collapsed ? 'w-16 p-4' : 'w-64 p-6'
        }`}
      >
        <div className="flex items-center justify-between mb-6">
          {!collapsed && (
            <h2 className="text-xl font-bold text-[#2a2b2e] tracking-tight">🔍 SEO Intelligence</h2>
          )}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="text-gray-500 hover:text-[#2a2b2e]"
          >
            <Menu size={20} />
          </button>
        </div>

        {renderNav()}

        {!collapsed && (
          <div className="mt-auto text-xs text-gray-400 pt-6 border-t">
            v1.0 – Powered by AI 🚀
          </div>
        )}
      </aside>

      {/* SIDEBAR - Mobile Overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 flex">
          <div className="w-64 bg-white shadow-md p-6 flex flex-col">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-[#2a2b2e] tracking-tight">
                🔍 SEO Intelligence
              </h2>
              <button
                onClick={() => setMobileOpen(false)}
                className="text-gray-500 hover:text-[#2a2b2e]"
              >
                <X size={20} />
              </button>
            </div>

            {renderNav()}

            <div className="mt-auto text-xs text-gray-400 pt-6 border-t">
              v1.0 – Powered by AI 🚀
            </div>
          </div>

          {/* Overlay dark */}
          <div
            className="flex-1 bg-black/30"
            onClick={() => setMobileOpen(false)}
          />
        </div>
      )}

      {/* MAIN */}
    <main className="flex-1 bg-gray-50 flex flex-col w-full">
  {/* Topbar com informações do usuário */}
      <div className="w-full flex justify-end items-center gap-4 p-4 border-b bg-white sticky top-0 z-30">
  <UserMenu />
</div>

  {/* Conteúdo principal */}
  <div className="flex-1 p-6 overflow-y-auto">
    <Outlet />
  </div>
</main>

    </div>
  );
}
