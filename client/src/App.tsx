import { Routes, Route, Navigate } from "react-router-dom";
import Home from "./components/Home/Home";
import Register from "./components/Authentication/Register";
import Login from "./components/Authentication/Login";
import MyFiles from "./components/Home/MyFiles";
import HomeContent from "./components/Home/HomeContent";
import LandingPage from "./components/Home/LandingPage";
import Analytics from "./components/Home/Analytics";
import ProtectedRoute from "./components/ProtectedRoute";

function App() {
  return (
    <>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Navigate to="/register" />} />
        <Route path="/register" element={<Register />} />
        <Route path="/login" element={<Login />} />
        <Route path="/landingpage" element={<LandingPage />} />
        
        {/* Protected Routes */}
        <Route 
          path="/home" 
          element={
            <ProtectedRoute>
              <Home />
            </ProtectedRoute>
          }
        >
          <Route path="myfiles" element={<MyFiles />} />
          <Route path="analytics" element={<Analytics />} />
          <Route path="" element={<HomeContent />} />
        </Route>
      </Routes>
    </>
  );
}

export default App;