import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import axios from "axios";
import Home from "./components/Home/Home"; // Has Sidebar + <Outlet />
import Register from "./components/Authentication/Register";
import Login from "./components/Authentication/Login";
import MyFiles from "./components/Home/MyFiles"; // Page
import HomeContent from "./components/Home/HomeContent"; // Default Content
import LandingPage from "./components/Home/LandingPage";
// Set up axios defaults
axios.defaults.baseURL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

// Add token to requests automatically
axios.interceptors.request.use((config) => {
  const token = localStorage.getItem("authToken");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
function App() {
  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Navigate to="/register" />} />
        <Route path="/register" element={<Register />} />
        <Route path="/login" element={<Login />} />

        {/* Protected Home Layout */}
        <Route path="landingpage" element={<LandingPage />} />
        <Route path="/home" element={<Home />}>
          <Route path="myfiles" element={<MyFiles />} /> {/* /home/myfiles */}
          <Route path="/home" element={<HomeContent />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
