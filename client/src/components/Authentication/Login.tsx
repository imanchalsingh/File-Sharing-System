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
      const response = await axios.post(
        "http://localhost:5000/api/auth/login",
        {
          email,
          password,
        }
      );

      localStorage.setItem("token", response.data.token);
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
    <div className="h-screen bg-cover bg-center flex justify-center items-center bg-gradient-to-r from-red-300 to-pink-50">
      <div className="h-[80%] w-[70%] bg-white flex justify-center items-center text-black shadow-[0_6px_15px_rgba(100,100,100,0.3)] rounded-2xl">
        <div className="h-full w-1/2 bg-white rounded-2xl flex flex-col justify-evenly items-center px-8 py-6 shadow-lg">
          <div className="text-center">
            <h1 className="text-4xl font-extrabold text-gray-800 mb-2">
              Welcome Back to{" "}
              <span className="text-red-600">ShareVault</span>
            </h1>
            <p className="text-gray-600 text-base">
              Where your files are safe and easy to share.
            </p>
          </div>
          <div className="text-center mt-4 space-y-2">
            <p className="text-gray-700 text-lg">
              Upload, store, and share your files with confidence.
            </p>
            <p className="text-gray-700 text-lg">
              Secure access. Easy sharing. All in one place.
            </p>
          </div>
          <div className="mt-6">
            <button
              className="px-6 py-2 rounded-full bg-red-600 hover:bg-red-700 text-white font-semibold transition duration-300 cursor-pointer"
              onClick={handleRegisterRedirect}
            >
              Get Started
            </button>
          </div>
        </div>

        <div className="h-[100%] w-[50%] bg-red-500 rounded-2xl shadow-[0_6px_15px_rgba(100,100,100,0.5)] flex justify-center flex-col items-center">
          <div className="w-[100%] flex justify-center flex-col items-center">
            <h1 className="text-4xl font-bold text-white m-2">Log In</h1>
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-[60%] border-2 border-white bg-transparent mt-3 text-white placeholder-white rounded-2xl p-2 focus:outline-none "
              autoComplete="username"
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-[60%] border-2 border-white bg-transparent mt-3 text-white placeholder-white rounded-2xl p-2 focus:outline-none"
              autoComplete="current-password"
            />
            <p className="text-white m-3">
              Don't have an account?{" "}
              <a
                onClick={handleRegisterRedirect}
                className="hover:font-bold cursor-pointer"
              >
                Sign Up
              </a>
            </p>
            <button
              className="border-2 border-white bg-transparent mt-8 text-white rounded-full px-8 py-2 hover:bg-white hover:text-red-500 transition-all cursor-pointer font-semibold"
              onClick={handleLogin}
              disabled={loading}
            >
              {loading ? "Logging In..." : "Log In"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
