import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import Home from "./components/Home/Home";
import Register from "./components/Authentication/Register";
import Login from "./components/Authentication/Login";
import MyFiles from "./components/Home/MyFiles";
import HomeContent from "./components/Home/HomeContent";
import LandingPage from "./components/Home/LandingPage";
import Analytics from "./components/Home/Analytics";
import Favorites from "./components/Home/Favorites";
import ShareManager from "./components/Home/ShareManager";
import SharedFileAccess from "./components/SharedFileAccess";
import ExpiredSharePage from "./components/ExpiredSharePage";
import ProtectedRoute from "./components/ProtectedRoute";
import Webhooks from "./components/Home/Webhooks";
import SharePage from "./components/Share/SharePage";
import Settings from "./components/Home/Settings";
import ScrollToTopButton from "./components/ScrollToTopButton";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import TermsOfService from "./pages/TermsOfService";
import ErrorBoundary from "./components/common/ErrorBoundary";

const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <Routes>
        {/* Landing Page - Home */}
        <Route path="/" element={<LandingPage />} />

        {/* Public Share Page */}
        <Route path="/share/:id" element={<SharePage />} />

        {/* Auth Routes */}
        <Route path="/register" element={<Register />} />
        <Route path="/login" element={<Login />} />

        {/* Protected Dashboard Routes */}
        <Route
          path="/home"
          element={
            <ProtectedRoute>
              <Home />
            </ProtectedRoute>
          }
        >
          <Route index element={<HomeContent />} />
          <Route path="myfiles" element={<MyFiles />} />
          <Route path="analytics" element={<Analytics />} />
          <Route path="favorites" element={<Favorites />} />
          <Route path="shares" element={<ShareManager />} />
          <Route path="webhooks" element={<Webhooks />} />
          <Route path="settings" element={<Settings />} />
        </Route>

        {/* Public Share Access Routes */}
        <Route path="/s/:token" element={<SharedFileAccess />} />
        <Route path="/expired" element={<ExpiredSharePage />} />

        {/* Legal Pages */}
        <Route path="/privacy" element={<PrivacyPolicy />} />
        <Route path="/terms" element={<TermsOfService />} />

        {/* Redirect unknown paths to home */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <ToastContainer />
      <ScrollToTopButton />
    </ErrorBoundary>
  );
};

export default App;
