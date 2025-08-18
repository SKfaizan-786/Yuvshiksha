// client/src/components/layouts/DashboardLayout.jsx
import React from 'react';
import { logoutUser } from '../../utils/auth';
import { Link, useLocation } from 'react-router-dom';
import {
  Home,
  BookOpen,
  Users,
  LogOut,
  LayoutDashboard,
} from 'lucide-react';

const DashboardLayout = ({ children, user }) => {
  const location = useLocation();
  const isStudent = user?.role === 'student';

  const menuItems = [
    { label: 'Dashboard', path: isStudent ? '/student/dashboard' : '/teacher/dashboard', icon: <LayoutDashboard size={20} /> },
    { label: 'Courses', path: '#', icon: <BookOpen size={20} /> },
    { label: 'Users', path: '#', icon: <Users size={20} /> },
  ];

  return (
    <div className="flex min-h-screen bg-gray-900 text-white">
      {/* Sidebar */}
      <aside className="w-64 bg-gray-800 shadow-lg hidden md:flex flex-col">
        <div className="p-6 text-xl font-bold tracking-wide border-b border-gray-700">
          PRI_PAID
        </div>
        <nav className="flex flex-col gap-2 mt-4 px-4">
          {menuItems.map((item) => (
            <Link
              key={item.label}
              to={item.path}
              className={`flex items-center gap-3 px-3 py-2 rounded hover:bg-gray-700 transition ${
                location.pathname === item.path ? 'bg-gray-700' : ''
              }`}
            >
              {item.icon}
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="mt-auto p-4">
          <button
            onClick={logoutUser}
            className="flex items-center gap-2 text-red-400 hover:text-red-500 transition"
          >
            <LogOut size={20} /> Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Top Navbar */}
        <header className="bg-gray-800 px-6 py-4 flex justify-between items-center shadow-md">
          <h1 className="text-xl font-semibold capitalize">
            {user?.role} Dashboard
          </h1>
          <span className="text-sm text-gray-300">Welcome, {user?.name}</span>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-6 overflow-auto">{children}</main>
      </div>
    </div>
  );
};

export default DashboardLayout;
