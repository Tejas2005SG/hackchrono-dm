// components/Dashboard/DashboardLayout.jsx
import React, { useState } from "react";
import { useNavigate, useLocation, Outlet } from "react-router-dom";
import { useAuthStore } from "../../store/auth.store.ts";
import ProtectedRoute from "../../store/protectRoute.tsx";
import {
  Zap,
  ChevronLeft,
  ChevronRight,
  X,
  Home,
  Settings,
  HelpCircle,
  LogOut,
  Bell,
  Menu,
  Map,
  Box,
  FileQuestionMark,
} from "lucide-react";
import './style.css';
import Jarvis from '../jarvis.jsx';

function DashboardLayout() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarExpanded, setSidebarExpanded] = useState(false);

  const handleLogout = async () => {
    try {
      // Uncomment when API is ready
      // await api.post("/auth/logout");
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      logout();
      navigate("/login");
    }
  };

  // Check if current path matches the item path
  const isActive = (path) => {
    return location.pathname === path;
  };

  // Sidebar items
  const navigationItems = [
    { icon: Box, label: "3D View", path: "/dashboard/predict-disaster" },
    { icon: Map, label: "GIS", path: "/dashboard/gis" },
    { icon: FileQuestionMark, label: "whatif", path: "/dashboard/whatif" },
    // Add more navigation items here
    // { icon: BarChart, label: "Analytics", path: "/dashboard/analytics" },
  ];

  const generalItems = [
    // { icon: Settings, label: "Settings", path: "/dashboard/settings" },
    // { icon: HelpCircle, label: "Help", path: "/dashboard/help" },
    { icon: LogOut, label: "Logout", action: handleLogout },
  ];

  const NavItem = ({ item, isGeneral = false }) => (
    <div className="tooltip-trigger relative">
      {item.action ? (
        <button
          onClick={item.action}
          className={`flex items-center ${
            sidebarExpanded
              ? "px-4 py-3 w-full mx-2"
              : "justify-center w-12 h-12 mx-auto"
          } rounded-xl transition-all duration-200 text-zinc-400 hover:text-yellow-400 hover:bg-zinc-800/50`}
        >
          <item.icon
            size={20}
            className={sidebarExpanded ? "mr-3 flex-shrink-0" : ""}
          />
          {sidebarExpanded && (
            <span className="font-medium truncate">{item.label}</span>
          )}
        </button>
      ) : (
        <button
          onClick={() => {
            navigate(item.path);
            setSidebarOpen(false); // Close mobile sidebar on navigation
          }}
          className={`flex items-center ${
            sidebarExpanded
              ? "px-4 py-3 w-full mx-2"
              : "justify-center w-12 h-12 mx-auto"
          } rounded-xl transition-all duration-200 ${
            isActive(item.path)
              ? "text-yellow-400 bg-zinc-800/70"
              : "text-zinc-400 hover:text-yellow-400 hover:bg-zinc-800/50"
          }`}
        >
          <item.icon
            size={20}
            className={sidebarExpanded ? "mr-3 flex-shrink-0" : ""}
          />
          {sidebarExpanded && (
            <span className="font-medium truncate">{item.label}</span>
          )}
        </button>
      )}
      {/* Tooltip for collapsed sidebar */}
      {!sidebarExpanded && (
        <div className="tooltip absolute left-16 top-1/2 -translate-y-1/2 ml-2 px-3 py-2 bg-zinc-800 text-white text-sm rounded-lg shadow-lg border border-zinc-700 whitespace-nowrap z-50">
          {item.label}
          <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1 w-2 h-2 bg-zinc-800 border-l border-b border-zinc-700 rotate-45"></div>
        </div>
      )}
    </div>
  );

  return (
    <ProtectedRoute>
      <div className="h-screen bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-800 p-4 overflow-hidden">
        <div className="flex h-full gap-4">
          {/* Sidebar */}
          <div
            className={`flex-shrink-0 ${
              sidebarExpanded ? "w-64" : "w-16"
            } transition-all duration-300`}
          >
            <div
              className={`${
                sidebarOpen ? "translate-x-0" : "-translate-x-full"
              } lg:translate-x-0 fixed lg:static inset-y-0 left-0 z-50 ${
                sidebarExpanded ? "w-64" : "w-16"
              } bg-zinc-900/95 backdrop-blur-sm border border-yellow-100/20 rounded-2xl transition-all duration-300 lg:h-full overflow-hidden`}
            >
              <div className="flex flex-col h-full">
                {/* Header with Logo/Toggle */}
                <div
                  className={`flex items-center ${
                    sidebarExpanded
                      ? "justify-between px-4"
                      : "justify-center px-2"
                  } h-16 border-b border-zinc-800`}
                >
                  {sidebarExpanded ? (
                    <>
                      <div className="flex items-center">
                        <div className="w-8 h-8 bg-gradient-to-r from-yellow-500 to-yellow-400 rounded-lg flex items-center justify-center text-zinc-900 mr-3 shadow-lg">
                          <Zap size={18} className="font-bold" />
                        </div>
                        <h1 className="text-xl font-bold bg-gradient-to-r from-yellow-400 to-yellow-300 bg-clip-text text-transparent">
                          Rakshak AI
                        </h1>
                      </div>
                      <button
                        onClick={() => setSidebarExpanded(!sidebarExpanded)}
                        className="hidden lg:flex items-center justify-center w-8 h-8 text-zinc-400 hover:text-yellow-400 hover:bg-zinc-800/50 rounded-lg transition-colors flex-shrink-0"
                      >
                        <ChevronLeft size={16} />
                      </button>
                    </>
                  ) : (
                    <div className="relative w-full flex justify-center">
                      <div className="w-8 h-8 bg-gradient-to-r from-yellow-500 to-yellow-400 rounded-lg flex items-center justify-center text-zinc-900 font-bold shadow-lg">
                        <Zap size={18} />
                      </div>
                      <button
                        onClick={() => setSidebarExpanded(!sidebarExpanded)}
                        className="hidden lg:flex items-center justify-center w-6 h-6 text-zinc-400 hover:text-yellow-400 hover:bg-zinc-800/50 rounded-md transition-colors absolute -right-3 top-1/2 -translate-y-1/2 bg-zinc-900 border border-yellow-500/20"
                      >
                        <ChevronRight size={12} />
                      </button>
                    </div>
                  )}
                  <button
                    onClick={() => setSidebarOpen(false)}
                    className="lg:hidden text-zinc-400 hover:text-yellow-400"
                  >
                    <X size={24} />
                  </button>
                </div>

                {/* Navigation */}
                <nav className="flex-1 mt-8 px-2 overflow-y-auto no-scrollbar">
                  <div className="space-y-3">
                    {navigationItems.map((item, index) => (
                      <NavItem key={index} item={item} />
                    ))}
                  </div>

                  <div className="my-8">
                    <div
                      className={`h-px bg-zinc-700 ${
                        sidebarExpanded ? "mx-2" : "mx-1"
                      }`}
                    ></div>
                    {sidebarExpanded && (
                      <p className="text-xs text-zinc-500 uppercase tracking-wider mt-4 mb-4 mx-2">
                        General
                      </p>
                    )}
                  </div>

                  <div className="space-y-3">
                    {generalItems.map((item, index) => (
                      <NavItem key={index} item={item} isGeneral={true} />
                    ))}
                  </div>
                </nav>
              </div>
            </div>
          </div>

          {/* Main Content Area with Outlet */}
          <div className="flex-1 flex flex-col min-w-0">
            {/* Header */}
            <header className="bg-zinc-900/80 backdrop-blur-sm border border-yellow-100/20 rounded-2xl mb-4 flex-shrink-0">
              <div className="px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                  <div className="flex items-center min-w-0">
                    <button
                      onClick={() => setSidebarOpen(true)}
                      className="lg:hidden text-zinc-400 hover:text-yellow-400 mr-4 flex-shrink-0"
                    >
                      <Menu size={24} />
                    </button>
                    <div className="min-w-0">
                      <h1 className="text-xl font-bold text-white truncate">
                        Rakshak AI
                      </h1>
                      <p className="hidden sm:block text-sm text-zinc-400 truncate">
                        Stay Safe from Disaster Management
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3 flex-shrink-0">
                    <button className="p-2 text-zinc-400 hover:text-yellow-400 transition-colors">
                      <Bell size={20} />
                    </button>
                    <div className="flex items-center space-x-3">
                      <span className="hidden sm:block text-sm text-zinc-300 whitespace-nowrap">
                        Welcome, {user?.username || "User"}
                      </span>
                      <div className="w-8 h-8 bg-gradient-to-r from-yellow-500 to-yellow-400 rounded-full flex items-center justify-center text-zinc-900 font-medium text-sm flex-shrink-0">
                        {user?.username?.charAt(0).toUpperCase() || "U"}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </header>

            {/* Main Content - Outlet renders child routes here */}
            <main className="flex-1 overflow-y-auto custom-scrollbar bg-zinc-900/40 backdrop-blur-sm border border-yellow-100/20 rounded-2xl p-4 sm:p-6 lg:p-8 min-h-0">
              <Outlet />
            </main>
          </div>
        </div>

        {/* Mobile Sidebar Overlay */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          ></div>
        )}
      </div>
      <Jarvis/>
    </ProtectedRoute>
  );
}

export default DashboardLayout;