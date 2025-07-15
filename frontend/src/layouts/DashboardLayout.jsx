import { Link, Outlet, useLocation } from 'react-router-dom';

export default function DashboardLayout() {
  const location = useLocation();

  const navItems = [
    { label: 'Home', path: '/' },
    { label: 'Search Console', path: '/search-console' },
    { label: 'SEO Report', path: '/seo-report' },
    { label: 'Blog Ideas', path: '/blog-ideas' },
    { label: 'SEO Tasks', path: '/seo-tasks' },
  ];

  return (
    <div className="flex min-h-screen bg-gray-50">
      <aside className="w-64 bg-white border-r shadow-sm p-6">
        <h2 className="text-xl font-bold mb-6 text-purple-800">🚀 AI SEO Dashboard</h2>
        <nav className="flex flex-col gap-2">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`p-2 rounded-lg transition text-sm font-medium
                ${location.pathname === item.path ? 'bg-purple-100 text-purple-900 font-semibold' : 'text-gray-700 hover:bg-gray-100'}`}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </aside>

      <main className="flex-1 p-6 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
}
