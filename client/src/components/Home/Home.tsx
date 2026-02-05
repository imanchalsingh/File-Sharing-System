import React, { useState, useEffect } from "react";
import {
  LogOut,
  Menu,
  X,
  Home as HomeIcon,
  Folder,
  Share2,
  Users,
  Settings,
  BarChart3,
  Cloud,
  Globe,
  User,
} from "lucide-react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import HomeContent from "./HomeContent";

const Home: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [user] = useState({
    name: "John Doe",
    email: localStorage.getItem("userEmail") || "user@example.com",
    storage: 3.2,
    storageLimit: 10,
  });

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
      if (window.innerWidth < 768) {
        setIsOpen(false);
      }
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const navItems = [
    {
      icon: <HomeIcon className="w-5 h-5" />,
      label: "Dashboard",
      path: "/home",
    },
    {
      icon: <Folder className="w-5 h-5" />,
      label: "My Files",
      path: "/home/myfiles",
    },
    {
      icon: <Share2 className="w-5 h-5" />,
      label: "Shared Files",
      path: "/home/shared",
    },
    {
      icon: <Users className="w-5 h-5" />,
      label: "Teams",
      path: "/home/teams",
    },
    {
      icon: <BarChart3 className="w-5 h-5" />,
      label: "Analytics",
      path: "/home/analytics",
    },
    {
      icon: <Settings className="w-5 h-5" />,
      label: "Settings",
      path: "/home/settings",
    },
  ];

  const handleLogout = () => {
    localStorage.removeItem("authToken");
    localStorage.removeItem("userEmail");
    navigate("/login");
  };

  return (
    <div className="h-screen bg-gradient-to-br from-gray-900 to-gray-800 flex overflow-hidden">
      {/* Sidebar */}
      <div
        className={`
          ${isOpen ? "w-64" : "w-20"} 
          h-screen bg-gray-800/80 backdrop-blur-xl
          border-r border-gray-700
          transition-all duration-300 ease-in-out
          flex flex-col
          ${isMobile ? (isOpen ? "fixed z-50" : "hidden") : ""}
        `}
      >
        {/* Sidebar Header */}
        <div className="p-4 border-b border-gray-700">
          <div className="flex items-center justify-between">
            {isOpen && (
              <div className="flex items-center space-x-2">
                <Cloud className="w-8 h-8 text-[#3498db]" />
                <span className="text-xl font-bold text-white">
                  SecureShare
                </span>
              </div>
            )}
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="p-2 rounded-lg bg-gray-700/50 hover:bg-gray-700 text-gray-300 hover:text-white transition-colors"
            >
              {isOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex-1 overflow-y-auto p-4">
          <nav className="space-y-2">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <button
                  key={item.path}
                  onClick={() => {
                    navigate(item.path);
                    if (isMobile) setIsOpen(false);
                  }}
                  className={`
                    w-full flex items-center ${isOpen ? "justify-start px-4" : "justify-center"} 
                    py-3 rounded-xl transition-all duration-200
                    ${
                      isActive
                        ? "bg-gradient-to-r from-[#3498db]/20 to-[#2ecc71]/10 text-white border-l-4 border-[#3498db]"
                        : "text-gray-400 hover:text-white hover:bg-gray-700/50"
                    }
                  `}
                >
                  <div className={`${isActive ? "text-[#3498db]" : ""}`}>
                    {item.icon}
                  </div>
                  {isOpen && (
                    <span className="ml-3 font-medium">{item.label}</span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* User Profile */}
        <div className="p-4 border-t border-gray-700">
          <div className="flex items-center">
            <div className="w-10 h-10 bg-gradient-to-r from-[#3498db] to-[#2ecc71] rounded-full flex items-center justify-center">
              <User className="w-5 h-5 text-white" />
            </div>
            {isOpen && (
              <div className="ml-3 flex-1 overflow-hidden">
                <div className="text-white font-medium truncate">
                  {user.name}
                </div>
                <div className="text-gray-400 text-sm truncate">
                  {user.email}
                </div>
              </div>
            )}
            {isOpen && (
              <button
                onClick={handleLogout}
                className="p-2 text-gray-400 hover:text-red-400 transition-colors"
                title="Logout"
              >
                <LogOut size={18} />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Overlay for mobile */}
      {isMobile && isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Main Content */}
      <div className="flex-1 overflow-hidden flex flex-col">
        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto p-6">
          {location.pathname === "/home" ? <HomeContent /> : <Outlet />}
        </main>

        {/* Footer */}
        <footer className="border-t border-gray-700 p-4 bg-gray-800/50">
          <div className="flex items-center justify-between text-gray-400 text-sm">
            <div className="flex items-center space-x-4">
              <span>© 2026 SecureShare</span>
              <span className="text-[#2ecc71] flex items-center">
                <Globe className="w-3 h-3 mr-1" />
                All files encrypted
              </span>
            </div>
            <div className="flex items-center space-x-6">
              <span className="text-[#3498db]">99.9% Uptime</span>
              <span>{new Date().toLocaleDateString()}</span>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default Home;
