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
      await axios.post("http://localhost:5000/api/auth/register", {
        username,
        email,
        password,
      });
      alert("Registration successful! Please login.");
      navigate("/login");
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        // Log full error for debugging
        console.error("Registration error:", error.response);
        setErrorMsg(
          error.response?.data?.error ||
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
    <div className="h-screen bg-cover bg-center flex justify-center items-center bg-gradient-to-r  from-pink-50 to-red-300">
      <div className="h-[80%] w-[70%] bg-white flex justify-center items-center text-black shadow-[0_6px_15px_rgba(100,100,100,0.3)] rounded-2xl">
        <div className="h-full w-1/2 bg-white rounded-2xl flex flex-col justify-evenly items-center px-8 py-6 shadow-lg">
          <div className="text-center">
            <h1 className="text-4xl font-extrabold text-gray-800 mb-2">
              Welcome to <span className="text-red-600">ShareVault</span>
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
              onClick={() => navigate("/register")}
            >
              Get Started
            </button>
          </div>
        </div>

        <div className="h-[100%] w-[50%] bg-red-500 rounded-2xl shadow-[0_6px_15px_rgba(100,100,100,0.5)] flex justify-center flex-col items-center">
          <div className="w-[100%] flex justify-center flex-col items-center">
            <h1 className="text-4xl font-bold text-white m-2">
              Register Account
            </h1>
            <input
              type="text"
              placeholder="Name"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-[60%] border-2 border-white bg-transparent mt-5 text-white placeholder-white rounded-2xl p-2 focus:outline-none"
              autoComplete="username"
            />
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-[60%] border-2 border-white bg-transparent mt-3 text-white placeholder-white rounded-2xl p-2 focus:outline-none "
              autoComplete="email"
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-[60%] border-2 border-white bg-transparent mt-3 text-white placeholder-white rounded-2xl p-2 focus:outline-none"
              autoComplete="new-password"
            />
            {errorMsg && (
              <p className="text-red-400 text-sm mt-2">{errorMsg}</p>
            )}
            <p className="text-white m-3">
              Already have an account?{" "}
              <a
                onClick={handleLogin}
                className=" hover:font-bold cursor-pointer"
              >
                Login
              </a>
            </p>
            <button
              className=" border-2 border-white bg-transparent mt-8 text-white rounded-full px-8 py-2 hover:bg-white hover:text-red-500 transition-all cursor-pointer"
              onClick={handleRegister}
              disabled={loading}
            >
              {loading ? "Registering..." : "Sign Up"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
