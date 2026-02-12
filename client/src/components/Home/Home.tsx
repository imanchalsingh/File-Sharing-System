import React, { useState, useEffect } from "react";
import {
  LogOut,
  Menu,
  X,
  Home as HomeIcon,
  Folder,
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
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [user] = useState({
    email: localStorage.getItem("userEmail") || "user@example.com",
    storage: 3.2,
    storageLimit: 10,
  });

  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (mobile) {
        setIsOpen(false);
        setIsMobileMenuOpen(false);
      } else {
        setIsOpen(true);
      }
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

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
      icon: <BarChart3 className="w-5 h-5" />,
      label: "Analytics",
      path: "/home/analytics",
    },
  ];

  const handleLogout = () => {
    localStorage.removeItem("authToken");
    localStorage.removeItem("userEmail");
    navigate("/login");
  };

  const handleNavigation = (path: string) => {
    navigate(path);
    if (isMobile) {
      closeMobileMenu();
    }
  };

  return (
    <div className="h-screen bg-gradient-to-br from-gray-900 to-gray-800 flex overflow-hidden">
      {/* Desktop Sidebar */}
      <div
        className={`
          ${isOpen ? "w-64" : "w-20"} 
          h-screen bg-gray-800/80 backdrop-blur-xl
          border-r border-gray-700
          transition-all duration-300 ease-in-out
          flex flex-col
          ${isMobile ? "hidden" : "flex"}
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

        {/* Desktop Navigation */}
        <div className="flex-1 overflow-y-auto p-4">
          <nav className="space-y-2">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <button
                  key={item.path}
                  onClick={() => handleNavigation(item.path)}
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

        {/* Desktop User Profile */}
        <div className="p-4 border-t border-gray-700">
          <div className="flex items-center">
            <div className="w-10 h-10 bg-gradient-to-r from-[#3498db] to-[#2ecc71] rounded-full flex items-center justify-center flex-shrink-0">
              <User className="w-5 h-5 text-white" />
            </div>
            {isOpen && (
              <div className="ml-3 flex-1 overflow-hidden">
                <div className="text-white font-medium truncate">
                  {user.email.split('@')[0]}
                </div>
                <div className="text-gray-400 text-sm truncate">
                  {user.email}
                </div>
              </div>
            )}
            {isOpen && (
              <button
                onClick={handleLogout}
                className="p-2 text-gray-400 hover:text-red-400 transition-colors ml-auto"
                title="Logout"
              >
                <LogOut size={18} />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Header */}
      {isMobile && (
        <div className="fixed top-0 left-0 right-0 z-40 bg-gray-900 border-b border-gray-700 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <button
                onClick={toggleMobileMenu}
                className="p-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white transition-colors"
              >
                <Menu size={24} />
              </button>
              <div className="flex items-center space-x-2">
                <Cloud className="w-8 h-8 text-[#3498db]" />
                <span className="text-xl font-bold text-white">
                  SecureShare
                </span>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="p-2 text-gray-400 hover:text-red-400 transition-colors"
              title="Logout"
            >
              <LogOut size={20} />
            </button>
          </div>
        </div>
      )}

      {/* Mobile Sidebar - Full Screen Menu */}
      {isMobile && (
        <>
          {/* Backdrop */}
          {isMobileMenuOpen && (
            <div
              className="fixed inset-0 bg-black/80 z-40 transition-opacity duration-300"
              onClick={closeMobileMenu}
            />
          )}

          {/* Sidebar */}
          <div
            className={`
              fixed top-0 left-0 h-full w-72 bg-gray-900 z-50
              transform transition-transform duration-300 ease-in-out
              ${isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"}
              flex flex-col
            `}
          >
            {/* Mobile Sidebar Header */}
            <div className="p-5 border-b border-gray-700">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Cloud className="w-10 h-10 text-[#3498db]" />
                  <div>
                    <span className="text-xl font-bold text-white">
                      SecureShare
                    </span>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {user.email}
                    </p>
                  </div>
                </div>
                <button
                  onClick={closeMobileMenu}
                  className="p-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white transition-colors"
                >
                  <X size={24} />
                </button>
              </div>
            </div>

            {/* User Info Card */}
            <div className="p-5 border-b border-gray-700 bg-gradient-to-r from-[#3498db]/10 to-[#2ecc71]/10">
              <div className="flex items-center">
                <div className="w-14 h-14 bg-gradient-to-r from-[#3498db] to-[#2ecc71] rounded-full flex items-center justify-center flex-shrink-0">
                  <User className="w-7 h-7 text-white" />
                </div>
                <div className="ml-4">
                  <div className="text-white font-semibold text-lg">
                    {user.email.split('@')[0]}
                  </div>
                  <div className="text-gray-400 text-sm">
                    {user.email}
                  </div>
                </div>
              </div>
              
              {/* Storage Progress */}
              <div className="mt-4">
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-300">Storage</span>
                  <span className="text-gray-400">{user.storage} GB / {user.storageLimit} GB</span>
                </div>
                <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-[#3498db] to-[#2ecc71] rounded-full transition-all duration-500"
                    style={{ width: `${(user.storage / user.storageLimit) * 100}%` }}
                  ></div>
                </div>
              </div>
            </div>

            {/* Mobile Navigation */}
            <div className="flex-1 overflow-y-auto p-5">
              <h3 className="text-xs uppercase tracking-wider text-gray-500 font-semibold mb-4 px-3">
                Menu
              </h3>
              <nav className="space-y-2">
                {navItems.map((item) => {
                  const isActive = location.pathname === item.path;
                  return (
                    <button
                      key={item.path}
                      onClick={() => handleNavigation(item.path)}
                      className={`
                        w-full flex items-center px-4 py-4 rounded-xl transition-all duration-200
                        ${
                          isActive
                            ? "bg-gradient-to-r from-[#3498db] to-[#2ecc71] text-white shadow-lg"
                            : "text-gray-400 hover:text-white hover:bg-gray-800"
                        }
                      `}
                    >
                      <div className={isActive ? "text-white" : "text-gray-400"}>
                        {React.cloneElement(item.icon, { className: "w-6 h-6" })}
                      </div>
                      <span className="ml-4 font-medium text-base">{item.label}</span>
                      {isActive && (
                        <span className="ml-auto text-white">
                          <div className="w-2 h-2 bg-white rounded-full"></div>
                        </span>
                      )}
                    </button>
                  );
                })}
              </nav>

              {/* Additional Mobile Options */}
              <div className="mt-8">
                <h3 className="text-xs uppercase tracking-wider text-gray-500 font-semibold mb-4 px-3">
                  Account
                </h3>
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center px-4 py-4 rounded-xl text-gray-400 hover:text-white hover:bg-gray-800 transition-all duration-200"
                >
                  <LogOut className="w-6 h-6" />
                  <span className="ml-4 font-medium text-base">Logout</span>
                </button>
              </div>
            </div>

            {/* Mobile Footer */}
            <div className="p-5 border-t border-gray-700">
              <div className="text-center">
                <p className="text-sm text-gray-500">© 2026 SecureShare</p>
                <p className="text-xs text-gray-600 mt-1">All files encrypted</p>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Main Content */}
      <div className={`flex-1 overflow-hidden flex flex-col ${isMobile ? 'pt-16' : ''}`}>
        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          {location.pathname === "/home" ? <HomeContent /> : <Outlet />}
        </main>

        {/* Footer - Hidden on mobile */}
        {!isMobile && (
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
        )}
      </div>
    </div>
  );
};

export default Home;