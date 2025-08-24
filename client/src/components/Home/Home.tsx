import React, { useState } from "react";
import { LogOut, Menu, X } from "lucide-react";
import { Outlet, useNavigate } from "react-router-dom";
import HomeContent from "./HomeContent";
import { FaHome } from "react-icons/fa";

const Home: React.FC = () => {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(true);

  return (
    <div className="h-screen flex">
      {/* Sidebar */}
      <div
        className={`${
          isOpen ? "w-64" : "w-16"
        } h-screen bg-gradient-to-b from-[#bfc7df66] to-[#8ca0de60] shadow-[0_6px_15px_rgba(100,100,100,0.3)] rounded-r-2xl p-4 transition-all duration-300 flex flex-col justify-start`}
      >
        <button
          className="mb-6 text-black cursor-pointer"
          onClick={() => setIsOpen(!isOpen)}
        >
          {isOpen ? <X size={24} /> : <Menu size={24} />}
        </button>

        {isOpen && (
          <div className="space-y-4 ">
            <button
              onClick={() => navigate("/home/myfiles")}
              className="w-full text-left px-4 py-2 rounded-lg bg-white/60 hover:bg-white/80 text-[#3158cd] hover:text-[#133aaf]  transition-all duration-300 shadow-sm cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <FaHome className="text-2xl" />{" "}
                <span
                  style={{ fontFamily: "Josefin sans" }}
                  className="font-bold"
                >
                  My Files
                </span>
              </div>
            </button>
          </div>
        )}
      </div>

      {/* Dynamic Page Content */}
      <div className="flex-1 p-2 overflow-y-auto">
        <nav className="bg-white/70 backdrop-blur-md p-3 rounded-2xl mb-3 shadow-md flex justify-between items-center">
          {/* Brand */}
          <h1
            style={{
              fontFamily: "'Lavishly Yours', cursive",
              cursor: "pointer",
            }}
            className="text-3xl md:text-4xl font-bold text-[#3158cd]"
            onClick={() => navigate("/home")}
          >
            <span className="bg-gradient-to-l from-gray-800 to-[#4270fa] bg-clip-text text-transparent drop-shadow-md">
              ShareVault{" "}
            </span>

            <span
              className="hidden sm:inline text-lg md:text-xl"
              style={{ fontFamily: "Josefin Sans, sans-serif" }}
            >
              - File Sharing System
            </span>
          </h1>

          {/* Logout Button */}
          <button
            onClick={() => {
              localStorage.removeItem("authToken");
              navigate("/login");
            }}
            className="ml-4 flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#3158cd] text-white hover:bg-[#133aaf]  transition-all duration-300 shadow-sm cursor-pointer text-sm md:text-base"
          >
            {/* Text hidden on mobile */}
            <span className="hidden sm:inline">Logout</span>
            {/* Icon always visible */}
            <LogOut className="w-5 h-5" />
          </button>
        </nav>
        {/* Render the selected page */}
        {window.location.pathname === "/home" ? <HomeContent /> : <Outlet />}
      </div>
    </div>
  );
};

export default Home;
