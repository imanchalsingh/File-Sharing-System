import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const Login: React.FC = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleRegisterRedirect = () => {
    navigate("/register");
  };

  const handleLogin = async () => {
    setLoading(true);
    try {
      const response = await axios.post("https://file-sharing-system-tll7.onrender.com/login", {
        email,
        password,
      });

      localStorage.setItem("authToken", response.data.authToken);
      alert("Login successful!");
      navigate("/home");
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        alert(
          error.response?.data?.error ||
            "Login failed. Please check your credentials."
        );
      } else {
        alert("Login failed. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#e6ecff] to-[#f9f9ff] font-[Josefin Sans] p-4">
      <div className="w-full max-w-4xl bg-white/80 backdrop-blur-xl shadow-2xl rounded-2xl flex flex-col md:flex-row overflow-hidden">
        {/* Left Illustration */}
        <div className="hidden md:flex w-1/2  items-center justify-center ">
          <img
            src="https://hailbytes.com/wp-content/uploads/2020/07/Login.gif"
            alt="illustration"
            // className="w-[80%] drop-shadow-2xl"
          />
        </div>

        {/* Right Form */}
        <div className="w-full md:w-1/2 flex flex-col justify-center p-8 md:p-12">
          <h1 className="text-3xl font-extrabold text-gray-800 mb-2">
            Welcome Back
          </h1>
          <p className="text-gray-500 mb-6">Login to continue your journey</p>

          <div className="space-y-4">
            <input
              type="email"
              placeholder="Email Address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-[#4a6bd1] focus:outline-none shadow-sm"
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-[#4a6bd1] focus:outline-none shadow-sm"
            />
          </div>

          <button
            onClick={handleLogin}
            disabled={loading}
            className="w-full mt-6 py-3 bg-[#4a6bd1] hover:bg-[#3158cd] text-white font-semibold rounded-xl shadow-lg transition-all disabled:opacity-50"
          >
            {loading ? "Logging In..." : "Log In"}
          </button>

          <p className="text-center text-gray-600 text-sm mt-6">
            Don’t have an account?{" "}
            <span
              onClick={handleRegisterRedirect}
              className="text-[#4a6bd1] hover:underline cursor-pointer font-medium"
            >
              Register
            </span>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
