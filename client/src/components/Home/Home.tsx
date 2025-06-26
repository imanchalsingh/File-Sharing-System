import React, { useState } from "react";
import { Menu, X } from "lucide-react";
import { Outlet, useNavigate } from "react-router-dom";

const Home: React.FC = () => {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(true);

  return (
    <div className="h-screen flex">
      {/* Sidebar */}
      <div
        className={`${
          isOpen ? "w-64" : "w-16"
        } h-screen bg-gradient-to-b from-red-300 to-pink-50 shadow-[0_6px_15px_rgba(100,100,100,0.3)] rounded-r-2xl p-4 transition-all duration-300 flex flex-col justify-start`}
      >
        <button
          className="mb-6 text-black cursor-pointer"
          onClick={() => setIsOpen(!isOpen)}
        >
          {isOpen ? <X size={24} /> : <Menu size={24} />}
        </button>

        {isOpen && (
          <div className="space-y-4 text-black ">
            <button
              onClick={() => navigate("/home/content")}
              className="w-full text-left px-4 py-2 rounded-lg bg-white/60 hover:bg-white/80 hover:text-red-500 transition-all duration-300 shadow-sm cursor-pointer"
            >
              🏠 Home
            </button>

            <button
              onClick={() => navigate("/home/myfiles")}
              className="w-full text-left px-4 py-2 rounded-lg bg-white/60 hover:bg-white/80 hover:text-red-500 transition-all duration-300 shadow-sm cursor-pointer"
            >
              📁 My Files
            </button>
          </div>
        )}
      </div>

      {/* Dynamic Page Content */}
      <div className="flex-1 p-6 bg-gradient-to-l from-red-100 to-pink-50 overflow-y-auto">
        <h1
          style={{ fontFamily: "Satisfy" }}
          className="text-2xl font-bold mb-4 text-red-500"
        >
          ShareVault - File Sharing System
        </h1>
        <Outlet />
      </div>
    </div>
  );
};

export default Home;
