import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const Register: React.FC = () => {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleLogin = () => {
    navigate("/login");
  };

  const handleRegister = async () => {
    setErrorMsg(null);

    // Basic validation
    if (!username || !email || !password) {
      setErrorMsg("All fields are required.");
      return;
    }

    setLoading(true);
    try {
      // 🔑 Backend ke sahi endpoint pe hit karo
      const res = await axios.post("https://file-sharing-system-tll7.onrender.com/", {
        username,
        email,
        password,
      });

      if (res.data) {
        alert("Registration successful! Please login.");
        navigate("/login");
      }
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        console.error("Registration error:", error.response);
        setErrorMsg(
          error.response?.data?.error ||
            error.response?.data?.message ||
            "Registration failed. Please check your details."
        );
      } else {
        setErrorMsg("Registration failed. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#e6ecff] to-[#f9f9ff] font-[Josefin Sans] p-4">
      <div className="w-full max-w-4xl bg-white/80 backdrop-blur-xl shadow-2xl rounded-2xl flex flex-col md:flex-row overflow-hidden">
        {/* Left Illustration */}
        <div className="hidden md:flex w-1/2 items-center justify-center p-6">
          <img
            src="https://media1.tenor.com/m/p0G_bmA2vSYAAAAd/login.gif"
            alt="illustration"
            // className="w-[80%] drop-shadow-2xl"
          />
        </div>

        {/* Right Form */}
        <div className="w-full md:w-1/2 flex flex-col justify-center p-8 md:p-12">
          <h1 className="text-3xl font-extrabold text-gray-800 mb-2">
            Create your account
          </h1>
          <p className="text-gray-500 mb-6">
            Sign up to get started with your journey
          </p>

          <div className="space-y-4">
            <input
              type="text"
              placeholder="Full Name"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-[#4a6bd1] focus:outline-none shadow-sm"
            />
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

          {errorMsg && <p className="text-red-500 text-sm mt-2">{errorMsg}</p>}

          <button
            onClick={handleRegister}
            disabled={loading}
            className="w-full mt-6 py-3 bg-[#4a6bd1] hover:bg-[#3158cd] text-white font-semibold rounded-xl shadow-lg transition-all disabled:opacity-50"
          >
            {loading ? "Signing Up..." : "Sign Up"}
          </button>

          <p className="text-center text-gray-600 text-sm mt-6">
            Already have an account?{" "}
            <span
              onClick={handleLogin}
              className="text-[#4a6bd1] hover:underline cursor-pointer font-medium"
            >
              Login
            </span>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
