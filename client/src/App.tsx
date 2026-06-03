import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import Login from "./components/Authentication/Login";
import LandingPage from "./components/Home/LandingPage";

const App: React.FC = () => {
  return (
    <Routes>
      {/* Landing Page - Home */}
      <Route path="/" element={<LandingPage />} />

      {/* Login Page */}
      <Route path="/login" element={<Login />} />

      {/* Redirect unknown paths to home */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default App;
